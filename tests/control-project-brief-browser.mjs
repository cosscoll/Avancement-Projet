/* CONTROL 24: isolated public browser acceptance; synthetic data only. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
async function wait(fn,limit=18000){
 const end=Date.now()+limit;let last;
 while(Date.now()<end){try{const result=await fn();if(result)return result}catch(e){last=e}await delay(150)}
 throw Error('Browser acceptance timed out'+(last?': '+last.message:''));
}
async function freePort(){
 const server=createServer();await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const port=server.address().port;await new Promise(ok=>server.close(ok));return port;
}
async function socketConnect(url){
 const ws=new WebSocket(url);
 await new Promise((ok,no)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',no,{once:true})});
 let id=0;const pending=new Map();
 ws.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(!msg.id||!pending.has(msg.id))return;
  const {ok,no}=pending.get(msg.id);pending.delete(msg.id);
  if(msg.error)no(Error(msg.error.message));else ok(msg.result);
 });
 return {ws,send(method,params={}){
  return new Promise((ok,no)=>{const n=++id;pending.set(n,{ok,no});ws.send(JSON.stringify({id:n,method,params}))});
 }};
}
const port=await freePort(),profile=mkdtempSync(join(tmpdir(),'control-project-24-'));
const bin=process.env.CHROME_BIN||'google-chrome';
const chrome=spawn(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-allow-origins=*','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let browser,page;
try{
 const version=await wait(async()=>{const response=await fetch('http://127.0.0.1:'+port+'/json/version');return response.ok?response.json():null});
 browser=await socketConnect(version.webSocketDebuggerUrl);
 const {targetId}=await browser.send('Target.createTarget',{url:'about:blank'});
 const tab=await wait(async()=>{
  const list=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
  return list.find(x=>x.id===targetId&&x.webSocketDebuggerUrl);
 });
 page=await socketConnect(tab.webSocketDebuggerUrl);
 await page.send('Page.enable');
 await page.send('Runtime.enable');
 const run=async code=>{
  const output=await page.send('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true,userGesture:true});
  if(output.exceptionDetails)throw Error(output.exceptionDetails.exception?.description||output.exceptionDetails.text||'JavaScript failure');
  return output.result?.value;
 };
 const go=async hash=>{
  await run('location.hash='+JSON.stringify(hash));
  await wait(()=>run("location.hash==="+JSON.stringify(hash)+"&&document.querySelector('#control-project-brief')?.dataset.projectBrief==="+JSON.stringify(decodeURIComponent(hash.split("/")[2]))));
 };
 await page.send('Page.navigate',{url:'https://cosscoll.github.io/Avancement-Projet/#/'});
 await wait(()=>run("!!document.querySelector('.control-home-v6')"));
 const origin=await run("location.origin");
 assert.equal(origin,'https://cosscoll.github.io');
 const data={actions:[
  {id:'a-late',title:'A only overdue',project:'ifsi',status:'todo',due:'2026-11-01'},
  {id:'a-today',title:'A only today',project:'ifsi',status:'doing',due:'2026-11-06'},
  {id:'b-secret',title:'B secret task',project:'ucp',status:'todo',due:'2026-11-01'}
 ],clients:[],missions:[]};
 const hub={ifsi:{memo:'A only decision',links:[{label:'A Drive',url:'https://example.org/a'}]},
  ucp:{memo:'B confidential decision',links:[{label:'B Drive',url:'https://example.org/b'}]}};
 await run("(()=>{localStorage.setItem('control-command-v1',"+JSON.stringify(JSON.stringify(data))+");localStorage.setItem('control-hub-v2',"+JSON.stringify(JSON.stringify(hub))+")})()");
 await page.send('Page.reload',{ignoreCache:true});
 await wait(()=>run("!!document.querySelector('.control-home-v6')"));
 await go('#/project/ifsi/ai');
 const a=await run("({text:document.querySelector('#control-project-brief').textContent,links:[...document.querySelectorAll('#control-project-brief a')].map(x=>x.getAttribute('href')),grid:getComputedStyle(document.querySelector('.control-project-brief-grid')).gridTemplateColumns})");
 assert.match(a.text,/A only overdue/);assert.match(a.text,/A only decision/);assert.match(a.text,/A Drive/);
 assert.doesNotMatch(a.text,/B secret|B confidential|B Drive/);
 assert.ok(a.links.some(x=>x.includes('inbox/new?project=ifsi')));
 assert.ok(a.links.includes('https://example.org/a'));

 const taskLink=a.links.find(x=>x.includes('inbox?project=ifsi&task=a-late'));
 assert.ok(taskLink,'A project's task must lead to its scoped inbox with task ID');
 await run('location.hash='+JSON.stringify('#/control/inbox?project=ifsi'));
 await wait(()=>run("!!document.querySelector('.control-task-scope')"));
 const scoped=await run("({banner:document.querySelector('.control-task-scope')?.textContent,rows:[...document.querySelectorAll('.control-task-row')].map(row=>row.dataset.taskId),count:document.querySelector('#control-task-visible')?.textContent})");
 assert.deepEqual(scoped.rows.sort(),['a-late','a-today']);
 assert.match(scoped.banner,/Projet affiché/);
 assert.doesNotMatch(scoped.banner,/B secret/);
 assert.match(scoped.count,/2 résultat/);
 await run("document.querySelector('.control-task-scope a').click()");
 await wait(()=>run("location.hash==='#/control/inbox'&&document.querySelectorAll('.control-task-row').length===3"));
 await go('#/project/ifsi/ai');

 await go('#/project/ucp/ai');
 const b=await run("document.querySelector('#control-project-brief').textContent");
 assert.match(b,/B secret task/);assert.match(b,/B confidential decision/);
 assert.doesNotMatch(b,/A only|A Drive/);
 await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 const mobile=await run("({screen:innerWidth,body:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.control-project-brief-grid')).gridTemplateColumns})");
 assert.ok(mobile.body<=mobile.screen+2,'Mobile project brief must not overflow horizontally');
 assert.equal(mobile.columns.trim().split(/\s+/).length,1,'Mobile summary must be a single column');
 console.log('CONTROL 24 PASS: independent project data, safe linked resources and responsive 390px view on published site');
}finally{
 try{page?.ws.close()}catch{}
 try{browser?.ws.close()}catch{}
 chrome.kill('SIGKILL');
 rmSync(profile,{recursive:true,force:true});
}
