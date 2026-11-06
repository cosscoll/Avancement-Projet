import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ctx={window:{},module:{exports:{}},URL};
runInNewContext(read('assets/control-project-brief.js'),ctx);
const brief=ctx.module.exports;
const date=new Date(2026,10,6,12);
const project={id:'p1',repo:'demo',website:{label:'Vitrine',url:'https://site.test/'}};
const own={memo:'Valider le parcours de vente',reports:{ChatGPT:{text:'Bilans fournis manuellement',updatedAt:'2026-11-05T12:00:00Z'}},links:[{label:'Drive projet',url:'https://drive.google.com/drive/u/0/folders/123'}]};
const data={actions:[
 {id:'late',title:'Relancer Alice',project:'p1',status:'todo',due:'2026-11-04'},
 {id:'today',title:'Tester le site',project:'p1',status:'doing',due:'2026-11-06'},
 {id:'other',title:'Sans échéance',project:'p1',status:'todo'},
 {id:'foreign',title:'NE PAS AFFICHER',project:'p2',status:'todo',due:'2026-10-01'},
 {id:'finished',title:'Terminée',project:'p1',status:'done',due:'2026-11-01'}
]};
test('Project 24: task summary includes only exact project matches with no duplicates',()=>{
 const a=brief.summarize(project,own,JSON.stringify(data),date);
 assert.equal(a.status,'ok');
 assert.equal(a.open,3);
 assert.equal(a.overdue,1);
 assert.deepEqual(Array.from(a.tasks,t=>t.title),['Relancer Alice','Tester le site','Sans échéance']);
 assert.equal(a.tasks.some(t=>t.title==='NE PAS AFFICHER'),false);
 assert.equal(brief.summarize({id:'p2'},null,JSON.stringify(data),date).open,1);
});
test('Project 24: manual decisions and links belong to the requested project only',()=>{
 const report=brief.summarize(project,own,JSON.stringify(data),date);
 assert.equal(report.notes,'Valider le parcours de vente');
 assert.equal(report.report.provider,'ChatGPT');
 assert.deepEqual(Array.from(report.links,l=>l.label),['Dépôt GitHub','Vitrine','Drive projet']);
 const other=brief.summarize({id:'p2'},{},JSON.stringify(data),date);
 assert.equal(other.notes,'');
 assert.equal(other.report,null);
 assert.equal(other.links.length,0);
});
test('Project 24: bad task storage never presents fabricated zero priorities',()=>{
 const out=brief.render(project,own,'not-json',date);
 assert.match(out,/Tâches locales illisibles/);
 assert.match(out,/Prochaines tâches/);
 assert.doesNotMatch(out,/>0<\/span><\/div><div class="control-project-brief-list"/);
 assert.equal(brief.summarize(project,own,'{').status,'invalid');
});
test('Project 24: never render executable HTML or unsafe private reference URLs',()=>{
 const dangerous={id:'p1',website:{label:'Suspicious',url:'javascript:alert(1)'}};
 const stored={memo:'<svg/onload=alert(1)>',links:[
  {label:'Private',url:'https://host.test/?token=XYZ'},
  {label:'Script',url:'javascript:alert(1)'},
  {label:'Safe',url:'https://example.org/'}
 ]};
 const html=brief.render(dangerous,stored,JSON.stringify({actions:[{title:'<script>alert(1)</script>',status:'todo',project:'p1'}]}),date);
 assert.doesNotMatch(html,/<svg|<script|javascript:|XYZ/);
 assert.match(html,/&lt;svg/);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/https:\/\/example\.org/);
 assert.match(html,/rel="noopener noreferrer"/);
});
test('Project 24: one project-scoped CTA opens the existing new-task form',()=>{
 const html=brief.render(project,own,JSON.stringify(data),date);
 assert.match(html,/href="#\/control\/inbox\/new\?project=p1"/);
 assert.match(html,/href="#\/project\/p1\/pilot"/);
 assert.match(html,/href="#\/project\/p1\/resources"/);
 assert.match(html,/href="#\/control\/inbox\?project=p1&task=late"/);
 assert.match(html,/Données enregistrées sur cet appareil pour ce projet/);
});
test('Project 24: existing project script creates cards without changing page navigation',()=>{
 const boot=read('assets/control-onboarding.js'),css=read('assets/control-project-brief.css');
 assert.match(boot,/control-project-brief\.js/);
 assert.match(boot,/MutationObserver/);
 assert.match(boot,/projectMeta\.get\(id\)/);
 assert.match(boot,/status:unused|role:unused|control-project-brief/);
 assert.match(css,/@media\(max-width:420px\)/);
 const index=read('index.html');
 assert.match(index,/assets\/control-onboarding\.js/);
});
