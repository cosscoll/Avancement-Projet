import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const PROJECTS=['pack-pro','banque-ia','ucp','iagile','control-ia'];
export const STAGES=['planned','coded','tested','merged','deployed','verified_online','operational'];
const https=url=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false}};
const validDate=d=>typeof d==='string'&&Number.isFinite(Date.parse(d));

export function validateReport(s){
 const errors=[];
 if(!s||typeof s!=='object'||Array.isArray(s))return ['report must be an object'];
 if(typeof s.id!=='string'||!s.id.trim())errors.push('id missing');
 if(!validDate(s.started_at))errors.push('started_at missing or invalid');
 if(s.ended_at!==undefined&&!validDate(s.ended_at))errors.push('ended_at invalid');
 if(s.ended_at&&validDate(s.started_at)&&Date.parse(s.ended_at)<Date.parse(s.started_at))errors.push('ended_at precedes started_at');
 if(typeof s.summary!=='string'||!s.summary.trim())errors.push('summary missing');
 if(!Array.isArray(s.done)||!Array.isArray(s.blockers))errors.push('done/blockers must be arrays');
 if(s.links!==undefined&&(!Array.isArray(s.links)||s.links.some(l=>!l||typeof l.label!=='string'||!https(l.url))))errors.push('invalid evidence links');
 if(s.schema_version===2){
  if(!Array.isArray(s.objectives)||!s.objectives.length||s.objectives.some(x=>!x||typeof x.before!=='string'||typeof x.after!=='string'||typeof x.acceptance!=='string'))errors.push('v2 requires before/after/acceptance objectives');
  if(!Array.isArray(s.deliverables))errors.push('v2 requires deliverables array');
  if(!s.quality||typeof s.quality!=='object')errors.push('v2 requires quality report');
  for(const d of (Array.isArray(s.deliverables)?s.deliverables:[])){
   if(!d||typeof d.name!=='string'||!STAGES.includes(d.stage))errors.push('invalid deliverable stage/name');
   if(d?.url!=null&&!https(d.url))errors.push('invalid deliverable URL');
   if(['verified_online','operational'].includes(d?.stage)&&(!https(d.online_url)||!validDate(d.online_verified_at)||!https(d.online_evidence_url)))errors.push('online verified/operational claim requires online_url, checked time, and online_evidence_url');
   if(['deployed','verified_online','operational'].includes(d?.stage)&&!https(d.online_url))errors.push('deployment claim needs online_url');
  }
  if(s.incidents!==undefined&&(!Array.isArray(s.incidents)||s.incidents.some(x=>!x||typeof x.blocker_id!=='string'||x.consecutive_sprints<1)))errors.push('invalid incident entry');
 }
 return errors;
}
export function validateProjectFile(project){
 const data=JSON.parse(readFileSync(path.join(root,'data/sprints',project+'.json'),'utf8'));
 if(!Array.isArray(data))return ['not an array'];
 const errors=[];const ids=new Set();
 for(const s of data){
  if(ids.has(s?.id))errors.push('duplicate sprint ID '+s?.id);
  ids.add(s?.id);
  for(const e of validateReport(s))errors.push(s?.id+': '+e);
 }
 return errors;
}
