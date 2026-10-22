/* CONTROL Operator core: read-only local search and explicit local action proposals.
 * Deterministic commands, not a connected LLM or an external automation. */
(()=>{'use strict';
const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/\s+/g,' ').trim();
const trim=(s,n=180)=>String(s??'').trim().slice(0,n);
const arr=x=>Array.isArray(x)?x:[];
const statuses={todo:'à lancer',doing:'en cours (déclaré)',review:'à vérifier',done:'terminée'};
function findProject(query,projects,scope){
 const q=' '+fold(query)+' ';
 const available=scope&&scope!=='general'?arr(projects).filter(p=>p.id===scope):arr(projects);
 const matches=available.map(p=>{
  const aliases=[p.id,p.name,p.short].filter(v=>typeof v==='string'&&v.length>=2);
  const score=aliases.reduce((n,v)=>{const s=fold(v);return s&&q.includes(' '+s+' ')?Math.max(n,s.length):n},0);
  return {project:p,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
 return matches[0]?.project||available.find(p=>p.id===scope)||null;
}
function validateDate(value){
 const match=String(value||'').match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)$/);
 if(!match)return false;
 const [y,m,d,h,min]=match.slice(1).map(Number);
 return y>=2020&&y<=2100&&m>=1&&m<=12&&h<=23&&min<=59&&d>=1&&d<=new Date(y,m,0).getDate();
}
// Reject nonexistent and ambiguous local wall-clock times in the device timezone.
function validateLocalDateTime(value){
 if(!validateDate(value))return false;
 const [year,month,day,hour,minute]=value.match(/\d+/g).map(Number);
 const same=d=>d.getFullYear()===year&&d.getMonth()+1===month&&d.getDate()===day&&d.getHours()===hour&&d.getMinutes()===minute;
 const instant=new Date(value);
 if(!Number.isFinite(+instant)||!same(instant))return false;
 // A repeated wall-clock minute maps to two instants during a backward DST shift.
 for(const delta of [-180,-120,-90,-60,-30,30,60,90,120,180]){
  if(same(new Date(+instant+delta*60000)))return false;
 }
 return true;
}
function parseDate(query){
 const s=String(query||'');
 // This interface accepts only a single unambiguous device-local wall-clock time.
 // Reject explicit timezones and offsets rather than silently converting them.
 if(/(?:\d{1,2}:\d{2}|\d{1,2}h\d{2})(?:UTC|GMT|CET|CEST|EST|EDT|BST|WET|WEST|EET|EEST|IST|JST|PST|PDT|HNE|HAE|HNC|HAC|HNR|HAR|HNP|HAP|(?:Africa|America|Antarctica|Arctic|Asia|Atlantic|Australia|Europe|Indian|Pacific)\/[A-Za-z_]+(?:\/[A-Za-z_]+)?)/i.test(s))return null;
 if(/\b(?:UTC|GMT|CET|CEST|BST|WET|WEST|EET|EEST|IST|JST|EDT|PST|PDT|HNE|HAE|HNC|HAC|HNR|HAR|HNP|HAP)\b/i.test(s)||/\bEST\b/.test(s)||/\b(?:Africa|America|Antarctica|Arctic|Asia|Atlantic|Australia|Europe|Indian|Pacific)\/[A-Za-z_]+(?:\/[A-Za-z_]+)?\b/.test(s)||/(?:\d{1,2}:\d{2}|\d{1,2}h\d{2})\s*Z\b/i.test(s)||/(?:\d{1,2}:\d{2}|\d{1,2}h\d{0,2})\s*[+\-\u2212\u2010-\u2015\uFE63\uFF0B\uFF0D]\s*\d{1,2}(?::?\d{2})?\b/i.test(s))return null;
 const zoneContext=s.replace(/\b(?:heure|horaire)\s+(?:de|du|d['’])\s+(?:travail|d[eé]but|fin|pause|r[eé]union)\b/gi,'');
 if(/\b(?:heure|horaire|fuseau|timezone)\s+(?:(?:de|du|d['’]|en)\s+)?[A-Za-zÀ-ÿ_-]+(?:\s+[A-Za-zÀ-ÿ_-]+){0,2}/i.test(zoneContext))return null;
 const dates=[...s.matchAll(/\b(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})(?=\b|T\d{1,2}:)/g)];
 const times=[...s.matchAll(/(?:\b|à\s+|a\s+|T)(\d{1,2})\s*(?:h|:)\s*(\d{2})?/gi)];
 if(dates.length!==1||times.length!==1||times[0].index<dates[0].index+dates[0][0].length)return null;
 if(/\b(?:ou|soit)\b/i.test(s.slice(dates[0].index+dates[0][0].length)))return null;
 const d=dates[0][0],parts=d.includes('/')?d.split('/'):d.split('-');
 const [y,m,day]=d.includes('/')?[parts[2],parts[1],parts[0]]:parts;
 const t=times[0];
 if(/^\d/.test(s.slice(t.index+t[0].length)))return null;
 if(/^[:.,]\d/.test(s.slice(t.index+t[0].length)))return null;
 const date=y+'-'+m.padStart(2,'0')+'-'+day.padStart(2,'0')+'T'+t[1].padStart(2,'0')+':'+(t[2]||'00');
 return validateDate(date)&&validateLocalDateTime(date)?date:null;
}
function visible(data,scope){
 const projects=arr(data?.projects),selected=projects.find(p=>p.id===scope);
 const allowed=p=>!selected||p===selected.id;
 return {projects:selected?[selected]:projects,selected,actions:arr(data?.actions).filter(x=>allowed(x.project)),
 missions:arr(data?.missions).filter(x=>allowed(x.project)),
 events:arr(data?.events).filter(x=>allowed(x.project)),
 meetings:arr(data?.meetings).filter(x=>allowed(x.projectId||x.project))};
}
function inferTitle(query,kind,project){
 let s=String(query||'');
 s=kind==='task'?s.replace(/^.*?\b(?:tâche|tache|action)\b\s*(?:de\s+|pour\s+|:\s*)?/i,''):
 s.replace(/^.*?\b(?:rendez-vous|rdv|réunion|reunion|événement|evenement)\b\s*(?:de\s+|pour\s+|:\s*)?/i,'');
 s=s.replace(/\b(?:le\s+)?\d{1,2}\/\d{1,2}\/\d{4}\b.*$/,'').replace(/\b(?:le\s+)?\d{4}-\d\d-\d\d\b.*$/,'');
 if(project){const alias=fold(project.id).replace(/[^a-z0-9-]/g,'');s=s.replace(new RegExp('\\s+(?:dans|sur|pour)\\s+(?:le\\s+|la\\s+)?(?:projet\\s+)?'+alias+'\\s*$','i'),'')}
 return trim(s.replace(/^(?:de |d['’]|pour |: )/i,'').replace(/[.,;:\s]+$/,''),160);
}
// A confirmation must describe the actual currently visible local target, not a stale proposal.
// This is only a device-local preflight. A real server still needs Auth + RLS.
function reviewAction(action,snapshot={},scope='general'){
 if(!action||typeof action!=='object')throw Error('Proposition absente.');
 const project=arr(snapshot.projects).find(p=>p.id===action.projectId);
 if(!project||scope!=='general'&&scope!==project.id)throw Error('Projet non autorisé ou retiré.');
 const title=String(action.title||'').trim();
 if(!title||title.length>160)throw Error('Intitulé manquant ou trop long.');
 const target='Projet « '+trim(project.name,120)+' »';
 const type=String(action.type||'');
 if(type==='create_action')return {target,before:'Aucune nouvelle tâche.',after:'Créer la tâche « '+title+' » (à faire).',risk:'Faible : écriture sur cet appareil uniquement.',projectName:project.name};
 if(type==='create_event'){
  if(!validateLocalDateTime(action.date)||new Date(action.date)<=new Date())throw Error('Date future locale invalide ou ambiguë.');
  return {target,before:'Aucun nouvel événement.',after:'Créer « '+title+' » le '+action.date+' (heure locale).',risk:'Modéré : agenda local seulement, sans invitation externe.',projectName:project.name};
 }
 if(type==='complete_action'){
  const current=arr(snapshot.actions).find(x=>x.id===action.id&&x.project===project.id&&x.title===title);
  if(!current||current.status==='done'||!action.expectedStatus||current.status!==action.expectedStatus)throw Error('Statut modifié : préparer une nouvelle confirmation.');
  return {target,before:'« '+title+' » : '+(statuses[current.status]||current.status)+'.',after:'« '+title+' » : terminée (statut déclaratif, aucune exécution automatique).',risk:'Modéré : change uniquement le statut local.',projectName:project.name};
 }
 if(type==='update_event'||type==='delete_event'){
  const current=arr(snapshot.events).find(x=>x.id===action.id&&x.project===project.id&&x.title===title);
  if(!current||typeof action.expectedDate!=='string'||current.date!==action.expectedDate)throw Error('Événement modifié : préparer une nouvelle confirmation.');
  if(type==='delete_event')return {target,before:'« '+title+' » : '+current.date+'.',after:'Supprimer définitivement cet événement local.',risk:'Élevé : suppression irréversible sur cet appareil.',projectName:project.name};
  if(!validateLocalDateTime(action.date)||new Date(action.date)<=new Date())throw Error('Nouvelle date future locale invalide ou ambiguë.');
  if(action.date===current.date)throw Error('Aucune modification de date à confirmer.');
  return {target,before:'« '+title+' » : '+current.date+'.',after:'« '+title+' » : '+action.date+' (heure locale).',risk:'Modéré : déplacement local sans invitation externe.',projectName:project.name};
 }
 throw Error('Type d’action interdit.');
}
function interpret(input,snapshot={},scope='general'){
 const raw=trim(input,1200),q=fold(raw),projects=arr(snapshot?.projects);
 if(scope!=='general'&&!projects.some(p=>p.id===scope))return {kind:'help',text:'Projet introuvable. Accès refusé.'};
 const mentioned=projects.filter(p=>[p.id,p.name,p.short].some(a=>typeof a==='string'&&fold(a).length>=2&&(' '+q+' ').includes(' '+fold(a)+' ')));
 if(mentioned.length>1)return {kind:'help',text:'Plusieurs projets mentionnés : préciser un seul projet.'};
 if(scope!=='general'&&mentioned.some(p=>p.id!==scope))return {kind:'help',text:'Projet différent du projet sélectionné : changer de projet.'};
 const v=visible(snapshot,scope),project=findProject(raw,v.projects,scope);
 if(!q)return {kind:'help',text:'Décris un projet, une tâche, une mission ou un événement à retrouver.'};
 // Refuse requests that explicitly negate an action, ask how to do it, or merely
 // ask for a simulation. Pattern matching must never turn "ne crée pas" into a proposal.
 const actionWords='(?:cree|creer|ajoute|ajouter|programme|programmer|planifie|planifier|supprime|supprimer|annule|annuler|efface|decale|decaler|deplace|deplacer|modifie|modifier|termine|terminer|acheve|marque)';
 const negated=new RegExp('\\b(?:ne|n)\\s+(?:(?:me|nous)\\s+)?'+actionWords+'\\b[^.!?]{0,45}\\bpas\\b').test(q);
 const instructional=new RegExp('\\b(?:comment|expliquer comment)\\s+'+actionWords+'\\b').test(q);
 const simulated=new RegExp('\\b(?:sans rien|sans vraiment|sans effectivement)\\s+'+actionWords+'\\b').test(q);
 if(negated||instructional||simulated)return {kind:'help',text:'Cette demande ne sera pas traitée comme une autorisation d’agir. Décris séparément une action souhaitée et confirme-la explicitement.'};
 if(/(?:connecte|synchronise|envoie|delegue|lance|demarre)/.test(q)&&/(claude|chatgpt|gemini|codex|compte|gmail)/.test(q))
  return {kind:'help',text:'Les comptes IA externes ne sont pas pilotables depuis cette fonction locale. Aucun fournisseur n’a été déclenché.'};
 const createTask=/(?:cree|creer|ajoute|ajouter|note|planifie)\b/.test(q)&&/\b(?:tache|action)\b/.test(q);
 const createEvent=/(?:cree|creer|ajoute|ajouter|programme|programmer|planifie|planifier)\b/.test(q)&&/\b(?:rdv|rendez[- ]vous|reunion|evenement)\b/.test(q);
 if(createTask&&createEvent)return {kind:'help',text:'Deux créations différentes ont été demandées. Sépare la tâche et le rendez-vous en demandes distinctes.'};
 if(createTask||createEvent){
  if(!project)return {kind:'help',text:'Choisis un projet ou indique son nom avant toute création.'};
  const type=createTask?'create_action':'create_event';
  return {kind:'draft',action:{type,projectId:project.id,title:inferTitle(raw,createTask?'task':'event',project),date:createEvent?parseDate(raw)||'':''},
   text:createTask?'Vérifie et confirme la tâche à créer localement dans '+project.name+'.':
    'Vérifie et confirme cet événement dans '+project.name+'. Aucun invité ni calendrier externe ne sera contacté.'};
 }
 const eventWord=/\b(?:rdv|rendez[- ]vous|reunion|evenement)\b/.test(q);
 const removeEvent=eventWord&&/\b(?:supprime|supprimer|annule|annuler|efface)\b/.test(q);
 const moveEvent=eventWord&&/\b(?:decale|decaler|deplace|deplacer|reprogramme|reprogrammer|modifie|modifier)\b/.test(q);
 if(removeEvent&&moveEvent)return {kind:'help',text:'Suppression et déplacement demandés ensemble. Choisis une seule action sur cet événement.'};
 if(removeEvent||moveEvent){
  const matches=v.events.filter(e=>(!project||e.project===project.id)&&fold(e.title).length>2&&fold(raw).includes(fold(e.title)));
  if(matches.length!==1)return {kind:'help',text:'Indique le titre exact de l’événement local et son projet. Événements disponibles : '+v.events.slice(0,6).map(e=>trim(e.title,80)).join(' · ')+'. Les visios externes ne sont pas supprimées.'};
  const entry=matches[0],date=moveEvent?parseDate(raw)||'':entry.date;
  return {kind:'draft',action:{type:moveEvent?'update_event':'delete_event',projectId:entry.project,id:entry.id,title:entry.title,date,expectedDate:entry.date},
   text:moveEvent?'Vérifie la nouvelle date avant de modifier cet événement local. Aucun calendrier externe ne sera modifié.':
    'Suppression d’un événement local uniquement. Les invitations et calendriers externes ne seront pas modifiés.'};
 }
 if(/\b(?:termine|terminer|acheve|marque)\b/.test(q)&&/\b(?:tache|action)\b/.test(q)){
  const active=v.actions.filter(a=>a.status!=='done'&&(!project||a.project===project.id));
  const matching=active.filter(a=>fold(a.title).length>2&&fold(raw).includes(fold(a.title)));
  if(matching.length!==1)return {kind:'help',text:'Indique l’intitulé exact de la tâche et son projet. Tâches trouvées : '+active.slice(0,5).map(a=>trim(a.title,80)).join(' · ')};
  return {kind:'draft',action:{type:'complete_action',projectId:matching[0].project,id:matching[0].id,title:matching[0].title,expectedStatus:matching[0].status},
    text:'Marquer la tâche terminée ? Cette modification demande une confirmation.'};
 }
 if(/\b(?:quelle ia|quelles ia|qui travaille|agent|missions?|en cours|delegue)\b/.test(q)&&!/\b(?:rendez|agenda)\b/.test(q)){
  const rows=project?v.missions.filter(m=>m.project===project.id):v.missions;
  if(!rows.length)return {kind:'read',text:'Aucune mission IA enregistrée pour ce périmètre. Les conversations des fournisseurs ne sont pas accessibles en direct.'};
  return {kind:'read',text:'Missions déclarées dans CONTROL ('+rows.length+') :\n'+rows.slice().reverse().slice(0,10).map(m=>'• '+trim(m.title,90)+' — '+trim(m.provider,30)+' — '+(statuses[m.status]||'état inconnu')).join('\n')+'\n« En cours » est un état déclaratif, pas une preuve d’activité en direct.',links:[{label:'Missions',href:'#/control/missions'}]};
 }
 if(/\b(?:agenda|calendrier|planning|rdv|rendez[- ]vous|visios?|reunions?|evenements?)\b/.test(q)){
  const events=[...v.events.map(e=>({title:e.title,date:e.date})),...v.meetings.map(e=>({title:e.title,date:e.startsAt}))].filter(e=>e.date&&Date.parse(e.date)>=Date.now()).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  return {kind:'read',text:events.length?'Prochains rendez-vous et événements enregistrés localement :\n'+events.slice(0,8).map(e=>'• '+trim(e.title,100)+' — '+trim(e.date,24)).join('\n')+'\nAucun calendrier externe synchronisé.':'Aucun événement futur enregistré dans CONTROL. Tes calendriers externes ne sont pas consultés.',links:[{label:'Calendrier',href:'#/control/calendar'},{label:'Visios',href:'#/control/meetings'}]};
 }
 if(/\b(?:taches?|actions?|priorites?|retard|a faire|todo)\b/.test(q)){
  const open=v.actions.filter(a=>a.status!=='done'&&(!project||a.project===project.id));
  return {kind:'read',text:open.length?'Actions ouvertes ('+open.length+') :\n'+open.slice(-10).reverse().map(a=>'• '+trim(a.title,100)+' — '+(a.priority||'Normale')+(a.due?' · '+a.due:'')).join('\n'):'Aucune action ouverte enregistrée dans CONTROL pour ce périmètre.',links:[{label:'À traiter',href:'#/control/inbox'}]};
 }
 if(/\b(?:ou|retrouve|localise|projets?|avance|statut|etat|progression|reste a faire)\b/.test(q)){
  if(!project)return {kind:'read',text:'Projets CONTROL :\n'+v.projects.slice(0,20).map(p=>'• '+trim(p.name,90)+' — '+(p.status||'Statut inconnu')).join('\n')+'\nLes statuts de référence peuvent être anciens.',links:[{label:'Projets',href:'#/control/manager'}]};
  const actions=v.actions.filter(a=>a.project===project.id),missions=v.missions.filter(m=>m.project===project.id);
  return {kind:'read',text:'Projet : '+project.name+'\nStatut de référence : '+(project.status||'Non renseigné')+'\nRésumé : '+trim(project.summary||project.description||'Non renseigné',300)+'\nActions ouvertes : '+actions.filter(a=>a.status!=='done').length+' / '+actions.length+'\nMissions déclarées : '+missions.length+', dont '+missions.filter(m=>m.status==='doing').length+' en cours (non vérifiées en direct).\nSource : fiche projet CONTROL et enregistrements locaux.',
   links:[{label:'Ouvrir le projet',href:'#/project/'+encodeURIComponent(project.id)+'/pilot'},{label:'Missions',href:'#/control/missions'}]};
 }
 return {kind:'help',text:'Demandes prises en charge : « Où en est UCP ? », « Quelle IA travaille sur UCP ? », « Mes tâches », « Mon agenda », « Crée une tâche préparer le devis pour UCP », « Programme un rendez-vous le 25/10/2026 à 14h30 pour UCP ». Cette fonction consulte CONTROL local ; elle ne code pas encore des sites et ne commande pas les fournisseurs IA.'};
}
window.CONTROL_OPERATOR_CORE={interpret,fold,validateDate,validateLocalDateTime,parseDate,findProject,reviewAction};
})();