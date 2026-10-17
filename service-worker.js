/* CONTROL PWA — public static shell only; no private instructions, secrets or GitHub API responses. */
'use strict';
const CACHE_SHELL='control-shell-v12';
const CACHE_PUBLIC='control-public-data-v12';
const ROOT=new URL(self.registration.scope);
const ASSETS=['./','./index.html','./legacy.html','./assets/automations-hub.js','./assets/command-center.js','./assets/command-center.css','./assets/tool-catalog.js','./assets/tool-catalog.css','./assets/app.js','./assets/codex.js','./assets/style.css','./assets/theme.css','./assets/pwa.js','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./manifest.webmanifest'];
const PUBLIC_DATA=/^data\/(?:projects|catalog|automations|ai-tool-libraries)\.json$|^data\/(?:sprints|status)\/[a-z0-9-]+\.json$/;
const INITIAL_DATA=['./data/projects.json','./data/catalog.json','./data/automations.json','./data/ai-tool-libraries.json',...['pack-pro','banque-ia','ucp','iagile','tcg'].map(id=>'./data/sprints/'+id+'.json')];
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
 if(path==='app.html'){
  // Authenticated cloud entry: always request from network; never serve the legacy personal dashboard as an offline fallback.
  e.respondWith(fetch(request,{cache:'no-store'}).catch(()=>new Response('<!doctype html><html lang="fr"><meta charset="utf-8"><title>CONTROL hors ligne</title><body style="font-family:system-ui;padding:2rem">Connexion requise : rétablissez votre réseau pour ouvrir CONTROL Cloud.</body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
  return;
 }
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
 // Online assets use the newest deployed version, instead of returning a stale copy first.
 // Offline access falls back to the most recently cached public version.
 e.respondWith((async()=>{
   const cache=await caches.open(CACHE_SHELL);
   try {
     const response=await fetch(request,{cache:'no-cache'});
     if(response.ok){await cache.put(request,response.clone());return response}
     return await cache.match(request)||response;
   } catch {
     return await cache.match(request)||Response.error();
   }
 })());
});