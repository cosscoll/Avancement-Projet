import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const src=file('assets/visio-center.js');
const w={};
new Function('window',src)(w);
const v=w.CONTROL_VISIOS;

test('Meeting URL validation rejects homepages, unsafe schemes and fake hosts',()=>{
 assert.ok(v.allowedLink('https://meet.google.com/abc-defg-hij','Google Meet'));
 assert.equal(v.allowedLink('https://meet.google.com/','Google Meet'),'');
 assert.ok(v.allowedLink('https://us06web.zoom.us/j/12345678900?pwd=guest','Zoom'));
 assert.equal(v.allowedLink('https://zoom.us/meeting/schedule','Zoom'),'');
 assert.ok(v.allowedLink('https://teams.microsoft.com/l/meetup-join/19%3ameeting_test','Teams'));
 assert.equal(v.allowedLink('https://teams.microsoft.com/','Teams'),'');
 assert.equal(v.allowedLink('javascript:alert(1)','Google Meet'),'');
 assert.equal(v.allowedLink('https://meet.google.com.evil.example/abc-defg-hij','Google Meet'),'');
 assert.equal(v.allowedLink('https://user:pass@meet.google.com/abc-defg-hij','Google Meet'),'');
 assert.equal(v.allowedLink('https://meet.jit.si/any-public-room','Jitsi (test)'),'');
});
test('Dates and exported ICS use a valid event with no header injection',()=>{
 assert.equal(v.parseLocal('2026-02-31T11:00'),'');
 assert.equal(v.parseLocal('invalid'),'');
 const m={id:'unit-test',title:'Démo, client;\\\nInjected:bad',type:'external',provider:'Google Meet',startsAt:'2026-10-18T14:00:00Z',minutes:45,url:'https://meet.google.com/abc-defg-hij'};
 const content=v.ics(m);
 assert.match(content,/BEGIN:VCALENDAR\r\n/);
 assert.match(content,/DTSTART:20261018T140000Z/);
 assert.match(content,/DTEND:20261018T144500Z/);
 assert.match(content,/URL:https:\/\/meet.google.com\/abc-defg-hij/);
 assert.match(content,/SUMMARY:/);
 assert.doesNotMatch(content,/\r\nInjected:/);
 assert.match(v.invitation(m),/client/i);
 assert.match(v.calendarURL(m),/calendar.google.com\/calendar\/render/);
});
test('Explicit video consent and provider limitations are reflected in the module',()=>{
 assert.match(src,/meet\.jit\.si\/external_api\.js/);
 assert.match(src,/loadAPI\(\)/);
 assert.match(src,/Jitsi \(test\)/);
 assert.match(src,/service public n’est pas destiné à un usage commercial/);
 assert.match(src,/Cam\w*ra|cam\w*ra/);
 assert.doesNotMatch(src,/localStorage\.setItem|fetch\(/);
});
test('Local and Cloud routes preserve project navigation and owner isolation',()=>{
 assert.match(file('index.html'),/assets\/visio-center\.js/);
 assert.match(file('app.html'),/assets\/visio-center\.js/);
 assert.match(file('assets/command-center.js'),/function meetings\(\)/);
 assert.match(file('assets/command-center.js'),/db\.meetings/);
 assert.match(file('assets/cloud-app.js'),/visios:visiosPage/);
 assert.match(file('assets/cloud-app.js'),/controlVisio:true/);
 assert.match(file('assets/cloud-app.js'),/\.eq\('owner_id',owner\)/);
 assert.equal(JSON.parse(file('config/cloud.json')).enabled,false);
 assert.match(file('service-worker.js'),/visio-center\.js/);
});
