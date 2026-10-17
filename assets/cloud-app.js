/* CONTROL Cloud. Multi-user client. Needs an INDEPENDENT Supabase project and RLS migration.
   Public publishable key only. Never embed service_role, OAuth tokens or provider API secrets. */
const CONFIG_URL='./config/cloud.json';
const CDN='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm';
const byId=id=>document.getElementById(id);
const H=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL=s=>{try{const u=new URL(String(s||''));if(u.protocol!=='https:'||u.username||u.password)return'';if([...u.searchParams.keys()].some(k=>/^(token|access_token|refresh_token|password|secret|api_key|code|authorization)$/i.test(k)))return'';return u.href}catch{return''}};
const ext=(url,text)=>{const u=safeURL(url);return u?'<a class="iconlink" href="'+H(u)+'" target="_blank" rel="noopener noreferrer">'+H(text)+' ↗</a>':''};
const fmt=s=>{const t=new Date(s);return Number.isNaN(+t)?'Non renseigné':t.toLocaleString('fr-FR')};
const toISO=s=>{if(!s)return null;const t=new Date(s);return Number.isNaN(+t)?null:t.toISOString()};
const truncate=(s,n=210)=>String(s||'').length>n?String(s).slice(0,n)+'…':String(s||'');
const providers={ChatGPT:'https://chatgpt.com/',Claude:'https://claude.ai/',Gemini:'https://gemini.google.com/',Codex:'https://chatgpt.com/codex',Perplexity:'https://www.perplexity.ai/'};
const names={ai_space:'Espaces IA',conversation:'Conversations',resource:'Ressources',task:'Actions',mission:'Missions',automation:'Automatisations',report:'Bilans',decision:'Décisions',note:'Notes',event:'Échéances',expense:'Dépenses',income:'Revenus'};
const externalKinds=new Set(['ai_space','conversation','resource','automation']);
let client=null,authUser=null,cache={projects:[],items:[],preferences:null},page='projects',picked='',tab='ai_space',waiting=false,epoch=0,terms='',importing=false;
const getProject=x=>cache.projects.find(p=>p.id===x);
const projectName=id=>getProject(id)?.name||'Sans projet';
const items=(kind,projectId)=>cache.items.filter(x=>(!kind||x.kind===kind)&&(projectId===undefined||x.project_id===projectId));
const status=x=>({todo:'À faire',doing:'En cours',review:'À vérifier',done:'Terminée',paused:'En pause'})[x]||x||'Non renseigné';
const empty=t=>'<p class="empty">'+H(t)+'</p>';
const pill=t=>'<span class="pill">'+H(t)+'</span>';
const btn=(title,action,ref='',style='')=>'<button type="button" data-action="'+H(action)+'" data-id="'+H(ref)+'" class="'+H(style)+'">'+H(title)+'</button>';
const card=(title,desc,action,id)=>'<button class="card" type="button" data-action="'+H(action)+'" data-id="'+H(id)+'"><div class="badge">'+H(title.slice(0,2).toUpperCase())+'</div><strong>'+H(title)+'</strong><small>'+H(desc)+'</small></button>';
function message(s,bad=false){const el=byId('toast');el.textContent=s;el.hidden=false;el.style.background=bad?'#873c40':'#1f3653';clearTimeout(message.timer);message.timer=setTimeout(()=>el.hidden=true,4200)}
function live(s){const el=byId('status');el.textContent=s;el.hidden=false}
function visible(which){for(const id of ['setup','auth','workspace'])byId(id).hidden=id!==which;byId('status').hidden=true;byId('bottomnav').hidden=which!=='workspace';byId('account').hidden=which!=='workspace';byId('refresh').hidden=which!=='workspace'}
const panel=(title,body)=>'<section class="surface"><h2>'+H(title)+'</h2>'+body+'</section>';
const header=(title,desc,actions='')=>'<div class="bar"><div><div class="eyebrow">ESPACE PRIVÉ CONTROL</div><h1>'+H(title)+'</h1><p class="muted">'+H(desc)+'</p></div><div class="btnrow">'+actions+'</div></div>';
const options=(xs,current)=>xs.map(x=>'<option value="'+H(x[0])+'" '+(x[0]===current?'selected':'')+'>'+H(x[1])+'</option>').join('');
const projectsOpts=(current='',emptyLabel='Sans projet')=>options([[ '', emptyLabel],...cache.projects.map(p=>[p.id,p.name])],current);
const input=(label,name,val='',type='text',rest='')=>'<label>'+H(label)+'<input name="'+H(name)+'" type="'+H(type)+'" value="'+H(val)+'" '+rest+'></label>';
const area=(label,name,val='',rest='')=>'<label>'+H(label)+'<textarea name="'+H(name)+'" '+rest+'>'+H(val)+'</textarea></label>';
const choose=(label,name,xs,current='')=>'<label>'+H(label)+'<select name="'+H(name)+'">'+options(xs,current)+'</select></label>';
const projSelect=(current='',emptyLabel='Sans projet')=>'<label>Projet<select name="project_id">'+projectsOpts(current,emptyLabel)+'</select></label>';
const kindOpt=(current='task')=>choose('Type de contenu','kind',Object.entries(names).map(([k,v])=>[k,v]),current);
const providerOpt=(current='ChatGPT')=>choose('IA / fournisseur','provider',[...Object.keys(providers),...new Set(cache.items.filter(x=>x.kind==='ai_space').map(x=>x.provider).filter(Boolean))].map(x=>[x,x]).concat([['Autre','Autre']]),current);
function safeClientConfig(v){try{if(!v||v.enabled!==true)return false;const url=new URL(v.supabaseUrl);return url.protocol==='https:'&&/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)&&url.pathname==='/'&&typeof v.supabasePublishableKey==='string'&&/^(sb_publishable_[a-zA-Z0-9_-]+|eyJ[a-zA-Z0-9_.-]+)$/.test(v.supabasePublishableKey)&&!v.supabasePublishableKey.toLowerCase().includes('service_role')}catch{return false}}
async function boot(){live('Vérification de la configuration privée…');let cfg;
 try{const r=await fetch(CONFIG_URL,{cache:'no-store'});if(!r.ok)throw Error('not ready');cfg=await r.json();if(!safeClientConfig(cfg))throw Error('not configured')}catch{visible('setup');return}
 try{live('Initialisation de la connexion sécurisée…');const {createClient}=await import(CDN);client=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
 client.auth.onAuthStateChange((event,s)=>{if(event==='SIGNED_OUT'){epoch++;authUser=null;cache={projects:[],items:[],preferences:null};visible('auth');return}if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='USER_UPDATED'){setTimeout(()=>verifiedSession(),0)}});
 await verifiedSession();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&authUser)reload(true)});
 }catch{visible('setup');const p=byId('setup').querySelector('.muted');p.textContent='La configuration est prête, mais la bibliothèque sécurisée ou le fournisseur d’authentification n’est pas joignable. Aucun compte n’a été créé.'}}
