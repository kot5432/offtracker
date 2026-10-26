#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PURPOSE_CLASSIFICATION_PROMPT, PURPOSE_CLASSIFICATION_SCHEMA } from './purpose-classification-contract.mjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const model = process.argv[2] || '@cf/qwen/qwen3-30b-a3b-fp8';
const casesPath = process.argv[3]
  ? resolve(process.cwd(), process.argv[3])
  : resolve(rootDir, 'docs/mock-sessions/purpose-classification-rubric-v2-cases.json');
const allowedModels = new Set([
  '@cf/qwen/qwen3-30b-a3b-fp8',
  '@cf/openai/gpt-oss-20b'
]);
const isGptOss = model === '@cf/openai/gpt-oss-20b';
const evaluationSettings = isGptOss
  ? { api_format: 'responses', reasoning_effort: 'low', max_output_tokens: 512, response_schema_validated_locally: true }
  : { api_format: 'chat', temperature: 0, max_tokens: 120, chat_template_kwargs: { enable_thinking: false }, response_schema_validated_locally: true };
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

if (!allowedModels.has(model)) {
  throw new Error(`Model is not in the evaluation allowlist: ${model}`);
}
if (!accountId || !apiToken) {
  throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in the local environment. Do not put credentials in files or chat.');
}

const casesDocument = JSON.parse(await readFile(casesPath, 'utf8'));
const maxCases = process.argv[4] ? Number.parseInt(process.argv[4], 10) : 0;
if (process.argv[4] && (!Number.isInteger(maxCases) || maxCases < 0)) {
  throw new Error('MaxCases must be zero or a positive integer.');
}
const evaluationCases = maxCases > 0 ? casesDocument.cases.slice(0, maxCases) : casesDocument.cases;
const resumePath = process.argv[5] ? resolve(process.cwd(), process.argv[5]) : null;
let resumedRecord = null;
if (resumePath) {
  resumedRecord = JSON.parse(await readFile(resumePath, 'utf8'));
  if (
    resumedRecord.model !== model
    || resumedRecord.dataset !== basename(casesPath)
    || JSON.stringify(resumedRecord.settings) !== JSON.stringify(evaluationSettings)
  ) {
    throw new Error('Resume file must use the same model, dataset, and generation settings as this evaluation.');
  }
}
const predictions = [...(resumedRecord?.predictions ?? [])];
const resumedDiagnostic = resumedRecord?.diagnostic;
if (
  resumedDiagnostic?.kind === 'missing_model_response'
  && resumedDiagnostic.case_id
  && !predictions.some((prediction) => prediction.id === resumedDiagnostic.case_id)
) {
  predictions.push({
    id: resumedDiagnostic.case_id,
    category: 'invalid',
    confidence: 'invalid',
    ambiguous: false,
    elapsed_ms: null,
    usage: resumedDiagnostic.usage,
    raw_response: null,
    error: { kind: 'empty_model_response', attempts: resumedDiagnostic.attempt ?? 1 }
  });
}
const completedIds = new Set(predictions.map((prediction) => prediction.id));
const timestamp = new Date().toISOString().replaceAll(':', '').replaceAll('.', '-');
const modelSlug = model.replaceAll(/[^a-zA-Z0-9_-]/g, '-');
const datasetSlug = basename(casesPath, '.json').replaceAll(/[^a-zA-Z0-9_-]/g, '-');
const outputPath = resolve(rootDir, 'docs/mock-sessions', `purpose-classification-cloudflare-${datasetSlug}-${modelSlug}-${timestamp}.json`);
await mkdir(dirname(outputPath), { recursive: true });

let diagnostic = null;

function makeRecord(status) {
  return {
    provider: 'Cloudflare Workers AI REST API',
    model,
    prompt_version: 'purpose-classification-v6',
    dataset: basename(casesPath),
    evaluated_case_count: evaluationCases.length,
    run_status: status,
    timestamp: new Date().toISOString(),
    ...(resumePath ? { resumed_from: basename(resumePath) } : {}),
    settings: evaluationSettings,
    synthetic_data_only: true,
    ...(diagnostic ? { diagnostic } : {}),
    predictions
  };
}

async function saveProgress(status) {
  await writeFile(outputPath, `${JSON.stringify(makeRecord(status), null, 2)}\n`, 'utf8');
}

function parseClassification(rawResponse) {
  if (rawResponse && typeof rawResponse === 'object' && !Array.isArray(rawResponse)) return rawResponse;
  if (typeof rawResponse !== 'string') return { category: 'invalid', confidence: 'invalid', ambiguous: false };

  const text = rawResponse.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const candidates = [text];
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(text.slice(firstBrace, lastBrace + 1));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // Try the next candidate; the scorer will reject non-object or malformed output.
    }
  }
  return { category: 'invalid', confidence: 'invalid', ambiguous: false };
}

