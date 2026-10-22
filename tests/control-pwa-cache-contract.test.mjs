import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const sw=readFileSync(new URL('service-worker.js',root),'utf8');
const version=kind=>{
 const match=sw.match(new RegExp("const CACHE_"+kind+"='control-"+(kind==='SHELL'?'shell':'public-data')+"-v(\\d+)'"));
 assert.ok(match,'The service worker must declare a numbered '+kind+' cache');
 return Number(match[1]);
};
const shellVersion=version('SHELL');
const dataVersion=version('PUBLIC');

test('PWA shell and public data cache versions stay in sync',()=>{
 assert.equal(shellVersion,dataVersion);
 assert.ok(shellVersion>0);
});

test('all Node regressions target current cache version, not a silently stale release',()=>{
 const tests=new URL('./',import.meta.url);
 for(const file of readdirSync(tests).filter(x=>x.endsWith('.test.mjs'))){
  const content=readFileSync(new URL(file,tests),'utf8');
  for(const match of content.matchAll(/control-(?:shell|public-data)-v(\d+)/g)){
   const observed=Number(match[1]);
   if(observed<10)continue; // CSS shell version (e.g. "control-shell-v3"), not a PWA cache.
   if(file==='pwa-atomic-install.test.mjs'&&observed===37)continue; // Explicit old-cache survival fixture.
   assert.equal(observed,shellVersion,file+' references obsolete '+match[0]);
  }
 }
});
