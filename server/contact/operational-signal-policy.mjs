// Protected server metadata only. No HTTP, secrets, recipients, timer or logging.
// A repeated old success must never masquerade as a new completed run.
import { evaluateRetentionHealth } from './retention-health.mjs';

const FRESH_MS = 10 * 60 * 1000;
function fresh(value, now) {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value &&
    time <= now.getTime() && now.getTime() - time < FRESH_MS;
}
function configured(job, schedule) {
  return job?.jobCount === 1 && job.enabled === true &&
    job.definitionMatches === true && job.schedule === schedule;
}

export function selectOperationalSignals(snapshot, now = new Date()) {
  const validClock = now instanceof Date && Number.isFinite(now.getTime());
  const retention = validClock && configured(snapshot?.retention, '7 * * * *') &&
    evaluateRetentionHealth(snapshot.retention.health, now).accepting &&
    fresh(snapshot.retention.health.lastSuccessAt, now);
  const cleanup = validClock && configured(snapshot?.cleanup, '37 2 * * *') &&
    snapshot.cleanup.lastRunStatus === 'succeeded' &&
    fresh(snapshot.cleanup.lastFinishedAt, now);
  // Only booleans and fixed keys leave this policy; never forward input objects.
  return Object.freeze({retention: Boolean(retention), cleanup: Boolean(cleanup)});
}