async function verifiedSession(){const token=++epoch;try{const r=await client.auth.getUser();if(token!==epoch)return;if(r.error||!r.data?.user){authUser=null;cache={projects:[],items:[],preferences:null};visible('auth');return}const changed=authUser?.id!==r.data.user.id;authUser=r.data.user;if(changed){cache={projects:[],items:[],preferences:null};live('Chargement de votre espace privé…')}visible('workspace');await reload()}catch{if(token===epoch){authUser=null;cache={projects:[],items:[],preferences:null};visible('auth')}}}
async function reload(silent=false){if(!authUser||!client)return;if(waiting)return;waiting=true;byId('refresh').disabled=true;const owner=authUser.id;const token=epoch;
 try{const [p,i,pref]=await Promise.all([client.from('control_projects').select('*').order('created_at',{ascending:false}).limit(500),client.from('control_items').select('*').order('created_at',{ascending:false}).limit(2000),client.from('control_preferences').select('*').eq('owner_id',owner).maybeSingle()]);
 if(token!==epoch||!authUser||authUser.id!==owner)return;
 for(const r of [p,i,pref])if(r.error)throw Error('Accès à vos données refusé : '+r.error.message);
 cache={projects:p.data||[],items:i.data||[],preferences:pref.data||null};render();
 if(!silent)message('Espace synchronisé avec votre compte.');
 }catch(e){if(!silent)message(e.message||'Impossible de synchroniser vos données.',true);if(!cache.projects.length&&!cache.items.length)byId('page').innerHTML=panel('Connexion indisponible','<p>Les données privées n’ont pas pu être chargées. Réessaie après vérification de la configuration et des règles d’accès.</p>'+btn('Réessayer','refresh'))}
 finally{waiting=false;byId('refresh').disabled=false}}
