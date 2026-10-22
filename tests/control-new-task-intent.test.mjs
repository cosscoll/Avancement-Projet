import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const finderCode=readFileSync(new URL('../assets/navigation-hub.js',import.meta.url),'utf8');
const command=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
const routeSource=command.match(/function route\(\)\{[^\n]*\}/)?.[0]||'';
const focusSource=command.slice(
 command.indexOf(" if(route().page==='inbox'&&route().param==='new'){"),
 command.indexOf(" paintSprints('#inbox-sprint-status',true);")
);

test('new task intent leads straight to the personal action form and stays unavailable in Cloud',()=>{
 const window={};
 runInNewContext(finderCode,{window,document:{addEventListener(){}},
  location:{hash:'#/'},sessionStorage:{setItem(){}}});
 const nav=window.CONTROL_NAVIGATION;
 assert.equal(nav.find('je veux créer une tâche')[0]?.target,'#/control/inbox/new');
 assert.ok(nav.find('mes tâches').some(x=>x.id==='inbox'));
 nav.setAdapter({mode:'cloud',isAvailable:()=>true});
 assert.equal(nav.getItems().some(x=>x.id==='new-action'),false);
});

test('inbox/new is parsed as inbox with a safe new-form instruction',()=>{
 assert.ok(routeSource,'Command center route must exist');
 const parsed=runInNewContext(routeSource+'route()', {location:{hash:'#/control/inbox/new'}});
 assert.equal(parsed.page,'inbox');
 assert.equal(parsed.param,'new');
 assert.doesNotMatch(focusSource,/commitLocal\(|db\.actions\.push\(|localStorage/);
});

test('direct route scrolls to the action title and focuses it without writing data',()=>{
 assert.ok(focusSource.startsWith(" if(route().page==='inbox'&&route().param==='new'){"));
 let scrolls=0,focuses=0;
 const title={scrollIntoView(){scrolls++},focus(){focuses++}};
 const context={route:()=>({page:'inbox',param:'new'}),$:(selector)=>{
  assert.equal(selector,'#new-action input[name="title"]');
  return title;
 },window:{matchMedia:()=>({matches:true})}};
 runInNewContext(focusSource,context);
 assert.equal(scrolls,1);
 assert.equal(focuses,1);
 context.route=()=>({page:'inbox',param:''});
 runInNewContext(focusSource,context);
 assert.equal(scrolls,1);
 assert.equal(focuses,1);
});
