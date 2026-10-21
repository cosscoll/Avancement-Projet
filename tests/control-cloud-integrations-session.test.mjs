import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/cloud-app.js',import.meta.url),'utf8');
const start=source.indexOf("if(page==='visios')");
const end=source.indexOf("}for(const b of document.querySelectorAll('#bottomnav button'))",start);
const helperStart=source.indexOf("function mutationSession(){");
const helperEnd=source.indexOf("async function audit(",helperStart);
assert.ok(start>0&&end>start&&helperStart>0&&helperEnd>helperStart,'Read actual integration callbacks and account epoch helper');
const integrations=source.slice(start,end)+'}';
const session=source.slice(helperStart,helperEnd);

function harness(options={}){
 const fixture=String.raw`
 let authUser={id:'A'},epoch=1,cache={
  projects:[{id:'pA',owner_id:'A'}],
  items:[
   {id:'x',owner_id:'A',project_id:'pA',kind:'mission',provider:'Claude',title:'Alpha',body:'Instruction',status:'todo',details:{},updated_at:'t0'},
   {id:'v',owner_id:'A',project_id:'pA',kind:'event',details:{controlVisio:true},updated_at:'t0'}
  ]};
 let cloudConfig={aiDispatchEnabled:true},picked='pA';
 const requests=[],mounts={},messages=[],reloadSteps=[];
 const byId=id=>({textContent:'',innerHTML:''}),getProject=id=>cache.projects.find(p=>p.id===id&&p.owner_id===authUser?.id);
 const providers={Claude:'https://claude.ai',Gemini:'https://gemini.google.com'},safeURL=x=>x,nav=()=>{},message=x=>messages.push(x);
 const reload=async()=>{messages.push('RELOAD');if(options.delayReload)await new Promise(resolve=>reloadSteps.push(resolve))};
 const window={
  CONTROL_VISIOS:{mount(node,args){mounts.visios=args}},
  CONTROL_MULTI_AI:{mount(node,args){mounts.command=args}},
  CONTROL_LAB:{mount(node,args){mounts.lab=args}},
  CONTROL_TOOL_CATALOG:{mount(node,args){mounts.catalog=args}},
  CONTROL_DEPLOY_GUIDES:{mount(node,args){mounts.deploy=args}}
 };
 const document={querySelectorAll(){return[]}};
 const client={from(table){return{
  insert(payload){return query('insert',table,payload)},
  update(payload){return query('update',table,payload)},
  delete(){return query('delete',table,null)},
  select(){return query('select',table,null)}
 }},functions:{invoke(name,payload){return new Promise(resolve=>requests.push({method:'invoke',table:name,payload,resolve}))}}};
 function query(method,table,payload){
  let promise;
  const single=()=>{if(!promise)promise=new Promise(resolve=>requests.push({method,table,payload,resolve}));return promise};
  const q={eq(){return q},select(){return q},single,then(resolve,reject){return single().then(resolve,reject)}};
  return q;
 }
 `;
 const body=fixture+session+'function mount(page){'+integrations+'}\n'+String.raw`
 return {mount,mounts,requests,messages,reloadSteps,read:()=>cache,
  sameLogin(){epoch++;cache={projects:[{id:'pA',owner_id:'A'}],items:[]}},
  otherLogin(){authUser={id:'B'};epoch++;cache={projects:[{id:'pB',owner_id:'B'}],items:[]}},
  logout(){authUser=null;epoch++;cache={projects:[],items:[]}},
  setA(){authUser={id:'A'};epoch++;cache={projects:[{id:'pA',owner_id:'A'}],items:[]}}
 };
 `;
 return new Function('options',body)(options);
}
const cases=[
 {page:'visios',fn:'create',args:[{projectId:'pA',provider:'Meet',title:'Call',url:'https://example.com',startsAt:'2026-10-21T11:00:00Z',type:'meeting',minutes:30}]},
 {page:'visios',fn:'update',args:[{id:'v'},{notes:'updated'}]},
 {page:'visios',fn:'remove',args:[{id:'v'}]},
 {page:'command',fn:'dispatchMission',args:[{id:'x'}]},
 {page:'command',fn:'createMission',args:[{projectId:'pA',provider:'Claude',title:'New mission',prompt:'Distinct prompt'}]},
 {page:'command',fn:'updateMission',args:[{id:'x'},{result:'ok',proofUrl:'https://example.org/proof',status:'done'}]},
 {page:'lab',fn:'saveMission',args:[{projectId:'pA',provider:'Claude',title:'Lab',instruction:'New instruction'}]},
 {page:'catalog',fn:'onAdd',args:[{id:'tool',name:'Useful Tool',url:'https://example.org',summary:'Test',category:'LLM',courses:[]},'pA']}
];
async function untilRequest(h,count){
 for(let i=0;i<100;i++){if(h.requests.length>=count)return;await Promise.resolve()}
 throw Error('HTTP request not started '+count);
}
async function complete(h,index){
 const q=h.requests[index];
 assert.ok(q,'Expected pending request '+index);
 q.resolve(q.method==='invoke'?{data:{ok:true},error:null}:q.method==='select'?
  {data:{id:'x',owner_id:'A',kind:'mission',provider:'Claude',title:'Fresh'},error:null}:
  {data:{id:'created-A',owner_id:'A',title:'Confirmed',updated_at:'t1'},error:null});
}
for(const c of cases){
 test(c.fn+' cannot mutate a new login of the same A account',async()=>{
  const h=harness();h.mount(c.page);
  const pending=h.mounts[c.page][c.fn](...c.args);
  await untilRequest(h,1);h.sameLogin();await complete(h,0);
  assert.equal(await pending,false);
  assert.deepEqual(h.read().items,[]);
  assert.deepEqual(h.messages,[]);
  assert.equal(h.requests.length,1,'Old operation must not launch a follow-up lookup');
 });
 test(c.fn+' cannot mutate a newly signed-in B account',async()=>{
  const h=harness();h.mount(c.page);
  const pending=h.mounts[c.page][c.fn](...c.args);
  await untilRequest(h,1);h.otherLogin();await complete(h,0);
  assert.equal(await pending,false);
  assert.deepEqual(h.read().items,[]);
  assert.deepEqual(h.messages,[]);
 });
 test(c.fn+' still works in a stable signed-in A account',async()=>{
  const h=harness();h.mount(c.page);
  const pending=h.mounts[c.page][c.fn](...c.args);
  await untilRequest(h,1);await complete(h,0);
  if(c.fn==='dispatchMission'){await untilRequest(h,2);await complete(h,1)}
  assert.equal(await pending,true);
  if(c.fn==='create'||c.fn==='createMission'||c.fn==='onAdd')assert.equal(h.read().items[0].id,'created-A');
  if(c.fn==='saveMission')assert.equal(h.messages.filter(x=>x==='RELOAD').length,1);
 });
}
test('dispatchMission rejects a foreign mission ID without invoking a backend API',async()=>{
 const h=harness();h.mount('command');
 await assert.rejects(h.mounts.command.dispatchMission({id:'other-account-id'}),/introuvable/);
 assert.equal(h.requests.length,0);
});
test('catalog onAdd refuses a project outside the current user',async()=>{
 const h=harness();h.mount('catalog');
 await assert.rejects(h.mounts.catalog.onAdd({id:'tool',name:'Tool',url:'https://example.org'},'pB'),/projet/);
 assert.equal(h.requests.length,0);
});
test('saveMission does not confirm success after same-account re-login during delayed refresh',async()=>{
 const h=harness({delayReload:true});h.mount('lab');
 const pending=h.mounts.lab.saveMission({projectId:'pA',provider:'Claude',title:'Lab',instruction:'A longer lab prompt'});
 await untilRequest(h,1);await complete(h,0);
 for(let i=0;i<100&&!h.reloadSteps.length;i++)await Promise.resolve();
 assert.equal(h.reloadSteps.length,1);
 h.sameLogin();h.reloadSteps[0]();
 assert.equal(await pending,false);
 assert.deepEqual(h.read().items,[]);
});
test('dispatchMission must not apply a stale reread after A signs out during the second request',async()=>{
 const h=harness();h.mount('command');
 const pending=h.mounts.command.dispatchMission({id:'x'});
 await untilRequest(h,1);await complete(h,0);
 await untilRequest(h,2);h.logout();h.setA();await complete(h,1);
 assert.equal(await pending,false);
 assert.deepEqual(h.read().items,[]);
});

