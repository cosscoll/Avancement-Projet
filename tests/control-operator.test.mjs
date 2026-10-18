import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('assets/control-operator-core.js','utf8');
const frame={window:{}};
vm.runInNewContext(source,frame);
const core=frame.window.CONTROL_OPERATOR_CORE;
const sample={
 projects:[{id:'ucp',name:'Un Coup de Pouce',short:'UCP',status:'Développement',description:'Plateforme BTP'},{id:'iagile',name:'IAgile',status:'En cours'}],
 actions:[{id:'a1',project:'ucp',title:'Tester le site',priority:'Haute',status:'todo'},{id:'a2',project:'iagile',title:'Secret autre projet',status:'todo'}],
 missions:[{id:'m1',project:'ucp',title:'Développer API',provider:'Codex',status:'doing'},{id:'m2',project:'iagile',title:'Mission privée autre projet',provider:'Claude',status:'review'}],
 events:[],meetings:[]
};
test('finds project and reports only declarative statuses',()=>{
 const a=core.interpret('Où en est UCP ?',sample);
 assert.equal(a.kind,'read');
 assert.match(a.text,/Un Coup de Pouce/);
 assert.match(a.text,/Source : fiche projet/);
 const b=core.interpret('Quelle IA travaille sur UCP ?',sample);
 assert.match(b.text,/Codex/);
 assert.match(b.text,/déclaratif/);
 assert.doesNotMatch(b.text,/Mission privée/);
});
test('project-selected scope prevents cross-project content disclosure',()=>{
 const a=core.interpret('Mes tâches',sample,'ucp');
 assert.match(a.text,/Tester le site/);
 assert.doesNotMatch(a.text,/Secret autre projet/);
 const b=core.interpret('Quelles IA travaillent ?',sample,'ucp');
 assert.doesNotMatch(b.text,/Mission privée autre projet/);
 const c=core.interpret('Où en est IAgile ?',sample,'ucp');
 assert.doesNotMatch(c.text,/En cours/);
});
test('creates a draft, never performs a write in the interpreter',()=>{
 const original=JSON.stringify(sample);
 const response=core.interpret('Crée une tâche corriger la landing pour UCP',sample);
 assert.equal(response.kind,'draft');
 assert.equal(response.action.type,'create_action');
 assert.equal(response.action.projectId,'ucp');
 assert.match(response.action.title,/corriger la landing/);
 assert.equal(JSON.stringify(sample),original);
});
test('recognizes explicit appointment dates and rejects invalid dates',()=>{
 assert.equal(core.parseDate('le 25/10/2026 à 14h30'),'2026-10-25T14:30');
 assert.equal(core.parseDate('2026-10-25 à 09:15'),'2026-10-25T09:15');
 assert.equal(core.validateDate('2026-02-30T10:00'),false);
 assert.equal(core.validateDate('2028-02-29T10:00'),true);
 const draft=core.interpret('Programme un rendez-vous le 25/10/2026 à 14h30 pour UCP',sample);
 assert.equal(draft.kind,'draft');
 assert.equal(draft.action.type,'create_event');
 assert.equal(draft.action.date,'2026-10-25T14:30');
});
test('task completion requires an exact unambiguous title',()=>{
 const a=core.interpret('Termine la tâche Tester le site',sample);
 assert.equal(a.kind,'draft');
 assert.equal(a.action.type,'complete_action');
 assert.equal(a.action.id,'a1');
 const b=core.interpret('Termine ma tâche',sample);
 assert.notEqual(b.kind,'draft');
});
test('external provider action claims are explicitly refused',()=>{
 const a=core.interpret('Lance Codex sur UCP',sample);
 assert.equal(a.kind,'help');
 assert.match(a.text,/Aucun fournisseur/);
});
test('write operations use the existing CONTROL state and roll back on storage failure',()=>{
 const text=readFileSync('assets/command-center.js','utf8');
 const snippet=text.slice(text.indexOf('function operatorSnapshot(){'),text.indexOf('function localai(){'));
 assert.match(snippet,/function operatorExecute/);
 const db={actions:[...sample.actions.map(x=>({...x}))],missions:[],events:[],meetings:[],operatorAudit:[]};
 const ctx={projects:sample.projects};
 let saveOk=true;
 const sandbox=vm.createContext({ctx,db,window:{CONTROL_OPERATOR_CORE:core},save:()=>saveOk,id:(()=>{let n=0;return()=>String(++n)})(),Date});
 vm.runInContext(snippet,sandbox);
 assert.equal(sandbox.operatorExecute({type:'create_action',projectId:'ucp',title:'Nouvelle tâche'}),true);
 assert.equal(db.actions.length,3);
 assert.equal(db.operatorAudit.length,1);
 assert.equal(db.operatorAudit[0].scope,'local');
 assert.equal(sandbox.operatorExecute({type:'complete_action',projectId:'ucp',id:'a1',title:'Tester le site',expectedStatus:'todo'}),true);
 assert.equal(db.actions[0].status,'done');
 assert.throws(()=>sandbox.operatorExecute({type:'create_action',projectId:'unknown',title:'Interdit'}),/Projet non autorisé/);
 saveOk=false;
 assert.throws(()=>sandbox.operatorExecute({type:'create_action',projectId:'ucp',title:'Pas enregistré'}),/Stockage indisponible/);
 assert.equal(db.actions.length,3);
 assert.equal(db.operatorAudit.length,2);
 assert.throws(()=>sandbox.operatorExecute({type:'create_event',projectId:'ucp',title:'Date invalide',date:'2026-02-30T10:00'}),/Date et heure invalides/);
});
test('UI requires consent and confirmation, no external tokens',()=>{
 const ui=readFileSync('assets/control-operator.js','utf8');
 const index=readFileSync('index.html','utf8');
 assert.match(ui,/data-op-consent/);
 assert.match(ui,/data-op-confirm/);
 assert.match(ui,/adapter\.execute\(action\)/);
 assert.match(ui,/if\(!consent.checked\)/);
 assert.match(index,/assets\/control-operator-core\.js/);
 assert.match(index,/assets\/control-operator\.js/);
});

