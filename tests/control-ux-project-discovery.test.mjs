import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const index=file('index.html'),cloud=file('app.html');
const local=index.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
const cloudCode=file('assets/cloud-app.js'),finder=file('assets/navigation-hub.js');
const css=file('assets/workspace-shell.css');

function catalog(mode='personal',project=null){
 const listener={};
 const window={};
 runInNewContext(finder,{
  window,console,
  document:{addEventListener:(name,fn)=>listener[name]=fn},
  sessionStorage:{setItem(){}},
  location:{hash:'#/'}
 });
 window.CONTROL_NAVIGATION.setAdapter({mode,getActiveProject:()=>project,isAvailable:()=>true,navigate:()=>true});
 return window.CONTROL_NAVIGATION.getItems();
}
test('personal project shows all four main and seven secondary destinations without removing existing routes',()=>{
 assert.match(local,/,tabs=\[\['ai','Espaces IA'\]/);
 assert.match(local,/const advanced=moreTabs\.some/);
 assert.match(local,/const showAdvanced=advanced\|\|!/);
 assert.match(local,/shell-project-navigation/);
 assert.match(local,/shell-project-more/);
 assert.match(local,/Autres fonctions du projet/);
 const items=catalog('personal',{id:'my-project'});
 assert.equal(items.filter(x=>x.category==='project').length,11);
});
test('Cloud project finder exposes the twelve owner-scoped project sections when signed in',()=>{
 const a=catalog('cloud',{id:'owner-project'});
 const projectItems=a.filter(x=>x.category==='project');
 assert.equal(projectItems.length,12);
 for(const id of ['ai_space','task','mission','report','decision','event','income'])
  assert.ok(projectItems.find(x=>x.id==='project:'+id&&x.target==='project-tab:'+id));
 assert.equal(catalog('cloud',null).some(x=>x.category==='project'),false);
 assert.match(cloudCode,/destination\.startsWith\('project-tab:'\)/);
 assert.match(cloudCode,/if\(page!=='project'\|\|!getProject\(picked\)/);
 assert.equal(JSON.parse(file('config/cloud.json')).enabled,false);
});
test('project sections are fully visible on desktop and intentionally collapsible on phones',()=>{
 assert.match(css,/\.shell-project-navigation \.tabs/);
 assert.match(css,/\.shell-project-more \.clarity-advanced/);
 assert.match(css,/\.shell-project-more:not\(\[open\]\) \.clarity-advanced\{display:none!important\}/);
 assert.match(local,/max-width:720px/);
 assert.match(cloudCode,/max-width:720px/);
 assert.match(cloudCode,/shell-project-navigation/);
});
test('personal new-project button no longer opens a distant undiscoverable form',()=>{
 assert.match(local,/addButton\.setAttribute\('aria-controls','add-box'\)/);
 assert.match(local,/addBox\.scrollIntoView/);
 assert.match(local,/addBox\.querySelector\('input\[name="name"\]'\)\?\.focus/);
 assert.match(local,/id="cancel-add-project"/);
 assert.match(local,/\.setAttribute\('aria-expanded',String\(opening\)\)/);
 assert.ok(local.includes("$('#new-project')")); // intact form registration
});
test('Cloud project and item forms scroll into view and guide focus',()=>{
 assert.match(cloudCode,/case 'toggle-project-form'/);
 assert.match(cloudCode,/case 'toggle-item-form'/);
 assert.match(cloudCode,/el\.scrollIntoView\?\.\(\{behavior:'smooth',block:'start'\}\)/);
 assert.match(cloudCode,/el\.querySelector\('input\[name="title"\]'\)\?\.focus/);
});
test('project finder opens the requested category instead of defaulting to Essentials',()=>{
 assert.match(finder,/open\(\{category:trigger\.dataset\.controlNavCategory\|\|'start'\}\)/);
 assert.match(index,/data-control-nav-category="project"/);
 assert.match(cloudCode,/data-control-nav-category="project"/);
});
test('updated shell cache is renewed for already installed PWA clients',()=>{
 const sw=file('service-worker.js');
 assert.match(sw,/CACHE_SHELL='control-shell-v65'/);
 assert.match(sw,/CACHE_PUBLIC='control-public-data-v65'/);
 assert.match(sw,/assets\/workspace-shell\.css/);
 new Function(local);
 new Function(cloudCode);
});
