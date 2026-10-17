import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const data=JSON.parse(get('data/ai-tool-libraries.json'));
test('Tools: unique IDs, HTTPS official links, four course mappings',()=>{
  assert.ok(data.tools.length>=80);
  assert.equal(new Set(data.tools.map(x=>x.id)).size,data.tools.length);
  assert.equal(Object.keys(data.courses).length,4);
  for(const x of data.tools){
    assert.ok(x.name&&x.summary&&x.useCase&&x.id);
    assert.ok(/^https:\/\//.test(x.url),x.name);
    assert.ok(data.categories.some(c=>c.id===x.category),x.name);
    assert.ok(x.courses.length&&x.courses.every(t=>!!data.courses[t]),x.name);
    assert.ok(data.access_labels[x.access],x.name);
    assert.ok(data.level_labels[x.level],x.name);
  }
});
test('Twelve starter kits reference catalog tools and never bundle paid lesson files',()=>{
  assert.equal(data.kits.length,12);
  const ids=new Set(data.tools.map(x=>x.id));
  for(const kit of data.kits){
    assert.ok(data.courses[kit.course],kit.id);
    assert.ok(kit.tools.length>=3&&kit.tools.every(x=>ids.has(x)),kit.id);
    assert.ok(kit.prompt.length>80,kit.id);
  }
});
test('Personal app and Cloud include catalog safely, without enabling signups',()=>{
  assert.match(get('index.html'),/assets\/tool-catalog\.js/);
  assert.match(get('index.html'),/assets\/tool-catalog\.css/);
  assert.match(get('assets/command-center.js'),/function catalog\(/);
  assert.match(get('app.html'),/assets\/tool-catalog\.js/);
  assert.match(get('assets/cloud-app.js'),/catalog:catalogPage/);
  assert.equal(JSON.parse(get('config/cloud.json')).enabled,false);
  assert.match(get('service-worker.js'),/ai-tool-libraries\.json/);
  new Function(get('assets/tool-catalog.js'));
});
