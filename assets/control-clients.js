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
function matches(client,query='',status='Tous',project=''){
 if(status!=='Tous'&&client.status!==status)return false;
 if(project&&client.project!==project)return false;
 if(!query.trim())return true;
 return normalize([client.name,client.nextStep,client.status,client.project].join(' ')).includes(normalize(query));
}
function sort(clients=[]){
 const index={Prospect:0,'En cours':1,'Terminé':2};
 return [...clients].sort((a,b)=>(index[a.status]??3)-(index[b.status]??3)||
  (a.nextDue||'9999-99-99').localeCompare(b.nextDue||'9999-99-99')||
  String(a.name||'').localeCompare(String(b.name||''),'fr'));
}
const api={statuses,validDate,normalize,safeWebsite,validate,matches,sort};
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.CONTROL_CLIENTS=api;
})(typeof window==='object'?window:undefined);
