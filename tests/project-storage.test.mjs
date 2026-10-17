import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
let code=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(code);
const end="window.CONTROL_HELP?.setAdapter({";
const start=code.indexOf(end);
const initCall="});init();";
assert.ok(start>=0&&code.includes(initCall));
code=code.replace(initCall,"});window.__CONTROL_TEST__={home,persist,scoped,state:()=>state,projects:()=>projects};");

test('Failed local storage never creates a phantom user project',()=>{
 const nodes=new Map();
 function node(id){
  if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',hidden:false,
    classList:{add(){},remove(){},toggle(){}},focus(){},addEventListener(){},setAttribute(){},});
  return nodes.get(id);
 }
 const document={querySelector:node,querySelectorAll:()=>[]};
 const messages=[];
 const store={getItem:()=>null,setItem:()=>{throw new Error('QuotaExceededError')}};
 const win={addEventListener(){},setTimeout(){},clearTimeout(){},CONTROL_HELP:{setAdapter(){}}};
 const location={hash:'#/'};
 const fakeFormData=class {constructor(){ }get(key){return key==='name'?'Nouveau projet bloqué':''}};
 const wrapper=new Function('window','document','localStorage','location','FormData',code);
 wrapper(win,document,store,location,fakeFormData);
 const harness=win.__CONTROL_TEST__;
 assert.ok(harness);
 harness.home();
 assert.equal(harness.projects().length,0);
 node('#new-project').onsubmit({preventDefault(){},target:{}});
 assert.equal(harness.projects().length,0);
 assert.equal((harness.state().custom||[]).length,0);
 assert.equal(location.hash,'#/');
 assert.match(node('#toast').textContent,/Projet non créé/);
});

test('Personal persistent saves acknowledge success only after write',()=>{
 assert.match(code,/localStorage\.setItem\(base,JSON\.stringify\(state\)\);return true/);
 assert.match(code,/if\(!persist\(\)\)\{state\.custom=previous;delete state\[id\]/);
});

test('Invalid persisted JSON primitives do not crash CONTROL initialization',()=>{
 for(const raw of ['null','[]','42','"invalid"','not-json']){
  const node=()=>({classList:{add(){},remove(){}},textContent:'',addEventListener(){},setAttribute(){}});
  const win={addEventListener(){},CONTROL_HELP:{setAdapter(){}}},document={querySelector:node,querySelectorAll:()=>[]};
  const storage={getItem:()=>raw,setItem(){}};
  new Function('window','document','localStorage','location','FormData',code)(win,document,storage,{hash:'#/'},class{});
  const h=win.__CONTROL_TEST__;
  assert.ok(h.state()&&!Array.isArray(h.state())&&typeof h.state()==='object',raw);
  const d=h.scoped('ucp');assert.deepEqual(d.chats,[]);
 }
});
