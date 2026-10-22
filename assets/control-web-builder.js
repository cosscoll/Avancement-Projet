/* CONTROL Web Builder v1 — deterministic local templates, never an AI executor.
   No API access, no telemetry, no external scripts or asset downloads. */
(()=>{'use strict';
const THEMES={
 studio:{label:'Portfolio / studio',accent:'#345a5d',paper:'#f3eee5',ink:'#202c2d',contrast:'#dbe3db',layout:'editorial'},
 atelier:{label:'Atelier / artisan',accent:'#93562f',paper:'#faf2e5',ink:'#332b20',contrast:'#edd6bb',layout:'craft'},
 produit:{label:'Produit / application',accent:'#8de1cc',paper:'#111a29',ink:'#eef4fc',contrast:'#1f3142',layout:'product'}
};
const PALETTES={
 studio:{
  natural:{label:'Sauge & ivoire',accent:'#345a5d',paper:'#f3eee5',ink:'#202c2d',contrast:'#dbe3db',dark:false},
  cobalt:{label:'Cobalt & porcelaine',accent:'#2755c8',paper:'#faf8f3',ink:'#263954',contrast:'#e0e8f6',dark:false},
  charcoal:{label:'Charbon & argent',accent:'#d8e2df',paper:'#182328',ink:'#f1f4f1',contrast:'#304349',dark:true}
 },
 atelier:{
  terre:{label:'Terre & sable',accent:'#93562f',paper:'#faf2e5',ink:'#332b20',contrast:'#edd6bb',dark:false},
  olive:{label:'Olive & lin',accent:'#68714a',paper:'#f4f2e6',ink:'#333d2e',contrast:'#d9dfc5',dark:false},
  ardoise:{label:'Ardoise & cuivre',accent:'#daa27c',paper:'#222a2d',ink:'#f6efe5',contrast:'#374043',dark:true}
 },
 produit:{
  mint:{label:'Menthe & nuit',accent:'#8de1cc',paper:'#111a29',ink:'#eef4fc',contrast:'#1f3142',dark:true},
  violet:{label:'Violet & nuit',accent:'#c6b5ff',paper:'#161325',ink:'#f2eefb',contrast:'#2b2846',dark:true},
  azure:{label:'Azure & graphite',accent:'#72c9fc',paper:'#121c26',ink:'#f4f8fc',contrast:'#1f3b52',dark:true}
 }
};
const TYPOGRAPHIES={
 modern:{label:'Contemporaine',font:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'},
 editorial:{label:'Éditoriale',font:'Georgia,Cambria,"Times New Roman",serif'},
 technical:{label:'Technique',font:'ui-monospace,SFMono-Regular,Consolas,monospace'}
};
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function clip(v,limit){return String(v??'').replace(/\u0000/g,'').trim().slice(0,limit)}
function normalize(value={}){
 const p=value&&typeof value==='object'?value:{},theme=Object.hasOwn(THEMES,p.theme)?p.theme:'studio';
 const defaults={
  studio:{title:'Un studio qui donne forme aux idées.',tag:'STRATÉGIE · DESIGN · DIGITAL',description:'Des identités et des expériences numériques qui se distinguent par leur simplicité.',cta:'Parlons de votre projet',services:['Direction artistique','Sites et expériences','Identité de marque']},
  atelier:{title:'Le beau se construit dans le détail.',tag:'ATELIER INDÉPENDANT',description:'Savoir-faire, matières et créations sur mesure. Chaque pièce raconte une histoire.',cta:'Découvrir notre approche',services:['Création sur mesure','Sélection de matières','Accompagnement']},
  produit:{title:'Moins de friction. Plus de résultats.',tag:'LE PRODUIT QUI SIMPLIFIE VOTRE QUOTIDIEN',description:'Un espace clair pour transformer les tâches répétitives en processus fluides.',cta:'Explorer la solution',services:['Piloter en un coup d’œil','Collaborer simplement','Garder le contrôle']}
 }[theme];
 let services=Array.isArray(p.services)?p.services:String(p.services??'').split('\n');
 services=services.map(v=>clip(v,90)).filter(Boolean).slice(0,3);
 while(services.length<3)services.push(defaults.services[services.length]);
 let email=clip(p.email,140).toLowerCase();
 if(!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email))email='';
 const palette=Object.hasOwn(PALETTES[theme],p.palette)?p.palette:Object.keys(PALETTES[theme])[0];
 const typography=Object.hasOwn(TYPOGRAPHIES,p.typography)?p.typography:'modern';
 return {theme,palette,typography,brand:clip(p.brand,64)||'MON STUDIO',tag:clip(p.tag,90)||defaults.tag,
  title:clip(p.title,130)||defaults.title,
  description:clip(p.description,280)||defaults.description,cta:clip(p.cta,64)||defaults.cta,
  services,email};
}
function styles(t){
 const theme=Object.hasOwn(THEMES,t?.theme)?t.theme:'studio';
 const palettes=PALETTES[theme],x=Object.hasOwn(palettes,t?.palette)?palettes[t.palette]:palettes[Object.keys(palettes)[0]];
 const font=TYPOGRAPHIES[t?.typography]?.font||TYPOGRAPHIES.modern.font;
 return [
 ':root{--paper:'+x.paper+';--ink:'+x.ink+';--accent:'+x.accent+';--contrast:'+x.contrast+';color-scheme:'+ (x.dark?'dark':'light') +';}',
 '*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:'+font+';line-height:1.5}',
 'a{color:inherit}a:focus-visible{outline:3px solid var(--accent);outline-offset:4px}button{font:inherit}section{scroll-margin-top:90px}',
 '.wrap{max-width:1280px;margin:auto;padding:0 clamp(22px,5vw,76px)}',
 '.nav{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid currentColor;padding:26px 0}.brand{font-weight:850;letter-spacing:-.045em;font-size:20px}.nav a{text-decoration:none;font-size:13px;font-weight:700}',
 '.hero{padding:clamp(75px,12vw,155px) 0 clamp(70px,10vw,130px)}.eyebrow{text-transform:uppercase;letter-spacing:.18em;font-weight:750;font-size:11px;opacity:.8}.hero h1{font-size:clamp(48px,8.7vw,124px);max-width:1100px;letter-spacing:-.075em;line-height:.98;font-weight:740;margin:30px 0}.hero .lede{font-size:clamp(17px,2vw,24px);max-width:650px;opacity:.78}',
 '.cta{display:inline-flex;align-items:center;gap:28px;border:1px solid var(--ink);border-radius:999px;padding:16px 25px;margin-top:23px;text-decoration:none;font-weight:700;font-size:14px;transition:transform .3s,border-color .3s,background .3s,color .3s}.cta:hover{transform:translateY(-4px);background:var(--ink);color:var(--paper)}.cta span{font-size:18px}',
 '.feature{padding:34px 0 65px;border-top:1px solid currentColor}.section-top{display:flex;justify-content:space-between;gap:30px;align-items:end;margin-bottom:30px}.section-top h2{font-size:clamp(30px,4vw,53px);letter-spacing:-.055em;line-height:1.1;margin:10px 0}.section-top p{max-width:350px;font-size:14px;opacity:.72}',
 '.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.card{border:1px solid currentColor;padding:26px;min-height:260px;display:flex;flex-direction:column;justify-content:space-between;transition:transform .4s,background .4s,color .4s;transform-style:preserve-3d}.card:hover{transform:translateY(-9px) rotateX(2deg);background:var(--contrast)}',
 '.card .number{font-size:12px;font-weight:700;opacity:.72}.card h3{font-size:clamp(23px,2.6vw,37px);letter-spacing:-.05em;max-width:235px;line-height:1.14}.card .arrow{font-size:26px;align-self:end}',
 '.contact{border-top:1px solid currentColor;padding:90px 0 75px}.contact h2{font-size:clamp(40px,7vw,90px);letter-spacing:-.065em;line-height:1.02;max-width:920px;margin:16px 0}.footer{border-top:1px solid currentColor;padding:20px 0 40px;display:flex;justify-content:space-between;gap:16px;font-size:12px;opacity:.67}',
 '.visual{position:relative;min-height:300px;padding:25px;background:var(--contrast);overflow:hidden;display:flex;align-items:center;justify-content:center;border-radius:6px}',
 '.editorial .visual{background:linear-gradient(120deg,#e1ded5,#cbdad0)}.editorial .visual::before{content:"";width:175px;height:175px;border:40px solid var(--accent);transform:rotate(-24deg);border-radius:0 90px 0 90px;opacity:.65}.editorial .visual::after{content:"FORM / FUNCTION";position:absolute;bottom:18px;left:20px;color:#233f40;font-size:11px;letter-spacing:.3em}',
 '.craft .hero{display:grid;grid-template-columns:1.2fr .8fr;gap:7vw;align-items:center}.craft .hero h1{font-size:clamp(52px,6.5vw,110px)}.craft .visual{min-height:480px;background:linear-gradient(148deg,#e7c7a2,#ac6d46)}.craft .visual::before{content:"";width:66%;height:75%;border:3px solid #f6e7ce;border-radius:50% 40% 48% 38%;transform:rotate(20deg);box-shadow:20px 20px 0 #98623f,inset 22px 18px 0 #dba676}.craft .visual::after{content:"ATELIER / ÉDITION 01";position:absolute;left:24px;bottom:22px;letter-spacing:.23em;font-size:12px;color:#3b281d}',
 '.product .visual{min-height:370px;background:radial-gradient(circle at 80% 20%,#2c786b 0%,transparent 36%),linear-gradient(145deg,#152a3f,#1c2a38);perspective:900px}',
 '.product .product-ui{width:min(90%,620px);padding:24px;background:#e3f7ed;color:#1a3440;border-radius:18px;box-shadow:28px 26px 0 #315867;transform:rotateY(-7deg) rotateX(5deg);transition:transform .6s}.product .visual:hover .product-ui{transform:rotateY(0) rotateX(0)}.product .product-ui strong{font-size:22px;letter-spacing:-.04em}.product .product-ui .flow-row{display:flex;gap:6px;margin-top:18px}.product .product-ui .flow-row span{background:#b3dace;padding:12px 9px;border-radius:7px;flex:1;text-align:center;font-size:11px;font-weight:700}',
 '.product .hero{padding-bottom:48px}.product .hero h1{max-width:980px}.product .cards .card{background:#152438;border-color:#395064}.product .cards .card:hover{background:#23473f}',
 '.craft .cards .card:nth-child(2){background:#edd6bb}.editorial .cards .card:nth-child(2){background:#d7e3d9}',
 '@media(min-width:850px){.editorial .visual{min-height:400px}.editorial .hero{padding-bottom:65px}}',
 '@media(max-width:760px){.craft .hero{grid-template-columns:1fr}.craft .visual{min-height:320px}.cards{grid-template-columns:1fr}.card{min-height:190px}.section-top{display:block}.visual{min-height:240px}.footer{display:block}.hero h1{word-break:normal}}',
 '@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}'
 ].join('\n');
}
function markup(t,inline=false){
 const x=THEMES[t.theme],contact=t.email?'mailto:'+escape(t.email):'#contact';
 const visual=t.theme==='produit'?'<div class="visual"><div class="product-ui"><strong>'+escape(t.brand)+'</strong><div class="flow-row"><span>01 · Organiser</span><span>02 · Collaborer</span><span>03 · Avancer</span></div><p>Un parcours lisible, une action à la fois.</p></div></div>':'<div class="visual" role="img" aria-label="Illustration abstraite de l’univers graphique"></div>';
 const hero=t.theme==='atelier'?'<div class="hero"><div><p class="eyebrow">'+escape(t.tag)+'</p><h1>'+escape(t.title)+'</h1><p class="lede">'+escape(t.description)+'</p><a class="cta" href="'+contact+'">'+escape(t.cta)+' <span aria-hidden="true">↗</span></a></div>'+visual+'</div>':
 '<div class="hero"><p class="eyebrow">'+escape(t.tag)+'</p><h1>'+escape(t.title)+'</h1><p class="lede">'+escape(t.description)+'</p><a class="cta" href="'+contact+'">'+escape(t.cta)+' <span aria-hidden="true">↗</span></a></div>'+visual;
 const cards=t.services.map((value,i)=>'<article class="card"><span class="number">0'+(i+1)+' / 03</span><h3>'+escape(value)+'</h3><span class="arrow" aria-hidden="true">↗</span></article>').join('');
 const css=inline?'<style>'+styles(t)+'</style>':'<link rel="stylesheet" href="./styles.css">';
 return '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<meta name="description" content="'+escape(t.description)+'">\n<title>'+escape(t.brand)+' — '+escape(t.title)+'</title>\n'+css+'\n</head>\n<body class="'+x.layout+'"><div class="wrap"><header class="nav"><a class="brand" href="#" aria-label="Accueil">'+escape(t.brand)+'</a><a href="#contact">Contact ↗</a></header>\n<main>'+hero+'<section class="feature" id="services"><div class="section-top"><div><p class="eyebrow">CE QUE NOUS CRÉONS</p><h2>Notre expertise.</h2></div><p>Trois façons de donner vie à une idée et de la transformer en expérience.</p></div><div class="cards">'+cards+'</div></section><section class="contact" id="contact"><p class="eyebrow">LA SUITE COMMENCE ICI</p><h2>Construisons quelque chose ensemble.</h2><a class="cta" href="'+contact+'">'+escape(t.cta)+' <span aria-hidden="true">↗</span></a></section></main><footer class="footer"><span>'+escape(t.brand)+' · Créé avec CONTROL</span><span>Design responsive · HTML & CSS</span></footer></div>\n</body>\n</html>';
}
function files(input){
 const t=normalize(input);
 return {'index.html':markup(t,false),'styles.css':styles(t),'standalone.html':markup(t,true),'README.md':'# '+t.brand+'\n\nKit statique généré localement par CONTROL.\n\n- index.html + styles.css : version éditable.\n- standalone.html : version autonome, sans installation.\n\nAucun JavaScript, accès serveur ou publication automatique. Ouvrez index.html ou standalone.html dans un navigateur.\n'};
}

function versionDraft(previous,input,reference,now){
 const data=normalize(input),project=String(input?.project||'').slice(0,96),id=String(reference||'');
 if(!/^[a-z0-9_-]{6,90}$/i.test(id))throw Error('Invalid local draft ID');
 const prior=previous&&previous.id===id?previous:null;
 if(prior){
  const same=JSON.stringify({...normalize(prior),project:String(prior.project||'')})===JSON.stringify({...data,project});
  if(same)return {...prior};
 }
 const prevVersion=prior&&(Number.isSafeInteger(prior.version)&&prior.version>0&&prior.version<100000)?prior.version:prior?1:0;
 const archive=prior?{version:prevVersion,at:String(prior.updatedAt||''),draft:{...normalize(prior),project:String(prior.project||'')}}:null;
 const history=(Array.isArray(prior?.revisions)?prior.revisions:[]).filter(x=>x&&Number.isInteger(x.version)&&x.version>0&&x.draft&&typeof x.draft==='object').slice(-7);
 if(archive)history.push(archive);
 return {...data,project,id,version:prevVersion+1,revisions:history,updatedAt:String(now||new Date().toISOString())};
}
function audit(input){
 const t=normalize(input),defaults=normalize({theme:t.theme}),html=markup(t,true),css=styles(t);
 const results=[
  {id:'brand',field:'brand',label:'Nom de marque personnalisé',ok:t.brand.length>=3&&t.brand!=='MON STUDIO',advice:'Choisissez le nom réel du projet plutôt que le nom générique.'},
  {id:'title',field:'title',label:'Titre lisible et concis',ok:t.title.length>=18&&t.title.length<=95&&t.title!==defaults.title,advice:'Remplacez le titre d’exemple par une proposition propre à votre activité (18 à 95 caractères).'},
  {id:'description',field:'description',label:'Description adaptée au référencement',ok:t.description.length>=55&&t.description.length<=160&&t.description!==defaults.description,advice:'Remplacez la description d’exemple par un texte précis et original de 55 à 160 caractères.'},
  {id:'services',field:'services',label:'Prestations distinctes',ok:t.services.every((s,i)=>s.length>=4&&s!==defaults.services[i])&&new Set(t.services.map(x=>x.toLowerCase())).size===3,advice:'Remplacez chacune des trois prestations d’exemple par votre offre réelle.'},
  {id:'email',field:'email',label:'Contact réellement joignable',ok:!!t.email,advice:'Ajoutez une adresse e-mail de contact : sans elle, le bouton mène seulement à la section Contact.'},
  {id:'structure',field:'title',label:'Structure et métadonnées HTML',ok:/<html lang="fr">/.test(html)&&/<meta name="viewport"/.test(html)&&/<meta name="description"/.test(html)&&/<main>/.test(html)&&/<h1>/.test(html),advice:'Une structure HTML essentielle est absente.'},
  {id:'mobile',field:'theme',label:'Mise en page mobile prévue',ok:/@media\(max-width:760px\)/.test(css),advice:'Le modèle ne contient pas de règles mobiles.'},
  {id:'offline',field:'theme',label:'Sans scripts ni dépendances externes',ok:!/<script\b|https?:\/\//i.test(html)&&!/@import|url\(/i.test(css),advice:'Retirez les dépendances externes avant diffusion.'}
 ];
 return {passed:results.filter(x=>x.ok).length,total:results.length,checks:results};
}
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0}
function zip(input){
 const encoder=new TextEncoder(),filesIn=Object.entries(input||{});
 if(!filesIn.length||filesIn.length>15)throw Error('Fichiers invalides.');
 const parts=[],central=[],view=(n)=>new DataView(new ArrayBuffer(n));
 let offset=0;
 const u16=(v,n,x)=>v.setUint16(n,x,true),u32=(v,n,x)=>v.setUint32(n,x>>>0,true);
 for(const [name,text] of filesIn){
  if(!/^[a-z0-9._-]{1,80}$/i.test(name)||name==='..'||typeof text!=='string')throw Error('Chemin ou contenu invalide.');
  const path=encoder.encode(name),data=encoder.encode(text),crc=crc32(data);
  if(data.length>3000000)throw Error('Fichier trop volumineux.');
  const local=view(30);u32(local,0,0x04034b50);u16(local,4,20);u16(local,8,0);u32(local,14,crc);u32(local,18,data.length);u32(local,22,data.length);u16(local,26,path.length);
  parts.push(new Uint8Array(local.buffer),path,data);
  const center=view(46);u32(center,0,0x02014b50);u16(center,4,20);u16(center,6,20);u32(center,16,crc);u32(center,20,data.length);u32(center,24,data.length);u16(center,28,path.length);u32(center,42,offset);
  central.push(new Uint8Array(center.buffer),path);offset+=30+path.length+data.length;
 }
 const centerSize=central.reduce((n,b)=>n+b.length,0);
 const end=view(22);u32(end,0,0x06054b50);u16(end,8,filesIn.length);u16(end,10,filesIn.length);u32(end,12,centerSize);u32(end,16,offset);
 const out=new Uint8Array(offset+centerSize+22);let cursor=0;
 for(const p of [...parts,...central,new Uint8Array(end.buffer)]){out.set(p,cursor);cursor+=p.length}
 return out;
}
window.CONTROL_WEB_BUILDER_CORE=Object.freeze({THEMES,PALETTES,TYPOGRAPHIES,normalize,markup,styles,files,zip,audit,versionDraft});
})();