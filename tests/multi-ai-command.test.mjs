import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('assets/multi-ai-command.js');
const w={};new Function('window',source)(w);
const app=w.CONTROL_MULTI_AI;

test('A common objective generates independent Claude and Gemini instructions',()=>{
 for(const provider of ['Claude','Gemini']){
  const message=app.missionPrompt({name:'UCP',description:'Projet BTP'},'Auditer la navigation mobile',provider);
  assert.match(message,new RegExp('MISSION CONTROL — '+provider));
  assert.match(message,/Auditer la navigation mobile/);
  assert.match(message,/Aucun achat, dépense, déploiement/);
  assert.match(message,/Preuves|preuves/);
 }
});
test('Command module separates manual outcomes and future API dispatch',()=>{
 assert.match(source,/Saisie manuelle|saisie manuellement|saisi manuellement/i);
 assert.match(source,/canDispatch\?\.\(\)/);
 assert.match(source,/Validation requise/);
 assert.match(source,/confirm\(/);
 assert.match(source,/Aucun.*envoyée.*facturée/);
 assert.doesNotMatch(source,/api\.anthropic\.com|generativelanguage\.googleapis\.com|sk-[a-zA-Z0-9]{20}/);
});
test('Personal and Cloud routes preserve projects and mission storage',()=>{
 assert.match(read('assets/command-center.js'),/function command\(\)/);
 assert.match(read('assets/command-center.js'),/createMission:async/);
 assert.match(read('assets/cloud-app.js'),/command:commandPage/);
 assert.match(read('assets/cloud-app.js'),/control_items/);
 assert.match(read('index.html'),/assets\/multi-ai-command\.js/);
 assert.match(read('app.html'),/assets\/multi-ai-command\.js/);
 assert.match(read('service-worker.js'),/multi-ai-command\.js/);
});
test('Direct API is staged off and requires server-only allowlist, quota and identity',()=>{
 const cfg=JSON.parse(read('config/cloud.json')),example=JSON.parse(read('config/cloud.example.json'));
 assert.equal(cfg.enabled,false);
 assert.equal(example.aiDispatchEnabled,false);
 const edge=read('supabase/functions/control-ai-dispatch/index.ts');
 assert.match(edge,/CONTROL_AI_DISPATCH_ENABLED/);
 assert.match(edge,/CONTROL_AI_APPROVED_USER_IDS/);
 assert.match(edge,/admin\.auth\.getUser/);
 assert.match(edge,/eq\("owner_id",uid\)/);
 assert.match(edge,/control_claim_ai_quota/);
 assert.match(edge,/CONTROL_AI_ALLOW_/);
 assert.match(edge,/approved!==true/);
 const sql=read('supabase/migrations/20261017_control_ai_dispatch.sql');
 assert.match(sql,/revoke all on function public\.control_claim_ai_quota/);
 assert.match(sql,/to service_role/);
});
