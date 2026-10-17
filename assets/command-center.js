/* CONTROL · Centre de commande — données locales et lectures GitHub publiques.
   Aucune API privée, dépense, autorisation ou modification d'automatisation. */
(()=>{'use strict';
const KEY='control-command-v1',HUB='control-hub-v2',AUTOS='control-automations-v1',OWNER='cosscoll';
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
function storage(){try{const a=JSON.parse(localStorage.getItem(KEY)||'{}');return a&&typeof a==='object'&&!Array.isArray(a)?a:{}}catch{return{}}}
function init(){db=Object.assign({version:1,actions:[],missions:[],events:[],expenses:[],decisions:[],messages:[],globalRules:'Aucune dépense, abonnement, achat de crédits ou action engageante sans autorisation explicite. Ne pas utiliser de quotas partagés interdits par les consignes du projet. Ne pas publier de données sensibles. Vérifier les résultats avant de les annoncer terminés.',notifications:false},storage());for(const key of ['actions','missions','events','meetings','expenses','income','decisions','messages'])if(!Array.isArray(db[key]))db[key]=[]}
function save(){try{db.lastChanged=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(db));return true}catch{toast('Stockage indisponible ou plein. Effectue une sauvegarde.');return false}}
function toast(m){const e=$('#toast');if(e){e.textContent=m;e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),4200)}}
function cap(s,n=320){s=String(s||'');return s.length>n?s.slice(0,n)+'…':s}
function view(title,subtitle,content,extra=''){return '<div class="toprow"><div><div class="quiet">CONTROL / CENTRE DE COMMANDE</div><h1>'+h(title)+'</h1><p class="muted">'+h(subtitle)+'</p></div>'+extra+'</div>'+content}
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
 box('Accès rapide', '<div class="quicktiles">'+[['command','Commander Claude & Gemini'],['inbox','À traiter'],['missions','Missions multi-IA'],['activity','Activité GitHub'],['calendar','Calendrier'],['library','Bibliothèque'],['budget','Coûts et quotas'],['memory','Mémoire et décisions'],['backup','Sauvegardes'],['settings','Règles et sécurité']].map(([url,label])=>'<a href="#/control/'+url+'" class="quicktile">'+h(label)+' →</a>').join('')+'</div>');
 $('#main').innerHTML=view('CONTROL IA','Centre de pilotage et de synthèse de tous tes projets',content);
 registerForm('#c-ask',(f)=>{const q=String(f.get('question')||'').trim(),pid=subject();if(!q)return;db.messages.push({id:id(),role:'user',text:q,project:pid,at:new Date().toISOString()},{id:id(),role:'assistant',text:reply(q,pid),project:pid,at:new Date().toISOString()});db.messages=db.messages.slice(-80);save();manager();$('#c-project').value=pid});
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
 registerForm('#new-action',(f)=>{const title=String(f.get('title')||'').trim();if(!title)return;const url=String(f.get('url')||'').trim();if(url&&!safe(url))return toast('Lien HTTPS requis.');db.actions.push({id:id(),project:String(f.get('project')||''),title,priority:String(f.get('priority')||'Normale'),status:'todo',due:String(f.get('due')||''),url,at:new Date().toISOString()});save();intake();toast('Action enregistrée localement.')});
 paintSprints('#inbox-sprint-status',true);fetchSprints().then(()=>paintSprints('#inbox-sprint-status',true)).catch(()=>{});
 $('#main').querySelectorAll('[data-act^="done:"]').forEach(b=>b.onclick=()=>{const a=db.actions.find(x=>x.id===b.dataset.act.slice(5));if(a){a.status='done';a.closedAt=new Date().toISOString();save();intake()}});
}
function missions(){const cards=db.missions.slice().reverse(),counts=['todo','doing','review','done'].map(s=>db.missions.filter(x=>x.status===s).length);
 let content='<div class="dash-stats">'+['À lancer','En cours','À vérifier','Terminé'].map((s,i)=>'<div class="stat"><strong>'+counts[i]+'</strong><span>'+s+'</span></div>').join('')+'</div>'+
 note('CONTROL prépare les consignes et permet de suivre leur exécution. Les fournisseurs externes ne reçoivent aucune mission automatiquement depuis ce site public. Les résultats doivent être rapportés et vérifiés.')+
 '<p><a class="button primary" href="#/control/command">Commander Claude + Gemini · Voir tous les résultats →</a></p>'+
 box('Créer une mission multi-IA','<form id="new-mission">'+field('Intitulé','title','','text','required maxlength="180"')+selectProject('')+'<div class="formgrid"><label>IA responsable<select class="field" name="provider">'+options(availableAgents(),'ChatGPT')+'</select></label>'+field('Fichiers ou périmètre technique (facultatif)','files','','text','placeholder="Ex. application/frontend"')+'</div>'+textarea('Instruction à transmettre','instruction','','required maxlength="8000" rows="4"')+'<button class="primary">Préparer la mission</button> '+btn('Préparer un plan avec plusieurs IA','orchestrate')+'</form>')+
 box('Suivi des missions',cards.length?cards.map(m=>{const collision=db.missions.filter(x=>x.id!==m.id&&x.project===m.project&&x.status==='doing'&&m.status==='doing'&&x.files&&m.files&&(x.files===m.files||x.files.includes(m.files)||m.files.includes(x.files))).length;return '<div class="mission-row"><div class="row"><strong>'+h(m.title)+'</strong>'+tag(m.provider+' · '+m.status)+'</div><p class="muted">'+h(pname(m.project))+' · '+date(m.at)+(collision?' · ⚠️ Risque de modification concurrente':'')+'</p><p>'+h(cap(m.instruction,180))+'</p><div class="actions">'+btn('Copier','copy:'+m.id)+href(providerURL(m.project,m.provider),'Ouvrir '+m.provider)+btn('Mettre à jour','edit:'+m.id)+'</div>'+(m.result?'<details><summary>Résultat rapporté</summary><p class="auto-text">'+h(m.result)+'</p></details>':'')+'</div>'}).join(''):'<p class="empty">Aucune mission enregistrée.</p>')+
 '<section class="panel hidden" id="mission-editor"><h2>Mettre à jour une mission</h2><form id="edit-mission"><input name="id" type="hidden"><label>État<select class="field" name="status">'+[['todo','À lancer'],['doing','En cours'],['review','À vérifier'],['done','Terminée']].map(([s,n])=>'<option value="'+s+'">'+n+'</option>').join('')+'</select></label>'+textarea('Compte rendu ou résultat','result','','rows="4"')+'<button class="primary">Enregistrer le suivi</button></form></section>';
 $('#main').innerHTML=view('Missions IA','Préparer, répartir et suivre les travaux de plusieurs IA',content);
 registerForm('#new-mission',f=>{const title=String(f.get('title')||'').trim(),instruction=String(f.get('instruction')||'').trim(),project=String(f.get('project')||''),provider=String(f.get('provider')||'ChatGPT');if(!title||!instruction)return;db.missions.push({id:id(),title,provider,project,files:String(f.get('files')||''),instruction,status:'todo',result:'',at:new Date().toISOString()});save();missions();toast('Mission créée : à transmettre manuellement.')});
 $('#main').querySelector('[data-act="orchestrate"]')?.addEventListener('click',()=>{const f=new FormData($('#new-mission')),project=String(f.get('project')||''),instruction=String(f.get('instruction')||'').trim(),title=String(f.get('title')||'Mission');if(!instruction)return toast('Décris d’abord la mission.');const plans=[['ChatGPT','Définir le besoin et les critères de recette'],['Claude','Examiner les risques et proposer les améliorations UX/architecture'],['Codex','Implémenter sur branche dédiée après vérification des conflits, tester et préparer une PR'],['ChatGPT','Vérifier les preuves et synthétiser la livraison']];for(const [provider,step] of plans)db.missions.push({id:id(),project,title:title+' — '+step,provider,files:provider==='Codex'?String(f.get('files')||''):'',instruction:step+'\n\nDemande initiale : '+instruction+'\n\nRègles globales : '+db.globalRules,status:'todo',result:'',at:new Date().toISOString()});save();missions();toast('4 missions préparées, aucune IA déclenchée.')});
 $('#main').querySelectorAll('[data-act^="copy:"]').forEach(b=>b.onclick=()=>{const m=db.missions.find(x=>x.id===b.dataset.act.slice(5));if(m)copy('MISSION '+m.provider+' — '+pname(m.project)+'\n'+m.title+'\n\n'+m.instruction+'\n\nPérimètre : '+(m.files||'À définir')+'\n\nCONTRAINTES\n'+db.globalRules+'\n\nAprès le travail, fournis des preuves (lien, tests, fichiers changés). Ne déclare pas une tâche terminée sans vérification.')});
 $('#main').querySelectorAll('[data-act^="edit:"]').forEach(b=>b.onclick=()=>{const m=db.missions.find(x=>x.id===b.dataset.act.slice(5));if(!m)return;$('#mission-editor').classList.remove('hidden');const f=$('#edit-mission');f.elements.id.value=m.id;f.elements.status.value=m.status;f.elements.result.value=m.result||'';$('#mission-editor').scrollIntoView({block:'nearest'})});
 registerForm('#edit-mission',f=>{const m=db.missions.find(x=>x.id===String(f.get('id')));if(!m)return;m.status=String(f.get('status'));m.result=String(f.get('result')||'').trim();if(m.status==='done'&&!m.result){toast('Ajoute un compte rendu avant de marquer la mission terminée.');return}m.updated=new Date().toISOString();save();missions()});
}
function calendar(){const now=new Date().toISOString().slice(0,10),future=db.events.slice().sort((a,b)=>a.date.localeCompare(b.date));
 const content='<div class="two">'+box('Agenda des projets',future.length?future.map(e=>'<div class="inbox-item"><div><strong>'+h(e.title)+'</strong><small>'+h(pname(e.project))+' · '+h(e.date)+(e.details?' · '+h(cap(e.details,90)):'')+'</small></div>'+btn('Supprimer','delete-event:'+e.id)+'</div>').join(''):'<p class="empty">Aucun événement enregistré.</p>')+
 box('Ajouter un événement','<form id="new-event">'+field('Intitulé','title','','text','required maxlength="160"')+selectProject('')+field('Date et heure','date',now+'T09:00','datetime-local','required')+textarea('Détails','details','','rows="3"')+'<button class="primary">Ajouter à CONTROL</button></form>')+'</div>'+
 box('Visios et rendez-vous','<p class="muted">Réunions internes et rendez-vous clients : lien, invitation à partager, calendrier et compte rendu. Les visioconférences utilisent le fournisseur choisi.</p>'+db.meetings.filter(m=>m.startsAt&&Date.parse(m.startsAt)+Number(m.minutes||30)*60000>=Date.now()).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt)).slice(0,5).map(m=>'<div class="inbox-item"><div><strong>'+h(m.title)+'</strong><small>'+h(dt(m.startsAt))+' · '+h(m.provider)+'</small></div>'+(safe(m.url)?href(m.url,'Rejoindre'):'')+'</div>').join('')+'<a class="button primary" href="#/control/meetings">Ouvrir les visios →</a>')+
 box('Calendriers externes','<p class="muted">Google Agenda et les calendriers des IA restent gérés dans leurs services respectifs. CONTROL n’affiche pas leurs rendez-vous privés sans authentification dédiée.</p><div class="actions">'+href('https://calendar.google.com/calendar/u/0/r/','Google Agenda')+href('https://chatgpt.com/scheduled','Tâches ChatGPT')+href('https://claude.ai/','Claude')+'</div>')+
 box('Automatisations connues','<div id="c-auto-preview"><p class="muted">Accéder à la programmation des tâches depuis le catalogue daté.</p><a class="button" href="#/automations">Ouvrir les automatisations →</a></div>');
 $('#main').innerHTML=view('Calendrier','Échéances, événements et automatisations',content);
 fetch('./data/automations.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{const box=$('#c-auto-preview');if(!box||!d?.tasks)return;box.innerHTML='<p class="muted">Relevé du '+h(dt(d.verified_at))+' — horaires déclaratifs, non synchronisés en direct.</p>'+d.tasks.filter(t=>t.active_at_last_check).map(t=>'<div class="chatrow"><div><strong>'+h(t.title)+'</strong><small>'+h(t.schedule)+'</small></div></div>').join('')+'<a class="button" href="#/automations">Voir les fiches →</a>'}).catch(()=>{});
 registerForm('#new-event',f=>{db.events.push({id:id(),project:String(f.get('project')||''),title:String(f.get('title')||''),date:String(f.get('date')||''),details:String(f.get('details')||'')});save();calendar()});
 $('#main').querySelectorAll('[data-act^="delete-event:"]').forEach(b=>b.onclick=()=>{db.events=db.events.filter(x=>x.id!==b.dataset.act.slice(13));save();calendar()});
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
 registerForm('#new-resource',f=>{const url=safe(f.get('url'));if(!url)return toast('Adresse HTTPS invalide.');db.resources??=[];db.resources.push({id:id(),project:String(f.get('project')||''),label:String(f.get('label')||'').trim(),url});save();library();toast('Lien enregistré.')});
}
function memory(){const list=db.decisions.slice().reverse();
 $('#main').innerHTML=view('Mémoire','Décisions et contexte conservés par projet',note('Les informations conservées viennent de tes saisies et de bilans importés. CONTROL ne lit pas les conversations privées des IA.')+
 box('Décisions enregistrées',list.length?list.map(d=>'<div class="chatrow"><div><strong>'+h(d.title)+'</strong><small>'+h(pname(d.project))+' · '+date(d.at)+' · '+h(d.source||'Saisie manuelle')+'</small><p>'+h(cap(d.details,300))+'</p></div>'+btn('Supprimer','decision-del:'+d.id)+'</div>').join(''):tiny('Aucune décision enregistrée.'))+
 box('Ajouter une décision','<form id="new-decision">'+field('Titre','title','','text','required maxlength="150"')+selectProject(ctx.projects[0]?.id||'',false)+textarea('Détails et justification','details','','required rows="4"')+field('Source','source','','text')+'<button class="primary">Mémoriser</button></form>')+
 box('Partager le contexte','<label>Projet<select class="field" id="memory-project">'+projopts(ctx.projects[0]?.id||'',false)+'</select></label>'+btn('Copier une fiche de contexte','copy-context','primary')));
 registerForm('#new-decision',f=>{db.decisions.push({id:id(),project:String(f.get('project')),title:String(f.get('title')||''),details:String(f.get('details')||''),source:String(f.get('source')||'Saisie manuelle'),at:new Date().toISOString()});save();memory()});
 $('#main').querySelectorAll('[data-act^="decision-del:"]').forEach(b=>b.onclick=()=>{if(!confirm('Supprimer cette décision enregistrée localement ?'))return;db.decisions=db.decisions.filter(x=>x.id!==b.dataset.act.slice(13));save();memory()});
 $('#main [data-act="copy-context"]').onclick=()=>{const p=$('#memory-project').value;copy('PROJET : '+pname(p)+'\nCONSIGNES :\n'+db.globalRules+'\n\nFAITS / SOURCES DISPONIBLES :\n'+contextEvidence(p).join('\n')+'\n\nDÉCISIONS :\n'+db.decisions.filter(x=>x.project===p).map(x=>x.title+' : '+x.details).join('\n')+'\n\nDistinguer toujours faits vérifiés et bilans déclaratifs.')};
}

