import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setImmediate as tick} from 'node:timers/promises';

const source=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
const origin='https://cosscoll.github.io/Avancement-Projet/';
const shellName=source.match(/const CACHE_SHELL='([^']+)'/)?.[1];
const publicName=source.match(/const CACHE_PUBLIC='([^']+)'/)?.[1];
assert.ok(shellName&&publicName,'Cache versions must be declared');

function harness(fetcher){
 const callbacks={},cacheMap=new Map();
 const key=x=>typeof x==='string'?x:x.url||String(x);
 const open=async name=>{
  if(!cacheMap.has(name)){
   const data=new Map(),puts=[];
   cacheMap.set(name,{data,puts,async put(request,response){data.set(key(request),response);puts.push(key(request))},
     async match(request){return data.get(key(request))||undefined}});
  }
  return cacheMap.get(name);
 };
 const caches={open,async keys(){return [...cacheMap.keys()]},async delete(k){return cacheMap.delete(k)}};
 const self={registration:{scope:origin},clients:{async claim(){}},skipWaiting(){},addEventListener(name,fn){callbacks[name]=fn}};
 const Response={error(){return {error:true}}};
 new Function('self','caches','fetch','Response',source)(self,caches,fetcher,Response);
 const request=(path,mode='navigate')=>({url:new URL(path,origin).href,method:'GET',mode});
 const navigate=async path=>{
  const e={request:request(path),respondWith(promise){this.promise=promise}};
  callbacks.fetch(e);assert.ok(e.promise,'Service worker must answer navigations');
  return await e.promise;
 };
 return {callbacks,cacheMap,open,navigate,request};
}

test('Legacy or unknown pages cannot poison the offline CONTROL homepage',async()=>{
 let online=true;
 const h=harness(async request=>{if(!online)throw Error('offline');const url=request.url||String(request);return{ok:true,content:url,clone(){return this}}});
 const shell=await h.open(shellName);
 const home=await h.navigate('index.html');
 assert.equal(home.content,origin+'index.html');
 assert.deepEqual(shell.puts,[origin+'index.html']);
 const legacy=await h.navigate('legacy.html');
 assert.equal(legacy.content,origin+'legacy.html');
 assert.deepEqual(shell.puts,[origin+'index.html'],'Legacy page must never replace the home entry');
 // Precache legacy, then confirm distinct offline fallback.
 shell.data.set(origin+'legacy.html',{ok:true,content:'cached legacy'});
 online=false;
 assert.equal((await h.navigate('index.html')).content,origin+'index.html');
 assert.equal((await h.navigate('legacy.html')).content,'cached legacy');
 assert.deepEqual(await h.navigate('missing.html'),{error:true});
});

test('Cold PWA install precaches only public files in bounded parallel batches',async()=>{
 let active=0,maxActive=0,total=0;
 const h=harness(async request=>{
  active++;maxActive=Math.max(maxActive,active);total++;
  await tick();
  active--;
  return {ok:true,clone(){return this}};
 });
 let awaited;
 h.callbacks.install({waitUntil(p){awaited=p}});
 assert.ok(awaited);
 await awaited;
 const shell=await h.open(shellName);
 const data=await h.open(publicName);
 assert.ok(shell.puts.length>=25);
 assert.ok(data.puts.length>=10);
 assert.ok(total>=35);
 assert.ok(maxActive>=2,'Precache should not fetch files sequentially');
 assert.ok(maxActive<=6,'Restrict requests to six concurrent fetches');
 assert.ok(!shell.puts.some(s=>s.includes('app.html')||s.includes('prive.html')||s.includes('config/cloud.json')));
});
