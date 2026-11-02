import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const box={window:{},structuredClone};
vm.runInNewContext(fs.readFileSync(new URL('../assets/control-ai-studio-core.js',import.meta.url),'utf8'),box);
const x=box.window.CONTROL_AI_STUDIO_CORE;
const fresh=()=>x.empty();
const storage=()=>{const kv=new Map();return {getItem:key=>kv.get(key)??null,setItem:(key,v)=>kv.set(key,v),removeItem:key=>kv.delete(key)}};
const sample={id:'c1',title:'Plan du site',current_node:'a2',mapping:{a1:{parent:null,message:{author:{role:'user'},content:{parts:['Je veux un site responsive']},create_time:1}},a2:{parent:'a1',message:{author:{role:'assistant'},content:{parts:['Voici le plan']},create_time:2}}}};
test('ChatGPT main conversation branch is imported in order without private API calls',()=>{
 const rows=x.parse('chatgpt',JSON.stringify([sample]),'conversations.json');
 assert.equal(rows.length,1);assert.equal(rows[0].title,'Plan du site');assert.equal(rows[0].messages.length,2);
 assert.equal(rows[0].messages[0].role,'user');assert.equal(rows[0].messages[1].role,'assistant');
 const result=x.importRows(fresh(),rows);assert.equal(result.added,1);
 assert.equal(x.importRows(result.state,rows).duplicates,1);
});
test('Claude export supports human/assistant messages and rejects unsupported formats',()=>{
 const rows=x.parse('claude',JSON.stringify([{uuid:'cl1',name:'UCP',chat_messages:[{sender:'human',text:'Bonjour'},{sender:'assistant',text:'Salut'}]}]),'conversations.json');
 assert.deepEqual(Array.from(rows[0].messages,m=>m.role),['user','assistant']);
 assert.throws(()=>x.parse('claude','{"arbitrary":"wrong"}','data.json'),/Aucune discussion/);
 assert.throws(()=>x.parse('chatgpt','<script>bad()</script>','conversations.json'),/JSON invalide/);
});
test('Gemini activity never invents assistant answers',()=>{
 const rows=x.parse('gemini',JSON.stringify([{title:'Recherche Gemini',header:'Gemini Apps',time:'2026-10-01'}]),'MyActivity.json');
 assert.equal(rows[0].messages.length,1);assert.equal(rows[0].messages[0].role,'user');
});
test('Local storage fails closed on corruption and cross-tab stale writes',()=>{
 const store=storage();let snap=x.read(store);assert.equal(snap.error,null);
 const value=x.write(store,fresh(),snap.raw);assert.equal(typeof value,'string');
 assert.throws(()=>x.write(store,fresh(),null),/autre onglet/);
 store.setItem(x.KEY,'{"invalid"');snap=x.read(store);assert.equal(snap.state,null);assert.ok(snap.error);
});
test('Memory approval, project scoping and agent context are explicit',()=>{
 const s=fresh();s.imports=x.importRows(s,x.parse('chatgpt',JSON.stringify([sample]),'conversations.json')).state.imports;
 const m=x.memory(s,{title:'Décision',content:'La version mobile est prioritaire.',conversationId:s.imports[0].id,projectId:'ucp'});
 s.memories.push(m);
 const ag=x.agent(s,{name:'Assistant UCP',instructions:'Aide à organiser le projet.',projectId:'ucp',conversationIds:[s.imports[0].id],memoryIds:[m.id]});
 assert.ok(x.context(s,ag).includes('La version mobile est prioritaire'));
 const restricted=x.agent(s,{name:'Autre projet',instructions:'Support test.',projectId:'iagile',memoryIds:[m.id]});
 assert.equal(restricted.memoryIds.length,0);
 assert.ok(!x.context(s,restricted).includes('La version mobile'));
});
test('No provider credential prompts, remote uploads, or fabricated AI replies',()=>{
 const core=fs.readFileSync(new URL('../assets/control-ai-studio-core.js',import.meta.url),'utf8');
 const ui=fs.readFileSync(new URL('../assets/control-ai-studio.js',import.meta.url),'utf8');
 assert.doesNotMatch(core,/\bfetch\s*\(|XMLHttpRequest|localStorage\.clear/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|api\.openai\.com|api\.anthropic\.com/);
 assert.match(ui,/worker\.postMessage\(\{action:'generate'/);
 assert.match(ui,/data-as-action="confirm-import"/);
 assert.match(ui,/data-as-action="load-model"/);
 assert.match(ui,/Révoquer et supprimer/);
 assert.match(ui,/Aucune synchronisation/);
 new Function('window','localStorage','document',ui);
});