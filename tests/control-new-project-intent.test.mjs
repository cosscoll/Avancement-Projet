import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const navigation=readFileSync(new URL('../assets/navigation-hub.js',import.meta.url),'utf8');
const script=source.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
const homeSource=script.slice(script.indexOf('function home(){'),script.indexOf('function workspace(p,t){'));

function journey(hash){
 const elements=new Map();
 const simple=()=>({value:'',hidden:false,innerHTML:'',textContent:'',setAttribute(){},focus(){}});
 const query=selector=>{
  if(!elements.has(selector))elements.set(selector,simple());
  return elements.get(selector);
 };
 let focused=false,scrolls=0,mutations=0;
 const form=query('#add-box');
 const flags=new Set(['hidden']);
 form.classList={contains:key=>flags.has(key),toggle:(key,force)=>{if(force===undefined?flags.has(key):!force)flags.delete(key);else flags.add(key)}};
 form.scrollIntoView=()=>{scrolls++};
 form.querySelector=()=>({focus(){focused=true}});
 const add=query('#add-project');add.click=()=>add.onclick();
 const location={hash};
 const projects=[{id:'existing',name:'Existing project',symbol:'EX'}];
 const state={uxRecent:[]};
 const context={
  $,location,projects,state,
  showAllProjects:false,
  window:{matchMedia:()=>({matches:true}),CONTROL_NAVIGATION:{open(){}}},
  hubWarning:()=>'',nameOf:p=>p.name,esc:v=>String(v),
  hubCorrupt:false,persist(){mutations++;return true},
  scoped(){mutations++;return{}},
  chatHost:()=>true,notify(){},go(){mutations++},
  globalThis:{crypto:{randomUUID:()=> 'uuid'}},
  FormData:class{}
 };
 function $(selector){return query(selector)}
 runInNewContext(homeSource+'home();',context);
 return {form,add,cancel:query('#cancel-add-project'),location,projects,
  focused:()=>focused,scrolls:()=>scrolls,mutations:()=>mutations};
}

test('intent to create a project resolves to a real personal route, never unsupported Cloud',()=>{
 const window={};
 runInNewContext(navigation,{window,document:{addEventListener(){}},
  location:{hash:'#/'},sessionStorage:{setItem(){}}});
 const finder=window.CONTROL_NAVIGATION;
 assert.equal(finder.find('créer un nouveau projet')[0]?.target,'#/new-project');
 finder.setAdapter({mode:'cloud',isAvailable:()=>true});
 assert.equal(finder.getItems().some(item=>item.id==='new-project'),false);
});

test('new-project route displays the creation form and puts focus in its name field',()=>{
 const flow=journey('#/new-project');
 assert.equal(flow.form.classList.contains('hidden'),false);
 assert.equal(flow.add.getAttribute?.('aria-expanded'),undefined);
 assert.equal(flow.focused(),true);
 assert.equal(flow.scrolls(),1);
 assert.equal(flow.mutations(),0);
 assert.equal(flow.projects.length,1);
});

test('canceling an unsubmitted project returns to home without saving anything',()=>{
 const flow=journey('#/new-project');
 flow.cancel.onclick();
 assert.equal(flow.form.classList.contains('hidden'),true);
 assert.equal(flow.location.hash,'#/');
 assert.equal(flow.mutations(),0);
 assert.equal(flow.projects.length,1);
});

test('regular home does not automatically reveal the creation form',()=>{
 const flow=journey('#/');
 assert.equal(flow.form.classList.contains('hidden'),true);
 assert.equal(flow.focused(),false);
 assert.equal(flow.scrolls(),0);
});