function nav(where,pid='',newTab='ai_space'){page=where;picked=pid;tab=newTab;window.scrollTo?.(0,0);render()}
function render(){if(!authUser)return;const fns={projects:projectsPage,project:projectPage,inbox:inboxPage,missions:missionsPage,automations:automationsPage,manager:managerPage,tools:toolsPage,account:accountPage};byId('page').innerHTML=(fns[page]||projectsPage)();for(const b of document.querySelectorAll('#bottomnav button'))b.classList.toggle('active',(page==='project'?'projects':page)===b.dataset.page)}
function projectCard(p){const related=items(null,p.id),open=related.filter(x=>x.kind==='task'&&x.status!=='done').length;return card(p.name,(p.category||'Projet')+' · '+related.length+' élément(s) · '+open+' action(s)','open-project',p.id)}
function projectForm(){return '<form id="project-form">'+input('Nom du projet','name','','text','required minlength="2" maxlength="140"')+input('Catégorie','category','','text','maxlength="70" placeholder="Entreprise, formation, personnel…"')+area('Description et objectifs','description','','maxlength="6000"')+'<button class="primary" type="submit">Créer le projet</button></form>'}
function projectsPage(){return header('Mes projets','Chaque compte dispose de ses propres projets, ressources et IA.',btn('+ Nouveau projet','toggle-project-form')+' '+btn('Tous les outils','tools'))+
 '<div class="row"><input class="search" id="project-search" placeholder="Rechercher un projet…" type="search" aria-label="Rechercher"></div>'+
 '<section id="new-project" class="surface" hidden><h2>Créer un projet</h2>'+projectForm()+'</section>'+
 '<div id="project-list" class="grid">'+(cache.projects.length?cache.projects.map(projectCard).join(''):'')+'</div>'+
 (!cache.projects.length?panel('Bienvenue dans CONTROL Cloud',empty('Commence par créer un projet. Aucun projet personnel ne t’est attribué automatiquement.')+btn('Créer mon premier projet','toggle-project-form','', 'primary')):'')+
 panel('Accès rapide','<div class="btnrow">'+btn('Recherche universelle','tools','search')+btn('Ressources','tools','library')+btn('Calendrier','tools','calendar')+btn('Budgets','tools','budget')+btn('Mémoire','tools','memory')+'</div>')}
