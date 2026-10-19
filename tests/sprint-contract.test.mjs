import test from 'node:test';
import assert from 'node:assert/strict';
import {PROJECTS,validateReport,validateProjectFile} from '../scripts/sprint-contract.mjs';

for(const project of PROJECTS)test('historique '+project+' reste valide sans être effacé',()=>{
 assert.deepEqual(validateProjectFile(project),[]);
});
const baseline={
 schema_version:2,id:'example-unique',started_at:'2026-10-19T10:10:00+02:00',ended_at:'2026-10-19T10:15:00+02:00',
 objectives:[{before:'non disponible',after:'accessible et vérifié',acceptance:'parcours navigateur'}],
 summary:'échantillon',done:[],blockers:[],links:[],deliverables:[],quality:{ci:'not_verified',checks_run:[],checks_passed:[]}
};
test('la preuve online ne peut pas être une simple affirmation',()=>{
 const x=structuredClone(baseline);x.deliverables=[{name:'Parcours',stage:'verified_online',url:'https://github.com/cosscoll/Avancement-Projet'}];
 assert.ok(validateReport(x).some(e=>e.includes('online verified/operational claim')));
 x.deliverables[0].online_url='https://example.org/';
 x.deliverables[0].online_verified_at='2026-10-19T10:14:00+02:00';
 x.deliverables[0].online_evidence_url='https://github.com/cosscoll/Avancement-Projet/actions/runs/123';
 assert.deepEqual(validateReport(x),[]);
});
test('dates incohérentes et champs de suivi manquants échouent',()=>{
 const x=structuredClone(baseline);x.ended_at='2026-10-19T09:00:00+02:00';
 assert.ok(validateReport(x).some(e=>e.includes('precedes')));
 delete x.objectives;
 assert.ok(validateReport(x).some(e=>e.includes('v2 requires')));
});
