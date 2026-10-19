// Public website smoke checks: HTML provenance + Chromium desktop/mobile.
// No login, no mutation, no attempt to reach private staging or APIs.
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const targets=[
 {id:'control-ia',url:'https://cosscoll.github.io/Avancement-Projet/',source:'local',marker:'CONTROL',selector:'main h1'},
 {id:'pack-pro',url:'https://cosscoll.github.io/Pack-Proc-dures-Pro/',source:'https://raw.githubusercontent.com/cosscoll/Pack-Proc-dures-Pro/main/index.html',marker:'Pack Procédures Pro',selector:'h1'},
 {id:'banque-ia',url:'https://cosscoll.github.io/Banque-Outils-IA/',source:'https://raw.githubusercontent.com/cosscoll/Banque-Outils-IA/main/index.html',marker:'Banque Outils IA',selector:'h1'}
];
const hash=t=>createHash('sha256').update(t).digest('hex');
async function getText(u){
 const r=await fetch(u,{signal:AbortSignal.timeout(20000),redirect:'follow',headers:{'User-Agent':'CONTROL-V3-public-smoke'}});
 if(!r.ok)throw Error('HTTP '+r.status);
 if(new URL(r.url).hostname!==new URL(u).hostname)throw Error('Redirect to unrelated host');
 return r.text();
}
async function retry(fn,tries=5){
 let last;for(let i=0;i<tries;i++){try{return await fn()}catch(e){last=e;if(i<tries-1)await new Promise(r=>setTimeout(r,15000))}}
 throw last;
}
const started_at=new Date().toISOString(),results=[];
const out=path.resolve('artifacts/public-deploy-smoke');
await mkdir(out,{recursive:true});
let chromium;
try{
 ({chromium}=await import('playwright'));
}catch(e){
 console.error('Playwright browser module unavailable:',String(e));
 process.exitCode=1;
}
for(const target of targets){
 const result={site:target.id,url:target.url,at:new Date().toISOString(),html_source_matches_main:false,desktop:false,mobile:false,errors:[]};
 try{
  const expected=target.source==='local'?await readFile('index.html','utf8'):await getText(target.source);
  const live=await retry(async()=>{
   const html=await getText(target.url);
   if(!html.includes(target.marker))throw Error('Site content marker not found');
   if(hash(expected)!==hash(html))throw Error('GitHub Pages HTML does not yet match current main');
   return html;
  });
  result.html_source_matches_main=hash(live)===hash(expected);
 }catch(e){result.errors.push('deployment: '+String(e.message||e))}
 if(result.html_source_matches_main&&chromium){
  let browser;
  try{
   browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']});
   for(const mode of ['desktop','mobile']){
    const context=await browser.newContext({viewport:mode==='mobile'?{width:390,height:844}:{width:1360,height:850},isMobile:mode==='mobile',hasTouch:mode==='mobile',reducedMotion:'reduce'});
    const page=await context.newPage();
    const browserErrors=[];page.on('pageerror',e=>browserErrors.push(String(e.message||e)));
    try{
     const response=await page.goto(target.url,{waitUntil:'domcontentloaded',timeout:30000});
     if(!response||response.status()!==200)throw Error('browser HTTP '+(response?.status()??'none'));
     await page.locator(target.selector).first().waitFor({state:'visible',timeout:12000});
     const status=await page.evaluate(()=>({
      viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
      mainPresent:!!document.querySelector('main'),
      h1Text:(document.querySelector('h1')?.textContent||'').trim()
     }));
     if(!status.mainPresent||status.documentWidth>status.viewport+4||!status.h1Text)throw Error('unusable viewport or missing landmark: '+JSON.stringify(status));
     result[mode]=true;result[mode+'_details']={viewport:status.viewport,h1:status.h1Text.slice(0,110)};
     if(browserErrors.length)result[mode+'_js_warnings']=browserErrors.slice(0,3);
    }catch(e){
     result.errors.push(mode+': '+String(e.message||e));
     try{await page.screenshot({path:path.join(out,target.id+'-'+mode+'.png'),fullPage:false,timeout:10000})}catch{}
    }finally{await context.close()}
   }
  }catch(e){result.errors.push('browser_launch: '+String(e.message||e))}
  finally{if(browser)await browser.close()}
 }
 result.verified_online=result.html_source_matches_main&&result.desktop&&result.mobile;
 results.push(result);
 console.log(target.id+': '+(result.verified_online?'PASS':'NOT VERIFIED')+' '+result.errors.join(' | '));
}
const report={schema_version:1,started_at,ended_at:new Date().toISOString(),scope:'anonymous-public-homepages-only',results};
await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
if(process.env.GITHUB_STEP_SUMMARY){
 let body='## CONTROL V3 · Vérification des sites publics\n\n| Site | HTML identique à main | Bureau | Mobile | État |\n|---|---|---|---|---|\n';
 for(const r of results)body+='| '+r.site+' | '+(r.html_source_matches_main?'oui':'non')+' | '+(r.desktop?'oui':'non')+' | '+(r.mobile?'oui':'non')+' | '+(r.verified_online?'vérifié':'non vérifié')+' |\n';
 body+='\nLe rapport automatisé ne teste ni les comptes authentifiés, ni les paiements, ni les fonctionnalités avancées.\n';
 const {appendFile}=await import('node:fs/promises');
 await appendFile(process.env.GITHUB_STEP_SUMMARY,body);
}
if(results.some(r=>!r.verified_online))process.exitCode=1;
