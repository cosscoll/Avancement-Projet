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
const swSource=readFileSync(resolve(root,'service-worker.js'),'utf8');
const swCaches=['CACHE_SHELL','CACHE_PUBLIC'].map(key=>{
 const match=swSource.match(new RegExp("const "+key+"='([^']+)'"));
 assert.ok(match,'Missing service worker cache version: '+key);
 return match[1];
});
const PUBLIC_ASSETS=['service-worker.js','index.html','app.html','config/cloud.json','assets/cloud-app.js','assets/control-operator.js','assets/control-operator-core.js','assets/control-backup-review.js','assets/control-web-builder.js','assets/control-web-builder-ui.js','assets/control-web-builder.css','assets/command-center.js','assets/control-delivery.js','assets/control-delivery.css','assets/navigation-hub.js','assets/navigation-hub.css','data/control-ia-delivery.json','data/control-ia-requirements.json'];
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

 // The home screen must show new capabilities without requiring hidden tool navigation.
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('.control-whats-new')"),9000)();
 const visibleHome=await js("({heading:document.querySelector('.control-whats-new h2')?.textContent||'',links:[...document.querySelectorAll('.control-whats-new-links a')].map(a=>({href:a.getAttribute('href'),title:a.textContent})),cloud:document.querySelector('.control-whats-new-status')?.textContent||''})");
 assert.match(visibleHome.heading,/nouvelles fonctions/i);
 for(const target of ['#/control/goals','#/control/search','#/control/memory'])
  assert.ok(visibleHome.links.some(x=>x.href===target),'New feature link missing from homepage: '+target);
 assert.match(visibleHome.cloud,/pas encore activée/,'Home must not claim live CONTROL Cloud accounts');
 assert.ok(await js("!!document.querySelector('.control-whats-new-status a[href=\"app.html\"]')"),'Visible Cloud status should link to truthful setup page');
 await js("document.querySelector('.control-whats-new-links a[href=\"#/control/goals\"]').click()");
 await ready(()=>js("!!document.querySelector('#goal-request')"),9000)();
 log('visible homepage links to working goal planner, sourced search and decision memory; Cloud status truthful');
 await js("location.hash='#/control/localai'");
 await ready(()=>js("!!document.querySelector('[data-control-operator]')"),9000)();

 assert.ok(await js("!!document.querySelector('[data-control-operator]')"),'Operator panel missing');
 assert.equal(await js("document.querySelector('[data-op-consent]').checked"),false);
 await js("document.querySelector('[data-op-form] textarea').value='Mes tâches';document.querySelector('[data-op-form]').requestSubmit()");
 await ready(()=>js("document.querySelector('[data-op-response]').textContent.includes('Autorise la lecture')"),6000)();
 log('operator refuses access before consent');
 await js("document.querySelector('[data-op-consent]').click()");
 assert.equal(await js("document.querySelector('[data-op-consent]').checked"),true);
 // Conflicting, negative and destructive requests must never prepare a write.
 for(const unsafe of ['Ne crée pas une tâche pour UCP','Efface toutes les actions pour UCP','Crée une tâche Effacer le devis puis supprime le rendez-vous pour UCP']){
  await js("(()=>{const f=document.querySelector('[data-op-form]');f.querySelector('textarea').value="+JSON.stringify("REPLACE")+";f.requestSubmit()})()".replace("REPLACE",unsafe));
  assert.equal(await js("document.querySelector('[data-op-draft]').hidden"),true,'Unsafe intent must not create an actionable proposal');
 }
 log('assistant rejects negated, bulk-destructive and contradictory commands in actual Chromium');
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
 assert.ok(listed.includes('14:30'),'Calendar page is missing the recorded local hour');
  // Overlapping records need explicit confirmation before a local save.
  await js("(()=>{const f=document.querySelector('#new-event');f.elements.title.value='Recette Conflit Local';f.elements.date.value="+JSON.stringify(tomorrow+"T14:30")+";f.elements.durationMinutes.value='60';f.requestSubmit()})()");
  await ready(()=>js("document.querySelector('#calendar-feedback')?.textContent.includes('Conflit détecté')"),7000)();
  assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').events.filter(e=>e.title==='Recette Conflit Local').length"),0);
  assert.match(await js("document.querySelector('#calendar-feedback')?.textContent||''"),/Recette Agenda Unique/);
  await js("(()=>{const f=document.querySelector('#new-event');f.elements.namedItem('override').checked=true;f.requestSubmit()})()");
  await ready(()=>js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').events.some(e=>e.title==='Recette Conflit Local')"),9000)();
  assert.ok(await js("[...document.querySelectorAll('#main .inbox-item')].some(e=>e.textContent.includes('chevauchement'))"));
  log('calendar blocks conflicts until explicit override');
  await js("(()=>{const e=JSON.parse(localStorage.getItem('control-command-v1')).events.find(e=>e.title==='Recette Conflit Local');document.querySelector('[data-act=\"edit-event:'+e.id+'\"]').click()})()");
  await ready(()=>js("!document.querySelector('#calendar-editor')?.classList.contains('hidden')"),7000)();
  await js("(()=>{const f=document.querySelector('#edit-event');f.elements.date.value="+JSON.stringify(tomorrow+"T16:00")+";f.elements.namedItem('override').checked=false;f.requestSubmit()})()");
  await ready(()=>js("JSON.parse(localStorage.getItem('control-command-v1')).events.some(e=>e.title==='Recette Conflit Local'&&e.date.endsWith('T16:00'))"),9000)();
  const icsChecks=await js("(()=>{const e=JSON.parse(localStorage.getItem('control-command-v1')).events.find(e=>e.title==='Recette Conflit Local');const i=window.CONTROL_CALENDAR_CORE.icalEvent(e);return {ok:i.includes('BEGIN:VCALENDAR')&&i.includes('DTSTART:')&&i.includes('SUMMARY:Recette Conflit Local'),count:i.split('BEGIN:VEVENT').length-1}})()");
  assert.deepEqual(icsChecks,{ok:true,count:1});
  log('calendar updates an event and constructs a valid one-event .ics export');

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
 // The new universal finder must be operable with touch-sized controls,
 // and project-independent keywords must lead directly to a real destination.
 const beforeFinderHash=await js("location.hash");
 await js("document.querySelector('.control-nav-mobile-trigger[data-control-nav-open]').click()");
 await ready(()=>js("document.querySelector('.control-finder')?.hidden===false"),8000)();
 assert.equal(await js("document.querySelector('.control-finder-search input')?.type"),'search');
 await js("(()=>{const input=document.querySelector('.control-finder-search input');input.value='visio';input.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await ready(()=>js("!!document.querySelector('[data-finder-id=meetings]')"),8000)();
 assert.equal(await js("document.querySelector('[data-finder-id=meetings]')?.textContent?.toLowerCase().includes('visio')"),true);
 const finderSize=await js("({viewport:innerWidth,scroll:document.documentElement.scrollWidth,panel:Math.ceil(document.querySelector('.control-finder-panel').getBoundingClientRect().width)})");
 assert.ok(finderSize.scroll<=finderSize.viewport+4&&finderSize.panel<=finderSize.viewport+1,'Finder must not overflow narrow viewport: '+JSON.stringify(finderSize));
 await js("document.querySelector('[data-finder-id=meetings]').click()");
 await ready(()=>js("location.hash==='#/control/meetings'"),8000)();
 assert.equal(await js("document.querySelector('.control-finder').hidden"),true);
 await js("location.hash="+JSON.stringify(beforeFinderHash));
 await ready(()=>js("!!document.querySelector('.control-delivery-focus')"),8000)();
 log('320px finder finds visio by intent and opens its destination without mobile overflow');
 // Desktop contract: this must now be an actual workspace with a persistent
 // navigation rail and a project-first dashboard, not a centered card grid.
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('#main .shell-dashboard .shell-feature-primary')"),8000)();
 const desktop=await js("(()=>{const rail=document.querySelector('.shell-sidebar'),main=document.querySelector('#main'),dashboard=document.querySelector('.shell-dashboard'),projects=dashboard?.querySelector('.shell-dashboard-section'),news=dashboard?.querySelector('.control-whats-new'),hero=dashboard?.querySelector('.shell-feature-primary');return {width:innerWidth,overflow:document.documentElement.scrollWidth,railWidth:rail?.getBoundingClientRect().width,railVisible:rail&&getComputedStyle(rail).display!=='none',mainLeft:main?.getBoundingClientRect().left,heroBackground:hero?getComputedStyle(hero).backgroundColor:'',projectsY:projects?.getBoundingClientRect().top,newsY:news?.getBoundingClientRect().top,links:document.querySelectorAll('.shell-side-link').length}})()");
 assert.ok(desktop.railVisible&&desktop.railWidth>=245&&desktop.mainLeft>=260,'Desktop must have real fixed sidebar with separate workspace: '+JSON.stringify(desktop));
 assert.ok(desktop.heroBackground!=='rgb(255, 255, 255)'&&desktop.projectsY<desktop.newsY,'Projects must appear above the announcements in a non-white editorial dashboard: '+JSON.stringify(desktop));
 assert.ok(desktop.links>=7&&desktop.overflow<=desktop.width+4,'Desktop navigation or page overflows: '+JSON.stringify(desktop));
 log('1440px desktop has persistent dark navigation, separate content canvas and project-first layout');
 // UX regression: new project opens close to its action, with an explicit
 // cancel path, and advanced project sections are visible on desktop.
 await js("document.querySelector('#add-project').click()");
 await ready(()=>js("!document.querySelector('#add-box').classList.contains('hidden')"),8000)();
 assert.equal(await js("document.querySelector('#add-project').getAttribute('aria-expanded')"),'true');
 await js("document.querySelector('#cancel-add-project').click()");
 assert.equal(await js("document.querySelector('#add-box').classList.contains('hidden')"),true);
 await js("document.querySelector('.shell-projects-list a.card').click()");
 await ready(()=>js("document.querySelector('.shell-project-navigation')!==null"),8000)();
 const projectNav=await js("({advanced:document.querySelectorAll('.shell-project-more .clarity-advanced [data-tab]').length,open:document.querySelector('.shell-project-more')?.open,computed:getComputedStyle(document.querySelector('.shell-project-more .clarity-advanced')).display})");
 assert.equal(projectNav.advanced,7,'Personal project still has 7 advanced sections');
 assert.ok(projectNav.open&&projectNav.computed!=='none','Desktop advanced project sections must be visible');
 await js("document.querySelector('.shell-project-navigation [data-tab=meetings]').click()");
 await ready(()=>js("location.hash.endsWith('/meetings')"),8000)();
 await js("document.querySelector('[data-control-nav-category=project]').click()");
 await ready(()=>js("document.querySelector('.control-finder')?.hidden===false"),8000)();
 assert.equal(await js("document.querySelector('[data-finder-cat=project]')?.getAttribute('aria-pressed')"),'true');
 assert.equal(await js("document.querySelectorAll('.control-finder-results [data-finder-id^=\"project:\"]').length"),11);
 await js("document.querySelector('[data-finder-id=\"project:lab\"]').click()");
 await ready(()=>js("location.hash.endsWith('/lab')"),8000)();
 log('desktop project workflow exposes all advanced sections, creates/cancels safely and finds project tools');
 // All tools must be filterable directly instead of hidden in collapsed
 // categories. Clearing restores category preferences.
 await js("location.hash='#/control/tools'");
 await ready(()=>js("!!document.querySelector('#tools-filter')"),8000)();
 await js("(()=>{const x=document.querySelector('#tools-filter');x.value='visio';x.dispatchEvent(new Event('input',{bubbles:true}))})()");
 const toolResults=await js("({hits:[...document.querySelectorAll('.clarity-tool-link')].filter(x=>!x.hidden).map(x=>x.textContent.trim()),status:document.querySelector('#tools-filter-status')?.textContent,opened:document.querySelectorAll('.clarity-toolgroup[open]').length})");
 assert.ok(toolResults.hits.some(x=>x.toLowerCase().includes('visio'))&&toolResults.hits.length<=3,'Tool filtering should find visios directly: '+JSON.stringify(toolResults));
 assert.ok(toolResults.status?.includes('fonction(s)'),'Tool filtering must report results');
 await js("(()=>{const x=document.querySelector('#tools-filter');x.value='';x.dispatchEvent(new Event('input',{bubbles:true}))})()");
 assert.equal(await js("document.querySelectorAll('.clarity-toolgroup[open]').length"),1);
 log('desktop tool search finds hidden visio feature and restores categories');

  // Local site builder is a real, sandboxed, user-controlled editor, not remote AI generation.
  await js("location.hash='#/control/webbuilder'");
  await ready(()=>js("!!document.querySelector('#builder-form')&&!!document.querySelector('#builder-preview')"),8000)();
  const builderState=await js("({sandbox:document.querySelector('#builder-preview')?.getAttribute('sandbox'),source:document.querySelector('#builder-preview')?.srcdoc||'',modes:document.querySelectorAll('[data-builder-viewport]').length})");
  assert.equal(builderState.sandbox,'','Preview must not be allowed to run scripts or same-origin access');
  assert.ok(builderState.source.includes('<style>')&&builderState.source.includes('Notre expertise.'),'Generator should render a complete preview');
  assert.equal(builderState.modes,2);
  await js("(()=>{const form=document.querySelector('#builder-form');form.elements.brand.value='STUDIO CONTROL RECETTE';form.elements.brand.dispatchEvent(new Event('input',{bubbles:true}));form.elements.theme.value='produit';form.elements.theme.dispatchEvent(new Event('change',{bubbles:true}));form.elements.palette.value='violet';form.elements.palette.dispatchEvent(new Event('input',{bubbles:true}));form.elements.typography.value='editorial';form.elements.typography.dispatchEvent(new Event('input',{bubbles:true}));form.requestSubmit()})()");
  const visual=await js("({palette:document.querySelector('#builder-form [name=palette]').value,font:document.querySelector('#builder-form [name=typography]').value,css:document.querySelector('#builder-preview').srcdoc})");
  assert.equal(visual.palette,'violet');
  assert.equal(visual.font,'editorial');
  assert.match(visual.css,/--paper:#161325/);
  assert.match(visual.css,/font-family:Georgia/);
  await ready(()=>js("JSON.parse(localStorage.getItem('control-command-v1')||'{}').websites?.some(s=>s.brand==='STUDIO CONTROL RECETTE')"),9000)();
  assert.equal(await js("document.querySelector('#builder-preview').srcdoc.includes('STUDIO CONTROL RECETTE')"),true);
  assert.ok(await js("document.querySelector('[data-builder-viewport=mobile]')?.click();document.querySelector('#builder-preview')?.classList.contains('is-mobile')"));
  const builderZip=await js("(()=>{const item=JSON.parse(localStorage.getItem('control-command-v1')).websites.find(s=>s.brand==='STUDIO CONTROL RECETTE');const files=window.CONTROL_WEB_BUILDER_CORE.files(item),zip=window.CONTROL_WEB_BUILDER_CORE.zip(files);return {count:Object.keys(files).length,bytes:zip.length,head:[...zip.slice(0,4)]}})()");
  assert.equal(builderZip.count,4);
  assert.deepEqual(builderZip.head,[80,75,3,4]);
  assert.ok(builderZip.bytes>1000);
  await command('Page.reload',{ignoreCache:true});
  await ready(()=>js("!!document.querySelector('#builder-form')&&!!document.querySelector('[data-open-draft]')"),12000)();
  await js("document.querySelector('[data-open-draft]').click()");
  assert.equal(await js("document.querySelector('#builder-form [name=brand]').value"),'STUDIO CONTROL RECETTE');
  const starterTitle=await js("document.querySelector('#builder-form [name=title]').value");
  const initialQuality=await js("({warnings:document.querySelectorAll('#builder-audit-list .is-advice').length,grade:document.querySelector('#builder-audit-score')?.textContent})");
  assert.ok(initialQuality.warnings>0,'Sample copy must not pass a full quality check');
  assert.match(initialQuality.grade,/\/ 8 contrôles/);
  await js("(()=>{const f=document.querySelector('#builder-form');f.elements.title.value='Une seconde version à comparer visuellement';f.elements.title.dispatchEvent(new Event('input',{bubbles:true}));f.requestSubmit()})()");
  await ready(()=>js("JSON.parse(localStorage.getItem('control-command-v1')).websites.find(x=>x.brand==='STUDIO CONTROL RECETTE')?.version===2"),9000)();
  assert.ok(await js("!!document.querySelector('[data-restore-version]')"));
  await js("(()=>{const original=window.confirm;window.confirm=()=>true;try{document.querySelector('[data-restore-version]').click()}finally{window.confirm=original}})()");
  await ready(()=>js("JSON.parse(localStorage.getItem('control-command-v1')).websites.find(x=>x.brand==='STUDIO CONTROL RECETTE')?.version===3"),9000)();
  assert.equal(await js("document.querySelector('#builder-form [name=title]').value"),starterTitle);
  const currentVersion=await js("JSON.parse(localStorage.getItem('control-command-v1')).websites.find(x=>x.brand==='STUDIO CONTROL RECETTE').revisions.map(v=>v.version)");
  assert.deepEqual(currentVersion,[1,2],'Rolling back must preserve both earlier versions');
  log('builder warns on template content and restores history as a new version without data loss');
  const priorDrafts=await js("JSON.parse(localStorage.getItem('control-command-v1')).websites.length");
  await js("document.querySelector('#builder-new').click()");
  await js("(()=>{document.querySelector('.web-builder-brief summary').click();document.querySelector('#builder-brief-text').value='Je suis artisan menuisier à Toulouse et je réalise du mobilier sur mesure pour les particuliers et les entreprises.';document.querySelector('#builder-brief-apply').click()})()");
  assert.equal(await js("document.querySelector('#builder-form [name=theme]').value"),'atelier');
  assert.equal(await js("document.querySelector('#builder-form [name=brand]').value"),'VOTRE MARQUE');
  assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')).websites.length"),priorDrafts,'Brief preview must not secretly save a draft');
  await js("document.querySelector('#builder-form').requestSubmit()");
  await ready(()=>js("JSON.parse(localStorage.getItem('control-command-v1')).websites.length==="+String(priorDrafts+1)),9000)();
  log('a local guided brief creates a customizable preview and stores nothing before explicit save');
  log('site builder: sandbox preview, local save, ZIP files, responsive mode and reload persistence');

  await js("(()=>{const f=document.querySelector('#builder-form');f.elements.siteStructure.value='multipage';f.elements.siteStructure.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await ready(()=>js("document.querySelector('#builder-pages')?.hidden===false"),8000)();
  await js("document.querySelector('[data-builder-page=services]').click()");
  assert.match(await js("document.querySelector('#builder-preview').srcdoc"),/Nos prestations|Ce que nous faisons/);
  await js("document.querySelector('[data-builder-page=contact]').click()");
  assert.match(await js("document.querySelector('#builder-preview').srcdoc"),/Contacter|PRENONS CONTACT/);
  const multiOut=await js("(()=>{const f=document.querySelector('#builder-form'),args=Object.fromEntries(new FormData(f));const result=window.CONTROL_WEB_BUILDER_CORE.files(args);return {names:Object.keys(result),contact:result['contact.html'].includes('aria-current=\"page\"'),services:result['services.html'].includes('./contact.html'),index:result['index.html'].includes('./services.html')}})()");
  assert.deepEqual(multiOut.names,['index.html','styles.css','services.html','contact.html','standalone.html','README.md']);
  assert.ok(multiOut.contact&&multiOut.services&&multiOut.index,'Separate static pages must link correctly');
  await js("document.querySelector('#builder-form').requestSubmit()");
  await ready(()=>js("JSON.parse(localStorage.getItem('control-command-v1')).websites.some(x=>x.siteStructure==='multipage')"),9000)();
  log('multi-page preview switches between Accueil, Prestations and Contact; export builds linked HTML files');


 // The mission list must not be pushed below a lengthy creation form.
 await js("location.hash='#/control/missions'");
 await ready(()=>js("!!document.querySelector('#mission-create')"),8000)();
 assert.equal(await js("document.querySelector('#mission-create').open"),false);
 await js("document.querySelector('#mission-create>summary').click()");
 assert.equal(await js("document.querySelector('#mission-create').open"),true);
 assert.equal(await js("!!document.querySelector('#new-mission')"),true);
 log('mission creation expands on demand without concealing the existing mission overview');

 // A denied browser write must never claim that an action was saved.
 await js("location.hash='#/control/inbox'");
 await ready(()=>js("!!document.querySelector('#new-action')"),8000)();
 await js(`(()=>{
   window.__controlBeforeWrite=localStorage.getItem('control-command-v1');
   window.__controlNativeSetItem=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){
     if(key==='control-command-v1')throw new DOMException('quota','QuotaExceededError');
     return window.__controlNativeSetItem.call(this,key,value);
   };
   const form=document.querySelector('#new-action');
   form.elements.title.value='RECETTE-SAUVEGARDE-REFUSEE';
   form.requestSubmit();
 })()`);
 const rejectedSave=await js("({same:localStorage.getItem('control-command-v1')===window.__controlBeforeWrite,form:!!document.querySelector('#new-action'),warning:document.querySelector('#toast')?.textContent||'',visible:!!document.querySelector('#main .inbox-item')?.textContent?.includes('RECETTE-SAUVEGARDE-REFUSEE')})");
 assert.equal(rejectedSave.same,true,'A failed write must preserve stored data');
 assert.equal(rejectedSave.form,true,'A failed write must preserve the form');
 assert.match(rejectedSave.warning,/Stockage indisponible ou plein/);
 assert.equal(rejectedSave.visible,false,'Unsaved item must not appear in the action list');
 await js("Storage.prototype.setItem=window.__controlNativeSetItem;delete window.__controlNativeSetItem;delete window.__controlBeforeWrite;");
 log('quota-denied action preserves the form and cannot appear as saved');

 // A corrupt JSON record remains intact and offers its owner a raw download.
 await js("(()=>{window.__controlOriginalRaw=localStorage.getItem('control-command-v1');localStorage.setItem('control-command-v1','{corrupt');location.hash='#/control/backup'})()");
 await ready(()=>js("!!document.querySelector('[data-act=download-corrupt]')"),8000)();
 const corruptState=await js("({raw:localStorage.getItem('control-command-v1'),alert:document.querySelector('#main [role=alert]')?.textContent,button:!!document.querySelector('[data-act=download-corrupt]')})");
 assert.equal(corruptState.raw,'{corrupt');
 assert.match(corruptState.alert||'',/Stockage local illisible/);
 assert.equal(corruptState.button,true,'Raw recovery control must appear');
 await js("(()=>{const value=window.__controlOriginalRaw;if(value===null)localStorage.removeItem('control-command-v1');else localStorage.setItem('control-command-v1',value);delete window.__controlOriginalRaw;location.hash='#/control/missions'})()");
 await ready(()=>js("!!document.querySelector('#mission-create')&&!document.querySelector('#main [role=alert]')"),8000)();
 log('corrupt local state remains untouched until recovery');

  // Independent local spaces must never disappear silently in a downloaded backup.
  await js("(()=>{window.__controlHubRaw=localStorage.getItem('control-hub-v2');window.__controlAutosRaw=localStorage.getItem('control-automations-v1');localStorage.setItem('control-hub-v2','{incomplete');localStorage.setItem('control-automations-v1','null');location.hash='#/control/backup'})()");
  await ready(()=>js("document.querySelectorAll('[data-act^=download-raw]').length===2"),8000)();
  const multiStore=await js("({hub:localStorage.getItem('control-hub-v2'),automations:localStorage.getItem('control-automations-v1'),warnings:[...document.querySelectorAll('#main [role=alert]')].map(n=>n.textContent)})");
  assert.equal(multiStore.hub,'{incomplete');
  assert.equal(multiStore.automations,'null');
  assert.ok(multiStore.warnings.some(x=>x.includes('Espaces et projets')),'Project data risk must be visible');
  assert.ok(multiStore.warnings.some(x=>x.includes('Automatisations')),'Automation data risk must be visible');
  await js("document.querySelector('#export-data').requestSubmit()");
  assert.match(await js("document.querySelector('#toast')?.textContent||''"),/Export bloqué : un espace local est illisible/);
  await js("(()=>{for(const [key,value] of [['control-hub-v2',window.__controlHubRaw],['control-automations-v1',window.__controlAutosRaw]]){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}delete window.__controlHubRaw;delete window.__controlAutosRaw;location.hash='#/control/missions'})()");
  await ready(()=>js("!!document.querySelector('#mission-create')"),8000)();
  log('corrupted project or automation storage cannot produce a falsely complete backup');


 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('.shell-dashboard')"),8000)();
 await command('Emulation.setDeviceMetricsOverride',{width:320,height:700,deviceScaleFactor:2,mobile:true});
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('.shell-projects-list a.card')"),8000)();
 await js("document.querySelector('.shell-projects-list a.card').click()");
 await ready(()=>js("!!document.querySelector('.shell-project-more')"),8000)();
 const mobileProject=await js("({width:innerWidth,scroll:document.documentElement.scrollWidth,open:document.querySelector('.shell-project-more').open,display:getComputedStyle(document.querySelector('.shell-project-more .clarity-advanced')).display})");
 assert.ok(!mobileProject.open&&mobileProject.display==='none'&&mobileProject.scroll<=mobileProject.width+4,
  '320px project advanced sections must be collapsed without overflow: '+JSON.stringify(mobileProject));
 await js("document.querySelector('.shell-project-more>summary').click()");
 assert.equal(await js("document.querySelector('.shell-project-more').open"),true);
 await js("document.querySelector('.shell-project-more [data-tab=meetings]').click()");
 await ready(()=>js("location.hash.endsWith('/meetings')"),8000)();
 log('320px project navigation exposes advanced sections on demand without overflow');

 // The personal project store must never be overwritten after a corrupted read.
 await js("(()=>{const raw=localStorage.getItem('control-hub-v2');sessionStorage.setItem('control-smoke-hub-before',raw===null?'__ABSENT__':raw);localStorage.setItem('control-hub-v2','{invalid-hub');location.hash='#/'})()");
 await command('Page.reload',{ignoreCache:false});
 await ready(()=>js("!!document.querySelector('.shell-dashboard')&&!!document.querySelector('#main [role=alert]')"),16000)();
 const hubWarn=await js("document.querySelector('#main [role=alert]')?.textContent||''");
 assert.match(hubWarn,/données locales des projets sont illisibles/);
 await js("document.querySelector('#add-project').click()");
 await ready(()=>js("!document.querySelector('#add-box')?.classList.contains('hidden')"),6000)();
 await js("(()=>{const f=document.querySelector('#new-project');f.elements.name.value='Projet qui ne doit pas exister';f.requestSubmit()})()");
 assert.equal(await js("localStorage.getItem('control-hub-v2')"),'{invalid-hub','Corrupted original project storage must remain untouched');
 assert.ok(!(await js("document.querySelector('#cards')?.textContent?.includes('Projet qui ne doit pas exister')")),'Unsaved project must not appear');
 await js("(()=>{const previous=sessionStorage.getItem('control-smoke-hub-before');if(previous==='__ABSENT__')localStorage.removeItem('control-hub-v2');else localStorage.setItem('control-hub-v2',previous);sessionStorage.removeItem('control-smoke-hub-before');location.hash='#/'})()");
 await command('Page.reload',{ignoreCache:false});
 await ready(()=>js("!!document.querySelector('.shell-dashboard')&&!document.querySelector('#main [role=alert]')"),16000)();
 log('project hub refuses overwriting corrupt JSON and restores normal operation after recovery');

 // The local automation register is not an execution system; malformed data must remain untouched.
 await js("(()=>{const raw=localStorage.getItem('control-automations-v1');sessionStorage.setItem('control-smoke-autos-before',raw===null?'__ABSENT__':raw);localStorage.setItem('control-automations-v1','{invalid-autos');location.hash='#/automations'})()");
 await command('Page.reload',{ignoreCache:false});
 await ready(()=>js("document.querySelector('#main [role=alert]')?.textContent?.includes('registre local des automatisations est illisible')"),16000)();
 await js("location.hash='#/automations/Claude'");
 await ready(()=>js("!!document.querySelector('#auto-create')"),10000)();
 await js("(()=>{document.querySelector('#auto-new').click();const form=document.querySelector('#auto-create');form.elements.title.value='NE-PAS-CREER';form.requestSubmit()})()");
 assert.equal(await js("localStorage.getItem('control-automations-v1')"),'{invalid-autos','Corrupt automation draft storage must stay intact');
 assert.equal(await js("location.hash"),'#/automations/Claude','Draft creation must be refused while storage is corrupt');
 await js("(()=>{const previous=sessionStorage.getItem('control-smoke-autos-before');if(previous==='__ABSENT__')localStorage.removeItem('control-automations-v1');else localStorage.setItem('control-automations-v1',previous);sessionStorage.removeItem('control-smoke-autos-before');location.hash='#/'})()");
 await command('Page.reload',{ignoreCache:false});
 await ready(()=>js("!!document.querySelector('.shell-dashboard')"),16000)();
 log('corrupt automation drafts block new entries without enabling scheduled tasks');

 // A new encrypted or plain backup must be inspected before any local overwrite.
 await js("location.hash='#/control/backup'");
 await ready(()=>js("!!document.querySelector('#import-data')&&!!document.querySelector('#import-preview')"),10000)();
 const backupBefore=await js("({command:localStorage.getItem('control-command-v1'),hub:localStorage.getItem('control-hub-v2'),autos:localStorage.getItem('control-automations-v1')})");
 await js("(()=>{const command=JSON.parse(localStorage.getItem('control-command-v1')||'{}');command.actions=Array.isArray(command.actions)?command.actions:[];command.missions=Array.isArray(command.missions)?command.missions:[];command.actions.push({id:'recette-import-confirmation',title:'RECETTE-IMPORT-UNIQUEMENT',status:'todo'});const envelope={format:'control-v2-plain',created:'2026-10-22T10:00:00Z',data:{command,hub:JSON.parse(localStorage.getItem('control-hub-v2')||'{}'),automations:JSON.parse(localStorage.getItem('control-automations-v1')||'{}')}};const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(envelope)],'recette.json',{type:'application/json'}));const form=document.querySelector('#import-data');form.elements.file.files=dt.files;form.requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 assert.match(await js("document.querySelector('#import-comparison').textContent"),/Avant de remplacer mes données/);
 assert.deepEqual(await js("({command:localStorage.getItem('control-command-v1'),hub:localStorage.getItem('control-hub-v2'),autos:localStorage.getItem('control-automations-v1')})"),backupBefore,'Review must not mutate local storage');
 await js("(()=>{const before=localStorage.getItem('control-command-v1');localStorage.setItem('control-command-v1',before+' ');document.querySelector('#import-apply').click()})()");
 assert.equal(await js("document.querySelector('#import-preview').hidden"),true,'Review is invalid after a concurrent write');
 assert.match(await js("document.querySelector('#import-status').textContent"),/ont changé/);
 await js("(()=>{const text=localStorage.getItem('control-command-v1');localStorage.setItem('control-command-v1',text.slice(0,-1));document.querySelector('#import-data').requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 await js("document.querySelector('#import-cancel').click()");
 assert.equal(await js("document.querySelector('#import-preview').hidden"),true);
 assert.deepEqual(await js("({command:localStorage.getItem('control-command-v1'),hub:localStorage.getItem('control-hub-v2'),autos:localStorage.getItem('control-automations-v1')})"),backupBefore);
 await js("document.querySelector('#import-data').requestSubmit()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 await js("(()=>{const confirmBefore=window.confirm;window.confirm=()=>false;try{document.querySelector('#import-apply').click()}finally{window.confirm=confirmBefore}})()");
 assert.equal(await js("document.querySelector('#import-preview').hidden"),false,'Declining restore must preserve preview');
 assert.deepEqual(await js("({command:localStorage.getItem('control-command-v1'),hub:localStorage.getItem('control-hub-v2'),autos:localStorage.getItem('control-automations-v1')})"),backupBefore);
 await js("(()=>{const confirmBefore=window.confirm;window.confirm=()=>true;try{document.querySelector('#import-apply').click()}finally{window.confirm=confirmBefore}})()");
 assert.equal(await js("JSON.parse(localStorage.getItem('control-command-v1')).actions.some(x=>x.title==='RECETTE-IMPORT-UNIQUEMENT')"),true);
 assert.equal(await js("document.querySelector('#import-preview').hidden"),true);
 log('backup preview blocks silent overwrites, canceled restores and stale snapshots; confirmed data is imported');

 // A rejected second-store write must roll back the first store, not claim a completed restore.
 await js("(()=>{window.__backupQuotaBefore={command:localStorage.getItem('control-command-v1'),hub:localStorage.getItem('control-hub-v2'),autos:localStorage.getItem('control-automations-v1')};document.querySelector('#import-data').requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 await js("(()=>{const native=Storage.prototype.setItem;const yes=window.confirm;let blocked=false;Storage.prototype.setItem=function(key,value){if(key==='control-hub-v2'&&!blocked){blocked=true;throw new DOMException('quota','QuotaExceededError')}return native.call(this,key,value)};window.confirm=()=>true;try{document.querySelector('#import-apply').click()}finally{Storage.prototype.setItem=native;window.confirm=yes}})()");
 assert.equal(await js("localStorage.getItem('control-command-v1')"),await js("window.__backupQuotaBefore.command"),'Command store must roll back if the hub write fails');
 assert.equal(await js("localStorage.getItem('control-hub-v2')"),await js("window.__backupQuotaBefore.hub"));
 assert.match(await js("document.querySelector('#import-status').textContent"),/Restauration refusée/);
 await js("(()=>{localStorage.setItem('control-hub-v2','{invalid-hub');document.querySelector('#import-data').requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 assert.match(await js("document.querySelector('#import-comparison').textContent"),/espace\(s\) locaux sont illisibles/);
 await js("(()=>{const original=window.confirm;window.confirm=()=>true;try{document.querySelector('#import-apply').click()}finally{window.confirm=original}})()");
 assert.equal(await js("localStorage.getItem('control-hub-v2')!=='{invalid-hub'"),true,'Confirmed backup import repairs malformed hub state');
 await js("delete window.__backupQuotaBefore");
 log('backup restore rolls back on a denied storage write and repairs unreadable local records with explicit consent');


 await js("location.hash="+JSON.stringify(beforeFinderHash));
 await ready(()=>js("!!document.querySelector('.control-delivery-focus')"),8000)();

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
  assert.ok(swCaches.every(name=>cacheNames.includes(name)),'PWA must have installed the cache versions declared by the checked-out service worker: '+swCaches.join(' & '));
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
    await js("location.hash='#/control/calendar'");
    await ready(()=>js("!!document.querySelector('#new-event')&&typeof window.CONTROL_CALENDAR_CORE?.icalEvent==='function'"),10000)();
    log('offline CONTROL calendar remains functional without remote services');
    await js("location.hash='#/control/webbuilder'");
    await ready(()=>js("!!document.querySelector('#builder-form')&&!!document.querySelector('#builder-preview')&&!!document.querySelector('#builder-preview').srcdoc.includes('Notre expertise.')"),14000)();
    log('offline site builder renders usable sandbox preview');
    await js("(()=>{const f=document.querySelector('#builder-form');f.elements.siteStructure.value='multipage';f.elements.siteStructure.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-builder-page=contact]').click()})()");
    assert.match(await js("document.querySelector('#builder-preview').srcdoc"),/PRENONS CONTACT/);
    log('offline multi-page preview also works without the network');
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
 assert.match(cloudState.screen||'',/CONTROL Cloud : base prête, accès en validation/);
 assert.match(await js("document.querySelector('#setup').textContent"),/En attente : deux connexions Supabase Auth réelles/);
 assert.match(await js("document.querySelector('#setup').textContent"),/Les inscriptions ne sont pas encore ouvertes/);
 log('Cloud setup shows installed independent backend but blocks private sign-in until genuine JWT A-B tests');

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
