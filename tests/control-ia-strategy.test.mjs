import test from 'node:test';
import assert from 'node:assert/strict';
import {readJson,validateStrategy,summary,REQUIRED_IMPROVEMENTS} from '../scripts/control-ia-strategy.mjs';
const original=readJson('data/control-ia-strategy.json');
const delivery=readJson('data/control-ia-delivery.json');
const copy=()=>structuredClone(original);
test('ten user-requested improvements are distinct, measurable and compatible with delivery tracker',()=>{
 assert.deepEqual(validateStrategy(original,delivery),[]);
 assert.equal(summary(original).initiatives,10);
 assert.ok(summary(original).criteria>=30);
 assert.deepEqual([...original.improvements.map(x=>x.id)].sort(),[...REQUIRED_IMPROVEMENTS].sort());
});
test('classic sessions and automation share a single WIP=1 checkpoint and lease',()=>{
 assert.equal(original.work_policy.max_primary_workstreams,1);
 assert.equal(original.work_policy.common_lock_file,'data/sprint-state/control-ia.json');
 assert.deepEqual([...original.work_policy.session_types].sort(),['conversation','scheduled']);
});
test('current functional focus cannot silently drift from the established account foundation',()=>{
 const s=copy();s.focus.capability='CONTROL-AGENTS';
 assert.ok(validateStrategy(s,delivery).some(x=>x.includes('Main focus differs')));
});
test('strategy refuses safety relaxation, paid backend or uncontrolled Cloud activation',()=>{
 const s=copy();s.focus.cloud_activation_allowed=true;s.safety.budget_eur=1;
 const errors=validateStrategy(s,delivery);
 assert.ok(errors.some(x=>x.includes('Cloud must be explicitly disabled')));
 assert.ok(errors.some(x=>x.includes('Permanent safety')));
});
test('an initiative cannot be marked operational without every accepted criterion and proof',()=>{
 const s=copy(),x=s.improvements[0];x.status='operational';x.external_blockers=[];
 assert.ok(validateStrategy(s,delivery).some(e=>e.includes('false operational claim')));
});
test('unverified criteria cannot be checked without evidence',()=>{
 const s=copy(),x=s.improvements[0];x.accepted_criteria=[0];
 assert.ok(validateStrategy(s,delivery).some(e=>e.includes('criterion accepted without evidence')));
});
test('cycles are rejected even when all dependency identifiers exist',()=>{
 const s=copy();s.improvements.find(x=>x.id==='IMP-05').depends_on=['IMP-03'];
 assert.ok(validateStrategy(s,delivery).some(e=>e.includes('Circular improvement dependency')));
});
test('invalid legacy links are rejected so existing 36 criteria stay traceable',()=>{
 const s=copy();s.improvements[0].existing.push('CONTROL-NOT-IN-BACKLOG');
 assert.ok(validateStrategy(s,delivery).some(e=>e.includes('unknown legacy capability')));
});
test('roadmap requires phases and complete coverage of ten improvements',()=>{
 const s=copy();s.roadmap_phases.find(x=>x.id===3).targets=[];
 assert.ok(validateStrategy(s,delivery).some(e=>e.includes('exactly once')));
});
test('handoff cannot lose previous unfinished PWA checkpoint',()=>{
 const s=copy();s.handoff.checkpoint_to_review='new speculative feature';
 assert.ok(validateStrategy(s,delivery).some(e=>e.includes('Prior unfinished PWA checkpoint')));
});
test('sprint handoff must be executable, bounded and concrete',()=>{
 const s=copy();s.handoff.next_steps=[];
 assert.ok(validateStrategy(s,delivery).some(e=>e.includes('one to three')));
});
test('mandatory protocol content documents both execution modes and evidence boundaries',()=>{
 const {readFileSync}=await import('node:fs');
 const doc=readFileSync('docs/CONTROL_IA_ORGANISATION_SPRINTS.md','utf8');
 for(const phrase of ['conversation classique','automatisation','autocritique','deuxième passe','data/control-ia-strategy.json','45 minutes','0 €'])assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()),phrase);
});
