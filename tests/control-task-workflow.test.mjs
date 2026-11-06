import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const ctx={module:{exports:{}},URL};
runInNewContext(readFileSync(new URL('../assets/control-task-workflow.js',import.meta.url),'utf8'),ctx);
const task=ctx.module.exports;
const day='2026-11-03';
test('local date validation rejects impossible and malformed dates',()=>{
 assert.equal(task.validDue(''),true);
 assert.equal(task.validDue('2026-11-03'),true);
 for(const d of ['2026-02-30','2026-13-01','2026-1-3','03/11/2026','2026-00-01'])
  assert.equal(task.validDue(d),false,d);
});
test('task categorization is explicit and respects completed/cancelled',()=>{
 assert.equal(task.category({status:'done',due:'2026-10-01'},day),'done');
 assert.equal(task.category({status:'cancelled',due:'2026-10-01'},day),'cancelled');
 assert.equal(task.category({status:'todo',due:'2026-10-31'},day),'overdue');
 assert.equal(task.category({status:'doing',due:'2026-11-03'},day),'today');
 assert.equal(task.category({status:'todo',due:'2026-11-30'},day),'open');
});
test('late tasks rank before due-today, critical, review and later work',()=>{
 const list=[
  {kind:'action',title:'Futur',status:'todo',due:'2026-11-21'},
  {kind:'mission',title:'Revoir'},
  {kind:'action',title:'Critique',priority:'Critique',status:'todo'},
  {kind:'action',title:'En retard',status:'todo',due:'2026-11-01'},
  {kind:'action',title:'Ce jour',status:'todo',due:'2026-11-03'}
 ];
 assert.deepEqual(Array.from(task.sort(list,day),i=>i.title),['En retard','Ce jour','Critique','Revoir','Futur']);
});
test('CONTROL 22: every local action or review has exactly one visible priority group',()=>{
 const sample=[
  {kind:'action',id:'late',title:'Retard',status:'todo',due:'2026-11-01'},
  {kind:'action',id:'today',title:'Aujourd’hui',status:'doing',due:day},
  {kind:'mission',id:'review',title:'Résultat',status:'review'},
  {kind:'action',id:'later',title:'Après',status:'todo',due:'2026-11-30'},
  {kind:'action',id:'done',title:'Fini',status:'done',due:'2026-11-01'}
 ];
 const groups=task.group(sample,day);
 assert.deepEqual(groups.map(x=>x.id),['overdue','today','review','next','done']);
 assert.deepEqual(groups.map(x=>x.items.length),[1,1,1,1,1]);
 assert.deepEqual(groups.flatMap(x=>x.items.map(item=>item.id)),['late','today','review','later','done']);
});
test('CONTROL 22: cancelled tasks and missions not in review never appear in triage',()=>{
 const groups=task.group([
  {kind:'action',title:'Annulée',status:'cancelled',due:'2026-11-01'},
  {kind:'mission',title:'Exécutée',status:'completed'},
  {kind:'action',title:'En cours',status:'doing',due:'invalid'},
  {kind:'action',title:'Critique',status:'todo',priority:'Critique',due:''}
 ],day);
 assert.deepEqual(groups.map(x=>x.id),['next']);
 assert.equal(groups[0].items.length,2);
});
test('CONTROL 22: overdue and due-today sorting is stable even when the input is scrambled',()=>{
 const unordered=[
  {kind:'action',title:'B',status:'todo',due:'2026-10-29'},
  {kind:'action',title:'D',status:'todo',due:day},
  {kind:'action',title:'A',status:'todo',due:'2026-10-20'},
  {kind:'action',title:'C',status:'doing',due:day}
 ];
 assert.deepEqual(task.group(unordered,day).map(x=>x.items.map(a=>a.title)),[['A','B'],['C','D']]);
});
test('CONTROL 22: grouping is read-only, leaves the original records untouched',()=>{
 const source=[
  {kind:'action',title:'En cours',status:'todo',due:''},
  {kind:'mission',title:'Revoir',status:'review'}
 ];
 const original=JSON.stringify(source);
 const once=task.group(source,day),twice=task.group(source,day);
 assert.equal(JSON.stringify(source),original);
 assert.deepEqual(JSON.stringify(once),JSON.stringify(twice));
 assert.equal(task.bucket({kind:'mission',status:'review'},day),'review');
 assert.equal(task.bucket({kind:'mission',status:'done'},day),null);
});
test('CONTROL 22: inbox has user-visible grouped headings and keyboard-operated quick filters',()=>{
 const command=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../assets/command-center.css',import.meta.url),'utf8');
 assert.match(command,/workflow\.group\(items,today\)/);
 for(const id of ['overdue','today','review','next','done']) assert.ok(command.includes(id),id);
 assert.match(command,/data-task-group="/);
 assert.match(command,/data-task-filter-quick="/);
 assert.match(command,/aria-pressed/);
 assert.match(command,/button\.onclick=\(\)=>\{/);
 assert.match(command,/group\.hidden=visible===0/);
 assert.match(css,/\.control-task-triage-button:focus-visible/);
 assert.match(css,/@media\(max-width:540px\)/);
});
test('valid edits preserve only permitted fields and project membership',()=>{
 const v=task.validateEdit({title:'  Contacter le client  ',due:'2026-11-05',priority:'Haute',status:'doing',project:'p1',url:'https://example.com/info'},['','p1']);
 assert.equal(v.ok,true);
 assert.equal(v.task.title,'Contacter le client');
 assert.equal(v.task.status,'doing');
 assert.equal(task.validateEdit({...v.task,project:'p2'},['','p1']).ok,false);
 assert.equal(task.validateEdit({...v.task,title:' '},['','p1']).ok,false);
 assert.equal(task.validateEdit({...v.task,due:'2026-02-30'},['','p1']).ok,false);
 assert.equal(task.validateEdit({...v.task,priority:'Urgente'},['','p1']).ok,false);
 assert.equal(task.validateEdit({...v.task,status:'deleted'},['','p1']).ok,false);
});
test('rejects sensitive, non-HTTPS and credentialed links',()=>{
 const base={title:'Réaliser la tâche',project:'',due:'',priority:'Normale',status:'todo',url:''};
 for(const url of ['javascript:alert(1)','http://example.com','https://test:secret@example.com/','https://example.com/?api_key=secret','not an url'])
  assert.equal(task.validateEdit({...base,url},['']).ok,false,url);
 assert.equal(task.validateEdit(base,['']).ok,true);
});
test('accent-insensitive search finds tasks, without losing original text',()=>{
 assert.equal(task.searchText('  Échéance Client  '),'echeance client');
});
test('deployed inbox is wired for edit/reopen/search and recency-safe persistence',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const command=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
 assert.ok(html.includes('assets/control-task-workflow.js'));
 assert.ok(html.indexOf('assets/control-task-workflow.js')<html.indexOf('assets/command-center.js'));
 for(const text of ['id="control-task-search"','id="control-task-filter"','data-task-edit','reopen:','workflow.validateEdit','commitLocal('])
  assert.ok(command.includes(text),text);
 assert.match(command,/getItem\(KEY\)!==localLastLoadedRaw/);
 assert.match(sw,/control-shell-v\d+/);
 assert.match(sw,/control-task-workflow\.js/);
});