caseLoop: for (const [index, item] of evaluationCases.entries()) {
  if (completedIds.has(item.id)) continue;
  const startedAt = Date.now();
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model.split('/').map(encodeURIComponent).join('/')}`;
  let result;
  let rawResponse;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify(isGptOss
        ? {
            instructions: `${PURPOSE_CLASSIFICATION_PROMPT}\n\n出力は次のJSON Schemaに合うJSONオブジェクトだけにしてください: ${JSON.stringify(PURPOSE_CLASSIFICATION_SCHEMA)}`,
            input: `目的文: ${item.purpose_text}`,
            reasoning: { effort: 'low' },
            max_output_tokens: 512
          }
        : {
            messages: [
              { role: 'system', content: `${PURPOSE_CLASSIFICATION_PROMPT}\n\n出力は次のJSON Schemaに合うJSONオブジェクトだけにしてください: ${JSON.stringify(PURPOSE_CLASSIFICATION_SCHEMA)}` },
              { role: 'user', content: `目的文: ${item.purpose_text}` }
            ],
            temperature: 0,
            max_tokens: 120,
            chat_template_kwargs: { enable_thinking: false }
          })
    });

    if (!response.ok) {
      await saveProgress('failed');
      throw new Error(`Cloudflare request failed for ${item.id}: HTTP ${response.status}. Partial results were saved to ${basename(outputPath)}. Response body and credentials were not printed.`);
    }
    result = await response.json();
    const modelResult = result?.result;
    const assistantOutputParts = Array.isArray(modelResult?.output)
      ? modelResult.output
        .filter((part) => part?.type === 'message' && part?.role === 'assistant')
        .flatMap((part) => Array.isArray(part?.content) ? part.content : [])
        .filter((part) => part?.type === 'output_text' && typeof part.text === 'string')
      : [];
    const responseOutputText = assistantOutputParts.map((part) => part.text).join('\n') || undefined;
    rawResponse = modelResult?.output_text
      ?? responseOutputText
      ?? modelResult?.response
      ?? modelResult?.choices?.[0]?.message?.content
      ?? modelResult?.choices?.[0]?.text
      ?? result?.choices?.[0]?.message?.content;
    if (rawResponse != null) break;

    const firstChoice = modelResult?.choices?.[0];
    const firstMessage = firstChoice?.message;
    diagnostic = {
      kind: 'missing_model_response',
      case_id: item.id,
      attempt,
      result_type: modelResult === null ? 'null' : Array.isArray(modelResult) ? 'array' : typeof modelResult,
      result_keys: modelResult && typeof modelResult === 'object' ? Object.keys(modelResult) : [],
      output_count: Array.isArray(modelResult?.output) ? modelResult.output.length : null,
      output_item_types: Array.isArray(modelResult?.output) ? modelResult.output.map((part) => part?.type ?? 'unknown') : [],
      assistant_content_types: Array.isArray(modelResult?.output)
        ? modelResult.output
          .filter((part) => part?.type === 'message' && part?.role === 'assistant')
          .flatMap((part) => Array.isArray(part?.content) ? part.content : [])
          .map((part) => part?.type ?? 'unknown')
        : [],
      output_text_type: modelResult?.output_text === null ? 'null' : typeof modelResult?.output_text,
      result_response_type: modelResult?.response === null ? 'null' : typeof modelResult?.response,
      choices_count: Array.isArray(modelResult?.choices) ? modelResult.choices.length : null,
      first_choice_keys: firstChoice && typeof firstChoice === 'object' ? Object.keys(firstChoice) : [],
      first_choice_text_type: firstChoice?.text === null ? 'null' : typeof firstChoice?.text,
      first_message_keys: firstMessage && typeof firstMessage === 'object' ? Object.keys(firstMessage) : [],
      first_message_content_type: firstMessage?.content === null ? 'null' : typeof firstMessage?.content,
      first_message_tool_calls_count: Array.isArray(firstMessage?.tool_calls) ? firstMessage.tool_calls.length : null,
      usage: modelResult?.usage,
      api_success: typeof result?.success === 'boolean' ? result.success : null,
      error_codes: Array.isArray(result?.errors) ? result.errors.map((error) => error?.code).filter((code) => code !== undefined) : []
    };
    if (attempt < 2) {
      console.warn(`[${item.id}] Empty model response; retrying this case once.`);
      continue;
    }
    predictions.push({
      id: item.id,
      category: 'invalid',
      confidence: 'invalid',
      ambiguous: false,
      elapsed_ms: Date.now() - startedAt,
      usage: result?.result?.usage,
      raw_response: null,
      error: { kind: 'empty_model_response', attempts: attempt }
    });
    completedIds.add(item.id);
    console.warn(`[${index + 1}/${evaluationCases.length}] ${item.id}: invalid (empty model response after retry); continuing.`);
    diagnostic = null;
    await saveProgress('in_progress');
    continue caseLoop;
  }
  diagnostic = null;
  const parsed = parseClassification(rawResponse);

  predictions.push({
    id: item.id,
    category: parsed.category,
    confidence: parsed.confidence,
    ambiguous: parsed.ambiguous,
    elapsed_ms: Date.now() - startedAt,
    usage: result?.result?.usage,
    raw_response: rawResponse
  });
  completedIds.add(item.id);
  console.log(`[${index + 1}/${evaluationCases.length}] ${item.id}: ${parsed.category} (${parsed.confidence})`);
  await saveProgress('in_progress');
}

await saveProgress('complete');
console.log(`Saved ${basename(outputPath)}`);