test('confirmed calendar edit and delete remain local and reversible on storage failure',()=>{
 const source=readFileSync('assets/command-center.js','utf8');
 const snippet=source.slice(source.indexOf('function operatorSnapshot(){'),source.indexOf('function localai(){'));
 const db={actions:[],missions:[],events:[{id:'e1',project:'ucp',title:'Revue de projet',date:'2026-10-20T14:00'}],meetings:[],operatorAudit:[]};
 const ctx={projects:sample.projects};
 let saveOk=true;
 const sandbox=vm.createContext({ctx,db,window:{CONTROL_OPERATOR_CORE:core},save:()=>saveOk,id:()=>String(Date.now()),Date});
 vm.runInContext(snippet,sandbox);
 const moved=core.interpret('Déplace le rendez-vous Revue de projet au 25/10/2026 à 16h00 pour UCP',{...sample,events:db.events});
 assert.equal(moved.action.type,'update_event');
 assert.equal(moved.action.date,'2026-10-25T16:00');
 assert.equal(sandbox.operatorExecute(moved.action),true);
 assert.equal(db.events[0].date,'2026-10-25T16:00');
 saveOk=false;
 assert.throws(()=>sandbox.operatorExecute({type:'update_event',id:'e1',projectId:'ucp',title:'Revue de projet',date:'2026-10-27T10:30',expectedDate:'2026-10-25T16:00'}),/Stockage indisponible/);
 assert.equal(db.events[0].date,'2026-10-25T16:00');
 const canceled=core.interpret('Supprime le rendez-vous Revue de projet',{...sample,events:db.events});
 assert.equal(canceled.action.type,'delete_event');
 assert.throws(()=>sandbox.operatorExecute(canceled.action),/Stockage indisponible/);
 assert.equal(db.events.length,1,'A failed deletion must be reverted');
 saveOk=true;
 assert.equal(sandbox.operatorExecute(canceled.action),true);
 assert.equal(db.events.length,0);
 assert.equal(db.operatorAudit.length,2);
});
