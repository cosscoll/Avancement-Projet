import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const command=read('assets/command-center.js'),css=read('assets/command-center.css'),brief=read('assets/control-project-brief.js');
const search=command.slice(command.indexOf('function search(){'),command.indexOf('const SPRINT_IDS=',command.indexOf('function search(){')));
test('CONTROL 25: visible search groups results by verified type and project scope',()=>{
 assert.match(search,/const kinds=\['Action','Décision','Projet','Client','Mission','Ressource','Événement'\]/);
 assert.match(search,/const groups=kinds\.map/);
 assert.match(search,/data-search-group=/);
 assert.match(search,/h\(pname\(x\.project\)\)/);
 assert.match(search,/h\(x\.metadata\)/);
 assert.match(search,/h\(x\.url\)/);
 assert.match(search,/65 premiers affichés/);
});
test('CONTROL 25: deep links preserve project scope and reject unknown scope',()=>{
 assert.match(search,/requestedProject=params\.get\('project'\)/);
 assert.match(search,/ctx\.projects\.some\(p=>p\.id===requestedProject\)/);
 assert.match(search,/Projet demandé introuvable/);
 assert.match(search,/projopts\(validProject\?requestedProject:''/);
 assert.match(brief,/href="#\/control\/search\?project=/);
});
test('CONTROL 25: results are keyboard-reachable and responsive, without remote AI claims',()=>{
 assert.match(search,/\.oninput=draw/);
 assert.match(search,/\.onchange=draw/);
 assert.match(search,/aria-live="polite"/);
 assert.match(search,/rel="noopener noreferrer"/);
 assert.match(css,/\.control-search-hit:focus-visible/);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.match(search,/aucune synchronisation automatique avec les conversations privées/);
});
