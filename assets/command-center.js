/* CONTROL · Centre de commande — données locales et lectures GitHub publiques.
   Aucune API privée, dépense, autorisation ou modification d'automatisation. */
(()=>{'use strict';
const KEY='control-command-v1',HUB='control-hub-v2',AUTOS='control-automations-v1',OWNER='cosscoll';
let localStoreCorrupt=false;
let db,ctx={projects:[],state:{}},live={},sprints={},sprintLoaded={},sprintLoading=null;
const $=s=>document.querySelector(s);
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=v=>{try{const x=new URL(String(v||''));return x.protocol==='https:'&&!x.username&&!x.password&&![...x.searchParams.keys()].some(k=>/^(access_token|token|api_key|secret|password|code)$/i.test(k))?x.href:''}catch{return''}};
const href=(url,label,cls='button')=>safe(url)?'<a class="'+cls+'" href="'+h(safe(url))+'" target="_blank" rel="noopener noreferrer">'+h(label)+' ↗</a>':'';
const date=v=>{if(!v)return 'Non renseigné';const d=new Date(v);return isNaN(+d)?'Non renseigné':d.toLocaleDateString('fr-FR')};
const dt=v=>{if(!v)return 'Non vérifié';const d=new Date(v);return isNaN(+d)?'Non vérifié':d.toLocaleString('fr-FR')};
const id=()=>globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2);
const pname=k=>ctx.projects.find(x=>x.id===k)?.name||k||'Tous les projets';
const projopts=(selected='',all=true)=> (all?'<option value="">Tous les projets</option>':'')+ctx.projects.map(p=>'<option value="'+h(p.id)+'" '+(selected===p.id?'selected':'')+'>'+h(p.name)+'</option>').join('');
const openProject=p=>ctx.state?.[p]||{};
const agents=[{id:'ChatGPT',url:'https://chatgpt.com/'},{id:'Claude',url:'https://claude.ai/'},{id:'Codex',url:'https://chatgpt.com/codex'},{id:'Gemini',url:'https://gemini.google.com/'}];
function sourceLink(project,provider){const x=openProject(project);return provider==='ChatGPT'?(x.projectUrl||x.spaces?.ChatGPT||''):(x.spaces?.[provider]||'')}
function availableAgents(){const ids=new Set(agents.map(a=>a.id));for(const p of ctx.projects){const d=openProject(p.id);for(const key of Object.keys(d.spaces||{}))ids.add(key);for(const key of (d.customProviders||[]))ids.add(key)}return [...ids]}
function providerURL(project,provider){return safe(sourceLink(project,provider))||agents.find(x=>x.id===provider)?.url||''}
function storage(){try{const raw=localStorage.getItem(KEY);if(raw===null){localStoreCorrupt=false;return {}}const a=JSON.parse(raw);if(!a||typeof a!=='object'||Array.isArray(a))throw Error('Invalid local data');localStoreCorrupt=false;return a}catch{localStoreCorrupt=true;return{}}}
function init(){db=Object.assign({version:1,actions:[],missions:[],events:[],expenses:[],decisions:[],goalPlans:[],messages:[],globalRules:'Aucune dépense, abonnement, achat de crédits ou action engageante sans autorisation explicite. Ne pas utiliser de quotas partagés interdits par les consignes du projet. Ne pas publier de données sensibles. Vérifier les résultats avant de les annoncer terminés.',notifications:false},storage());for(const key of ['actions','missions','events','meetings','expenses','income','decisions','goalPlans','messages'])if(!Array.isArray(db[key]))db[key]=[]}
function save(){if(localStoreCorrupt){toast('Stockage local illisible : restaure une sauvegarde avant toute modification.');return false}try{db.lastChanged=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(db));return true}catch{toast('Stockage indisponible ou plein. Effectue une sauvegarde.');return false}}
// A local operation is confirmed only after durable storage has accepted the full state.
// Roll back the in-memory changes too: rerendering an unpersisted state would mislead users.
function commitLocal(change){
 let before;
 try{before=JSON.stringify(db)}catch{toast('État local illisible : modification annulée.');return false}
 try{change();if(save()===true)return true}
 catch{toast('Modification impossible : données non enregistrées.')}
 try{db=JSON.parse(before)}catch{toast('Retour arrière impossible : recharge CONTROL avant toute autre action.')}
 return false;
}
function toast(m){const e=$('#toast');if(e){e.textContent=m;e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),4200)}}
function cap(s,n=320){s=String(s||'');return s.length>n?s.slice(0,n)+'…':s}
function view(title,subtitle,content,extra=''){return (localStoreCorrupt?'<div role="alert" class="notice"><strong>Stockage local illisible.</strong> Les modifications sont bloquées pour éviter d’écraser les données précédentes. <a href="#/control/backup">Récupérer les données brutes ou restaurer une sauvegarde</a>.</div>':'')+'<div class="toprow"><div><div class="quiet">CONTROL / CENTRE DE COMMANDE</div><h1>'+h(title)+'</h1><p class="muted">'+h(subtitle)+'</p></div>'+extra+'</div>'+content}
const note=(s)=>'<div class="notice">'+s+'</div>';
const box=(title,content)=>'<section class="panel"><h2>'+h(title)+'</h2>'+content+'</section>';
const tiny=(s)=>'<p class="muted">'+h(s)+'</p>';
const btn=(s,act,cls='')=>'<button type="button" data-act="'+h(act)+'" class="'+h(cls)+'">'+h(s)+'</button>';
const tag=s=>'<span class="chip">'+h(s)+'</span>';
function options(values,chosen){return values.map(v=>'<option value="'+h(v)+'" '+(chosen===v?'selected':'')+'>'+h(v)+'</option>').join('')}
function field(label,name,val='',type='text',extra=''){return '<label>'+h(label)+'<input class="field" name="'+h(name)+'" type="'+h(type)+'" value="'+h(val)+'" '+extra+'></label>'}
function textarea(label,name,val='',extra=''){return '<label>'+h(label)+'<textarea class="field" name="'+h(name)+'" '+extra+'>'+h(val)+'</textarea></label>'}
function selectProject(chosen='',all=true){return '<label>Projet<select class="field" name="project">'+projopts(chosen,all)+'</select></label>'}
function registerForm(form,handler){const f=$(form);if(f)f.onsubmit=e=>{e.preventDefault();handler(new FormData(f),f)}}
function route(){const x=decodeURIComponent(location.hash.slice(1));const m=x.match(/^\/control(?:\/([^/?#]+))?(?:\/([^/?#]+))?/);return{page:m?.[1]||'manager',param:m?.[2]||''}}
function go(page,param=''){location.hash='#/control/'+encodeURIComponent(page)+(param?'/'+encodeURIComponent(param):'');if(!location.hash)render()}
function filterProject(arr,k){return k?arr.filter(x=>x.project===k):arr}
function subject(){return $('#c-project')?.value||''}
function scopedMessage(msg,scope){const is=msg.project===scope;return scope?is:true}
function linksPage(){
 let rows=[];for(const p of ctx.projects){const d=openProject(p.id),refs=[...(p.repo?[{label:'GitHub',url:'https://github.com/'+OWNER+'/'+encodeURIComponent(p.repo)}]:[]),...(p.website?.url?[{label:p.website.label||'Site',url:p.website.url}]:[]),...(d.links||[]),...(p.other_sites||[]).filter(x=>x.url).map(x=>({label:x.label||'Site secondaire',url:x.url})),...(d.projectUrl?[{label:'ChatGPT',url:d.projectUrl}]:[]),...Object.entries(d.spaces||{}).map(([provider,url])=>({label:provider,url}))];
  for(const r of refs)if(safe(r.url))rows.push({project:p.id,label:r.label,url:r.url})}
 return rows;
}
function contextEvidence(project){
 const p=ctx.projects.find(p=>p.id===project),d=openProject(project);if(!p)return [];
 let out=[];
 if(p.status)out.push('Référence publique '+(p.last_verified||'16/10/2026')+' : statut '+p.status+'.');
 for(const [name,r] of Object.entries(d.reports||{}))if(r?.text)out.push('Bilan '+name+' saisi '+dt(r.updatedAt)+' : '+cap(r.text,400));
 const missions=db.missions.filter(x=>x.project===project&&x.status!=='done');
 if(missions.length)out.push('Missions locales : '+missions.map(x=>x.provider+' — '+x.title+' ('+x.status+')').join(' ; '));
 const todos=db.actions.filter(x=>x.project===project&&x.status!=='done');
 if(todos.length)out.push('À traiter : '+todos.slice(0,6).map(x=>x.title+' ('+x.status+')').join(' ; '));
 const recent=db.decisions.filter(x=>x.project===project).slice(-3);
 for(const d of recent)out.push('Décision enregistrée '+date(d.at)+' : '+d.title+' — '+cap(d.details,180));
 if(sprints[project]){const a=sprints[project];out.push('Dernier sprint PUBLIC vérifié '+dt(a.ended_at||a.started_at)+' : '+cap(a.summary,500)+' ; terminé : '+(a.done||[]).slice(0,3).join(' ; ')+' ; blocages : '+(a.blockers||[]).slice(0,3).join(' ; ')+' ; suite : '+cap(a.next,200))}
 if(p.repo&&live[p.repo]){const gh=live[p.repo];out.push('GitHub public vérifié '+dt(gh.checkedAt)+' : '+gh.commits.length+' commits récents, '+gh.prs.length+' PR ouvertes dans la réponse (fenêtre partielle). '+gh.commits.slice(0,2).map(c=>cap(c.commit?.message?.split('\n')[0],100)).join(' ; '))}
 return out;
}
function reply(question,project){const q=question.toLowerCase(),guess=project?[]:ctx.projects.filter(p=>[p.name,p.short,p.id].filter(Boolean).some(v=>q.includes(String(v).toLowerCase()))).map(p=>p.id),names=project?[project]:guess.length===1?guess:ctx.projects.map(p=>p.id).filter(k=>contextEvidence(k).length).slice(0,12);
 if(!names.length)return 'Aucun projet chargé.';
 let blocks=[];
 for(const pid of names){
  const d=openProject(pid),reports=Object.entries(d.reports||{}),actions=db.actions.filter(x=>x.project===pid&&x.status!=='done'),missions=db.missions.filter(x=>x.project===pid&&x.status!=='done');
  let segment=[pname(pid)];const sprint=sprints[pid];if(sprint){if(q.includes('blocage')||q.includes('problème'))segment.push('Blocages du dernier sprint public ('+dt(sprint.ended_at)+') : '+(sprint.blockers||[]).slice(0,4).join(' ; '));else if(q.includes('priorit')||q.includes('prochain')||q.includes('faire'))segment.push('Suite du dernier sprint public : '+(sprint.next||'Non renseignée'));else segment.push('Dernier sprint public '+dt(sprint.ended_at||sprint.started_at)+' : '+cap(sprint.summary,340));}
  if(q.includes('blocage')||q.includes('problème')){const p=ctx.projects.find(x=>x.id===pid);const alerts=p?.alerts||[];segment.push(...alerts.slice(0,3).map(x=>'Référence datée (non reconfirmée) : '+x.title));segment.push(...actions.filter(x=>x.priority==='Critique').map(x=>'Critique : '+x.title));if(!alerts.length&&!actions.length)segment.push('Aucun blocage enregistré — absence de rapport ≠ absence de problème.')}
  else if(q.includes('priorit')||q.includes('prochain')||q.includes('faire')){segment.push(...actions.slice(0,5).map(x=>x.priority+' : '+x.title));if(!actions.length)segment.push('Aucune action locale enregistrée.');}
  else if(q.includes('claude')||q.includes('codex')||q.includes('gemini')||q.includes('chatgpt')){const provider=['claude','codex','gemini','chatgpt'].find(x=>q.includes(x));const r=reports.find(x=>x[0].toLowerCase()===provider);
    const completed=db.missions.filter(x=>x.project===pid&&x.provider.toLowerCase()===provider&&x.result).sort((a,b)=>String(b.updated||b.at).localeCompare(String(a.updated||a.at)));
    if(r)segment.push('Bilan '+r[0]+' daté '+dt(r[1].updatedAt)+' : '+cap(r[1].text,900));
    if(completed.length)segment.push('Dernière mission '+completed[0].provider+' · résultat enregistré '+dt(completed[0].updated||completed[0].at)+' ('+(completed[0].resultOrigin==='api'?'API CONTROL':'saisie manuelle')+', '+(completed[0].status||'non renseigné')+') : '+cap(completed[0].result,900));
    if(!r&&!completed.length)segment.push('Aucun bilan ni résultat de mission '+provider+' enregistré.');}
  else {segment.push('Missions ouvertes : '+missions.length+' ; actions à traiter : '+actions.length+'.');segment.push(...reports.slice(0,3).map(([ai,r])=>'Bilan '+ai+' ('+dt(r.updatedAt)+') : '+cap(r.text,280)));const completed=db.missions.filter(x=>x.project===pid&&x.result).sort((a,b)=>String(b.updated||b.at).localeCompare(String(a.updated||a.at))).slice(0,3);
    segment.push(...completed.map(x=>'Résultat '+x.provider+' ('+dt(x.updated||x.at)+', '+(x.resultOrigin==='api'?'API CONTROL':'saisie manuelle')+') : '+cap(x.result,260)));
    if(!reports.length&&!completed.length)segment.push('Aucun bilan IA connecté : les chats privés ne sont pas lisibles depuis CONTROL.');if(live[ctx.projects.find(x=>x.id===pid)?.repo])segment.push('Activité GitHub publique vérifiée (voir Activité).')}
  blocks.push(segment.join('\n'));
 }
 return blocks.join('\n\n————\n\n')+'\n\nSources : rapports renseignés, données locales et références publiques datées. Aucune lecture automatique de conversations privées ; vérifie les preuves avant toute décision.';
}
function manager(){
 const k=new URLSearchParams(location.hash.split('?')[1]||'').get('project')||'',options=projopts(k,true);
 const content='<div class="dash-stats"><a href="#/control/inbox" class="stat"><strong>'+db.actions.filter(x=>x.status!=='done').length+'</strong><span>Actions ouvertes</span></a><a href="#/control/missions" class="stat"><strong>'+db.missions.filter(x=>x.status!=='done').length+'</strong><span>Missions en cours</span></a><a href="#/control/calendar" class="stat"><strong>'+(db.events.filter(x=>x.date>=new Date().toISOString().slice(0,10)).length+db.meetings.filter(x=>Date.parse(x.startsAt)+Number(x.minutes||30)*60000>=Date.now()).length)+'</strong><span>Échéances enregistrées</span></a></div>'+
 note('Assistant de synthèse fondé sur les données disponibles dans CONTROL. Ce n’est pas un modèle IA connecté aux conversations privées : chaque réponse distingue les bilans importés et les données GitHub publiques vérifiées.')+
 '<section class="panel"><div class="sectionhead"><h2>Derniers sprints publics</h2>'+btn('Actualiser','refresh-sprints')+'</div><div id="sprint-overview"><p class="muted">Chargement des rapports enregistrés sur GitHub…</p></div></section>'+
 '<section class="panel"><div class="sectionhead"><h2>Chef de projet central</h2>'+tag('Sources vérifiables')+'</div><label>Périmètre<select id="c-project" class="field">'+options+'</select></label><div class="messages" id="c-messages">'+(db.messages.length?db.messages.slice(-12).map(m=>'<div class="pilot-message '+(m.role==='user'?'pilot-user':'pilot-answer')+'"><span class="muted">'+h(m.role==='user'?'Vous':'CONTROL · synthèse locale')+' · '+date(m.at)+'</span><p>'+h(m.text)+'</p></div>').join(''):'<p class="empty">Demande « Où en sont mes projets ? » ou « Quelles sont les prochaines priorités ? ».</p>')+'</div>'+
 '<form id="c-ask"><label>Question<input class="field" name="question" required maxlength="900" placeholder="Où en est UCP sur chaque IA ?"></label><div class="actions"><button class="primary">Interroger CONTROL</button>'+btn('Préparer un briefing ChatGPT','brief')+href('https://chatgpt.com/','Ouvrir ChatGPT')+'</div></form></section>'+
 box('Accès rapide', '<div class="quicktiles">'+[['localai','CONTROL IA locale'],['command','Commander Claude & Gemini'],['inbox','À traiter'],['missions','Missions multi-IA'],['activity','Activité GitHub'],['calendar','Calendrier'],['library','Bibliothèque'],['budget','Coûts et quotas'],['memory','Mémoire et décisions'],['goals','Planifier un objectif'],['backup','Sauvegardes'],['settings','Règles et sécurité']].map(([url,label])=>'<a href="#/control/'+url+'" class="quicktile">'+h(label)+' →</a>').join('')+'</div>');
 $('#main').innerHTML=view('CONTROL IA','Centre de pilotage et de synthèse de tous tes projets',content);
 registerForm('#c-ask',(f)=>{const q=String(f.get('question')||'').trim(),pid=subject();if(!q)return;if(!commitLocal(()=>{db.messages.push({id:id(),role:'user',text:q,project:pid,at:new Date().toISOString()},{id:id(),role:'assistant',text:reply(q,pid),project:pid,at:new Date().toISOString()});db.messages=db.messages.slice(-80)}))return;manager();$('#c-project').value=pid});
 paintSprints('#sprint-overview');fetchSprints().then(()=>paintSprints('#sprint-overview')).catch(()=>{});$('#main [data-act="refresh-sprints"]')?.addEventListener('click',()=>fetchSprints(true).then(()=>paintSprints('#sprint-overview')));
 $('#main [data-act="brief"]')?.addEventListener('click',async()=>{const k=subject(),ps=k?[k]:ctx.projects.filter(p=>p.repo||openProject(p.id).reports).slice(0,12).map(p=>p.id);let data='CONTEXTE DE PILOTAGE — '+(k?pname(k):'Tous les projets')+'\n\n'+db.globalRules+'\n\n'+ps.map(pid=>pname(pid)+'\n'+contextEvidence(pid).join('\n')).join('\n\n')+'\n\nAnalyse les faits, distingue les preuves et les incertitudes, identifie les conflits et propose les 3 prochaines priorités. Ne prétends pas pouvoir lire les autres IA.';await copy(data)});
}
async function copy(s){try{await navigator.clipboard.writeText(s);toast('Copié. Tu peux le coller dans ton IA.')}catch{toast('Copie refusée par le navigateur. Ouvre CONTROL en HTTPS.')}} 
function intake(){const now=new Date().toISOString().slice(0,10),actions=db.actions.filter(x=>x.status!=='done'),reviews=db.missions.filter(x=>x.status==='review'),overdue=actions.filter(x=>x.due&&x.due<now).length;
 const cards=[...actions.map(x=>({kind:'action',id:x.id,project:x.project,title:x.title,sub:(x.due?'Pour le '+date(x.due)+' · ':'')+'Priorité '+x.priority,level:x.priority==='Critique'?'critical':x.due&&x.due<now?'critical':'normal'})),...reviews.map(x=>({kind:'mission',id:x.id,project:x.project,title:'Mission à vérifier : '+x.title,sub:'Retour attendu de '+x.provider,level:'review'}))].sort((a,b)=>({critical:0,review:1,normal:2}[a.level]-{critical:0,review:1,normal:2}[b.level]));
 let content='<div class="dash-stats">'+[['À traiter',cards.length],['En retard',overdue],['Missions à vérifier',reviews.length]].map(([n,v])=>'<div class="stat"><strong>'+v+'</strong><span>'+n+'</span></div>').join('')+'</div>'+note('Les alertes ci-dessous proviennent de tâches renseignées dans CONTROL. Les messages privés Gmail, les notifications des IA et les tâches non connectées ne sont pas synchronisés.')+
 box('Boîte de réception',cards.length?cards.map(a=>'<div class="inbox-item"><div><span class="chip '+(a.level==='critical'?'warn':'')+'">'+h(pname(a.project))+'</span><strong>'+h(a.title)+'</strong><small>'+h(a.sub)+'</small></div><div class="actions">'+(a.kind==='action'?btn('Terminer','done:'+a.id):'<a class="button" href="#/control/missions">Vérifier</a>')+'</div></div>').join(''):'<p class="empty">Aucune action enregistrée en attente. Cela ne signifie pas que les applications externes n’ont aucune notification.</p>')+
 box('Ajouter une action','<form id="new-action">'+field('Action','title','','text','required maxlength="180"')+selectProject('')+'<div class="formgrid"><label>Priorité<select name="priority" class="field">'+options(['Normale','Haute','Critique'],'Normale')+'</select></label>'+field('Échéance','due','','date')+'</div>'+field('Lien de référence (facultatif)','url','','url')+'<button class="primary">Ajouter</button></form>')+
 box('Accès aux sources externes','<p class="muted">Les messages Gmail, notifications ChatGPT et calendriers privés ne sont pas récupérés directement dans CONTROL. Ouvre les applications pour vérifier leurs alertes.</p><div class="actions">'+href('https://mail.google.com/mail/u/0/#inbox','Gmail')+href('https://calendar.google.com/calendar/u/0/r/','Google Agenda')+href('https://chatgpt.com/scheduled','ChatGPT · Planifiées')+'</div>')+
 box('Blocages remontés par les derniers sprints','<div id="inbox-sprint-status"><p class="muted">Chargement des rapports publics…</p></div>')+
 box('Alertes des références publiques','<p class="muted">Ces informations proviennent de relevés précédents, pas d’une surveillance en temps réel.</p>'+ctx.projects.filter(p=>p.alerts?.length).slice(0,6).map(p=>'<details><summary>'+h(p.name)+' · '+p.alerts.length+' point(s) de vigilance</summary><p>'+p.alerts.map(a=>h(a.title)).join('<br>')+'</p><a href="#/project/'+encodeURIComponent(p.id)+'/pilot" class="button">Ouvrir le projet</a></details>').join(''));
 $('#main').innerHTML=view('À traiter','Actions, validations et échéances centralisées',content);
 registerForm('#new-action',(f)=>{const title=String(f.get('title')||'').trim();if(!title)return;const url=String(f.get('url')||'').trim();if(url&&!safe(url))return toast('Lien HTTPS requis.');if(!commitLocal(()=>db.actions.push({id:id(),project:String(f.get('project')||''),title,priority:String(f.get('priority')||'Normale'),status:'todo',due:String(f.get('due')||''),url,at:new Date().toISOString()})))return;intake();toast('Action enregistrée localement.')});
 paintSprints('#inbox-sprint-status',true);fetchSprints().then(()=>paintSprints('#inbox-sprint-status',true)).catch(()=>{});
 $('#main').querySelectorAll('[data-act^="done:"]').forEach(b=>b.onclick=()=>{const a=db.actions.find(x=>x.id===b.dataset.act.slice(5));if(a){if(commitLocal(()=>{a.status='done';a.closedAt=new Date().toISOString()}))intake()}});
}
function missions(){const cards=db.missions.slice().reverse(),counts=['todo','doing','review','done'].map(s=>db.missions.filter(x=>x.status===s).length);
 let content='<div class="dash-stats">'+['À lancer','En cours','À vérifier','Terminé'].map((s,i)=>'<div class="stat"><strong>'+counts[i]+'</strong><span>'+s+'</span></div>').join('')+'</div>'+
 note('CONTROL prépare les consignes et permet de suivre leur exécution. Les fournisseurs externes ne reçoivent aucune mission automatiquement depuis ce site public. Les résultats doivent être rapportés et vérifiés.')+
 '<p><a class="button primary" href="#/control/command">Commander Claude + Gemini · Voir tous les résultats →</a></p>'+
 '<details class="panel shell-progressive-form" id="mission-create"><summary><strong>+ Préparer une mission multi-IA</strong><small>Définissez les consignes uniquement lorsque vous en avez besoin</small></summary><div class="shell-progressive-body"><form id="new-mission">'+field('Intitulé','title','','text','required maxlength="180"')+selectProject('')+'<div class="formgrid"><label>IA responsable<select class="field" name="provider">'+options(availableAgents(),'ChatGPT')+'</select></label>'+field('Fichiers ou périmètre technique (facultatif)','files','','text','placeholder="Ex. application/frontend"')+'</div>'+textarea('Instruction à transmettre','instruction','','required maxlength="8000" rows="4"')+'<button class="primary">Préparer la mission</button> '+btn('Préparer un plan avec plusieurs IA','orchestrate')+'</form></div></details>'+
 box('Suivi des missions',cards.length?cards.map(m=>{const collision=db.missions.filter(x=>x.id!==m.id&&x.project===m.project&&x.status==='doing'&&m.status==='doing'&&x.files&&m.files&&(x.files===m.files||x.files.includes(m.files)||m.files.includes(x.files))).length;return '<div class="mission-row"><div class="row"><strong>'+h(m.title)+'</strong>'+tag(m.provider+' · '+m.status)+'</div><p class="muted">'+h(pname(m.project))+' · '+date(m.at)+(collision?' · ⚠️ Risque de modification concurrente':'')+'</p><p>'+h(cap(m.instruction,180))+'</p><div class="actions">'+btn('Copier','copy:'+m.id)+href(providerURL(m.project,m.provider),'Ouvrir '+m.provider)+btn('Mettre à jour','edit:'+m.id)+'</div>'+(m.result?'<details><summary>Résultat rapporté</summary><p class="auto-text">'+h(m.result)+'</p></details>':'')+'</div>'}).join(''):'<p class="empty">Aucune mission enregistrée.</p>')+
 '<section class="panel hidden" id="mission-editor"><h2>Mettre à jour une mission</h2><form id="edit-mission"><input name="id" type="hidden"><label>État<select class="field" name="status">'+[['todo','À lancer'],['doing','En cours'],['review','À vérifier'],['done','Terminée']].map(([s,n])=>'<option value="'+s+'">'+n+'</option>').join('')+'</select></label>'+textarea('Compte rendu ou résultat','result','','rows="4"')+'<button class="primary">Enregistrer le suivi</button></form></section>';
 $('#main').innerHTML=view('Missions IA','Préparer, répartir et suivre les travaux de plusieurs IA',content);
 registerForm('#new-mission',f=>{const title=String(f.get('title')||'').trim(),instruction=String(f.get('instruction')||'').trim(),project=String(f.get('project')||''),provider=String(f.get('provider')||'ChatGPT');if(!title||!instruction)return;if(!commitLocal(()=>db.missions.push({id:id(),title,provider,project,files:String(f.get('files')||''),instruction,status:'todo',result:'',at:new Date().toISOString()})))return;missions();toast('Mission créée : à transmettre manuellement.')});
 $('#main').querySelector('[data-act="orchestrate"]')?.addEventListener('click',()=>{const f=new FormData($('#new-mission')),project=String(f.get('project')||''),instruction=String(f.get('instruction')||'').trim(),title=String(f.get('title')||'Mission');if(!instruction)return toast('Décris d’abord la mission.');const plans=[['ChatGPT','Définir le besoin et les critères de recette'],['Claude','Examiner les risques et proposer les améliorations UX/architecture'],['Codex','Implémenter sur branche dédiée après vérification des conflits, tester et préparer une PR'],['ChatGPT','Vérifier les preuves et synthétiser la livraison']];if(!commitLocal(()=>{for(const [provider,step] of plans)db.missions.push({id:id(),project,title:title+' — '+step,provider,files:provider==='Codex'?String(f.get('files')||''):'',instruction:step+'\n\nDemande initiale : '+instruction+'\n\nRègles globales : '+db.globalRules,status:'todo',result:'',at:new Date().toISOString()})}))return;missions();toast('4 missions préparées, aucune IA déclenchée.')});
 $('#main').querySelectorAll('[data-act^="copy:"]').forEach(b=>b.onclick=()=>{const m=db.missions.find(x=>x.id===b.dataset.act.slice(5));if(m)copy('MISSION '+m.provider+' — '+pname(m.project)+'\n'+m.title+'\n\n'+m.instruction+'\n\nPérimètre : '+(m.files||'À définir')+'\n\nCONTRAINTES\n'+db.globalRules+'\n\nAprès le travail, fournis des preuves (lien, tests, fichiers changés). Ne déclare pas une tâche terminée sans vérification.')});
 $('#main').querySelectorAll('[data-act^="edit:"]').forEach(b=>b.onclick=()=>{const m=db.missions.find(x=>x.id===b.dataset.act.slice(5));if(!m)return;$('#mission-editor').classList.remove('hidden');const f=$('#edit-mission');f.elements.id.value=m.id;f.elements.status.value=m.status;f.elements.result.value=m.result||'';$('#mission-editor').scrollIntoView({block:'nearest'})});
 registerForm('#edit-mission',f=>{const m=db.missions.find(x=>x.id===String(f.get('id')));if(!m)return;const status=String(f.get('status')),result=String(f.get('result')||'').trim();if(!['todo','doing','review','done'].includes(status))return toast('Statut de mission invalide.');if(status==='done'&&!result)return toast('Ajoute un compte rendu avant de marquer la mission terminée.');if(commitLocal(()=>{m.status=status;m.result=result;m.updated=new Date().toISOString()}))missions()});
}
function calendar(){const now=new Date().toISOString().slice(0,10),future=db.events.slice().sort((a,b)=>a.date.localeCompare(b.date));
 const content='<div class="two">'+box('Agenda des projets',future.length?future.map(e=>'<div class="inbox-item"><div><strong>'+h(e.title)+'</strong><small>'+h(pname(e.project))+' · '+h(e.date)+(e.details?' · '+h(cap(e.details,90)):'')+'</small></div>'+btn('Supprimer','delete-event:'+e.id)+'</div>').join(''):'<p class="empty">Aucun événement enregistré.</p>')+
 box('Ajouter un événement','<form id="new-event">'+field('Intitulé','title','','text','required maxlength="160"')+selectProject('')+field('Date et heure','date',now+'T09:00','datetime-local','required')+textarea('Détails','details','','rows="3"')+'<button class="primary">Ajouter à CONTROL</button></form>')+'</div>'+
 box('Visios et rendez-vous','<p class="muted">Réunions internes et rendez-vous clients : lien, invitation à partager, calendrier et compte rendu. Les visioconférences utilisent le fournisseur choisi.</p>'+db.meetings.filter(m=>m.startsAt&&Date.parse(m.startsAt)+Number(m.minutes||30)*60000>=Date.now()).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt)).slice(0,5).map(m=>'<div class="inbox-item"><div><strong>'+h(m.title)+'</strong><small>'+h(dt(m.startsAt))+' · '+h(m.provider)+'</small></div>'+(safe(m.url)?href(m.url,'Rejoindre'):'')+'</div>').join('')+'<a class="button primary" href="#/control/meetings">Ouvrir les visios →</a>')+
 box('Calendriers externes','<p class="muted">Google Agenda et les calendriers des IA restent gérés dans leurs services respectifs. CONTROL n’affiche pas leurs rendez-vous privés sans authentification dédiée.</p><div class="actions">'+href('https://calendar.google.com/calendar/u/0/r/','Google Agenda')+href('https://chatgpt.com/scheduled','Tâches ChatGPT')+href('https://claude.ai/','Claude')+'</div>')+
 box('Automatisations connues','<div id="c-auto-preview"><p class="muted">Accéder à la programmation des tâches depuis le catalogue daté.</p><a class="button" href="#/automations">Ouvrir les automatisations →</a></div>');
 $('#main').innerHTML=view('Calendrier','Échéances, événements et automatisations',content);
 fetch('./data/automations.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{const box=$('#c-auto-preview');if(!box||!d?.tasks)return;box.innerHTML='<p class="muted">Relevé du '+h(dt(d.verified_at))+' — horaires déclaratifs, non synchronisés en direct.</p>'+d.tasks.filter(t=>t.active_at_last_check).map(t=>'<div class="chatrow"><div><strong>'+h(t.title)+'</strong><small>'+h(t.schedule)+'</small></div></div>').join('')+'<a class="button" href="#/automations">Voir les fiches →</a>'}).catch(()=>{});
 registerForm('#new-event',f=>{if(commitLocal(()=>db.events.push({id:id(),project:String(f.get('project')||''),title:String(f.get('title')||''),date:String(f.get('date')||''),details:String(f.get('details')||'')})))calendar()});
 $('#main').querySelectorAll('[data-act^="delete-event:"]').forEach(b=>b.onclick=()=>{if(commitLocal(()=>{db.events=db.events.filter(x=>x.id!==b.dataset.act.slice(13))}))calendar()});
}

async function githubRead(repo){const url='https://api.github.com/repos/'+OWNER+'/'+encodeURIComponent(repo),ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);try{const res=await Promise.allSettled(['commits?per_page=8','pulls?state=open&per_page=8','actions/runs?per_page=5'].map(x=>fetch(url+'/'+x,{headers:{Accept:'application/vnd.github+json'},signal:ctrl.signal}).then(r=>r.ok?r.json():null)));const a=res.map(x=>x.status==='fulfilled'?x.value:null);if(!Array.isArray(a[0])&&!Array.isArray(a[1])&&!Array.isArray(a[2]?.workflow_runs))throw Error('Unavailable');const data={commits:Array.isArray(a[0])?a[0]:[],prs:Array.isArray(a[1])?a[1]:[],runs:Array.isArray(a[2]?.workflow_runs)?a[2].workflow_runs:[],partial:!Array.isArray(a[0])||!Array.isArray(a[1])||!Array.isArray(a[2]?.workflow_runs),checkedAt:new Date().toISOString()};live[repo]=data;return data}finally{clearTimeout(timer)}}
function activity(){const repos=ctx.projects.filter(p=>p.repo);
 $('#main').innerHTML=view('Activité et développement','GitHub, tests et publications',box('Vérifier le dépôt public','<label>Projet<select class="field" id="git-project">'+repos.map(p=>'<option value="'+h(p.id)+'">'+h(p.name)+'</option>').join('')+'</select></label><div class="actions">'+btn('Vérifier GitHub','github-fetch','primary')+'<span id="git-stamp" class="muted"></span></div><div id="github-result"><p class="muted">Lecture publique à la demande : commits, PR et workflows récents.</p></div>')+
 box('Actions techniques','<div id="git-links" class="links"></div>')+note('CONTROL ne fusionne pas de branches, ne déploie pas et ne restaure pas directement le code. Ces actions nécessitent confirmation sur GitHub.'));
 const wanted=new URLSearchParams(location.hash.split('?')[1]||'').get('project')||'';if(repos.some(p=>p.id===wanted))$('#git-project').value=wanted;
 const links=()=>{const p=ctx.projects.find(x=>x.id===$('#git-project').value);$('#git-links').innerHTML=p?.repo?[['Dépôt',''],['Pull requests','/pulls'],['Branches','/branches'],['Tests CI','/actions'],['Déploiements','/deployments'],['Versions','/releases']].map(([label,end])=>href('https://github.com/'+OWNER+'/'+p.repo+end,label,'link')).join('')+(p.website?.url?href(p.website.url,'Site web','link'):''):tiny('Aucun dépôt relié.')};links();
 $('#git-project').onchange=()=>{$('#github-result').innerHTML=tiny('Vérification non lancée.');links()};
 $('#main [data-act="github-fetch"]').onclick=async()=>{const p=ctx.projects.find(x=>x.id===$('#git-project').value);if(!p?.repo)return;$('#github-result').textContent='Lecture GitHub en cours…';try{const d=await githubRead(p.repo);$('#git-stamp').textContent='Vérifié '+dt(d.checkedAt)+(d.partial?' · partiel':'');const rows=(array,title,toLabel,toDate)=>'<h3>'+h(title)+'</h3>'+(array.length?array.map(x=>'<div class="chatrow"><div><strong>'+h(cap(toLabel(x),140))+'</strong><small>'+h(toDate(x))+'</small></div>'+href(x.html_url,'Voir')+'</div>').join(''):tiny('Aucun élément retourné ou accès partiel.'));
 $('#github-result').innerHTML=rows(d.commits,'Commits',x=>x.commit?.message?.split('\n')[0]||'Commit',x=>dt(x.commit?.committer?.date))+rows(d.prs,'PR ouvertes',x=>x.title||'PR',x=>dt(x.updated_at))+rows(d.runs,'Workflows',x=>x.name||'Workflow',x=>(x.conclusion||x.status||'Inconnu')+' · '+dt(x.created_at))+tiny('Les commits publics ne prouvent pas quelle IA a travaillé ni que les tests fonctionnels ont réussi.');
 }catch{$('#github-result').innerHTML=note('GitHub inaccessible ou limité, activité actuelle non confirmée.')}};
}
function library(){const refs=[...linksPage(),...(db.resources||[])].filter(x=>safe(x.url));
 $('#main').innerHTML=view('Bibliothèque','Documents, Drive, GitHub et liens de projet',note('La recherche ne lit pas le contenu privé des fichiers Drive : elle explore uniquement les liens enregistrés.')+
 box('Rechercher','<div class="formgrid"><label>Mot clé<input class="field" id="lib-search" type="search" placeholder="Drive, document, site…"></label><label>Projet<select class="field" id="lib-project">'+projopts()+'</select></label></div><div id="lib-list"></div>')+
 box('Ajouter une ressource','<form id="new-resource">'+field('Nom','label','','text','required maxlength="140"')+selectProject('')+field('URL','url','','url','required')+'<div class="actions"><button class="primary">Ajouter</button>'+btn('Coller depuis le presse-papiers','paste-link')+'</div></form>')+
 box('Laboratoire IA intégré','<p class="muted">Briefs de missions avec contexte, comparaison de réponses, audit HTML, validation JSON, comparaison de versions, plans de recette et masquage de secrets. Les IA ne sont pas exécutées automatiquement.</p><a class="button primary" href="#/control/lab">Ouvrir le Laboratoire IA →</a>')+
 box('Explorer les bibliothèques IA','<p class="muted">87 outils à découvrir : 3D, agents, automatisations et productivité, en complément des formations IAgile.</p><a class="button primary" href="#/control/catalog">Découvrir les outils IA →</a>')+
 box('Mettre un site en ligne','<p class="muted">Tutoriels pas à pas pour GitHub Pages, IONOS, Vercel, Netlify, Cloudflare, Render, Railway et Firebase. Aide IA pour préparer les déploiements.</p><a class="button primary" href="#/control/deploy">Voir les guides de publication →</a>')+
 box('Liens généraux','<div class="actions">'+href('https://drive.google.com/drive/u/0/my-drive','Google Drive')+href('https://github.com/'+OWNER,'GitHub')+'</div>'));
 const draw=()=>{const q=$('#lib-search').value.toLowerCase(),p=$('#lib-project').value;const data=refs.filter(x=>(!p||x.project===p)&&(x.label+' '+x.url+' '+pname(x.project)).toLowerCase().includes(q)).slice(0,80);$('#lib-list').innerHTML=data.length?data.map(x=>'<div class="chatrow"><div><strong>'+h(x.label)+'</strong><small>'+h(pname(x.project))+'</small></div>'+href(x.url,'Ouvrir')+'</div>').join(''):tiny('Aucun résultat.')};draw();$('#lib-search').oninput=draw;$('#lib-project').onchange=draw;
 $('#main [data-act="paste-link"]')?.addEventListener('click',async()=>{try{const v=await navigator.clipboard.readText();const url=safe(v.trim());if(!url)return toast('Le presse-papiers ne contient pas de lien HTTPS accepté.');$('#new-resource').elements.url.value=url;toast('Lien collé. Choisis le projet et enregistre.')}catch{toast('Accès au presse-papiers refusé par le navigateur.')}});
 registerForm('#new-resource',f=>{const url=safe(f.get('url'));if(!url)return toast('Adresse HTTPS invalide.');if(!commitLocal(()=>{db.resources??=[];db.resources.push({id:id(),project:String(f.get('project')||''),label:String(f.get('label')||'').trim(),url})}))return;library();toast('Lien enregistré.')});
}
// Local scoped memory: manual records are not external truth, and changes
// must be confirmed by the same persistent store as their visible state.
function decisionVersion(row){return Number.isSafeInteger(row?.version)&&row.version>0?row.version:1}
function writeDecision(form){
 const project=String(form.get('project')||'');
 if(!ctx.projects.some(p=>p.id===project))throw Error('Projet introuvable : correction non enregistrée.');
 const title=String(form.get('title')||'').trim(),details=String(form.get('details')||'').trim();
 const source=String(form.get('source')||'Saisie manuelle').trim()||'Saisie manuelle';
 if(!title||title.length>150||!details||details.length>10000||source.length>240)throw Error('Titre, justification ou source invalide.');
 const record=String(form.get('record')||'');
 const previous=record?db.decisions.find(x=>x.id===record):null;
 if(record&&(!previous||previous.project!==project||decisionVersion(previous)!==Number(form.get('expectedVersion'))))throw Error('Décision changée ou supprimée : recharge et recommence.');
 const conflict=db.decisions.find(x=>x.project===project&&x.id!==record&&String(x.title||'').trim().toLocaleLowerCase('fr-FR')===title.toLocaleLowerCase('fr-FR'));
 if(conflict)throw Error(conflict.details===details?'Décision déjà présente pour ce projet.':'Décision potentiellement contradictoire : corrige la décision existante au lieu de créer une deuxième version.');
 const now=new Date().toISOString();
 const revised=previous?{...previous,title,details,source,version:decisionVersion(previous)+1,updatedAt:now}:
  {id:id(),project,title,details,source,version:1,at:now,updatedAt:now};
 const before=db.decisions;
 db.decisions=previous?before.map(x=>x.id===record?revised:x):[...before,revised];
 if(save()!==true){db.decisions=before;throw Error('Stockage indisponible : aucune décision confirmée.')}
 return revised;
}
function removeDecision(record){
 const previous=db.decisions.find(x=>x.id===record);
 if(!previous||!ctx.projects.some(p=>p.id===previous.project))throw Error('Décision absente ou projet indisponible.');
 const before=db.decisions;
 db.decisions=before.filter(x=>x.id!==record);
 if(save()!==true){db.decisions=before;throw Error('Stockage indisponible : suppression annulée.')}
 return true;
}
function memory(){
 const wanted=route().param;
 const selected=wanted?db.decisions.find(d=>d.id===wanted&&ctx.projects.some(p=>p.id===d.project)):null;
 const list=db.decisions.filter(d=>ctx.projects.some(p=>p.id===d.project)).slice().reverse();
 $('#main').innerHTML=view('Mémoire','Décisions locales classées par projet, avec source déclarée et version',
 note('Données saisies manuellement. Le champ Source décrit la provenance déclarée, sans vérification automatique ni accès aux conversations privées.')+
 (wanted&&!selected?note('Décision introuvable ou supprimée : aucun contenu ancien n’est conservé dans les résultats.'):'')+
 box('Décisions enregistrées',list.length?list.map(d=>'<div class="chatrow" data-memory-id="'+h(d.id)+'"'+(wanted===d.id?' aria-current="true"':'')+'><div><strong>'+h(d.title)+'</strong><small>'+h(pname(d.project))+' · '+date(d.updatedAt||d.at)+' · v'+decisionVersion(d)+' · Source déclarée : '+h(d.source||'Saisie manuelle')+'</small><p>'+h(cap(d.details,300))+'</p></div><div class="actions">'+btn('Corriger','decision-edit:'+d.id)+btn('Supprimer','decision-del:'+d.id)+'</div></div>').join(''):tiny('Aucune décision enregistrée.'))+
 box('Ajouter ou corriger une décision','<form id="new-decision"><input type="hidden" name="record" value=""><input type="hidden" name="expectedVersion" value="">'+
 field('Titre','title','','text','required maxlength="150"')+selectProject(ctx.projects[0]?.id||'',false)+
 textarea('Détails et justification','details','','required maxlength="10000" rows="4"')+
 field('Source déclarée','source','','text','maxlength="240" placeholder="Lien, compte rendu, décision personnelle…"')+
 '<div class="actions"><button class="primary" type="submit">Mémoriser</button>'+btn('Annuler la correction','decision-edit-cancel')+'</div></form>')+
 box('Partager le contexte','<label>Projet<select class="field" id="memory-project">'+projopts(ctx.projects[0]?.id||'',false)+'</select></label>'+btn('Copier une fiche de contexte','copy-context','primary')));
 registerForm('#new-decision',form=>{
  try{const row=writeDecision(form);memory();toast('Décision '+(row.version>1?'corrigée':'mémorisée')+' localement · v'+row.version)}
  catch(error){toast(String(error?.message||error).slice(0,240))}
 });
 if(selected){const target=[...$('#main').querySelectorAll('[data-memory-id]')].find(el=>el.dataset.memoryId===selected.id);target?.scrollIntoView({block:'nearest'});}
 $('#main').querySelectorAll('[data-act^="decision-edit:"]').forEach(button=>button.onclick=()=>{
  const row=db.decisions.find(x=>x.id===button.dataset.act.slice('decision-edit:'.length));
  if(!row||!ctx.projects.some(p=>p.id===row.project)){toast('Décision ou projet introuvable.');return}
  const form=$('#new-decision'),e=form?.elements;if(!e)return;
  for(const [key,val] of Object.entries({record:row.id,expectedVersion:decisionVersion(row),project:row.project,title:row.title,details:row.details,source:row.source||'Saisie manuelle'}))e.namedItem(key).value=String(val);
  form.querySelector('button[type="submit"]').textContent='Enregistrer la correction';
  form.scrollIntoView({behavior:'smooth',block:'center'});
 });
 $('#main').querySelector('[data-act="decision-edit-cancel"]').onclick=()=>memory();
 $('#main').querySelectorAll('[data-act^="decision-del:"]').forEach(button=>button.onclick=()=>{
  if(!confirm('Supprimer cette décision enregistrée localement ?'))return;
  try{removeDecision(button.dataset.act.slice('decision-del:'.length));memory();toast('Décision supprimée localement.')}
  catch(error){toast(String(error?.message||error).slice(0,240))}
 });
 $('#main [data-act="copy-context"]').onclick=()=>{
  const p=$('#memory-project').value;
  if(!ctx.projects.some(project=>project.id===p)){toast('Projet indisponible.');return}
  const decisions=db.decisions.filter(x=>x.project===p);
  copy('PROJET : '+pname(p)+'\nCONSIGNES :\n'+db.globalRules+'\n\nFAITS / SOURCES DISPONIBLES :\n'+contextEvidence(p).join('\n')+
   '\n\nDÉCISIONS LOCALES (source déclarée) :\n'+decisions.map(x=>x.title+' · v'+decisionVersion(x)+' · source : '+(x.source||'Saisie manuelle')+' · '+(x.updatedAt||x.at)+' : '+x.details).join('\n')+
   '\n\nCes sources sont déclarées et peuvent être périmées : vérifier avant toute action.');
 };
}

function budget(){const month=new Date().toISOString().slice(0,7),rows=db.expenses.filter(x=>x.month===month),spent=rows.reduce((a,x)=>a+Number(x.amount||0),0),revenue=db.income.filter(x=>x.month===month).reduce((a,x)=>a+Number(x.amount||0),0),limit=db.monthLimit;
 $('#main').innerHTML=view('Budget et quotas','Suivi manuel des coûts et restrictions des services IA',note('Aucun accès aux factures ni aux tokens réels des comptes externes. Les plafonds ci-dessous sont indicatifs : CONTROL ne bloque pas la facturation chez les fournisseurs.')+
 '<div class="dash-stats"><div class="stat"><strong>'+spent.toFixed(2)+' €</strong><span>Dépenses saisies ('+month+')</span></div><div class="stat"><strong>'+revenue.toFixed(2)+' €</strong><span>Revenus déclarés</span></div><div class="stat"><strong>'+(revenue-spent).toFixed(2)+' €</strong><span>Solde déclaré, non vérifié</span></div></div><p class="muted">Budget indicatif : '+(limit===undefined?'non défini':Number(limit).toFixed(2)+' €')+'. Les montants ne sont ni extraits d’un compte bancaire ni vérifiés auprès des prestataires.</p>'+
 (limit!==undefined&&spent>+limit?note('Attention : dépenses saisies supérieures au plafond indicatif.'):'')+
 box('Dépenses enregistrées',rows.length?rows.map(x=>'<div class="chatrow"><div><strong>'+h(x.label)+'</strong><small>'+h(pname(x.project))+' · '+h(x.kind)+'</small></div><div class="actions"><strong>'+Number(x.amount).toFixed(2)+' €</strong>'+btn('×','expense-del:'+x.id)+'</div></div>').join(''):tiny('Aucune dépense renseignée. Cela ne prouve pas l’absence de frais.'))+
 box('Ajouter une dépense','<form id="new-expense">'+field('Service','label','','text','required maxlength="120"')+selectProject('')+'<div class="formgrid">'+field('Montant en euros','amount','','number','required min="0" step="0.01" max="1000000"')+field('Mois','month',month,'month','required')+'</div><label>Nature<select class="field" name="kind">'+options(['Abonnement','Crédits API','Hébergement','Autre'],'Abonnement')+'</select></label><button class="primary">Enregistrer</button></form>')+
 box('Revenus déclarés',db.income.filter(x=>x.month===month).map(x=>'<div class="chatrow"><div><strong>'+h(x.label)+'</strong><small>'+h(pname(x.project))+'</small></div><strong>'+Number(x.amount).toFixed(2)+' €</strong></div>').join('')+'<form id="new-income">'+field('Produit / prestation','label','','text','required maxlength="120"')+selectProject('')+'<div class="formgrid">'+field('Montant déclaré (€)','amount','','number','required min="0" step="0.01"')+field('Mois','month',month,'month','required')+'</div><button class="primary">Enregistrer ce revenu</button></form>')+
 box('Règles de consommation','<form id="monthly-limit">'+field('Plafond indicatif (€)','limit',limit===undefined?'':limit,'number','min="0" step="0.01"')+'<button class="primary">Enregistrer le seuil</button></form>'+tiny('Le modèle exact et ses quotas ne sont pas toujours exposés par l’IA. Afficher « Non vérifié » lorsque les données sont inconnues.')+'<a class="button" href="#/automations">Voir les automatisations et restrictions →</a>'));
 registerForm('#new-expense',f=>{const amount=Number(f.get('amount'));if(!Number.isFinite(amount)||amount<0||amount>1000000)return toast('Montant invalide.');if(commitLocal(()=>db.expenses.push({id:id(),project:String(f.get('project')||''),label:String(f.get('label')||'').trim(),amount,kind:String(f.get('kind')||''),month:String(f.get('month')||month)})))budget()});
 registerForm('#new-income',f=>{const amount=Number(f.get('amount'));if(!Number.isFinite(amount)||amount<0||amount>1000000)return toast('Montant invalide.');if(commitLocal(()=>db.income.push({id:id(),project:String(f.get('project')||''),label:String(f.get('label')||''),amount,month:String(f.get('month')||month)})))budget()});
 registerForm('#monthly-limit',f=>{const v=String(f.get('limit')||'').trim();if(v&&(!Number.isFinite(+v)||+v<0))return toast('Plafond invalide.');if(commitLocal(()=>{if(!v)delete db.monthLimit;else db.monthLimit=+v}))budget()});
 $('#main').querySelectorAll('[data-act^="expense-del:"]').forEach(b=>b.onclick=()=>{if(commitLocal(()=>{db.expenses=db.expenses.filter(x=>x.id!==b.dataset.act.slice(12))}))budget()});
}
function catalog(){
 const el=$('#main'),query=location.hash.split('?')[1]||'',params=new URLSearchParams(query),pid=params.get('project')||'';
 if(!window.CONTROL_TOOL_CATALOG){el.innerHTML=note('Le catalogue d’outils IA est momentanément indisponible. Recharge CONTROL.');return}
 window.CONTROL_TOOL_CATALOG.mount(el,{mode:'personal',projectId:pid,projects:ctx.projects,
 onOpenDeploy:(project)=>{location.hash='#/control/deploy'+(project?'?project='+encodeURIComponent(project):'')},
 isSaved:(tool,project)=>Array.isArray(ctx.state?.[project]?.links)&&ctx.state[project].links.some(x=>x.catalogToolId===tool.id||x.url===tool.url),
 onAdd:async(tool,project)=>{if(!ctx.projects.some(x=>x.id===project))throw Error('Projet introuvable.');if(!ctx.state)throw Error('Stockage indisponible.');const d=ctx.state[project]??={chats:[],links:[],memo:'',agents:[]};d.links??=[];if(d.links.some(x=>x.catalogToolId===tool.id||x.url===tool.url))return false;
 d.links.push({label:'Outil IA · '+tool.name,url:tool.url,catalogToolId:tool.id,category:tool.category});
 try{localStorage.setItem('control-hub-v2',JSON.stringify(ctx.state))}catch(e){d.links.pop();throw Error('Impossible d’enregistrer sur cet appareil.')}return true;}
 });
}
function deploy(){
 const el=$('#main'),query=location.hash.split('?')[1]||'',params=new URLSearchParams(query),pid=params.get('project')||'';
 if(!window.CONTROL_DEPLOY_GUIDES){el.innerHTML=note('Les guides de mise en ligne sont indisponibles. Actualise CONTROL.');return}
 window.CONTROL_DEPLOY_GUIDES.mount(el,{mode:'personal',projectId:pid,projects:ctx.projects,
 onOpenStatus:(project)=>{location.hash='#/control/activity'+(project?'?project='+encodeURIComponent(project):'')},
 isSaved:(guide,project)=>Array.isArray(ctx.state?.[project]?.links)&&ctx.state[project].links.some(x=>x.catalogToolId===guide.id||x.url===guide.url),
 onAdd:async(guide,project)=>{if(!ctx.projects.some(x=>x.id===project))throw Error('Projet inconnu.');
 const d=ctx.state[project]??={chats:[],links:[],memo:'',agents:[]};d.links??=[];
 if(d.links.some(x=>x.catalogToolId===guide.id||x.url===guide.url))return false;
 d.links.push({label:guide.name,url:guide.url,catalogToolId:guide.id,category:'hebergement'});
 try{localStorage.setItem('control-hub-v2',JSON.stringify(ctx.state))}catch(e){d.links.pop();throw Error('Stockage local indisponible.')}
 return true;}
 });
}
function operatorSnapshot(){
 // Explicitly bounded, read-only local records. No tokens, e-mails or mission instructions.
 return {projects:ctx.projects.map(p=>({id:p.id,name:p.name,short:p.short||'',status:p.status||'',summary:p.summary||'',description:p.description||''})),
  actions:db.actions.slice(-500).map(a=>({id:a.id,project:a.project,title:a.title,status:a.status,priority:a.priority,due:a.due})),
  missions:db.missions.slice(-500).map(m=>({id:m.id,project:m.project,title:m.title,provider:m.provider,status:m.status})),
  events:db.events.slice(-500).map(e=>({id:e.id,project:e.project,title:e.title,date:e.date})),
  meetings:db.meetings.slice(-500).map(m=>({id:m.id,projectId:m.projectId||m.project,title:m.title,startsAt:m.startsAt}))};
}
// The latest local receipt points to the exact saved/replayed operation, not
// simply to whichever unrelated audit event was most recently recorded.
let operatorLastReceiptId=null;
function operatorExecute(action){
 if(!action||typeof action!=='object')throw Error('Action invalide.');
 const type=String(action.type||''),projectId=String(action.projectId||'');
 if(!ctx.projects.some(p=>p.id===projectId))throw Error('Projet non autorisé ou introuvable.');
 const title=String(action.title||'').trim();
 if(!title||title.length>160)throw Error('Intitulé non valide.');
 const approvalId=action.approvalId===undefined?'':String(action.approvalId);
 if(approvalId&&!/^local-[a-z0-9_-]{12,96}$/i.test(approvalId))throw Error('Identifiant de confirmation local invalide.');
 const signature=JSON.stringify({type,projectId,title,id:action.id||'',date:action.date||'',expectedDate:action.expectedDate||'',expectedStatus:action.expectedStatus||''});
 const prior=approvalId&&Array.isArray(db.operatorAudit)?db.operatorAudit.find(a=>a.approval_id===approvalId):null;
 if(prior){
  if(prior.scope!=='local'||prior.outcome!=='saved'||prior.signature!==signature||prior.project!==projectId)throw Error('Identifiant déjà utilisé pour une autre opération. Action refusée.');
  operatorLastReceiptId=prior.id;
  return true; // confirmed exactly once; no second write or receipt is fabricated
 }
 const oldActions=db.actions.slice(),oldEvents=db.events.slice(),oldAudit=Array.isArray(db.operatorAudit)?db.operatorAudit.slice():[];
 let edited=null,previousStatus=null,previousClosed=null,editedEvent=null,previousDate=null;
 if(type==='create_action'){
  db.actions.push({id:id(),project:projectId,title,priority:'Normale',status:'todo',due:'',url:'',at:new Date().toISOString()});
 }else if(type==='create_event'){
  if(!window.CONTROL_OPERATOR_CORE?.validateLocalDateTime(action.date))throw Error('Date et heure invalides.');
  const when=new Date(action.date);
  if(!Number.isFinite(+when)||+when<Date.now())throw Error('Choisis une date future.');
  db.events.push({id:id(),project:projectId,title,date:String(action.date),details:'Créé depuis CONTROL IA (sur cet appareil)'});
 }else if(type==='update_event'||type==='delete_event'){
  editedEvent=db.events.find(x=>x.id===action.id&&x.project===projectId&&x.title===title);
  if(!editedEvent)throw Error('Événement introuvable ou modifié depuis la demande.');
  if(typeof action.expectedDate!=='string'||editedEvent.date!==action.expectedDate)throw Error('Date de rendez-vous modifiée : nouvelle confirmation nécessaire.');
  if(type==='update_event'){
   if(!window.CONTROL_OPERATOR_CORE?.validateLocalDateTime(action.date))throw Error('Nouvelle date invalide.');
   const when=new Date(action.date);
   if(!Number.isFinite(+when)||+when<Date.now())throw Error('Choisis une date future.');
   previousDate=editedEvent.date;editedEvent.date=String(action.date);
  }else db.events=db.events.filter(x=>x!==editedEvent);
 }else if(type==='complete_action'){
  edited=db.actions.find(x=>x.id===action.id&&x.project===projectId&&x.title===title&&x.status!=='done');
  if(!edited)throw Error('Tâche introuvable ou déjà terminée.');
  if(typeof action.expectedStatus!=='string'||edited.status!==action.expectedStatus)throw Error('Statut de tâche modifié : nouvelle confirmation nécessaire.');
  previousStatus=edited.status;previousClosed=edited.closedAt;edited.status='done';edited.closedAt=new Date().toISOString();
 }else throw Error('Action non autorisée par CONTROL.');
 db.operatorAudit=oldAudit.concat([{id:id(),type,project:projectId,title,at:new Date().toISOString(),scope:'local',outcome:'saved',...(approvalId?{approval_id:approvalId,signature}:{})}]).slice(-200);
 let saved=false;
 try{saved=save()===true}catch(error){saved=false}
 if(!saved){
  db.actions=oldActions;db.events=oldEvents;db.operatorAudit=oldAudit;
  if(edited){edited.status=previousStatus;edited.closedAt=previousClosed}
  if(editedEvent&&type==='update_event')editedEvent.date=previousDate;
  throw Error('Stockage indisponible : l’action a été annulée.');
 }
 operatorLastReceiptId=db.operatorAudit.at(-1)?.id||null;
 return true;
}
function operatorReceipt(){
 const record=Array.isArray(db.operatorAudit)?db.operatorAudit.find(x=>x.id===operatorLastReceiptId):null;
 if(!record||record.outcome!=='saved'||record.scope!=='local')return null;
 return {id:record.id,project:record.project,type:record.type,at:record.at};
}
function localai(){
 const root=$('#main');
 if(!window.CONTROL_LOCAL_AI){root.innerHTML=note('IA locale indisponible : actualise CONTROL.');return}
 const selected=new URLSearchParams(location.hash.split('?')[1]||'').get('project')||'';
 window.CONTROL_LOCAL_AI.mount(root,{projects:ctx.projects,projectId:selected,
  operator:{snapshot:operatorSnapshot,execute:operatorExecute,receipt:operatorReceipt},
  createAction:(projectId,title)=>{
   if(!projectId||projectId==='general'||!ctx.projects.some(p=>p.id===projectId))throw Error('Sélectionne un projet avant d’ajouter une tâche.');
   const action={id:id(),project:projectId,title:cap(title,180),priority:'Normale',status:'todo',due:'',url:'',at:new Date().toISOString()};
   db.actions.push(action);
   if(!save()){db.actions.pop();throw Error('Stockage local indisponible.')}
   return true;
  },
  getContext:projectId=>{
   const p=ctx.projects.find(p=>p.id===projectId);
   if(!p)return'Projet introuvable ou accès non accordé.';
   const tasks=db.actions.filter(x=>x.project===projectId).slice(-5).map(x=>'Tâche : '+cap(x.title,110)+' / statut '+cap(x.status,25));
   const missions=db.missions.filter(x=>x.project===projectId).slice(-4).map(x=>'Mission '+cap(x.provider,28)+' : '+cap(x.title,110)+' / statut '+cap(x.status,25));
   // Résumés en lecture seule : jamais de liens sensibles, secrets, données d'autres projets ou historique des IA.
   return ['Projet : '+cap(p.name,130),p.summary?'Résumé fourni : '+cap(p.summary,320):'',...tasks,...missions].filter(Boolean).join('\n').slice(0,1800);
  }
 });
}
function lab(){
 const target=$('#main');if(!window.CONTROL_LAB){target.innerHTML=note('Laboratoire IA indisponible : actualise CONTROL.');return}
 const selected=new URLSearchParams(location.hash.split('?')[1]||'').get('project')||'';
 window.CONTROL_LAB.mount(target,{mode:'personal',projectId:selected,projects:ctx.projects,
  getProject:(key)=>{
   const p=ctx.projects.find(p=>p.id===key);if(!p)return{};
   const d=ctx.state?.[key]||{};
   const localActions=db.actions.filter(x=>x.project===key&&x.status!=='done').slice(0,5);
   const localMissions=db.missions.filter(x=>x.project===key&&x.status!=='done').slice(0,5);
   const decisions=db.decisions.filter(x=>x.project===key).slice(-3);
   const context=[...localActions.map(x=>'Action ouverte : '+x.title+' ('+x.status+')'),...localMissions.map(x=>'Mission '+x.provider+' : '+x.title+' ('+x.status+')'),...decisions.map(x=>'Décision : '+x.title+' — '+String(x.details||'').slice(0,150))];
   if(p.status)context.unshift('Statut déclaré au '+(p.last_verified||'16/10/2026')+' : '+p.status);
   if(p.repo)context.push('Dépôt public : https://github.com/'+OWNER+'/'+encodeURIComponent(p.repo));
   return{context,reports:Object.entries(d.reports||{}).filter(([name,x])=>x?.text).slice(0,3).map(([name,x])=>name+' : '+x.text)};
  },
  providerURL:(project,provider)=>providerURL(project,provider),
  saveMission:async ({projectId,provider,title,instruction})=>{
    if(!ctx.projects.some(x=>x.id===projectId))throw Error('Projet inconnu.');
    if(instruction.length>8000)throw Error('Consignes trop longues pour une mission (8000 caractères). Raccourcis le brief ou copie-le directement.');
    if(db.missions.some(m=>m.project===projectId&&m.provider===provider&&m.instruction===instruction))return false;
    const mission={id:id(),title:String(title).slice(0,180),project:projectId,provider,files:'',instruction,status:'todo',result:'',at:new Date().toISOString()};
    db.missions.push(mission);if(!save()){db.missions.pop();throw Error('Enregistrement impossible sur cet appareil.')}
    return true;
  }
 });
}
function command(){
 const target=$('#main');
 if(!window.CONTROL_MULTI_AI){target.innerHTML=note('Poste multi-IA indisponible. Recharge CONTROL.');return}
 const pid=new URLSearchParams(location.hash.split('?')[1]||'').get('project')||'';
 window.CONTROL_MULTI_AI.mount(target,{mode:'personal',projectId:pid,projects:ctx.projects,
 listMissions:project=>db.missions.filter(x=>x.project===project&&['Claude','Gemini'].includes(x.provider)).map(x=>({
   id:x.id,projectId:x.project,provider:x.provider,title:x.title,prompt:x.instruction,status:x.status||'todo',
   result:x.result||'',proofUrl:x.proofUrl||'',resultOrigin:x.resultOrigin||'manual',updatedAt:x.updated||x.at,url:providerURL(x.project,x.provider)
 })),
 providerURL:(project,provider)=>providerURL(project,provider),
 createMission:async({projectId,provider,title,prompt})=>{
  if(!ctx.projects.some(x=>x.id===projectId))throw Error('Projet introuvable.');
  if(!['Claude','Gemini'].includes(provider))throw Error('Fournisseur inconnu.');
  if(db.missions.some(x=>x.project===projectId&&x.provider===provider&&x.instruction===prompt))return false;
  if(prompt.length>8000)throw Error('Instruction trop longue : raccourcis le contexte.');
  const row={id:id(),project:projectId,title,provider,files:'',instruction:prompt,status:'todo',result:'',at:new Date().toISOString(),resultOrigin:'manual'};
  db.missions.push(row);if(!save()){db.missions.pop();throw Error('Impossible d’enregistrer cette mission.')}return true;
 },
 updateMission:async(m,patch)=>{
  const orig=db.missions.find(x=>x.id===m.id);if(!orig)throw Error('Mission introuvable.');
  const previous={...orig};Object.assign(orig,{status:patch.status,result:patch.result,proofUrl:patch.proofUrl,resultOrigin:'manual',updated:new Date().toISOString()});
  if(!save()){Object.assign(orig,previous);throw Error('Échec du stockage local.')}return true;
 }
 });
}
function meetings(){
 const target=$('#main');if(!window.CONTROL_VISIOS){target.innerHTML=note('Les visios ne sont pas chargées. Actualise CONTROL.');return}
 const project=new URLSearchParams(location.hash.split('?')[1]||'').get('project')||'';
 window.CONTROL_VISIOS.mount(target,{mode:'personal',projectId:project,projects:ctx.projects,
 list:()=>db.meetings,
 create:async m=>{if(m.projectId&&!ctx.projects.some(x=>x.id===m.projectId))throw Error('Projet introuvable.');db.meetings.push(m);if(!save()){db.meetings.pop();throw Error('Impossible de sauvegarder le rendez-vous.')}return true},
 update:async(m,values)=>{const row=db.meetings.find(x=>x.id===m.id);if(!row)throw Error('Fiche introuvable.');const previous={...row};Object.assign(row,values);if(!save()){Object.assign(row,previous);throw Error('Échec du stockage.')}return true},
 remove:async m=>{const index=db.meetings.findIndex(x=>x.id===m.id);if(index<0)throw Error('Fiche introuvable.');const old=db.meetings.splice(index,1)[0];if(!save()){db.meetings.splice(index,0,old);throw Error('Suppression impossible.')}return true}
 });
}
function tools(){
 const groups=[
  {name:'Essentiels',subtitle:'Ce que tu utilises au quotidien',open:true,tools:[['localai','CONTROL IA locale','Discuter avec un vrai modèle gratuit'],['command','Claude & Gemini','Préparer et centraliser les missions'],['lab','Laboratoire IA','Créer des briefs et contrôler les réponses'],['library','Ressources','Tes liens et documents'],['search','Rechercher','Retrouver un projet ou un fichier']]},
  {name:'Explorer',subtitle:'Apprendre, créer et publier',open:false,tools:[['catalog','Bibliothèques IA','87 outils et 12 kits pratiques'],['deploy','Mise en ligne','Guides GitHub, IONOS et autres'],['activity','GitHub et tests','Suivi des dépôts publics']]},
  {name:'Organiser',subtitle:'Planifier et garder le contrôle',open:false,tools:[['missions','Toutes les missions','Suivi détaillé et historique'],['meetings','Visios et rendez-vous','Équipe, clients et prospects'],['calendar','Calendrier','Échéances enregistrées'],['memory','Décisions','Historique de projet'],['goals','Planifier un objectif','Étapes modifiables et sources locales'],['budget','Budget et quotas','Suivi déclaratif des coûts'],['backup','Sauvegardes','Exporter ou importer tes données'],['settings','Paramètres','Règles et confidentialité'],['inbox','À traiter','Actions prioritaires']]}
 ];
 const markup=groups.map((group,index)=>'<details class="clarity-toolgroup" '+(group.open?'open':'')+'><summary><span><strong>'+h(group.name)+'</strong><small>'+h(group.subtitle)+'</small></span><span class="clarity-chevron">⌄</span></summary><div class="clarity-toolcards">'+group.tools.map(([route,title,description])=>'<a class="clarity-tool-link" href="#/control/'+h(route)+'"><strong>'+h(title)+'</strong><small>'+h(description)+'</small><span aria-hidden="true">→</span></a>').join('')+'</div></details>').join('');
 const finder='<section class="shell-tools-search" aria-label="Rechercher un outil">'+
 '<label for="tools-filter">Quel outil cherchez-vous ?</label>'+
 '<div class="shell-tools-search-row"><input id="tools-filter" type="search" class="field" placeholder="Ex. visio, automatisation, budget, GitHub…" autocomplete="off">'+
 '<span id="tools-filter-status" role="status" aria-live="polite">Parcourez les fonctions par catégorie.</span></div></section>';
 $('#main').innerHTML=view('Tous les outils','Recherchez directement une fonction ou explorez les catégories.',finder+markup);
 const field=$('#tools-filter'),sections=[...$('#main').querySelectorAll('.clarity-toolgroup')];
 const original=sections.map(section=>section.open);
 field?.addEventListener('input',()=>{
  const query=field.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  let count=0;
  sections.forEach((section,i)=>{
   let match=0;
   section.querySelectorAll('.clarity-tool-link').forEach(link=>{
    const label=link.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const show=!query||query.split(/\s+/).every(word=>label.includes(word));
    link.hidden=!show;
    if(show)match++;
   });
   section.hidden=Boolean(query&&!match);
   section.open=query?Boolean(match):original[i];
   count+=query?match:0;
  });
  const status=$('#tools-filter-status');
  if(status)status.textContent=query?count+' fonction(s) correspondante(s)':'Parcourez les fonctions par catégorie.';
 });
}
function settings(){$('#main').innerHTML=view('Règles et sécurité','Protection des projets et limites des intégrations',box('Règles globales',note('Ces règles sont ajoutées aux demandes de mission copiées depuis CONTROL. Elles ne sont pas automatiquement appliquées sur les comptes Claude, ChatGPT ou Gemini.')+'<form id="global-rules">'+textarea('Règles générales','rules',db.globalRules||'','rows="8" maxlength="10000"')+'<button class="primary">Enregistrer</button></form>')+
 box('Notifications','<p class="muted">Les échéances apparaissent dans CONTROL, mais les notifications automatiques lorsque l’application est fermée exigeraient un service push privé. Ici, seuls les droits du navigateur peuvent être activés.</p>'+btn('Activer les notifications navigateur','notify')+'<p id="notification-state" class="muted"></p>')+
 box('Protection des données',note('CONTROL est hébergé publiquement sur GitHub Pages. Tes ajouts restent dans le navigateur de cet appareil. Ne saisis aucun mot de passe, clé API ou donnée confidentielle. La synchronisation privée multi-appareils et les actions authentifiées exigent une infrastructure distincte.')+'<div class="actions"><a class="button" href="#/control/backup">Sauvegardes</a><a class="button" href="#/control/library">Ressources</a></div>'));
 registerForm('#global-rules',f=>{if(commitLocal(()=>{db.globalRules=String(f.get('rules')||'').trim()}))toast('Règles enregistrées sur cet appareil.')});
 $('#main [data-act="notify"]').onclick=async()=>{if(typeof Notification==='undefined')return toast('Notifications indisponibles.');try{const result=await Notification.requestPermission();if(!commitLocal(()=>{db.notifications=(result==='granted')}))return;$('#notification-state').textContent=result==='granted'?'Autorisation active : rappel local au prochain accès à CONTROL si une échéance a expiré. Pas de push lorsque l’application est fermée.':'Permission non accordée.'}catch{toast('Permission non prise en charge.')}};
}
// Never silently replace an unreadable source with {} during backup.
function readBackupStore(key){const raw=localStorage.getItem(key);if(raw===null)return {};const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Invalid backup source');return parsed}
function backupStorageIssues(){const issues=[];for(const [key,label] of [[KEY,'Centre de commande'],[HUB,'Espaces et projets'],[AUTOS,'Automatisations']]){try{readBackupStore(key)}catch{issues.push({key,label})}}return issues}
const getStorage=readBackupStore;
function downloadRawStorage(key,label){try{const raw=localStorage.getItem(key);if(raw===null)throw Error('Empty storage');const url=URL.createObjectURL(new Blob([raw],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='CONTROL-brut-'+label+'-'+new Date().toISOString().slice(0,10)+'.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Copie brute téléchargée : elle peut contenir des données sensibles.')}catch{toast('Récupération impossible. Vérifie les permissions du navigateur.')}}
const toB64=u8=>{let s='';for(const b of u8)s+=String.fromCharCode(b);return btoa(s)};
const fromB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function derive(password,salt){const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:180000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function pack(data,pw){const now=new Date().toISOString();if(!pw)return{format:'control-v2-plain',created:now,data};if(!globalThis.crypto?.subtle)throw Error('Chiffrement non pris en charge.');
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),key=await derive(pw,salt);
 const enc=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(data)));
 return{format:'control-v2-aes-gcm',created:now,salt:toB64(salt),iv:toB64(iv),content:toB64(new Uint8Array(enc)),iterations:180000};
}
async function unpack(data,pw){if(data?.format==='control-v2-plain')return data.data;
 if(data?.format==='control-v2-aes-gcm'){if(!pw)throw Error('Mot de passe manquant.');const key=await derive(pw,fromB64(data.salt));const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(data.iv)},key,fromB64(data.content));return JSON.parse(new TextDecoder().decode(bytes))}
 throw Error('Format inconnu.')}
function validateBackupData(data){
 const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 if(!obj(data)||!obj(data.command)||!obj(data.hub)||!obj(data.automations))return false;
 const command=data.command;
 if(!Array.isArray(command.actions)||!Array.isArray(command.missions))return false;
 for(const key of ['actions','missions','events','meetings','expenses','income','decisions','messages']){
  if(command[key]!==undefined&&(!Array.isArray(command[key])||command[key].length>15000||command[key].some(x=>!obj(x))))return false;
 }
 // Reject prototype-mutating JSON keys, including inside imported project records.
 const stack=[data];let visited=0;
 while(stack.length){
  const value=stack.pop();
  if(value===null||typeof value!=='object')continue;
  if(++visited>60000)return false;
  for(const key of Object.keys(value)){
   if(['__proto__','prototype','constructor'].includes(key))return false;
   const child=value[key];if(child&&typeof child==='object')stack.push(child);
  }
 }
 return true;
}
function backup(){
 const brokenStores=backupStorageIssues();
 const recovery=brokenStores.filter(x=>x.key!==KEY).map(x=>'<p role="alert">Attention : les données de « '+h(x.label)+' » sont illisibles. L’export normal est bloqué pour éviter un fichier incomplet. '+btn('Télécharger la copie brute','download-raw:'+(x.key===HUB?'hub':'automations'))+'</p>').join('');
 $('#main').innerHTML=view('Sauvegarde et récupération','Protéger les données de CONTROL et changer d’appareil',note('Le stockage local peut disparaître lors d’un nettoyage du navigateur. Télécharge une sauvegarde régulière. Le fichier contient éventuellement des liens vers des espaces privés : utilise un mot de passe si tu le transfères.')+recovery+
 box('Exporter les informations','<p class="muted">Exporte les données de CONTROL, les liens de projets et les brouillons d’automatisations. Les conversations réelles des IA ne sont pas exportées.</p><form id="export-data">'+field('Mot de passe de chiffrement facultatif (12 caractères minimum)','password','','password','autocomplete="new-password"')+'<button class="primary">Télécharger ma sauvegarde</button></form>')+
 box('Importer une sauvegarde','<p class="muted">L’import remplace les trois espaces de stockage locaux du navigateur. Conserve auparavant une copie de l’état actuel.</p>'+(localStoreCorrupt?'<p role="alert">Le stockage actuel n’est pas lisible. Tu peux télécharger les données brutes sans les modifier, puis restaurer un fichier valide.</p>'+btn('Télécharger les données brutes','download-corrupt'):'')+'<form id="import-data"><label>Fichier JSON<input class="field" name="file" type="file" required accept=".json,application/json"></label>'+field('Mot de passe du fichier','password','','password')+'<button>Vérifier et restaurer</button></form><p class="muted" id="import-status"></p>'));
 registerForm('#export-data',async f=>{if(localStoreCorrupt)return toast('Export normal bloqué : utilise « Télécharger les données brutes » avant une restauration.');if(backupStorageIssues().length)return toast('Export bloqué : un espace local est illisible. Télécharge sa copie brute et restaure une sauvegarde valide.');const pw=String(f.get('password')||'');if(pw&&pw.length<12)return toast('12 caractères minimum ou champ vide.');try{const data=await pack({command:db,hub:getStorage(HUB),automations:getStorage(AUTOS)},pw);const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='CONTROL-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Fichier téléchargé : conserve-le dans un emplacement sûr.')}catch{toast('Sauvegarde impossible sur ce navigateur.')}});
 $('#main [data-act="download-corrupt"]')?.addEventListener('click',()=>{try{const raw=localStorage.getItem(KEY);if(raw===null)throw Error('Données non accessibles');const url=URL.createObjectURL(new Blob([raw],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='CONTROL-donnees-brutes-'+new Date().toISOString().slice(0,10)+'.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Copie brute téléchargée. Elle peut contenir des informations sensibles.')}catch{toast('Récupération brute impossible dans ce navigateur.')}});
 for(const [key,name] of [[HUB,'hub'],[AUTOS,'automations']])$('#main [data-act="download-raw:'+name+'"]')?.addEventListener('click',()=>downloadRawStorage(key,name));
 registerForm('#import-data',async f=>{let rollbackUncertain=false;const file=f.get('file'),pw=String(f.get('password')||'');if(!file||typeof file.size!=='number'||file.size>4000000)return toast('Fichier requis, 4 Mo maximum.');try{const data=await unpack(JSON.parse(await file.text()),pw);if(!validateBackupData(data))throw Error('Invalid backup format');
 if(!confirm('Restaurer les données et remplacer les informations locales actuelles ?'))return;
 const old=[KEY,HUB,AUTOS].map(k=>[k,localStorage.getItem(k)]);
 try{localStorage.setItem(KEY,JSON.stringify(data.command));localStorage.setItem(HUB,JSON.stringify(data.hub));localStorage.setItem(AUTOS,JSON.stringify(data.automations))}catch(e){for(const [k,v] of old){try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch{rollbackUncertain=true}}throw e}
 localStoreCorrupt=false;init();$('#import-status').textContent='Données restaurées. Recharge CONTROL pour actualiser les projets.';toast('Sauvegarde importée.')}catch{$('#import-status').textContent=rollbackUncertain?'Restauration interrompue : le navigateur a aussi refusé le retour arrière. Certaines données locales ont pu changer. Ne supprime pas ton fichier de sauvegarde.':'Import refusé : fichier incorrect, mot de passe erroné ou espace insuffisant. Les anciennes données ont été conservées ou restaurées.'}});
}
// Search only live, authorized device-local records. No stale cached index.
// Provenance is user-declared until an authenticated provider is available.
// Device-local, source-aware proposal only: does not execute actions or contact AI.
function proposeGoal(projectId,goal){
 const objective=String(goal||'').trim();
 if(!ctx.projects.some(x=>x.id===projectId))throw Error('Choisis un projet existant.');
 if(objective.length<8||objective.length>500)throw Error('Objectif invalide (8 à 500 caractères).');
 const actions=db.actions.filter(x=>x.project===projectId&&x.status!=='done').slice(-4);
 const decisions=db.decisions.filter(x=>x.project===projectId).slice(-2);
 const steps=[{title:'Préciser le résultat attendu',criterion:'Résultat mesurable et condition de réussite renseignés.',source:'Objectif déclaré, non vérifié'}];
 for(const x of decisions)steps.push({title:'Revoir la décision : '+String(x.title||'').slice(0,130),criterion:'Décision et pertinence réexaminées.',source:'Décision locale v'+decisionVersion(x)+' · '+x.id+' · '+(x.source||'Saisie manuelle')});
 for(const x of actions)steps.push({title:'Traiter : '+String(x.title||'').slice(0,130),criterion:'Preuve du résultat de la tâche collectée.',source:'Action locale · '+x.id+' · état déclaratif '+(x.status||'inconnu')});
 if(!actions.length)steps.push({title:'Décomposer l’objectif en tâches mesurables',criterion:'Une tâche, un responsable et un résultat définis.',source:'Suggestion locale sans exécution'});
 steps.push({title:'Contrôler les livrables et les preuves',criterion:'Résultats vérifiés, blocages et prochaines étapes consignés.',source:'Proposition de contrôle sans exécution'});
 return {projectId,goal:objective,steps:steps.slice(0,8),sourceAt:new Date().toISOString(),status:'proposition'};
}
function saveGoalPlan(proposal){
 if(!ctx.projects.some(x=>x.id===proposal?.projectId))throw Error('Projet absent ou non autorisé.');
 const ref=String(proposal.id||''),goal=String(proposal.goal||'').trim();
 if(!/^[a-z0-9_-]{8,90}$/i.test(ref)||goal.length<8||goal.length>500)throw Error('Proposition invalide.');
 if(!Array.isArray(proposal.steps)||proposal.steps.length<2||proposal.steps.length>8)throw Error('Étapes invalides.');
 const steps=proposal.steps.map(x=>({title:String(x.title||'').trim(),criterion:String(x.criterion||'').trim(),source:String(x.source||'').trim()}));
 if(steps.some(x=>!x.title||x.title.length>250||!x.criterion||x.criterion.length>300||!x.source||x.source.length>450))throw Error('Étape ou critère incomplet.');
 const signature=JSON.stringify({projectId:proposal.projectId,goal,steps});
 const older=db.goalPlans.find(x=>x.id===ref);
 if(older){if(older.signature!==signature)throw Error('Proposition déjà utilisée pour un autre contenu.');return older;}
 const saved={id:ref,project:proposal.projectId,goal,steps,signature,at:new Date().toISOString(),sourceAt:proposal.sourceAt,status:'proposition'};
 const before=db.goalPlans;db.goalPlans=[...before,saved];
 if(save()!==true){db.goalPlans=before;throw Error('Stockage indisponible : le plan n’est pas enregistré.')}
 return saved;
}
// A saved plan step may PREPARE a local task, but never run it without the
// explicit IMP-05 risk/diff review and consent; IMP-10 deduplicates retries.
function goalStepDraft(planId,stepIndex,title){
 const plan=db.goalPlans.find(x=>x.id===planId);
 if(!plan||plan.status!=='proposition'||!ctx.projects.some(p=>p.id===plan.project))throw Error('Plan ou projet indisponible.');
 const index=Number(stepIndex);
 if(!Number.isSafeInteger(index)||index<0||index>=plan.steps.length)throw Error('Étape de plan introuvable.');
 const step=plan.steps[index];
 if(!step||!String(step.source||'').trim()||!String(step.criterion||'').trim())throw Error('Source ou critère de cette étape indisponible.');
 const value=String(title===undefined?step.title:title).trim();
 if(!value||value.length>160)throw Error('Titre de tâche requis (160 caractères maximum).');
 const approvalId='local-'+plan.id.replace(/[^a-z0-9_-]/gi,'')+'-step-'+index;
 if(!/^local-[a-z0-9_-]{12,96}$/i.test(approvalId))throw Error('Référence de confirmation invalide.');
 return {type:'create_action',projectId:plan.project,title:value,approvalId};
}
function goals(){
 const records=db.goalPlans.filter(x=>ctx.projects.some(p=>p.id===x.project)).slice().reverse();
 $('#main').innerHTML=view('Planifier un objectif','Proposer un plan, puis approuver chaque éventuelle création de tâche',
 note('Les plans et leurs étapes restent des propositions. Chaque création de tâche exige un contrôle avant/après, un consentement explicite et une confirmation. Aucune action externe ni IA payante.')+
 box('Préparer un objectif','<form id="goal-request">'+
 '<label>Projet<select name="project" class="field">'+projopts(ctx.projects[0]?.id||'',false)+'</select></label>'+
 textarea('Résultat souhaité','goal','','required minlength="8" maxlength="500" rows="3"')+
 '<button class="primary">Préparer le plan</button></form>')+
 '<div id="goal-preview" aria-live="polite"></div>'+
 box('Propositions enregistrées',records.length?records.map(plan=>
 '<article class="chatrow"><div><strong>'+h(plan.goal)+'</strong><small>'+h(pname(plan.project))+' · '+plan.steps.length+' étapes · plan non exécuté · '+date(plan.at)+'</small>'+
 '<ol>'+plan.steps.map((step,index)=>{
  const token='local-'+plan.id.replace(/[^a-z0-9_-]/gi,'')+'-step-'+index;
  const old=(db.operatorAudit||[]).find(a=>a.approval_id===token&&a.outcome==='saved'&&a.project===plan.project);
  return '<li><strong>'+h(step.title)+'</strong><p>'+h(step.criterion)+'</p><small>Source : '+h(step.source)+'</small>'+
   (old?'<p>Une tâche locale a déjà été créée pour cette étape · reçu '+h(old.id)+'</p>':
   '<div class="actions"><button type="button" data-goal-plan="'+h(plan.id)+'" data-goal-step="'+index+'">Préparer une tâche locale</button></div>')+'</li>';
 }).join('')+'</ol></div></article>').join(''):tiny('Aucun plan sauvegardé sur cet appareil.'))+
 '<div id="goal-action-preview" aria-live="polite"></div>');
 let pending=null;
 registerForm('#goal-request',form=>{
  try{
   const draft=proposeGoal(String(form.get('project')),String(form.get('goal')));pending={...draft,id:id()};
   $('#goal-preview').innerHTML='<form id="goal-confirm"><h2>Vérifier et modifier les étapes</h2><p>Projet : '+h(pname(draft.projectId))+' · '+h(draft.goal)+'</p>'+
    draft.steps.map((x,i)=>'<fieldset><legend>Étape '+(i+1)+'</legend>'+
     field('Action proposée','step'+i,x.title,'text','required maxlength="250"')+
     textarea('Critère de réussite','criterion'+i,x.criterion,'required maxlength="300" rows="2"')+
     '<p class="muted">Source : '+h(x.source)+'</p></fieldset>').join('')+
    '<p class="muted">Sauvegarder le plan ne crée aucune tâche et n’exécute aucune IA.</p><button class="primary">Enregistrer la proposition</button></form>';
   registerForm('#goal-confirm',input=>{
    try{
     if(!pending)throw Error('Préparation expirée.');
     const steps=pending.steps.map((x,i)=>({...x,title:String(input.get('step'+i)||'').trim(),criterion:String(input.get('criterion'+i)||'').trim()}));
     const record=saveGoalPlan({...pending,steps});pending=null;goals();toast('Plan local enregistré · reçu '+record.id);
    }catch(error){toast(String(error?.message||error).slice(0,220))}
   });
  }catch(error){pending=null;$('#goal-preview').textContent=String(error?.message||error).slice(0,220)}
 });
 $('#main').querySelectorAll('[data-goal-step]').forEach(button=>button.onclick=()=>{
  const planId=button.dataset.goalPlan,index=Number(button.dataset.goalStep);
  const plan=db.goalPlans.find(x=>x.id===planId);
  const target=$('#goal-action-preview');
  try{
   const first=goalStepDraft(planId,index);
   const review=window.CONTROL_OPERATOR_CORE.reviewAction(first,operatorSnapshot(),'general');
   const signature=plan.signature,projectName=review.projectName;
   target.innerHTML='<form id="goal-action-confirm"><h3>Validation indépendante · '+h(projectName)+'</h3>'+
    '<p>Étape : '+h(plan.steps[index].title)+'</p>'+
    '<p><strong>Avant :</strong> '+h(review.before)+'</p><p><strong>Après :</strong> <span data-goal-after>'+h(review.after)+'</span></p>'+
    '<p><strong>Risque :</strong> '+h(review.risk)+'</p>'+
    '<label>Nom de la tâche locale<input name="title" maxlength="160" required value="'+h(first.title)+'"></label>'+
    '<label><input type="checkbox" name="consent" required> Je confirme la création de cette tâche sur cet appareil uniquement.</label>'+
    '<div class="actions"><button class="primary" type="submit">Confirmer la création locale</button><button type="button" data-goal-cancel>Annuler</button></div>'+
    '<p id="goal-action-error" role="alert"></p></form>';
   target.querySelector('[data-goal-cancel]').onclick=()=>target.replaceChildren();
   const formTitle=target.querySelector('#goal-action-confirm [name=title]');
   formTitle.addEventListener('input',()=>{
    target.querySelector('#goal-action-confirm [name=consent]').checked=false;
    const after=target.querySelector('[data-goal-after]'),error=target.querySelector('#goal-action-error');
    try{const update=goalStepDraft(planId,index,formTitle.value);
     after.textContent=window.CONTROL_OPERATOR_CORE.reviewAction(update,operatorSnapshot(),'general').after;
     error.textContent='Relis le nouvel état après, puis coche à nouveau la confirmation.';
    }catch(cause){after.textContent='Modification non valide';error.textContent=String(cause?.message||cause).slice(0,180)}
   });
   registerForm('#goal-action-confirm',(input,form)=>{
    try{
     if(!form.elements.namedItem('consent').checked)throw Error('Consentement requis.');
     const current=db.goalPlans.find(x=>x.id===planId);
     if(!current||current.signature!==signature||!ctx.projects.some(x=>x.id===current.project&&x.name===projectName))
      throw Error('Plan ou projet modifié : nouvelle validation nécessaire.');
     const action=goalStepDraft(planId,index,input.get('title'));
     const live=window.CONTROL_OPERATOR_CORE.reviewAction(action,operatorSnapshot(),'general');
     // The "after" summary must match exactly what the user has just reviewed.
     if(live.after!==target.querySelector('[data-goal-after]').textContent)
      throw Error('État après devenu obsolète : nouvelle vérification nécessaire.');
     if((db.operatorAudit||[]).some(x=>x.approval_id===action.approvalId))
      throw Error('Étape déjà validée : aucune seconde création autorisée.');
     if(operatorExecute(action)!==true)throw Error('Enregistrement non confirmé.');
     const receipt=operatorReceipt();
     if(!receipt||receipt.project!==action.projectId||receipt.type!=='create_action')throw Error('Reçu local introuvable : vérifie la tâche.');
     goals();toast('Tâche locale créée, non exécutée · reçu '+receipt.id);
    }catch(error){const errorNode=target.querySelector('#goal-action-error');if(errorNode)errorNode.textContent=String(error?.message||error).slice(0,200)}
   });
  }catch(error){target.textContent='Proposition indisponible : '+String(error?.message||error).slice(0,180)}
 });
}
function searchResults(scope='',query=''){
 const allowed=new Map(ctx.projects.map(p=>[p.id,p]));
 if(scope&&!allowed.has(scope))return [];
 const rows=[],add=(project,kind,title,metadata,url,searchable='')=>{
  if(!allowed.has(project)||(scope&&project!==scope)||!String(title||'').trim())return;
  rows.push({project,kind,title:String(title),metadata:String(metadata),url:String(url),searchable:String(searchable)});
 };
 const freshness=value=>{
  const time=Date.parse(value||'');
  if(!Number.isFinite(time))return 'date non renseignée · à vérifier';
  const age=Date.now()-time;
  return date(value)+(age>90*86400000?' · à revalider':' · date déclarée');
 };
 for(const p of ctx.projects)add(p.id,'Projet',p.name,'Fiche de projet · '+(p.status||'état non vérifié'),'#/project/'+encodeURIComponent(p.id)+'/pilot',p.short||'');
 for(const action of db.actions||[])add(action.project,'Action',action.title,'Action locale · '+(action.status||'état inconnu')+' · '+freshness(action.at||action.due),'#/control/inbox',action.priority||'');
 for(const mission of db.missions||[])add(mission.project,'Mission',mission.title,'Mission déclarée · '+(mission.provider||'IA non renseignée')+' · '+(mission.status||'statut non vérifié'),'#/control/missions');
 for(const event of db.events||[])add(event.project,'Événement',event.title,'Calendrier local · '+(event.date||'date non renseignée'),'#/control/calendar');
 for(const decision of db.decisions||[]){
  const recorded=decision.updatedAt||decision.at;
  const metadata='Décision locale · v'+decisionVersion(decision)+' · source déclarée : '+(decision.source||'Saisie manuelle')+' · '+freshness(recorded);
  add(decision.project,'Décision',decision.title,metadata,'#/control/memory/'+encodeURIComponent(decision.id),decision.details||'');
 }
 for(const resource of [...linksPage(),...(db.resources||[])]){
  if(!safe(resource.url))continue;
  add(resource.project,'Ressource',resource.label,'Lien HTTPS déclaré · vérifier la source',safe(resource.url));
 }
 const fold=t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr-FR').trim();
 const q=fold(query);
 return rows.filter(x=>fold(x.title+' '+x.kind+' '+x.metadata+' '+x.searchable+' '+allowed.get(x.project).name).includes(q)).slice(0,65);
}
function search(){
 $('#main').innerHTML=view('Recherche universelle','Résultats locaux par projet avec provenance, date et accès direct',
 box('Chercher dans CONTROL','<div class="row"><label>Recherche<input id="global-search" type="search" class="field" placeholder="Projet, décision, source, échéance…"></label>'+
 '<label>Limiter à un projet<select id="search-project" class="field">'+projopts('',true)+'</select></label></div>'+
 '<p class="muted">Sources déclarées, pas certifiées ; les anciennes décisions et dates peuvent être périmées. Les conversations privées des fournisseurs ne sont pas accessibles.</p>'+
 '<div id="search-hits" role="status" aria-live="polite"></div>'));
 const draw=()=>{
  const scope=$('#search-project').value,q=$('#global-search').value,results=searchResults(scope,q);
  $('#search-hits').innerHTML=results.length?results.map(x=>
   '<a class="link" href="'+h(x.url)+'" '+(x.url.startsWith('https:')?'target="_blank" rel="noopener noreferrer"':'')+
   '><span><strong>'+h(x.title)+'</strong><small>'+h(x.kind)+' · '+h(pname(x.project))+'</small><small>'+h(x.metadata)+'</small></span><span>→</span></a>').join(''):tiny('Aucun résultat actuel dans ce périmètre.');
 };
 draw();$('#global-search').oninput=draw;$('#search-project').onchange=draw;
}
const SPRINT_IDS=['pack-pro','banque-ia','ucp','iagile','control-ia'];
const SPRINT_NAMES={'pack-pro':'Business 01 · Procédures Pro','banque-ia':'Business 02 · Banque Outils IA','ucp':'Un Coup de Pouce','iagile':'IAgile','control-ia':'CONTROL IA'};
async function fetchSprints(force=false){
 if(sprintLoading)return sprintLoading;
 const toLoad=SPRINT_IDS.filter(id=>force||!sprintLoaded[id]);if(!toLoad.length)return;
 sprintLoading=Promise.allSettled(toLoad.map(async id=>{const r=await fetch('./data/sprints/'+id+'.json',{cache:'no-store'});if(!r.ok)throw Error('GitHub Pages '+r.status);const a=await r.json();if(!Array.isArray(a))throw Error('Format incompatible');
 const clean=a.filter(x=>x&&typeof x==='object'&&typeof x.summary==='string'&&(x.ended_at||x.started_at));
 clean.sort((a,b)=>new Date(b.ended_at||b.started_at)-new Date(a.ended_at||a.started_at));
 sprints[id]=clean[0]||null;sprintLoaded[id]={checkedAt:new Date().toISOString(),entries:a.length};
 })).finally(()=>{sprintLoading=null});await sprintLoading;
}
function paintSprints(selector,onlyBlockers=false){const out=$(selector);if(!out)return;
 if(!Object.keys(sprintLoaded).length){out.innerHTML=tiny('Rapports non encore chargés.');return}
 const rows=SPRINT_IDS.map(id=>({id,s:sprints[id]||null})).filter(({s})=>!onlyBlockers||((s?.blockers||[]).length>0));
 out.innerHTML=rows.length?rows.map(({id,s})=>{
  const name=SPRINT_NAMES[id]||pname(id);
  const link=href('https://github.com/'+OWNER+'/Avancement-Projet/blob/main/data/sprints/'+encodeURIComponent(id)+'.json','Journal');
  if(!s)return '<div class="chatrow"><div><strong>'+h(name)+'</strong><small>Aucun rapport structuré accessible ; activité non vérifiée.</small></div>'+link+'</div>';
  const delivery=Array.isArray(s.deliverables)?s.deliverables:[];
  const levels=['planned','coded','tested','merged','deployed','verified_online','operational'];
  const rank=delivery.reduce((m,d)=>Math.max(m,levels.indexOf(d?.stage)), -1);
  const stage=rank<0?'Aucun niveau de livraison vérifiable dans ce rapport':'Niveau déclaré : '+levels[rank];
  const proof=delivery.some(d=>['verified_online','operational'].includes(d?.stage)&&d?.online_url&&d?.online_verified_at&&d?.online_evidence_url)?
   'Référence de contrôle en ligne fournie (à revérifier)':'Aucune preuve de parcours en ligne dans ce rapport';
  const head='<div><strong>'+h(name)+'</strong><small>Dernier rapport : '+h(dt(s.ended_at||s.started_at))+' · source : journal GitHub</small>';
  const details=onlyBlockers?'<p>'+h((s.blockers||[]).slice(0,4).join(' · '))+'</p>':
   '<p>'+h(cap(s.summary,240))+'</p><small>'+h(stage)+' · '+h(proof)+'</small><small>Suite : '+h(cap(s.next,180))+'</small>';
  return '<div class="chatrow">'+head+details+'</div>'+link+'</div>';
 }).join(''):tiny(onlyBlockers?'Aucun blocage indiqué dans les derniers rapports.':'Aucun sprint accessible.');
 const n=Object.keys(sprintLoaded).length;if(n<SPRINT_IDS.length)out.innerHTML+=tiny((SPRINT_IDS.length-n)+' source(s) non vérifiée(s), information potentiellement partielle.');
 out.innerHTML+=tiny('Ces données sont des journaux GitHub, pas un suivi en direct de ChatGPT. Le statut en ligne nécessite une preuve de recette réelle.');
}
function render(input){ctx=input||ctx;init();try{const today=new Date().toISOString().slice(0,10),n=db.actions.filter(a=>a.status!=='done'&&a.due&&a.due<today).length;if(db.notifications&&n>0&&typeof Notification!=='undefined'&&Notification.permission==='granted'&&localStorage.getItem('control-notified-day')!==today){new Notification('CONTROL · Échéances',{body:n+' action(s) locale(s) en retard. Ouvre « À traiter ».',tag:'control-overdue'});localStorage.setItem('control-notified-day',today)}}catch{}const page=route().page;const pages={manager,tools,meetings,command,localai,lab,inbox:intake,missions,calendar,activity,library,catalog,deploy,memory,goals,budget,backup,settings,search};(pages[page]||manager)()}
window.CONTROL_CENTER={render};
})();