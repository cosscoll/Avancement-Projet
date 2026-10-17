# CONTROL — Plan de stabilisation après audit

**Dernière mise à jour : 17 octobre 2026**  
**Source de vérité :** dépôt `cosscoll/Avancement-Projet`, branche `main`.  
**Périmètre :** CONTROL uniquement. Aucune migration sur IAgile Academy, aucun achat et aucune clé API dans le dépôt public.

## Objectif produit

Permettre à un utilisateur de **créer un projet → confier des missions à des IA → recevoir des résultats sourcés → les vérifier → collaborer → publier**, depuis une interface compréhensible sur Android et ordinateur.

Les bibliothèques, tutoriels, calendriers et visios sont utiles dans la mesure où ils soutiennent ce parcours. **Ne pas multiplier les modules ni les écrans principaux.**

## Itération 1 — Réalisée : tests automatisés et garde-fous

| Statut | Changement | Preuve / limite |
| --- | --- | --- |
| ✅ | Ajout du workflow GitHub Actions `.github/workflows/quality.yml`, sans dépendances npm ni secrets, droits GitHub lecture seule | Exécution de `node --check` et `node --test tests/*.test.mjs` sur runner Node 22 |
| ✅ | Ajout de la suite `tests/production-readiness.test.mjs` | Vérifie assets du HTML/PWA, liens de navigation, documents publics, Cloud inactif, politique de sécurité Cloud et blocage SQL |
| ✅ | Résolution de l'incohérence Jitsi Cloud : l'iframe de test n'est plus proposée là où la CSP l'interdit | `allowInlineVideo:false` dans le client Cloud ; le lien du fournisseur demeure, aucune règle CSP assouplie |
| ✅ | Protections d'isolation **dans les migrations SQL elles-mêmes** | Toutes les migrations CONTROL échouent sans confirmation préalable `app.control_isolated_project='confirmed'` **dans la bonne session et exclusivement sur le futur projet CONTROL** |
| ✅ | Test de vrais parcours simulés avec création de 2 missions Claude/Gemini, import du livrable et isolation par projet | `tests/project-flows.test.mjs` exécuté dans GitHub Actions Node |
| ✅ | Correction d'un compteur trompeur de CONTROL IA : une réunion et deux visios affichaient « 12 » au lieu de « 3 » | Parenthèses arithmétiques dans `assets/command-center.js`, régression `tests/dashboard-counts.test.mjs` |
| ✅ | Restauration de sauvegardes renforcée : validation des tableaux, refus des clés JSON modifiant des prototypes et message explicite si le retour arrière échoue | `tests/backup-safety.test.mjs`, historique des anciennes sauvegardes toujours accepté |
| ✅ | Aucune activation de `CONTROL_AI_DISPATCH_ENABLED`, de création de compte Cloud, de clé API ou de facturation | Les interruptions techniques restent fermées |
| ⚠️ | Vérification UI sur appareil Android réel | Non effectuée. Les tests JavaScript/Node et une publication Pages verte ne garantissent pas l'UX mobile ni le fonctionnement des appels vidéo |
| ⚠️ | Blocage automatique du déploiement Pages en cas de CI rouge | Non configuré. GitHub Pages construit depuis la branche indépendamment du workflow Qualité ; ne pas prétendre que la publication est conditionnée aux tests |

**Important :** le statut de réussite du workflow Qualité prouve que les tests déclarés ont tourné sur le runner. Il ne prouve pas qu'un compte Cloud, un appel IA ou une visioconférence réelle fonctionne.

## Itération 2 — Avancement du 17 octobre, deuxième session

- ✅ **Visio / confidentialité :** lors d'un changement d'écran, CONTROL libère les écouteurs d'événements et demande l'arrêt du module Jitsi si une visio de test était ouverte. La disparition de la fenêtre vidéo déclenche également sa destruction. Un retour vers la même page ne duplique plus les actions « Inviter ».
- ✅ **Missions multi-IA :** les anciens écouteurs sont supprimés lorsque le poste de commande est rouvert ; les actions « Copier la mission » et les imports de résultats ne sont plus déclenchés plusieurs fois par des anciens écrans.
- ✅ **Provenance des IA :** l'étiquette d'un résultat reçu via API indique qu'il reste **à vérifier**, plutôt que de suggérer que son contenu est validé.
- ✅ **Accueil personnel :** un projet personnalisé n'est plus annoncé créé lorsque `localStorage` refuse l'écriture (quota ou restriction de navigateur). La restauration de l'état est vérifiée par test.
- ✅ **Données corrompues :** valeurs locales nulles, tableaux ou JSON invalide ne doivent plus empêcher l'initialisation du tableau de bord.
- ✅ **PWA Android :** précache limité à six requêtes simultanées (au lieu de téléchargements strictement séquentiels) ; visite d'une page historique ou inconnue ne peut plus remplacer la page d'accueil dans le cache hors ligne.
- ✅ **UX/UI :** suppression du doublon « Missions IA » de la section essentielle ; son historique complet est conservé dans **Organiser**.
- ✅ **Régressions automatiques :** suites `lifecycle-navigation.test.mjs`, `project-storage.test.mjs` et `service-worker-navigation.test.mjs` ajoutées et exécutées par GitHub Actions.

