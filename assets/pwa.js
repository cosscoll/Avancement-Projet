/* Install assistant for Android/iOS; offline status without fake synchronization claims. */
(()=>{
'use strict';
let deferred=null;
const panel=document.getElementById('install-panel');
const action=document.getElementById('install-action');
const message=document.getElementById('install-help');
const close=document.getElementById('install-close');
const offline=document.getElementById('offline-banner');
const updateBanner=document.getElementById('control-pwa-update');
const updateNow=document.getElementById('control-pwa-update-now');
const updateLater=document.getElementById('control-pwa-update-later');
if(updateNow)updateNow.addEventListener('click',()=>{
 if(confirm('Actualiser CONTROL maintenant ? Toute saisie non enregistrée dans cet onglet sera perdue.'))location.reload();
});
if(updateLater)updateLater.addEventListener('click',()=>{if(updateBanner)updateBanner.hidden=true});
const apple=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const android=/Android/i.test(navigator.userAgent);
const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const show=()=>{if(!standalone && panel && !sessionStorage.getItem('control-install-dismissed'))panel.hidden=false};
function status(){if(offline){offline.hidden=navigator.onLine;offline.textContent='Hors connexion — affichage des dernières données publiques mises en cache, si disponibles. Les nouvelles consignes ne peuvent pas être transmises.';}}
if('serviceWorker' in navigator&&location.protocol==='https:'){
 // A new worker may activate while a draft is open. Notify, never reload automatically.
 let hadController=!!navigator.serviceWorker.controller;
 const showUpdate=()=>{if(hadController&&updateBanner)updateBanner.hidden=false};
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(hadController)showUpdate();
  else hadController=true; // First-ever installation is not a content update.
 });
 window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'})
  .then(reg=>{
   if(reg.waiting&&hadController)showUpdate();
   reg.addEventListener('updatefound',()=>{
    const installing=reg.installing;
    if(!installing)return;
    const check=()=>{if(installing.state==='installed'&&navigator.serviceWorker.controller)showUpdate()};
    installing.addEventListener('statechange',check);
    check();
   });
   // Check the version when the user opens CONTROL, not on a scheduled timer.
   reg.update?.().catch(()=>{});
  }).catch(()=>{}));
}
window.addEventListener('offline',status);window.addEventListener('online',status);status();
if(standalone){if(panel)panel.hidden=true;return;}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();deferred=event;show();
 if(action){action.hidden=false;action.textContent="Installer l'application";}
 if(message)message.textContent='Ajouter CONTROL à ton écran d’accueil, sans passer par un store.';
});
if(apple){show();if(action){action.hidden=true;}if(message)message.textContent='Ne télécharge pas de fichier : ouvre cette page HTTPS dans Safari, touche Partager, puis « Sur l’écran d’accueil » et « Ajouter ».';}
else if(android){show();if(action)action.hidden=true;if(message)message.textContent='Ne télécharge pas de fichier : ouvre cette page HTTPS dans Chrome, puis menu ⋮ → « Installer l’application » ou « Ajouter à l’écran d’accueil ».';}
if(action)action.addEventListener('click',async()=>{
 if(!deferred){if(message)message.textContent='Utilise le menu de ton navigateur puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».';return;}
 const ev=deferred;deferred=null;action.disabled=true;try{await ev.prompt();await ev.userChoice}catch{}finally{action.disabled=false}
});
if(close)close.addEventListener('click',()=>{if(panel)panel.hidden=true;try{sessionStorage.setItem('control-install-dismissed','1')}catch{}});
window.addEventListener('appinstalled',()=>{if(panel)panel.hidden=true;deferred=null;});
})();