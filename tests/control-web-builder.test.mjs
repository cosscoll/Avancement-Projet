import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/control-web-builder.js',import.meta.url),'utf8');
const state={};
new Function('window',source)(state);
const site=state.CONTROL_WEB_BUILDER_CORE;
assert.ok(site,'Client-side generator is available without a server');

function unzipStored(binary){
 const bytes=Buffer.from(binary),files={},names=[];
 let position=0;
 while(position+4<=bytes.length&&bytes.readUInt32LE(position)===0x04034b50){
  assert.equal(bytes.readUInt16LE(position+8),0,'Only stored entries');
  const size=bytes.readUInt32LE(position+18);
  const namesize=bytes.readUInt16LE(position+26),extra=bytes.readUInt16LE(position+28);
  const name=bytes.subarray(position+30,position+30+namesize).toString();
  const from=position+30+namesize+extra;
  files[name]=bytes.subarray(from,from+size).toString();
  names.push(name);
  position=from+size;
 }
 assert.equal(bytes.readUInt32LE(position),0x02014b50,'Central directory begins after files');
 assert.equal(bytes.readUInt32LE(bytes.length-22),0x06054b50,'End-of-central-directory exists');
 assert.equal(bytes.readUInt16LE(bytes.length-22+10),names.length,'Archive reports correct number of files');
 return files;
}

