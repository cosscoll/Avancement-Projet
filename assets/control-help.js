/* Assistant CONTROL — contextual, grounded, local support.
 * This is an in-app help engine, NOT a private-chat LLM or API proxy.
 * Public reference data only. Questions/transcript are held in memory, not uploaded.
 */
(()=>{'use strict';
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const stop=new Set('a ai alors au aux avec avoir ca ce ces cet cette comme comment dans de des du elle en est et etre faire faut il ils je j la le les leur ma mais me mes moi mon ne nos notre nous on ou par pas peut peux pour pourquoi que quel quelle quels quelles qui sa se ses si son sont sur ta tes ton tout tous tu un une vos votre vous y'.split(' '));
const words=s=>[...new Set(norm(s).split(' ').filter(x=>x.length>2&&!stop.has(x)))];
const starts=(s,patterns)=>patterns.some(p=>new RegExp('\\b'+p+'\\b','i').test(norm(s)));
const isLink=s=>{try{const x=new URL(s);return x.protocol==='https:'&&!x.username&&!x.password&&!Array.from(x.searchParams.keys()).some(k=>/^(token|access_token|api_key|secret|password|code)$/i.test(k))}catch{return false}};
const MODE=location.pathname.endsWith('/app.html')?'cloud':'personal';
const DEST={
 projects:['Projets','#/','projects'],inbox:['À traiter','#/control/inbox','inbox'],missions:['Missions IA','#/control/missions','missions'],
 automations:['Automatisations','#/automations','automations'],manager:['CONTROL IA','#/control/manager','manager'],command:['Commander Claude et Gemini','#/control/command','command'],lab:['Laboratoire IA','#/control/lab','lab'],
 catalog:['Bibliothèques IA','#/control/catalog','catalog'],deploy:['Guides de mise en ligne','#/control/deploy','deploy'],
 activity:['Activité GitHub','#/control/activity','activity'],library:['Bibliothèque','#/control/library','tools'],
 backup:['Sauvegardes','#/control/backup','tools'],budget:['Budget et quotas','#/control/budget','tools'],
 settings:['Règles et connexions','#/control/settings','account'],account:['Mon compte','#/settings','account'],
};
let adapter={mode:MODE},kb=[],guides=[],tools=[],ready=null,lastSubject=null,history=[],isOpen=false,lastFocus=null;
let launch,box,list,input,actions,body,status,generation=0;
function getHelp(){
 if(ready)return ready;
 ready=Promise.allSettled([
   fetch('./data/help-center.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('help');return r.json()}),
   fetch('./data/deployment-guides.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('deploy');return r.json()}),
   fetch('./data/ai-tool-libraries.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('catalog');return r.json()})
 ]).then(r=>{
   if(r[0].status==='fulfilled'&&Array.isArray(r[0].value?.entries))kb=r[0].value.entries.filter(x=>x.id&&x.title&&x.answer);
   if(r[1].status==='fulfilled'&&Array.isArray(r[1].value?.guides))guides=r[1].value.guides.filter(x=>x.name&&isLink(x.official));
   if(r[2].status==='fulfilled'&&Array.isArray(r[2].value?.tools))tools=r[2].value.tools.filter(x=>x.name&&isLink(x.url));
   return {kb:kb.length,guides:guides.length,tools:tools.length};
 });
 return ready;
}
const action=(label,route)=>({label,route});
function rankEntry(item,query){
 const tokens=words(query),kws=new Set((item.keywords||[]).map(norm)),titleWords=new Set(words(item.title)),ansWords=new Set(words(item.answer));
 let score=0,matched=0;
 for(const term of tokens){
  const variations=[term];
  if(term.endsWith('s'))variations.push(term.slice(0,-1));
  if(term.endsWith('er'))variations.push(term.slice(0,-2));
  const hit=variations.some(w=>kws.has(w)||titleWords.has(w)||ansWords.has(w));
  if(hit)matched++;
  if(variations.some(w=>titleWords.has(w)))score+=5;
  else if(variations.some(w=>kws.has(w)))score+=3;
  else if(variations.some(w=>ansWords.has(w)))score+=0.6;
 }
 if(!tokens.length)return 0;
 const coverage=matched/tokens.length;
 score=score*(0.45+coverage*0.55);
 if(norm(query).includes(norm(item.title)))score+=12;
 return coverage<.23&&tokens.length>3?0:score;
}
function answerFAQ(q,id){const f=kb.find(x=>x.id===id);if(!f)return null;return{subject:id,title:f.title,answer:f.answer,steps:f.steps||[],links:[],actions:f.route?[action('Ouvrir '+(DEST[f.route]?.[0]||f.route),f.route)]:[],sources:['Aide CONTROL · '+f.title],suggestions:[]}}
function pickFAQ(q){if(!kb.length)return null;
 const matches=kb.map(f=>({f,score:rankEntry(f,q)})).sort((a,b)=>b.score-a.score);
 const match=matches[0];const count=words(q).length;
 if(!match||match.score<Math.max(3.6,count>4?5:3.6))return null;
 const overlaps=words(q).filter(w=>new Set([...words(match.f.title),...(match.f.keywords||[]).map(norm)]).has(w)).length;
 if(count>=3&&overlaps/Math.max(1,count)<.35)return null;
 return answerFAQ(q,match.f.id);
}
function guideMatch(q){
 const needle=norm(q);if(!needle)return null;
 const map=[['github-pages',/\b(github|pages)\b/],['ionos-deploy-now',/\b(ionos)\b.*\b(deploy|github|now)\b/],['ionos-sftp',/\b(ionos)\b.*\b(sftp|ftp|php|hebergement)\b/],['ionos-deploy-now',/\b(ionos)\b/],['vercel',/\b(vercel|nextjs|next js)\b/],['netlify',/\bnetlify\b/],['cloudflare-pages',/\b(cloudflare|pages dev)\b/],['render-static',/\brender\b/],['railway',/\brailway\b/],['firebase-hosting',/\b(firebase|web app)\b/]];
 for(const [id,re] of map)if(re.test(needle))return guides.find(x=>x.id===id)||null;
 return null;
}
function relevantTool(q){
 const t=norm(q),isSearching=starts(q,['outil','bibliotheque','framework','logiciel','library','trouver','chercher','utiliser','installation','installer','alternative','creer','avec','comparer']);
 const match=tools.find(x=>{const name=norm(x.name);return name.length>3&&(' '+t+' ').includes(' '+name+' ')});
 if(match)return match;
 if(!isSearching)return null;
 const toks=words(q);if(!toks.length)return null;
 const ranked=tools.map(t=>({t,score:words(t.name+' '+t.summary+' '+t.useCase).filter(w=>toks.includes(w)).length})).sort((a,b)=>b.score-a.score);
 if(ranked[0]?.score>=Math.max(2,Math.ceil(toks.length/2)))return ranked[0].t;
 return null;
}
function defaultHelp(){
 return {title:'Je peux t’aider dans CONTROL',answer:'Décris ce que tu souhaites faire : créer un projet, associer une IA, retrouver des ressources ou publier un site. Je chercherai une procédure dans la documentation intégrée. Je ne peux pas lire tes conversations privées ni exécuter un déploiement depuis ce chatbot.',steps:[],actions:[action('Mes projets','projects'),action('Guides de mise en ligne','deploy'),action('Bibliothèques IA','catalog')],links:[],sources:['Centre d’aide CONTROL'],suggestions:['Comment connecter ChatGPT ?','Comment publier sur GitHub ?','Quels outils pour un site 3D ?']};
}
function guideAnswer(g,q){const isCost=starts(q,['prix','cout','tarif','gratuit','payant','quota','abonnement']);
 let answer=isCost?'Concernant le prix : '+g.pricing+'. Les tarifs évoluent et doivent être confirmés sur le site officiel. ':g.summary+' ';
 answer+='Le guide contient les étapes, les erreurs fréquentes et une checklist de vérification. Il prépare les actions mais ne publie pas automatiquement ton site.';
 const steps=(g.steps||[]).map(([title,text],i)=>(i+1)+'. '+title+' — '+text);
 if(starts(q,['404','erreur','probleme','build','vide','css','image','https','dns'])){const tips=(g.issues||[]).slice(0,2).map(([problem,solution])=>problem+' : '+solution);steps.unshift(...tips)}
 return{subject:'guide:'+g.id,title:'Publier avec '+g.name,answer,steps,actions:[action('Afficher le guide complet','deploy')],links:[{label:'Documentation officielle '+g.name,url:g.official}],sources:['Guide CONTROL · '+g.name],suggestions:['Comment vérifier mon site après publication ?','Comment protéger mes clés API ?','Quel hébergeur choisir ?']};
}
function toolAnswer(t){return{subject:'tool:'+t.id,title:t.name+' — ressource IA',answer:t.summary+'\n\nCas pratique : '+t.useCase+'\n\nL’outil peut nécessiter un compte, une installation, une clé API ou des frais. Vérifie les conditions auprès de l’éditeur. CONTROL référence cet outil mais ne l’installe pas automatiquement.',steps:[],actions:[action('Explorer les bibliothèques IA','catalog')],links:[{label:'Site officiel '+t.name,url:t.url}],sources:['Catalogue d’outils IA CONTROL · '+t.name],suggestions:['Quels autres outils IA puis-je utiliser ?','Comment mettre mon site en ligne ?']} }
function cloudNote(answer,q){
 if(MODE!=='cloud')return answer;
 if(!adapter.isAuthenticated?.()){
  if(answer.actions)answer.actions=answer.actions.filter(a=>a.route==='account');
  answer.answer+=' À noter : CONTROL Cloud est encore en préparation. Les espaces privés et l’inscription publique ne sont pas disponibles pour le moment.';
 }
 return answer;
}
function decide(q){
 const v=norm(q);const hasDeploy=starts(q,['heberg','publier','publication','deploy','deploiement','mettre en ligne','mise en ligne','site web','domaine','hosting','404','build','dns','certificat']);
 const hasLink=starts(q,['connecter','connecte','connectee','lier','synchroniser','synchronisation','api','acces','acceder','historique','chats','conversations']);
 const hasPrices=starts(q,['cout','prix','payer','payant','abonnement','tarif','tokens','credits','facturation']);
 const hasTool=starts(q,['outils?','bibliotheques?','frameworks?','librairies?','plugins?','extensions?','software']);
 const g=guideMatch(q);
 const t=relevantTool(q);
 const explicitTool=t&&norm(q).includes(norm(t.name));
 const countRequest=/\b(combien de projets?|nombre de projets?|liste de mes projets|voir mes projets|ou sont mes projets)\b/.test(v);
 const statusRequest=/\b(combien de (taches|missions)|nombre de (taches|missions)|mes actions ouvertes)\b/.test(v);
 // A request about provider permissions must never masquerade as a deploy action.
 if(hasLink&&starts(q,['conversation','synchron','chatgpt','claude','gemini','codex','acces','api'])){
  const name=/\bclaude\b/.test(v)?'claude':/\bgemini\b/.test(v)?'gemini':/\bcodex\b/.test(v)?'codex':/\bchatgpt\b/.test(v)?'chatgpt':'ia-connexion';
  return cloudNote(answerFAQ(q,name)||defaultHelp(),q);
 }
 if(hasLink&&g&&starts(q,['github','vercel','ionos','netlify','cloudflare','railway','firebase','render']))return cloudNote(answerFAQ(q,'integrations'),q);
 if(explicitTool&&!hasDeploy&&!hasLink)return cloudNote(toolAnswer(t),q);
 if(g&&(hasDeploy||hasPrices||starts(q,['github','ionos','vercel','netlify','cloudflare','railway','firebase','render'])))return cloudNote(guideAnswer(g,q),q);
 if(/\b(sauvegard\w*|export\w*|import\w*|restaur\w*|backup)\b/.test(v))return cloudNote(answerFAQ(q,'sauvegarde')||defaultHelp(),q);
 if(/\b(404|page blanche|build echoue|erreur de deploiement)\b/.test(v))return cloudNote(answerFAQ(q,'deploy-check')||defaultHelp(),q);
 if(/^(merci|super|ok|bonjour|salut|hello|bonsoir|hey|coucou)\b/.test(v))return defaultHelp();
 if(countRequest||statusRequest){
  const summary=typeof adapter.getSummary==='function'?adapter.getSummary():null;
  if(summary&&(summary.projects!==undefined)){
    if(countRequest)return {subject:'my-projects',title:'Tes projets CONTROL',answer:'CONTROL connaît actuellement '+summary.projects+' projet(s) dans cet espace'+(summary.current?' ; projet ouvert : '+summary.current:'')+'. Pour consulter leur contenu et les conversations associées, ouvre leur fiche. Les conversations privées des fournisseurs ne sont pas incluses dans ce décompte.',steps:[],actions:[action('Voir les projets','projects')],links:[],sources:['Vue locale de CONTROL'],suggestions:['Comment associer un projet ChatGPT ?']};
    return{subject:'my-tasks',title:'Tes actions et missions CONTROL',answer:'Cet espace contient '+(summary.openActions??'un nombre inconnu d’')+' action(s) ouverte(s) et '+(summary.missions??'un nombre inconnu de')+' mission(s) référencée(s). Ces chiffres proviennent des données accessibles dans CONTROL, pas des comptes IA externes.',steps:[],actions:[action('À traiter','inbox'),action('Missions','missions')],links:[],sources:['Vue locale de CONTROL'],suggestions:['Comment créer une automatisation ?']};
  }
 }
 if(!g&&!explicitTool&&(hasTool||starts(q,['creer','fabriquer','developper','apprendre']))&&/\b(3d|webgl|agent|agents|automatis\w*|productivite)\b/.test(v)){
  let group=/\b(3d|webgl)\b/.test(v)?'3d':/\bagents?\b/.test(v)?'agents':/\bautomatis\w*\b/.test(v)?'automatisation':'quotidien';
  const pick=group==='3d'?['Three.js','React Three Fiber','GSAP','Blender']:group==='agents'?['LangGraph','OpenAI Agents SDK','Flowise','Dify']:group==='automatisation'?['n8n','Activepieces','Make','Google Apps Script']:['NotebookLM','Ollama','Perplexity','LM Studio'];
  const selected=pick.map(name=>tools.find(x=>x.name===name)).filter(Boolean);
  if(selected.length)return cloudNote({subject:'course:'+group,title:'Outils conseillés pour '+(group==='3d'?'un site 3D':group==='agents'?'un agent IA':group==='automatisation'?'une automatisation':'améliorer ta productivité'),answer:selected.map((t,i)=>(i+1)+'. '+t.name+' — '+t.summary).join('\n')+'\n\nLes coûts et conditions d’utilisation dépendent de chaque éditeur. Les outils ne sont pas installés automatiquement dans CONTROL.',steps:['Commence par le parcours correspondant dans « Bibliothèques IA ».','Teste un outil sur un projet non sensible.','Vérifie les licences et les frais éventuels avant intégration.'],actions:[action('Ouvrir les bibliothèques IA','catalog')],links:selected.slice(0,2).map(t=>({label:t.name+' — site officiel',url:t.url})),sources:['Bibliothèque CONTROL · '+selected.map(t=>t.name).join(', ')],suggestions:['Comment utiliser les kits pratiques ?','Comment mettre un site en ligne ?']},q);
 }
 if(hasTool&&t&&!hasDeploy)return cloudNote(toolAnswer(t),q);
 
 if(g)return cloudNote(guideAnswer(g,q),q);
 if(t&&(hasTool||explicitTool))return cloudNote(toolAnswer(t),q);
 if(/(outil|bibliotheque|framework|librairie|plugin)/.test(v)&&!t)return cloudNote(answerFAQ(q,'outils')||defaultHelp(),q);
 if(starts(q,['ionos','vercel','netlify','cloudflare','github','firebase','railway','render']))return cloudNote(answerFAQ(q,'hebergeur-choisir')||defaultHelp(),q);
 if(starts(q,['mise en ligne','publier','publication','deployer','heberger','deploy','hebergement','domaine','site web']))return cloudNote(answerFAQ(q,'hebergeur-choisir')||defaultHelp(),q);
 const f=pickFAQ(q);if(f)return cloudNote(f,q);
 if(lastSubject&&/\b(et|aussi|ensuite|apres|comment|pourquoi|combien|ca)\b/.test(v)&&words(q).length<4){
  const last=lastSubject.startsWith('guide:')?guides.find(g=>g.id===lastSubject.slice(6)):null;
  if(last){const a=guideAnswer(last,q);a.answer='Pour '+last.name+' : '+a.answer;return cloudNote(a,q)}
 }
 return {title:'Je n’ai pas trouvé de réponse suffisamment précise',answer:'Je ne veux pas inventer une réponse. Essaie de citer la fonctionnalité ou le service concerné (par exemple « connecter Claude », « publier sur IONOS » ou « modifier une automatisation »). Je peux aussi t’envoyer directement vers une rubrique CONTROL.',steps:[],actions:[action('Bibliothèques IA','catalog'),action('Mise en ligne','deploy'),action('Mes projets','projects')],links:[],sources:['Centre d’aide CONTROL'],suggestions:['Comment associer mon compte Claude ?','Comment publier un site React ?','Où sont mes automatisations ?']};
}
function addMsg(role,text,opts={}){
 const row=document.createElement('div');row.className='ch-msg ch-'+role;
 const caption=document.createElement('div');caption.className='ch-msg-label';caption.textContent=role==='user'?'Vous':'Assistance CONTROL';row.append(caption);
 const msg=document.createElement('div');msg.className='ch-msg-content';msg.textContent=text;row.append(msg);
 if(opts.steps?.length){const ol=document.createElement('ol');ol.className='ch-steps';for(const step of opts.steps.slice(0,8)){const li=document.createElement('li');li.textContent=step.replace(/^\d+\.\s*/,'');ol.append(li)}row.append(ol)}
 if(opts.sources?.length){const p=document.createElement('div');p.className='ch-sources';p.textContent='Source : '+opts.sources.join(' · ');row.append(p)}
 if(opts.links?.length||opts.actions?.length){
  const container=document.createElement('div');container.className='ch-msg-actions';
  for(const a of (opts.actions||[]).slice(0,3)){if(!DEST[a.route])continue;const b=document.createElement('button');b.type='button';b.textContent=a.label;b.className='ch-go';b.addEventListener('click',()=>go(a.route));container.append(b)}
  for(const a of (opts.links||[]).slice(0,2)){if(!isLink(a.url))continue;const l=document.createElement('a');l.textContent=a.label+' ↗';l.href=a.url;l.target='_blank';l.rel='noopener noreferrer';l.className='ch-official';container.append(l)}
  row.append(container);
 }
 list.append(row);list.scrollTop=list.scrollHeight;history.push({role,text});if(history.length>40)history=history.slice(-40);return row;
}
function quick(prompts){actions.replaceChildren();for(const str of prompts.slice(0,5)){const b=document.createElement('button');b.type='button';b.className='ch-chip';b.textContent=str;b.addEventListener('click',()=>send(str));actions.append(b)}}
function routeLabel(){const hash=location.hash; if(hash.includes('/control/command'))return['Comment lancer une mission Claude ?','Comment récupérer les résultats Gemini ?','Pourquoi les API IA ne sont pas encore connectées ?'];if(hash.includes('/control/lab'))return['Comment préparer un brief IA précis ?','Comment comparer deux réponses IA ?','Comment vérifier un JSON ?']; if(hash.includes('/control/deploy'))return['Comment publier mon site sur GitHub ?','Comment utiliser IONOS Deploy Now ?','Quel hébergeur choisir ?'];if(hash.includes('/automations'))return['Comment modifier une automatisation ?','Comment suivre les quotas IA ?','Pourquoi mes automatisations ne sont pas synchronisées ?'];if(hash.includes('/control/catalog'))return['Quels outils pour faire de la 3D ?','Comment utiliser les kits pratiques ?','Comment publier mon site ?'];return['Comment démarrer sur CONTROL ?','Comment associer Claude ou ChatGPT ?','Comment mettre mon site en ligne ?'] }
function go(route){
 if(MODE==='cloud'&&typeof adapter.navigate==='function'){
  const available=adapter.isAuthenticated?.();
  if(!available){addMsg('assistant','Les espaces CONTROL Cloud ne sont pas encore ouverts. Tu peux toujours consulter les tutoriels dans CONTROL personnel.');return}
  const ok=adapter.navigate(DEST[route]?.[2]||route,route);
  if(ok===false){addMsg('assistant','Cette rubrique n’est pas encore accessible dans CONTROL Cloud.');return}
  close();return;
 }
 const target=DEST[route]?.[1];if(!target)return;
 if(MODE==='personal'){location.hash=target;close();return}
 addMsg('assistant','Cette fonctionnalité nécessite une connexion à CONTROL Cloud, actuellement non ouverte. Utilise CONTROL personnel pour accéder aux rubriques disponibles.');
}
async function send(message){
 const q=String(message||'').trim().slice(0,750);if(!q)return;
 const requestGeneration=generation;
 input.value='';quick([]);
 addMsg('user',q);
 const wait=addMsg('assistant','Recherche de la réponse dans l’aide intégrée…');
 status.textContent='Recherche documentaire en cours';
 try{await getHelp();if(requestGeneration!==generation)return;const result=decide(q);lastSubject=result.subject||null;wait.remove();addMsg('assistant',result.title+'\n\n'+result.answer,result);quick(result.suggestions?.length?result.suggestions:routeLabel());status.textContent='Réponse issue de la documentation CONTROL'}
 catch{if(requestGeneration!==generation)return;wait.remove();addMsg('assistant','Le centre d’aide n’a pas pu charger ses ressources. Réessaie quand la connexion est disponible.');quick(routeLabel());status.textContent='Aide partiellement disponible'}
 input.focus();
}
function close(){isOpen=false;box.hidden=true;launch.setAttribute('aria-expanded','false');launch.focus()}
function open(){
 if(!box){return}lastFocus=document.activeElement;isOpen=true;box.hidden=false;launch.setAttribute('aria-expanded','true');input.focus();
 if(list.childElementCount===0){addMsg('assistant','Bonjour ! Je suis l’assistant CONTROL. Je peux t’expliquer les fonctionnalités, t’aider à choisir des outils IA et te guider pour publier un site. Mes réponses sont documentaires et je n’accède pas à tes conversations privées.');quick(routeLabel())}
}
function reset(){generation++;history=[];lastSubject=null;if(input)input.value='';if(list)list.replaceChildren();if(actions)actions.replaceChildren();if(isOpen)open()}
function init(){
 if(document.getElementById('control-help-launch'))return;
 launch=document.createElement('button');launch.id='control-help-launch';launch.className='ch-launch';launch.type='button';launch.setAttribute('aria-label','Ouvrir le chatbot d’assistance CONTROL');launch.setAttribute('aria-controls','control-help-panel');launch.setAttribute('aria-expanded','false');launch.innerHTML='<span class="ch-launch-icon" aria-hidden="true">◈</span><span>Assistance</span>';
 box=document.createElement('section');box.id='control-help-panel';box.className='ch-panel';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('aria-label','Assistance CONTROL');box.setAttribute('aria-modal','false');
 box.innerHTML='<div class="ch-head"><div class="ch-avatar" aria-hidden="true">◈</div><div class="ch-head-meta"><strong>Assistant CONTROL</strong><span>Aide intégrée · sources documentées</span></div><button type="button" id="ch-close" class="ch-close" aria-label="Fermer le chatbot">×</button></div><div class="ch-disclaimer">Je te guide dans CONTROL. Mes réponses viennent des guides intégrés, pas d’une IA connectée à tes comptes.</div><div class="ch-messages" id="ch-messages" role="log" aria-live="polite" aria-relevant="additions"></div><div class="ch-quick" id="ch-quick" aria-label="Questions suggérées"></div><div class="ch-footer"><form id="ch-form"><label class="ch-visually-hidden" for="ch-input">Poser une question</label><textarea id="ch-input" rows="1" maxlength="750" placeholder="Pose ta question sur CONTROL…" aria-label="Ta question"></textarea><button type="submit" aria-label="Envoyer la question" class="ch-send">➤</button></form><div class="ch-meta"><span id="ch-status">Aide sans abonnement ni clé API</span><button type="button" id="ch-clear">Effacer</button></div></div>';
 document.body.append(launch,box);list=box.querySelector('#ch-messages');input=box.querySelector('#ch-input');actions=box.querySelector('#ch-quick');status=box.querySelector('#ch-status');
 launch.addEventListener('click',()=>isOpen?close():open());box.querySelector('#ch-close').addEventListener('click',close);
 box.querySelector('#ch-clear').addEventListener('click',()=>{reset();addMsg('assistant','Conversation effacée de cet onglet. Quelle question souhaites-tu poser ?');quick(routeLabel());input.focus()});
 box.querySelector('#ch-form').addEventListener('submit',ev=>{ev.preventDefault();send(input.value)});
 input.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();send(input.value)}});
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&isOpen){ev.preventDefault();close()}});
 window.addEventListener('hashchange',()=>{if(isOpen&&history.length<=1)quick(routeLabel())});
 // Opening is not delayed on a remote request. Prefetch public docs for fast answers.
 getHelp();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.CONTROL_HELP={setAdapter(obj){adapter={...adapter,...obj}},reset,open,close,ask:send,lookup:async q=>{await getHelp();return decide(q)},load:getHelp};
})();
