import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('assets/command-center.js','utf8');
const start=source.indexOf('function proposeGoal('),end=source.indexOf('function goals(){',start);
assert.ok(start>0&&end>start,'Use actual goal planner production implementation');
const code=source.slice(start,end);
function setup(canSave=true){
 const ctx={projects:[{id:'a',name:'Projet Alpha'},{id:'b',name:'Projet Beta'}]};
 const db={actions:[{id:'a1',project:'a',title:'Vérifier la page',status:'todo'},{id:'b1',project:'b',title:'Secret Beta',status:'todo'}],decisions:[{id:'d1',project:'a',title:'Validé en réunion',version:2,source:'PV rédigé'},{id:'d2',project:'b',title:'Décision privée Beta'}],goalPlans:[]};
 let writes=0,allowed=canSave;
 const script=vm.runInNewContext(code+'\n({proposeGoal,saveGoalPlan})',{db,ctx,save:()=>{writes++;return allowed},decisionVersion:x=>x.version||1,Date});
 return {db,ctx,...script,writes:()=>writes,setAllowed:x=>allowed=x};
}
const goal='Mettre un produit en ligne et vérifier le résultat';
const save=(h,id='goal_1234567890',plan=h.proposeGoal('a',goal))=>h.saveGoalPlan({...plan,id});
test('IMP-01 proposal is project-scoped and cites only current project evidence',()=>{
 const h=setup(),p=h.proposeGoal('a',goal);
 assert.equal(p.projectId,'a');assert.ok(p.steps.length>=3);
 assert.ok(p.steps.some(x=>x.source.includes('PV rédigé')));
 assert.ok(p.steps.some(x=>x.source.includes('a1')));
 assert.doesNotMatch(JSON.stringify(p),/Secret Beta|Décision privée Beta|b1|d2/);
});
test('IMP-01 every proposed step includes source and an explicit criterion',()=>{
 const p=setup().proposeGoal('a',goal);
 assert.ok(p.steps.every(x=>x.title&&x.source&&x.criterion));
 assert.equal(p.status,'proposition');
});
test('IMP-01 no existing tasks produces a non-executing decomposition suggestion',()=>{
 const h=setup();h.db.actions=[];
 const p=h.proposeGoal('a',goal);
 assert.ok(p.steps.some(x=>x.title.includes('Décomposer')));
 assert.match(JSON.stringify(p),/sans exécution/);
});
test('IMP-01 rejects unknown project and goal length',()=>{
 const h=setup();
 assert.throws(()=>h.proposeGoal('no',goal),/projet existant/);
 assert.throws(()=>h.proposeGoal('a','court'),/Objectif invalide/);
 assert.throws(()=>h.proposeGoal('a','x'.repeat(501)),/Objectif invalide/);
});
test('IMP-01 saving a proposed plan never mutates tasks or decisions',()=>{
 const h=setup(),actions=JSON.stringify(h.db.actions),decisions=JSON.stringify(h.db.decisions);
 const p=save(h);assert.equal(p.status,'proposition');
 assert.equal(JSON.stringify(h.db.actions),actions);assert.equal(JSON.stringify(h.db.decisions),decisions);
 assert.equal(h.db.goalPlans.length,1);assert.equal(h.writes(),1);
});
test('IMP-01 a repeated same proposal reuses saved ID without duplicate write',()=>{
 const h=setup(),p=h.proposeGoal('a',goal);
 assert.equal(save(h,'goal_1234567890',p).id,save(h,'goal_1234567890',p).id);
 assert.equal(h.db.goalPlans.length,1);assert.equal(h.writes(),1);
});
test('IMP-01 same ID with different edited criterion is rejected',()=>{
 const h=setup(),p=h.proposeGoal('a',goal);save(h,'goal_1234567890',p);
 const edited={...p,steps:p.steps.map(x=>({...x}))};edited.steps[0].criterion='Autre justification';
 assert.throws(()=>save(h,'goal_1234567890',edited),/déjà utilisée/);
});
test('IMP-01 saved plan is denied if selected project has been revoked',()=>{
 const h=setup(),p=h.proposeGoal('a',goal);h.ctx.projects=h.ctx.projects.filter(x=>x.id!=='a');
 assert.throws(()=>save(h,'goal_1234567890',p),/Projet absent/);
 assert.equal(h.db.goalPlans.length,0);
});
test('IMP-01 failed local persistence rolls back plan without phantom success',()=>{
 const h=setup(false);
 assert.throws(()=>save(h),/Stockage indisponible/);
 assert.equal(h.db.goalPlans.length,0);
 h.setAllowed(true);assert.equal(save(h).id,'goal_1234567890');
 assert.equal(h.writes(),2);
});
test('IMP-01 editable steps and criteria are persisted exactly, with sources intact',()=>{
 const h=setup(),plan=h.proposeGoal('a',goal);
 const x={...plan,steps:plan.steps.map(step=>({...step}))};
 x.steps[0].title='Préciser le KPI';x.steps[0].criterion='Taux de réussite mesuré';
 const saved=save(h,'goal_1234567890',x);
 assert.equal(saved.steps[0].title,'Préciser le KPI');assert.equal(saved.steps[0].criterion,'Taux de réussite mesuré');
 assert.equal(saved.steps[0].source,plan.steps[0].source);
});
test('IMP-01 oversized steps, blank evidence, malformed ID and unsupported scope rejected',()=>{
 const h=setup(),p=h.proposeGoal('a',goal);
 assert.throws(()=>save(h,'bad',p),/Proposition invalide/);
 assert.throws(()=>save(h,'goal_1234567890',{...p,steps:[{title:'',criterion:'X',source:'Y'},{title:'T',criterion:'C',source:'Z'}]}),/Étape ou critère/);
 assert.throws(()=>save(h,'goal_1234567890',{...p,steps:p.steps.slice(0,1)}),/Étapes invalides/);
 assert.equal(h.writes(),0);
});
test('IMP-01 local UI makes editable proposal and labels source without implying execution',()=>{
 const ui=source.slice(source.indexOf('function goals(){'),source.indexOf('function searchResults(',source.indexOf('function goals(){')));
 assert.match(ui,/id="goal-request"/);assert.match(ui,/id="goal-confirm"/);
 assert.match(ui,/Source :/);assert.match(ui,/Sauvegarder le plan ne crée aucune tâche/);
 assert.match(ui,/saveGoalPlan/);assert.match(source,/memory,goals,budget/);
});
