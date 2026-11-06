import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Exercise the actual asynchronous import handler, not a copy of its logic.
const source=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
const start=source.indexOf(' const restore=window.CONTROL_BACKUP_REVIEW;');
const end=source.indexOf("\n $('#import-apply').onclick=()=>{",start);
assert.ok(start>0&&end>start,'find the real backup preview/submit handlers');
const section=source.slice(start,end);
assert.match(section,/generation!==importGeneration/);

function deferred(){
 let resolve,reject;
 const promise=new Promise((a,b)=>{resolve=a;reject=b});
 return {promise,resolve,reject};
}
const data=id=>({id,command:{actions:[],missions:[]},hub:{projects:{}},automations:{}});
function createHarness(unpack){
 const registered={};
 const nodes=new Map();
 const node=selector=>{
  if(!nodes.has(selector))nodes.set(selector,{
   hidden:true,checked:false,disabled:false,textContent:'',innerHTML:'',
   replaceChildren(){this.innerHTML=''},
   addEventListener(event,callback){this['on'+event]=callback},
   insertAdjacentHTML(){throw Error('Unexpected invalid-storage warning')}
  });
  return nodes.get(selector);
 };
 const review={
  snapshot:()=>['command','hub','automations','studio'],
  compare:()=>({
   changes:[],totalBefore:0,totalAfter:0,totalRemoved:0,totalModified:0,
   losses:[],modified:[],uncertain:[]
  }),
  safeImportError:()=> 'Fichier illisible.'
 };
 const integrity={counts:{errors:0,warnings:0},issues:[],unrestorable:false};
 const factory=new Function(
  'window','registerForm','$','unpack','validateBackupData','localStorage','backupStorageIssues',
  'readBackupStore','KEY','HUB','AUTOS','STUDIO','ctx',
  section+'\nreturn {getPending:()=>pending};'
 );
 const state=factory(
  {CONTROL_BACKUP_REVIEW:review,CONTROL_DATA_AUDIT:{inspectBackup:()=>integrity}},
  (selector,callback)=>{registered[selector]=callback},node,unpack,()=>true,{},()=>[],()=>({}),
  'command','hub','automations','studio',{projects:[]}
 );
 return {
  submit:(file,pw='')=>registered['#import-data']({get:k=>k==='file'?file:k==='password'?pw:null}),
  change:()=>node('#import-data').onchange(),
  cancel:()=>node('#import-cancel').onclick(),
  pending:state.getPending,
  message:()=>node('#import-status').textContent,
  preview:()=>node('#import-preview').hidden,
  form:()=>node('#import-data')
 };
}
const fakeFile=gate=>({size:120,text:()=>gate.promise});

test('changing the selected file while read is pending invalidates the old request',async()=>{
 const h=createHarness(async envelope=>data(envelope.id));
 const first=deferred(),second=deferred();
 const oldRun=h.submit(fakeFile(first));
 h.change();
 assert.match(h.message(),/Fichier ou mot de passe modifié/);
 const newRun=h.submit(fakeFile(second));
 first.resolve(JSON.stringify({id:'old-file'}));
 await oldRun;
 assert.equal(h.pending(),null,'first request cannot publish an obsolete inspection');
 second.resolve(JSON.stringify({id:'new-file'}));
 await newRun;
 assert.equal(h.pending()?.data.id,'new-file');
 assert.equal(h.preview(),false);
});

test('cancelling while AES-GCM decrypts prevents an obsolete confirmed preview',async()=>{
 const file=deferred(),decryption=deferred(),entered=deferred();
 const h=createHarness(async()=>{entered.resolve();return decryption.promise});
 const running=h.submit(fakeFile(file),'valid-phrase');
 file.resolve(JSON.stringify({id:'slow-encrypted'}));
 await entered.promise;
 h.cancel();
 assert.match(h.message(),/Import annulé/);
 decryption.resolve(data('slow-encrypted'));
 await running;
 assert.equal(h.pending(),null);
 assert.equal(h.preview(),true);
 assert.match(h.message(),/Import annulé/);
});

test('a stale parsing error cannot overwrite the new file selection notice',async()=>{
 const h=createHarness(async envelope=>data(envelope.id));
 const file=deferred();
 const running=h.submit(fakeFile(file));
 h.change();
 file.resolve('{broken json');
 await running;
 assert.equal(h.pending(),null);
 assert.match(h.message(),/Fichier ou mot de passe modifié/);
 assert.doesNotMatch(h.message(),/Fichier illisible/);
});

test('the normal current file still receives its complete preview',async()=>{
 const h=createHarness(async envelope=>data(envelope.id));
 const file=deferred();
 const running=h.submit(fakeFile(file));
 assert.match(h.message(),/Vérification du fichier en cours/);
 file.resolve(JSON.stringify({id:'current'}));
 await running;
 assert.equal(h.pending()?.data.id,'current');
 assert.equal(h.preview(),false);
 assert.match(h.message(),/Sauvegarde déchiffrée et vérifiée/);
});
