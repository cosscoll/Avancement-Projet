import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ctx={module:{exports:{}}};
runInNewContext(read('assets/control-data-audit.js'),ctx);
const {inspect,validDate}=ctx.module.exports;
const good=()=>({
 projects:[{id:'p1',name:'Projet 1'},{id:'p2',name:'Projet 2'}],
 clients:[{id:'c1',name:'Atelier confidentiel',status:'En cours',project:'p1',nextDue:'2026-11-08'}],
 actions:[{id:'a1',title:'Confidentiel : envoyer un devis',status:'todo',priority:'Normale',project:'p1',clientId:'c1',due:'2026-11-08'}]
});

test('clean, empty and legacy unlinked tasks have no false positives',()=>{
 const result=inspect(good());
 assert.equal(result.status,'clean');
 assert.deepEqual({...result.summary},{projects:2,clients:1,tasks:1});
 assert.equal(result.counts.errors,0);
 assert.equal(result.counts.warnings,0);
 assert.equal(result.issues.length,0);
 const old=good();delete old.actions[0].clientId;
 assert.equal(inspect(old).status,'clean');
 assert.equal(inspect().status,'clean');
});

test('client associations detect missing, cross-project and missing project cases',()=>{
 const src=good();
 src.actions.push(
  {id:'a2',title:'Ancien client',clientId:'missing',status:'todo',project:'p1'},
  {id:'a3',title:'Mauvaise association',clientId:'c1',status:'todo',project:'p2'},
  {id:'a4',title:'Projet manquant',status:'todo',project:'deleted'}
 );
 src.clients.push({id:'c2',name:'Autre',project:'deleted',nextDue:''});
 const result=inspect(src),codes=result.issues.map(i=>i.code);
 for(const code of ['orphan_client','cross_project_client','orphan_project'])
  assert.ok(codes.includes(code),code);
 assert.equal(result.counts.errors,2,'The broken client links are errors');
 assert.ok(result.counts.warnings>=2,'Missing projects are warnings');
});

test('invalid dates, statuses and priorities require review',()=>{
 for(const d of ['2026-02-30','2026-13-04','2026-1-01','03/11/2026'])
  assert.equal(validDate(d),false,d);
 assert.equal(validDate('2028-02-29'),true);
 const src=good();
 src.clients[0].nextDue='2026-02-30';
 src.clients[0].status='stage-inconnu';
 src.actions[0].due='2026-13-01';
 src.actions[0].status='lost';
 src.actions[0].priority='URGENTE';
 const issues=inspect(src).issues;
 assert.equal(issues.filter(x=>x.code==='invalid_date').length,2);
 assert.ok(issues.some(x=>x.code==='unknown_status'&&x.kind==='client'));
 assert.ok(issues.some(x=>x.code==='unknown_status'&&x.kind==='task'));
 assert.ok(issues.some(x=>x.code==='unknown_priority'));
});

test('duplicate IDs, missing IDs and incomplete imported rows are not silently ignored',()=>{
 const src=good();
 src.projects.push({id:'p1',name:'doublon'});
 src.clients.push({...src.clients[0]}, {name:'sans identifiant'});
 src.actions.push({...src.actions[0]}, {title:'pas d’id'}, null);
 const result=inspect(src);
 assert.ok(result.issues.some(x=>x.code==='duplicate_id'&&x.kind==='project'));
 assert.ok(result.issues.some(x=>x.code==='duplicate_id'&&x.kind==='client'));
 assert.ok(result.issues.some(x=>x.code==='duplicate_id'&&x.kind==='task'));
 assert.ok(result.issues.some(x=>x.code==='missing_id'&&x.kind==='client'));
 assert.ok(result.issues.some(x=>x.code==='missing_id'&&x.kind==='task'));
 assert.ok(result.issues.some(x=>x.code==='malformed'&&x.kind==='task'));
});

test('raw malformed legacy collections are reported instead of silently normalized away',()=>{
 const result=inspect({projects:[{id:'p'}],clients:{broken:'not an array'},actions:'invalid shape'});
 assert.equal(result.counts.errors,2);
 assert.deepEqual(Array.from(result.issues,x=>x.code),['malformed_collection','malformed_collection']);
 const command=read('assets/command-center.js');
 const audit=command.slice(command.indexOf('function auditData(){'),command.indexOf('function settings(){'));
 assert.match(audit,/localStorage\.getItem\(KEY\)/);
 assert.match(audit,/Object\.hasOwn\(persisted,'clients'\)/);
 assert.match(audit,/Object\.hasOwn\(persisted,'actions'\)/);
 assert.ok(!audit.includes('localStorage.setItem('));
});

test('inspection never alters source records or returns private titles/names',()=>{
 const src=good(),before=JSON.stringify(src);
 const result=inspect(src);
 assert.equal(JSON.stringify(src),before);
 assert.equal(JSON.stringify(result).includes('Atelier confidentiel'),false);
 assert.equal(JSON.stringify(result).includes('Confidentiel : envoyer un devis'),false);
 assert.equal(result.summary.tasks,1);
 assert.ok(Object.isFrozen(result));
});

test('large imported data is counted entirely but display results are limited',()=>{
 const src={projects:[{id:'p'}],clients:[],actions:Array.from({length:135},(_,i)=>({id:'t'+i,title:'item '+i,due:'2026-02-30'}))};
 const result=inspect(src);
 assert.equal(result.counts.warnings,135);
 assert.equal(result.issues.length,120);
 assert.equal(result.omitted,15);
});

test('audit page is reachable from backup, security settings and home',()=>{
 const command=read('assets/command-center.js'),html=read('index.html'),sw=read('service-worker.js'),css=read('assets/control-data-audit.css');
 assert.ok(html.indexOf('assets/control-data-audit.js')<html.indexOf('assets/command-center.js'));
 assert.match(html,/href="#\/control\/audit">État des données<\/a>/);
 assert.match(html,/href="assets\/control-data-audit\.css"/);
 assert.match(command,/function auditData\(\)/);
 assert.match(command,/const pages=\{manager,team,clients,audit:auditData,/);
 assert.match(command,/Contrôler mes données/);
 assert.match(command,/Vérifier mes données/);
 assert.match(command,/report\.summary\.projects/);
 assert.match(command,/report\.counts\.errors/);
 assert.match(command,/issueLink\(row\)/);
 assert.match(command,/control\/clients\?client=/);
 assert.match(command,/control\/inbox\?task=/);
 assert.match(command,/data-act="rerun-audit"/);
 assert.match(css,/@media\(max-width:420px\)/);
 assert.match(sw,/control-shell-v83/);
 assert.equal((sw.match(/assets\/control-data-audit\.js/g)||[]).length,2);
 assert.equal((sw.match(/assets\/control-data-audit\.css/g)||[]).length,2);
 const cfg=JSON.parse(read('config/cloud.json'));
 assert.equal(cfg.enabled,false);
});

test('client audit links focus local records without exposing them elsewhere',()=>{
 const command=read('assets/command-center.js');
 const client=command.slice(command.indexOf('function clients(){'),command.indexOf('function team(){'));
 assert.match(client,/focusedClient=clientParams\.get\('client'\)/);
 assert.match(client,/control-client-highlight/);
 assert.match(client,/querySelector\('\.control-client-edit'\)/);
 const audit=command.slice(command.indexOf('function auditData(){'),command.indexOf('function settings(){'));
 assert.ok(!audit.includes('commitLocal('));
 assert.ok(!audit.includes('fetch('));
 assert.ok(!audit.includes('localStorage.setItem'));
});
