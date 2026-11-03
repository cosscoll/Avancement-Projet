import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const context={module:{exports:{}}};
runInNewContext(readFileSync(new URL('../assets/control-day-brief.js',import.meta.url),'utf8'),context);
const {summarize,render}=context.module.exports;
const day=new Date(2026,10,3,12);
const data={
 actions:[
  {id:'a',title:'Devis client',project:'pro',due:'2026-11-02',priority:'Normale',status:'todo'},
  {id:'b',title:'Appeler un client',project:'pro',due:'2026-11-03',priority:'Haute',status:'todo'},
  {id:'c',title:'Faire la revue sécurité',project:'pro',due:'',priority:'Critique',status:'doing'},
  {id:'d',title:'Déjà fait',due:'2026-10-01',priority:'Critique',status:'done'},
  {id:'e',title:'Annulé',due:'2026-10-01',priority:'Critique',status:'cancelled'},
  {id:'f',title:'Plus tard',due:'2026-11-22',priority:'Normale',status:'todo'}
 ],
 missions:[{id:'m',title:'Bilan mensuel',project:'pro',status:'review'},{id:'n',title:'Terminée',status:'done'}]
};
test('absent storage is not presented as external integration',()=>{
 const s=summarize(null,day);
 assert.equal(s.status,'empty');
 assert.equal(s.open,0);
 assert.match(render(null,{},day),/applications externes ne sont pas incluses/);
});
test('malformed storage and bad record types do not show invented zeros',()=>{
 for(const bad of ['{', '[]', '{"actions":{}}','{"missions":"broken"}']){
  const s=summarize(bad,day);
  assert.equal(s.status,'invalid');
  assert.match(render(bad,{},day),/données locales des actions sont illisibles/);
  assert.match(render(bad,{},day),/>—</);
 }
});
test('prioritizes late and today over review and other open actions',()=>{
 const s=summarize(JSON.stringify(data),day);
 assert.equal(s.status,'ready');
 assert.equal(s.open,4);
 assert.equal(s.overdue,1);
 assert.equal(s.today,1);
 assert.equal(s.review,1);
 assert.equal(s.items.length,3);
 assert.equal(s.items[0].title,'Devis client');
 assert.equal(s.items[1].title,'Appeler un client');
 assert.equal(s.items[2].title,'Bilan mensuel');
});
test('ignores impossible dates and counts only valid due dates',()=>{
 const input={actions:[
  {title:'Date impossible',status:'todo',due:'2026-02-30'},
  {title:'Format étranger',status:'todo',due:'03/11/2026'},
  {title:'Date valide',status:'todo',due:'2026-11-03'}
 ]};
 const s=summarize(input,day);
 assert.equal(s.today,1);
 assert.equal(s.overdue,0);
});
test('escapes names, titles and attributes from persisted local data',()=>{
 const evil='<img src=x onerror=alert(1)>';
 const output=render({actions:[{title:evil,project:'x',status:'todo',due:'2026-11-02'}]}, {x:evil},day);
 assert.ok(!output.includes(evil));
 assert.ok(output.includes('&lt;img src=x onerror=alert(1)&gt;'));
 assert.ok(output.includes('href="#/control/inbox"'));
 assert.ok(output.includes('href="#/control/inbox/new"'));
});
test('home markup wires working destinations and explicit offline provenance',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/assets\/control-day-brief\.js/);
 assert.match(html,/assets\/control-day-brief\.css/);
 assert.match(html,/CONTROL_DAY_BRIEF\?\.summarize/);
 assert.match(html,/control-home-v6/);
 assert.match(html,/applications externes ne sont pas synchronisées/);
});


test('task priority links use encoded identifiers, while missing IDs have safe fallback',()=>{
 const day=new Date(2026,10,3,12);
 const raw={actions:[
  {id:'a/b & ?',title:'Contacter un client',status:'todo',due:'2026-11-02'},
  {title:'Une autre tâche',status:'todo',due:'2026-11-03'}
 ]};
 const html=render(raw,{},day);
 assert.match(html,/href="#\/control\/inbox\?task=a%2Fb%20%26%20%3F"/);
 assert.match(html,/href="#\/control\/inbox"/);
 assert.ok(!html.includes('href="javascript:'));
});
