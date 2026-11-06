import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const personal=read('index.html'),cloud=read('app.html'),cloudJs=read('assets/cloud-app.js');
const css=read('assets/workspace-shell.css'),sw=read('service-worker.js');
const localScript=personal.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
test('approved simple homepage replaces the legacy dark two-column rail without deleting routes',()=>{
 assert.match(personal,/<body class="control-shell-v3">/);
 assert.match(personal,/<aside class="shell-sidebar" aria-label="Navigation permanente">/);
 assert.match(personal,/href="assets\/control-home-v6\.css"/);
 assert.match(personal,/href="assets\/control-workspace-v7\.css"/);
 assert.match(personal,/control-home-v6-header/);
 assert.match(personal,/control-home-v6-priorities/);
 const homeStyle=read('assets/control-home-v6.css');
 const workspaceStyle=read('assets/control-workspace-v7.css');
 assert.match(homeStyle,/control-simple-home \.shell-sidebar/);
 assert.match(workspaceStyle,/control-simple-workspace \.shell-sidebar/);
 assert.match(personal,/document\.body\.classList\.add\('control-simple-home'\)/);
});
test('desktop sidebar uses existing app routes and recent projects, without duplicating bottom tabs',()=>{
 for(const route of ['#/','control/inbox','control/manager','control/missions','control/calendar','automations','control/tools'])
  assert.ok(personal.includes(route),route);
 assert.match(localScript,/id="shell-recent-projects"|sidebarProjects=/);
 assert.match(localScript,/aria-current/);
 const bar=personal.match(/<nav class="mobilefoot"[\s\S]*?<\/nav>/)?.[0]||'';
 assert.equal((bar.match(/data-go=/g)||[]).length,4);
});
test('personal dashboard preserves project creation, search, all-project pagination and full feature access',()=>{
 for(const selector of ['id="add-project"','id="new-project"','id="cards"','id="more-projects"','id="search"','data-control-nav-open'])
  assert.ok(localScript.includes(selector),selector);
 assert.ok(personal.includes('control-workspace-mainnav'),'Inner navigation must still exist');
 for(const text of ['control-home-v6-welcome','control-home-v6-priorities','control-home-v6-advanced'])
  assert.ok(localScript.includes(text),text);
 new Function(localScript);
});
test('Cloud sidebar exists but cannot appear before authentication',()=>{
 assert.match(cloud,/<aside id="cloud-side" class="shell-sidebar" hidden/);
 assert.match(cloud,/class="cloud-shell-v3"/);
 assert.match(cloudJs,/byId\('cloud-side'\)\.hidden=which!=='workspace'/);
 assert.match(cloudJs,/classList\?\.toggle\('shell-cloud-ready',which==='workspace'\)/);
 assert.match(cloudJs,/data-action="open-project"/);
 assert.match(cloudJs,/shell-feature-primary/);
 assert.equal(JSON.parse(read('config/cloud.json')).enabled,false);
 new Function(cloudJs);
});
test('responsive layout hides the desktop sidebar and preserves readable phone dashboard',()=>{
 assert.match(css,/@media\(max-width:959px\)/);
 assert.match(css,/\.shell-sidebar\{display:none!important\}/);
 assert.match(css,/\.shell-projects-list\{grid-template-columns:1fr!important\}/);
 assert.match(css,/\.shell-feature-grid\{grid-template-columns:1fr/);
});
test('current PWA release precaches the redesigned shell and invalidates stale installations',()=>{
 assert.match(sw,/CACHE_SHELL='control-shell-v\d+'/);
 assert.match(sw,/CACHE_PUBLIC='control-public-data-v\d+'/);
 assert.match(sw,/\.\/assets\/workspace-shell\.css/);
 assert.match(personal,/href="assets\/workspace-shell.css"/);
 assert.match(cloud,/href="\.\/assets\/workspace-shell.css"/);
 assert.match(read('tests/control-ia-browser-smoke.mjs'),/control-home-v6-stats/);
 assert.match(read('tests/control-ia-browser-smoke.mjs'),/width:1440,height:900/);
});