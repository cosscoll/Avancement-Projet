/* CONTROL — Commandement multi-IA.
 * A mission and its reported results are explicitly differentiated from
 * real provider execution. This module contains NO tokens, APIs or secrets.
 */
(()=>{'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const supported=['Claude','Gemini'];
const home={Claude:'https://claude.ai/',Gemini:'https://gemini.google.com/'};
const handlers=new WeakMap();
const statuses={todo:'À envoyer',doing:'En cours (déclaré)',review:'À vérifier',done:'Validé par vous',error:'Échec signalé'};
const time=s=>{try{return s?new Date(s).toLocaleString('fr-FR'):'Date non renseignée'}catch{return'Date non renseignée'}};
const u=s=>{try{const t=new URL(s);return t.protocol==='https:'&&!t.username&&!t.password&&!Array.from(t.searchParams.keys()).some(x=>/^(code|api_key|access_token|token|password|secret)$/i.test(x))?t.href:''}catch{return''}};
const clean=(s,max)=>String(s||'').trim().slice(0,max);
function missionPrompt(project,task,provider){
 return 'MISSION CONTROL — '+provider+'\nPROJET : '+(project?.name||'Projet sans nom')+'\n'+(project?.description?'CONTEXTE DU PROJET : '+clean(project.description,1200)+'\n':'')+
  '\nOBJECTIF\n'+clean(task,6000)+'\n\nCONSIGNES\n'+
  '- Travaille uniquement sur les fichiers et informations auxquels tu as été autorisé.\n'+
  '- Ne prétends jamais avoir ouvert un dépôt, exécuté un test ou publié un site sans preuve.\n'+
  '- Aucun achat, dépense, déploiement, changement de compte ou modification GitHub sans validation humaine.\n'+
  '- Identifie les blocages plutôt que d’inventer un résultat.\n'+
  '- Fournis une réponse structurée : 1. Résumé 2. Livrables 3. Liens ou preuves 4. Tests réellement exécutés 5. Risques 6. Étapes suivantes.\n'+
  '- Ne reproduis pas de mot de passe, clé API ou jeton de session.\n';
}
function unmount(root){if(root){handlers.get(root)?.abort();handlers.delete(root)}}
function ui(root,adapter={}){
 if(!root)return;
 handlers.get(root)?.abort();
 const listeners=new AbortController();handlers.set(root,listeners);
 const projects=(typeof adapter.projects==='function'?adapter.projects():adapter.projects||[]).filter(p=>p?.id&&p?.name).slice(0,150);
 let projectId=projects.find(x=>x.id===adapter.projectId)?.id||projects[0]?.id||'';
 let selected={Claude:true,Gemini:true},selectedRun='',busy=false;
 const opts=()=>projects.map(p=>'<option value="'+E(p.id)+'" '+(p.id===projectId?'selected':'')+'>'+E(p.name)+'</option>').join('');
 root.innerHTML='<div class="cmd-shell"><div class="cmd-top"><div><span class="cmd-eyebrow">CONTROL / CENTRE DE COMMANDE</span><h1>Commander mes IA</h1><p>Une mission, deux IA, tous les résultats réunis au même endroit.</p></div><span class="cmd-tag">Claude + Gemini</span></div>'+
 '<div class="cmd-hint"><strong>État des connexions :</strong> la liaison API directe n’est pas encore activée. Tu peux préparer une mission, l’envoyer via le site officiel et enregistrer son résultat ici. « Terminé » signifie validé dans CONTROL, pas vérifié automatiquement auprès du fournisseur.</div>'+
 (projects.length?'<div class="cmd-builder"><label>Projet<select id="cmd-project" class="cmd-input">'+opts()+'</select></label><label>Mission à confier<textarea id="cmd-task" class="cmd-input" rows="4" maxlength="6000" placeholder="Ex. Compare l’architecture du projet et propose des améliorations concrètes…"></textarea></label><div class="cmd-toggle"><span>IA destinataires</span><label><input type="checkbox" data-ai="Claude" checked> Claude</label><label><input type="checkbox" data-ai="Gemini" checked> Gemini</label></div><button id="cmd-prepare" type="button" class="cmd-primary">Préparer les missions</button><p class="cmd-small">Aucune commande n’est envoyée ni facturée par ce bouton.</p></div>':'<div class="cmd-hint">Crée d’abord un projet CONTROL pour y associer des missions.</div>')+
 '<section class="cmd-main"><div class="cmd-sectiontop"><h2>Avancement par IA</h2><span id="cmd-count"></span></div><div id="cmd-results"></div></section>'+
 '<section class="cmd-guide"><details><summary>Comment fonctionne la centralisation ?</summary><p>Les missions créées depuis CONTROL sont enregistrées par projet. Les réponses Claude et Gemini sont importées dans leurs fiches respectives : elles ne sont ni inventées ni récupérées dans tes anciennes conversations privées. Une connexion API sécurisée pourra plus tard envoyer les demandes et enregistrer les réponses automatiquement dans CONTROL, mais uniquement après activation explicite.</p></details></section>'+
 '<p id="cmd-message" role="status" aria-live="polite" class="cmd-message"></p></div>';
 const one=s=>root.querySelector(s);
 const alert=(msg,bad=false)=>{const el=one('#cmd-message');if(el){el.textContent=msg;el.className='cmd-message'+(bad?' cmd-error':'')}};
 const getRuns=()=>typeof adapter.listMissions==='function'?adapter.listMissions(projectId).filter(m=>supported.includes(m.provider)):[],
  current=()=>projects.find(p=>p.id===projectId)||null;
 const icon=t=>t==='Claude'?'C':'G';
 const countText=rows=>{const groups=Object.fromEntries(supported.map(provider=>[provider,rows.filter(x=>x.provider===provider)]));
  return supported.map(p=>p+': '+groups[p].length+' mission(s)').join(' · ')};
 function paint(){
  const rows=getRuns().slice().sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0));
  one('#cmd-count').textContent=countText(rows);
  if(!rows.length){one('#cmd-results').innerHTML='<p class="cmd-empty">Aucune mission pour ce projet. Définis un objectif puis sélectionne Claude et/ou Gemini.</p>';return}
  one('#cmd-results').innerHTML='<div class="cmd-columns">'+supported.map(provider=>{
   const items=rows.filter(m=>m.provider===provider);
   return '<section class="cmd-column"><div class="cmd-provider"><span class="cmd-avatar">'+icon(provider)+'</span><div><strong>'+provider+'</strong><small>'+items.length+' mission(s) enregistrée(s)</small></div></div>'+
    (items.length?items.map(m=>{
     const open=selectedRun===m.id;
     const link=u(m.url||adapter.providerURL?.(projectId,provider)||home[provider]);
     const origin=m.resultOrigin==='api'?'Réponse reçue via API (contenu à vérifier)':m.result?'Résultat saisi manuellement':'Aucun résultat remonté';
     return '<article class="cmd-item"><div class="cmd-item-head"><strong>'+E(m.title)+'</strong><span class="cmd-status">'+E(statuses[m.status]||'Statut non vérifié')+'</span></div><small class="cmd-meta">'+E(time(m.updatedAt))+' · '+E(origin)+'</small>'+
      '<div class="cmd-actions"><button type="button" data-copy="'+E(m.id)+'">Copier la mission</button>'+(adapter.canDispatch?.()&&m.status==='todo'?'<button type="button" class="cmd-api" data-dispatch="'+E(m.id)+'">Envoyer via API (validation requise)</button>':'')+(link?'<a href="'+E(link)+'" target="_blank" rel="noopener noreferrer">Ouvrir '+provider+' ↗</a>':'')+'<button type="button" data-edit="'+E(m.id)+'">'+(open?'Fermer':'Suivre / Résultat')+'</button></div>'+
      (m.result?'<details class="cmd-actual-result"><summary>Lire le résultat enregistré</summary><pre>'+E(m.result)+'</pre>'+(m.proofUrl&&u(m.proofUrl)?'<p><a href="'+E(u(m.proofUrl))+'" target="_blank" rel="noopener noreferrer">Preuve / livrable ↗</a></p>':'')+'</details>':'')+
      (open?'<form class="cmd-resultform" data-result="'+E(m.id)+'"><label>Statut déclaré<select name="status" class="cmd-input">'+Object.entries(statuses).map(([v,label])=>'<option value="'+v+'" '+(m.status===v?'selected':'')+'>'+E(label)+'</option>').join('')+'</select></label><label>Résultat de cette IA<textarea name="result" class="cmd-input" rows="6" maxlength="14000" placeholder="Copie la réponse obtenue…">'+E(m.result||'')+'</textarea></label><label>URL de preuve (facultatif)<input class="cmd-input" type="url" name="proof" maxlength="2000" placeholder="https://…" value="'+E(m.proofUrl||'')+'"></label><button type="submit" class="cmd-primary">Enregistrer le suivi</button><p class="cmd-small">Une réponse copiée est marquée « saisie manuellement », pas « récupérée automatiquement ».</p></form>':'')+
      '</article>'
    }).join(''):'<p class="cmd-empty">Pas encore de mission '+provider+'.</p>')+'</section>';
  }).join('')+'</div>';
 }
 const copy=async content=>{try{await navigator.clipboard.writeText(content);alert('Mission copiée. Ouvre l’IA pour l’exécuter.')}catch{alert('Copie indisponible dans ce navigateur.',true)}};
 if(projects.length)one('#cmd-project').addEventListener('change',e=>{projectId=e.target.value;selectedRun='';paint()});
 root.addEventListener('change',e=>{const ai=e.target.closest('[data-ai]');if(ai)selected[ai.dataset.ai]=ai.checked},{signal:listeners.signal});
 one('#cmd-prepare')?.addEventListener('click',async()=>{
  if(busy)return;const objective=clean(one('#cmd-task')?.value,6000);if(!projectId||objective.length<12){alert('Choisis un projet et décris un objectif d’au moins 12 caractères.',true);return}
  const providers=supported.filter(x=>selected[x]);if(!providers.length){alert('Choisis au moins une IA.',true);return}
  if(!adapter.createMission){alert('Enregistrement indisponible : cet espace n’a pas de stockage associé.',true);return}
  busy=true;one('#cmd-prepare').disabled=true;let count=0;
  try{
   for(const provider of providers){const prompt=missionPrompt(current(),objective,provider);
    const created=await adapter.createMission({projectId,provider,title:objective.slice(0,120),prompt});if(created!==false)count++;
   }
   one('#cmd-task').value='';alert(count+' mission(s) préparée(s) dans CONTROL. Pour les envoyer actuellement, copie leurs instructions et ouvre chaque IA.');paint();
  }catch(e){alert('Enregistrement partiel possible : '+(e?.message||'échec')+'. Vérifie les missions avant de recommencer.',true);paint()}
  finally{busy=false;one('#cmd-prepare').disabled=false}
 });
 root.addEventListener('click',async e=>{
  const send=e.target.closest('[data-dispatch]');
  if(send){
   const m=getRuns().find(x=>x.id===send.dataset.dispatch);
   if(!m||!adapter.canDispatch?.()||!adapter.dispatchMission||busy)return;
   if(!confirm('Envoyer cette mission à '+m.provider+' via son API ? Cet appel peut entraîner une consommation facturée selon les quotas du fournisseur. Annuler si aucun coût n’est autorisé.'))return;
   busy=true;send.disabled=true;
   try{await adapter.dispatchMission(m);alert('Commande envoyée. Le résultat disponible sera affiché avec la mention « Réponse reçue via API (contenu à vérifier) ».');paint()}
   catch(error){alert(error?.message||'Appel IA indisponible.',true);paint()}
   finally{busy=false}return;
  }
  const edit=e.target.closest('[data-edit]');if(edit){selectedRun=selectedRun===edit.dataset.edit?'':edit.dataset.edit;paint();return}
  const cp=e.target.closest('[data-copy]');if(cp){const m=getRuns().find(x=>x.id===cp.dataset.copy);if(m)copy(m.prompt);return}
 },{signal:listeners.signal});
 root.addEventListener('submit',async e=>{
  const form=e.target.closest('[data-result]');if(!form)return;e.preventDefault();
  if(busy)return;const id=form.dataset.result,m=getRuns().find(x=>x.id===id);if(!m||!adapter.updateMission){alert('Mission introuvable.',true);return}
  const fd=new FormData(form),status=String(fd.get('status')||''),result=String(fd.get('result')||'').trim(),proof=String(fd.get('proof')||'').trim();
  if(!statuses[status]||result.length>14000||proof.length>2000||proof&&(!u(proof))){alert('Statut, réponse ou lien de preuve invalide.',true);return}
  if(status==='done'&&!result){alert('Un résultat est nécessaire avant de marquer une mission comme validée.',true);return}
  busy=true;try{await adapter.updateMission(m,{status,result,proofUrl:proof,resultOrigin:'manual'});selectedRun='';alert('Suivi enregistré pour '+m.provider+'. Il ne reflète pas automatiquement son historique natif.');paint()}
  catch(error){alert(error?.message||'Enregistrement impossible.',true)}
  finally{busy=false}
 },{signal:listeners.signal});
 paint();
}
window.CONTROL_MULTI_AI={mount:ui,unmount,missionPrompt};
})();
