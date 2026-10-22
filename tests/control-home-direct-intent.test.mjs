import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../assets/workspace-shell.css',import.meta.url),'utf8');
const finder=readFileSync(new URL('../assets/navigation-hub.js',import.meta.url),'utf8');
const script=home.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
const homeView=script.slice(script.indexOf('function home(){'),script.indexOf('function workspace('));

test('home offers a visible task-first search input instead of one more hidden menu',()=>{
 assert.match(homeView,/id="shell-quick-find"/);
 assert.match(homeView,/id="shell-quick-query"/);
 assert.match(homeView,/role="search"/);
 assert.match(homeView,/type="search" maxlength="180"/);
 assert.match(homeView,/Rechercher une fonction ou un projet/);
 assert.match(homeView,/type="submit">Trouver/);
 assert.match(css,/\.shell-quick-row\{display:flex/);
 assert.match(css,/min-width:0/);
});

test('home search delegates only navigation, without automatic mutations or external calls',()=>{
 const wiring=homeView.slice(homeView.indexOf("const quickFind=$('#shell-quick-find')"),homeView.indexOf("const addButton=$('#add-project')"));
 assert.match(wiring,/quickFind\.onsubmit=e=>/);
 assert.match(wiring,/e\.preventDefault\(\)/);
 assert.match(wiring,/CONTROL_NAVIGATION\?\.open\(\{query:/);
 assert.doesNotMatch(wiring,/fetch\(|localStorage|delete|commitHub\(/);
 assert.match(finder,/function open\(opts=\{\}\)/);
 assert.match(homeView,/Aucune action lancée sans votre choix/);
 let requested=null,prevented=0;
 const nodes={'#shell-quick-find':{},'#shell-quick-query':{value:'  créer un site web  '}};
 const find=(selector)=>nodes[selector];
 const window={CONTROL_NAVIGATION:{open:opts=>{requested=opts}}};
 const quick=new Function('
});
,'window',wiring+'return quickFind;')(find,window);
 quick.onsubmit({preventDefault(){prevented++}});
 assert.equal(prevented,1,'Submitting the form must not navigate/reload the browser');
 assert.deepEqual(requested,{query:'créer un site web'});
 assert.equal(nodes['#shell-quick-query'].value,'  créer un site web  ','User input must not be changed');
 new Function(script);
});
