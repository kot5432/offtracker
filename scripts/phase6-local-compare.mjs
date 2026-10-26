#!/usr/bin/env node

// Compares a local Ollama model using only the synthetic Phase 6 scenarios.
// Network access is restricted to the local Ollama endpoint.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const model = process.argv[2] || 'qwen3:4b';
const outputPath = path.resolve(
  projectRoot,
  process.argv[3] || 'docs/mock-sessions/phase-6-local-evaluation-4b.json',
);
const ollamaBaseUrl = 'http://127.0.0.1:11434';
const settings = {
  num_ctx: 4096,
  num_predict: 512,
  temperature: 0,
  seed: 42,
};

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['hypotheses', 'coverage_message'],
  properties: {
    hypotheses: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'description', 'evidence', 'confidence'],
        properties: {
          title: { type: 'string', maxLength: 120 },
          description: { type: 'string', maxLength: 600 },
          evidence: {
            type: 'array',
            minItems: 1,
            maxItems: 8,
            items: { type: 'string', pattern: '^(activity:[0-9]+|result)$' },
          },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
    },
    coverage_message: { type: ['string', 'null'], maxLength: 240 },
  },
};

const evaluationDoc = await readFile(
  path.join(projectRoot, 'docs/PHASE_6_PROVIDER_EVALUATION.md'),
  'utf8',
);
const promptSection = evaluationDoc.split('## 共通プロンプト')[1];
const promptMatch = promptSection?.match(/```text\r?\n([\s\S]*?)\r?\n```/);
if (!promptMatch) throw new Error('共通プロンプトが文書から取得できません。');
const promptTemplate = promptMatch[1];

const mockData = JSON.parse(await readFile(
  path.join(projectRoot, 'docs/mock-sessions/phase-6-hypotheses.json'),
  'utf8',
));
if (mockData.is_mock !== true || !Array.isArray(mockData.scenarios)) {
  throw new Error('疑似データの形式を確認できません。');
}
if (mockData.scenarios.length !== 3) {
  throw new Error(`基本シナリオは3件の想定ですが、${mockData.scenarios.length}件です。`);
}

const outputExists = await readFile(outputPath).then(() => true, () => false);
if (outputExists) {
  throw new Error(`出力先が既にあります。別の出力先を指定してください: ${outputPath}`);
}

const tagsResponse = await fetch(`${ollamaBaseUrl}/api/tags`);
if (!tagsResponse.ok) throw new Error(`Ollama接続に失敗しました (${tagsResponse.status})`);
const tags = await tagsResponse.json();
const modelMetadata = tags.models?.find((item) => item.name === model || item.model === model);
if (!modelMetadata) {
  throw new Error(`モデル ${model} が見つかりません。先にOllamaでモデルを取得してください。`);
}

