/* CONTROL IA Locale : interface d'inférence dans le navigateur, sans API payante.
 * Worker isolé + historique distinct par projet + contexte local en lecture seule.
 */
(()=>{'use strict';
const KEY='control-local-ai-v1';
const MODEL='SmolLM2 135M Instruct · WASM q4';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(s,n)=>String(s??'').slice(0,n);
const isMessage=x=>x&&['assistant','user'].includes(x.role)&&typeof x.content==='string'&&x.content.length<=4000;
function loadHistory(storage){
 try{
  const src=JSON.parse(storage.getItem(KEY)||'{}');
  if(!src||Array.isArray(src)||typeof src!=='object')return{};
  const result={};
  for(const [key,value] of Object.entries(src)){
   if(!/^([a-z0-9_-]{1,130}|general)$/i.test(key)||!Array.isArray(value))continue;
   result[key]=value.slice(-14).filter(isMessage).map(x=>({role:x.role,content:x.content}));
  }
  return result;
 }catch{return{}}
}
function mount(root,adapter={}){
 if(!root)return;
 window.CONTROL_LOCAL_AI?.unmount?.(root);
 const storage=adapter.storage||localStorage;
 const projects=(adapter.projects||[]).filter(p=>p?.id&&p?.name).slice(0,200);
 const search=new URLSearchParams(location.hash.split('?')[1]||'');
 let chosen=projects.some(p=>p.id===adapter.projectId)?adapter.projectId:
   projects.some(p=>p.id===search.get('project'))?search.get('project'):'general';
 const history=loadHistory(storage);
 let worker=null,ready=false,loading=false,generating=false,requestId=0,contextEnabled=false,disposed=false,pendingProject=null;
 const opts=[['general','Conversation générale'],...projects.map(p=>[p.id,p.name])];
 root.innerHTML='<div class="loc-shell"><div class="loc-heading"><div><span class="loc-eyebrow">CONTROL / MODÈLE GÉNÉRATIF SUR TON APPAREIL</span><h1>CONTROL IA locale</h1><p>Une véritable IA qui génère ses réponses dans ton navigateur, sans clé API.</p></div><span class="loc-badge">Prototype local</span></div>'+
 '<div class="loc-hint"><strong>À savoir :</strong> petit modèle expérimental, bien moins puissant que Claude ou ChatGPT. Il peut se tromper, surtout en français. Aucun accès automatique à Internet, à GitHub ou aux outils de CONTROL.</div>'+
 '<section class="loc-settings"><div class="loc-topline"><label>Conversation<select id="loc-project">'+opts.map(([id,name])=>'<option value="'+esc(id)+'" '+(id===chosen?'selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label><button type="button" id="loc-clear">Effacer le chat</button></div>'+
 '<label class="loc-checkbox"><input type="checkbox" id="loc-context"> Utiliser les informations locales du projet en lecture seule</label>'+
 '<p class="loc-small" id="loc-context-info">Désactivé. Les données des projets ne sont jamais ajoutées aux questions sans ton accord.</p></section>'+
 '<section class="loc-model"><div><strong>'+esc(MODEL)+'</strong><p>Premier chargement : environ 180 Mo de poids IA, plus la bibliothèque. Peut être lent sur téléphone ; un appareil avec suffisamment de mémoire est nécessaire.</p><p>Les fichiers sont téléchargés depuis Hugging Face / jsDelivr après ton clic, puis exécutés localement. Ils peuvent être mis en cache par le navigateur.</p></div><div class="loc-model-actions"><button type="button" class="loc-primary" id="loc-load">Charger le modèle (gratuit)</button><button type="button" id="loc-stop" hidden>Arrêter l’IA</button></div><div class="loc-progress" id="loc-progress" hidden><progress id="loc-bar" max="100" value="0"></progress></div><p class="loc-status" id="loc-status" role="status" aria-live="polite">Modèle non chargé. Aucun téléchargement commencé.</p></section>'+
 '<section class="loc-chat"><div class="loc-chathead"><h2>Discussion</h2><span id="loc-count">0 message</span></div><div class="loc-stream" id="loc-stream" aria-label="Conversation CONTROL IA" aria-live="polite"></div>'+
 '<form id="loc-form"><label for="loc-question">Ta question</label><textarea rows="3" maxlength="1400" id="loc-question" placeholder="Ex. Propose un plan pour organiser mon projet…" disabled></textarea><div class="loc-chat-actions"><button type="submit" class="loc-primary" id="loc-send" disabled>Générer une réponse</button><button type="button" id="loc-cancel" hidden>Interrompre</button></div></form></section>'+
 '<details class="loc-details"><summary>Vie privée et limites</summary><p>Les messages sont sauvegardés dans le stockage local de cet appareil, sans synchronisation. Efface le chat pour les supprimer de CONTROL. Les fichiers du modèle peuvent rester dans le cache du navigateur. Le code ne possède aucune clé API et n’envoie pas de questions vers un serveur d’inférence. Les téléchargements de la bibliothèque et des poids passent par des services tiers, qui peuvent voir la connexion réseau utilisée.</p><p>La mémoire du modèle est limitée aux derniers messages de cette conversation. Les documents et projets ne sont accessibles que si tu actives le contexte ci-dessus. Les réponses ne constituent pas des preuves de travail réalisé.</p></details></div>';
 const $=q=>root.querySelector(q);
 const status=(message,error=false)=>{const el=$('#loc-status');if(el){el.textContent=message;el.dataset.error=String(error)}};
 const key=()=>chosen==='general'?'general':chosen;
 const messages=()=>history[key()]||[];
 function save(){
  try{storage.setItem(KEY,JSON.stringify(history));return true}
  catch{status('Stockage local indisponible : la conversation restera visible seulement jusqu’à la fermeture de cet écran.',true);return false}
 }
 function render(){
  const data=messages().slice(-14);
  const target=$('#loc-stream');
  if(!data.length)target.innerHTML='<p class="loc-empty">Aucun message. Charge le modèle, puis commence une conversation.</p>';
  else target.innerHTML=data.map(x=>'<article class="loc-message '+(x.role==='user'?'loc-user':'loc-assistant')+'"><span>'+esc(x.role==='user'?'Vous':'CONTROL IA locale')+'</span><p>'+esc(x.content)+'</p></article>').join('');
  $('#loc-count').textContent=data.length+' message'+(data.length>1?'s':'');
  if(target.scrollTo)target.scrollTo({top:target.scrollHeight,behavior:'auto'});
 }
 const state=()=>{const disabled=!ready||generating;$('#loc-question').disabled=disabled;$('#loc-send').disabled=disabled;$('#loc-load').disabled=loading||ready||generating;$('#loc-project').disabled=generating;$('#loc-stop').hidden=!loading&&!ready&&!generating;$('#loc-cancel').hidden=!generating;};
 function stop(message='Modèle arrêté. Tu peux le recharger.'){
  ++requestId;worker?.terminate?.();worker=null;ready=false;loading=false;generating=false;pendingProject=null;
  if(!disposed){$('#loc-progress').hidden=true;status(message);state()}
 }
 function handle(message){
  if(disposed||!message||typeof message!=='object')return;
  if(message.type==='progress'){
   const value=Number(message.progress);
   if(Number.isFinite(value)){$('#loc-progress').hidden=false;$('#loc-bar').value=Math.min(100,Math.max(0,value))}
   status('Chargement : '+(message.file||'fichiers IA')+' · '+(Number.isFinite(value)?Math.round(value)+' %':'en cours'));
  }else if(message.type==='status'){status(clamp(message.message,150))}
  else if(message.type==='ready'){ready=true;loading=false;$('#loc-progress').hidden=true;status('IA prête : la génération s’effectue sur ton appareil.');state()}
  else if(message.type==='thinking'){if(message.requestId===requestId)status('Le modèle prépare sa réponse. Cette étape peut durer plusieurs minutes sur mobile.')}
  else if(message.type==='answer'&&message.requestId===requestId){
   generating=false;
   const text=clamp(message.text,3500).trim();
   if(text){
    const targetProject=pendingProject||key();const list=history[targetProject]||[];list.push({role:'assistant',content:text});history[targetProject]=list.slice(-14);pendingProject=null;const stored=save();if(targetProject===key())render();
    status(stored?'Réponse générée localement. Vérifie les informations importantes.':'Réponse générée, mais non enregistrée : le stockage local est indisponible.',!stored);
   }else status('La génération n’a pas produit de texte.',true);
   state();
  }else if(message.type==='error'){
   if(message.requestId&&message.requestId!==requestId)return;
   generating=false;loading=false;pendingProject=null;if(!ready){worker?.terminate?.();worker=null;$('#loc-progress').hidden=true}status(clamp(message.message,260),true);state();
  }
 }
 function start(){
  if(loading||ready||generating||disposed)return;
  if(typeof Worker==='undefined'){status('Ce navigateur ne permet pas les Web Workers nécessaires à cette IA.',true);return}
  try{
   worker=new Worker(new URL('./assets/local-ai-worker.js',document.baseURI),{type:'module'});
   worker.onmessage=event=>handle(event.data);
   worker.onerror=()=>{stop('Le moteur local s’est arrêté. Essaie avec un navigateur plus récent ou sur ordinateur.')};
   loading=true;state();status('Téléchargement demandé. L’IA peut occuper plusieurs centaines de Mo de mémoire.');
   worker.postMessage({action:'load'});
  }catch{stop('Impossible de lancer le moteur IA dans ce navigateur.')}
 }
 function send(){
  if(!ready||generating||!worker||disposed)return;
  const question=$('#loc-question').value.trim();
  if(!question)return;
  const before=messages().slice();
  let context='Aucun contexte de projet transmis.';
  if(contextEnabled&&chosen!=='general'&&adapter.getContext){try{context=clamp(adapter.getContext(chosen),1800)}catch{context='Contexte du projet indisponible.'}}
  pendingProject=key();
  const list=messages();
  list.push({role:'user',content:clamp(question,1400)});history[key()]=list.slice(-14);
  save();render();$('#loc-question').value='';
  generating=true;state();
  ++requestId;
  worker.postMessage({action:'generate',requestId,question:clamp(question,1400),
    history:before.slice(-8),context});
 }
 $('#loc-load').addEventListener('click',start);
 $('#loc-stop').addEventListener('click',()=>stop());
 $('#loc-cancel').addEventListener('click',()=>stop('Génération interrompue. Recharge le modèle pour continuer.'));
 $('#loc-form').addEventListener('submit',e=>{e.preventDefault();send()});
 $('#loc-project').addEventListener('change',e=>{if(generating)return;chosen=e.target.value;contextEnabled=false;$('#loc-context').checked=false;$('#loc-context-info').textContent='Contexte désactivé pour cette conversation.';render()});
 $('#loc-context').addEventListener('change',e=>{
  contextEnabled=e.target.checked&&chosen!=='general';
  if(chosen==='general'){e.target.checked=false;contextEnabled=false;status('Choisis un projet pour autoriser le contexte.',true)}
  $('#loc-context-info').textContent=contextEnabled?'Contexte en lecture seule : nom du projet et tâches locales sélectionnées. Aucun envoi serveur.':'Contexte désactivé.';
 });
 $('#loc-clear').addEventListener('click',()=>{
  if(!confirm('Supprimer l’historique de cette conversation locale ?'))return;
  history[key()]=[];const stored=save();render();status(stored?'Historique effacé pour ce projet.':'Conversation effacée à l’écran, mais la suppression n’a pas pu être enregistrée.',!stored);
 });
 root.__controlLocalStop=()=>{disposed=true;stop();worker?.terminate?.();worker=null};
 render();state();
 window.CONTROL_COACH?.mount(root,{onCreateAction:typeof adapter.createAction==='function'?title=>adapter.createAction(chosen,title):undefined});
}
function unmount(root){const stop=root?.__controlLocalStop;if(typeof stop==='function'){stop();delete root.__controlLocalStop}}
window.CONTROL_LOCAL_AI={mount,unmount,loadHistory};
})();