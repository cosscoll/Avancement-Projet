import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/cloud-app.js',import.meta.url),'utf8');
const helper=source.slice(source.indexOf('function mutationSession(){'),source.indexOf('async function audit('));
const oldImport=source.slice(source.indexOf('async function importLegacy(){'),source.indexOf('async function action(button){'));
const exportCode=source.slice(source.indexOf('async function completeCloudExport('),source.indexOf('async function importLegacy(){'));
const logoutStart=source.indexOf("  case 'logout':{");
const logoutCode=source.slice(logoutStart,source.indexOf("  case 'export-json':",logoutStart));
const delStart=source.indexOf("  case 'delete-account':{");
const deletion=source.slice(delStart,source.indexOf("  default:return;",delStart));
assert.ok(helper.startsWith('function mutationSession(){')&&oldImport.startsWith('async function importLegacy(){')&&exportCode.startsWith('async function completeCloudExport(')&&deletion.includes('control-delete-account'));

function importer(options={}){
 const code=String.raw`
 let authUser={id:'A'},epoch=1,cache={projects:[],items:[],preferences:null};
 const fetches=[],projectRequests=[],itemRequests=[],upsertRequests=[],writes=[],messages=[];
 const localStorage={getItem:()=>JSON.stringify({legacyA:{memo:'PRIVATE A'}})};
 const fetch=()=>new Promise(resolve=>fetches.push(resolve));
 const prompt=()=> 'IMPORTER',confirm=()=>true,safeURL=x=>x;
 const reload=async()=>options.failedReload?false:messages.push('reload'),nav=x=>messages.push('nav:'+x),message=x=>messages.push(x);
 const client={from(table){return{
  insert(data){writes.push({table,data});return{select(){return{single(){if(table==='control_projects'&&options.pauseProject)return new Promise(resolve=>projectRequests.push(resolve));if(table==='control_items'&&options.pauseItem)return new Promise(resolve=>itemRequests.push(resolve));return Promise.resolve({data:table==='control_projects'?{id:'p1',owner_id:data.owner_id,name:data.name}:{id:'i1'},error:null})}}}}},
  upsert(data){writes.push({table,data});if(options.pauseUpsert)return new Promise(resolve=>upsertRequests.push(resolve));return Promise.resolve({error:null})}
 }}};
 `;
 return new Function('options',code+helper+oldImport+String.raw`
 return {importLegacy,fetches,projectRequests,itemRequests,upsertRequests,writes,messages,getCache:()=>cache,
  switchB(){authUser={id:'B'};epoch++;cache={projects:[],items:[],preferences:null}},
  reloginA(){epoch++;cache={projects:[],items:[],preferences:null}}};
 `)(options);
}
async function completeCatalog(h){
 for(const [i,resolve] of h.fetches.entries())resolve({ok:true,json:async()=>({projects:i===0?[{id:'legacyA',name:'Project A'}]:[]})});
 await Promise.resolve();
}
test('legacy migration cannot copy old account A secrets into account B after catalog fetch',async()=>{
 const h=importer(),pending=h.importLegacy();
 assert.equal(h.fetches.length,2);
 h.switchB();await completeCatalog(h);
 assert.equal(await pending,false);
 assert.deepEqual(h.writes,[]);assert.deepEqual(h.messages,[]);
});
test('relogin to same A invalidates previously authorized import',async()=>{
 const h=importer(),pending=h.importLegacy();
 h.reloginA();await completeCatalog(h);
 assert.equal(await pending,false);assert.deepEqual(h.writes,[]);
});
test('A project HTTP response after switch cannot seed B cache or trigger followup resource writes',async()=>{
 const h=importer({pauseProject:true}),pending=h.importLegacy();
 await completeCatalog(h);
 for(let i=0;i<20&&!h.projectRequests.length;i++)await Promise.resolve();
 assert.equal(h.projectRequests.length,1);
 assert.equal(h.writes[0].data.owner_id,'A');
 h.switchB();h.projectRequests[0]({data:{id:'pA',owner_id:'A'},error:null});
 assert.equal(await pending,false);
 assert.equal(h.writes.length,1);assert.deepEqual(h.getCache().projects,[]);assert.deepEqual(h.messages,[]);
});
test('normal legacy migration writes only original owner A and records result',async()=>{
 const h=importer(),pending=h.importLegacy();await completeCatalog(h);await pending;
 assert.deepEqual(h.writes.map(x=>x.table),['control_projects','control_items','control_preferences']);
 assert.ok(h.writes.every(x=>x.data.owner_id==='A'));
 assert.equal(h.getCache().projects.length,1);assert.equal(h.getCache().items.length,1);
 assert.equal(h.messages.length,3);
});

