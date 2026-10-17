import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');

test('CONTROL IA correctly adds local calendar events and upcoming visios instead of concatenating them',()=>{
 const window={},elements=new Map();
 function get(selector){
   if(selector.includes('[data-act='))return null;
   if(!elements.has(selector))elements.set(selector,{innerHTML:'',value:'',classList:{add(){},remove(){}},addEventListener(){}});
   return elements.get(selector);
 }
 const future=new Date(Date.now()+86400000).toISOString();
 const db={
   actions:[],missions:[],events:[{id:'e1',title:'Réunion projet',project:'ucp',date:future}],
   meetings:[
     {id:'v1',title:'Visio Claude',provider:'Google Meet',projectId:'ucp',startsAt:future,minutes:30,url:'https://meet.google.com/abc-defg-hij'},
     {id:'v2',title:'Visio Gemini',provider:'Zoom',projectId:'ucp',startsAt:future,minutes:60,url:'https://zoom.us/j/12345678900'}
   ],
   expenses:[],income:[],decisions:[],messages:[],notifications:false
 };
 const storage={getItem(key){return key==='control-command-v1'?JSON.stringify(db):null},setItem(){}};
 const document={querySelector:get};
 const fetch=async()=>({ok:false,status:404});
 const location={hash:'#/control/manager'};
 new Function('window','document','localStorage','location','fetch','navigator',source)(
   window,document,storage,location,fetch,{clipboard:{writeText:async()=>{}}}
 );
 window.CONTROL_CENTER.render({projects:[],state:{}});
 const html=get('#main').innerHTML;
 const count=html.match(/href="#\/control\/calendar" class="stat"><strong>(\d+)<\/strong>/);
 assert.ok(count,'Dashboard must expose an upcoming calendar counter');
 assert.equal(Number(count[1]),3,'1 event + 2 meetings must equal 3, never the string "12"');
 assert.match(html,/Échéances enregistrées/);
});
