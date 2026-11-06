import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const window={};
new Function('window',readFileSync(new URL('../assets/control-backup-review.js',import.meta.url),'utf8'))(window);
const review=window.CONTROL_BACKUP_REVIEW;
assert.ok(review);

const fixture=(actions=0,websites=0)=>({
 command:{actions:Array.from({length:actions},(_,i)=>({id:'a'+i})),missions:[],events:[],
  websites:Array.from({length:websites},(_,i)=>({id:'w'+i}))},
 hub:{projects:{a:{id:'a'},b:{id:'b'}}},
 automations:{entries:[]}
});
test('the review shows counts only and warns when imported items would be lost',()=>{
 const before=fixture(3,7),after=fixture(1,2);
 const result=review.compare(after,before);
 assert.equal(result.changes.find(x=>x.key==='actions').before,3);
 assert.equal(result.changes.find(x=>x.key==='actions').after,1);
 assert.equal(result.changes.find(x=>x.key==='websites').before,7);
 assert.equal(result.changes.find(x=>x.key==='websites').after,2);
 assert.deepEqual(result.losses.map(x=>x.key),['actions','websites']);
 assert.ok(result.totalBefore>result.totalAfter);
 assert.match(result.note,/uniquement des nombres/);
 assert.equal(result.studioPreservedFromLegacy,true);
 assert.equal(JSON.stringify(result).includes('a0'),false,'comparison must not expose private records');
});
test('modern custom projects are counted as projects and project changes are not hidden',()=>{
 const before=fixture(),after=fixture();
 before.hub.custom=[{id:'custom-a',name:'Projet entreprise privé',links:[{url:'https://secret.example'}]},{id:'custom-b',name:'Autre'}];
 after.hub.custom=[{id:'custom-a',name:'Projet renommé',links:[{url:'https://secret.example'}]}];
 const result=review.compare(after,before),row=result.changes.find(x=>x.key==='custom-projects');
 assert.equal(row.before,2);
 assert.equal(row.after,1);
 assert.equal(row.removed,1);
 assert.equal(row.added,0);
 assert.equal(row.modified,1);
 assert.ok(result.losses.some(x=>x.key==='custom-projects'));
 assert.ok(result.modified.some(x=>x.key==='custom-projects'));
 assert.equal(JSON.stringify(result).includes('Projet entreprise privé'),false);
 assert.equal(JSON.stringify(result).includes('https://secret.example'),false);
 assert.equal(JSON.stringify(result).includes('custom-a'),false);
});
test('portable projects with same counts and different IDs are flagged as replacements',()=>{
 const before=fixture(),after=fixture();
 before.hub.custom=[{id:'custom-old',name:'Dossier personnel'}];
 after.hub.custom=[{id:'custom-new',name:'Dossier personnel'}];
 const row=review.compare(after,before).changes.find(x=>x.key==='custom-projects');
 assert.equal(row.before,1);
 assert.equal(row.after,1);
 assert.equal(row.added,1);
 assert.equal(row.removed,1);
 assert.equal(row.modified,0);
});
test('reordered personalized projects are not falsely reported as edited',()=>{
 const before=fixture(),after=fixture();
 before.hub.custom=[{id:'one',name:'Premier'},{id:'two',name:'Second'}];
 after.hub.custom=[{name:'Second',id:'two'},{name:'Premier',id:'one'}];
 const row=review.compare(after,before).changes.find(x=>x.key==='custom-projects');
 assert.equal(row.modified,0);
 assert.equal(row.removed,0);
 assert.equal(row.added,0);
});
test('legacy project maps stay counted without claiming precise record differences',()=>{
 const before=fixture(),after=fixture();
 after.hub.projects={a:{id:'a'},b:{id:'b'},c:{id:'c'}};
 const report=review.compare(after,before);
 const legacy=report.changes.find(x=>x.key==='projects');
 const modern=report.changes.find(x=>x.key==='custom-projects');
 assert.equal(legacy.before,2);
 assert.equal(legacy.after,3);
 assert.equal(legacy.uncertain,true);
 assert.equal(modern.before,0);
 assert.equal(modern.after,0);
});
test('ambiguous duplicated project identifiers are flagged as uncertain',()=>{
 const before=fixture(),after=fixture();
 before.hub.custom=[{id:'custom-1',name:'Name'}];
 after.hub.custom=[{id:'custom-1',name:'Name'},{id:'custom-1',name:'Duplicate'}];
 const row=review.compare(after,before).changes.find(x=>x.key==='custom-projects');
 assert.equal(row.uncertain,true);
 assert.equal(row.modified,null);
});
test('client records appear in the backup comparison without leaking any client name',()=>{
 const before=fixture(2,1),after=fixture(1,1);
 before.command.clients=[{id:'c1',name:'Confidentiel entreprise'},{id:'c2',name:'Client second'}];
 after.command.clients=[{id:'c1',name:'Confidentiel entreprise'}];
 const report=review.compare(after,before);
 const clients=report.changes.find(x=>x.key==='clients');
 assert.equal(clients.before,2);
 assert.equal(clients.after,1);
 assert.ok(report.losses.some(x=>x.key==='clients'));
 assert.equal(JSON.stringify(report).includes('Confidentiel entreprise'),false);
});

