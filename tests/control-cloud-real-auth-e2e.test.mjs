import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setup,run} from './control-cloud-real-auth-e2e.mjs';
const script=readFileSync('tests/control-cloud-real-auth-e2e.mjs','utf8');
const good=()=>({
 CONTROL_TEST_PROJECT_REF:'rvrmjjtdedidjnrkdery',
 CONTROL_TEST_PUBLISHABLE_KEY:'sb_publishable_test_mock_value_1234567890123',
 CONTROL_TEST_A_JWT:'headerA.payloadA.signatureA',
 CONTROL_TEST_B_JWT:'headerB.payloadB.signatureB'
});
test('CONTROL E2E is safe-by-default and refuses absent project/auth before any HTTP request',async()=>{
 assert.throws(()=>setup({}),/référence CONTROL Cloud/);
 let count=0;const old=globalThis.fetch;
 globalThis.fetch=()=>{count++;throw Error('Network must not be called')};
 try{await assert.rejects(()=>run({}),/référence CONTROL Cloud/);assert.equal(count,0)}
 finally{globalThis.fetch=old}
});
test('refuses to target the old IAgile Academy Supabase project',()=>{
 assert.throws(()=>setup({...good(),CONTROL_TEST_PROJECT_REF:'daabfmdlgcwcykevvrcm'}),/indépendante/);
});
test('refuses secret/service-role keys and legacy JWT as apikey',()=>{
 for(const val of ['sb_secret_test_privileged','eyJhbGciOiJIUzI1NiIsInR5cCI','', 'foobar']){
  assert.throws(()=>setup({...good(),CONTROL_TEST_PUBLISHABLE_KEY:val}),/clé publique/);
 }
});
test('missing real signed token or password credentials for either account is rejected',()=>{
 const env=good();delete env.CONTROL_TEST_A_JWT;
 assert.throws(()=>setup(env),/identité réelle A/);
 const e=good();delete e.CONTROL_TEST_B_JWT;
 assert.throws(()=>setup(e),/identité réelle B/);
});
test('malformed JWT input fails before network usage',()=>{
 for(const jwt of ['not-a-jwt','Bearer aa.bb.cc','sb_secret_privileged','xx.yy']){
  assert.throws(()=>setup({...good(),CONTROL_TEST_A_JWT:jwt}),/JWT A malformé/);
 }
});
test('a valid pair of test credentials may be supplied without persisting passwords',()=>{
 const env=good();delete env.CONTROL_TEST_A_JWT;delete env.CONTROL_TEST_B_JWT;
 env.CONTROL_TEST_A_EMAIL='private-test-a@example.net';env.CONTROL_TEST_A_PASSWORD='password_A_not_real';
 env.CONTROL_TEST_B_EMAIL='private-test-b@example.net';env.CONTROL_TEST_B_PASSWORD='password_B_not_real';
 const cfg=setup(env);assert.equal(cfg.root,'https://rvrmjjtdedidjnrkdery.supabase.co');
 assert.equal(cfg.key,good().CONTROL_TEST_PUBLISHABLE_KEY);
});
test('real E2E runner checks all 6 protected tables and true Supabase Auth user route',()=>{
 for(const table of ['control_profiles','control_projects','control_items','control_preferences','control_connections','control_audit_events'])assert.ok(script.includes("'"+table+"'"));
 assert.match(script,/\/auth\/v1\/user/);assert.match(script,/\/rest\/v1\//);
 assert.match(script,/assert\.notEqual\(users\[0\],users\[1\]/);
 assert.match(script,/r\.data\?\.is_anonymous===true/);
});
test('real E2E tests refuse to tamper with existing users and fail if cleanup is not complete',()=>{
 assert.match(script,/comptes de recette dédiés et vides obligatoires/);
 assert.match(script,/Nettoyage INCOMPLET/);
 assert.match(script,/aucun enregistrement de recette laissé/);
 assert.match(script,/finally/);
});
test('real E2E does not use privileged keys and never writes to append-only audit',()=>{
 assert.doesNotMatch(script,/auth\.admin\.|supabaseAdmin\.|sb_secret_[A-Za-z0-9]{10,}|Bearer \+key/);
 assert.match(script,/clé publique sb_publishable/);
 assert.match(script,/control_audit_events'&&mine\.data\.length!==1/);
 assert.doesNotMatch(script,/create\('control_audit_events'/);
});
test('Cloud production gate still disables public sign-up',()=>{
 const config=JSON.parse(readFileSync('config/cloud.json','utf8'));
 assert.equal(config.enabled,false);
});
