import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const home=read('index.html'),setup=read('app.html');
const config=JSON.parse(read('config/cloud.json'));
const workflow=read('.github/workflows/control-cloud-real-auth.yml');
const runner=read('tests/control-cloud-real-auth-e2e.mjs');

test('Cloud public setup reflects existing separate backend but never claims completed Auth JWT',()=>{
 assert.match(setup,/CONTROL Cloud : base créée, accès en validation/);
 assert.match(setup,/six tables protégées par RLS et 22 politiques/);
 assert.match(setup,/deux connexions Supabase Auth réelles/);
 assert.match(setup,/Les inscriptions ne sont pas encore ouvertes/);
 assert.equal(config.enabled,false);
});
test('personal homepage links to read-only Cloud activation status, not to disabled sign-in',()=>{
 assert.match(home,/href="app\.html"[^>]*>Voir l’état de CONTROL Cloud/);
 assert.match(home,/connexion multi-utilisateurs pas encore activée/);
});
test('real A/B workflow is manual-only and only uses environment secrets',()=>{
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/^\s*push:\s*$/m);
 assert.match(workflow,/cancel-in-progress: false/);
 assert.match(workflow,/confirm_dedicated_test_accounts:/);
 for(const name of ['CONTROL_TEST_PUBLISHABLE_KEY','CONTROL_TEST_A_JWT','CONTROL_TEST_B_JWT'])assert.match(workflow,new RegExp('secrets\\.'+name));
 assert.doesNotMatch(workflow,/secrets\.(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|CONTROL_TEST_SECRET_KEY)/);
});
test('real A/B test requires two JWT accepted by Auth and no customer data',()=>{
 assert.match(runner,/\/auth\/v1\/user/);
 assert.match(runner,/assert\.notEqual\(users\[0\],users\[1\]/);
 assert.match(runner,/comptes de recette dédiés et vides obligatoires/);
 assert.match(runner,/Nettoyage INCOMPLET/);
});
test('real test must not create permanent Auth users or mutate append-only audit',()=>{
 assert.doesNotMatch(runner,/auth\.admin\.createUser|create\('control_audit_events'/);
 assert.match(runner,/const work=\[\],unverifiedCleanup=\[\]/);
 assert.match(runner,/finally/);
});

test('unexpected foreign writes are tracked for cleanup before the E2E fails',()=>{
 assert.match(runner,/trackUnexpected\('control_connections',tokenA,a,'label',forgedLabel,forge\)/);
 assert.match(runner,/trackUnexpected\('control_items',tokenB,b,'title',foreignTitle,inject\)/);
 assert.match(runner,/unverifiedCleanup\.push\(table\)/);
});

test('launch readiness remains visible while signup stays locked and project observation is dated',()=>{
 const c=JSON.parse(read('config/cloud.json'));
 assert.equal(c.lastObservedBackendStatus.value,'INACTIVE');
 assert.equal(c.lastObservedBackendStatus.date,'2026-11-02');
 assert.equal(Object.values(c.launchChecks).filter(x=>x===true).length,0);
 assert.match(setup,/id="cloud-readiness"/);
 assert.match(read('assets/cloud-app.js'),/showCloudReadiness\(cfg\)/);
});

test('dated readiness dashboard renders actual observation, zero validation and no tokens',()=>{
 const script=read('assets/cloud-app.js');
 const from=script.indexOf('function showCloudReadiness(cfg){');
 const to=script.indexOf('async function boot(){',from);
 assert.ok(from>=0&&to>from,'readiness function exists');
 const elements={'cloud-readiness':{innerHTML:''}};
 const api=new Function('byId','H',script.slice(from,to)+'; return showCloudReadiness;')(
  id=>elements[id],
  x=>String(x??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
 );
 const config=JSON.parse(read('config/cloud.json'));
 api(config);
 const html=elements['cloud-readiness'].innerHTML;
 assert.match(html,/0 \/ 8 contrôles/);
 assert.match(html,/2026-11-02/,'Date observation must not silently disappear');
 assert.match(html,/INACTIVE/);
 assert.match(html,/Deux utilisateurs réels de recette authentifiés/);
 assert.doesNotMatch(html,/sb_publishable_|access_token|refresh_token/);
 const malicious={...config,lastObservedBackendStatus:{value:'<img src=x>',date:'<script>'}};
 api(malicious);
 assert.doesNotMatch(elements['cloud-readiness'].innerHTML,/<img|<script>/);
});
