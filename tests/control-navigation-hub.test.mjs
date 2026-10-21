import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const code=file('assets/navigation-hub.js');
const index=file('index.html'),cloud=file('app.html'),cloudApp=file('assets/cloud-app.js');
function harness(){
 const listeners={},win={},store=new Map();
 const document={addEventListener:(event,cb)=>{listeners[event]=cb},createElement:()=>{throw Error('DOM not mounted; catalog test does not render')}};
 const location={hash:'#/'};
 const sandbox={document,window:win,location,sessionStorage:{setItem:(key,v)=>store.set(key,v)},console,Event:class{}};
 runInNewContext(code,sandbox);
 return {api:win.CONTROL_NAVIGATION,location,events:listeners,store};
}
test('navigation finder boots without requiring authentication or global libraries',()=>{
 const h=harness();assert.equal(typeof h.api.open,'function');
 assert.equal(typeof h.api.close,'function');
 assert.equal(typeof h.api.setAdapter,'function');
 assert.equal(h.api.getItems().length>=19,true);
});
test('intent search normalization works for French accents and mixed case',()=>{
 const h=harness();
 assert.equal(h.api.normalize('ÉCHÉANCES'), 'echeances');
 assert.equal(h.api.normalize('  Réunions  '),'reunions');
});
test('every public menu entry has a unique local route',()=>{
 const h=harness(),items=h.api.getItems();
 assert.equal(new Set(items.map(i=>i.id)).size,items.length);
 assert.ok(items.some(i=>i.id==='meetings'&&i.target==='#/control/meetings'));
 assert.ok(items.some(i=>i.id==='backup'&&i.target==='#/control/backup'));
 assert.ok(items.some(i=>i.id==='goals'&&i.target==='#/control/goals'));
 assert.ok(items.some(i=>i.id==='manager'&&i.target==='#/control/manager'));
 assert.ok(items.every(i=>i.target.startsWith('#/')));
});
test('project-specific finder lists advanced sections for the active project without losing them',()=>{
 const h=harness();
 const id='project A /équipe';
 h.api.setAdapter({mode:'personal',getActiveProject:()=>({id,name:'Projet A'})});
 const list=h.api.getItems().filter(x=>x.category==='project');
 assert.equal(list.length,11);
 assert.equal(list.find(x=>x.id==='project:lab').target,'#/project/'+encodeURIComponent(id)+'/lab');
 assert.ok(list.some(x=>x.id==='project:meetings'));
 assert.ok(list.some(x=>x.id==='project:connect'));
});
test('project sections are absent outside a project, so shortcuts cannot lead to missing pages',()=>{
 const h=harness();
 h.api.setAdapter({mode:'personal',getActiveProject:()=>null});
 assert.equal(h.api.getItems().some(x=>x.category==='project'),false);
});
test('Cloud mode hides unsupported routes and maps nested tool categories',()=>{
 const h=harness();
 h.api.setAdapter({mode:'cloud',isAvailable:()=>false});
 const features=h.api.getItems();
 assert.ok(features.some(x=>x.id==='calendar'&&x.target==='tools:calendar'));
 assert.ok(features.some(x=>x.id==='backup'&&x.target==='account'));
 assert.ok(features.some(x=>x.id==='command'&&x.target==='command'));
 for(const id of ['goals','activity','localai'])assert.ok(!features.some(x=>x.id===id),id);
 assert.ok(features.every(x=>x.target&&!x.target.startsWith('#/')));
});
test('registered keyboard shortcuts do not operate while Cloud authentication is unavailable',()=>{
 const h=harness();
 h.api.setAdapter({mode:'cloud',isAvailable:()=>false});
 let blocked=false;h.events.keydown({ctrlKey:true,metaKey:false,key:'k',preventDefault(){blocked=true}});
 assert.equal(blocked,false);
});
test('both app shells include finder JS, CSS, a visible search control and mobile launcher',()=>{
 for(const [name,markup] of [['personal',index],['cloud',cloud]]){
  assert.match(markup,/navigation-hub\.css/,name);
  assert.match(markup,/navigation-hub\.js/,name);
  assert.match(markup,/data-control-nav-open/,name);
  assert.match(markup,/control-nav-mobile-trigger/,name);
 }
 assert.match(index,/data-control-nav-category="project"/);
 assert.match(index,/window\.CONTROL_NAVIGATION\?\.setAdapter/);
 assert.match(cloudApp,/window\.CONTROL_NAVIGATION\?\.setAdapter/);
 assert.match(cloudApp,/byId\('nav-mobile-cloud'\)\.hidden=which!=='workspace'/);
});
test('mobile keeps exactly four primary destinations but adds an optional finder',()=>{
 assert.equal((index.match(/data-go="(?:home|inbox|manager|tools)"/g)||[]).length,4);
 assert.equal((cloud.match(/data-page="(?:projects|inbox|manager|tools)"/g)||[]).length,4);
 assert.match(file('assets/navigation-hub.css'),/position:fixed/);
 assert.match(file('assets/navigation-hub.css'),/max-height:91dvh/);
});
test('global feature finder never stores query text, sensitive project data or contacts',()=>{
 assert.doesNotMatch(code,/fetch\(|XMLHttpRequest|localStorage|service_role|Authorization/);
 assert.match(code,/aria-modal="true"/);
 assert.match(code,/Escape/);
 assert.match(code,/aria-label="Rechercher une fonction"/);
 assert.match(code,/escape\(query\.value\.trim\(\)\)/);
});
test('personal navigation changes are stable and syntactically valid',()=>{
 const inline=index.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
 assert.ok(inline.includes('data-control-nav-open'));
 new Function(inline);
 new Function(code);
 assert.equal(JSON.parse(file('config/cloud.json')).enabled,false);
});
