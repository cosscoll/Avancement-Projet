import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {setImmediate as tick} from 'node:timers/promises';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

class FakeRoot extends EventTarget {
  constructor(){super();this.nodes=new Map();this.isConnected=true;this.innerHTML='';this.clickTarget=null;}
  querySelector(selector){
    if(!this.nodes.has(selector))this.nodes.set(selector,{
      innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,open:false,dataset:{},
      addEventListener(){},setAttribute(){},replaceChildren(){},scrollIntoView(){},
    });
    return this.nodes.get(selector);
  }
  querySelectorAll(){return []}
  closest(selector){return this.clickTarget?.[selector]??null}
}
class FakeFormData{constructor(form){this.object=form.data||{}}get(key){return this.object[key]||''}}

test('Changing screens aborts old Claude/Gemini delegated listeners',async()=>{
 const ui={};
 const navigator={clipboard:{count:0,async writeText(){this.count++}}};
 new Function('window','navigator',read('assets/multi-ai-command.js'))(ui,navigator);
 const root=new FakeRoot(),rows=[{id:'one',projectId:'p',provider:'Claude',title:'Résumé',prompt:'Mission originale',status:'todo',updatedAt:new Date().toISOString()}];
 const adapter={projects:[{id:'p',name:'Projet'}],listMissions:()=>rows};
 root.clickTarget={'[data-copy]':{dataset:{copy:'one'}}};
 ui.CONTROL_MULTI_AI.mount(root,adapter);
 root.dispatchEvent(new Event('click'));await tick();
 assert.equal(navigator.clipboard.count,1);
 ui.CONTROL_MULTI_AI.mount(root,adapter);
 root.dispatchEvent(new Event('click'));await tick();
 assert.equal(navigator.clipboard.count,2,'Remount should not duplicate copy');
 ui.CONTROL_MULTI_AI.unmount(root);
 root.dispatchEvent(new Event('click'));await tick();
 assert.equal(navigator.clipboard.count,2,'Unmount must remove the last listener');
});

test('Navigating away from Visios releases invitation listeners and can stop conference streams',async()=>{
 const ui={},navigator={clipboard:{count:0,async writeText(){this.count++}}};
 new Function('window','navigator','FormData',read('assets/visio-center.js'))(ui,navigator,FakeFormData);
 const root=new FakeRoot(),f=root.querySelector('#vs-form');
 f.elements={
  provider:{value:'Google Meet',addEventListener(){}},type:{value:'team',addEventListener(){}},
  url:{value:'',disabled:false},starts:{value:''}
 };
 f.querySelector=()=>({disabled:false});
 const meeting={id:'meeting-1',projectId:'p',provider:'Google Meet',title:'Point équipe',type:'team',startsAt:new Date(Date.now()+3600000).toISOString(),minutes:30,url:'https://meet.google.com/abc-defg-hij',notes:''};
 root.clickTarget={
  '[data-invite],[data-calendar],[data-ics],[data-embed],[data-remove]':{dataset:{invite:meeting.id}},
 };
 const adapter={projects:[{id:'p',name:'Projet'}],projectId:'p',allowInlineVideo:false,list:()=>[meeting]};
 ui.CONTROL_VISIOS.mount(root,adapter);
 root.dispatchEvent(new Event('click'));await tick();
 assert.equal(navigator.clipboard.count,1);
 ui.CONTROL_VISIOS.mount(root,adapter);
 root.dispatchEvent(new Event('click'));await tick();
 assert.equal(navigator.clipboard.count,2);
 ui.CONTROL_VISIOS.unmount(root);
 root.dispatchEvent(new Event('click'));await tick();
 assert.equal(navigator.clipboard.count,2);
 assert.match(read('index.html'),/CONTROL_VISIOS\?\.unmount\?\.\(workspaceRoot\)/);
 assert.match(read('assets/visio-center.js'),/!panel\.isConnected/);
 assert.match(read('assets/visio-center.js'),/!root\.contains\(panel\)/);
});
