// CONTROL IA strategic sprint roadmap validator. Pure Node, no network or secrets.
// Purpose: prevent drift between the ten user objectives and the existing delivery tracker.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const ROOT=new URL('../',import.meta.url);
export const PHASES=[0,1,2,3,4,5];
export const REQUIRED_IMPROVEMENTS=Object.freeze(Array.from({length:10},(_,i)=>'IMP-'+String(i+1).padStart(2,'0')));
const URL_RX=/^https:\/\/[^\s/]+\/.+/;
const STAGES=new Set(['planned','in_code','ci_tested','integrated','deployed','user_verified','operational']);
const own=(o,p)=>Object.prototype.hasOwnProperty.call(o,p);
export const readJson=(path)=>JSON.parse(readFileSync(fileURLToPath(new URL(path,ROOT)),'utf8'));

export function validateStrategy(strategy,delivery){
 const errors=[];
 if(!strategy||typeof strategy!=='object'||Array.isArray(strategy))return ['Strategy must be an object'];
 if(!delivery||typeof delivery!=='object')return ['Delivery registry missing'];
 if(strategy.schema_version!==1||strategy.project!=='control-ia')errors.push('Invalid strategy identity or schema');
 if(strategy.focus?.capability!==delivery.focus_id)errors.push('Main focus differs from existing delivery tracker');
 if(strategy.focus?.cloud_activation_allowed!==false)errors.push('Cloud must be explicitly disabled until account tests');
 if(strategy.work_policy?.max_primary_workstreams!==1)errors.push('Only one primary functional workstream may be active');
 if(strategy.work_policy?.max_subobjectives_per_sprint>3||strategy.work_policy?.max_subobjectives_per_sprint<1)errors.push('Invalid sprint subobjective limit');
 if(strategy.work_policy?.common_lock_file!=='data/sprint-state/control-ia.json')errors.push('Both sprint modes must share the CONTROL lease file');
 const modes=strategy.work_policy?.session_types;
 if(!Array.isArray(modes)||!modes.includes('scheduled')||!modes.includes('conversation')||modes.length!==2)errors.push('Both scheduled and conversational execution are mandatory');
 if(!Array.isArray(strategy.governing_sources)||!strategy.governing_sources.includes('docs/PROTOCOLE_SPRINTS_V3.md'))errors.push('V3 protocol reference missing');
 if(!strategy.private_backlog_reference?.includes('BACK-001..042'))errors.push('Private backlog must be preserved');
 if(!Array.isArray(strategy.roadmap_phases)||strategy.roadmap_phases.map(p=>p.id).join(',')!==PHASES.join(','))errors.push('Unexpected roadmap phases');
 if(!Array.isArray(strategy.improvements)||strategy.improvements.length!==10)return [...errors,'Exactly ten user improvements are required'];
 const ids=strategy.improvements.map(x=>x.id);
 for(const wanted of REQUIRED_IMPROVEMENTS)if(ids.filter(x=>x===wanted).length!==1)errors.push('Missing or duplicated initiative '+wanted);
 const byId=new Map(strategy.improvements.map(x=>[x.id,x]));
 const existing=new Set((delivery.capabilities||[]).map(x=>x.id));
 if(!existing.has(strategy.focus?.capability))errors.push('Focus is not a known delivery capability');
 let accepted=0;
 for(const x of strategy.improvements){
  if(!x.title||!x.first_slice||!x.priority)errors.push(x.id+': missing objective, first slice or priority');
  if(!PHASES.includes(x.phase)||x.phase===0)errors.push(x.id+': invalid phase');
  if(!STAGES.has(x.status))errors.push(x.id+': invalid delivery status');
  if(!Array.isArray(x.acceptance)||x.acceptance.length<3||x.acceptance.some(c=>typeof c!=='string'||!c.trim()))errors.push(x.id+': at least three clear acceptance criteria needed');
  accepted+=(x.acceptance||[]).length;
  if(!Array.isArray(x.depends_on)||!Array.isArray(x.existing)||!Array.isArray(x.evidence_urls)||!Array.isArray(x.accepted_criteria)||!Array.isArray(x.external_blockers))errors.push(x.id+': incomplete dependency or evidence arrays');
  else{
   for(const p of x.depends_on){if(!byId.has(p))errors.push(x.id+': unknown improvement dependency '+p);else if(byId.get(p).phase>x.phase)errors.push(x.id+': depends on later phase '+p)}
   for(const p of x.existing)if(!existing.has(p))errors.push(x.id+': unknown legacy capability '+p);
   if(x.accepted_criteria.length>(x.acceptance||[]).length)errors.push(x.id+': more accepted criteria than defined');
   if(x.accepted_criteria.some(y=>typeof y!=='number'||y<0||y>=x.acceptance.length||!Number.isInteger(y)))errors.push(x.id+': accepted criterion must be a zero-based integer index');
   if(x.accepted_criteria.length&&!x.evidence_urls.length)errors.push(x.id+': criterion accepted without evidence');
   if(x.evidence_urls.some(u=>!URL_RX.test(u)))errors.push(x.id+': invalid evidence URL');
   if(x.status==='operational'&&(!x.acceptance.every((c,i)=>x.accepted_criteria.includes(i))||!x.evidence_urls.length||x.external_blockers.length))errors.push(x.id+': false operational claim');
  }
 }
 if(accepted<30)errors.push('Thirty minimum incremental acceptance criteria required');
 const seen=new Set(),stack=new Set();
 function visit(id){
  if(stack.has(id)){errors.push('Circular improvement dependency at '+id);return}
  if(seen.has(id))return;
  const x=byId.get(id);if(!x)return;stack.add(id);
  for(const p of x.depends_on||[])if(byId.has(p))visit(p);
  stack.delete(id);seen.add(id);
 }
 for(const id of ids)visit(id);
 const declared=[];
 for(const p of strategy.roadmap_phases||[]){if(!Array.isArray(p.targets)||!p.exit?.trim())errors.push('Roadmap phase missing targets or exit');else declared.push(...p.targets);}
 for(const x of strategy.improvements)if(declared.filter(t=>t===x.id).length!==1||!strategy.roadmap_phases.some(p=>p.id===x.phase&&p.targets.includes(x.id)))errors.push(x.id+': improvement must appear exactly once in the correct phase');
 if(!declared.includes('CONTROL-ACCOUNT'))errors.push('Foundational account capability must be explicitly gated');
 if(!Array.isArray(strategy.handoff?.next_steps)||!strategy.handoff.next_steps.length||strategy.handoff.next_steps.length>3)errors.push('Next sprint must have one to three concrete next actions');
 if(strategy.handoff?.checkpoint_to_review?.indexOf('pwa-atomic-v38')<0)errors.push('Prior unfinished PWA checkpoint was dropped');
 if(strategy.safety?.budget_eur!==0||strategy.safety?.forbid_paid_services!==true||strategy.safety?.forbid_limited_work_codex!==true||strategy.safety?.cloud_enabled_required_false_until_authorized!==true)errors.push('Permanent safety / zero-cost restrictions missing');
 if(strategy.metrics?.north_star!=='mission_completion_rate')errors.push('Must measure verified missions, not commit volume');
 return [...new Set(errors)];
}
export function summary(strategy){
 return {initiatives:strategy.improvements.length,criteria:strategy.improvements.reduce((n,x)=>n+x.acceptance.length,0),
  operational:strategy.improvements.filter(x=>x.status==='operational').length,
  current_focus:strategy.focus?.capability,
  execution_modes:strategy.work_policy?.session_types};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 try{
  const strategy=readJson('data/control-ia-strategy.json');
  const delivery=readJson('data/control-ia-delivery.json');
  const errors=validateStrategy(strategy,delivery);
  if(errors.length)throw Error(errors.join('\n'));
  process.stdout.write('CONTROL STRATEGY OK '+JSON.stringify(summary(strategy))+'\n');
 }catch(error){process.stderr.write('CONTROL STRATEGY INVALID: '+String(error.message||error)+'\n');process.exitCode=1;}
}
