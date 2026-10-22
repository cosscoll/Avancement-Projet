import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setImmediate as tick} from 'node:timers/promises';
const source=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
const origin='https://cosscoll.github.io/Avancement-Projet/';
function harness({fail='',status=200,badMime='',cacheFail=''}={}){
 const callbacks={},stores=new Map(),calls=[],state={skip:0,active:0,max:0,badMime};
 const key=x=>x.url||String(x);
 const open=async name=>{
  if(!stores.has(name)){
   const items=new Map();stores.set(name,{items,async put(request,response){if(cacheFail&&key(request).endsWith(cacheFail))throw Error('Quota');items.set(key(request),response)},async match(request){return items.get(key(request))}});
  }return stores.get(name);
 };
 const caches={open,async keys(){return [...stores.keys()]},async delete(k){return stores.delete(k)}};
 const self={registration:{scope:origin},clients:{async claim(){}},skipWaiting(){state.skip++},addEventListener(n,f){callbacks[n]=f}};
 const fetch=async request=>{
  const url=key(request),path=url.slice(origin.length);
  state.active++;state.max=Math.max(state.max,state.active);calls.push(path);
  await tick();state.active--;
  if(path===fail)throw Error('Network offline');
  const ok=path===state.badMime||path===cacheFail?true:status!==503||path!=='assets/control-operator-core.js';
  const mime=path===state.badMime?'text/html':path.endsWith('.json')?'application/json':path.endsWith('.js')?'application/javascript':path.endsWith('.css')?'text/css':path.endsWith('.html')?'text/html':path.endsWith('.webmanifest')?'application/manifest+json':'image/png';
  return {ok,status:ok?200:503,headers:{get(k){return k.toLowerCase()==='content-type'?mime:null}},clone(){return this}};
 };
 const Response={error(){return {error:true}}};
 new Function('self','caches','fetch','Response',source)(self,caches,fetch,Response);
 const install=async()=>{let promise;callbacks.install({waitUntil(p){promise=p}});assert.ok(promise);return promise};
 const request=path=>({url:new URL(path,origin).href,method:'GET',mode:'same-origin'});
 const fetchAsset=async path=>{const e={request:request(path),respondWith(p){this.promise=p}};callbacks.fetch(e);assert.ok(e.promise);return e.promise};
 return {install,stores,state,calls,fetchAsset};
}
test('required CONTROL JS failure aborts install and never activates incomplete shell',async()=>{
 const h=harness({fail:'assets/control-operator-core.js'});
 await assert.rejects(h.install(),/Installation CONTROL incomplète/);
 assert.equal(h.state.skip,0);
});
test('required HTTP 503 rejects installation',async()=>{
 const h=harness({status:503});
 await assert.rejects(h.install(),/Installation CONTROL incomplète/);
 assert.equal(h.state.skip,0);
});
test('cache quota error on essential file rejects installation',async()=>{
 const h=harness({cacheFail:'assets/command-center.js'});
 await assert.rejects(h.install(),/Installation CONTROL incomplète/);
 assert.equal(h.state.skip,0);
});
test('optional asset network failure does not block working CONTROL shell',async()=>{
 const h=harness({fail:'assets/local-ai-worker.js'});
 await h.install();
 assert.equal(h.state.skip,1);
 assert.ok(h.calls.includes('assets/control-operator-core.js'));
 assert.ok(h.state.max<=6);
});
test('200 HTML fallback for essential JS is rejected instead of cached as JavaScript',async()=>{
 const h=harness({badMime:'assets/control-operator-core.js'});
 await assert.rejects(h.install(),/Installation CONTROL incomplète/);
 assert.equal(h.state.skip,0);
});
test('successful install precaches critical assets, then activates',async()=>{
 const h=harness();await h.install();
 assert.equal(h.state.skip,1);
 const shell=[...h.stores.values()][0];
 assert.ok(shell.items.has(origin+'index.html'));
 assert.ok(shell.items.has(origin+'assets/control-operator-core.js'));
 assert.ok(h.state.max>=2&&h.state.max<=6);
});
test('CONTROL dashboard CSS and PWA manifest are essential to a valid offline installation',async()=>{
 const css=harness({fail:'assets/command-center.css'});
 await assert.rejects(css.install(),/Installation CONTROL incomplète/);
 assert.equal(css.state.skip,0);
 const manifest=harness({fail:'manifest.webmanifest'});
 await assert.rejects(manifest.install(),/Installation CONTROL incomplète/);
 assert.equal(manifest.state.skip,0);
});
test('unrelated legacy asset failure cannot prevent CONTROL core PWA installation',async()=>{
 const h=harness({fail:'assets/app.js'});
 await h.install();
 assert.equal(h.state.skip,1);
});

