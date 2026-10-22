/* CONTROL builder UI: local editor, read-only sandbox preview and explicit file export. */
(()=>{'use strict';
const core=()=>window.CONTROL_WEB_BUILDER_CORE;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(target,api){
 const engine=core();
 if(!engine){target.textContent='Le constructeur est indisponible. Actualise CONTROL.';return}
 let selectedId='',working=engine.normalize({theme:'studio'}),view='desktop',unsaved=false;
 const persist=()=>api.list().filter(x=>x&&typeof x==='object').slice(-40).reverse();
 function entries(){return persist().map(x=>'<button type="button" class="web-builder-draft" data-open-draft="'+escape(x.id)+'"><strong>'+escape(x.brand||'Sans nom')+'</strong><small>'+escape(x.theme||'studio')+' · '+escape(api.projectName(x.project)||'Projet libre')+'</small></button>').join('')||'<p class="muted">Aucun brouillon enregistré sur cet appareil.</p>'}
 const field=(label,name,val,limit=100)=>'<label>'+escape(label)+'<input class="field" name="'+name+'" maxlength="'+limit+'" value="'+escape(val)+'"></label>';
 const form=()=>{
  const themes=Object.entries(engine.THEMES).map(([id,t])=>'<option value="'+id+'" '+(working.theme===id?'selected':'')+'>'+escape(t.label)+'</option>').join('');
  const projects='<option value="">Projet libre</option>'+api.projects.map(p=>'<option value="'+escape(p.id)+'" '+(working.project===p.id?'selected':'')+'>'+escape(p.name||p.id)+'</option>').join('');
  const palettes=Object.entries(engine.PALETTES[working.theme]).map(([id,p])=>'<option value="'+id+'" '+(working.palette===id?'selected':'')+'>'+escape(p.label)+'</option>').join('');
  const fonts=Object.entries(engine.TYPOGRAPHIES).map(([id,t])=>'<option value="'+id+'" '+(working.typography===id?'selected':'')+'>'+escape(t.label)+'</option>').join('');
  return '<form id="builder-form"><label>Direction créative<select class="field" name="theme">'+themes+'</select></label>'+
   '<div class="web-builder-style-options"><label>Palette<select class="field" name="palette">'+palettes+'</select></label><label>Typographie<select class="field" name="typography">'+fonts+'</select></label></div>'+
   field('Nom de marque','brand',working.brand,64)+
   field('Signature','tag',working.tag,90)+
   '<label>Titre principal<textarea class="field" name="title" rows="3" maxlength="130">'+escape(working.title)+'</textarea></label>'+
   '<label>Présentation<textarea class="field" name="description" rows="3" maxlength="280">'+escape(working.description)+'</textarea></label>'+
   field('Libellé du bouton','cta',working.cta,64)+
   '<label>Trois prestations, une par ligne<textarea class="field" name="services" rows="3" maxlength="270">'+escape(working.services.join('\n'))+'</textarea></label>'+
   field('Adresse de contact (facultative)','email',working.email,140)+
   '<label>Projet CONTROL associé<select class="field" name="project">'+projects+'</select></label>'+
   '<div class="web-builder-actions"><button class="primary" type="submit">Enregistrer le brouillon</button><button type="button" id="builder-export">Exporter le site .zip</button></div>'+
   '<p role="status" id="builder-status" aria-live="polite"></p></form>';
 };
 target.innerHTML='<div class="web-builder"><div class="web-builder-intro"><div><p class="quiet">CRÉATION WEB / ATELIER LOCAL</p><h1>Un site qui prend forme sous vos yeux.</h1><p>Choisissez une direction, personnalisez votre contenu et récupérez un site HTML/CSS utilisable. Aucune IA appelée, aucune publication automatique.</p></div><span class="chip">Prototype local · 3 modèles</span></div>'+
  '<div class="web-builder-layout"><div class="web-builder-panel"><h2>Personnaliser</h2><div id="builder-fields">'+form()+'</div><div class="web-builder-saves"><div class="row"><h3>Mes brouillons</h3><button type="button" id="builder-new">Nouveau</button></div><div id="builder-drafts">'+entries()+'</div><button type="button" id="builder-delete" hidden>Supprimer ce brouillon</button></div>'+
   '<section class="web-builder-history" id="builder-history" aria-label="Versions de ce brouillon"><h3>Historique des versions</h3><div id="builder-revisions"></div><small>Une version précédente restaurée devient une nouvelle version. Les 8 dernières versions antérieures sont conservées sur cet appareil.</small></section></div>'+
  '<div class="web-builder-work"><div class="web-builder-toolbar"><strong>Aperçu sécurisé</strong><div class="web-builder-modes"><button type="button" data-builder-viewport="desktop" aria-pressed="true">Ordinateur</button><button type="button" data-builder-viewport="mobile" aria-pressed="false">Mobile</button></div></div>'+
  '<div class="web-builder-canvas"><iframe id="builder-preview" title="Aperçu isolé du site généré" sandbox="" referrerpolicy="no-referrer"></iframe></div>'+
  '<section class="web-builder-audit" aria-labelledby="builder-audit-title"><div class="web-builder-audit-top"><h3 id="builder-audit-title">Contrôles avant export</h3><strong id="builder-audit-score" aria-live="polite"></strong></div><ul id="builder-audit-list"></ul><p class="muted">Contrôles statiques indicatifs : ils ne remplacent pas une recette SEO, WCAG ou Lighthouse, ni les essais sur appareils réels.</p></section>'+
  '<details class="web-builder-code"><summary>Voir le code HTML généré</summary><p class="muted">Code en lecture seule : modifiez les champs à gauche, puis exportez les fichiers.</p><textarea id="builder-code" readonly spellcheck="false" aria-label="Code HTML généré" rows="12"></textarea></details>'+
  '<p class="web-builder-limits">Aperçu isolé : les scripts, formulaires et contenus externes sont désactivés. L’export fournit index.html, styles.css, standalone.html et README.md. Aucune connexion ni hébergement externe.</p><p class="web-builder-limits"><a href="#/control/deploy">Consulter les étapes pour publier manuellement ce site →</a></p></div></div></div>';
 const $=s=>target.querySelector(s),query=s=>[...target.querySelectorAll(s)];
 const history=()=>{
  const panel=$('#builder-history'),box=$('#builder-revisions');
  const current=api.list().find(x=>x.id===selectedId);
  panel.hidden=!current;
  if(!current){box.textContent='';return}
  const version=Number.isSafeInteger(current.version)&&current.version>0?current.version:1;
  const rows=Array.isArray(current.revisions)?current.revisions.slice(-8).reverse():[];
  box.innerHTML='<p class="web-builder-current">Version actuelle : v'+version+'</p>'+
   (rows.length?rows.map(x=>'<div class="web-builder-version"><span>v'+escape(x.version)+' · '+escape(String(x.at||'').slice(0,10)||'date inconnue')+'</span><button type="button" data-restore-version="'+escape(x.version)+'">Restaurer</button></div>').join(''):'<p class="muted">Les anciennes versions apparaîtront après votre prochaine modification enregistrée.</p>');
 };

 const status=text=>{const el=$('#builder-status');if(el)el.textContent=text};
 function values(){
  const f=new FormData($('#builder-form')),out={};
  for(const [k,v] of f)out[k]=String(v);
  return {...engine.normalize(out),project:api.projects.some(p=>p.id===out.project)?out.project:'',id:selectedId};
 }
 function updateAudit(){
  const a=engine.audit(working);
  $('#builder-audit-score').textContent=a.passed+' / '+a.total+' contrôles';
  $('#builder-audit-list').innerHTML=a.checks.map(c=>'<li class="'+(c.ok?'is-passed':'is-advice')+'"><span aria-hidden="true">'+(c.ok?'✓':'!')+'</span><span><strong>'+escape(c.label)+'</strong>'+(c.ok?'':'<small>'+escape(c.advice)+'</small>')+'</span>'+(c.ok?'':'<button type="button" data-audit-field="'+escape(c.field)+'">Corriger</button>')+'</li>').join('');
 }
 function preview(){
  working=values();
  const frame=$('#builder-preview');
  frame.srcdoc=engine.markup(working,true);
  $('#builder-code').value=engine.markup(working,true);
  frame.setAttribute('data-theme',working.theme);
  updateAudit();
  status(unsaved?'Aperçu modifié : pensez à enregistrer votre brouillon.':'Aperçu prêt. Aucun fichier publié.');
 }
 function updateViewport(){
  const frame=$('#builder-preview');frame.classList.toggle('is-mobile',view==='mobile');
  query('[data-builder-viewport]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.builderViewport===view)));
 }
 function redraw(keepMessage=false){
  $('#builder-fields').innerHTML=form();
  if(!keepMessage)unsaved=false;
  $('#builder-delete').hidden=!selectedId;
  $('#builder-drafts').innerHTML=entries();
  history();
  const editor=$('#builder-form');
  let previousTheme=working.theme;
  function refreshPalette(){
   const theme=editor.elements.namedItem('theme').value,picker=editor.elements.namedItem('palette');
   if(!engine.PALETTES[theme])return;
   // Switch sample copy only if it has not been customized; never discard user edits.
   if(previousTheme!==theme){
    const before=engine.normalize({theme:previousTheme}),after=engine.normalize({theme});
    for(const name of ['title','description','tag','cta']){
     const control=editor.elements.namedItem(name);
     if(control&&control.value===before[name])control.value=after[name];
    }
    const offers=editor.elements.namedItem('services');
    if(offers&&offers.value===before.services.join('\n'))offers.value=after.services.join('\n');
    previousTheme=theme;
   }
   picker.innerHTML=Object.entries(engine.PALETTES[theme]).map(([id,p])=>'<option value="'+id+'">'+escape(p.label)+'</option>').join('');
   picker.value=Object.keys(engine.PALETTES[theme])[0];
  }
  editor.addEventListener('input',e=>{if(e.target.name==='theme')refreshPalette();unsaved=true;preview()});
  editor.addEventListener('change',e=>{if(e.target.name==='theme'&&engine.normalize({theme:e.target.value,palette:editor.elements.namedItem('palette').value}).palette!==editor.elements.namedItem('palette').value)refreshPalette();unsaved=true;preview()});
  editor.addEventListener('submit',event=>{
   event.preventDefault();const item=values();
   item.id=selectedId||api.id();
   if(!api.save(item)){status('Sauvegarde refusée : vérifiez l’espace disponible.');return}
   selectedId=item.id;working=item;unsaved=false;redraw();status('Brouillon enregistré sur cet appareil. Aucune publication.');
  });
  $('#builder-export').onclick=()=>{
   try{
    const input=values(),files=engine.files(input),packed=engine.zip(files);
    const url=URL.createObjectURL(new Blob([packed],{type:'application/zip'})),a=document.createElement('a');
    a.href=url;a.download='CONTROL-site-'+(input.brand.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9-]/g,'-').slice(0,40)||'export')+'.zip';
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
    status('Site exporté en ZIP. Ouvrez standalone.html pour le prévisualiser localement.');
   }catch{status('Export impossible : vérifiez le contenu et réessayez.')}
  };
  preview();
 }
 $('#builder-new').onclick=()=>{
  if(unsaved&&!confirm('Abandonner les modifications non enregistrées ?'))return;
  selectedId='';working=engine.normalize({theme:'studio'});redraw();
 };
 $('#builder-delete').onclick=()=>{
  if(!selectedId||!confirm('Supprimer uniquement ce brouillon local ? Cette action ne supprime aucun site déjà exporté.'))return;
  if(!api.remove(selectedId)){status('Suppression non enregistrée : aucune donnée effacée.');return}
  selectedId='';working=engine.normalize({theme:'studio'});redraw();status('Brouillon supprimé sur cet appareil.');
 };
 target.querySelector('.web-builder').addEventListener('click',event=>{

  const restore=event.target.closest('[data-restore-version]');
  if(restore){
   const row=api.list().find(x=>x.id===selectedId),version=Number(restore.dataset.restoreVersion);
   const archived=Array.isArray(row?.revisions)?row.revisions.find(x=>x.version===version):null;
   if(!archived||!archived.draft)return;
   if(unsaved&&!confirm('Abandonner les modifications en cours non enregistrées ?'))return;
   if(!confirm('Restaurer la version '+version+' en créant une nouvelle version ?'))return;
   const candidate={...engine.normalize(archived.draft),project:archived.draft.project||'',id:selectedId};
   if(!api.save(candidate)){status('Restauration refusée : stockage indisponible.');return}
   working=candidate;unsaved=false;redraw();status('Version '+version+' restaurée en une nouvelle version.');return;
  }
  const fix=event.target.closest('[data-audit-field]');
  if(fix){const el=$('#builder-form [name="'+fix.dataset.auditField+'"]');if(el){el.focus({preventScroll:true});el.scrollIntoView({block:'center',behavior:'auto'})}return}
  const viewport=event.target.closest('[data-builder-viewport]');
  if(viewport){view=viewport.dataset.builderViewport;updateViewport();return}
  const opened=event.target.closest('[data-open-draft]');
  if(opened){
   if(unsaved&&!confirm('Ouvrir un autre brouillon sans enregistrer les modifications actuelles ?'))return;
   const row=api.list().find(x=>x.id===opened.dataset.openDraft);
   if(!row)return;
   selectedId=row.id;working={...engine.normalize(row),project:row.project||''};redraw();status('Brouillon local chargé.');
  }
 });
 redraw();updateViewport();
}
window.CONTROL_WEB_BUILDER_UI={mount};
})();