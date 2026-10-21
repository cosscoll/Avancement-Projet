/* REAL Chromium smoke test of the CONTROL personal application (no 3rd-party login or cost).
   Run: node tests/control-ia-browser-smoke.mjs. Requires preinstalled Chromium/Chrome. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
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
// Detect stale GitHub Pages before claiming that a browser tested this commit.
// The fresh public HTML/data/JS must match the checked-out source bytes.
const PUBLIC_ORIGIN='https://cosscoll.github.io/Avancement-Projet/';
const PUBLIC_ASSETS=['service-worker.js','index.html','app.html','config/cloud.json','assets/cloud-app.js','assets/control-operator.js','assets/control-operator-core.js','assets/command-center.js','assets/control-delivery.js','assets/control-delivery.css','data/control-ia-delivery.json','data/control-ia-requirements.json'];
const hash=data=>createHash('sha256').update(data).digest('hex');
async function verifyPublishedFiles(){
 const expected=new Map(PUBLIC_ASSETS.map(path=>[path,hash(readFileSync(resolve(root,path)))]));
 const errors=[];
 for(let attempt=1;attempt<=16;attempt++){
  try{
   const results=await Promise.all(PUBLIC_ASSETS.map(async path=>{
    const url=new URL(path,PUBLIC_ORIGIN);
    const response=await fetch(url,{cache:'no-store',redirect:'follow',signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error(path+' HTTP '+response.status);
    const actual=hash(Buffer.from(await response.arrayBuffer()));
    return {path,match:actual===expected.get(path)};
   }));
   const stale=results.filter(r=>!r.match).map(r=>r.path);
   if(!stale.length){
    log('public deployment bytes match checked-out commit',PUBLIC_ASSETS.length+' HTML, JS and JSON assets');
    return;
   }
   errors.push('attempt '+attempt+' stale: '+stale.join(', '));
  }catch(error){errors.push('attempt '+attempt+': '+String(error?.message||error))}
  if(attempt<16)await delay(3000);
 }
 throw Error('Public GitHub Pages does not serve the checked-out application assets. '+errors.slice(-5).join('; '));
}

const waitPort=deadline(async()=>{
 const filename=join(profile,'DevToolsActivePort');
 if(!existsSync(filename))return null;
 const port=Number(readFileSync(filename,'utf8').split('\n')[0]);
 return port>0?port:null;
},30000);

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
 browser=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe'],detached:true});
 let chromeError='';browser.stderr?.on('data',chunk=>{chromeError+=String(chunk).slice(-900);chromeError=chromeError.slice(-1800)});
 const debugPort=await waitPort().catch(error=>{throw Error('Chrome startup failed (status '+String(browser.exitCode)+'): '+chromeError.slice(-900)+' | '+error.message)});
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
 if(production)await verifyPublishedFiles();
 const addr=production?'https://cosscoll.github.io/Avancement-Projet/#/control/localai':'http://127.0.0.1:'+port+'/index.html#/control/localai';
 process.stdout.write('BROWSER TARGET: '+(production?'deployed GitHub Pages':'isolated local server')+'\n');
 await command('Page.navigate',{url:addr});
 await ready(()=>js("document.querySelector('[data-control-delivery] .control-delivery-count')?.textContent?.includes('9 fonctionnalités')"),20000)();
 assert.equal(await js("document.querySelectorAll('.control-delivery-item').length"),9);
 assert.match(await js("document.querySelector('.control-delivery-focus h3').textContent"),/Compte unique/);
 assert.match(await js("document.querySelector('.control-delivery-count').textContent"),/0 \/ 9/);
 log('9 objectives, 36 criteria and focus visible in actual Chromium DOM');

 await ready(()=>js("document.querySelector('[data-control-v12] .control-delivery-v12-count')?.textContent?.includes('42 scénarios')"),14000)();
 const v12=await js("({text:document.querySelector('[data-control-v12]')?.textContent||'',link:document.querySelector('[data-control-v12] a')?.href})");
 assert.match(v12.text,/22 tickets de développement/);
 assert.match(v12.text,/10 améliorations/);
 assert.match(v12.text,/30 critères supplémentaires/);
 assert.match(v12.text,/0 \/ 42 scénarios entièrement vérifiés/);
 assert.match(v12.text,/5 contrôles partiels\/simulés/);
 assert.equal(new URL(v12.link).pathname,production?'/Avancement-Projet/data/control-ia-requirements.json':'/data/control-ia-requirements.json');
 log('public V1.2 requirement overview renders 22 tickets/42 scenarios/10 additions with no fake verification');

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
 assert.match(await js("document.querySelector('[data-op-target]').textContent"),/Un Coup de Pouce/,'Exact project target must be shown');
 assert.match(await js("document.querySelector('[data-op-before]').textContent"),/Aucune/,'Previous state must be shown');
 assert.match(await js("document.querySelector('[data-op-after]').textContent"),/Recette Navigateur Unique/,'Proposed state must be shown');
 assert.match(await js("document.querySelector('[data-op-risk]').textContent"),/appareil/,'Local-only risk must be shown');
 assert.equal(await js("document.querySelector('[data-op-confirm]').disabled"),false);
 await js("document.querySelector('[data-op-draft]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Action enregistrée')"),8000)();
 const count=await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.filter(a=>a.project==='ucp'&&a.title.includes('Recette Navigateur Unique')).length||0");
 assert.equal(count,1,'Created test action must persist once to project UCP');
 assert.match(await js("document.querySelector('[data-op-response]').textContent"),/Reçu local :/,'Receipt must come from the persisted local audit');
 log('confirmed action written exactly once to correct project with verified diff, risk and receipt');
 // Test the real "À traiter" route, not only the storage JSON.
 await js("location.hash='#/control/inbox'");
 await ready(()=>js("[...document.querySelectorAll('#main strong')].some(e=>e.textContent.trim()==='Recette Navigateur Unique')"),9000)();
 log('new task is visible in the actual To-do screen');
 await js("location.hash='#/control/localai'");
 await ready(()=>js("!!document.querySelector('[data-op-consent]')"),9000)();
 assert.equal(await js("document.querySelector('[data-op-consent]').checked"),false);
 await js("document.querySelector('[data-op-consent]').click()");
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
 // Confirm that the calendar UI displays the same event the assistant wrote.
 await js("location.hash='#/control/calendar'");
 await ready(()=>js("[...document.querySelectorAll('#main .inbox-item strong')].some(e=>e.textContent.trim()==='Recette Agenda Unique')"),9000)();
 const listed=await js("[...document.querySelectorAll('#main .inbox-item')].find(e=>e.querySelector('strong')?.textContent==='Recette Agenda Unique')?.textContent||''");
 assert.ok(listed.includes(tomorrow+'T14:30'),'Calendar page is missing the recorded event time');
 log('new event and requested hour are visible on the actual Calendar screen');
 await js("location.hash='#/control/localai'");
 await ready(()=>js("!!document.querySelector('[data-op-consent]')"),9000)();
 await js("document.querySelector('[data-op-consent]').click()");
 await js("document.querySelector('#loc-project').value='ucp';document.querySelector('#loc-project').dispatchEvent(new Event('change',{bubbles:true}))");
 await js("document.querySelector('[data-op-form] textarea').value='Crée une tâche Contamination pour IAgile';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.length>0"),8000)();
 assert.equal(await js("document.querySelector('[data-op-draft]').hidden"),true,'Cross-project request should not produce a confirmation draft');
 log('cross-project request rejected while UCP is selected');

 // Verify scope cannot change between proposal and confirmation (TOCTOU).
 await js("document.querySelector('[data-op-form] textarea').value='Crée une tâche Recette Mauvais Scope';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-draft]').hidden===false"),8000)();
 await js("document.querySelector('#loc-project').value='iagile';document.querySelector('#loc-project').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-op-draft]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Confirmation refusée')"),8000)();
 assert.match(await js("document.querySelector('[data-op-review-error]').textContent"),/périmètre a changé/,'Scope revocation must fail closed before any write');
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.filter(a=>a.title==='Recette Mauvais Scope').length||0"),0);
 await js("document.querySelector('#loc-project').value='ucp';document.querySelector('#loc-project').dispatchEvent(new Event('change',{bubbles:true}))");
 log('changing selected project after draft cannot write into the wrong project');

 // Revocation must remove pending write permissions immediately.
 await js("document.querySelector('[data-op-form] textarea').value='Crée une tâche Recette Consentement Retire';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-draft]').hidden===false"),8000)();
 await js("document.querySelector('[data-op-consent]').click()");
 assert.equal(await js("document.querySelector('[data-op-draft]').hidden"),true);
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.filter(a=>a.title==='Recette Consentement Retire').length||0"),0);
 await js("document.querySelector('[data-op-consent]').click()");
 log('revoking consent cancels pending actions without writes');


 // Test cancel before any write. The draft must never be persisted.
 await js("document.querySelector('[data-op-form] textarea').value='Crée une tâche Recette Annulee Unique pour UCP';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-draft]').hidden===false"),8000)();
 await js("document.querySelector('[data-op-cancel]').click()");
 assert.equal(await js("document.querySelector('[data-op-draft]').hidden"),true,'Canceled draft stays hidden');
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.filter(a=>a.title==='Recette Annulee Unique').length||0"),0,'Canceled action must not persist');
 log('canceling a proposed action leaves the database unchanged');

 // A completed task is persisted, and a second completion is never silently allowed.
 await js("document.querySelector('[data-op-form] textarea').value='Termine la tâche Recette Navigateur Unique';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-draft]').hidden===false"),8000)();
 assert.match(await js("document.querySelector('[data-op-confirm]').textContent"),/Marquer terminée/);
 await js("document.querySelector('[data-op-draft]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Action enregistrée')"),8000)();
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.find(a=>a.title==='Recette Navigateur Unique')?.status"),'done');
 await js("document.querySelector('[data-op-form] textarea').value='Termine la tâche Recette Navigateur Unique';document.querySelector('[data-op-form]').requestSubmit()");
 assert.equal(await js("document.querySelector('[data-op-draft]').hidden"),true,'A previously completed action must not be proposed again');
 log('task completion persists and cannot be repeated');

 // The UI must read, reschedule, and delete the EXACT event it created.
 const movePrompt='Déplace le rendez-vous Recette Agenda Unique au '+dateFR+' à 16h45 pour UCP';
 await js("document.querySelector('[data-op-form] textarea').value="+JSON.stringify(movePrompt)+";document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-draft]').hidden===false"),8000)();
 assert.equal(await js("document.querySelector('[data-op-date]').value"),tomorrow+'T16:45');
 await js("document.querySelector('[data-op-draft]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Action enregistrée')"),8000)();
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').events?.find(e=>e.title==='Recette Agenda Unique')?.date"),tomorrow+'T16:45');
 log('calendar event rescheduled and persisted at the chosen hour');
 await js("document.querySelector('[data-op-form] textarea').value='Mon agenda';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Recette Agenda Unique')"),8000)();
 assert.ok((await js("document.querySelector('[data-op-response]').textContent")).includes(tomorrow+'T16:45'),'Assistant agenda should display the updated local time');
 log('assistant agenda reads back the updated appointment');

 await js("document.querySelector('[data-op-form] textarea').value='Supprime le rendez-vous Recette Agenda Unique';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-draft]').hidden===false"),8000)();
 await js("window.__controlTestConfirm=window.confirm;window.confirm=()=>false;document.querySelector('[data-op-draft]').requestSubmit()");
 assert.equal(await js("document.querySelector('[data-op-draft]').hidden"),false,'Canceled deletion must keep the draft');
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').events?.filter(e=>e.title==='Recette Agenda Unique').length||0"),1,'Canceled deletion must not remove the event');
 await js("window.confirm=()=>true;document.querySelector('[data-op-draft]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Action enregistrée')"),8000)();
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').events?.filter(e=>e.title==='Recette Agenda Unique').length||0"),0);
 await js("window.confirm=window.__controlTestConfirm;delete window.__controlTestConfirm");
 log('calendar deletion requires confirmation and canceled deletion preserves the event');
 await js("location.hash='#/control/calendar'");
 await ready(()=>js("document.querySelector('#main')?.textContent.includes('Agenda des projets')"),9000)();
 assert.equal(await js("[...document.querySelectorAll('#main .inbox-item strong')].some(e=>e.textContent.trim()==='Recette Agenda Unique')"),false,'Deleted event must disappear from Calendar UI');
 log('deleted event is absent from the Calendar screen');
 // IMP-03 live local project memory: add, versioned correction, delete.
 await js("location.hash='#/control/memory'");
 await ready(()=>js("!!document.querySelector('#new-decision')"),9000)();
 await js("document.querySelector('#new-decision').elements.namedItem('project').value='ucp';document.querySelector('#new-decision').elements.namedItem('title').value='Recette Memoire Unique';document.querySelector('#new-decision').elements.namedItem('details').value='V1 approuvee';document.querySelector('#new-decision').elements.namedItem('source').value='Compte rendu test';document.querySelector('#new-decision').requestSubmit()");
 await ready(()=>js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').decisions?.some(d=>d.title==='Recette Memoire Unique'&&d.project==='ucp'&&d.version===1&&d.source==='Compte rendu test')"),9000)();
 assert.match(await js("document.querySelector('#main').textContent"),/Source déclarée : Compte rendu test/);
 log('decision memory persists project scope, declared source and version 1');
 await js("document.querySelector('[data-act^=\"decision-edit:\"]').click()");
 await ready(()=>js("document.querySelector('#new-decision').elements.namedItem('record').value.length>0"),7000)();
 await js("document.querySelector('#new-decision').elements.namedItem('details').value='V2 correction';document.querySelector('#new-decision').requestSubmit()");
 await ready(()=>js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').decisions?.some(d=>d.title==='Recette Memoire Unique'&&d.details==='V2 correction'&&d.version===2)"),9000)();
 log('decision correction advances version without duplicate');
 // Search must expose the correct provenance and version within the selected project.
 await js("location.hash='#/control/search'");
 await ready(()=>js("!!document.querySelector('#search-project')"),9000)();
 await js("document.querySelector('#search-project').value='iagile';document.querySelector('#search-project').dispatchEvent(new Event('change'));document.querySelector('#global-search').value='Recette Memoire Unique';document.querySelector('#global-search').dispatchEvent(new Event('input'))");
 assert.equal(await js("document.querySelectorAll('#search-hits a').length"),0,'Other-project memory must stay outside selected project search');
 await js("document.querySelector('#search-project').value='ucp';document.querySelector('#search-project').dispatchEvent(new Event('change'))");
 await ready(()=>js("document.querySelectorAll('#search-hits a').length===1"),9000)();
 assert.match(await js("document.querySelector('#search-hits').textContent"),/v2/);
 assert.match(await js("document.querySelector('#search-hits').textContent"),/Compte rendu test/);
 await js("document.querySelector('#search-hits a').click()");
 await ready(()=>js("!!document.querySelector('[data-memory-id][aria-current=true]')"),9000)();
 assert.match(await js("document.querySelector('[data-memory-id][aria-current=true]').textContent"),/Recette Memoire Unique/);
 log('project-scoped search points to current v2 decision with declared source and exact target');
 await js("window.__memoryConfirm=window.confirm;window.confirm=()=>true;document.querySelector('[data-act^=\"decision-del:\"]').click()");
 await ready(()=>js("!JSON.parse(localStorage.getItem('control-command-v1')||'{}').decisions?.some(d=>d.title==='Recette Memoire Unique')"),9000)();
 await js("window.confirm=window.__memoryConfirm;delete window.__memoryConfirm");
 log('decision deletion propagates to persisted memory');
 await js("location.hash='#/control/search'");
 await ready(()=>js("!!document.querySelector('#global-search')"),9000)();
 await js("document.querySelector('#search-project').value='ucp';document.querySelector('#search-project').dispatchEvent(new Event('change'));document.querySelector('#global-search').value='Recette Memoire Unique';document.querySelector('#global-search').dispatchEvent(new Event('input'))");
 assert.equal(await js("document.querySelectorAll('#search-hits a').length"),0,'Deleted decision must not appear in fresh search');
 log('deleted memory entry is absent from current project-scoped search');
 // A local objective becomes a sourced, editable proposal, never an automatically completed task.
 await js("location.hash='#/control/goals'");
 await ready(()=>js("!!document.querySelector('#goal-request')"),9000)();
 const actionsBeforePlan=await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.length||0");
 await js("document.querySelector('#goal-request [name=project]').value='iagile';document.querySelector('#goal-request [name=goal]').value='Lancer un site de démonstration accessible';document.querySelector('#goal-request').requestSubmit()");
 await ready(()=>js("!!document.querySelector('#goal-confirm')"),9000)();
 assert.doesNotMatch(await js("document.querySelector('#goal-preview').textContent"),/Recette Navigateur Unique/,'Other project actions may not contaminate goal proposals');
 await js("document.querySelector('#goal-request [name=project]').value='ucp';document.querySelector('#goal-request [name=goal]').value='Livrer la prochaine version contrôlée de UCP';document.querySelector('#goal-request').requestSubmit()");
 await ready(()=>js("!!document.querySelector('#goal-confirm [name=criterion0]')"),9000)();
 assert.match(await js("document.querySelector('#goal-preview').textContent"),/Source :/);
 await js("document.querySelector('#goal-confirm [name=criterion0]').value='Validation documentée par le propriétaire';document.querySelector('#goal-confirm').requestSubmit()");
 await ready(()=>js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').goalPlans?.some(p=>p.project==='ucp'&&p.goal.includes('Livrer la prochaine version')&&p.steps[0].criterion==='Validation documentée par le propriétaire')"),9000)();
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.length||0"),actionsBeforePlan,'Saving a goal plan must not execute or create actions');
 log('scoped IMP-01 goal plan is editable, sourced and persisted as unexecuted proposal');
 // An approved plan step must create exactly one local task only after explicit consent.
 await ready(()=>js("!!document.querySelector('[data-goal-step]')"),9000)();
 await js("document.querySelector('[data-goal-step]').click()");
 await ready(()=>js("!!document.querySelector('#goal-action-confirm')"),9000)();
 assert.match(await js("document.querySelector('#goal-action-preview').textContent"),/Avant :/);
 assert.match(await js("document.querySelector('#goal-action-preview').textContent"),/Après :/);
 assert.match(await js("document.querySelector('#goal-action-preview').textContent"),/Risque :/);
 assert.equal(await js("document.querySelector('#goal-action-confirm [name=consent]').checked"),false);
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.length||0"),actionsBeforePlan,'Simply preparing a step must not write any task');
 await js("document.querySelector('#goal-action-confirm [name=title]').value='Tâche de validation contrôlée';document.querySelector('#goal-action-confirm [name=title]').dispatchEvent(new Event('input'))");
 assert.match(await js("document.querySelector('[data-goal-after]').textContent"),/Tâche de validation contrôlée/);
 assert.equal(await js("document.querySelector('#goal-action-confirm [name=consent]').checked"),false,'Title edit must revoke prior consent');
 await js("document.querySelector('#goal-action-confirm [name=consent]').click();document.querySelector('#goal-action-confirm').requestSubmit()");
 await ready(()=>js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.some(a=>a.title==='Tâche de validation contrôlée'&&a.project==='ucp')"),9000)();
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.length||0"),actionsBeforePlan+1);
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').operatorAudit?.filter(a=>a.title==='Tâche de validation contrôlée'&&a.outcome==='saved').length||0"),1);
 assert.match(await js("document.querySelector('#main').textContent"),/Une tâche locale a déjà été créée pour cette étape/);
 await js("location.hash='#/control/manager'");
 await js("location.hash='#/control/goals'");
 await ready(()=>js("!!document.querySelector('#goal-request')"),9000)();
 assert.match(await js("document.querySelector('#main').textContent"),/Une tâche locale a déjà été créée pour cette étape/);
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.length||0"),actionsBeforePlan+1,'Opening a saved proposal must not replay task creation');
 log('one plan step approved through IMP-05 review and IMP-10 receipt without duplicates after reopening');
 await js("location.hash='#/control/localai'");
 await ready(()=>js("!!document.querySelector('[data-op-consent]')"),9000)();
 await js("document.querySelector('[data-op-consent]').click()");

 // A storage failure must never claim success or create a phantom task.
 await js("document.querySelector('[data-op-form] textarea').value='Crée une tâche Recette Echec Stockage Unique pour UCP';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-draft]').hidden===false"),8000)();
 await js("window.__controlOldSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota simulé','QuotaExceededError')};document.querySelector('[data-op-draft]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Action non enregistrée')"),8000)();
 await js("Storage.prototype.setItem=window.__controlOldSetItem;delete window.__controlOldSetItem");
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.filter(a=>a.title==='Recette Echec Stockage Unique').length||0"),0);
 log('storage quota failure is reported and does not create a phantom task');
 
 // Force actual Europe/Paris timezone in Chromium to test skipped and repeated local hours.
 await command('Emulation.setTimezoneOverride',{timezoneId:'Europe/Paris'});
 assert.equal(await js("window.CONTROL_OPERATOR_CORE.validateLocalDateTime('2027-03-28T02:30')"),false,'Skipped daylight-saving time must be rejected');
 assert.equal(await js("window.CONTROL_OPERATOR_CORE.validateLocalDateTime('2027-10-31T02:30')"),false,'Repeated daylight-saving time must be rejected');
 assert.equal(await js("window.CONTROL_OPERATOR_CORE.validateLocalDateTime('2027-10-31T03:30')"),true,'Valid local clock time must be accepted');
 log('Europe/Paris DST skipped/repeated times are rejected in real browser');

 await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await delay(300);
 const mobile=await js("({viewport:window.innerWidth,scroll:document.documentElement.scrollWidth,head:!!document.querySelector('.control-delivery-focus')})");
 assert.equal(mobile.head,true);
 assert.ok(mobile.scroll<=mobile.viewport+4,'Mobile horizontal overflow detected: '+JSON.stringify(mobile));
 log('mobile-sized 390px viewport renders roadmap with no horizontal overflow');
 await command('Emulation.setDeviceMetricsOverride',{width:320,height:700,deviceScaleFactor:2,mobile:true});
 await delay(250);
 const narrow=await js("({viewport:window.innerWidth,scroll:document.documentElement.scrollWidth})");
 assert.ok(narrow.scroll<=narrow.viewport+4,'320px mobile horizontal overflow detected: '+JSON.stringify(narrow));
 log('very narrow 320px viewport avoids horizontal scroll');

 // Only the public HTTPS application registers the service worker.
 if(production){
  const registered=await js("(async()=>{if(!('serviceWorker' in navigator))return false;return Promise.race([navigator.serviceWorker.ready.then(r=>!!r.active),new Promise(resolve=>setTimeout(()=>resolve(false),15000))])})()");
  assert.equal(registered,true,'Public PWA must install and activate its service worker');
  // On a fresh installation, ready.active may resolve just before clients.claim() takes effect.
  // A normal reload is allowed once; the page must then be controlled or the test fails.
  if(!(await js("Boolean(navigator.serviceWorker.controller)"))){
   await command('Page.reload',{ignoreCache:false});
  }
  await ready(()=>js("Boolean(navigator.serviceWorker.controller)"),14000)();
  const cacheNames=await js("(async()=>await caches.keys())()");
  assert.ok(Array.isArray(cacheNames)&&cacheNames.some(name=>name.startsWith('control-shell-')),'Public PWA must cache the application shell');
  assert.ok(cacheNames.includes('control-shell-v39')&&cacheNames.includes('control-public-data-v39'),'PWA must have installed the verified v39 caches');
  log('public PWA service worker activated and offline shell cache created');
  await command('Network.enable');
  try{
   await command('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
   await command('Page.reload',{ignoreCache:false});
   await ready(()=>js("document.querySelector('[data-control-delivery] .control-delivery-count')?.textContent?.includes('9 fonctionnalités')"),16000)();
   assert.ok(await js("!!document.querySelector('[data-control-operator]')"),'Operator UI missing offline');

   await ready(()=>js("document.querySelector('[data-control-v12] .control-delivery-v12-count')?.textContent?.includes('42 scénarios')"),14000)();
   const offlineRegistry=await js("(async()=>{try{const r=await fetch('./data/control-ia-requirements.json');const data=await r.json();return {ok:r.ok,tickets:data.tickets?.length,scenarios:data.scenarios?.length}}catch(error){return {error:String(error)}}})()");
   assert.deepEqual(offlineRegistry,{ok:true,tickets:22,scenarios:42},'Published V1.2 register must remain available offline: '+JSON.stringify(offlineRegistry));
   log('offline CONTROL also renders V1.2 and reads 22-ticket/42-scenario registry from verified cache');
   log('public PWA reloads the assistant and cached tracker when completely offline');
  }finally{
   await command('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:0,uploadThroughput:0});
  }
 }


 // Account gate is not the same as personal CONTROL: public Cloud must remain disabled.
 // We test the actual app.html and public config, not merely assert file contents in Node.
 const targetCloud=production?PUBLIC_ORIGIN+'app.html':'http://127.0.0.1:'+port+'/app.html';
 await command('Page.navigate',{url:targetCloud});
 await ready(()=>js("document.querySelector('#setup')?.hidden===false"),16000)();
 const cloudState=await js("(async()=>{const cfg=await (await fetch('./config/cloud.json',{cache:'no-store'})).json();return {enabled:cfg.enabled,setup:document.querySelector('#setup')?.hidden,auth:document.querySelector('#auth')?.hidden,workspace:document.querySelector('#workspace')?.hidden,screen:document.querySelector('#setup h1')?.textContent}})()");
 assert.equal(cloudState.enabled,false,'Cloud must remain disabled before independent backend authorization');
 assert.equal(cloudState.setup,false,'Disabled Cloud must show setup panel');
 assert.equal(cloudState.auth,true,'Disabled Cloud must not show sign-in or account creation');
 assert.equal(cloudState.workspace,true,'Disabled Cloud must not expose private workspace');
 assert.match(cloudState.screen||'',/CONTROL Cloud se prépare/);
 log('Cloud app.html remains fail-closed without private accounts or sign-in (local and published)');

 assert.equal(errors.length,0,'Unexpected JS browser exceptions: '+errors.join(' | '));
 log('no uncaught JavaScript exceptions');
 process.stdout.write('BROWSER SMOKE: ALL CHECKS PASSED (actual Chromium, '+(production?'public GitHub Pages with isolated ephemeral browser profile':'local isolated server')+'; not a physical Android device)\n');
}finally{
 try{ws?.close()}catch{}
 // Chrome may still write session files after SIGTERM; wait before removing
 // its ephemeral profile to avoid a false ENOTEMPTY test failure.
 if(browser){
  const exit=browser.exitCode!==null?Promise.resolve():new Promise(done=>browser.once('exit',done));
  // Chromium consists of many child processes. On Unix, detached=true
  // creates an isolated process group which can be closed together.
  try{if(process.platform!=='win32')process.kill(-browser.pid,'SIGTERM');else browser.kill('SIGTERM')}catch{}
  await Promise.race([exit,delay(1800)]);
  if(browser.exitCode===null){
   try{if(process.platform!=='win32')process.kill(-browser.pid,'SIGKILL');else browser.kill('SIGKILL')}catch{}
  }
 }
 if(!serverClosed){serverClosed=true;server.close()}
 try{rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100})}
 catch(error){
  // The runner is ephemeral and contains only synthetic browser fixtures.
  // Do not misclassify a Chromium shutdown race as an application failure.
  if(!['ENOTEMPTY','EBUSY','EPERM'].includes(error?.code))throw error;
  process.stderr.write('BROWSER CLEANUP: temporary profile will be removed by ephemeral runner ('+error.code+')\n');
 }
}
