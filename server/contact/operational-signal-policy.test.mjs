import test from 'node:test';
import assert from 'node:assert/strict';
import { selectOperationalSignals } from './operational-signal-policy.mjs';

const now = new Date('2026-11-09T01:10:00.000Z');
function snapshot() {
  return {
    retention: {jobCount: 1, enabled: true, definitionMatches: true, schedule: '7 * * * *',
      health: {lastKind: 'redacted', count: 0, lastAttemptAt: '2026-11-09T01:07:00.000Z',
        lastSuccessAt: '2026-11-09T01:07:00.000Z'}},
    cleanup: {jobCount: 1, enabled: true, definitionMatches: true, schedule: '37 2 * * *',
      lastRunStatus: 'succeeded', lastFinishedAt: '2026-11-09T01:08:00.000Z'},
  };
}
test('zero-row completed retention and completed cleanup can signal fresh success', () => {
  assert.deepEqual(selectOperationalSignals(snapshot(), now), {retention: true, cleanup: true});
});
test('a ten-minute-old success cannot repeatedly conceal a missed execution', () => {
  const input = snapshot();
  input.retention.health.lastAttemptAt = input.retention.health.lastSuccessAt = '2026-11-09T01:00:00.000Z';
  input.cleanup.lastFinishedAt = '2026-11-09T01:00:00.000Z';
  assert.deepEqual(selectOperationalSignals(input, now), {retention: false, cleanup: false});
});
test('missing, duplicated, disabled or changed jobs cannot signal success', () => {
  for (const changes of [{jobCount: 0}, {jobCount: 2}, {enabled: false},
    {definitionMatches: false}, {schedule: '* * * * *'}]) {
    const input = snapshot(); Object.assign(input.retention, changes); Object.assign(input.cleanup, changes);
    assert.deepEqual(selectOperationalSignals(input, now), {retention: false, cleanup: false});
  }
});
test('preview, failure, future timestamps and invalid clocks never signal completion', () => {
  for (const kind of ['previewed', 'unknown']) {
    const input = snapshot(); input.retention.health.lastKind = kind; input.cleanup.lastRunStatus = 'failed';
    assert.deepEqual(selectOperationalSignals(input, now), {retention: false, cleanup: false});
  }
  const input = snapshot();
  input.retention.health.lastAttemptAt = input.retention.health.lastSuccessAt = '2026-11-09T02:00:00.000Z';
  input.cleanup.lastFinishedAt = '2026-11-09T02:00:00.000Z';
  assert.deepEqual(selectOperationalSignals(input, now), {retention: false, cleanup: false});
  assert.deepEqual(selectOperationalSignals(snapshot(), new Date('invalid')), {retention: false, cleanup: false});
});
test('only fixed boolean signals leave the policy, even with extra sensitive fields', () => {
  const input = snapshot(); input.body = 'synthetic private body'; input.email = 'synthetic@example.invalid';
  input.retention.error = 'synthetic secret'; input.cleanup.command = 'synthetic URL';
  const result = selectOperationalSignals(input, now);
  assert.equal(JSON.stringify(result), '{"retention":true,"cleanup":true}');
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(selectOperationalSignals(null, now), {retention: false, cleanup: false});
});
