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
const PUBLIC_ASSETS=['service-worker.js','index.html','app.html','legacy.html','testeurs.html','assets/control-brand-global.css','config/cloud.json','assets/cloud-app.js','assets/control-operator.js','assets/control-operator-core.js','assets/control-backup-review.js','assets/control-data-audit.js','assets/control-data-audit.css','assets/control-clients.js','assets/control-clients.css','assets/control-ai-studio-core.js','assets/control-ai-studio.js','assets/control-ai-studio.css','assets/control-web-builder.js','assets/control-web-builder-ui.js','assets/control-web-builder.css','assets/command-center.js','assets/control-delivery.js','assets/control-delivery.css','assets/navigation-hub.js','assets/navigation-hub.css','assets/control-onboarding.js','testeurs.html','assets/control-test-pilot.js','assets/control-test-pilot.css','data/control-pilot-chatgpt.json','data/control-ia-delivery.json','data/control-ia-requirements.json'];
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
let profile=mkdtempSync(join(tmpdir(),'control-ia-browser-'));
const profiles=[profile];
let socketClosed=false;
try{
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes)});
 const port=server.address().port;
 const candidates=[process.env.CHROME_BIN,'google-chrome','google-chrome-stable','chromium','chromium-browser'].filter(Boolean);
 const binary=candidates.find(c=>spawnSync('which',[c],{stdio:'ignore'}).status===0);
 assert.ok(binary,'No preinstalled Chromium/Chrome found. Browser verification cannot be declared successful.');
 let debugPort=0,chromeError='';
 const startupFailures=[];
 for(let attempt=1;attempt<=2;attempt++){
  chromeError='';
  browser=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe'],detached:true});
  browser.stderr?.on('data',chunk=>{chromeError+=String(chunk).slice(-900);chromeError=chromeError.slice(-1800)});
  try{debugPort=await waitPort();break}
  catch(error){
   startupFailures.push('attempt '+attempt+': process '+String(browser.exitCode)+' · '+String(error.message)+' · '+chromeError.slice(-500));
   const previous=browser;
   const exited=previous.exitCode!==null?Promise.resolve():new Promise(resolve=>previous.once('exit',resolve));
   try{if(process.platform!=='win32')process.kill(-previous.pid,'SIGTERM');else previous.kill('SIGTERM')}catch{}
   await Promise.race([exited,delay(1700)]);
   if(previous.exitCode===null){try{if(process.platform!=='win32')process.kill(-previous.pid,'SIGKILL');else previous.kill('SIGKILL')}catch{}}
   if(attempt===2)throw Error('Chrome startup failed after two isolated profiles: '+startupFailures.join(' | '));
   // Runner startup races should not poison the retry's isolated browser profile.
   profile=mkdtempSync(join(tmpdir(),'control-ia-browser-'));profiles.push(profile);
   process.stderr.write('BROWSER STARTUP RETRY — DevTools unavailable; launching fresh profile once.\n');
  }
 }
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
 const approveIntegrity=()=>js("(()=>{const box=document.querySelector('#import-integrity-consent');if(box&&!box.hidden){const input=document.querySelector('#import-integrity-ack');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));}return true})()");
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

 // Brand QA in Chromium: eight real modules, not only a static CSS declaration.
 const warmBg='rgb(255, 248, 242)',warmTint='rgb(255, 240, 229)';
 const themedRoutes=[
  ['localai','.loc-shell','.loc-badge'],
  ['lab','.lab-shell','.lab-pill'],
  ['catalog','.tool-page','.tool-total'],
  ['deploy','.deploy-page','.deploy-duration'],
  ['command','.cmd-shell','.cmd-tag'],
  ['meetings','.vs-page','.vs-label'],
  ['aistudio','.as-shell','.as-local-tag'],
  ['webbuilder','.web-builder','.web-builder-panel']
 ];
 for(const [route,mainSelector,accentSelector] of themedRoutes){
  await js("location.hash="+JSON.stringify('#/control/'+route));
  await ready(()=>js("!!document.querySelector("+JSON.stringify(mainSelector)+")&&!!document.querySelector("+JSON.stringify(accentSelector)+")"),9000)();
  const skin=await js("(()=>{const a=document.querySelector("+JSON.stringify(accentSelector)+");return {background:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,accent:getComputedStyle(a).backgroundColor}})()");
  assert.equal(skin.background,warmBg,'Cold application background on '+route);
  assert.match(skin.font,/Poppins/i,'Poppins missing on '+route);
  assert.equal(skin.accent,route==='webbuilder'?'rgb(255, 255, 255)':warmTint,'Non-brand surface on '+route);
  const blue=await js("(()=>{const r=document.querySelector('#main');if(!r)return[];const rows=[];const blue=x=>{const m=x.match(/^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)$/);if(!m||(+m[4]||1)<.45)return false;const [rr,g,b]=m.slice(1,4).map(Number);return b>rr+24&&b>g+13};for(const e of [...r.querySelectorAll('*')].slice(0,550)){if(!e.getClientRects().length)continue;const c=getComputedStyle(e);for(const prop of ['color','backgroundColor','borderTopColor']){const value=c[prop];if(blue(value))rows.push({className:String(e.className||'').slice(0,65),tag:e.tagName,color:value,property:prop})}}return rows.slice(0,9)})()");
  if(blue.length)log('Theme color audit '+route,blue.length+' example(s): '+JSON.stringify(blue.slice(0,4)));
 }
 log('Simple & Humain: eight functional screens use cream, Poppins and warm surfaces in Chromium');

 // Beyond the eight dedicated modules, inspect every local management route.
 const managementRoutes=['manager','inbox','missions','clients','backup','search','team',
  'audit','settings','calendar','library','goals','budget','activity','memory','tools'];
 for(const route of managementRoutes){
  await js("location.hash="+JSON.stringify('#/control/'+route));
  await delay(110);
  const viewTheme=await js("({route:location.hash,hasContent:!!document.querySelector('#main')?.textContent?.trim(),body:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,stylesheet:!!document.querySelector('link[href$=\"control-brand-global.css\"]')})");
  assert.equal(viewTheme.route,'#/control/'+route);
  assert.equal(viewTheme.hasContent,true,route+' is missing its functional body');
  assert.equal(viewTheme.body,warmBg,route+' uses an old page background');
  assert.match(viewTheme.font,/Poppins/i,route+' font');
  assert.equal(viewTheme.stylesheet,true,route+' has no final brand sheet');
 }
 log('Simple & Humain: sixteen management routes render their actual content with the common palette');
 await js("location.hash='#/'");
 await delay(150);
 const homeTheme=await js("({bg:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,pilot:getComputedStyle(document.querySelector('.control-home-v6-pilot')).backgroundColor})");
 assert.equal(homeTheme.bg,warmBg);
 assert.match(homeTheme.font,/Poppins/i);
 assert.equal(homeTheme.pilot,warmTint);
 log('Simple & Humain: homepage and tester invitation match the common brand');



 // The home screen must show new capabilities without requiring hidden tool navigation.
 await js("location.hash='#/'");
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('.control-home-v6 .control-home-v6-stats')"),9000)();
 const businessHome=await js("({title:document.querySelector('.control-home-v6 h1')?.textContent||'',brand:document.querySelector('.control-home-v6-brand')?.textContent||'',metrics:document.querySelectorAll('.control-home-v6-stat').length,ask:!!document.querySelector('.control-home-v6-ask #shell-quick-find'),priority:!!document.querySelector('.control-home-v6-priorities'),tabs:document.querySelectorAll('.control-home-v6-tabs > a, .control-home-v6-tabs > button').length,sidebar:getComputedStyle(document.querySelector('.shell-sidebar')).display,projects:document.querySelector('#control-home-projects')?.open,provenance:document.querySelector('.control-home-v6-provenance')?.textContent||'',legacyHero:!!document.querySelector('.shell-feature-primary')})");
 assert.match(businessHome.title,/Bonjour/);
 assert.match(businessHome.brand,/CONTROL.*Mon entreprise/s);
 assert.equal(businessHome.metrics,3);
 assert.equal(businessHome.ask,true);
 assert.equal(businessHome.priority,true);
 assert.equal(businessHome.tabs,4);
 assert.equal(businessHome.sidebar,'none');
 assert.equal(businessHome.projects,false);
 assert.equal(businessHome.legacyHero,false);
 assert.match(businessHome.provenance,/sur cet appareil/);
 log('CONTROL 06 home matches approved compact entrepreneur structure, not old blue hero');
 // CONTROL 21: the guide appears on a genuinely fresh device, never on a fake account.
 const welcome=await js("({steps:document.querySelectorAll('#control-onboarding .control-home-v6-onboarding-step').length,progress:document.querySelector('.control-home-v6-onboarding-progress')?.textContent,first:document.querySelector('#control-onboarding a[aria-current=step]')?.getAttribute('href')})");
 assert.deepEqual(welcome,{steps:3,progress:'0 / 3 étapes',first:'#/new-project'});
 await js("document.querySelector('#control-onboarding a[aria-current=step]').click()");
 await ready(()=>js("location.hash==='#/new-project'&&document.querySelector('#add-box')&&!document.querySelector('#add-box').classList.contains('hidden')"),8000)();
 assert.equal(await js("document.activeElement?.getAttribute('name')"),'name');
 await js("document.querySelector('#cancel-add-project').click()");
 await ready(()=>js("location.hash==='#/'&&!!document.querySelector('#control-onboarding')"),7000)();
 assert.equal(await js("document.querySelector('.control-home-v6-onboarding-progress').textContent"),'0 / 3 étapes');
 log('CONTROL 21: fresh-device guide opens real project creation, focuses name and cancels without fake progress');

 // New visible delivery: create a real task directly from the home priorities
 // without requiring the user to discover the separate task screen first.
 const homeCreate=await js("({link:document.querySelector('.control-home-v6-new-task')?.getAttribute('href'),label:document.querySelector('.control-home-v6-new-task')?.textContent,emptyLink:document.querySelector('.control-home-v6-empty-start')?.getAttribute('href')||null})");
 assert.equal(homeCreate.link,'#/control/inbox/new');
 assert.match(homeCreate.label,/Nouvelle tâche/);
 await js("document.querySelector('.control-home-v6-new-task').click()");
 await ready(()=>js("location.hash==='#/control/inbox/new'&&!!document.querySelector('#new-action input[name=title]')"),8000)();
 assert.equal(await js("document.activeElement?.getAttribute('name')"),'title');
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('.control-home-v6-new-task')"),8000)();
 log('CONTROL 20: home quick task opens the real editable task form and autofocuses the title');


 // Home project navigation reveals real project cards, preserving search and creation.
 await js("document.querySelector('#control-home-nav-projects').click()");
 await ready(()=>js("location.hash==='#/projects'&&document.querySelector('#control-home-projects')?.open===true"),8000)();
 assert.equal(await js("document.querySelector('#control-home-projects').open"),true);
 assert.equal(await js("!!document.querySelector('#cards')"),true);
 assert.equal(await js("!!document.querySelector('#add-project')"),true);
 await js("location.hash='#/control/goals'");
 await ready(()=>js("!!document.querySelector('#goal-request')"),9000)();
 log('goal planner remains accessible after the homepage redesign');
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('.control-home-v6')"),7000)();

 // Verify at the two common small Android widths; no offscreen overflow.
 for(const width of [390,320]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:2,mobile:true});
  await delay(220);
  const view=await js("({inner:innerWidth,scroll:document.documentElement.scrollWidth,metrics:document.querySelectorAll('.control-home-v6-stat').length,tabs:document.querySelectorAll('.control-home-v6-tabs>a,.control-home-v6-tabs>button').length,oldNav:getComputedStyle(document.querySelector('.mobilefoot')).display})");
  assert.equal(view.metrics,3);
  assert.equal(view.tabs,4);
  assert.equal(view.oldNav,'none');
  assert.ok(view.scroll<=view.inner+4,'CONTROL 06 mobile horizontal overflow at '+width+': '+JSON.stringify(view));
 }
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await js("document.querySelector('.control-home-v6-tabs a[href=\"#/control/team\"]').click()");
 await ready(()=>js("document.querySelector('#main h1')?.textContent==='Équipe'"),7000)();
 assert.match(await js("document.querySelector('#main').textContent"),/pas encore activée/);
 const innerShell=await js("({rail:getComputedStyle(document.querySelector('.shell-sidebar')).display,nav:document.querySelectorAll('.control-workspace-mainnav a').length,body:document.body.classList.contains('control-simple-workspace'),selected:document.querySelector('.control-workspace-mainnav [data-workspace-nav=team]')?.getAttribute('aria-current')})");
 assert.equal(innerShell.rail,'none','Old sidebar must be hidden on inner screens');
 assert.equal(innerShell.nav,4,'Only four primary navigation choices on inner screens');
 assert.equal(innerShell.body,true);
 assert.equal(innerShell.selected,'page');
 await js("document.querySelector('.control-quick-task').click()");
 await ready(()=>js("location.hash==='#/control/inbox/new'&&!!document.querySelector('#new-action input[name=title]')"),7000)();
 assert.equal(await js("document.activeElement?.getAttribute('name')"),'title');
 log('CONTROL 07: direct create-task shortcut opens and focuses the existing form');
 await js("location.hash='#/projects'");
 await ready(()=>js("!!document.querySelector('.control-home-v6--projects #cards')"),7000)();
 assert.equal(await js("document.querySelector('#control-home-projects').open"),true);
 assert.equal(await js("getComputedStyle(document.querySelector('.control-home-v6-ask')).display"),'none');
 log('CONTROL 07: Projects is a focused screen, not a deep hidden panel');
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('.control-home-v6-tabs a[href=\"#/control/aistudio\"]')"),7000)();
 await js("document.querySelector('.control-home-v6-tabs a[href=\"#/control/aistudio\"]').click()");
 await ready(()=>js("!!document.querySelector('[data-as-tab=agents]')"),7000)();
 assert.equal(await js("location.hash"),'#/control/aistudio');
 log('CONTROL 06 responsive homepage and four destinations verified in Chromium');
 await command('Emulation.setDeviceMetricsOverride',{width:390,height:740,deviceScaleFactor:2,mobile:true});
 await js("location.hash='#/control/inbox'");
 await ready(()=>js("!!document.querySelector('#control-task-search')"),8000)();
 const smallShell=await js("({count:document.querySelectorAll('.control-workspace-mainnav a').length,position:getComputedStyle(document.querySelector('.control-workspace-mainnav')).position,bottom:getComputedStyle(document.querySelector('.control-workspace-mainnav')).bottom,rail:getComputedStyle(document.querySelector('.shell-sidebar')).display,overflow:document.documentElement.scrollWidth,width:innerWidth})");
 assert.equal(smallShell.count,4);
 assert.equal(smallShell.position,'fixed','Mobile workspace navigation must remain on screen');
 assert.equal(smallShell.bottom,'0px');
 assert.equal(smallShell.rail,'none');
 assert.ok(smallShell.overflow<=smallShell.width+4,'Compact inner screen should not scroll horizontally: '+JSON.stringify(smallShell));
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 log('CONTROL 07: mobile task list retains the same four-tab navigation as home');

 // P0 reliability: integrity report is read-only and reachable via backup.
 await js("(()=>{window.__auditBefore=localStorage.getItem('control-command-v1');location.hash='#/control/audit'})()");
 await ready(()=>js("!!document.querySelector('.control-audit-stats')"),8000)();
 const auditScreen=await js("({summary:document.querySelector('.control-audit-stats')?.textContent||'',hasActions:!!document.querySelector('.control-audit-result'),backup:!!document.querySelector('a[href=\"#/control/backup\"]'),unchanged:localStorage.getItem('control-command-v1')===window.__auditBefore})");
 assert.ok(auditScreen.hasActions);
 assert.ok(auditScreen.backup);
 assert.equal(auditScreen.unchanged,true,'Read-only audit must not touch personal data');
 await js("document.querySelector('[data-act=rerun-audit]').click()");
 assert.equal(await js("localStorage.getItem('control-command-v1')===window.__auditBefore"),true);
 await js("delete window.__auditBefore");
 log('CONTROL 11: read-only project/client/task integrity report does not mutate storage');

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
  await js("(()=>{const f=document.querySelector('[data-op-form]');f.querySelector('textarea').value="+JSON.stringify(unsafe)+";f.requestSubmit()})()");
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
 await js("document.querySelector('.control-head [data-control-nav-open]').click()");
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
 await js("document.querySelector('.control-head [data-control-nav-open]').click()");
 await ready(()=>js("document.querySelector('.control-finder')?.hidden===false"),8000)();
 assert.equal(await js("!!document.querySelector('.control-finder-recents [data-finder-id=meetings]')"),true,
  'Recently opened visio must be available without searching again');
 await js("document.querySelector('.control-finder-close').click()");
 await js("location.hash="+JSON.stringify(beforeFinderHash));
 await ready(()=>js("!!document.querySelector('.control-delivery-focus')"),8000)();
 log('320px finder finds visio by intent and opens its destination without mobile overflow');
 // Desktop contract: the approved mockup is a centered compact surface, not the
 // old dark navigation rail and giant editorial hero.
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('#main .control-home-v6 .control-home-v6-stats')"),8000)();
 const desktop=await js("(()=>{const rail=document.querySelector('.shell-sidebar'),main=document.querySelector('#main'),card=document.querySelector('.control-home-v6'),brand=card?.querySelector('.control-home-v6-brand'),ask=card?.querySelector('.control-home-v6-ask'),priorities=card?.querySelector('.control-home-v6-priorities');return {width:innerWidth,overflow:document.documentElement.scrollWidth,railHidden:rail&&getComputedStyle(rail).display==='none',cardWidth:card?.getBoundingClientRect().width,mainLeft:main?.getBoundingClientRect().left,hasBrand:!!brand,hasAsk:!!ask,hasPriorities:!!priorities}})()");
 assert.equal(desktop.railHidden,true,'The old sidebar must be hidden on the approved homepage: '+JSON.stringify(desktop));
 assert.ok(desktop.cardWidth>=400&&desktop.cardWidth<=840&&desktop.hasBrand&&desktop.hasAsk&&desktop.hasPriorities,'Desktop home must use the compact mockup layout: '+JSON.stringify(desktop));
 assert.ok(desktop.overflow<=desktop.width+4,'Desktop homepage must not overflow: '+JSON.stringify(desktop));
 await js("document.querySelector('#control-home-nav-projects').click()");
 await ready(()=>js("location.hash==='#/projects'&&document.querySelector('#control-home-projects')?.open===true"),8000)();
 assert.equal(await js("document.querySelector('#control-home-projects').open"),true);
 log('1440px desktop uses centered CONTROL mockup and reveals the real projects on demand');
 // Project discovery should tolerate accents and reordered terms while retaining the right route.
 await js("document.querySelector('#control-home-nav-projects').click()");
 await js("(()=>{const field=document.querySelector('#search');field.value='ifsi revisions';field.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await ready(()=>js("document.querySelectorAll('#cards a.card').length===1"),8000)();
 assert.equal(await js("document.querySelector('#cards a.card strong')?.textContent"),'Révisions IFSI');
 assert.equal(await js("document.querySelector('#project-search-status')?.textContent"),'1 projet trouvé');
 await js("document.querySelector('#cards a.card').click()");
 await ready(()=>js("location.hash==='#/project/ifsi/ai'"),8000)();
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('#shell-quick-query')"),8000)();
 log('desktop project search filters accent-free reversed words and opens the correct project');
 // Direct homepage intent must open the matching function without forcing a menu-first journey.
 await js("(()=>{const field=document.querySelector('#shell-quick-query');field.value='budget';field.form.requestSubmit()})()");
 await ready(()=>js("document.querySelector('.control-finder')?.hidden===false"),8000)();
 assert.equal(await js("!!document.querySelector('.control-finder [data-finder-id=budget]')"),true);
 await js("document.querySelector('.control-finder [data-finder-id=budget]').click()");
 await ready(()=>js("location.hash==='#/control/budget'"),8000)();
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('#shell-quick-query')"),8000)();
 log('desktop homepage intent finds and opens budget without an intermediate category menu');
 // Direct request should lead to the actual new-project form, not merely the project overview.
 await js("(()=>{const field=document.querySelector('#shell-quick-query');field.value='créer un nouveau projet';field.form.requestSubmit()})()");
 await ready(()=>js("!!document.querySelector('.control-finder [data-finder-id=new-project]')"),8000)();
 await js("document.querySelector('.control-finder [data-finder-id=new-project]').click()");
 await ready(()=>js("location.hash==='#/new-project'&&!document.querySelector('#add-box')?.classList.contains('hidden')"),8000)();
 assert.equal(await js("document.activeElement?.getAttribute('name')"),'name');
 await js("document.querySelector('#cancel-add-project').click()");
 await ready(()=>js("location.hash==='#/'&&!!document.querySelector('#add-box')?.classList.contains('hidden')"),8000)();
 log('desktop direct creation request opens focused form, cancels without project mutation');
 // New task intent must open the existing action editor without saving anything automatically.
 const beforeTaskStore=await js("localStorage.getItem('control-command-v1')");
 await js("(()=>{const field=document.querySelector('#shell-quick-query');field.value='créer une tâche';field.form.requestSubmit()})()");
 await ready(()=>js("!!document.querySelector('.control-finder [data-finder-id=new-action]')"),8000)();
 await js("document.querySelector('.control-finder [data-finder-id=new-action]').click()");
 await ready(()=>js("location.hash==='#/control/inbox/new'&&!!document.querySelector('#new-action input[name=\"title\"]')"),8000)();
 assert.equal(await js("document.activeElement?.getAttribute('name')"),'title');
 assert.equal(await js("localStorage.getItem('control-command-v1')"),beforeTaskStore,'Opening task creation must not write a task');
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('#shell-quick-query')"),8000)();
 log('desktop direct task request opens action editor and saves no data until confirmation');
 // UX regression: the project list is available on demand, and advanced
 // project sections remain accessible when opened explicitly.
 await js("document.querySelector('#control-home-nav-projects').click()");
 await ready(()=>js("location.hash==='#/projects'&&document.querySelector('#control-home-projects')?.open===true"),8000)();
 assert.equal(await js("document.querySelector('#control-home-projects').open"),true);
 await js("document.querySelector('#add-project').click()");
 await ready(()=>js("!document.querySelector('#add-box').classList.contains('hidden')"),8000)();
 assert.equal(await js("document.querySelector('#add-project').getAttribute('aria-expanded')"),'true');
 await js("document.querySelector('#cancel-add-project').click()");
 assert.equal(await js("document.querySelector('#add-box').classList.contains('hidden')"),true);
 await js("document.querySelector('.shell-projects-list a.card').click()");
 await ready(()=>js("document.querySelector('.shell-project-navigation')!==null"),8000)();
 const projectNav=await js("({advanced:document.querySelectorAll('.shell-project-more .clarity-advanced [data-tab]').length,open:document.querySelector('.shell-project-more')?.open,computed:getComputedStyle(document.querySelector('.shell-project-more .clarity-advanced')).display})");
 assert.equal(projectNav.advanced,7,'Personal project still has 7 advanced sections');
 assert.ok(!projectNav.open&&projectNav.computed==='none','Secondary project sections should remain collapsed until requested');
 await js("document.querySelector('.shell-project-more>summary').click()");
 assert.equal(await js("document.querySelector('.shell-project-more').open"),true);
 await js("document.querySelector('.shell-project-navigation [data-tab=meetings]').click()");
 await ready(()=>js("location.hash.endsWith('/meetings')"),8000)();
 await js("document.querySelector('[data-control-nav-category=project]').click()");
 await ready(()=>js("document.querySelector('.control-finder')?.hidden===false"),8000)();
 assert.equal(await js("document.querySelector('[data-finder-cat=project]')?.getAttribute('aria-pressed')"),'true');
 assert.equal(await js("document.querySelectorAll('.control-finder-results [data-finder-id^=\"project:\"]').length"),11);
 await js("document.querySelector('[data-finder-id=\"project:lab\"]').click()");
 await ready(()=>js("location.hash.endsWith('/lab')"),8000)();
 // The project finder must expose a real project by name, without losing current context.
 await js("document.querySelector('[data-control-nav-category=project]').click()");
 await ready(()=>js("document.querySelector('.control-finder')?.hidden===false"),8000)();
 await js("(()=>{const p=window.CONTROL_NAVIGATION.getItems().find(x=>x.category==='projects');if(!p)throw Error('No searchable project');const input=document.querySelector('.control-finder-search input');input.value=p.title;input.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await ready(()=>js("!!document.querySelector('.control-finder-results [data-finder-id^=\"open-project:\"]')"),8000)();
 await js("document.querySelector('.control-finder-results [data-finder-id^=\"open-project:\"]').click()");
 await ready(()=>js("location.hash.endsWith('/ai')"),8000)();
 log('desktop project workflow exposes all advanced sections and finds named projects');
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
 await ready(()=>js("!!document.querySelector('.control-home-v6')"),8000)();
 await command('Emulation.setDeviceMetricsOverride',{width:320,height:700,deviceScaleFactor:2,mobile:true});
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('.shell-projects-list a.card')"),8000)();
 await js("document.querySelector('#control-home-nav-projects').click()");
 await ready(()=>js("location.hash==='#/projects'&&document.querySelector('#control-home-projects')?.open===true"),8000)();
 assert.equal(await js("document.querySelector('#control-home-projects').open"),true);
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

 // The user should never need horizontal scrolling to find controls at 320px.
 // Cover the most action-heavy routes, not just the landing page.
 for(const [route,selector] of [
  ['#/control/tools','#tools-filter'],
  ['#/control/backup','#import-data'],
  ['#/control/webbuilder','#builder-form'],
  ['#/control/calendar','#new-event'],
  ['#/control/missions','#mission-create'],
  ['#/control/settings','#global-rules'],
  ['#/control/localai','[data-control-operator]']
 ]){
  await js("location.hash="+JSON.stringify(route));
  await ready(()=>js("!!document.querySelector("+JSON.stringify(selector)+")"),11000)();
  const size=await js("({width:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth})");
  assert.ok(size.scroll<=size.width+4&&size.body<=size.width+4,
   route+' must remain usable without sideways scrolling at 320px: '+JSON.stringify(size));
 }
 log('seven dense CONTROL routes remain within a 320px mobile viewport');


 // The personal project store must never be overwritten after a corrupted read.
 await js("(()=>{const raw=localStorage.getItem('control-hub-v2');sessionStorage.setItem('control-smoke-hub-before',raw===null?'__ABSENT__':raw);localStorage.setItem('control-hub-v2','{invalid-hub');location.hash='#/'})()");
 await command('Page.reload',{ignoreCache:false});
 await ready(()=>js("!!document.querySelector('.control-home-v6')&&!!document.querySelector('#main [role=alert]')"),16000)();
 const hubWarn=await js("document.querySelector('#main [role=alert]')?.textContent||''");
 assert.match(hubWarn,/données locales des projets sont illisibles/);
 await js("document.querySelector('#add-project').click()");
 await ready(()=>js("!document.querySelector('#add-box')?.classList.contains('hidden')"),6000)();
 await js("(()=>{const f=document.querySelector('#new-project');f.elements.name.value='Projet qui ne doit pas exister';f.requestSubmit()})()");
 assert.equal(await js("localStorage.getItem('control-hub-v2')"),'{invalid-hub','Corrupted original project storage must remain untouched');
 assert.ok(!(await js("document.querySelector('#cards')?.textContent?.includes('Projet qui ne doit pas exister')")),'Unsaved project must not appear');
 await js("(()=>{const previous=sessionStorage.getItem('control-smoke-hub-before');if(previous==='__ABSENT__')localStorage.removeItem('control-hub-v2');else localStorage.setItem('control-hub-v2',previous);sessionStorage.removeItem('control-smoke-hub-before');location.hash='#/'})()");
 await command('Page.reload',{ignoreCache:false});
 await ready(()=>js("!!document.querySelector('.control-home-v6')&&!document.querySelector('#main [role=alert]')"),16000)();
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
 await ready(()=>js("!!document.querySelector('.control-home-v6')"),16000)();
 log('corrupt automation drafts block new entries without enabling scheduled tasks');

 // A new encrypted or plain backup must be inspected before any local overwrite.
 await js("location.hash='#/control/backup'");
 await ready(()=>js("!!document.querySelector('#import-data')&&!!document.querySelector('#import-preview')"),10000)();
 await ready(()=>js("typeof window.CONTROL_BACKUP_REVIEW?.applyTransaction==='function'"),10000)();
 assert.equal(await js("typeof window.CONTROL_BACKUP_REVIEW?.applyTransaction"),'function',
  'The published browser must load the transaction writer before any restoration');
 log('CONTROL 15: browser contains the transaction-safe restore engine');

 const backupBefore=await js("({command:localStorage.getItem('control-command-v1'),hub:localStorage.getItem('control-hub-v2'),autos:localStorage.getItem('control-automations-v1')})");
 // CONTROL 14: a portable custom project must be counted even when hub.projects is absent.
 await js("(()=>{const command=JSON.parse(localStorage.getItem('control-command-v1')||'{}');const hub=JSON.parse(localStorage.getItem('control-hub-v2')||'{}');hub.custom=[...(Array.isArray(hub.custom)?hub.custom:[]),{id:'custom-restore-count-test',name:'Dossier confidentiel de test'}];const envelope={format:'control-v2-plain',created:'2026-11-05T10:00:00Z',data:{command,hub,automations:JSON.parse(localStorage.getItem('control-automations-v1')||'{}')}};const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(envelope)],'projet-test.json',{type:'application/json'}));const form=document.querySelector('#import-data');form.elements.file.files=dt.files;form.requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 const projectImportPreview=await js("(()=>{const row=[...document.querySelectorAll('.backup-diff-table tbody tr')].find(x=>x.querySelector('th')?.textContent?.includes('Projets personnalisés'));const cells=row?[...row.querySelectorAll('td')].map(x=>Number(x.textContent)):[];return {hasRow:!!row,before:cells[0],after:cells[1],storageUnchanged:localStorage.getItem('control-hub-v2')!==null}})()");
 assert.equal(projectImportPreview.hasRow,true,'Custom projects must be visible in the backup comparison');
 assert.equal(projectImportPreview.after,projectImportPreview.before+1,'One imported custom project must add one project, not zero');
 await js("document.querySelector('#import-cancel').click()");
 assert.equal(await js("localStorage.getItem('control-hub-v2')"),backupBefore.hub,'Inspecting and cancelling project import must not write');
 log('CONTROL 14: imported custom projects are counted without mutating local project data');

 // CONTROL 17: user receives an actionable error for JSON that lacks a CONTROL backup envelope.
 await js("(()=>{const payload={command:{actions:[],missions:[]},hub:{custom:[]},automations:{entries:[]}};const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(payload)],'pas-une-sauvegarde.json',{type:'application/json'}));const form=document.querySelector('#import-data');form.elements.file.files=dt.files;form.requestSubmit();return true})()");
 await ready(()=>js("document.querySelector('#import-status')?.textContent.includes('ne correspond pas à une sauvegarde CONTROL')"),10000)();
 assert.equal(await js("document.querySelector('#import-preview').hidden"),true);
 assert.deepEqual(await js("({command:localStorage.getItem('control-command-v1'),hub:localStorage.getItem('control-hub-v2'),autos:localStorage.getItem('control-automations-v1')})"),backupBefore);
 log('CONTROL 17: unknown backup format is rejected with a human-readable explanation');

 // CONTROL 16: malformed projects must remain non-restorable even on forced handler execution.
 // Use an exact versioned fixture, including the required control-v2-plain envelope.
 const duplicateFixture=JSON.parse(readFileSync(resolve(root,'tests/fixtures/control-backup-duplicate-project-fictif.json'),'utf8'));
 assert.equal(duplicateFixture.format,'control-v2-plain');
 await js(`(()=>{const envelope=${JSON.stringify(duplicateFixture)};const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(envelope)],'control-backup-duplicate-project-fictif.json',{type:'application/json'}));const form=document.querySelector('#import-data');form.elements.file.files=dt.files;form.requestSubmit();return true})()`);
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 const duplicateReview=await js("({blocked:document.querySelector('#import-apply').disabled,warning:document.querySelector('#import-integrity').textContent,consentHidden:document.querySelector('#import-integrity-consent').hidden})");
 assert.equal(duplicateReview.blocked,true,'Duplicate custom-project IDs must block restoration');
 assert.equal(duplicateReview.consentHidden,true,'Unsafe project ID collisions must not be overridable by acknowledgement');
 assert.match(duplicateReview.warning,/Restauration impossible/);
 assert.match(duplicateReview.warning,/Identifiant répété/);
 await js("document.querySelector('#import-apply').onclick()");
 assert.deepEqual(await js("({command:localStorage.getItem('control-command-v1'),hub:localStorage.getItem('control-hub-v2'),autos:localStorage.getItem('control-automations-v1')})"),backupBefore,
  'Calling a disabled apply handler directly must not modify data');
 await js("document.querySelector('#import-cancel').click()");
 assert.equal(await js("document.querySelector('#import-preview').hidden"),true);
 log('CONTROL 16: duplicate project fixture blocked; direct handler invocation cannot bypass data validation');


 // Imported data with a broken client reference must be shown and blocked until a separate acknowledgement.
 await js("(()=>{const command=JSON.parse(localStorage.getItem('control-command-v1')||'{}');command.actions=Array.isArray(command.actions)?command.actions:[];command.missions=Array.isArray(command.missions)?command.missions:[];command.actions.push({id:'restore-audit-bad-link',title:'Test de lien client invalide',status:'todo',clientId:'client-introuvable-pour-test'});const envelope={format:'control-v2-plain',created:'2026-11-05T10:00:00Z',data:{command,hub:JSON.parse(localStorage.getItem('control-hub-v2')||'{}'),automations:JSON.parse(localStorage.getItem('control-automations-v1')||'{}')}};const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(envelope)],'anomalie.json',{type:'application/json'}));const form=document.querySelector('#import-data');form.elements.file.files=dt.files;form.requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 const restoreWarning=await js("({disabled:document.querySelector('#import-apply').disabled,warning:document.querySelector('#import-integrity').textContent,consent:document.querySelector('#import-integrity-consent').hidden,before:localStorage.getItem('control-command-v1')})");
 assert.equal(restoreWarning.disabled,true,'Unsafe imported client link must hold restore action');
 assert.equal(restoreWarning.consent,false,'Acknowledgement must be visible for anomalies');
 assert.match(restoreWarning.warning,/erreur/);
 assert.equal(restoreWarning.before,backupBefore.command,'Preflight must never overwrite data');
 await js("document.querySelector('#import-apply').click()");
 assert.equal(await js("localStorage.getItem('control-command-v1')"),backupBefore.command,'Unacknowledged restore must not write');
 await js("(()=>{const ack=document.querySelector('#import-integrity-ack');ack.checked=true;ack.dispatchEvent(new Event('change',{bubbles:true}))})()");
 assert.equal(await js("document.querySelector('#import-apply').disabled"),false,'Opt-in unlocks restore but does not apply it');
 await js("document.querySelector('#import-cancel').click()");
 assert.equal(await js("document.querySelector('#import-preview').hidden"),true);
 assert.equal(await js("localStorage.getItem('control-command-v1')"),backupBefore.command);
 log('CONTROL 12: imported broken client references require explicit opt-in, cancellation preserves storage');

 await js("(()=>{const command=JSON.parse(localStorage.getItem('control-command-v1')||'{}');command.actions=Array.isArray(command.actions)?command.actions:[];command.missions=Array.isArray(command.missions)?command.missions:[];command.actions.push({id:'recette-import-confirmation',title:'RECETTE-IMPORT-UNIQUEMENT',status:'todo'});const envelope={format:'control-v2-plain',created:'2026-10-22T10:00:00Z',data:{command,hub:JSON.parse(localStorage.getItem('control-hub-v2')||'{}'),automations:JSON.parse(localStorage.getItem('control-automations-v1')||'{}')}};const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(envelope)],'recette.json',{type:'application/json'}));const form=document.querySelector('#import-data');form.elements.file.files=dt.files;form.requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 await approveIntegrity();
 assert.match(await js("document.querySelector('#import-comparison').textContent"),/Avant de remplacer mes données/);
 assert.deepEqual(await js("({command:localStorage.getItem('control-command-v1'),hub:localStorage.getItem('control-hub-v2'),autos:localStorage.getItem('control-automations-v1')})"),backupBefore,'Review must not mutate local storage');
 await js("(()=>{const before=localStorage.getItem('control-command-v1');localStorage.setItem('control-command-v1',before+' ');document.querySelector('#import-apply').click()})()");
 assert.equal(await js("document.querySelector('#import-preview').hidden"),true,'Review is invalid after a concurrent write');
 assert.match(await js("document.querySelector('#import-status').textContent"),/ont changé/);
 await js("(()=>{const text=localStorage.getItem('control-command-v1');localStorage.setItem('control-command-v1',text.slice(0,-1));document.querySelector('#import-data').requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 await approveIntegrity();
 await js("document.querySelector('#import-cancel').click()");
 assert.equal(await js("document.querySelector('#import-preview').hidden"),true);
 assert.deepEqual(await js("({command:localStorage.getItem('control-command-v1'),hub:localStorage.getItem('control-hub-v2'),autos:localStorage.getItem('control-automations-v1')})"),backupBefore);
 await js("document.querySelector('#import-data').requestSubmit()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 await approveIntegrity();
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
 await approveIntegrity();
 await js("(()=>{const native=Storage.prototype.setItem;const yes=window.confirm;let blocked=false;Storage.prototype.setItem=function(key,value){if(key==='control-hub-v2'&&!blocked){blocked=true;throw new DOMException('quota','QuotaExceededError')}return native.call(this,key,value)};window.confirm=()=>true;try{document.querySelector('#import-apply').click()}finally{Storage.prototype.setItem=native;window.confirm=yes}})()");
 assert.equal(await js("localStorage.getItem('control-command-v1')"),await js("window.__backupQuotaBefore.command"),'Command store must roll back if the hub write fails');
 assert.equal(await js("localStorage.getItem('control-hub-v2')"),await js("window.__backupQuotaBefore.hub"));
 assert.match(await js("document.querySelector('#import-status').textContent"),/Restauration refusée/);
 await js("(()=>{localStorage.setItem('control-hub-v2','{invalid-hub');document.querySelector('#import-data').requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 await approveIntegrity();
 assert.match(await js("document.querySelector('#import-comparison').textContent"),/espace\(s\) locaux sont illisibles/);
 await js("(()=>{const original=window.confirm;window.confirm=()=>true;try{document.querySelector('#import-apply').click()}finally{window.confirm=original}})()");
 assert.equal(await js("localStorage.getItem('control-hub-v2')!=='{invalid-hub'"),true,'Confirmed backup import repairs malformed hub state');
 await js("delete window.__backupQuotaBefore");
 log('backup restore rolls back on a denied storage write and repairs unreadable local records with explicit consent');

 // Same item counts must not conceal changed content during restore preview.
 await js("(()=>{const command=JSON.parse(localStorage.getItem('control-command-v1'));if(!command.actions?.length)throw Error('Missing synthetic action');command.actions[0].title='PRIVATE CONTENT MUST NOT LEAK TO REVIEW';const payload={format:'control-v2-plain',created:'2026-10-22T12:00:00Z',data:{command,hub:JSON.parse(localStorage.getItem('control-hub-v2')||'{}'),automations:JSON.parse(localStorage.getItem('control-automations-v1')||'{}')}};const transfer=new DataTransfer();transfer.items.add(new File([JSON.stringify(payload)],'safe-preview.json',{type:'application/json'}));const form=document.querySelector('#import-data');form.elements.file.files=transfer.files;form.requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),10000)();
 await approveIntegrity();
 const detail=await js("({text:document.querySelector('#import-comparison').textContent,table:document.querySelector('.backup-diff-table')?.textContent,cols:document.querySelectorAll('.backup-diff-table thead th').length})");
 assert.equal(detail.cols,6);
 assert.match(detail.text,/Modifications identifiées : 1/);
 assert.match(detail.table,/Ajouts/);
 assert.match(detail.table,/Modifiés/);
 assert.doesNotMatch(detail.text,/PRIVATE CONTENT MUST NOT LEAK/,'A comparison must never reveal private values');
 await js("document.querySelector('#import-cancel').click()");
 assert.equal(await js("document.querySelector('#import-preview').hidden"),true);
 log('backup detects same-count content edits and shows only redacted change counts');



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


 // Real personal AI Studio flow: the upload is synthetic and never leaves this browser.
 await js("location.hash='#/control/aistudio'");
 await ready(()=>js("!!document.querySelector('.as-provider-grid')&&!!document.querySelector('[data-as-tab=agents]')"),12000)();

 assert.equal(await js("document.querySelectorAll('.as-journey-step').length"),3);
 await js("document.querySelector('.as-journey-step[data-as-tab=agents]').click()");
 await ready(()=>js("!!document.querySelector('#as-agent-form')"),7000)();
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')||'{\"agents\":[]}').agents.length"),0,'Opening guide does not create an assistant');
 await js("document.querySelector('.as-steps [data-as-tab=accounts]').click()");
 await ready(()=>js("!!document.querySelector('[data-as-action=show-archives]')"),7000)();
 log('CONTROL 26: optional assistant journey navigates to the real form without importing or creating data');
 assert.equal(await js("document.querySelectorAll('.as-connect-card').length"),3);
 assert.equal(await js("document.querySelectorAll('.as-connect-card button:not(:disabled)').length"),0,'No fake login');
 assert.match(await js("document.querySelector('.as-connect-counter').textContent"),/0 compte lié/);
 await js("document.querySelector('[data-as-action=show-archives]').click()");
 await ready(()=>js("!!document.querySelector('#as-import-form')"),6000)();
 assert.match(await js("document.querySelector('.as-heading h1').textContent"),/Comptes IA/);
 assert.ok(await js("!!document.querySelector('.shell-sidebar a[data-shell-route=aistudio]')"),'AI Studio must be a visible navigation destination');
 await js("(()=>{const data=[{id:'smoke-1',title:'Décisions UX du projet',current_node:'final',mapping:{first:{parent:null,message:{author:{role:'user'},content:{parts:['La version mobile est prioritaire.']},create_time:1}},final:{parent:'first',message:{author:{role:'assistant'},content:{parts:['Préserver la navigation.']},create_time:2}}}}];const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(data)],'conversations.json',{type:'application/json'}));document.querySelector('#as-provider').value='chatgpt';document.querySelector('#as-file').files=dt.files;document.querySelector('#as-import-form').requestSubmit()})()");
 await ready(()=>js("!!document.querySelector('[data-as-action=confirm-import]')"),10000)();
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')||'null')"),null,'Import preview must not mutate stored data');
 // CONTROL 26: no import happens unless a conversation is chosen and storage consent is explicit.
 assert.equal(await js("document.querySelectorAll('[data-as-import-choice]').length"),1);
 assert.equal(await js("document.querySelector('[data-as-import-choice]').checked"),false);
 await js("document.querySelector('[data-as-action=confirm-import]').click()");
 assert.equal(await js("localStorage.getItem('control-ai-studio-v1')"),null,'Import without selection or consent must not write anything');
 await js("(()=>{const input=document.querySelector('[data-as-import-choice]');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}))})()");
 await js("document.querySelector('[data-as-action=confirm-import]').click()");
 assert.equal(await js("localStorage.getItem('control-ai-studio-v1')"),null,'Consent is required even after choosing a conversation');
 await js("(()=>{const input=document.querySelector('#as-import-consent');input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}))})()");
 await js("document.querySelector('[data-as-action=confirm-import]').click()");
 await ready(()=>js("JSON.parse(localStorage.getItem('control-ai-studio-v1')||'{}').imports?.length===1"),6000)();
 assert.match(await js("document.querySelector('.as-record strong').textContent"),/Décisions UX/);
 // Read an actual archived message, draft a memory, and review it before saving.
 await js("document.querySelector('[data-as-view]').click()");
 await ready(()=>js("!!document.querySelector('[data-as-extract-memory]')"),5000)();
 await js("document.querySelector('[data-as-extract-memory]').click()");
 await ready(()=>js("!!document.querySelector('#as-memory-form')"),5000)();
 assert.match(await js("document.querySelector('.as-memory-draft').textContent"),/chatgpt/i);
 assert.match(await js("document.querySelector('#as-memory-content').value"),/version mobile est prioritaire/);
 assert.equal(await js("document.querySelector('#as-memory-approve').checked"),false);
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).memories.length"),0,'Draft must not be saved without review');
 await js("(()=>{document.querySelector('#as-memory-title').value='Priorité mobile';document.querySelector('#as-memory-content').value='Prioriser la navigation mobile et la clarté.';document.querySelector('#as-memory-project').value='general';document.querySelector('#as-memory-approve').checked=true;document.querySelector('#as-memory-form').requestSubmit()})()");
 await ready(()=>js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).memories?.length===1"),6000)();
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).memories[0].sourceMessageIndex"),0);
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).memories[0].sourceRole"),'user');
 await js("document.querySelector('[data-as-tab=agents]').click()");
 await ready(()=>js("!!document.querySelector('#as-agent-form')"),6000)();
 await js("(()=>{document.querySelector('#as-agent-name').value='Mon assistant UX';document.querySelector('#as-agent-instructions').value='Conseiller en design responsive';document.querySelector('[name=agent-memory]').checked=true;document.querySelector('#as-agent-form').requestSubmit()})()");
 await ready(()=>js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents?.length===1"),6000)();
 assert.match(await js("document.querySelector('.as-agent-toolbar h2').textContent"),/assistant UX/);
 assert.equal(await js("document.querySelector('#as-chat-message').disabled"),false,'Can compose a draft before optional model download');
 assert.equal(await js("document.querySelector('#as-chat-form button[type=submit]').disabled"),true,'Sending still requires manual local model load');


  // Unsent text must survive navigation and reload, without touching agent data.
  await js("(()=>{const f=document.querySelector('#as-chat-message');f.value='Brouillon temporaire de chantier';f.dispatchEvent(new Event('input',{bubbles:true}))})()");
  assert.match(await js("(()=>{const a=JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0];return sessionStorage.getItem('control-ai-studio-draft-v1:'+a.id+':'+a.threads[0].id)})()"),/Brouillon temporaire/);
  assert.equal(await js("JSON.stringify(JSON.parse(localStorage.getItem('control-ai-studio-v1'))).includes('Brouillon temporaire')"),false);
  await js("location.hash='#/'");
  await ready(()=>js("!!document.querySelector('.control-home-v6')"),7000)();
  await js("location.hash='#/control/aistudio'");
  await ready(()=>js("!!document.querySelector('[data-as-tab=agents]')"),7000)();
  await js("document.querySelector('[data-as-tab=agents]').click()");
  await ready(()=>js("!!document.querySelector('#as-chat-message')"),7000)();
  assert.equal(await js("document.querySelector('#as-chat-message').value"),'Brouillon temporaire de chantier');
  await command('Page.reload',{ignoreCache:true});
  await ready(()=>js("!!document.querySelector('[data-as-tab=agents]')"),16000)();
  await js("document.querySelector('[data-as-tab=agents]').click()");
  await ready(()=>js("!!document.querySelector('#as-chat-message')"),7000)();
  assert.equal(await js("document.querySelector('#as-chat-message').value"),'Brouillon temporaire de chantier');

  const firstThread=await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].threads[0].id");
  await js("document.querySelector('[data-as-action=new-thread]').click()");
  assert.equal(await js("document.querySelector('#as-chat-message').value"),'');
  await js("(()=>{const f=document.querySelector('#as-chat-message');f.value='Brouillon indépendant du second fil';f.dispatchEvent(new Event('input',{bubbles:true}))})()");
  await js("(()=>{const id=JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].threads[0].id;const f=document.querySelector('#as-thread');f.value=id;f.dispatchEvent(new Event('change',{bubbles:true}))})()");
  assert.equal(await js("document.querySelector('#as-chat-message').value"),'Brouillon temporaire de chantier');
  await js("(()=>{const id=JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].threads[1].id;const f=document.querySelector('#as-thread');f.value=id;f.dispatchEvent(new Event('change',{bubbles:true}))})()");
  assert.equal(await js("document.querySelector('#as-chat-message').value"),'Brouillon indépendant du second fil');
  await ready(()=>js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].threads.length===2"),6000)();
  await js("document.querySelector('.as-thread-manage').open=true");
  await js("(()=>{document.querySelector('#as-thread-name').value='Décisions mobiles';document.querySelector('#as-thread-rename-form').requestSubmit()})()");
  await ready(()=>js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].threads[1].name==='Décisions mobiles'"),6000)();
  assert.match(await js("document.querySelector('#as-thread').textContent"),/Décisions mobiles/);
  await command('Emulation.setDeviceMetricsOverride',{width:320,height:700,deviceScaleFactor:2,mobile:true});
  await delay(250);
  const studioNarrow=await js("({width:window.innerWidth,scroll:document.documentElement.scrollWidth,rename:!!document.querySelector('.as-thread-manage'),visible:!!document.querySelector('#as-thread')})");
  assert.equal(studioNarrow.rename,true);assert.equal(studioNarrow.visible,true);
  assert.ok(studioNarrow.scroll<=studioNarrow.width+4,'320px Studio thread overflow: '+JSON.stringify(studioNarrow));
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await js("(()=>{const prev=window.confirm;window.confirm=()=>false;try{document.querySelector('[data-as-action=delete-thread]').click()}finally{window.confirm=prev}})()");
  assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].threads.length"),2);
  await js("(()=>{const prev=window.confirm;window.confirm=()=>true;try{document.querySelector('[data-as-action=delete-thread]').click()}finally{window.confirm=prev}})()");
  assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].threads.length"),1);
  assert.equal(await js("document.querySelector('#as-thread').value"),firstThread);
  assert.equal(await js("document.querySelector('[data-as-action=delete-thread]').disabled"),true);
  assert.equal(await js("document.querySelector('#as-chat-message').value"),'Brouillon temporaire de chantier');
  await js("(()=>{const f=document.querySelector('#as-chat-message');f.value='';f.dispatchEvent(new Event('input',{bubbles:true}))})()");
  assert.equal(await js("document.querySelector('#as-chat-message').value"),'');
  log('Agent drafts survive navigation, reload and thread switching without being sent');

  // A second assistant's unsent text must never appear in the first assistant.
  await js("(()=>{document.querySelector('#as-agent-name').value='Agent second projet';document.querySelector('#as-agent-instructions').value='Tester les brouillons indépendants';document.querySelector('#as-agent-form').requestSubmit()})()");
  await ready(()=>js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents.length===2"),6000)();
  await js("(()=>{const f=document.querySelector('#as-chat-message');f.value='Brouillon privé du deuxième agent';f.dispatchEvent(new Event('input',{bubbles:true}))})()");
  const secondAgentDraft=await js("(()=>{const a=JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[1];return 'control-ai-studio-draft-v1:'+a.id+':'+a.threads[0].id})()");
  assert.match(await js("sessionStorage.getItem("+JSON.stringify(secondAgentDraft)+")"),/deuxième agent/);
  await js("document.querySelectorAll('[data-as-open-agent]')[0].click()");
  assert.equal(await js("document.querySelector('#as-chat-message').value"),'','Other agent cannot see a private draft');
  await js("document.querySelectorAll('[data-as-open-agent]')[1].click()");
  assert.equal(await js("document.querySelector('#as-chat-message').value"),'Brouillon privé du deuxième agent');
  await js("(()=>{const previous=window.confirm;window.confirm=()=>true;try{document.querySelector('[data-as-action=delete-agent]').click()}finally{window.confirm=previous}})()");
  assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents.length"),1);
  assert.equal(await js("sessionStorage.getItem("+JSON.stringify(secondAgentDraft)+")"),null,'Deleted agent must also remove its unsent drafts');
  log('Scoped drafts never leak across assistants and are cleared on agent deletion');

  log('AI Studio can rename and safely delete discussion, retain valid selection and fit 320px');
  // Synthetic conversations and searches remain inside this isolated browser.
  await js("window.__studioSearchSnapshot=localStorage.getItem('control-ai-studio-v1')");
  await js("(()=>{const s=JSON.parse(localStorage.getItem('control-ai-studio-v1'));s.agents[0].threads[0].messages=[{role:'user',content:'La décision stratégique mobile est validée'},{role:'assistant',content:'Le plan responsive est confirmé'}];s.agents.push({id:'agt-second-test',name:'Assistant Référencement',projectId:'general',instructions:'Auditer',conversationIds:[],memoryIds:[],configVersion:1,threads:[{id:'thr-search-test',name:'Projet SEO',messages:[{role:'user',content:'Mieux référencer le site sur les moteurs'}]}]});localStorage.setItem('control-ai-studio-v1',JSON.stringify(s));location.hash='#/'})()");
  await ready(()=>js("!!document.querySelector('.control-home-v6')"),7000)();
  await js("location.hash='#/control/aistudio'");
  await ready(()=>js("!!document.querySelector('[data-as-tab=agents]')"),7000)();
  await js("document.querySelector('[data-as-tab=agents]').click()");
  await ready(()=>js("!!document.querySelector('#as-thread-search-input')"),7000)();
  await js("(()=>{const i=document.querySelector('#as-thread-search-input');i.value='decision';i.dispatchEvent(new Event('input',{bubbles:true}))})()");
  await ready(()=>js("!!document.querySelector('.as-thread-hit')"),6000)();
  assert.match(await js("document.querySelector('.as-thread-results-count').textContent"),/1 discussion/);
  assert.match(await js("document.querySelector('.as-thread-hit').textContent"),/mobile/);
  await js("document.querySelector('.as-thread-hit').click()");
  assert.equal(await js("document.querySelectorAll('.as-found-message').length"),1);
  assert.match(await js("document.querySelector('.as-found-message').textContent"),/stratégique mobile/);
  await js("(()=>{const i=document.querySelector('#as-thread-search-input');i.value='referencer';i.dispatchEvent(new Event('input',{bubbles:true}))})()");
  await ready(()=>js("!!document.querySelector('.as-thread-hit')"),6000)();
  await js("document.querySelector('.as-thread-hit').click()");
  assert.match(await js("document.querySelector('.as-agent-toolbar h2').textContent"),/Référencement/);
  assert.equal(await js("document.querySelector('#as-thread').value"),'thr-search-test');
  await command('Emulation.setDeviceMetricsOverride',{width:320,height:700,deviceScaleFactor:2,mobile:true});
  await delay(250);
  const searchedMobile=await js("({width:innerWidth,scroll:document.documentElement.scrollWidth,search:!!document.querySelector('#as-thread-search-input')})");
  assert.equal(searchedMobile.search,true);
  assert.ok(searchedMobile.scroll<=searchedMobile.width+4,'Thread search overflow at 320px: '+JSON.stringify(searchedMobile));
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await js("document.querySelector('[data-as-action=clear-thread-search]').click()");
  assert.equal(await js("document.querySelector('.as-thread-hit')===null"),true,'Clearing query hides results');
  log('AI Studio search finds messages across agents, opens matched thread, and fits 320px');
  assert.equal(await js("!!document.querySelector('#control-pwa-update[hidden]')"),true,'New PWA should not display an update without an actual worker change');
  assert.ok(await js("!!document.querySelector('#control-pwa-update-now')"));
  assert.ok(await js("!!document.querySelector('#control-pwa-update-later')"));
  log('PWA update notice is available but does not auto-refresh an unsaved form');

  // Reset ONLY the synthetic search fixture so subsequent historical acceptance
  // checks still use the single original agent and its real source associations.
  await js("(()=>{localStorage.setItem('control-ai-studio-v1',window.__studioSearchSnapshot);delete window.__studioSearchSnapshot;location.hash='#/'})()");
  await ready(()=>js("!!document.querySelector('.control-home-v6')"),7000)();
  await js("location.hash='#/control/aistudio'");
  await ready(()=>js("!!document.querySelector('[data-as-tab=agents]')"),7000)();
  await js("document.querySelector('[data-as-tab=agents]').click()");
  await ready(()=>js("!!document.querySelector('.as-agent-toolbar')"),6000)();
  assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents.length"),1);


 const approvedContext=await js("(()=>{const s=JSON.parse(localStorage.getItem('control-ai-studio-v1'));return window.CONTROL_AI_STUDIO_CORE.context(s,s.agents[0])})()");
 assert.match(approvedContext,/Prioriser la navigation mobile/);

 await js("document.querySelector('[data-as-tab=memories]').click()");
 await ready(()=>js("!!document.querySelector('[data-as-edit-memory]')"),6000)();
 await js("document.querySelector('[data-as-edit-memory]').click()");
 await js("(()=>{document.querySelector('#as-memory-content').value='Nouvelle directive UX : privilégier la navigation mobile.';document.querySelector('#as-memory-form').requestSubmit()})()");
 await ready(()=>js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).memories[0].version===2"),6000)();
 await js("document.querySelector('[data-as-tab=agents]').click()");
 await ready(()=>js("!!document.querySelector('.as-agent-toolbar')"),6000)();
 await js("document.querySelector('[data-as-action=toggle-agent-edit]').click()");
 await ready(()=>js("document.querySelector('#as-agent-edit')?.open===true"),6000)();
 await js("(()=>{document.querySelector('#as-edit-agent-name').value='Assistant UX révisé';document.querySelector('#as-edit-agent-instructions').value='Analyse UX accessible et responsive';document.querySelector('[name=edit-agent-source]').checked=true;document.querySelector('#as-agent-edit-form').requestSubmit()})()");
 await ready(()=>js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].configVersion===2"),6000)();
 assert.match(await js("document.querySelector('.as-agent-toolbar h2')?.textContent"),/UX révisé/);
 assert.match(await js("(()=>{const s=JSON.parse(localStorage.getItem('control-ai-studio-v1'));return window.CONTROL_AI_STUDIO_CORE.context(s,s.agents[0])})()"),/Nouvelle directive UX/);
 await js("document.querySelector('[data-as-tab=imports]').click()");
 await ready(()=>js("!!document.querySelector('#as-import-form')"),6000)();
 await js("(()=>{const dt=new DataTransfer();dt.items.add(new File([JSON.stringify([{uuid:'second',name:'Seconde source',chat_messages:[{sender:'human',text:'Tester deux conversations sources'},{sender:'assistant',text:'Conserver les fils existants'}]}])],'claude.json',{type:'application/json'}));document.querySelector('#as-provider').value='claude';document.querySelector('#as-file').files=dt.files;document.querySelector('#as-import-form').requestSubmit()})()");
 await ready(()=>js("!!document.querySelector('[data-as-action=confirm-import]')"),6000)();
 await js("(()=>{const choice=document.querySelector('[data-as-import-choice]');choice.checked=true;choice.dispatchEvent(new Event('change',{bubbles:true}));const consent=document.querySelector('#as-import-consent');consent.checked=true;consent.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-as-action=confirm-import]').click()})()");
 await ready(()=>js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).imports?.length===2"),6000)();
 await js("document.querySelector('[data-as-tab=agents]').click()");
 await js("document.querySelector('[data-as-action=toggle-agent-edit]').click()");
 await js("(()=>{document.querySelectorAll('[name=edit-agent-source]').forEach(x=>x.checked=true);document.querySelector('#as-agent-edit-form').requestSubmit()})()");
 await ready(()=>js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].conversationIds?.length===2"),6000)();
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].configVersion"),3);
 assert.match(await js("(()=>{const s=JSON.parse(localStorage.getItem('control-ai-studio-v1'));return window.CONTROL_AI_STUDIO_CORE.context(s,s.agents[0])})()"),/Seconde source/);
 log('AI Studio edits versioned memory and agent, preserves data and links two imported conversations');
 await ready(()=>js("!!document.querySelector('.as-context-preview')"),6000)();
 await js("document.querySelector('.as-context-preview').open=true");
 const previewReport=await js("({summary:document.querySelector('.as-context-preview-inner p').textContent,text:document.querySelector('.as-context-preview-inner pre').textContent})");
 assert.match(previewReport.summary,/1 \/ 1 mémoires/);
 assert.match(previewReport.summary,/2 \/ 2 archives/);
 assert.match(previewReport.text,/Nouvelle directive UX/);
 assert.match(previewReport.text,/Seconde source/);
 assert.match(previewReport.text,/jamais des consignes/);
 assert.ok(previewReport.text.length<=1800);
 log('AI Studio previews exact agent prompt and effective memory/source counts');


 
 await js("document.querySelector('.as-studio-backup').open=true");
 await js("(()=>{const text=localStorage.getItem('control-ai-studio-v1');const input=document.querySelector('#as-restore-file');const dt=new DataTransfer();dt.items.add(new File([text],'studio-backup.json',{type:'application/json'}));input.files=dt.files;document.querySelector('#as-restore-form').requestSubmit()})()");
 await ready(()=>js("!!document.querySelector('[data-as-action=confirm-studio-restore]')"),6000)();
 assert.match(await js("document.querySelector('.as-restore-review')?.textContent"),/Aperçu vérifié/);
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents.length"),1,'Restore preview must not overwrite');
 await js("document.querySelector('[data-as-action=cancel-studio-restore]').click()");
 assert.equal(await js("!!document.querySelector('[data-as-action=confirm-studio-restore]')"),false,'Cancel must close preview');
 await js("(()=>{const text=localStorage.getItem('control-ai-studio-v1');const dt=new DataTransfer();dt.items.add(new File([text],'studio-backup.json',{type:'application/json'}));document.querySelector('#as-restore-file').files=dt.files;document.querySelector('#as-restore-form').requestSubmit()})()");
 await ready(()=>js("!!document.querySelector('[data-as-action=confirm-studio-restore]')"),6000)();
 await js("(()=>{const previous=window.confirm;window.confirm=()=>true;document.querySelector('[data-as-action=confirm-studio-restore]').click();window.confirm=previous})()");
 await ready(()=>js("!!document.querySelector('.as-agent-toolbar')&&!document.querySelector('[data-as-action=confirm-studio-restore]')&&JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents.length===1"),6000)();
 assert.match(await js("document.querySelector('[data-as-status]').textContent"),/restaurée/);
 log('AI Studio backup preview, cancellation and confirmed safe restoration succeeded');
 await js("location.hash='#/control/backup'");
 await ready(()=>js("!!document.querySelector('#export-data')"),6000)();
 assert.match(await js("document.querySelector('#main').textContent"),/agents, mémoires et discussions locaux/);
 assert.match(await js("document.querySelector('#main').textContent"),/anciens fichiers sans Studio IA/);
 await js("location.hash='#/control/aistudio'");
 await ready(()=>js("!!document.querySelector('.as-provider-grid')"),6000)();
 log('Unified backup disclosure includes Studio IA, while legacy backups retain existing agent data');

 await js("location.hash='#/control/backup'");
 await ready(()=>js("!!document.querySelector('#export-data')"),6000)();
 await js("(()=>{const old=URL.createObjectURL;window.__cryptoBackup={old,blob:null};URL.createObjectURL=function(blob){window.__cryptoBackup.blob=blob;return old.call(URL,blob)};const f=document.querySelector('#export-data');f.querySelector('[name=password]').value='Une longue phrase de test privee';f.requestSubmit()})()");
 await ready(()=>js("!!window.__cryptoBackup?.blob&&document.querySelector('#toast')?.textContent?.includes('Fichier téléchargé')"),18000)();
 assert.equal(await js("document.querySelector('#export-data [name=password]').value"),'','Password must not remain in the export form');
 const backupMeta=await js("(async()=>{const e=JSON.parse(await window.__cryptoBackup.blob.text());return {format:e.format,iterations:e.iterations,containsStudio:JSON.stringify(e).includes('Assistant UX révisé'),blobBytes:window.__cryptoBackup.blob.size}})()");
 assert.equal(backupMeta.format,'control-v2-aes-gcm');
 assert.equal(backupMeta.iterations,180000);
 assert.equal(backupMeta.containsStudio,false,'Encrypted export must not expose agent content');
 assert.ok(backupMeta.blobBytes>100);
 await js("(()=>{URL.createObjectURL=window.__cryptoBackup.old;const f=document.querySelector('#import-data');const dt=new DataTransfer();dt.items.add(new File([window.__cryptoBackup.blob],'secure-control-backup.json',{type:'application/json'}));f.elements.file.files=dt.files;f.elements.password.value='incorrecte et longue';f.requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-status')?.textContent?.includes('Mot de passe incorrect')"),20000)();
 assert.equal(await js("document.querySelector('#import-preview').hidden"),true,'Wrong password cannot show the restore action');
 await js("(()=>{const f=document.querySelector('#import-data');f.elements.password.value='Une longue phrase de test privee';f.requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),20000)();
 await approveIntegrity();
 assert.match(await js("document.querySelector('#import-comparison').textContent"),/Agents du Studio IA/);
 assert.match(await js("document.querySelector('#import-comparison').textContent"),/Mémoires du Studio IA/);
 assert.equal(await js("document.querySelector('#import-data [name=password]').value"),'','Password must be cleared after decrypting');
 const beforeStudio=await js("localStorage.getItem('control-ai-studio-v1')");
 await js("(()=>{const f=document.querySelector('#import-data');f.elements.password.value='Une longue phrase de test privee';document.querySelector('#import-cancel').click()})()");
 assert.equal(await js("localStorage.getItem('control-ai-studio-v1')"),beforeStudio,'Cancel must preserve the agent store');
 await js("(()=>{const f=document.querySelector('#import-data');f.elements.password.value='Une longue phrase de test privee';f.requestSubmit()})()");
 await ready(()=>js("document.querySelector('#import-preview')?.hidden===false"),20000)();
 await approveIntegrity();
 await js("(()=>{const old=window.confirm;window.confirm=()=>true;try{document.querySelector('#import-apply').click()}finally{window.confirm=old}})()");
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].name"),'Assistant UX révisé');
 assert.match(await js("document.querySelector('#import-status').textContent"),/Restauration confirmée/);
 // Keep the exact encrypted download in Node, not the browser's localStorage.
 // This test transfers only synthetic fixture data into new incognito storage contexts.
 const transferEncrypted=await js("(async()=>window.__cryptoBackup.blob.text())()");
 await js("delete window.__cryptoBackup");
 log('Encrypted unified backup includes Studio IA: wrong password refused, preview, cancel and restore verified');

 // The same export UI also supports an explicitly unencrypted, portable JSON file.
 // Its contents are intentionally kept inside this ephemeral test process.
 await js("(()=>{const old=URL.createObjectURL;window.__plainBackup={old,blob:null};URL.createObjectURL=function(blob){window.__plainBackup.blob=blob;return old.call(URL,blob)};const f=document.querySelector('#export-data');f.elements.password.value='';f.requestSubmit()})()");
 await ready(()=>js("!!window.__plainBackup?.blob&&document.querySelector('#toast')?.textContent?.includes('Fichier téléchargé')"),17000)();
 const transferPlain=await js("(async()=>window.__plainBackup.blob.text())()");
 assert.equal(JSON.parse(transferPlain).format,'control-v2-plain');
 await js("(()=>{URL.createObjectURL=window.__plainBackup.old;delete window.__plainBackup})()");
 const sourceTransfer=await js("(()=>{const task=JSON.parse(localStorage.getItem('control-command-v1'));const studio=JSON.parse(localStorage.getItem('control-ai-studio-v1'));return {tasks:task.actions.length,agents:studio.agents.length,agentName:studio.agents[0].name,memories:studio.memories.length}})()");
 assert.equal(sourceTransfer.agentName,'Assistant UX révisé');

 // A Chrome browser context has a distinct localStorage, IndexedDB, cache and cookies.
 // This is stronger than a second tab sharing the source profile, but does not
 // pretend to test a second physical device or a native provider account.
 const browserVersion=await (await fetch('http://127.0.0.1:'+debugPort+'/json/version')).json();
 async function connectCDP(endpoint){
  const socket=new WebSocket(endpoint);
  await new Promise((yes,no)=>{socket.addEventListener('open',yes,{once:true});socket.addEventListener('error',no,{once:true})});
  let number=0;const pendingReplies=new Map();
  socket.addEventListener('message',event=>{
   let message;try{message=JSON.parse(event.data)}catch{return}
   if(message.method==='Runtime.exceptionThrown'){
    const detail=message.params?.exceptionDetails;
    errors.push(String(detail?.exception?.description||detail?.text||'Cross-profile JS exception').slice(0,260));
   }
   if(message.id&&pendingReplies.has(message.id)){
    const {yes,no}=pendingReplies.get(message.id);
    pendingReplies.delete(message.id);
    if(message.error)no(Error(message.error.message));else yes(message.result);
   }
  });
  return {socket,command(method,params={}){
   const id=++number;
   return new Promise((yes,no)=>{pendingReplies.set(id,{yes,no});socket.send(JSON.stringify({id,method,params}))});
  }};
 }
 const browserCDP=await connectCDP(browserVersion.webSocketDebuggerUrl);
 const isolatedContexts=[];
 try{
  async function openIsolated(){
   const {browserContextId}=await browserCDP.command('Target.createBrowserContext',{disposeOnDetach:true});
   isolatedContexts.push(browserContextId);
   const {targetId}=await browserCDP.command('Target.createTarget',{url:'about:blank',browserContextId});
   const target=await deadline(async()=>{
    const list=await (await fetch('http://127.0.0.1:'+debugPort+'/json')).json();
    return list.find(t=>t.id===targetId&&t.webSocketDebuggerUrl);
   },10000)();
   const pageCDP=await connectCDP(target.webSocketDebuggerUrl);
   await pageCDP.command('Page.enable');
   await pageCDP.command('Runtime.enable');
   const evaluate=async expression=>{
    const value=await pageCDP.command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
    if(value.exceptionDetails)throw Error(value.exceptionDetails.exception?.description||value.exceptionDetails.text||'Isolated browser script failed');
    return value.result?.value;
   };
   await pageCDP.command('Page.navigate',{url:addr.replace(/#.*$/,'')+'#/control/backup'});
   await deadline(()=>evaluate("!!document.querySelector('#import-data')&&!!window.CONTROL_BACKUP_REVIEW"),19000)();
   return {pageCDP,evaluate,ready:(expression,max=18000)=>deadline(()=>evaluate(expression),max)()};
  }
  // CONTROL 21: complete the actual 3-step onboarding from a totally empty
  // browser context, including durable project/task writes and task closure.
  const starter=await openIsolated();
  try{
   await starter.evaluate("location.hash='#/'");
   await starter.ready("!!document.querySelector('#control-onboarding a[href=\"#/new-project\"]')",10000);
   assert.equal(await starter.evaluate("document.querySelector('.control-home-v6-onboarding-progress').textContent"),'0 / 3 étapes');
   await starter.evaluate("document.querySelector('#control-onboarding a[href=\"#/new-project\"]').click()");
   await starter.ready("location.hash==='#/new-project'&&!document.querySelector('#add-box')?.classList.contains('hidden')",10000);
   await starter.evaluate("(()=>{const f=document.querySelector('#new-project');f.elements.name.value='Projet de bienvenue';f.requestSubmit()})()");
   await starter.ready("location.hash.startsWith('#/project/custom-')&&JSON.parse(localStorage.getItem('control-hub-v2')||'{}').custom?.length===1",11000);
   await starter.evaluate("location.hash='#/'");
   await starter.ready("document.querySelector('.control-home-v6-onboarding-progress')?.textContent==='1 / 3 étapes'",9000);
   assert.equal(await starter.evaluate("document.querySelector('#control-onboarding a[aria-current=step]')?.getAttribute('href')"),'#/control/inbox/new');
   await starter.evaluate("document.querySelector('#control-onboarding a[aria-current=step]').click()");
   await starter.ready("location.hash==='#/control/inbox/new'&&!!document.querySelector('#new-action')",11000);
   await starter.evaluate("(()=>{const f=document.querySelector('#new-action');f.elements.title.value='Première tâche enregistrée';f.elements.project.value=JSON.parse(localStorage.getItem('control-hub-v2')).custom[0].id;f.requestSubmit()})()");
   await starter.ready("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.some(x=>x.title==='Première tâche enregistrée')",10000);
   await starter.evaluate("location.hash='#/'");
   await starter.ready("document.querySelector('.control-home-v6-onboarding-progress')?.textContent==='2 / 3 étapes'",10000);
   assert.equal(await starter.evaluate("document.querySelector('#control-onboarding a[aria-current=step]')?.getAttribute('href')"),'#/control/inbox');
   await starter.evaluate("document.querySelector('#control-onboarding a[aria-current=step]').click()");
   await starter.ready("!!document.querySelector('[data-act^=\"done:\"]')",10000);
   await starter.evaluate("document.querySelector('[data-act^=\"done:\"]').click()");
   await starter.ready("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.some(x=>x.title==='Première tâche enregistrée'&&x.status==='done')",10000);
   await starter.evaluate("location.hash='#/'");
   await starter.ready("!!document.querySelector('.control-home-v6')",10000);
   assert.equal(await starter.evaluate("document.querySelector('#control-onboarding')"),null,'Guide must disappear only after a real completed task');
   log('CONTROL 21: three-step real onboarding creates project, saves task, completes task and disappears in isolated Chromium');
   // CONTROL 22: real task categorization is visible, unique, filterable and editable.
   // Keep all test records inside this independently disposed Chromium context.
   await starter.evaluate("(()=>{const state=JSON.parse(localStorage.getItem('control-command-v1'));const today=window.CONTROL_TASKS.localDay();const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);state.actions.push({id:'triage-late',title:'Retard contrôle',status:'todo',project:'',priority:'Haute',due:window.CONTROL_TASKS.localDay(yesterday)},{id:'triage-today',title:'Échéance du jour',status:'doing',project:'',priority:'Normale',due:today},{id:'triage-next',title:'Autre tâche locale',status:'todo',project:'',priority:'Normale',due:''});state.missions=Array.isArray(state.missions)?state.missions:[];state.missions.push({id:'triage-review',title:'Livrable à vérifier',status:'review',provider:'Test local',project:''});localStorage.setItem('control-command-v1',JSON.stringify(state));location.hash='#/control/inbox'})()");
   await starter.pageCDP.command('Page.reload',{ignoreCache:true});
   await starter.ready("document.querySelectorAll('.control-task-group').length===5",18000);
   const triageLayout=await starter.evaluate("({groups:[...document.querySelectorAll('.control-task-group')].map(g=>({type:g.dataset.taskGroup,total:g.querySelectorAll('.control-task-row').length,hidden:g.hidden})),buttons:document.querySelectorAll('[data-task-filter-quick]').length})");
   assert.deepEqual(triageLayout.groups.map(g=>g.type),['overdue','today','review','next','done']);
   assert.deepEqual(triageLayout.groups.map(g=>g.total),[1,1,1,1,1]);
   assert.equal(triageLayout.buttons,5);
   assert.equal(triageLayout.groups.find(g=>g.type==='done').hidden,true,'Default active view hides closed tasks without dropping their record');
   await starter.evaluate("document.querySelector('[data-task-filter-quick=\"overdue\"]').click()");
   const lateView=await starter.evaluate("({selected:document.querySelector('#control-task-filter').value,pressed:document.querySelector('[data-task-filter-quick=\"overdue\"]').getAttribute('aria-pressed'),visible:[...document.querySelectorAll('.control-task-group')].filter(g=>!g.hidden).map(g=>g.dataset.taskGroup),count:document.querySelector('#control-task-visible').textContent})");
   assert.equal(lateView.selected,'overdue');
   assert.equal(lateView.pressed,'true');
   assert.deepEqual(lateView.visible,['overdue']);
   assert.match(lateView.count,/1 résultat/);
   await starter.evaluate("(()=>{const field=document.querySelector('#control-task-search');field.value='inexistant';field.dispatchEvent(new Event('input',{bubbles:true}))})()");
   assert.equal(await starter.evaluate("document.querySelector('#control-task-none').hidden"),false);
   await starter.evaluate("(()=>{const field=document.querySelector('#control-task-search');field.value='Retard';field.dispatchEvent(new Event('input',{bubbles:true}))})()");
   assert.equal(await starter.evaluate("document.querySelector('#control-task-none').hidden"),true);
   await starter.evaluate("document.querySelector('[data-task-filter-quick=\"review\"]').click()");
   const reviewView=await starter.evaluate("({selected:document.querySelector('#control-task-filter').value,visible:[...document.querySelectorAll('.control-task-group')].filter(g=>!g.hidden).map(g=>g.dataset.taskGroup),link:document.querySelector('[data-task-group=\"review\"] a.button')?.getAttribute('href')})");
   assert.equal(reviewView.selected,'review');
   assert.deepEqual(reviewView.visible,[],'Search must still narrow the review view until cleared');
   await starter.evaluate("(()=>{const field=document.querySelector('#control-task-search');field.value='';field.dispatchEvent(new Event('input',{bubbles:true}))})()");
   assert.deepEqual(await starter.evaluate("[...document.querySelectorAll('.control-task-group')].filter(g=>!g.hidden).map(g=>g.dataset.taskGroup)"),['review']);
   assert.equal(reviewView.link,'#/control/missions','Mission review keeps a working destination');
   await starter.evaluate("document.querySelector('[data-task-filter-quick=\"done\"]').click()");
   await starter.ready("!document.querySelector('[data-task-group=\"done\"]').hidden&&!!document.querySelector('[data-act^=\"reopen:\"]')",6000);
   await starter.evaluate("document.querySelector('[data-task-group=\"done\"] [data-act^=\"reopen:\"]').click()");
   assert.equal(await starter.evaluate("JSON.parse(localStorage.getItem('control-command-v1')).actions.find(x=>x.title==='Première tâche enregistrée')?.status"),'todo');
   log('CONTROL 22: real Chromium triage groups each task once, filters/searches review and reopens a recorded task');
   // CONTROL 23: a client followup turns into a correctly linked task only
   // after the user explicitly submits the creation form.
   await starter.evaluate("location.hash='#/control/clients'");
   await starter.ready("!!document.querySelector('#new-client')",11000);
   await starter.evaluate("(()=>{const f=document.querySelector('#new-client');const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);f.elements.name.value='Atelier test relances';f.elements.project.value=JSON.parse(localStorage.getItem('control-hub-v2')).custom[0].id;f.elements.status.value='Prospect';f.elements.nextStep.value='Envoyer la proposition';f.elements.nextDue.value=window.CONTROL_TASKS.localDay(yesterday);f.requestSubmit()})()");
   await starter.ready("document.querySelector('.control-client-row[data-client-followup=\"overdue\"]')?.textContent?.includes('Atelier test relances')",10000);
   assert.match(await starter.evaluate("document.querySelector('.control-client-row[data-client-followup=\"overdue\"] .control-client-followup').textContent"),/Relance en retard/);
   await starter.evaluate("(()=>{document.querySelector('.control-client-create').open=true;const f=document.querySelector('#new-client');f.elements.name.value='Atelier prochain';f.elements.nextStep.value='Rappeler plus tard';const d=new Date();d.setDate(d.getDate()+5);f.elements.nextDue.value=window.CONTROL_TASKS.localDay(d);f.requestSubmit()})()");
   await starter.ready("document.querySelectorAll('.control-client-row').length===2",10000);
   assert.equal(await starter.evaluate("document.querySelector('#control-client-due-filter strong').textContent"),'1');
   await starter.evaluate("document.querySelector('#control-client-due-filter').click()");
   const filteredClients=await starter.evaluate("({pressed:document.querySelector('#control-client-due-filter').getAttribute('aria-pressed'),shown:[...document.querySelectorAll('.control-client-row')].filter(r=>!r.hidden).map(r=>r.querySelector('.control-client-info>strong').textContent)})");
   assert.equal(filteredClients.pressed,'true');
   assert.deepEqual(filteredClients.shown,['Atelier test relances']);
   const beforeClientTask=await starter.evaluate("JSON.parse(localStorage.getItem('control-command-v1')).actions.length");
   await starter.evaluate("document.querySelector('.control-client-row[data-client-followup=\"overdue\"] .control-client-info .actions a.button').click()");
   await starter.ready("location.hash.startsWith('#/control/inbox/new?client=')&&!!document.querySelector('#new-action')",10000);
   const prefilled=await starter.evaluate("({title:document.querySelector('#new-action [name=title]').value,due:document.querySelector('#new-action [name=due]').value,client:document.querySelector('#new-action [name=clientId]').value,project:document.querySelector('#new-action [name=project]').value,actions:JSON.parse(localStorage.getItem('control-command-v1')).actions.length})");
   const expected=await starter.evaluate("(()=>{const data=JSON.parse(localStorage.getItem('control-command-v1'));const client=data.clients.find(c=>c.name==='Atelier test relances');return {due:client.nextDue,client:client.id,project:client.project}})()");
   assert.equal(prefilled.title,'Envoyer la proposition');
   assert.equal(prefilled.due,expected.due);
   assert.equal(prefilled.client,expected.client);
   assert.equal(prefilled.project,expected.project);
   assert.equal(prefilled.actions,beforeClientTask,'Navigating from a client must not silently create a task');
   await starter.evaluate("document.querySelector('#new-action').requestSubmit()");
   await starter.ready("JSON.parse(localStorage.getItem('control-command-v1')||'{}').actions?.some(x=>x.title==='Envoyer la proposition'&&x.clientId)",10000);
   const clientTask=await starter.evaluate("(()=>{const state=JSON.parse(localStorage.getItem('control-command-v1'));const task=state.actions.find(x=>x.title==='Envoyer la proposition');return {client:task.clientId,project:task.project,due:task.due}})()");
   assert.deepEqual(clientTask,expected);
   await starter.evaluate("location.hash='#/control/clients'");
   await starter.ready("document.querySelector('.control-client-row[data-client-followup=\"overdue\"] .control-client-task-list')?.textContent?.includes('Envoyer la proposition')",10000);
   log('CONTROL 23: due client filter, honest status badge and manually confirmed linked task are functional in Chromium');


  }finally{try{starter.pageCDP.socket.close()}catch{}}

  const storeKeys=['control-command-v1','control-hub-v2','control-automations-v1','control-ai-studio-v1'];
  const snapshotExpression="JSON.stringify("+JSON.stringify(storeKeys)+".map(key=>localStorage.getItem(key)))";
  for(const [label,file,password] of [
   ['encrypted',transferEncrypted,'Une longue phrase de test privee'],
   ['plain',transferPlain,'']
  ]){
   const isolated=await openIsolated();
   try{
    const before=await isolated.evaluate(snapshotExpression);
    assert.equal(await isolated.evaluate("(()=>{const raw=localStorage.getItem('control-ai-studio-v1');return !!raw&&raw.includes('Assistant UX révisé')})()"),false,
     'A fresh browser context must not see another context’s agent');
    const loadFile=(pw)=>"(()=>{const form=document.querySelector('#import-data');const transfer=new DataTransfer();transfer.items.add(new File(["+JSON.stringify(file)+"],'transfert-test.json',{type:'application/json'}));form.elements.file.files=transfer.files;form.elements.password.value="+JSON.stringify(pw)+";form.requestSubmit()})()";
    if(label==='encrypted'){
     await isolated.evaluate(loadFile('mot de passe incorrect'));
     await isolated.ready("document.querySelector('#import-status')?.textContent?.includes('Mot de passe incorrect')",20000);
     assert.equal(await isolated.evaluate("document.querySelector('#import-preview').hidden"),true,
      'An incorrect password cannot unlock restore in a different browser context');
     assert.equal(await isolated.evaluate(snapshotExpression),before,
      'Bad password cannot mutate isolated storage');
    }
    await isolated.evaluate(loadFile(password));
    await isolated.ready("document.querySelector('#import-preview')?.hidden===false",25000);
    assert.equal(await isolated.evaluate(snapshotExpression),before,
     'Review must not alter destination storage before explicit confirmation');
    await isolated.evaluate("(()=>{const consent=document.querySelector('#import-integrity-consent');if(!consent.hidden){const ack=document.querySelector('#import-integrity-ack');ack.checked=true;ack.dispatchEvent(new Event('change',{bubbles:true}));}return true})()");
    assert.equal(await isolated.evaluate("document.querySelector('#import-apply').disabled"),false,
     'A valid transfer must have an enabled apply control after integrity review');
    await isolated.evaluate("(()=>{const old=window.confirm;window.confirm=()=>true;try{document.querySelector('#import-apply').click()}finally{window.confirm=old}})()");
    await isolated.ready("document.querySelector('#import-status')?.textContent?.includes('Restauration confirmée')",12000);
    const restored=await isolated.evaluate("(()=>{const raw=localStorage.getItem('control-command-v1');const studioRaw=localStorage.getItem('control-ai-studio-v1');if(!raw||!studioRaw)return null;const task=JSON.parse(raw),studio=JSON.parse(studioRaw);return {tasks:task.actions?.length,agents:studio.agents?.length,agentName:studio.agents?.[0]?.name,memories:studio.memories?.length}})()");
    assert.deepEqual(restored,sourceTransfer,
     'Exported tasks, agent names and memories must survive restoring in separate browser storage');
    await isolated.pageCDP.command('Page.reload',{ignoreCache:true});
    await isolated.ready("!!document.querySelector('#import-data')",20000);
    assert.equal(await isolated.evaluate("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].name"),sourceTransfer.agentName,
     'A restored agent must remain after a full refresh in its new context');
    log('CONTROL 19: '+label+' backup restored to independent Chromium storage, preview non-destructive and persisted after reload');
   }finally{try{isolated.pageCDP.socket.close()}catch{}}
  }
 }finally{
  for(const contextId of isolatedContexts.reverse()){
   try{await browserCDP.command('Target.disposeBrowserContext',{browserContextId:contextId})}catch{}
  }
  try{browserCDP.socket.close()}catch{}
 }



 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('.control-home-v6-tabs a[href=\"#/control/aistudio\"]')"),6500)();
 const shortcutCount=await js("document.querySelectorAll('.control-home-v6-tabs a[href=\"#/control/aistudio\"],.control-home-v6-advanced a[href=\"#/control/backup\"]').length");
 assert.equal(shortcutCount,2,'Assistants and backup must remain reachable from the new compact homepage');
 await js("document.querySelector('.control-home-v6-tabs a[href=\"#/control/aistudio\"]').click()");
 await ready(()=>js("location.hash==='#/control/aistudio'&&!!document.querySelector('.as-provider-grid')"),7000)();
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('.control-home-v6-advanced a[href=\"#/control/backup\"]')"),6500)();
 await js("document.querySelector('.control-home-v6-advanced').open=true");
 await js("document.querySelector('.control-home-v6-advanced a[href=\"#/control/backup\"]').click()");
 await ready(()=>js("location.hash==='#/control/backup'&&!!document.querySelector('#export-data')"),7000)();
 log('Homepage agent and backup shortcuts open the correct real app screens in Chromium');



 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('.control-home-v6')"),6000)();
 await js("location.hash='#/control/aistudio'");
 await ready(()=>js("!!document.querySelector('.as-provider-grid')"),6000)();
 await js("document.querySelector('[data-as-tab=agents]').click()");
 await ready(()=>js("!!document.querySelector('.as-agent-list')"),6000)();
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents.length"),1);
 const returnedAgent=await js("(()=>{const s=JSON.parse(localStorage.getItem('control-ai-studio-v1'));return {name:s.agents[0].name,version:s.agents[0].configVersion,sources:s.agents[0].conversationIds.length,memoryVersion:s.memories[0].version}})()");
 assert.deepEqual(returnedAgent,{name:'Assistant UX révisé',version:3,sources:2,memoryVersion:2},'Edited agents and versioned memories must persist after navigation');
 log('AI Studio imported ChatGPT preview, approved memory, created persistent agent and never activated a paid or remote model');
 await js("(()=>{window.__origWorker=window.Worker;window.Worker=class{constructor(){this.last=null;this.terminated=false;window.__fakeWorker=this}postMessage(p){if(p.action==='load')queueMicrotask(()=>this.onmessage?.({data:{type:'ready'}}));if(p.action==='generate')this.last=p}terminate(){this.terminated=true}}})()");
 await js("document.querySelector('[data-as-action=load-model]').click()");
 await ready(()=>js("!!document.querySelector('#as-chat-message:not(:disabled)')"),6000)();
 await js("(()=>{const f=document.querySelector('#as-chat-message');f.value='Question de test';f.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#as-chat-form').requestSubmit()})()");
 await ready(()=>js("!!window.__fakeWorker?.last&&window.__fakeWorker.last.action==='generate'"),6000)();
 assert.equal(await js("(()=>{const a=JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0];return sessionStorage.getItem('control-ai-studio-draft-v1:'+a.id+':'+a.threads[0].id)})()"),null,'Saved question must clear its unsent draft');
 assert.match(await js("window.__fakeWorker.last.context"),/Nouvelle directive UX/);
 await js("window.__oldWorker=window.__fakeWorker");
 await js("document.querySelector('[data-as-action=toggle-agent-edit]').click()");
 await js("(()=>{document.querySelector('#as-edit-agent-instructions').value='Instructions actualisées sans ancienne génération';document.querySelector('#as-agent-edit-form').requestSubmit()})()");
 await ready(()=>js("window.__oldWorker.terminated===true"),6000)();
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].configVersion"),4);
 await js("window.__oldWorker.onmessage({data:{type:'answer',requestId:window.__oldWorker.last.requestId,text:'STALE-RESPONSE-AGENT'}})");
 assert.equal(await js("JSON.stringify(JSON.parse(localStorage.getItem('control-ai-studio-v1'))).includes('STALE-RESPONSE-AGENT')"),false);
 await js("document.querySelector('[data-as-action=load-model]').click()");
 await ready(()=>js("!!document.querySelector('#as-chat-message:not(:disabled)')"),6000)();
 await js("(()=>{document.querySelector('#as-chat-message').value='Seconde question';document.querySelector('#as-chat-form').requestSubmit()})()");
 await ready(()=>js("!!window.__fakeWorker?.last&&window.__fakeWorker.last.action==='generate'"),6000)();
 await js("window.__oldWorker=window.__fakeWorker");
 await js("document.querySelector('[data-as-tab=memories]').click()");
 await ready(()=>js("!!document.querySelector('[data-as-delete-memory]')"),6000)();
 await js("(()=>{const prev=window.confirm;window.confirm=()=>true;try{document.querySelector('[data-as-delete-memory]').click()}finally{window.confirm=prev}})()");
 assert.equal(await js("window.__oldWorker.terminated"),true);
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).memories.length"),0);
 assert.equal(await js("JSON.parse(localStorage.getItem('control-ai-studio-v1')).agents[0].memoryIds.length"),0);
 await js("window.__oldWorker.onmessage({data:{type:'answer',requestId:window.__oldWorker.last.requestId,text:'STALE-RESPONSE-MEMORY'}})");
 assert.equal(await js("JSON.stringify(JSON.parse(localStorage.getItem('control-ai-studio-v1'))).includes('STALE-RESPONSE-MEMORY')"),false);
 await js("(()=>{window.Worker=window.__origWorker;delete window.__origWorker;delete window.__oldWorker;delete window.__fakeWorker})()");
 log('In-flight local model replies are discarded on agent edits and memory revocations');


 // Account gate is not the same as personal CONTROL: public Cloud must remain disabled.
 // We test the actual app.html and public config, not merely assert file contents in Node.
 // Cross-tab guard: browser must alert without discarding a draft or reloading automatically.
 await js("location.hash='#/'");
 await ready(()=>js("!!document.querySelector('#control-external-change')"),8000)();
 await js("window.dispatchEvent(new StorageEvent('storage',{key:'control-command-v1',oldValue:'previous',newValue:'newer',storageArea:localStorage}))");
 assert.equal(await js("document.querySelector('#control-external-change').hidden"),false);
 assert.equal(await js("(()=>{const previous=window.confirm;window.confirm=()=>false;const hash=location.hash;document.querySelector('#control-external-reload').click();window.confirm=previous;return location.hash===hash&&!document.querySelector('#control-external-change').hidden})()"),true);
 log('cross-tab change warns persistently and refuses automatic reload without consent');
 const targetCloud=production?PUBLIC_ORIGIN+'app.html':'http://127.0.0.1:'+port+'/app.html';
 await command('Page.navigate',{url:targetCloud});
 await ready(()=>js("document.querySelector('#setup')?.hidden===false"),16000)();
 const cloudState=await js("(async()=>{const cfg=await (await fetch('./config/cloud.json',{cache:'no-store'})).json();return {enabled:cfg.enabled,setup:document.querySelector('#setup')?.hidden,auth:document.querySelector('#auth')?.hidden,workspace:document.querySelector('#workspace')?.hidden,screen:document.querySelector('#setup h1')?.textContent}})()");
 assert.equal(cloudState.enabled,false,'Cloud must remain disabled before independent backend authorization');
 assert.equal(cloudState.setup,false,'Disabled Cloud must show setup panel');
 assert.equal(cloudState.auth,true,'Disabled Cloud must not show sign-in or account creation');
 assert.equal(cloudState.workspace,true,'Disabled Cloud must not expose private workspace');
 assert.match(cloudState.screen||'',/CONTROL Cloud : base créée, accès en validation/);
 assert.match(await js("document.querySelector('#setup').textContent"),/En attente : deux connexions Supabase Auth réelles/);
 assert.match(await js("document.querySelector('#setup').textContent"),/Les inscriptions ne sont pas encore ouvertes/);
 await ready(()=>js("document.querySelector('#cloud-readiness')?.textContent.includes('0 / 8 contrôles')"),9000)();
 assert.match(await js("document.querySelector('#cloud-readiness').textContent"),/INACTIVE/);
 assert.match(await js("document.querySelector('#cloud-readiness').textContent"),/révocation/);
 log('Cloud setup shows installed independent backend but blocks private sign-in until genuine JWT A-B tests');

 const cloudTheme=await js("({background:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,loaded:!!document.querySelector('link[href$=\"control-brand-global.css\"]')})");
 assert.equal(cloudTheme.background,'rgb(255, 248, 242)');
 assert.match(cloudTheme.font,/Poppins/i);
 assert.equal(cloudTheme.loaded,true);
 log('Simple & Humain: Cloud setup shares the approved palette without opening accounts');

 const targetLegacy=production?PUBLIC_ORIGIN+'legacy.html':'http://127.0.0.1:'+port+'/legacy.html';
 await command('Page.navigate',{url:targetLegacy});
 await ready(()=>js("document.body?.classList.contains('control-legacy')"),9000)();
 const legacyTheme=await js("({background:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,loaded:!!document.querySelector('link[href$=\"control-brand-global.css\"]')})");
 assert.equal(legacyTheme.background,'rgb(255, 248, 242)');
 assert.match(legacyTheme.font,/Poppins/i);
 assert.equal(legacyTheme.loaded,true);
 log('Simple & Humain: legacy dashboard uses the same visual language');


 // A tester must follow a real six-mission guide without Cloud login,
 // unsafe archives or remote feedback uploads.

 // A tester must follow a real six-mission guide without Cloud login,
 // unsafe archives or remote feedback uploads.
 const targetPilot=production?PUBLIC_ORIGIN+'testeurs.html':'http://127.0.0.1:'+port+'/testeurs.html';
 await command('Page.navigate',{url:targetPilot});
 await ready(()=>js("!!document.querySelector('[data-control-pilot]')&&!!window.CONTROL_PILOT_REPORT"),14000)();
 const pilot=await js("({tasks:document.querySelectorAll('[data-pilot-check]').length,report:window.CONTROL_PILOT_REPORT.collect(),download:!!document.querySelector('#pilot-download'),url:location.pathname})");
 assert.equal(pilot.tasks,6);
 assert.equal(pilot.report.steps.length,6);
 assert.equal(pilot.report.steps.some(x=>x.terminee),false);
 assert.equal(pilot.report.ease,null);
 assert.equal(pilot.report.device,'non_precise');
 assert.equal(pilot.download,true);

 const pilotTheme=await js("({background:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily,loaded:!!document.querySelector('link[href$=\"control-brand-global.css\"]')})");
 assert.equal(pilotTheme.background,'rgb(255, 248, 242)');
 assert.match(pilotTheme.font,/Poppins/i);
 assert.equal(pilotTheme.loaded,true);

 assert.match(pilot.url,/testeurs\.html$/);
 await js("(()=>{const x=document.querySelector('[data-pilot-check]');x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}))})()");
 assert.equal((await js("document.querySelector('#pilot-progress').textContent")).trim(),'1 / 6');
 assert.equal(await js("window.CONTROL_PILOT_REPORT.collect().steps[0].terminee"),true);
 await command('Emulation.setDeviceMetricsOverride',{width:320,height:780,deviceScaleFactor:1,mobile:true});
 const pilotMobile=await js("({body:document.documentElement.scrollWidth,screen:innerWidth,link:[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='index.html#/control/aistudio')})");
 assert.ok(pilotMobile.body<=pilotMobile.screen+2,'Tester guide must not overflow at 320px');
 assert.ok(pilotMobile.link,'Tester guide must link to real assistant screen');
 log('CONTROL pilot guide: six real missions, optional feedback, responsive 320px');
 // The guide itself registers the PWA, even when it is a participant's first page.
 await ready(()=>js("(async()=>{if(!navigator.serviceWorker?.controller)return false;const keys=await caches.keys();if(!keys.includes('control-shell-v110'))return false;const cache=await caches.open('control-shell-v110');return !!(await cache.match(new URL('./testeurs.html',location.href)))&&!!(await cache.match(new URL('./assets/control-test-pilot.js',location.href)))})()"),30000)();
 await command('Network.enable');
 await command('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await command('Page.reload',{ignoreCache:false});
 await ready(()=>js("!!document.querySelector('[data-control-pilot]')&&!!window.CONTROL_PILOT_REPORT"),18000)();
 await command('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:0,uploadThroughput:0});
 log('CONTROL pilot guide remains usable offline from the versioned PWA cache');

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
 for(const folder of profiles){
  try{rmSync(folder,{recursive:true,force:true,maxRetries:5,retryDelay:100})}
  catch(error){
   // Runner contains synthetic fixtures. Do not misclassify Chrome shutdown races as app defects.
   if(!['ENOTEMPTY','EBUSY','EPERM'].includes(error?.code))throw error;
   process.stderr.write('BROWSER CLEANUP: temporary profile will be removed by ephemeral runner ('+error.code+')\n');
  }
 }
}
