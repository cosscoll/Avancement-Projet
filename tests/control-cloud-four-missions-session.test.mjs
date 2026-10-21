import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/cloud-app.js',import.meta.url),'utf8');
const sessionStart=source.indexOf('function mutationSession(){');
const sessionEnd=source.indexOf('async function audit(',sessionStart);
const missionStart=source.indexOf('async function prepareFourMissions(){');
const missionEnd=source.indexOf('const encB64=',missionStart);
assert.ok(sessionStart>0&&sessionEnd>sessionStart&&missionStart>sessionEnd&&missionEnd>missionStart);
const implementation=source.slice(sessionStart,sessionEnd)+'\n'+source.slice(missionStart,missionEnd);

function harness(config={}){
 const code=`
 let authUser={id:'A'},epoch=1;
 let cache={projects:[{id:'pA',owner_id:'A',name:'Project A'}],items:[]};
 const writes=[],pending=[],messages=[],refreshes=[],prompts=['Project A','Build a private report'];
 const prompt=()=>{const s=prompts.shift();if(config.logoutOnFirstPrompt&&prompts.length===1){authUser=null;epoch++}return s};
 const message=text=>messages.push({owner:authUser?.id,text});
 const reload=async()=>{if(config.failedReload)return false;refreshes.push(authUser?.id);if(config.delayReload)await new Promise(resolve=>pendingRefresh.push(resolve))};
 const pendingRefresh=[];
 const client={from(table){
  if(table!=='control_items')throw Error('Unexpected table '+table);
  return {insert(rows){writes.push(rows);return {select(fields){
   if(fields!=='id,owner_id,project_id')throw Error('Receipt fields missing');
   return new Promise(resolve=>pending.push(resolve));
  }}}};
 }};
 `;
 return new Function('config',code+implementation+`
 return {prepareFourMissions,writes,pending,messages,refreshes,pendingRefresh,
  switchUser(id){authUser=id?{id}:null;epoch++}};
 `)(config);
}
const receipts=()=>[0,1,2,3].map(i=>({id:'m'+i,owner_id:'A',project_id:'pA'}));

test('creates exactly four explicit project-owned missions and waits for four receipts',async()=>{
 const h=harness(),work=h.prepareFourMissions();
 assert.equal(h.writes.length,1);
 assert.equal(h.writes[0].length,4);
 assert.ok(h.writes[0].every(row=>row.owner_id==='A'&&row.project_id==='pA'));
 h.pending[0]({data:receipts(),error:null});
 await work;
 assert.deepEqual(h.refreshes,['A']);
 assert.equal(h.messages.length,1);
 assert.match(h.messages[0].text,/Quatre missions créées/);
});
test('late HTTP completion from A after switching to B cannot show confirmation to B',async()=>{
 const h=harness(),work=h.prepareFourMissions();
 h.switchUser('B');
 h.pending[0]({data:receipts(),error:null});
 await work;
 assert.deepEqual(h.messages,[]);
 assert.deepEqual(h.refreshes,[]);
});
test('partial success receipt is not announced as a completed batch',async()=>{
 const h=harness(),work=h.prepareFourMissions();
 h.pending[0]({data:receipts().slice(0,3),error:null});
 await assert.rejects(work,/non confirmée/);
 assert.deepEqual(h.messages,[]);
});
test('cross-owner response is rejected even after a successful HTTP response',async()=>{
 const h=harness(),work=h.prepareFourMissions();
 const returned=receipts();returned[2].owner_id='B';
 h.pending[0]({data:returned,error:null});
 await assert.rejects(work,/non confirmée/);
 assert.deepEqual(h.refreshes,[]);
 assert.deepEqual(h.messages,[]);
});
test('logout during prompt gathering prevents any HTTP write',async()=>{
 const h=harness({logoutOnFirstPrompt:true});
 await h.prepareFourMissions();
 assert.equal(h.writes.length,0);
 assert.deepEqual(h.messages,[]);
});
test('logout while reloading prevents late success notice',async()=>{
 const h=harness({delayReload:true}),work=h.prepareFourMissions();
 h.pending[0]({data:receipts(),error:null});
 for(let i=0;i<25&&!h.pendingRefresh.length;i++)await Promise.resolve();
 assert.equal(h.pendingRefresh.length,1);
 h.switchUser('B');
 h.pendingRefresh[0]();
 await work;
 assert.deepEqual(h.messages,[]);
});

test('overlapping clicks cannot create a duplicate four-mission batch',async()=>{
 const h=harness(),active=h.prepareFourMissions();
 await assert.rejects(()=>h.prepareFourMissions(),/déjà en cours/);
 assert.equal(h.writes.length,1);
 h.pending[0]({data:receipts(),error:null});
 await active;
 assert.equal(h.messages.length,1);
});
test('repeated receipt ID never confirms four distinct missions',async()=>{
 const h=harness(),active=h.prepareFourMissions();
 const returned=receipts();returned[3].id=returned[0].id;
 h.pending[0]({data:returned,error:null});
 await assert.rejects(active,/non confirmée/);
 assert.deepEqual(h.messages,[]);
 assert.deepEqual(h.refreshes,[]);
});
test('failed or incomplete batch releases the in-page gate',async()=>{
 const h=harness(),active=h.prepareFourMissions();
 h.pending[0]({data:null,error:{message:'Refus RLS'}});
 await assert.rejects(active,/non confirmée/);
 assert.equal(h.prepareFourMissions.inFlight,false);
 assert.deepEqual(h.messages,[]);
});


test('four missions confirmed by PostgREST cannot announce success if workspace refresh fails',async()=>{
 const h=harness({failedReload:true}),work=h.prepareFourMissions();
 h.pending[0]({data:receipts(),error:null});
 await assert.rejects(work,/synchronisation non vérifiée/);
 assert.equal(h.messages.length,0);
 assert.equal(h.refreshes.length,0);
 assert.equal(h.prepareFourMissions.inFlight,false);
});
