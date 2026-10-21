import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/cloud-app.js',import.meta.url),'utf8');
const start=source.indexOf('function mutationSession(){');
const end=source.indexOf('async function copyText(',start);
assert.ok(start>0&&end>start,'Extract actual CONTROL Cloud mutation functions');
const implementation=source.slice(start,end);

function harness(options={}){
 const fixture=String.raw`
 let authUser={id:'A'},epoch=1,cache={items:[],projects:[]};
 const requests=[],auditCalls=[],messages=[],navCalls=[],pendingSteps=[];
 const client={from(table){return{
  insert(payload){return query(table,'insert',payload)},
  update(payload){return query(table,'update',payload)},
  delete(){return query(table,'delete',null)}
 }}};
 function query(table,method,payload){
  if(table==='control_audit_events'){auditCalls.push({table,method,payload});if(options.delayAudit)return new Promise(resolve=>pendingSteps.push({type:'audit',resolve}));return Promise.resolve({data:{},error:null})}
  let promise;
  const response=()=>{if(!promise)promise=new Promise(resolve=>requests.push({table,method,payload,resolve}));return promise};
  const chain={eq(){return chain},select(){return chain},single(){return response()},then(yes,no){return response().then(yes,no)}};
  return chain;
 }
 const itemPayload=f=>({owner_id:authUser.id,kind:'task',title:String(f.get('title')||'Test'),project_id:'P'});
 const getProject=()=>null,confirm=()=>true,prompt=()=>'Project A';
 const reload=async()=>{messages.push({owner:authUser?.id,text:'RELOAD'});if(options.delayReload)await new Promise(resolve=>pendingSteps.push({type:'reload',resolve}))};
 const message=text=>messages.push({owner:authUser?.id,text});
 const nav=(...args)=>navCalls.push({owner:authUser?.id,args});
 `;
 return new Function('options',fixture+implementation+String.raw`
 return {saveItem,saveProject,eraseItem,eraseProject,markDone,requests,auditCalls,messages,navCalls,pendingSteps,switchUser(id){authUser=id?{id}:null;epoch++}};
 `)(options);
}
function invoke(h,kind){
 if(kind==='saveItem')return h.saveItem(new Map([['title','Private A']]));
 if(kind==='saveProject')return h.saveProject(new Map([['name','Project A']]));
 if(kind==='eraseItem')return h.eraseItem({id:'item-A'});
 if(kind==='eraseProject')return h.eraseProject({id:'project-A',name:'Project A'});
 if(kind==='markDone')return h.markDone({id:'item-A',updated_at:'2026-10-20T00:00:00Z'});
 throw Error('Unsupported case '+kind);
}
const kinds=['saveItem','saveProject','eraseItem','eraseProject','markDone'];
const successResponse={data:{id:'item-A',owner_id:'A'},error:null};
const receiptFor=kind=>({data:{id:kind==='eraseProject'?'project-A':'item-A',owner_id:'A'},error:null});

for(const kind of kinds){
 test(kind+' ignores prior-account HTTP completion after switching to B',async()=>{
  const h=harness(),pending=invoke(h,kind);
  await Promise.resolve();
  assert.equal(h.requests.length,1,'A mutation request must actually be initiated');
  h.switchUser('B');
  h.requests[0].resolve(receiptFor(kind));
  await pending;
  assert.equal(h.auditCalls.length,0,'No audit event referencing A may be attributed to B');
  assert.deepEqual(h.navCalls,[],'No navigation into A project when B is active');
  assert.deepEqual(h.messages,[],'No success notice or reload in B');
 });
 test(kind+' confirms actual completed writes for the same owner',async()=>{
  const h=harness(),pending=invoke(h,kind);
  await Promise.resolve();
  assert.equal(h.requests.length,1);
  h.requests[0].resolve(receiptFor(kind));
  await pending;
  assert.equal(h.auditCalls.length,1);
  assert.equal(h.auditCalls[0].payload.owner_id,'A');
  assert.equal(h.messages.filter(x=>x.text==='RELOAD').length,1);
  assert.equal(h.messages.filter(x=>x.text!=='RELOAD').length,1);
 });
}
for(const kind of ['eraseItem','eraseProject']){
 test(kind+' never claims deletion with zero confirmed affected rows',async()=>{
  const h=harness(),pending=invoke(h,kind);
  await Promise.resolve();
  assert.equal(h.requests.length,1);
  h.requests[0].resolve({data:null,error:null});
  await assert.rejects(pending,/Suppression non confirmée/);
  assert.equal(h.auditCalls.length,0);
  assert.equal(h.messages.length,0);
 });
}

