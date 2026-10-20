/* CONTROL IA functional delivery overview. Informational public snapshot, never a live service status. */
(()=>{'use strict';
const URL_PATH='data/control-ia-delivery.json';
const order=['not_started','in_code','ci_tested','integrated','deployed','user_verified','operational'];
const allowed=new Set(order);
const text=(tag,value,cls)=>{const element=document.createElement(tag);element.textContent=String(value??'');if(cls)element.className=cls;return element};
function inspect(data){
 if(!data||data.schema_version!==1||!Array.isArray(data.capabilities)||!data.capabilities.length)throw Error('Format du suivi invalide');
 if(!data.capabilities.every(c=>allowed.has(c.stage)&&Array.isArray(c.acceptance)))throw Error('États de livraison non reconnus');
 if(!data.capabilities.some(c=>c.id===data.focus_id))throw Error('Objectif principal introuvable');
 return data;
}
function render(section,data){
 section.replaceChildren();
 section.append(text('h2','Progression fonctionnelle de CONTROL IA'));
 section.append(text('p','Suivi public et déclaratif : le code publié et les tests automatiques ne prouvent pas qu’un parcours utilisateur est opérationnel.','control-delivery-disclaimer'));
 const total=data.capabilities.length,operational=data.capabilities.filter(c=>c.stage==='operational').length;
 const verified=data.capabilities.flatMap(c=>c.acceptance).filter(a=>a.verified).length;
 const totalCriteria=data.capabilities.reduce((sum,c)=>sum+c.acceptance.length,0);
 section.append(text('p',operational+' / '+total+' fonctionnalités opérationnelles vérifiées · '+verified+' / '+totalCriteria+' critères attestés','control-delivery-count'));
 const primary=data.capabilities.find(c=>c.id===data.focus_id);
 const focus=document.createElement('div');focus.className='control-delivery-focus';
 focus.append(text('span','OBJECTIF PRINCIPAL · '+primary.priority,'control-delivery-kicker'),text('h3',primary.name));
 focus.append(text('p','Étape actuelle : '+data.stage_labels[primary.stage]));
 focus.append(text('p','Prochaine action : '+primary.next));
 section.append(focus);
 const list=document.createElement('div');list.className='control-delivery-grid';
 for(const item of data.capabilities){
  const detail=document.createElement('details');detail.className='control-delivery-item';
  if(item.id===data.focus_id)detail.open=true;
  const summary=document.createElement('summary');
  const title=text('span',item.name,'control-delivery-name');
  const state=text('span',data.stage_labels[item.stage]||item.stage,'control-delivery-stage');
  state.dataset.stage=item.stage;
  summary.append(title,state);detail.append(summary);
  const body=document.createElement('div');body.className='control-delivery-body';
  body.append(text('p',item.summary),text('p','Étape suivante : '+item.next));
  const passed=item.acceptance.filter(a=>a.verified).length;
  body.append(text('p','Critères vérifiés : '+passed+' / '+item.acceptance.length,'control-delivery-criteria-count'));
  const ul=document.createElement('ul');
  for(const c of item.acceptance){
   const li=text('li',(c.verified?'Validé : ':'À vérifier : ')+c.label);ul.append(li);
  }
  body.append(ul);
  if(item.blockers?.length){
   body.append(text('p','Blocages identifiés :','control-delivery-label'));
   const blocking=document.createElement('ul');item.blockers.forEach(b=>blocking.append(text('li',b)));body.append(blocking);
  }
  if(item.evidence?.ci_url&&/^https:\/\/github\.com\/cosscoll\/Avancement-Projet\//.test(item.evidence.ci_url)){
   const a=document.createElement('a');a.href=item.evidence.ci_url;a.textContent='Tests techniques';a.target='_blank';a.rel='noopener noreferrer';body.append(a);
  }
  if(item.evidence?.journey_url&&/^https:\/\//.test(item.evidence.journey_url)){
   const a=document.createElement('a');a.href=item.evidence.journey_url;a.textContent='Recette utilisateur';a.target='_blank';a.rel='noopener noreferrer';body.append(a);
  }
  detail.append(body);list.append(detail);
 }
 section.append(list);
 section.append(text('p','Dernière revue de ce tableau : '+data.reviewed_on+' · Les états sont mis à jour après vérification, et non automatiquement en fonction des commits.','control-delivery-date'));
}
function renderV12(section,registry){
 if(!registry||registry.specification_version!=='1.2'||!Array.isArray(registry.tickets)||registry.tickets.length!==22||!Array.isArray(registry.scenarios)||registry.scenarios.length!==42||!Array.isArray(registry.improvements)||registry.improvements.length!==10)throw Error('Registre V1.2 incorrect');
 const div=document.createElement('section');div.className='control-delivery-v12';div.dataset.controlV12='';
 div.setAttribute('aria-label','Traçabilité des objectifs du cahier des charges V1.2');
 div.append(text('h3','Cahier des charges V1.2 : suivi des exigences'));
 div.append(text('p','Périmètre consolidé : 22 tickets de développement, 42 scénarios de recette et 10 améliorations avec 30 critères supplémentaires. Le cahier complet reste privé.','control-delivery-disclaimer'));
 const fully=registry.scenarios.filter(x=>x.verification==='real_verified').length;
 const partial=registry.scenarios.filter(x=>x.verification==='partial_mock').length;
 const count=text('p',fully+' / 42 scénarios entièrement vérifiés · '+partial+' contrôles partiels/simulés','control-delivery-v12-count');
 div.append(count);
 const focus=text('p','Priorité : identité et synchronisation CONTROL indépendantes ; aucune activation Cloud sans autorisation et vraie recette A/B.','control-delivery-v12-focus');
 div.append(focus);
 const a=document.createElement('a');a.href=new URL('data/control-ia-requirements.json',document.baseURI).href;
 a.target='_blank';a.rel='noopener noreferrer';a.textContent='Consulter le registre public des preuves et dépendances';div.append(a);
 section.append(div);
}

async function mount(root){
 if(!root||root.querySelector('[data-control-delivery]'))return;
 const section=document.createElement('section');section.className='control-delivery loc-settings';section.dataset.controlDelivery='';
 section.setAttribute('aria-label','Avancement fonctionnel de CONTROL IA');
 section.append(text('p','Chargement du suivi des fonctionnalités…','control-delivery-disclaimer'));
 const anchor=root.querySelector('.loc-heading');if(anchor)anchor.after(section);else root.prepend(section);
 try{
  const response=await fetch(new URL(URL_PATH,document.baseURI),{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw Error('Lecture indisponible ('+response.status+')');
  const data=inspect(await response.json());
  if(root.contains(section))render(section,data);
  if(root.contains(section)){
   try{
    const requirementsResponse=await fetch(new URL('data/control-ia-requirements.json',document.baseURI),{cache:'no-store',credentials:'omit'});
    if(!requirementsResponse.ok)throw Error('Registre inaccessible');
    renderV12(section,await requirementsResponse.json());
   }catch{
    section.append(text('p','Registre V1.2 indisponible : la vérification détaillée des exigences n’est pas confirmée.','control-delivery-error'));
   }
  }
 }catch(error){
  if(!root.contains(section))return;
  section.replaceChildren(text('h2','Progression fonctionnelle de CONTROL IA'),text('p','Suivi temporairement indisponible. Aucun état ne peut être confirmé depuis cette interface.','control-delivery-error'));
 }
}
window.CONTROL_DELIVERY={mount,inspect};
})();