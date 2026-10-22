import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const historical=JSON.parse(read('data/automations.json'));
const archive=read('assets/automations-hub.js');
const calendar=read('assets/command-center.js');
const legacy=read('assets/app.js');

test('all CONTROL views label archived automations as current status unknown',()=>{
 assert.match(archive,/Archive · statut actuel inconnu/);
 assert.match(calendar,/Archive, statut actuel inconnu/);
 assert.match(legacy,/Archive · statut actuel inconnu/);
 assert.doesNotMatch(archive,/Active au dernier relevé/);
 assert.doesNotMatch(legacy,/Actif · dernier relevé/);
 assert.match(calendar,/aucune activité actuelle n’est confirmée/);
});
test('old snapshot stays historical and cannot activate scheduled jobs',()=>{
 assert.ok(historical.verified_at);
 assert.match(historical.source,/Instantané|instantané|relevé/i);
 assert.doesNotMatch(archive,/fetch\([^)]*\b(?:POST|PATCH|PUT|DELETE)\b/);
 assert.match(archive,/ne modifient aucune automatisation réelle/);
});
test('legacy dashboard and calendar JavaScript still parse after status correction',()=>{
 new Function(calendar);
 new Function(legacy);
});
