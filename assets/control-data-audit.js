/* CONTROL — audit local des relations client / projet / tâche.
   Lecture seule : aucun stockage, réseau, réparation automatique ou coût.
   Résultats limités et volontairement sans détails des données privées. */
(function(root){
'use strict';
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const TASK_STATUS=new Set(['todo','doing','done','cancelled']);
const PRIORITIES=new Set(['Normale','Haute','Critique']);
const CLIENT_STATUS=new Set(['Prospect','En cours','Terminé']);
function isRecord(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)}
function validDate(x){
 if(x==='')return true;
 if(typeof x!=='string'||!DATE.test(x))return false;
 const d=new Date(x+'T00:00:00Z');
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===x;
}
function safeId(x){return typeof x==='string'&&x.length>0&&x.length<=180&&!/[\u0000-\u001f]/.test(x)}
function inspect({projects=[],clients=[],actions=[]}={}){
 const projectList=Array.isArray(projects)?projects:[];
 const clientList=Array.isArray(clients)?clients:[];
 const actionList=Array.isArray(actions)?actions:[];
 const ids=new Set(projectList.filter(isRecord).map(x=>x.id).filter(safeId));
 const clientIndex=new Map();
 const issues=[],counts={errors:0,warnings:0};
 const summary={projects:projectList.length,clients:clientList.length,tasks:actionList.length};
 function issue({kind,code,severity='warning',id='',message}){
  counts[severity==='error'?'errors':'warnings']++;
  if(issues.length<120)issues.push({kind,code,severity,id:safeId(id)?id:'',message});
 }
 function duplicates(items,kind){
  const seen=new Set();
  for(const x of items){
   if(!isRecord(x)||!safeId(x.id))continue;
   if(seen.has(x.id))issue({kind,code:'duplicate_id',severity:'error',id:x.id,message:'Identifiant répété : association à vérifier.'});
   else seen.add(x.id);
  }
 }
 if(!Array.isArray(projects))issue({kind:'project',code:'malformed_collection',severity:'error',message:'Liste des projets non valide.'});
 if(!Array.isArray(clients))issue({kind:'client',code:'malformed_collection',severity:'error',message:'Collection Clients non valide. Sauvegardez avant toute correction.'});
 if(!Array.isArray(actions))issue({kind:'task',code:'malformed_collection',severity:'error',message:'Collection Tâches non valide. Sauvegardez avant toute correction.'});
 duplicates(projectList,'project');
 for(const client of clientList){
  if(!isRecord(client)){issue({kind:'client',code:'malformed',severity:'error',message:'Fiche client non valide.'});continue;}
  const id=client.id;
  if(!safeId(id))issue({kind:'client',code:'missing_id',severity:'error',message:'Identifiant client absent ou invalide.'});
  else if(clientIndex.has(id))issue({kind:'client',code:'duplicate_id',severity:'error',id,message:'Identifiant client utilisé par plusieurs fiches.'});
  else clientIndex.set(id,client);
  if(typeof client.name!=='string'||!client.name.trim())issue({kind:'client',code:'invalid_name',severity:'error',id,message:'Nom de fiche client absent.'});
  if(client.project&&(!safeId(client.project)||!ids.has(client.project)))
   issue({kind:'client',code:'orphan_project',id,message:'Projet client introuvable dans ce navigateur.'});
  if(client.nextDue&&!validDate(client.nextDue))
   issue({kind:'client',code:'invalid_date',id,message:'Date de prochaine étape invalide.'});
  if(client.status&&!CLIENT_STATUS.has(client.status))
   issue({kind:'client',code:'unknown_status',id,message:'Statut client ancien ou inconnu.'});
 }
 duplicates(actionList,'task');
 for(const task of actionList){
  if(!isRecord(task)){issue({kind:'task',code:'malformed',severity:'error',message:'Tâche non valide.'});continue;}
  const id=task.id;
  if(!safeId(id))issue({kind:'task',code:'missing_id',severity:'error',message:'Identifiant de tâche absent ou invalide.'});
  if(typeof task.title!=='string'||!task.title.trim())
   issue({kind:'task',code:'invalid_title',severity:'error',id,message:'Intitulé de tâche absent.'});
  if(task.project&&(!safeId(task.project)||!ids.has(task.project)))
   issue({kind:'task',code:'orphan_project',id,message:'Projet de la tâche introuvable dans ce navigateur.'});
  if(task.due&&!validDate(task.due))
   issue({kind:'task',code:'invalid_date',id,message:'Date de tâche invalide.'});
  if(task.status&&!TASK_STATUS.has(task.status))
   issue({kind:'task',code:'unknown_status',id,message:'Statut de tâche ancien ou inconnu.'});
  if(task.priority&&!PRIORITIES.has(task.priority))
   issue({kind:'task',code:'unknown_priority',id,message:'Priorité de tâche ancienne ou inconnue.'});
  if(task.clientId!==undefined&&task.clientId!==null&&task.clientId!==''){
   const client=clientIndex.get(task.clientId);
   if(!client)issue({kind:'task',code:'orphan_client',severity:'error',id,message:'Client lié introuvable : sélectionner un autre client ou retirer le lien.'});
   else if(client.project&&client.project!==task.project)
    issue({kind:'task',code:'cross_project_client',severity:'error',id,message:'Le client lié appartient à un autre projet.'});
  }
 }
 return Object.freeze({
  summary:Object.freeze(summary),
  counts:Object.freeze(counts),
  issues:issues.map(Object.freeze),
  omitted:counts.errors+counts.warnings-issues.length,
  status:counts.errors?'attention':counts.warnings?'review':'clean'
 });
}
const api={validDate,inspect};
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.CONTROL_DATA_AUDIT=api;
})(typeof window==='object'?window:undefined);
