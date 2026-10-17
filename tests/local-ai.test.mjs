import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
class FakeDOM{
 constructor(){this.nodes=new Map();this.innerHTML='';this.__controlLocalStop=null}
 querySelector(selector){
  if(!this.nodes.has(selector))this.nodes.set(selector,{
    value:'',disabled:false,hidden:false,checked:false,innerHTML:'',textContent:'',dataset:{},scrollHeight:0,handlers:{},
    addEventListener(name,fn){this.handlers[name]=fn},scrollTo(){},
  });
  return this.nodes.get(selector);
 }
}
class FakeWorker{
 static all=[];
 constructor(url,options){this.url=String(url);this.options=options;this.messages=[];this.terminated=false;FakeWorker.all.push(this)}
 postMessage(message){this.messages.push(message)}
 terminate(){this.terminated=true}
 emit(data){this.onmessage?.({data})}
}

function setup(storage){
 const window={},root=new FakeDOM(),location={hash:'#/control/localai'};
 const document={baseURI:'https://cosscoll.github.io/Avancement-Projet/'};
 const api=new Function('window','localStorage','Worker','location','document','confirm',read('assets/local-ai.js'));
 api(window,storage,FakeWorker,location,document,()=>true);
 const adapter={projects:[{id:'ucp',name:'UCP'},{id:'iagile',name:'IAgile'}],getContext:id=>'Projet '+id+' : trois tâches'};
 window.CONTROL_LOCAL_AI.mount(root,adapter);
 return {window,root,location,document};
}
test('Genuine model downloads only after explicit user click; worker uses a real text-generation pipeline',()=>{
 FakeWorker.all=[];
 const db={getItem(){return null},setItem(){}};
 const {root,window}=setup(db);
 assert.equal(FakeWorker.all.length,0);
 assert.match(root.innerHTML,/Charger le modèle/);
 assert.ok(root.querySelector('#loc-question').disabled);
 root.querySelector('#loc-load').handlers.click();
 assert.equal(FakeWorker.all.length,1);
 const worker=FakeWorker.all[0];
 assert.match(worker.url,/local-ai-worker\.js/);
 assert.equal(worker.options.type,'module');
 assert.equal(worker.messages[0].action,'load');
 const code=read('assets/local-ai-worker.js');
 assert.match(code,/import\(LIB\)/);
 assert.match(code,/pipeline\('text-generation',MODEL/);
 assert.match(code,/onnx-community\/SmolLM2-135M-Instruct-ONNX-MHA/);
 assert.match(code,/device:'wasm',dtype:'q4'/);
 window.CONTROL_LOCAL_AI.unmount(root);
 assert.ok(worker.terminated);
});
test('Real local model results, private histories, per-project context and clean cancellation',()=>{
 FakeWorker.all=[];
 const recorded=new Map();
 const storage={getItem:key=>recorded.get(key)||null,setItem:(key,value)=>recorded.set(key,value)};
 const {root,window}=setup(storage);
 root.querySelector('#loc-load').handlers.click();
 const worker=FakeWorker.all.at(-1);
 worker.emit({type:'ready'});
 assert.equal(root.querySelector('#loc-send').disabled,false);
 root.querySelector('#loc-question').value='Prépare mes prochaines étapes';
 root.querySelector('#loc-context').handlers.change({target:{checked:true}});
 const form=root.querySelector('#loc-form');
 form.handlers.submit({preventDefault(){}});
 const call=worker.messages.at(-1);
 assert.equal(call.action,'generate');
 assert.equal(call.question,'Prépare mes prochaines étapes');
 // Project general has no contextual data even when user toggles it.
 assert.match(call.context,/Aucun contexte/);
 worker.emit({type:'answer',requestId:call.requestId,text:'Voici trois pistes pour ton projet.'});
 assert.match(root.querySelector('#loc-stream').innerHTML,/Voici trois pistes/);
 const store=JSON.parse(recorded.get('control-local-ai-v1'));
 assert.equal(store.general.length,2);
 assert.equal(store.general[1].role,'assistant');
 root.querySelector('#loc-project').handlers.change({target:{value:'ucp'}});
 assert.match(root.querySelector('#loc-stream').innerHTML,/Aucun message/);
 root.querySelector('#loc-context').handlers.change({target:{checked:true}});
 root.querySelector('#loc-question').value='Que faire pour UCP ?';
 form.handlers.submit({preventDefault(){}});
 const second=worker.messages.at(-1);
 assert.match(second.context,/Projet ucp/);
 assert.doesNotMatch(second.context,/IAgile/);
 assert.equal(second.history.length,0);
 window.CONTROL_LOCAL_AI.unmount(root);
 assert.equal(worker.terminated,true);
});
test('Corrupt local chat data falls back safely; no external API endpoint or fake replies',()=>{
 const ctx={};
 new Function('window',read('assets/local-ai.js'))(ctx);
 const storage={getItem:()=>'{ bad json'};
 assert.deepEqual(ctx.CONTROL_LOCAL_AI.loadHistory(storage),{});
 assert.deepEqual(ctx.CONTROL_LOCAL_AI.loadHistory({getItem:()=>JSON.stringify({general:[{role:'assistant',content:'Bonjour'}]})}),{general:[{role:'assistant',content:'Bonjour'}]});
 assert.doesNotMatch(read('assets/local-ai-worker.js'),/api\.anthropic\.com|generativelanguage\.googleapis\.com|api\.openai\.com/);
 assert.match(read('index.html'),/assets\/local-ai\.js/);
 assert.match(read('assets/command-center.js'),/function localai\(\)/);
 assert.equal(JSON.parse(read('config/cloud.json')).enabled,false);
});