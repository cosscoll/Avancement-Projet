import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const personal=read('index.html'),cloud=read('app.html'),cloudJs=read('assets/cloud-app.js');
const css=read('assets/workspace-shell.css'),sw=read('service-worker.js');
const localScript=personal.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
test('desktop CONTROL is a real two-zone workspace, not another centered card layout',()=>{
 assert.match(personal,/<body class="control-shell-v3">/);
 assert.match(personal,/<aside class="shell-sidebar" aria-label="Navigation permanente">/);
 assert.match(css,/@media\s*\(min-width:960px\)/);
 assert.match(css,/margin:0 0 0 262px/);
 assert.match(css,/background:#192331/);
 assert.match(css,/\.shell-feature-grid\{display:grid/);
 assert.match(css,/\.shell-dashboard-section\{order:3\}/);
 assert.match(css,/\.control-whats-new\{order:4\}/);
 assert.match(personal,/shell-feature-primary/);
 assert.match(personal,/shell-projects-list/);
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
 for(const text of ['NOUVEAUTÉS DISPONIBLES','clarity-work-nav','clarity-more-tabs','control-whats-new'])
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
test('PWA v58 precaches redesigned shell and invalidates stale installations',()=>{
 assert.match(sw,/CACHE_SHELL='control-shell-v58'/);
 assert.match(sw,/CACHE_PUBLIC='control-public-data-v58'/);
 assert.match(sw,/\.\/assets\/workspace-shell\.css/);
 assert.match(personal,/href="assets\/workspace-shell.css"/);
 assert.match(cloud,/href="\.\/assets\/workspace-shell.css"/);
 assert.match(read('tests/control-ia-browser-smoke.mjs'),/1440px desktop has persistent dark navigation/);
});