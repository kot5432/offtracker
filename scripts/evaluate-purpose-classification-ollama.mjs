#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PURPOSE_CLASSIFICATION_PROMPT, PURPOSE_CLASSIFICATION_SCHEMA } from './purpose-classification-contract.mjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const model = process.argv[2] || 'qwen3:4b';
const casesPath = process.argv[3]
  ? resolve(process.cwd(), process.argv[3])
  : resolve(rootDir, 'docs/mock-sessions/purpose-classification-cases.json');
const promptVersion = 'purpose-classification-v6';
const outputDir = resolve(rootDir, 'docs/mock-sessions');
const timestamp = new Date().toISOString().replaceAll(':', '').replaceAll('.', '-');
const datasetId = basename(casesPath, '.json')
  .replace(/^purpose-classification-/, '')
  .replaceAll(/[^a-zA-Z0-9_-]/g, '-');
const outputPath = resolve(outputDir, `purpose-classification-${datasetId}-${model.replaceAll(/[^a-zA-Z0-9_-]/g, '-')}-${timestamp}.json`);
const apiBase = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

const casesDocument = JSON.parse(await readFile(casesPath, 'utf8'));
const modelResponse = await fetch(`${apiBase}/api/tags`, { signal: AbortSignal.timeout(5000) });
if (!modelResponse.ok) throw new Error(`Ollama model listing failed: HTTP ${modelResponse.status}`);
const installed = (await modelResponse.json()).models || [];
if (!installed.some(item => item.name === model)) {
  throw new Error(`Model ${model} is not installed. Installed models: ${installed.map(item => item.name).join(', ')}`);
}

const predictions = [];
for (const [index, item] of casesDocument.cases.entries()) {
  const startedAt = Date.now();
  const response = await fetch(`${apiBase}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(180000),
    body: JSON.stringify({
      model,
      system: PURPOSE_CLASSIFICATION_PROMPT,
      prompt: `目的文: ${item.purpose_text}`,
      format: PURPOSE_CLASSIFICATION_SCHEMA,
      stream: false,
      think: false,
      keep_alive: '1m',
      options: { temperature: 0, seed: 42, num_ctx: 2048, num_predict: 64 }
    })
  });

  if (!response.ok) throw new Error(`Ollama request failed for ${item.id}: HTTP ${response.status}`);
  const result = await response.json();
  let parsed;
  try {
    parsed = JSON.parse(result.response);
  } catch {
    parsed = { category: 'invalid', confidence: 'invalid', ambiguous: false };
  }

  predictions.push({
    id: item.id,
    category: parsed.category,
    confidence: parsed.confidence,
    ambiguous: parsed.ambiguous,
    elapsed_ms: Date.now() - startedAt,
    prompt_eval_count: result.prompt_eval_count,
    eval_count: result.eval_count,
    raw_response: result.response
  });
  console.log(`[${index + 1}/${casesDocument.cases.length}] ${item.id}: ${parsed.category} (${parsed.confidence})`);
}

const record = {
  provider: 'Ollama local',
  model,
  prompt_version: promptVersion,
  dataset: basename(casesPath),
  run: 1,
  timestamp: new Date().toISOString(),
  settings: { temperature: 0, seed: 42, num_ctx: 2048, num_predict: 64, schema_constrained: true },
  synthetic_data_only: true,
  predictions
};

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(record, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
console.log(`Saved ${basename(outputPath)}`);
