import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('testeurs.html'),script=read('assets/control-test-pilot.js'),css=read('assets/control-test-pilot.css'),home=read('index.html'),sw=read('service-worker.js');
test('A participant finds six real missions and a visible homepage entry without Cloud login',()=>{
 assert.match(home,/control-home-v6-pilot/);
 assert.match(home,/href="testeurs\.html"/);
 assert.equal((html.match(/class="pilot-task"/g)||[]).length,6);
 for(const path of ['index.html#/','index.html#/control/inbox/new','index.html#/control/clients','index.html#/control/search','index.html#/control/aistudio','index.html#/control/backup'])
  assert.ok(html.includes('href="'+path+'"'),'Missing real route: '+path);
 assert.doesNotMatch(html,/href="app\.html"/);
 assert.match(html,/fenêtre de navigation privée/);
 assert.match(html,/Ne saisissez aucun nom de client réel/);
 assert.match(html,/sans synchronisation Cloud/);
});
test('Pilot report has no remote transmission and its HTML uses strict static resource policy',()=>{
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/script-src 'self'/);
 assert.match(html,/referrer" content="no-referrer"/);
 assert.match(html,/id="pilot-download"/);
 assert.doesNotMatch(script,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
 assert.match(script,/URL\.createObjectURL/);
 assert.match(css,/@media\(max-width:700px\)/);
 new Function(script);
});
test('Synthetic ChatGPT fixture is parsed by the actual Studio core without personal data',()=>{
 const fixture=JSON.parse(read('data/control-pilot-chatgpt.json'));
 const box={window:{},structuredClone};
 vm.runInNewContext(read('assets/control-ai-studio-core.js'),box);
 const rows=box.window.CONTROL_AI_STUDIO_CORE.parse('chatgpt',JSON.stringify(fixture),'control-test-conversations.json');
 assert.equal(rows.length,1);
 assert.equal(rows[0].messages.length,2);
 assert.match(rows[0].messages[0].content,/fictif/i);
 assert.ok(!JSON.stringify(fixture).includes('openai_api_key'));
});
test('Participant guide and synthetic archive are precached with versioned PWA assets',()=>{
 for(const asset of ['testeurs.html','assets/control-test-pilot.css','assets/control-test-pilot.js','data/control-pilot-chatgpt.json'])assert.ok(sw.includes("'./"+asset+"'"),asset);
 assert.match(sw,/control-shell-v105/);
 assert.match(sw,/control-public-data-v105/);
 assert.match(sw,/endsWith\('\.json'\)/);
});
test('Report exports only the intentional feedback fields and progress is reactive',async()=>{
 const handlers=new Map();
 const checks=['create-project','create-task','client-followup','search-task','approve-memory','backup'].map(id=>({
  dataset:{pilotCheck:id},checked:id==='create-project',addEventListener:(event,fn)=>handlers.set(id+event,fn)
 }));
 const nodes={
  '#pilot-progress':{textContent:''},
  '#pilot-device':{value:'android'},
  '#pilot-confusing':{value:'Le menu de recherche'},
  '#pilot-bug':{value:'Aucun'},
  '#pilot-useful':{value:'Tâches'},
  '#pilot-download':{addEventListener:(event,fn)=>handlers.set('download',fn)},
  '#pilot-status':{textContent:''},
  'input[name="pilot-rating"]:checked':{value:'4'}
 };
 let linkClicks=0,downloads=0,output;
 const fakeLink={click:()=>{linkClicks++},remove:()=>{}};
 const root={querySelectorAll:()=>checks,querySelector:key=>nodes[key]||null};
 const document={querySelector:()=>root,body:{appendChild:()=>{}},createElement:()=>fakeLink};
 const URLMock={createObjectURL:blob=>{output=blob;downloads++;return'blob:pilot'},revokeObjectURL:()=>{}};
 const window={};
 vm.runInNewContext(script,{document,window,URL:URLMock,Blob,setTimeout:fn=>fn(),Date});
 assert.equal(nodes['#pilot-progress'].textContent,'1 / 6');
 const report=JSON.parse(JSON.stringify(window.CONTROL_PILOT_REPORT.collect()));
 assert.equal(report.steps.length,6);
 assert.equal(report.steps.filter(x=>x.terminee).length,1);
 assert.equal(report.ease,4);
 assert.equal(report.device,'android');
 assert.equal(report.answers.blocages,'Aucun');
 assert.ok(!JSON.stringify(report).includes('localStorage'));
 checks[1].checked=true;handlers.get('create-taskchange')();
 assert.equal(nodes['#pilot-progress'].textContent,'2 / 6');
 handlers.get('download')();
 assert.equal(linkClicks,1);assert.equal(downloads,1);
 assert.equal(JSON.parse(await output.text()).steps.filter(x=>x.terminee).length,2);
 assert.match(nodes['#pilot-status'].textContent,/Aucune donnée n’a été envoyée/);
});
