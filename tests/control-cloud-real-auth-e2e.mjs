/**
 * CONTROL Cloud — real Auth/JWT + PostgREST isolation acceptance.
 * This NEVER creates Auth accounts, NEVER uses service_role, and is NOT run
 * automatically by CI. Two already-authenticated *dedicated* test accounts
 * are required. No JWT/passwords should appear in logs, commits or artifacts.
 *
 * Usage:
 * CONTROL_TEST_PROJECT_REF=rvrmjjtdedidjnrkdery
 * CONTROL_TEST_PUBLISHABLE_KEY=sb_publishable_...
 * CONTROL_TEST_A_JWT=... CONTROL_TEST_B_JWT=... node tests/control-cloud-real-auth-e2e.mjs
 *
 * Or set CONTROL_TEST_A_EMAIL / CONTROL_TEST_A_PASSWORD and the corresponding
 * B pair if password sign-in is enabled. Do not mix real customer accounts.
 */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const EXPECTED_REF='rvrmjjtdedidjnrkdery';
const SCHEMA=['control_profiles','control_projects','control_items','control_preferences','control_connections','control_audit_events'];
const report=message=>process.stdout.write('CONTROL-CLOUD E2E: '+message+'\n');
function fatal(text){throw Error('E2E refusée : '+text)}
function setup(env){
 if(env.CONTROL_TEST_PROJECT_REF!==EXPECTED_REF)fatal('référence CONTROL Cloud indépendante non confirmée');
 const key=env.CONTROL_TEST_PUBLISHABLE_KEY||'';
 if(!/^sb_publishable_[A-Za-z0-9_-]{12,}$/.test(key))fatal('clé publique sb_publishable_* uniquement ; secret/service_role interdit');
 const root='https://'+EXPECTED_REF+'.supabase.co';
 for(const side of ['A','B']){
  const jwt=env['CONTROL_TEST_'+side+'_JWT'];
  const email=env['CONTROL_TEST_'+side+'_EMAIL'],password=env['CONTROL_TEST_'+side+'_PASSWORD'];
  if(!jwt&&!(email&&password))fatal('identité réelle '+side+' absente : JWT ou email/mot de passe requis');
  if(jwt&&(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt)))fatal('JWT '+side+' malformé');
 }
 return {root,key};
}
async function response(root,key,method,path,token,body,allowError=false){
 const headers={'apikey':key,'Accept':'application/json'};
 if(token)headers.Authorization='Bearer '+token;
 if(body!==undefined)headers['Content-Type']='application/json';
 if(method==='POST'||method==='PATCH'||method==='DELETE')headers.Prefer='return=representation';
 const res=await fetch(root+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(16000)});
 const parsed=await res.text();
 let value;
 try{value=parsed?JSON.parse(parsed):null}catch{value=null}
 if(!allowError&&!res.ok)throw Error('API '+method+' '+path.split('?')[0]+' HTTP '+res.status+' (contenu masqué)');
 return {status:res.status,ok:res.ok,data:value};
}
async function authenticate(env,side,root,key){
 const direct=env['CONTROL_TEST_'+side+'_JWT'];
 if(direct)return direct;
 const result=await response(root,key,'POST','/auth/v1/token?grant_type=password',null,{
  email:env['CONTROL_TEST_'+side+'_EMAIL'],password:env['CONTROL_TEST_'+side+'_PASSWORD']});
 if(typeof result.data?.access_token!=='string')fatal('Auth ne renvoie pas de JWT pour '+side);
 return result.data.access_token;
}
const eq=(field,value)=>'&'+encodeURIComponent(field)+'=eq.'+encodeURIComponent(value);
async function run(env=process.env){
 const work=[];
 const {root,key}=setup(env),marker='CONTROL-E2E-'+randomUUID();
 const tokens=[await authenticate(env,'A',root,key),await authenticate(env,'B',root,key)];
 const users=[];
 for(let i=0;i<2;i++){
  const r=await response(root,key,'GET','/auth/v1/user',tokens[i]);
  if(!r.data?.id||r.data?.is_anonymous===true)fatal('un utilisateur Auth identifié et non anonyme est obligatoire');
  users.push(r.data.id);
 }
 assert.notEqual(users[0],users[1],'Les deux jetons doivent appartenir à deux utilisateurs différents');
 const tokenA=tokens[0],tokenB=tokens[1],a=users[0],b=users[1];
 report('2 véritables JWT Supabase Auth confirmés dans CONTROL Cloud');
 // Refuse to alter an account that has real user data.
 for(const [token] of [[tokenA],[tokenB]])for(const table of SCHEMA){
  const r=await response(root,key,'GET','/rest/v1/'+table+'?select=*&limit=1',token);
  if(!Array.isArray(r.data)||r.data.length)fatal('comptes de recette dédiés et vides obligatoires ('+table+')');
 }
 report('précondition : comptes de recette vides, aucune donnée existante à écraser');
 // Unauthenticated requests must fail closed on every table.
 for(const table of SCHEMA){
  const r=await response(root,key,'GET','/rest/v1/'+table+'?select=*&limit=1',null,undefined,true);
  if(r.ok)fatal('lecture non authentifiée autorisée : '+table);
  if(![401,403].includes(r.status))fatal('échec non authentifié inattendu ('+table+', HTTP '+r.status+')');
 }
 report('0/6 tables lisibles avec la seule clé publiable : OK');
 const obj=async(table,method,params,token,body,allowError=false)=>response(root,key,method,'/rest/v1/'+table+(params||''),token,body,allowError);
 const create=async(table,token,record)=>{
  const res=await obj(table,'POST','?select=*',token,record);
  if(!Array.isArray(res.data)||res.data.length!==1)fatal('la création de '+table+' n’a pas retourné un enregistrement');
  work.push({table,id:res.data[0].id||null,owner:res.data[0].owner_id||res.data[0].user_id,token});
  return res.data[0];
 };
 try{
  const pA=await create('control_profiles',tokenA,{user_id:a,display_name:marker+' A'});
  const pB=await create('control_profiles',tokenB,{user_id:b,display_name:marker+' B'});
  const projA=await create('control_projects',tokenA,{name:marker+' A'});
  const projB=await create('control_projects',tokenB,{name:marker+' B'});
  await create('control_items',tokenA,{project_id:projA.id,kind:'task',title:marker+' task A'});
  await create('control_items',tokenB,{project_id:projB.id,kind:'task',title:marker+' task B'});
  await create('control_preferences',tokenA,{settings:{marker,side:'A'}});
  await create('control_preferences',tokenB,{settings:{marker,side:'B'}});
  await create('control_connections',tokenA,{provider:'ChatGPT',label:marker+' A'});
  await create('control_connections',tokenB,{provider:'Claude',label:marker+' B'});
  // The append-only audit table is READ-only during this test, to allow complete cleanup.
  for(const [who,token,other] of [['A',tokenA,b],['B',tokenB,a]]){
   for(const table of SCHEMA){
    const column=table==='control_profiles'?'user_id':'owner_id';
    const mine=await obj(table,'GET','?select=*&'+column+'=eq.'+users[who==='A'?0:1],token);
    const foreign=await obj(table,'GET','?select=*&'+column+'=eq.'+other,token);
    if(!Array.isArray(mine.data)||!Array.isArray(foreign.data))fatal('résultat REST non valide '+table);
    if(foreign.data.length!==0)fatal('VIOLATION RLS : '+who+' peut lire les lignes de l’autre sur '+table);
    if(table!=='control_audit_events'&&mine.data.length!==1)fatal('la ligne propre n’est pas lisible '+table);
   }
  }
  report('lecture croisée A↔B refusée sur les 6 tables');
  const before=await obj('control_projects','GET','?select=id,name&id=eq.'+projA.id,tokenA);
  assert.equal(before.data[0]?.name,marker+' A');
  const edit=await obj('control_projects','PATCH','?id=eq.'+projA.id+'&select=id',tokenB,{name:'FOREIGN WRITE'},true);
  if(!edit.ok||edit.data?.length!==0)fatal('B peut modifier le projet de A ou UPDATE ne respecte pas RLS');
  const remove=await obj('control_projects','DELETE','?id=eq.'+projA.id+'&select=id',tokenB,undefined,true);
  if(!remove.ok||remove.data?.length!==0)fatal('B peut supprimer le projet de A');
  const forge=await obj('control_connections','POST','?select=id',tokenB,{owner_id:a,provider:'ChatGPT',label:'FORGED'},true);
  if(forge.ok){
   // If a policy regresses, the unexpected write is still tracked for safe
   // cleanup using the legitimately owning test account A.
   if(Array.isArray(forge.data)&&forge.data[0]?.id)
    work.push({table:'control_connections',id:forge.data[0].id,owner:a,token:tokenA});
   fatal('B peut écrire une connexion en usurpant A');
  }
  const inject=await obj('control_items','POST','?select=id',tokenB,{project_id:projA.id,kind:'task',title:'CROSS PROJECT'},true);
  if(inject.ok){
   if(Array.isArray(inject.data)&&inject.data[0]?.id)
    work.push({table:'control_items',id:inject.data[0].id,owner:b,token:tokenB});
   fatal('B peut associer une tâche au projet de A');
  }
  const after=await obj('control_projects','GET','?select=id,name&id=eq.'+projA.id,tokenA);
  assert.equal(after.data[0]?.name,marker+' A');
  report('PATCH/DELETE croisés, usurpation owner_id et FK vers projet étranger : refusés');
  return {passed:true,tables:SCHEMA.length,authUsers:2,projectRef:EXPECTED_REF};
 } finally {
  // Never remove existing account data. Delete only rows created above, from
  // owning user's own token, respecting FK order. Report cleanup failures.
  const rank={control_connections:0,control_items:1,control_preferences:2,control_projects:3,control_profiles:4};
  const cleanup=work.slice().sort((x,y)=>(rank[x.table]??9)-(rank[y.table]??9));
  const failed=[];
  for(const row of cleanup){
   const field=row.table==='control_profiles'?'user_id':row.table==='control_preferences'?'owner_id':'id';
   const keyField=field==='id'?row.id:row.owner;
   if(!keyField){failed.push(row.table);continue}
   try{
    const r=await obj(row.table,'DELETE','?'+field+'=eq.'+keyField+'&select='+field,row.token);
    if(!Array.isArray(r.data)||r.data.length!==1)failed.push(row.table);
   }catch{failed.push(row.table)}
  }
  if(failed.length)throw Error('Nettoyage INCOMPLET sur '+[...new Set(failed)].join(', ')+' : contrôler et nettoyer les comptes de recette. Le test NE PEUT PAS être marqué vert.');
  report('nettoyage confirmé : aucun enregistrement de recette laissé dans les tables testées');
 }
}
if(import.meta.url===new URL('file://'+process.argv[1]).href){
 run().then(r=>report('VALIDÉ : '+r.authUsers+' Auth réels, '+r.tables+' tables, aucune ressource externe exécutée'))
 .catch(err=>{process.stderr.write('CONTROL-CLOUD E2E : '+String(err.message).replace(/sb_publishable_[A-Za-z0-9_-]+/g,'[clé masquée]')+'\n');process.exitCode=1});
}
export {setup,run};
