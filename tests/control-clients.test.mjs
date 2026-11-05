import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ctx={module:{exports:{}},URL};
runInNewContext(read('assets/control-clients.js'),ctx);
const {validate,matches,sort,validDate,normalize}=ctx.module.exports;

test('Client workflow validates organisation names and refuses malformed fields',()=>{
 const good={name:'  Entreprise Démo  ',status:'Prospect',project:'p1',nextStep:'Envoyer la proposition',nextDue:'2026-11-12',website:'https://exemple.fr'};
 const result=validate(good,['p1']);
 assert.equal(result.ok,true);
 assert.equal(result.client.name,'Entreprise Démo');
 assert.equal(result.client.nextStep,'Envoyer la proposition');
 assert.equal(validate({...good,name:''},['p1']).ok,false);
 assert.equal(validate({...good,name:'x'.repeat(121)},['p1']).ok,false);
 assert.equal(validate({...good,name:'AB\nCD'},['p1']).ok,false);
 assert.equal(validate({...good,nextStep:'x'.repeat(181)},['p1']).ok,false);
 assert.equal(validate({...good,status:'Paiement effectué'},['p1']).ok,false);
});

test('Project association respects current catalogue and legacy links can be retained only on edit',()=>{
 const client={name:'Agence',status:'En cours',project:'old-project',nextStep:'',nextDue:'',website:''};
 assert.equal(validate(client,['','p1']).ok,false);
 assert.equal(validate(client,['','p1','old-project']).ok,true);
 assert.equal(validate({...client,project:'p2'},['','p1','old-project']).ok,false);
 assert.equal(validate({...client,project:''},['','p1']).ok,true);
});

test('Only validated dates and public HTTPS references are accepted',()=>{
 assert.equal(validDate(''),true);
 assert.equal(validDate('2028-02-29'),true);
 for(const invalid of ['2026-02-30','2026-13-01','03/11/2026','2026-1-3','2026-00-01'])
  assert.equal(validDate(invalid),false);
 const base={name:'Client',status:'Prospect',project:'',nextStep:'',nextDue:'',website:''};
 for(const url of ['javascript:alert(1)','http://example.com','https://user:pass@example.com','https://example.com/?access_token=abc','https://example.com/?api_key=x','not a website']){
  assert.equal(validate({...base,website:url},['']).ok,false,url);
 }
 assert.equal(validate({...base,website:'https://example.com/fiche'},['']).ok,true);
 assert.equal(validate({...base,nextDue:'2026-02-30'},['']).ok,false);
});

test('Accents, projects, status and sorting work without altering input records',()=>{
 assert.equal(normalize('  Éléphant  '),'elephant');
 const records=[
  {name:'Zéro',status:'Terminé',project:'p2',nextStep:'',nextDue:''},
  {name:'Ébéniste',status:'Prospect',project:'p1',nextStep:'Relancer',nextDue:'2026-11-12'},
  {name:'Boulangerie',status:'En cours',project:'p1',nextStep:'Devis',nextDue:'2026-11-15'}
 ];
 assert.equal(matches(records[1],'ebeniste','Prospect','p1'),true);
 assert.equal(matches(records[1],'devis','Tous','p1'),false);
 assert.equal(matches(records[1],'','En cours','p1'),false);
 assert.equal(matches(records[2],'','En cours','p1'),true);
 assert.deepEqual(Array.from(sort(records),r=>r.name),['Ébéniste','Boulangerie','Zéro']);
 assert.equal(records[0].name,'Zéro','Sorting does not modify original array');
});

test('Malformed imported legacy dates do not crash sorting',()=>{
 const rows=[{id:'bad',name:'Ancienne fiche',status:'?',nextDue:123},
  {id:'okay',name:'Fiche valide',status:'Prospect',nextDue:'2026-11-06'}];
 assert.deepEqual(Array.from(sort(rows),x=>x.id),['okay','bad']);
});

test('Task-client association refuses missing clients and other projects',()=>{
 const records=[{id:'a',name:'Atelier',project:'p1'},{id:'global',name:'Prospect global',project:''}];
 assert.equal(ctx.module.exports.clientForTask('a','p1',records).ok,true);
 assert.equal(ctx.module.exports.clientForTask('a','p2',records).ok,false);
 assert.equal(ctx.module.exports.clientForTask('missing','p1',records).ok,false);
 assert.equal(ctx.module.exports.clientForTask('global','p2',records).ok,true);
 assert.equal(ctx.module.exports.clientForTask('','p2',records).ok,true);
 assert.deepEqual(Array.from(ctx.module.exports.eligibleForProject(records,'p2'),x=>x.id),['global']);
 assert.deepEqual(Array.from(ctx.module.exports.eligibleForProject(records,'p1'),x=>x.id),['a','global']);
});

test('Linked tasks are found by stable ID and preserve unrelated records',()=>{
 const tasks=[
  {id:'t1',title:'Relancer',clientId:'a',status:'todo'},
  {id:'t2',title:'Réunion',clientId:'a',status:'done'},
  {id:'t3',title:'Divers',clientId:'b',status:'doing'},
  {id:'t4',title:'Annulée',clientId:'a',status:'cancelled'},
  {id:'t5',title:'  ',clientId:'a',status:'todo'}
 ];
 assert.deepEqual(Array.from(ctx.module.exports.tasksForClient(tasks,'a'),x=>x.id),['t1','t2']);
 assert.deepEqual(Array.from(ctx.module.exports.tasksForClient(tasks,'b'),x=>x.id),['t3']);
 assert.equal(tasks[0].clientId,'a','Lookup must be read-only');
});

