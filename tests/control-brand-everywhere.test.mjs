import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const brand=read('assets/control-brand-global.css');
const oldBrand=read('assets/control-brand-simple-humain.css');
const pages=['index.html','app.html','legacy.html','testeurs.html'];
const palette={
 cream:'#FFF8F2',paper:'#FFFDFB',peach:'#FFF0E5',orange:'#F76A39',
 accent:'#B8431F',hover:'#AE3C1D',ink:'#20252B',muted:'#6D6763',line:'#EDDED3'
};
test('All four application entrypoints load the same brand stylesheet LAST',()=>{
 for(const path of pages){
  const html=read(path);
  const css=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g)].map(m=>m[1]);
  assert.ok(css.length,'Missing stylesheets in '+path);
  assert.equal(css.at(-1).replace(/^\.\//,''),'assets/control-brand-global.css',path+' final stylesheet');
  assert.equal(css.filter(s=>s.includes('control-brand-global.css')).length,1,'Duplicate global CSS in '+path);
  assert.doesNotMatch(brand,/(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*!important/i,'brand should not hide features');
 }
 assert.match(read('legacy.html'),/<body class="control-legacy">/);
 assert.match(read('testeurs.html'),/<body class="control-pilot">/);
});
test('User-approved warm palette and Poppins are central, not replaced by navy',()=>{
 for(const color of Object.values(palette))assert.ok(brand.includes(color),'Missing brand color '+color);
 assert.match(brand,/--control-font:"Poppins"/);
 assert.match(oldBrand,/Simple & Humain/);
 assert.match(brand,/body\.control-shell-v3/);
 assert.match(brand,/body\.cloud-shell-v3/);
 assert.match(brand,/body\.control-legacy/);
 assert.match(brand,/body\.control-pilot/);
 assert.doesNotMatch(brand,/#(?:315b94|294d70|213e61|1c2b40|f6f8fb)\b/i,'Old blue color must not return in final layer');
});
test('Known feature pages, help and inner screens all have theme scopes',()=>{
 const marker=['.as-shell','.tool-page','.deploy-page','.lab-shell','.loc-shell',
  '.cmd-shell','.vs-page','.web-builder','.ch-panel','.ch-launch',
  '.control-task-group','.control-search-group','.control-project-brief-panel',
  '.control-workspace-mainnav','.control-home-v6','.pilot-task'];
 for(const selector of marker)assert.ok(brand.includes(selector),'Missing feature skin: '+selector);
 assert.match(brand,/\.notice-error/);
 assert.match(brand,/var\(--control-negative\)/);
 assert.match(brand,/var\(--control-positive\)/);
 assert.match(brand,/prefers-reduced-motion/);
});
test('New stylesheet participates in reliable PWA offline install',()=>{
 const sw=read('service-worker.js');
 assert.match(sw,/const CACHE_SHELL='control-shell-v107'/);
 assert.match(sw,/const CACHE_PUBLIC='control-public-data-v107'/);
 const parts=sw.match(/const (?:ASSETS|CRITICAL_SHELL)=.+/g)||[];
 assert.ok(parts.length>=2);
 for(const part of parts)assert.match(part,/control-brand-global\.css/);
 const m=sw.match(/const ASSETS=(\[[^\n]+\])/);
 assert.ok(m);
 assert.equal((m[1].match(/control-brand-global\.css/g)||[]).length,1,'Cache declaration must not repeat stylesheet');
});
test('Theme layer never alters JS flow or grants Cloud access',()=>{
 const cloud=JSON.parse(read('config/cloud.json'));
 assert.equal(cloud.enabled,false);
 assert.ok(!Object.values(cloud.launchChecks).some(Boolean));
 const cssFlags=/(?:<script|javascript:|url\(\s*['"]?javascript:)/i;
 assert.doesNotMatch(brand,cssFlags);
});
