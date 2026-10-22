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
 assert.match(ui,/\.srcdoc=previewContent/);
 assert.match(ui,/engine\.markup\(working,true\)/);
 assert.match(ui,/engine\.pageMarkup\(working,page,true\)/);
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
 const valid={
  theme:'produit',brand:'Studio Qualité',title:'Créons ensemble des parcours numériques plus simples',
  description:'Notre équipe accompagne les professionnels pour créer des interfaces durables, accessibles et réellement adaptées à leurs besoins.',
  services:['Sites web sur mesure','Audit de parcours','Conseil et stratégie'],
  email:'bonjour@example.fr'
 };
 const complete=site.audit(valid);
 assert.equal(complete.passed,8);
 assert.equal(complete.total,8);
 assert.equal(complete.checks.filter(x=>!x.ok).length,0);
 assert.equal(site.audit(valid).passed,8);
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

test('template placeholder text cannot pass as original work in the quality score',()=>{
 for(const theme of Object.keys(site.THEMES)){
  const report=site.audit({theme,brand:'MON STUDIO'});
  for(const id of ['brand','title','description','services','email']){
   const check=report.checks.find(x=>x.id===id);
   assert.ok(check&&!check.ok,theme+' '+id+' should flag the example copy');
  }
 }
});
test('deterministic site draft history retains eight rollback points and allows restoring',()=>{
 const initial=site.versionDraft(null,{brand:'Atelier 1',theme:'studio'},'custom-web-1','2026-10-22T10:00:00Z');
 assert.equal(initial.version,1);
 assert.deepEqual(initial.revisions,[]);
 let row=initial;
 for(let i=2;i<=12;i++){
  row=site.versionDraft(row,{...row,title:'Titre de version '+i},'custom-web-1','2026-10-22T10:00:00Z');
  assert.equal(row.version,i);
  assert.ok(row.revisions.length<=8);
 }
 assert.deepEqual(row.revisions.map(v=>v.version),[4,5,6,7,8,9,10,11]);
 const restored=site.versionDraft(row,{...row.revisions[0].draft},'custom-web-1','2026-10-22T11:00:00Z');
 assert.equal(restored.version,13);
 assert.equal(restored.title,'Titre de version 4');
 assert.equal(restored.revisions.at(-1).version,12);
 const unchanged=site.versionDraft(restored,{...restored},'custom-web-1','2026-10-22T12:00:00Z');
 assert.deepEqual(unchanged,restored,'Saving without any content change cannot generate a false version');
});
test('history restoration is never a hidden third-party action',()=>{
 const ui=readFileSync(new URL('../assets/control-web-builder-ui.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 assert.match(ui,/data-restore-version/);
 assert.match(ui,/Version actuelle/);
 assert.match(ui,/api\.save\(candidate\)/);
 assert.match(ui,/confirm\('Restaurer la version/);
 assert.match(app,/engine\.versionDraft\(/);
 assert.doesNotMatch(ui,/fetch\(|XMLHttpRequest|WebSocket|sendBeacon/);
});

test('style palettes and typography are finite allowlists with no CSS injection',()=>{
 assert.equal(Object.keys(site.PALETTES).length,3);
 for(const theme of Object.keys(site.THEMES)){
  assert.equal(Object.keys(site.PALETTES[theme]).length,3);
  const variants=Object.keys(site.PALETTES[theme]).map(palette=>site.styles(site.normalize({theme,palette})));
  assert.equal(new Set(variants).size,3,theme+' palettes must affect generated CSS');
  assert.ok(variants.every(css=>css.includes('--paper:')&&css.includes('--accent:')));
 }
 const invalid=site.normalize({theme:'studio',palette:'red;url(javascript:alert(1))',typography:'";color:red;'});
 assert.equal(invalid.palette,'natural');
 assert.equal(invalid.typography,'modern');
 const styles=site.styles(invalid);
 assert.doesNotMatch(styles,/javascript:|url\(|color:red/);
 const editorial=site.styles(site.normalize({theme:'studio',typography:'editorial'}));
 const technical=site.styles(site.normalize({theme:'studio',typography:'technical'}));
 assert.match(editorial,/font-family:Georgia/);
 assert.match(technical,/font-family:ui-monospace/);
 const restored=site.versionDraft(null,{theme:'studio',palette:'charcoal',typography:'editorial'},'custom-web-palette','2026-10-22T10:00:00Z');
 assert.equal(restored.palette,'charcoal');
 assert.equal(restored.typography,'editorial');
});
test('site builder editor exposes validated palette and typography controls',()=>{
 const ui=readFileSync(new URL('../assets/control-web-builder-ui.js',import.meta.url),'utf8');
 assert.match(ui,/name="palette"/);
 assert.match(ui,/name="typography"/);
 assert.match(ui,/engine\.PALETTES\[theme\]/);
 assert.match(ui,/picker\.innerHTML=Object\.entries/);
});

test('curated palette foreground/background contrast remains readable',()=>{
 const luminosity=hex=>{
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
   .map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));
  return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
 };
 for(const [theme,group] of Object.entries(site.PALETTES)){
  for(const [id,palette] of Object.entries(group)){
   const values=[luminosity(palette.paper),luminosity(palette.ink)].sort((a,b)=>b-a);
   assert.ok((values[0]+0.05)/(values[1]+0.05)>=7,theme+'/'+id+' should offer high contrast text on its background');
  }
 }
});
test('switching template preserves manually rewritten content while replacing only sample copy',()=>{
 const ui=readFileSync(new URL('../assets/control-web-builder-ui.js',import.meta.url),'utf8');
 assert.match(ui,/if\(previousTheme!==theme\)/);
 assert.match(ui,/if\(control&&control\.value===before\[name\]\)control\.value=after\[name\]/);
 assert.match(ui,/if\(offers&&offers\.value===before\.services\.join/);
 assert.match(ui,/href="#\/control\/deploy"/);
});

test('guided brief creates a first local website from user descriptions, never a remote AI request',()=>{
 const cases=[
  ['Je suis artisan menuisier à Toulouse. Je conçois des meubles en bois avec un atelier sur mesure.', 'atelier'],
  ['Notre startup construit une plateforme SaaS mobile pour automatiser la gestion des interventions.', 'produit'],
  ['Je suis designer graphiste freelance, et je veux un portfolio pour présenter mes créations.', 'studio']
 ];
 for(const [brief,theme] of cases){
  const result=site.fromBrief(brief);
  assert.equal(result.theme,theme,brief);
  assert.ok(result.description.includes(brief.slice(0,25)));
  assert.equal(result.services.length,3);
  assert.ok(site.markup(result,true).includes('<main>'));
 }
 assert.match(site.fromBrief('bonjour').error,/24 caractères/);
});
test('guided brief extracts explicitly provided copy and rejects content injection',()=>{
 const generated=site.fromBrief('Je suis artisan menuisier à Toulouse, avec un atelier sur mesure pour les entreprises.\nMarque: Atelier Envol\nTitre: Une menuiserie contemporaine et sur mesure\nPrestations: Escaliers personnalisés, Meubles en bois, Portes sur commande',{email:'hello@example.com'});
 assert.equal(generated.theme,'atelier');
 assert.equal(generated.brand,'Atelier Envol');
 assert.equal(generated.title,'Une menuiserie contemporaine et sur mesure');
 assert.deepEqual(generated.services,['Escaliers personnalisés','Meubles en bois','Portes sur commande']);
 assert.equal(generated.email,'hello@example.com');
 const injected=site.fromBrief('Je suis designer et je crée des sites web pour des clients. <img src=x onerror=alert(1)>');
 assert.doesNotMatch(site.markup(injected,true),/<img\b|<script\b/i);
 assert.ok(site.files(injected)['standalone.html'].includes('&lt;img'));
});
test('builder brief appears as a progressive disclosure, with no automatic cost or data sharing',()=>{
 const ui=readFileSync(new URL('../assets/control-web-builder-ui.js',import.meta.url),'utf8');
 assert.match(ui,/<details class="web-builder-brief">/);
 assert.match(ui,/engine\.fromBrief\(/);
 assert.match(ui,/proposal\.error/);
 assert.match(ui,/selectedId&&!confirm\(/);
 assert.match(ui,/redraw\(true\)/);
 assert.match(ui,/aucune IA ni publication lancée/);
});

test('a generated brief cannot falsely certify uncustomized sample copy',()=>{
 const brief=site.fromBrief('Notre startup conçoit une plateforme numérique pour simplifier la logistique des équipes.');
 const report=site.audit(brief);
 for(const id of ['brand','title','services']){
  assert.equal(report.checks.find(c=>c.id===id)?.ok,false,'generated copy is not proof of personalization for '+id);
 }
 assert.ok(report.checks.find(c=>c.id==='description')?.ok,'substantive user-authored description may qualify');
});

test('multi-page export contains working HTML links and CSS with a standalone fallback',()=>{
 const draft=site.normalize({theme:'atelier',siteStructure:'multipage',brand:'Maison Érable',email:'bonjour@example.org',services:['Objets','Conseil','Travaux']});
 assert.equal(draft.siteStructure,'multipage');
 const output=site.files(draft);
 assert.deepEqual(Object.keys(output),['index.html','styles.css','services.html','contact.html','standalone.html','README.md']);
 assert.match(output['index.html'],/href=".\/services.html"/);
 assert.match(output['index.html'],/href=".\/contact.html"/);
 assert.match(output['services.html'],/<h1>Ce que nous faisons\.<\/h1>/);
 assert.match(output['services.html'],/aria-current="page">Prestations<\/a>/);
 assert.match(output['contact.html'],/aria-current="page">Contact<\/a>/);
 assert.match(output['contact.html'],/href="mailto:bonjour@example\.org"/);
 assert.match(output['contact.html'],/<main class="subpage">/);
 assert.match(output['standalone.html'],/href="#contact"/);
 assert.doesNotMatch(output['standalone.html'],/href=".\/services.html"/);
 const extracted=unzipStored(site.zip(output));
 assert.deepEqual(extracted,output);
 for(const [name,html] of Object.entries(output).filter(([name])=>name.endsWith('.html')))
  assert.ok(html.startsWith('<!doctype html>'),name+' must be independently valid HTML document');
});
test('multi-page output never contains executable scripts, unsafe text or outside links',()=>{
 const draft=site.normalize({siteStructure:'multipage',title:'"><script>bad()</script>',brand:'<b>unsafe</b>',email:'javascript:hello'});
 const output=site.files(draft);
 for(const html of ['index.html','services.html','contact.html','standalone.html']){
  assert.doesNotMatch(output[html],/<script\b|<b>unsafe<\/b>|javascript:/i);
  assert.match(output[html],/meta name="viewport"/);
 }
 assert.match(output['contact.html'],/Coordonnées à compléter/);
 assert.equal(site.normalize({siteStructure:'../../escape'}).siteStructure,'onepage');
 assert.throws(()=>site.pageMarkup(draft,'../../../file'),/Page invalide/);
});
test('webbuilder exposes multipage selector and preview tabs in the editor',()=>{
 const ui=readFileSync(new URL('../assets/control-web-builder-ui.js',import.meta.url),'utf8');
 assert.match(ui,/name="siteStructure"/);
 assert.match(ui,/data-builder-page="services"/);
 assert.match(ui,/data-builder-page="contact"/);
 assert.match(ui,/engine\.pageMarkup\(working,page,true\)/);
 assert.match(ui,/frame\.srcdoc=previewContent/);
});