function projectPage(){const p=getProject(picked);if(!p)return projectsPage();const t=tab;const choices=[['ai_space','Espaces IA'],['conversation','Conversations'],['resource','Ressources'],['task','Actions'],['mission','Missions'],['automation','Automatisations'],['report','Bilans'],['decision','Décisions'],['note','Notes'],['event','Calendrier'],['expense','Budget'],['income','Revenus']];
 const relevant=items(t,p.id);return '<a class="back" href="#" data-action="projects">← Tous les projets</a>'+header(p.name,p.description||p.category||'Espace de travail privé',
 btn('+ Ajouter','toggle-item-form')+' '+btn('Modifier','edit-project',p.id))+
 '<div class="tabbar">'+choices.map(([key,label])=>'<button type="button" data-action="project-tab" data-id="'+key+'" class="'+(key===t?'selected':'')+'">'+label+'</button>').join('')+'</div>'+
 '<section id="new-item" class="surface" hidden><h2>Nouvel élément · '+H(names[t])+'</h2>'+itemForm(t,p.id)+'</section>'+
 '<div class="surface"><div class="row"><h2>'+H(names[t])+'</h2>'+pill(relevant.length+' élément(s)')+'</div>'+
 (relevant.length?relevant.map(itemRow).join(''):empty('Aucun élément dans cette catégorie. Ajoute une conversation, un dossier ou une tâche pour démarrer.'))+'</div>'+
 (t==='ai_space'?panel('Connecter vos projets ChatGPT, Claude et Gemini','<p class="muted">Associe ici les URL de tes espaces privés. Leur contenu reste dans l’application officielle du fournisseur. Les abonnements ChatGPT, Claude et Gemini ne donnent pas automatiquement accès à leurs API.</p><div class="btnrow">'+Object.entries(providers).map(([p,u])=>ext(u,'Ouvrir '+p)).join('')+'</div>'):'')+
 '<section id="project-editor" class="surface" hidden></section>'}
function itemForm(kind,proj='',item=null){const i=item||{},type=kind||'task',p=proj||i.project_id||'';
 return '<form data-form="save-item" data-record="'+H(i.id||'')+'"><input type="hidden" name="kind" value="'+H(type)+'"><input type="hidden" name="project_id" value="'+H(p)+'">'+
 input('Titre','title',i.title||'','text','required maxlength="200"')+
 providerOpt(i.provider||'ChatGPT')+
 input('URL du projet, document ou conversation (facultatif)','url',i.url||'','url','placeholder="https://…" maxlength="2100"')+
 area(type==='automation'?'Objectif et règles de l’automatisation':'Description, consignes, notes et résultat','body',i.body||'','rows="5" maxlength="30000"')+
 '<div class="formgrid">'+choose('Statut','status',[['','Non renseigné'],['todo','À faire'],['doing','En cours'],['review','À vérifier'],['done','Terminé'],['paused','En pause']],i.status||'')+
 input('Échéance / prochaine exécution (facultatif)','due_at',i.due_at?.slice(0,16)||'','datetime-local')+'</div>'+
 (type==='automation'?'<div class="formgrid">'+input('Modèle IA (si connu)','model',i.details?.model||'','text','maxlength="100" placeholder="Non vérifié"')+input('Quotas / type d’utilisation','quota',i.details?.quota||'','text','maxlength="160" placeholder="Non vérifié"')+'</div>'+area('Contraintes spécifiques','constraints',i.details?.constraints||'','rows="3" maxlength="6000"')+
 '<p class="hint">Cette fiche n’édite pas une automatisation réelle sur ChatGPT, Claude ou Gemini. Utilise son lien officiel pour la modifier.</p>':'')+
 '<button type="submit" class="primary">'+(item?'Enregistrer les modifications':'Ajouter à mon projet')+'</button></form>'}
function itemRow(i){return '<div class="item"><div><strong>'+H(i.title)+'</strong><span class="muted">'+H(i.provider||names[i.kind])+' · '+H(status(i.status))+' · '+fmt(i.updated_at)+'</span>'+
 (i.body?'<p>'+H(truncate(i.body,260))+'</p>':'')+(i.due_at?'<span class="muted">Échéance : '+fmt(i.due_at)+'</span>':'')+
 (i.kind==='automation'?'<span class="muted">Modèle : '+H(i.details?.model||'Non vérifié')+' · Quotas : '+H(i.details?.quota||'Non vérifiés')+'</span>':'')+'</div><div class="btnrow">'+ext(i.url,'Ouvrir')+btn('Éditer','edit-item',i.id,'small')+btn('×','delete-item',i.id,'danger small')+'</div></div>'}
