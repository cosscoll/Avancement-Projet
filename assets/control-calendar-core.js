/* CONTROL calendar: local-only conflicts and personal iCalendar export.
   No remote scheduling, permissions, invitations or background notifications. */
(()=>{'use strict';
 const DURATIONS=Object.freeze([15,30,45,60,90,120,180,240]);
 function localDateTime(value){
   if(typeof value!=='string')return null;
   const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
   if(!m)return null;
   const [y,month,d,h,min]=m.slice(1).map(Number);
   if(y<2000||y>2100||month<1||month>12||d<1||d>31||h>23||min>59)return null;
   const result=new Date(y,month-1,d,h,min);
   // Reject nonexistent local wall time, notably at the spring DST transition.
   if(result.getFullYear()!==y||result.getMonth()!==month-1||result.getDate()!==d||result.getHours()!==h||result.getMinutes()!==min)return null;
   return result;
 }
 function localValue(date){
   const d=date instanceof Date?date:new Date(date);
   if(!Number.isFinite(+d))return '';
   const p=n=>String(n).padStart(2,'0');
   return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());
 }
 function defaultValue(now=new Date()){
   const d=new Date(+now);
   d.setSeconds(0,0);
   d.setMinutes(Math.ceil((d.getMinutes()+1)/15)*15);
   return localValue(d);
 }
 function validDuration(value){const n=Number(value);return DURATIONS.includes(n)?n:null}
 function eventStart(row){
   const local=localDateTime(row?.date);
   if(local)return local;
   const parsed=Date.parse(row?.date||'');
   return Number.isFinite(parsed)?new Date(parsed):null;
 }
 function eventRange(row){
   const start=eventStart(row);
   if(!start)return null;
   const duration=validDuration(row?.durationMinutes)??30;
   return {start:+start,end:+start+duration*60000};
 }
 function meetingRange(row){
   const start=Date.parse(row?.startsAt||'');
   const duration=Number(row?.minutes);
   if(!Number.isFinite(start)||!Number.isFinite(duration)||duration<=0||duration>1440)return null;
   return {start,end:start+duration*60000};
 }
 function conflicts(candidate,events=[],meetings=[],excludingId=''){
   const start=localDateTime(candidate?.date),duration=validDuration(candidate?.durationMinutes);
   if(!start||!duration)return {error:'Choisis une date, une heure et une durée valides.',matches:[]};
   const end=+start+duration*60000;
   const matches=[];
   const overlap=(r)=>r&&+start<r.end&&end>r.start;
   for(const row of Array.isArray(events)?events:[]){
     if(!row||row.id===excludingId)continue;
     if(overlap(eventRange(row)))matches.push({kind:'Événement',id:row.id||'',title:String(row.title||'Sans titre')});
   }
   for(const row of Array.isArray(meetings)?meetings:[]){
     if(row&&overlap(meetingRange(row)))matches.push({kind:'Rendez-vous',id:row.id||'',title:String(row.title||'Sans titre')});
   }
   return {error:null,matches};
 }
 function icalText(value){
   return String(value??'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
 }
 function fold(line){
   const encode=new TextEncoder(),rows=[];let current='',size=0;
   for(const character of line){
     const bytes=encode.encode(character).length;
     if(current&&size+bytes>75){rows.push(current);current=' '+character;size=1+bytes}
     else{current+=character;size+=bytes}
   }
   rows.push(current);return rows.join('\r\n');
 }
 function icalEvent(row){
   const r=eventRange(row);
   if(!r)throw Error('Date invalide.');
   const stamp=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
   const uid=String(row.id||'event').replace(/[^a-z0-9_-]/gi,'').slice(0,90)||'event';
   const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CONTROL IA//Agenda local//FR','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
    'UID:'+uid+'@control.local','DTSTAMP:'+stamp(Date.now()),'DTSTART:'+stamp(r.start),'DTEND:'+stamp(r.end),
    'SUMMARY:'+icalText(row.title||'Événement')];
   if(row.details)lines.push('DESCRIPTION:'+icalText(row.details));
   lines.push('END:VEVENT','END:VCALENDAR');
   return lines.map(fold).join('\r\n')+'\r\n';
 }
 window.CONTROL_CALENDAR_CORE=Object.freeze({DURATIONS,localDateTime,localValue,defaultValue,validDuration,eventRange,meetingRange,conflicts,icalEvent});
})();