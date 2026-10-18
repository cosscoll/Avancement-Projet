import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(readFileSync('assets/control-operator-core.js','utf8'),context);
const interpret=context.window.CONTROL_OPERATOR_CORE.interpret;
const snapshot={projects:[{id:'alpha',name:'Projet Alpha'}],actions:[{id:'task-1',project:'alpha',title:'Préparer rapport',status:'doing'}],events:[{id:'event-1',project:'alpha',title:'Revue mensuelle',date:'2026-11-12T14:00'}],missions:[],meetings:[]};
test('completion draft captures status at proposal time',()=>{
 const r=interpret('Marque la tâche Préparer rapport terminée',snapshot,'alpha');
 assert.equal(r.kind,'draft');assert.equal(r.action.expectedStatus,'doing');
});
test('delete draft captures original appointment date',()=>{
 const r=interpret('Supprime le rendez-vous Revue mensuelle',snapshot,'alpha');
 assert.equal(r.kind,'draft');assert.equal(r.action.expectedDate,'2026-11-12T14:00');
});
test('move draft captures original appointment date',()=>{
 const r=interpret('Déplace le rendez-vous Revue mensuelle le 13/11/2026 à 15h00',snapshot,'alpha');
 assert.equal(r.kind,'draft');assert.equal(r.action.expectedDate,'2026-11-12T14:00');
});