test('Task creation from a client keeps the true client link, never only its project',()=>{
 const command=read('assets/command-center.js');
 const index=read('index.html');
 assert.match(command,/requestParams\.get\('client'\)/);
 assert.match(command,/clientTool\.clientForTask\(requestClientId,createProject,db\.clients\)/);
 assert.match(command,/field\('Action','title',createClientId\?requestedClient\.nextStep/);
 assert.match(command,/clientField\(createProject,createClientId\)/);
 assert.match(command,/clientTool\.clientForTask\(clientId,data\.task\.project,db\.clients\)/);
 assert.match(command,/\.\.\.\(clientId\?\{clientId\}:\{\}\)/);
 assert.match(command,/if\(clientId\)task\.clientId=clientId;else delete task\.clientId/);
 assert.match(command,/querySelectorAll\('form\[data-task-edit\],#new-action'\)/);
 assert.match(command,/Client : '\+h\(clientLabel\)/);
 assert.match(command,/clientLabel\]\.join\(' '\)/);
 assert.match(index,/assets\/control-clients\.js/);
});

test('Client linked task list opens real tasks and deletion/changes do not delete actions',()=>{
 const command=read('assets/command-center.js');
 const block=command.slice(command.indexOf('function clients(){'),command.indexOf('function team(){'));
 assert.match(block,/tasksForClient\(db\.actions,r\.id\)/);
 assert.match(block,/href="#\/control\/inbox\?task='\+encodeURIComponent\(t\.id\)/);
 assert.match(block,/actionHref='#\/control\/inbox\/new\?client='\+encodeURIComponent\(r\.id\)/);
 assert.match(block,/const unlink=db\.actions\.filter\(t=>t\?\.clientId===record\.id/);
 assert.match(block,/for\(const task of unlink\)\{delete task\.clientId/);
 assert.match(block,/for\(const task of db\.actions\)if\(task\?\.clientId===item\.id\)/);
 assert.match(block,/confirm\('Supprimer cette fiche locale/);
 assert.ok(!block.includes('db.actions=db.actions.filter('));
 assert.match(command,/linked\?\.name/);
 assert.match(command,/client : '\+linked\.name/);
});
test('Client task view includes completed actions and can filter the inbox by client ID',()=>{
 const command=read('assets/command-center.js');
 const clients=command.slice(command.indexOf('function clients(){'),command.indexOf('function team(){'));
 const inbox=command.slice(command.indexOf('function intake(){'),command.indexOf('function clients(){'));
 assert.match(clients,/control-client-all-tasks/);
 assert.match(clients,/href="#\/control\/inbox\?client='\+encodeURIComponent\(r\.id\)/);
 assert.match(inbox,/const filterClientId=requestedClient\?requestClientId:''/);
 assert.match(inbox,/inboxFilter='all'/);
 assert.match(inbox,/\['all','Toutes les tâches'\]/);
 assert.match(inbox,/data-task-client="/);
 assert.match(inbox,/id="control-task-client"/);
 assert.match(inbox,/row\.dataset\.taskClient===selectedClient/);
 assert.match(inbox,/inboxFilter==='all'\?true/);
 const css=read('assets/control-clients.css');
 assert.match(css,/\.control-task-toolbar:has\(#control-task-client\)/);
 assert.match(css,/@media\(max-width:700px\)/);
});

test('Client pages are reachable from projects, management shortcuts and universal search',()=>{
 const html=read('index.html');
 const command=read('assets/command-center.js');
 const backup=read('assets/control-backup-review.js');
 assert.match(html,/src="assets\/control-clients\.js"/);
 assert.match(html,/href="#\/control\/clients">Clients<\/a>/);
 assert.match(html,/Clients liés/);
 assert.match(command,/function clients\(\)/);
 assert.match(command,/const pages=\{manager,team,clients,/);
 assert.match(command,/clients:\[\]/);
 assert.match(command,/,'clients'\]\)/);
 assert.match(command,/\['clients','Clients et suivi'\]/);
 assert.match(command,/for\(const client of db\.clients\|\|\[\]\)/);
 assert.match(backup,/\['clients','Clients locaux'\]/);
});

test('Save, edit, remove and search remain local and require deliberate user actions',()=>{
 const command=read('assets/command-center.js');
 const section=command.slice(command.indexOf('function clients(){'),command.indexOf('function team(){'));
 assert.ok(section.length>2000);
 for(const name of ['id="new-client"','data-client-edit','control-client-search','control-client-filter','control-client-project','clientTool.validate','commitLocal(','confirm(','client-delete:','Créer une tâche'])
  assert.ok(section.includes(name),name);
 assert.ok(!section.includes('fetch('));
 assert.ok(!section.includes('Notification('));
 assert.ok(section.includes('Fiches saisies uniquement sur cet appareil'));
});

test('CONTROL theme and offline shell include the client feature',()=>{
 const html=read('index.html');
 const sw=read('service-worker.js');
 const css=read('assets/control-clients.css');
 assert.match(html,/href="assets\/control-clients\.css"/);
 assert.ok(html.indexOf('control-brand-simple-humain.css')<html.indexOf('control-clients.css'));
 assert.match(css,/control-client-row:has\(\.control-client-edit\[open\]\)/);
 assert.match(css,/@media\(max-width:420px\)/);
 assert.match(sw,/control-shell-v88/);
 assert.match(sw,/control-public-data-v88/);
 assert.equal((sw.match(/assets\/control-clients\.js/g)||[]).length,2);
 assert.equal((sw.match(/assets\/control-clients\.css/g)||[]).length,2);
 const config=JSON.parse(read('config/cloud.json'));
 assert.equal(config.enabled,false);
});
