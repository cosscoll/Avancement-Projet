import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';

const source=readFileSync(new URL('../assets/cloud-app.js',import.meta.url),'utf8');
const cryptoFns=source.slice(source.indexOf('const encB64='),source.indexOf('// Exports must read'));
const inspector=source.slice(source.indexOf('function validateCloudBackup('),source.indexOf('async function importLegacy(){'));
assert.ok(cryptoFns.startsWith('const encB64='));
assert.ok(inspector.startsWith('function validateCloudBackup('));
assert.match(source,/id="control-backup-file"/);
assert.match(source,/document\.addEventListener\('change',async e=>/);
assert.doesNotMatch(inspector,/client\.from\(|functions\.invoke\(|localStorage|fetch\(/);

const owner='account-verified-A';
const blank=()=>({
 schema:'control-cloud-export-v1',accountId:owner,exportedAt:'2026-10-21T17:00:00.000Z',
 profile:{user_id:owner},preferences:{owner_id:owner},
 projects:[{id:'p-A',owner_id:owner,name:'Project A'}],
 items:[{id:'i-A',owner_id:owner,project_id:'p-A',kind:'task',title:'Private'}],
 connections:[{id:'c-A',owner_id:owner,provider:'Claude'}],
 auditEvents:[{id:'a-A',owner_id:owner,action:'created'}]
});
function harness(){
 let currentOwner=owner,epoch=1,page='account',passwordProvider=()=>Promise.resolve(null);
 const output={textContent:'',isConnected:true},byId=name=>name==='backup-preview'?output:null;
 const mutationSession=()=>{const initial=currentOwner,t=epoch;return {owner:initial,current:()=>currentOwner===initial&&epoch===t}};
 const api=new Function('crypto','TextEncoder','TextDecoder','atob','btoa','byId','mutationSession','askBackupPassword',
  'let page="account";\n'+cryptoFns+inspector+
  '\nreturn {validateCloudBackup,inspectCloudBackupPayload,inspectCloudBackupFile,encKey,encB64,setPage(x){page=x}};')(
 webcrypto,TextEncoder,TextDecoder,atob,btoa,byId,mutationSession,()=>passwordProvider());
 return {...api,output,
  setPasswordProvider:fn=>{passwordProvider=fn},
  switchToB(){currentOwner='account-verified-B';epoch++},
  file(data){const text=typeof data==='string'?data:JSON.stringify(data);return{size:Buffer.byteLength(text,'utf8'),text:async()=>text}}
 };
}
async function encrypted(h,data,password='a-safe-test-password'){
 const salt=webcrypto.getRandomValues(new Uint8Array(16)),iv=webcrypto.getRandomValues(new Uint8Array(12));
 const key=await h.encKey(password,salt);
 const bytes=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(data)));
 return {schema:'control-cloud-encrypted-v1',salt:h.encB64(salt),iv:h.encB64(iv),
  content:h.encB64(new Uint8Array(bytes)),kdf:'PBKDF2-SHA256-200000'};
}
test('valid plaintext backup gives only safe counts and timestamp',()=>{
 const h=harness(),summary=h.validateCloudBackup(blank(),owner);
 assert.deepEqual(summary.counts,{projects:1,items:1,connections:1,auditEvents:1});
 assert.equal(summary.exportedAt,'2026-10-21T17:00:00.000Z');
 assert.equal(JSON.stringify(summary).includes('Private'),false);
});
test('wrong-account backup is rejected rather than mixed into currently signed-in Cloud',()=>{
 const h=harness(),data=blank();data.accountId='someone-else';
 assert.throws(()=>h.validateCloudBackup(data,owner),/n’appartient pas/);
});
test('foreign owner on any collection is rejected',()=>{
 for(const name of ['projects','items','connections','auditEvents']){
  const h=harness(),data=blank();data[name][0].owner_id='B';
  assert.throws(()=>h.validateCloudBackup(data,owner),/Propriétaire ou identifiant/,name);
 }
});
test('foreign profile and preferences are never previewed',()=>{
 for(const name of ['profile','preferences']){
  const h=harness(),data=blank();data[name][name==='profile'?'user_id':'owner_id']='B';
  assert.throws(()=>h.validateCloudBackup(data,owner),/non attribu/,name);
 }
});
test('duplicate record IDs and orphan project references are refused',()=>{
 const h=harness(),dup=blank();dup.items.push({...dup.items[0]});
 assert.throws(()=>h.validateCloudBackup(dup,owner),/identifiant incohérent/);
 const orphan=blank();orphan.items[0].project_id='absent';
 assert.throws(()=>h.validateCloudBackup(orphan,owner),/projet absent/);
});
test('missing schema, array collection, and invalid dates are refused',()=>{
 const h=harness(),data=blank();delete data.auditEvents;
 assert.throws(()=>h.validateCloudBackup(data,owner),/Collection CONTROL invalide/);
 const invalid=blank();invalid.exportedAt='not a date';
 assert.throws(()=>h.validateCloudBackup(invalid,owner),/Date de sauvegarde/);
 assert.throws(()=>h.validateCloudBackup({schema:'strange'},owner),/Format de sauvegarde/);
});
test('encrypted CONTROL AES-GCM backup can be verified with the correct password',async()=>{
 const h=harness(),password='an-even-longer-password',wrapper=await encrypted(h,blank(),password);
 const result=await h.inspectCloudBackupPayload(wrapper,owner,async()=>password);
 assert.equal(result.counts.projects,1);
 assert.equal(result.counts.auditEvents,1);
});
test('wrong password and tampered AES-GCM ciphertext are rejected',async()=>{
 const h=harness(),wrapper=await encrypted(h,blank(),'the-correct-password');
 await assert.rejects(()=>h.inspectCloudBackupPayload(wrapper,owner,async()=>'wrong-password-123'),/Déchiffrement impossible/);
 wrapper.content=wrapper.content.slice(0,-5)+'AAAAA';
 await assert.rejects(()=>h.inspectCloudBackupPayload(wrapper,owner,async()=>'the-correct-password'),/Déchiffrement impossible|En-tête/);
});
test('encrypted envelope rejects wrong KDF, salt, IV, and invalid encoding',async()=>{
 const h=harness(),wrapper=await encrypted(h,blank());
 for(const [key,value] of [['kdf','PBKDF2-SHA1'],['salt','AA=='],['iv','AAAA'],['content','AAA!!!']]){
  const tampered={...wrapper,[key]:value};
  await assert.rejects(()=>h.inspectCloudBackupPayload(tampered,owner,async()=>'a-safe-test-password'));
 }
});
test('cancelled decryption produces no summary',async()=>{
 const h=harness(),wrapper=await encrypted(h,blank());
 assert.equal(await h.inspectCloudBackupPayload(wrapper,owner,async()=>null),null);
});
test('choosing a backup file checks it locally and never writes to a backend',async()=>{
 const h=harness();const success=await h.inspectCloudBackupFile(h.file(blank()));
 assert.equal(success,true);
 assert.match(h.output.textContent,/Sauvegarde vérifiée/);
 assert.match(h.output.textContent,/Aucune donnée importée/);
 assert.doesNotMatch(h.output.textContent,/Private/);
});
test('file over 50 MiB refuses without reading its content',async()=>{
 const h=harness();let reads=0;
 const ok=await h.inspectCloudBackupFile({size:51*1024*1024,text:async()=>{reads++;return '{}'}});
 assert.equal(ok,false);assert.equal(reads,0);
 assert.match(h.output.textContent,/50 Mo/);
});
test('invalid JSON file never modifies account and reports a controlled error',async()=>{
 const h=harness();assert.equal(await h.inspectCloudBackupFile(h.file('{bad json')),false);
 assert.match(h.output.textContent,/JSON valide/);
});
test('account change during pending local inspection cannot show A information to B',async()=>{
 const h=harness();let resolve;
 const file={size:200,text:()=>new Promise(r=>{resolve=r})};
 const pending=h.inspectCloudBackupFile(file);
 h.switchToB();resolve(JSON.stringify(blank()));
 assert.equal(await pending,false);
 assert.doesNotMatch(h.output.textContent,/Sauvegarde vérifiée/);
});
test('two parallel file inspections in the same tab cannot collide',async()=>{
 const h=harness();let resolve;
 const pending=h.inspectCloudBackupFile({size:200,text:()=>new Promise(r=>{resolve=r})});
 await assert.rejects(()=>h.inspectCloudBackupFile(h.file(blank())),/déjà en cours/);
 resolve(JSON.stringify(blank()));
 assert.equal(await pending,true);
 assert.equal(h.inspectCloudBackupFile.inFlight,false);
});