function budget(){const month=new Date().toISOString().slice(0,7),rows=db.expenses.filter(x=>x.month===month),spent=rows.reduce((a,x)=>a+Number(x.amount||0),0),revenue=db.income.filter(x=>x.month===month).reduce((a,x)=>a+Number(x.amount||0),0),limit=db.monthLimit;
 $('#main').innerHTML=view('Budget et quotas','Suivi manuel des coûts et restrictions des services IA',note('Aucun accès aux factures ni aux tokens réels des comptes externes. Les plafonds ci-dessous sont indicatifs : CONTROL ne bloque pas la facturation chez les fournisseurs.')+
 '<div class="dash-stats"><div class="stat"><strong>'+spent.toFixed(2)+' €</strong><span>Dépenses saisies ('+month+')</span></div><div class="stat"><strong>'+revenue.toFixed(2)+' €</strong><span>Revenus déclarés</span></div><div class="stat"><strong>'+(revenue-spent).toFixed(2)+' €</strong><span>Solde déclaré, non vérifié</span></div></div><p class="muted">Budget indicatif : '+(limit===undefined?'non défini':Number(limit).toFixed(2)+' €')+'. Les montants ne sont ni extraits d’un compte bancaire ni vérifiés auprès des prestataires.</p>'+
 (limit!==undefined&&spent>+limit?note('Attention : dépenses saisies supérieures au plafond indicatif.'):'')+
 box('Dépenses enregistrées',rows.length?rows.map(x=>'<div class="chatrow"><div><strong>'+h(x.label)+'</strong><small>'+h(pname(x.project))+' · '+h(x.kind)+'</small></div><div class="actions"><strong>'+Number(x.amount).toFixed(2)+' €</strong>'+btn('×','expense-del:'+x.id)+'</div></div>').join(''):tiny('Aucune dépense renseignée. Cela ne prouve pas l’absence de frais.'))+
 box('Ajouter une dépense','<form id="new-expense">'+field('Service','label','','text','required maxlength="120"')+selectProject('')+'<div class="formgrid">'+field('Montant en euros','amount','','number','required min="0" step="0.01" max="1000000"')+field('Mois','month',month,'month','required')+'</div><label>Nature<select class="field" name="kind">'+options(['Abonnement','Crédits API','Hébergement','Autre'],'Abonnement')+'</select></label><button class="primary">Enregistrer</button></form>')+
 box('Revenus déclarés',db.income.filter(x=>x.month===month).map(x=>'<div class="chatrow"><div><strong>'+h(x.label)+'</strong><small>'+h(pname(x.project))+'</small></div><strong>'+Number(x.amount).toFixed(2)+' €</strong></div>').join('')+'<form id="new-income">'+field('Produit / prestation','label','','text','required maxlength="120"')+selectProject('')+'<div class="formgrid">'+field('Montant déclaré (€)','amount','','number','required min="0" step="0.01"')+field('Mois','month',month,'month','required')+'</div><button class="primary">Enregistrer ce revenu</button></form>')+
 box('Règles de consommation','<form id="monthly-limit">'+field('Plafond indicatif (€)','limit',limit===undefined?'':limit,'number','min="0" step="0.01"')+'<button class="primary">Enregistrer le seuil</button></form>'+tiny('Le modèle exact et ses quotas ne sont pas toujours exposés par l’IA. Afficher « Non vérifié » lorsque les données sont inconnues.')+'<a class="button" href="#/automations">Voir les automatisations et restrictions →</a>'));
 registerForm('#new-expense',f=>{const amount=Number(f.get('amount'));if(!Number.isFinite(amount)||amount<0||amount>1000000)return toast('Montant invalide.');db.expenses.push({id:id(),project:String(f.get('project')||''),label:String(f.get('label')||'').trim(),amount,kind:String(f.get('kind')||''),month:String(f.get('month')||month)});save();budget()});
 registerForm('#new-income',f=>{const amount=Number(f.get('amount'));if(!Number.isFinite(amount)||amount<0||amount>1000000)return toast('Montant invalide.');db.income.push({id:id(),project:String(f.get('project')||''),label:String(f.get('label')||''),amount,month:String(f.get('month')||month)});save();budget()});
 registerForm('#monthly-limit',f=>{const v=String(f.get('limit')||'').trim();if(!v)delete db.monthLimit;else if(!Number.isFinite(+v)||+v<0)return toast('Plafond invalide.');else db.monthLimit=+v;save();budget()});
 $('#main').querySelectorAll('[data-act^="expense-del:"]').forEach(b=>b.onclick=()=>{db.expenses=db.expenses.filter(x=>x.id!==b.dataset.act.slice(12));save();budget()});
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
  {name:'Essentiels',subtitle:'Ce que tu utilises au quotidien',open:true,tools:[['command','Commander Claude & Gemini','Missions et résultats centralisés'],['missions','Missions IA','Préparer et suivre le travail'],['lab','Laboratoire IA','Créer des briefs et contrôler les réponses'],['library','Ressources','Tes liens et documents'],['search','Rechercher','Retrouver un projet ou un fichier']]},
  {name:'Explorer',subtitle:'Apprendre, créer et publier',open:false,tools:[['catalog','Bibliothèques IA','87 outils et 12 kits pratiques'],['deploy','Mise en ligne','Guides GitHub, IONOS et autres'],['activity','GitHub et tests','Suivi des dépôts publics']]},
  {name:'Organiser',subtitle:'Planifier et garder le contrôle',open:false,tools:[['meetings','Visios et rendez-vous','Équipe, clients et prospects'],['calendar','Calendrier','Échéances enregistrées'],['memory','Décisions','Historique de projet'],['budget','Budget et quotas','Suivi déclaratif des coûts'],['backup','Sauvegardes','Exporter ou importer tes données'],['settings','Paramètres','Règles et confidentialité'],['inbox','À traiter','Actions prioritaires']]}
 ];
 const markup=groups.map((group,index)=>'<details class="clarity-toolgroup" '+(group.open?'open':'')+'><summary><span><strong>'+h(group.name)+'</strong><small>'+h(group.subtitle)+'</small></span><span class="clarity-chevron">⌄</span></summary><div class="clarity-toolcards">'+group.tools.map(([route,title,description])=>'<a class="clarity-tool-link" href="#/control/'+h(route)+'"><strong>'+h(title)+'</strong><small>'+h(description)+'</small><span aria-hidden="true">→</span></a>').join('')+'</div></details>').join('');
 $('#main').innerHTML=view('Tous les outils','Les essentiels d’abord. Le reste est rangé par usage.',markup);
}
function settings(){$('#main').innerHTML=view('Règles et sécurité','Protection des projets et limites des intégrations',box('Règles globales',note('Ces règles sont ajoutées aux demandes de mission copiées depuis CONTROL. Elles ne sont pas automatiquement appliquées sur les comptes Claude, ChatGPT ou Gemini.')+'<form id="global-rules">'+textarea('Règles générales','rules',db.globalRules||'','rows="8" maxlength="10000"')+'<button class="primary">Enregistrer</button></form>')+
 box('Notifications','<p class="muted">Les échéances apparaissent dans CONTROL, mais les notifications automatiques lorsque l’application est fermée exigeraient un service push privé. Ici, seuls les droits du navigateur peuvent être activés.</p>'+btn('Activer les notifications navigateur','notify')+'<p id="notification-state" class="muted"></p>')+
 box('Protection des données',note('CONTROL est hébergé publiquement sur GitHub Pages. Tes ajouts restent dans le navigateur de cet appareil. Ne saisis aucun mot de passe, clé API ou donnée confidentielle. La synchronisation privée multi-appareils et les actions authentifiées exigent une infrastructure distincte.')+'<div class="actions"><a class="button" href="#/control/backup">Sauvegardes</a><a class="button" href="#/control/library">Ressources</a></div>'));
 registerForm('#global-rules',f=>{db.globalRules=String(f.get('rules')||'').trim();save();toast('Règles enregistrées sur cet appareil.')});
 $('#main [data-act="notify"]').onclick=async()=>{if(typeof Notification==='undefined')return toast('Notifications indisponibles.');try{const result=await Notification.requestPermission();db.notifications=(result==='granted');save();$('#notification-state').textContent=result==='granted'?'Autorisation active : rappel local au prochain accès à CONTROL si une échéance a expiré. Pas de push lorsque l’application est fermée.':'Permission non accordée.'}catch{toast('Permission non prise en charge.')}};
}
const getStorage=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch{return{}}};
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
function backup(){
 $('#main').innerHTML=view('Sauvegarde et récupération','Protéger les données de CONTROL et changer d’appareil',note('Le stockage local peut disparaître lors d’un nettoyage du navigateur. Télécharge une sauvegarde régulière. Le fichier contient éventuellement des liens vers des espaces privés : utilise un mot de passe si tu le transfères.')+
 box('Exporter les informations','<p class="muted">Exporte les données de CONTROL, les liens de projets et les brouillons d’automatisations. Les conversations réelles des IA ne sont pas exportées.</p><form id="export-data">'+field('Mot de passe de chiffrement facultatif (12 caractères minimum)','password','','password','autocomplete="new-password"')+'<button class="primary">Télécharger ma sauvegarde</button></form>')+
 box('Importer une sauvegarde','<p class="muted">L’import remplace les trois espaces de stockage locaux du navigateur. Conserve auparavant une copie de l’état actuel.</p><form id="import-data"><label>Fichier JSON<input class="field" name="file" type="file" required accept=".json,application/json"></label>'+field('Mot de passe du fichier','password','','password')+'<button>Vérifier et restaurer</button></form><p class="muted" id="import-status"></p>'));
 registerForm('#export-data',async f=>{const pw=String(f.get('password')||'');if(pw&&pw.length<12)return toast('12 caractères minimum ou champ vide.');try{const data=await pack({command:db,hub:getStorage(HUB),automations:getStorage(AUTOS)},pw);const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='CONTROL-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('Fichier téléchargé : conserve-le dans un emplacement sûr.')}catch{toast('Sauvegarde impossible sur ce navigateur.')}});
 registerForm('#import-data',async f=>{const file=f.get('file'),pw=String(f.get('password')||'');if(!file||typeof file.size!=='number'||file.size>4000000)return toast('Fichier requis, 4 Mo maximum.');try{const data=await unpack(JSON.parse(await file.text()),pw);if(!data?.command||!data?.hub||!data?.automations||!Array.isArray(data.command.actions)||!Array.isArray(data.command.missions))throw Error('Invalid');
 if(!confirm('Restaurer les données et remplacer les informations locales actuelles ?'))return;
 const old=[KEY,HUB,AUTOS].map(k=>[k,localStorage.getItem(k)]);
 try{localStorage.setItem(KEY,JSON.stringify(data.command));localStorage.setItem(HUB,JSON.stringify(data.hub));localStorage.setItem(AUTOS,JSON.stringify(data.automations))}catch(e){old.forEach(([k,v])=>{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)});throw e}
 init();$('#import-status').textContent='Données restaurées. Recharge CONTROL pour actualiser les projets.';toast('Sauvegarde importée.')}catch{$('#import-status').textContent='Import refusé : fichier incorrect, mot de passe erroné ou espace insuffisant. Aucun changement appliqué.'}});
}
function search(){const items=[...ctx.projects.map(p=>({t:p.name,s:'Projet',u:'#/project/'+encodeURIComponent(p.id)+'/ai'})),...db.actions.map(x=>({t:x.title,s:'Action · '+pname(x.project),u:'#/control/inbox'})),...db.missions.map(x=>({t:x.title,s:'Mission · '+pname(x.project),u:'#/control/missions'})),...db.decisions.map(x=>({t:x.title,s:'Décision · '+pname(x.project),u:'#/control/memory'})),...[...linksPage(),...(db.resources||[])].filter(x=>safe(x.url)).map(x=>({t:x.label,s:'Ressource · '+pname(x.project),u:x.url}))];
 $('#main').innerHTML=view('Recherche universelle','Trouver un projet, une mission, un document ou une décision',box('Chercher dans CONTROL','<label>Recherche<input id="global-search" type="search" class="field" placeholder="Un projet, une tâche, un fichier…"></label><div id="search-hits"></div>'+tiny('Ne recherche pas le texte privé des conversations ChatGPT, Claude ou Gemini.')));
 const draw=()=>{const q=$('#global-search').value.toLowerCase().trim(),res=items.filter(x=>(x.t+' '+x.s).toLowerCase().includes(q)).slice(0,65);$('#search-hits').innerHTML=res.length?res.map(x=>'<a class="link" href="'+h(x.u)+'" '+(x.u.startsWith('https:')?'target="_blank" rel="noopener noreferrer"':'')+'><span><strong>'+h(x.t)+'</strong><small>'+h(x.s)+'</small></span><span>→</span></a>').join(''):tiny('Aucun résultat.')};draw();$('#global-search').oninput=draw;
}
const SPRINT_IDS=['pack-pro','banque-ia','ucp','iagile','tcg'];
async function fetchSprints(force=false){
 if(sprintLoading)return sprintLoading;
 const toLoad=SPRINT_IDS.filter(id=>force||!sprintLoaded[id]);if(!toLoad.length)return;
 sprintLoading=Promise.allSettled(toLoad.map(async id=>{const r=await fetch('./data/sprints/'+id+'.json',{cache:'no-store'});if(!r.ok)throw Error('GitHub Pages '+r.status);const a=await r.json();if(!Array.isArray(a))throw Error('Format incompatible');
 const clean=a.filter(x=>x&&typeof x==='object'&&typeof x.summary==='string'&&x.ended_at);
 clean.sort((a,b)=>new Date(b.ended_at)-new Date(a.ended_at));
 sprints[id]=clean[0]||null;sprintLoaded[id]={checkedAt:new Date().toISOString(),entries:a.length};
 })).finally(()=>{sprintLoading=null});await sprintLoading;
}
function paintSprints(selector,onlyBlockers=false){const out=$(selector);if(!out)return;
 if(!Object.keys(sprintLoaded).length){out.innerHTML=tiny('Rapports publics non encore chargés.');return}
 const rows=SPRINT_IDS.flatMap(id=>{const s=sprints[id];if(!s||onlyBlockers&&!(s.blockers||[]).length)return[];return[{id,s}]});
 out.innerHTML=rows.length?rows.map(({id,s})=>'<div class="chatrow"><div><strong>'+h(pname(id))+'</strong><small>Sprint '+h(dt(s.ended_at||s.started_at))+' · source : GitHub public</small>'+
 (onlyBlockers?'<p>'+h((s.blockers||[]).slice(0,4).join(' · '))+'</p>':'<p>'+h(cap(s.summary,240))+'</p><small>Suite : '+h(cap(s.next,180))+'</small>')+
 '</div>'+href('https://github.com/'+OWNER+'/Avancement-Projet/blob/main/data/sprints/'+encodeURIComponent(id)+'.json','Preuve')+'</div>').join(''):tiny(onlyBlockers?'Aucun blocage dans les derniers rapports accessibles.':'Aucun sprint accessible.');
 const n=Object.keys(sprintLoaded).length;if(n<SPRINT_IDS.length)out.innerHTML+=tiny((SPRINT_IDS.length-n)+' source(s) non vérifiée(s), information potentiellement partielle.');
}
function render(input){ctx=input||ctx;init();try{const today=new Date().toISOString().slice(0,10),n=db.actions.filter(a=>a.status!=='done'&&a.due&&a.due<today).length;if(db.notifications&&n>0&&typeof Notification!=='undefined'&&Notification.permission==='granted'&&localStorage.getItem('control-notified-day')!==today){new Notification('CONTROL · Échéances',{body:n+' action(s) locale(s) en retard. Ouvre « À traiter ».',tag:'control-overdue'});localStorage.setItem('control-notified-day',today)}}catch{}const page=route().page;const pages={manager,tools,meetings,command,lab,inbox:intake,missions,calendar,activity,library,catalog,deploy,memory,budget,backup,settings,search};(pages[page]||manager)()}
window.CONTROL_CENTER={render};
})();