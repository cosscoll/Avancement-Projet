/**
 * Simulated PostgREST/Auth contract tests for the REAL CONTROL E2E runner.
 * No secrets, no network, no Auth account creation. Synthetic security failures
 * intentionally test the refusal and cleanup paths, NOT genuine server RLS.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {run} from './control-cloud-real-auth-e2e.mjs';

const TABLES=['control_profiles','control_projects','control_items','control_preferences','control_connections','control_audit_events'];
const USER_A='11111111-1111-4111-8111-111111111111';
const USER_B='22222222-2222-4222-8222-222222222222';
const TOKEN_A='aa.bb.cc';
const TOKEN_B='dd.ee.ff';
const env={
 CONTROL_TEST_PROJECT_REF:'rvrmjjtdedidjnrkdery',
 CONTROL_TEST_PUBLISHABLE_KEY:'sb_publishable_simulation_only_0123456789',
 CONTROL_TEST_A_JWT:TOKEN_A,CONTROL_TEST_B_JWT:TOKEN_B
};
const output=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
function mockServer(mode={}){
 const state={rows:Object.fromEntries(TABLES.map(table=>[table,[]])),requests:[],id:0};
 const uidFor=token=>token===TOKEN_A?USER_A:token===TOKEN_B?(mode.sameUser?USER_A:USER_B):null;
 const records=()=>TABLES.reduce((sum,table)=>sum+state.rows[table].length,0);
 const request=async(url,options={})=>{
  const u=new URL(url),method=options.method||'GET',token=String(options.headers?.Authorization||'').replace(/^Bearer /,''),owner=uidFor(token);
  assert.equal(u.hostname,'rvrmjjtdedidjnrkdery.supabase.co');
  state.requests.push({method,path:u.pathname,owner});
  if(u.pathname==='/auth/v1/user')return owner?output(200,{id:owner,is_anonymous:false}):output(401,{message:'unauthorized'});
  if(!u.pathname.startsWith('/rest/v1/'))throw Error('Unexpected mock endpoint '+u.pathname);
  const table=u.pathname.slice('/rest/v1/'.length);
  assert.ok(TABLES.includes(table),'Only CONTROL test tables are permitted');
  if(!owner){
   return mode.anonReadable?output(200,[]):output(401,{message:'no anonymous privileges'});
  }
  const own=row=>row[table==='control_profiles'?'user_id':'owner_id']===owner;
  const clauses=[...u.searchParams.entries()].filter(([k,v])=>v.startsWith('eq.'));
  const matches=row=>clauses.every(([k,v])=>String(row[k]??'')===v.slice(3));
  const rows=state.rows[table];
  if(method==='GET'){
   if(mode.refuseVerificationProbe&&(u.searchParams.has('label')||u.searchParams.has('title')))
    return output(403,{message:'cannot check forbidden-write marker'});
   return output(200,rows.filter(row=>(mode.crossRead||own(row))&&matches(row))
     .slice(0,Number(u.searchParams.get('limit')||100)));
  }
  if(method==='POST'){
   const payload=JSON.parse(options.body);
   const row={...payload,id:'00000000-0000-4000-8000-'+String(++state.id).padStart(12,'0')};
   if(table==='control_profiles'){delete row.id;row.user_id=payload.user_id;}
   else if(!row.owner_id)row.owner_id=owner;
   const forgedOwner=table==='control_connections'&&row.owner_id!==owner;
   const forbiddenProject=table==='control_items'&&row.project_id&&
      !state.rows.control_projects.some(p=>p.id===row.project_id&&p.owner_id===owner);
   const hiddenWrite=mode.deniedButCommitted&&(forgedOwner||forbiddenProject);
   if((row.owner_id!==owner&&!(mode.forgedInsert&&forgedOwner)&&!hiddenWrite)||
      (table==='control_profiles'&&row.user_id!==owner)||
      (forbiddenProject&&!mode.foreignProjectInsert&&!hiddenWrite)){
    return output(403,{message:'RLS protected'});
   }
   rows.push(row);
   if(hiddenWrite)return output(403,{message:'HTTP refused after synthetic commit'});
   // RLS may allow an INSERT yet hide the inserted row from return=representation.
   if((forgedOwner&&mode.forgedInsert)||(forbiddenProject&&mode.foreignProjectInsert))return output(201,[]);
   return output(201,[row]);
  }
  if(method==='PATCH'){
   const found=rows.filter(row=>own(row)&&matches(row));
   for(const row of found)Object.assign(row,JSON.parse(options.body));
   return output(200,found);
  }
  if(method==='DELETE'){
   const found=rows.filter(row=>own(row)&&matches(row));
   if(mode.failCleanup&&table==='control_profiles')return output(500,{message:'test simulated cleanup failure'});
   for(const row of found)rows.splice(rows.indexOf(row),1);
   return output(200,found);
  }
  throw Error('Unexpected method '+method);
 };
 return {state,request,records};
}
async function withMock(mode,fn){
 const mock=mockServer(mode),before=globalThis.fetch;
 globalThis.fetch=mock.request;
 try{return await fn(mock)}
 finally{globalThis.fetch=before}
}
test('success path covers real E2E code and leaves zero synthetic records in six tables',async()=>{
 await withMock({},async m=>{
  const result=await run(env);
  assert.deepEqual(result,{passed:true,tables:6,authUsers:2,projectRef:'rvrmjjtdedidjnrkdery'});
  assert.equal(m.records(),0,'All generated rows must be removed');
  assert.equal(m.state.requests.filter(r=>r.path==='/auth/v1/user').length,2);
  assert.ok(m.state.requests.some(r=>r.method==='DELETE'));
 });
});
test('real E2E runner detects a simulated cross-owner RLS read leak and cleans all fixtures',async()=>{
 await withMock({crossRead:true},async m=>{
  await assert.rejects(()=>run(env),/VIOLATION RLS/);
  assert.equal(m.records(),0);
 });
});
test('simulated forged-owner INSERT with a hidden response is found by unique marker and removed',async()=>{
 await withMock({forgedInsert:true},async m=>{
  await assert.rejects(()=>run(env),/usurpant A/);
  assert.equal(m.records(),0,'Unexpected accepted insert must be cleaned even if response hides its id');
 });
});
test('simulated cross-project INSERT with a hidden response is removed by the owning account',async()=>{
 await withMock({foreignProjectInsert:true},async m=>{
  await assert.rejects(()=>run(env),/associer une tâche/);
  assert.equal(m.records(),0,'Cross-project row must be cleaned by owner B');
 });
});
test('HTTP 403 does not conceal a synthetic unauthorized write; the marker is probed and cleaned',async()=>{
 await withMock({deniedButCommitted:true},async m=>{
  await assert.rejects(()=>run(env),/usurpant A/);
  assert.equal(m.records(),0);
 });
});
test('inconclusive negative-write verification fails closed even when HTTP returns 403',async()=>{
 await withMock({refuseVerificationProbe:true},async m=>{
  await assert.rejects(()=>run(env),/Nettoyage INCOMPLET/);
  assert.equal(m.records(),0,'No rows were written, but a failed verification cannot prove this');
 });
});
test('cleanup failure is never reported as passing',async()=>{
 await withMock({failCleanup:true},async m=>{
  await assert.rejects(()=>run(env),/Nettoyage INCOMPLET/);
  assert.ok(m.records()>0,'The mock simulates residual rows that must be reported');
 });
});
test('identical Auth identity on both tokens is refused before any table writes',async()=>{
 await withMock({sameUser:true},async m=>{
  await assert.rejects(()=>run(env),/deux utilisateurs différents/);
  assert.equal(m.records(),0);
 });
});
test('incorrect anonymous grants are refused before creating fixtures',async()=>{
 await withMock({anonReadable:true},async m=>{
  await assert.rejects(()=>run(env),/lecture non authentifiée autorisée/);
  assert.equal(m.records(),0);
 });
});
