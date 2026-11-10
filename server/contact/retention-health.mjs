// Pure server-side policy. These records must come from protected storage,
// never a submitted request. No timer, listener, database or logging here.
const MAX_AGE_MS = 2 * 60 * 60 * 1000;
const kinds = new Set(['redacted', 'previewed', 'stopped', 'unknown']);
function instant(value) {
  if (typeof value !== 'string') return NaN;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value ? time : NaN;
}

export function recordRetentionResult(previous, result, at) {
  if (!Number.isFinite(instant(at)) || !kinds.has(result?.kind) ||
      (['redacted', 'previewed'].includes(result.kind) &&
       (!Number.isInteger(result.count) || result.count < 0 || result.count > 100))) throw Error('invalid retention result');
  const previousSuccess = instant(previous?.lastSuccessAt);
  if (Number.isFinite(previousSuccess) && previousSuccess > instant(at)) throw Error('retention clock moved backwards');
  return Object.freeze({lastAttemptAt: at, lastKind: result.kind,
    lastSuccessAt: result.kind === 'redacted' ? at : (Number.isFinite(previousSuccess) ? previous.lastSuccessAt : null),
    count: ['redacted', 'previewed'].includes(result.kind) ? result.count : null});
}

export function evaluateRetentionHealth(record, now = new Date()) {
  const stopped = reason => Object.freeze({accepting: false, reason});
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return stopped('invalid_clock');
  if (!record || !kinds.has(record.lastKind)) return stopped('unverified');
  const success = instant(record.lastSuccessAt), attempted = instant(record.lastAttemptAt);
  if (!Number.isFinite(attempted) || attempted > now.getTime() ||
      (Number.isFinite(success) && (success > attempted || success > now.getTime()))) return stopped('invalid_record');
  if (record.lastKind !== 'redacted') return stopped('not_completed');
  if (!Number.isFinite(success) || success !== attempted || !Number.isInteger(record.count) || record.count < 0 || record.count > 100) return stopped('invalid_record');
  if (now.getTime() - success >= MAX_AGE_MS) return stopped('overdue');
  return Object.freeze({accepting: true, reason: 'verified'});
}
