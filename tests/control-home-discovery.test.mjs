import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Protect the current approved v6 homepage, not the retired CONTROL 04 cards.
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const home=read('index.html'),offline=read('service-worker.js');
const core=read('assets/command-center.js'),tools=read('assets/navigation-hub.js');
const css=read('assets/control-home-v6.css'),config=JSON.parse(read('config/cloud.json'));
const script=home.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
const view=script.slice(script.indexOf('function home(){'),script.indexOf('function workspace('));

test('Welcome, request, priorities and project access follow the approved order',()=>{
 const anchors=['control-home-v6-header','control-home-v6-welcome','control-home-v6-stats',
  'control-home-v6-ask','control-home-v6-priorities','control-home-v6-tabs'];
 const positions=anchors.map(x=>view.indexOf(x));
 assert.ok(positions.every(x=>x>=0),'All primary sections must be present');
 assert.deepEqual(positions,[...positions].sort((a,b)=>a-b));
 assert.match(view,/Demander à CONTROL/);
 assert.match(view,/À traiter en priorité/);
});
test('Advanced project tools remain discoverable without crowding the homepage',()=>{
 assert.match(view,/control-home-v6-advanced/);
 for(const path of ['#/control/search','#/control/backup','#/control/audit','#/control/tools'])
  assert.ok(view.includes(path),path);
 for(const name of ['goals','memory','webbuilder'])
  assert.ok(core.includes('function '+name+'(){'),name+' handler must be implemented');
});
test('Important destinations are implemented rather than decorative links',()=>{
 for(const name of ['goals','search','memory','webbuilder','aistudio','backup'])assert.ok(core.includes(name),name);
 assert.match(core,/const pages=\{manager,team,clients,audit:auditData,tools,aistudio,webbuilder/);
 assert.match(tools,/id:'goals'/);
 assert.match(tools,/id:'webbuilder'/);
});
test('Cloud remains unavailable for registrations, with a read-only explanation',()=>{
 assert.equal(config.enabled,false);
 assert.ok(Object.values(config.launchChecks).every(x=>x===false));
 assert.match(view,/connexion multi-utilisateurs pas encore activée/);
 assert.match(view,/href="app\.html">Voir l’état de CONTROL Cloud/);
 assert.doesNotMatch(view,/inscriptions ouvertes|synchronisation active/);
});
test('Current homepage remains keyboard accessible and responsive',()=>{
 assert.match(view,/id="shell-quick-find" role="search"/);
 assert.match(view,/id="add-project"/);
 assert.match(view,/id="new-project"/);
 assert.match(css,/\.control-home-v6 a:focus-visible/);
 assert.match(css,/@media/);
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});
test('PWA renewal retains a versioned shell without stale cached HTML',()=>{
 assert.match(offline,/CACHE_SHELL='control-shell-v\d+'/);
 assert.match(offline,/CACHE_PUBLIC='control-public-data-v\d+'/);
 assert.match(offline,/fetch\(request,\{cache:'no-cache'\}\)/);
 assert.match(offline,/await self\.clients\.claim\(\)/);
});
test('Site creator is reachable from All tools, not added as a distracting hero',()=>{
 assert.match(view,/href="#\/control\/tools"/);
 assert.match(core,/\['webbuilder','Constructeur de sites'/);
 assert.match(core,/function webbuilder\(\)/);
 assert.doesNotMatch(view,/iframe id="builder-preview"/);
});
test('Agents and backups have real routes and remain accessible',()=>{
 assert.match(home,/href="#\/control\/aistudio"/);
 assert.match(view,/href="#\/control\/backup"/);
 assert.match(core,/function aistudio\(\)/);
 assert.match(core,/function backup\(\)/);
});
test('AI finder describes local agents and official connection limitations accurately',()=>{
 assert.match(tools,/Créer un assistant local, gérer mes mémoires et consulter les connexions IA/);
 assert.match(tools,/Sauvegarder projets, agents, mémoires et restaurer un fichier chiffré/);
});
test('Home metrics derive from device storage, never hardcoded example figures',()=>{
 assert.match(view,/CONTROL_DAY_BRIEF\?\.summarize\(localStorage\.getItem\('control-command-v1'\)\)/);
 assert.match(view,/const invalid=day\.status==='invalid'/);
 assert.match(view,/const counter=n=>invalid\?'—'/);
 for(const metric of ['urgent','open','review'])assert.ok(view.includes('counter(day.'+metric+')'));
 for(const path of ['#/control/inbox','#/control/aistudio','#/control/backup'])assert.ok(home.includes(path),path);
});
