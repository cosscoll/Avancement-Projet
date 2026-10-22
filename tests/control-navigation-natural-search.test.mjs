import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../assets/navigation-hub.js',import.meta.url),'utf8');
const window={};
const document={addEventListener(){}};
runInNewContext(source,{window,document,location:{hash:'#/'},sessionStorage:{setItem(){}}});
const find=(query)=>window.CONTROL_NAVIGATION.find(query,window.CONTROL_NAVIGATION.getItems()).map(x=>x.id);

test('finder handles accents, plurals and natural French requests',()=>{
 assert.ok(find('mes rendez-vous').includes('meetings'));
 assert.ok(find('réunions').includes('meetings'));
 assert.ok(find('rdv').includes('meetings'));
 assert.ok(find('sauvegarder mes données').includes('backup'));
 assert.ok(find('mes projets').includes('projects'));
 assert.ok(find('retrouver une décision').includes('decisions'));
 assert.ok(find('déployer un site').includes('deploy'));
});
test('finder prioritizes exact feature title over description matches',()=>{
 assert.equal(find('calendrier')[0],'calendar');
 assert.equal(find('budget')[0],'budget');
});
test('finder does not silently match an unrelated term',()=>{
 assert.deepEqual(find('inexistantxyz'),[]);
});
