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
// Serialized data comes from verified JSON, never an executable object source.
// Compare records only by unique stable IDs. Legacy rows without IDs remain "unknown".
function canonical(value,depth=0){
 if(depth>80)throw Error('Arbre trop profond pour une comparaison fiable.');
 if(Array.isArray(value))return '['+value.map(x=>canonical(x,depth+1)).join(',')+']';
 if(safeObject(value))return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k],depth+1)).join(',')+'}';
 return JSON.stringify(value);
}
function compareRecords(after,before){
 const a=Array.isArray(after)?after:[],b=Array.isArray(before)?before:[];
 const keyed=items=>{
  const ids=items.map(x=>safeObject(x)&&typeof x.id==='string'&&x.id.length>0&&x.id.length<=128?x.id:null);
  return ids.every(Boolean)&&new Set(ids).size===ids.length;
 };
 if(!keyed(a)||!keyed(b)){
  return {added:Math.max(0,a.length-b.length),removed:Math.max(0,b.length-a.length),modified:null,uncertain:!!(a.length&&b.length)};
 }
 const x=new Map(a.map(row=>[row.id,row])),y=new Map(b.map(row=>[row.id,row]));
 let added=0,removed=0,modified=0,uncertain=false;
 for(const id of x.keys())if(!y.has(id))added++;
 for(const id of y.keys())if(!x.has(id))removed++;
 for(const [id,row] of x)if(y.has(id)){
  try{if(canonical(row)!==canonical(y.get(id)))modified++}catch{uncertain=true}
 }
 return {added,removed,modified:uncertain?null:modified,uncertain};
}
function compare(next,current){
 if(!safeObject(next)||!safeObject(next.command)||!safeObject(next.hub)||!safeObject(next.automations))throw Error('Structure de sauvegarde incomplète.');
 const previous=safeObject(current)?current:{};
 const before=new Map(list(previous).map(x=>[x.key,x.after]));
 const changes=list(next).map(x=>{
  const oldCount=before.get(x.key)||0;
  if(BUCKETS.some(b=>b[0]===x.key)){
   return {...x,before:oldCount,...compareRecords(next.command[x.key],previous.command?.[x.key])};
  }
  // Hub/project settings and automation schema vary between CONTROL versions:
  // counts are estimates, never fabricate record-level certainty for these sources.
  return {...x,before:oldCount,added:Math.max(0,x.after-oldCount),removed:Math.max(0,oldCount-x.after),modified:null,uncertain:!!(oldCount&&x.after)};
 });
 const losses=changes.filter(x=>x.removed>0);
 const modified=changes.filter(x=>x.modified>0);
 const uncertain=changes.filter(x=>x.uncertain);
 return Object.freeze({
  changes,losses,modified,uncertain,
  totalBefore:changes.reduce((n,x)=>n+x.before,0),
  totalAfter:changes.reduce((n,x)=>n+x.after,0),
  totalRemoved:changes.reduce((n,x)=>n+x.removed,0),
  totalModified:changes.reduce((n,x)=>n+(x.modified||0),0),
  affected:changes.filter(x=>x.before!==x.after||x.modified>0||x.uncertain).length,
  note:'Le résultat contient uniquement des nombres. Les catégories sans identifiants stables peuvent avoir des modifications non mesurables. Les trois magasins locaux sont remplacés.'
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