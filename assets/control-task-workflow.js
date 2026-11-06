/* CONTROL — local task workflow: pure validation and display grouping.
   Does not request permissions, connect providers, schedule jobs, or write storage. */
(function (root) {
'use strict';
const DAY=/^\d{4}-\d{2}-\d{2}$/;
function validDue(value){
 if(value==='')return true;
 if(typeof value!=='string'||!DAY.test(value))return false;
 const d=new Date(value+'T00:00:00Z');
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;
}
function localDay(now=new Date()){
 return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
}
function searchText(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr-FR').trim();}
function category(task,today){
 if(task.status==='done')return 'done';
 if(task.status==='cancelled')return 'cancelled';
 if(validDue(task.due)&&task.due&&task.due<today)return 'overdue';
 if(validDue(task.due)&&task.due===today)return 'today';
 return 'open';
}
function rank(item,today){
 if(item.kind==='mission')return 3;
 const c=category(item,today);
 if(c==='overdue')return 0;
 if(c==='today')return 1;
 if(item.priority==='Critique')return 2;
 if(item.priority==='Haute')return 4;
 if(item.due&&validDue(item.due))return 5;
 return 6;
}
function sort(items,today=localDay()){
 return [...items].sort((a,b)=>rank(a,today)-rank(b,today)||
   (a.due&&validDue(a.due)?a.due:'9999').localeCompare(b.due&&validDue(b.due)?b.due:'9999')||
   String(a.title||'').localeCompare(String(b.title||''),'fr'));
}
// A single read-only grouping rule powers both headings and quick filters.
// Every task belongs to one group, with no duplicate DOM rows or extra storage.
const GROUPS=[
 {id:'overdue',title:'En retard',description:'Échéance dépassée, à reprendre en priorité'},
 {id:'today',title:"Aujourd’hui",description:'Tâches à réaliser dans la journée'},
 {id:'review',title:'À vérifier',description:'Résultats de missions en attente de validation'},
 {id:'next',title:'À suivre',description:'Autres tâches ouvertes et échéances à venir'},
 {id:'done',title:'Terminées',description:'Actions clôturées sur cet appareil'}
];
function bucket(item,today=localDay()){
 if(!item||typeof item!=='object')return null;
 if(item.kind==='mission')return item.status==='review'?'review':null;
 if(item.kind!=='action')return null;
 const c=category(item,today);
 if(c==='cancelled')return null;
 return c==='overdue'||c==='today'||c==='done'?c:'next';
}
function group(items,today=localDay()){
 const groups=GROUPS.map(({id,title,description})=>({id,title,description,items:[]}));
 const byId=new Map(groups.map(x=>[x.id,x]));
 for(const item of Array.isArray(items)?items:[]){
  const key=bucket(item,today);
  if(key)byId.get(key).items.push(item);
 }
 for(const entry of groups)entry.items=sort(entry.items,today);
 return groups.filter(x=>x.items.length);
}
function validateEdit(data,allowedProjects=[]){
 const title=String(data.title??'').trim();
 const due=String(data.due??'').trim();
 const priority=String(data.priority??'');
 const status=String(data.status??'');
 const project=String(data.project??'');
 const url=String(data.url??'').trim();
 if(title.length<1||title.length>180)return {ok:false,error:'Saisissez un titre de 1 à 180 caractères.'};
 if(!validDue(due))return {ok:false,error:'Date invalide : utilisez une vraie date au format AAAA-MM-JJ.'};
 if(!['Normale','Haute','Critique'].includes(priority))return {ok:false,error:'Priorité invalide.'};
 if(!['todo','doing','done'].includes(status))return {ok:false,error:'Statut invalide.'};
 if(project&&!allowedProjects.includes(project))return {ok:false,error:'Projet non reconnu. Rechargez CONTROL.'};
 if(url){
  try{
   const parsed=new URL(url);
   if(parsed.protocol!=='https:'||parsed.username||parsed.password||
      [...parsed.searchParams.keys()].some(k=>/^(access_token|token|api_key|secret|password|code)$/i.test(k)))
       return {ok:false,error:'Lien HTTPS non autorisé.'};
  }catch{return {ok:false,error:'Lien HTTPS invalide.'};}
 }
 return {ok:true,task:{title,due,priority,status,project,url}};
}
const api={validDue,localDay,searchText,category,rank,sort,bucket,group,validateEdit};
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.CONTROL_TASKS=api;
})(typeof window==='object'?window:undefined);