function itemEditor(item){return '<div class="surface" id="inline-edit"><div class="row"><h2>Modifier · '+H(item.title)+'</h2>'+btn('Fermer','close-editor')+'</div>'+itemForm(item.kind,item.project_id,item)+'</div>'}
function summary(){const active=items('task').filter(x=>x.status!=='done').length,progress=items('mission').filter(x=>x.status!=='done').length,needs=items('mission').filter(x=>x.status==='review').length;return '<div class="stats"><div class="stat"><b>'+active+'</b><span>Actions ouvertes</span></div><div class="stat"><b>'+progress+'</b><span>Missions actives</span></div><div class="stat"><b>'+needs+'</b><span>À vérifier</span></div></div>'}
function inboxPage(){const list=items('task').filter(x=>x.status!=='done').sort((a,b)=>(a.due_at||'9999').localeCompare(b.due_at||'9999'));
 return header('À traiter','Toutes tes actions et validations enregistrées.')+summary()+panel('Boîte universelle',list.length?list.map(x=>'<div class="item"><div><strong>'+H(x.title)+'</strong><span class="muted">'+H(projectName(x.project_id))+' · '+H(status(x.status))+(x.due_at?' · '+fmt(x.due_at):'')+'</span></div><div class="btnrow">'+btn('Terminer','mark-done',x.id)+btn('Projet','open-project',x.project_id)+'</div></div>').join(''):empty('Aucune action ouverte enregistrée. Les notifications Gmail ou des IA ne sont pas encore synchronisées.'))+
 panel('Nouvelle action','<form data-form="save-item">'+input('Action','title','','text','required maxlength="200"')+projSelect('','Aucun projet')+'<input type="hidden" name="kind" value="task">'+input('Échéance','due_at','','datetime-local')+area('Instructions et preuve','body','','maxlength="30000"')+'<button class="primary" type="submit">Ajouter à la boîte</button></form>')+
 '<div class="hint">Il s’agit d’une boîte de réception CONTROL ; l’accès aux messages Gmail, aux tâches privées ChatGPT et aux alertes Claude exige des connexions supplémentaires.</div>'}
function missionsPage(){const list=items('mission');return header('Missions multi-IA','Préparer les missions et retrouver leur statut dans tous les projets.')+summary()+
 panel('Nouvelle mission','<form data-form="save-item">'+input('Mission','title','','text','required maxlength="200"')+projSelect('', 'Choisir un projet')+'<input type="hidden" name="kind" value="mission">'+providerOpt()+area('Consignes à transmettre','body','','required maxlength="30000"')+'<input type="hidden" name="status" value="todo"><button type="submit" class="primary">Enregistrer la mission</button></form>')+
 panel('Suivi des missions',list.length?list.map(i=>'<div class="item"><div><strong>'+H(i.title)+'</strong><span class="muted">'+H(projectName(i.project_id))+' · '+H(i.provider||'IA')+' · '+H(status(i.status))+'</span><p>'+H(truncate(i.body,300))+'</p></div><div class="btnrow">'+btn('Copier','copy-mission',i.id)+btn('Modifier','edit-item',i.id)+ext(providers[i.provider]||'',i.provider||'IA')+'</div></div>').join(''):empty('Aucune mission enregistrée.'))+'<div id="edit-slot"></div>'+
 panel('Orchestration','<p class="muted">Lance une IA depuis son application officielle. CONTROL ne dispose pas ici d’accès API aux abonnements privés et ne peut pas envoyer automatiquement des instructions à tous les fournisseurs.</p>'+btn('Préparer la répartition de quatre missions','mission-template'))}
