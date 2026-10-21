import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync('assets/command-center.js','utf8');
const coreSource=readFileSync('assets/control-operator-core.js','utf8');
const a=src.indexOf('function goalStepDraft('),b=src.indexOf('function goals(){',a);
const s=src.indexOf('function operatorSnapshot(){'),e=src.indexOf('function localai(){',s);
assert.ok(a>0&&b>a&&s>0&&e>s,'Run the exact production draft and local action code');
const coreContext={window:{}};vm.runInNewContext(coreSource,coreContext);
const core=coreContext.window.CONTROL_OPERATOR_CORE;
function harness(saveOk=true){
 const ctx={projects:[{id:'ucp',name:'Un Coup de Pouce'},{id:'other',name:'Projet distinct'}]};
 const plan={id:'plan-12345678-abc',project:'ucp',status:'proposition',goal:'Livrer le MVP',signature:'plan-original-v1',
   steps:[{title:'Établir le résultat',criterion:'Contrôle daté',source:'Décision locale · rev 2'},{title:'Tester la livraison',criterion:'Tests réussis',source:'Tâche locale · task1'}]};
 const db={goalPlans:[plan],actions:[],events:[],missions:[],meetings:[],operatorAudit:[]};
 let writes=0,sequence=0,permitted=saveOk;
 const sandbox=vm.createContext({db,ctx,window:{CONTROL_OPERATOR_CORE:core},Date,id:()=>String(++sequence),save:()=>{writes++;return permitted}});
 vm.runInContext(src.slice(a,b)+'\n'+src.slice(s,e),sandbox);
 return {ctx,db,plan,draft:(i=0,title)=>sandbox.goalStepDraft(plan.id,i,title),snapshot:()=>sandbox.operatorSnapshot(),execute:x=>sandbox.operatorExecute(x),receipt:()=>sandbox.operatorReceipt(),writes:()=>writes,allow:x=>permitted=x};
}
test('IMP-01 step proposal is read-only until explicit operator execution',()=>{
 const h=harness(),action=h.draft();assert.equal(action.type,'create_action');assert.equal(action.projectId,'ucp');
 assert.ok(action.approvalId.startsWith('local-'));assert.equal(h.db.actions.length,0);assert.equal(h.writes(),0);
});
test('IMP-05 review of a plan step states exact project, before, after and risk',()=>{
 const h=harness(),review=core.reviewAction(h.draft(),h.snapshot(),'general');
 assert.match(review.target,/Un Coup de Pouce/);assert.match(review.before,/Aucune/);
 assert.match(review.after,/Établir le résultat/);assert.match(review.risk,/appareil/);
});
test('same plan step creates one task with a persisted receipt and replay is idempotent',()=>{
 const h=harness(),action=h.draft(),preview=core.reviewAction(action,h.snapshot(),'general');
 assert.match(preview.after,/résultat/);assert.equal(h.execute(action),true);
 const first=h.receipt();assert.ok(first?.id);assert.equal(first.project,'ucp');
 assert.equal(h.execute(action),true);assert.equal(h.receipt().id,first.id);
 assert.equal(h.db.actions.length,1);assert.equal(h.db.operatorAudit.length,1);assert.equal(h.writes(),1);
});
test('a different plan step receives a distinct idempotent approval identifier',()=>{
 const h=harness();assert.notEqual(h.draft(0).approvalId,h.draft(1).approvalId);
 h.execute(h.draft(0));h.execute(h.draft(1));assert.equal(h.db.actions.length,2);
});
test('editing a title changes the reviewed result, and reuse of approved ID is denied',()=>{
 const h=harness(),draft=h.draft(),edited=h.draft(0,'Titre modifié');
 assert.notEqual(core.reviewAction(draft,h.snapshot(),'general').after,core.reviewAction(edited,h.snapshot(),'general').after);
 h.execute(draft);assert.throws(()=>h.execute(edited),/Identifiant déjà utilisé/);
 assert.equal(h.db.actions.length,1);
});
test('missing and removed plans and projects cannot prepare or execute action',()=>{
 const h=harness(),original=h.draft();
 h.db.goalPlans=[];assert.throws(()=>h.draft(),/Plan ou projet indisponible/);
 h.db.goalPlans=[h.plan];h.ctx.projects=h.ctx.projects.filter(p=>p.id!=='ucp');
 assert.throws(()=>h.draft(),/Plan ou projet indisponible/);
 assert.throws(()=>h.execute(original),/Projet non autorisé/);
});
test('plan marked as executed or archived is not treated as an unapproved proposal',()=>{
 const h=harness();h.plan.status='done';assert.throws(()=>h.draft(),/Plan ou projet indisponible/);
});
test('invalid step indexes and missing source or criterion are refused',()=>{
 const h=harness();
 for(const i of [-1,4,0.5,NaN])assert.throws(()=>h.draft(i),/Étape de plan/);
 h.plan.steps[0].source='';assert.throws(()=>h.draft(),/Source ou critère/);
});
test('title length is explicit and not silently truncated',()=>{
 const h=harness();for(const title of ['', 'a'.repeat(161)])assert.throws(()=>h.draft(0,title),/160 caractères/);
});
test('failed local storage leaves neither a task nor an audit receipt, allows later attempt',()=>{
 const h=harness(false),action=h.draft();
 assert.throws(()=>h.execute(action),/Stockage indisponible/);
 assert.equal(h.db.actions.length,0);assert.equal(h.db.operatorAudit.length,0);
 h.allow(true);assert.equal(h.execute(action),true);assert.equal(h.db.actions.length,1);
});
test('no references to other projects are inserted into the plan step action',()=>{
 const h=harness(),a=h.draft();
 assert.equal(a.projectId,'ucp');assert.ok(!JSON.stringify(a).includes('Projet distinct'));
});
test('the actual UI requires consent, renders risk and after-state, and prevents duplicate approval',()=>{
 const ui=src.slice(src.indexOf('function goals(){'),src.indexOf('function searchResults(',src.indexOf('function goals(){')));
 assert.match(ui,/data-goal-step/);assert.match(ui,/goal-action-confirm/);
 assert.match(ui,/consentement explicite/);assert.match(ui,/reviewAction\(/);
 assert.match(ui,/name="consent" required/);assert.match(ui,/data-goal-after/);
 assert.match(ui,/operatorExecute\(action\)/);assert.match(ui,/operatorReceipt\(\)/);
 assert.match(ui,/some\(x=>x\.approval_id===action\.approvalId\)/);
 assert.match(ui,/formTitle\.addEventListener\('input'/);
});
