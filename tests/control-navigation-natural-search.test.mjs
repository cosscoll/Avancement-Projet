import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../assets/navigation-hub.js',import.meta.url),'utf8');
const window={};
const document={addEventListener(){}};
runInNewContext(source,{window,document,location:{hash:'#/'},sessionStorage:{setItem(){}}});
const find=(query)=>Array.from(window.CONTROL_NAVIGATION.find(query,window.CONTROL_NAVIGATION.getItems()),x=>x.id);

test('finder handles accents, plurals and natural French requests',()=>{
 assert.ok(find('mes rendez-vous').includes('meetings'));
 assert.ok(find('réunions').includes('meetings'));
 assert.ok(find('rdv').includes('meetings'));
 assert.ok(find('sauvegarder mes données').includes('backup'));
 assert.ok(find('mes projets').includes('projects'));
 assert.ok(find('retrouver une décision').includes('decisions'));
 assert.ok(find('déployer un site').includes('deploy'));
 assert.ok(find('créer un nouveau projet').includes('projects'));
 assert.ok(find('je veux créer une tâche').includes('inbox'));
 assert.ok(find('je veux organiser une réunion').includes('meetings'));
 assert.ok(find('je cherche la sauvegarde').includes('backup'));
 assert.ok(find('modifier les paramètres').includes('settings'));
 assert.ok(find('réglages').includes('settings'));
 assert.ok(find('vérifier les résultats de mission').includes('missions'));
});
test('finder prioritizes exact feature title over description matches',()=>{
 assert.equal(find('calendrier')[0],'calendar');
 assert.equal(find('budget')[0],'budget');
});
test('finder does not silently match an unrelated term',()=>{
 assert.deepEqual(find('inexistantxyz'),[]);
 assert.deepEqual(find('je veux'),[],'Stop-word-only intent must not list every function');
 assert.ok(find('').length>0,'Empty finder still exposes browseable categories');
});

test('finder uses accessible native buttons and handles ArrowUp from search field',()=>{
 assert.match(source,/role="group" aria-label="Fonctions accessibles"/);
 assert.doesNotMatch(source,/role="listbox"|role="option"/);
 assert.ok(source.includes("buttons[i===-1?(e.key==='ArrowDown'?0:buttons.length-1)"));
});

test('finder discovers projects by name and routes to the matching personal project',()=>{
 const navigation=window.CONTROL_NAVIGATION;
 navigation.setAdapter({mode:'personal',getProjects:()=>[
  {id:'ucp-1',name:'Un Coup de Pouce',category:'Entreprise'},
  {id:'proj2',name:'Business Procédures',category:'Entreprise'}]});
 const result=Array.from(navigation.find('Coup de Pouce',navigation.getItems()));
 assert.equal(result[0]?.id,'open-project:ucp-1');
 assert.equal(result[0]?.target,'#/project/ucp-1/ai');
 assert.equal(navigation.getItems().filter(x=>x.category==='projects').length,2);
});
test('Cloud finder never reveals project names while unauthenticated',()=>{
 const navigation=window.CONTROL_NAVIGATION;
 navigation.setAdapter({mode:'cloud',isAvailable:()=>false,getProjects:()=>[{id:'secret1',name:'Private project'}]});
 assert.deepEqual(Array.from(navigation.getItems()),[]);
 navigation.setAdapter({isAvailable:()=>true});
 assert.equal(navigation.getItems().find(x=>x.id==='open-project:secret1')?.target,'project-open:secret1');
 navigation.setAdapter({mode:'personal',getProjects:()=>[]});
});

test('finder renders untrusted project names safely and provides correct keyboard movement',()=>{
 const listeners={};
 const elements=[{focus(){doc.activeElement=this}},{focus(){doc.activeElement=this}}];
 const input={value:'',focus(){doc.activeElement=this},select(){},addEventListener(){}};
 const results={innerHTML:'',querySelectorAll(){return elements}};
 const categories={innerHTML:''};
 const dialog={hidden:true,innerHTML:'',addEventListener(type,handler){listeners[type]=handler},
  querySelector(selector){return selector==='input[type="search"]'?input:selector==='.control-finder-results'?results:selector==='.control-finder-categories'?categories:null}};
 const doc={activeElement:{isConnected:true,focus(){}},createElement(){return dialog},
  body:{appendChild(){},classList:{add(){},remove(){}}},addEventListener(){}};
 const localWindow={};
 runInNewContext(source,{window:localWindow,document:doc,location:{hash:'#/'},sessionStorage:{setItem(){}}});
 const navigation=localWindow.CONTROL_NAVIGATION;
 navigation.setAdapter({mode:'personal',getProjects:()=>[{id:'unsafe',name:'<img src=x onerror=alert(1)>',category:'Test'}]});
 assert.equal(navigation.open({category:'projects'}),true);
 assert.ok(results.innerHTML.includes('&lt;img'));
 assert.ok(!results.innerHTML.includes('<img'));
 assert.ok(results.innerHTML.includes('role="status" aria-live="polite"'));
 let prevented=0;
 listeners.keydown({key:'ArrowUp',preventDefault(){prevented++}});
 assert.equal(doc.activeElement,elements[1],'ArrowUp from search should select last item');
 listeners.keydown({key:'ArrowDown',preventDefault(){prevented++}});
 assert.equal(doc.activeElement,elements[0],'ArrowDown from last should wrap to first');
 assert.equal(prevented,2);
});

