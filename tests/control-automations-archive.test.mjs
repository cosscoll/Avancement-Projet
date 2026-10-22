import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const script=readFileSync(new URL('../assets/automations-hub.js',import.meta.url),'utf8');
const archived=JSON.parse(readFileSync(new URL('../data/automations.json',import.meta.url),'utf8'));

test('dated automation snapshots are archives, never claims of live active jobs',async()=>{
 const main={innerHTML:''},noOpElement={};
 const window={};
 const document={querySelector(selector){return selector==='#main'?main:selector==='#auto-message'?null:noOpElement}};
 const location={hash:'#/automations'};
 let networkReads=0,storageWrites=0;
 const fetch=async url=>{
  assert.equal(url,'./data/automations.json');
  networkReads++;
  return {ok:true,json:async()=>archived};
 };
 const localStorage={getItem(){return null},setItem(){storageWrites++}};
 runInNewContext(script,{window,document,location,localStorage,fetch,URL,
  alert(){throw Error('No alerts expected during read-only browsing')},navigator:{}});
 const ctx={projects:[],state:{}};
 await window.CONTROL_AUTOMATIONS.render(ctx);
 assert.match(main.innerHTML,/archives datées/i);
 assert.match(main.innerHTML,/jamais un état en temps réel/i);
 location.hash='#/automations/ChatGPT';
 await window.CONTROL_AUTOMATIONS.render(ctx);
 assert.match(main.innerHTML,/Archive · statut actuel inconnu/);
 assert.doesNotMatch(main.innerHTML,/Active au dernier relevé/);
 assert.equal((main.innerHTML.match(/class="auto-task"/g)||[]).length,
  archived.tasks.filter(t=>t.active_at_last_check===true).length);
 assert.equal(networkReads,1,'Archive must not repeatedly fetch or poll any provider');
 assert.equal(storageWrites,0,'Viewing an archive must not write to local state or activate jobs');
});

test('Cloud and third-party automation status cannot be inferred from a GitHub snapshot',()=>{
 assert.ok(archived.verified_at,'Historical snapshot needs an explicit verification date');
 assert.match(script,/snapshotStatus:'unknown'/);
 assert.doesNotMatch(script,/snapshotStatus:'active'/);
 assert.match(script,/Les informations ci-dessous sont des archives/);
});
