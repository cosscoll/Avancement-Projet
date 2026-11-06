/* CONTROL Backup Review — local, read-only comparison of an imported backup.
   No file upload, external connectivity, or mutation. A preview is not consent. */
(()=>{'use strict';
const BUCKETS=Object.freeze([
 ['actions','Actions'],['missions','Missions'],['events','Événements'],
 ['meetings','Visios'],['decisions','Décisions'],['clients','Clients locaux'],['goalPlans','Plans'],
 ['websites','Sites et brouillons'],['messages','Messages locaux'],
 ['expenses','Dépenses déclarées'],['income','Revenus déclarés']
]);
const storeKeys=Object.freeze(['control-command-v1','control-hub-v2','control-automations-v1','control-ai-studio-v1']);
const safeObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function amount(v){return Array.isArray(v)?v.length:0}
function list(data){
 const command=safeObject(data?.command)?data.command:{};
 const hub=safeObject(data?.hub)?data.hub:{};
 const automations=safeObject(data?.automations)?data.automations:{};
 const studio=safeObject(data?.studio)?data.studio:{};
 const result=BUCKETS.map(([key,label])=>({key,label,after:amount(command[key])}));
 const projectCount=safeObject(hub.projects)?Object.keys(hub.projects).length:amount(hub.projects);
 const customProjects=amount(hub.custom);
 const automationCount=amount(automations.entries)||amount(automations.automations)||amount(automations.drafts);
 result.push({key:'projects',label:'Espaces projets enregistrés',after:projectCount});
 result.push({key:'custom-projects',label:'Projets personnalisés',after:customProjects});
 for(const [bucket,label] of [['imports','Conversations du Studio IA'],['memories','Mémoires du Studio IA'],['agents','Agents du Studio IA']])result.push({key:'studio-'+bucket,label,after:amount(studio[bucket])});
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
 const keepStudio=Object.hasOwn(next,'studio')?next:{...next,studio:previous.studio};
 const changes=list(keepStudio).map(x=>{
  const oldCount=before.get(x.key)||0;
  if(BUCKETS.some(b=>b[0]===x.key)){
   return {...x,before:oldCount,...compareRecords(next.command[x.key],previous.command?.[x.key])};
  }
  if(x.key==='custom-projects'){
   return {...x,before:oldCount,...compareRecords(next.hub.custom,previous.hub?.custom)};
  }
  if(x.key.startsWith('studio-')){
   const field=x.key.slice('studio-'.length);
   return {...x,before:oldCount,...compareRecords(keepStudio.studio?.[field],previous.studio?.[field])};
  }
  // Hub/project settings and automation schema vary between CONTROL versions:
  // counts are estimates, never fabricate record-level certainty for these sources.
  return {...x,before:oldCount,added:Math.max(0,x.after-oldCount),removed:Math.max(0,oldCount-x.after),modified:null,uncertain:!!(oldCount&&x.after)};
 });
 const losses=changes.filter(x=>x.removed>0);
 const modified=changes.filter(x=>x.modified>0);
 const uncertain=changes.filter(x=>x.uncertain);
 return Object.freeze({
  changes,losses,modified,uncertain,studioPreservedFromLegacy:!Object.hasOwn(next,'studio'),
  totalBefore:changes.reduce((n,x)=>n+x.before,0),
  totalAfter:changes.reduce((n,x)=>n+x.after,0),
  totalRemoved:changes.reduce((n,x)=>n+x.removed,0),
  totalModified:changes.reduce((n,x)=>n+(x.modified||0),0),
  affected:changes.filter(x=>x.before!==x.after||x.modified>0||x.uncertain).length,
  note:'Le résultat contient uniquement des nombres. Les catégories sans identifiants stables peuvent avoir des modifications non mesurables. Les anciens fichiers conservent le Studio IA existant.'
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
// The actual restore writer is deliberately isolated from the read-only preview.
// Always compare all 4 storage keys before and between writes; on failure,
// roll back only keys whose values still equal the values written by this run.
function applyTransaction(storage,original,data,afterApply){
 if(!safeObject(data)||!safeObject(data.command)||!safeObject(data.hub)||!safeObject(data.automations))
  return {ok:false,reason:'invalid',rollbackUncertain:false};
 const old=Array.isArray(original)&&original.length===storeKeys.length?storeKeys.map((key,i)=>[key,original[i]]):[];
 if(old.length!==storeKeys.length)return {ok:false,reason:'invalid_snapshot',rollbackUncertain:false};
 if(!unchanged(storage,original))return {ok:false,reason:'concurrent',rollbackUncertain:false};
 const entries=[[storeKeys[0],data.command],[storeKeys[1],data.hub],[storeKeys[2],data.automations]];
 if(Object.hasOwn(data,'studio'))entries.push([storeKeys[3],data.studio]);
 const written=new Map();
 try{
  for(const [key,value] of entries){
   const currentExpected=original.map((raw,i)=>written.has(storeKeys[i])?written.get(storeKeys[i]):raw);
   if(!unchanged(storage,currentExpected))throw Error('CONCURRENT');
   const serialized=JSON.stringify(value);
   if(typeof serialized!=='string')throw Error('INVALID_DATA');
   storage.setItem(key,serialized);
   written.set(key,serialized);
   if(storage.getItem(key)!==serialized)throw Error('WRITE_MISMATCH');
  }
  // Recheck all keys immediately before marking a restore successful.
  if(!unchanged(storage,original.map((raw,i)=>written.has(storeKeys[i])?written.get(storeKeys[i]):raw)))
   throw Error('CONCURRENT');
  if(typeof afterApply==='function')afterApply();
  return {ok:true,reason:'applied',rollbackUncertain:false};
 }catch(error){
  let rollbackUncertain=false;
  for(const [key,raw] of old){
   if(!written.has(key))continue;
   try{
    if(storage.getItem(key)!==written.get(key)){rollbackUncertain=true;continue}
    if(raw===null)storage.removeItem(key);else storage.setItem(key,raw);
    if(storage.getItem(key)!==raw)rollbackUncertain=true;
   }catch{rollbackUncertain=true}
  }
  return {ok:false,reason:error?.message==='CONCURRENT'?'concurrent':'storage',rollbackUncertain};
 }
}
window.CONTROL_BACKUP_REVIEW=Object.freeze({compare,snapshot,unchanged,applyTransaction,storeKeys,BUCKETS});
})();