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
function parseDate(query){
 const s=String(query||'');
 let d=s.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/),y,m,day;
 if(d){day=d[1];m=d[2];y=d[3]}else{d=s.match(/\b(\d{4})-(\d\d)-(\d\d)\b/);if(!d)return null;[y,m,day]=d.slice(1)}
 const time=s.slice(d.index+d[0].length).match(/(?:\b|à\s+|a\s+)(\d{1,2})\s*(?:h|:)\s*(\d{2})?/i);
 if(!time)return null;
 const date=y+'-'+m.padStart(2,'0')+'-'+day.padStart(2,'0')+'T'+time[1].padStart(2,'0')+':'+(time[2]||'00');
 return validateDate(date)?date:null;
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
function interpret(input,snapshot={},scope='general'){
 const raw=trim(input,1200),q=fold(raw),v=visible(snapshot,scope),project=findProject(raw,v.projects,scope);
 if(!q)return {kind:'help',text:'Décris un projet, une tâche, une mission ou un événement à retrouver.'};
 if(/(?:connecte|synchronise|envoie|delegue|lance|demarre)/.test(q)&&/(claude|chatgpt|gemini|codex|compte|gmail)/.test(q))
  return {kind:'help',text:'Les comptes IA externes ne sont pas pilotables depuis cette fonction locale. Aucun fournisseur n’a été déclenché.'};
 const createTask=/(?:cree|creer|ajoute|ajouter|note|planifie)\b/.test(q)&&/\b(?:tache|action)\b/.test(q);
 const createEvent=/(?:cree|creer|ajoute|ajouter|programme|programmer|planifie|planifier)\b/.test(q)&&/\b(?:rdv|rendez[- ]vous|reunion|evenement)\b/.test(q);
 if(createTask||createEvent){
  if(!project)return {kind:'help',text:'Choisis un projet ou indique son nom avant toute création.'};
  const type=createTask?'create_action':'create_event';
  return {kind:'draft',action:{type,projectId:project.id,title:inferTitle(raw,createTask?'task':'event',project),date:createEvent?parseDate(raw)||'':''},
   text:createTask?'Vérifie et confirme la tâche à créer localement dans '+project.name+'.':
    'Vérifie et confirme cet événement dans '+project.name+'. Aucun invité ni calendrier externe ne sera contacté.'};
 }
 if(/\b(?:termine|terminer|acheve|marque)\b/.test(q)&&/\b(?:tache|action)\b/.test(q)){
  const active=v.actions.filter(a=>a.status!=='done'&&(!project||a.project===project.id));
  const matching=active.filter(a=>fold(a.title).length>2&&fold(raw).includes(fold(a.title)));
  if(matching.length!==1)return {kind:'help',text:'Indique l’intitulé exact de la tâche et son projet. Tâches trouvées : '+active.slice(0,5).map(a=>trim(a.title,80)).join(' · ')};
  return {kind:'draft',action:{type:'complete_action',projectId:matching[0].project,id:matching[0].id,title:matching[0].title},
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
window.CONTROL_OPERATOR_CORE={interpret,fold,validateDate,parseDate,findProject};
})();