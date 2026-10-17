import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = name => readFileSync(new URL('../'+name, import.meta.url), 'utf8');

function fakeDOM() {
  const nodes = new Map();
  function get(selector) {
    if (!nodes.has(selector)) {
      nodes.set(selector, {
        innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,dataset:{},
        events:{},addEventListener(type,fn){this.events[type]=fn},
        setAttribute(k,v){this[k]=v},replaceChildren(){},scrollIntoView(){},
      });
    }
    return nodes.get(selector);
  }
  const root = {
    isConnected:true,innerHTML:'',events:{},
    querySelector:get,querySelectorAll(){return[]},
    addEventListener(event,callback){this.events[event]=callback}
  };
  return {root,get};
}

class FormMap {
  constructor(form) { this.data=form.formData||{}; }
  get(key) { return this.data[key]??''; }
}

test('Two model instructions produce two separately tracked outcomes on the correct project', async () => {
  const window={};
  const clipboard={last:'',async writeText(s){this.last=s}};
  new Function('window','navigator','FormData',read('assets/multi-ai-command.js'))(window,{clipboard},FormMap);
  const rows=[], {root,get}=fakeDOM();
  const projects=[{id:'ucp',name:'Un Coup de Pouce'},{id:'iagile',name:'IAgile'}];
  const created=[];
  window.CONTROL_MULTI_AI.mount(root,{
    projects,projectId:'ucp',
    listMissions:projectId=>rows.filter(row=>row.projectId===projectId),
    createMission:async input=>{const row={...input,id:'mission-'+(rows.length+1),status:'todo',updatedAt:new Date().toISOString(),result:''}; rows.push(row); created.push(input);return true},
    updateMission:async (original,values)=>{const row=rows.find(m=>m.id===original.id);Object.assign(row,values)}
  });
  get('#cmd-task').value='Comparer deux stratégies de mise en ligne pour le projet';
  await get('#cmd-prepare').events.click();
  assert.equal(rows.length,2);
  assert.deepEqual(rows.map(m=>m.provider),['Claude','Gemini']);
  assert.ok(rows.every(m=>m.projectId==='ucp'));
  assert.ok(rows.every(m=>m.prompt.includes('Ne prétends jamais')));
  assert.match(get('#cmd-results').innerHTML,/Claude/);
  assert.match(get('#cmd-results').innerHTML,/Gemini/);

  await root.events.click({target:{closest(selector){return selector==='[data-copy]'?{dataset:{copy:'mission-1'}}:null}}});
  assert.match(clipboard.last,/Claude/);
  const form={dataset:{result:'mission-1'},formData:{status:'review',result:'Livrable Claude à relire',proof:'https://example.org/rapport'}};
  await root.events.submit({preventDefault(){},target:{closest(selector){return selector==='[data-result]'?form:null}}});
  assert.equal(rows[0].result,'Livrable Claude à relire');
  assert.equal(rows[0].resultOrigin,'manual');
  assert.equal(rows[1].result,'');
  assert.match(get('#cmd-results').innerHTML,/Livrable Claude à relire/);
  get('#cmd-project').events.change({target:{value:'iagile'}});
  assert.doesNotMatch(get('#cmd-results').innerHTML,/Livrable Claude à relire/);
  assert.match(get('#cmd-results').innerHTML,/Aucune mission pour ce projet/);
});

test('A meeting can be prepared, displayed and kept out of another project', async () => {
  const window={};
  const document={};
  new Function('window','document','navigator','FormData',read('assets/visio-center.js'))(
    window,document,{clipboard:{writeText:async()=>{}}},FormMap
  );
  const {root,get}=fakeDOM(),rows=[];
  const form=get('#vs-form');
  form.elements={
    provider:{value:'Google Meet',addEventListener(){}},
    url:{value:'',disabled:false},
    type:{value:'team',addEventListener(){}},
    starts:{value:''}
  };
  const future=new Date(Date.now()+86400000);
  const local= [future.getFullYear(),String(future.getMonth()+1).padStart(2,'0'),String(future.getDate()).padStart(2,'0')].join('-')+
    'T'+String(future.getHours()).padStart(2,'0')+':'+String(future.getMinutes()).padStart(2,'0');
  form.formData={title:'Point équipe du projet',type:'team',provider:'Google Meet',projectId:'ucp',
    starts:local,minutes:'30',url:'https://meet.google.com/abc-defg-hij'};
  form.reset=()=>{};
  form.querySelector=sel=>get('form '+sel);
  get('#vs-create').open=true;
  window.CONTROL_VISIOS.mount(root,{
    projects:[{id:'ucp',name:'UCP'},{id:'iagile',name:'IAgile'}],projectId:'ucp',
    allowInlineVideo:false,list:()=>rows,create:async m=>{rows.push(m)}
  });
  // A module must not invoke camera, share or third-party conferencing by itself.
  assert.match(get('#vs-upcoming').innerHTML,/Aucun rendez-vous/);
  await form.events.submit({preventDefault(){}});
  assert.equal(rows.length,1);
  assert.equal(rows[0].projectId,'ucp');
  assert.match(get('#vs-upcoming').innerHTML,/Point équipe du projet/);
  assert.match(get('#vs-upcoming').innerHTML,/https:\/\/meet.google.com\/abc-defg-hij/);
  assert.ok(!root.innerHTML.includes('data-embed="'));
  assert.equal(rows[0].notes,'');
});
