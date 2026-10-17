import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const data=JSON.parse(get('data/deployment-guides.json'));
test('Ten referenced hosting tutorials with accessible official links',()=>{
 assert.equal(data.guides.length,10);
 const ids=new Set();
 for(const g of data.guides){
   assert.ok(g.id&&!ids.has(g.id),g.id);ids.add(g.id);
   assert.ok(g.name&&/^https:\/\//.test(g.official)&&/^https:\/\//.test(g.dashboard),g.id);
   assert.ok(g.steps.length>=5&&g.steps.every(s=>Array.isArray(s)&&s.length===2&&s[0]&&s[1]),g.id);
   assert.ok(g.check.length>=3&&g.issues.length>=1,g.id);
   assert.ok(data.integration_labels[g.integration],g.id);
   for(const tag of g.fit)assert.ok(data.types[tag],tag);
 }
 assert.ok(ids.has('github-pages'));assert.ok(ids.has('ionos-deploy-now'));assert.ok(ids.has('ionos-sftp'));
 assert.ok(ids.has('vercel'));assert.ok(ids.has('netlify'));assert.ok(ids.has('cloudflare-pages'));
});
test('Both CONTROL clients expose guides, no vendor secret embedded',()=>{
 const personal=get('index.html'),cloud=get('app.html'),router=get('assets/command-center.js'),cloudClient=get('assets/cloud-app.js');
 assert.match(personal,/deployment-guides\.js/);assert.match(personal,/deployment-guides\.css/);
 assert.match(cloud,/deployment-guides\.js/);assert.match(cloud,/deployment-guides\.css/);
 assert.match(router,/function deploy\(/);assert.match(router,/onOpenStatus/);
 assert.match(cloudClient,/function deployPage\(/);assert.match(cloudClient,/case 'deploy'/);
 assert.equal(JSON.parse(get('config/cloud.json')).enabled,false);
 assert.match(get('service-worker.js'),/deployment-guides\.json/);
 new Function(get('assets/deployment-guides.js'));
});
test('Guides enforce no-deployment-without-permission approach',()=>{
 const script=get('assets/deployment-guides.js');
 assert.match(script,/aucune ressource payante/i);
 assert.match(script,/approbation explicite/i);
 assert.match(script,/connecteur/i);
 assert.doesNotMatch(script,/service_role|ghp_[a-zA-Z0-9]{15}/);
});
