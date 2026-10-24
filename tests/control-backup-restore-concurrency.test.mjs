import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const command=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
const reviewCode=readFileSync(new URL('../assets/control-backup-review.js',import.meta.url),'utf8');
const w={};new Function('window',reviewCode)(w);
const review=w.CONTROL_BACKUP_REVIEW;
const start=command.indexOf("$('#import-apply').onclick=()=>{");
const end=command.indexOf("\n\n}\n// Search only live",start);
assert.ok(start>0&&end>start);
const handler=command.slice(start,end);
function setup({failKey='',externalMutation=false}={}){
 const keys=review.storeKeys;
 const original=keys.map((k,i)=>JSON.stringify({original:i}));
 const content=new Map(keys.map((k,i)=>[k,original[i]]));
 let saved=0,alerts=[],pending={data:{command:{actions:[],missions:[]},hub:{projects:{}},automations:{drafts:[]}},original:[...original]};
 const staged=JSON.parse(JSON.stringify(pending.data));
 const localStorage={
  getItem:k=>content.get(k)??null,
  setItem(k,v){
   if(k===failKey){
    if(externalMutation)content.set(keys[0],JSON.stringify({outside:true}));
    throw Error('QuotaExceededError');
   }
   content.set(k,v);saved++;
  },
  removeItem:k=>content.delete(k)
 };
 const message={textContent:''},preview={hidden:false};
 const node={'#import-apply':{},'#import-cancel':{},'#import-status':message};
 const events=[];
 const doc={querySelector:selector=>node[selector]||null};
 const code=handler+"\nreturn ()=>document.querySelector('#import-apply').onclick();";
 const trigger=new Function('document','$','pending','restore','localStorage','confirm','resetPreview','localStoreCorrupt','init','toast','KEY','HUB','AUTOS','message','window',code)(
  doc,selector=>node[selector],pending,review,localStorage,()=>true,
  ()=>{pending=null;preview.hidden=true},false,()=>events.push('init'),
  x=>alerts.push(x),...keys,message,{});
 return {trigger,content,keys,original,staged,message,events,alerts,saved:()=>saved};
}
test('successful restore replaces all three stores after confirmation',()=>{
 const x=setup();x.trigger();
 assert.deepEqual(x.keys.map(k=>JSON.parse(x.content.get(k))),Object.values(x.staged));
 assert.match(x.message.textContent,/Restauration confirmée/);
 assert.deepEqual(x.events,['init']);
});
test('failed third store rolls back only keys actually written by this transaction',()=>{
 const x=setup({failKey:review.storeKeys[2]});x.trigger();
 assert.deepEqual(x.keys.map(k=>x.content.get(k)),x.original);
 assert.match(x.message.textContent,/anciennes données ont été rétablies/);
 assert.deepEqual(x.events,[]);
});
test('failure with concurrent external changes never overwrites the other tab data',()=>{
 const x=setup({failKey:review.storeKeys[2],externalMutation:true});x.trigger();
 assert.equal(x.content.get(x.keys[0]),JSON.stringify({outside:true}));
 assert.equal(x.content.get(x.keys[1]),x.original[1]);
 assert.equal(x.content.get(x.keys[2]),x.original[2]);
 assert.match(x.message.textContent,/autre onglet/);
 assert.deepEqual(x.events,[]);
});
test('restore checks for conflicts and never silently claims an unverified success',()=>{
 assert.match(handler,/written=new Map\(\)/);
 assert.match(handler,/if\(!restore\.unchanged\(localStorage,staged\.original\.map/);
 assert.match(handler,/if\(localStorage\.getItem\(key\)!==written\.get\(key\)\)/);
 assert.doesNotMatch(handler,/for\(const \[key,raw\] of old\)\{try/);
});
