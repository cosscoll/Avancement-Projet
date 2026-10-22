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
 for(const name of ['new-action','new-mission','edit-mission','new-resource','new-expense','new-income','monthly-limit','global-rules']){
  const start=source.indexOf("registerForm('#"+name+"'");
  assert.ok(start>0,name+' form exists');
  const fragment=source.slice(start, start+950);
  assert.match(fragment,/commitLocal\(/,name+' must not claim success before a storage commit');
 }
 for(const event of ['done:','expense-del:']){
  const start=source.indexOf("[data-act^=\""+event+"\"]");
  assert.ok(start>0,event+' handler exists');
  assert.match(source.slice(start,start+600),/commitLocal\(/,event+' handler must roll back on write errors');
 }
 assert.match(source,/if\(!commitLocal\(\(\)=>\{for\(const \[provider,step\] of plans\)/);
 assert.match(source,/if\(status==='done'&&!result\)return toast\(/);
 assert.doesNotMatch(source,/m\.status=String\(f\.get\('status'\)\);m\.result=/);
});

test('malformed local JSON is never silently overwritten by an empty dashboard',()=>{
 const storageFn=source.match(/function storage\(\)\{[^\n]+/)?.[0];
 const saveFn=source.match(/function save\(\)\{[^\n]+/)?.[0];
 assert.ok(storageFn&&saveFn);
 let writes=0;const alerts=[];
 const api=new Function('localStorage','toast',
  'const KEY="control-command-v1";let localStoreCorrupt=false,db={actions:[]};'+storageFn+'\n'+saveFn+'\nreturn {storage,save,flag:()=>localStoreCorrupt};'
 )({getItem:()=>'{malformed-json',setItem:()=>{writes++}},message=>alerts.push(message));
 assert.deepEqual(api.storage(),{});
 assert.equal(api.flag(),true);
 assert.equal(api.save(),false);
 assert.equal(writes,0);
 assert.match(alerts.at(-1),/restaure une sauvegarde/);
});

test('valid local state still persists normally after corruption recovery',()=>{
 const storageFn=source.match(/function storage\(\)\{[^\n]+/)?.[0];
 const saveFn=source.match(/function save\(\)\{[^\n]+/)?.[0];
 let raw='{broken',writes=0;
 const api=new Function('localStorage','toast',
  'const KEY="control-command-v1";let localStoreCorrupt=false,db={actions:[]};'+storageFn+'\n'+saveFn+'\nreturn {storage,save,flag:()=>localStoreCorrupt};'
 )({getItem:()=>raw,setItem:(_,v)=>{writes++;raw=v}},()=>{});
 api.storage();
 assert.equal(api.flag(),true);
 raw='{"actions":[{"id":"recovered"}]}';
 assert.deepEqual(api.storage(),{actions:[{id:'recovered'}]});
 assert.equal(api.flag(),false);
 assert.equal(api.save(),true);
 assert.equal(writes,1);
});

test('recovery surface offers raw download, blocks normal export and keeps Cloud disabled',()=>{
 assert.match(source,/role="alert"[\s\S]{0,200}Stockage local illisible/);
 assert.match(source,/data-act="download-corrupt"/);
 assert.match(source,/if\(localStoreCorrupt\)return toast\('Export normal bloqué/);
 assert.match(source,/const raw=localStorage\.getItem\(KEY\)/);
 assert.match(source,/localStoreCorrupt=false;init\(\)/);
 const cloud=JSON.parse(readFileSync(new URL('../config/cloud.json',import.meta.url),'utf8'));
 assert.equal(cloud.enabled,false);
});

test('backup rejects corrupt project and automation stores instead of exporting empty objects',()=>{
 const readFn=source.match(/function readBackupStore\(key\)\{[^\n]+/)?.[0];
 const issuesFn=source.match(/function backupStorageIssues\(\)\{[^\n]+/)?.[0];
 assert.ok(readFn&&issuesFn,'Backup verification functions must exist');
 const values=new Map([
  ['control-command-v1','{"actions":[],"missions":[]}'],
  ['control-hub-v2','{broken-project-json'],
  ['control-automations-v1','[]']
 ]);
 const check=new Function('localStorage',
  'const KEY="control-command-v1",HUB="control-hub-v2",AUTOS="control-automations-v1";'+readFn+'\n'+issuesFn+'\nreturn {readBackupStore,backupStorageIssues};'
 )({getItem:key=>values.get(key)??null});
 assert.deepEqual(check.readBackupStore('control-command-v1'),{actions:[],missions:[]});
 assert.deepEqual(check.backupStorageIssues().map(x=>x.key),['control-hub-v2','control-automations-v1']);
 assert.throws(()=>check.readBackupStore('control-hub-v2'),SyntaxError);
 assert.throws(()=>check.readBackupStore('control-automations-v1'),/Invalid backup source/);
 values.set('control-hub-v2','{"projects":{"abc":{}}}');
 values.set('control-automations-v1','{"drafts":[]}');
 assert.deepEqual(check.backupStorageIssues(),[]);
 values.delete('control-hub-v2');
 assert.deepEqual(check.readBackupStore('control-hub-v2'),{});
});
test('backup interface exposes only local recovery and refuses incomplete exports before encryption',()=>{
 assert.match(source,/const recovery=brokenStores\.filter\(x=>x\.key!==KEY\)/);
 assert.match(source,/download-raw:\x27\+\(x\.key===HUB\?/);
 assert.match(source,/if\(backupStorageIssues\(\)\.length\)return toast\('Export bloqué/);
 assert.match(source,/function downloadRawStorage\(key,label\)/);
 assert.match(source,/data-act="download-raw:\x27\+name/);
 assert.doesNotMatch(source.slice(source.indexOf('function downloadRawStorage('),source.indexOf('function backup(){')),/fetch\(|XMLHttpRequest/);
});

test('local agenda uses a single validated and atomic event commit',()=>{
 assert.match(source,/function submitEvent\(form,editId=''\)/);
 assert.match(source,/registerForm\('#new-event',\(f,form\)=>submitEvent\(form\)\)/);
 assert.match(source,/registerForm\('#edit-event',\(f,form\)=>submitEvent\(form,String\(f.get\('id'\)\)\)\)/);
 assert.match(source,/if\(!commitLocal\(\(\)=>\{if\(editId\)/);
 assert.match(source,/if\(commitLocal\(\(\)=>\{db\.events=db\.events\.filter\(e=>e\.id!==eventId\)\}\)\)calendar\(\)/);
});
