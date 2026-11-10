import test from 'node:test';
import assert from 'node:assert/strict';
import {recordRetentionResult, evaluateRetentionHealth} from './retention-health.mjs';
const at='2026-11-09T00:00:00.000Z';
const success=()=>recordRetentionResult(null,{kind:'redacted',count:0},at);

test('zero expired rows is a successful execution, not a preview',()=>{
  assert.deepEqual(evaluateRetentionHealth(success(),new Date(at)),{accepting:true,reason:'verified'});
  assert.equal(evaluateRetentionHealth(recordRetentionResult(null,{kind:'previewed',count:0},at),new Date(at)).accepting,false);
});
test('latest preview, stop and failure preserve history but immediately close acceptance',()=>{
  for(const result of [{kind:'previewed',count:3},{kind:'stopped'},{kind:'unknown',message:'private',requestIds:['private']}]){
    const next=recordRetentionResult(success(),result,'2026-11-09T00:30:00.000Z');
    assert.equal(next.lastSuccessAt,at);
    assert.equal(evaluateRetentionHealth(next,new Date('2026-11-09T00:30:00Z')).accepting,false);
    assert.doesNotMatch(JSON.stringify(next),/private|requestIds|message/);
  }
});
test('two-hour boundary and missing heartbeat close acceptance without a separate timer',()=>{
  assert.equal(evaluateRetentionHealth(success(),new Date('2026-11-09T01:59:59.999Z')).accepting,true);
  assert.deepEqual(evaluateRetentionHealth(success(),new Date('2026-11-09T02:00:00.000Z')),{accepting:false,reason:'overdue'});
  assert.equal(evaluateRetentionHealth(null,new Date(at)).accepting,false);
});
test('future, inconsistent, invalid clocks and impossible counts cannot open acceptance',()=>{
  for(const record of [{...success(),lastAttemptAt:'2026-11-09T00:01:00.000Z'}, {...success(),lastSuccessAt:'bad'}, {...success(),count:101}]){
    assert.equal(evaluateRetentionHealth(record,new Date(at)).accepting,false);
  }
  assert.equal(evaluateRetentionHealth(success(),new Date(NaN)).accepting,false);
  assert.throws(()=>recordRetentionResult(success(),{kind:'redacted',count:0},'2026-11-08T00:00:00.000Z'));
});
