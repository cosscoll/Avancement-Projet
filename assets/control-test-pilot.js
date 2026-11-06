(()=>{'use strict';const root=document.querySelector('[data-control-pilot]');if(!root)return;
const checks=Array.from(root.querySelectorAll('[data-pilot-check]'));
const progress=root.querySelector('#pilot-progress');
const update=()=>{progress.textContent=checks.filter(item=>item.checked).length+' / '+checks.length};
checks.forEach(item=>item.addEventListener('change',update));update();
const field=id=>(root.querySelector('#'+id)?.value||'').trim();
function collect(){
 const rating=root.querySelector('input[name="pilot-rating"]:checked')?.value||null;
 return {format:'control-test-pilot-v1',date:new Date().toISOString(),device:field('pilot-device')||'non_precise',
  ease:rating?Number(rating):null,
  steps:checks.map(c=>({mission:c.dataset.pilotCheck,terminee:c.checked})),
  answers:{difficultes:field('pilot-confusing'),blocages:field('pilot-bug'),fonction_utile:field('pilot-useful')},
  information:'Rapport de formulaire uniquement, aucune donnee CONTROL ni historique IA inclus.'};
}
root.querySelector('#pilot-download').addEventListener('click',()=>{
 const report=collect(),contents=JSON.stringify(report,null,2);
 const object=URL.createObjectURL(new Blob([contents],{type:'application/json;charset=utf-8'}));
 const link=document.createElement('a');link.href=object;link.download='control-retour-test-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(object),1500);
 root.querySelector('#pilot-status').textContent='Compte rendu téléchargé. Transmettez ce fichier à la personne qui organise le test. Aucune donnée n’a été envoyée automatiquement.';
});
window.CONTROL_PILOT_REPORT=Object.freeze({collect});
})();