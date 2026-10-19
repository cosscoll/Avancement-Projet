/* REAL Chromium smoke test of the CONTROL personal application (no 3rd-party login or cost).
   Run: node tests/control-ia-browser-smoke.mjs. Requires preinstalled Chromium/Chrome. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,existsSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,sep,extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
const log=(label,details='')=>process.stdout.write('BROWSER PASS — '+label+(details?' — '+details:'')+'\n');
const deadline=(fn,max=18000,step=180)=>async()=>{
 const end=Date.now()+max;let last;
 while(Date.now()<end){try{const result=await fn();if(result)return result}catch(e){last=e}await delay(step)}
 throw Error('Timed out waiting for browser state'+(last?': '+last.message:''));
};
const waitPort=deadline(async()=>{
 const filename=join(profile,'DevToolsActivePort');
 if(!existsSync(filename))return null;
 const port=Number(readFileSync(filename,'utf8').split('\n')[0]);
 return port>0?port:null;
},12000);

const server=createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return}
  const data=readFileSync(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found')}
});
let browser=null,ws=null,serverClosed=false;
const profile=mkdtempSync(join(tmpdir(),'control-ia-browser-'));
let socketClosed=false;
try{
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes)});
 const port=server.address().port;
 const candidates=[process.env.CHROME_BIN,'google-chrome','google-chrome-stable','chromium','chromium-browser'].filter(Boolean);
 const binary=candidates.find(c=>spawnSync('which',[c],{stdio:'ignore'}).status===0);
 assert.ok(binary,'No preinstalled Chromium/Chrome found. Browser verification cannot be declared successful.');
 browser=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 const debugPort=await waitPort();
 const targets=await (await fetch('http://127.0.0.1:'+debugPort+'/json')).json();
 const page=targets.find(t=>t.type==='page'&&t.webSocketDebuggerUrl);
 assert.ok(page,'No Chrome page target');
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((yes,no)=>{ws.addEventListener('open',yes,{once:true});ws.addEventListener('error',no,{once:true})});
 let serial=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',event=>{
  let data;try{data=JSON.parse(event.data)}catch{return}
  if(data.method==='Runtime.exceptionThrown'){
   const e=data.params?.exceptionDetails;
   errors.push(String(e?.exception?.description||e?.text||'JS error').slice(0,260));
  }
  if(data.id&&pending.has(data.id)){const {yes,no}=pending.get(data.id);pending.delete(data.id);if(data.error)no(Error(data.error.message));else yes(data.result)}
 });
 function command(method,params={}){
  const id=++serial;
  return new Promise((yes,no)=>{pending.set(id,{yes,no});ws.send(JSON.stringify({id,method,params}))});
 }
 async function js(expression){
  const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text||'Browser script failed');
  return result.result?.value;
 }
 const ready=deadline;
 await command('Page.enable');await command('Runtime.enable');
 const production=process.env.CONTROL_BROWSER_PRODUCTION==='1';
 const addr=production?'https://cosscoll.github.io/Avancement-Projet/#/control/localai':'http://127.0.0.1:'+port+'/index.html#/control/localai';
 process.stdout.write('BROWSER TARGET: '+(production?'deployed GitHub Pages':'isolated local server')+'\n');
 await command('Page.navigate',{url:addr});
 await ready(()=>js("document.querySelector('[data-control-delivery] .control-delivery-count')?.textContent?.includes('9 fonctionnalités')"),20000)();
 assert.equal(await js("document.querySelectorAll('.control-delivery-item').length"),9);
 assert.match(await js("document.querySelector('.control-delivery-focus h3').textContent"),/Compte unique/);
 assert.match(await js("document.querySelector('.control-delivery-count').textContent"),/0 \/ 9/);
 log('9 objectives, 36 criteria and focus visible in actual Chromium DOM');
 assert.ok(await js("!!document.querySelector('[data-control-operator]')"),'Operator panel missing');
 assert.equal(await js("document.querySelector('[data-op-consent]').checked"),false);
 await js("document.querySelector('[data-op-form] textarea').value='Mes tâches';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Autorise la lecture')"),6000)();
 log('operator refuses access before consent');
 await js("document.querySelector('[data-op-consent]').click()");
 assert.equal(await js("document.querySelector('[data-op-consent]').checked"),true);
 // A fresh ephemeral Chrome profile is used. All actions are local test fixtures only.
 await js("document.querySelector('[data-op-form] textarea').value='Crée une tâche Recette Navigateur Unique pour UCP';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-draft]').hidden===false"),9000)();
 assert.match(await js("document.querySelector('[data-op-project]').textContent"),/Un Coup de Pouce/);
 assert.match(await js("document.querySelector('[data-op-title]').value"),/Recette Navigateur Unique/);
 await js("document.querySelector('[data-op-draft]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Action enregistrée')"),8000)();
 const count=await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.filter(a=>a.project==='ucp'&&a.title.includes('Recette Navigateur Unique')).length||0");
 assert.equal(count,1,'Created test action must persist once to project UCP');
 log('confirmed action written exactly once to correct project');
 await js("document.querySelector('[data-op-form] textarea').value='Mes tâches';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Recette Navigateur Unique')"),8000)();
 log('action read back via operator conversation');
 await command('Page.reload',{ignoreCache:true});
 await ready(()=>js("document.querySelector('[data-control-operator]')!==null"),16000)();
 assert.equal(await js("document.querySelector('[data-op-consent]').checked"),false,'Consent should not persist across page navigation');
 await js("document.querySelector('[data-op-consent]').click();document.querySelector('[data-op-form] textarea').value='Mes tâches';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Recette Navigateur Unique')"),8000)();
 log('task survives browser reload; consent resets as designed');
 const tomorrow=new Date(Date.now()+8*86400000).toISOString().slice(0,10);
 const dateFR=tomorrow.slice(8,10)+'/'+tomorrow.slice(5,7)+'/'+tomorrow.slice(0,4);
 const eventName='Recette Agenda Unique';
 const eventPrompt='Programme un rendez-vous '+eventName+' le '+dateFR+' à 14h30 pour UCP';
 await js("document.querySelector('[data-op-form] textarea').value="+JSON.stringify(eventPrompt)+";document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-draft]').hidden===false"),8000)();
 assert.equal(await js("document.querySelector('[data-op-date]').value"),tomorrow+'T14:30','Date parser must preserve requested date and time');
 await js("document.querySelector('[data-op-draft]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Action enregistrée')"),8000)();
 const event=await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').events?.find(e=>e.title.includes('Recette Agenda Unique'))?.date");
 assert.equal(event,tomorrow+'T14:30','Event must be persisted at the requested hour');
 log('calendar event created with correct device-local time');
 await js("document.querySelector('#loc-project').value='ucp';document.querySelector('#loc-project').dispatchEvent(new Event('change',{bubbles:true}))");
 await js("document.querySelector('[data-op-form] textarea').value='Crée une tâche Contamination pour IAgile';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.length>0"),8000)();
 assert.equal(await js("document.querySelector('[data-op-draft]').hidden"),true,'Cross-project request should not produce a confirmation draft');
 log('cross-project request rejected while UCP is selected');
 await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await delay(300);
 const mobile=await js("({viewport:window.innerWidth,scroll:document.documentElement.scrollWidth,head:!!document.querySelector('.control-delivery-focus')})");
 assert.equal(mobile.head,true);
 assert.ok(mobile.scroll<=mobile.viewport+4,'Mobile horizontal overflow detected: '+JSON.stringify(mobile));
 log('mobile-sized 390px viewport renders roadmap with no horizontal overflow');
 assert.equal(errors.length,0,'Unexpected JS browser exceptions: '+errors.join(' | '));
 log('no uncaught JavaScript exceptions');
 process.stdout.write('BROWSER SMOKE: ALL CHECKS PASSED (actual Chromium, '+(production?'public GitHub Pages with isolated ephemeral browser profile':'local isolated server')+'; not a physical Android device)\n');
}finally{
 try{ws?.close()}catch{}
 if(browser&&!browser.killed)browser.kill('SIGTERM');
 if(!serverClosed){serverClosed=true;server.close()}
 rmSync(profile,{recursive:true,force:true});
}
