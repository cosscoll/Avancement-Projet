import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const code=readFileSync('assets/command-center.js','utf8');
const from=code.indexOf('function operatorSnapshot(){'),to=code.indexOf('function localai(){',from);
assert.ok(from>0&&to>from,'Exercise actual saved local operator and audit receipt');
const implementation=code.slice(from,to);
let sequence=0;
const nextId=()=>String(++sequence);
const k=i=>'local-'+String(i).padStart(16,'0');
function harness(state={}){
 const ctx=state.ctx||{projects:[{id:'a',name:'Alpha'},{id:'b',name:'Beta'}]};
 const db=state.db||{actions:[],events:[],operatorAudit:[],missions:[],meetings:[]};
 let saveCount=0,saveOk=state.saveOk!==false;
 const sandbox=vm.createContext({ctx,db,window:{CONTROL_OPERATOR_CORE:{validateLocalDateTime:d=>/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(d)}},Date,id:nextId,save:()=>{saveCount++;return saveOk}});
 vm.runInContext(implementation,sandbox);
 return {ctx,db,run:x=>sandbox.operatorExecute(x),receipt:()=>sandbox.operatorReceipt(),writes:()=>saveCount,setSave:x=>saveOk=x};
}
const a=(token=k(1))=>({type:'create_action',projectId:'a',title:'Appeler le client',approvalId:token});
const e=(token=k(2))=>({type:'create_event',projectId:'a',title:'Réunion projet',date:'2035-05-18T14:30',approvalId:token});
test('IMP-10: retrying same confirmed local creation does not duplicate action, audit or write',()=>{
 const h=harness();assert.equal(h.run(a()),true);const receipt=h.receipt();
 assert.equal(h.run(a()),true);
 assert.equal(h.db.actions.length,1);assert.equal(h.db.operatorAudit.length,1);assert.equal(h.writes(),1);
 assert.equal(h.receipt().id,receipt.id);
});
test('IMP-10: idempotent receipt survives a new UI executor instance using persisted local state',()=>{
 const h=harness();h.run(a());const previous=h.receipt();
 const reopened=harness({ctx:h.ctx,db:h.db});assert.equal(reopened.run(a()),true);
 assert.equal(reopened.writes(),0);assert.equal(h.db.actions.length,1);
 assert.equal(reopened.receipt().id,previous.id);
});
test('IMP-10: same key with different title is a hard collision, not a second write',()=>{
 const h=harness();h.run(a());
 assert.throws(()=>h.run({...a(),title:'Écraser projet'}),/Identifiant déjà utilisé/);
 assert.equal(h.db.actions.length,1);assert.equal(h.writes(),1);
});
test('IMP-10: same key with different project is rejected before writing',()=>{
 const h=harness();h.run(a());
 assert.throws(()=>h.run({...a(),projectId:'b'}),/Identifiant déjà utilisé/);
 assert.equal(h.db.actions.length,1);
});
test('IMP-10: replay cannot bypass revoked project membership',()=>{
 const h=harness();h.run(a());h.ctx.projects=[];
 assert.throws(()=>h.run(a()),/Projet non autorisé/);
 assert.equal(h.writes(),1);
});
test('IMP-10: failed storage rolls back both data and token; retry can succeed once',()=>{
 const h=harness({saveOk:false});
 assert.throws(()=>h.run(a()),/Stockage indisponible/);
 assert.equal(h.db.actions.length,0);assert.equal(h.db.operatorAudit.length,0);
 h.setSave(true);assert.equal(h.run(a()),true);assert.equal(h.run(a()),true);
 assert.equal(h.db.actions.length,1);assert.equal(h.db.operatorAudit.length,1);assert.equal(h.writes(),2);
});
test('IMP-10: two intentionally distinct approvals produce two distinct local actions',()=>{
 const h=harness();h.run(a(k(1)));h.run(a(k(3)));
 assert.equal(h.db.actions.length,2);assert.equal(h.db.operatorAudit.length,2);
});
test('IMP-10: event creation also uses the exact same persisted confirmation receipt',()=>{
 const h=harness();h.run(e());const receipt=h.receipt().id;h.run(e());
 assert.equal(h.db.events.length,1);assert.equal(h.db.operatorAudit.length,1);
 assert.equal(h.receipt().id,receipt);
});
test('IMP-10: event deletion can be acknowledged a second time without recreating it',()=>{
 const h=harness();h.db.events.push({id:'e1',project:'a',title:'Revue projet',date:'2035-05-19T10:00'});
 const x={type:'delete_event',projectId:'a',id:'e1',title:'Revue projet',expectedDate:'2035-05-19T10:00',approvalId:k(4)};
 h.run(x);const receipt=h.receipt().id;h.run(x);
 assert.equal(h.db.events.length,0);assert.equal(h.writes(),1);assert.equal(h.receipt().id,receipt);
});
test('IMP-10: task completion retry is acknowledged without a second status transition',()=>{
 const h=harness();h.db.actions.push({id:'task1',project:'a',title:'Tester',status:'todo'});
 const x={type:'complete_action',projectId:'a',id:'task1',title:'Tester',expectedStatus:'todo',approvalId:k(5)};
 h.run(x);const receipt=h.receipt().id;h.run(x);
 assert.equal(h.db.actions[0].status,'done');assert.equal(h.writes(),1);assert.equal(h.receipt().id,receipt);
});
test('IMP-10: event reschedule retry is acknowledged without duplicate writes',()=>{
 const h=harness();h.db.events.push({id:'e2',project:'a',title:'Démo',date:'2035-05-20T10:00'});
 const x={type:'update_event',projectId:'a',id:'e2',title:'Démo',expectedDate:'2035-05-20T10:00',date:'2035-05-21T11:00',approvalId:k(6)};
 h.run(x);const receipt=h.receipt().id;h.run(x);
 assert.equal(h.db.events[0].date,'2035-05-21T11:00');assert.equal(h.writes(),1);assert.equal(h.receipt().id,receipt);
});
test('IMP-10: malformed approval identifiers are rejected before any local write',()=>{
 const h=harness();
 for(const x of ['short','local-abc','../secret'])assert.throws(()=>h.run(a(x)),/Identifiant de confirmation/);
 assert.equal(h.db.actions.length,0);assert.equal(h.writes(),0);
});
test('IMP-10: local UI prepares an ID once per proposal and forwards it to the executor',()=>{
 const ui=readFileSync('assets/control-operator.js','utf8');
 assert.match(ui,/approvalId:'local-'\+random/);
 assert.match(ui,/pending=\{\.\.\.answer\.action,approvalId/);
 assert.match(ui,/const action=\{\.\.\.pending,title,date\}/);
 assert.match(ui,/if\(!review\(\)\)/);
});
