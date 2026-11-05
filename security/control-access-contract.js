/* CONTROL — P0 authorization acceptance contract, NOT production authorization.
   Pure expected-results fixture to compare against future server-enforced Postgres RLS.
   Never import this into public UI and never use it to authorize a network request.
   Trust boundary: actor and membership must originate from VERIFIED server state. */
(function(root){
'use strict';
const ROLES=Object.freeze(['owner','admin','editor','viewer']);
const RESOURCES=Object.freeze(['project','task','client','agent','conversation','memory','provider_connection','automation']);
const OPERATIONS=Object.freeze(['read','create','update','delete','invite','execute']);
function decision(ok,code){return Object.freeze({allowed:ok,reason:code});}
function evaluate({actor,member,resource,operation,explicitShare=false,executionApproved=false}={}){
 const deny=code=>decision(false,code);
 if(!actor||actor.verified!==true||actor.activeSession!==true||typeof actor.userId!=='string'||!actor.userId)return deny('session_missing_or_unverified');
 if(!resource||!RESOURCES.includes(resource.type)||!OPERATIONS.includes(operation))return deny('resource_or_operation_invalid');
 if(operation==='execute')return deny('automation_or_agent_execution_requires_separate_authorization');
 if(resource.type==='provider_connection'){
  if(resource.ownerUserId!==actor.userId)return deny('provider_credentials_private');
  return operation==='read'||operation==='create'||operation==='update'||operation==='delete'?
   decision(true,'private_connection_owner'):deny('private_connection_not_shareable');
 }
 if(resource.scope==='personal'){
  if(resource.ownerUserId!==actor.userId)return deny('personal_scope_private');
  if(operation==='invite')return deny('personal_scope_not_invitable');
  return decision(true,'personal_owner');
 }
 if(resource.scope!=='project'||!resource.projectId)return deny('project_scope_required');
 if(!member||member.active!==true||member.userId!==actor.userId||member.projectId!==resource.projectId||!ROLES.includes(member.role)){
  return deny('no_current_project_membership');
 }
 const rank={viewer:0,editor:1,admin:2,owner:3}[member.role];
 const privateResource=['memory','conversation','agent'].includes(resource.type);
 if(privateResource){
  if(resource.ownerUserId===actor.userId)return decision(true,'private_creator');
  if(resource.sharedToProject!==true||explicitShare!==true)return deny('private_ai_content_not_shared');
  return operation==='read'?decision(true,'explicitly_shared_read_only'):deny('shared_ai_content_not_mutable_by_other_members');
 }
 if(resource.type==='client'){
  if(operation==='read'){
   return rank>=1||member.canViewClients===true?decision(true,'member_client_read'):deny('client_read_not_granted_to_viewer');
  }
  return rank>=1&&['create','update'].includes(operation)?decision(true,'member_client_write'):deny('client_write_requires_editor');
 }
 if(operation==='read')return decision(true,'current_member_read');
 if(operation==='invite'){
  return resource.type==='project'&&rank>=2?decision(true,'invite_by_admin_or_owner'):deny('invitation_requires_administrator');
 }
 if(operation==='create'||operation==='update'){
  return rank>=1?decision(true,'member_write'):deny('viewer_is_read_only');
 }
 if(operation==='delete'){
  return rank>=3?decision(true,'owner_controls_destructive_actions'):deny('delete_requires_owner');
 }
 return deny('deny_by_default');
}
const api=Object.freeze({evaluate,ROLES,RESOURCES,OPERATIONS});
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.CONTROL_ACCESS_CONTRACT=api;
})(typeof window==='object'?window:undefined);