test('untrusted backup is never executed and lacks account permissions',()=>{
 const data=fixture(1,1);data.command.actions[0]={id:'<script>alert(1)</script>',secret:'secret'};
 const report=review.compare(data,fixture());
 assert.ok(!JSON.stringify(report).includes('secret'));
 assert.ok(!JSON.stringify(report).includes('<script>'));
 assert.throws(()=>review.compare({command:{actions:[]}},fixture()),/incomplète/);
});
test('snapshot catches edits even if record counts stay identical',()=>{
 const map=new Map([['control-command-v1','{"actions":[{"id":"one"}]}'],['control-hub-v2','{}'],['control-automations-v1',null]]);
 const storage={getItem:key=>map.get(key)??null};
 const stored=review.snapshot(storage);
 assert.ok(review.unchanged(storage,stored));
 map.set('control-command-v1','{"actions":[{"id":"two"}]}');
 assert.equal(review.unchanged(storage,stored),false);
 map.set('control-command-v1','{"actions":[{"id":"one"}]}');
 map.set('control-automations-v1','{}');
 assert.equal(review.unchanged(storage,stored),false);
 assert.equal(review.unchanged(storage,[]),false);
});
test('backup review is loaded before the command center, cached, and never publishes data',()=>{
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 assert.ok(index.indexOf('assets/control-backup-review.js')<index.indexOf('assets/command-center.js'));
 assert.ok(sw.includes("'./assets/control-backup-review.js'"));
 assert.match(sw,/const CACHE_SHELL='control-shell-v\\d+'/);
 assert.match(app,/Examiner la sauvegarde/);
 assert.match(app,/id="import-preview"/);
 assert.match(app,/id="import-apply"/);
 assert.match(app,/restore\.unchanged\(localStorage,staged\.original\)/);
 assert.match(app,/restore\.compare\(data,existing\)/);
 assert.doesNotMatch(readFileSync(new URL('../assets/control-backup-review.js',import.meta.url),'utf8'),/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage\.setItem/);
});