test('failed v44 installation removes partial caches without deleting active v37 caches',async()=>{
 const h=harness({fail:'assets/control-operator-core.js'});
 h.stores.set('control-shell-v37',{items:new Map([['old','preserved']])});
 await assert.rejects(h.install(),/Installation CONTROL incomplète/);
 assert.equal(h.stores.has('control-shell-v44'),false);
 assert.equal(h.stores.has('control-public-data-v44'),false);
 assert.equal(h.stores.get('control-shell-v37').items.get('old'),'preserved');
 assert.equal(h.state.skip,0);
});
test('PWA manifest HTML fallback must fail closed',async()=>{
 const h=harness({badMime:'manifest.webmanifest'});
 await assert.rejects(h.install(),/Installation CONTROL incomplète/);
 assert.equal(h.state.skip,0);
});
test('successful v44 install caches delivery tracker and preserves critical shell',async()=>{
 const h=harness();await h.install();
 assert.equal(h.state.skip,1);
 assert.ok(h.calls.includes('assets/control-delivery.js'));
 assert.ok(h.calls.includes('data/control-ia-delivery.json'));
 assert.ok(h.calls.includes('data/control-ia-requirements.json'));
 assert.ok(h.stores.get('control-public-data-v44').items.has(origin+'data/control-ia-requirements.json'));
 assert.ok(h.stores.has('control-shell-v44'));
 assert.ok(h.stores.get('control-shell-v44').items.has(origin+'assets/navigation-hub.js'));
 assert.ok(h.stores.get('control-shell-v44').items.has(origin+'assets/navigation-hub.css'));
 assert.ok(h.stores.get('control-shell-v44').items.has(origin+'assets/workspace-shell.css'));

});

test('network-first refresh must never poison cached CONTROL JS with HTTP 200 HTML',async()=>{
 const h=harness();await h.install();
 const path='assets/control-operator-core.js';
 const cached=h.stores.get('control-shell-v44').items.get(origin+path);
 assert.ok(cached);
 h.state.badMime=path;
 const served=await h.fetchAsset(path);
 assert.equal(served,cached);
 assert.equal(h.stores.get('control-shell-v44').items.get(origin+path),cached);
});
test('critical local IA UI resources are required before activating the PWA',async()=>{
 for(const path of ['assets/local-ai.js','assets/local-ai.css','assets/control-delivery.js','assets/control-delivery.css']){
  const h=harness({fail:path});
  await assert.rejects(h.install(),/Installation CONTROL incomplète/,path);
  assert.equal(h.state.skip,0,path);
 }
});

test('HTTP 200 HTML cannot poison cached public V1.2 requirements',async()=>{
 const h=harness();await h.install();
 const path='data/control-ia-requirements.json';
 const cached=h.stores.get('control-public-data-v44').items.get(origin+path);
 assert.ok(cached,'Initial successful JSON should be precached');
 h.state.badMime=path;
 const served=await h.fetchAsset(path);
 assert.equal(served,cached,'HTML body must not replace last verified JSON');
 assert.equal(h.stores.get('control-public-data-v44').items.get(origin+path),cached);
});
test('cold-install HTML fallback never enters public V1.2 requirements cache',async()=>{
 const h=harness({badMime:'data/control-ia-requirements.json'});
 await h.install();
 assert.equal(h.state.skip,1,'optional requirements data cannot prevent a safe core shell');
 assert.ok(!h.stores.get('control-public-data-v44').items.has(origin+'data/control-ia-requirements.json'));
});