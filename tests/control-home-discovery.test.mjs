import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const home=readFileSync('index.html','utf8');
const offline=readFileSync('service-worker.js','utf8');
const core=readFileSync('assets/command-center.js','utf8');
const config=JSON.parse(readFileSync('config/cloud.json','utf8'));
const introduction=home.indexOf('NOUVEAUTÉS DISPONIBLES');
const projects=home.indexOf('clarity-projects');
const panel=home.slice(introduction,projects);

test('home visibly introduces new capabilities before the project cards',()=>{
 assert.ok(introduction>0);
 assert.ok(introduction>home.indexOf('clarity-shortcuts'));
 assert.ok(introduction<projects);
});
test('home shows real links to goal planner, search and decision memory',()=>{
 for(const target of ['#/control/goals','#/control/search','#/control/memory'])
  assert.ok(panel.includes(target),target);
});
test('the referenced features exist in the command-center route handlers',()=>{
 assert.match(core,/function goals\(\)/);
 assert.match(core,/function search\(\)/);
 assert.match(core,/function memory\(\)/);
 assert.match(core,/deploy,memory,goals,budget,backup,settings,search/);
});
test('Cloud must not be presented as enabled before genuine Auth A/B checks',()=>{
 assert.equal(config.enabled,false);
 assert.match(panel,/connexion multi-utilisateurs pas encore activée/);
 assert.doesNotMatch(panel,/inscriptions ouvertes|synchronisation active/);
});
test('new homepage links are mobile responsive and keyboard reachable',()=>{
 assert.match(home,/\.control-whats-new-links\{display:grid/);
 assert.match(home,/@media\(max-width:640px\)/);
 assert.match(home,/\.control-whats-new-links a:focus-visible/);
});
test('new PWA version invalidates stale offline home cache',()=>{
 assert.match(offline,/CACHE_SHELL='control-shell-v60'/);
 assert.match(offline,/CACHE_PUBLIC='control-public-data-v60'/);
 assert.match(offline,/fetch\(request,\{cache:'no-cache'\}\)/);
 assert.match(offline,/await self\.clients\.claim\(\)/);
});

test('site builder is accessible from collapsed homepage discovery without adding dashboard clutter',()=>{
 assert.match(panel,/href="#\/control\/webbuilder"/);
 assert.match(panel,/Personnaliser un modèle, vérifier son contenu/);
 assert.match(home,/\.control-whats-new-links\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