test('Enter on a natural-language query opens the first matching project without a mouse',()=>{
 const listeners={};
 const input={value:'',focus(){},select(){},addEventListener(){}};
 const cats={innerHTML:''};
 const results={innerHTML:'',querySelector(selector){
  if(selector!=='[data-finder-id]')return null;
  const match=this.innerHTML.match(/data-finder-id="([^"]+)"/);
  return match?{dataset:{finderId:match[1]}}:null;
 }};
 const dialog={hidden:true,innerHTML:'',addEventListener(type,fn){listeners[type]=fn},
  querySelector(selector){return selector==='input[type="search"]'?input:selector==='.control-finder-results'?results:selector==='.control-finder-categories'?cats:null}};
 const location={hash:'#/'};
 const document={activeElement:{isConnected:true,focus(){}},createElement(){return dialog},
  body:{appendChild(){},classList:{add(){},remove(){}}},addEventListener(){}};
 const localWindow={};
 runInNewContext(source,{window:localWindow,document,location,sessionStorage:{setItem(){}}});
 localWindow.CONTROL_NAVIGATION.setAdapter({mode:'personal',getProjects:()=>[{id:'ucp-123',name:'Un Coup de Pouce'}]});
 assert.equal(localWindow.CONTROL_NAVIGATION.open({query:'Coup de Pouce'}),true);
 let prevented=0;
 listeners.keydown({key:'Enter',target:input,preventDefault(){prevented++}});
 assert.equal(prevented,1);
 assert.equal(location.hash,'#/project/ucp-123/ai');
 assert.equal(dialog.hidden,true);
 localWindow.CONTROL_NAVIGATION.open();
 listeners.keydown({key:'Enter',target:input,preventDefault(){prevented++}});
 assert.equal(prevented,1,'Blank search must not open a random feature');
 assert.equal(location.hash,'#/project/ucp-123/ai');
});

test('recent functions are one-click shortcuts on personal mode, without leaking to Cloud',()=>{
 const store=new Map(),handlers={};
 const sessionStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
 const input={value:'',focus(){},select(){},addEventListener(){}};
 const categories={innerHTML:''};
 const results={innerHTML:'',querySelector(selector){
  if(selector!=='[data-finder-id]')return null;
  const match=this.innerHTML.match(/data-finder-id="([^"]+)"/);
  return match?{dataset:{finderId:match[1]}}:null;
 }};
 const dialog={hidden:true,innerHTML:'',addEventListener(type,fn){handlers[type]=fn},
  querySelector(selector){return selector==='input[type="search"]'?input:selector==='.control-finder-results'?results:selector==='.control-finder-categories'?categories:null}};
 const location={hash:'#/'};
 const document={activeElement:{isConnected:true,focus(){}},createElement(){return dialog},
  body:{appendChild(){},classList:{add(){},remove(){}}},addEventListener(){}};
 const ownWindow={};
 runInNewContext(source,{window:ownWindow,document,location,sessionStorage});
 const navigation=ownWindow.CONTROL_NAVIGATION;
 navigation.setAdapter({mode:'personal',getProjects:()=>[]});
 navigation.open({query:'organiser une visio'});
 assert.match(results.innerHTML,/data-finder-id="meetings"/);
 handlers.keydown({key:'Enter',target:input,preventDefault(){}});
 assert.equal(location.hash,'#/control/meetings');
 assert.equal(store.get('control-finder-recent-personal'),'["meetings"]');
 navigation.open();
 assert.match(results.innerHTML,/control-finder-recents/);
 assert.match(results.innerHTML,/data-finder-id="meetings"/);
 navigation.setAdapter({mode:'cloud',isAvailable:()=>true});
 navigation.open();
 assert.doesNotMatch(results.innerHTML,/control-finder-recents/);
 assert.equal(store.has('control-finder-recent-cloud'),false);
});
