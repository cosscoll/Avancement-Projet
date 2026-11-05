import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/control-workspace-v7.css',import.meta.url),'utf8');
const homeCss=readFileSync(new URL('../assets/control-home-v6.css',import.meta.url),'utf8');
const command=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
const worker=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');

test('CONTROL workspace loads after the accepted home stylesheet',()=>{
 assert.ok(html.includes('assets/control-home-v6.css'));
 assert.ok(html.includes('assets/control-workspace-v7.css'));
 assert.ok(html.indexOf('assets/control-home-v6.css')<html.indexOf('assets/control-workspace-v7.css'));
 assert.ok(homeCss.includes('control-home-v6'));
});

test('Inner pages have only the four approved primary destinations',()=>{
 const nav=html.match(/<nav class="control-workspace-mainnav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
 assert.ok(nav,'Missing inner navigation');
 const links=nav.match(/data-workspace-nav="/g)||[];
 assert.equal(links.length,4);
 for(const dest of ['#/','#/projects','#/control/team','#/control/aistudio'])
  assert.ok(nav.includes('href="'+dest+'"'),dest);
 assert.ok(nav.includes('aria-hidden="true"'),'Decorative SVG icons should be ignored by screen readers');
 assert.ok(html.includes("link.setAttribute('aria-current',selected?'page':'false')"));
});

test('Workspace stylesheet hides old rails without affecting Cloud',()=>{
 assert.match(html,/classList\.add\('control-simple-workspace'\)/);
 assert.match(html,/classList\.remove\('control-simple-workspace'\)/);
 assert.match(css,/control-simple-workspace \.shell-sidebar/);
 assert.match(css,/control-simple-workspace \.mobilefoot/);
 assert.match(css,/control-simple-workspace \.control-nav-mobile-trigger/);
 assert.ok(!css.includes('body.cloud-shell-v3'),'Cloud must keep its existing security-gated layout');
});

test('Mobile navigation stays visible with touch-size links and search',()=>{
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(css,/position:fixed;left:0;right:0;bottom:0/);
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/\.control-head \.head-search::before/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/control-workspace-mainnav a:focus-visible/);
});

test('Projects has a real focused landing and preserves existing search / creation',()=>{
 assert.match(html,/const projectsView=location\.hash==='#\/projects'/);
 assert.match(html,/if\(projectsView\)\$\('#control-home-projects'\)\.open=true/);
 assert.match(html,/control-home-v6--projects/);
 assert.match(css,/control-home-v6--projects \.control-home-v6-ask/);
 assert.match(css,/control-home-v6--projects \.control-home-v6-projects/);
 for(const id of ['id="search"','id="cards"','id="new-project"','id="add-project"'])
  assert.ok(html.includes(id));
});

test('Project core sections remain reachable; advanced tabs start collapsed',()=>{
 const section=html.slice(html.indexOf('function workspace('),html.indexOf('function settings('));
 assert.match(section,/const showAdvanced=advanced;/);
 for(const name of ["'Mes IA'","'Conversations'","'Suivi'","'Documents & liens'"])
  assert.ok(section.includes(name),name);
 assert.match(section,/shell-project-more/);
 assert.match(section,/data-tab/);
});

test('Core task and agent modules remain wired, no Cloud activation',()=>{
 for(const path of ['assets/command-center.js','assets/control-ai-studio.js','assets/control-task-workflow.js'])
  assert.ok(html.includes('src="'+path+'"'),path);
 assert.match(command,/function team\(\)/);
 assert.match(command,/MON ESPACE · CONTROL/);
 const config=JSON.parse(readFileSync(new URL('../config/cloud.json',import.meta.url),'utf8'));
 assert.equal(config.enabled,false);
 assert.ok(Object.values(config.launchChecks).every(value=>value===false));
});

test('One-click local task creation is available without opening technical menus',()=>{
 assert.match(html,/class="control-quick-task" href="#\/control\/inbox\/new"/);
 assert.match(html,/aria-label="Créer une tâche"/);
 assert.match(css,/control-head \.control-quick-task/);
 assert.match(command,/route\(\)\.param==='new'/);
});

test('Latest offline shell version includes workspace stylesheet',()=>{
 assert.match(worker,/control-shell-v84/);
 assert.match(worker,/control-public-data-v84/);
 assert.match(worker,/\.\/assets\/control-workspace-v7\.css/);
});
