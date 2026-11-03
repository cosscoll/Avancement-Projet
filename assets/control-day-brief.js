/* CONTROL — Daily focus from records stored on this device only.
   No API calls, network data, credentials or background actions. */
(function (root) {
'use strict';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const localDay=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
function validDay(text){
 if(typeof text!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(text))return false;
 const d=new Date(text+'T00:00:00Z');
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===text;
}
function summarize(raw,now=new Date()){
 const empty={status:'empty',open:0,overdue:0,today:0,review:0,items:[]};
 if(raw===null||raw===undefined||raw==='')return empty;
 let data;
 try{data=typeof raw==='string'?JSON.parse(raw):raw;}catch{return {...empty,status:'invalid'};}
 if(!data||typeof data!=='object'||Array.isArray(data)||data.actions!==undefined&&!Array.isArray(data.actions)||data.missions!==undefined&&!Array.isArray(data.missions))return {...empty,status:'invalid'};
 const date=now&&typeof now.getTime==='function'&&Number.isFinite(now.getTime())?now:new Date();
 const current=localDay(date);
 const actions=Array.isArray(data.actions)?data.actions:[];
 const missions=Array.isArray(data.missions)?data.missions:[];
 const items=[];let overdue=0,today=0,review=0,open=0;
 for(const action of actions){
  if(!action||typeof action!=='object'||Array.isArray(action)||action.status==='done'||action.status==='cancelled')continue;
  if(typeof action.title!=='string'||!action.title.trim())continue;
  open++;
  const due=validDay(action.due)?action.due:'';
  const late=Boolean(due&&due<current),isToday=due===current;
  if(late)overdue++;
  if(isToday)today++;
  const critical=action.priority==='Critique',high=action.priority==='Haute';
  const rank=late?0:isToday?1:critical?3:high?4:due?6:5;
  const label=late?'En retard · '+due.split('-').reverse().join('/'):isToday?"Aujourd’hui":critical?'Priorité critique':high?'Priorité haute':due?'Pour le '+due.split('-').reverse().join('/'): 'À planifier';
  items.push({kind:'action',id:typeof action.id==='string'?action.id:'',title:action.title.trim().slice(0,180),project:typeof action.project==='string'?action.project:'',label,rank,due});
 }
 for(const mission of missions){
  if(!mission||typeof mission!=='object'||Array.isArray(mission)||mission.status!=='review'||typeof mission.title!=='string'||!mission.title.trim())continue;
  review++;
  items.push({kind:'mission',id:typeof mission.id==='string'?mission.id:'',title:mission.title.trim().slice(0,180),project:typeof mission.project==='string'?mission.project:'',label:'Résultat à vérifier',rank:2,due:''});
 }
 items.sort((a,b)=>a.rank-b.rank||a.due.localeCompare(b.due)||a.title.localeCompare(b.title,'fr'));
 return {status:'ready',open,overdue,today,review,items:items.slice(0,3)};
}
function render(raw,projectNames={},now){
 const data=summarize(raw,now);
 const unavailable=data.status==='invalid';
 const values=unavailable?['—','—','—']:[String(data.overdue),String(data.today),String(data.review)];
 const counts='<div class="control-day-counts" aria-label="État des tâches enregistrées">'+
  [['En retard',values[0]],["Aujourd’hui",values[1]],['À vérifier',values[2]]].map(([label,value])=>'<div class="control-day-count"><strong>'+value+'</strong><small>'+label+'</small></div>').join('')+'</div>';
 let list;
 if(unavailable)list='<p class="control-day-empty" role="alert">Les données locales des actions sont illisibles. Ouvrez « À traiter » pour vérifier leur état, sans effacer vos sauvegardes.</p>';
 else if(!data.items.length)list='<div class="control-day-empty"><strong>Aucune tâche enregistrée en attente ici.</strong><span>Ajoutez une première action pour afficher vos priorités. Les tâches des applications externes ne sont pas incluses.</span></div>';
 else list='<ol class="control-day-list">'+data.items.map(item=>{
  const project=projectNames&&typeof projectNames[item.project]==='string'?projectNames[item.project]:'Sans projet associé';
  const dest=item.kind==='mission'?'#/control/missions':item.id?'#/control/inbox?task='+encodeURIComponent(item.id):'#/control/inbox';
  return '<li><a href="'+dest+'"><span class="control-day-item-text"><strong>'+escapeHtml(item.title)+'</strong><small>'+escapeHtml(project)+'</small></span><span class="control-day-item-label">'+escapeHtml(item.label)+'</span><span aria-hidden="true">→</span></a></li>';
 }).join('')+'</ol>';
 return '<section class="control-day-brief" aria-labelledby="control-day-title"><div class="control-day-header"><div><span class="control-day-eyebrow">MON ACTIVITÉ · DONNÉES LOCALES</span><h2 id="control-day-title">À ne pas oublier</h2><p>Vos prochaines actions, selon les tâches et missions renseignées dans CONTROL.</p></div><a class="control-day-new" href="#/control/inbox/new">+ Créer une tâche</a></div>'+counts+list+
 '<div class="control-day-footer"><span>Pas de synchronisation automatique avec Gmail, les autres IA ou votre équipe.</span><a href="#/control/inbox">Voir tout ce qui est à traiter →</a></div></section>';
}
const api={summarize,render};
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.CONTROL_DAY_BRIEF=api;
})(typeof window==='object'?window:undefined);
