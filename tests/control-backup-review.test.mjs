import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const window={};
new Function('window',readFileSync(new URL('../assets/control-backup-review.js',import.meta.url),'utf8'))(window);
const review=window.CONTROL_BACKUP_REVIEW;
assert.ok(review);

const fixture=(actions=0,websites=0)=>({
 command:{actions:Array.from({length:actions},(_,i)=>({id:'a'+i})),missions:[],events:[],
  websites:Array.from({length:websites},(_,i)=>({id:'w'+i}))},
 hub:{projects:{a:{id:'a'},b:{id:'b'}}},
 automations:{entries:[]}
});
test('the review shows counts only and warns when imported items would be lost',()=>{
 const before=fixture(3,7),after=fixture(1,2);
 const result=review.compare(after,before);
 assert.equal(result.changes.find(x=>x.key==='actions').before,3);
 assert.equal(result.changes.find(x=>x.key==='actions').after,1);
 assert.equal(result.changes.find(x=>x.key==='websites').before,7);
 assert.equal(result.changes.find(x=>x.key==='websites').after,2);
 assert.deepEqual(result.losses.map(x=>x.key),['actions','websites']);
 assert.ok(result.totalBefore>result.totalAfter);
 assert.match(result.note,/Même nombre/);
 assert.equal(JSON.stringify(result).includes('a0'),false,'comparison must not expose private records');
});
test('untrusted backup is never executed and lacks account permissions',()=>{
 const data=fixture(1,1);data.command.actions[0]={id:'<script>alert(1)</script>',secret:'secret'};
 const report=review.compare(data,fixture());
 assert.ok(!JSON.stringify(report).includes('secret'));
 assert.ok(!JSON.stringify(report).includes('<script>'));
 assert.throws(()=>review.compare({command:{actions:[]}},fixture()),/incomplète/);
});
test('snapshot catches edits even if record counts stay identical',()=>{
 const map=new Map([['control-command-v1','{"actions":[{"id":"one"}]}'],['control-hub-v2','{}'],['control-automations-v1',null]]);
 const storage={getItem:key=>map.get(key)??null};
 const stored=review.snapshot(storage);
 assert.ok(review.unchanged(storage,stored));
 map.set('control-command-v1','{"actions":[{"id":"two"}]}');
 assert.equal(review.unchanged(storage,stored),false);
 map.set('control-command-v1','{"actions":[{"id":"one"}]}');
 map.set('control-automations-v1','{}');
 assert.equal(review.unchanged(storage,stored),false);
 assert.equal(review.unchanged(storage,[]),false);
});
test('backup review is loaded before the command center, cached, and never publishes data',()=>{
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 assert.ok(index.indexOf('assets/control-backup-review.js')<index.indexOf('assets/command-center.js'));
 assert.ok(sw.includes("'./assets/control-backup-review.js'"));
 assert.ok(sw.includes("const CACHE_SHELL='control-shell-v54'"));
 assert.match(app,/Examiner la sauvegarde/);
 assert.match(app,/id="import-preview"/);
 assert.match(app,/id="import-apply"/);
 assert.match(app,/restore\.unchanged\(localStorage,staged\.original\)/);
 assert.match(app,/restore\.compare\(data,existing\)/);
 assert.doesNotMatch(readFileSync(new URL('../assets/control-backup-review.js',import.meta.url),'utf8'),/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage\.setItem/);
});
