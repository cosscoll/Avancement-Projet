import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const css=read('assets/control-brand-simple-humain.css');
const homeCss=read('assets/control-home-v6.css');
const workspaceCss=read('assets/control-workspace-v7.css');
const html=read('index.html');
const cloud=read('app.html');
const sw=read('service-worker.js');
const logo=read('assets/icon.svg');
const manifest=JSON.parse(read('manifest.webmanifest'));
const config=JSON.parse(read('config/cloud.json'));

test('The agreed visual identity uses orange, cream, dark ink and Poppins with fallbacks',()=>{
 for(const color of ['#F76A39','#FFCAA3','#FFF8F2','#20252B','#B8431F','#16834B','#BB342B'])
  assert.ok(css.includes(color),'Missing token '+color);
 assert.match(css,/@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Poppins/);
 assert.match(css,/--control-font:"Poppins","Avenir Next","Segoe UI",system-ui,sans-serif/);
 assert.match(css,/--control-shadow:/);
});

test('The last stylesheet applies to the homepage and internal workspace without altering layout',()=>{
 const order=['assets/control-home-v6.css','assets/control-workspace-v7.css','assets/control-brand-simple-humain.css'];
 assert.ok(order.every((x)=>html.includes('href="'+x+'"')));
 assert.ok(html.indexOf(order[0])<html.indexOf(order[1]));
 assert.ok(html.indexOf(order[1])<html.indexOf(order[2]));
 assert.match(css,/body\.control-shell-v3\.control-simple-home/);
 assert.match(css,/body\.control-shell-v3\.control-simple-workspace/);
 for(const component of ['.control-home-v6-stat','.control-home-v6-ask','.control-home-v6-priority-row','.control-workspace-mainnav','.shell-project-navigation','.control-finder-panel','.as-steps','.as-agent-item'])
  assert.ok(css.includes(component),'Unstyled essential component '+component);
 assert.match(homeCss,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(workspaceCss,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(html,/id="shell-quick-find"/);
 assert.match(html,/id="control-home-nav-projects" href="#\/projects"/);
 assert.match(html,/href="#\/control\/inbox\/new"/);
});

test('Brand logo is used across both CONTROL shells, no other product is modified',()=>{
 assert.match(logo,/<title id="title">CONTROL<\/title>/);
 assert.match(logo,/stop-color="#F76A39"/);
 assert.match(logo,/<path d="M342 152 A131 131 0 1 0 342 360"/);
 assert.match(html,/class="control-home-v6-brand" href="#\/"><img class="control-brand-logo"/);
 assert.match(html,/class="logo"><img class="control-brand-logo"/);
 assert.match(cloud,/class="brand" href="\.\/app\.html"[\s\S]*?control-cloud-brand-icon/);
 assert.match(cloud,/href="\.\/assets\/control-brand-simple-humain\.css"/);
 assert.match(css,/body\.cloud-shell-v3/);
 assert.equal(config.enabled,false,'Theme changes must not activate gated Cloud');
 assert.ok(Object.values(config.launchChecks).every(value=>value===false));
});

test('PWA manifest, SVG and offline precache share the new appearance',()=>{
 assert.equal(manifest.theme_color,'#FFF8F2');
 assert.equal(manifest.background_color,'#FFF8F2');
 assert.equal(manifest.icons[0].src,'assets/icon.svg');
 assert.ok(manifest.icons.some(i=>i.sizes==='192x192'));
 assert.ok(manifest.icons.some(i=>i.sizes==='512x512'));
 assert.match(html,/meta name="theme-color" content="#FFF8F2"/);
 assert.match(cloud,/meta name="theme-color" content="#FFF8F2"/);
 assert.match(sw,/control-shell-v85/);
 assert.match(sw,/control-public-data-v85/);
 const paths=sw.match(/assets\/control-brand-simple-humain\.css/g)||[];
 assert.equal(paths.length,2,'Theme must be cached both as asset and critical shell resource');
});

test('The accessible action color contrasts with white and warm tinted surfaces',()=>{
 function luminance(hex){
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
 }
 function ratio(a,b){const p=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(p[0]+.05)/(p[1]+.05)}
 assert.ok(ratio('#B8431F','#FFFFFF')>=4.5);
 assert.ok(ratio('#B8431F','#FFE7D4')>=4.5);
 assert.ok(ratio('#20252B','#FFF8F2')>=7);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
});

test('Theme CSS is syntactically balanced and respects mobile shell behavior',()=>{
 let depth=0;
 for(const char of css){if(char==='{')depth++;if(char==='}')depth--;assert.ok(depth>=0,'Unmatched closing brace')}
 assert.equal(depth,0);
 assert.match(css,/@media\(max-width:800px\)/);
 assert.ok(!css.includes('display:none!important}\nbody.control-shell-v3.control-simple-workspace #main'),'Main workspace must not be hidden');
});
