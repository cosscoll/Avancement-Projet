import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../assets/control-calendar-core.js',import.meta.url),'utf8');
const holder={};
new Function('window',source)(holder);
const core=holder.CONTROL_CALENDAR_CORE;
assert.ok(core);

test('local timestamps reject impossible days, times and DST spring gap',()=>{
 for(const d of ['2026-02-30T09:00','2026-13-05T09:00','2026-10-05T25:00','2026-10-05T09:61','2026-10-05T09:00Z','hello']){
  assert.equal(core.localDateTime(d),null,d);
 }
 assert.ok(core.localDateTime('2028-02-29T14:30'));
 const previous=process.env.TZ;process.env.TZ='Europe/Amsterdam';
 try{
  assert.equal(core.localDateTime('2026-03-29T02:30'),null,'nonexistent spring-clock hour must be rejected');
  assert.ok(core.localDateTime('2026-03-29T03:30'));
 }finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous}
});

test('valid duration is restricted to explicitly offered values',()=>{
 assert.deepEqual(core.DURATIONS,[15,30,45,60,90,120,180,240]);
 for(const x of [0,31,-30,1440,'untrusted'])assert.equal(core.validDuration(x),null);
 assert.equal(core.validDuration('45'),45);
});

test('conflict calculation uses half-open intervals and includes all local projects',()=>{
 const events=[
  {id:'a',project:'one',title:'Démo',date:'2026-11-02T13:30',durationMinutes:60},
  {id:'legacy',project:'other',title:'Ancien',date:'2026-11-02T17:00'}
 ];
 const meetings=[{id:'m',title:'Visio',startsAt:new Date(2026,10,2,15,0).toISOString(),minutes:45}];
 const check=(date,durationMinutes,id='')=>core.conflicts({date,durationMinutes},events,meetings,id);
 assert.deepEqual(check('2026-11-02T14:30',30).matches,[], 'adjacent events do not overlap');
 assert.equal(check('2026-11-02T14:29',30).matches[0].title,'Démo');
 assert.equal(check('2026-11-02T13:45',30,'a').matches.length,0,'editing excludes own event');
 assert.equal(check('2026-11-02T15:10',15).matches[0].kind,'Rendez-vous');
 assert.equal(check('2026-11-02T17:15',30).matches[0].id,'legacy','old records default to 30 minutes');
 assert.deepEqual(check('2026-11-02T16:00',30).matches,[]);
 assert.ok(check('2026-02-30T09:00',30).error);
 assert.ok(check('2026-11-02T12:00',31).error);
});

test('ICS export is strictly local, escapes user-controlled text and converts date to UTC',()=>{
 const row={id:'a/evil\r\nBEGIN:VEVENT',title:'Test,;\\\nBEGIN:VEVENT',details:'Sujet\nRappel;important\\ok',date:'2026-11-02T13:30',durationMinutes:90};
 const ics=core.icalEvent(row);
 assert.match(ics,/BEGIN:VCALENDAR\r\nVERSION:2.0\r\n/);
 assert.match(ics,/METHOD:PUBLISH\r\nBEGIN:VEVENT\r\n/);
 assert.match(ics,/SUMMARY:Test\\,\\;\\\\\\nBEGIN:VEVENT\r\n/);
 assert.match(ics,/DESCRIPTION:Sujet\\nRappel\\;important\\\\ok\r\n/);
 assert.match(ics,/UID:aevilBEGINVEVENT@control\.local/);
 assert.equal((ics.match(/\r\nBEGIN:VEVENT\r\n/g)||[]).length,1);
 assert.match(ics,/DTSTART:\d{8}T\d{6}Z\r\n/);
 assert.match(ics,/DTEND:\d{8}T\d{6}Z\r\n/);
 assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
 const lines=ics.split('\r\n');
 for(const line of lines)assert.ok(new TextEncoder().encode(line).length<=75,'ICS line should be folded');
 assert.equal(ics.includes('https://'),false);
 assert.throws(()=>core.icalEvent({id:'bad',date:'2026-02-30T12:00'}),/Date invalide/);
});

test('unicode event names are folded without splitting UTF-8 code points',()=>{
 const text='Événement 🗓️ '.repeat(20);
 const ics=core.icalEvent({id:'unicode',title:text,date:'2026-12-04T09:00',durationMinutes:30});
 assert.ok(ics.split('\r\n').filter(x=>x.startsWith(' ')).length>=1);
 const summary=ics.match(/SUMMARY:[\s\S]*?\r\nDESCRIPTION:|SUMMARY:[\s\S]*?\r\nEND:VEVENT/);
 assert.ok(summary);
 assert.ok(ics.split('\r\n').every(x=>new TextEncoder().encode(x).length<=75));
});

test('input default rounds forward to a local quarter-hour, not UTC',()=>{
 const now=new Date(2026,9,22,23,58);
 assert.equal(core.defaultValue(now),'2026-10-23T00:00');
 assert.equal(core.localValue(new Date(2026,10,2,13,30)),'2026-11-02T13:30');
});

test('personal agenda exposes edit, duration, confirmation, conflict and ICS actions',()=>{
 const app=readFileSync(new URL('../assets/command-center.js',import.meta.url),'utf8');
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(index.indexOf('assets/control-calendar-core.js')<index.indexOf('assets/command-center.js'));
 for(const required of [
  "function calendar(){","core.conflicts(","core.icalEvent(","id=\"edit-event\"",
  "id=\"new-event\"","name=\"durationMinutes\"","name=\"override\"",
  "edit-event:","delete-event:","export-event:","commitLocal(","role=\"alert\""
 ])assert.ok(app.includes(required),'Missing calendar feature: '+required);
 assert.match(app,/Calendriers externes/);
 assert.match(app,/Aucun calendrier externe n’est synchronisé/);
 assert.equal(JSON.parse(readFileSync(new URL('../config/cloud.json',import.meta.url),'utf8')).enabled,false);
});
