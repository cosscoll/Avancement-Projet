// CONTROL IA V1.2 traceability check: IDs and evidence only.
// Full functional/technical specification is PRIVATE Library content.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const ROOT=new URL('../',import.meta.url);
const read=(path)=>JSON.parse(readFileSync(fileURLToPath(new URL(path,ROOT)),'utf8'));
const serial=(prefix,length,digits)=>Array.from({length},(_,i)=>prefix+String(i+1).padStart(digits,'0'));
const BACK_IDS=serial('BACK-',22,3);
const SCENARIO_IDS=serial('T-',42,2);
const IMP_IDS=serial('IMP-',10,2);
const STATUS=new Set(['not_verified','partial_mock','real_verified']);
const URL_RX=/^https:\/\/[^\s/]+\/[^\s]+$/i;
const same=(a,b)=>JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
export function summary(registry,legacy,strategy){
 return {
  backlog_total:registry.tickets.length,
  backlog_verified:registry.tickets.filter(t=>t.stage==='real_verified').length,
  scenarios_total:registry.scenarios.length,
  scenarios_verified:registry.scenarios.filter(t=>t.verification==='real_verified').length,
  scenarios_partial_mock:registry.scenarios.filter(t=>t.verification==='partial_mock').length,
  improvements_total:strategy.improvements.length,
  improvement_criteria_total:strategy.improvements.reduce((n,x)=>n+x.acceptance.length,0),
  improvement_criteria_verified:strategy.improvements.reduce((n,x)=>n+(x.accepted_criteria||[]).length,0),
  legacy_criteria_total:legacy.capabilities.reduce((n,x)=>n+x.acceptance.length,0),
  legacy_criteria_verified:legacy.capabilities.reduce((n,x)=>n+x.acceptance.filter(a=>a.verified).length,0),
  legacy_capabilities_operational:legacy.capabilities.filter(x=>x.stage==='operational').length
 };
}
export function validateRegistry(registry,legacy,strategy){
 const errors=[];
 if(!registry||!legacy||!strategy)return ['Missing registry, legacy or strategy data'];
 if(registry.schema_version!==1||registry.specification_version!=='1.2')errors.push('Invalid public specification schema/version');
 if(registry.primary_focus!==legacy.focus_id||strategy.focus?.capability!==legacy.focus_id)errors.push('Inconsistent main capability focus');
 if(!registry.private_source?.startsWith('/CONTROL-IA/')||!registry.public_redaction?.includes('private'))errors.push('Private specification reference/redaction policy missing');
 if(!Array.isArray(registry.tickets)||!Array.isArray(registry.scenarios)||!Array.isArray(registry.improvements))return [...errors,'Missing ticket/test/improvement collections'];
 if(!same(registry.tickets.map(t=>t.id),BACK_IDS)||registry.tickets.length!==22)errors.push('Must have exactly BACK-001..BACK-022');
 if(!same(registry.scenarios.map(t=>t.id),SCENARIO_IDS)||registry.scenarios.length!==42)errors.push('Must have exactly T-01..T-42, not 42 BACK tickets');
 if(!same(registry.improvements.map(t=>t.id),IMP_IDS)||registry.improvements.length!==10)errors.push('Must have ten IMP identifiers');
 if(!Array.isArray(legacy.capabilities)||!Array.isArray(strategy.improvements))return [...errors,'Missing cross reference catalogs'];
 const knownCaps=new Set(legacy.capabilities.map(c=>c.id));
 const improvements=new Map(strategy.improvements.map(x=>[x.id,x]));
 const tests=new Map(registry.scenarios.map(x=>[x.id,x]));
 const back=new Map(registry.tickets.map(x=>[x.id,x]));
 const canonical=new Set(BACK_IDS);
 let preservedNoncanonical=0;
 for(const capability of legacy.capabilities){
  if(!Array.isArray(capability.source_tickets)||new Set(capability.source_tickets).size!==capability.source_tickets.length)errors.push(capability.id+': missing or duplicate canonical source_tickets');
  for(const ref of capability.source_tickets||[])if(!canonical.has(ref))errors.push(capability.id+': noncanonical source ticket '+ref);
  const preserved=capability.legacy_unmapped_ticket_refs??[];
  if(!Array.isArray(preserved)||new Set(preserved).size!==preserved.length)errors.push(capability.id+': invalid historical label list');
  for(const ref of Array.isArray(preserved)?preserved:[]){
   if(canonical.has(ref)||!/^BACK-\d{3}$/.test(ref))errors.push(capability.id+': historical label overlaps canonical ticket '+ref);
   if((capability.source_tickets||[]).includes(ref))errors.push(capability.id+': historical label also in canonical links '+ref);
   preservedNoncanonical++;
  }
 }
 if(legacy.reference_reconciliation?.status==='historical_labels_unmapped'&&legacy.reference_reconciliation.unmapped_count!==preservedNoncanonical)errors.push('Noncanonical historical count inconsistent');
 for(const item of registry.tickets){
  if(!knownCaps.has(item.capability_id))errors.push(item.id+': unknown main capability');
  if(!Array.isArray(item.acceptance_scenarios)||!item.acceptance_scenarios.length||new Set(item.acceptance_scenarios).size!==item.acceptance_scenarios.length)errors.push(item.id+': missing or duplicate scenario links');
  for(const id of item.acceptance_scenarios||[])if(!tests.has(id))errors.push(item.id+': unknown scenario '+id);
  if(item.stage!=='not_verified'&&item.stage!=='real_verified')errors.push(item.id+': unsupported verified state');
  if(!Array.isArray(item.evidence_urls))errors.push(item.id+': evidence list missing');
  if(item.stage==='real_verified'){
   if(!item.evidence_urls?.length||item.evidence_urls.some(url=>!URL_RX.test(url)))errors.push(item.id+': verified ticket missing real evidence');
   if(!(item.acceptance_scenarios||[]).every(id=>tests.get(id)?.verification==='real_verified'))errors.push(item.id+': verified ticket references unverified or mock test');
  }
  // Public artifact intentionally stores IDs, general stage and proof only.
  if(Object.keys(item).some(key=>!['id','priority','capability_id','acceptance_scenarios','stage','evidence_urls'].includes(key)))errors.push(item.id+': unexpected possible private specification field');
 }
 for(const item of registry.scenarios){
  if(!STATUS.has(item.verification))errors.push(item.id+': unsupported verification status');
  const calculated=registry.tickets.filter(x=>x.acceptance_scenarios?.includes(item.id)).map(x=>x.id);
  if(!Array.isArray(item.linked_backlog)||!item.linked_backlog.length||!same(item.linked_backlog,calculated))errors.push(item.id+': backlinks missing or inconsistent');
  if(!Array.isArray(item.evidence))errors.push(item.id+': evidence must be array');
  if(item.verification==='real_verified'&&!item.evidence?.some(e=>e.type==='real_journey'&&URL_RX.test(e.url)&&e.scope&&e.commit_sha&&e.tested_at))errors.push(item.id+': real verification requires journey, source SHA and timestamp');
  if(item.verification==='partial_mock'&&!item.evidence?.some(e=>['local_browser','mock_database','simulator'].includes(e.type)&&URL_RX.test(e.url)&&e.scope))errors.push(item.id+': mock/simulated evidence missing or inaccurate');
  if(item.verification==='not_verified'&&item.evidence?.length)errors.push(item.id+': unverified scenario must not contain success proof');
  if(Object.keys(item).some(key=>!['id','linked_backlog','verification','evidence'].includes(key)))errors.push(item.id+': unexpected possible private requirement field');
 }
 for(const item of registry.improvements){
  const s=improvements.get(item.id);if(!s){errors.push(item.id+': missing strategy linkage');continue}
  const expected=Array.from({length:s.acceptance.length},(_,i)=>item.id+'-AC'+(i+1));
  if(!Array.isArray(item.acceptance_criterion_ids)||!same(item.acceptance_criterion_ids,expected)||expected.length!==3)errors.push(item.id+': expected exactly three links to strategy acceptance');
  if(item.source!=='data/control-ia-strategy.json')errors.push(item.id+': wrong strategy source');
 }
 const stats=summary(registry,legacy,strategy);
 for(const [key,value] of [['backlog_tickets',22],['acceptance_scenarios',42],['improvements',10],['improvement_criteria',30],['legacy_criteria',36]])if(registry.counts?.[key]!==value)errors.push('Incorrect declared count '+key);
 if(stats.legacy_criteria_total!==36)errors.push('Legacy 36 criteria must remain unchanged');
 if(stats.improvement_criteria_total!==30)errors.push('30 strategy acceptance criteria must remain unchanged');
 if(registry.delivery_source!=='data/control-ia-delivery.json'||registry.improvement_source!=='data/control-ia-strategy.json')errors.push('Missing canonical links');
 if(registry.primary_focus==='CONTROL-ACCOUNT'&&strategy.focus?.cloud_activation_allowed!==false)errors.push('Cloud activation must not be silently authorized');
 if(Object.keys(registry).some(key=>!['schema_version','specification_version','updated_on','public_redaction','private_source','delivery_source','improvement_source','primary_focus','counts','verification_policy','tickets','scenarios','improvements'].includes(key)))errors.push('Unexpected public field might disclose private specification');
 return [...new Set(errors)];
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{
  const registry=read('data/control-ia-requirements.json');
  const legacy=read('data/control-ia-delivery.json');
  const strategy=read('data/control-ia-strategy.json');
  const errors=validateRegistry(registry,legacy,strategy);
  if(errors.length)throw Error(errors.join('\n'));
  console.log('CONTROL V1.2 REGISTRY OK',JSON.stringify(summary(registry,legacy,strategy)));
 }catch(error){console.error('CONTROL V1.2 REGISTRY INVALID',error.message);process.exitCode=1;}
}
