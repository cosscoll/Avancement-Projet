/* CONTROL: educational deployment tutorials. No production deploy or credential handling. */
(()=>{'use strict';
let dataPromise=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=s=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!Array.from(u.searchParams.keys()).some(k=>/^(token|access_token|refresh_token|api_key|code|password|secret)$/i.test(k))}catch{return false}};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function load(){
 if(!dataPromise)dataPromise=fetch('./data/deployment-guides.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(d=>{
  if(!Array.isArray(d?.guides)||d.guides.length<8||!d.types||!d.integration_labels)throw Error('Guides incomplets');
  const ids=new Set();
  for(const guide of d.guides){if(!guide.id||ids.has(guide.id)||!safeUrl(guide.official)||!safeUrl(guide.setup)||!safeUrl(guide.dashboard)||!Array.isArray(guide.steps)||guide.steps.length<4)throw Error('Tutoriel invalide');ids.add(guide.id)}
  return d;
 }).catch(e=>{dataPromise=null;throw e});
 return dataPromise;
}
function mount(root,params={}){
 if(!root)return;
 const projects=(params.projects||[]).filter(p=>p?.id&&p?.name);
 const getSaved=typeof params.isSaved==='function'?params.isSaved:()=>false;
 const state={q:'',type:'all',level:'all',project:projects.find(p=>p.id===params.projectId)?.id||projects[0]?.id||'',loading:false};
 const loader=document.createElement('p');loader.className='deploy-loading';loader.textContent='Chargement des tutoriels de mise en ligne…';
 root.replaceChildren(loader);
 load().then(data=>{
  if(!root.isConnected||!loader.isConnected)return;
  const opts=(rows,chosen)=>rows.map(([key,name])=>'<option value="'+esc(key)+'" '+(key===chosen?'selected':'')+'>'+esc(name)+'</option>').join('');
  const styles={debutant:'Débutant',intermediaire:'Intermédiaire',avance:'Avancé'};
  root.innerHTML='<div class="deploy-page"><div class="deploy-title"><div><span class="tool-eyebrow">CONTROL · PUBLICATION DE SITES WEB</span><h1>Mettre mon site en ligne</h1><p>Choisis un hébergeur, suis les étapes et prépare le déploiement avec ton IA — sans exposer de clés privées.</p></div><span class="tool-total">'+data.guides.length+' tutoriels</span></div>'+
   '<div class="tool-info"><strong>Assistance IA, pas un déploiement automatique.</strong> CONTROL prépare un plan adapté à l’hébergeur et au projet. Les boutons ouvrent les consoles officielles ; aucun compte d’hébergement n’est authentifié ici. Vérifie toujours le prix, les permissions et les quotas avant de créer une ressource.</div>'+
   '<div class="deploy-filters">'+
   '<label>Rechercher<input id="deploy-query" type="search" placeholder="Ex. IONOS, GitHub, PHP, Vercel…" class="tool-field"></label>'+
   '<label>Type de site<select id="deploy-type" class="tool-field">'+opts([['all','Tous les sites'],...Object.entries(data.types)],'all')+'</select></label>'+
   '<label>Difficulté<select id="deploy-level" class="tool-field">'+opts([['all','Tous les niveaux'],...Object.entries(styles)],'all')+'</select></label>'+
   (projects.length?'<label>Projet CONTROL<select id="deploy-project" class="tool-field">'+opts(projects.map(p=>[p.id,p.name]),state.project)+'</select></label>':'<div class="deploy-helper">Crée un projet CONTROL pour y ajouter des tutoriels.</div>')+
   '</div><p class="deploy-count" id="deploy-count" aria-live="polite"></p><div id="deploy-list" class="deploy-list"></div>'+
   '<section class="deploy-checklist"><h2>Vérifications avant toute publication</h2><div class="deploy-check-grid"><label><input type="checkbox"> Pas de clé privée, .env, base ou données clients dans les fichiers publics</label><label><input type="checkbox"> Version mobile, desktop, images et navigation testées</label><label><input type="checkbox"> Domaine, HTTPS et DNS prévus</label><label><input type="checkbox"> Coûts et autorisations validés</label><label><input type="checkbox"> Tests, sauvegarde et plan de retour arrière préparés</label><label><input type="checkbox"> Autorisation de mise en production accordée</label></div></section>'+
   '<div id="deploy-status" class="tool-feedback" role="status" aria-live="polite"></div></div>';
  const container=root.querySelector('.deploy-page');if(!container)return;const find=q=>container.querySelector(q);
  function makePrompt(g){
   const p=projects.find(x=>x.id===state.project);
   const head='ASSISTANT DE DÉPLOIEMENT CONTROL — '+g.name+'\nProjet : '+(p?.name||'Projet non sélectionné')+'\nHébergeur : '+g.name+'\nDocumentation officielle : '+g.official+'\n';
   const body='\nTu es un ingénieur DevOps chargé de préparer une publication sûre, vérifiable et économiquement maîtrisée. Commence par identifier le framework et distinguer site statique, SPA, PHP, SSR ou backend. Examine uniquement le code et les accès que je t’autorise. Vérifie les commandes de build, le répertoire de sortie, le domaine, le TLS, les migrations éventuelles et les routes. Prépare une checklist avec chaque validation et preuve. Ne déploie rien sans mon approbation explicite et ne crée aucune ressource payante. Ne demande ni mot de passe, ni token, ni clé API dans le chat ou le code public. Pour les accès authentifiés, utilise uniquement les connecteurs officiels connectés et leurs autorisations existantes. Si tu ne peux pas agir sur le compte '+g.name+', explique-moi précisément quelles étapes effectuer manuellement.\n\nTutoriel :\n';
   return head+body+g.steps.map(([title,step],i)=>(i+1)+'. '+title+' — '+step).join('\n')+'\n\nContrôles de livraison :\n'+g.check.map(c=>'- '+c).join('\n')+'\n\nRésultat attendu : URL de production confirmée, référence de déploiement, tests réalisés, points non vérifiés et instructions de rollback.';
  }
  const link=(url,title)=>safeUrl(url)?'<a class="deploy-link" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(title)+' ↗</a>':'';
  function makeCard(g){const saved=state.project&&getSaved({id:'hosting-'+g.id,url:g.official},state.project);
   return '<article class="deploy-card"><div class="deploy-card-head"><div><div class="deploy-kicker">'+g.fit.map(x=>data.types[x]).filter(Boolean).map(esc).join(' · ')+'</div><h2>'+esc(g.name)+'</h2><p>'+esc(g.summary)+'</p></div><span class="deploy-duration">'+esc(g.duration)+'</span></div>'+
   '<div class="deploy-tags"><span>'+esc(styles[g.level]||g.level)+'</span><span>'+esc(g.pricing)+'</span></div>'+
   '<div class="deploy-connection"><strong>Connexion CONTROL :</strong> '+esc(data.integration_labels[g.integration]||'Accès externe à configurer')+'</div>'+
   '<details class="deploy-steps"><summary>Voir le tutoriel étape par étape ('+g.steps.length+' étapes)</summary><div class="deploy-details">'+
   '<h3>Avant de commencer</h3><ul>'+g.prereq.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+
   '<ol>'+g.steps.map(([name,info])=>'<li><strong>'+esc(name)+'</strong><p>'+esc(info)+'</p></li>').join('')+'</ol>'+
   '<h3>Checklist de recette</h3><ul>'+g.check.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+
   '<h3>Problèmes fréquents</h3>'+g.issues.map(([problem,solution])=>'<p><strong>'+esc(problem)+'</strong> — '+esc(solution)+'</p>').join('')+'</div></details>'+
   '<div class="deploy-buttons">'+link(g.official,'Documentation officielle')+link(g.setup,'Configurer '+g.name)+link(g.dashboard,'Ouvrir mon tableau de bord')+(typeof params.onOpenStatus==='function'&&['github_public','github_actions'].includes(g.integration)?'<button type="button" data-deploy-status="'+esc(g.id)+'">Voir les déploiements GitHub</button>':'')+
   '<button type="button" data-deploy-prompt="'+esc(g.id)+'">Copier le prompt IA</button>'+
   (projects.length?'<button type="button" data-deploy-save="'+esc(g.id)+'" '+(saved?'disabled':'')+'>'+(saved?'Guide déjà enregistré':'+ Ajouter au projet')+'</button>':'')+
   '</div></article>';
  }
  function render(){const filtered=data.guides.filter(g=>(state.type==='all'||g.fit.includes(state.type))&&(state.level==='all'||g.level===state.level)&&(!state.q||norm(g.name+' '+g.summary+' '+g.fit.join(' ')).includes(norm(state.q))));find('#deploy-list').innerHTML=filtered.length?filtered.map(makeCard).join(''):'<div class="tool-no-results">Aucun hébergeur ne correspond aux filtres. Essaie un autre type de site.</div>';find('#deploy-count').textContent=filtered.length+' guide(s) disponibles';}
  const info=(s,failed=false)=>{const el=find('#deploy-status');el.textContent=s;el.dataset.error=failed?'true':'false'};
  render();
  container.addEventListener('click',async e=>{
   const statusBtn=e.target.closest('[data-deploy-status]');if(statusBtn&&container.contains(statusBtn)&&typeof params.onOpenStatus==='function'){params.onOpenStatus(state.project,statusBtn.dataset.deployStatus);return}
   const promptBtn=e.target.closest('[data-deploy-prompt]');
   if(promptBtn&&container.contains(promptBtn)){const g=data.guides.find(x=>x.id===promptBtn.dataset.deployPrompt);if(!g)return;try{await navigator.clipboard.writeText(makePrompt(g));info('Prompt de préparation « '+g.name+' » copié. Colle-le dans ton IA.')}catch{info('Copie impossible, vérifie l’autorisation du presse-papiers.',true)}return}
   const saveBtn=e.target.closest('[data-deploy-save]');
   if(saveBtn&&container.contains(saveBtn)){const g=data.guides.find(x=>x.id===saveBtn.dataset.deploySave);if(!g||!state.project||typeof params.onAdd!=='function')return;saveBtn.disabled=true;
    try{const result=await params.onAdd({id:'hosting-'+g.id,name:'Tutoriel · '+g.name,url:g.official,category:'hebergement',summary:g.summary,courses:['3d']},state.project);info(result===false?'Le guide est déjà présent dans les ressources du projet.':'Tutoriel '+g.name+' ajouté au projet.');render()}catch(err){info(err?.message||'Ajout impossible',true);saveBtn.disabled=false}return}
  });
  find('#deploy-query').addEventListener('input',e=>{state.q=e.target.value;render()});
  find('#deploy-type').addEventListener('change',e=>{state.type=e.target.value;render()});
  find('#deploy-level').addEventListener('change',e=>{state.level=e.target.value;render()});
  find('#deploy-project')?.addEventListener('change',e=>{state.project=e.target.value;render()});
 }).catch(()=>{if(root.isConnected&&loader.isConnected)root.innerHTML='<div class="tool-info">Les guides sont temporairement inaccessibles. Actualise CONTROL une fois connecté.</div>'});
}
window.CONTROL_DEPLOY_GUIDES={mount,load};
})();
