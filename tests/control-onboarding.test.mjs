import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('assets/control-onboarding.js',root),'utf8');
const context={module:{exports:{}},window:{}};
vm.runInNewContext(source,context,{timeout:2000});
const onboarding=context.module.exports;
const index=readFileSync(new URL('index.html',root),'utf8');
const css=readFileSync(new URL('assets/control-home-v6.css',root),'utf8');
const serviceWorker=readFileSync(new URL('service-worker.js',root),'utf8');

test('Brand-new device receives one honest three-step guide',()=>{
 const status=onboarding.inspect({},null);
 assert.equal(status.status,'ready');
 assert.equal(status.visible,true);
 assert.equal(status.completed,0);
 const markup=onboarding.render({},null);
 assert.match(markup,/Bien démarrer avec CONTROL/);
 assert.equal((markup.match(/class="control-home-v6-onboarding-step is-/g)||[]).length,3);
 assert.match(markup,/href="#\/new-project" aria-current="step"/);
 assert.match(markup,/Aucune connexion à un service externe/);
 assert.doesNotMatch(markup,/Synchronisation active|Compte connecté/);
});
test('Catalogue projects are not mislabeled as a personal project created by the user',()=>{
 const state=onboarding.inspect({},JSON.stringify({actions:[]}));
 assert.equal(state.projectStarted,false);
 assert.equal(state.completed,0);
});
test('A real personal project advances the guide without marking a task as completed',()=>{
 const hub={custom:[{id:'custom-one',name:'Mon projet'}]};
 const status=onboarding.inspect(hub,null);
 assert.equal(status.projectStarted,true);
 assert.equal(status.taskStarted,false);
 assert.equal(status.completed,1);
 const markup=onboarding.render(hub,null);
 assert.match(markup,/1 \/ 3 étapes/);
 assert.match(markup,/href="#\/control\/inbox\/new" aria-current="step"/);
 assert.match(markup,/Créer ou ouvrir un projet/);
});
test('Opening an existing saved project is legitimate onboarding progress',()=>{
 const status=onboarding.inspect({uxRecent:['project-one']},null);
 assert.equal(status.projectStarted,true);
 assert.equal(status.completed,1);
});
test('Saving a task advances the next step only if the task exists in local data',()=>{
 const raw=JSON.stringify({actions:[{id:'task-one',project:'known',title:'Appeler le client',status:'todo'}]});
 const status=onboarding.inspect({},raw);
 assert.equal(status.completed,2);
 assert.equal(status.visible,true);
 assert.match(onboarding.render({},raw),/href="#\/control\/inbox" aria-current="step"/);
 assert.doesNotMatch(onboarding.render({},raw),/href="#\/control\/inbox\/new" aria-current="step"/);
});
test('Finishing an actual local task hides the guide automatically',()=>{
 const raw=JSON.stringify({actions:[{project:'known',title:'Appeler le client',status:'done'}]});
 const status=onboarding.inspect({},raw);
 assert.equal(status.taskFinished,true);
 assert.equal(status.visible,false);
 assert.equal(onboarding.render({},raw),'');
});
test('Already active accounts are not interrupted by first-time help',()=>{
 for(const state of [
  [{custom:[{id:'a',name:'A'},{id:'b',name:'B'}]},null],
  [{},JSON.stringify({actions:[{title:'A'},{title:'B'},{title:'C'}]})],
  [{},JSON.stringify({clients:[{id:'a'}]})],
  [{},JSON.stringify({missions:[{id:'a'}]})]
 ])assert.equal(onboarding.render(state[0],state[1]),'');
});
test('Corrupt local records never masquerade as new empty accounts',()=>{
 for(const raw of ['{bad','null','[]','42','{"actions":"bad"}']){
  const report=onboarding.inspect({},raw);
  assert.equal(report.visible,false,raw);
  assert.equal(report.status,'unavailable',raw);
  assert.equal(onboarding.render({},raw),'',raw);
 }
 assert.equal(onboarding.render({},null,true),'');
 assert.equal(onboarding.render(null,null),'');
});
test('No remote request, storage mutation or credential form in the guide',()=>{
 assert.doesNotMatch(source.split('/* CONTROL 24 —')[0],/\bfetch\s*\(|XMLHttpRequest|WebSocket|\.setItem\s*\(|\.removeItem\s*\(|navigator\.sendBeacon/);
 const html=onboarding.render({},null);
 assert.doesNotMatch(html,/<form|<script|password|api.key/i);
 for(const path of ['#/new-project','#/control/inbox/new','#/control/inbox'])assert.ok(source.includes(path));
});
test('Approved homepage hosts onboarding between stats and the existing quick search',()=>{
 assert.ok(index.includes('<script src="assets/control-onboarding.js"></script>'));
 assert.match(index,/CONTROL_ONBOARDING\?\.render\(state,localStorage\.getItem\('control-command-v1'\),hubCorrupt\)/);
 const home=index.slice(index.indexOf('function home(){'),index.indexOf('function workspace(p,t){'));
 const order=['control-home-v6-stats','</section>\x27+onboarding+','control-home-v6-ask'].map(x=>home.indexOf(x));
 assert.ok(order.every(x=>x>=0),'Guide must be added without removing existing home sections');
 assert.deepEqual([...order].sort((a,b)=>a-b),order);
 assert.match(css,/\.control-home-v6-onboarding\{margin:/);
 assert.match(css,/\.control-home-v6-onboarding-step\.is-upcoming/);
 assert.match(css,/@media\(max-width:560px\)/);
 assert.match(serviceWorker,/control-onboarding\.js/);
});
