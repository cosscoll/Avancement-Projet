import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const shell=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const command=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
const archive=readFileSync(new URL('../assets/automations-hub.js',import.meta.url),'utf8');
const inline=shell.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
const line=(source,prefix)=>source.split('\n').find(x=>x.startsWith(prefix));
const helper=(source,prefix)=>{const x=line(source,prefix);assert.ok(x,prefix+' missing');return x};
function shared(raw=null){
 let value=raw,writes=0;
 return {getItem(){return value},setItem(key,v){value=v;writes++},raw:()=>value,writes:()=>writes};
}
function projectTab(store){
 const alerts=[];
 const code=`const base='control-hub-v2';let hubLoadedRaw=null;`+
  helper(inline,'let hubCorrupt=false;const load=')+
  '\nlet state=load();'+helper(inline,'const persist=')+
  helper(inline,'const object=')+helper(inline,'function restoreHub(')+
  helper(inline,'function commitHub(')+
  '\nreturn {read:()=>state,load,commitHub,persist};';
 const api=new Function('localStorage','notify',code)(store,m=>alerts.push(m));
 return {...api,alerts};
}
function automationTab(store){
 const alerts=[];
 const code=`const localKey='control-automations-v1';let localLoadedRaw=null;`+
  helper(archive,'let localCorrupt=false;function getLocal()')+
  '\nlet local=getLocal();'+helper(archive,'function save()')+
  helper(archive,'function commitDraft(')+
  '\nreturn {read:()=>local,getLocal,commitDraft};';
 const api=new Function('localStorage','toast',code)(store,m=>alerts.push(m));
 return {...api,alerts};
}
test('project tabs reject stale writes without losing nested project references',()=>{
 const store=shared('{"alpha":{"links":[{"id":"original"}]}}'),a=projectTab(store),b=projectTab(store);
 const project=b.read().alpha,links=project.links;
 assert.equal(a.commitHub(()=>a.read().alpha.links.push({id:'first'})),true);
 const latest=store.raw();
 assert.equal(b.commitHub(()=>b.read().alpha.links.push({id:'stale'})),false);
 assert.equal(store.raw(),latest);
 assert.equal(store.writes(),1);
 assert.equal(b.read().alpha,project);
 assert.equal(b.read().alpha.links,links);
 assert.deepEqual(links,[{id:'original'}]);
 assert.match(b.alerts.join(' '),/autre onglet/);
});
test('project storage refresh preserves latest version and permits another write',()=>{
 const store=shared('{"alpha":{"memo":"original"}}'),a=projectTab(store);
 assert.equal(a.commitHub(()=>a.read().alpha.memo='updated'),true);
 const b=projectTab(store);
 assert.equal(b.commitHub(()=>b.read().alpha.notes='new'),true);
 assert.deepEqual(JSON.parse(store.raw()).alpha,{memo:'updated',notes:'new'});
});
test('automation draft tabs reject stale writes without scheduling tasks',()=>{
 const store=shared('{"extra":[{"id":"original"}]}'),a=automationTab(store),b=automationTab(store);
 assert.equal(a.commitDraft(()=>a.read().extra.push({id:'first'})),true);
 const latest=store.raw();
 assert.equal(b.commitDraft(()=>b.read().extra.push({id:'stale'})),false);
 assert.equal(store.raw(),latest);
 assert.equal(store.writes(),1);
 assert.deepEqual(b.read().extra,[{id:'original'}]);
 assert.match(b.alerts.join(' '),/autre onglet/);
 assert.doesNotMatch(archive,/automations\.create|fetch\('https:\/\/chatgpt\.com\/api/);
});
test('automations corrupt-store protection still blocks writes',()=>{
 const store=shared('{not valid json'),a=automationTab(store);
 assert.equal(a.commitDraft(()=>{a.read().extra=[]}),false);
 assert.equal(store.raw(),'{not valid json');
 assert.equal(store.writes(),0);
});
test('command, project and automation stores reject stale baselines independently',()=>{
 assert.match(command,/localStorage\.getItem\(KEY\)!==localLastLoadedRaw/);
 assert.match(inline,/localStorage\.getItem\(base\)!==hubLoadedRaw/);
 assert.match(archive,/localStorage\.getItem\(localKey\)!==localLoadedRaw/);
 assert.match(command,/localLastLoadedRaw=serialized/);
 assert.match(inline,/hubLoadedRaw=serialized/);
 assert.match(archive,/localLoadedRaw=serialized/);
});
