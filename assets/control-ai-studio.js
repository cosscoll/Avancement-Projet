/* CONTROL AI Studio — opt-in local archive + memory + personalized small-model agents. */
(()=>{'use strict';
const core=window.CONTROL_AI_STUDIO_CORE;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(root,adapter={}){
 if(!root||!core)return;
 window.CONTROL_AI_STUDIO?.unmount?.(root);
 const storage=adapter.storage||localStorage,loaded=core.read(storage);
 let db=loaded.state,raw=loaded.raw,blocked=loaded.error,tab='accounts',preview=null,query='',selectedImport=null,selectedAgent=null,selectedThread=null,editingMemoryId=null,restoreDraft=null,threadQuery='',highlightedMessageIndex=-1;
 let worker=null,ready=false,loading=false,generating=false,disposed=false,requestId=0,pending=null,importGeneration=0,studioRestoreGeneration=0;
 const projects=[{id:'general',name:'Tous mes projets'},...(adapter.projects||[]).filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string')];
 const $=s=>root.querySelector(s);
 const notify=(value,error=false)=>{const el=$('[data-as-status]');if(el){el.textContent=value;el.dataset.error=String(error)}};
 function commit(change){
  if(blocked){notify(blocked,true);return false}
  const copy=structuredClone(db);
  try{change(copy);const next=core.write(storage,copy,raw);db=copy;raw=next;return true}
  catch(e){notify(String(e?.message||'Enregistrement impossible.'),true);return false}
 }

 // Unsaved messages stay in the current browser tab, not in agents or remote APIs.
 const DRAFT_PREFIX='control-ai-studio-draft-v1:';
 const draftCache=new Map();
 let draftPersistent=true;
 const draftStorage=(()=>{try{return window.sessionStorage}catch{draftPersistent=false;return null}})();
 const draftKey=(agentId,threadId)=>DRAFT_PREFIX+agentId+':'+threadId;
 function readDraft(agentId,threadId){
  const key=draftKey(agentId,threadId);
  if(draftCache.has(key))return draftCache.get(key);
  try{const value=String(draftStorage?.getItem(key)||'').slice(0,1400);if(value)draftCache.set(key,value);return value}
  catch{draftPersistent=false;return ''}
 }
 function clearDraft(agentId,threadId){
  const key=draftKey(agentId,threadId);draftCache.delete(key);
  try{draftStorage?.removeItem(key)}catch{draftPersistent=false}
 }
 function saveDraft(agentId,threadId,value){
  const next=String(value||'').slice(0,1400);
  if(!next){clearDraft(agentId,threadId);return}
  const key=draftKey(agentId,threadId);draftCache.set(key,next);
  try{if(!draftStorage)throw Error('Stockage indisponible');draftStorage.setItem(key,next)}
  catch{draftPersistent=false}
 }
 function clearStudioDrafts(){
  draftCache.clear();
  try{if(!draftStorage)return;for(let i=draftStorage.length-1;i>=0;i--){
   const key=draftStorage.key(i);if(key?.startsWith(DRAFT_PREFIX))draftStorage.removeItem(key)
  }}catch{draftPersistent=false}
 }
 const option=(id,name,selected)=>'<option value="'+esc(id)+'" '+(selected?'selected':'')+'>'+esc(name)+'</option>';
 const providers=[['chatgpt','ChatGPT','Exporter depuis Paramètres → Contrôles des données.','https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data'],['claude','Claude','Exporter ses conversations depuis les paramètres du compte.','https://support.claude.com/en/articles/9450526-how-can-i-export-my-claude-data'],['gemini','Gemini','Exporter ses données depuis Google Takeout (certaines archives ne contiennent que les prompts).','https://takeout.google.com/']];
 
const officialConnections=[
 {id:'chatgpt',name:'ChatGPT',mark:'G',method:'Sign in with ChatGPT',state:'Accès partenaire à configurer',body:'La connexion sur un site exige une autorisation OpenAI pour CONTROL. Elle ne permet pas de lire tes anciens chats ni les mémoires.',url:'https://developers.openai.com/siwc/website'},
 {id:'claude',name:'Claude',mark:'C',method:'Claude.ai et Claude API sont distincts',state:'Compte personnel non connectable',body:'Anthropic ne permet pas aux sites tiers de réutiliser ta connexion Claude.ai. Une clé API Console ne donne pas accès à tes anciens chats.',url:'https://code.claude.com/docs/en/legal-and-compliance'},
 {id:'gemini',name:'Gemini',mark:'✦',method:'Authentification Google et Gemini API',state:'Client OAuth à configurer',body:'Un client OAuth Google est nécessaire. Même une fois connecté, il ne donne pas automatiquement accès aux anciennes conversations Gemini.',url:'https://ai.google.dev/gemini-api/docs/oauth'}
];
function accountsPanel(){
 return '<section class="as-connect-intro"><div><span class="as-overline">CONNEXIONS OFFICIELLES</span><h2>Connecter mes IA</h2><p>Un seul espace pour tes assistants. Les connexions seront activées seulement lorsqu’elles seront réellement autorisées. Aucun fichier à importer pour créer un agent.</p></div><span class="as-connect-counter">0 compte lié</span></section>'+
 '<div class="as-provider-grid">'+officialConnections.map(p=>
  '<article class="as-connect-card" data-as-account="'+p.id+'"><div class="as-connect-heading"><span class="as-connect-logo as-connect-logo-'+p.id+'">'+p.mark+'</span><div><h3>'+p.name+'</h3><span class="as-connect-unlinked">Non connecté</span></div></div>'+
  '<p class="as-connect-method">'+p.method+'</p><p class="as-connect-status">'+p.state+'</p><p class="as-connect-description">'+p.body+'</p>'+
  '<button type="button" disabled aria-label="Connexion '+p.name+' non disponible pour CONTROL">Connexion non disponible</button>'+
  '<a href="'+p.url+'" target="_blank" rel="noopener noreferrer">Conditions officielles de connexion</a></article>'
 ).join('')+'</div>'+
 '<section class="as-card as-connect-plan"><span class="as-overline">PROCHAINES ÉTAPES</span><h2>Activation de vraies connexions</h2><p>CONTROL doit d’abord disposer de comptes sécurisés, de clients OAuth enregistrés et de callbacks vérifiés. Les permissions pour l’identité, la génération IA et les anciennes conversations sont distinctes. Aucune connexion n’est simulée.</p><div class="as-connect-actions"><button type="button" class="as-primary" data-as-action="go-agents">Créer un assistant maintenant</button><button type="button" data-as-action="show-archives">Archives (facultatif)</button></div></section>';
}
function journey(){
  if(db.agents.length)return '';
  return '<section class="as-journey" aria-labelledby="as-journey-title"><div class="as-journey-head"><span class="as-overline">DÉMARRAGE GUIDÉ</span><h2 id="as-journey-title">Créer mon premier assistant</h2><p>Avance à ton rythme : importer des conversations et créer des mémoires sont facultatifs. Rien n’est envoyé à un fournisseur IA.</p></div>'+
   '<div class="as-journey-grid">'+
   '<button type="button" data-as-tab="imports" class="as-journey-step"><span class="as-journey-number">1</span><strong>Ajouter mes conversations</strong><small>'+(db.imports.length?db.imports.length+' conversation(s) importée(s)':'Facultatif · importer un fichier exporté')+'</small></button>'+
   '<button type="button" data-as-tab="memories" class="as-journey-step"><span class="as-journey-number">2</span><strong>Choisir mes mémoires</strong><small>'+(db.memories.length?db.memories.length+' mémoire(s) approuvée(s)':'Facultatif · sélectionner les informations utiles')+'</small></button>'+
   '<button type="button" data-as-tab="agents" class="as-journey-step as-journey-main"><span class="as-journey-number">3</span><strong>Créer mon assistant</strong><small>Rôle, projet et sources autorisées</small></button></div>'+
   '<p class="as-journey-footnote">Les anciennes conversations ne sont disponibles que si tu les importes toi-même. Aucun compte ChatGPT, Claude ou Gemini n’est connecté.</p></section>';
}
const stats=()=>'<div class="as-metrics"><div><strong>'+db.imports.length+'</strong><span>Conversations importées</span></div><div><strong>'+db.memories.length+'</strong><span>Mémoires approuvées</span></div><div><strong>'+db.agents.length+'</strong><span>Agents créés</span></div></div>';
 function header(){return '<div class="as-heading"><div><span class="as-kicker">CONTROL / ESPACE IA</span><h1>Comptes IA & agents</h1><p>Connexion des fournisseurs et assistants personnalisés.</p></div><span class="as-local-tag">Mode local</span></div>'+
 '<div class="as-notice"><strong>Situation actuelle :</strong> aucun compte externe ChatGPT, Claude ou Gemini n’est relié à CONTROL. Les agents locaux restent utilisables sans compte externe. Aucune synchronisation native, aucun quota Work/Codex et aucune dépense.</div>'+
 '<div class="as-steps"><button data-as-tab="accounts" aria-current="'+(tab==='accounts'?'page':'false')+'">Connexions IA</button><button data-as-tab="agents" aria-current="'+(tab==='agents'?'page':'false')+'">Mes agents</button><button data-as-tab="memories" aria-current="'+(tab==='memories'?'page':'false')+'">Mémoires</button><button data-as-tab="imports" aria-current="'+(tab==='imports'?'page':'false')+'">Archives (facultatif)</button></div>';
 }
 function importPanel(){
  const list=db.imports.filter(c=>(c.title+' '+c.provider+' '+c.messages.map(m=>m.content).join(' ')).toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'))).slice(0,160);
  return '<div class="as-two"><section class="as-card"><div class="as-card-head"><span class="as-overline">IMPORTATION</span><h2>Mes comptes IA</h2><p>Récupère l’archive officielle, puis choisis le fichier JSON ou TXT.</p></div><div class="as-providers">'+providers.map(([id,title,description,url])=>'<div class="as-provider"><div class="as-provider-icon">'+(id==='chatgpt'?'G':id==='claude'?'C':'✦')+'</div><div><strong>'+title+'</strong><p>'+esc(description)+'</p><a href="'+url+'" target="_blank" rel="noopener noreferrer">Comment exporter ↗</a></div></div>').join('')+'</div>'+
 '<form id="as-import-form"><label for="as-provider">Compte d’origine</label><select id="as-provider" required>'+providers.map(([id,title])=>option(id,title,false)).join('')+'</select><label for="as-file">Archive à importer (JSON ou TXT, 9 Mo max.)</label><input type="file" id="as-file" accept=".json,.txt,application/json,text/plain" required><button class="as-primary" type="submit">Analyser le fichier</button></form><p class="as-small">Les fichiers ZIP doivent être décompressés au préalable. Les photos, pièces jointes et certaines informations natives ne sont pas importées.</p></section>'+
 '<section class="as-card"><div class="as-card-head"><span class="as-overline">PRÉVISUALISATION</span><h2>Vérifier avant d’importer</h2></div>'+(preview?'<div class="as-preview"><strong>'+preview.rows.length+' conversation(s) reconnue(s)</strong><p>'+preview.rows.reduce((n,r)=>n+r.messages.length,0)+' messages textuels · '+esc(preview.provider)+'</p><div class="as-import-selection" role="group" aria-label="Choisir les conversations à conserver">'+preview.rows.map(c=>'<label class="as-import-choice"><input type="checkbox" data-as-import-choice="'+esc(c.id)+'" '+(preview.selectedIds.includes(c.id)?'checked':'')+'><span><strong>'+esc(c.title)+'</strong><small>'+c.messages.length+' messages · '+esc(c.provider)+'</small></span></label>').join('')+'</div><p class="as-small">Aucune conversation n’est sélectionnée par défaut. Seules les conversations cochées seront enregistrées sur cet appareil, sans chiffrement.</p><label class="as-consent"><input type="checkbox" id="as-import-consent" '+(preview.consent?'checked':'')+'> J’autorise l’enregistrement local des conversations sélectionnées et comprends que ces données ne sont pas chiffrées.</label><button class="as-primary" data-as-action="confirm-import">Importer la sélection</button><button data-as-action="cancel-import">Annuler</button></div>':'<div class="as-empty"><span>↥</span><strong>Aucun fichier analysé</strong><p>Le contenu sera contrôlé avant tout enregistrement local.</p></div>')+'</section></div>'+
 '<section class="as-card"><div class="as-list-header"><div><span class="as-overline">BIBLIOTHÈQUE</span><h2>Mes conversations <span class="as-count">'+db.imports.length+'</span></h2></div><input id="as-search" type="search" placeholder="Rechercher dans les conversations" value="'+esc(query)+'" aria-label="Rechercher des conversations"></div>'+(list.length?'<div class="as-records">'+list.map(c=>'<article class="as-record"><div><span class="as-source">'+esc(c.provider)+'</span><strong>'+esc(c.title)+'</strong><small>'+c.messages.length+' messages · import local</small></div><div class="as-record-actions"><button data-as-view="'+esc(c.id)+'">Lire</button><button data-as-create-memory="'+esc(c.id)+'">Créer une mémoire</button><button data-as-source-agent="'+esc(c.id)+'">Créer un agent</button><button class="as-danger" data-as-delete-import="'+esc(c.id)+'" aria-label="Supprimer cette conversation">Supprimer</button></div></article>').join('')+'</div>':'<p class="as-emptytext">Aucune conversation correspondante. Importe un fichier pour commencer.</p>')+'</section>'+
 (selectedImport?(()=>{const c=db.imports.find(x=>x.id===selectedImport);return c?'<section class="as-card" id="as-reader"><div class="as-list-header"><div><span class="as-overline">LECTURE · '+esc(c.provider)+'</span><h2>'+esc(c.title)+'</h2></div><button data-as-action="close-reader">Fermer</button></div><div class="as-transcript">'+c.messages.slice(-80).map(m=>'<div class="as-bubble '+(m.role==='user'?'as-user':'as-assistant')+'"><span>'+ (m.role==='user'?'Utilisateur':'Assistant')+'</span><p>'+esc(m.content)+'</p></div>').join('')+'</div><p class="as-small">Affichage des 80 derniers messages. Les archives restent consultables uniquement sur cet appareil.</p></section>':''})():'');
 }
 
function memoryPanel(){
 const editing=db.memories.find(m=>m.id===editingMemoryId);
 return '<div class="as-two"><section class="as-card"><div class="as-card-head"><span class="as-overline">MÉMOIRE CONTRÔLÉE</span><h2>'+(editing?'Modifier la mémoire':'Ajouter une mémoire')+'</h2><p>Les corrections sont immédiatement réutilisées dans les prochaines conversations des agents concernés.</p></div>'+
 '<form id="as-memory-form"><label for="as-memory-title">Titre de la mémoire</label><input required id="as-memory-title" maxlength="100" value="'+esc(editing?.title||'')+'" placeholder="Ex. Positionnement de mon entreprise">'+
 '<label for="as-memory-project">Périmètre</label><select id="as-memory-project" '+(editing?'disabled':'')+'>'+projects.map(p=>option(p.id,p.name,p.id===(editing?.projectId||'general'))).join('')+'</select>'+
 '<label for="as-memory-source">Source facultative</label><select id="as-memory-source" '+(editing?'disabled':'')+'>'+option('','Sans conversation source',!(editing?.conversationId||selectedImport))+db.imports.map(c=>option(c.id,c.provider+' · '+c.title,(editing?.conversationId||selectedImport)===c.id)).join('')+'</select>'+
 '<label for="as-memory-content">Informations approuvées</label><textarea id="as-memory-content" maxlength="1600" rows="6" required>'+esc(editing?.content||'')+'</textarea>'+
 '<button class="as-primary" type="submit">'+(editing?'Enregistrer les corrections':'Enregistrer cette mémoire')+'</button>'+(editing?'<button type="button" data-as-action="cancel-memory-edit">Annuler</button>':'')+'</form></section>'+
 '<section class="as-card"><div class="as-card-head"><span class="as-overline">CONTRÔLE</span><h2>Mes mémoires · '+db.memories.length+'</h2></div>'+
 (db.memories.length?db.memories.map(m=>'<article class="as-memory"><span class="as-source">'+esc(projects.find(x=>x.id===m.projectId)?.name||m.projectId)+'</span><strong>'+esc(m.title)+'</strong><small>Version '+(Math.max(1,Number(m.version)||1))+'</small><p>'+esc(m.content)+'</p><div class="as-inline-actions"><button data-as-edit-memory="'+esc(m.id)+'">Modifier</button><button data-as-delete-memory="'+esc(m.id)+'" class="as-danger">Révoquer et supprimer</button></div></article>').join(''):'<div class="as-empty">Aucune mémoire approuvée.</div>')+'</section></div>';
}

 function threadSearchPanel(){
  const search=core.searchThreads(db,threadQuery);
  const projectsById=Object.fromEntries(projects.map(p=>[p.id,p.name]));
  return '<section class="as-thread-search" aria-label="Rechercher dans les discussions locales">'+
   '<div class="as-thread-search-title"><div><strong>Retrouver une discussion</strong><small>Recherche dans les messages des agents, sans connexion externe.</small></div></div>'+
   '<div class="as-thread-search-controls"><label for="as-thread-search-input" class="as-sr-only">Chercher un message ou un titre</label>'+
   '<input id="as-thread-search-input" type="search" maxlength="100" autocomplete="off" placeholder="Rechercher un message, une décision…" value="'+esc(threadQuery)+'">'+
   (threadQuery?'<button type="button" data-as-action="clear-thread-search">Effacer</button>':'')+'</div>'+
   (!search.needsMore?'<div class="as-thread-results" id="as-thread-results" role="region" aria-label="Résultats de recherche">'+
    '<p class="as-thread-results-count" role="status" aria-live="polite">'+search.total+' discussion(s) correspondante(s)'+(search.total>search.results.length?' · '+search.results.length+' affichée(s)':'')+'</p>'+
    (search.results.length?search.results.map(hit=>
     '<button type="button" class="as-thread-hit" data-as-jump-agent="'+esc(hit.agentId)+'" data-as-jump-thread="'+esc(hit.threadId)+'" data-as-jump-message="'+hit.messageIndex+'">'+
     '<strong>'+esc(hit.threadName)+'</strong><small>'+esc(hit.agentName)+' · '+esc(projectsById[hit.projectId]||hit.projectId||'Projet')+'</small>'+
     '<span>'+esc(hit.excerpt)+'</span></button>').join(''):
     '<p class="as-thread-results-empty">Aucune discussion correspondante sur cet appareil.</p>')+
    '</div>':'')+'</section>';
 }
function agentPanel(){
  const current=db.agents.find(a=>a.id===selectedAgent)||db.agents[0];
  if(current&&current.id!==selectedAgent){selectedAgent=current.id;selectedThread=null}
  const thread=current?.threads.find(x=>x.id===selectedThread)||current?.threads[0];
  if(thread&&thread.id!==selectedThread)selectedThread=thread.id;
  return threadSearchPanel()+'<div class="as-agent-layout"><aside class="as-card as-agent-side"><div class="as-card-head"><span class="as-overline">MON ÉQUIPE IA</span><h2>Assistants <span class="as-count">'+db.agents.length+'</span></h2></div><div class="as-agent-list">'+(db.agents.length?db.agents.map(a=>'<button class="as-agent-item" data-as-open-agent="'+esc(a.id)+'" aria-current="'+(current?.id===a.id?'page':'false')+'"><span class="as-avatar">'+esc(a.name.slice(0,1).toUpperCase())+'</span><span><strong>'+esc(a.name)+'</strong><small>'+esc(projects.find(x=>x.id===a.projectId)?.name||'Général')+'</small></span></button>').join(''):'<p class="as-small">Crée ton premier assistant ci-dessous.</p>')+'</div><details class="as-new-agent" '+(!db.agents.length?'open':'')+'><summary>+ Nouvel assistant</summary><form id="as-agent-form"><label for="as-agent-name">Nom</label><input id="as-agent-name" maxlength="90" required placeholder="Ex. Assistant marketing"><label for="as-agent-project">Projet</label><select id="as-agent-project">'+projects.map(p=>option(p.id,p.name,false)).join('')+'</select><label for="as-agent-instructions">Rôle et instructions</label><textarea id="as-agent-instructions" rows="4" maxlength="1300" required placeholder="Tu es un assistant spécialisé en…"></textarea><fieldset><legend>Conversations sources (facultatives)</legend>'+(db.imports.length?db.imports.map(c=>'<label class="as-check"><input type="checkbox" name="agent-source" value="'+esc(c.id)+'" '+(selectedImport===c.id?'checked':'')+'>'+esc(c.provider+' · '+c.title)+'</label>').join(''):'<small>Tu peux créer un assistant sans importer de fichier.</small>')+'</fieldset><fieldset><legend>Mémoires autorisées</legend>'+ (db.memories.length?db.memories.map(m=>'<label class="as-check"><input type="checkbox" name="agent-memory" value="'+esc(m.id)+'" data-memory-project="'+esc(m.projectId)+'">'+esc(m.title)+'</label>').join(''):'<small>Crée des mémoires depuis l’onglet précédent.</small>')+'</fieldset><button type="submit" class="as-primary">Créer l’assistant</button></form></details></aside>'+
 '<section class="as-card as-agent-detail">'+(current?'<div class="as-agent-toolbar"><div><span class="as-overline">ASSISTANT PERSONNALISÉ</span><h2>'+esc(current.name)+'</h2><p>Instructions : '+esc(current.instructions)+'</p><small>'+current.memoryIds.filter(id=>db.memories.some(m=>m.id===id)).length+' mémoire(s) autorisée(s) · '+current.conversationIds.length+' conversation(s) source</small></div><div class="as-inline-actions"><button type="button" data-as-action="toggle-agent-edit">Modifier l’agent</button><button class="as-danger" data-as-action="delete-agent">Supprimer l’agent</button></div></div><details id="as-agent-edit" class="as-config"><summary>Paramètres de l’agent et sources autorisées</summary><form id="as-agent-edit-form"><label for="as-edit-agent-name">Nom</label><input id="as-edit-agent-name" maxlength="90" required value="'+esc(current.name)+'"><label for="as-edit-agent-instructions">Instructions</label><textarea id="as-edit-agent-instructions" rows="4" maxlength="1300" required>'+esc(current.instructions)+'</textarea><p class="as-small">Projet conservé : '+esc(projects.find(p=>p.id===current.projectId)?.name||current.projectId)+'. Crée un nouvel agent pour changer de projet.</p><fieldset><legend>Conversations choisies</legend>'+(db.imports.length?db.imports.map(c=>'<label class="as-check"><input type="checkbox" name="edit-agent-source" value="'+esc(c.id)+'" '+(current.conversationIds.includes(c.id)?'checked':'')+'>'+esc(c.provider+' · '+c.title)+'</label>').join(''):'<small>Aucune conversation importée.</small>')+'</fieldset><fieldset><legend>Mémoires autorisées</legend>'+(db.memories.some(m=>m.projectId==='general'||m.projectId===current.projectId)?db.memories.filter(m=>m.projectId==='general'||m.projectId===current.projectId).map(m=>'<label class="as-check"><input type="checkbox" name="edit-agent-memory" value="'+esc(m.id)+'" '+(current.memoryIds.includes(m.id)?'checked':'')+'>'+esc(m.title)+' (v'+(Math.max(1,Number(m.version)||1))+')</label>').join(''):'<small>Aucune mémoire autorisée pour ce projet.</small>')+'</fieldset><button type="submit" class="as-primary">Enregistrer les paramètres</button></form></details><div class="as-chatbar"><label for="as-thread">Discussion <select id="as-thread">'+current.threads.map(t=>option(t.id,t.name,t.id===thread?.id)).join('')+'</select></label><button data-as-action="new-thread">+ Discussion</button><details class="as-thread-manage"><summary>Gérer le fil</summary><div class="as-thread-manage-inner"><form id="as-thread-rename-form"><label for="as-thread-name">Nom de la discussion</label><input id="as-thread-name" maxlength="80" required value="'+esc(thread?.name||'')+'"><button type="submit">Renommer</button></form><button type="button" class="as-danger" data-as-action="clear-thread" '+(!thread?.messages.length?'disabled':'')+'>Effacer les messages</button><button type="button" class="as-danger" data-as-action="delete-thread" '+(current.threads.length<=1?'disabled':'')+'>Supprimer cette discussion</button><p>La suppression est définitive. Les autres discussions restent conservées.</p></div></details><button data-as-action="copy-prompt">Copier le contexte</button></div><details class="as-context-preview"><summary>Voir les mémoires et archives réellement utilisées</summary><div class="as-context-preview-inner"><p><strong>'+core.contextReport(db,current).memoriesIncluded+' / '+core.contextReport(db,current).memoriesSelected+' mémoires</strong> et <strong>'+core.contextReport(db,current).sourcesIncluded+' / '+core.contextReport(db,current).sourcesSelected+' archives</strong> incluses.</p>'+(core.contextReport(db,current).memoriesOmitted||core.contextReport(db,current).sourcesOmitted?'<p role="note">Certaines sources sélectionnées ne tiennent pas dans le contexte limité. Retire les éléments moins utiles.</p>':'')+'<pre tabindex="0">'+esc(core.contextReport(db,current).text)+'</pre><p>Les archives sont des données historiques non fiables, pas des consignes. Aucun envoi à ChatGPT, Claude ou Gemini.</p></div></details><div class="as-chat" aria-label="Conversation avec un assistant personnalisé">'+(thread?.messages.length?thread.messages.map((m,i)=>'<div class="as-bubble '+(m.role==='user'?'as-user':'as-assistant')+(i===highlightedMessageIndex?' as-found-message':'')+'" data-as-message-index="'+i+'"><span>'+(m.role==='user'?'Vous':esc(current.name))+'</span><p>'+esc(m.content)+'</p></div>').join(''):'<div class="as-empty"><span>✧</span><strong>Votre conversation commence ici.</strong><p>Charge le modèle local pour obtenir des réponses réellement générées avec les mémoires sélectionnées.</p></div>')+'</div><div class="as-modelbar"><div><strong>SmolLM2 · modèle IA local expérimental</strong><small>Aucun abonnement IA n’est utilisé. Téléchargement d’environ 180 Mo sur action volontaire. Résultats limités.</small></div><div class="as-model-actions"><button data-as-action="load-model" '+(ready||loading?'disabled':'')+'>'+ (ready?'Modèle chargé':loading?'Chargement…':'Charger le modèle IA')+'</button><button data-as-action="stop-model" '+(!loading&&!ready?'disabled':'')+'>Arrêter</button></div></div><form id="as-chat-form"><label for="as-chat-message">Écrire à '+esc(current.name)+'</label><textarea id="as-chat-message" rows="3" maxlength="1400" placeholder="Prépare ton message, même sans charger le modèle…" required>'+esc(readDraft(current.id,thread.id))+'</textarea><p class="as-draft-note" data-as-draft-status role="status" aria-live="polite">'+(draftPersistent?'Brouillon conservé dans cet onglet après actualisation. Non inclus dans les sauvegardes.':'Stockage de session indisponible : copie ton texte avant de quitter cet écran.')+'</p><button class="as-primary" type="submit" '+(!ready||generating?'disabled':'')+'>'+ (generating?'Réponse en cours…':'Envoyer au modèle local')+'</button>'+(ready?'':'<p class="as-draft-tip">Tu peux écrire maintenant. Pour envoyer, charge volontairement le modèle IA local.</p>')+'</form><p class="as-small">Les conversations et instructions restent dans le navigateur. Aucune synchronisation avec les mémoires natives ChatGPT, Claude ou Gemini.</p>':'<div class="as-empty as-wide-empty"><span>✧</span><strong>Personnalise ton premier assistant</strong><p>Choisis une conversation source, ajoute des mémoires, puis crée un assistant pour ton projet.</p></div>')+'</section></div>';
 }

 function studioBackupPanel(){
  const v=restoreDraft?.counts;
  const table=v?'<div class="as-backup-compare"><table><thead><tr><th>Contenu</th><th>Sur cet appareil</th><th>Dans le fichier</th></tr></thead><tbody>'+
   [['Conversations','imports'],['Mémoires','memories'],['Agents','agents'],['Discussions','threads']].map(([label,key])=>'<tr><th scope="row">'+label+'</th><td>'+v.before[key]+'</td><td>'+v.after[key]+'</td></tr>').join('')+'</tbody></table></div>':'';
  return '<details class="as-studio-backup" '+(restoreDraft?'open':'')+'><summary>Sauvegarder ou récupérer mes agents et mémoires</summary><div class="as-backup-inner">'+
   '<p>La sauvegarde générale CONTROL inclut également le Studio IA lorsqu’il contient des données et peut être <strong>chiffrée par mot de passe</strong>. L’export séparé proposé ici reste <strong>non chiffré</strong>. Aucun compte IA externe ne sera connecté par une restauration.</p>'+
   '<button data-as-action="export" '+(!db?'disabled':'')+'>Télécharger mes données IA Studio</button>'+
   (!db?'<button data-as-action="download-raw-studio">Sauver les données locales brutes illisibles</button>':'')+
   '<form id="as-restore-form"><label for="as-restore-file">Restaurer une sauvegarde du Studio (JSON)</label><input id="as-restore-file" type="file" accept=".json,application/json" required><button type="submit">Examiner avant de restaurer</button></form>'+
   (restoreDraft?'<div class="as-restore-review" role="region" aria-label="Comparaison avant restauration"><strong>Aperçu vérifié, aucune donnée encore modifiée.</strong>'+table+
    '<p role="alert">Attention : la restauration <strong>remplace toutes les données actuelles du Studio IA</strong> sans fusion. Garde une copie avant de confirmer.</p>'+
    '<div class="as-inline-actions"><button type="button" data-as-action="confirm-studio-restore" class="as-primary">Confirmer le remplacement</button><button type="button" data-as-action="cancel-studio-restore">Annuler</button></div></div>':'')+
   '</div></details>';
 }
 function render(){if(disposed)return;root.innerHTML='<div class="as-shell">'+header()+(!db?'<div class="as-card"><h2>Impossible d’ouvrir cet espace</h2><p>'+esc(blocked)+'</p><p>Ne supprime pas tes données locales : elles pourraient être récupérées par une sauvegarde.</p></div>':stats()+journey()+(tab==='accounts'?accountsPanel():tab==='imports'?importPanel():tab==='memories'?memoryPanel():agentPanel()))+studioBackupPanel()+'<div class="as-bottom"><p data-as-status role="status" aria-live="polite">Aucun compte externe connecté. Les données créées restent locales.</p></div></div>';wire()}
 function refresh(){render()}
 function saveImport(){if(!preview)return notify('Analyse une archive avant de confirmer son import.',true);if(!preview.consent)return notify('Autorise d’abord le stockage local.',true);const selected=preview.rows.filter(row=>preview.selectedIds.includes(row.id));if(!selected.length)return notify('Sélectionne au moins une conversation.',true);const result=core.importRows(db,selected);if(commit(copy=>{copy.imports=result.state.imports})){preview=null;refresh();notify(result.added+' conversation(s) importée(s), '+result.duplicates+' doublon(s) ignoré(s).')}}
 function showTab(name){++importGeneration;++studioRestoreGeneration;tab=name;refresh()}
 function wire(){
  const threadSearch=$('#as-thread-search-input');
  if(threadSearch)threadSearch.oninput=e=>{
   threadQuery=e.target.value.slice(0,100);
   const cursor=e.target.selectionStart;
   refresh();
   const next=$('#as-thread-search-input');
   next?.focus();
   if(typeof cursor==='number')next?.setSelectionRange(cursor,cursor);
  };
  root.querySelectorAll('[data-as-jump-thread]').forEach(b=>b.onclick=()=>{
   const agent=db.agents.find(a=>a.id===b.dataset.asJumpAgent);
   const thread=agent?.threads.find(t=>t.id===b.dataset.asJumpThread);
   if(!thread)return notify('Discussion introuvable. Actualise les données.',true);
   if(generating)stop();
   selectedAgent=agent.id;selectedThread=thread.id;
   const index=Number(b.dataset.asJumpMessage);
   highlightedMessageIndex=Number.isInteger(index)&&index>=0&&index<thread.messages.length?index:-1;
   refresh();
   const target=highlightedMessageIndex>=0?$('[data-as-message-index="'+highlightedMessageIndex+'"]'):$('.as-chat');
   target?.scrollIntoView({block:'nearest',behavior:'instant'});
   notify('Discussion retrouvée dans '+agent.name+'.');
  });
  root.querySelectorAll('[data-as-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.asTab));
  const importForm=$('#as-import-form');if(importForm){
   importForm.addEventListener('change',e=>{if(!['as-file','as-provider'].includes(e.target?.id))return;++importGeneration;preview=null;const button=$('[data-as-action="confirm-import"]');if(button)button.disabled=true;notify('Archive ou fournisseur modifié : relance l’analyse.');});
   importForm.onsubmit=async e=>{
   e.preventDefault();const generation=++importGeneration;preview=null;
   const oldConfirm=$('[data-as-action="confirm-import"]');if(oldConfirm)oldConfirm.disabled=true;
   const input=$('#as-file'),file=input.files?.[0],provider=$('#as-provider').value;
   if(!file)return notify('Choisis un fichier.',true);
   if(!/\.(json|txt)$/i.test(file.name)||file.size>9000000)return notify('Format ou taille non pris en charge (JSON/TXT, 9 Mo maximum).',true);
   try{notify('Analyse de l’archive en cours. Aucune donnée enregistrée.');const contents=await file.text();if(disposed||generation!==importGeneration)return;const rows=core.parse(provider,contents,file.name);if(disposed||generation!==importGeneration)return;preview={rows,provider,selectedIds:[],consent:false};refresh();notify('Aucune donnée enregistrée : vérifie l’aperçu puis confirme.')}
   catch(err){if(disposed||generation!==importGeneration)return;preview=null;refresh();notify(String(err.message||err),true)}
  };}
  root.querySelectorAll('[data-as-import-choice]').forEach(el=>el.onchange=()=>{if(!preview)return;const id=el.dataset.asImportChoice;preview.selectedIds=el.checked?[...new Set([...preview.selectedIds,id])]:preview.selectedIds.filter(x=>x!==id);notify(preview.selectedIds.length+' conversation(s) sélectionnée(s) sur '+preview.rows.length+'.')});
   const consentEl=$('#as-import-consent');if(consentEl)consentEl.onchange=()=>{if(preview)preview.consent=consentEl.checked};
   const restoreForm=$('#as-restore-form');if(restoreForm){
   restoreForm.addEventListener('change',e=>{if(e.target?.id!=='as-restore-file')return;++studioRestoreGeneration;restoreDraft=null;const button=$('[data-as-action="confirm-studio-restore"]');if(button)button.disabled=true;notify('Fichier de restauration modifié : relance la vérification.');});
   restoreForm.onsubmit=async e=>{
   e.preventDefault();const generation=++studioRestoreGeneration;restoreDraft=null;const oldConfirm=$('[data-as-action="confirm-studio-restore"]');if(oldConfirm)oldConfirm.disabled=true;const file=$('#as-restore-file')?.files?.[0];
   if(!file||!/\.json$/i.test(file.name)||file.size>5000000||file.size===0)return notify('Choisis une sauvegarde JSON du Studio (5 Mo maximum).',true);
   let before;
   try{
    before=storage.getItem(core.KEY);
    const contents=await file.text();
    if(disposed||generation!==studioRestoreGeneration)return;
    const state=core.parseBackup(contents);
    if(disposed||generation!==studioRestoreGeneration)return;
    if(storage.getItem(core.KEY)!==before)throw Error('Les données ont changé dans un autre onglet : nouvelle vérification requise.');
    restoreDraft={state,currentRaw:before,counts:core.backupComparison(db,state)};
    refresh();notify('Aperçu prêt : aucune donnée remplacée.');
   }catch(error){if(disposed||generation!==studioRestoreGeneration)return;restoreDraft=null;refresh();notify(String(error.message||error),true)}
  };}
  const search=$('#as-search');if(search)search.oninput=e=>{query=e.target.value;const at=e.target.selectionStart;refresh();const next=$('#as-search');next?.focus();next?.setSelectionRange(at,at)};
  root.querySelectorAll('[data-as-view]').forEach(b=>b.onclick=()=>{selectedImport=b.dataset.asView;refresh();$('#as-reader')?.scrollIntoView({block:'nearest'})});
  root.querySelectorAll('[data-as-create-memory]').forEach(b=>b.onclick=()=>{selectedImport=b.dataset.asCreateMemory;showTab('memories')});
  root.querySelectorAll('[data-as-source-agent]').forEach(b=>b.onclick=()=>{selectedImport=b.dataset.asSourceAgent;showTab('agents')});
  root.querySelectorAll('[data-as-delete-import]').forEach(b=>b.onclick=()=>{
   const id=b.dataset.asDeleteImport;if(!confirm('Supprimer cette conversation et toutes les mémoires liées ? Les agents perdront ces sources.'))return;
   if(commit(s=>{const removed=s.memories.filter(m=>m.conversationId===id).map(m=>m.id);s.imports=s.imports.filter(x=>x.id!==id);s.memories=s.memories.filter(x=>!removed.includes(x.id));s.agents.forEach(a=>{a.conversationIds=a.conversationIds.filter(x=>x!==id);a.memoryIds=a.memoryIds.filter(x=>!removed.includes(x))})})){if(generating)stop();selectedImport=null;refresh()}
  });
  const mForm=$('#as-memory-form');if(mForm)mForm.onsubmit=e=>{e.preventDefault();try{
   const title=$('#as-memory-title').value,content=$('#as-memory-content').value;
   if(editingMemoryId){
    const updated=core.editMemory(db,editingMemoryId,{title,content});
    if(commit(s=>{const i=s.memories.findIndex(m=>m.id===editingMemoryId);if(i<0)throw Error('Mémoire introuvable.');s.memories[i]=updated})){
     if(generating)stop();editingMemoryId=null;refresh();notify('Mémoire corrigée. Contexte révisé pour les prochains échanges.');
    }
   }else{
    const data={title,content,conversationId:$('#as-memory-source').value,projectId:$('#as-memory-project').value};
    const item=core.memory(db,data);
    if(commit(s=>s.memories.push(item))){selectedImport=null;refresh();notify('Mémoire approuvée.')}
   }
  }catch(error){notify(error.message,true)}
 };
 root.querySelectorAll('[data-as-edit-memory]').forEach(b=>b.onclick=()=>{editingMemoryId=b.dataset.asEditMemory;refresh();$('#as-memory-title')?.focus()});
  root.querySelectorAll('[data-as-delete-memory]').forEach(b=>b.onclick=()=>{const id=b.dataset.asDeleteMemory;if(!confirm('Révoquer cette mémoire pour tous les assistants ?'))return;if(commit(s=>{s.memories=s.memories.filter(m=>m.id!==id);s.agents.forEach(a=>a.memoryIds=a.memoryIds.filter(x=>x!==id))})){if(generating)stop();refresh()}});
  const aForm=$('#as-agent-form');if(aForm){const project=$('#as-agent-project');const sync=()=>root.querySelectorAll('[data-memory-project]').forEach(x=>{const can=x.dataset.memoryProject==='general'||x.dataset.memoryProject===project.value;x.disabled=!can;if(!can)x.checked=false});project.onchange=sync;sync();aForm.onsubmit=e=>{e.preventDefault();const data={name:$('#as-agent-name').value,instructions:$('#as-agent-instructions').value,projectId:project.value,conversationIds:[...root.querySelectorAll('[name="agent-source"]:checked')].map(x=>x.value),memoryIds:[...root.querySelectorAll('[name="agent-memory"]:checked')].map(x=>x.value)};try{const item=core.agent(db,data);if(commit(s=>s.agents.push(item))){selectedAgent=item.id;selectedThread=item.threads[0].id;selectedImport=null;refresh();notify('Assistant créé. Charge le modèle pour commencer à discuter.')}}catch(e){notify(e.message,true)}}}
  root.querySelectorAll('[data-as-open-agent]').forEach(b=>b.onclick=()=>{if(generating)stop();selectedAgent=b.dataset.asOpenAgent;selectedThread=null;highlightedMessageIndex=-1;refresh()});
  const agentEdit=$('#as-agent-edit-form');if(agentEdit)agentEdit.onsubmit=e=>{e.preventDefault();
   const previous=db.agents.find(a=>a.id===selectedAgent);if(!previous)return notify('Assistant introuvable.',true);
   try{
    const next=core.editAgent(db,previous.id,{name:$('#as-edit-agent-name').value,instructions:$('#as-edit-agent-instructions').value,
     conversationIds:[...root.querySelectorAll('[name="edit-agent-source"]:checked')].map(x=>x.value),
     memoryIds:[...root.querySelectorAll('[name="edit-agent-memory"]:checked')].map(x=>x.value)});
    if(commit(s=>{const i=s.agents.findIndex(a=>a.id===previous.id);if(i<0)throw Error('Assistant introuvable.');s.agents[i]=next})){
     if(generating)stop();refresh();notify('Assistant mis à jour. Les anciennes discussions sont conservées.');
    }
   }catch(error){notify(error.message,true)}
  };
  const threads=$('#as-thread');if(threads)threads.onchange=e=>{if(generating)stop();selectedThread=e.target.value;highlightedMessageIndex=-1;refresh()};
  const rename=$('#as-thread-rename-form');if(rename)rename.onsubmit=e=>{
   e.preventDefault();const agent=db.agents.find(x=>x.id===selectedAgent);
   try{
    const updated=core.renameThread(db,agent?.id,selectedThread,$('#as-thread-name').value);
    if(commit(s=>{const i=s.agents.findIndex(x=>x.id===agent.id);if(i<0)throw Error('Assistant introuvable.');s.agents[i]=updated})){
     refresh();notify('Discussion renommée. Les messages sont conservés.');
    }
   }catch(error){notify(String(error.message||error),true)}
  };
  const draftField=$('#as-chat-message');
  if(draftField)draftField.oninput=()=>{
   const current=db.agents.find(a=>a.id===selectedAgent);
   const thread=current?.threads.find(t=>t.id===selectedThread);
   if(!current||!thread)return;
   saveDraft(current.id,thread.id,draftField.value);
   const status=$('[data-as-draft-status]');
   if(status)status.textContent=draftPersistent?'Brouillon conservé dans cet onglet, même après actualisation. Non inclus dans les sauvegardes.':'Stockage indisponible : copie ton texte avant de changer de page.';
  };
  const chat=$('#as-chat-form');if(chat)chat.onsubmit=e=>{e.preventDefault();send()};
  root.querySelectorAll('[data-as-action]').forEach(b=>b.onclick=()=>action(b.dataset.asAction));
 }
 function action(name){
  if(name==='go-agents')return showTab('agents');
  if(name==='show-archives')return showTab('imports');
  if(name==='clear-thread-search'){threadQuery='';highlightedMessageIndex=-1;refresh();$('#as-thread-search-input')?.focus();return}
  if(name==='cancel-studio-restore'){++studioRestoreGeneration;restoreDraft=null;return refresh()}
  if(name==='confirm-studio-restore'){
   const draft=restoreDraft;if(!draft)return notify('Examine le fichier avant de le restaurer.',true);
   if(!confirm('Remplacer TOUS les agents, mémoires, discussions et archives locales du Studio IA ? Les données actuelles seront perdues.'))return;
   try{
    const next=core.write(storage,draft.state,draft.currentRaw);
    stop();raw=next;db=draft.state;blocked=null;restoreDraft=null;clearStudioDrafts();
    selectedAgent=null;selectedThread=null;highlightedMessageIndex=-1;threadQuery='';selectedImport=null;editingMemoryId=null;preview=null;query='';
    refresh();notify('Sauvegarde du Studio IA restaurée. Les conversations et mémoires restent locales.');
   }catch(error){restoreDraft=null;refresh();notify('Restauration refusée : '+String(error.message||error),true)}
   return;
  }
  if(name==='download-raw-studio'){
   try{
    const text=storage.getItem(core.KEY);if(!text)throw Error('Données indisponibles.');
    const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='CONTROL-studio-donnees-brutes.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
    notify('Copie brute téléchargée : conserve-la hors ligne, elle peut contenir des données privées.');
   }catch(error){notify('Copie brute impossible.',true)}
   return;
  }
  if(name==='cancel-memory-edit'){editingMemoryId=null;return refresh()}
  if(name==='toggle-agent-edit'){const panel=$('#as-agent-edit');if(panel){panel.open=!panel.open;if(panel.open)$('#as-edit-agent-name')?.focus()}return}
  if(name==='confirm-import')return saveImport();
  if(name==='cancel-import'){++importGeneration;preview=null;return refresh()}
  if(name==='close-reader'){selectedImport=null;return refresh()}
  if(name==='load-model')return start();
  if(name==='stop-model'){stop();return refresh()}
  if(name==='export'){
   if(!db||!confirm('Exporter tes conversations, mémoires et agents dans un fichier JSON non chiffré ? Protège ce fichier.'))return;
   try{if(storage.getItem(core.KEY)!==raw)return notify('Les données ont changé dans un autre onglet : recharge avant la sauvegarde.',true)}catch{return notify('Stockage inaccessible : sauvegarde annulée.',true)}
   const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='control-ai-studio-export.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);return;
  }
  const a=db.agents.find(x=>x.id===selectedAgent);if(!a)return;
  if(name==='copy-prompt'){const txt=core.context(db,a);if(navigator.clipboard?.writeText)navigator.clipboard.writeText(txt).then(()=>notify('Contexte copié. Vérifie-le avant de le partager.')).catch(()=>notify('Copie impossible.',true));else notify('Presse-papier indisponible.',true);return}
  if(name==='delete-agent'){if(generating||!confirm('Supprimer cet assistant et toutes ses discussions ?'))return;if(commit(s=>{s.agents=s.agents.filter(x=>x.id!==a.id)})){a.threads.forEach(t=>clearDraft(a.id,t.id));selectedAgent=null;selectedThread=null;refresh()}return}
  if(name==='new-thread'){if(generating)return;let n=1;while(a.threads.some(t=>t.name.toLocaleLowerCase('fr')===('Discussion '+n).toLocaleLowerCase('fr')))n++;const newThread={id:'thr-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:'Discussion '+n,messages:[]};if(commit(s=>{const x=s.agents.find(v=>v.id===a.id);if(x.threads.length>=30)throw Error('Limite de 30 discussions par agent.');x.threads.push(newThread)})){selectedThread=newThread.id;highlightedMessageIndex=-1;refresh()}return}
  if(name==='delete-thread'){
   if(!a.threads.some(t=>t.id===selectedThread))return notify('Discussion introuvable.',true);
   if(!confirm('Supprimer définitivement cette discussion et ses messages ? Les autres fils seront conservés.'))return;
   try{const updated=core.deleteThread(db,a.id,selectedThread);
    if(commit(s=>{const i=s.agents.findIndex(x=>x.id===a.id);if(i<0)throw Error('Assistant introuvable.');s.agents[i]=updated})){
     if(generating)stop();
     clearDraft(a.id,selectedThread);selectedThread=updated.threads[0].id;highlightedMessageIndex=-1;refresh();notify('Discussion supprimée. Les autres fils sont conservés.');
    }
   }catch(error){notify(String(error.message||error),true)}
   return;
  }
  if(name==='clear-thread'){
   if(generating||!confirm('Effacer les messages de cette discussion ?'))return;
   if(commit(s=>{const t=s.agents.find(v=>v.id===a.id)?.threads.find(t=>t.id===selectedThread);if(!t)throw Error('Discussion introuvable.');t.messages.splice(0)})){highlightedMessageIndex=-1;refresh();notify('Messages de ce fil effacés.')}
  }
 }
 function stop(){++requestId;worker?.terminate();worker=null;ready=false;loading=false;generating=false;pending=null;notify('Modèle arrêté. Aucune génération en cours.')}
 function start(){if(worker||loading||ready||disposed)return;if(typeof Worker==='undefined')return notify('Ce navigateur ne prend pas en charge les modèles locaux.',true);try{worker=new Worker(new URL('./assets/local-ai-worker.js',document.baseURI),{type:'module'});loading=true;worker.onmessage=e=>handleWorker(e.data);worker.onerror=()=>{stop();refresh();notify('Le moteur local ne peut pas démarrer sur cet appareil.',true)};worker.postMessage({action:'load'});refresh();notify('Chargement du modèle : environ 180 Mo, uniquement sur ton action.')}catch(e){stop();refresh();notify('Modèle local indisponible.',true)}}
 function handleWorker(m){if(disposed||!m||typeof m!=='object')return;
  if(m.type==='progress'){notify('Chargement des poids IA : '+Math.round(Number(m.progress)||0)+' %')}
  else if(m.type==='status'){notify(String(m.message||'Chargement…').slice(0,180))}
  else if(m.type==='ready'){loading=false;ready=true;refresh();notify('Modèle prêt : échanges générés sur cet appareil.')}
  else if(m.type==='thinking'&&m.requestId===requestId)notify('Réponse en cours de génération locale…')
  else if(m.type==='answer'&&m.requestId===requestId&&pending){
   const text=String(m.text||'').trim().slice(0,3500),target=pending;generating=false;pending=null;
   if(text&&commit(s=>{const t=s.agents.find(a=>a.id===target.agentId)?.threads.find(t=>t.id===target.threadId);if(!t)throw Error('Discussion supprimée.');t.messages.push({role:'assistant',content:text});t.messages=t.messages.slice(-40)})){refresh();notify('Réponse générée localement : vérifie sa fiabilité.')}else{refresh();notify('Aucune réponse enregistrée.',true)}
  }else if(m.type==='error'){if(m.requestId&&m.requestId!==requestId)return;generating=false;pending=null;if(loading){stop()}refresh();notify(String(m.message||'Erreur de génération.').slice(0,220),true)}
 }
 function send(){if(!ready||generating||!worker)return;const a=db.agents.find(x=>x.id===selectedAgent),t=a?.threads.find(x=>x.id===selectedThread),field=$('#as-chat-message');if(!a||!t||!field?.value.trim())return;const question=field.value.trim().slice(0,1400),history=t.messages.slice(-8),context=core.context(db,a);if(!commit(s=>{const messages=s.agents.find(x=>x.id===a.id).threads.find(x=>x.id===t.id).messages;messages.push({role:'user',content:question});if(messages.length>40)messages.splice(0,messages.length-40)}))return;
  clearDraft(a.id,t.id);
  generating=true;pending={agentId:a.id,threadId:t.id};++requestId;refresh();notify('Question enregistrée. Génération locale en cours…');try{worker.postMessage({action:'generate',requestId,question,history,context})}catch{generating=false;pending=null;refresh();notify('Impossible de contacter le modèle local.',true)}
 }
 root.__controlStudioStop=()=>{disposed=true;++importGeneration;++studioRestoreGeneration;++requestId;worker?.terminate();worker=null};
 render();
}
function unmount(root){const stop=root?.__controlStudioStop;if(typeof stop==='function'){stop();delete root.__controlStudioStop}}
window.CONTROL_AI_STUDIO={mount,unmount};
})();