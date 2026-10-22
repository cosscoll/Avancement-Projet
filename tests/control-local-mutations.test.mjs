import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
const helper=source.match(/function commitLocal\(change\)\{[\s\S]*?\n\}/)?.[0];
function harness(initial,save){
 assert.ok(helper,'Transaction helper must remain available');
 const alerts=[];
 const api=new Function('initial','save','toast', 'let db=initial;'+helper+'; return {commitLocal,read:()=>db};')(
  structuredClone(initial),save,message=>alerts.push(message)
 );
 return {...api,alerts};
}
test('local changes persist once before being confirmed',()=>{
 const saves=[];
 const h=harness({actions:[],lastChanged:'before'},()=>{
  saves.push('saved');return true;
 });
 assert.equal(h.commitLocal(()=>h.read().actions.push({id:'a',title:'Action'})),true);
 assert.deepEqual(h.read().actions,[{id:'a',title:'Action'}]);
 assert.equal(saves.length,1);
 assert.deepEqual(h.alerts,[]);
});
test('quota or private-storage rejection rolls back additions and modifications',()=>{
 const original={actions:[{id:'a',status:'todo'}],missions:[],lastChanged:'before'};
 const h=harness(original,()=>false);
 assert.equal(h.commitLocal(()=>{
  h.read().actions[0].status='done';
  h.read().missions.push({id:'m'});
  h.read().lastChanged='unsaved';
 }),false);
 assert.deepEqual(h.read(),original);
});
test('thrown storage exception rolls back and never confirms the mutation',()=>{
 const original={events:[{id:'e'}]};
 const h=harness(original,()=>{throw Error('QuotaExceededError')});
 assert.equal(h.commitLocal(()=>h.read().events.splice(0,1)),false);
 assert.deepEqual(h.read(),original);
 assert.ok(h.alerts.length>0);
});
test('exception during a mutation does not leave half-written batches',()=>{
 const original={missions:[]};
 const h=harness(original,()=>{throw Error('save should not be called')});
 assert.equal(h.commitLocal(()=>{
  h.read().missions.push({id:'one'});
  throw Error('interrupted batch');
 }),false);
 assert.deepEqual(h.read(),original);
});
test('unserializable prior state prevents a mutation from starting',()=>{
 const initial={actions:[]};initial.loop=initial;
 let invoked=false;
 const h=new Function('db','save','toast',helper+';return {commitLocal,read:()=>db}')(
  initial,()=>true,()=>{}
 );
 assert.equal(h.commitLocal(()=>{invoked=true}),false);
 assert.equal(invoked,false);
});
test('all routine command-center editors use an atomic storage transaction',()=>{
 for(const name of ['new-action','new-mission','edit-mission','new-event','new-resource','new-expense','new-income','monthly-limit','global-rules']){
  const start=source.indexOf("registerForm('#"+name+"'");
  assert.ok(start>0,name+' form exists');
  const fragment=source.slice(start, start+950);
  assert.match(fragment,/commitLocal\(/,name+' must not claim success before a storage commit');
 }
 for(const event of ['done:','delete-event:','expense-del:']){
  const start=source.indexOf("[data-act^=\""+event+"\"]");
  assert.ok(start>0,event+' handler exists');
  assert.match(source.slice(start,start+600),/commitLocal\(/,event+' handler must roll back on write errors');
 }
 assert.match(source,/if\(!commitLocal\(\(\)=>\{for\(const \[provider,step\] of plans\)/);
 assert.match(source,/if\(status==='done'&&!result\)return toast\(/);
 assert.doesNotMatch(source,/m\.status=String\(f\.get\('status'\)\);m\.result=/);
});
