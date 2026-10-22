/* CONTROL Backup Review — local, read-only comparison of an imported backup.
   No file upload, external connectivity, or mutation. A preview is not consent. */
(()=>{'use strict';
const BUCKETS=Object.freeze([
 ['actions','Actions'],['missions','Missions'],['events','Événements'],
 ['meetings','Visios'],['decisions','Décisions'],['goalPlans','Plans'],
 ['websites','Sites et brouillons'],['messages','Messages locaux'],
 ['expenses','Dépenses déclarées'],['income','Revenus déclarés']
]);
const storeKeys=Object.freeze(['control-command-v1','control-hub-v2','control-automations-v1']);
const safeObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function amount(v){return Array.isArray(v)?v.length:0}
function list(data){
 const command=safeObject(data?.command)?data.command:{};
 const hub=safeObject(data?.hub)?data.hub:{};
 const automations=safeObject(data?.automations)?data.automations:{};
 const result=BUCKETS.map(([key,label])=>({key,label,after:amount(command[key])}));
 const projectCount=safeObject(hub.projects)?Object.keys(hub.projects).length:amount(hub.projects);
 const automationCount=amount(automations.entries)||amount(automations.automations)||amount(automations.drafts);
 result.push({key:'projects',label:'Fiches projets locales',after:projectCount});
 result.push({key:'automations',label:'Brouillons de programmation',after:automationCount});
 return result;
}
function compare(next,current){
 if(!safeObject(next)||!safeObject(next.command)||!safeObject(next.hub)||!safeObject(next.automations))throw Error('Structure de sauvegarde incomplète.');
 const previous=safeObject(current)?current:{};
 const before=new Map(list(previous).map(x=>[x.key,x.after]));
 const changes=list(next).map(x=>({...x,before:before.get(x.key)||0}));
 const losses=changes.filter(x=>x.before>x.after);
 return Object.freeze({
  changes,losses,totalBefore:changes.reduce((n,x)=>n+x.before,0),
  totalAfter:changes.reduce((n,x)=>n+x.after,0),
  affected:changes.filter(x=>x.before!==x.after).length,
  note:'Un nombre identique ne garantit pas que le contenu soit identique. Les trois magasins locaux sont remplacés.'
 });
}
function snapshot(storage){
 return storeKeys.map(key=>{
  const value=storage.getItem(key);
  return value===null?null:String(value);
 });
}
function unchanged(storage,original){
 return Array.isArray(original)&&original.length===storeKeys.length&&
  storeKeys.every((key,i)=>storage.getItem(key)===original[i]);
}
window.CONTROL_BACKUP_REVIEW=Object.freeze({compare,snapshot,unchanged,storeKeys,BUCKETS});
})();