function exporter(options={}){
 const code=String.raw`
 let authUser={id:'A'},epoch=1,cache={projects:options.large?Array.from({length:405},(_,i)=>({id:'p'+String(i).padStart(4,'0'),owner_id:'A'})):[{id:'pA',owner_id:'A'}],items:[],preferences:null};
 if(options.foreign)cache.projects[0].owner_id='B';
 if(options.duplicate)cache.projects[400].id=cache.projects[0].id;
 const downloads=[],keys=[],messages=[],payloads=[],pageReads=[],paused=[];
 const prompt=()=> 'long-enough-password-for-export',confirm=()=>true;
 const crypto={getRandomValues:x=>x,subtle:{encrypt:async()=>new Uint8Array([1]).buffer}};
 const encKey=()=>new Promise(resolve=>keys.push(resolve)),encB64=()=> 'test';
 const Blob=class{constructor(content){this.content=content;payloads.push(String(content[0]))}};
 const URL={createObjectURL:()=>{downloads.push('url');return 'blob:a'},revokeObjectURL:()=>{}};
 const document={createElement:()=>({click(){downloads.push('click')},remove(){}}),body:{appendChild(){}}};
 const setTimeout=()=>{},message=x=>messages.push(x);
 const client={from(table){
  let head=false;
  const rows=()=>table==='control_projects'?cache.projects:table==='control_items'?cache.items:
   table==='control_connections'?[{id:'connectionA',owner_id:'A',provider:'Claude'}]:
   table==='control_audit_events'?[{id:'auditA',owner_id:options.foreignAudit?'B':'A',action:'test'}]:[];
  const q={
   eq(field,value){if(field!==(table==='control_profiles'?'user_id':'owner_id')||value!==authUser?.id)throw Error('Wrong owner filter');return q},
   order(field){if(field!=='id')throw Error('Missing stable id ordering');return q},
   range(first,last){
    pageReads.push({table,first,last});
    if(options.pausePage&&table==='control_projects')return new Promise(resolve=>paused.push(resolve));
    let data=rows().slice(first,last+1);
    if(options.shortPage&&table==='control_projects')data=data.slice(0,20);
    return Promise.resolve({data,error:null});
   },
   maybeSingle(){return Promise.resolve({data:table==='control_profiles'?{user_id:options.foreignProfile?'B':'A',display_name:'Owner A'}:null,error:null})},
   then(yes,no){
    if(!head)throw Error('An unexpected query was awaited');
    const count=options.noCountTable===table?null:rows().length+(options.badCountTable===table?1:0);
    return Promise.resolve({count,error:null}).then(yes,no);
   }
  };
  return {select(fields,params){head=params?.head===true;return q}};
 }};
 `;
 return new Function('options',code+helper+exportCode+String.raw`
 return {exportMyData,downloads,keys,messages,payloads,pageReads,paused,switchB(){authUser={id:'B'};epoch++;cache={projects:[],items:[],preferences:null}}};
 `)(options);
}
test('encrypted export cannot download A private file after the user switches to B during encryption',async()=>{
 const h=exporter(),pending=h.exportMyData(true);
 for(let i=0;i<30&&!h.keys.length;i++)await Promise.resolve();
 assert.equal(h.keys.length,1);h.switchB();h.keys[0]({});
 assert.equal(await pending,false);assert.deepEqual(h.downloads,[]);assert.deepEqual(h.messages,[]);
});
test('explicit cleartext export still creates file when A remains logged in',async()=>{
 const h=exporter();await h.exportMyData(false);
 assert.deepEqual(h.downloads,['url','click']);assert.equal(h.messages.length,1);
});


