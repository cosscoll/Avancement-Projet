import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateRegistry,summary} from '../scripts/control-ia-requirements.mjs';
const read=(file)=>JSON.parse(readFileSync(file,'utf8'));
const registry=read('data/control-ia-requirements.json');
const legacy=read('data/control-ia-delivery.json');
const strategy=read('data/control-ia-strategy.json');
const copy=()=>structuredClone(registry);

test('V1.2 maps exactly 22 development tickets, 42 distinct acceptance tests and ten improvements',()=>{
 assert.deepEqual(validateRegistry(registry,legacy,strategy),[]);
 const stats=summary(registry,legacy,strategy);
 assert.deepEqual([stats.backlog_total,stats.scenarios_total,stats.improvements_total,stats.improvement_criteria_total,stats.legacy_criteria_total],[22,42,10,30,36]);
});
test('all 42 scenarios are linked bidirectionally to a real development ticket',()=>{
 for(const s of registry.scenarios){
  assert.ok(s.linked_backlog.length,s.id);
  for(const ticket of s.linked_backlog){
   assert.ok(registry.tickets.find(t=>t.id===ticket)?.acceptance_scenarios.includes(s.id));
  }
 }
});
test('explicitly distinguishes mocked tests from fully verified user journeys',()=>{
 const stats=summary(registry,legacy,strategy);
 assert.equal(stats.scenarios_verified,0);
 assert.equal(stats.scenarios_partial_mock,4);
 assert.equal(stats.backlog_verified,0);
 assert.equal(stats.improvement_criteria_verified,0);
 assert.equal(stats.legacy_criteria_verified,3);
 assert.equal(stats.legacy_capabilities_operational,0);
});
test('regression: BACK-023 cannot be silently added as nonexistent ticket',()=>{
 const obj=copy();obj.tickets.push({...obj.tickets[0],id:'BACK-023'});
 assert.match(validateRegistry(obj,legacy,strategy).join('|'),/BACK-001\.\.BACK-022/);
});
test('regression: missing or wrong scenario link breaks delivery integrity',()=>{
 const obj=copy();obj.scenarios[0].linked_backlog=['BACK-022'];
 assert.match(validateRegistry(obj,legacy,strategy).join('|'),/backlinks/);
});
test('regression: simulated PostgreSQL RLS cannot certify a real Supabase account',()=>{
 const obj=copy();const x=obj.scenarios.find(s=>s.id==='T-15');
 x.verification='real_verified';
 assert.match(validateRegistry(obj,legacy,strategy).join('|'),/real verification requires journey/);
});
test('regression: development ticket cannot be verified before its scenarios pass',()=>{
 const obj=copy(),x=obj.tickets.find(s=>s.id==='BACK-004');
 x.stage='real_verified';x.evidence_urls=['https://example.org/smoke'];
 assert.match(validateRegistry(obj,legacy,strategy).join('|'),/references unverified/);
});
test('regression: authentic journey evidence requires SHA and date',()=>{
 const obj=copy(),x=obj.scenarios.find(s=>s.id==='T-18');
 x.verification='real_verified';x.evidence=[{type:'real_journey',url:'https://example.org/real',scope:'Android physical device'}];
 assert.match(validateRegistry(obj,legacy,strategy).join('|'),/source SHA and timestamp/);
});
test('regression: empty evidence cannot count as partial simulation',()=>{
 const obj=copy(),x=obj.scenarios.find(s=>s.id==='T-05');
 x.evidence=[];
 assert.match(validateRegistry(obj,legacy,strategy).join('|'),/mock\/simulated evidence missing/);
});
test('regression: changing the 30 enhancement criteria is detected',()=>{
 const s=structuredClone(strategy);
 s.improvements[0].acceptance.pop();
 assert.match(validateRegistry(registry,legacy,s).join('|'),/three links/);
});
test('public registry cannot silently include confidential descriptions',()=>{
 const obj=copy();obj.tickets[0].private_description='private spec must not be copied to GitHub';
 assert.match(validateRegistry(obj,legacy,strategy).join('|'),/possible private/);
});
test('regression: existing legacy progress and primary account focus are preserved',()=>{
 const obj=copy();obj.primary_focus='CONTROL-AGENTS';obj.counts.legacy_criteria=37;
 const errors=validateRegistry(obj,legacy,strategy).join('|');
 assert.match(errors,/Inconsistent main capability focus/);
 assert.match(errors,/Incorrect declared count legacy_criteria/);
});