async function untilStep(h,type){
 for(let i=0;i<100;i++){if(h.pendingSteps.some(x=>x.type===type))return;await Promise.resolve()}
 throw Error('Missing delayed '+type);
}
test('audit stays owned by A when session switches after HTTP success but before audit response',async()=>{
 const h=harness({delayAudit:true}),pending=invoke(h,'saveItem');
 await Promise.resolve();
 h.requests[0].resolve(successResponse);
 await untilStep(h,'audit');
 h.switchUser('B');
 h.pendingSteps.find(x=>x.type==='audit').resolve({error:null});
 await pending;
 assert.equal(h.auditCalls.length,1);
 assert.equal(h.auditCalls[0].payload.owner_id,'A');
 assert.deepEqual(h.messages,[]);
});
test('save project cannot navigate to A after account B takes over during UI refresh',async()=>{
 const h=harness({delayReload:true}),pending=invoke(h,'saveProject');
 await Promise.resolve();
 h.requests[0].resolve(successResponse);
 await untilStep(h,'reload');
 h.switchUser('B');
 h.pendingSteps.find(x=>x.type==='reload').resolve();
 await pending;
 assert.deepEqual(h.navCalls,[]);
 assert.equal(h.messages.filter(x=>x.text!=='RELOAD').length,0);
});
test('logout then login as the same owner invalidates older write notifications',async()=>{
 const h=harness(),pending=invoke(h,'saveItem');
 await Promise.resolve();
 h.switchUser(null);
 h.switchUser('A');
 h.requests[0].resolve(successResponse);
 await pending;
 assert.deepEqual(h.auditCalls,[]);
 assert.deepEqual(h.messages,[]);
});


for(const kind of ['saveItem','saveProject']){
 test(kind+' refuses a response attributed to a different user before audit and success',async()=>{
  const h=harness(),pending=invoke(h,kind);
  await Promise.resolve();
  assert.equal(h.requests.length,1);
  h.requests[0].resolve({data:{id:'item-A',owner_id:'B'},error:null});
  await assert.rejects(pending,/non attribuée à votre compte/);
  assert.deepEqual(h.auditCalls,[]);
  assert.deepEqual(h.messages,[]);
  assert.deepEqual(h.navCalls,[]);
 });
 test(kind+' rejects a missing receipt owner instead of assuming it is safe',async()=>{
  const h=harness(),pending=invoke(h,kind);
  await Promise.resolve();
  h.requests[0].resolve({data:{id:'item-A'},error:null});
  await assert.rejects(pending,/non attribuée à votre compte/);
  assert.deepEqual(h.auditCalls,[]);
  assert.deepEqual(h.messages,[]);
 });
}


for(const kind of ['eraseItem','eraseProject','markDone']){
 const pattern=kind==='markDone'?/identité de tâche non confirmée/:/Suppression non confirmée/;
 test(kind+' rejects a same-owner response carrying another record ID',async()=>{
  const h=harness(),pending=invoke(h,kind);
  await Promise.resolve();
  h.requests[0].resolve({data:{id:'foreign-record',owner_id:'A'},error:null});
  await assert.rejects(pending,pattern);
  assert.deepEqual(h.auditCalls,[]);
  assert.deepEqual(h.messages,[]);
  assert.deepEqual(h.navCalls,[]);
 });
 test(kind+' rejects a response owned by another account before audit',async()=>{
  const h=harness(),pending=invoke(h,kind);
  await Promise.resolve();
  h.requests[0].resolve({data:{id:kind==='eraseProject'?'project-A':'item-A',owner_id:'B'},error:null});
  await assert.rejects(pending,pattern);
  assert.deepEqual(h.auditCalls,[]);
  assert.deepEqual(h.messages,[]);
 });
}
