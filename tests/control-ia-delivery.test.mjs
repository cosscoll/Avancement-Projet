import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectDelivery,calculateDelivery,readTracker} from '../scripts/control-ia-readiness.mjs';

const clone=value=>structuredClone(value);
const source=readFileSync('data/control-ia-delivery.json','utf8');
const data=JSON.parse(source);

test('CONTROL IA has one explicit functional focus with verifiable acceptance criteria',()=>{
 assert.deepEqual(inspectDelivery(data),[]);
 assert.equal(data.work_in_progress_limit,1);
 assert.ok(data.capabilities.length>=9);
 assert.ok(data.capabilities.some(x=>x.id===data.focus_id&&x.priority==='P0'));
 const summary=calculateDelivery(data);
 assert.equal(summary.total,data.capabilities.length);
 assert.equal(summary.totalCriteria,data.capabilities.reduce((a,c)=>a+c.acceptance.length,0));
 assert.equal(summary.operational,data.capabilities.filter(c=>c.stage==='operational').length);
 assert.equal(readTracker().focus_id,data.focus_id);
});
test('front-end status uses verified evidence rather than code commits',()=>{
 const ui=readFileSync('assets/control-delivery.js','utf8');
 const local=readFileSync('assets/local-ai.js','utf8');
 const html=readFileSync('index.html','utf8');
 const sw=readFileSync('service-worker.js','utf8');
 assert.match(ui,/operational/);
 assert.match(ui,/c\.verified/);
 assert.match(ui,/textContent/);
 assert.doesNotMatch(ui,/\\.innerHTML\s*=/);
 assert.match(ui,/credentials:'omit'/);
 assert.match(ui,/Suivi public et déclaratif/);
 assert.match(local,/CONTROL_DELIVERY\?\.mount\(root\)/);
 assert.match(html,/assets\/control-delivery\.js/);
 assert.match(html,/assets\/control-delivery\.css/);
 assert.match(sw,/assets\/control-delivery\.js/);
 assert.match(sw,/assets\/control-delivery\.css/);
 assert.match(sw,/data\/control-ia-delivery\.json/);
});
test('an operational claim without complete independent evidence is rejected',()=>{
 const value=clone(data);
 const item=value.capabilities.find(c=>c.id==='CONTROL-ACTIONS');
 item.stage='operational';
 item.blockers=[];
 assert.match(inspectDelivery(value).join(' '),/operational.*missing verified criteria/);
});
test('an operational claim with unverified dependencies or missing proof is rejected',()=>{
 const value=clone(data);
 const item=value.capabilities.find(c=>c.id==='CONTROL-CONNECTORS');
 item.stage='operational';
 item.blockers=[];
 item.evidence.ci_url='https://github.com/example/action';
 item.evidence.deployment_url='https://example.com/app';
 item.evidence.journey_url='https://example.com/real-test';
 for(const a of item.acceptance){a.verified=true;a.evidence=['https://example.com/proof']}
 const errors=inspectDelivery(value);
 assert.ok(errors.some(e=>e.includes('operational before dependency CONTROL-ACCOUNT')));
});
test('a deployed stage must have a deployment link; a user-verified stage must have real journey proof',()=>{
 const value=clone(data),item=value.capabilities.find(c=>c.id==='CONTROL-ASSISTANT');
 item.stage='deployed';
 item.evidence.deployment_url=null;
 assert.match(inspectDelivery(value).join(' '),/published stage without deployment evidence/);
 item.stage='user_verified';
 item.evidence.deployment_url='https://example.com/app';
 assert.match(inspectDelivery(value).join(' '),/user-verified stage without real journey evidence/);
});
test('acceptance cannot be marked verified without a proof link',()=>{
 const value=clone(data),a=value.capabilities[0].acceptance[0];
 a.verified=true;
 assert.match(inspectDelivery(value).join(' '),/has no valid proof URL/);
 a.verified=false;
 a.evidence=['https://example.com/proof'];
 assert.match(inspectDelivery(value).join(' '),/unverified criterion.*claims evidence/);
});
test('duplicate, unknown and cyclic dependencies fail safely',()=>{
 const duplicate=clone(data);
 duplicate.capabilities.push(clone(duplicate.capabilities[0]));
 assert.match(inspectDelivery(duplicate).join(' '),/Duplicate capability/);
 const unknown=clone(data);unknown.capabilities[0].depends_on=['CONTROL-NONEXISTENT'];
 assert.match(inspectDelivery(unknown).join(' '),/unknown dependency/);
 const cycle=clone(data);
 cycle.capabilities.find(c=>c.id==='CONTROL-ACCOUNT').depends_on=['CONTROL-CONNECTORS'];
 assert.match(inspectDelivery(cycle).join(' '),/Dependency cycle/);
});
test('Cloud stays disabled while identity and user isolation remain unverified',()=>{
 const config=JSON.parse(readFileSync('config/cloud.json','utf8'));
 const identity=data.capabilities.find(x=>x.id==='CONTROL-ACCOUNT');
 if(identity.stage!=='operational')assert.equal(config.enabled,false);
});


test('Cloud is not mistaken for authenticated accounts while disabled',()=>{
 const cfg=JSON.parse(readFileSync('config/cloud.json','utf8'));
 const tracker=readTracker();
 const account=tracker.capabilities.find(c=>c.id==='CONTROL-ACCOUNT');
 assert.ok(account);
 if(cfg.enabled!==true){
   assert.notEqual(account.stage,'operational');
   for(const criterion of account.acceptance){
     assert.equal(criterion.verified,false,'No real Supabase Auth user test while Cloud is disabled: '+criterion.id);
   }
 }
 // The PostgreSQL CI tests real policies with MOCK auth.uid() and cannot
 // independently prove real Supabase/JWT A/B, OAuth or multi-device sessions.
 assert.ok(account.evidence.ci_url?.includes('/actions/runs/'));
});
