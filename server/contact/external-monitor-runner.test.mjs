import test from 'node:test';
import assert from 'node:assert/strict';
import {runOperationalCheck,validatePingUrl,sendHealthcheck,readDatabaseSnapshot,buildMonitorDatabaseConfig,buildMonitorTrialDatabaseConfig} from './external-monitor-runner.mjs';
import {fileURLToPath} from 'node:url';
const now = new Date('2026-11-10T01:10:00.000Z');
const snapshot = () => ({
  retention: {jobCount:1, enabled:true, definitionMatches:true, schedule:'7 * * * *',
    health:{lastKind:'redacted',count:0,lastAttemptAt:'2026-11-10T01:07:00.000Z',lastSuccessAt:'2026-11-10T01:07:00.000Z'}},
  cleanup:{jobCount:1,enabled:true,definitionMatches:true,schedule:'37 2 * * *',lastRunStatus:'succeeded',lastFinishedAt:'2026-11-10T01:08:00.000Z'},
});
const endpoint='https://hc-ping.com/00000000-0000-0000-0000-000000000000'; // synthetic; never fetched
test('read failure emits no ping or raw exception', async () => {
  const result = await runOperationalCheck({readSnapshot:async()=>{throw Error('private password')},sendPing:()=>assert.fail('must not send')});
  assert.deepEqual(result,{retention:'read_failed',cleanup:'read_failed'});
});
test('fresh zero-row successes send independently even after one delivery fails', async () => {
  const sent=[];
  const result=await runOperationalCheck({readSnapshot:async()=>snapshot(),now:()=>now,sendPing:async target=>{
    sent.push(target); if(target==='retention')throw Error('private endpoint');return true;
  }});
  assert.deepEqual(sent,['retention','cleanup']);
  assert.deepEqual(result,{retention:'delivery_failed',cleanup:'delivered'});
});
test('clock is checked again after waiting for the first transmission', async () => {
  let time=now;const sent=[];
  const result=await runOperationalCheck({readSnapshot:async()=>snapshot(),now:()=>time,sendPing:async target=>{
    sent.push(target);time=new Date('2026-11-10T01:18:00.000Z');return true;
  }});
  assert.deepEqual(sent,['retention']); assert.equal(result.cleanup,'no_fresh_success');
});
test('running cleanup and changed job never send', async () => {
  const data=snapshot();data.cleanup.lastRunStatus='running';data.retention.definitionMatches=false;
  assert.deepEqual(await runOperationalCheck({readSnapshot:async()=>data,now:()=>now,sendPing:()=>assert.fail('must not send')}),
    {retention:'no_fresh_success',cleanup:'no_fresh_success'});
});
test('only exact HTTPS UUID endpoints pass; no query/header/body/redirect/retry is added', async () => {
  for(const value of [endpoint+'?create=1',endpoint+'/start',endpoint.replace('https:','http:'),endpoint.replace('hc-ping.com','evil.invalid')]) assert.throws(()=>validatePingUrl(value),/invalid_monitor_configuration/);
  let calls=0;
  assert.equal(await sendHealthcheck(endpoint,async(url,options)=>{calls++;assert.equal(url,endpoint);
    assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(options.body,undefined);assert.equal(options.headers,undefined);
    return {status:200};}),true);
  assert.equal(calls,1);
  assert.equal(await sendHealthcheck(endpoint,async()=>({status:302})),false);
});
test('bad DB host/role configuration is refused before invoking a client', async () => {
  await assert.rejects(readDatabaseSnapshot({PGHOST:'evil.invalid',PGUSER:'postgres',PGPASSWORD:'synthetic'}),/invalid_monitor_configuration/);
});
function environment() {
  return {PGHOST:'aws-0-ap-northeast-1.pooler.supabase.com',PGPORT:'5432',
    PGUSER:'offtracker_ops_monitor.predaivzwllitlcnxbin',PGPASSWORD:'synthetic'.repeat(8),
    PGSSLROOTCERT:fileURLToPath(new URL('./certs/supabase-prod-ca-2021.crt',import.meta.url)),PATH:'synthetic-path'};
}
test('project, role, session port and CA are pinned before opening a client', () => {
  for(const changes of [{PGHOST:'db.other.supabase.co'},{PGUSER:'postgres.predaivzwllitlcnxbin'},
    {PGUSER:'offtracker_ops_monitor.other'},{PGUSER:'offtracker_ops_reader.predaivzwllitlcnxbin'},{PGPORT:'6543'},{PGPASSWORD:'short'}]) {
    assert.throws(()=>buildMonitorDatabaseConfig({...environment(),...changes}),/invalid_monitor_configuration/);
  }
  assert.throws(()=>buildMonitorDatabaseConfig(environment(),()=>Buffer.from('invalid CA')),/invalid_monitor_certificate/);
});
test('child environment keeps TLS checks and discards unrelated secrets and mixed-case PG overrides', () => {
  const config=buildMonitorDatabaseConfig({...environment(),PGSSLMODE:'disable',pgHostAddr:'evil.invalid',
    PGOPTIONS:'-c role=postgres',PGSERVICE:'other',GITHUB_TOKEN:'synthetic-token',OFFTRACKER_RETENTION_PING_URL:endpoint});
  assert.equal(config.PGSSLMODE,'verify-full'); assert.equal(config.PGGSSENCMODE,'disable');
  for(const key of ['pgHostAddr','PGOPTIONS','PGSERVICE','GITHUB_TOKEN','OFFTRACKER_RETENTION_PING_URL']) assert.equal(config[key],undefined);
  assert.equal(config.PGUSER,'offtracker_ops_monitor.predaivzwllitlcnxbin');
  assert.equal(Object.isFrozen(config),true);
});
test('temporary trial identity has a separate fixed connection configuration',()=>{
  const trial={...environment(),PGUSER:'offtracker_ops_tls_trial.predaivzwllitlcnxbin'};
  assert.throws(()=>buildMonitorDatabaseConfig(trial),/invalid_monitor_configuration/);
  assert.throws(()=>buildMonitorTrialDatabaseConfig(environment()),/invalid_monitor_configuration/);
  assert.equal(buildMonitorTrialDatabaseConfig(trial).PGAPPNAME,'offtracker-ops-tls-trial');
  assert.equal(buildMonitorTrialDatabaseConfig({...trial,PGPASSWORD:'s'.repeat(16)}).PGPASSWORD.length,16);
  assert.throws(()=>buildMonitorTrialDatabaseConfig({...trial,PGPASSWORD:'s'.repeat(15)}),/invalid_monitor_configuration/);
  assert.equal(buildMonitorDatabaseConfig({...environment(),PGPASSWORD:'s'.repeat(16)}).PGPASSWORD.length,16);
  assert.throws(()=>buildMonitorDatabaseConfig({...environment(),PGPASSWORD:'s'.repeat(15)}),/invalid_monitor_configuration/);
});
