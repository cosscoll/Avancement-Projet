import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const source=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
const start=source.indexOf('const toB64='),end=source.indexOf('function validateBackupData(data){',start);
assert.ok(start>0&&end>start,'Use the actual browser encryption/decryption functions');
const factory=new Function('crypto','TextEncoder','TextDecoder','globalThis','btoa','atob',
 source.slice(start,end)+'\nreturn {pack,unpack};');
const b64=s=>Buffer.from(s,'binary').toString('base64');
const unb64=s=>Buffer.from(s,'base64').toString('binary');
const {pack,unpack}=factory(webcrypto,TextEncoder,TextDecoder,{crypto:webcrypto},b64,unb64);
const sample=()=>({command:{actions:[{id:'A',title:'Action'}],missions:[]},hub:{projects:{}},
 automations:{drafts:[]},studio:{version:1,imports:[],memories:[{id:'mem1',title:'Choix',content:'Informations personnelles'}],agents:[{id:'agt1',name:'Agent',threads:[{id:'thread1',messages:[{role:'user',content:'Conversation privée'}]}]}]}});
test('actual V2 AES-GCM securely roundtrips all four local CONTROL stores',async()=>{
 const plain=sample(),pw='a secure testing phrase for CONTROL 2026';
 const encrypted=await pack(plain,pw);
 assert.equal(encrypted.format,'control-v2-aes-gcm');
 assert.equal(encrypted.iterations,180000);
 assert.equal(JSON.stringify(encrypted).includes('Conversation privée'),false);
 assert.equal(JSON.stringify(encrypted).includes('Informations personnelles'),false);
 assert.deepEqual(await unpack(encrypted,pw),plain);
});
test('actual encryption rejects wrong password, altered ciphertext and metadata before restore',async()=>{
 const envelope=await pack(sample(),'une phrase de sauvegarde suffisamment longue');
 await assert.rejects(()=>unpack(envelope,'incorrect long password'),/Mot de passe incorrect|altérée/);
 const cipher=Buffer.from(envelope.content,'base64');cipher[0]^=1;
 await assert.rejects(()=>unpack({...envelope,content:cipher.toString('base64')},'une phrase de sauvegarde suffisamment longue'),/altérée/);
 await assert.rejects(()=>unpack({...envelope,iterations:1},'une phrase de sauvegarde suffisamment longue'),/Métadonnées/);
 await assert.rejects(()=>unpack({...envelope,iv:'YQ=='},'une phrase de sauvegarde suffisamment longue'),/Métadonnées/);
 await assert.rejects(()=>unpack({...envelope,salt:7},'une phrase de sauvegarde suffisamment longue'),/Métadonnées/);
 await assert.rejects(()=>unpack(envelope,''),/Mot de passe manquant/);
});
test('plain legacy V2 export still reads without a password or Studio field',async()=>{
 const legacy=sample();delete legacy.studio;
 const packed=await pack(legacy,'');
 assert.equal(packed.format,'control-v2-plain');
 assert.deepEqual(await unpack(packed,''),legacy);
 await assert.rejects(()=>unpack({format:'malicious'},''),/inconnu/);
});