function validateRecordedOutput(response, input, scenarioId) {
  const issues = [];
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return ['response_not_object'];
  }

  const topKeys = Object.keys(response).sort().join(',');
  if (topKeys !== 'coverage_message,hypotheses') issues.push('unexpected_or_missing_top_level_fields');
  if (!Array.isArray(response.hypotheses)) return [...issues, 'hypotheses_not_array'];
  if (response.hypotheses.length > 3) issues.push('too_many_hypotheses');

  const titles = new Set();
  for (const hypothesis of response.hypotheses) {
    if (!hypothesis || typeof hypothesis !== 'object' || Array.isArray(hypothesis)) {
      issues.push('hypothesis_not_object');
      continue;
    }
    const title = typeof hypothesis.title === 'string' ? hypothesis.title.trim() : '';
    const description = typeof hypothesis.description === 'string' ? hypothesis.description : '';
    if (!title || !description.trim() || !Array.isArray(hypothesis.evidence) || !hypothesis.evidence.length) {
      issues.push('missing_candidate_content');
    }
    if ([...title].length > 120 || [...description].length > 600) issues.push('candidate_text_too_long');
    if (!['low', 'medium', 'high'].includes(hypothesis.confidence)) issues.push('invalid_confidence');

    const normalizedTitle = title.toLocaleLowerCase('ja-JP').replace(/\s+/g, ' ');
    if (titles.has(normalizedTitle)) issues.push('duplicate_title');
    titles.add(normalizedTitle);

    const refs = new Set();
    for (const ref of hypothesis.evidence || []) {
      const match = typeof ref === 'string' ? /^activity:(\d+)$/.exec(ref) : null;
      const exists = match
        ? Number(match[1]) < input.activities.length
        : ref === 'result' && input.result !== null;
      if (!exists) issues.push('invalid_evidence_reference');
      if (refs.has(ref)) issues.push('duplicate_evidence_reference');
      refs.add(ref);
    }

    const candidateKeys = Object.keys(hypothesis).sort().join(',');
    if (candidateKeys !== 'confidence,description,evidence,title') issues.push('unexpected_or_missing_candidate_fields');
  }

  if (response.hypotheses.length < 3
    && (typeof response.coverage_message !== 'string' || !response.coverage_message.trim())) {
    issues.push('missing_coverage_message');
  }
  if (response.coverage_message !== null && typeof response.coverage_message === 'string'
    && [...response.coverage_message].length > 240) {
    issues.push('coverage_message_too_long');
  }
  if (response.hypotheses.length === 3 && response.coverage_message !== null) {
    issues.push('unexpected_coverage_message');
  }

  if (scenarioId === 'mixed-activities' && response.hypotheses.length > 2) {
    issues.push('mixed_activities_more_than_two_candidates');
  }
  if (scenarioId === 'short-completed' && response.hypotheses.length > 0) {
    issues.push('completed_related_case_should_have_no_candidates');
  }
  if (scenarioId === 'uncertain-short-partial' && response.hypotheses.length > 0) {
    issues.push('all_uncertain_partial_case_should_have_no_candidates');
  }

  return [...new Set(issues)];
}

const schemaHash = createHash('sha256').update(JSON.stringify(responseSchema)).digest('hex');
const records = [];
for (const scenario of mockData.scenarios) {
  const prompt = promptTemplate.replace('<INPUT_JSON>', JSON.stringify(scenario.input, null, 2));
  const startedAt = new Date();
  const started = performance.now();
  const freeMemoryBeforeBytes = os.freemem();
  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      format: responseSchema,
      options: settings,
      think: false,
      stream: false,
      keep_alive: 0,
    }),
  });
  const elapsedSeconds = (performance.now() - started) / 1000;
  if (!response.ok) throw new Error(`${scenario.id}の推論に失敗しました (${response.status})`);
  const result = await response.json();
  const rawOutput = result.message?.content ?? '';
  let parsed;
  let parseError = null;
  try {
    parsed = JSON.parse(rawOutput);
  } catch (error) {
    parseError = String(error);
  }

  records.push({
    model,
    model_metadata: {
      digest: modelMetadata.digest ?? null,
      size_bytes: modelMetadata.size ?? null,
      details: modelMetadata.details ?? null,
    },
    scenario_id: scenario.id,
    timestamp_utc: startedAt.toISOString(),
    format: 'json_schema_simple_evidence_refs',
    prompt_sha256: createHash('sha256').update(prompt).digest('hex'),
    schema_sha256: schemaHash,
    host: {
      platform: process.platform,
      architecture: process.arch,
      node_version: process.versions.node,
      total_memory_gib: Number((os.totalmem() / 1024 ** 3).toFixed(2)),
      free_memory_before_gib: Number((freeMemoryBeforeBytes / 1024 ** 3).toFixed(2)),
    },
    settings: { ...settings, think: false },
    metrics: {
      prompt_tokens: result.prompt_eval_count ?? null,
      output_tokens: result.eval_count ?? null,
      total_seconds: Number((result.total_duration != null
        ? result.total_duration / 1e9
        : elapsedSeconds).toFixed(3)),
      output_tokens_per_second: result.eval_count != null && result.eval_duration > 0
        ? Number((result.eval_count / (result.eval_duration / 1e9)).toFixed(2))
        : null,
    },
    parse_ok: parseError === null,
    structural_issues: parseError ? ['json_parse_error'] : validateRecordedOutput(parsed, scenario.input, scenario.id),
    parse_error: parseError,
    response: rawOutput,
  });
  process.stdout.write(`${model} / ${scenario.id}: ${records.at(-1).metrics.total_seconds}s, issues=${records.at(-1).structural_issues.join('|') || 'none'}\n`);
}

await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, { flag: 'wx' });
process.stdout.write(`結果を保存しました: ${outputPath}\n`);
