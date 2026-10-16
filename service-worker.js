/* CONTROL PWA — public static shell only; no private instructions, secrets or GitHub API responses. */
'use strict';
const CACHE_SHELL='control-shell-v2';
const CACHE_PUBLIC='control-public-data-v2';
const ROOT=new URL(self.registration.scope);
const ASSETS=['./','./index.html','./assets/app.js','./assets/style.css','./assets/pwa.js','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./manifest.webmanifest'];
const PUBLIC_DATA=/^data\/(?:projects|catalog|automations)\.json$|^data\/(?:sprints|status)\/[a-z0-9-]+\.json$/;
const INITIAL_DATA=['./data/projects.json','./data/catalog.json','./data/automations.json',...['pack-pro','banque-ia','ucp','iagile','tcg'].map(id=>'./data/sprints/'+id+'.json')];
self.addEventListener('install',(e)=>{
  e.waitUntil((async()=>{
    const cache=await caches.open(CACHE_SHELL);
    for(const a of ASSETS){try{const resp=await fetch(new URL(a,ROOT),{cache:'reload'});if(resp.ok)await cache.put(new URL(a,ROOT),resp)}catch{/* Offline installation must not claim every asset was cached. */}}
    const dataCache=await caches.open(CACHE_PUBLIC);
    for(const a of INITIAL_DATA){try{const url=new URL(a,ROOT),response=await fetch(url,{cache:'no-store'});if(response.ok)await dataCache.put(url,response)}catch{/* No fabricated state if initial online fetch failed. */}}
  })());
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('control-')&&!([CACHE_SHELL,CACHE_PUBLIC].includes(key)))await caches.delete(key);await self.clients.claim()})());
});
self.addEventListener('fetch',e=>{
 const request=e.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 const path=url.pathname.slice(ROOT.pathname.length);
 // Never cache private pages, auth callbacks, requests with query credentials or external APIs.
 if(path==='prive.html'||path.startsWith('config/')||url.searchParams.has('access_token')||url.searchParams.has('code'))return;
 if(path===''||path==='index.html'||request.mode==='navigate'){
   e.respondWith((async()=>{
      try{const response=await fetch(request);if(response.ok){const cache=await caches.open(CACHE_SHELL);await cache.put(new URL('./index.html',ROOT),response.clone())}return response}catch{
        const cache=await caches.open(CACHE_SHELL);return await cache.match(new URL('./index.html',ROOT))||Response.error()
      }
   })());
   return;
 }
 if(PUBLIC_DATA.test(path)){
   e.respondWith((async()=>{
     try{const response=await fetch(request);if(response.ok){const cache=await caches.open(CACHE_PUBLIC);await cache.put(request,response.clone())}return response}catch{
       const cache=await caches.open(CACHE_PUBLIC);return await cache.match(request)||Response.error()
     }
   })());
   return;
 }
 if(!ASSETS.some(a=>a.replace(/^\.\//,'')===path))return;
 e.respondWith((async()=>{
   const cache=await caches.open(CACHE_SHELL);
   const cached=await cache.match(request);
   const net=fetch(request).then(async response=>{if(response.ok)await cache.put(request,response.clone());return response}).catch(()=>null);
   return cached||await net||Response.error();
 })());
});