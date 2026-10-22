/* CONTROL PWA — public static shell only; no private instructions, secrets or GitHub API responses. */
'use strict';
const CACHE_SHELL='control-shell-v59';
const CACHE_PUBLIC='control-public-data-v59';
const ROOT=new URL(self.registration.scope);
const ASSETS=['./','./index.html','./legacy.html','./assets/automations-hub.js','./assets/control-calendar-core.js','./assets/control-backup-review.js','./assets/control-web-builder.js','./assets/control-web-builder-ui.js','./assets/control-web-builder.css','./assets/command-center.js','./assets/command-center.css','./assets/tool-catalog.js','./assets/tool-catalog.css','./assets/deployment-guides.js','./assets/deployment-guides.css','./assets/control-help.js','./assets/control-help.css','./assets/ai-lab.js','./assets/ai-lab.css','./assets/ux-clarity.css','./assets/navigation-hub.js','./assets/navigation-hub.css','./assets/workspace-shell.css','./assets/multi-ai-command.js','./assets/multi-ai-command.css','./assets/visio-center.js','./assets/visio-center.css','./assets/control-delivery.js','./assets/control-delivery.css','./assets/local-ai.js','./assets/control-operator-core.js','./assets/control-operator.js','./assets/control-coach.js','./assets/local-ai.css','./assets/local-ai-worker.js','./assets/app.js','./assets/codex.js','./assets/style.css','./assets/theme.css','./assets/pwa.js','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./manifest.webmanifest'];
const CRITICAL_SHELL=new Set(['./index.html','./assets/control-calendar-core.js','./assets/control-backup-review.js','./assets/control-web-builder.js','./assets/control-web-builder-ui.js','./assets/control-web-builder.css','./assets/command-center.js','./assets/command-center.css','./assets/navigation-hub.js','./assets/navigation-hub.css','./assets/workspace-shell.css','./assets/control-operator-core.js','./assets/control-operator.js','./assets/local-ai.js','./assets/local-ai.css','./assets/control-delivery.js','./assets/control-delivery.css','./assets/pwa.js','./manifest.webmanifest']);
const PUBLIC_DATA=/^data\/control-ia-(?:delivery|requirements)\.json$|^data\/(?:projects|catalog|automations|ai-tool-libraries|deployment-guides|help-center)\.json$|^data\/(?:sprints|status)\/[a-z0-9-]+\.json$/;
const INITIAL_DATA=['./data/control-ia-delivery.json','./data/control-ia-requirements.json','./data/projects.json','./data/catalog.json','./data/automations.json','./data/ai-tool-libraries.json','./data/deployment-guides.json','./data/help-center.json',...['pack-pro','banque-ia','ucp','iagile','tcg'].map(id=>'./data/sprints/'+id+'.json')];
// Validate types during install and network-first refresh.
// Prevent 200 HTML fallbacks from overwriting valid cached JS.
function validAssetType(asset,response){
 if(!response?.ok||response.type==='opaque')return false;
 const mime=String(response.headers?.get?.('content-type')||'').toLowerCase();
 if(asset.endsWith('.js'))return /(?:javascript|ecmascript)/.test(mime);
 if(asset.endsWith('.css'))return mime.startsWith('text/css');
 if(asset==='./'||asset.endsWith('.html'))return mime.startsWith('text/html');
 if(asset.endsWith('.webmanifest'))return /(?:json|manifest)/.test(mime);
 return true;
}

// A server may return HTTP 200 with an HTML fallback for a missing JSON URL.
// Protect public offline state and the V1.2 matrix from cache contamination.
function validPublicJson(response){
 if(!response?.ok||response.type==='opaque')return false;
 const type=String(response.headers?.get?.('content-type')||'').toLowerCase();
 return type.startsWith('application/json')||/\+json(?:;|$)/.test(type);
}

self.addEventListener('install',(e)=>{
  e.waitUntil((async()=>{
    try {
    const cache=await caches.open(CACHE_SHELL);
    // Six parallel requests per batch prevent the long sequential cold-install delay on Android.
    for(let i=0;i<ASSETS.length;i+=6){
      const batch=ASSETS.slice(i,i+6);
      const results=await Promise.allSettled(batch.map(async a=>{
        const url=new URL(a,ROOT),resp=await fetch(url,{cache:'reload'});
        if(!resp.ok)throw Error('HTTP '+resp.status+' for '+a);
        if(!validAssetType(a,resp))throw Error('Type de contenu CONTROL invalide pour '+a);
        await cache.put(url,resp);
      }));
      const failed=batch.filter((asset,j)=>CRITICAL_SHELL.has(asset)&&results[j].status==='rejected');
      if(failed.length)throw Error('Installation CONTROL incomplète : '+failed.join(', '));
    }
    const dataCache=await caches.open(CACHE_PUBLIC);
    for(let i=0;i<INITIAL_DATA.length;i+=6){
      await Promise.allSettled(INITIAL_DATA.slice(i,i+6).map(async a=>{
        const url=new URL(a,ROOT),response=await fetch(url,{cache:'no-store'});
        if(validPublicJson(response))await dataCache.put(url,response);
      }));
    }
    // Never activate a worker whose essential shell failed to install.
    await self.skipWaiting();
    } catch(error) {
      await Promise.allSettled([caches.delete(CACHE_SHELL),caches.delete(CACHE_PUBLIC)]);
      throw error;
    }
  })());
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
 const isHome=path===''||path==='index.html';
 if(isHome||request.mode==='navigate'){
   e.respondWith((async()=>{
      try{
        const response=await fetch(request);
        // Navigating to a legacy or unknown page must never overwrite the offline CONTROL homepage.
        if(response.ok&&isHome&&validAssetType('./index.html',response)){const cache=await caches.open(CACHE_SHELL);await cache.put(new URL('./index.html',ROOT),response.clone())}
        return response;
      }catch{
        const cache=await caches.open(CACHE_SHELL);
        return await cache.match(isHome?new URL('./index.html',ROOT):request)||Response.error();
      }
   })());
   return;
 }
 if(PUBLIC_DATA.test(path)){
   e.respondWith((async()=>{
     try{const response=await fetch(request);if(validPublicJson(response)){const cache=await caches.open(CACHE_PUBLIC);await cache.put(request,response.clone());return response}const cache=await caches.open(CACHE_PUBLIC);return await cache.match(request)||response}catch{
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
     if(response.ok&&validAssetType('./'+path,response)){await cache.put(request,response.clone());return response}
     return await cache.match(request)||response;
   } catch {
     return await cache.match(request)||Response.error();
   }
 })());
});