test('cloud export fetches every page rather than the truncated on-screen subset',async()=>{
 const h=exporter({large:true});
 await h.exportMyData(false);
 assert.equal(h.pageReads.filter(x=>x.table==='control_projects').length,2);
 assert.equal(JSON.parse(h.payloads[0]).projects.length,405);
 assert.deepEqual(h.downloads,['url','click']);
});

test('early-ending server page must never become a downloadable incomplete export',async()=>{
 const h=exporter({large:true,shortPage:true});
 await assert.rejects(h.exportMyData(false),/nombre de lignes différent/);
 assert.equal(h.downloads.length,0);
 assert.equal(h.payloads.length,0);
});
test('incomplete count metadata aborts the export rather than silently trusting pagination',async()=>{
 const h=exporter({noCountTable:'control_items'});
 await assert.rejects(h.exportMyData(false),/nombre de lignes différent/);
 assert.deepEqual(h.downloads,[]);
});
test('different server count aborts a paginated export before user confirmation',async()=>{
 const h=exporter({badCountTable:'control_audit_events'});
 await assert.rejects(h.exportMyData(false),/nombre de lignes différent/);
 assert.deepEqual(h.downloads,[]);
});
test('the private account UI exposes encrypted export and warns about plaintext data',()=>{
 assert.match(source,/btn\('Exporter une sauvegarde chiffrée','export-encrypted'\)/);
 assert.match(source,/btn\('Exporter en clair \(attention\)','export-json'\)/);
 assert.match(source,/case 'export-encrypted':await exportMyData\(true\)/);
});

test('account export refuses foreign-owner records and creates no file',async()=>{
 const h=exporter({foreign:true});
 await assert.rejects(h.exportMyData(false),/propriétaire ou identifiant/);
 assert.deepEqual(h.downloads,[]);
 assert.deepEqual(h.payloads,[]);
});
test('account export rejects duplicate IDs across pagination boundaries',async()=>{
 const h=exporter({large:true,duplicate:true});
 await assert.rejects(h.exportMyData(false),/propriétaire ou identifiant/);
 assert.deepEqual(h.downloads,[]);
});

test('full account export includes every one of the six CONTROL data tables',async()=>{
 const h=exporter();await h.exportMyData(false);
 const data=JSON.parse(h.payloads[0]);
 assert.equal(data.accountId,'A');
 assert.equal(data.profile.user_id,'A');
 assert.equal(data.projects.length,1);
 assert.equal(data.items.length,0);
 assert.equal(data.preferences,null);
 assert.equal(data.connections[0].provider,'Claude');
 assert.equal(data.auditEvents[0].action,'test');
 assert.deepEqual(h.pageReads.map(x=>x.table),['control_projects','control_items','control_connections','control_audit_events']);
});
test('full export refuses foreign-owner audit records before file generation',async()=>{
 const h=exporter({foreignAudit:true});
 await assert.rejects(h.exportMyData(false),/propriétaire ou identifiant/);
 assert.deepEqual(h.downloads,[]);
});
test('full export refuses foreign-user profile before file generation',async()=>{
 const h=exporter({foreignProfile:true});
 await assert.rejects(h.exportMyData(false),/profil du compte non vérifié/);
 assert.deepEqual(h.downloads,[]);
});

test('account switch during a pending export page creates no downloadable file',async()=>{
 const h=exporter({pausePage:true}),task=h.exportMyData(false);
 assert.equal(h.paused.length,1);
 h.switchB();h.paused[0]({data:[{id:'pA',owner_id:'A'}],error:null});
 assert.equal(await task,false);
 assert.deepEqual(h.downloads,[]);
});

