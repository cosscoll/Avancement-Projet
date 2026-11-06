import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('assets/control-ai-studio.js'),css=read('assets/control-ai-studio.css');
const snippet=source.slice(source.indexOf('function journey(){'),source.indexOf('const stats='));
function show(state){return runInNewContext('const db='+JSON.stringify(state)+';'+snippet+'\njourney()');}
test('CONTROL 26: new local users see a three-step journey without requiring an import',()=>{
 const html=show({imports:[],memories:[],agents:[]});
 assert.match(html,/Créer mon premier assistant/);
 assert.equal((html.match(/class="as-journey-step/g)||[]).length,3);
 for(const tab of ['imports','memories','agents'])assert.ok(html.includes('data-as-tab="'+tab+'"'),tab);
 assert.match(html,/facultatifs/);
 assert.match(html,/Aucun compte ChatGPT, Claude ou Gemini n’est connecté/);
});
test('CONTROL 26: steps reflect only real local imports and approved memories',()=>{
 const html=show({imports:[{id:'a'},{id:'b'}],memories:[{id:'m'}],agents:[]});
 assert.match(html,/2 conversation\(s\) importée\(s\)/);
 assert.match(html,/1 mémoire\(s\) approuvée\(s\)/);
 assert.match(html,/Créer mon assistant/);
});
test('CONTROL 26: guide disappears after a real agent is created',()=>{
 assert.equal(show({imports:[],memories:[],agents:[{id:'local-agent'}]}),'');
});
test('CONTROL 26: guidance reuses real tabs, is accessible and responsive',()=>{
 assert.match(source,/stats\(\)\+journey\(\)/);
 assert.match(source,/root\.querySelectorAll\('\[data-as-tab\]'\)/);
 assert.match(css,/\.as-journey-step:focus-visible/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.doesNotMatch(snippet,/\bfetch\s*\(|setItem\s*\(|XMLHttpRequest|api\.openai\.com/);
});
