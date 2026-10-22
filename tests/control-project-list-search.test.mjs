import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=source.slice(source.indexOf('<script>')+8,source.indexOf('</script>',source.indexOf('<script>')+8));
const start=script.indexOf(' const projectSearchKey=value=>');
const end=script.indexOf(" draw();$('#search').oninput=draw;",start);
const code=script.slice(start,end);

function search(input,projects){
 const nodes={'#search':{value:input},'#cards':{innerHTML:''},'#more-projects':{hidden:false,textContent:''}};
 const context={
  $:selector=>nodes[selector], projects, state:{uxRecent:[]},showAllProjects:false,
  nameOf:p=>p.name,
  esc:value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
 };
 runInNewContext(code+'\ndraw();',context);
 return nodes;
}

test('project search matches accents and multiple words in any order',()=>{
 assert.ok(start>0&&end>start,'Actual homepage filter must exist');
 const projects=[
  {id:'one',name:'Équipe Alpha',category:'Collectif'},
  {id:'two',name:'Equipe Beta',category:'Collectif'},
  {id:'three',name:'Un Coup de Pouce',category:'Startup'}
 ];
 let state=search('alpha equipe',projects);
 assert.match(state['#cards'].innerHTML,/Équipe Alpha/);
 assert.doesNotMatch(state['#cards'].innerHTML,/Equipe Beta/);
 state=search('EQUIPE ALPHA',projects);
 assert.match(state['#cards'].innerHTML,/Équipe Alpha/);
 state=search('Coup Pouce',projects);
 assert.match(state['#cards'].innerHTML,/Un Coup de Pouce/);
 assert.doesNotMatch(state['#cards'].innerHTML,/Equipe Beta/);
});

test('project filtering is local and does not change the stored list or reveal unsafe HTML',()=>{
 const projects=[{id:'unsafe',name:'<img src=x onerror=alert(1)>',category:'Personnel'}];
 const before=JSON.stringify(projects);
 const state=search('img',projects);
 assert.match(state['#cards'].innerHTML,/&lt;img/);
 assert.doesNotMatch(state['#cards'].innerHTML,/<img/);
 assert.equal(JSON.stringify(projects),before);
 assert.doesNotMatch(code,/fetch\(|localStorage|sessionStorage|\.push\(|\.splice\(/);
});

test('empty query still shows six projects with an explicit show-all button',()=>{
 const projects=Array.from({length:8},(_,i)=>({id:'p'+i,name:'Projet '+i}));
 const state=search('',projects);
 assert.equal((state['#cards'].innerHTML.match(/class="card"/g)||[]).length,6);
 assert.equal(state['#more-projects'].hidden,false);
 assert.match(state['#more-projects'].textContent,/Afficher tous les projets/);
});
