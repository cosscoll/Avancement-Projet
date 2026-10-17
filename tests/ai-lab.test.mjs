import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const f=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const js=f('assets/ai-lab.js');
const w={};
new Function('window',js)(w);
const lab=w.CONTROL_LAB;

test('Laboratory produces a bounded, verifiable brief for a selected project',()=>{
 const output=lab.compose({project:{name:'Demo',description:'MVP web',context:['1 action à vérifier'],reports:['Claude : à confirmer']},objective:'Corriger le menu mobile',model:'Codex',kind:'code',includeReports:true});
 assert.match(output,/MISSION CONTROL — Codex/);
 assert.match(output,/Corriger le menu mobile/);
 assert.match(output,/à confirmer/);
 assert.match(output,/sans confirmation explicite/);
 assert.match(output,/preuves/i);
});
test('Secrets in prompts are masked and no backend is called by the client utility',()=>{
 const output=lab.compose({objective:'Analyser sk-proj-abcdefghijklmnopqrstuvwxyz password=abcdefghi',project:{name:'Demo'}});
 assert.doesNotMatch(output,/sk-proj-abcdefghijklmnopqrstuvwxyz|abcdefghi/);
 assert.match(output,/MASQUÉE/);
 assert.doesNotMatch(js,/localStorage\.setItem|fetch\(/);
});
test('JSON formatter validates syntax and mandatory top-level keys',()=>{
 const valid=lab.parseJSON('{"state":"ok","tasks":[1,2]}','state,tasks');
 assert.equal(valid.keys,2);
 assert.deepEqual(valid.missing,[]);
 assert.match(valid.formatted,/\n/);
 assert.deepEqual(lab.parseJSON('{"state":"ok"}','state,tasks').missing,['tasks']);
 assert.throws(()=>lab.parseJSON('{invalid'),SyntaxError);
});
test('Comparison and difference utilities are purely indicative',()=>{
 const a=lab.scoreAnswer('1. Tests réalisés. Voici le fichier et les résultats. Validation nécessaire.','Tests et fichier',[]);
 assert.equal(a.total,6);
 assert.equal(a.items.length,6);
 const d=lab.compareText('alpha\nbeta','alpha\ngamma');
 assert.equal(d.identical,1);
 assert.ok(d.lines.some(x=>x.includes('+ 2: gamma')));
 assert.match(d.notice,/pas une analyse sémantique/);
});
test('Tools are reachable from personal and Cloud navigation without enabling public signup',()=>{
 const personal=f('index.html'),cloud=f('app.html');
 assert.match(personal,/assets\/ai-lab\.js/);
 assert.match(cloud,/assets\/ai-lab\.js/);
 assert.match(f('assets/command-center.js'),/function lab\(/);
 assert.match(f('assets/cloud-app.js'),/lab:labPage/);
 assert.match(f('service-worker.js'),/ai-lab\.css/);
 assert.equal(JSON.parse(f('config/cloud.json')).enabled,false);
});
