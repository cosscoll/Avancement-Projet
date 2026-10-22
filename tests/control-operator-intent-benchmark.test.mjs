/* CONTROL local assistant intent and authorization test bench.
 * Synthetic fixtures only; neither API calls nor automated external actions. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../assets/control-operator-core.js',import.meta.url),'utf8');
const win={};
new Function('window',src)(win);
const core=win.CONTROL_OPERATOR_CORE;
assert.ok(core);
const projects=[
 {id:'ucp',short:'UCP',name:'Un Coup de Pouce',status:'construction',summary:'Un service pour le bâtiment'},
 {id:'demo',short:'Demo',name:'Projet Démo',status:'en préparation',summary:'Données confidentielles Demo'}
];
const snapshot={
 projects,
 actions:[{id:'t1',project:'ucp',title:'Envoyer devis',status:'todo',priority:'Haute'},
 {id:'t2',project:'demo',title:'Projet Démo secret',status:'todo'}],
 missions:[{id:'m1',project:'ucp',title:'Travail UCP',provider:'Claude',status:'doing'},
 {id:'m2',project:'demo',title:'Travail Demo secret',provider:'ChatGPT',status:'doing'}],
 events:[{id:'evt1',project:'ucp',title:'Entretien client',date:'2027-12-15T10:30'},
 {id:'evt2',project:'demo',title:'Rendez-vous confidentiel',date:'2027-12-14T10:30'}],
 meetings:[]
};
const R=[
 ['Mes tâches','read'],['Liste mes actions','read'],['Mon agenda','read'],
 ['Mes rendez-vous','read'],['Qui travaille sur les missions ?','read'],
 ['Quelles IA travaillent sur UCP ?','read'],['Où en est UCP ?','read'],
 ['Liste mes projets','read'],['Quel est le statut de UCP ?','read'],
 ['Retrouve le projet UCP','read'],['Mon calendrier','read'],
 ['Mes priorités','read'],['Mes tâches pour UCP','read'],['Mes tâches pour Demo','read'],
 ['Quelles missions pour UCP','read'],['Agenda du projet UCP','read'],
 ['Projet Démo état','read'],['Mes actions en retard','read']
];
const D=[
 ['Crée une tâche Préparer devis pour UCP','create_action','ucp'],
 ['Ajoute une action Relire budget pour Demo','create_action','demo'],
 ['Planifie une tâche Appeler partenaire pour UCP','create_action','ucp'],
 ['Note une tâche Relancer équipe pour UCP','create_action','ucp'],
 ['Créer une action Mettre à jour site pour UCP','create_action','ucp'],
 ['Programme un rendez-vous Conseil le 25/12/2027 à 14h30 pour UCP','create_event','ucp'],
 ['Ajoute un événement Démo le 27/12/2027 à 09h00 pour Demo','create_event','demo'],
 ['Planifie une réunion Pilotage le 28/12/2027 à 17h00 pour UCP','create_event','ucp'],
 ['Termine la tâche Envoyer devis pour UCP','complete_action','ucp'],
 ['Supprime le rendez-vous Entretien client pour UCP','delete_event','ucp'],
 ['Déplace le rendez-vous Entretien client le 29/12/2027 à 11h00 pour UCP','update_event','ucp']
];
const H=[
 ['Ne crée pas de tâche pour UCP','general'],
 ["N'ajoute pas une action pour UCP",'general'],
 ['Ne programme pas de rendez-vous pour UCP','general'],
 ['Comment créer une tâche pour UCP ?','general'],
 ['Sans rien créer, crée une tâche Démo pour UCP','general'],
 ['Crée une tâche puis programme un rendez-vous le 25/12/2027 à 10h00 pour UCP','general'],
 ['Supprime et déplace le rendez-vous Entretien client pour UCP','general'],
 ['Crée une tâche pour UCP et Demo','general'],
 ['Crée une tâche de Demo','ucp'],
 ['Mes tâches Demo','ucp'],
 ['Connecte mon compte ChatGPT','general'],
 ['Envoie un email avec Gmail','general'],
 ['Lance Claude','general'],
 ['Synchronise Gmail','general'],
 ['Quel est mon token secret ?','general'],
 ['Efface toutes les actions pour UCP','general'],
 ['Supprime toutes les données','general'],
 ['Crée une tâche sans projet','general'],
 ['Termine la tâche Inexistante pour UCP','general'],
 ['Supprime le rendez-vous inconnu pour UCP','general']
];
const bench=[...R.map(([prompt,kind])=>({prompt,kind,scope:'general'})),
 ...D.map(([prompt,type,project])=>({prompt,kind:'draft',type,project,scope:'general'})),
 ...H.map(([prompt,scope])=>({prompt,kind:'help',scope}))];
test('40+ independent intent and permission cases are explicitly classified',()=>{
 assert.ok(bench.length>=40,'A real benchmark needs at least forty cases');
 assert.equal(new Set(bench.map(x=>x.prompt)).size,bench.length,'Every fixture must be unique');
 let ok=0;
 for(const {prompt,kind,scope,type,project} of bench){
  const r=core.interpret(prompt,snapshot,scope);
  assert.equal(r.kind,kind,'Interpretation of '+JSON.stringify(prompt)+' in '+scope);
  if(type){assert.equal(r.action?.type,type,prompt);assert.equal(r.action?.projectId,project,prompt)}
  else assert.ok(!r.action,'Read or refused intent must not create a draft: '+prompt);
  assert.ok(typeof r.text==='string'&&r.text.length>8);
  ok++;
 }
 assert.equal(ok,bench.length);
});
test('separate permission cases cannot leak another project in a scoped session',()=>{
 const view=core.interpret('Mes tâches',snapshot,'ucp');
 assert.equal(view.kind,'read');
 assert.ok(view.text.includes('Envoyer devis'));
 assert.ok(!view.text.includes('Projet Démo secret'));
 for(const q of ['Mes missions','Mon agenda','Mes projets','Où en est UCP ?']){
  const result=core.interpret(q,snapshot,'ucp');
  assert.equal(result.kind,'read',q);
  assert.ok(!result.text.includes('Travail Demo secret'),'Cross-project leak '+q);
  assert.ok(!result.text.includes('Rendez-vous confidentiel'),'Cross-project calendar leak '+q);
 }
 assert.equal(core.interpret('Mes tâches',snapshot,'unknown').kind,'help');
 assert.equal(core.interpret('Crée une tâche Appeler pour Demo',snapshot,'ucp').kind,'help');
});
test('drafts still require fresh, valid on-device targets and cannot run external actions',()=>{
 for(const [,type,project] of D){
  assert.ok(project==='ucp'||project==='demo');
  assert.ok(['create_action','create_event','complete_action','delete_event','update_event'].includes(type));
 }
 const stale={type:'complete_action',projectId:'ucp',id:'t1',title:'Envoyer devis',expectedStatus:'doing'};
 assert.throws(()=>core.reviewAction(stale,snapshot,'ucp'),/Statut modifié/);
 assert.throws(()=>core.reviewAction({...stale,expectedStatus:'todo'},snapshot,'demo'),/Projet non autorisé/);
 assert.throws(()=>core.reviewAction({type:'send_email',projectId:'ucp',title:'Ne pas envoyer'},snapshot,'ucp'),/interdit/);
 assert.throws(()=>core.reviewAction({type:'create_event',projectId:'ucp',title:'Date passée',date:'2023-12-15T12:00'},snapshot,'ucp'),/Date future/);
 assert.match(core.reviewAction({type:'create_action',projectId:'ucp',title:'Préparer le dossier'},snapshot,'ucp').risk,/appareil/);
});
test('timezone ambiguity and impossible dates cannot pass the final permission review',()=>{
 const dates=['2027-02-30T12:00','2027-03-28T02:30','2027-12-15T25:30','2027-10-31T02:30','2027-12-15T12:75','tomorrow'];
 for(const date of dates)if(!core.validateLocalDateTime(date))
  assert.throws(()=>core.reviewAction({type:'create_event',projectId:'ucp',title:'Rendez-vous',date},snapshot,'ucp'),/Date future/);
 const explicit=core.interpret('Programme un rendez-vous Planning le 12/12/2027 à 10h00 CET pour UCP',snapshot);
 assert.equal(explicit.kind,'draft');
 assert.equal(explicit.action.date,'','Ambiguous timezone must never be silently converted');
 assert.throws(()=>core.reviewAction(explicit.action,snapshot,'ucp'),/Date future/);
});
test('no accidental external calls or claims of connected autonomous agents',()=>{
 assert.doesNotMatch(src,/\bfetch\(|\bXMLHttpRequest\b|\bWebSocket\b|sendBeacon|supabase\.auth/);
 assert.match(src,/Aucun fournisseur n’a été déclenché/);
 assert.match(src,/pas une preuve d’activité en direct/);
});
