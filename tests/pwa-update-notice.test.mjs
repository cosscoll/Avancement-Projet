import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const pwa=readFileSync(new URL('../assets/pwa.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function create(){
 const events=new Map(),swEvents={},registrationEvents={},stateEvents={};
 const banner={hidden:true},actions={},nodes={
  'control-pwa-update':banner,
  'control-pwa-update-now':{addEventListener:(type,fn)=>actions.now=fn},
  'control-pwa-update-later':{addEventListener:(type,fn)=>actions.later=fn}
 };
 const registration={
  waiting:null,
  installing:{state:'installing',addEventListener:(type,fn)=>stateEvents[type]=fn},
  addEventListener:(type,fn)=>registrationEvents[type]=fn,
  update:async()=>{}
 };
 let reloads=0,permits=true,controllers=1,registers=0;
 const serviceWorker={
  get controller(){return controllers?{}:null},
  addEventListener:(type,fn)=>swEvents[type]=fn,
  register:async()=>{registers++;return registration}
 };
 const navigator={serviceWorker,onLine:true,userAgent:'',platform:'',maxTouchPoints:0};
 const window={
  matchMedia:()=>({matches:false}),addEventListener:(type,fn)=>events.set(type,fn)
 };
 const location={protocol:'https:',reload:()=>{reloads++}};
 const document={getElementById:id=>nodes[id]||null};
 const sessionStorage={getItem:()=>null};
 new Function('window','document','navigator','location','sessionStorage','confirm',pwa)(
  window,document,navigator,location,sessionStorage,()=>permits);
 return {events,swEvents,registration,registrationEvents,stateEvents,banner,actions,
  setAllowed:v=>permits=v,get reloads(){return reloads},get registers(){return registers},setController:v=>controllers=v};
}
test('a worker upgrade is announced without automatically reloading or discarding drafts',async()=>{
 const x=create();
 await x.events.get('load')();
 await Promise.resolve();await Promise.resolve();
 assert.equal(x.registers,1);
 x.swEvents.controllerchange();
 assert.equal(x.banner.hidden,false);
 assert.equal(x.reloads,0);
 x.setAllowed(false);x.actions.now();
 assert.equal(x.reloads,0,'canceling update must keep unsaved edits intact');
 x.setAllowed(true);x.actions.now();
 assert.equal(x.reloads,1,'reloading requires an explicit click and confirmation');
});
test('first-ever PWA installation does not display a false update warning',async()=>{
 const x=create();x.setController(0);
 await x.events.get('load')();
 await Promise.resolve();await Promise.resolve();
 x.swEvents.controllerchange();
 assert.equal(x.banner.hidden,true);
 x.actions.later();assert.equal(x.reloads,0);
});
test('installed replacement worker informs the user and can be postponed',async()=>{
 const x=create();await x.events.get('load')();
 await Promise.resolve();await Promise.resolve();
 x.registrationEvents.updatefound();
 x.registration.installing.state='installed';
 x.stateEvents.statechange();
 assert.equal(x.banner.hidden,false);
 x.actions.later();assert.equal(x.banner.hidden,true);
 assert.equal(x.reloads,0);
});
test('update prompt is present and readable on narrow mobile screens',()=>{
 assert.match(html,/id="control-pwa-update" hidden role="status"/);
 assert.match(html,/id="control-pwa-update-now"/);
 assert.match(html,/id="control-pwa-update-later"/);
 assert.match(html,/@media\(max-width:390px\)/);
 assert.match(pwa,/updateViaCache:'none'/);
 assert.doesNotMatch(pwa,/controllerchange[^]*?location\.reload\(\)/);
});
