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
  return '<form id="builder-form"><label>Direction créative<select class="field" name="theme">'+themes+'</select></label>'+
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
  '<div class="web-builder-layout"><div class="web-builder-panel"><h2>Personnaliser</h2><div id="builder-fields">'+form()+'</div><div class="web-builder-saves"><div class="row"><h3>Mes brouillons</h3><button type="button" id="builder-new">Nouveau</button></div><div id="builder-drafts">'+entries()+'</div><button type="button" id="builder-delete" hidden>Supprimer ce brouillon</button></div></div>'+
  '<div class="web-builder-work"><div class="web-builder-toolbar"><strong>Aperçu sécurisé</strong><div class="web-builder-modes"><button type="button" data-builder-viewport="desktop" aria-pressed="true">Ordinateur</button><button type="button" data-builder-viewport="mobile" aria-pressed="false">Mobile</button></div></div>'+
  '<div class="web-builder-canvas"><iframe id="builder-preview" title="Aperçu isolé du site généré" sandbox="" referrerpolicy="no-referrer"></iframe></div>'+
  '<details class="web-builder-code"><summary>Voir le code HTML généré</summary><p class="muted">Code en lecture seule : modifiez les champs à gauche, puis exportez les fichiers.</p><textarea id="builder-code" readonly spellcheck="false" aria-label="Code HTML généré" rows="12"></textarea></details>'+
  '<p class="web-builder-limits">Aperçu isolé : les scripts, formulaires et contenus externes sont désactivés. L’export fournit index.html, styles.css, standalone.html et README.md. Aucune connexion ni hébergement externe.</p></div></div></div>';
 const $=s=>target.querySelector(s),query=s=>[...target.querySelectorAll(s)];
 const status=text=>{const el=$('#builder-status');if(el)el.textContent=text};
 function values(){
  const f=new FormData($('#builder-form')),out={};
  for(const [k,v] of f)out[k]=String(v);
  return {...engine.normalize(out),project:api.projects.some(p=>p.id===out.project)?out.project:'',id:selectedId};
 }
 function preview(){
  working=values();
  const frame=$('#builder-preview');
  frame.srcdoc=engine.markup(working,true);
  $('#builder-code').value=engine.markup(working,true);
  frame.setAttribute('data-theme',working.theme);
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
  const editor=$('#builder-form');
  editor.addEventListener('input',()=>{unsaved=true;preview()});
  editor.addEventListener('change',()=>{unsaved=true;preview()});
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