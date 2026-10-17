import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('assets/control-coach.js','utf8'),sandbox,{timeout:1000});
const coach=sandbox.window.CONTROL_COACH;

test('CONTROL Coach exposes a local advisory engine',()=>{
 assert.equal(typeof coach.advise,'function');
 assert.equal(coach.advise('   '),null);
});
test('CONTROL Coach routes a blocking error to troubleshooting',()=>{
 const result=coach.advise('Mon site affiche une erreur 404');
 assert.equal(result.category,'blocage');
 assert.equal(result.steps.length,4);
 assert.match(result.disclaimer,/aucune action/);
});
test('CONTROL Coach helps with task prioritization',()=>{
 const result=coach.advise('Comment organiser mes priorités ?');
 assert.equal(result.category,'priorite');
});
test('CONTROL Coach does not claim external execution',()=>{
 for(const query of ['connecter une clé API','publier sur GitHub','relancer un client','question inconnue']){
  const result=coach.advise(query);
  assert.ok(result.steps.every(step=>typeof step==='string'&&step.length>15));
  assert.match(result.disclaimer,/aucune action/);
 }
});

test('CONTROL Coach recognizes accented troubleshooting and planning queries',()=>{
 assert.equal(coach.advise('Je suis bloqué').category,'blocage');
 assert.equal(coach.advise('Mes priorités sont floues').category,'priorite');
});

test('CONTROL Coach handles costs, recovery and collaboration',()=>{
 assert.equal(coach.advise('Je dépasse mon quota gratuit').category,'budget');
 assert.equal(coach.advise('J’ai perdu une sauvegarde').category,'donnees');
 assert.equal(coach.advise('Organiser une visio avec mon équipe').category,'equipe');
});

test('CONTROL Coach never claims to consume project context',()=>{
 const answer=coach.advise('Aide-moi à organiser ma journée','Projet confidentiel');
 assert.equal(answer.contextUsed,false);
});
