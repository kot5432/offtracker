#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const defaultCasesPath = new URL('../docs/mock-sessions/purpose-classification-cases.json', import.meta.url);
const predictionsPath = process.argv[2];
const casesPath = process.argv[3] ? resolve(process.cwd(), process.argv[3]) : defaultCasesPath;

if (!predictionsPath) {
  console.error('Usage: node scripts/score-purpose-classification.mjs <predictions.json>');
  process.exit(2);
}

const casesDocument = JSON.parse(await readFile(casesPath, 'utf8'));
const resultDocument = JSON.parse(await readFile(predictionsPath, 'utf8'));
const categories = new Set(casesDocument.categories);
const confidenceLevels = new Set(['low', 'medium', 'high']);
const testCases = casesDocument.cases;
const predictions = resultDocument.predictions;
const minimumClearCorrect = casesDocument.acceptance?.clear_correct_min ?? Math.ceil(testCases.filter(item => item.expected_category !== 'ambiguous').length * 0.95);
const ambiguousMustAll = casesDocument.acceptance?.ambiguous_must_all ?? true;
const ambiguousConfidence = casesDocument.acceptance?.ambiguous_confidence;

if (!Array.isArray(predictions)) {
  throw new Error('predictions.json must contain a predictions array');
}

const grouped = new Map();
for (const prediction of predictions) {
  if (!prediction || typeof prediction.id !== 'string') {
    throw new Error('Each prediction must have a string id');
  }
  if (grouped.has(prediction.id)) {
    throw new Error(`Duplicate prediction id: ${prediction.id}`);
  }
  grouped.set(prediction.id, prediction);
}

const expectedIds = new Set(testCases.map(item => item.id));
const extraIds = [...grouped.keys()].filter(id => !expectedIds.has(id));
if (extraIds.length) throw new Error(`Unknown prediction ids: ${extraIds.join(', ')}`);

let clearTotal = 0;
let clearCorrect = 0;
let ambiguousTotal = 0;
let ambiguousCorrect = 0;
let invalidCount = 0;
let highConfidenceWrong = 0;
const rows = [];

for (const testCase of testCases) {
  const prediction = grouped.get(testCase.id);
  if (testCase.expected_category === 'ambiguous') ambiguousTotal += 1;
  else clearTotal += 1;

  const valid = prediction
    && categories.has(prediction.category)
    && confidenceLevels.has(prediction.confidence)
    && typeof prediction.ambiguous === 'boolean'
    && prediction.ambiguous === (prediction.category === 'ambiguous');
  const confidenceValid = !prediction
    || testCase.expected_category !== 'ambiguous'
    || !ambiguousConfidence
    || prediction.confidence === ambiguousConfidence;
  if (!valid || !confidenceValid) invalidCount += 1;

  const correct = valid && confidenceValid && prediction.category === testCase.expected_category;
  if (correct && testCase.expected_category === 'ambiguous') ambiguousCorrect += 1;
  if (correct && testCase.expected_category !== 'ambiguous') clearCorrect += 1;
  if (valid && !correct && prediction.confidence === 'high') highConfidenceWrong += 1;

  rows.push({
    id: testCase.id,
    expected: testCase.expected_category,
    actual: prediction?.category ?? 'MISSING',
    confidence: prediction?.confidence ?? '-',
    mark: !prediction ? 'MISSING' : !valid ? 'INVALID' : correct ? 'OK' : 'WRONG'
  });
}

for (const row of rows) {
  console.log(`${row.mark.padEnd(7)} ${row.id.padEnd(36)} expected=${row.expected.padEnd(10)} actual=${row.actual.padEnd(10)} confidence=${row.confidence}`);
}

const passed = clearCorrect >= minimumClearCorrect
  && (!ambiguousMustAll || ambiguousCorrect === ambiguousTotal)
  && invalidCount === 0
  && highConfidenceWrong === 0;

console.log('');
console.log(`Clear purpose: ${clearCorrect}/${clearTotal} (target at least ${minimumClearCorrect}/${clearTotal})`);
console.log(`Ambiguous purpose: ${ambiguousCorrect}/${ambiguousTotal} (target ${ambiguousMustAll ? `${ambiguousTotal}/${ambiguousTotal}` : 'not fixed'})`);
console.log(`Invalid, missing, or policy-violating outputs: ${invalidCount}`);
console.log(`High-confidence wrong classifications: ${highConfidenceWrong}`);
console.log(`Initial gate: ${passed ? 'PASS' : 'FAIL'}`);
process.exitCode = passed ? 0 : 1;