test('three intentionally distinct locally renderable site models',()=>{
 assert.deepEqual(Object.keys(site.THEMES),['studio','atelier','produit']);
 for(const theme of Object.keys(site.THEMES)){
  const settings=site.normalize({theme,brand:'Mon Projet'});
  const html=site.markup(settings,true);
  assert.match(html,/<!doctype html>/i);
  assert.match(html,/<html lang="fr">/);
  assert.match(html,/meta name="viewport"/);
  assert.match(html,/class="hero"/);
  assert.match(html,/<style>/);
  assert.match(html,/Mon Projet/);
  assert.doesNotMatch(html,/<script\b/i);
  assert.doesNotMatch(html,/https?:\/\//i,'Self-contained preview must not access external assets');
  assert.ok(html.includes('id="contact"'));
  assert.equal(settings.services.length,3);
 }
 assert.match(site.markup(site.normalize({theme:'atelier'}),true),/class="hero"><div>/);
 assert.match(site.markup(site.normalize({theme:'produit'}),true),/product-ui/);
});

test('untrusted fields are escaped without executable HTML or attribute injection',()=>{
 const attack='"><script>alert(1)</script><img src=x onerror=alert(1)>';
 const fields=site.normalize({brand:attack,title:attack,tag:attack,description:attack,cta:attack,services:[attack,attack,attack],email:'" onmouseover="alert(2)'});
 const html=site.markup(fields,true),generated=site.files(fields);
 assert.doesNotMatch(html,/<script\b|<img\b/i,'Escaped attacker content cannot create new DOM tags');
 assert.doesNotMatch(html,/javascript:|data:/i);
 assert.match(html,/&lt;script&gt;/);
 assert.ok(!html.includes(attack));
 assert.match(generated['index.html'],/href="\.\/styles\.css"/);
 assert.doesNotMatch(generated['index.html'],/<style>/);
 assert.match(generated['standalone.html'],/<style>/);
});

test('site bundles are deterministic and self-contained',()=>{
 const draft={theme:'produit',brand:'Studio Étincelle',title:'Un site démonstration',email:'contact@example.com',services:['A','B','C']};
 const a=site.files(draft),b=site.files(draft);
 assert.deepEqual(a,b);
 assert.deepEqual(Object.keys(a),['index.html','styles.css','standalone.html','README.md']);
 assert.match(a['index.html'],/href="\.\/styles\.css"/);
 assert.match(a['standalone.html'],/contact@example.com/);
 assert.match(a['styles.css'],/\.product \.visual/);
 assert.match(a['README.md'],/Aucun JavaScript/);
 const exported=unzipStored(site.zip(a));
 assert.deepEqual(exported,a,'The downloaded ZIP must open with all four exact files');
});

test('long fields are bounded, invalid theme or e-mail rejected',()=>{
 const data=site.normalize({theme:'<script>',brand:'x'.repeat(10000),title:'y'.repeat(10000),services:Array(100).fill('z'.repeat(500)),email:'javascript:alert(1)'});
 assert.equal(data.theme,'studio');
 assert.equal(data.brand.length,64);
 assert.equal(data.title.length,130);
 assert.equal(data.services.length,3);
 assert.equal(data.services[0].length,90);
 assert.equal(data.email,'');
 assert.match(site.markup(data,true),/href="#contact"/);
});

test('ZIP exporter blocks unsafe paths, non-strings and oversized content',()=>{
 for(const path of ['../secret','folder/file','a\b','../../api_key'])assert.throws(()=>site.zip({[path]:'test'}));
 assert.throws(()=>site.zip({'index.html':5}));
 assert.throws(()=>site.zip({'large.html':'A'.repeat(3_000_001)}));
 assert.throws(()=>site.zip({}));
});

test('user interface is in a sandbox with no scripts or remote publishing',()=>{
 const ui=readFileSync(new URL('../assets/control-web-builder-ui.js',import.meta.url),'utf8');
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 assert.match(ui,/sandbox=""/);
 assert.match(ui,/referrerpolicy="no-referrer"/);
 assert.match(ui,/\.srcdoc=engine\.markup/);
 assert.match(ui,/engine\.zip\(files\)/);
 assert.match(ui,/id="builder-code" readonly/);
 assert.match(ui,/api\.save\(item\)/);
 assert.match(ui,/api\.remove\(selectedId\)/);
 assert.ok(index.indexOf('assets/control-web-builder.js')<index.indexOf('assets/command-center.js'));
 assert.ok(index.includes('assets/control-web-builder.css'));
 assert.match(app,/function webbuilder\(\)/);
 assert.match(app,/const pages=\{manager,tools,webbuilder/);
 assert.match(app,/return commitLocal\(\(\)=>\{/);
 assert.match(app,/websites:\[\]/);
 assert.match(app,/decisions','websites','messages/);
 assert.equal(JSON.parse(readFileSync(new URL('../config/cloud.json',import.meta.url),'utf8')).enabled,false);
});

test('builder quality checks produce reproducible, actionable results',()=>{
 const incomplete=site.audit({theme:'studio',brand:'MON STUDIO',description:'Court',email:''});
 assert.equal(incomplete.total,8);
 assert.ok(incomplete.passed<incomplete.total);
 assert.ok(incomplete.checks.some(x=>x.id==='email'&&!x.ok&&x.field==='email'));
 assert.ok(incomplete.checks.some(x=>x.id==='description'&&!x.ok&&x.field==='description'));
 const complete=site.audit({
  theme:'produit',brand:'Studio Qualité',title:'Créons ensemble des parcours numériques plus simples',
  description:'Notre équipe accompagne les professionnels pour créer des interfaces durables, accessibles et réellement adaptées à leurs besoins.',
  services:['Sites web sur mesure','Audit de parcours','Conseil et stratégie'],
  email:'bonjour@example.fr'
 });
 assert.equal(complete.passed,8);
 assert.equal(complete.total,8);
 assert.equal(complete.checks.filter(x=>!x.ok).length,0);
 assert.equal(site.audit(complete).passed,8);
});
test('static quality panel remains advisory and never runs tests on untrusted HTML',()=>{
 const ui=readFileSync(new URL('../assets/control-web-builder-ui.js',import.meta.url),'utf8');
 assert.match(ui,/engine\.audit\(working\)/);
 assert.match(ui,/id="builder-audit-score"/);
 assert.match(ui,/id="builder-audit-list"/);
 assert.match(ui,/data-audit-field/);
 assert.match(ui,/ne remplacent pas une recette SEO/);
 assert.match(ui,/iframe id="builder-preview"[^>]+sandbox=""/);
});
