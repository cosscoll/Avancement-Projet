import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
const lines=inline.split('\n');
const fn=(start)=>lines.find(line=>line.startsWith(start));
const entries=[
 fn('let hubCorrupt=false;const load='),fn('const persist='),fn('const object='),
 fn('function restoreHub('),fn('function commitHub('),fn('const hubWarning=')
];
assert.ok(entries.every(Boolean),'CONTROL project storage recovery helpers must be present');
function mount(initial,writeFailure=false){
 let raw=initial,writes=0;
 const notices=[],store={
  getItem:()=>raw,
  setItem:(key,value)=>{writes++;if(writeFailure)throw Error('QuotaExceededError');raw=value}
 };
 const module=new Function('localStorage','notify',
  'const base="control-hub-v2";let hubLoadedRaw=null;'+entries[0]+'\nlet state=load();'+entries.slice(1).join('\n')+
  '\nreturn {state:()=>state,hubCorrupt:()=>hubCorrupt,load,persist,commitHub,hubWarning};'
 )(store,msg=>notices.push(msg));
 return {...module,getRaw:()=>raw,writes:()=>writes,notices};
}
test('invalid JSON cannot be overwritten by creating a project',()=>{
 for(const raw of ['{broken','[]','null','42','"hello"']){
  const h=mount(raw);
  assert.equal(h.hubCorrupt(),true,raw);
  assert.equal(h.commitHub(()=>h.state().custom=[{id:'new'}]),false,raw);
  assert.equal(h.persist(),false,raw);
  assert.equal(h.getRaw(),raw,raw);
  assert.equal(h.writes(),0,raw);
  assert.match(h.hubWarning(),/Récupérer une copie brute/);
 }
});
test('read-only rendering cannot turn corruption into successful local writes',()=>{
 const h=mount('{"ucp":{"links":[{"label":"existing"}]}}');
 assert.equal(h.hubCorrupt(),false);
 assert.deepEqual(h.state().ucp.links,[{label:'existing'}]);
 assert.equal(h.commitHub(()=>h.state().ucp.links.push({label:'new'})),true);
 assert.equal(h.writes(),1);
 assert.deepEqual(JSON.parse(h.getRaw()).ucp.links,[{label:'existing'},{label:'new'}]);
});
test('denied write rolls back nested mutations without invalidating project references',()=>{
 const h=mount('{"ucp":{"links":[{"id":"original"}],"memo":"before"},"uxRecent":["ucp"]}',true);
 const project=h.state().ucp,links=project.links;
 assert.equal(h.commitHub(()=>{project.links.push({id:'unsaved'});project.memo='after';h.state().uxRecent=['other']}),false);
 assert.equal(project,h.state().ucp,'preserve project object used by active screen');
 assert.equal(project.links,links,'preserve nested array used by active screen');
 assert.deepEqual(links,[{id:'original'}]);
 assert.equal(project.memo,'before');
 assert.deepEqual(h.state().uxRecent,['ucp']);
 assert.equal(h.getRaw(),'{"ucp":{"links":[{"id":"original"}],"memo":"before"},"uxRecent":["ucp"]}');
 assert.ok(h.notices.some(x=>x.includes('Stockage local indisponible')));
});
test('mutation exceptions also roll back and do not call persistent storage',()=>{
 const h=mount('{"ucp":{"links":[]}}');
 assert.equal(h.commitHub(()=>{h.state().ucp.links.push({id:'half'});throw Error('invalid edit')}),false);
 assert.deepEqual(h.state().ucp.links,[]);
 assert.equal(h.writes(),0);
});
test('corrupted project hub is visible and write handlers require committed storage',()=>{
 assert.match(inline,/\$\('#main'\)\.innerHTML=hubWarning\(\)/);
 assert.match(inline,/if\(hubCorrupt\)return persist\(\)/);
 for(const label of ['#chat-form','[data-remove-chat]','#provider-form','#space-form','#report-form','#link-form','[data-del]','#pilot-clear','#save-memo']){
  const handlers=lines.filter(x=>x.includes(label)&&(x.includes('onclick=')||x.includes('onsubmit=')));
  assert.ok(handlers.some(line=>line.includes('commitHub(')),label+' must not visually confirm failed writes');
 }
 assert.match(inline,/if\(!persist\(\)\)\{state=old;return\}/);
 assert.equal(JSON.parse(readFileSync(new URL('../config/cloud.json',import.meta.url),'utf8')).enabled,false);
});