test('same-count modified records are explicitly detected without revealing title or IDs',()=>{
 const old=fixture(1,1),fresh=fixture(1,1);
 old.command.actions[0].title='Confidentiel avant';
 fresh.command.actions[0].title='Confidentiel après';
 const report=review.compare(fresh,old),rows=report.changes.find(x=>x.key==='actions');
 assert.equal(rows.before,1);
 assert.equal(rows.after,1);
 assert.equal(rows.added,0);
 assert.equal(rows.removed,0);
 assert.equal(rows.modified,1);
 assert.equal(report.totalModified,1);
 assert.deepEqual(report.modified.map(x=>x.key),['actions']);
 for(const forbidden of ['Confidentiel avant','Confidentiel après','a0'])assert.ok(!JSON.stringify(report).includes(forbidden));
});
test('a replaced record with identical counts counts as one removal and one addition',()=>{
 const old=fixture(1,0),next=fixture(1,0);
 next.command.actions[0].id='new-private-id';
 const row=review.compare(next,old).changes.find(x=>x.key==='actions');
 assert.equal(row.before,1);
 assert.equal(row.after,1);
 assert.equal(row.added,1);
 assert.equal(row.removed,1);
 assert.equal(row.modified,0);
 assert.ok(review.compare(next,old).losses.some(x=>x.key==='actions'));
 assert.equal(JSON.stringify(row).includes('new-private-id'),false);
});
test('comparison handles reordering and property order without false positives',()=>{
 const before=fixture(2,0),after=fixture(2,0);
 after.command.actions=before.command.actions.slice().reverse().map(x=>({id:x.id}));
 const row=review.compare(after,before).changes.find(x=>x.key==='actions');
 assert.equal(row.modified,0);
 assert.equal(row.added,0);
 assert.equal(row.removed,0);
 const one=fixture(1,0),two=fixture(1,0);
 one.command.actions[0]={id:'a0',title:'T',status:'todo'};
 two.command.actions[0]={status:'todo',title:'T',id:'a0'};
 assert.equal(review.compare(two,one).changes.find(x=>x.key==='actions').modified,0);
});
test('duplicate and legacy missing IDs never generate invented exact diff claims',()=>{
 const before=fixture(2,0),after=fixture(2,0);
 after.command.actions=[{id:'repeat',title:'x'},{id:'repeat',title:'y'}];
 const report=review.compare(after,before);
 const row=report.changes.find(x=>x.key==='actions');
 assert.equal(row.modified,null);
 assert.equal(row.uncertain,true);
 assert.ok(report.uncertain.some(x=>x.key==='actions'));
 const missing=fixture(1,0);missing.command.actions=[{title:'undocumented'}];
 assert.equal(review.compare(missing,before).changes.find(x=>x.key==='actions').modified,null);
});
function fakeStore(initial={},options={}){
 const map=new Map(Object.entries(initial));
 const calls=[];
 return{
  values:map,calls,
  getItem(key){return map.has(key)?map.get(key):null},
  setItem(key,value){
   calls.push(['write',key]);
   if(options.failOn===key)throw Error('Storage quota exceeded');
   map.set(key,String(value));
   if(options.afterWrite)options.afterWrite(key,map);
  },
  removeItem(key){calls.push(['remove',key]);map.delete(key)}
 };
}
function storedBase(){
 return {
  'control-command-v1':JSON.stringify({actions:[{id:'old'}],missions:[]}),
  'control-hub-v2':JSON.stringify({custom:[{id:'custom-old',name:'Ancien projet'}]}),
  'control-automations-v1':JSON.stringify({entries:[]}),
  'control-ai-studio-v1':JSON.stringify({agents:[{id:'agent-original'}]})
 };
}
function importedBase(){
 return {
  command:{actions:[{id:'new-task',title:'Test utilisateur',project:'custom-new'}],missions:[]},
  hub:{custom:[{id:'custom-new',name:'Dossier transféré'}]},
  automations:{entries:[]}
 };
}
test('an actual storage transaction transfers clients, projects and linked tasks without touching legacy Studio IA',()=>{
 const a=fakeStore(storedBase());
 const backup=importedBase();
 backup.command.clients=[{id:'client-1',name:'Entreprise',project:'custom-new'}];
 backup.command.actions[0].clientId='client-1';
 const original=review.snapshot(a);
 const copy=JSON.stringify(backup);
 const result=review.applyTransaction(a,original,backup);
 assert.equal(result.ok,true);
 assert.deepEqual(JSON.parse(a.getItem('control-command-v1')).actions[0],backup.command.actions[0]);
 assert.deepEqual(JSON.parse(a.getItem('control-command-v1')).clients,backup.command.clients);
 assert.deepEqual(JSON.parse(a.getItem('control-hub-v2')).custom,backup.hub.custom);
 assert.equal(JSON.parse(a.getItem('control-ai-studio-v1')).agents[0].id,'agent-original');
 assert.equal(JSON.stringify(backup),copy,'source file must be unchanged by transfer');
});
test('backup import errors are useful, allowlisted and never expose secrets from arbitrary exceptions',()=>{
 assert.match(review.safeImportError(new Error('Format de sauvegarde inconnu.')),/fichier JSON exporté depuis CONTROL/);
 assert.match(review.safeImportError(new Error('Enveloppe de sauvegarde invalide.')),/sauvegarde CONTROL/);
 assert.match(review.safeImportError(new Error('Mot de passe manquant.')),/indique le mot de passe/);
 assert.match(review.safeImportError(new Error('Mot de passe incorrect ou sauvegarde chiffrée altérée.')),/Mot de passe incorrect/);
 assert.match(review.safeImportError(new Error('Métadonnées du fichier chiffré invalides.')),/incomplète ou endommagée/);
 const secret='private-access-token-can-never-be-displayed';
 assert.ok(!review.safeImportError(new Error('Broken JSON '+secret)).includes(secret));
 assert.ok(!review.safeImportError({message:secret}).includes(secret));
 assert.ok(!review.safeImportError(null).includes('undefined'));
 const center=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 assert.match(center,/message\.textContent=restore\.safeImportError\(error\)/);
});