function deleter(enabled=true,settings={}){
 const code=String.raw`
 let authUser={id:'A'},epoch=1,verificationSeq=0,cache={projects:[],items:[],preferences:null};
 const responses=[],signouts=[],signoutResolvers=[],messages=[];
 const cloudConfig={accountDeletionEnabled:options.enabled},prompt=()=> 'SUPPRIMER MON COMPTE',confirm=()=>true;
 const client={functions:{invoke:()=>new Promise(resolve=>responses.push(resolve))},auth:{signOut:async args=>{signouts.push(args);if(options.delaySignOut)return new Promise(resolve=>signoutResolvers.push(resolve));return{error:null}}}};
 const byId=()=>({innerHTML:''}),visible=()=>{},message=x=>messages.push(x),window={CONTROL_HELP:{reset(){}}};
 `;
 return new Function('options',code+helper+"async function action(button){switch(button.dataset.action){"+logoutCode+deletion+"  default:return;}}\n"+String.raw`
 return{action,responses,signouts,signoutResolvers,messages,read:()=>({authUser,cache}),switchB(){authUser={id:'B'};epoch++;cache={projects:[{id:'pB'}],items:[],preferences:null}},reloginA(){authUser={id:'A'};epoch++;cache={projects:[{id:'pA-new'}],items:[],preferences:null}},sdkSignedOut(){authUser=null;epoch++;cache={projects:[],items:[],preferences:null}}};
 `)({enabled,delaySignOut:settings.delaySignOut===true});
}
test('response for deleted A never signs out B after a session switch',async()=>{
 const h=deleter(),pending=h.action({dataset:{action:'delete-account'}});
 assert.equal(h.responses.length,1);h.switchB();h.responses[0]({data:{deleted:true},error:null});
 assert.equal(await pending,false);assert.deepEqual(h.signouts,[]);assert.deepEqual(h.messages,[]);
});
test('confirmed same-account deletion signs out its own browser session',async()=>{
 const h=deleter(),pending=h.action({dataset:{action:'delete-account'}});
 h.responses[0]({data:{deleted:true},error:null});
 await pending;assert.equal(h.signouts.length,1);assert.equal(h.messages.length,1);
});
test('deletion stays disabled without explicit backend permission',async()=>{
 const h=deleter(false);
 await assert.rejects(h.action({dataset:{action:'delete-account'}}),/non activée/);
 assert.equal(h.responses.length,0);
});

test('switch to B after item insert never writes A import marker to B',async()=>{
 const h=importer({pauseItem:true}),pending=h.importLegacy();
 await completeCatalog(h);
 for(let i=0;i<100&&!h.itemRequests.length;i++)await Promise.resolve();
 assert.equal(h.itemRequests.length,1);
 h.switchB();h.itemRequests[0]({data:{id:'item-A'},error:null});
 assert.equal(await pending,false);
 assert.deepEqual(h.getCache().items,[]);
 assert.equal(h.writes.some(w=>w.table==='control_preferences'),false);
 assert.deepEqual(h.messages,[]);
});
test('switch to B during preferences response cannot navigate to A project',async()=>{
 const h=importer({pauseUpsert:true}),pending=h.importLegacy();
 await completeCatalog(h);
 for(let i=0;i<100&&!h.upsertRequests.length;i++)await Promise.resolve();
 assert.equal(h.upsertRequests.length,1);
 assert.equal(h.writes.at(-1).data.owner_id,'A');
 h.switchB();h.upsertRequests[0]({error:null});
 assert.equal(await pending,false);
 assert.deepEqual(h.messages,[]);
});

