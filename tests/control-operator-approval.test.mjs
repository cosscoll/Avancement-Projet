import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const coreSource=readFileSync('assets/control-operator-core.js','utf8');
const uiSource=readFileSync('assets/control-operator.js','utf8');
const commandSource=readFileSync('assets/command-center.js','utf8');
const win={};
vm.runInNewContext(coreSource,{window:win,Date});
const core=win.CONTROL_OPERATOR_CORE;
const data={
 projects:[{id:'alpha',name:'Projet Alpha'},{id:'beta',name:'Projet Beta'}],
 actions:[{id:'act1',project:'alpha',title:'Tester le site',status:'todo'}],
 events:[{id:'event1',project:'alpha',title:'Revue de projet',date:'2032-11-15T15:00'}],
 missions:[],meetings:[]
};
const proposal=(type,extra={})=>({type,projectId:'alpha',title:'Tester le site',...extra});
function denied(fn,match){assert.throws(fn,match)}
test('IMP-05: creation preview shows named target, before, after and local-only risk',()=>{
 const p=core.reviewAction(proposal('create_action',{title:'Créer le devis'}),data,'alpha');
 assert.match(p.target,/Projet Alpha/);
 assert.match(p.before,/Aucune/);
 assert.match(p.after,/Créer le devis/);
 assert.match(p.risk,/local|appareil/);
});
test('IMP-05: refuses nonexistent project before any confirmation',()=>{
 denied(()=>core.reviewAction(proposal('create_action',{projectId:'unknown',title:'X'}),data,'general'),/non autorisé/);
});
test('IMP-05: project-scope revocation rejects a prepared write',()=>{
 denied(()=>core.reviewAction(proposal('create_action',{title:'X'}),data,'beta'),/non autorisé/);
});
test('IMP-05: a removed project revokes its action even if scope remains general',()=>{
 denied(()=>core.reviewAction(proposal('create_action',{title:'X'}),{...data,projects:[]},'general'),/non autorisé/);
});
test('IMP-05: completion is declared, not a claim that an executor ran',()=>{
 const p=core.reviewAction(proposal('complete_action',{id:'act1',title:'Tester le site',expectedStatus:'todo'}),data,'alpha');
 assert.match(p.before,/à lancer/);
 assert.match(p.after,/déclaratif/);
});
test('IMP-05: changed task status cancels a previous draft',()=>{
 denied(()=>core.reviewAction(proposal('complete_action',{id:'act1',expectedStatus:'doing'}),data,'alpha'),/Statut modifié/);
});
test('IMP-05: changed event date cancels stale proposal',()=>{
 denied(()=>core.reviewAction(proposal('delete_event',{id:'event1',title:'Revue de projet',expectedDate:'2032-11-16T15:00'}),data,'alpha'),/Événement modifié/);
});
test('IMP-05: event removal states irreversibility and its original date',()=>{
 const p=core.reviewAction(proposal('delete_event',{id:'event1',title:'Revue de projet',expectedDate:'2032-11-15T15:00'}),data,'alpha');
 assert.match(p.before,/2032-11-15T15:00/);
 assert.match(p.after,/Supprimer définitivement/);
 assert.match(p.risk,/Élevé/);
});
test('IMP-05: changing the exact local event date shows both dates',()=>{
 const p=core.reviewAction(proposal('update_event',{id:'event1',title:'Revue de projet',expectedDate:'2032-11-15T15:00',date:'2032-11-16T14:00'}),data,'alpha');
 assert.match(p.before,/2032-11-15/);assert.match(p.after,/2032-11-16/);
});
test('IMP-05: unchanged, invalid, or ambiguous date cannot be approved',()=>{
 const base=proposal('update_event',{id:'event1',title:'Revue de projet',expectedDate:'2032-11-15T15:00'});
 for(const date of ['2032-11-15T15:00','2032-02-30T14:00',''])denied(()=>core.reviewAction({...base,date},data,'alpha'),/date|Aucune modification/i);
});
test('IMP-05: unsupported actions cannot enter review',()=>{
 denied(()=>core.reviewAction(proposal('delete_project'),data,'alpha'),/interdit/);
});
test('IMP-05: invalid and too long titles cannot be approved',()=>{
 for(const title of ['', 'x'.repeat(161)])denied(()=>core.reviewAction(proposal('create_action',{title}),data,'alpha'),/Intitulé/);
});
function createOperatorHarness(){
 const events={};
 class FakeNode{
  constructor(){this.listeners={};this.dataset={};this.value='';this.checked=false;this.hidden=false;this.disabled=false;this.textContent='';this.innerHTML='';this.readOnly=false;this.children=[]}
  querySelector(k){if(k==='[data-control-operator]'||k==='.loc-model')return null;return events[k]??=new FakeNode()}
  querySelectorAll(){return []}
  addEventListener(name,fn){this.listeners[name]=fn}
  append(...els){this.children.push(...els)}
  before(){}
 }
 const root=new FakeNode(),window={CONTROL_OPERATOR_CORE:core},document={createElement:()=>new FakeNode()};
 const run=vm.createContext({window,document,confirm:()=>true,Date});
 vm.runInContext(uiSource,run);
 let selected='alpha',dataNow=structuredClone(data),writes=[],currentReceipt={id:'receipt-1',project:'alpha'};
 window.CONTROL_OPERATOR.mount(root,{getScope:()=>selected,snapshot:()=>dataNow,execute:async action=>{writes.push(action);return true},receipt:()=>currentReceipt});
 const node=x=>events[x]??=new FakeNode();
 const consent=node('[data-op-consent]');
 const submit=async name=>node(name).listeners.submit({preventDefault(){}});
 const prepare=async()=>{
  consent.checked=true;
  node('[data-op-form] textarea').value='Crée une tâche téléphoner pour Projet Alpha';
  await submit('[data-op-form]');
 };
 return {node,consent,prepare,submit,writes,setScope:x=>selected=x,setData:x=>dataNow=x,setReceipt:x=>currentReceipt=x};
}
test('IMP-05 UI previews target, risk and before/after, then shows traceable local receipt',async()=>{
 const h=createOperatorHarness();await h.prepare();
 assert.equal(h.node('[data-op-draft]').hidden,false);
 assert.match(h.node('[data-op-target]').textContent,/Projet Alpha/);
 assert.match(h.node('[data-op-before]').textContent,/Aucune/);
 assert.match(h.node('[data-op-after]').textContent,/tâche/);
 assert.match(h.node('[data-op-risk]').textContent,/appareil/);
 assert.equal(h.node('[data-op-confirm]').disabled,false);
 await h.submit('[data-op-draft]');
 assert.equal(h.writes.length,1);
 assert.match(h.node('[data-op-response]').textContent,/Reçu local : receipt-1/);
});
test('IMP-05 UI refuses a stale draft after switching project scope',async()=>{
 const h=createOperatorHarness();await h.prepare();h.setScope('beta');
 await h.submit('[data-op-draft]');
 assert.equal(h.writes.length,0);
 assert.match(h.node('[data-op-response]').textContent,/refusée/i);
});
test('IMP-05 UI refuses a saved draft after consent withdrawal',async()=>{
 const h=createOperatorHarness();await h.prepare();h.consent.checked=false;
 h.consent.listeners.change();await h.submit('[data-op-draft]');
 assert.equal(h.writes.length,0);
});
test('IMP-05 UI refuses renamed project until a new review is prepared',async()=>{
 const h=createOperatorHarness();await h.prepare();
 const changed=structuredClone(data);changed.projects[0].name='Projet Renommé';
 h.setData(changed);await h.submit('[data-op-draft]');
 assert.equal(h.writes.length,0);
});
test('IMP-05 UI preview updates immediately after changing the requested title',async()=>{
 const h=createOperatorHarness();await h.prepare();
 h.node('[data-op-title]').value='Nouvelle tâche unique';
 h.node('[data-op-title]').listeners.input();
 assert.match(h.node('[data-op-after]').textContent,/Nouvelle tâche unique/);
 await h.submit('[data-op-draft]');
 assert.equal(h.writes[0].title,'Nouvelle tâche unique');
});
test('IMP-05 local write receipts come from persisted audit, never guessed',()=>{
 const a=commandSource.indexOf('function operatorSnapshot(){'),b=commandSource.indexOf('function localai(){',a);
 assert.ok(a>=0&&b>a);
 const context=vm.createContext({ctx:{projects:data.projects},db:{actions:[],events:[],operatorAudit:[]},window:{CONTROL_OPERATOR_CORE:core},save:()=>true,id:(()=>{let i=0;return()=>String(++i)})(),Date});
 vm.runInContext(commandSource.slice(a,b),context);
 assert.equal(context.operatorReceipt(),null);
 assert.equal(context.operatorExecute({type:'create_action',projectId:'alpha',title:'Local'}),true);
 assert.equal(context.operatorReceipt().id,context.db.operatorAudit.at(-1).id);
 assert.equal(context.operatorReceipt().project,'alpha');
 assert.match(commandSource,/receipt:operatorReceipt/);
});
