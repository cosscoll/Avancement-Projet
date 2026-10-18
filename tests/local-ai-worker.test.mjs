import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../assets/local-ai-worker.js',import.meta.url),'utf8');
function workerWithStub(pipeline){
 const output=[];
 const self={postMessage:m=>output.push(m),__fakeImport:async()=>({env:{allowLocalModels:true,useBrowserCache:false},pipeline})};
 // Substitute only the import with a test stub: production retains real CDN dynamic import.
 const transformed=src.replace('const lib=await import(LIB);','const lib=await self.__fakeImport();');
 assert.notEqual(transformed,src);
 new Function('self',transformed)(self);
 return {self,output};
}
test('Local generative worker invokes a real text-generation pipeline contract after opt-in',async()=>{
 let loadConfig,seenMessages,seenParams,requests=0;
 const factory=async(task,model,settings)=>{
  requests++;
  loadConfig={task,model,settings};
  settings.progress_callback({status:'progress',progress:37,file:'onnx/model_q4.onnx'});
  const run=async(msgs,options)=>{
   seenMessages=msgs;seenParams=options;
   return[{generated_text:[...msgs,{role:'assistant',content:'Plan local en trois étapes.'}]}];
  };
  return run;
 };
 const {self,output}=workerWithStub(factory);
 await self.onmessage({data:{action:'generate',requestId:1,question:'Bonjour'}});
 assert.ok(output.some(x=>x.type==='error'&&/Charge le modèle/.test(x.message)));
 assert.equal(requests,0,'No downloading a model before consent');
 await self.onmessage({data:{action:'load'}});
 assert.equal(requests,1);
 assert.equal(loadConfig.task,'text-generation');
 assert.match(loadConfig.model,/SmolLM2-135M-Instruct-ONNX-MHA/);
 assert.equal(loadConfig.settings.device,'wasm');
 assert.equal(loadConfig.settings.dtype,'q4');
 assert.ok(output.some(x=>x.type==='progress'&&x.progress===37));
 assert.ok(output.some(x=>x.type==='ready'));
 await self.onmessage({data:{action:'generate',requestId:2,question:'Aide UCP',context:'Projet UCP',history:[{role:'user',content:'Salut'}]}});
 assert.deepEqual(seenMessages.map(x=>x.role),['system','user','user']);
 assert.doesNotMatch(seenMessages[0].content,/Projet UCP/,'Untrusted project context must not become a system instruction');
 assert.match(seenMessages.at(-1).content,/Aide UCP/);
 assert.match(seenMessages.at(-1).content,/Projet UCP/,'Project data belongs in the user context');
 assert.equal(seenParams.max_new_tokens,180);
 assert.ok(output.some(x=>x.type==='answer'&&x.requestId===2&&x.text==='Plan local en trois étapes.'));
 assert.ok(!output.some(x=>x.type==='answer'&&x.requestId===1));
});
test('Generation errors are explicitly reported and never replaced with fabricated canned answers',async()=>{
 const {self,output}=workerWithStub(async()=>async()=>{throw Error('RAM insufficient')});
 await self.onmessage({data:{action:'load'}});
 await self.onmessage({data:{action:'generate',requestId:4,question:'Planifier'}});
 assert.ok(output.some(x=>x.type==='error'&&x.requestId===4&&x.message.includes('RAM insufficient')));
 assert.equal(output.filter(x=>x.type==='answer').length,0);
});
