import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const personal=file('index.html'),cloud=file('app.html');
const personalJS=personal.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
const cloudJS=file('assets/cloud-app.js'),center=file('assets/command-center.js'),css=file('assets/ux-clarity.css');

test('Four clear persistent destinations in personal and Cloud navigations',()=>{
  for(const [name,markup,pattern] of [
    ['personal',personal,/data-go="(?:home|inbox|manager|tools)"/g],
    ['cloud',cloud,/data-page="(?:projects|inbox|manager|tools)"/g]
  ]){
   assert.equal((markup.match(pattern)||[]).length,4,name);
   assert.ok(markup.includes('ux-clarity.css'),name+' CSS');
  }
  assert.doesNotMatch(personal,/<button data-go="missions"/);
  assert.doesNotMatch(cloud,/<button data-page="automations"/);
});
test('Personal home initially shows six projects but search and show-all preserve access',()=>{
 assert.match(personalJS,/showAllProjects\?visible\.length:6/);
 assert.match(personalJS,/id="more-projects"/);
 assert.match(personalJS,/const recentIds=Array\.isArray\(state\.uxRecent\)/);
 assert.match(personalJS,/id="search"/);
 assert.match(personalJS,/state\.uxRecent=\[p\.id/);
});
test('Advanced project tabs remain available under Plus',()=>{
 for(const v of ['Espaces IA','Conversations','Gestion','Ressources','Outils IA','Mise en ligne','Laboratoire IA','Connexions'])
   assert.match(personalJS,new RegExp(v));
 for(const v of ['Espaces IA','Conversations','Actions','Ressources','Missions','Automatisations','Bilans','Décisions','Notes','Calendrier','Budget','Revenus'])
   assert.match(cloudJS,new RegExp(v));
 assert.match(personalJS,/clarity-more-tabs/);
 assert.match(cloudJS,/clarity-more-tabs/);
});
test('Tools are grouped by goals instead of listing all modules at once',()=>{
 for(const v of ['Essentiels','Explorer','Organiser'])assert.ok(center.includes(v),v);
 for(const v of ['Créer et publier','Organiser','Suivre et protéger'])assert.ok(cloudJS.includes(v),v);
 assert.match(center,/function tools\(\)/);
 assert.match(css,/clarity-toolgroup/);
});
test('Syntax and Cloud safety remain intact',()=>{
 new Function(personalJS);new Function(center);new Function(cloudJS);
 assert.equal(JSON.parse(file('config/cloud.json')).enabled,false);
 assert.match(file('service-worker.js'),/ux-clarity\.css/);
 assert.match(file('service-worker.js'),/control-shell-v28/);
});
