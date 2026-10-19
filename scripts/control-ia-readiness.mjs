/* CONTROL IA functional delivery governance. Free of network calls and external dependencies. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const STAGES=['not_started','in_code','ci_tested','integrated','deployed','user_verified','operational'];
export const PRIORITIES=['P0','P1','P2'];
const isUrl=value=>typeof value==='string'&&/^https:\/\/[^\s/]+\/[^\s]+/.test(value);
const idValid=value=>typeof value==='string'&&/^CONTROL-[A-Z0-9-]{2,80}$/.test(value);

export function inspectDelivery(data){
 const errors=[];
 if(!data||typeof data!=='object'||Array.isArray(data))return ['Tracker must be a JSON object'];
 if(data.schema_version!==1)errors.push('schema_version must be 1');
 if(data.work_in_progress_limit!==1)errors.push('Functional focus WIP limit must equal 1');
 if(!/^\d{4}-\d\d-\d\d$/.test(data.reviewed_on||''))errors.push('reviewed_on must be a date');
 if(!Array.isArray(data.capabilities)||data.capabilities.length<1)return [...errors,'Capabilities must be non-empty'];
 if(JSON.stringify(data.states)!==JSON.stringify(STAGES))errors.push('Delivery stage order changed');
 const ids=new Set();
 for(const item of data.capabilities){
  if(!idValid(item.id))errors.push('Invalid capability ID '+String(item.id));
  if(ids.has(item.id))errors.push('Duplicate capability '+item.id);
  ids.add(item.id);
  if(!item.name||!item.summary||!item.next)errors.push(item.id+': title, summary and next action required');
  if(!PRIORITIES.includes(item.priority))errors.push(item.id+': priority invalid');
  if(!STAGES.includes(item.stage))errors.push(item.id+': stage invalid');
  if(!Array.isArray(item.depends_on)||!Array.isArray(item.blockers)||!Array.isArray(item.source_tickets))errors.push(item.id+': dependencies, blockers and tickets must be arrays');
  if(!Array.isArray(item.acceptance)||item.acceptance.length<2)errors.push(item.id+': at least two acceptance criteria required');
  const criteria=new Set();
  for(const a of item.acceptance||[]){
   if(!a.id||criteria.has(a.id))errors.push(item.id+': invalid or duplicated acceptance identifier');
   criteria.add(a.id);
   if(typeof a.verified!=='boolean'||!Array.isArray(a.evidence)||!a.label)errors.push(item.id+': invalid acceptance '+a.id);
   if(a.verified&&(!a.evidence.length||!a.evidence.every(isUrl)))errors.push(item.id+': acceptance '+a.id+' has no valid proof URL');
   if(!a.verified&&a.evidence.length)errors.push(item.id+': unverified criterion '+a.id+' claims evidence');
  }
  const ev=item.evidence;
  if(!ev||typeof ev!=='object')errors.push(item.id+': missing evidence fields');
  else{
   for(const key of ['code_url','ci_url','deployment_url','journey_url']){
    if(!(key in ev))errors.push(item.id+': missing '+key);
    else if(ev[key]!==null&&!isUrl(ev[key]))errors.push(item.id+': invalid '+key);
   }
   if(STAGES.indexOf(item.stage)>=STAGES.indexOf('ci_tested')&&!ev.ci_url)errors.push(item.id+': CI-tested stage without CI evidence');
   if(STAGES.indexOf(item.stage)>=STAGES.indexOf('deployed')&&!ev.deployment_url)errors.push(item.id+': published stage without deployment evidence');
   if(STAGES.indexOf(item.stage)>=STAGES.indexOf('user_verified')&&!ev.journey_url)errors.push(item.id+': user-verified stage without real journey evidence');
  }
  if(item.stage==='not_started'&&(item.acceptance||[]).some(a=>a.verified))errors.push(item.id+': not-started capability has completed criteria');
  if(item.stage==='operational'){
   if(item.blockers.length)errors.push(item.id+': operational stage with unresolved blockers');
   if(!item.acceptance?.every(a=>a.verified&&a.evidence.length))errors.push(item.id+': operational stage missing verified criteria');
  }
  if((item.source_tickets||[]).some(s=>!/^BACK-\d{3}$/.test(s)))errors.push(item.id+': malformed ticket');
 }
 const byId=new Map(data.capabilities.map(x=>[x.id,x]));
 const focus=byId.get(data.focus_id);
 if(!focus)errors.push('No valid focus_id');
 else if(focus.stage==='operational')errors.push('Focus is already operational, choose the next incomplete capability');
 const visited=new Set(), visiting=new Set();
 function visit(id){
  if(visiting.has(id)){errors.push('Dependency cycle at '+id);return}
  if(visited.has(id))return;
  const item=byId.get(id);if(!item)return;
  visiting.add(id);
  for(const parent of item.depends_on||[]){
   if(!byId.has(parent))errors.push(id+': unknown dependency '+parent);
   else if(parent===id)errors.push(id+': self-dependency');
   else{visit(parent);if(item.stage==='operational'&&byId.get(parent).stage!=='operational')errors.push(id+': operational before dependency '+parent)}
  }
  visiting.delete(id);visited.add(id);
 }
 for(const id of ids)visit(id);
 return errors;
}
export function calculateDelivery(data){
 const states=Object.fromEntries(STAGES.map(s=>[s,0]));
 for(const c of data.capabilities||[])if(states[c.stage]!==undefined)states[c.stage]++;
 const total=(data.capabilities||[]).length;
 const allCriteria=(data.capabilities||[]).flatMap(x=>x.acceptance||[]);
 return {total,operational:states.operational,userVerified:states.user_verified,
    deployedNotVerified:states.deployed,verifiedCriteria:allCriteria.filter(c=>c.verified).length,
    totalCriteria:allCriteria.length,states,focus:data.focus_id};
}
export function readTracker(filename=fileURLToPath(new URL('../data/control-ia-delivery.json',import.meta.url))){
 const raw=JSON.parse(readFileSync(filename,'utf8'));
 const errors=inspectDelivery(raw);
 if(errors.length)throw Error('Invalid CONTROL IA delivery tracker:\n'+errors.join('\n'));
 return raw;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 try{
  const data=readTracker();
  const s=calculateDelivery(data);
  process.stdout.write('CONTROL IA delivery tracker: '+s.total+' capabilities, '+s.operational+' operational, '+s.verifiedCriteria+'/'+s.totalCriteria+' verified criteria; focus '+s.focus+'\n');
 }catch(err){process.stderr.write(String(err.message||err)+'\n');process.exitCode=1}
}
