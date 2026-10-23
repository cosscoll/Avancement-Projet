import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/automations-hub.js',import.meta.url),'utf8');
const lines=source.split('\n');
const find=start=>lines.find(line=>line.startsWith(start));
const helpers=[find('let localCorrupt=false;function getLocal()'),find('function save()'),find('function commitDraft(')];
assert.ok(helpers.every(Boolean),'Automation draft persistence helpers should exist');
function harness(raw,quota=false){
 let value=raw,writes=0;const notices=[];
 const api=new Function('localStorage','toast',
  'const localKey="control-automations-v1";let localLoadedRaw=null;'+helpers[0]+'\nlet local=getLocal();'+helpers.slice(1).join('\n')+
  '\nreturn {get:()=>local,flag:()=>localCorrupt,commitDraft,save};'
 )({getItem:()=>value,setItem:(_,v)=>{writes++;if(quota)throw Error('QuotaExceeded');value=v}},v=>notices.push(v));
 return {...api,getRaw:()=>value,writes:()=>writes,notices};
}
test('corrupted or primitive automation storage can never be overwritten',()=>{
 for(const raw of ['{malformed','[]','null','"string"']){
  const h=harness(raw);
  assert.equal(h.flag(),true,raw);
  assert.equal(h.commitDraft(()=>h.get().extra=[{id:'lost'}]),false);
  assert.equal(h.writes(),0);
  assert.equal(h.getRaw(),raw);
  assert.match(h.notices.at(-1),/illisible/);
 }
});
test('valid draft succeeds and a failed quota write restores prior data',()=>{
 const start='{"extra":[{"id":"saved"}],"edits":{"a":{"title":"original"}}}';
 const ok=harness(start);
 assert.equal(ok.commitDraft(()=>ok.get().extra.push({id:'next'})),true);
 assert.deepEqual(JSON.parse(ok.getRaw()).extra,[{id:'saved'},{id:'next'}]);
 const bad=harness(start,true);
 assert.equal(bad.commitDraft(()=>{bad.get().edits.a.title='unsaved';bad.get().extra.push({id:'next'})}),false);
 assert.deepEqual(bad.get(),JSON.parse(start));
 assert.equal(bad.getRaw(),start);
});
test('partial automations mutation is rolled back if callback throws',()=>{
 const h=harness('{"extra":[]}');
 assert.equal(h.commitDraft(()=>{h.get().extra.push({id:'partial'});throw Error('stop')}),false);
 assert.deepEqual(h.get().extra,[]);
 assert.equal(h.writes(),0);
});
test('automation forms use commitDraft and warn on corruption instead of activating real scheduled tasks',()=>{
 assert.match(source,/localCorrupt\?'<p role="alert"/);
 assert.match(source,/if\(commitDraft\(\(\)=>\{local\.extra/);
 assert.match(source,/if\(commitDraft\(\(\)=>\{local\.edits/);
 assert.doesNotMatch(source,/automations\.create|fetch\('https:\/\/chatgpt.com\/api/);
});
test('catalog and deployment references use the same guarded project store transaction',()=>{
 const app=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 const shell=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(shell,/window\.CONTROL_HUB_STORAGE=\{commit:commitHub/);
 assert.equal((app.match(/window\.CONTROL_HUB_STORAGE/g)||[]).length,2);
 assert.doesNotMatch(app,/localStorage\.setItem\('control-hub-v2'/);
 assert.match(app,/Stockage des projets non disponible : outil non ajouté/);
 assert.match(app,/Stockage des projets indisponible : guide non ajouté/);
});
