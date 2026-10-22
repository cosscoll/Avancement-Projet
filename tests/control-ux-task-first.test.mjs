import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const center=load('assets/command-center.js'),css=load('assets/workspace-shell.css');
test('tool catalog includes prominent accessible search and an announced result count',()=>{
 assert.match(center,/id="tools-filter"/);
 assert.match(center,/id="tools-filter-status" role="status" aria-live="polite"/);
 assert.match(center,/Rechercher un outil/);
 assert.match(center,/field\?\.addEventListener\('input',/);
 assert.match(css,/\.shell-tools-search\{/);
});
test('tool filter searches across collapsed categories without permanently changing their open state',()=>{
 assert.match(center,/const original=sections\.map\(section=>section\.open\)/);
 assert.match(center,/section\.open=query\?Boolean\(match\):original\[i\]/);
 assert.match(center,/section\.hidden=Boolean\(query&&!match\)/);
 assert.match(center,/link\.hidden=!show/);
 assert.match(css,/\.clarity-tool-link\[hidden\],\.clarity-toolgroup\[hidden\]\{display:none!important\}/);
});
test('tool search handles accents, avoids network calls and keeps existing destination links',()=>{
 const part=center.slice(center.indexOf('function tools(){'),center.indexOf('function settings(){'));
 assert.match(part,/\.normalize\('NFD'\)/);
 assert.match(part,/\.split\(\/\\s\+\/\)/);
 for(const route of ['missions','meetings','calendar','budget','backup','deploy'])assert.ok(part.includes("['"+route+"'"),route);
 assert.doesNotMatch(part,/\bfetch\s*\(|localStorage|XMLHttpRequest/);
});
test('mission creation form is on-demand but remains operable for both single and four-IA plans',()=>{
 const missions=center.slice(center.indexOf('function missions(){'),center.indexOf('function tools(){'));
 assert.match(missions,/id="mission-create"/);
 assert.match(missions,/class="panel shell-progressive-form"/);
 assert.match(missions,/id="new-mission"/);
 assert.match(missions,/id="edit-mission"/);
 assert.match(missions,/registerForm\('#new-mission'/);
 assert.match(missions,/registerForm\('#edit-mission'/);
 assert.match(missions,/Préparer un plan avec plusieurs IA/);
 assert.match(missions,/Suivi des missions/);
 assert.match(css,/\.shell-progressive-form>summary/);
});
test('sensitive integrations remain separate and unchanged by presentation',()=>{
 assert.equal(JSON.parse(load('config/cloud.json')).enabled,false);
 new Function(center);
});
