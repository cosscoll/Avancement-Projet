import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
const reviewSource=readFileSync(new URL('../assets/control-backup-review.js',import.meta.url),'utf8');
const reviewerWindow={};
new Function('window',reviewSource)(reviewerWindow);
const reviewer=reviewerWindow.CONTROL_BACKUP_REVIEW;
const preparer=source.match(/function prepareBackupExport\(\)\{[\s\S]*?\n\}/)?.[0];
const readStore=source.match(/function readBackupStore\(key\)\{[^\n]+/)?.[0];
const validate=source.slice(source.indexOf('function validateBackupData(data){'),source.indexOf('function prepareBackupExport(){'));
assert.ok(preparer&&readStore&&validate,'Use real backup export code, not a reimplementation');

function harness(){
 const keys=reviewer.storeKeys;
 const store=new Map([
  [keys[0],JSON.stringify({actions:[{id:'task-1'}],missions:[]})],
  [keys[1],JSON.stringify({projects:{first:{name:'Projet un'}}})],
  [keys[2],JSON.stringify({drafts:[{id:'draft-a'}]})]
 ]);
 let callback=null;
 const storage={
  getItem(k){const v=store.get(k)??null;if(callback)callback(k);return v},
  setItem(k,v){store.set(k,v)}
 };
 const loaded=storage.getItem(keys[0]);
 const db=JSON.parse(loaded);
 const make=()=>new Function('window','localStorage','db','localLastLoadedRaw',readStore+'\n'+validate+'\n'+preparer+'\nreturn prepareBackupExport;')(
  {CONTROL_BACKUP_REVIEW:reviewer},storage,db,loaded
 );
 return {store,storage,db,keys,make,setOnRead:fn=>{callback=fn}};
}

test('export uses the loaded command only if no other tab has replaced it',()=>{
 const h=harness(),original=h.make()();
 assert.deepEqual(original.data.command.actions,[{id:'task-1'}]);
 h.store.set(h.keys[0],JSON.stringify({actions:[{id:'newer'}],missions:[]}));
 assert.throws(h.make(),/autre onglet/);
 assert.deepEqual(h.db.actions,[{id:'task-1'}], 'stale local editor must not be silently exported');
});
test('export reads all three current stores and prepares a private snapshot',()=>{
 const h=harness();
 h.store.set(h.keys[1],JSON.stringify({projects:{latest:{name:'Récent'}}}));
 h.store.set(h.keys[2],JSON.stringify({drafts:[{id:'latest'}]}));
 const prepared=h.make()();
 assert.equal(prepared.data.hub.projects.latest.name,'Récent');
 assert.equal(prepared.data.automations.drafts[0].id,'latest');
 assert.ok(reviewer.unchanged(h.storage,prepared.original));
});
test('mid-preparation edits abort instead of producing mixed-time backups',()=>{
 const h=harness();
 let reads=0;
 h.setOnRead(key=>{
  if(++reads===6)h.store.set(h.keys[2],JSON.stringify({drafts:[{id:'changed during export'}]}));
 });
 assert.throws(h.make(),/Les données ont changé pendant la préparation/);
});
test('invalid project JSON is never replaced by empty backup content',()=>{
 const h=harness();
 h.store.set(h.keys[1],'{malformed');
 assert.throws(h.make(),SyntaxError);
 assert.equal(h.store.get(h.keys[1]),'{malformed');
});
test('download is guarded after asynchronous encryption and cannot leak stale content',()=>{
 const exportHandler=source.slice(source.indexOf("registerForm('#export-data'"),source.indexOf("$('#main [data-act=\"download-corrupt\"]')"));
 assert.match(exportHandler,/prepareBackupExport\(\)/);
 assert.match(exportHandler,/await pack\(exportData\.data,pw\)/);
 assert.match(exportHandler,/if\(!window\.CONTROL_BACKUP_REVIEW\.unchanged\(localStorage,exportData\.original\)\)return toast/);
 assert.ok(exportHandler.indexOf('unchanged(localStorage,exportData.original)')<exportHandler.indexOf('new Blob('));
 assert.doesNotMatch(exportHandler,/command:db,hub:getStorage\(HUB\)/);
});
