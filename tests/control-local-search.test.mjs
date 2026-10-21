import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('assets/command-center.js','utf8');
const start=source.indexOf('function searchResults('),end=source.indexOf('function search(){',start);
assert.ok(start>0&&end>start,'Extract live production search');
const code=source.slice(start,end);
function setup(){
 const ctx={projects:[{id:'a',name:'Projet Alpha'},{id:'b',name:'Projet Beta'}]};
 const db={actions:[{project:'a',title:'Action Alpha',status:'todo',at:'2026-10-20T08:00:00Z'},{project:'b',title:'Secret Beta'}],missions:[{project:'a',title:'Mission Alpha',status:'review'}],events:[{project:'a',title:'Événement Alpha',date:'2030-01-01T14:00'}],decisions:[{id:'a1',project:'a',title:'Décision stratégique',version:2,source:'Réunion validée (déclarée)',at:'2020-01-01T00:00:00Z',details:'Plan Alpha'},{id:'b1',project:'b',title:'Décision Beta',version:1,source:'Privée'}],resources:[{project:'a',label:'Document Alpha',url:'https://example.org/document'},{project:'b',label:'Doc Beta',url:'https://example.org/secret'}]};
 const search=vm.runInNewContext(code+'\nsearchResults',{ctx,db,linksPage:()=>[],safe:u=>/^https:\/\//.test(u)?u:'',decisionVersion:x=>x.version||1,date:v=>v?.slice(0,10)||'',Date,encodeURIComponent});
 return {ctx,db,search};
}
test('decision result identifies source, version, freshness and exact target',()=>{
 const h=setup(),r=h.search('a','Décision stratégique')[0];
 assert.equal(r.kind,'Décision');assert.match(r.metadata,/v2/);assert.match(r.metadata,/source déclarée/);
 assert.match(r.metadata,/Réunion validée/);assert.match(r.metadata,/à revalider/);
 assert.equal(r.url,'#/control/memory/a1');
});
test('project scope hides private records from other projects',()=>{
 const h=setup();for(const query of ['Secret Beta','Décision Beta','Doc Beta'])assert.equal(h.search('a',query).length,0);
 assert.ok(h.search('a','Alpha').length>0);
});
test('unknown or retired project never falls back to all records',()=>{
 const h=setup();assert.equal(h.search('unknown','').length,0);
 h.ctx.projects=h.ctx.projects.filter(p=>p.id!=='a');assert.equal(h.search('','Décision stratégique').length,0);
 assert.equal(h.search('a','').length,0);
});
test('all-project search includes only currently authorized records',()=>{
 const h=setup();const all=h.search('','');
 assert.ok(all.some(x=>x.project==='a'));assert.ok(all.some(x=>x.project==='b'));
 assert.equal(all.some(x=>x.project==='unknown'),false);
});
test('deleted decision immediately disappears without refresh or stale index',()=>{
 const h=setup();assert.equal(h.search('a','Décision stratégique').length,1);
 h.db.decisions=h.db.decisions.filter(x=>x.id!=='a1');assert.equal(h.search('a','Décision stratégique').length,0);
});
test('corrected title, version and source replace old indexed values',()=>{
 const h=setup(),d=h.db.decisions[0];d.title='Nouvelle route';d.version=3;d.source='Nouvelle réunion';
 assert.equal(h.search('a','Décision stratégique').length,0);
 const r=h.search('a','Nouvelle réunion')[0];assert.match(r.metadata,/v3/);
});
test('legacy local decision shows unverified source and date',()=>{
 const h=setup();h.db.decisions=[{id:'old',project:'a',title:'Ancien dossier'}];
 const r=h.search('a','Ancien dossier')[0];assert.match(r.metadata,/v1/);
 assert.match(r.metadata,/Saisie manuelle/);assert.match(r.metadata,/date non renseignée · à vérifier/);
});
test('search covers projects, actions, missions, events, decisions and resources',()=>{
 const h=setup(),types=new Set(h.search('a','').map(x=>x.kind));
 for(const kind of ['Projet','Action','Mission','Événement','Décision','Ressource'])assert.ok(types.has(kind),kind);
});
test('bad resource links excluded before rendering',()=>{
 const h=setup();h.db.resources.push({project:'a',label:'HTTP only',url:'http://untrusted.invalid'});
 assert.equal(h.search('a','HTTP only').length,0);
});
test('case insensitive and accent independent queries',()=>{
 const h=setup();assert.equal(h.search('a','DECISION STRATEGIQUE').length,1);
 assert.equal(h.search('a','REUNION VALIDEE').length,1);
});
test('project search reads live storage on every input or scope change',()=>{
 const x=source.slice(source.indexOf('function search(){'),source.indexOf('const SPRINT_IDS=',source.indexOf('function search(){')));
 assert.match(x,/const draw=\(\)=>/);assert.match(x,/searchResults\(scope,q\)/);
 assert.match(x,/\.oninput=draw/);assert.match(x,/\.onchange=draw/);
 assert.match(x,/h\(x\.metadata\)/);
});
test('deleted exact memory route shows no stale selected entry',()=>{
 const m=source.slice(source.indexOf('function memory(){'),source.indexOf('function budget(){',source.indexOf('function memory(){')));
 assert.match(m,/db\.decisions\.find\(d=>d\.id===wanted&&ctx\.projects\.some/);
 assert.match(m,/Décision introuvable ou supprimée/);assert.match(m,/data-memory-id/);
});
