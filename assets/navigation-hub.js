/* CONTROL — Unified feature finder (personal PWA + authenticated Cloud).
   Navigation only: no accounts, providers, secrets, telemetry or network calls. */
(()=>{'use strict';
const CAT=[
 ['start','Essentiels'],['projects','Mes projets'],['manage','Organiser'],['ai','IA & création'],
 ['publish','Ressources & publication'],['account','Compte & sécurité'],['project','Dans ce projet']
];
const FEATURES=[
 {id:'projects',title:'Mes projets',hint:'Ouvrir et retrouver mes espaces',category:'start',keywords:'accueil liste projet dossier commencer creer ajouter nouveau supprimer espace',personal:'#/',cloud:'projects'},
 {id:'inbox',title:'À traiter',hint:'Priorités, tâches et validations',category:'start',keywords:'action urgent faire tâche todo rappels creer ajouter priorite modifier terminer',personal:'#/control/inbox',cloud:'inbox'},
 {id:'manager',title:'Piloter avec CONTROL',hint:'Bilans, état des projets et prochaines étapes',category:'start',keywords:'chef projet synthèse tableau bord avancée statut',personal:'#/control/manager',cloud:'manager'},
 {id:'search',title:'Rechercher dans mes données',hint:'Projets, décisions, notes et ressources',category:'start',keywords:'retrouver chercher recherche universelle fichier',personal:'#/control/search',cloud:'tools:search'},
 {id:'tools',title:'Explorer tous les outils',hint:'Parcourir les fonctions par usage',category:'start',keywords:'annuaire catalogue menu fonctions',personal:'#/control/tools',cloud:'tools'},
 {id:'missions',title:'Suivre les missions',hint:'Retrouver les missions IA et leurs résultats',category:'manage',keywords:'statut agents tâches exécution',personal:'#/control/missions',cloud:'missions'},
 {id:'calendar',title:'Calendrier',hint:'Échéances et rendez-vous',category:'manage',keywords:'agenda date planning événement rappel',personal:'#/control/calendar',cloud:'tools:calendar'},
 {id:'meetings',title:'Organiser une visio',hint:'Réunions avec l’équipe, les clients ou prospects',category:'manage',keywords:'creer programmer organiser reunion appel rendez-vous video meet zoom teams rdv',personal:'#/control/meetings',cloud:'visios'},
 {id:'automations',title:'Automatisations',hint:'Consulter les exécutions et programmations',category:'manage',keywords:'sprints tâches récurrentes planifiées rappels',personal:'#/automations',cloud:'automations'},
 {id:'goals',title:'Planifier un objectif',hint:'Transformer un objectif en étapes',category:'manage',keywords:'roadmap plan étapes jalons',personal:'#/control/goals',cloud:null},
 {id:'decisions',title:'Historique des décisions',hint:'Retrouver les choix et versions du projet',category:'manage',keywords:'retrouver decision choix memoire historique arbitrage decisions',personal:'#/control/memory',cloud:'tools:memory'},
 {id:'command',title:'Commander Claude et Gemini',hint:'Préparer des missions multi-IA',category:'ai',keywords:'multi ia pilote agent anthropic google prompt',personal:'#/control/command',cloud:'command'},
 {id:'lab',title:'Laboratoire IA',hint:'Préparer, comparer et vérifier des résultats',category:'ai',keywords:'test brief audit json html création',personal:'#/control/lab',cloud:'lab'},
 {id:'localai',title:'Discuter avec CONTROL IA',hint:'Assistant local et réponses',category:'ai',keywords:'chat discussion modèle conversation générative',personal:'#/control/localai',cloud:null},
 {id:'webbuilder',title:'Créer un site web',hint:'Éditer un modèle, voir l’aperçu et exporter un site',category:'ai',keywords:'site web creer construire design generer template html css portfolio artisan landing constructeur',personal:'#/control/webbuilder',cloud:null},
 {id:'catalog',title:'Bibliothèque d’outils IA',hint:'Découvrir les outils et kits pratiques',category:'ai',keywords:'catalogue annuaire moteur 3d IA kits formation',personal:'#/control/catalog',cloud:'catalog'},
 {id:'library',title:'Ressources et documents',hint:'Liens, fichiers et références',category:'publish',keywords:'drive dossier bibliothèque liens ressources',personal:'#/control/library',cloud:'tools:library'},
 {id:'deploy',title:'Mettre un site en ligne',hint:'Guides de publication et déploiement',category:'publish',keywords:'publier deployer mettre en ligne projet heberger site web github pages vercel netlify',personal:'#/control/deploy',cloud:'deploy'},
 {id:'activity',title:'Activité GitHub et tests',hint:'Suivi des dépôts et preuves publiques',category:'publish',keywords:'ci publication actions commits',personal:'#/control/activity',cloud:null},
 {id:'budget',title:'Budget et quotas',hint:'Consulter les dépenses renseignées',category:'account',keywords:'prix limite forfait argent coût finances',personal:'#/control/budget',cloud:'tools:budget'},
 {id:'backup',title:'Sauvegarder mes données',hint:'Exporter et protéger mes données',category:'account',keywords:'exporter json sauvegarde chiffrer restaurer fichier',personal:'#/control/backup',cloud:'account'},
 {id:'settings',title:'Paramètres et confidentialité',hint:'Règles, comptes et sécurité',category:'account',keywords:'préférences profil connexion se déconnecter reglages configuration modifier',personal:'#/control/settings',cloud:'account'}
];
const PROJECT_SECTIONS=[
 ['ai','Espaces IA','Ouvrir les espaces ChatGPT, Claude et autres','agents projets liens'],
 ['discussions','Conversations','Retrouver les échanges du projet','discussions chats historique'],
 ['pilot','Gestion du projet','Synthèse, consignes et décisions','piloter bilan'],
 ['resources','Ressources du projet','Documents et accès de ce projet','drive fichiers liens'],
 ['localai','Assistant du projet','Discuter avec CONTROL IA locale','chat générative'],
 ['meetings','Visios du projet','Organiser une réunion','appel vidéo zoom'],
 ['command','Commander les IA','Préparer les missions multi-IA','claude gemini prompt'],
 ['library','Outils IA du projet','Explorer les ressources liées','catalogue'],
 ['deploy','Publication du projet','Mettre le site en ligne','github'],
 ['lab','Laboratoire du projet','Tester les résultats et briefs','audit'],
 ['connect','Connexions du projet','Vérifier les liens des fournisseurs','oauth']
];
const CLOUD_PROJECT_SECTIONS=[
 ['ai_space','Espaces IA','Lier les espaces et les fournisseurs','agents liens chatgpt claude'],
 ['conversation','Conversations','Retrouver les échanges liés','chats discussions'],
 ['task','Actions','Organiser et terminer les tâches','actions suivi à faire'],
 ['resource','Ressources','Documents et liens utiles','fichiers drive'],
 ['mission','Missions du projet','Suivre les missions','ia mission'],
 ['automation','Automatisations du projet','Consulter les programmations','planification'],
 ['report','Bilans','Consulter les comptes rendus','rapport'],
 ['decision','Décisions','Retrouver les choix','mémoire'],
 ['note','Notes','Consulter les notes','mémo'],
 ['event','Calendrier','Voir les échéances','rdv'],
 ['expense','Budget du projet','Consulter les dépenses','coûts'],
 ['income','Revenus','Consulter les revenus','finances']
];
let adapter={mode:'personal',getActiveProject:()=>null,getProjects:()=>[],navigate:null,isAvailable:()=>true};
let dialog=null,query=null,results=null,category='start',lastFocus=null;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STOP_WORDS=new Set(['un','une','le','la','les','des','du','de','d','en','a','au','aux','mon','ma','mes','son','sa','ses','pour','je','veux','comment','faire','dans','sur','avec','ou','est','sont','peux','puis','aller','voir','ouvrir','retrouver','modifier','consulter','afficher','chercher','cherche','trouver','ajouter','verifier','souhaite','souhaiterais','voudrais','voudrait','besoin','j','m','ce','que','quoi','acceder','permet','possible']);
const ALIASES={
 rdv:'rendez',reunion:'visio',reunions:'visio',appel:'visio',
 taches:'tache',actions:'action',projets:'projet',documents:'document',
 sauvegardes:'sauvegarde',sauvegarder:'sauvegarde',exporter:'export',
 publier:'publication',deployer:'deploiement',sites:'site',
 parametres:'parametre',reglages:'parametre',depenses:'budget',recherche:'rechercher',
 rappels:'rappel',decisions:'decision',connexions:'connexion'
};
const searchableWord=w=>ALIASES[w]||w.replace(/(ements|ations|euses|eurs|es|s)$/,'');
function findFeatures(raw,entries=catalog()){
 const parts=norm(raw).split(/[^a-z0-9]+/).filter(w=>w.length>1&&!STOP_WORDS.has(w)).map(searchableWord);
 if(!parts.length)return entries;
 return entries.map(item=>{
  const title=norm(item.title),hint=norm(item.hint),keys=norm(item.keywords);
  const fields=[title,hint,keys].map(t=>t.split(/[^a-z0-9]+/).filter(Boolean).map(searchableWord));
  const matched=parts.every(word=>fields.some(tokens=>tokens.some(token=>token===word||(word.length>=4&&token.startsWith(word))||(token.length>=4&&word.startsWith(token)))));
  const score=parts.reduce((n,w)=>n+fields.reduce((best,tokens,i)=>Math.max(best,tokens.includes(w)?[6,3,1][i]:tokens.some(token=>w.length>=4&&token.startsWith(w))?[3,2,1][i]:0),0),0);
  return {item,matched,score};
 }).filter(x=>x.matched).sort((a,b)=>b.score-a.score).map(x=>x.item);
}

const catalog=()=>{
 const mode=adapter.mode==='cloud'?'cloud':'personal';
 if(mode==='cloud'&&!adapter.isAvailable?.())return [];
 const collection=adapter.getProjects?.();
 const ownProjects=Array.isArray(collection)?collection:[];
 const projectEntries=ownProjects.filter(p=>p&&typeof p.id==='string'&&p.id&&typeof p.name==='string'&&p.name.trim()).slice(0,5000).map(p=>({
  id:'open-project:'+p.id,title:p.name.trim(),hint:'Ouvrir ce projet',
  category:'projects',keywords:'projet espace '+String(p.category||''),
  target:mode==='cloud'?'project-open:'+p.id:'#/project/'+encodeURIComponent(p.id)+'/ai'
 }));
 const ordinary=FEATURES.filter(x=>x[mode]!==null).map(x=>({...x,target:x[mode]})).concat(projectEntries);
 const p=adapter.getActiveProject?.();
 if(mode==='cloud'){
  if(!p?.id)return ordinary;
  return ordinary.concat(CLOUD_PROJECT_SECTIONS.map(([id,title,hint,keywords])=>({
   id:'project:'+id,title,hint,keywords,category:'project',target:'project-tab:'+id
  })));
 }
 if(!p?.id)return ordinary;
 return ordinary.concat(PROJECT_SECTIONS.map(([id,title,hint,keywords])=>({
  id:'project:'+id,title,hint,keywords,category:'project',
  target:'#/project/'+encodeURIComponent(p.id)+'/'+encodeURIComponent(id)
 })));
};
function ensure(){
 if(dialog)return;
 dialog=document.createElement('div');dialog.className='control-finder';dialog.hidden=true;
 dialog.innerHTML='<div class="control-finder-shade" data-nav-dismiss></div>'+
 '<section class="control-finder-panel" role="dialog" aria-modal="true" aria-label="Trouver une fonction CONTROL">'+
 '<div class="control-finder-heading"><div><span class="control-finder-eyebrow">NAVIGATION CONTROL</span>'+
 '<h2>Trouver une fonction</h2><p>Indiquez ce que vous voulez faire, ou choisissez une rubrique.</p></div>'+
 '<button type="button" class="control-finder-close" data-nav-dismiss aria-label="Fermer la recherche">✕</button></div>'+
 '<label class="control-finder-search"><span aria-hidden="true">⌕</span>'+
 '<input type="search" autocomplete="off" spellcheck="false" aria-label="Rechercher une fonction" placeholder="Ex. créer une visio, retrouver une décision…">'+
 '<kbd>Ctrl K</kbd></label>'+
 '<nav class="control-finder-categories" aria-label="Catégories de fonctions"></nav>'+
 '<div class="control-finder-results" id="control-finder-results" role="group" aria-label="Fonctions accessibles"></div>'+
 '<div class="control-finder-foot"><span>Entrée : ouvrir le premier résultat · Flèches : parcourir.</span><span>Échap pour fermer</span></div>'+
 '</section>';
 document.body.appendChild(dialog);
 query=dialog.querySelector('input[type="search"]');
 results=dialog.querySelector('.control-finder-results');
 dialog.addEventListener('click',e=>{
  if(e.target.closest('[data-nav-dismiss]')){close();return}
  const choose=e.target.closest('[data-finder-id]');if(choose){const item=catalog().find(x=>x.id===choose.dataset.finderId);if(item)select(item);return}
  const filter=e.target.closest('[data-finder-cat]');if(filter){category=filter.dataset.finderCat;query.value='';render();query.focus()}
 });
 query.addEventListener('input',()=>render());
 dialog.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();close();return}
  if(e.key==='Enter'&&e.target===query&&query.value.trim()){
   const first=results.querySelector('[data-finder-id]');
   if(first){
    e.preventDefault();
    const item=catalog().find(x=>x.id===first.dataset.finderId);
    if(item)select(item);
   }
   return;
  }
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
   e.preventDefault();const buttons=[...results.querySelectorAll('[data-finder-id]')];
   if(!buttons.length)return;
   const i=buttons.indexOf(document.activeElement);
   buttons[i===-1?(e.key==='ArrowDown'?0:buttons.length-1):(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();
  }
  if(e.key==='Tab'){
   const focusable=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled])')].filter(x=>x.getClientRects().length);
   if(!focusable.length)return;
   const first=focusable[0],last=focusable.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
 });
}
function render(){
 const mode=adapter.mode==='cloud'?'cloud':'personal';
 const all=catalog();const search=norm(query.value);
 const categories=CAT.filter(([id])=>!['project','projects'].includes(id)||all.some(item=>item.category===id));
 dialog.querySelector('.control-finder-categories').innerHTML=categories.map(([id,label])=>
 '<button type="button" data-finder-cat="'+id+'" aria-pressed="'+(search?'false':String(category===id))+'" class="'+(!search&&category===id?'is-active':'')+'">'+label+'</button>').join('')+
 '<button type="button" data-finder-cat="all" aria-pressed="'+(!search&&category==='all')+'" class="'+(!search&&category==='all'?'is-active':'')+'">Tout voir</button>';
 const filtered=search?findFeatures(query.value,all):all.filter(item=>category==='all'||item.category===category);
 results.innerHTML=filtered.length?
 '<div class="control-finder-summary" role="status" aria-live="polite">'+(search?filtered.length+' résultat(s) pour « '+escape(query.value.trim())+' »':filtered.length+' fonctions · '+escape(CAT.find(([id])=>id===category)?.[1]||'Toutes les catégories'))+'</div>'+
 '<div class="control-finder-grid">'+filtered.map(item=>'<button type="button" data-finder-id="'+escape(item.id)+'" class="control-finder-item">'+
 '<span class="control-finder-symbol" aria-hidden="true">↗</span><span><strong>'+escape(item.title)+'</strong><small>'+escape(item.hint)+'</small></span><span class="control-finder-arrow" aria-hidden="true">→</span></button>').join('')+'</div>':
 '<div class="control-finder-empty">Aucune fonction trouvée. Essayez « missions », « visio », « budget » ou « projet ».<button type="button" data-finder-cat="all">Voir toutes les fonctions</button></div>';
}
function select(item){
 if(adapter.mode==='cloud'){
  if(!adapter.isAvailable?.())return;
  if(adapter.navigate?.(item.target)===false)return;
 }else{
  const target=item.target;
  if(target&&location.hash!==target)location.hash=target;
  else if(target)window.dispatchEvent(new HashChangeEvent('hashchange'));
 }
 try{sessionStorage.setItem('control-finder-last-'+adapter.mode,item.id)}catch{}
 close();
}
function open(opts={}){
 if(!adapter.isAvailable?.())return false;
 ensure();category=opts.category||'start';query.value=opts.query||'';
 lastFocus=document.activeElement;
 dialog.hidden=false;
 document.body.classList.add('control-finder-visible');render();
 query.focus();if(query.value)query.select();
 return true;
}
function close(){
 if(!dialog||dialog.hidden)return;
 dialog.hidden=true;document.body.classList.remove('control-finder-visible');
 if(lastFocus?.isConnected)lastFocus.focus();
 lastFocus=null;
}
function setAdapter(next){
 adapter={...adapter,...next};
 if(adapter.mode==='cloud'&&typeof adapter.isAvailable==='function'&&!adapter.isAvailable())close();
}
document.addEventListener('click',e=>{
 const trigger=e.target.closest?.('[data-control-nav-open]');
 if(trigger){e.preventDefault();open({category:trigger.dataset.controlNavCategory||'start'})}
});
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
  if(!adapter.isAvailable?.())return;
  e.preventDefault();dialog&&!dialog.hidden?close():open();return;
 }
 if(e.key==='Escape'&&dialog&&!dialog.hidden)close();
});
window.CONTROL_NAVIGATION={open,close,setAdapter,getItems:catalog,find:findFeatures,normalize:norm};
})();
