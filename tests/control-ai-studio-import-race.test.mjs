import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Execute Studio IA's real two asynchronous file handlers against a controllable DOM.
const ui=readFileSync(new URL('../assets/control-ai-studio.js',import.meta.url),'utf8');
const start=ui.indexOf("  const importForm=$('#as-import-form');");
const end=ui.indexOf("  const search=$('#as-search');",start);
assert.ok(start>0&&end>start,'expected the real archive and restore handlers');
const handlers=ui.slice(start,end);

function deferred(){
 let resolve,reject;
 const promise=new Promise((a,b)=>{resolve=a;reject=b});
 return {promise,resolve,reject};
}
function harness(){
 const nodes=new Map(),notices=[],parsed=[];
 let refreshCount=0;
 const $=selector=>{
  if(!nodes.has(selector)){
   const n={id:selector,disabled:false,files:[],value:'chatgpt',listeners:{}};
   n.addEventListener=(event,listener)=>{n.listeners[event]=listener};
   nodes.set(selector,n);
  }
  return nodes.get(selector);
 };
 const core={
  KEY:'control-ai-studio-v1',
  parse(provider,text,fileName){const row={id:JSON.parse(text).id,provider,fileName};parsed.push(row);return [row]},
  parseBackup(text){return {id:JSON.parse(text).id,version:1,imports:[],memories:[],agents:[]}},
  backupComparison(before,after){return {before:{},after:{id:after.id}}}
 };
 const storage={getItem:()=>'{"original":true}'};
 const f=new Function('$','core','notify','refresh','storage','db',
  'let preview=null,restoreDraft=null,importGeneration=0,studioRestoreGeneration=0,disposed=false;\n'+
  handlers+'\nreturn {getPreview:()=>preview,getRestore:()=>restoreDraft,setDisposed:()=>{disposed=true}};');
 const state=f($,core,(m,error=false)=>notices.push({m,error}),()=>{refreshCount++},storage,{});
 const submit=(selector)=>$(selector).onsubmit({preventDefault(){}});
 const change=(selector,id)=>$(selector).listeners.change({target:{id}});
 const upload=(selector,file)=>{$(selector).files=[file]};
 const mockFile=(id,gate)=>({name:'export.json',size:100,text:()=>gate.promise,id});
 return {state,submit,change,upload,mockFile,notices,parsed,refreshCount:()=>refreshCount,$};
}

test('changing account or archive selection discards unfinished conversation import',async()=>{
 const h=harness(),read=deferred();
 h.upload('#as-file',h.mockFile('old',read));
 const pending=h.submit('#as-import-form');
 h.change('#as-import-form','as-provider');
 assert.equal(h.$('[data-as-action="confirm-import"]').disabled,true);
 read.resolve(JSON.stringify({id:'old'}));
 await pending;
 assert.equal(h.state.getPreview(),null);
 assert.equal(h.parsed.length,0);
 assert.equal(h.refreshCount(),0,'stale response must not rerender the Studio');
});
test('current ChatGPT archive can still be inspected normally after a cancelled one',async()=>{
 const h=harness(),oldRead=deferred(),newRead=deferred();
 h.upload('#as-file',h.mockFile('old',oldRead));
 const old=h.submit('#as-import-form');
 h.change('#as-import-form','as-file');
 h.upload('#as-file',h.mockFile('current',newRead));
 const latest=h.submit('#as-import-form');
 oldRead.resolve(JSON.stringify({id:'old'}));await old;
 newRead.resolve(JSON.stringify({id:'current'}));await latest;
 assert.equal(h.state.getPreview()?.rows[0].id,'current');
 assert.equal(h.parsed.length,1);
 assert.equal(h.refreshCount(),1);
});
test('changing the Studio restore file prevents an obsolete preview',async()=>{
 const h=harness(),read=deferred();
 h.upload('#as-restore-file',h.mockFile('old',read));
 const pending=h.submit('#as-restore-form');
 h.change('#as-restore-form','as-restore-file');
 assert.equal(h.$('[data-as-action="confirm-studio-restore"]').disabled,true);
 read.resolve(JSON.stringify({id:'old'}));
 await pending;
 assert.equal(h.state.getRestore(),null);
 assert.equal(h.refreshCount(),0);
});
test('current Studio restore file still previews, while unmounted Studio ignores late file reads',async()=>{
 const h=harness(),good=deferred(),late=deferred();
 h.upload('#as-restore-file',h.mockFile('current',good));
 const first=h.submit('#as-restore-form');
 good.resolve(JSON.stringify({id:'current'}));await first;
 assert.equal(h.state.getRestore()?.state.id,'current');
 h.upload('#as-restore-file',h.mockFile('late',late));
 const second=h.submit('#as-restore-form');
 h.state.setDisposed();
 late.resolve(JSON.stringify({id:'late'}));await second;
 assert.equal(h.state.getRestore(),null);
 assert.equal(h.refreshCount(),1);
});
