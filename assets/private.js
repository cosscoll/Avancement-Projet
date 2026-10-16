// Écran privé optionnel : ne s'active que lorsque config/private.json contient
// un projet Supabase dédié VALIDÉ. Aucun secret ou token privilégié dans ce fichier.
const $=(selector)=>document.querySelector(selector);
const output=$('#private-status');
const projects=['pack-pro','banque-ia','ucp','iagile','tcg'];
let sb=null,owner=null;
const escapeHtml=(value)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel=(value)=>value?new Date(value).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Paris'}):'Date inconnue';
const notify=(message,error=false)=>{output.textContent=message;output.className=error?'private-error':'private-ok'};
const currentProject=()=>$('#project-picker').value;
function renderEntries(selector,items,kind){
  const el=$(selector);
  if(!items.length){el.innerHTML='<p class="small muted">Aucune entrée dans cet espace.</p>';return;}
  el.innerHTML=items.map(item=>{
    if(kind==='instruction')return `<article class="private-entry"><h3>${escapeHtml(item.state)} · ${escapeHtml(dateLabel(item.created_at))}</h3><p>${escapeHtml(item.body)}</p><small>Identifiant : ${escapeHtml(item.id)}</small>${item.response?'<p>Réponse : '+escapeHtml(item.response)+'</p>':''}</article>`;
    if(kind==='decision')return `<article class="private-entry"><h3>${escapeHtml(item.state)} · ${escapeHtml(dateLabel(item.created_at))}</h3><p>${escapeHtml(item.question)}</p>${item.decision_note?'<p>Note : '+escapeHtml(item.decision_note)+'</p>':''}${item.state==='pending'||item.state==='deferred'?`<div><button class="btn small" data-decision="${escapeHtml(item.id)}" data-status="accepted">Accepter</button><button class="btn small" data-decision="${escapeHtml(item.id)}" data-status="rejected">Refuser</button><button class="btn small" data-decision="${escapeHtml(item.id)}" data-status="deferred">Reporter</button></div>`:''}</article>`;
    return `<article class="private-entry"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.details||'')}</p><small>${escapeHtml(item.severity)} · ${escapeHtml(dateLabel(item.created_at))}</small>${item.acknowledged_at?'<p class="small">Lecture confirmée.</p>':`<p><button class="btn small" data-alert="${escapeHtml(item.id)}">Marquer comme lue</button></p>`}</article>`;
  }).join('');
}
async function refreshData(){
 const id=currentProject();
 $('#go-public').href='index.html#/'+id+'/sprints';
 notify('Chargement des informations privées…');
 const queries=await Promise.all([
    sb.from('control_instructions').select('id,body,state,created_at,response').eq('project_id',id).order('created_at',{ascending:false}).limit(100),
    sb.from('control_decisions').select('id,question,state,decision_note,created_at').eq('project_id',id).order('created_at',{ascending:false}).limit(100),
    sb.from('control_alerts').select('id,title,details,severity,acknowledged_at,created_at').eq('project_id',id).eq('resolved',false).order('created_at',{ascending:false}).limit(100)
 ]);
 const failure=queries.find(result=>result.error);
 if(failure){notify('Accès ou chargement refusé : '+failure.error.message,true);return}
 renderEntries('#instruction-list',queries[0].data||[],'instruction');
 renderEntries('#decision-list',queries[1].data||[],'decision');
 renderEntries('#alert-list',queries[2].data||[],'alert');
 notify('Données privées chargées pour '+$('#project-picker').selectedOptions[0].text+'.');
}
async function requireOwner(session){
  if(!session?.user){owner=null;$('#login-panel').hidden=false;$('#dashboard-panel').hidden=true;notify('Connexion requise : seul le propriétaire autorisé peut voir ces données.');return}
  const {data,error}=await sb.from('control_owners').select('user_id').eq('user_id',session.user.id).maybeSingle();
  if(error||!data){owner=null;$('#login-panel').hidden=true;$('#dashboard-panel').hidden=true;notify('Ce compte n’a pas accès à la console. Ne publie pas d’informations sensibles.',true);return}
  owner=session.user;
  $('#login-panel').hidden=true;$('#dashboard-panel').hidden=false;
  await refreshData();
}
async function start(){
  let config;
  try{
    const r=await fetch('config/private.json',{cache:'no-store'});
    if(!r.ok)throw Error('Configuration absente');
    config=await r.json();
  }catch(e){notify('Le service privé n’est pas configuré. Utilise le canal GitHub public pour les consignes non confidentielles.',true);return;}
  if(!config.enabled||!/^https:\/\/[a-z0-9.-]+\.supabase\.co\/?$/.test(config.supabaseUrl||'')||!String(config.publishableKey||'').startsWith('sb_publishable_')){
    notify('Le canal privé est en préparation : aucun projet Supabase dédié n’a encore été activé. Aucune instruction privée ne sera envoyée depuis ce site.');
    return;
  }
  try{
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    sb=createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  }catch(e){notify('Impossible de charger le client de connexion. Aucun secret ni consigne n’a été transmis.',true);return;}
  const params=new URLSearchParams(location.search);
  const projectId=params.get('project');
  if(projects.includes(projectId))$('#project-picker').value=projectId;
  const {data:{session},error}=await sb.auth.getSession();
  if(error){notify(error.message,true);return}
  await requireOwner(session);
  sb.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>requireOwner(session),0)});
}
$('#login-form').addEventListener('submit',async(e)=>{
  e.preventDefault();if(!sb)return;
  const email=$('#owner-email').value.trim();
  const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:location.href}});
  notify(error?'Échec de la connexion : '+error.message:'Vérifie les messages de ton adresse autorisée pour le lien de connexion.',!!error);
});
$('#logout-private').addEventListener('click',async()=>{if(!sb)return;await sb.auth.signOut();notify('Déconnecté de la console privée.')});
$('#project-picker').addEventListener('change',()=>{history.replaceState(null,'',location.pathname+'?project='+encodeURIComponent(currentProject()));refreshData()});
$('#refresh-private').addEventListener('click',refreshData);
$('#instruction-form').addEventListener('submit',async(e)=>{
  e.preventDefault();if(!owner)return;
  const body=$('#instruction-body').value.trim();
  if(!body)return;
  const {error}=await sb.from('control_instructions').insert({project_id:currentProject(),author_id:owner.id,body});
  if(error){notify('Instruction non enregistrée : '+error.message,true);return}
  $('#instruction-body').value='';await refreshData();notify('Instruction privée enregistrée. Lecture par l’automatisation encore à valider de bout en bout.');
});
$('#decision-form').addEventListener('submit',async(e)=>{
  e.preventDefault();if(!owner)return;
  const question=$('#decision-question').value.trim();
  if(!question)return;
  const {error}=await sb.from('control_decisions').insert({project_id:currentProject(),question});
  if(error){notify('Demande non créée : '+error.message,true);return}
  $('#decision-question').value='';await refreshData();notify('Demande de décision privée enregistrée.');
});
$('#decision-list').addEventListener('click',async e=>{
  const button=e.target.closest('button[data-decision]');
  if(!button||!owner)return;
  const id=button.dataset.decision,status=button.dataset.status;
  if(!['accepted','rejected','deferred'].includes(status))return;
  if(!confirm('Confirmer cette décision ? Aucune action sensible (Work/Codex, dépense, publication) ne sera déclenchée automatiquement.'))return;
  const decision_note=prompt('Note facultative de justification :')||null;
  const {error}=await sb.from('control_decisions').update({state:status,decision_note,decided_by:owner.id,decided_at:new Date().toISOString()}).eq('id',id).eq('project_id',currentProject());
  if(error){notify('Décision non enregistrée : '+error.message,true);return}
  await refreshData();notify('Décision enregistrée dans la base privée.');
});
$('#alert-list').addEventListener('click',async e=>{
  const button=e.target.closest('button[data-alert]');if(!button||!owner)return;
  const {error}=await sb.from('control_alerts').update({acknowledged_at:new Date().toISOString()}).eq('id',button.dataset.alert).eq('project_id',currentProject());
  if(error){notify('Accusé de lecture impossible : '+error.message,true);return}
  await refreshData();notify('Alerte marquée comme lue, sans la masquer ni la résoudre.');
});
start();