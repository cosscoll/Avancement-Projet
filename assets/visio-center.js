/* CONTROL • Visios et rendez-vous : no automatic invites, no model calls. */
(()=>{'use strict';
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const providers={
 'Google Meet':{home:'https://meet.google.com/',label:'Google Meet'},
 'Zoom':{home:'https://zoom.us/meeting/schedule',label:'Zoom'},
 'Teams':{home:'https://teams.microsoft.com/',label:'Microsoft Teams'},
 'Jitsi (test)':{home:'https://jitsi.org/api/',label:'Jitsi (essais internes)'}
};
const types={team:'Équipe interne',external:'Clients / prospects'};
const allowedLink=(s,p)=>{
 try{const x=new URL(s);if(x.protocol!=='https:'||x.username||x.password||!Object.hasOwn(providers,p))return '';
 const h=x.hostname.toLowerCase();
 if(p==='Google Meet'&&(h!=='meet.google.com'||!/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/i.test(x.pathname)))return '';
 if(p==='Zoom'&&(!(h==='zoom.us'||h.endsWith('.zoom.us')||h==='zoom.com'||h.endsWith('.zoom.com'))||!/^\/(?:j|w|s|my|wc\/join)\//i.test(x.pathname)))return '';
 if(p==='Teams'&&(!['teams.microsoft.com','teams.live.com'].includes(h)||!x.pathname.includes('meet')))return '';
 if(p==='Jitsi (test)'&&(h!=='meet.jit.si'||!/^CONTROL-Test-[a-f0-9]{36}$/.test(x.pathname.slice(1))))return '';
 return x.href;
 }catch{return ''}
};
const entropy=()=>{if(!globalThis.crypto?.getRandomValues)throw Error('HTTPS et crypto.getRandomValues requis');const v=new Uint8Array(18);crypto.getRandomValues(v);return [...v].map(x=>x.toString(16).padStart(2,'0')).join('')};
const roomLink=()=> 'https://meet.jit.si/CONTROL-Test-'+entropy();
const newId=()=>globalThis.crypto?.randomUUID?.()||entropy();
const parseLocal=v=>{if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(v))return '';const d=new Date(v);return Number.isFinite(+d)&&d.getFullYear()===+v.slice(0,4)&&d.getMonth()+1===+v.slice(5,7)&&d.getDate()===+v.slice(8,10)&&d.getHours()===+v.slice(11,13)&&d.getMinutes()===+v.slice(14,16)?d.toISOString():''};
const defaultTime=()=>{const d=new Date(Date.now()+3600000);d.setMinutes(Math.ceil(d.getMinutes()/15)*15,0,0);const pad=v=>String(v).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
const fmt=v=>{const d=new Date(v);return Number.isFinite(+d)?d.toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'}):'Date invalide'};
const icsTime=v=>new Date(v).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
const icsText=s=>String(s??'').replace(/[\r\n]/g,' ').replace(/\\/g,'\\\\').replace(/,/g,'\\,').replace(/;/g,'\\;').slice(0,2000);
const invitation=m=>(m.type==='team'?'Visioconférence d’équipe : ':'Rendez-vous client / prospect : ')+m.title+'\nDate : '+fmt(m.startsAt)+'\nDurée : '+m.minutes+' minutes\nLien : '+m.url+'\n\nMerci de confirmer votre disponibilité.';
const calendarURL=m=>'https://calendar.google.com/calendar/render?'+new URLSearchParams({action:'TEMPLATE',text:m.title,dates:icsTime(m.startsAt)+'/'+icsTime(new Date(Date.parse(m.startsAt)+m.minutes*60000)),details:'Visioconférence '+m.provider+'\nLien : '+m.url,location:m.url}).toString();
const ics=m=>[
 'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CONTROL//Video Meetings//FR','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
 'UID:'+String(m.id).replace(/[^a-zA-Z0-9-]/g,'').slice(0,90)+'@control.local','DTSTAMP:'+icsTime(new Date()),'DTSTART:'+icsTime(m.startsAt),
 'DTEND:'+icsTime(new Date(Date.parse(m.startsAt)+m.minutes*60000)),'SUMMARY:'+icsText(m.title),'DESCRIPTION:'+icsText(invitation(m)),'URL:'+m.url,
 'END:VEVENT','END:VCALENDAR'
].join('\r\n')+'\r\n';
let meetAPI=null,loadingAPI=null,observer=null;
function leave(){try{meetAPI?.dispose?.()}catch{}meetAPI=null;if(observer)observer.disconnect();observer=null}
function loadAPI(){if(window.JitsiMeetExternalAPI)return Promise.resolve(window.JitsiMeetExternalAPI);
 if(!loadingAPI)loadingAPI=new Promise((resolve,reject)=>{
  const el=document.createElement('script');el.src='https://meet.jit.si/external_api.js';el.async=true;
  const timeout=setTimeout(()=>{el.remove();reject(Error('Délai dépassé'))},15000);
  el.onload=()=>{clearTimeout(timeout);window.JitsiMeetExternalAPI?resolve(window.JitsiMeetExternalAPI):reject(Error('Module indisponible'))};
  el.onerror=()=>{clearTimeout(timeout);reject(Error('Chargement impossible'))};document.head.append(el);
 }).catch(e=>{loadingAPI=null;throw e});
 return loadingAPI;
}
function mount(root,a={}){
 if(!root)return;leave();
 const projects=(typeof a.projects==='function'?a.projects():a.projects||[]).filter(p=>p?.id&&p?.name);
 const initial=projects.find(p=>p.id===a.projectId)?.id||projects[0]?.id||'';
 let filter='all',showPast=false,active='',busy=false;
 const opts=(entries,selected)=>entries.map(([key,label])=>'<option value="'+E(key)+'" '+(key===selected?'selected':'')+'>'+E(label)+'</option>').join('');
 const projectName=m=>projects.find(x=>x.id===m.projectId)?.name||'Sans projet';
 const notice=(s,err=false)=>{const e=root.querySelector('#vs-notice');e.textContent=s;e.dataset.error=String(err)};
 root.innerHTML='<div class="vs-page"><div class="vs-head"><div><span class="vs-kicker">CONTROL / COMMUNICATION</span><h1>Visios et rendez-vous</h1><p>Réunions d’équipe, échanges clients et présentations commerciales au même endroit.</p></div><span class="vs-label">Interne · Externe</span></div>'+
 '<div class="vs-disclaimer">CONTROL gère les fiches, invitations et liens de réunion. <strong>La vidéo passe par le fournisseur choisi</strong> (Google Meet, Zoom, Teams ; Jitsi uniquement pour des essais d’intégration). Aucune invitation ni réunion n’est créée automatiquement chez ces fournisseurs. Aucune réunion n’est enregistrée par CONTROL.</div>'+
 '<details class="vs-create" id="vs-create" open><summary>+ Préparer une visioconférence</summary><form id="vs-form">'+
 '<div class="vs-grid"><label>Type<select name="type" class="vs-input">'+opts(Object.entries(types),'team')+'</select></label><label>Projet<select name="projectId" class="vs-input">'+opts([['','Sans projet'],...projects.map(p=>[p.id,p.name])],initial)+'</select></label></div>'+
 '<label>Sujet<input name="title" class="vs-input" maxlength="160" required placeholder="Point d’équipe, démonstration client…"></label>'+
 '<div class="vs-grid"><label>Date et heure<input name="starts" class="vs-input" type="datetime-local" required value="'+E(defaultTime())+'"></label><label>Durée<select name="minutes" class="vs-input">'+opts([['15','15 min'],['30','30 min'],['45','45 min'],['60','1 h'],['90','1 h 30'],['120','2 h']],'30')+'</select></label></div>'+
 '<label>Plateforme<select name="provider" class="vs-input">'+opts(Object.entries(providers).map(([key,p])=>[key,p.label]),'Google Meet')+'</select></label>'+
 '<p id="vs-provider-hint" class="vs-hint"></p><label>Lien officiel de la réunion<input name="url" class="vs-input" type="url" maxlength="2000" placeholder="Colle ici le lien créé chez le fournisseur"></label>'+
 '<div class="vs-buttons"><a id="vs-create-link" href="https://meet.google.com/" target="_blank" rel="noopener noreferrer">Créer le lien chez Google Meet ↗</a><button type="submit" class="vs-primary">Enregistrer le rendez-vous</button></div><p class="vs-hint">Tu partageras ensuite l’invitation toi-même ; aucun e-mail n’est envoyé par CONTROL.</p></form></details>'+
 '<section class="vs-list"><div class="vs-listhead"><h2>Mes rendez-vous</h2><span id="vs-count">0 à venir</span></div><div class="vs-filters"><button type="button" data-filter="all" aria-pressed="true">Tous</button><button type="button" data-filter="team" aria-pressed="false">Équipe</button><button type="button" data-filter="external" aria-pressed="false">Clients / prospects</button></div><div id="vs-upcoming"></div><button type="button" id="vs-past-toggle" class="vs-past-toggle">Voir les rendez-vous passés</button><div id="vs-past" hidden></div></section>'+
 '<div id="vs-video" class="vs-video" hidden><div class="vs-videohead"><strong>Visio intégrée · test Jitsi</strong><button type="button" id="vs-close">Fermer la visio</button></div><p>Environnement de test externe. L’hôte peut devoir se connecter. Sur Android, utilise « Rejoindre » si l’intégration ne fonctionne pas.</p><div id="vs-frame"></div></div>'+
 '<p id="vs-notice" role="status" aria-live="polite"></p><details class="vs-privacy"><summary>Vie privée, accès et limites</summary><p>Les liens de réunion sont sensibles : ne les rends pas publics. Le stockage personnel se fait dans le navigateur ; la version Cloud attend une base privée sécurisée. Le fournisseur gère la caméra, le micro, la sécurité et la salle d’attente. Jitsi public est destiné aux tests d’intégration, pas aux visios commerciales en production. CONTROL n’enregistre ni audio ni vidéo et ne vérifie pas qui a réellement rejoint l’appel.</p></details></div>';
 const form=root.querySelector('#vs-form');
 function providerUI(){const p=form.elements.provider.value,entry=providers[p];const url=form.elements.url,link=root.querySelector('#vs-create-link');
  link.href=entry.home;link.textContent=p==='Jitsi (test)'?'Conditions du module Jitsi ↗':'Créer le lien chez '+p+' ↗';
  url.disabled=p==='Jitsi (test)';if(p==='Jitsi (test)')url.value='';
  root.querySelector('#vs-provider-hint').textContent=p==='Jitsi (test)'?'Une salle aléatoire de test sera générée. Ce service public n’est pas destiné à un usage commercial en production.':'Crée une réunion chez '+p+' puis colle son lien dans CONTROL. Les droits des participants sont gérés par '+p+'.';
 }
 form.elements.provider.addEventListener('change',providerUI);providerUI();
 form.elements.type.addEventListener('change',()=>{if(form.elements.type.value==='external'&&form.elements.provider.value==='Jitsi (test)')notice('Pour un client ou prospect, choisis Meet, Zoom ou Teams.',true)});
 const list=()=>typeof a.list==='function'?a.list():[];
 const ok=m=>m&&m.id&&m.title&&Object.hasOwn(types,m.type)&&Object.hasOwn(providers,m.provider)&&allowedLink(m.url,m.provider)&&Number.isFinite(Date.parse(m.startsAt));
 const byId=id=>list().find(m=>m.id===id);
 const card=m=>'<article class="vs-card"><div class="vs-card-head"><span class="vs-category">'+E(types[m.type])+'</span><h3>'+E(m.title)+'</h3><p>'+E(fmt(m.startsAt))+' · '+E(m.minutes)+' min · '+E(m.provider)+'</p><small>'+E(projectName(m))+'</small></div>'+
 '<div class="vs-actions"><a href="'+E(m.url)+'" class="vs-join" target="_blank" rel="noopener noreferrer">Rejoindre ↗</a><button type="button" data-invite="'+E(m.id)+'">Inviter</button><button type="button" data-calendar="'+E(m.id)+'">Agenda</button><button type="button" data-ics="'+E(m.id)+'">.ics</button></div>'+
 (m.provider==='Jitsi (test)'?'<p class="vs-hint">Test uniquement : meet.jit.si n’est pas recommandé pour une intégration commerciale.</p><button type="button" data-embed="'+E(m.id)+'">Tester la visio intégrée</button>':'')+
 '<details class="vs-notes" '+(active===m.id?'open':'')+'><summary>Compte rendu et gestion</summary><form data-update="'+E(m.id)+'"><label>Notes après réunion<textarea class="vs-input" name="notes" maxlength="4000" rows="3">'+E(m.notes||'')+'</textarea></label><div class="vs-actions"><button type="submit">Enregistrer les notes</button><button type="button" data-remove="'+E(m.id)+'">Supprimer la fiche</button></div></form></details></article>';
 function paint(){
  const now=Date.now(),entries=list().filter(ok).sort((x,y)=>Date.parse(x.startsAt)-Date.parse(y.startsAt));
  const upcoming=entries.filter(m=>Date.parse(m.startsAt)+m.minutes*60000>=now),previous=entries.filter(m=>Date.parse(m.startsAt)+m.minutes*60000<now);
  const select=rows=>rows.filter(m=>filter==='all'||m.type===filter);
  root.querySelector('#vs-upcoming').innerHTML=select(upcoming).length?select(upcoming).slice(0,12).map(card).join(''):'<p class="vs-empty">Aucun rendez-vous à venir dans cette catégorie.</p>';
  root.querySelector('#vs-count').textContent=upcoming.length+' à venir';
  root.querySelector('#vs-past').innerHTML=select(previous).slice(-12).reverse().map(card).join('')||'<p class="vs-empty">Aucun rendez-vous passé.</p>';
  root.querySelector('#vs-past').hidden=!showPast;
  root.querySelector('#vs-past-toggle').textContent=showPast?'Masquer les rendez-vous passés':'Voir les rendez-vous passés ('+previous.length+')';
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const f=new FormData(form),title=String(f.get('title')||'').trim(),type=String(f.get('type')||''),provider=String(f.get('provider')||''),p=String(f.get('projectId')||''),
    startsAt=parseLocal(String(f.get('starts')||'')),minutes=Number(f.get('minutes'));
  if(title.length<3||title.length>160||!Object.hasOwn(types,type)||!Object.hasOwn(providers,provider)||!startsAt||![15,30,45,60,90,120].includes(minutes)||p&&!projects.some(x=>x.id===p)){notice('Vérifie le sujet, le projet, la date et la durée.',true);return}
  if(type==='external'&&provider==='Jitsi (test)'){notice('Pour les clients et prospects, utilise une plateforme de production.',true);return}
  let url;try{url=provider==='Jitsi (test)'?roomLink():allowedLink(String(f.get('url')||''),provider)}catch(err){notice(err.message,true);return}
  if(!url){notice('Colle le lien d’invitation à la réunion (et non l’adresse d’accueil ou de planification) chez '+provider+'.',true);return}
  const m={id:newId(),projectId:p,title,type,provider,startsAt,minutes,url,notes:'',createdAt:new Date().toISOString()};
  if(!a.create){notice('Enregistrement non disponible.',true);return}
  busy=true;const submit=form.querySelector('button[type="submit"]');submit.disabled=true;
  try{await a.create(m);form.reset();form.elements.starts.value=defaultTime();providerUI();root.querySelector('#vs-create').open=false;notice('Rendez-vous enregistré. Utilise « Inviter » pour partager son lien.');paint()}
  catch(err){notice(err?.message||'Enregistrement impossible.',true)}
  finally{busy=false;submit.disabled=false}
 });
 async function share(m){
  try{if(navigator.share){await navigator.share({title:m.title,text:invitation(m)});notice('Partage ouvert. Vérifie l’envoi dans ton application.');return}}
  catch(err){if(err?.name==='AbortError')return}
  try{await navigator.clipboard.writeText(invitation(m));notice('Invitation copiée. Envoie-la toi-même aux participants.')}
  catch{notice('Copie indisponible : partage directement le lien officiel.',true)}
 }
 function download(m){
  const obj=URL.createObjectURL(new Blob([ics(m)],{type:'text/calendar;charset=utf-8'})),a=document.createElement('a');
  a.href=obj;a.download='CONTROL-RDV-'+m.startsAt.slice(0,10)+'.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(obj),5000);
  notice('Fichier calendrier téléchargé. Ajoute-le dans l’agenda de ton choix.');
 }
 async function embed(m){
  if(m.provider!=='Jitsi (test)')return;
  const panel=root.querySelector('#vs-video'),host=root.querySelector('#vs-frame');leave();panel.hidden=false;host.replaceChildren();panel.scrollIntoView({block:'start'});
  notice('Chargement du module Jitsi. Micro et caméra nécessitent ton autorisation.');
  try{const C=await loadAPI();if(!root.isConnected||panel.hidden)return;
   meetAPI=new C('meet.jit.si',{roomName:new URL(m.url).pathname.slice(1),parentNode:host,width:'100%',height:520,lang:'fr',configOverwrite:{startWithAudioMuted:true,startWithVideoMuted:true}});
   if(typeof MutationObserver!=='undefined'){observer=new MutationObserver(()=>{if(!root.isConnected||panel.hidden)leave()});observer.observe(document.documentElement,{subtree:true,childList:true})}
   notice('Test Jitsi chargé. Si le navigateur bloque la visio, ouvre la réunion via « Rejoindre ».')
  }catch{panel.hidden=true;leave();notice('Module indisponible. Utilise le lien de réunion externe.',true)}
 }
 root.querySelector('#vs-close').addEventListener('click',()=>{leave();root.querySelector('#vs-frame').replaceChildren();root.querySelector('#vs-video').hidden=true;notice('Visio fermée sur cet appareil.')});
 root.querySelector('#vs-past-toggle').addEventListener('click',()=>{showPast=!showPast;paint()});
 root.addEventListener('click',async e=>{
  const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;root.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));paint();return}
  const button=e.target.closest('[data-invite],[data-calendar],[data-ics],[data-embed],[data-remove]');if(!button)return;
  const id=button.dataset.invite||button.dataset.calendar||button.dataset.ics||button.dataset.embed||button.dataset.remove,m=byId(id);if(!ok(m))return;
  if(button.dataset.invite)await share(m);
  else if(button.dataset.calendar){window.open(calendarURL(m),'_blank','noopener,noreferrer');notice('Google Agenda ouvert. Vérifie puis enregistre toi-même.')}
  else if(button.dataset.ics)download(m);
  else if(button.dataset.embed)embed(m);
  else if(button.dataset.remove){if(!confirm('Supprimer cette fiche CONTROL ? Le rendez-vous externe et les invitations ne seront pas annulés.'))return;
   try{await a.remove(m);paint();notice('Fiche CONTROL supprimée. Réunion externe inchangée.')}catch(err){notice(err?.message||'Suppression refusée.',true)}
  }
 });
 root.addEventListener('submit',async e=>{
  const form=e.target.closest('[data-update]');if(!form)return;e.preventDefault();
  const m=byId(form.dataset.update);if(!ok(m))return;
  try{await a.update(m,{notes:String(new FormData(form).get('notes')||'').slice(0,4000)});active=m.id;paint();notice('Notes enregistrées localement ou dans ton espace Cloud selon la version.')}
  catch(err){notice(err?.message||'Enregistrement impossible.',true)}
 });
 paint();
}
window.CONTROL_VISIOS={mount,roomLink,allowedLink,parseLocal,invitation,calendarURL,ics,leave};
})();