test('late logout completion from A cannot wipe newly signed-in B workspace',async()=>{
 const h=deleter(true,{delaySignOut:true});
 const pending=h.action({dataset:{action:'logout'}});
 assert.equal(h.signoutResolvers.length,1);
 h.switchB();h.signoutResolvers[0]({error:null});
 assert.equal(await pending,false);
 assert.equal(h.read().authUser.id,'B');
 assert.equal(h.read().cache.projects[0].id,'pB');
 assert.deepEqual(h.messages,[]);
});
test('late logout completion cannot wipe freshly reauthenticated A session',async()=>{
 const h=deleter(true,{delaySignOut:true});
 const pending=h.action({dataset:{action:'logout'}});
 h.reloginA();h.signoutResolvers[0]({error:null});
 assert.equal(await pending,false);
 assert.equal(h.read().cache.projects[0].id,'pA-new');
 assert.deepEqual(h.messages,[]);
});
test('SDK SIGNED_OUT callback before signOut resolution does not double-complete logout',async()=>{
 const h=deleter(true,{delaySignOut:true});
 const pending=h.action({dataset:{action:'logout'}});
 h.sdkSignedOut();h.signoutResolvers[0]({error:null});
 assert.equal(await pending,false);assert.deepEqual(h.messages,[]);
});
test('logout still signs out active A session successfully',async()=>{
 const h=deleter();
 await h.action({dataset:{action:'logout'}});
 assert.equal(h.read().authUser,null);
 assert.equal(h.messages.length,1);
});
test('failed logout does not claim successful signout or clear valid A session',async()=>{
 const h=deleter(true,{delaySignOut:true});
 const pending=h.action({dataset:{action:'logout'}});
 h.signoutResolvers[0]({error:new Error('Failed signout')});
 await assert.rejects(pending,/Failed signout/);
 assert.equal(h.read().authUser.id,'A');
 assert.deepEqual(h.messages,[]);
});
test('account deletion confirmed for A cannot clear B while signOut is delayed',async()=>{
 const h=deleter(true,{delaySignOut:true});
 const pending=h.action({dataset:{action:'delete-account'}});
 h.responses[0]({data:{deleted:true},error:null});
 for(let i=0;i<50&&!h.signoutResolvers.length;i++)await Promise.resolve();
 assert.equal(h.signoutResolvers.length,1);
 h.switchB();h.signoutResolvers[0]({error:null});
 assert.equal(await pending,false);
 assert.equal(h.read().authUser.id,'B');
 assert.equal(h.read().cache.projects[0].id,'pB');
 assert.deepEqual(h.messages,[]);
});
test('SDK signout event prevents redundant A deletion completion without false UI notice',async()=>{
 const h=deleter(true,{delaySignOut:true});
 const pending=h.action({dataset:{action:'delete-account'}});
 h.responses[0]({data:{deleted:true},error:null});
 for(let i=0;i<50&&!h.signoutResolvers.length;i++)await Promise.resolve();
 assert.equal(h.signoutResolvers.length,1);
 h.sdkSignedOut();h.signoutResolvers[0]({error:null});
 assert.equal(await pending,false);
 assert.deepEqual(h.messages,[]);
});
test('server deletion confirmed but local signout failed never claims completed local logout',async()=>{
 const h=deleter(true,{delaySignOut:true});
 const pending=h.action({dataset:{action:'delete-account'}});
 h.responses[0]({data:{deleted:true},error:null});
 for(let i=0;i<50&&!h.signoutResolvers.length;i++)await Promise.resolve();
 assert.equal(h.signoutResolvers.length,1);
 h.signoutResolvers[0]({error:new Error('Local logout failed')});
 await assert.rejects(pending,/déconnexion locale non confirmée/);
 assert.equal(h.read().authUser.id,'A');
 assert.deepEqual(h.messages,[]);
});


test('concurrent legacy imports never schedule duplicate writes in one browser session',async()=>{
 const h=importer(),original=h.importLegacy();
 await assert.rejects(()=>h.importLegacy(),/déjà en cours/);
 assert.equal(h.fetches.length,2,'One import starts only one set of catalog requests');
 await completeCatalog(h);await original;
 assert.deepEqual(h.writes.map(x=>x.table),['control_projects','control_items','control_preferences']);
 assert.equal(h.importLegacy.inFlight,false,'The in-page gate must release on completion');
});
test('abandoned account import releases its gate without writing old account data',async()=>{
 const h=importer(),original=h.importLegacy();
 h.switchB();await completeCatalog(h);
 assert.equal(await original,false);
 assert.equal(h.importLegacy.inFlight,false,'Session change must release in-page import gate');
 assert.deepEqual(h.writes,[]);
});


test('legacy import does not navigate or claim completion if reread fails after writes',async()=>{
 const h=importer({failedReload:true}),pending=h.importLegacy();
 await completeCatalog(h);
 await assert.rejects(pending,/Migration enregistrée, mais synchronisation non vérifiée/);
 assert.deepEqual(h.writes.map(x=>x.table),['control_projects','control_items','control_preferences']);
 assert.deepEqual(h.messages,[]);
 assert.equal(h.importLegacy.inFlight,false);
});
