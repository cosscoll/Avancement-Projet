import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/control-home-v6.css',import.meta.url),'utf8');
const sw=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
const command=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
const summaryCtx={module:{exports:{}}};
runInNewContext(readFileSync(new URL('../assets/control-day-brief.js',import.meta.url),'utf8'),summaryCtx);
const {summarize}=summaryCtx.module.exports;
const date=new Date(2026,10,3,12);

test('Home has precisely the approved primary sections, in the right order',()=>{
 const anchors=['control-home-v6-header','control-home-v6-welcome','control-home-v6-stats','control-home-v6-ask','control-home-v6-priorities','control-home-v6-tabs'];
 const indices=anchors.map(x=>html.indexOf(x));
 assert.ok(indices.every(x=>x>=0), 'Missing visual section');
 assert.deepEqual(indices,indices.toSorted((a,b)=>a-b));
 assert.match(html,/Bonjour\./);
 assert.match(html,/Mon entreprise/);
 assert.match(html,/Demander à CONTROL/);
 assert.match(html,/À traiter en priorité/);
 assert.match(html,/Que voulez-vous faire aujourd’hui/);
 assert.match(html,/Préparer cette action/);
});

test('Three metrics count real local records, without hardcoded mockup figures',()=>{
 const sample={actions:[
  {title:'Urgent en retard',due:'2026-11-01',status:'todo',priority:'Critique'},
  {title:'Critique non échue',due:'2026-11-17',status:'todo',priority:'Critique'},
  {title:'Standard',due:'2026-11-03',status:'todo',priority:'Normale'},
  {title:'Clos',due:'2026-11-01',status:'done',priority:'Critique'}
 ],missions:[{title:'Avis',status:'review'}]};
 const s=summarize(sample,date);
 assert.equal(s.urgent,2);
 assert.equal(s.overdue,1);
 assert.equal(s.open,3);
 assert.equal(s.review,1);
 assert.equal(s.items.length,3);
 assert.ok(html.includes('counter(day.urgent)'));
 assert.ok(html.includes('counter(day.open)'));
 assert.ok(html.includes('counter(day.review)'));
});

test('No fabricated zeros for unreadable local data',()=>{
 assert.equal(summarize('{',date).status,'invalid');
 assert.equal(summarize(null,date).urgent,0);
 assert.match(html,/const invalid=day\.status==='invalid'/);
 assert.match(html,/const counter=n=>invalid\?'—'/);
 assert.match(html,/Les données locales sont illisibles/);
});

test('Homepage has four functioning navigation destinations, tools kept accessible',()=>{
 for(const dest of ['href="#/"','id="control-home-nav-projects"','href="#/control/team"','href="#/control/aistudio"'])
  assert.ok(html.includes(dest),dest);
 assert.match(html,/if\(projectsView\)\$\('#control-home-projects'\)\.open=true/);
 assert.match(html,/id="cards"/);
 assert.match(html,/id="new-project"/);
 assert.match(html,/id="shell-quick-find"/);
 assert.match(html,/control-home-v6-advanced/);
 assert.match(command,/function team\(\)/);
 assert.match(command,/manager,team,tools/);
});

test('Old blue hero and sidebar are not used on this home, and mobile has one bottom menu',()=>{
 const home=html.slice(html.indexOf('function home(){'),html.indexOf(' const projectSearchKey=',html.indexOf('function home(){')));
 assert.ok(!home.includes('shell-feature-primary'));
 assert.ok(!home.includes('control-home-v4'));
 assert.match(html,/document\.body\.classList\.remove\('control-simple-home'\)/);
 assert.match(home,/classList\.add\('control-simple-home'\)/);
 assert.match(css,/control-simple-home \.shell-sidebar/);
 assert.match(css,/control-simple-home \.mobilefoot/);
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:340px\)/);
});

test('New stylesheet is loaded after old layout and survives offline PWA updates',()=>{
 const old=html.indexOf('href="assets/workspace-shell.css"');
 const fresh=html.indexOf('href="assets/control-home-v6.css"');
 assert.ok(old>=0&&fresh>old);
 assert.match(sw,/control-shell-v85/);
 assert.match(sw,/control-public-data-v77/);
 assert.match(sw,/assets\/control-home-v6\.css/);
});