for(const c of cases){
 test(c.fn+' from a mounted A screen is rejected after switching accounts before clicking',async()=>{
  const h=harness();h.mount(c.page);
  h.otherLogin();
  assert.equal(await h.mounts[c.page][c.fn](...c.args),false);
  assert.equal(h.requests.length,0,'Old A screen must not send a write or API call on B');
  assert.deepEqual(h.messages,[]);
  assert.deepEqual(h.read().items,[]);
 });
}
test('stale Visio screens cannot expose B meetings to A mount callbacks',()=>{
 const h=harness();h.mount('visios');h.otherLogin();
 assert.deepEqual(h.mounts.visios.list(),[]);
});
test('stale mission command screens cannot expose B missions or allow dispatch',()=>{
 const h=harness();h.mount('command');h.otherLogin();
 assert.deepEqual(h.mounts.command.listMissions('pB'),[]);
 assert.equal(h.mounts.command.canDispatch(),false);
 assert.equal(h.mounts.command.providerURL('pB','Claude'),'');
});
test('stale Lab screens cannot expose B project context or provider links',()=>{
 const h=harness();h.mount('lab');h.otherLogin();
 assert.deepEqual(h.mounts.lab.getProject('pB'),{});
 assert.equal(h.mounts.lab.providerURL('pB','Claude'),'');
});
test('stale catalog screen no longer treats B resources as saved by A',()=>{
 const h=harness();h.mount('catalog');h.otherLogin();
 assert.equal(h.mounts.catalog.isSaved({id:'tool1'},'pB'),false);
});
