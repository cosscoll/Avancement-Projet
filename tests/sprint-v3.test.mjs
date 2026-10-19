import test from 'node:test';
import assert from 'node:assert/strict';
import {PROJECTS,initialState,requestLease,heartbeat,saveCheckpoint,finishLease,repeatedIncidents,recommendedAction} from '../scripts/sprint-v3.mjs';
const p='pack-pro',time='2026-10-19T10:10:00+02:00';
const req=(run_id,started_at=time)=>({project:p,run_id,started_at,objective:'Corriger la navigation et la vérifier'});
test('projets connus seulement, états initiaux indépendants',()=>{
 assert.equal(PROJECTS.length,5);
 for(const project of PROJECTS){assert.equal(initialState(project).project,project);assert.equal(initialState(project).status,'idle')}
 assert.throws(()=>initialState('other'));
});
test('lease : premier lancement réussi, doublon et concurrent refusés',()=>{
 const a=requestLease(initialState(p),req('task-A'));assert.equal(a.ok,true);
 assert.equal(requestLease(a.state,req('task-A')).reason,'duplicate_run_id');
 const b=requestLease(a.state,req('task-B','2026-10-19T10:11:00+02:00'));
 assert.equal(b.ok,false);assert.equal(b.reason,'locked');
 assert.equal(b.holder,'task-A');assert.equal(b.until,a.state.lease.expires_at);
});
test('heartbeat garde une seule identité, refuses fin après expiration',()=>{
 const a=requestLease(initialState(p),req('task-A'));
 assert.equal(heartbeat(a.state,'task-B','2026-10-19T10:20:00+02:00').ok,false);
 const b=heartbeat(a.state,'task-A','2026-10-19T10:20:00+02:00');
 assert.equal(b.ok,true);
 assert.equal(heartbeat(b.state,'task-A','2026-10-19T11:20:00+02:00').reason,'lease_expired');
});
test('checkpoint conserve le travail et exige le propriétaire du lease',()=>{
 const a=requestLease(initialState(p),req('task-A'));
 assert.equal(saveCheckpoint(a.state,'task-B','2026-10-19T10:12:00+02:00',{next_action:'Reprendre'}).ok,false);
 const b=saveCheckpoint(a.state,'task-A','2026-10-19T10:12:00+02:00',{files:['index.html'],branch:'feat/nav',completed_steps:['code','code'],next_action:'Reprendre la CI'});
 assert.equal(b.ok,true);assert.deepEqual(b.state.checkpoint.completed_steps,['code']);
 const c=requestLease(b.state,req('task-C','2026-10-19T11:10:00+02:00'));
 assert.equal(c.ok,true);assert.equal(c.recovered,true);
 assert.equal(c.state.recovered_from.run_id,'task-A');assert.equal(c.state.checkpoint.next_action,'Reprendre la CI');
});
test('fin ne détruit pas le checkpoint avant validation de propriétaire',()=>{
 const a=requestLease(initialState(p),req('task-A'));
 assert.equal(finishLease(a.state,'task-C','2026-10-19T10:30:00+02:00',{summary:'non'}).reason,'lease_not_owned');
 assert.equal(finishLease(a.state,'task-A','2026-10-19T10:30:00+02:00',{summary:'non',stage:'verified_online'}).reason,'missing_online_proof');
 const b=finishLease(a.state,'task-A','2026-10-19T10:30:00+02:00',{summary:'Code sur branche, non publié',stage:'coded'});
 assert.equal(b.ok,true);assert.equal(b.state.status,'idle');assert.equal(b.state.last_completed.stage,'coded');
});
test('blocker sans identifiant stable ne devient jamais incident inventé',()=>{
 const reports=[{blockers:['GitHub bloque']},{blockers:['GitHub bloque']}];
 assert.deepEqual(repeatedIncidents(reports),[]);
});
test('incident après deux sprints consécutifs et reset si interruption',()=>{
 const r=id=>({incidents:[{blocker_id:id,status:'open'}]});
 assert.equal(repeatedIncidents([r('gh'),r('gh')])[0].status,'incident');
 assert.equal(repeatedIncidents([r('gh'),{incidents:[]},r('gh')])[0].consecutive_sprints,1);
 assert.equal(recommendedAction({reports:[r('gh'),r('gh')]}).reason,'persistent_incident');
 assert.equal(recommendedAction({reports:[],pending_checkpoint:{next_action:'Corriger le test'}}).reason,'resume_incomplete');
});
