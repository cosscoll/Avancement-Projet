/* CONTROL Coach : aide contextuelle instantanée, gratuite, sans réseau.
   Moteur de conseils déterministe complémentaire au modèle génératif local. */
(()=>{'use strict';
const clean=s=>String(s??'').slice(0,2000);
const normalize=s=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const rules=[
 {id:'blocage',match:/bloqu|erreur|bug|marche pas|fonctionne pas|impossible|plant|échec|failed|404|500/i,
 title:'Débloquer un problème',steps:['Reproduis le problème une fois et note le résultat attendu et le résultat obtenu.','Relève le message exact, la page concernée et les dernières modifications.','Teste sur un autre navigateur ou en navigation privée sans supprimer tes données.','Isole une seule cause possible, teste une correction et note le résultat.'],question:'Quel est le message d’erreur exact et sur quelle page apparaît-il ?'},
 {id:'priorite',match:/priorit|commencer|organis|planif|débord|trop de tâches|urgent/i,
 title:'Retrouver les priorités',steps:['Liste les trois résultats les plus importants pour ce projet.','Classe les tâches selon impact, urgence et dépendances.','Choisis une action faisable en moins de 30 minutes.','Fixe un point de contrôle et note le prochain blocage.'],question:'Quel résultat doit absolument être atteint en premier ?'},
 {id:'client',match:/client|prospect|devis|relance|rendez.vous|commercial/i,
 title:'Avancer avec un client',steps:['Clarifie le besoin et le résultat attendu.','Vérifie les informations manquantes avant de promettre un délai.','Prépare une réponse courte avec prochaine action et échéance.','Enregistre le suivi dans le projet concerné.'],question:'S’agit-il d’une prise de contact, d’un devis ou d’un suivi ?'},
 {id:'securite',match:/api|clé|token|secret|permission|connexion|authent|sécur/i,
 title:'Vérifier une intégration',steps:['Identifie le service et les permissions strictement nécessaires.','Ne colle jamais de clé secrète dans un dépôt public ou dans une conversation.','Teste la connexion avec un compte et des données de test.','Vérifie les accès refusés et la révocation des permissions.'],question:'Quel service veux-tu connecter et quelle action doit-il effectuer ?'},
 {id:'budget',match:/budget|cout|coût|factur|quota|credit|crédit|gratuit|abonnement/i,title:'Maîtriser les coûts',steps:['Identifie le service concerné et sa limite gratuite documentée.','Vérifie la consommation actuelle depuis le fournisseur officiel.','Prévois un arrêt ou une alternative gratuite avant toute limite payante.','N’active aucune dépense sans autorisation explicite.'],question:'Quel outil ou quota souhaites-tu contrôler ?'},
 {id:'donnees',match:/sauvegard|perdu|supprim|restaur|synchronis|stockage|memoire|mémoire/i,title:'Protéger et retrouver les données',steps:['Identifie si les données sont locales ou synchronisées dans un service distant.','Évite de vider le cache ou le stockage avant de disposer d’une sauvegarde.','Vérifie les sauvegardes disponibles et leur date.','Teste la restauration sur une copie avant de remplacer des données.'],question:'Sur quel appareil et dans quelle section les données manquent-elles ?'},
 {id:'equipe',match:/équipe|equipe|collabor|visio|réunion|reunion|agenda|calendrier/i,title:'Coordonner une équipe',steps:['Clarifie les participants et le résultat attendu de la réunion.','Propose deux créneaux compatibles avec les disponibilités vérifiées.','Prépare un ordre du jour court et les documents nécessaires.','Consigne les décisions et les responsables après la réunion.'],question:'Qui doit participer et quelle décision faut-il prendre ?'},
 {id:'livraison',match:/publier|déploi|github|production|mise en ligne|site|application/i,
 title:'Préparer une mise en ligne',steps:['Vérifie les modifications et l’état des tests automatisés.','Teste les parcours essentiels sur ordinateur et téléphone.','Contrôle les secrets, les accès et les données privées.','Publie puis vérifie l’URL publique et le retour arrière possible.'],question:'Quelle URL ou fonctionnalité doit être validée ?'}
];
function advise(question,context=''){
 const q=clean(question).trim();if(!q)return null;
 const matched=rules.filter(r=>r.match.test(q)||r.match.test(normalize(q)));
 const specificity=['blocage','securite','budget','donnees','equipe','client','livraison','priorite'];
 const rule=matched.sort((a,b)=>specificity.indexOf(a.id)-specificity.indexOf(b.id))[0]||{id:'general',title:'Clarifier et avancer',steps:['Définis le résultat précis que tu souhaites obtenir.','Décompose-le en une action immédiate et une vérification simple.','Identifie les informations ou autorisations manquantes.','Note la prochaine étape dans ton projet.'],question:'Quel résultat concret souhaites-tu obtenir ?'};
 return {category:rule.id,title:rule.title,steps:rule.steps.slice(),question:rule.question,contextUsed:false,disclaimer:'Conseils préparés localement : aucune action n’a été exécutée ni aucun service externe consulté.'};
}
function mount(root,options={}){
 if(!root||root.querySelector('[data-control-coach]'))return;
 const wrap=document.createElement('section');wrap.dataset.controlCoach='';wrap.className='loc-settings';wrap.style.marginBlock='16px';
 wrap.innerHTML='<h2>Assistant de dépannage et de tâches</h2><p>Une aide immédiate, même sans charger le modèle IA. Les conseils restent sur cet appareil.</p><form data-coach-form><label for="control-coach-question">Que souhaites-tu résoudre ?</label><textarea id="control-coach-question" rows="2" maxlength="1200" placeholder="Ex. Je suis bloqué pour publier mon site" required></textarea><button type="submit" class="loc-primary">Obtenir un plan d’action</button></form><div data-coach-result role="status" aria-live="polite"></div>';
 const anchor=root.querySelector('.loc-model');if(anchor)anchor.before(wrap);else root.append(wrap);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 wrap.querySelector('form').addEventListener('submit',e=>{
  e.preventDefault();const q=wrap.querySelector('textarea').value;
  const answer=advise(q);
  wrap.querySelector('[data-coach-result]').innerHTML='<h3>'+esc(answer.title)+'</h3><ol>'+answer.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol><p><strong>Pour préciser :</strong> '+esc(answer.question)+'</p><small>'+esc(answer.disclaimer)+'</small><div class="loc-chat-actions"><button type="button" data-coach-use>Approfondir avec l’IA</button><button type="button" data-coach-copy>Copier le plan</button></div>';
  const plan=answer.title+'\n'+answer.steps.map((step,i)=>(i+1)+'. '+step).join('\n')+'\nQuestion : '+answer.question;
  wrap.querySelector('[data-coach-copy]').addEventListener('click',async()=>{
   try{await navigator.clipboard.writeText(plan)}
   catch{const field=wrap.querySelector('textarea');field.value=plan;field.focus();field.select()}
  });
  wrap.querySelector('[data-coach-use]').addEventListener('click',()=>{
   const field=root.querySelector('#loc-question');if(!field)return;
   field.value=('Aide-moi à appliquer ce plan : '+plan).slice(0,1400);
   field.focus();root.querySelector('#loc-form')?.scrollIntoView?.({behavior:'smooth',block:'center'});
  });
 });
}
window.CONTROL_COACH={advise,mount};
})();