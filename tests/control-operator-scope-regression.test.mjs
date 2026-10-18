import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const frame={window:{}};
vm.runInNewContext(readFileSync('assets/control-operator-core.js','utf8'),frame);
const interpret=frame.window.CONTROL_OPERATOR_CORE.interpret;
const data={projects:[{id:'a',name:'Projet Alpha'},{id:'b',name:'Projet Beta'}],actions:[{id:'one',project:'a',title:'Confidentiel Alpha',status:'todo'},{id:'two',project:'b',title:'Confidentiel Beta',status:'todo'}],missions:[],events:[],meetings:[]};
test('unknown project scope cannot fall back to all projects',()=>{
 const result=interpret('Mes tâches',data,'deleted');
 assert.doesNotMatch(result.text,/Confidentiel/);
});
test('a request naming a different project cannot create a task in selected project',()=>{
 const result=interpret('Crée une tâche audit pour Projet Beta',data,'a');
 assert.notEqual(result.kind,'draft');
});
test('ambiguous project names require disambiguation before a write',()=>{
 const result=interpret('Crée une tâche audit pour Projet Alpha et Projet Beta',data,'general');
 assert.notEqual(result.kind,'draft');
});
