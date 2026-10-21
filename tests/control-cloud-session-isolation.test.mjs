import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';

const source=readFileSync(new URL('../assets/cloud-app.js',import.meta.url),'utf8');
const a=source.indexOf('async function verifiedSession(){');
const b=source.indexOf('function nav(',a);
assert.ok(a>0&&b>a,'Extract real CONTROL Cloud session and database reload implementation');
const functions=source.slice(a,b);
const authStart=source.indexOf('client.auth.onAuthStateChange((event,s)=>{');
const authEnd=source.indexOf('});\n await verifiedSession();',authStart);
assert.ok(authStart>0&&authEnd>authStart,'Extract actual SDK Auth callback from boot');
const authBody=source.slice(authStart+'client.auth.onAuthStateChange((event,s)=>{'.length,authEnd);
const makeDeferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}};
async function waitFor(predicate,description){
 for(let n=0;n<100;n++){if(predicate())return;await delay(10)}
 throw Error('Timeout waiting for '+description);
}
function harness(){
 const state={user:'A',delays:new Map(),calls:[],rendered:0,messages:[],screens:[],reset:0,scheduled:[]};
 const nodes=new Map();
 const byId=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',disabled:false});return nodes.get(id)};
 const window={CONTROL_HELP:{reset(){state.reset++}}};
 const message=(s,bad)=>state.messages.push({text:String(s),bad:!!bad});
 const visible=s=>state.screens.push(s);
 const live=s=>state.messages.push({text:String(s),info:true});
 const render=()=>state.rendered++;
 const panel=(title,body)=>'<section>'+title+body+'</section>';
 const btn=(label,action)=>'<button data-action="'+action+'">'+label+'</button>';
 const setTimeout=callback=>state.scheduled.push(callback);
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
 const factory=new Function('client','window','byId','render','visible','live','message','panel','btn','setTimeout',
   "let epoch=0,verificationSeq=0,authUser=null,waiting=false,waitingOwner=null,cache={projects:[],items:[],preferences:null};\n"+
   functions+
   "const onAuthEvent=(event,s)=>{"+authBody+"};\n"+
   "\nreturn {verifiedSession,reload,onAuthEvent,read:()=>({epoch,owner:authUser?.id||null,projects:cache.projects,items:cache.items,preferences:cache.preferences,waitingOwner})};");
 const app=factory(client,window,byId,render,visible,live,message,panel,btn,setTimeout);
 return {state,app,async flushEvents(){while(state.scheduled.length)await state.scheduled.shift()()},makeSlow(table,owner='A'){const d=makeDeferred();state.delays.set(owner+':'+table,d);return d}};
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

test('repeated same-account verifiedSession while initial request is pending preserves loaded data',async()=>{
 const h=harness(),slow=h.makeSlow('control_projects');
 const first=h.app.verifiedSession();
 await waitFor(()=>h.app.read().waitingOwner==='A','first private load');
 const second=h.app.verifiedSession();
 await second;
 slow.resolve({data:[{id:'project-A',owner_id:'A',name:'Private A'}]});
 await first;
 assert.equal(h.app.read().projects.length,1,'Same-account verification must not invalidate the pending private fetch');
 assert.equal(h.app.read().projects[0].owner_id,'A');
 assert.equal(h.app.read().waitingOwner,null);
});

test('stale same-owner request cannot release lock belonging to a newer login session',async()=>{
 const h=harness(),oldDelayed=h.makeSlow('control_projects');
 const old=h.app.verifiedSession();
 await waitFor(()=>h.app.read().waitingOwner==='A','old A fetch starts');
 h.state.user=null;
 await h.app.verifiedSession();
 h.state.user='A';
 const freshDelayed=h.makeSlow('control_projects'),fresh=h.app.verifiedSession();
 await waitFor(()=>h.app.read().waitingOwner==='A','new A fetch starts');
 oldDelayed.resolve({data:[{id:'old-A',owner_id:'A',name:'Old A'}]});
 await old;
 assert.equal(h.app.read().waitingOwner,'A','Old A request must not release new A fetch lock');
 freshDelayed.resolve({data:[{id:'new-A',owner_id:'A',name:'New A'}]});
 await fresh;
 assert.equal(h.app.read().projects[0].id,'new-A');
 assert.equal(h.app.read().waitingOwner,null);
});

test('a late SIGNED_OUT event never strands a valid newly authenticated B account',async()=>{
 const h=harness();
 await h.app.verifiedSession();
 h.state.user='B';h.app.onAuthEvent('SIGNED_IN',{user:{id:'B'}});
 await h.flushEvents();
 assert.equal(h.app.read().owner,'B');
 h.app.onAuthEvent('SIGNED_OUT',null);
 assert.equal(h.app.read().owner,null,'Fail closed immediately before re-verification');
 assert.equal(h.app.read().projects.length,0);
 await h.flushEvents();
 assert.equal(h.app.read().owner,'B');
 assert.deepEqual(h.app.read().projects.map(x=>x.owner_id),['B']);
 assert.deepEqual(h.app.read().items.map(x=>x.owner_id),['B']);
});
test('genuine SIGNED_OUT remains fail-closed after scheduled session recheck',async()=>{
 const h=harness();await h.app.verifiedSession();
 h.state.user=null;h.app.onAuthEvent('SIGNED_OUT',null);
 assert.equal(h.app.read().owner,null);
 assert.deepEqual(h.app.read().projects,[]);
 await h.flushEvents();
 assert.equal(h.app.read().owner,null);
 assert.deepEqual(h.app.read().items,[]);
 assert.equal(h.state.screens.at(-1),'auth');
});
test('SIGNED_OUT and SIGNED_IN reordered events recover only currently verified B',async()=>{
 const h=harness();await h.app.verifiedSession();
 h.state.user='B';h.app.onAuthEvent('SIGNED_OUT',null);
 h.app.onAuthEvent('SIGNED_IN',{user:{id:'B'}});
 await h.flushEvents();
 assert.equal(h.app.read().owner,'B');
 assert.deepEqual(h.app.read().projects.map(x=>x.owner_id),['B']);
});
test('same-owner fresh login recovers after an obsolete SIGNED_OUT notification',async()=>{
 const h=harness();await h.app.verifiedSession();
 h.state.user='A';h.app.onAuthEvent('SIGNED_OUT',null);
 await h.flushEvents();
 assert.equal(h.app.read().owner,'A');
 assert.equal(h.app.read().projects[0]?.owner_id,'A');
});


test('frontend refuses foreign project rows even if API returns them after an owner filter',async()=>{
 const h=harness(),foreign=h.makeSlow('control_projects','A');
 const load=h.app.verifiedSession();
 await waitFor(()=>h.app.read().waitingOwner==='A','A project fetch');
 foreign.resolve({data:[{id:'project-B',owner_id:'B',name:'Private B'}]});
 await load;
 assert.equal(h.app.read().owner,'A');
 assert.deepEqual(h.app.read().projects,[]);
 assert.deepEqual(h.app.read().items,[]);
 assert.ok(h.state.messages.some(x=>x.bad&&x.text.includes('Isolation du compte non confirmée')));
});

test('frontend never renders another owner preference document',async()=>{
 const h=harness(),foreign=h.makeSlow('control_preferences','A');
 const load=h.app.verifiedSession();
 await waitFor(()=>h.app.read().waitingOwner==='A','A preferences fetch');
 foreign.resolve({data:{owner_id:'B',settings:{private:'B only'}}});
 await load;
 assert.equal(h.app.read().preferences,null);
 assert.deepEqual(h.app.read().projects,[]);
 assert.ok(h.state.messages.some(x=>x.bad&&x.text.includes('Isolation du compte non confirmée')));
});

test('frontend rejects a malformed untrusted collection instead of reporting sync success',async()=>{
 const h=harness(),malformed=h.makeSlow('control_items','A');
 const load=h.app.verifiedSession();
 await waitFor(()=>h.app.read().waitingOwner==='A','A item fetch');
 malformed.resolve({data:{owner_id:'A',title:'not an array'}});
 await load;
 assert.deepEqual(h.app.read().items,[]);
 assert.ok(h.state.messages.some(x=>x.bad&&x.text.includes('Isolation du compte non confirmée')));
});


test('silent reload returns false when account read fails instead of masking the failure',async()=>{
 const h=harness();
 await h.app.verifiedSession();
 const before=h.app.read().projects[0].id;
 const slow=h.makeSlow('control_projects');
 const pending=h.app.reload(true);
 await waitFor(()=>h.app.read().waitingOwner==='A','account reload');
 slow.resolve({data:null,error:{message:'RLS refused'}});
 assert.equal(await pending,false);
 assert.equal(h.app.read().projects[0].id,before,'Keep last known valid account view');
 assert.equal(h.state.messages.filter(x=>x.text==='Espace synchronisé avec votre compte.').length,1);
});
test('authenticated successful reread returns true to guarded mutations',async()=>{
 const h=harness();
 await h.app.verifiedSession();
 assert.equal(await h.app.reload(true),true);
});
test('overlapping account refresh must return false instead of falsely confirming a new reread',async()=>{
 const h=harness();
 await h.app.verifiedSession();
 const slow=h.makeSlow('control_projects');
 const pending=h.app.reload(true);
 await waitFor(()=>h.app.read().waitingOwner==='A','first account reload');
 assert.equal(await h.app.reload(true),false);
 slow.resolve({data:[{id:'project-A',owner_id:'A',name:'Account A'}]});
 assert.equal(await pending,true);
});
