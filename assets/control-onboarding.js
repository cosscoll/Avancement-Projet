/* CONTROL 21 — Three-step onboarding grounded in actual device-local activity.
   Read-only: no remote calls, no counters manufactured, no storage writes. */
(function(root){
'use strict';
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validProject=p=>isObject(p)&&typeof p.id==='string'&&p.id.trim()&&typeof p.name==='string'&&p.name.trim();
const validTask=t=>isObject(t)&&typeof t.title==='string'&&t.title.trim();
function inspect(hub,commandRaw,hubCorrupt=false){
 if(hubCorrupt||!isObject(hub))return {status:'unavailable',visible:false,completed:0};
 let command={};
 if(commandRaw!==null&&commandRaw!==undefined&&commandRaw!==''){
  try{command=typeof commandRaw==='string'?JSON.parse(commandRaw):commandRaw}catch{return {status:'unavailable',visible:false,completed:0}}
  if(!isObject(command)||command.actions!==undefined&&!Array.isArray(command.actions))return {status:'unavailable',visible:false,completed:0};
 }
 const projects=Array.isArray(hub.custom)?hub.custom.filter(validProject):[];
 const recent=Array.isArray(hub.uxRecent)?hub.uxRecent.filter(id=>typeof id==='string'&&id.trim()):[];
 const tasks=(Array.isArray(command.actions)?command.actions:[]).filter(validTask);
 const clients=Array.isArray(command.clients)?command.clients.filter(isObject):[];
 const missions=Array.isArray(command.missions)?command.missions.filter(isObject):[];
 const projectStarted=projects.length>0||recent.length>0||tasks.some(x=>typeof x.project==='string'&&x.project.trim());
 const taskStarted=tasks.length>0;
 const taskFinished=tasks.some(x=>x.status==='done');
 // Do not push a beginner tutorial onto an established local account.
 const established=tasks.length>=3||projects.length>=2||recent.length>=3||clients.length>0||missions.length>0;
 const completed=Number(projectStarted)+Number(taskStarted)+Number(taskFinished);
 return {status:'ready',visible:!taskFinished&&!established,completed,projectStarted,taskStarted,taskFinished};
}
function render(hub,commandRaw,hubCorrupt=false){
 const progress=inspect(hub,commandRaw,hubCorrupt);
 if(!progress.visible)return '';
 const steps=[
  {title:'Créer ou ouvrir un projet',description:'Choisissez un espace pour votre travail.',href:progress.projectStarted?'#/projects':'#/new-project',done:progress.projectStarted},
  {title:'Ajouter une première tâche',description:'Définissez une action concrète à réaliser.',href:'#/control/inbox/new',done:progress.taskStarted},
  {title:'Traiter cette action',description:'Consultez vos tâches et marquez la première comme terminée.',href:'#/control/inbox',done:progress.taskFinished}
 ];
 const current=steps.findIndex(step=>!step.done);
 return '<section class="control-home-v6-onboarding" id="control-onboarding" aria-labelledby="control-onboarding-title">'+
  '<div class="control-home-v6-onboarding-head"><div><span class="control-home-v6-onboarding-kicker">PREMIERS PAS</span><h2 id="control-onboarding-title">Bien démarrer avec CONTROL</h2></div>'+
  '<span class="control-home-v6-onboarding-progress" aria-label="'+progress.completed+' étape(s) terminée(s) sur 3">'+progress.completed+' / 3 étapes</span></div>'+
  '<p class="control-home-v6-onboarding-intro">Votre premier résultat en trois étapes. Aucune connexion à un service externe n’est nécessaire.</p>'+
  '<ol class="control-home-v6-onboarding-steps">'+steps.map((step,i)=>{
   const status=step.done?'done':i===current?'current':'upcoming';
   const content='<span class="control-home-v6-onboarding-number" aria-hidden="true">'+(step.done?'✓':i+1)+'</span>'+
    '<span class="control-home-v6-onboarding-copy"><strong>'+step.title+'</strong><small>'+step.description+'</small></span>'+
    '<span class="control-home-v6-onboarding-status">'+(step.done?'Fait':i===current?'Commencer':'Ensuite')+'</span>';
   return '<li class="control-home-v6-onboarding-step is-'+status+'">'+
    (status==='upcoming'?'<div>'+content+'</div>':'<a href="'+step.href+'"'+(status==='current'?' aria-current="step"':'')+'>'+content+'</a>')+'</li>';
  }).join('')+'</ol>'+
  '<p class="control-home-v6-onboarding-footnote">La progression reflète uniquement vos projets et tâches enregistrés sur cet appareil.</p></section>';
}
const api=Object.freeze({inspect,render});
root.CONTROL_ONBOARDING=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
