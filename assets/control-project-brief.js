/* CONTROL 24 — Project-only read-only overview: no API or storage writes. */
(function(root){
'use strict';
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
function safeUrl(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!Array.from(u.searchParams.keys()).some(k=>/^(token|access_token|api_key|secret|password|code)$/i.test(k))?u.href:''}catch{return''}}
function summarize(project,local,raw,now=new Date()){
 if(!obj(project)||typeof project.id!=='string'||!project.id)return{status:'invalid',projectId:''};
 const id=project.id,d=obj(local)?local:{};let actions=[],status='ok';
 try{const data=raw==null||raw===''?{}:typeof raw==='string'?JSON.parse(raw):raw;if(!obj(data)||data.actions!==undefined&&!Array.isArray(data.actions))throw Error('Invalid tasks');actions=data.actions||[]}catch{status='invalid'}
 const day=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
 const assigned=actions.filter(x=>obj(x)&&x.project===id&&typeof x.title==='string'&&x.title.trim()&&x.status!=='cancelled');
 const pending=assigned.filter(x=>x.status!=='done');
 const level=x=>validDate(x.due)&&x.due<day?0:validDate(x.due)&&x.due===day?1:x.priority==='Critique'?2:x.status==='doing'?3:4;
 const tasks=pending.slice().sort((a,b)=>level(a)-level(b)||String(a.due||'9999').localeCompare(String(b.due||'9999'))||a.title.localeCompare(b.title,'fr')).slice(0,3).map(x=>({id:typeof x.id==='string'?x.id:'',title:x.title,label:level(x)===0?'En retard':level(x)===1?'Aujourd’hui':x.status==='doing'?'En cours':'À faire'}));
 const notes=typeof d.memo==='string'?d.memo.trim():'';
 const reports=obj(d.reports)?Object.entries(d.reports).filter(([key,r])=>obj(r)&&typeof r.text==='string'&&r.text.trim()).sort((a,b)=>String(b[1].updatedAt||'').localeCompare(String(a[1].updatedAt||''))):[];
 const links=[],seen=new Set();
 const add=(label,url)=>{const u=safeUrl(url);if(u&&!seen.has(u)){seen.add(u);links.push({label:String(label||'Ressource').slice(0,90),url:u})}};
 if(typeof project.repo==='string'&&/^[\w.-]+$/.test(project.repo))add('Dépôt GitHub','https://github.com/cosscoll/'+encodeURIComponent(project.repo));
 if(obj(project.website))add(project.website.label||'Site web',project.website.url);
 for(const item of [...(Array.isArray(project.other_sites)?project.other_sites:[]),...(Array.isArray(d.links)?d.links:[])])if(obj(item))add(item.label,item.url);
 return{status,projectId:id,open:pending.length,overdue:pending.filter(x=>level(x)===0).length,tasks:status==='ok'?tasks:[],notes,report:reports.length?{provider:reports[0][0],date:String(reports[0][1].updatedAt||'').slice(0,10)}:null,links:links.slice(0,4)};
}
function render(project,local,raw,now){
 const s=summarize(project,local,raw,now);if(!s.projectId)return'';
 const p=encodeURIComponent(s.projectId);
 const url='#/control/inbox?project='+p,create='#/control/inbox/new?project='+p;
 const tasks=s.status==='invalid'?'<p role="alert" class="control-project-brief-empty">Tâches locales illisibles : consultez les sauvegardes sans modifier ces données.</p>':
 s.tasks.length?s.tasks.map(t=>'<a class="control-project-brief-task" href="'+url+(t.id?'&task='+encodeURIComponent(t.id):'')+'"><strong>'+esc(t.title)+'</strong><small>'+esc(t.label)+'</small></a>').join(''):
 '<p class="control-project-brief-empty">Aucune tâche ouverte associée à ce projet sur cet appareil.</p>';
 const notes=s.notes?'<p class="control-project-brief-note">'+esc(s.notes.slice(0,240))+(s.notes.length>240?'…':'')+'</p>':
 '<p class="control-project-brief-empty">Aucune décision ou note saisie pour ce projet.</p>';
 const report=s.report?'<small class="control-project-brief-provenance">Dernier bilan IA ajouté manuellement : '+esc(s.report.provider)+(validDate(s.report.date)?' · '+esc(s.report.date):'')+'</small>':
 '<small class="control-project-brief-provenance">Aucun bilan IA ajouté manuellement.</small>';
 const resources=s.links.length?s.links.map(x=>'<a class="control-project-brief-resource" href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">'+esc(x.label)+' <span aria-hidden="true">↗</span></a>').join(''):
 '<p class="control-project-brief-empty">Aucune ressource enregistrée pour ce projet.</p>';
 return '<section id="control-project-brief" class="control-project-brief" data-project-brief="'+esc(s.projectId)+'" aria-labelledby="control-project-brief-title">'+
 '<div class="control-project-brief-head"><div><small>MON PROJET</small><h2 id="control-project-brief-title">En un coup d’œil</h2></div><a class="control-project-brief-create" href="'+create+'">+ Nouvelle tâche liée</a></div>'+
 '<div class="control-project-brief-grid">'+
 '<div class="control-project-brief-panel" data-brief-panel="tasks"><div class="control-project-brief-panel-head"><h3>Prochaines tâches</h3><span>'+(s.status==='ok'?s.open:'—')+'</span></div>'+
 (s.status==='ok'&&s.overdue?'<p class="control-project-brief-alert">'+s.overdue+' tâche(s) en retard</p>':'')+
 '<div class="control-project-brief-list">'+tasks+'</div><a class="control-project-brief-more" href="'+url+'">Toutes les tâches du projet</a></div>'+
 '<div class="control-project-brief-panel" data-brief-panel="decisions"><div class="control-project-brief-panel-head"><h3>Décisions et notes</h3></div>'+
 notes+report+'<a class="control-project-brief-more" href="#/project/'+p+'/pilot">Voir et modifier dans Suivi</a></div>'+
 '<div class="control-project-brief-panel" data-brief-panel="resources"><div class="control-project-brief-panel-head"><h3>Ressources</h3></div>'+
 '<div class="control-project-brief-list">'+resources+'</div><a class="control-project-brief-more" href="#/project/'+p+'/resources">Tous les documents et liens</a></div></div>'+
 '<p class="control-project-brief-footnote">Données enregistrées sur cet appareil pour ce projet. Les comptes IA ne sont pas synchronisés automatiquement.</p></section>';
}
root.CONTROL_PROJECT_BRIEF={summarize,render,safeUrl,esc};
if(typeof module==='object'&&module.exports)module.exports=root.CONTROL_PROJECT_BRIEF;
})(typeof window==='object'?window:globalThis);
