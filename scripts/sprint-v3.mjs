// V3 cooperative sprint lease, checkpoints and recurring incident classification.
// State is persisted per project using GitHub Contents API SHA preconditions;
// this module does not itself acquire a remote lock.
export const PROJECTS=Object.freeze(['pack-pro','banque-ia','ucp','iagile','control-ia']);
const ISO=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const validProject=p=>PROJECTS.includes(p);
const cleanText=s=>typeof s==='string'&&s.trim().length>0&&s.length<=500;
const unique=a=>[...new Set(a)];
export function initialState(project){
 if(!validProject(project))throw Error('unknown project');
 return {schema_version:3,project,status:'idle',lease:null,checkpoint:null,last_completed:null};
}
export function requestLease(state,{project,run_id,started_at,objective,ttl_minutes=45}){
 if(!validProject(project)||!state||state.project!==project)return {ok:false,reason:'project_mismatch'};
 if(!cleanText(run_id)||!cleanText(objective)||!ISO(started_at)||!Number.isInteger(ttl_minutes)||ttl_minutes<10||ttl_minutes>90)return {ok:false,reason:'invalid_request'};
 const now=Date.parse(started_at),active=state.status==='running'&&state.lease;
 if(active){
  if(!ISO(state.lease.expires_at))return {ok:false,reason:'invalid_existing_lease'};
  if(state.lease.run_id===run_id)return {ok:false,reason:'duplicate_run_id'};
  if(now<Date.parse(state.lease.expires_at))return {ok:false,reason:'locked',holder:state.lease.run_id,until:state.lease.expires_at};
 }
 const recovered=Boolean(active);
 const previous=recovered?{run_id:state.lease.run_id,started_at:state.lease.started_at,checkpoint:state.checkpoint??null}:null;
 const lease={run_id,started_at,expires_at:new Date(now+ttl_minutes*60000).toISOString(),objective};
 return {ok:true,recovered,state:{...state,schema_version:3,status:'running',lease,checkpoint:recovered?state.checkpoint:null,recovered_from:previous}};
}
export function heartbeat(state,run_id,at,ttl_minutes=45){
 if(!ISO(at)||!Number.isInteger(ttl_minutes)||ttl_minutes<10||ttl_minutes>90)return {ok:false,reason:'invalid_heartbeat'};
 if(state?.status!=='running'||state.lease?.run_id!==run_id)return {ok:false,reason:'lease_not_owned'};
 const t=Date.parse(at),old=Date.parse(state.lease.expires_at);
 if(!Number.isFinite(old)||t>=old)return {ok:false,reason:'lease_expired'};
 return {ok:true,state:{...state,lease:{...state.lease,expires_at:new Date(t+ttl_minutes*60000).toISOString()}}};
}
export function saveCheckpoint(state,run_id,at,{files=[],branch=null,pr_url=null,completed_steps=[],next_action='' }={}){
 if(!ISO(at)||state?.status!=='running'||state.lease?.run_id!==run_id)return {ok:false,reason:'lease_not_owned'};
 if(Date.parse(at)>=Date.parse(state.lease.expires_at))return {ok:false,reason:'lease_expired'};
 if(!Array.isArray(files)||!Array.isArray(completed_steps)||files.some(x=>!cleanText(x)||x.includes('..'))||completed_steps.some(x=>!cleanText(x))||!cleanText(next_action))return {ok:false,reason:'invalid_checkpoint'};
 const checkpoint={updated_at:at,files:unique(files),branch,pr_url,completed_steps:unique(completed_steps),next_action};
 return {ok:true,state:{...state,checkpoint}};
}
export function finishLease(state,run_id,at,{summary,stage='coded',evidence_url=null}={}){
 if(!ISO(at)||!cleanText(summary))return {ok:false,reason:'invalid_finish'};
 if(state?.status!=='running'||state.lease?.run_id!==run_id)return {ok:false,reason:'lease_not_owned'};
 if(Date.parse(at)<Date.parse(state.lease.started_at))return {ok:false,reason:'end_before_start'};
 if(!['planned','coded','tested','merged','deployed','verified_online','operational','blocked'].includes(stage))return {ok:false,reason:'invalid_stage'};
 if(stage==='verified_online'||stage==='operational'){
  if(!/^https:\/\/[^\s/]+\/.+/.test(evidence_url||''))return {ok:false,reason:'missing_online_proof'};
 }
 const last_completed={run_id,started_at:state.lease.started_at,ended_at:at,summary,stage,evidence_url};
 return {ok:true,state:{...state,status:'idle',lease:null,checkpoint:null,last_completed,recovered_from:null}};
}
export function repeatedIncidents(reports,minConsecutive=2){
 if(!Array.isArray(reports)||!Number.isInteger(minConsecutive)||minConsecutive<2)throw Error('invalid incident analysis');
 const current=reports.at(-1),ids=unique((current?.incidents||[]).filter(x=>x&&x.status==='open'&&cleanText(x.blocker_id)).map(x=>x.blocker_id));
 return ids.map(blocker_id=>{
  let consecutive=0;
  for(let i=reports.length-1;i>=0;i--){
   const entries=reports[i]?.incidents||[];
   if(!entries.some(x=>x?.blocker_id===blocker_id&&x?.status==='open'))break;
   consecutive++;
  }
  return {blocker_id,consecutive_sprints:consecutive,status:consecutive>=minConsecutive?'incident':'watch'};
 });
}
export function recommendedAction({reports=[],pending_checkpoint=null}={}){
 const active=repeatedIncidents(reports).filter(x=>x.status==='incident');
 if(active.length)return {priority:'P0',reason:'persistent_incident',blocker_id:active[0].blocker_id};
 if(pending_checkpoint?.next_action)return {priority:'P1',reason:'resume_incomplete',next_action:pending_checkpoint.next_action};
 return {priority:'P1',reason:'review_open_pr_and_user_impact'};
}
