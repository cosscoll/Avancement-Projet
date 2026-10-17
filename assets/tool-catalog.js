/* CONTROL — public editorial AI tool libraries.
 * Data: data/ai-tool-libraries.json; providers remain external.
 * No APIs, credentials, automatic provider permissions or execution.
 */
(()=>{'use strict';
let catalogPromise;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const valid=url=>{try{const a=new URL(url);return a.protocol==='https:'&&!a.username&&!a.password&&!Array.from(a.searchParams.keys()).some(k=>/token|api.?key|secret|password|code/i.test(k))}catch{return false}};
async function load(){
 if(!catalogPromise)catalogPromise=fetch('./data/ai-tool-libraries.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Catalogue introuvable');return r.json()}).then(d=>{if(!d?.tools||!Array.isArray(d.tools)||!d.courses||!Array.isArray(d.categories))throw Error('Catalogue invalide');const ids=new Set();for(const t of d.tools){if(!t.id||ids.has(t.id)||!valid(t.url))throw Error('Outil invalide');ids.add(t.id)}return d}).catch(e=>{catalogPromise=null;throw e});
 return catalogPromise;
}
function mount(root,params={}){
 if(!root)return;
 const mode=params.mode==='cloud'?'cloud':'personal',projectList=(params.projects||[]).filter(p=>p&&p.id&&p.name),isSaved=typeof params.isSaved==='function'?params.isSaved:()=>false;
 const favoritesKey='control-tool-favorites-v1',favoritable=mode==='personal';
 let favorites=new Set();
 if(favoritable)try{favorites=new Set(JSON.parse(localStorage.getItem(favoritesKey)||'[]').filter(x=>typeof x==='string'))}catch{}
 const state={course:'all',category:'all',q:'',level:'all',access:'all',favoritesOnly:false,limit:24,project:projectList.some(p=>p.id===params.projectId)?params.projectId:(projectList[0]?.id||''),busy:false};
 const h=(tag,attrs,text)=>''; // Text insertion is escaped below, never HTML from source strings.
 root.innerHTML='<div class="tool-loading" role="status">Chargement des bibliothèques d’outils IA…</div>';
 load().then(data=>{
   if(!root.isConnected)return;
   const categories=[['all','Toutes les catégories'],...data.categories.map(c=>[c.id,c.name])];
   const setOptions=(items,selected)=>items.map(([id,name])=>'<option value="'+esc(id)+'" '+(id===selected?'selected':'')+'>'+esc(name)+'</option>').join('');
   const courseCards=()=>'<div class="tool-tracks">'+[['all','Toutes les ressources','Parcourir les '+data.tools.length+' outils'],...Object.entries(data.courses).map(([id,p])=>[id,p.name,p.desc])].map(([id,label,sub])=>'<button type="button" data-track="'+esc(id)+'" aria-pressed="'+String(id===state.course)+'" class="tool-track '+(id===state.course?'chosen':'')+'"><strong>'+esc(label)+'</strong><small>'+esc(sub)+'</small><span class="tool-track-count">'+(id==='all'?data.tools.length:data.tools.filter(t=>t.courses.includes(id)).length)+' outils</span></button>').join('')+'</div>';
   const makeCard=t=>{
    const flag=favorites.has(t.id),saved=state.project&&isSaved(t,state.project);
    return '<article class="tool-item"><div class="tool-item-top"><div class="tool-logo">'+esc(t.name.slice(0,2).toUpperCase())+'</div><span class="tool-meta">'+esc(data.level_labels[t.level]||'À vérifier')+'</span></div>'+
      '<div class="tool-category">'+esc(data.categories.find(x=>x.id===t.category)?.name||t.category)+'</div><h3>'+esc(t.name)+'</h3>'+
      '<p class="tool-summary">'+esc(t.summary)+'</p><p class="tool-use"><strong>Cas pratique :</strong> '+esc(t.useCase)+'</p>'+
      '<p class="tool-access">'+esc(data.access_labels[t.access]||'Conditions à vérifier')+'</p>'+
      '<div class="tool-actions"><a class="tool-link" href="'+esc(t.url)+'" target="_blank" rel="noopener noreferrer" aria-label="Ouvrir le site officiel de '+esc(t.name)+'">Site officiel ↗</a>'+
      (projectList.length?'<button type="button" class="tool-save" data-tool-save="'+esc(t.id)+'" '+(saved?'disabled':'')+'>'+(saved?'Déjà enregistré':'+ Projet')+'</button>':'')+
      (favoritable?'<button type="button" class="tool-fav" data-tool-fav="'+esc(t.id)+'" aria-pressed="'+String(flag)+'" aria-label="'+(flag?'Retirer des favoris':'Ajouter aux favoris')+' : '+esc(t.name)+'">'+(flag?'★':'☆')+'</button>':'')+
      '</div></article>';
   };
   root.innerHTML='<div class="tool-page"><div class="tool-page-heading"><div><span class="tool-eyebrow">CONTROL · COMPLÉMENT DES FORMATIONS IAGILE</span><h1>Bibliothèques d’outils IA</h1><p>Des ressources concrètes pour créer des sites 3D, concevoir des agents, automatiser les tâches et mieux travailler avec l’IA.</p></div><span class="tool-total">'+data.tools.length+' ressources</span></div>'+
     '<div class="tool-info">Ce catalogue est indépendant du contenu des formations. Chaque lien ouvre le site officiel de l’éditeur. Les licences, accès gratuits, tarifs et limitations peuvent évoluer : vérifie-les avant utilisation. Un outil répertorié n’est pas automatiquement installé ou connecté à CONTROL.</div>'+
     '<div id="tool-course-container"></div>'+
     '<section class="tool-controls"><label>Rechercher un outil<input type="search" class="tool-field" id="tool-query" placeholder="Ex. animations, agent, Blender, modèle local…" autocomplete="off"></label>'+
     '<label>Catégorie<select id="tool-category" class="tool-field">'+setOptions(categories,'all')+'</select></label>'+
     '<label>Complexité<select id="tool-level" class="tool-field">'+setOptions([['all','Tous les niveaux'],['debutant','Débutant'],['intermediaire','Intermédiaire'],['avance','Avancé']],'all')+'</select></label>'+
     '<label>Accès<select id="tool-access" class="tool-field">'+setOptions([['all','Tous les types'],['open_source','Code libre'],['mixed','Offre mixte'],['service','Service en ligne']],'all')+'</select></label>'+
     (projectList.length?'<label>Enregistrer dans le projet<select id="tool-project" class="tool-field">'+setOptions(projectList.map(p=>[p.id,p.name]),state.project)+'</select></label>':'<p class="tool-missing-project">Crée un projet pour pouvoir y enregistrer une ressource.</p>')+
     (favoritable?'<label class="tool-check"><input id="tool-favorites" type="checkbox"> Mes favoris</label>':'')+
     '</section><section class="tool-results" aria-live="polite"><div class="tool-results-head"><h2 id="tool-results-title">Outils disponibles</h2><span id="tool-result-count"></span></div><div id="tool-grid" class="tool-grid"></div><div class="tool-more-wrap"><button type="button" id="tool-more">Afficher davantage d’outils</button></div></section>'+
     '<div id="tool-notice" class="tool-feedback" role="status" aria-live="polite"></div>'+
     '<section class="tool-safety"><strong>À savoir</strong><p>« Code libre » décrit le logiciel, pas nécessairement son hébergement ni les modèles IA associés. Certains fournisseurs nécessitent un abonnement ou une clé API payante. Vérifie aussi les licences des modèles et ressources téléchargées.</p></section></div>';
   const q=selector=>root.querySelector(selector);
   function matches(t){const text=txt([t.name,t.summary,t.useCase,data.categories.find(x=>x.id===t.category)?.name||''].join(' '));return(state.course==='all'||t.courses.includes(state.course))&&(state.category==='all'||t.category===state.category)&&(state.level==='all'||t.level===state.level)&&(state.access==='all'||t.access===state.access)&&(!state.favoritesOnly||favorites.has(t.id))&&(!state.q||text.includes(txt(state.q)))}
   function drawCourse(){q('#tool-course-container').innerHTML=courseCards()}
   function draw(){const found=data.tools.filter(matches),shown=found.slice(0,state.limit);q('#tool-grid').innerHTML=shown.length?shown.map(makeCard).join(''):'<p class="tool-no-results">Aucun outil ne correspond à ces critères. Essaie une autre recherche.</p>';q('#tool-result-count').textContent=shown.length+' sur '+found.length+' outil(s)';q('#tool-more').hidden=shown.length===found.length;q('#tool-results-title').textContent=state.course==='all'?'Explorer les outils':data.courses[state.course]?.name||'Explorer les outils'}
   function redraw(){state.limit=24;drawCourse();draw()}
   function info(s,isError=false){const e=q('#tool-notice');e.textContent=s;e.dataset.error=isError?'true':'false'}
   drawCourse();draw();
   root.addEventListener('click',async e=>{
     const tr=e.target.closest('[data-track]');if(tr&&root.contains(tr)){state.course=tr.dataset.track;state.category='all';q('#tool-category').value='all';redraw();return}
     const fav=e.target.closest('[data-tool-fav]');if(fav&&root.contains(fav)&&favoritable){const id=fav.dataset.toolFav;favorites.has(id)?favorites.delete(id):favorites.add(id);try{localStorage.setItem(favoritesKey,JSON.stringify([...favorites]))}catch{info('Impossible de sauvegarder les favoris sur cet appareil.',true)}draw();return}
     const button=e.target.closest('[data-tool-save]');if(button&&root.contains(button)){const t=data.tools.find(x=>x.id===button.dataset.toolSave);if(!t||!state.project||!params.onAdd)return;button.disabled=true;try{const saved=await params.onAdd(t,state.project);info(saved===false?'L’outil était déjà associé à ce projet.':'« '+t.name+' » ajouté à ton projet.');draw()}catch(err){info(err?.message||'Impossible d’enregistrer cet outil.',true);button.disabled=false}return}
     if(e.target.closest('#tool-more')){state.limit+=24;draw()}
   });
   q('#tool-query').addEventListener('input',e=>{state.q=e.target.value;redraw()});
   q('#tool-category').addEventListener('change',e=>{state.category=e.target.value;redraw()});
   q('#tool-level').addEventListener('change',e=>{state.level=e.target.value;redraw()});
   q('#tool-access').addEventListener('change',e=>{state.access=e.target.value;redraw()});
   q('#tool-project')?.addEventListener('change',e=>{state.project=e.target.value;draw()});
   q('#tool-favorites')?.addEventListener('change',e=>{state.favoritesOnly=e.target.checked;redraw()});
 }).catch(e=>{if(root.isConnected)root.innerHTML='<div class="tool-info">Impossible de charger le catalogue pour le moment. Actualise la page lorsque tu es connecté.</div>'});
}
window.CONTROL_TOOL_CATALOG={mount,load};
})();
