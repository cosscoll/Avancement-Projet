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
let client=null,cloudConfig=null,authUser=null,cache={projects:[],items:[],preferences:null},page='projects',picked='',tab='ai_space',waiting=false,waitingOwner=null,epoch=0,terms='',importing=false,cloudProjectsAll=false;
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
const providerOpt=(current='ChatGPT')=>choose('IA / fournisseur','provider',[...new Set([...Object.keys(providers),...cache.items.filter(x=>x.kind==='ai_space').map(x=>x.provider).filter(Boolean),'Autre'])].map(x=>[x,x]),current);
function safeClientConfig(v){try{if(!v||v.enabled!==true)return false;const url=new URL(v.supabaseUrl);return url.protocol==='https:'&&/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)&&url.pathname==='/'&&typeof v.supabasePublishableKey==='string'&&/^(sb_publishable_[a-zA-Z0-9_-]+|eyJ[a-zA-Z0-9_.-]+)$/.test(v.supabasePublishableKey)&&!v.supabasePublishableKey.toLowerCase().includes('service_role')}catch{return false}}
async function boot(){live('Vérification de la configuration privée…');let cfg;
 try{const r=await fetch(CONFIG_URL,{cache:'no-store'});if(!r.ok)throw Error('not ready');cfg=await r.json();if(!safeClientConfig(cfg))throw Error('not configured');cloudConfig=cfg;byId('google-login').hidden=(cfg.allowGoogleLogin!==true);if(cfg.allowRegistration!==true){document.querySelector('.auth-box h2').textContent='Se connecter à la bêta';document.querySelector('.auth-box .muted').textContent='Accès sur invitation uniquement. Les inscriptions publiques ne sont pas encore ouvertes.'}}catch{visible('setup');return}
 try{live('Initialisation de la connexion sécurisée…');const {createClient}=await import(CDN);client=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
 client.auth.onAuthStateChange((event,s)=>{if(event==='SIGNED_OUT'){window.CONTROL_HELP?.reset();epoch++;authUser=null;waiting=false;waitingOwner=null;cache={projects:[],items:[],preferences:null};byId('page').innerHTML='';visible('auth');return}if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED'||event==='USER_UPDATED'){setTimeout(()=>verifiedSession(),0)}});
 await verifiedSession();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&authUser)reload(true)});
 }catch{visible('setup');const p=byId('setup').querySelector('.muted');p.textContent='La configuration est prête, mais la bibliothèque sécurisée ou le fournisseur d’authentification n’est pas joignable. Aucun compte n’a été créé.'}}
async function verifiedSession(){const token=++epoch;try{const r=await client.auth.getUser();if(token!==epoch)return;if(r.error||!r.data?.user){authUser=null;waiting=false;waitingOwner=null;cache={projects:[],items:[],preferences:null};byId('page').innerHTML='';visible('auth');return}const changed=authUser?.id!==r.data.user.id;authUser=r.data.user;if(changed){window.CONTROL_HELP?.reset();waiting=false;waitingOwner=null;cache={projects:[],items:[],preferences:null};byId('page').innerHTML=panel('Connexion sécurisée','<p class="muted">Chargement des données du compte…</p>');live('Chargement de votre espace privé…')}visible('workspace');await reload()}catch{if(token===epoch){authUser=null;waiting=false;waitingOwner=null;cache={projects:[],items:[],preferences:null};byId('page').innerHTML='';visible('auth')}}}
async function reload(silent=false){if(!authUser||!client)return;const owner=authUser.id;if(waiting&&waitingOwner===owner)return;waiting=true;waitingOwner=owner;byId('refresh').disabled=true;const token=epoch;
 try{const [p,i,pref]=await Promise.all([client.from('control_projects').select('*').order('created_at',{ascending:false}).limit(500),client.from('control_items').select('*').order('created_at',{ascending:false}).limit(2000),client.from('control_preferences').select('*').eq('owner_id',owner).maybeSingle()]);
 if(token!==epoch||!authUser||authUser.id!==owner)return;
 for(const r of [p,i,pref])if(r.error)throw Error('Accès à vos données refusé : '+r.error.message);
 cache={projects:p.data||[],items:i.data||[],preferences:pref.data||null};render();
 if(!silent)message('Espace synchronisé avec votre compte.');
 }catch(e){if(token!==epoch||authUser?.id!==owner)return;if(!silent)message(e.message||'Impossible de synchroniser vos données.',true);if(!cache.projects.length&&!cache.items.length)byId('page').innerHTML=panel('Connexion indisponible','<p>Les données privées n’ont pas pu être chargées. Réessaie après vérification de la configuration et des règles d’accès.</p>'+btn('Réessayer','refresh'))}
 finally{if(waitingOwner===owner){waiting=false;waitingOwner=null;byId('refresh').disabled=false}}}
