import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const brand=read('assets/control-brand-global.css');
const oldBrand=read('assets/control-brand-simple-humain.css');
const pages=['index.html','app.html','legacy.html','testeurs.html','prive.html'];
const palette={
 cream:'#FFF8F2',paper:'#FFFDFB',peach:'#FFF0E5',orange:'#F76A39',
 accent:'#B8431F',hover:'#AE3C1D',ink:'#20252B',muted:'#6D6763',line:'#EDDED3'
};
test('All five application entrypoints load the same brand stylesheet LAST',()=>{
 for(const path of pages){
  const html=read(path);
  const css=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g)].map(m=>m[1]);
  assert.ok(css.length,'Missing stylesheets in '+path);
  assert.equal(css.at(-1).replace(/^\.\//,''),'assets/control-brand-global.css',path+' final stylesheet');
  assert.equal(css.filter(s=>s.includes('control-brand-global.css')).length,1,'Duplicate global CSS in '+path);
  assert.doesNotMatch(brand,/(?:display\s*:\s*none|visibility\s*:\s*hidden)\s*!important/i,'brand should not hide features');
 }
 assert.match(read('legacy.html'),/<body class="control-legacy">/);
 assert.match(read('testeurs.html'),/<body class="control-pilot">/);
 assert.match(read('prive.html'),/<body class="control-private">/);
 assert.match(read('prive.html'),/content="#FFF8F2"/);
});
test('User-approved warm palette and Poppins are central, not replaced by navy',()=>{
 for(const color of Object.values(palette))assert.ok(brand.includes(color),'Missing brand color '+color);
 assert.match(brand,/--control-font:"Poppins"/);
 // Poppins is hosted as a public font stylesheet. These two narrow CSP exceptions
 // permit its glyphs without enabling script execution or API connections.
 for(const entry of ['app.html','testeurs.html']){
  const html=read(entry);
  assert.ok(html.includes('https://fonts.googleapis.com'),'External font stylesheet domain is not allowed on '+entry);
  assert.ok(html.includes('font-src https://fonts.gstatic.com'),'Only font binaries from Google Fonts should be allowed on '+entry);
 }
 assert.match(oldBrand,/Simple & Humain/);
 assert.match(brand,/body\.control-shell-v3/);
 assert.match(brand,/body\.cloud-shell-v3/);
 assert.match(brand,/body\.control-legacy/);
 assert.match(brand,/body\.control-pilot/);
 assert.match(brand,/body\.control-private/);
 assert.doesNotMatch(brand,/#(?:315b94|294d70|213e61|1c2b40|f6f8fb)\b/i,'Old blue color must not return in final layer');
});
test('Known feature pages, help and inner screens all have theme scopes',()=>{
 const marker=['.as-shell','.tool-page','.deploy-page','.lab-shell','.loc-shell',
  '.cmd-shell','.vs-page','.web-builder','.ch-panel','.ch-launch',
  '.control-task-group','.control-search-group','.control-project-brief-panel',
  '.control-workspace-mainnav','.control-home-v6','.pilot-task'];
 for(const selector of marker)assert.ok(brand.includes(selector),'Missing feature skin: '+selector);
 assert.match(brand,/\.notice-error/);
 assert.match(brand,/var\(--control-negative\)/);
 assert.match(brand,/var\(--control-positive\)/);
 assert.match(brand,/prefers-reduced-motion/);
});
test('New stylesheet participates in reliable PWA offline install',()=>{
 const sw=read('service-worker.js');
 assert.match(sw,/const CACHE_SHELL='control-shell-v115'/);
 assert.match(sw,/const CACHE_PUBLIC='control-public-data-v115'/);
 const parts=sw.match(/const (?:ASSETS|CRITICAL_SHELL)=.+/g)||[];
 assert.ok(parts.length>=2);
 for(const part of parts)assert.match(part,/control-brand-global\.css/);
 const m=sw.match(/const ASSETS=(\[[^\n]+\])/);
 assert.ok(m);
 assert.equal((m[1].match(/control-brand-global\.css/g)||[]).length,1,'Cache declaration must not repeat stylesheet');
});
test('Theme layer never alters JS flow or grants Cloud access',()=>{
 const cloud=JSON.parse(read('config/cloud.json'));
 assert.equal(cloud.enabled,false);
 assert.ok(!Object.values(cloud.launchChecks).some(Boolean));
 const cssFlags=/(?:<script|javascript:|url\(\s*['"]?javascript:)/i;
 assert.doesNotMatch(brand,cssFlags);
});

test('Small text and white-on-CTA colors respect minimum WCAG AA contrast',()=>{
 const hex=h=>h.replace(/^#/,'');
 const rgb=h=>[0,2,4].map(i=>parseInt(hex(h).slice(i,i+2),16)/255);
 const luminance=h=>{
  const [r,g,b]=rgb(h).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*r+.7152*g+.0722*b;
 };
 const contrast=(a,b)=>{
  const aa=luminance(a),bb=luminance(b);
  return (Math.max(aa,bb)+.05)/(Math.min(aa,bb)+.05);
 };
 for(const [foreground,background,label] of [
  [palette.accent,'#FFFFFF','primary button white text'],
  [palette.hover,'#FFFFFF','primary button hover'],
  [palette.muted,palette.cream,'secondary text on cream'],
  [palette.accent,palette.peach,'warm action labels on peach'],
  [palette.ink,palette.paper,'primary text on paper']
 ]){
  assert.ok(contrast(foreground,background)>=4.5,
    label+' needs 4.5:1 contrast: '+contrast(foreground,background).toFixed(2));
 }
 // Bright decorative orange is intentionally not the CTA text/background.
 assert.ok(contrast(palette.orange,'#FFFFFF')<4.5);
 assert.match(brand,/background:var\(--control-orange-deep\)!important/);
 assert.match(brand,/--control-orange-deep:#B8431F/);
});

test('Previously unthemed helper, update and project-overview screens use brand tokens',()=>{
 for(const item of ['.control-delivery','.control-delivery-stage',
  '#control-project-brief-title','.control-day-brief','#control-pwa-update',
  '.control-external-change','.control-whats-new','.web-builder-code textarea',
  '.web-builder-canvas']){
  assert.ok(brand.includes(item),'Unthemed helper screen: '+item);
 }
 assert.match(brand,/\.control-delivery-stage\[data-stage=operational\]/);
 assert.match(brand,/--control-positive:#16834B/);
 assert.match(brand,/--control-negative:#BB342B/);
});

test('Private route is re-skinned but authentication implementation remains separate',()=>{
 const html=read('prive.html');
 assert.match(html,/type="module" src="assets\/private\.js"/);
 assert.match(html,/id="private-main"/);
 assert.match(html,/robots" content="noindex,nofollow"/);
 assert.match(brand,/body\.control-private :is\(\.private-form input/);
 assert.match(brand,/body\.control-private \.warning-banner/);
 assert.doesNotMatch(brand,/localStorage|sessionStorage|signInWithPassword|createClient\(/);
});

test('Navigation modal, shortcuts and legacy dashboard use the same warm visual surface',()=>{
 for(const selector of [
 '.control-nav-main-trigger','.control-nav-mobile-trigger','.control-finder-panel',
 '.control-finder-search input','.control-finder-categories button.is-active',
 '.control-finder-recents-title','.control-wayfinding',
 'body.control-legacy .sidebar','body.control-legacy .nav-item.active',
 'body.control-legacy .brand','body.control-legacy .topbar',
 'body.control-legacy .page-title','body.control-legacy .tab.active'
 ]) assert.ok(brand.includes(selector),'Old navigation visual island: '+selector);
 assert.match(brand,/\.control-nav-main-trigger kbd/);
 assert.match(brand,/\.control-finder-item:hover/);
});
test('A user sees warm labels inside all eight real feature modules',()=>{
 const labels=['.loc-topline label','.lab-checkboxes','.cmd-toggle','.vs-listhead span',
 '.deploy-filters label','.tool-kit-caption','.web-builder-panel label','.as-journey-step'];
 for(const selector of labels)assert.ok(brand.includes(selector),'Unskinned label: '+selector);
 assert.match(brand,/\.as-journey-main \.as-journey-number/);
 assert.match(brand,/\.tool-deploy-cta/);
 assert.match(brand,/\.lab-table th/);
});

test('No cold-blue remains on action controls, instructions and banners highlighted by color QA',()=>{
 for(const selector of ['.loc-shell label','.tool-kit button','.tool-deploy-cta button',
 '.tool-info','.deploy-steps summary','.deploy-details','.cmd-empty','.cmd-guide summary',
 '.vs-empty','.vs-past-toggle','.as-connect-counter','.as-studio-backup summary',
 '.as-journey-head p','.web-builder .chip']){
  assert.ok(brand.includes(selector),'Unfinished Simple & Humain element: '+selector);
 }
});

test('Operator mission approval view is warm but retains all its safe actions',()=>{
 for(const target of ['.control-operator [data-op-draft]', '.control-operator form label',
 '.control-operator-response:not(:empty)', '.control-operator-link']){
  assert.ok(brand.includes(target),'Old operator color: '+target);
 }
});

test('Legacy labels and secondary buttons never reintroduce the navy UI palette',()=>{
 for(const selector of ['.tool-controls>label','.deploy-check-grid label',
 '.as-connect-card button:disabled','.as-connect-plan p','.as-memory-draft p',
 '.web-builder button:not(.primary)']){
  assert.ok(brand.includes(selector),'Remaining navy control: '+selector);
 }
});

test('Last blue defaults in catalog, deployment and AI Studio now inherit the warm palette',()=>{
 for(const selector of ['.tool-results-head span','.tool-kits.clarity-helpnote',
  '.tool-kit-links a','.clarity-more > button','#deploy-more',
  '.as-steps button[aria-current=page]','.as-steps button:not([aria-current=page]):hover',
  '.as-journey-head h2','.as-thread-manage summary','.as-thread-hit',
  '.as-backup-inner p','.as-agent-item[aria-current=page]'])
  assert.ok(brand.includes(selector),'Missing final warm control: '+selector);
});

test('Studio assistant account and backup buttons are warm without changing disabled/destructive semantics',()=>{
 for(const selector of ['.as-connect-actions button:not(.as-primary)',
  '.as-backup-inner button:not(.as-primary)', '.as-shell :is(label,',
  '.as-backup-inner .as-restore-review', '.as-backup-inner button):disabled'])
 assert.ok(brand.includes(selector),'Studio button/label unthemed: '+selector);
 assert.match(brand,/\.as-shell \.as-danger/);
});
