/* CONTROL — clients légers, validation pure et filtrage local.
   Aucun connecteur, transfert réseau, compte Cloud ou automatisation. */
(function(root){
'use strict';
const statuses=Object.freeze(['Prospect','En cours','Terminé']);
const DATE=/^\d{4}-\d{2}-\d{2}$/;
function validDate(value){
 if(value==='')return true;
 if(typeof value!=='string'||!DATE.test(value))return false;
 const d=new Date(value+'T00:00:00.000Z');
 return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value;
}
function normalize(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr-FR').trim();}
function safeWebsite(value){
 if(!value)return true;
 try{
  const url=new URL(value);
  return url.protocol==='https:'&&!url.username&&!url.password&&
   ![...url.searchParams.keys()].some(key=>/^(?:access_token|token|api_key|secret|password|code)$/i.test(key));
 }catch{return false}
}
function validate(input,projects=[]){
 const name=String(input.name??'').trim();
 const project=String(input.project??'');
 const status=String(input.status??'Prospect');
 const nextStep=String(input.nextStep??'').trim();
 const nextDue=String(input.nextDue??'').trim();
 const website=String(input.website??'').trim();
 if(!name||name.length>120||/[\u0000-\u001f]/.test(name))return {ok:false,error:'Nom de client/organisation : 1 à 120 caractères.'};
 if(!statuses.includes(status))return {ok:false,error:'Statut du client invalide.'};
 if(project&&!projects.includes(project))return {ok:false,error:'Projet non reconnu. Rechargez CONTROL.'};
 if(nextStep.length>180||/[\u0000-\u001f]/.test(nextStep))return {ok:false,error:'Prochaine étape : 180 caractères maximum.'};
 if(!validDate(nextDue))return {ok:false,error:'Échéance invalide au format AAAA-MM-JJ.'};
 if(website&&(website.length>1500||!safeWebsite(website)))return {ok:false,error:'Seul un lien HTTPS public sans identifiant ou jeton est autorisé.'};
 return {ok:true,client:{name,project,status,nextStep,nextDue,website}};
}
/* A task can be linked only to an existing local client in its own project.
   A client without a project is explicitly available across all local projects. */
function clientForTask(clientId,project,clients=[]){
 if(!clientId)return {ok:true,client:null};
 if(typeof clientId!=='string'||typeof project!=='string'||!Array.isArray(clients))
  return {ok:false,error:'Association client invalide.'};
 const client=clients.find(x=>x&&x.id===clientId&&typeof x.name==='string'&&x.name.trim());
 if(!client)return {ok:false,error:'Client introuvable. Actualisez CONTROL ou retirez le lien.'};
 if(client.project&&client.project!==project)
  return {ok:false,error:'Ce client appartient à un autre projet. Corrigez le projet ou retirez le lien.'};
 return {ok:true,client};
}
function eligibleForProject(clients,project){
 return (Array.isArray(clients)?clients:[]).filter(x=>x&&typeof x.id==='string'&&x.id&&
  typeof x.name==='string'&&x.name.trim()&&(!x.project||x.project===project));
}
function tasksForClient(tasks,clientId){
 return (Array.isArray(tasks)?tasks:[]).filter(x=>x&&x.clientId===clientId&&x.status!=='cancelled'&&
  typeof x.title==='string'&&x.title.trim());
}
function matches(client,query='',status='Tous',project=''){
 if(status!=='Tous'&&client.status!==status)return false;
 if(project&&client.project!==project)return false;
 if(!query.trim())return true;
 return normalize([client.name,client.nextStep,client.status,client.project].join(' ')).includes(normalize(query));
}
// A client's follow-up state is a read-only hint, not a sent message or reminder.
function followup(client,today=new Date()){
 if(!client||typeof client!=='object'||client.status==='Terminé'||!String(client.nextStep||'').trim())
  return {kind:'none',label:'',due:''};
 const current=typeof today==='string'&&validDate(today)?today:
  [today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
 const date=client.nextDue||'';
 if(!validDate(date))return {kind:'invalid',label:'Date de relance à corriger',due:''};
 if(!date)return {kind:'unscheduled',label:'Date à planifier',due:''};
 return date<current?{kind:'overdue',label:'Relance en retard',due:date}:
  date===current?{kind:'today',label:"Relance aujourd’hui",due:date}:
  {kind:'upcoming',label:'Relance à venir',due:date};
}
function sort(clients=[]){
 const index={Prospect:0,'En cours':1,'Terminé':2};
 const priority=value=>Object.hasOwn(index,value)?index[value]:3;
 const due=x=>validDate(x?.nextDue)&&x?.nextDue?x.nextDue:'9999-99-99';
 return [...clients].sort((a,b)=>priority(a?.status)-priority(b?.status)||
  due(a).localeCompare(due(b))||
  String(a?.name||'').localeCompare(String(b?.name||''),'fr'));
}
const api={statuses,validDate,normalize,safeWebsite,validate,matches,sort,followup,clientForTask,eligibleForProject,tasksForClient};
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.CONTROL_CLIENTS=api;
})(typeof window==='object'?window:undefined);
