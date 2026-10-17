import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = relative => readFileSync(path.join(root, relative), 'utf8');

test('All local HTML scripts, stylesheets, manifest and icons exist', () => {
  for (const page of ['index.html', 'app.html', 'legacy.html', 'prive.html']) {
    const html = read(page);
    const refs = [...html.matchAll(/(?:src|href)=["'](\.\/?(?:assets\/|manifest\.webmanifest)[^"']*)["']/g)]
      .map(m => m[1].replace(/^\.\//, '').split(/[?#]/)[0]);
    for (const asset of refs) {
      assert.ok(existsSync(path.join(root, asset)), `${page}: missing ${asset}`);
    }
  }
});

test('Service worker caches only present public shell/data files, and never the private Cloud page', () => {
  const script = read('service-worker.js');
  const assets = script.match(/const ASSETS=\[([^;]*)\];/)?.[1] ?? '';
  const data = script.match(/const INITIAL_DATA=\[([^;]*)\];/)?.[1] ?? '';
  const shellFiles = [...assets.matchAll(/'\.\/([^']+)'/g)].map(m => m[1]);
  const dataFiles = [...data.matchAll(/'\.\/([^']+)'/g)].map(m => m[1]);
  assert.ok(shellFiles.length >= 20);
  for (const item of [...shellFiles, ...dataFiles]) {
    if (!item) continue;
    assert.ok(existsSync(path.join(root, item)), `PWA reference not found: ${item}`);
  }
  assert.ok(!shellFiles.includes('app.html'));
  assert.ok(!shellFiles.includes('prive.html'));
  assert.match(script, /path==='app\.html'/);
  assert.match(script, /path==='prive\.html'/);
  assert.match(script, /path\.startsWith\('config\/'\)/);
  assert.ok(shellFiles.includes('assets/visio-center.js'));
  assert.ok(shellFiles.includes('assets/multi-ai-command.js'));
  assert.ok(shellFiles.includes('assets/control-help.js'));
});

test('Cloud signups and paid AI dispatch remain disabled', () => {
  const config = JSON.parse(read('config/cloud.json'));
  const example = JSON.parse(read('config/cloud.example.json'));
  assert.equal(config.enabled, false);
  assert.equal(example.aiDispatchEnabled, false);
  assert.doesNotMatch(JSON.stringify(config), /sb_secret_|sb_service_role_|sk-proj-/);
  const cloud = read('assets/cloud-app.js');
  assert.match(cloud, /cloudConfig\?\.aiDispatchEnabled===true/);
});

test('Cloud keeps strict security policy and refuses embedded external Jitsi', () => {
  const app = read('app.html');
  const js = read('assets/cloud-app.js');
  const visio = read('assets/visio-center.js');
  assert.match(app, /Content-Security-Policy/);
  assert.match(app, /frame-src &#39;none&#39;/);
  assert.match(app, /script-src &#39;self&#39; https:\/\/cdn\.jsdelivr\.net/);
  assert.match(js, /allowInlineVideo:false/);
  assert.match(visio, /a\.allowInlineVideo===false/);
});

test('User journeys exist and advanced options are reachable via explicit routes', () => {
  const personal = read('index.html');
  const cloud = read('assets/cloud-app.js');
  const router = read('assets/command-center.js');
  for (const route of ['projects', 'inbox', 'manager', 'tools']) {
    assert.ok(route === 'projects' || personal.includes(`data-go="${route}"`));
  }
  for (const route of ['catalog', 'deploy', 'lab', 'command', 'meetings']) {
    assert.ok(router.includes(route), `personal route ${route}`);
    assert.ok(personal.includes(route) || router.includes(`'/control/${route}'`), `personal link ${route}`);
  }
  for (const route of ['catalog', 'deploy', 'lab', 'command', 'visios']) {
    assert.ok(cloud.includes(`${route}:${route === 'visios' ? 'visiosPage' : route === 'command' ? 'commandPage' : route === 'lab' ? 'labPage' : route === 'deploy' ? 'deployPage' : 'catalogPage'}`), `Cloud route ${route}`);
  }
});

test('Public educational resources remain parseable and linked to their courses', () => {
  const catalog = JSON.parse(read('data/ai-tool-libraries.json'));
  const help = JSON.parse(read('data/help-center.json'));
  const hosting = JSON.parse(read('data/deployment-guides.json'));
  assert.ok(catalog.tools.length >= 80);
  assert.ok(catalog.kits.length >= 12);
  assert.ok(help.entries.length >= 30);
  assert.ok(hosting.guides.length >= 10);
  for (const t of catalog.tools) {
    assert.match(t.url, /^https:\/\//);
    assert.ok(t.courses.every(c => catalog.courses[c]), `Unknown course for ${t.id}`);
  }
});
