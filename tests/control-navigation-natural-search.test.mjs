import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../assets/navigation-hub.js',import.meta.url),'utf8');
const window={};
const document={addEventListener(){}};
runInNewContext(source,{window,document,location:{hash:'#/'},sessionStorage:{setItem(){}}});
const find=(query)=>Array.from(window.CONTROL_NAVIGATION.find(query,window.CONTROL_NAVIGATION.getItems()),x=>x.id);

test('finder handles accents, plurals and natural French requests',()=>{
 assert.ok(find('mes rendez-vous').includes('meetings'));
 assert.ok(find('réunions').includes('meetings'));
 assert.ok(find('rdv').includes('meetings'));
 assert.ok(find('sauvegarder mes données').includes('backup'));
 assert.ok(find('mes projets').includes('projects'));
 assert.ok(find('retrouver une décision').includes('decisions'));
 assert.ok(find('déployer un site').includes('deploy'));
 assert.ok(find('créer un nouveau projet').includes('projects'));
 assert.ok(find('je veux créer une tâche').includes('inbox'));
 assert.ok(find('je veux organiser une réunion').includes('meetings'));
 assert.ok(find('je cherche la sauvegarde').includes('backup'));
 assert.ok(find('modifier les paramètres').includes('settings'));
 assert.ok(find('réglages').includes('settings'));
 assert.ok(find('vérifier les résultats de mission').includes('missions'));
});
test('finder prioritizes exact feature title over description matches',()=>{
 assert.equal(find('calendrier')[0],'calendar');
 assert.equal(find('budget')[0],'budget');
});
test('finder does not silently match an unrelated term',()=>{
 assert.deepEqual(find('inexistantxyz'),[]);
});