function nav(where,pid='',newTab='ai_space'){page=where;picked=pid;tab=newTab;window.scrollTo?.(0,0);render()}
function render(){if(!authUser)return;document.querySelectorAll('#bottomnav [data-page]').forEach(b=>{const k=b.dataset.page;const active=k==='projects'&&(page==='projects'||page==='project')||k==='inbox'&&page==='inbox'||k==='manager'&&page==='manager'||k==='tools'&&!['projects','project','inbox','manager'].includes(page);b.setAttribute('aria-current',active?'page':'false')});const fns={projects:projectsPage,project:projectPage,inbox:inboxPage,missions:missionsPage,automations:automationsPage,manager:managerPage,tools:toolsPage,account:accountPage,catalog:catalogPage,deploy:deployPage,lab:labPage};byId('page').innerHTML=(fns[page]||projectsPage)();
 if(page==='lab'){
  const root=byId('lab-root');if(!window.CONTROL_LAB){root.textContent='Laboratoire IA indisponible. Actualise la page.';return}
  window.CONTROL_LAB.mount(root,{mode:'cloud',projectId:picked,projects:cache.projects,
   getProject:(projectId)=>{
    const p=getProject(projectId);if(!p)return{};
    const rows=cache.items.filter(x=>x.project_id===projectId);
    return{context:[
      ...rows.filter(x=>x.kind==='task'&&x.status!=='done').slice(0,5).map(x=>'Action ouverte : '+x.title+' ('+x.status+')'),
      ...rows.filter(x=>x.kind==='mission'&&x.status!=='done').slice(0,4).map(x=>'Mission '+x.provider+' : '+x.title+' ('+x.status+')'),
      ...rows.filter(x=>x.kind==='decision').slice(0,3).map(x=>'Décision : '+x.title+' — '+String(x.body||'').slice(0,140))
    ],reports:rows.filter(x=>x.kind==='report').slice(0,3).map(x=>x.provider+' : '+x.body)}
   },
   providerURL:(projectId,provider)=>cache.items.find(x=>x.project_id===projectId&&x.kind==='ai_space'&&x.provider===provider&&safeURL(x.url))?.url||providers[provider]||'',
   saveMission:async({projectId,provider,title,instruction})=>{
    const owner=authUser?.id;if(!owner||!getProject(projectId))throw Error('Connecte-toi à ton projet avant de créer la mission.');
    if(instruction.length>29000)throw Error('Brief trop long pour la base de données CONTROL Cloud.');
    if(cache.items.some(x=>x.project_id===projectId&&x.kind==='mission'&&x.provider===provider&&x.body===instruction))return false;
    const row={owner_id:owner,project_id:projectId,kind:'mission',title:String(title).slice(0,200),body:instruction,provider,status:'todo'};
    const result=await client.from('control_items').insert(row).select('id').single();
    if(result.error)throw Error('Enregistrement impossible : '+result.error.message);
    if(authUser?.id===owner)await reload(true);
    return true;
   }
  });return;
 }
 if(page==='catalog'||page==='deploy'){
  const root=byId(page==='catalog'?'catalog-root':'deploy-root');
  const extension=page==='catalog'?window.CONTROL_TOOL_CATALOG:window.CONTROL_DEPLOY_GUIDES;
  if(!extension){root.innerHTML='<div class="hint">Les ressources sont momentanément indisponibles. Réessaie plus tard.</div>';return}
  extension.mount(root,{mode:'cloud',projectId:picked,projects:cache.projects,
   onOpenDeploy:(project)=>nav('deploy',project||''),
   isSaved:(tool,project)=>cache.items.some(x=>x.project_id===project&&x.kind==='resource'&&(x.details?.catalogToolId===tool.id||x.url===tool.url)),
   onAdd:async (tool,project)=>{
    if(!authUser||!cache.projects.some(p=>p.id===project))throw Error('Sélectionne un projet de ton compte.');
    if(cache.items.some(x=>x.project_id===project&&x.kind==='resource'&&(x.details?.catalogToolId===tool.id||x.url===tool.url)))return false;
    const owner=authUser.id,object={owner_id:owner,project_id:project,kind:'resource',title:tool.name,provider:'CONTROL Bibliothèque',url:tool.url,body:(tool.summary||'')+(tool.useCase?'\nCas pratique : '+tool.useCase:''),details:{catalogToolId:tool.id,category:tool.category,course:tool.courses?.[0]||''}};
    const result=await client.from('control_items').insert(object).select('*').single();if(result.error)throw Error('Enregistrement refusé : '+result.error.message);
    if(authUser?.id!==owner)return true;
    cache.items.unshift(result.data);message('Outil enregistré dans les ressources du projet.');return true;
   }
  });
 }for(const b of document.querySelectorAll('#bottomnav button'))b.classList.toggle('active',(page==='project'?'projects':page)===b.dataset.page)}
