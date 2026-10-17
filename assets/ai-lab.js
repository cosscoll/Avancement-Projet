/* CONTROL · Laboratoire IA — browser-only utilities.
 * No model API, external call, secret store, or claim of LLM execution.
 * Input/output lives in memory and is cleared when navigating or changing identity.
 */
(()=>{'use strict';
const ESC=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=(root,sel)=>root.querySelector(sel);
const options=(arr,selected)=>arr.map(([v,t])=>'<option value="'+ESC(v)+'" '+(v===selected?'selected':'')+'>'+ESC(t)+'</option>').join('');
const TYPES=[
 ['spec','Cahier des charges'],['code','Développement / correctif'],['audit','Audit UX / qualité'],['agent','Agent IA'],['deploy','Mise en ligne'],['content','Marketing / rédaction'],['research','Recherche sourcée']];
const MODELS=[
 ['ChatGPT','ChatGPT'],['Claude','Claude'],['Gemini','Gemini'],['Codex','Codex'],['Autre','Autre IA']];
const PROVIDERS={ChatGPT:'https://chatgpt.com/',Claude:'https://claude.ai/',Gemini:'https://gemini.google.com/',Codex:'https://chatgpt.com/codex'};
const TASK_RULES={
 spec:'Structure : contexte, besoins, parcours, critères d’acceptation mesurables, risques, dépendances, plan de recette et questions non résolues.',
 code:'Décris les fichiers modifiés, propose un changement minimal, exécute les tests disponibles, précise les commandes et résultats réels, puis donne un plan de retour arrière.',
 audit:'Examine les parcours utilisateur, mobile, accessibilité, sécurité, performance et régressions. Classe chaque constat avec sa preuve, sa gravité et une action corrective.',
 agent:'Définis outils, schémas d’entrée/sortie, permissions, limites d’exécution, cas d’échec, budget maximal et validation humaine pour les actions externes.',
 deploy:'Identifie le stack et le build, valide les variables, domaine/HTTPS, preview, tests, journal de publication et rollback. Ne déploie jamais sans approbation explicite.',
 content:'Précise public, proposition de valeur, ton, formats, objectifs mesurables et vérification des informations. Sépare faits, hypothèses et propositions créatives.',
 research:'Cite les sources primaires, leur date et leur lien. Sépare les faits vérifiés, les opinions et les points non confirmés. N’invente jamais de citation.'};
const ID=s=>String(s||'').slice(0,100);
const cut=(s,max)=>String(s??'').slice(0,max);
const textCount=s=>Math.ceil(String(s||'').length/4);
const secretPatterns=[
 [/((?:sk-(?:proj-)?|sb_secret_|gh[pousr]_|github_pat_|AIza)[A-Za-z0-9_\-]{10,})/g,'[CLÉ MASQUÉE]'],
 [/((?:authorization\s*:\s*bearer\s+)[A-Za-z0-9._~+\/=-]+)/gi,'$1[JETON MASQUÉ]'],
 [/((?:api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token|password|mot.de.passe)\s*[:=]\s*["']?)([^\s"',;]{8,})/gi,'$1[VALEUR MASQUÉE]'],
 [/(https?:\/\/)([^\s/@:]+):([^\s/@]+)@/gi,'$1[IDENTIFIANTS MASQUÉS]@']
];
function mask(s){let out=String(s??'');for(const [p,v] of secretPatterns)out=out.replace(p,v);return out}
function safeLink(v){try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!Array.from(u.searchParams.keys()).some(k=>/^(code|token|access_token|api_key|secret|password|refresh_token)$/i.test(k))?u.href:''}catch{return''}}
function compose({project={},objective='',kind='spec',model='ChatGPT',customRules='',includeContext=true,includeReports=false}={}){
 const title=project.name?project.name:'Sans projet';
 const lines=['MISSION CONTROL — '+model,'', 'PROJET : '+title];
 if(project.description)lines.push('Description : '+cut(mask(project.description),800));
 if(includeContext&&project.context?.length){lines.push('','CONTEXTE DISPONIBLE (déclaratif / à revérifier) :');for(const s of project.context.slice(0,10))lines.push('- '+cut(mask(s),360))}
 if(includeReports&&project.reports?.length){lines.push('','BILANS FOURNIS MANUELLEMENT (non vérifiés) :');for(const r of project.reports.slice(0,3))lines.push('- '+cut(mask(r),650))}
 lines.push('','OBJECTIF :',cut(mask(objective),5000)||'[À préciser]','',
  'TYPE DE TRAVAIL : '+(TYPES.find(x=>x[0]===kind)?.[1]||kind),
  'CONSIGNES DE PRODUCTION :',TASK_RULES[kind]||TASK_RULES.spec,
  '','CONTRAINTES DE SÉCURITÉ ET QUALITÉ :',
  '- Aucun achat, dépense, publication, modification de compte ou action engageante sans confirmation explicite.',
  '- Ne demande ni ne reproduis de mot de passe, cookie, clé API ou token.',
  '- Ne prétends pas avoir exécuté un test, consulté un fichier privé ou déployé quoi que ce soit sans preuve.',
  '- Sépare clairement ce qui est confirmé, ce qui est proposé et ce qui reste à vérifier.',
  '- Si une donnée manque ou un accès est indisponible, pose une question ciblée ou propose une procédure manuelle.',
  '- Pour tout changement de code, limite les régressions, précise les fichiers et teste avant de conclure.');
 if(customRules.trim())lines.push('','CONTRAINTES DU PROJET :',cut(mask(customRules),5000));
 lines.push('','FORMAT ATTENDU :','1. Synthèse de l’objectif et hypothèses.','2. Plan d’action ordonné avec responsabilités.','3. Livrables précis et critères de réussite.','4. Preuves / tests réellement réalisés (ou « non vérifiés »).','5. Risques, coûts possibles et blocages.','6. Prochaines étapes concrètes.');
 return lines.join('\n');
}
function scoreAnswer(answer,goal,conditions=[]){
 const a=String(answer||'').slice(0,30000),low=a.toLowerCase(),tokens=[...new Set((goal||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(w=>w.length>=5))].slice(0,35);
 const plain=low.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const goalHits=tokens.filter(t=>plain.includes(t)).length;
 const items=[
 {key:'objective',label:'Objectif mentionné',ok:tokens.length>0?goalHits/Math.max(1,tokens.length)>=.35:null,info:tokens.length?goalHits+' / '+tokens.length+' termes significatifs présents':'Saisir un objectif commun'},
 {key:'details',label:'Réponse suffisamment développée',ok:a.trim().length>=260,info:a.trim().length+' caractères'},
 {key:'steps',label:'Étapes ou structure identifiable',ok:/(?:^|\n)\s*(?:\d{1,2}[.)]|[-•*]|\#{1,4}\s)|\b(?:étape|plan d.action|prochaine étape)\b/im.test(a),info:'Recherche de listes et de titres'},
 {key:'proof',label:'Tests, preuves ou limites explicités',ok:/\b(?:test(?:s|é|ée|és)?|preuve|vérif|non vérifi|limite|hypothèse|source|logs?|rapport)\b/i.test(a),info:'Présence de marqueurs, pas une vérification réelle'},
 {key:'delivery',label:'Livrable ou résultat décrit',ok:/\b(?:livrable|résultat|fichier|lien|code|étape|rapport|recommandation|implémentation|solution|plan)\b/i.test(a),info:'Indice de livrable, pas preuve de qualité'},
 {key:'security',label:'Contraintes et autorisations évoquées',ok:/\b(?:autorisation|validation|confidentiel|co[uû]t|paiement|permission|sécurit|risque|budget)\b/i.test(a),info:'Indice de prudence'}
 ];
 for(const c of conditions.slice(0,8)){const v=c.trim();if(!v)continue;const found=plain.includes(v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));items.push({key:'condition'+items.length,label:'Critère : '+cut(v,80),ok:found,info:'Motif littéral trouvé / absent, non validé sémantiquement'})}
 const known=items.filter(x=>x.ok!==null);const hits=known.filter(x=>x.ok).length;
 return{items,hits,total:known.length,ratio:known.length?Math.round(hits/known.length*100):0,length:a.length};
}
function inspectHTML(input){
 const html=String(input||'').slice(0,100000);if(!html.trim())throw Error('Colle du code HTML pour démarrer.');
 if(typeof DOMParser==='undefined')throw Error('L’analyse HTML n’est pas prise en charge par ce navigateur.');
 const doc=new DOMParser().parseFromString(html,'text/html');
 const checks=[];
 const check=(label,ok,desc)=>checks.push({label,ok:!!ok,desc});
 const lang=doc.documentElement?.getAttribute('lang')||'';
 check('Langue HTML déclarée',!!lang,'<html lang="fr">');
 check('Titre de page présent',(doc.title||'').trim().length>5,'<title> descriptif, unique par page');
 check('Description SEO',!!doc.querySelector('meta[name="description"]')?.getAttribute('content'),'meta name="description"');
 check('Viewport mobile',!!doc.querySelector('meta[name="viewport"]'),'meta name="viewport"');
 check('Titre principal H1',doc.querySelectorAll('h1').length===1,'Idéalement un titre H1 principal');
 const imgs=[...doc.querySelectorAll('img')];
 check('Texte alternatif pour les images',imgs.every(i=>i.hasAttribute('alt')),'alt descriptif ou alt="" si purement décoratif');
 const links=[...doc.querySelectorAll('a[target="_blank"]')];
 check('Liens externes sécurisés',links.every(a=>/noopener/.test(a.getAttribute('rel')||'')),'rel="noopener" sur les nouveaux onglets');
 const forms=[...doc.querySelectorAll('input:not([type="hidden"]), textarea, select')].filter(el=>!el.hasAttribute('aria-label'));
 check('Formulaires identifiés',forms.every(el=>!!el.labels?.length||!!el.closest('label')||!!(el.id&&[...doc.querySelectorAll('label[for]')].some(label=>label.getAttribute('for')===el.id))),'Labels ou aria-label sur les champs');
 const ids=[...doc.querySelectorAll('[id]')].map(x=>x.id);
 check('IDs HTML uniques',new Set(ids).size===ids.length,'Éviter les identifiants dupliqués');
 check('Pas de clés évidentes dans le code',!/(?:sk-(?:proj-)?|sb_secret_|github_pat_|ghp_)[A-Za-z0-9_-]{12,}/.test(html),'Un scan simple ne remplace pas un audit de secrets');
 const n=checks.filter(x=>x.ok).length;
 return{checks,passed:n,total:checks.length,counts:{images:imgs.length,links:doc.querySelectorAll('a').length,forms:doc.querySelectorAll('form').length,scripts:doc.querySelectorAll('script').length},warning:'Diagnostic statique indicatif : ne teste pas l’exécution JavaScript, les performances, les contrastes, la sécurité serveur ni les URL réellement publiées.'};
}
function parseJSON(input,mandatory=''){
 const raw=String(input||'').trim();if(!raw||raw.length>150000)throw Error('JSON vide ou trop long (150 000 caractères maximum).');
 const value=JSON.parse(raw);
 const fields=String(mandatory||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,25);
 const missing=fields.filter(k=>!(value&&typeof value==='object'&&!Array.isArray(value)&&Object.prototype.hasOwnProperty.call(value,k)));
 return{formatted:JSON.stringify(value,null,2),type:Array.isArray(value)?'tableau':value===null?'null':typeof value,keys:value&&typeof value==='object'&&!Array.isArray(value)?Object.keys(value).length:0,missing,required:fields};
}
function compareText(a,b){
 const l=String(a||'').split(/\r?\n/).slice(0,400),r=String(b||'').split(/\r?\n/).slice(0,400);
 const lines=[];let identical=0;
 for(let i=0;i<Math.max(l.length,r.length);i++){
  if(i<l.length&&i<r.length&&l[i]===r[i]){identical++;continue}
  if(i<l.length)lines.push('- '+(i+1)+': '+cut(l[i],240));
  if(i<r.length)lines.push('+ '+(i+1)+': '+cut(r[i],240));
 }
 return{lines:lines.slice(0,90),identical,left:l.length,right:r.length,isTruncated:lines.length>90,notice:'Comparaison ligne par ligne, pas une analyse sémantique ni un diff Git.'};
}
function mount(root,adapter={}){
 if(!root)return;
 const projects=(typeof adapter.projects==='function'?adapter.projects():adapter.projects||[]).filter(p=>p?.id&&p?.name).slice(0,120);
 const selected=projects.some(p=>p.id===adapter.projectId)?adapter.projectId:projects[0]?.id||'';
 const modelChoices=MODELS.map(x=>x);
 let mode='prompt',projectId=selected,resultText='',structured=null,currentScore=[];
 const project=()=>projects.find(x=>x.id===projectId)||null;
 const getData=()=>typeof adapter.getProject==='function'?adapter.getProject(projectId)||{}:{};
 const el=(tag,attrs={})=>{const x=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='text')x.textContent=v;else if(k==='class')x.className=v;else x.setAttribute(k,v)}return x};
 const txt=(label,field,type='textarea')=>{const input=el('label',{class:'lab-field'});input.append(el('span',{text:label}));const node=el(type==='textarea'?'textarea':'input');node.name=field;if(type!=='textarea')node.type=type;node.className='lab-input';node.maxLength=type==='textarea'?30000:5000;input.append(node);return input};
 const message=(s,bad=false)=>{const e=root.querySelector('#lab-alert');if(e){e.textContent=s;e.className='lab-alert '+(bad?'is-error':'')}};
 const copy=async text=>{try{await navigator.clipboard.writeText(text);message('Contenu copié. Transmets-le à ton IA dans son interface officielle.')}catch{message('Copie impossible. Sélectionne le contenu manuellement.',true)}};
 root.innerHTML='<div class="lab-shell"><div class="lab-hero"><div><span class="lab-overline">CONTROL · OUTILS DE PRODUCTION & DE VÉRIFICATION</span><h1>Laboratoire IA</h1><p>Prépare des demandes plus précises, compare les résultats et contrôle tes livrables, directement dans CONTROL.</p></div><span class="lab-pill">7 outils intégrés</span></div>'+
 '<div class="lab-caution">Ces outils fonctionnent dans le navigateur, sans clé API ni facturation. Ils <strong>n’exécutent pas ChatGPT, Claude, Gemini ou Codex</strong> et ne valident pas automatiquement la vérité des réponses. Les textes collés ne sont pas transmis à un serveur par le Laboratoire.</div>'+
 '<div class="lab-context"><label>Projet actif<select class="lab-select" id="lab-project">'+options([['','Projet non renseigné'],...projects.map(p=>[p.id,p.name])],projectId)+'</select></label><span>Les informations utilisées viennent uniquement de ton espace CONTROL et des éléments déclarés.</span></div>'+
 '<div class="lab-tabs" role="tablist" aria-label="Choisir un outil du Laboratoire">'+[
 ['prompt','Brief IA'],['review','Comparer les IA'],['html','Audit HTML'],['json','Vérifier JSON'],['diff','Comparer versions'],['checklist','Plan de recette'],['privacy','Sécurité des prompts']
 ].map(([k,n])=>'<button type="button" data-lab-mode="'+k+'" role="tab" aria-selected="'+(k===mode)+'">'+n+'</button>').join('')+'</div>'+
 '<section class="lab-content" id="lab-content"></section><div class="lab-alert" id="lab-alert" role="status" aria-live="polite"></div></div>';
 const tabs=[...root.querySelectorAll('[data-lab-mode]')],area=root.querySelector('#lab-content');
 const inputValue=name=>area.querySelector('[name="'+name+'"]')?.value||'';
 const renderData=(text,actions=[])=>{
  const block=el('div',{class:'lab-result'});
  const heading=el('h3',{text:'Résultat / aperçu'}),textarea=el('textarea',{class:'lab-output'});
  textarea.readOnly=true;textarea.value=String(text||'');textarea.setAttribute('aria-label','Résultat préparé');
  const row=el('div',{class:'lab-actions'}),copyBtn=el('button',{text:'Copier le résultat'});copyBtn.type='button';copyBtn.addEventListener('click',()=>copy(textarea.value));row.append(copyBtn);
  for(const item of actions){const b=el('button',{text:item.label});b.type='button';b.addEventListener('click',item.onClick);row.append(b)}
  block.append(heading,textarea,row);area.append(block);
 };
 function render(){
  area.replaceChildren();message('');
  tabs.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.labMode===mode)));
  const h=el('h2',{text:({prompt:'1. Préparer une mission IA précise',review:'2. Comparer les réponses de plusieurs IA',html:'3. Vérifier un site HTML',json:'4. Contrôler un JSON produit par une IA',diff:'5. Comparer deux versions de texte ou de code',checklist:'6. Générer un plan de recette',privacy:'7. Repérer les secrets avant de copier'}[mode])});
  area.append(h);
  if(mode==='prompt'){
   const desc=el('p',{class:'lab-help',text:'Prépare une demande complète en ajoutant le contexte local, les contraintes et des critères vérifiables. La demande est ensuite copiée vers l’IA choisie.'});
   area.append(desc);
   const kind=el('label',{class:'lab-field'});kind.append(el('span',{text:'Type de mission'}));const kindSel=el('select',{class:'lab-select'});kindSel.name='kind';kindSel.innerHTML=options(TYPES,'code');kind.append(kindSel);
   const provider=el('label',{class:'lab-field'});provider.append(el('span',{text:'IA destinataire'}));const psel=el('select',{class:'lab-select'});psel.name='provider';psel.innerHTML=options(modelChoices,'ChatGPT');provider.append(psel);
   area.append(el('div',{class:'lab-row'}));area.lastChild.append(kind,provider);
   area.append(txt('Objectif concret / demande à réaliser','objective'),txt('Contraintes propres au projet (facultatif)','rules'));
   area.querySelector('[name=objective]').maxLength=5000;area.querySelector('[name=rules]').maxLength=5000;
   const opts=el('div',{class:'lab-checkboxes'});
   for(const [name,caption,checked] of [['context','Inclure le contexte enregistré du projet',true],['reports','Inclure les comptes rendus IA saisis manuellement (attention aux données privées)',false]]){const label=el('label');const cb=el('input');cb.type='checkbox';cb.name=name;cb.checked=checked;label.append(cb,el('span',{text:caption}));opts.append(label)}
   area.append(opts);
   const bar=el('div',{class:'lab-actions'}),gen=el('button',{text:'Construire le brief'});gen.className='lab-primary';gen.type='button';bar.append(gen);area.append(bar);
   gen.addEventListener('click',()=>{
    const data=getData();const info={name:project()?.name||'',description:project()?.description||'',context:Array.isArray(data.context)?data.context:[],reports:Array.isArray(data.reports)?data.reports:[]};
    const objective=inputValue('objective').trim();
    if(!objective){message('Indique l’objectif avant de préparer le brief.',true);return}
    const kind=inputValue('kind'),provider=inputValue('provider'),output=compose({project:info,objective,kind,model:provider,customRules:inputValue('rules'),includeContext:!!area.querySelector('[name=context]').checked,includeReports:!!area.querySelector('[name=reports]').checked});
    resultText=output;area.querySelector('.lab-result')?.remove();
    renderData(output,[
     {label:'Créer une mission CONTROL',onClick:async()=>{if(!adapter.saveMission){message('Cette action n’est pas disponible dans cette version de CONTROL.',true);return}if(!projectId){message('Choisis un projet pour créer une mission.',true);return}try{const ok=await adapter.saveMission({projectId,provider,title:cut(objective,120),instruction:output,kind});message(ok===false?'Cette mission existe déjà.':'Mission ajoutée à CONTROL. Son exécution sur une IA reste manuelle.')}catch(e){message(e.message||'Enregistrement impossible.',true)}}},
     {label:'Ouvrir '+provider,onClick:()=>{const url=(typeof adapter.providerURL==='function'&&adapter.providerURL(projectId,provider))||PROVIDERS[provider];const address=safeLink(url);if(!address){message('Aucun lien officiel vérifié pour ce fournisseur.',true);return}window.open(address,'_blank','noopener,noreferrer')}}
    ]);
    const infoNode=el('p',{class:'lab-help',text:'Estimation très approximative : '+textCount(output)+' unités de texte (caractères / 4), pas un comptage de tokens du fournisseur.'});area.lastChild.append(infoNode);
   });
  }else if(mode==='review'){
   area.append(el('p',{class:'lab-help',text:'Colle les réponses produites par deux IA. Le tableau compare uniquement des indices observables (structure, couverture de mots, mentions de preuve). Ce n’est pas une vérification de leur exactitude ni une note de qualité réelle.'}));
   area.append(txt('Objectif commun donné aux IA','goal'));area.querySelector('[name=goal]').maxLength=1500;
   area.append(txt('Critères à retrouver littéralement (séparés par des virgules, facultatif)','criteria','text'));
   const row=el('div',{class:'lab-row'});for(const [field,title] of [['a','Réponse IA A'],['b','Réponse IA B']]){const label=txt(title,field);label.querySelector('textarea').maxLength=30000;row.append(label)}area.append(row);
   const run=el('button',{text:'Comparer les indices'});run.type='button';run.className='lab-primary';area.append(run);
   run.addEventListener('click',()=>{
    const a=inputValue('a').trim(),b=inputValue('b').trim();if(a.length<20||b.length<20){message('Colle deux réponses d’au moins 20 caractères.',true);return}
    const crit=inputValue('criteria').split(',').map(x=>x.trim()).filter(Boolean).slice(0,8),left=scoreAnswer(a,inputValue('goal'),crit),right=scoreAnswer(b,inputValue('goal'),crit);
    area.querySelector('.lab-result')?.remove();
    const div=el('div',{class:'lab-result'});div.append(el('h3',{text:'Indicateurs observables (non qualitatifs)'}));
    const t=el('table',{class:'lab-table'}),head=el('tr');for(const x of ['Indice','IA A','IA B'])head.append(el('th',{text:x}));t.append(head);
    for(let i=0;i<left.items.length;i++){const tr=el('tr');const l=left.items[i],r=right.items[i];
     for(const cell of [l.label,l.ok===null?'—':l.ok?'Repéré':'Non repéré',r.ok===null?'—':r.ok?'Repéré':'Non repéré'])tr.append(el('td',{text:cell}));t.append(tr)}
    div.append(t,el('p',{class:'lab-help',text:'Indicateurs repérés : A '+left.hits+'/'+left.total+' ; B '+right.hits+'/'+right.total+'. Une réponse longue peut être erronée : il faut encore vérifier les faits, les tests et l’adéquation au besoin.'}));
    const actions=el('div',{class:'lab-actions'}),copyBtn=el('button',{text:'Copier le compte rendu'});
    const report=['COMPARAISON INDICATIVE CONTROL','Objectif : '+inputValue('goal'),'A : '+left.hits+'/'+left.total+' indicateurs présents','B : '+right.hits+'/'+right.total+' indicateurs présents','Validation humaine obligatoire.',...left.items.map((it,i)=>it.label+' : A '+(it.ok?'oui':'non')+' ; B '+(right.items[i].ok?'oui':'non'))].join('\n');copyBtn.addEventListener('click',()=>copy(report));actions.append(copyBtn);div.append(actions);area.append(div);
   });
  }else if(mode==='html'){
   area.append(el('p',{class:'lab-help',text:'Colle le HTML généré par une IA. Analyse statique des balises et de certains risques — sans charger de scripts ni publier le site.'}),txt('Code HTML complet','html'));
   const button=el('button',{text:'Analyser ce HTML'});button.className='lab-primary';area.append(button);button.addEventListener('click',()=>{
    try{const report=inspectHTML(inputValue('html'));area.querySelector('.lab-result')?.remove();const section=el('div',{class:'lab-result'});section.append(el('h3',{text:'Checklist détectée : '+report.passed+' / '+report.total}));
     const ul=el('ul',{class:'lab-check-results'});for(const c of report.checks){const li=el('li',{text:(c.ok?'✓ ':'À examiner : ')+c.label+' — '+c.desc});li.className=c.ok?'lab-good':'lab-warn';ul.append(li)}section.append(ul,el('p',{class:'lab-help',text:report.warning}));
     const copyBtn=el('button',{text:'Copier la checklist'});copyBtn.addEventListener('click',()=>copy('AUDIT HTML INDICATIF CONTROL\n'+report.checks.map(x=>(x.ok?'[x] ':'[ ] ')+x.label+' : '+x.desc).join('\n')+'\n'+report.warning));section.append(copyBtn);area.append(section);
    }catch(e){message(e.message||'HTML non analysable',true)}
   });
  }else if(mode==='json'){
   area.append(el('p',{class:'lab-help',text:'Valide la syntaxe JSON renvoyée par une IA, formate-la et vérifie la présence de clés obligatoires. Le contenu n’est pas exécuté.'}),txt('Contenu JSON à contrôler','json'),txt('Clés obligatoires de premier niveau, séparées par des virgules','required','text'));
   const b=el('button',{text:'Valider et formater'});b.className='lab-primary';area.append(b);b.addEventListener('click',()=>{
    try{const r=parseJSON(inputValue('json'),inputValue('required'));area.querySelector('.lab-result')?.remove();message(r.missing.length?'JSON valide, mais clés absentes : '+r.missing.join(', '):'JSON valide. Type : '+r.type+'. Aucun contrôle sémantique effectué.',!!r.missing.length);renderData(r.formatted)}
    catch(e){message('JSON invalide : '+(e?.message||'format inconnu'),true)}
   });
  }else if(mode==='diff'){
   area.append(el('p',{class:'lab-help',text:'Visualise les différences ligne par ligne entre deux textes. C’est un repérage simple, sans analyser l’intention des changements.'}));
   const row=el('div',{class:'lab-row'});row.append(txt('Version A','left'),txt('Version B','right'));area.append(row);
   const b=el('button',{text:'Comparer les versions'});b.className='lab-primary';area.append(b);b.addEventListener('click',()=>{
    const a=inputValue('left'),c=inputValue('right');if(!a||!c){message('Renseigne les deux versions.',true);return}
    const d=compareText(a,c);area.querySelector('.lab-result')?.remove();renderData('Lignes identiques à même position : '+d.identical+'\n'+d.notice+'\n\n'+(d.lines.length?d.lines.join('\n'):'Aucune différence détectée.')+(d.isTruncated?'\nComparaison abrégée.':''))}
   );
  }else if(mode==='checklist'){
   area.append(el('p',{class:'lab-help',text:'Génère un protocole de recette à copier dans les missions CONTROL ou les outils de suivi. Les cases servent de guide : aucun test réel n’est exécuté.'}));
   const input=txt('Objectif ou fonctionnalité à contrôler','objective');area.append(input);
   const cases=el('label',{class:'lab-field'});cases.append(el('span',{text:'Type de livraison'}));const sel=el('select',{class:'lab-select'});sel.name='kind';sel.innerHTML=options(TYPES,'code');cases.append(sel);area.append(cases);
   const b=el('button',{text:'Générer le plan de recette'});b.className='lab-primary';area.append(b);b.addEventListener('click',()=>{
    const objective=inputValue('objective').trim();if(!objective){message('Renseigne un objectif précis.',true);return}
    const kind=inputValue('kind');
    const defaults=['Comportement nominal reproduit sur l’environnement cible','Cas d’erreur et situations limites couverts','Permissions, confidentialité et données sensibles vérifiées','Performance et affichage mobile contrôlés','Aucune dépense ou publication sans autorisation explicite','Résultat documenté avec date, version et preuve','Retour arrière ou restauration testable'];
    const specific={deploy:['Build de production et logs consultés','URL et certificat HTTPS vérifiés','Liens, formulaires, routes et ressources testés'],code:['Tests unitaires / lint / régression exécutés','Diff des fichiers et compatibilité vérifiés'],agent:['Outils et permissions limités','Sorties structurées et situations d’échec validées'],audit:['Constats reproduits et gravité documentée'],research:['Sources datées et vérifiables']};
    const plan='PLAN DE RECETTE CONTROL\nProjet : '+(project()?.name||'Non sélectionné')+'\nObjectif : '+mask(objective)+'\n\n'+[...(specific[kind]||[]),...defaults].map((x,i)=>'- [ ] '+(i+1)+'. '+x).join('\n')+'\n\nAucun de ces contrôles n’a été exécuté automatiquement.';
    area.querySelector('.lab-result')?.remove();renderData(plan);
   });
  }else if(mode==='privacy'){
   area.append(el('p',{class:'lab-help',text:'Repère et masque certains jetons ou secrets avant d’envoyer un texte à une IA. Contrôle indicatif : les secrets inconnus peuvent ne pas être détectés.'}),txt('Texte à inspecter (ne colle pas de vraies clés privées)','source'));
   const b=el('button',{text:'Inspecter et masquer'});b.className='lab-primary';area.append(b);b.addEventListener('click',()=>{
    const before=inputValue('source');if(!before){message('Colle un texte à vérifier.',true);return}
    const after=mask(before);area.querySelector('.lab-result')?.remove();message(before===after?'Aucun motif de secret connu repéré ; contrôle manuel toujours indispensable.':'Des motifs sensibles ont été masqués. Contrôle le texte avant copie.',false);renderData(after);
   });
  }
 }
 root.querySelector('#lab-project').addEventListener('change',e=>{projectId=e.target.value;render()});
 for(const b of tabs)b.addEventListener('click',()=>{mode=b.dataset.labMode;render()});
 render();
}
window.CONTROL_LAB={mount,compose,scoreAnswer,inspectHTML,parseJSON,compareText,mask};
})();