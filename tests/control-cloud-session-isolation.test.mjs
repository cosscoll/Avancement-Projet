import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';

const source=readFileSync(new URL('../assets/cloud-app.js',import.meta.url),'utf8');
const a=source.indexOf('async function verifiedSession(){');
const b=source.indexOf('function nav(',a);
assert.ok(a>0&&b>a,'Extract real CONTROL Cloud session and database reload implementation');
const functions=source.slice(a,b);
const makeDeferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}};
async function waitFor(predicate,description){
 for(let n=0;n<100;n++){if(predicate())return;await delay(10)}
 throw Error('Timeout waiting for '+description);
}
function harness(){
 const state={user:'A',delays:new Map(),calls:[],rendered:0,messages:[],screens:[],reset:0};
 const nodes=new Map();
 const byId=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',disabled:false});return nodes.get(id)};
 const window={CONTROL_HELP:{reset(){state.reset++}}};
 const message=(s,bad)=>state.messages.push({text:String(s),bad:!!bad});
 const visible=s=>state.screens.push(s);
 const live=s=>state.messages.push({text:String(s),info:true});
 const render=()=>state.rendered++;
 const panel=(title,body)=>'<section>'+title+body+'</section>';
 const client={
  auth:{async getUser(){return {data:{user:state.user?{id:state.user,email:state.user+'@example.test'}:null}}}},
  from(table){
   const owner=state.user;
   let ownerFilter=null;
   const query=()=>{
    if(ownerFilter!==owner) return Promise.resolve({data:null,error:{message:'owner_id filter missing or incorrect'}});
    state.calls.push({owner,table});
    const delayed=state.delays.get(owner+':'+table);
    if(delayed)return delayed.promise;
    if(table==='control_projects')return Promise.resolve({data:[{id:'project-'+owner,name:'Private '+owner,owner_id:owner}]});
    if(table==='control_items')return Promise.resolve({data:[{id:'item-'+owner,title:'Private task '+owner,owner_id:owner}]});
    return Promise.resolve({data:{owner_id:owner,settings:{}}});
   };
   return {select(){const chain={eq(field,value){if(field==='owner_id')ownerFilter=value;return chain},order(){return chain},limit:query,maybeSingle:query};return chain}};
  }
 };
 const factory=new Function('client','window','byId','render','visible','live','message','panel',
   "let epoch=0,authUser=null,waiting=false,waitingOwner=null,cache={projects:[],items:[],preferences:null};\n"+
   functions+
   "\nreturn {verifiedSession,reload,read:()=>({epoch,owner:authUser?.id||null,projects:cache.projects,items:cache.items,preferences:cache.preferences,waitingOwner})};");
 const app=factory(client,window,byId,render,visible,live,message,panel);
 return {state,app,makeSlow(table,owner='A'){const d=makeDeferred();state.delays.set(owner+':'+table,d);return d}};
}
test('ordinary signed-in user A can read only own RLS-shaped synthetic data',async()=>{
 const h=harness();await h.app.verifiedSession();
 const s=h.app.read();
 assert.equal(s.owner,'A');assert.equal(s.projects.length,1);
 assert.equal(s.projects[0].owner_id,'A');assert.equal(s.items[0].owner_id,'A');
});
test('switch from A to B while an A network request is pending never resurrects A data',async()=>{
 const h=harness(),slow=h.makeSlow('control_projects');
 const old=h.app.verifiedSession();
 await waitFor(()=>h.app.read().owner==='A'&&h.app.read().waitingOwner==='A','A reload started');
 h.state.user='B';
 await h.app.verifiedSession();
 assert.equal(h.app.read().projects[0].owner_id,'B');
 const messagesBefore=h.state.messages.length;
 slow.resolve({data:[{id:'project-A',owner_id:'A',name:'Private A'}]});
 await old;
 const s=h.app.read();
 assert.equal(s.owner,'B');
 assert.deepEqual(s.projects.map(x=>x.owner_id),['B']);
 assert.deepEqual(s.items.map(x=>x.owner_id),['B']);
 assert.equal(h.state.messages.length,messagesBefore,'Stale A result must not emit a new success');
});
test('logout during a delayed A request wipes all old account data and prevents late writes',async()=>{
 const h=harness(),slow=h.makeSlow('control_projects');
 const old=h.app.verifiedSession();
 await waitFor(()=>h.app.read().owner==='A'&&h.app.read().waitingOwner==='A','A fetch pending');
 h.state.user=null;
 await h.app.verifiedSession();
 assert.equal(h.app.read().owner,null);
 assert.equal(h.app.read().projects.length,0);
 assert.equal(h.app.read().items.length,0);
 slow.resolve({data:[{id:'project-A',owner_id:'A',name:'Private A'}]});
 await old;
 assert.equal(h.app.read().projects.length,0,'Old project must remain cleared');
 assert.equal(h.state.screens.at(-1),'auth');
});
test('failure from old account A after B signs in cannot show A error or corrupt B cache',async()=>{
 const h=harness(),slow=h.makeSlow('control_projects');
 const old=h.app.verifiedSession();
 await waitFor(()=>h.app.read().waitingOwner==='A','A fetch pending');
 h.state.user='B';
 await h.app.verifiedSession();
 const n=h.state.messages.length;
 slow.resolve({data:null,error:{message:'Private account A details'}});
 await old;
 assert.equal(h.app.read().owner,'B');
 assert.equal(h.app.read().projects[0].owner_id,'B');
 assert.equal(h.state.messages.length,n);
});
test('same-account concurrent refreshes coalesce and do not multiply private requests',async()=>{
 const h=harness(),slow=h.makeSlow('control_projects');
 const first=h.app.verifiedSession();
 await waitFor(()=>h.app.read().waitingOwner==='A','A started');
 const before=h.state.calls.filter(x=>x.owner==='A'&&x.table==='control_projects').length;
 await h.app.reload(true);
 assert.equal(h.state.calls.filter(x=>x.owner==='A'&&x.table==='control_projects').length,before);
 slow.resolve({data:[{id:'project-A',owner_id:'A',name:'Private A'}]});
 await first;
 assert.equal(h.app.read().waitingOwner,null);
});

test('all private dataset reads explicitly filter by signed-in owner_id',async()=>{
 const h=harness();await h.app.verifiedSession();
 assert.deepEqual(h.state.calls.map(x=>x.table).sort(),['control_items','control_preferences','control_projects']);
 assert.equal(h.app.read().projects[0].owner_id,'A');
 assert.equal(h.app.read().items[0].owner_id,'A');
});
