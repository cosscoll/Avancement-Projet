/* CONTROL — Registre local multi-IA des automatisations.
 * Les tâches ChatGPT d'origine sont des instantanés publics datés, pas un accès API.
 * Les modifications sont des brouillons locaux, jamais appliquées à un fournisseur.
 */
(()=>{'use strict';
const providers=[
 {id:'ChatGPT',name:'ChatGPT',url:'https://chatgpt.com/scheduled',hint:'ChatGPT → Planifiées : ouvrir la tâche pour voir ses instructions, son modèle éventuel et la modifier.'},
 {id:'Codex',name:'Codex',url:'https://chatgpt.com/codex',hint:'Codex possède un système d’automatisations séparé de ChatGPT. Ouvre Codex pour consulter ses réglages.'},
 {id:'Claude',name:'Claude',url:'https://claude.ai/',hint:'Claude → Cowork → Planifiées / Scheduled. La disponibilité dépend de ton compte.'},
 {id:'Gemini',name:'Gemini',url:'https://gemini.google.com/',hint:'Gemini → Paramètres et aide → Actions planifiées, ou page des tâches programmées.'}
];
let seeded=[],fetched=false,fetching=null;
const get=(s)=>document.querySelector(s);
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const https=v=>{try{let u=new URL(String(v||''));return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return''}};
const l=(u,label,cls='button')=>https(u)?'<a class="'+cls+'" target="_blank" rel="noopener noreferrer" href="'+h(https(u))+'">'+h(label)+' ↗</a>':'';
const enc=encodeURIComponent;
const localKey='control-automations-v1';
let localCorrupt=false;function getLocal(){try{const raw=localStorage.getItem(localKey);if(raw===null){localCorrupt=false;return{}}const v=JSON.parse(raw);if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid local automations');localCorrupt=false;return v}catch{localCorrupt=true;return{}}}
let local=getLocal();
function save(){if(localCorrupt){toast('Registre local illisible : sauvegarde bloquée pour préserver les données. Ouvre Sauvegardes.');return false}try{localStorage.setItem(localKey,JSON.stringify(local));return true}catch{toast('Stockage local indisponible : aucun brouillon enregistré.');return false}}
function commitDraft(change){if(localCorrupt){save();return false}let before;try{before=JSON.stringify(local)}catch{toast('Registre illisible : modification refusée.');return false}try{change()}catch{try{local=JSON.parse(before)}catch{}toast('Modification annulée.');return false}if(save())return true;try{local=JSON.parse(before)}catch{}return false}
function all(ctx){return [...seeded,...(Array.isArray(local.extra)?local.extra:[])];}
function activeProviders(ctx){
 const custom=(ctx.projects||[]).flatMap(p=>ctx.state?.[p.id]?.customProviders||[]);
 const ids=new Set([...providers.map(x=>x.id),...custom]);
 for(const t of all(ctx))ids.add(t.provider||'Autre');
 return [...ids].map(id=>providers.find(p=>p.id===id)||{id,name:id,url:'',hint:'Ouvre le fournisseur et consulte ses automatisations.'});
}
function listFor(ctx,id){return all(ctx).filter(t=>t.provider===id);}
function meta(t){return {...t,...(local.edits?.[t.uid]||{})};}
function toast(msg){const e=get('#auto-message');if(e){e.textContent=msg;e.hidden=false;return}alert(msg)}
function localOnlyTag(){return (localCorrupt?'<p role="alert" class="notice"><strong>Le registre local des automatisations est illisible.</strong> Aucun brouillon ne sera enregistré avant récupération. <a href="#/control/backup">Récupérer les données brutes</a>.</p>':'')+'<p class="notice"><strong>Registre CONTROL, pas une synchronisation.</strong> Les informations ci-dessous ne sont pas importées en temps réel des comptes IA. Les changements saisis ici restent des brouillons locaux et ne modifient aucune automatisation réelle.</p>'}
function cardProvider(ctx,p){const ts=listFor(ctx,p.id),count=ts.length;
return '<a class="card auto-provider-card" href="#/automations/'+enc(p.id)+'"><div class="badge">'+h(p.id.slice(0,2))+'</div><strong>'+h(p.name)+'</strong><small>'+count+' automatisation(s) enregistrée(s) · '+(p.id==='ChatGPT'?'Dernier relevé daté':'Ajout manuel')+'</small></a>';
}
function header(title,subtitle,back='#/automations'){return '<a class="back" href="'+h(back)+'">← Retour</a><div class="toprow"><div><div class="quiet">PILOTAGE DES TÂCHES IA</div><h1>'+h(title)+'</h1><p class="muted">'+h(subtitle)+'</p></div></div>'}
function taskRow(t){const m=meta(t),status=t.snapshotStatus==='active'?'Active au dernier relevé':t.snapshotStatus==='unknown'?'Statut non vérifié':'Saisie manuellement';
return '<a class="auto-task" href="#/automations/'+enc(t.provider)+'/'+enc(t.uid)+'"><div><strong>'+h(m.title||t.title)+'</strong><small>'+h(m.schedule||'Programmation inconnue')+' · '+h(t.projectName||t.project||'Projet non indiqué')+'</small></div><span class="chip">'+h(status)+'</span></a>';
}
function overview(ctx){const root=get('#main');root.innerHTML='<div class="toprow"><div><div class="quiet">CENTRE DE PILOTAGE</div><h1>Automatisations</h1><p class="muted">Tâches par IA · objectifs, contraintes, modèles, conversations et accès direct à la gestion.</p></div>'+l('https://chatgpt.com/scheduled','Ouvrir ChatGPT · Planifiées')+'</div>'+localOnlyTag()+'<div class="grid auto-grid">'+activeProviders(ctx).map(p=>cardProvider(ctx,p)).join('')+'</div><section class="panel"><h2>Ce que CONTROL peut gérer</h2><p class="muted">Clique sur une IA pour consulter ses fiches. Les fiches ChatGPT contiennent un résumé daté des tâches actives connues. Pour Claude, Gemini, Codex et les autres IA, ajoute manuellement les tâches que tu souhaites piloter.</p><p class="muted">Les catégories « modèle » et « quota » restent <strong>non vérifiées</strong> quand le fournisseur ne communique pas le modèle réellement exécuté ou le régime de facturation.</p></section><p id="auto-message" role="status" hidden></p>';}
function provider(ctx,id){const root=get('#main'),p=activeProviders(ctx).find(x=>x.id===id);
if(!p){root.innerHTML=header('IA introuvable','','#/automations');return}
const items=listFor(ctx,id);
root.innerHTML=header('Automatisations · '+id,p.hint)+
 '<div class="auto-topactions">'+l(p.url,'Gérer dans '+id,'button primary')+'<button id="auto-new" class="primary">+ Référencer une automatisation</button></div>'+
 localOnlyTag()+
 '<section class="panel"><div class="sectionhead"><h2>Automatisations enregistrées</h2><span class="chip">'+items.length+' fiche(s)</span></div>'+
 (items.length?items.map(taskRow).join(''):'<p class="empty">Aucune automatisation référencée pour '+h(id)+'. Utilise « Référencer une automatisation » pour ajouter une fiche ou ouvre '+h(id)+' afin de consulter ses tâches réelles.</p>')+'</section>'+
 '<section class="panel hidden" id="auto-new-form"><h2>Nouvelle fiche '+h(id)+'</h2><p class="muted">Cette action crée une fiche de suivi locale, pas une automatisation chez '+h(id)+'.</p>'+
 '<form id="auto-create"><label>Nom de l’automatisation<input name="title" maxlength="100" required class="field" placeholder="Ex. Veille quotidienne"></label>'+
 '<label>Projet associé<select id="auto-project" class="field" name="project"><option value="">Sans projet associé</option>'+ctx.projects.map(x=>'<option value="'+h(x.id)+'">'+h(x.name||x.id)+'</option>').join('')+'</select></label>'+
 '<label>Lien de la tâche ou de sa conversation (facultatif)<input type="url" class="field" name="conversation" placeholder="https://…"></label>'+
 '<button class="primary">Ajouter la fiche</button></form></section><p id="auto-message" role="status" hidden></p>';
get('#auto-new').onclick=()=>get('#auto-new-form').classList.toggle('hidden');
get('#auto-create').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),title=String(f.get('title')||'').trim(),project=String(f.get('project')||''),
  conversation=String(f.get('conversation')||'').trim();
 if(conversation&&!https(conversation)){toast('Lien HTTPS valide nécessaire.');return}
 if(!title)return;
 const uid='manual-'+Date.now()+'-'+Math.floor(Math.random()*1e5);
 if(commitDraft(()=>{local.extra??=[];local.extra.push({uid,provider:id,title,project,projectName:ctx.projects.find(p=>p.id===project)?.name||'',objective:'',rules:'',constraints:'',schedule:'Non renseignée',model:'Non vérifié',usage:'Non vérifié',conversation,snapshotStatus:'unknown',source:'Fiche manuelle'})}))location.hash='#/automations/'+enc(id)+'/'+enc(uid);
 };
}
const field=(label,name,value,extra='')=>'<label>'+h(label)+'<input class="field" name="'+h(name)+'" maxlength="2000" value="'+h(value||'')+'" '+extra+'></label>';
const area=(label,name,value)=>'<label>'+h(label)+'<textarea class="field" name="'+h(name)+'" rows="4" maxlength="20000">'+h(value||'')+'</textarea></label>';
function detail(ctx,id,uid){const task=listFor(ctx,id).find(t=>t.uid===uid),root=get('#main');if(!task){root.innerHTML=header('Fiche introuvable','','#/automations/'+enc(id));return}
const p=activeProviders(ctx).find(x=>x.id===id),m=meta(task),project=ctx.projects.find(x=>x.id===(m.project||task.project));const conversation=m.conversation||ctx.state?.[m.project||task.project]?.projectUrl||'';
const date=task.verified_at?new Date(task.verified_at).toLocaleString('fr-FR'):'Non datée';
const usage=m.usage||'Non vérifié';const model=m.model||'Non vérifié';
root.innerHTML=header(m.title,'Fiche '+id+' · '+(task.source||'Saisie manuelle'),'#/automations/'+enc(id))+
 '<div class="auto-topactions">'+l(conversation,'Conversation / projet','button')+l(m.manageUrl||p?.url||'','Gérer réellement dans '+id,'button primary')+'</div>'+
 localOnlyTag()+'<section class="panel"><h2>Fiche de l’automatisation</h2>'+
 '<div class="auto-facts">'+[
 ['IA',id],['Projet',project?.name||m.projectName||'Non associé'],['Dernier contrôle',date],
 ['État',task.snapshotStatus==='active'?'Active au dernier relevé, non vérifiée depuis':task.snapshotStatus==='unknown'?'Non vérifié':'Non vérifié'],
 ['Fréquence',m.schedule||'Non renseignée'],['Modèle IA',model],['Type d’utilisation / quotas',usage],
 ['Conversation associée',conversation?'Lien renseigné':'Non reliée']
 ].map(([a,b])=>'<div><span class="muted">'+h(a)+'</span><strong>'+h(b)+'</strong></div>').join('')+'</div>'+
 '<h3>Objectif</h3><p class="auto-text">'+h(m.objective||'Non renseigné')+'</p>'+
 '<h3>Règles</h3><p class="auto-text">'+h(m.rules||'Non renseignées')+'</p>'+
 '<h3>Contraintes</h3><p class="auto-text">'+h(m.constraints||'Non renseignées')+'</p></section>'+
 '<section class="panel"><div class="sectionhead"><h2>Préparer une modification</h2><span class="chip">Brouillon local</span></div><p class="muted">Modifier cette fiche n’édite pas la tâche réelle. Pour appliquer le changement, copie les nouvelles consignes puis ouvre sa page officielle dans '+h(id)+'.</p>'+
 '<form id="auto-edit">'+
 field('Titre','title',m.title)+field('Fréquence / déclencheur','schedule',m.schedule)+
 area('Objectif','objective',m.objective)+area('Règles','rules',m.rules)+area('Contraintes','constraints',m.constraints)+
 field('Modèle sélectionné / constaté (si connu)','model',m.model||'Non vérifié')+
 '<label>Type d’utilisation / quotas<select class="field" name="usage">'+['Non vérifié','Modèle ou outil à quota limité','Mode autorisé sans quota partagé identifié','API facturée à l’usage','Quotas partagés interdits (selon les consignes)','Autre — à vérifier'].map(v=>'<option '+(usage===v?'selected':'')+'>'+h(v)+'</option>').join('')+'</select></label>'+
 field('URL de la conversation ou de la tâche','conversation',m.conversation||'', 'type="url" placeholder="https://…"')+
 field('Lien direct de gestion chez '+id+' (si connu)','manageUrl',m.manageUrl||'', 'type="url" placeholder="https://…"')+
 '<div class="actions"><button class="primary">Enregistrer le brouillon</button><button type="button" id="auto-copy">Copier la demande de modification</button></div></form>'+
 '<p class="muted">L’application n’envoie aucune commande de mise à jour à l’IA. Ne stocke pas ici de clé, mot de passe ou information confidentielle.</p></section>'+
 '<section class="panel"><h2>Accéder aux outils associés</h2><div class="actions">'+
 (project?'<a class="button" href="#/project/'+enc(project.id)+'/ai">Espaces IA du projet</a>':'')+
 (project?'<a class="button" href="#/project/'+enc(project.id)+'/pilot">Gestion du projet</a>':'')+
 l(p?.url,'Ouvrir '+id)+'</div></section><p id="auto-message" role="status" hidden></p>';
const form=get('#auto-edit');
function values(){const f=new FormData(form);const out={};for(const [k,v] of f.entries())out[k]=String(v).trim();return out}
form.onsubmit=e=>{e.preventDefault();const v=values();for(const k of ['conversation','manageUrl'])if(v[k]&&!https(v[k]))return toast('Lien HTTPS invalide pour '+k);if(commitDraft(()=>{local.edits??={};local.edits[uid]=v}))toast('Brouillon enregistré ici, PAS dans '+id+'.')};
get('#auto-copy').onclick=async()=>{const v=values();const draft='DEMANDE DE MODIFICATION — '+id+'\nAutomatisation : '+(v.title||task.title)+'\nFréquence : '+v.schedule+'\nProjet : '+(project?.name||'Non associé')+'\nModèle souhaité/indiqué : '+v.model+'\nType d’utilisation : '+v.usage+'\nObjectif :\n'+v.objective+'\nRègles :\n'+v.rules+'\nContraintes :\n'+v.constraints+'\n\nIMPORTANT : vérifier l’automatisation existante et ses limites, ne pas créer de doublon. Appliquer uniquement après mon approbation explicite et ne jamais engager de dépense.';try{await navigator.clipboard.writeText(draft);toast('Demande copiée. Ouvre ensuite '+id+' pour modifier réellement la tâche.')}catch{toast('Impossible de copier automatiquement : vérifie les permissions du navigateur.')}};
}
async function ensure(){if(fetched)return;if(!fetching)fetching=fetch('./data/automations.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('missing');return r.json()}).then(d=>{if(Array.isArray(d.tasks))seeded=d.tasks.filter(x=>x.active_at_last_check===true).map(t=>({...t,uid:'chatgpt-'+t.id,provider:'ChatGPT',project:t.id,projectName:t.projectName||t.title,snapshotStatus:'active',verified_at:d.verified_at,source:'Relevé daté'}));fetched=true}).catch(()=>{seeded=[];fetched=true}).finally(()=>{fetching=null});await fetching;}
async function render(ctx){const hash=decodeURIComponent(location.hash.slice(1)),parts=hash.split('/').filter(Boolean);if(parts[0]!=='automations')return;get('#main').innerHTML='<p class="muted">Chargement du registre d’automatisations…</p>';await ensure();if(decodeURIComponent(location.hash.slice(1))!==hash)return;
if(parts.length===1)return overview(ctx);
if(parts.length===2)return provider(ctx,parts[1]);
return detail(ctx,parts[1],parts.slice(2).join('/'));
}
window.CONTROL_AUTOMATIONS={render};
})();
