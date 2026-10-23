import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
const storage=source.match(/function storage\(\)\{[^\n]+/)?.[0];
const save=source.match(/function save\(\)\{[^\n]+/)?.[0];
const commit=source.match(/function commitLocal\(change\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(storage&&save&&commit,'All three persistence helpers must be available');

function shared(){
 let raw=null,writes=0;
 return {getItem(){return raw},setItem(key,value){assert.equal(key,'control-command-v1');raw=value;writes++},
  raw:()=>raw,writes:()=>writes,external:value=>{raw=value}};
}
function tab(store){
 const notices=[];
 const methods=new Function('localStorage','toast',`
 const KEY='control-command-v1';
 let localStoreCorrupt=false,localLastLoadedRaw=null;
 let db={actions:[],decisions:[],meetings:[]};
 `+storage+'\n'+save+'\n'+commit+`
 function reload(){db={actions:[],decisions:[],meetings:[],...storage()};}
 reload();
 return {save,commitLocal,reload,read:()=>db,baseline:()=>localLastLoadedRaw};
 `)(store,x=>notices.push(x));
 return {...methods,notices};
}
test('stale second tab cannot silently erase actions written by first tab',()=>{
 const store=shared(),a=tab(store),b=tab(store);
 assert.equal(a.commitLocal(()=>a.read().actions.push({id:'a',title:'First tab'})),true);
 const latest=store.raw();
 assert.equal(b.commitLocal(()=>b.read().actions.push({id:'b',title:'Stale tab'})),false);
 assert.equal(store.raw(),latest);
 assert.equal(store.writes(),1);
 assert.deepEqual(b.read().actions,[]);
 assert.match(b.notices.join(' '),/autre onglet/);
 assert.deepEqual(JSON.parse(store.raw()).actions,[{id:'a',title:'First tab'}]);
});
test('reloading after conflict permits preserving the other tab data',()=>{
 const store=shared(),a=tab(store),b=tab(store);
 assert.equal(a.commitLocal(()=>a.read().actions.push({id:'first'})),true);
 assert.equal(b.commitLocal(()=>b.read().actions.push({id:'stale'})),false);
 b.reload();
 assert.equal(b.commitLocal(()=>b.read().actions.push({id:'second'})),true);
 assert.deepEqual(JSON.parse(store.raw()).actions,[{id:'first'},{id:'second'}]);
});
test('same-tab sequential saves refresh the baseline and keep all decisions',()=>{
 const store=shared(),a=tab(store);
 assert.equal(a.commitLocal(()=>a.read().decisions.push({id:'one'})),true);
 const baseline=a.baseline();
 assert.equal(baseline,store.raw());
 assert.equal(a.commitLocal(()=>a.read().decisions.push({id:'two'})),true);
 assert.deepEqual(JSON.parse(store.raw()).decisions,[{id:'one'},{id:'two'}]);
 assert.equal(store.writes(),2);
});
test('an external destructive or malformed replacement cannot be overwritten by a stale tab',()=>{
 const store=shared(),a=tab(store);
 assert.equal(a.commitLocal(()=>a.read().actions.push({id:'original'})),true);
 store.external('{broken source');
 assert.equal(a.commitLocal(()=>a.read().actions.push({id:'unwanted'})),false);
 assert.equal(store.raw(),'{broken source');
 assert.deepEqual(a.read().actions,[{id:'original'}]);
 assert.equal(store.writes(),1);
});
test('all command center entry points share the guarded save() helper',()=>{
 assert.match(save,/localStorage\.getItem\(KEY\)!==localLastLoadedRaw/);
 assert.match(storage,/localLastLoadedRaw=raw/);
 assert.match(save,/localLastLoadedRaw=serialized/);
 assert.match(commit,/if\(save\(\)===true\)return true/);
 assert.doesNotMatch(source,/localStorage\.setItem\(KEY,JSON\.stringify\(db\)\)/);
});
