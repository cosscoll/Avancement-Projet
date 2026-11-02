import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const doc=JSON.parse(readFileSync(new URL('../data/control-ia-scope-extensions.json',import.meta.url),'utf8'));
const original=JSON.parse(readFileSync(new URL('../data/control-ia-requirements.json',import.meta.url),'utf8'));
const delivery=JSON.parse(readFileSync(new URL('../data/control-ia-delivery.json',import.meta.url),'utf8'));
const index=readFileSync(new URL('../docs/CONTROL_IA_CAHIER_V1_2_SUIVI.md',import.meta.url),'utf8');

test('the private V1.2 specification is extended by two public-redacted, non-operational scopes',()=>{
 assert.equal(doc.schema_version,1);
 assert.equal(doc.parent_specification,'1.2');
 assert.equal(doc.document_class,'public_redacted_tracking');
 assert.equal(doc.private_specification,original.private_source);
 assert.deepEqual(doc.scopes.map(x=>x.id),['EXT-IA-001','EXT-AGT-001']);
 assert.ok(doc.scopes.every(x=>x.stage==='in_code'));
 assert.ok(doc.scopes.every(x=>x.verified_criteria.length===0&&x.evidence_urls.every(url=>/^https:\/\/github\.com\//.test(url))));
 assert.match(index,/EXT-IA-001/);
 assert.match(index,/EXT-AGT-001/);
 assert.match(index,/annexe C/i);
});

test('each extension has five uniquely identified acceptance gates and real prerequisites',()=>{
 const ids=new Set(delivery.capabilities.map(c=>c.id));
 for(const [i,scope] of doc.scopes.entries()){
  assert.equal(scope.acceptance.length,5);
  assert.equal(scope.delivery_order,i+1);
  assert.ok(scope.depends_on.every(d=>ids.has(d)||doc.scopes.some(x=>x.id===d)),scope.id);
  for(const [j,a] of scope.acceptance.entries()){
   assert.equal(a.id,scope.id.replace(/-001$/,'')+'-AC'+(j+1));
   assert.ok(!ids.has(a.id));
   assert.ok(a.label.length>40);
  }
 }
 const accepted=doc.scopes.flatMap(x=>x.verified_criteria);
 assert.equal(accepted.length,0,'an addition to the specification is not proof of implementation');
});

test('no hidden permission, spending or background automation is authorized by the new scopes',()=>{
 assert.equal(doc.safety.cloud_must_remain_disabled_until_authorized,true);
 assert.equal(doc.safety.no_paid_api_without_consent,true);
 assert.equal(doc.safety.no_work_codex_quotas,true);
 assert.equal(doc.safety.no_background_automations,true);
 assert.equal(doc.safety.external_history_requires_supported_authorized_access,true);
 assert.match(JSON.stringify(doc),/import/i);
 assert.match(JSON.stringify(doc),/conversation/i);
 assert.match(JSON.stringify(doc),/m.moire/i);
});

test('the 22/42/10 canonical V1.2 counters are not rewritten by the new amendment',()=>{
 assert.equal(original.counts.backlog_tickets,22);
 assert.equal(original.counts.acceptance_scenarios,42);
 assert.equal(original.counts.improvements,10);
 assert.equal(original.counts.legacy_criteria,36);
 assert.equal(original.counts.improvement_criteria,30);
 assert.equal(original.tickets.length,22);
 assert.equal(original.scenarios.length,42);
 assert.equal(original.improvements.length,10);
 assert.ok(!('scope_extensions' in original),'the original redacted traceability whitelist must be preserved');
});