**Éléments toujours ouverts :** tests Android physiques, performance réseau réelle, adaptation tablette, recette visio caméra/micro, authentification et Cloud multi-utilisateurs. Une réussite GitHub Actions ne vaut pas recette mobile physique.

## Itération 2 — Stabiliser les parcours personnels (sans backend)

**P0 / à poursuivre en priorité :**
- Tester l'accueil, la recherche et l'ouverture de projets, l'ajout de missions et la reprise après rechargement ; vérifier qu'un échec du stockage local ne laisse pas croire à un succès.
- Couvrir la création d'une mission Claude/Gemini et son suivi avec import manuel de résultats, provenance et URL de preuve, sur différents projets.
- Tester l'enregistrement, la modification, la suppression, l'export et l'import de fiches de rendez-vous.
- Valider les parcours sur Android Chrome, écran étroit, clavier, focus, PWA installée, cache et version après mise à jour.
- Mesurer le chargement initial : taille des scripts, doublons de modules, écrans inutiles, indicateurs d'avancement non sourcés.
- Corriger les erreurs réellement reproduites et enregistrer les preuves dans les tests.

**Critère de sortie :** aucune exception JavaScript bloquante sur les 4 destinations principales ni les 3 workflows projet/mission/rendez-vous, les données restent disponibles après rechargement et export/restauration.

## Itération 3 — CONTROL Cloud indépendant : bloqué par autorisation et vérification de coût

- **Ne jamais réutiliser** le projet Supabase IAgile Academy.
- Vérifier coût et limite de projets gratuits via le connecteur Supabase.
- Solliciter l'autorisation explicite du propriétaire avant la création d'un projet **CONTROL Cloud** distinct ; si la création est payante, ne pas créer.
- Après création autorisée : appliquer le schéma avec le verrou SQL explicite, puis tester avec **deux utilisateurs différents** la lecture et l'écriture des données, y compris fiches visio et missions IA.
- Valider magic link / Google OAuth, RLS, suppression de compte, import de données locales, URLs de redirection, journalisation et sauvegarde.
- Activer les inscriptions seulement après preuves de séparation inter-utilisateurs.

**Critère de sortie :** tests RLS sur deux comptes, aucune donnée accessible depuis l'autre compte, aucun secret côté navigateur, gestion du compte et de ses données validée.

## Itération 4 — Connexion multi-IA : en attente d'autorisation provider et budget

- Construire une passerelle serveur appliquant authentification, consentement, plafond journalier et budget par fournisseur.
- Tester l'exécution de vraies missions via les API Claude/Gemini dans une configuration isolée et approuvée, sans accès GitHub implicite.
- Enregistrer les réponses automatiquement **avec statut réel**, modèle, coût/usage connu, source, date et preuve. Toujours distinguer « généré », « vérifié » et « publié ».
- Envoyer à GitHub uniquement des modifications autorisées, après diff, tests, revue et confirmation de publication.
- Ne jamais présenter un simple lien vers une conversation privée comme une intégration API effective.

**Critère de sortie :** une mission réellement envoyée à un fournisseur autorisé, un résultat lisible dans le même projet, preuves et coût visible, aucun appel supplémentaire sans autorisation.

## Itération 5 — Collaboration et calendrier : après le socle des comptes

- Invitations d'équipe, rôles, partage ciblé de projets, messagerie et commentaires, audit des permissions.
- Disponibilités de calendrier vérifiées, réservation client/prospect et confirmations autorisées.
- Service de visio de production conforme aux exigences de sécurité et aux conditions du fournisseur ; `meet.jit.si` reste réservé aux tests.
- Accès aux ressources IAgile selon l'inscription/éligibilité vérifiée, sans exposer les contenus premium.

## Règles permanentes de toutes les sessions

1. **Tester avant de déclarer « terminé ».** Donner le lien vers le commit et le statut de CI, et distinguer tests statiques, tests fonctionnels simulés et tests réels Android/cloud.
2. Travailler avec l'outil GitHub connecté sur le dépôt du projet ; n'introduire ni clé API ni donnée privée dans GitHub public.
3. Une seule mission principale par itération : priorité au parcours utilisateur et aux bugs bloquants, pas au nombre d'outils ajoutés.
4. Préserver l'architecture d'information simple : Projets / À traiter / CONTROL IA / Outils.
5. En cas de CI rouge, corriger avant de poursuivre l'ajout de fonctionnalités.
6. Ne pas créer de ressources facturables, envoyer une demande provider, contacter des clients ou activer des inscriptions sans les autorisations adaptées.

## Ressources

- Tests : `tests/*.test.mjs`
- CI : `.github/workflows/quality.yml`
- UX : `docs/UX_CLARTE_CONTROL.md`
- Cloud : `docs/CONTROL_CLOUD_SAAS.md`
- Commandes IA : `docs/COMMANDER_CLAUDE_GEMINI.md`
- Visios : `docs/VISIOS_RENDEZ_VOUS.md`