function projectCard(p){const related=items(null,p.id),open=related.filter(x=>x.kind==='task'&&x.status!=='done').length;return card(p.name,(p.category||'Projet')+' · '+related.length+' élément(s) · '+open+' action(s)','open-project',p.id)}
function projectForm(){return '<form id="project-form">'+input('Nom du projet','name','','text','required minlength="2" maxlength="140"')+input('Catégorie','category','','text','maxlength="70" placeholder="Entreprise, formation, personnel…"')+area('Description et objectifs','description','','maxlength="6000"')+'<button class="primary" type="submit">Créer le projet</button></form>'}
function projectsPage(){
 const recent=cache.projects.slice().sort((a,b)=>(b.updated_at||'').localeCompare(a.updated_at||''));
 const visible=cloudProjectsAll?recent:recent.slice(0,6);
 return header('Mes projets','Retrouve ton travail et tes IA.',btn('+ Nouveau projet','toggle-project-form')+' '+btn('Tous les outils','tools'))+
 '<section class="clarity-shortcuts"><button class="clarity-shortcut" data-action="inbox"><strong>À traiter</strong><span>Mes priorités →</span></button><button class="clarity-shortcut" data-action="lab"><strong>Créer avec une IA</strong><span>Préparer un brief →</span></button><button class="clarity-shortcut" data-action="tools"><strong>Tous les outils</strong><span>Explorer à mon rythme →</span></button></section>'+
 '<div class="row clarity-listhead"><h2>Projets <span class="clarity-count">'+cache.projects.length+'</span></h2></div>'+
 '<div class="row"><input class="search" id="project-search" placeholder="Rechercher un projet…" type="search" aria-label="Rechercher un projet"></div>'+
 '<section id="new-project" class="surface" hidden><h2>Créer un projet</h2>'+projectForm()+'</section>'+
 '<div id="project-list" class="grid clarity-cards">'+(visible.length?visible.map(projectCard).join(''):'')+'</div>'+
 (!cache.projects.length?panel('Commencer dans CONTROL',empty('Crée ton premier projet pour y organiser tes IA et ressources.')+btn('Créer mon projet','toggle-project-form','', 'primary')):'')+
 (cache.projects.length>6?'<div class="clarity-more">'+btn(cloudProjectsAll?'Afficher moins de projets':'Afficher tous les projets ('+cache.projects.length+')','projects-more')+'</div>':'');
}
function projectPage(){
 const p=getProject(picked);if(!p)return projectsPage();const t=tab;
 const choices=[['ai_space','Espaces IA'],['conversation','Conversations'],['task','Actions'],['resource','Ressources']];
 const additional=[['mission','Missions'],['automation','Automatisations'],['report','Bilans'],['decision','Décisions'],['note','Notes'],['event','Calendrier'],['expense','Budget'],['income','Revenus']];
 const advanced=additional.some(x=>x[0]===t);
 const relevant=items(t,p.id);return '<a class="back" href="#" data-action="projects">← Tous les projets</a>'+header(p.name,p.description||p.category||'Espace de travail privé',
 btn('+ Ajouter','toggle-item-form')+' '+btn('Modifier','edit-project',p.id))+
 '<div class="clarity-work-nav"><div class="tabbar">'+choices.map(([key,label])=>'<button type="button" data-action="project-tab" data-id="'+key+'" class="'+(key===t?'selected':'')+'">'+label+'</button>').join('')+'</div>'+ '<details class="clarity-more-tabs" '+(advanced?'open':'')+'><summary>Plus'+(advanced?' · '+H(additional.find(x=>x[0]===t)?.[1]):'')+'</summary><div class="clarity-advanced">'+additional.map(([key,label])=>'<button type="button" data-action="project-tab" data-id="'+key+'" aria-current="'+(key===t?'page':'false')+'">'+label+'</button>').join('')+'</div></details></div>'+
 '<section id="new-item" class="surface" hidden><h2>Nouvel élément · '+H(names[t])+'</h2>'+itemForm(t,p.id)+'</section>'+
 '<div class="surface"><div class="row"><h2>'+H(names[t])+'</h2>'+pill(relevant.length+' élément(s)')+'</div>'+
 (relevant.length?relevant.map(itemRow).join(''):empty('Aucun élément dans cette catégorie. Ajoute une conversation, un dossier ou une tâche pour démarrer.'))+'</div>'+
 (t==='ai_space'?panel('Connecter vos projets ChatGPT, Claude et Gemini','<p class="muted">Associe ici les URL de tes espaces privés. Leur contenu reste dans l’application officielle du fournisseur. Les abonnements ChatGPT, Claude et Gemini ne donnent pas automatiquement accès à leurs API.</p><div class="btnrow">'+Object.entries(providers).map(([p,u])=>ext(u,'Ouvrir '+p)).join('')+'</div>'):'')+
 panel('Outils du projet','<details class="clarity-project-toolset"><summary>Outils supplémentaires et mise en ligne</summary><div class="btnrow">'+btn('Laboratoire IA','lab',p.id)+btn('Bibliothèques IA','catalog',p.id)+btn('Mettre en ligne','deploy',p.id)+'</div></details>')+
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

let toolTab='lab',searchFilter='';
function toolsPage(){
 const groups=[
  ['Créer et publier',[['lab','Laboratoire IA'],['catalog','Bibliothèques IA'],['deploy','Mise en ligne']]],
  ['Organiser',[['library','Ressources'],['calendar','Calendrier'],['memory','Décisions']]],
  ['Suivre et protéger',[['budget','Finances'],['search','Recherche'],['backup','Sauvegardes']]]
 ];
 let body='<div class="clarity-cloud-tools">'+groups.map(([group,links])=>
  '<details class="clarity-toolgroup" '+(links.some(([key])=>key===toolTab)?'open':'')+'><summary><strong>'+H(group)+'</strong><span class="clarity-chevron">⌄</span></summary><div class="clarity-toolcards">'+
  links.map(([key,label])=>'<button type="button" class="clarity-tool-link" data-action="tool-tab" data-id="'+key+'" aria-current="'+(toolTab===key?'page':'false')+'"><strong>'+H(label)+'</strong><span aria-hidden="true">→</span></button>').join('')+'</div></details>'
 ).join('')+'</div>';
 if(toolTab==='lab'){body+=panel('Atelier de production IA','<p>Briefs avec contexte, comparaison des réponses, audit HTML, contrôle JSON, versions, recettes et masquage des secrets.</p>'+btn('Ouvrir le Laboratoire','lab','','primary'));}
 else if(toolTab==='catalog'){body+=panel('Bibliothèques IAgile','<p>Explore 87 outils IA : moteurs 3D, agents, automatisations, recherche et productivité.</p>'+btn('Explorer les bibliothèques','catalog','','primary'));}
 else if(toolTab==='deploy'){body+=panel('Guides de publication','<p>10 tutoriels détaillés pour GitHub Pages, IONOS, Vercel, Netlify, Cloudflare Pages et autres hébergeurs. Prompts IA et checklist de production.</p>'+btn('Voir les guides de mise en ligne','deploy','','primary'));}
 else if(toolTab==='library'){
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
function deployPage(){return header('Mettre mon site en ligne','Tutoriels GitHub Pages, IONOS, Vercel et autres hébergeurs.')+'<div id="deploy-root"></div>'}
function labPage(){return header('Laboratoire IA','Outils de production, de contrôle qualité et de comparaison des réponses.')+'<div id="lab-root"></div>'}
function catalogPage(){return header('Bibliothèques IA','Outils pratiques et frameworks, en complément des quatre formations IAgile.')+'<div id="catalog-root"></div>'}
function accountPage(){
 return header('Mon compte',authUser?.email||'Compte utilisateur')+
 panel('Connexion','<p>Adresse : <strong>'+H(authUser?.email||'')+'</strong></p>'+
 '<p class="muted">Identifiant : '+H(authUser?.id||'')+'</p><div class="btnrow">'+btn('Actualiser','refresh')+btn('Déconnexion','logout')+'</div>')+
 panel('Confidentialité','<p>Chaque projet est rattaché à son propriétaire via les règles d’accès RLS de la base de données.</p>'+
 '<p class="muted">Les liens vers les IA ne constituent pas une connexion API. Les droits Google ne sont pas accordés automatiquement par la connexion au compte.</p>')+
 panel('Données personnelles',btn('Exporter mes données','export-json')+' '+btn('Importer mon ancien espace','import-legacy')+
 (cloudConfig?.accountDeletionEnabled===true?'<div class="hint">Suppression définitive : le compte et ses données ne pourront pas être restaurés.</div>'+btn('Supprimer définitivement mon compte','delete-account','','danger'):'<p class="muted">La suppression complète d’un compte nécessite une procédure serveur vérifiée. Elle n’est pas encore activée.</p>'));
}

function itemPayload(form,existing=null){
 const kind=String(form.get('kind')||'').trim(),title=String(form.get('title')||'').trim(),url=String(form.get('url')||'').trim();
 if(!names[kind]||!title||title.length>200)throw Error('Nom ou type invalide.');
 if(url&&!safeURL(url))throw Error('URL HTTPS sans jeton nécessaire.');
 const project_id=String(form.get('project_id')||'').trim()||null;
 if(project_id&&!getProject(project_id))throw Error('Projet indisponible sur ce compte.');
 const body=String(form.get('body')||'');if(body.length>30000)throw Error('Description trop longue.');
 const details={...(existing?.details||{})};
 if(kind==='automation'){details.model=String(form.get('model')||'Non vérifié').slice(0,100);details.quota=String(form.get('quota')||'Non vérifié').slice(0,160);details.constraints=String(form.get('constraints')||'').slice(0,6000)}
 if(kind==='income'||kind==='expense'){const amount=Number(form.get('amount')??details.amount??0);if(!Number.isFinite(amount)||amount<0||amount>1000000)throw Error('Montant invalide.');details.amount=amount}
 return {owner_id:authUser.id,project_id,kind,title,url:url?safeURL(url):'',body,provider:String(form.get('provider')||'').slice(0,60),status:String(form.get('status')||'').slice(0,35),due_at:toISO(form.get('due_at')),details,updated_at:new Date().toISOString()};
}
async function audit(action,kind,id){try{await client.from('control_audit_events').insert({owner_id:authUser.id,action,entity_type:kind,entity_id:id})}catch{/* best-effort client log only */}}
async function saveItem(form,editing=''){
 const old=editing?cache.items.find(i=>i.id===editing):null;
 if(editing&&!old)throw Error('Fiche introuvable : actualise les données.');
 const payload=itemPayload(form,old);
 if(old&&old.kind!==payload.kind)throw Error('Il faut créer un nouvel élément pour changer de type.');
 let q;
 if(old)q=await client.from('control_items').update(payload).eq('id',old.id).eq('owner_id',authUser.id).eq('updated_at',old.updated_at).select('*').single();
 else q=await client.from('control_items').insert(payload).select('*').single();
 if(q.error)throw Error(old?'Conflit ou écriture refusée : actualise et recommence.':q.error.message);
 await audit(old?'item_updated':'item_created','item',q.data.id);
 await reload(true);message('Enregistré dans votre compte privé.');
}
async function saveProject(form,editing=''){
 const name=String(form.get('name')||'').trim(),description=String(form.get('description')||'').trim(),category=String(form.get('category')||'').trim();
 if(!name||name.length>140||description.length>6000||category.length>70)throw Error('Champs du projet invalides.');
 const payload={owner_id:authUser.id,name,description,category,updated_at:new Date().toISOString()};
 const old=editing?getProject(editing):null;
 let q;
 if(editing&&!old)throw Error('Projet introuvable.');
 if(old)q=await client.from('control_projects').update(payload).eq('id',old.id).eq('owner_id',authUser.id).eq('updated_at',old.updated_at).select('*').single();
 else q=await client.from('control_projects').insert(payload).select('*').single();
 if(q.error)throw Error(old?'Conflit de modification : actualise le projet.':q.error.message);
 await audit(old?'project_updated':'project_created','project',q.data.id);
 await reload(true);nav('project',q.data.id);message('Projet enregistré.');
}
async function eraseItem(item){
 if(!confirm('Supprimer cet élément ? Cette opération est irréversible.'))return;
 const q=await client.from('control_items').delete().eq('id',item.id).eq('owner_id',authUser.id);
 if(q.error)throw Error(q.error.message);
 await audit('item_removed','item',item.id);await reload(true);message('Élément supprimé.');
}
async function eraseProject(p){
 if(prompt('Cette opération supprime ce projet et TOUS ses éléments. Pour confirmer, écrivez le nom exact : '+p.name)!==p.name)return;
 const q=await client.from('control_projects').delete().eq('id',p.id).eq('owner_id',authUser.id);
 if(q.error)throw Error(q.error.message);
 await audit('project_removed','project',p.id);await reload(true);nav('projects');message('Projet supprimé.');
}
async function markDone(item){
 const q=await client.from('control_items').update({status:'done',updated_at:new Date().toISOString()}).eq('id',item.id).eq('owner_id',authUser.id).eq('updated_at',item.updated_at).select('id').single();
 if(q.error)throw Error('Conflit : actualise avant de modifier.');
 await audit('item_done','item',item.id);await reload(true);message('Action terminée dans CONTROL.');
}
async function copyText(text){
 try{await navigator.clipboard.writeText(text);message('Copié. Ouvrez votre IA pour poursuivre.')}
 catch{message('Copie impossible sur cet appareil.',true)}
}
async function prepareFourMissions(){
 if(!cache.projects.length)throw Error('Créez d’abord un projet.');
 const selected=prompt('Nom exact du projet pour ces missions :',cache.projects[0].name);
 const p=cache.projects.find(x=>x.name===selected);if(!p)throw Error('Projet non trouvé.');
 const task=prompt('Quel travail faut-il répartir ?');if(!task?.trim())return;
 const plan=[['ChatGPT','Spécifications et critères de réussite'],['Claude','Analyse des risques et propositions UX'],['Codex','Implémentation isolée, tests et preuves'],['ChatGPT','Validation des livrables et synthèse']];
 // One atomic insert; no partial task creation.
 const rows=plan.map(([provider,title])=>({owner_id:authUser.id,project_id:p.id,kind:'mission',title,provider,status:'todo',body:'Objectif : '+task+'\nMission : '+title+'\nAucune dépense ni action engageante sans autorisation.\nJustifier chaque résultat par des preuves.',updated_at:new Date().toISOString()}));
 const q=await client.from('control_items').insert(rows);if(q.error)throw Error(q.error.message);
 await reload(true);message('Quatre missions créées. Aucune IA déclenchée.');
}

const encB64=x=>{let s='';for(const v of x)s+=String.fromCharCode(v);return btoa(s)};
const decB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function encKey(pass,salt){
 const root=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:200000,hash:'SHA-256'},root,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function exportMyData(encrypted){
 if(!authUser)throw Error('Connexion requise.');
 const data={schema:'control-cloud-export-v1',exportedAt:new Date().toISOString(),accountId:authUser.id,projects:cache.projects,items:cache.items,preferences:cache.preferences};
 let content=data;
 if(encrypted){
  const password=prompt('Choisissez un mot de passe de sauvegarde (12 caractères minimum).');
  if(password===null)return;if(password.length<12)throw Error('Mot de passe trop court.');
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),key=await encKey(password,salt);
  const bytes=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(data)));
  content={schema:'control-cloud-encrypted-v1',salt:encB64(salt),iv:encB64(iv),content:encB64(new Uint8Array(bytes)),kdf:'PBKDF2-SHA256-200000'};
 }else if(!confirm('Exporter les données en clair ? Le fichier peut contenir des documents et liens privés.'))return;
 const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);
 a.href=url;a.download='CONTROL-compte-'+new Date().toISOString().slice(0,10)+(encrypted?'-chiffre':'')+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
 message('Export effectué. Conservez le fichier et son mot de passe en lieu sûr.');
}
async function importLegacy(){
 if(!authUser)throw Error('Connexion requise.');
 if(cache.preferences?.settings?.legacyImportedAt)throw Error('Une migration a déjà été effectuée pour ce compte.');
 let local={};try{local=JSON.parse(localStorage.getItem('control-hub-v2')||'{}')}catch{}
 if(!local||typeof local!=='object'||!Object.keys(local).length)throw Error('Aucune donnée de l’ancien CONTROL sur cet appareil. Utilisez le navigateur contenant vos anciens projets.');
 if(!confirm('CONFIRMATION DE PROPRIÉTÉ : ces projets et les liens privés de l’ancien CONTROL doivent vous appartenir. Les importer dans ce compte les rend accessibles uniquement à ce compte. Continuer ?'))return;
 if(prompt('Pour confirmer le transfert, tapez IMPORTER')!=='IMPORTER')return;
 let baseline=[],catalog=[];
 try{const [a,b]=await Promise.all([fetch('./data/projects.json',{cache:'no-store'}),fetch('./data/catalog.json',{cache:'no-store'})]);if(a.ok)baseline=(await a.json()).projects||[];if(b.ok)catalog=(await b.json()).projects||[]}catch{}
 let personal=[...baseline,...catalog,...(Array.isArray(local.custom)?local.custom:[])];
 // Include any locally-known project keys even when original catalog is unavailable.
 const known=new Set(personal.map(x=>x.id));
 for(const k of Object.keys(local))if(k!=='custom'&&typeof local[k]==='object'&&!known.has(k)){personal.push({id:k,name:k});known.add(k)}
 personal=personal.filter(x=>x?.id&&x?.name).slice(0,70);
 if(!personal.length)throw Error('Aucun ancien projet récupérable.');
 let done=0,added=0;
 for(const p of personal){
  let row=cache.projects.find(x=>x.name===p.name);
  if(!row){
   const r=await client.from('control_projects').insert({owner_id:authUser.id,name:String(p.name).slice(0,140),description:String(p.description||p.tagline||p.summary||'').slice(0,6000),category:String(p.category||'').slice(0,70)}).select('*').single();
   if(r.error)throw Error('Migration partielle (projets) : '+r.error.message);
   row=r.data;cache.projects.push(row);done++;
  }
  const legacy=local[p.id]||{};
  const suggestions=[];
  const add=(kind,title,url='',body='',provider='')=>{if(suggestions.length<100&&String(title||'').trim()&&(!url||safeURL(url)))suggestions.push({owner_id:authUser.id,project_id:row.id,kind,title:String(title).slice(0,200),url:url?safeURL(url):'',body:String(body).slice(0,30000),provider:String(provider).slice(0,60)})};
  if(legacy.projectUrl)add('ai_space','Projet ChatGPT',legacy.projectUrl,'','ChatGPT');
  for(const [ai,url] of Object.entries(legacy.spaces||{}))add('ai_space','Espace '+ai,url,'',ai);
  for(const x of legacy.links||[])add('resource',x.label||'Ressource',x.url);
  for(const x of legacy.chats||[])add('conversation',x.title||'Conversation',x.url,'',x.ai||'ChatGPT');
  for(const [ai,v] of Object.entries(legacy.reports||{}))if(v?.text)add('report','Bilan '+ai,'',v.text,ai);
  if(legacy.memo)add('note','Consignes du projet','',legacy.memo);
  for(const i of suggestions){
   if(cache.items.some(x=>x.project_id===row.id&&x.kind===i.kind&&x.title===i.title&&x.url===i.url))continue;
   const q=await client.from('control_items').insert(i).select('id').single();
   if(q.error)throw Error('Migration partielle (ressources) : '+q.error.message);
   cache.items.push({...i,id:q.data.id});added++;
  }
 }
 const settings={...(cache.preferences?.settings||{}),legacyImportedAt:new Date().toISOString()};
 const r=await client.from('control_preferences').upsert({owner_id:authUser.id,settings,updated_at:new Date().toISOString()},{onConflict:'owner_id'});
 if(r.error)throw Error('Migration de projets réalisée, mais marqueur final refusé : '+r.error.message);
 await reload(true);nav('projects');message(done+' projets et '+added+' éléments historiques transférés.');
}

