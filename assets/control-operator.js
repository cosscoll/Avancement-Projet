/* CONTROL Operator UI: private local queries and explicitly confirmed local actions. */
(()=>{'use strict';
function mount(root,adapter={}){
 if(!root||root.querySelector('[data-control-operator]')||!window.CONTROL_OPERATOR_CORE)return;
 const panel=document.createElement('section');panel.className='loc-settings control-operator';panel.dataset.controlOperator='';
 panel.innerHTML='<div class="loc-chathead"><h2>Agir dans CONTROL</h2><span>Sans chargement de modèle</span></div>'+
 '<p class="loc-small">Questions sur les projets, les tâches, les missions et le calendrier enregistrés sur cet appareil. Cette interface ne commande aucun fournisseur IA externe.</p>'+
 '<label class="loc-checkbox"><input data-op-consent type="checkbox"> J’autorise la lecture de mes données CONTROL locales pour cette session.</label>'+
 '<form data-op-form><label for="control-operator-input">Ta demande</label><textarea id="control-operator-input" required maxlength="1200" rows="2" placeholder="Où en est mon projet UCP ?"></textarea><div class="loc-chat-actions"><button type="submit" class="loc-primary">Demander à CONTROL</button></div></form>'+
 '<div class="loc-chat-actions"><button type="button" data-op-example="Où en est mon projet ?">Projet</button><button type="button" data-op-example="Quelle IA travaille sur mes missions ?">Missions IA</button><button type="button" data-op-example="Mes tâches">Tâches</button><button type="button" data-op-example="Mon agenda">Agenda</button></div>'+
 '<div data-op-response class="control-operator-response" role="status" aria-live="polite"></div>'+
 '<form data-op-draft hidden><h3>Vérifier avant de confirmer</h3><p data-op-description></p><p>Projet : <strong data-op-project></strong></p>'+
 '<div class="control-operator-review" aria-live="polite"><p><strong>Cible : </strong><span data-op-target></span></p><p><strong>Avant : </strong><span data-op-before></span></p><p><strong>Après : </strong><span data-op-after></span></p><p><strong>Risque : </strong><span data-op-risk></span></p><p data-op-review-error role="alert"></p></div>'+
 '<label>Intitulé <input data-op-title maxlength="160" required></label>'+
 '<label data-op-date-wrap hidden>Date et heure locales <input data-op-date type="datetime-local"></label>'+
 '<p class="loc-small">Seules les données locales de CONTROL seront modifiées. Aucun courriel ou lien visio ne sera envoyé.</p>'+
 '<div class="loc-chat-actions"><button type="submit" class="loc-primary" data-op-confirm>Confirmer</button><button type="button" data-op-cancel>Annuler</button></div></form>';
 const anchor=root.querySelector('.loc-model');if(anchor)anchor.before(panel);else root.append(panel);
 const $=q=>panel.querySelector(q),response=$('[data-op-response]'),draft=$('[data-op-draft]'),consent=$('[data-op-consent]');
 let pending=null,busy=false,preparedScope=null,preparedProjectName=null;
 const scope=()=>typeof adapter.getScope==='function'?adapter.getScope():'general';
 const snapshot=()=>{if(typeof adapter.snapshot!=='function')throw Error('Lecture locale indisponible.');return adapter.snapshot()};
 const reset=()=>{pending=null;preparedScope=null;preparedProjectName=null;draft.hidden=true;$('[data-op-title]').readOnly=false;$('[data-op-confirm]').disabled=false};
 function draftAction(){return {...pending,title:$('[data-op-title]').value.trim(),date:$('[data-op-date]').value}}
 function review(){
  const fields=['target','before','after','risk'];
  const clear=()=>fields.forEach(key=>$('[data-op-'+key+']').textContent='');
  clear();$('[data-op-review-error]').textContent='';
  if(!pending||!consent.checked){$('[data-op-confirm]').disabled=true;return null}
  try{
   if(scope()!==preparedScope)throw Error('Le périmètre a changé. Prépare une nouvelle demande.');
   const data=snapshot(),project=data.projects.find(p=>p.id===pending.projectId);
   if(!project||project.name!==preparedProjectName)throw Error('Le projet a changé. Prépare une nouvelle demande.');
   const result=window.CONTROL_OPERATOR_CORE.reviewAction(draftAction(),data,preparedScope);
   for(const key of fields)$('[data-op-'+key+']').textContent=result[key];
   $('[data-op-confirm]').disabled=busy;
   return result;
  }catch(error){
   $('[data-op-review-error]').textContent=String(error?.message||error).slice(0,200);
   $('[data-op-confirm]').disabled=true;
   return null;
  }
 }
 function show(message,links=[]){
  response.textContent=String(message||'');
  for(const link of links){if(!/^#\/(?:control|project)\//.test(link.href))continue;const a=document.createElement('a');a.href=link.href;a.textContent=String(link.label||'Ouvrir');a.className='control-operator-link';response.append(a)}
 }
 function ask(question){
  reset();
  if(!consent.checked){show('Autorise la lecture locale pour continuer. Aucun projet n’a été consulté.');return}
  try{
   const data=snapshot(),answer=window.CONTROL_OPERATOR_CORE.interpret(question,data,scope());
   show(answer.text,answer.links);
   if(answer.kind!=='draft')return;
   // Each explicit proposal gets one stable local idempotency key (not a login credential).
   const random=window.crypto?.randomUUID?.()?.replace(/-/g,'')||
    (Date.now().toString(36)+Math.random().toString(36).slice(2).padEnd(12,'0'));
   pending={...answer.action,approvalId:'local-'+random};preparedScope=scope();const project=data.projects.find(p=>p.id===pending.projectId);
   if(!project)throw Error('Projet introuvable.');
   preparedProjectName=project.name;draft.hidden=false;$('[data-op-project]').textContent=project.name;$('[data-op-description]').textContent=answer.text;
   $('[data-op-title]').value=pending.title||((pending.type==='create_event')?'Rendez-vous':'');
   $('[data-op-title]').readOnly=['complete_action','update_event','delete_event'].includes(pending.type);
   $('[data-op-date-wrap]').hidden=!['create_event','update_event'].includes(pending.type);
   $('[data-op-date]').required=['create_event','update_event'].includes(pending.type);
   $('[data-op-date]').value=pending.date||'';
   $('[data-op-confirm]').textContent=pending.type==='complete_action'?'Marquer terminée':pending.type==='delete_event'?'Supprimer cet événement':pending.type==='update_event'?'Déplacer cet événement':'Confirmer la création';
   review();
  }catch(error){reset();show('Action indisponible : '+String(error?.message||error).slice(0,180))}
 }
 $('[data-op-form]').addEventListener('submit',e=>{e.preventDefault();ask($('[data-op-form] textarea').value.trim())});
 panel.querySelectorAll('[data-op-example]').forEach(button=>button.addEventListener('click',()=>{const q=button.dataset.opExample;$('[data-op-form] textarea').value=q;ask(q)}));
 consent.addEventListener('change',()=>{reset();show(consent.checked?'Accès local autorisé pour cette session.':'Accès retiré. Les réponses précédentes ont été effacées.')});
 $('[data-op-cancel]').addEventListener('click',()=>{reset();show('Proposition annulée. Aucune modification effectuée.')});
 for(const selector of ['[data-op-title]','[data-op-date]'])$(selector).addEventListener('input',()=>review());
 draft.addEventListener('submit',async e=>{
  e.preventDefault();if(busy||!pending)return;
  if(!consent.checked){reset();show('Autorisation retirée. Aucune action exécutée.');return}
  if(typeof adapter.execute!=='function'){show('Exécution locale indisponible.');return}
  const title=$('[data-op-title]').value.trim(),date=$('[data-op-date]').value;
  if(!title||title.length>160){show('Indique un intitulé valide.');return}
  if(['create_event','update_event'].includes(pending.type)&&!window.CONTROL_OPERATOR_CORE.validateLocalDateTime(date)){show('Indique une date et une heure valides.');return}
  const action={...pending,title,date};
  // Re-evaluate the visible diff and permissions immediately before the device-local write.
  if(!review()){show('Confirmation refusée : cible, données ou droits modifiés. Prépare une nouvelle proposition.');return}
  if(pending.type==='delete_event'&&!confirm('Confirmer la suppression définitive de cet événement local ?'))return;
  busy=true;$('[data-op-confirm]').disabled=true;
  try{
   const ok=await adapter.execute(action);if(ok!==true)throw Error('Enregistrement non confirmé.');
   if(!consent.checked||scope()!==preparedScope){reset();show('La permission a changé pendant l’enregistrement. Vérifie les données locales avant de poursuivre.');return}
   const receipt=typeof adapter.receipt==='function'?adapter.receipt():null;
   const suffix=receipt&&receipt.project===action.projectId&&typeof receipt.id==='string'?' · Reçu local : '+receipt.id:'';
   reset();show('Action enregistrée dans CONTROL sur cet appareil : '+action.title+suffix);
  }catch(error){show('Action non enregistrée : '+String(error?.message||error).slice(0,180))}
  finally{busy=false;$('[data-op-confirm]').disabled=false}
 });
}
window.CONTROL_OPERATOR={mount};
})();