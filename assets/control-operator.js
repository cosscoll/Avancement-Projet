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
 '<label>Intitulé <input data-op-title maxlength="160" required></label>'+
 '<label data-op-date-wrap hidden>Date et heure locales <input data-op-date type="datetime-local"></label>'+
 '<p class="loc-small">Seules les données locales de CONTROL seront modifiées. Aucun courriel ou lien visio ne sera envoyé.</p>'+
 '<div class="loc-chat-actions"><button type="submit" class="loc-primary" data-op-confirm>Confirmer</button><button type="button" data-op-cancel>Annuler</button></div></form>';
 const anchor=root.querySelector('.loc-model');if(anchor)anchor.before(panel);else root.append(panel);
 const $=q=>panel.querySelector(q),response=$('[data-op-response]'),draft=$('[data-op-draft]'),consent=$('[data-op-consent]');
 let pending=null,busy=false;
 const scope=()=>typeof adapter.getScope==='function'?adapter.getScope():'general';
 const snapshot=()=>{if(typeof adapter.snapshot!=='function')throw Error('Lecture locale indisponible.');return adapter.snapshot()};
 const reset=()=>{pending=null;draft.hidden=true;$('[data-op-title]').readOnly=false};
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
   pending=answer.action;const project=data.projects.find(p=>p.id===pending.projectId);
   if(!project)throw Error('Projet introuvable.');
   draft.hidden=false;$('[data-op-project]').textContent=project.name;$('[data-op-description]').textContent=answer.text;
   $('[data-op-title]').value=pending.title||((pending.type==='create_event')?'Rendez-vous':'');
   $('[data-op-title]').readOnly=['complete_action','update_event','delete_event'].includes(pending.type);
   $('[data-op-date-wrap]').hidden=!['create_event','update_event'].includes(pending.type);
   $('[data-op-date]').required=['create_event','update_event'].includes(pending.type);
   $('[data-op-date]').value=pending.date||'';
   $('[data-op-confirm]').textContent=pending.type==='complete_action'?'Marquer terminée':pending.type==='delete_event'?'Supprimer cet événement':pending.type==='update_event'?'Déplacer cet événement':'Confirmer la création';
  }catch(error){reset();show('Action indisponible : '+String(error?.message||error).slice(0,180))}
 }
 $('[data-op-form]').addEventListener('submit',e=>{e.preventDefault();ask($('[data-op-form] textarea').value.trim())});
 panel.querySelectorAll('[data-op-example]').forEach(button=>button.addEventListener('click',()=>{const q=button.dataset.opExample;$('[data-op-form] textarea').value=q;ask(q)}));
 consent.addEventListener('change',()=>{reset();show(consent.checked?'Accès local autorisé pour cette session.':'Accès retiré. Les réponses précédentes ont été effacées.')});
 $('[data-op-cancel]').addEventListener('click',()=>{reset();show('Proposition annulée. Aucune modification effectuée.')});
 draft.addEventListener('submit',async e=>{
  e.preventDefault();if(busy||!pending)return;
  if(!consent.checked){reset();show('Autorisation retirée. Aucune action exécutée.');return}
  if(typeof adapter.execute!=='function'){show('Exécution locale indisponible.');return}
  const title=$('[data-op-title]').value.trim(),date=$('[data-op-date]').value;
  if(!title||title.length>160){show('Indique un intitulé valide.');return}
  if(['create_event','update_event'].includes(pending.type)&&!window.CONTROL_OPERATOR_CORE.validateDate(date)){show('Indique une date et une heure valides.');return}
  if(pending.type==='delete_event'&&!confirm('Supprimer cet événement de CONTROL ? Cette action ne peut pas être annulée dans le chat.'))return;
  const action={...pending,title,date};
  const data=snapshot();
  if(!data.projects.some(p=>p.id===action.projectId)){reset();show('Projet introuvable. Action refusée.');return}
  if(scope()!=='general'&&scope()!==action.projectId){reset();show('Le projet sélectionné a changé. Action refusée.');return}
  busy=true;$('[data-op-confirm]').disabled=true;
  try{const ok=await adapter.execute(action);if(ok!==true)throw Error('Enregistrement non confirmé.');reset();show('Action enregistrée dans CONTROL sur cet appareil : '+action.title)}
  catch(error){show('Action non enregistrée : '+String(error?.message||error).slice(0,180))}
  finally{busy=false;$('[data-op-confirm]').disabled=false}
 });
}
window.CONTROL_OPERATOR={mount};
})();