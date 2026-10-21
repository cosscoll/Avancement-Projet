import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync('assets/command-center.js','utf8');
const start=app.indexOf('function decisionVersion('),end=app.indexOf('function memory(){',start);
assert.ok(start>0&&end>start,'Execute the real CONTROL decision logic');
const implementation=app.slice(start,end);
function harness(options={}){
 const ctx={projects:[{id:'p1',name:'Project One'},{id:'p2',name:'Project Two'}]};
 const db={decisions:[]};
 let saved=0,allowed=options.allow!==false,seq=0;
 const scope=vm.createContext({db,ctx,id:()=>String(++seq),save:()=>{saved++;return allowed},Date});
 vm.runInContext(implementation,scope);
 return {ctx,db,write:form=>scope.writeDecision(new Map(Object.entries(form))),remove:id=>scope.removeDecision(id),saved:()=>saved,setAllowed:x=>allowed=x};
}
function create(h,changes={}){return h.write({project:'p1',title:'Decision Alpha',details:'We chose solution A.',source:'Meeting notes',...changes})}
test('IMP-03 saves project, declared source and first version',()=>{
 const h=harness(),d=create(h);assert.equal(d.project,'p1');assert.equal(d.source,'Meeting notes');assert.equal(d.version,1);assert.equal(h.db.decisions.length,1);assert.equal(h.saved(),1);
});
test('IMP-03 correction increases version without altering identity',()=>{
 const h=harness(),d=create(h);
 const revised=h.write({project:'p1',title:'Decision Alpha',details:'Updated choice B',source:'Review',record:d.id,expectedVersion:'1'});
 assert.equal(revised.version,2);assert.equal(revised.id,d.id);assert.equal(revised.at,d.at);
 assert.equal(h.db.decisions[0].details,'Updated choice B');assert.equal(h.db.decisions.length,1);
});
test('IMP-03 stale version prevents overriding a newer correction',()=>{
 const h=harness(),d=create(h);h.write({project:'p1',title:d.title,details:'V2',record:d.id,expectedVersion:'1'});
 assert.throws(()=>h.write({project:'p1',title:d.title,details:'stale',record:d.id,expectedVersion:'1'}),/changée ou supprimée/);
 assert.equal(h.db.decisions[0].details,'V2');
});
test('IMP-03 private decision cannot be reassigned to another project during correction',()=>{
 const h=harness(),d=create(h);
 assert.throws(()=>h.write({project:'p2',title:d.title,details:'Other scope',record:d.id,expectedVersion:'1'}),/changée ou supprimée/);
 assert.equal(h.db.decisions[0].project,'p1');
});
test('IMP-03 missing or revoked project cannot receive decisions',()=>{
 const h=harness();assert.throws(()=>create(h,{project:'retired'}),/Projet introuvable/);
 assert.equal(h.db.decisions.length,0);assert.equal(h.saved(),0);
});
test('IMP-03 flags contradictory same-title decisions rather than silently merging',()=>{
 const h=harness();create(h);assert.throws(()=>create(h,{title:' DECISION alpha ',details:'Conflicting'}),/contradictoire/);
 assert.equal(h.db.decisions.length,1);
});
test('IMP-03 rejects exact duplicate decision but preserves separate projects',()=>{
 const h=harness();create(h);
 assert.throws(()=>create(h),/déjà présente/);
 create(h,{project:'p2',details:'Different project decision'});
 assert.equal(h.db.decisions.length,2);
});
test('IMP-03 missing source labeled as user-entered, never externally verified',()=>{
 const h=harness();assert.equal(create(h,{source:''}).source,'Saisie manuelle');
});
test('IMP-03 validation refuses blank or oversized fields',()=>{
 const h=harness();for(const x of [{title:''},{details:' '},{source:'x'.repeat(241)},{title:'x'.repeat(151)}])assert.throws(()=>create(h,x),/invalide/);
 assert.equal(h.saved(),0);
});
test('IMP-03 failed creation leaves no phantom memory and allows retry',()=>{
 const h=harness({allow:false});assert.throws(()=>create(h),/Stockage indisponible/);assert.equal(h.db.decisions.length,0);
 h.setAllowed(true);assert.equal(create(h).version,1);
});
test('IMP-03 failed correction rolls back previous version, content and source',()=>{
 const h=harness(),d=create(h);h.setAllowed(false);
 assert.throws(()=>h.write({project:'p1',title:d.title,details:'Never saved',source:'False update',record:d.id,expectedVersion:'1'}),/Stockage indisponible/);
 assert.equal(h.db.decisions[0].version,1);assert.equal(h.db.decisions[0].source,'Meeting notes');
});
test('IMP-03 deleting one project decision leaves other projects intact',()=>{
 const h=harness(),d=create(h);create(h,{project:'p2'});
 assert.equal(h.remove(d.id),true);assert.equal(h.db.decisions.length,1);assert.equal(h.db.decisions[0].project,'p2');
});
test('IMP-03 failed deletion rolls back and keeps previous decision',()=>{
 const h=harness(),d=create(h);h.setAllowed(false);
 assert.throws(()=>h.remove(d.id),/Stockage indisponible/);assert.equal(h.db.decisions[0].id,d.id);
});
test('IMP-03 unavailable project prevents deletions of its decisions',()=>{
 const h=harness(),d=create(h);h.ctx.projects.splice(0,1);
 assert.throws(()=>h.remove(d.id),/indisponible/);assert.equal(h.db.decisions.length,1);
});
test('IMP-03 exported context reads only selected project records with provenance and version',()=>{
 const source=app.slice(app.indexOf('function memory(){'),app.indexOf('function budget(){',app.indexOf('function memory(){')));
 assert.match(source,/db\.decisions\.filter\(x=>x\.project===p\)/);
 assert.match(source,/decisionVersion\(x\)/);
 assert.match(source,/x\.source/);
 assert.match(source,/x\.updatedAt\|\|x\.at/);
 assert.match(source,/Ces sources sont déclarées/);
});
