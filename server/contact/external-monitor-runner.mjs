// One-shot server runner. No scheduler, automatic retries, or raw error logging.
import {execFile} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
import {createHash, X509Certificate} from 'node:crypto';
import {selectOperationalSignals} from './operational-signal-policy.mjs';

export async function runOperationalCheck({readSnapshot, sendPing, now = () => new Date()}) {
  let snapshot;
  try { snapshot = await readSnapshot(); }
  catch { return Object.freeze({retention: 'read_failed', cleanup: 'read_failed'}); }
  const result = {};
  for (const target of ['retention', 'cleanup']) {
    // Re-evaluate freshness after IO and before each independent transmission.
    if (!selectOperationalSignals(snapshot, now())[target]) {
      result[target] = 'no_fresh_success';
      continue;
    }
    try { result[target] = await sendPing(target) === true ? 'delivered' : 'delivery_failed'; }
    catch { result[target] = 'delivery_failed'; }
  }
  return Object.freeze(result);
}

export function validatePingUrl(value) {
  if (typeof value !== 'string' || !/^https:\/\/hc-ping\.com\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)) {
    throw Error('invalid_monitor_configuration');
  }
  return value;
}

export async function sendHealthcheck(value, fetcher = fetch) {
  const response = await fetcher(validatePingUrl(value), {
    method: 'GET', redirect: 'error', signal: AbortSignal.timeout(5000),
  });
  // Read no response body/headers, never echo endpoint or exception text.
  await response.body?.cancel();
  return response.status === 200;
}

function buildDatabaseConfig(environment, readCA, role) {
  // Copy only the explicit connection fields; inherited PGOPTIONS/services may
  // otherwise override the fixed role, TLS settings or one-shot transaction.
  const {PGHOST, PGPORT, PGUSER, PGPASSWORD, PGSSLROOTCERT} = environment;
  const direct = PGHOST === 'db.predaivzwllitlcnxbin.supabase.co' && PGUSER === role;
  const session = PGHOST === 'aws-0-ap-northeast-1.pooler.supabase.com' &&
    PGUSER === role+'.predaivzwllitlcnxbin';
  if ((!direct && !session) || PGPORT !== '5432' ||
      typeof PGPASSWORD !== 'string' || PGPASSWORD.length < 16 || !PGSSLROOTCERT) {
    throw Error('invalid_monitor_configuration');
  }
  try {
    const cert = new X509Certificate(readCA(PGSSLROOTCERT));
    if (createHash('sha256').update(cert.raw).digest('hex') !== '807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa') throw Error();
  } catch { throw Error('invalid_monitor_certificate'); }
  // No Healthchecks endpoints, GitHub tokens or ambient PG* reach psql.
  const allowed = new Set(['PATH','SYSTEMROOT','WINDIR','COMSPEC','HOME','USERPROFILE','APPDATA','LOCALAPPDATA','TMP','TEMP','LANG','LC_ALL']);
  const env = Object.fromEntries(Object.entries(environment).filter(([key]) => allowed.has(key.toUpperCase())));
  Object.assign(env, {PGHOST, PGPORT, PGUSER, PGPASSWORD, PGSSLROOTCERT,
    PGDATABASE: 'postgres', PGSSLMODE: 'verify-full', PGCONNECT_TIMEOUT: '5',
    PGGSSENCMODE: 'disable', PGAPPNAME: role==='offtracker_ops_tls_trial' ? 'offtracker-ops-tls-trial' : 'offtracker-ops-monitor', PGCLIENTENCODING: 'UTF8'});
  return Object.freeze(env);
}

export function buildMonitorDatabaseConfig(environment = process.env, readCA = readFileSync) {
  return buildDatabaseConfig(environment,readCA,'offtracker_ops_monitor');
}
export function buildMonitorTrialDatabaseConfig(environment = process.env, readCA = readFileSync) {
  return buildDatabaseConfig(environment,readCA,'offtracker_ops_tls_trial');
}

function readSnapshot(environment, trial) {
  let env;
  try { env = trial ? buildMonitorTrialDatabaseConfig(environment) : buildMonitorDatabaseConfig(environment); }
  catch (error) { return Promise.reject(error); }
  const sql = monitorReadSql(trial);
  return new Promise((resolve, reject) => {
    execFile('psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', sql],
      {env, timeout: 10000, maxBuffer: 8192, windowsHide: true}, (error, stdout) => {
        if (error) return reject(Error('monitor_read_failed'));
        try { resolve(JSON.parse(stdout)); }
        catch { reject(Error('invalid_monitor_snapshot')); }
      });
  });
}
export function monitorReadSql(trial = false) {
  const sql = readFileSync(new URL('./external-monitor-read.sql', import.meta.url),'utf8');
  const identity=trial?'offtracker_ops_tls_trial':'offtracker_ops_monitor';
  return sql.replace('begin read only;',`begin read only;
do $identity$ begin
 if session_user<>'${identity}' or current_user<>'${identity}'
   or current_database()<>'postgres'
   or not exists(select 1 from pg_catalog.pg_roles where rolname=current_user and rolcanlogin
      and not rolsuper and not rolinherit and not rolbypassrls and not rolcreatedb and not rolcreaterole
      and not rolreplication and rolconnlimit=${trial?1:2}
      and ${trial?"rolvaliduntil>statement_timestamp() and rolvaliduntil<=statement_timestamp()+interval '30 minutes'":"(rolvaliduntil is null or rolvaliduntil>statement_timestamp())"})
   or (select count(*) from pg_catalog.pg_auth_members where member=current_user::pg_catalog.regrole
      and roleid='offtracker_ops_reader'::pg_catalog.regrole and set_option and not inherit_option)<>1
   or exists(select 1 from pg_catalog.pg_auth_members where member=current_user::pg_catalog.regrole
      and roleid<>'offtracker_ops_reader'::pg_catalog.regrole)
   then raise exception 'monitor_tls_trial_identity_changed'; end if;
end; $identity$;
set local role offtracker_ops_reader;`);
}
export function readDatabaseSnapshot(environment = process.env) { return readSnapshot(environment,false); }
export function readTrialDatabaseSnapshot(environment = process.env) { return readSnapshot(environment,true); }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const endpoints = {
      retention: validatePingUrl(process.env.OFFTRACKER_RETENTION_PING_URL),
      cleanup: validatePingUrl(process.env.OFFTRACKER_CLEANUP_PING_URL),
    };
    const result = await runOperationalCheck({readSnapshot: () => readDatabaseSnapshot(),
      sendPing: target => sendHealthcheck(endpoints[target])});
    console.log(JSON.stringify(result));
    if (Object.values(result).some(value => value.endsWith('_failed'))) process.exitCode = 1;
  } catch {
    console.error('invalid_monitor_configuration');
    process.exitCode = 1;
  }
}