function automationsPage(){const list=items('automation');return header('Automatisations','Inventaire personnel des tâches par IA ; modifications réelles chez le fournisseur.')+
 '<div class="grid">'+Object.entries(providers).map(([p,u])=>'<div class="card"><strong>'+H(p)+'</strong><small>'+list.filter(x=>x.provider===p).length+' automatisation(s) référencée(s)</small><div style="margin-top:16px">'+ext(u,'Gérer chez '+p)+'</div></div>').join('')+'</div>'+
 panel('Référencer une automatisation','<form data-form="save-item">'+input('Nom','title','','text','required maxlength="200"')+projSelect('', 'Sans projet')+'<input type="hidden" name="kind" value="automation">'+providerOpt()+input('Lien vers la tâche / conversation','url','','url')+
 area('Objectif et règles','body','','required maxlength="30000"')+'<div class="formgrid">'+input('Modèle (si connu)','model','','text','maxlength="100"')+input('Quotas / type d’utilisation','quota','','text','maxlength="160"')+'</div>'+area('Contraintes','constraints','','rows="3" maxlength="6000"')+input('Prochaine exécution','due_at','','datetime-local')+'<button class="primary">Enregistrer la fiche</button></form>')+
 panel('Automatisations associées',list.length?list.map(itemRow).join(''):empty('Aucune tâche planifiée renseignée. Rien n’est synchronisé automatiquement avec les comptes IA.'))+'<div id="edit-slot"></div>'}
function managerPage(){const projects=cache.projects,checks=items('report'),tasks=items('task'),missions=items('mission');
 let body='<div class="hint">Synthèse vérifiable des données de ce compte CONTROL. Ce n’est pas un modèle IA : les conversations privées de ChatGPT, Claude, Gemini et Codex ne sont pas automatiquement lues.</div>'+
 summary()+panel('Chef de projet central','<form id="manager-form">'+choose('Projet','project',[['','Tous les projets'],...projects.map(p=>[p.id,p.name])],'')+
 input('Votre question','question','','text','required maxlength="800" placeholder="Où en est UCP ? Que reste-t-il à faire ?"')+'<div class="btnrow"><button class="primary">Faire le point</button>'+btn('Copier un contexte pour ChatGPT','copy-context')+'</div></form><div id="manager-output"></div>')+
 panel('Derniers bilans disponibles',checks.length?checks.slice(0,12).map(x=>'<div class="item"><div><strong>'+H(x.title)+'</strong><span class="muted">'+H(projectName(x.project_id))+' · '+H(x.provider)+' · '+fmt(x.created_at)+'</span><p>'+H(truncate(x.body,360))+'</p></div>'+ext(x.url,'Source')+'</div>').join(''):empty('Aucun bilan enregistré. Ajoute les comptes rendus autorisés de tes IA depuis les projets.'));
 return header('CONTROL IA','Coordination centrale de tes propres données.')+body}
function managerAnswer(question,proj){const chosen=proj?[getProject(proj)].filter(Boolean):cache.projects;const q=question.toLowerCase();let out='SYNTHÈSE DES DONNÉES CONTROL\n\n';
 for(const p of chosen.slice(0,30)){const group=cache.items.filter(x=>x.project_id===p.id),done=group.filter(x=>x.kind==='task'&&x.status==='done').length,remaining=group.filter(x=>x.kind==='task'&&x.status!=='done').length,ms=group.filter(x=>x.kind==='mission'),reports=group.filter(x=>x.kind==='report').slice(0,3);
 out+=p.name+'\n• Actions : '+remaining+' ouvertes, '+done+' terminées dans CONTROL.\n• Missions : '+ms.filter(x=>x.status!=='done').length+' en cours/à lancer.\n';
 if(q.includes('priorit')||q.includes('faire')||q.includes('suite'))out+='• Priorités renseignées : '+group.filter(x=>x.kind==='task'&&x.status!=='done').slice(0,5).map(x=>x.title).join(' ; ')+'\n';
 for(const r of reports)out+='• Bilan '+r.provider+' ('+fmt(r.updated_at)+') : '+truncate(r.body,260)+'\n';
 if(!reports.length)out+='• Aucun compte rendu IA enregistré dans ce compte.\n';
 out+='\n'}
 if(!chosen.length)out+='Aucun projet personnel disponible.\n';
 return out+'Source : données privées de ton compte CONTROL uniquement. Aucun accès automatique aux historiques privés des autres fournisseurs. Les résultats manuels nécessitent une vérification indépendante.'}