test('a fresh second browser can import a full backup without modifying the first browser',()=>{
 const first=fakeStore(storedBase()),second=fakeStore({});
 const backup={command:JSON.parse(first.getItem('control-command-v1')),
  hub:JSON.parse(first.getItem('control-hub-v2')),
  automations:JSON.parse(first.getItem('control-automations-v1')),
  studio:JSON.parse(first.getItem('control-ai-studio-v1'))};
 const expectedFirst=review.snapshot(first);
 const result=review.applyTransaction(second,review.snapshot(second),backup);
 assert.equal(result.ok,true);
 assert.deepEqual(review.snapshot(second),expectedFirst);
 assert.deepEqual(review.snapshot(first),expectedFirst);
});
test('intervening edits prevent restore before the first write',()=>{
 const store=fakeStore(storedBase()),expected=review.snapshot(store);
 store.setItem('control-command-v1',JSON.stringify({actions:[{id:'external'}]}));
 const actual=review.snapshot(store);
 const result=review.applyTransaction(store,expected,importedBase());
 assert.equal(result.ok,false);assert.equal(result.reason,'concurrent');
 assert.equal(review.unchanged(store,actual),true);
});
test('storage quota failure during the second write rolls back the first without losing unrelated data',()=>{
 const initial=storedBase(),store=fakeStore(initial,{failOn:'control-hub-v2'});
 const original=review.snapshot(store);
 const result=review.applyTransaction(store,original,importedBase());
 assert.equal(result.ok,false);
 assert.equal(result.rollbackUncertain,false);
 assert.deepEqual(review.snapshot(store),original);
});
test('callback failure after all writes rolls back every changed storage key',()=>{
 const store=fakeStore(storedBase()),original=review.snapshot(store);
 const result=review.applyTransaction(store,original,importedBase(),()=>{throw Error('UI reinitialization failed')});
 assert.equal(result.ok,false);
 assert.equal(result.rollbackUncertain,false);
 assert.deepEqual(review.snapshot(store),original);
});
test('an external edit to a written key is never overwritten during rollback',()=>{
 const initial=storedBase(),store=fakeStore(initial,{
  afterWrite(key,map){
   if(key==='control-command-v1')map.set('control-command-v1',JSON.stringify({external:true}));
  }
 });
 const original=review.snapshot(store);
 const result=review.applyTransaction(store,original,importedBase());
 assert.equal(result.ok,false);
 assert.equal(result.rollbackUncertain,true);
 assert.equal(JSON.parse(store.getItem('control-command-v1')).external,true);
 assert.equal(store.getItem('control-hub-v2'),original[1]);
});
test('invalid or incomplete transaction is rejected without modifying storage',()=>{
 const store=fakeStore(storedBase()),original=review.snapshot(store);
 for(const value of [null,{}, {command:{},hub:{}}, {command:{},hub:{},automations:null}]){
  const result=review.applyTransaction(store,original,value);
  assert.equal(result.ok,false);
 }
 assert.deepEqual(review.snapshot(store),original);
});
test('a failed post-restore UI reload triggers a safe in-memory refresh after rollback',()=>{
 const center=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 assert.match(center,/let reinitializationAttempted=false/);
 assert.match(center,/if\(!result\.ok&&reinitializationAttempted&&!result\.rollbackUncertain\)/);
 assert.match(center,/try\{init\(\);\}catch/);
 const store=fakeStore(storedBase()),snapshot=review.snapshot(store);
 let invoked=0;
 const result=review.applyTransaction(store,snapshot,importedBase(),()=>{invoked++;throw Error('init failed')});
 assert.equal(invoked,1);
 assert.equal(result.ok,false);
 assert.equal(result.rollbackUncertain,false);
 assert.deepEqual(review.snapshot(store),snapshot);
});
test('restore transaction is used only after explicit preview and confirmation',()=>{
 const command=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 const backupSection=command.slice(command.indexOf('function backup(){'),command.indexOf('// Search only live, authorized'));
 assert.match(backupSection,/if\(staged\.integrity\.unrestorable\)/);
 assert.match(backupSection,/if\(staged\.requiresIntegrityAcknowledgement&&!integrityAck\.checked\)/);
 assert.match(backupSection,/if\(!restore\.unchanged\(localStorage,staged\.original\)\)/);
 assert.match(backupSection,/const result=restore\.applyTransaction\(localStorage,staged\.original,staged\.data/);
 assert.match(backupSection,/if\(!confirm\('Remplacer maintenant les données CONTROL/);
});
test('diff table exposes redacted counts and accessible horizontal scrolling',()=>{
 const app=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../assets/command-center.css',import.meta.url),'utf8');
 assert.match(app,/aria-label="Comparaison détaillée des sauvegardes"/);
 assert.match(app,/Ajouts<\/th><th>Retraits<\/th><th>Modifiés/);
 assert.match(app,/review\.modified\.length/);
 assert.match(css,/\.backup-diff-scroll\{overflow-x:auto/);
});

test('unified CONTROL backup includes Studio IA and keeps legacy backups compatible',()=>{
 const center=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 assert.match(center,/data.studio=readBackupStore\(STUDIO\)/);
 const reviewer=readFileSync(new URL('../assets/control-backup-review.js',import.meta.url),'utf8');
 assert.match(reviewer,/if\(Object.hasOwn\(data,'studio'\)\)entries.push/);
 assert.match(center,/anciens fichiers sans Studio IA/);
});
test('backwards-compatible comparison never claims lost agents when an old backup has no Studio section',()=>{
 const current={...fixture(1,0),studio:{version:1,imports:[],memories:[{id:'mem-1'}],agents:[{id:'agt-1'}]}};
 const legacy=fixture(2,0);
 const report=review.compare(legacy,current);
 assert.equal(report.studioPreservedFromLegacy,true);
 assert.equal(report.changes.find(x=>x.key==='studio-agents').removed,0);
 assert.equal(report.changes.find(x=>x.key==='studio-memories').before,1);
 assert.equal(report.changes.find(x=>x.key==='studio-memories').after,1);
});
test('new unified backup compares changed Studio memories by stable id without exposing content',()=>{
 const previous={...fixture(),studio:{version:1,imports:[],memories:[{id:'mem-1',content:'Confidentiel ancien'}],agents:[]}};
 const next={...fixture(),studio:{version:1,imports:[],memories:[{id:'mem-1',content:'Confidentiel nouveau'}],agents:[]}};
 const report=review.compare(next,previous);
 assert.equal(report.studioPreservedFromLegacy,false);
 const line=report.changes.find(x=>x.key==='studio-memories');
 assert.equal(line.before,1);assert.equal(line.modified,1);
 assert.ok(!JSON.stringify(report).includes('Confidentiel'));
});
