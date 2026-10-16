/* Install assistant for Android/iOS; offline status without fake synchronization claims. */
(()=>{
'use strict';
let deferred=null;
const panel=document.getElementById('install-panel');
const action=document.getElementById('install-action');
const message=document.getElementById('install-help');
const close=document.getElementById('install-close');
const offline=document.getElementById('offline-banner');
const apple=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const show=()=>{if(!standalone && panel)panel.hidden=false};
function status(){if(offline){offline.hidden=navigator.onLine;offline.textContent='Hors connexion — affichage des dernières données publiques mises en cache, si disponibles. Les nouvelles consignes ne peuvent pas être transmises.';}}
if('serviceWorker' in navigator&&location.protocol==='https:'){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(()=>{}));
}
window.addEventListener('offline',status);window.addEventListener('online',status);status();
if(standalone){if(panel)panel.hidden=true;return;}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();deferred=event;show();
 if(action){action.hidden=false;action.textContent="Installer l'application";}
 if(message)message.textContent='Ajouter CONTROL à ton écran d’accueil, sans passer par un store.';
});
if(apple){show();if(action){action.hidden=true;}if(message)message.textContent='Sur iPhone : ouvre ce site dans Safari, touche Partager, puis « Sur l’écran d’accueil » et « Ajouter ». Sur iPad : même procédure dans Safari.';}
if(action)action.addEventListener('click',async()=>{
 if(!deferred){if(message)message.textContent='Utilise le menu de ton navigateur puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».';return;}
 const ev=deferred;deferred=null;action.disabled=true;try{await ev.prompt();await ev.userChoice}catch{}finally{action.disabled=false}
});
if(close)close.addEventListener('click',()=>{if(panel)panel.hidden=true});
window.addEventListener('appinstalled',()=>{if(panel)panel.hidden=true;deferred=null;});
})();