async function action(button){
 const type=button.dataset.action,id=button.dataset.id||'';
 switch(type){
  case 'projects':nav('projects');return;
  case 'lab':nav('lab',id||'');return;
  case 'projects-more':cloudProjectsAll=!cloudProjectsAll;render();return;
  case 'inbox':nav('inbox');return;
  case 'catalog':nav('catalog',id||'');return;
  case 'deploy':nav('deploy',id||'');return;
  case 'tools':toolTab=id||'library';nav('tools');return;
  case 'tool-tab':toolTab=id;searchFilter='';render();return;
  case 'open-project':if(id&&!getProject(id))throw Error('Projet introuvable.');nav('project',id,'ai_space');return;
  case 'project-tab':tab=id;render();return;
  case 'toggle-project-form':{const el=byId('new-project');if(el)el.hidden=!el.hidden;return}
  case 'toggle-item-form':{const el=byId('new-item');if(el)el.hidden=!el.hidden;return}
  case 'edit-project':{
   const p=getProject(id);if(!p)throw Error('Projet introuvable.');
   const el=byId('project-editor');el.hidden=false;
   el.innerHTML='<div class="row"><h2>Modifier le projet</h2>'+btn('Fermer','close-editor')+'</div>'+
     '<form data-form="save-project" data-record="'+H(p.id)+'">'+input('Nom','name',p.name,'text','required maxlength="140"')+
     input('Catégorie','category',p.category||'','text','maxlength="70"')+
     area('Description','description',p.description||'','maxlength="6000"')+
     '<div class="btnrow"><button class="primary">Enregistrer</button>'+btn('Supprimer définitivement le projet','delete-project',p.id,'danger')+'</div></form>';
   el.scrollIntoView({behavior:'smooth',block:'nearest'});return
  }
  case 'close-editor':{const el=byId('project-editor')||byId('edit-slot')||byId('tool-editor');if(el){el.hidden=true;el.innerHTML=''}return}
  case 'delete-project':{const p=getProject(id);if(p)await eraseProject(p);return}
  case 'delete-item':{const x=cache.items.find(i=>i.id===id);if(x)await eraseItem(x);return}
  case 'mark-done':{const x=cache.items.find(i=>i.id===id);if(x)await markDone(x);return}
  case 'open-item':{
   const x=cache.items.find(i=>i.id===id);if(!x)return;
   if(x.project_id)nav('project',x.project_id,x.kind);else if(x.kind==='mission')nav('missions');else if(x.kind==='automation')nav('automations');else nav('tools');
   await action({dataset:{action:'edit-item',id:x.id}});return;
  }
  case 'edit-item':{
   const x=cache.items.find(i=>i.id===id);if(!x)throw Error('Cet élément a été supprimé. Actualisez.');
   let el=byId('project-editor')||byId('edit-slot')||byId('tool-editor');
   if(!el){el=document.createElement('section');el.id='tool-editor';byId('page').appendChild(el)}
   el.hidden=false;el.innerHTML='<section class="surface"><div class="row"><h2>Modifier · '+H(x.title)+'</h2>'+btn('Fermer','close-editor')+'</div>'+itemForm(x.kind,x.project_id,x)+'</section>';
   el.scrollIntoView({behavior:'smooth',block:'nearest'});return;
  }
  case 'copy-mission':{
   const x=cache.items.find(i=>i.id===id);if(!x)return;
   await copyText('MISSION — '+projectName(x.project_id)+'\nIA : '+x.provider+'\n'+x.title+'\n\n'+x.body+
     '\n\nSignale les risques, évite les dépenses sans autorisation et fournis des preuves réelles des changements effectués.');
   return;
  }
  case 'copy-context':{
   const project=byId('manager-form')?.elements?.project?.value||'';
   await copyText('DOSSIER DE CONTEXTE CONTROL\n'+managerAnswer('Où en est le projet, et quelles sont les prochaines étapes ?',project)+
     '\n\nVérifie les résultats à leur source ; ne prétends pas accéder à des services privés non reliés.');
   return;
  }
  case 'mission-template':await prepareFourMissions();return;
  case 'refresh':await reload();return;
  case 'account':nav('account');return;
  case 'logout':{
   if(!confirm('Se déconnecter de cet appareil ?'))return;
   const r=await client.auth.signOut({scope:'local'});if(r.error)throw Error(r.error.message);
   epoch++;authUser=null;cache={projects:[],items:[],preferences:null};byId('page').innerHTML='';
   window.CONTROL_HELP?.reset();visible('auth');message('Déconnecté de cet appareil.');return;
  }
  case 'export-json':await exportMyData(false);return;
  case 'export-encrypted':await exportMyData(true);return;
  case 'import-legacy':await importLegacy();return;
  case 'delete-account':{
   if(cloudConfig?.accountDeletionEnabled!==true)throw Error('Suppression de compte non activée.');
   if(prompt('Pour supprimer définitivement votre compte et ses données, écrivez : SUPPRIMER MON COMPTE')!=='SUPPRIMER MON COMPTE')return;
   if(!confirm('Dernière confirmation : supprimer ce compte et tous ses projets de manière irréversible ?'))return;
   const r=await client.functions.invoke('control-delete-account',{body:{confirmation:'SUPPRIMER MON COMPTE'}});
   if(r.error||r.data?.deleted!==true)throw Error('Suppression non confirmée par le serveur. Aucune réussite ne peut être annoncée.');
   await client.auth.signOut({scope:'local'});epoch++;authUser=null;cache={projects:[],items:[],preferences:null};byId('page').innerHTML='';visible('auth');message('Compte et données supprimés par le serveur.');return;
  }
  default:return;
 }
}
function wireEvents(){
 document.addEventListener('click',async e=>{
  const navButton=e.target.closest?.('[data-page]');if(navButton){nav(navButton.dataset.page);return}
  const button=e.target.closest?.('[data-action]');if(!button||!authUser)return;
  e.preventDefault();if(waiting&&button.dataset.action!=='close-editor')return;
  try{button.disabled=true;await action(button)}catch(err){message(err?.message||'Action indisponible.',true)}finally{button.disabled=false}
 });
 document.addEventListener('submit',async e=>{
  if(e.target?.id==='email-form'){
   e.preventDefault();const b=e.target.querySelector('button'),email=String(new FormData(e.target).get('email')||'').trim().toLowerCase();if(!email)return;
   b.disabled=true;try{const res=await client.auth.signInWithOtp({email,options:{emailRedirectTo:currentURL(),shouldCreateUser:cloudConfig?.allowRegistration===true}});if(res.error)throw res.error;byId('auth-message').innerHTML='<p class="notice-ok">Vérifiez votre boîte mail. Un lien de connexion a été demandé. Si l’adresse est autorisée, vous le recevrez prochainement.</p>'}
   catch(err){byId('auth-message').textContent='Demande refusée : '+(err?.message||'réessayez plus tard.')}
   finally{b.disabled=false}
   return;
  }
  if(!authUser)return;
  if(e.target?.id==='manager-form'){
   e.preventDefault();const fd=new FormData(e.target),question=String(fd.get('question')||'').trim(),p=String(fd.get('project')||'');
   if(!question)return;byId('manager-output').innerHTML='<div class="message">'+H('Question : '+question+'\n\n'+managerAnswer(question,p))+'</div>';return;
  }
  if(e.target?.id==='project-form'||e.target?.dataset?.form==='save-project'||e.target?.dataset?.form==='save-item'){
   e.preventDefault();if(waiting)return;const submit=e.target.querySelector('button[type="submit"],button.primary');submit.disabled=true;
   try{const fd=new FormData(e.target);if(e.target.id==='project-form'||e.target.dataset.form==='save-project')await saveProject(fd,e.target.dataset.record||'');else await saveItem(fd,e.target.dataset.record||'')}
   catch(err){message(err?.message||'Enregistrement impossible.',true)}
   finally{submit.disabled=false}return;
  }
 });
 document.addEventListener('input',e=>{
  if(e.target?.id==='project-search'){
   const query=e.target.value.toLowerCase();const filtered=cache.projects.filter(p=>(p.name+' '+p.category).toLowerCase().includes(query)).sort((a,b)=>(b.updated_at||'').localeCompare(a.updated_at||''));byId('project-list').innerHTML=(query||cloudProjectsAll?filtered:filtered.slice(0,6)).map(projectCard).join('')||empty('Aucun projet trouvé.');
  }
  if(e.target?.id==='tool-search'){
   searchFilter=e.target.value;const pos=e.target.selectionStart;render();const box=byId('tool-search');box?.focus();try{box?.setSelectionRange(pos,pos)}catch{}
  }
 });
 byId('refresh').onclick=()=>authUser&&reload();
 byId('account').onclick=()=>authUser&&nav('account');
 byId('google-login').onclick=async()=>{if(!client||cloudConfig?.allowGoogleLogin!==true)return;const b=byId('google-login');b.disabled=true;
  try{const r=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:currentURL(),scopes:'openid email profile'}});if(r.error)throw r.error;}
  catch(e){byId('auth-message').textContent='Connexion Google indisponible : '+(e?.message||'configuration à vérifier.');b.disabled=false}
 };
}
function currentURL(){return location.origin+location.pathname}
window.CONTROL_HELP?.setAdapter({
 mode:'cloud',
 isAuthenticated:()=>!!authUser,
 navigate:(screen,route)=>{
  if(!authUser)return false;
  if(screen==='tools'){toolTab=route==='backup'?'backup':route==='budget'?'budget':route==='library'?'library':'search';nav('tools');return true}
  if(screen==='activity'){return false}
  if(['projects','inbox','missions','automations','manager','lab','catalog','deploy','account'].includes(screen)){nav(screen);return true}
  return false;
 },
 getSummary:()=>authUser?{projects:cache.projects.length,current:page==='project'?getProject(picked)?.name:'',openActions:cache.items.filter(x=>x.kind==='task'&&x.status!=='done').length,missions:cache.items.filter(x=>x.kind==='mission').length}:null
});
wireEvents();
boot();
