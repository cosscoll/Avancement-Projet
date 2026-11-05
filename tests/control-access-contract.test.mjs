import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const path=new URL('../security/control-access-contract.js',import.meta.url);
const context={module:{exports:{}}};
runInNewContext(readFileSync(path,'utf8'),context);
const contract=context.module.exports;
const actorA={userId:'user-A',verified:true,activeSession:true};
const actorB={userId:'user-B',verified:true,activeSession:true};
const membership=(userId,role,projectId='project-A',options={})=>({userId,role,projectId,active:true,...options});
const project={type:'project',scope:'project',projectId:'project-A'};
const task={type:'task',scope:'project',projectId:'project-A'};
const ask=(actor,member,resource,operation,options={})=>contract.evaluate({actor,member,resource,operation,...options});

test('default deny for unauthenticated, unverifiable or revoked sessions',()=>{
 for(const actor of [null,{userId:'user-A'}, {...actorA,verified:false},{...actorA,activeSession:false}]){
  assert.equal(ask(actor,membership('user-A','owner'),project,'read').allowed,false);
 }
 assert.equal(ask(actorA,membership('user-A','owner'),{type:'project'},'read').allowed,false);
 assert.equal(ask(actorA,membership('user-A','owner'),project,'nonexistent').allowed,false);
});

test('A/B isolation is defined by current database membership and project scope',()=>{
 assert.equal(ask(actorA,membership('user-A','owner'),project,'read').allowed,true);
 assert.equal(ask(actorB,membership('user-B','viewer','project-B'),project,'read').allowed,false);
 assert.equal(ask(actorB,membership('user-B','viewer','project-A'),project,'read').allowed,true);
 assert.equal(ask(actorB,membership('user-B','viewer','project-A',{active:false}),task,'read').allowed,false);
 assert.equal(ask(actorB,membership('user-A','owner'),project,'read').allowed,false);
});

test('viewer is read-only; editor may update tasks, not invite or delete projects',()=>{
 const viewer=membership('user-B','viewer');
 const editor=membership('user-B','editor');
 assert.equal(ask(actorB,viewer,task,'read').allowed,true);
 assert.equal(ask(actorB,viewer,task,'update').allowed,false);
 assert.equal(ask(actorB,editor,task,'create').allowed,true);
 assert.equal(ask(actorB,editor,task,'update').allowed,true);
 assert.equal(ask(actorB,editor,project,'invite').allowed,false);
 assert.equal(ask(actorB,editor,project,'delete').allowed,false);
});

test('administrators invite but only the owner deletes a project',()=>{
 assert.equal(ask(actorB,membership('user-B','admin'),project,'invite').allowed,true);
 assert.equal(ask(actorB,membership('user-B','admin'),project,'delete').allowed,false);
 assert.equal(ask(actorA,membership('user-A','owner'),project,'delete').allowed,true);
 assert.equal(ask(actorA,membership('user-A','owner'),project,'invite').allowed,true);
});

test('client details require editor or explicit project permission for viewers',()=>{
 const client={type:'client',scope:'project',projectId:'project-A'};
 assert.equal(ask(actorB,membership('user-B','viewer'),client,'read').allowed,false);
 assert.equal(ask(actorB,membership('user-B','viewer',{canViewClients:true}),client,'read').allowed,false,
  'Bad fixture: argument order must not silently grant permissions');
 const reader=membership('user-B','viewer','project-A',{canViewClients:true});
 assert.equal(ask(actorB,reader,client,'read').allowed,true);
 assert.equal(ask(actorB,reader,client,'update').allowed,false);
 assert.equal(ask(actorB,membership('user-B','editor'),client,'update').allowed,true);
 assert.equal(ask(actorB,membership('user-B','editor'),client,'delete').allowed,false);
});

test('personal content is private, even from an organization owner',()=>{
 const memory={type:'memory',scope:'personal',ownerUserId:'user-A'};
 assert.equal(ask(actorA,null,memory,'read').allowed,true);
 assert.equal(ask(actorB,membership('user-B','owner'),memory,'read').allowed,false);
 assert.equal(ask(actorA,null,memory,'invite').allowed,false);
});

test('project AI memory and conversations never inherit sharing from ordinary project membership',()=>{
 for(const type of ['memory','conversation','agent']){
  const privateItem={type,scope:'project',projectId:'project-A',ownerUserId:'user-A'};
  assert.equal(ask(actorB,membership('user-B','owner'),privateItem,'read').allowed,false,type);
  const shared={...privateItem,sharedToProject:true};
  assert.equal(ask(actorB,membership('user-B','viewer'),shared,'read').allowed,false);
  assert.equal(ask(actorB,membership('user-B','viewer'),shared,'read',{explicitShare:true}).allowed,true);
  assert.equal(ask(actorB,membership('user-B','editor'),shared,'update',{explicitShare:true}).allowed,false);
  assert.equal(ask(actorA,membership('user-A','owner'),privateItem,'update').allowed,true);
 }
});

test('provider credentials cannot be exposed to teammates by project ownership or share flags',()=>{
 const connector={type:'provider_connection',scope:'project',projectId:'project-A',ownerUserId:'user-A',sharedToProject:true};
 assert.equal(ask(actorA,membership('user-A','owner'),connector,'read').allowed,true);
 assert.equal(ask(actorB,membership('user-B','owner'),connector,'read',{explicitShare:true}).allowed,false);
 assert.equal(ask(actorB,membership('user-B','admin'),connector,'update').allowed,false);
 assert.equal(ask(actorA,null,connector,'invite').allowed,false);
});

test('no permission to execute agents or automations is granted by a role or local flag',()=>{
 for(const type of ['agent','automation']){
  const r={type,scope:'project',projectId:'project-A',ownerUserId:'user-A'};
  for(const role of contract.ROLES){
   assert.equal(ask(actorA,membership('user-A',role),r,'execute',{executionApproved:true}).allowed,false);
  }
 }
});

test('client-editable metadata cannot promote a viewer to admin',()=>{
 const spoofed={...actorB,user_metadata:{role:'owner',isAdmin:true},app_metadata:{role:'owner'}};
 assert.equal(ask(spoofed,membership('user-B','viewer'),project,'invite').allowed,false);
 assert.equal(ask(spoofed,membership('user-B','viewer'),task,'update').allowed,false);
});

test('the contract is not presented as production security or silently installed in the public client',()=>{
 const source=readFileSync(path,'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const cloud=readFileSync(new URL('../assets/cloud-app.js',import.meta.url),'utf8');
 const cfg=JSON.parse(readFileSync(new URL('../config/cloud.json',import.meta.url),'utf8'));
 assert.match(source,/NOT production authorization/);
 assert.ok(!html.includes('security/control-access-contract.js'));
 assert.ok(!cloud.includes('control-access-contract.js'));
 assert.equal(cfg.enabled,false);
 assert.ok(Object.values(cfg.launchChecks).every(v=>v===false));
});
