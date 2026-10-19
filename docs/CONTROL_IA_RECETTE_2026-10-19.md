# CONTROL IA — Recette technique du 19 octobre 2026

**Périmètre :** application personnelle CONTROL et CONTROL IA, copie locale puis URL publique GitHub Pages, profil Chromium vierge et éphémère. Aucun utilisateur réel, fournisseur IA externe, compte OAuth ou service facturable n'a été utilisé.

## Preuves directement consultables

- **109 tests Node réussis, 0 échec** : [GitHub Actions CONTROL — Qualité et régressions](https://github.com/cosscoll/Avancement-Projet/actions/runs/39228575535).
- **Recette réelle Chromium réussie deux fois** (copie locale puis site public) : [GitHub Actions CONTROL IA — Recette navigateur Chromium](https://github.com/cosscoll/Avancement-Projet/actions/runs/39228575645).
- **Déploiement GitHub Pages réussi** sur la même version : [GitHub Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/39228575264).
- **Contrat du journal de sprints réussi** après rétablissement des champs de preuves de Pack Procédures Pro : [GitHub Actions](https://github.com/cosscoll/Avancement-Projet/actions/runs/39228451206).
- **Code du navigateur de recette** : [tests/control-ia-browser-smoke.mjs](../tests/control-ia-browser-smoke.mjs), réexécuté à chaque changement correspondant sur `main` par [control-ia-browser.yml](../.github/workflows/control-ia-browser.yml).

## Résultats sur la vraie interface

| Scénario testé | Résultat | Portée réelle |
|---|---|---|
| Chargement du suivi CONTROL IA | PASS | 9 capacités, 36 critères, focus CONTROL-ACCOUNT visibles dans Chromium |
| Protection lecture des données personnelles locales | PASS | Refus avant consentement ; consentement réinitialisé au rechargement |
| Création d'une tâche par une demande utilisateur | PASS | Confirmation, enregistrement unique dans le projet UCP |
| Relecture des tâches | PASS | Réponse issue des données CONTROL du navigateur |
| Persistance | PASS | Tâche retrouvée après actualisation avec le même profil de test |
| Calendrier local | PASS | Date et heure demandées conservées par l'événement créé |
| Isolation de la portée projet | PASS | Demande de création pour IAgile refusée si UCP sélectionné |
| Responsive mobile émulé | PASS | Largeur 390 px, sans débordement horizontal du document |
| Exceptions JavaScript | PASS | Aucune exception non interceptée dans les interactions examinées |

Les scénarios ont été effectués sur un serveur de fichiers **local** puis **directement** sur `https://cosscoll.github.io/Avancement-Projet/#/control/localai` dans un navigateur Chromium réel (headless) lancé par GitHub Actions.

Le test crée uniquement une tâche et un événement de démonstration dans un **profil navigateur éphémère** ; aucun agenda externe, message ou compte utilisateur n'a été affecté.

## Défauts observés et corrigés durant la recette

1. Le journal de Pack Procédures Pro était incompatible avec le contrat V2 du dépôt central malgré des preuves réelles déjà présentes : deux rapports ont été enrichis **sans effacer l'historique** avec leurs URLs de tests HTTP et leurs vérifications horodatées. Les workflows globaux passent à nouveau.
2. Le premier script Chromium pouvait échouer **après tous les tests réussis** lorsque Chrome écrivait encore dans son profil temporaire. L'arrêt du groupe de processus du navigateur et le nettoyage défensif ont été corrigés ; le workflow complet est désormais vert.

Ces corrections concernent la **qualité de livraison et du banc de tests** ; elles ne sont pas une implémentation des fonctions Cloud manquantes.

## Non testé / non opérationnel à ce jour

- **CONTROL Cloud** : `config/cloud.json` reste `enabled:false`, sans backend CONTROL indépendant activé ni sessions A/B RLS testées.
- **Synchronisation** : aucune preuve d'une vraie session retrouvée entre téléphone et ordinateur ni de reprise depuis une base serveur.
- **IA externes** : pas de délégation réellement exécutée vers ChatGPT, Claude, Gemini ou Codex, ni de suivi d'exécution fournisseur horodaté.
- **Notifications** : aucun scheduler CONTROL et aucune notification push système application fermée vérifiés.
- **Visios et invitations** : aucun envoi réel ou modification chez un fournisseur de calendrier externe vérifié.
- **Agent développeur** : aucun cycle complet prompt → code → sandbox → tests → publication vérifié.
- **Appareils physiques** : les tests à largeur mobile dans Chromium **ne remplacent pas** Chrome Android, Safari iOS, un vrai GPU mobile et les interactions tactiles.
- **Accessibilité et performance** : aucune vérification exhaustive WCAG sur téléphone, ni mesures de terrain INP/LCP/CLS.
- **IA locale générative** : son téléchargement effectif et son inférence sur appareils physiques n'ont pas été testés dans cette recette.

## Décision de livraison

**GO limité** pour les parcours locaux testés de CONTROL personnel. **NO-GO** pour présenter CONTROL IA comme un orchestrateur autonome ou une plateforme Cloud opérationnelle.

Le critère `QA-01` du tracker est validé **uniquement pour les parcours personnels définis** avec preuve GitHub Actions ci-dessus. Les 35 autres critères et tous les obstacles restent ouverts. Le focus reste `CONTROL-ACCOUNT`.

## Suite à exécuter dans les sprints horaires

1. Conserver la méthode développement → autocritique → seconde correction → retest, les contraintes 0 € et la limite d'un objectif principal.
2. Compléter le contrat d'identité et de synchronisation (sans déployer une base sans accord), puis obtenir des comptes A/B de recette **autorisés** dans une base CONTROL isolée.
3. Valider les parcours sur un Android physique et sur iOS, puis les intégrations externes avec consentement explicite et preuve de résultat.
4. Maintenir les tests réels du site public dans le contrôle GitHub Actions ; ne jamais assimiler `109/109 Node` à l'acceptation des 36 critères fonctionnels.

**Aucune modification d'horaire ou de statut de l'automatisation n'a été faite durant cette recette.**
