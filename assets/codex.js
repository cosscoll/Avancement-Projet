/* CONTROL — Passerelle Codex manuelle, sans jeton et sans dépenses API.
   N'exécute aucune tâche Codex : l'utilisateur copie puis soumet lui-même dans l'app ChatGPT.
   Les PR sont la réalité du dépôt GitHub (tous auteurs), pas l'état d'exécution de Codex. */
(()=>{
'use strict';
const OWNER='cosscoll';
const LOGIN='https://chatgpt.com/';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const items=[];
let inited=false;
const validRepo=s=>/^[A-Za-z0-9_.-]{1,100}$/.test(s||'');
const safeCodexLink=s=>{try{const u=new URL(String(s||''));return u.protocol==='https:'&&u.hostname==='chatgpt.com'&&!u.username&&!u.password&&/^\/codex(?:\/|$)/.test(u.pathname)?u.href:''}catch{return''}};
function saved(id){try{return safeCodexLink(localStorage.getItem('control-codex-task-'+id))}catch{return''}}
function projectOptions(all){return all.filter(x=>validRepo(x.repo)).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')}
function getProjects(ctx){return [...ctx.projects,...ctx.catalog,...ctx.custom].filter(x=>x&&validRepo(x.repo))}
function selected(){return items.find(x=>x.id===$('#codex-project')?.value)}
function promptText(p,request){
 const lines=[
  'MISSION CODEX — '+p.name,
  'Dépôt GitHub : https://github.com/'+OWNER+'/'+p.repo,
  '',
  'Demande :',
  request.trim(),
  '',
  'Consignes :',
  '- Vérifie le code et les instructions du dépôt avant de modifier quoi que ce soit.',
  '- Travaille uniquement sur ce dépôt, sans modifier les autres projets.',
  '- Donne d’abord un plan bref et signale les dépendances bloquantes.',
  '- Implémente la demande et exécute les tests possibles.',
  '- Aucun paiement, achat de crédits, service payant ni ajout de secret.',
  '- Ne déploie pas et ne fusionne pas automatiquement sans mon accord explicite.',
  '- Fournis un compte rendu : fichiers changés, tests passés/échoués, limites, suite.',
  '- Propose une pull request GitHub pour me permettre de vérifier le résultat.'
 ];
 return lines.join('\n');
}
function notice(txt){const el=$('#codex-message');if(el){el.textContent=txt;el.hidden=false}}
function linkSection(p){
 const link=saved(p.id);
 return '<div class="codex-tasklink"><label for="codex-task-url">Lien d’une tâche Codex existante (facultatif)</label>'+
 '<div class="codex-task-row"><input id="codex-task-url" type="url" inputmode="url" placeholder="https://chatgpt.com/codex/…" value="'+esc(link)+'">'+
 '<button class="btn" type="button" id="codex-save-link">Enregistrer ici</button></div>'+
 (link?'<a class="external" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Reprendre cette tâche Codex ↗</a>':'<p class="small muted">Aucun lien de tâche enregistré sur cet appareil.</p>')+
 '<p class="small muted">Enregistrement local sur ce téléphone uniquement : ne colle jamais de jeton ni de secret.</p></div>';
}
async function loadPR(p){
 const output=$('#codex-pr-list');if(!output)return;
 if(!p){output.innerHTML='<p class="muted small">Sélectionne un projet ayant un dépôt GitHub.</p>';return}
 output.innerHTML='<p class="muted small">Chargement des demandes de fusion publiques…</p>';
 try{
  const res=await fetch('https://api.github.com/repos/'+OWNER+'/'+encodeURIComponent(p.repo)+'/pulls?state=all&sort=updated&direction=desc&per_page=8',{headers:{Accept:'application/vnd.github+json'}});
  if(!res.ok)throw Error('GitHub '+res.status);
  const prs=await res.json();if(!Array.isArray(prs))throw Error('Réponse inattendue');
  if($('#codex-project')?.value!==p.id)return;
  output.innerHTML=prs.length?prs.map(pr=>{
    const link=typeof pr.html_url==='string'&&pr.html_url.startsWith('https://github.com/'+OWNER+'/'+p.repo+'/pull/')?pr.html_url:null;
    if(!link)return'';
    const state=pr.merged_at?'Fusionnée':pr.state==='open'?'À examiner':'Fermée';
    const date=pr.updated_at?new Date(pr.updated_at).toLocaleDateString('fr-FR'):'Date inconnue';
    return '<a class="codex-pr-item" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer"><strong>'+esc(pr.title||'Pull request')+'</strong><span>'+esc(state)+' · '+esc(date)+' · #'+Number(pr.number)+'</span><span>Voir les changements et discussions ↗</span></a>';
   }).join(''):'<p class="muted small">Aucune pull request publique trouvée pour ce dépôt.</p>';
 }catch{
  if($('#codex-project')?.value===p.id)output.innerHTML='<p class="muted small">Les PR ne sont pas accessibles actuellement. Ouvre le dépôt GitHub pour consulter les résultats.</p>';
 }
}
function preview(){
 const p=selected(),input=$('#codex-instruction'),result=$('#codex-prompt');
 if(!p||!result||!input)return;
 result.textContent=promptText(p,input.value.trim()||'[Décris ici la tâche souhaitée.]');
 const link=$('#codex-repository');
 if(link){link.href='https://github.com/'+OWNER+'/'+encodeURIComponent(p.repo)+'/pulls';link.textContent='Toutes les pull requests de '+p.name+' ↗'}
 const slot=$('#codex-task-container');if(slot)slot.innerHTML=linkSection(p);
 const output=$('#codex-message');if(output)output.hidden=true;
}
function render(ctx){
 items.length=0;items.push(...getProjects(ctx));
 const current=items.some(x=>x.id===ctx.currentId)?ctx.currentId:(items[0]?.id||'');
 return '<div class="page-head"><div><div class="page-eyebrow">PILOTAGE MOBILE / CODEX CLOUD</div><h1 class="page-title">Codex</h1>'+
 '<p class="page-description">Prépare une mission depuis CONTROL, exécute-la dans Codex Cloud, puis examine les résultats et pull requests GitHub.</p></div>'+
 '<a href="'+LOGIN+'" class="btn primary" target="_blank" rel="noopener noreferrer">Ouvrir ChatGPT / Codex ↗</a></div>'+
 '<section class="hint"><strong>Connexion assistée, pas encore directe.</strong> CONTROL n’exécute pas Codex et ne lit pas son historique privé. Tu dois copier la demande puis la soumettre dans Codex Cloud avec ton compte ChatGPT. Ce fonctionnement ne requiert aucune clé API ni dépense supplémentaire.</section>'+
 '<div class="layout codex-layout"><div class="stack"><section class="panel codex-compose"><div class="panel-heading"><h2>1 · Commander une mission</h2></div>'+
 '<label for="codex-project">Projet cible</label><select id="codex-project">'+projectOptions(items)+'</select>'+
 '<label for="codex-instruction">Ce que Codex doit réaliser</label><textarea id="codex-instruction" rows="6" maxlength="12000" placeholder="Ex. Corriger le menu mobile, tester le responsive, préparer une pull request."></textarea>'+
 '<div class="codex-actions"><button id="codex-copy" class="btn primary" type="button">Copier la mission</button>'+
 '<a class="btn" href="'+LOGIN+'" target="_blank" rel="noopener noreferrer">Ouvrir Codex ↗</a></div>'+
 '<p id="codex-message" class="small" role="status" hidden></p>'+
 '<details class="info-disclosure codex-details"><summary>Voir le message complet à transmettre</summary><pre id="codex-prompt" class="codex-prompt"></pre></details>'+
 '<p class="small muted">Aucun envoi automatique. Ne transmets pas de mot de passe ou de clé. Le lancement de la tâche consomme ton quota Codex uniquement lorsque tu la soumets dans Codex.</p>'+
 '</section></div><aside class="stack"><section class="panel"><div class="panel-heading"><h2>2 · Suivre les résultats</h2></div>'+
 '<p class="small muted">Les conversations et résultats non publiés restent dans Codex. Ci-dessous : les dernières pull requests du dépôt, <strong>quel que soit leur auteur</strong> ; elles ne prouvent pas une exécution Codex.</p>'+
 '<a id="codex-repository" class="external" target="_blank" rel="noopener noreferrer" href="https://github.com/'+OWNER+'">Ouvrir les pull requests GitHub ↗</a>'+
 '<div id="codex-pr-list" class="codex-pr-list" aria-live="polite"></div></section>'+
 '<section class="panel"><h2>3 · Reprendre une tâche</h2><div id="codex-task-container"></div></section>'+
 '</aside></div>';
}
function bind(ctx){
 const selector=$('#codex-project');if(!selector)return;
 const target=items.some(x=>x.id===ctx.currentId)?ctx.currentId:(items[0]?.id||'');selector.value=target;
 selector.addEventListener('change',()=>{preview();loadPR(selected())});
 $('#codex-instruction')?.addEventListener('input',preview);
 $('#codex-copy')?.addEventListener('click',async()=>{
   const p=selected(),v=$('#codex-instruction').value.trim();
   if(!p||!v){notice('Sélectionne un projet et décris la mission avant de copier.');return}
   const task=promptText(p,v);
   try{await navigator.clipboard.writeText(task);notice('Mission copiée. Ouvre Codex et colle-la dans une nouvelle tâche de cet environnement.')}catch{
    const pre=$('#codex-prompt');if(pre){pre.textContent=task;const section=pre.closest('details');if(section)section.open=true}
    notice('Copie le texte affiché dans « message complet », puis colle-le dans Codex.');
   }
 });
 $('#codex-task-container')?.addEventListener('click',e=>{
  const btn=e.target.closest('#codex-save-link');if(!btn)return;
  const p=selected(),raw=$('#codex-task-url')?.value.trim()||'',valid=safeCodexLink(raw);
  if(!p)return;
  if(raw&&!valid){notice('Adresse refusée : utilise un lien vers une tâche sur chatgpt.com/codex/…');return}
  try{
   if(valid)localStorage.setItem('control-codex-task-'+p.id,valid);
   else localStorage.removeItem('control-codex-task-'+p.id);
   preview();notice('Lien enregistré seulement dans le navigateur de ce téléphone.');
  }catch{notice('Impossible d’enregistrer ce lien sur cet appareil.')}
 });
 preview();loadPR(selected());
}
window.CONTROL_CODEX={render,bind};
})();
