import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/workspace-shell.css',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
const start=script.indexOf('function externalChangeNotice(event){');
const end=script.indexOf("window.addEventListener('hashchange',render)",start);
const source=script.slice(start,end);
assert.ok(start>0&&end>start,'The real cross-tab listener must be registered on the personal shell');

function mount(answer=false){
 const notice={hidden:true};
 const refresh={onclick:null};
 const nodes={'#control-external-change':notice,'#control-external-reload':refresh};
 const listeners=new Map();
 const storage={};
 let confirmations=0, reloads=0;
 const location={reload(){reloads++}};
 const window={addEventListener(name,fn){listeners.set(name,fn)}};
 const confirm=()=>{confirmations++;return answer};
 const $=selector=>nodes[selector];
 runInNewContext(source,{window,localStorage:storage,location,confirm,$});
 return {notice,refresh,listeners,storage,location,
  confirmations:()=>confirmations,reloads:()=>reloads,
  dispatch(key,oldValue='before',newValue='after'){listeners.get('storage')({key,oldValue,newValue,storageArea:storage})}
 };
}

test('external action and project updates display an alert, never auto-refresh or mutate data',()=>{
 for(const key of ['control-command-v1','control-hub-v2','control-automations-v1']){
  const t=mount();
  assert.equal(t.notice.hidden,true);
  t.dispatch(key);
  assert.equal(t.notice.hidden,false,key);
  assert.equal(t.reloads(),0);
  assert.equal(t.confirmations(),0);
 }
});

test('unrelated origin or unchanged content does not falsely alarm',()=>{
 const t=mount();
 t.dispatch('control-install-dismissed');
 assert.equal(t.notice.hidden,true);
 t.dispatch('control-command-v1','same','same');
 assert.equal(t.notice.hidden,true);
 t.listeners.get('storage')({key:'control-hub-v2',oldValue:'a',newValue:'b',storageArea:{}});
 assert.equal(t.notice.hidden,true);
});

test('storage clear invalidates all local state and keeps warning visible across routes',()=>{
 const t=mount();
 t.dispatch(null,null,null); // real StorageEvent payload for localStorage.clear()
 assert.equal(t.notice.hidden,false);
 assert.match(html,/<div id="control-external-change"[^>]*role="alert" hidden>/);
 assert.ok(html.indexOf('id="control-external-change"')<html.indexOf('id="main"'));
 assert.match(css,/\.control-external-change\[hidden\]\{display:none!important\}/);
 assert.match(css,/@media\(max-width:640px\)\{\.control-external-change/);
});

test('explicit reload requires confirmation so an unfinished draft is not discarded',()=>{
 const decline=mount(false);
 decline.dispatch('control-command-v1');
 decline.refresh.onclick();
 assert.equal(decline.confirmations(),1);
 assert.equal(decline.reloads(),0);
 assert.equal(decline.notice.hidden,false);
 const approve=mount(true);
 approve.dispatch('control-command-v1');
 approve.refresh.onclick();
 assert.equal(approve.confirmations(),1);
 assert.equal(approve.reloads(),1);
});

test('notification is read-only and never activates a provider or scheduled task',()=>{
 assert.doesNotMatch(source,/localStorage\.(?:setItem|removeItem|clear)\(|fetch\(|createAutomation\(/);
 assert.match(source,/window\.addEventListener\('storage',externalChangeNotice\)/);
 assert.match(source,/confirm\('Recharger CONTROL maintenant/);
 assert.match(html,/Toute saisie non enregistrée/);
});