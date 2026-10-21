import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const home=readFileSync('index.html','utf8');
const offline=readFileSync('service-worker.js','utf8');
const core=readFileSync('assets/command-center.js','utf8');
const config=JSON.parse(readFileSync('config/cloud.json','utf8'));
const panel=home.slice(home.indexOf("'<section class=\\\"control-whats-new\\\""),home.indexOf("'<section class=\\\"clarity-projects\\\""));

test('new CONTROL capabilities are introduced directly after home shortcuts',()=>{
 const start=home.indexOf('NOUVEAUTÉS DISPONIBLES');
 assert.ok(start>0);
 assert.ok(start>home.indexOf('clarity-shortcuts'));
 assert.ok(start<home.indexOf("'<section class=\\\"clarity-projects"));
});
test('home has real deep-links to goals, search, and decision memory',()=>{
 for(const target of ['#/control/goals','#/control/search','#/control/memory'])
  assert.match(panel,new RegExp(target.replace(/\\//g,'\\/')));
});
test('destination implementation is reachable in actual command center router',()=>{
 assert.match(core,/function goals\\(\\)/);
 assert.match(core,/function search\\(\\)/);
 assert.match(core,/function memory\\(\\)/);
 assert.match(core,/deploy,memory,goals,budget,backup,settings,search/);
});
test('Cloud status is explicitly shown as disabled pending real authorization',()=>{
 assert.equal(config.enabled,false);
 assert.match(panel,/connexion multi-utilisateurs pas encore activée/);
 assert.doesNotMatch(panel,/inscriptions ouvertes|synchronisation active/);
});
test('home feature entry is readable on mobile and usable with keyboard',()=>{
 assert.match(home,/\\.control-whats-new-links\\{display:grid/);
 assert.match(home,/@media\\(max-width:640px\\)/);
 assert.match(home,/\\.control-whats-new-links a:focus-visible/);
});
test('PWA offline shell version changes so a previous install can refresh',()=>{
 assert.match(offline,/CACHE_SHELL='control-shell-v40'/);
 assert.match(offline,/CACHE_PUBLIC='control-public-data-v40'/);
 assert.match(offline,/fetch\\(request,\\{cache:'no-cache'\\}\\)/);
 assert.match(offline,/await self\\.clients\\.claim\\(\\)/);
});