let toolTab='library',searchFilter='';
function toolsPage(){
 const tabs=[['library','Ressources'],['calendar','Calendrier'],['budget','Finances'],['memory','Décisions'],['search','Recherche'],['backup','Sauvegardes']];
 let body='<div class="tabbar">'+tabs.map(([key,label])=>'<button data-action="tool-tab" data-id="'+key+'" class="'+(toolTab===key?'selected':'')+'">'+label+'</button>').join('')+'</div>';
 if(toolTab==='library'){
  const list=items('resource').filter(x=>(x.title+' '+x.url+' '+projectName(x.project_id)).toLowerCase().includes(searchFilter.toLowerCase()));
  body+=panel('Bibliothèque · tous les projets',
   '<input id="tool-search" type="search" value="'+H(searchFilter)+'" placeholder="Rechercher un titre ou un lien…" aria-label="Recherche documentaire">'+
   '<div id="tool-results">'+(list.length?list.map(itemRow).join(''):empty('Aucune ressource correspondante.'))+'</div>')+
   panel('Ajouter une ressource','<form data-form="save-item">'+input('Nom','title','','text','required maxlength="200"')+projSelect()+
   '<input name="kind" value="resource" type="hidden">'+input('Adresse du document','url','','url','required placeholder="https://drive.google.com/…"')+
   '<button class="primary">Ajouter le document</button></form>')+
   panel('Services externes','<div class="btnrow">'+ext('https://drive.google.com/','Google Drive')+ext('https://github.com/','GitHub')+
   '</div><p class="muted">Les fichiers privés ne sont pas synchronisés depuis ces services.</p>');
 }
 else if(toolTab==='calendar'){
  const records=items('event').sort((a,b)=>(a.due_at||'9999').localeCompare(b.due_at||'9999'));
  body+=panel('Événements et échéances',records.length?records.map(itemRow).join(''):empty('Aucun événement enregistré.'))+
   panel('Nouvel événement','<form data-form="save-item">'+input('Événement','title','','text','required maxlength="200"')+projSelect()+
   '<input type="hidden" name="kind" value="event">'+input('Date et heure','due_at','','datetime-local','required')+
   area('Préparation et notes','body')+'<button class="primary">Enregistrer</button></form>')+
   panel('Calendriers externes','<div class="btnrow">'+ext('https://calendar.google.com/','Google Agenda')+
   ext('https://chatgpt.com/scheduled','Tâches ChatGPT')+'</div><p class="muted">La synchronisation des calendriers privés n’est pas encore activée.</p>');
 }
 else if(toolTab==='budget'){
  const expenses=items('expense'),income=items('income'),sum=xs=>xs.reduce((a,x)=>a+Number(x.details?.amount||0),0);
  const entries=[...expenses,...income];
  body+='<div class="stats"><div class="stat"><b>'+sum(expenses).toFixed(2)+' €</b><span>Dépenses saisies</span></div>'+
   '<div class="stat"><b>'+sum(income).toFixed(2)+' €</b><span>Revenus saisis</span></div>'+
   '<div class="stat"><b>'+(sum(income)-sum(expenses)).toFixed(2)+' €</b><span>Solde déclaré</span></div></div>';
  body+=panel('Suivi financier',entries.length?entries.map(x=>'<div class="item"><div><strong>'+H(x.title)+'</strong>'+
   '<span class="muted">'+H(projectName(x.project_id))+' · '+H(names[x.kind])+'</span></div>'+
   '<span>'+Number(x.details?.amount||0).toFixed(2)+' €</span></div>').join(''):empty('Aucun montant saisi.'));
  body+=panel('Déclarer un montant','<form data-form="save-item">'+input('Libellé','title','','text','required maxlength="200"')+projSelect()+
   choose('Type','kind',[['expense','Dépense'],['income','Revenu']],'expense')+
   input('Montant (€)','amount','','number','required min="0" step="0.01" max="1000000"')+
   '<button class="primary">Enregistrer</button></form>')+
   '<div class="hint">Données déclaratives uniquement. Aucun accès bancaire ni suivi réel des tokens des fournisseurs.</div>';
 }
 else if(toolTab==='memory'){
  const ds=items('decision');
  body+=panel('Historique des décisions',ds.length?ds.map(itemRow).join(''):empty('Aucune décision enregistrée.'))+
   panel('Ajouter une décision','<form data-form="save-item">'+input('Décision','title','','text','required maxlength="200"')+projSelect()+
   '<input type="hidden" name="kind" value="decision">'+area('Justification et conséquence','body','','required maxlength="30000"')+
   input('Source ou compte rendu','url','','url')+'<button class="primary">Enregistrer</button></form>');
 }
 else if(toolTab==='search'){
  const list=[...cache.projects.map(p=>({title:p.name,id:p.id,type:'project',description:'Projet'})),
   ...cache.items.map(x=>({title:x.title,id:x.id,type:'item',description:names[x.kind]+' · '+projectName(x.project_id)}))];
  const found=list.filter(x=>(x.title+' '+x.description).toLowerCase().includes(searchFilter.toLowerCase())).slice(0,100);
  body+=panel('Recherche universelle','<input id="tool-search" type="search" value="'+H(searchFilter)+'" placeholder="Projet, mission, document, décision…" aria-label="Recherche universelle">'+
   '<div id="tool-results">'+(found.length?found.map(x=>'<div class="item"><div><strong>'+H(x.title)+'</strong><span class="muted">'+H(x.description)+
   '</span></div>'+btn('Ouvrir',x.type==='project'?'open-project':'open-item',x.id)+'</div>').join(''):empty('Aucun résultat.'))+
   '</div><p class="muted">N’indexe pas les conversations privées des IA.</p>');
 }
 else if(toolTab==='backup'){
  body+=panel('Exporter votre compte','<p class="muted">Le fichier exporté contient des liens et informations privées. Conservez-le en lieu sûr.</p>'+
   '<div class="btnrow">'+btn('Exporter un JSON chiffré','export-encrypted')+btn('Exporter en clair','export-json')+'</div>')+
   panel('Importer mes projets historiques','<p class="muted">Import volontaire uniquement si les données de l’ancien CONTROL vous appartiennent. Aucune suppression automatique.</p>'+
   btn('Importer mon ancien CONTROL','import-legacy'));
 }
 return header('Tous les outils','Ressources, agenda, budgets, décisions, sauvegardes.')+body+'<div id="tool-editor"></div>';
}
function accountPage(){
 return header('Mon compte',authUser?.email||'Compte utilisateur')+
 panel('Connexion','<p>Adresse : <strong>'+H(authUser?.email||'')+'</strong></p>'+
 '<p class="muted">Identifiant : '+H(authUser?.id||'')+'</p><div class="btnrow">'+btn('Actualiser','refresh')+btn('Déconnexion','logout')+'</div>')+
 panel('Confidentialité','<p>Chaque projet est rattaché à son propriétaire via les règles d’accès RLS de la base de données.</p>'+
 '<p class="muted">Les liens vers les IA ne constituent pas une connexion API. Les droits Google ne sont pas accordés automatiquement par la connexion au compte.</p>')+
 panel('Données personnelles',btn('Exporter mes données','export-json')+' '+btn('Importer mon ancien espace','import-legacy')+
 '<p class="muted">La suppression complète d’un compte doit être mise en service après vérification de la procédure côté serveur ; les inscriptions publiques resteront désactivées tant qu’elle n’est pas prête.</p>');
}
