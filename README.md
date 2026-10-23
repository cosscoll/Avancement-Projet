# CONTROL — Centre de pilotage des projets

## Accueil simplifié et recherche directe (22 octobre 2026)

La PWA personnelle propose dès l'accueil un champ **« Rechercher une fonction ou un projet »** : saisir « budget », « créer un site » ou le nom d'un projet ouvre le moteur local avec les résultats correspondants, sans créer d'action. Les demandes **« créer un nouveau projet »** et **« créer une tâche »** mènent maintenant directement à leurs formulaires, avec le curseur prêt à saisir ; **« mes projets »** et **« mes tâches »** affichent au contraire les listes correspondantes. Le moteur propose également des raccourcis vers les dernières fonctions utilisées pendant la session. Aucun compte Cloud n'est ouvert et aucune automatisation réelle n'est activée.

La version de cache **V64** est déclarée dans le service worker ; une régression Node dédiée détecte maintenant les assertions de tests encore figées sur d'anciens caches. Les contrôles isolés du code sont distincts de la **validation CI complète et du parcours Chromium public, non encore confirmés pour le dernier SHA**. [Parcours UX et limites de recette](docs/CONTROL_UX_V3_PARCOURS.md).


## CONTROL IA locale — vrai modèle génératif dans le navigateur (17 octobre 2026)

Une première IA **générative réelle** est intégrée au CONTROL personnel, dans **Outils → CONTROL IA locale**, accessible aussi depuis chaque projet et directement à `#/control/localai`. Elle exécute **SmolLM2-135M-Instruct-ONNX-MHA** via **Transformers.js / WebAssembly** dans un Web Worker ; elle ne renvoie pas des réponses FAQ pré-écrites. **Le modèle n'est téléchargé qu'après un clic** (environ 180 Mo de poids plus bibliothèque). Discussions mémorisées localement, séparées par projet, avec contexte du projet uniquement sur autorisation explicite, et possibilité d'arrêter/effacer. Aucune clé API, aucun achat, aucun serveur d'inférence ajouté. **Limites :** petit modèle expérimental, moins bon que les modèles commerciaux, performances Android non vérifiées, aucun accès GitHub ou action autonome. Les tests JavaScript avec worker simulé passent dans GitHub Actions, mais **un vrai chargement/génération sur navigateur Android reste à valider**. [Architecture, confidentialité et recette Android](docs/IA_LOCALE_GENERATIVE.md).

## Qualité et stabilisation après audit (17 octobre 2026)

**Les tests Node sont désormais réellement exécutés dans GitHub Actions** à chaque changement de code sur `main` : syntaxe JavaScript, parcours de missions Claude/Gemini et rendez-vous, intégrité des ressources PWA, restrictions de sécurité Cloud. Le déploiement GitHub Pages reste indépendant du workflow de tests et nécessite une recette navigateur/Android. Une incohérence du compteur d'échéances CONTROL IA a été corrigée. Les scripts SQL CONTROL refusent désormais de s'exécuter sans confirmation explicite de la nouvelle base isolée ; la base IAgile Academy reste inchangée. [Feuille de route priorisée et critères de validation](docs/PLAN_STABILISATION_POST_AUDIT.md) · [Tests GitHub](https://github.com/cosscoll/Avancement-Projet/actions/workflows/quality.yml).

## Visios et rendez-vous — Équipe, clients et prospects (17 octobre 2026)

CONTROL dispose d'un espace **Visios et rendez-vous** (`#/control/meetings`) : choix du projet, date/durée, liens Google Meet, Zoom et Microsoft Teams, invitations à partager manuellement, Google Agenda prérempli ou export .ics, notes post-réunion, suivi des rendez-vous dans le calendrier et mode **Jitsi intégré à l'écran pour des tests internes uniquement**. L'API Jitsi publique ne convient pas à une offre commerciale en production. Aucune réunion n'est créée automatiquement chez les fournisseurs, aucune invitation envoyée sans action de l'utilisateur, aucun appel n'est enregistré dans CONTROL. Le mode Cloud est préparé avec RLS mais reste désactivé. [Détails et limites](docs/VISIOS_RENDEZ_VOUS.md).

## Commander Claude et Gemini depuis CONTROL (17 octobre 2026)

Nouveau **poste de commande multi-IA** sous `#/control/command`, dans Tous les outils et dans chaque projet : création de missions Claude et Gemini à partir d'un objectif unique, instructions dédiées, liens vers les services officiels, suivi par fournisseur, résultat et URL de preuve, dates et provenance des informations. Ces fonctions sont réellement enregistrées dans CONTROL personnel, sans dépense. L'envoi direct via les API Claude/Gemini est **préparé mais NON actif** : la nouvelle Edge Function sécurisée est uniquement versionnée, sans déploiement ni clé API. Il faudra créer et auditer la base CONTROL Cloud indépendante, autoriser explicitement les appels et les coûts, puis activer séparément les fournisseurs. Les historiques privés des applications Claude/Gemini ne sont pas accessibles automatiquement. [Architecture et procédure d'activation](docs/COMMANDER_CLAUDE_GEMINI.md).

## UX/UI — Une interface plus claire, sans supprimer les fonctionnalités (17 octobre 2026)

Refonte des parcours de CONTROL personnel et de la future interface Cloud : **quatre destinations mobiles**, **six projets maximum affichés par défaut**, trois actions rapides, regroupement des options avancées dans **Plus**, bibliothèques/outils organisés par finalité, hiérarchie visuelle et tons sobres sur mobile. Les missions, automatisations, formations, bibliothèques IA et tutoriels de publication restent disponibles ; ils ne monopolisent simplement plus l'écran d'accueil. La version multi-utilisateurs reste désactivée en attente de son infrastructure séparée. [Décisions et protocole UX](docs/UX_CLARTE_CONTROL.md).

## Laboratoire IA — Outils intégrés de qualité (17 octobre 2026)

Nouvelle page `#/control/lab`, accessible depuis l'en-tête, les projets et Tous les outils : **7 outils internes réellement utilisables** (générateur de briefs contextualisés, comparaison textuelle de deux IA, audit HTML indicatif, validation/formatage JSON, différences entre versions, checklist de recette et masquage de secrets). Les briefs peuvent être copiés pour ChatGPT/Claude/Codex/Gemini ou enregistrés comme missions dans CONTROL. Tout fonctionne côté navigateur sans clé API ni dépense supplémentaire ; **aucun modèle IA externe n'est exécuté, et les analyses textuelles ne certifient ni véracité ni qualité sémantique**. L'espace CONTROL Cloud intègre le même module, sans activer les comptes. [Guide du Laboratoire IA](docs/LABORATOIRE_IA.md).

## Chatbot d'assistance intégré à CONTROL (17 octobre 2026)

Nouvelle bulle **« Assistance »** dans CONTROL personnel et dans la version Cloud en préparation : réponses contextuelles sur les projets, automatisations, IA et bibliothèques, 32 rubriques d'aide, 10 guides de mise en ligne, 87 fiches d'outils IA, recommandations pratiques et boutons ouvrant les bonnes rubriques. L'historique du chat reste **uniquement dans la mémoire de l'onglet**, sans API ni dépense. L'outil est **un chatbot documentaire fonctionnel et non un modèle IA génératif relié à des comptes privés** : pour une question inconnue, il indique la limite plutôt que d'inventer. Les projets privés Cloud restent protégés et les inscriptions restent désactivées. [Documentation et recette](docs/ASSISTANT_CONTROL.md).

## Mise en ligne — GitHub, IONOS, Vercel et autres hébergeurs (17 octobre 2026)

**10 tutoriels pas à pas**, avec prérequis, publication, diagnostic, contrôles HTTPS/DNS, bonnes pratiques de sécurité, accès aux consoles officielles et **prompt IA de préparation de déploiement**. Disponible sous `#/control/deploy`, depuis l'onglet **Mise en ligne** de chaque projet et depuis la bibliothèque IAgile. Pour les dépôts GitHub publics, un bouton renvoie à l'activité réelle des workflows ; aucun déploiement n'est lancé automatiquement. Les liens vers IONOS, Vercel, Netlify, Cloudflare, Render, Railway et Firebase **ne valent pas autorisation API**. Aucun achat ou abonnement engagé. [Guide de fonctionnement et limitations](docs/TUTORIELS_MISE_EN_LIGNE.md).

## Bibliothèques d'outils IA — Complément IAgile (17 octobre 2026)

**87 outils et ressources officielles** répartis en **9 catégories** et **4 parcours** (sites web 3D, agents personnalisés, automatisation, IA/productivité), avec **12 kits pratiques et prompts de départ**. Rechercher par outil/cas d'usage, filtrer par parcours et niveau, conserver des favoris et **ajouter une ressource à un projet CONTROL**. Accès direct à `#/control/catalog` depuis CONTROL et à « Outils IA » depuis un projet. La future interface multi-utilisateurs propose le même catalogue et un enregistrement de ressources dans les projets privés **seulement après activation sécurisée de Cloud**. Les conditions d'accès/prix/licences sont à vérifier chez chaque éditeur ; aucune intégration externe automatique. [Documentation](docs/BIBLIOTHEQUES_OUTILS_IA.md).

## CONTROL Cloud — préparation du SaaS multi-utilisateurs (17 octobre 2026)

Nouvelle entrée **[app.html](app.html)** préparée pour une future plateforme publique : inscription par lien e-mail, bouton de connexion Google (à configurer), données de projets stockées sur un backend privé Supabase avec isolation RLS par utilisateur, missions, liens IA, automatisations, ressources, décisions, budgets et sauvegardes. **Actuellement les inscriptions sont volontairement désactivées** dans [config/cloud.json](config/cloud.json), car aucune base CONTROL indépendante n'a encore été créée, migrée et testée. L'application personnelle existante reste accessible sur `index.html` et n'est pas coupée.

Le schéma SQL de 6 tables / 22 politiques RLS et la fonction de suppression de compte (non déployée) sont préparés. Les API ChatGPT/Claude/Gemini et OAuth Drive/Gmail ne sont PAS connectés à cette nouvelle application ; les boutons sont des redirections. [Plan de mise en service et protocole de sécurité](docs/CONTROL_CLOUD_SAAS.md).

## CONTROL — Centre de commande multi-IA (17 octobre 2026)

CONTROL est désormais organisé autour des **projets** et du menu **À traiter · Missions · Automatisations · CONTROL IA**, avec une page « Tous les outils » accessible depuis l'en-tête. Les modules couvrent le chef de projet central (synthèse locale et contextes), la boîte de réception des actions, les missions multi-IA et leur transfert manuel, l'activité GitHub publique à la demande, les échéances et les automatisations datées, la bibliothèque, la mémoire des décisions, le suivi des budgets et les sauvegardes locales éventuellement chiffrées.

**Limitations explicites :** ni accès direct aux conversations privées des différentes IA, ni contrôle automatique de leurs tâches, ni synchronisation entre appareils, ni accès aux mails ou fichiers Google privés depuis le site GitHub Pages. Le centre conserve ses données dans le navigateur, et les liens de fournisseur restent des redirections. Il n'effectue aucune dépense. [Architecture, guide et recette](docs/CENTRE_COMMANDE_CONTROL.md).

## Automatisations multi-IA — 17 octobre 2026

Nouvelle page `#/automations` dans la navigation mobile : index des IA, fiches des quatre tâches ChatGPT actives au relevé daté, détails objectif/règles/contraintes/fréquence/modèle et quotas lorsque connus, saisie manuelle des autres IA, brouillons de modification locaux et liens vers la gestion native du fournisseur. **Pas de contrôle réel ni synchronisation de tâches privées depuis le site public.** [Guide](docs/AUTOMATISATIONS_MULTI_IA.md).

## CONTROL — Nouvelle navigation par projets (17 octobre 2026)

La page d'accueil place les projets en premier. Chaque espace donne accès aux véritables projets de ChatGPT, Claude, Gemini Notebooks et Codex **après association locale d'une URL propre à l'utilisateur** ; ajout possible d'autres IA. L'onglet Gestion permet de consolider les comptes rendus IA fournis volontairement dans l'interface, avec dates et absence explicite de lecture directe des chats privés. [Guide et limitations](docs/ESPACES_MULTI_IA.md).


## Codex — commandes et résultats depuis le téléphone

Un nouvel onglet **Codex** (`#/codex`) est disponible sur le site et dans la barre mobile. Il offre un **pilotage assisté, sans exécution directe** :
- choix d'un projet associé à un dépôt GitHub ;
- formulaire de mission, prompt structuré et bouton de copie ;
- ouverture de ChatGPT pour soumettre manuellement la mission dans un environnement Codex Cloud publié ;
- consultation des pull requests publiques du dépôt, quel que soit leur auteur ;
- enregistrement local du lien d'une tâche Codex pour la retrouver.

**Important :** CONTROL ne lance pas encore les tâches Codex, ne lit pas les tâches non publiées et ne consomme pas de crédits. Le site ne stocke aucun secret. Les PR ne sont pas assimilées à tort à des sorties Codex. Les tâches et leurs journaux privés se consultent directement dans Codex. Aucune automatisation existante n'est modifiée.

Documentation détaillée : [docs/CODEX_MOBILE.md](docs/CODEX_MOBILE.md).


Tableau de bord du pilotage ChatGPT, avec suivi de cinq automatisations et catalogue des autres projets : Pack Procédures Pro, Banque Outils IA, UCP, IAgile et TCG Thomas Deseur.


## Extension : tableau de bord de l'espace ChatGPT

Depuis le 16 octobre 2026, CONTROL n'est plus réservé aux cinq projets automatisés.

- **Page Automatisations, en première position** : cinq tâches, horaires, statut **au dernier relevé**, nombre et date des comptes rendus effectivement enregistrés dans `data/sprints/*.json`. Aucune lecture du statut ChatGPT en direct depuis le navigateur, et aucun contrôle d'activation/désactivation sur ce site.
- **Vue générale** : automatisations au premier plan, puis objectifs et alertes des cinq projets pilotés.
- **Centre Consignes & décisions** : création d'issues GitHub publiques par projet, avec confirmation manuelle sur GitHub. Les cinq tâches programmées sont configurées pour consulter les issues du propriétaire `cosscoll` avant le travail. Une issue ne déclenche pas une conversation ou un sprint hors programmation.
- **Autres projets** : `data/catalog.json` référence les autres dépôts GitHub accessibles (Portfolio 3D, Chess Openings, PokerStats, MyBeer, Eurorare, IFSI) et quelques projets ChatGPT sans dépôt identifié. Les commits publics GitHub sont consultables depuis leur fiche.
- **Interactions sur les autres projets** : notes locales, copie d'une consigne pour la conversation ChatGPT, enregistrement local d'un lien ChatGPT, option de créer une issue GitHub publique. Un projet sans automatisation n'est **pas** lu automatiquement.
- **Ajout manuel d'autres projets** : local au navigateur. Il n'existe pas de synchronisation automatique de la liste des Projets ChatGPT ni d'accès à leurs conversations privées depuis GitHub Pages.

Les sources d'interface supplémentaires sont `data/catalog.json`, `data/automations.json` et `assets/app.js`. Les informations d'automatisation dans `data/automations.json` sont des **instantanés**, jamais une preuve de statut live.

### Confidentialité et intégration future

Ce site reste **public** sur GitHub Pages. Ne saisir aucun secret, adresse client, dossier confidentiel, renseignement personnel, devis ou autorisation sensible dans les GitHub Issues. Le portail `prive.html` est **désactivé**, et le rattachement à une nouvelle base privée dédiée reste à financer/valider et tester uniquement après acceptation du propriétaire et vérification du coût. Ne pas utiliser automatiquement la base Supabase d'IAgile.

Une autorisation d'usage Work, Codex, de dépense ou de changement de tâche ne peut pas être donnée depuis CONTROL : elle nécessite une demande directe à ChatGPT. Les brouillons enregistrés en localStorage ne sont **jamais lus** par les automatisations.

## Améliorations du tableau de bord — version du 16 octobre 2026

- **Automatisations mises en avant** : cartes de suivi et lien vers les rapports de chaque projet.
- **Journal global des sprints** (`#/activity`) : tri chronologique de tous les comptes rendus réellement présents dans les cinq fichiers `data/sprints/*.json` ; filtrage par projet, présence d'un blocage et recherche dans les résultats/étapes.
- **Blocages du dernier sprint** : affichage prioritaire avec lien direct vers le projet concerné. Les alertes statiques restent séparées des obstacles effectivement remontés dans les derniers rapports.
- **Recherche rapide** : bouton en haut du site ou raccourci **Ctrl+K** / **⌘K**. La recherche porte sur les projets, automatisations et destinations internes du site. Elle ne recherche PAS le contenu privé ChatGPT.
- **Export JSON** : sur le journal, export local des rapports publics actuellement filtrés. Aucune connexion supplémentaire ni transfert à un serveur tiers.
- **Rafraîchissement manuel** : bouton ↻ du header pour recharger les fichiers GitHub Pages. La fréquence des automatisations n'est jamais modifiée par ce bouton.
- **Mobile** : affichage adaptatif des filtres, alertes et résultats de sprints ; prise en charge de `prefers-reduced-motion`.
- **Honnêteté des données** : les progrès ne sont pas inventés, les trois premiers comptes rendus réellement enregistrés sont affichés lorsqu'ils sont présents, et les projets sans rapport conservent un état « en attente ». Les heures/statuts des automatisations restent des instantanés jusqu'à une vraie intégration dédiée.

**Limites actuelles :** hébergement public GitHub Pages non vérifiable depuis les outils de développement actuels ; pas de synchronisation native des projets ChatGPT ; instructions privées désactivées tant que la nouvelle organisation Supabase Free n'existe pas et que les droits ne sont pas testés. Aucun paiement ni changement à IAgile Academy.

## Application mobile (PWA) — iPhone et Android

Le tableau de bord est désormais préparé comme **application web installable**. Aucun store, compte développeur ni coût supplémentaire.

- Manifeste : `manifest.webmanifest` ; scope et URL de départ relatifs au dépôt GitHub Pages.
- Icônes : `assets/icon.svg`, `assets/icon-192.png`, `assets/icon-512.png` (fichiers confirmés dans la branche main).
- Service worker `service-worker.js` : navigation et actifs publics en cache ; données publiques en stratégie réseau d'abord ; pas de cache des API GitHub, de `prive.html` ni de secrets.
- Assistant d'installation : `assets/pwa.js` ; affichage adapté à Safari iOS et Chrome Android.
- Modifications HTML / CSS : manifeste, icônes Apple, écran d'accueil, safe areas, bandeau hors connexion et aide d'installation.
- **Guide d'installation : [INSTALLER_SUR_TELEPHONE.md](docs/INSTALLER_SUR_TELEPHONE.md)**.
- Limite : installation mobile et notifications sont deux systèmes séparés. Aucune notification push native CONTROL, et le serveur Supabase privé reste à créer avec une organisation distincte de celle d'IAgile.
- La validation sur appareils et la disponibilité HTTPS en direct nécessitent un essai réel (aucun test physique ni publication Play Store/App Store déclaré).

## Statut de la synchronisation des consignes — 16 octobre 2026

Les **cinq tâches actives** ont chacune une instruction explicite de lecture, **en début de sprint**, des tickets `[CONSIGNE][<id>]` et `[DECISION][<id>]` créés par le compte GitHub `cosscoll` dans le dépôt central. Ce protocole existe sans Supabase, à coût supplémentaire nul. Le site affiche maintenant **trois étapes** : rédaction de la consigne → confirmation de sa publication GitHub → vérification de la prise en compte dans le compte rendu de sprint.

- **Effectivement partagé :** une GitHub Issue créée et soumise sur GitHub dans le dépôt central est visible publiquement, et consultable par le connecteur GitHub. Les comptes rendus réels sont écrits dans `data/sprints/<id>.json` par les automatisations lorsque le connecteur l'autorise.
- **Non partagé :** un brouillon uniquement enregistré dans le navigateur. Le bouton « Publier via GitHub » ouvre un formulaire GitHub prérempli, **mais la création doit être confirmée sur GitHub**, sous le compte du propriétaire.
- **Non encore testé en bout de chaîne :** aucune GitHub Issue réelle de consigne utilisateur n'est actuellement publiée dans le dépôt central ; la lecture d'une nouvelle consigne par un sprint réel et l'accusé de réception restent donc à vérifier. Les tests simulés de navigation, filtrage auteur `cosscoll`, affichage et URL préremplie ont réussi (10/10).
- **Non disponible :** synchronisation privée directe depuis le site. L'organisation Supabase dédiée n'existe pas encore, et il n'est pas permis de toucher à la base IAgile Academy. L'écran `prive.html` reste désactivé.
- **Sécurité :** ne publier sur GitHub aucune donnée sensible, clé, secret, autorisation de dépense, accès Work/Codex ou changement d'automatisation. Le site et les issues ne peuvent pas autoriser ces opérations.

Le texte antérieur « les consignes ne sont pas encore synchronisées » a été remplacé par une description exacte des possibilités du canal GitHub et des limites de la connexion privée.

## État de développement

- **Interface créée** : navigation entre cinq projets, vue globale, objectifs et pourcentages calculés à partir de critères de recette, sprints, activité GitHub, alertes, décisions et brouillons de consignes.
- **Source publique initiale** : `data/projects.json`, états de référence datés du 16 octobre 2026. Les taux ne sont **pas** des taux de réussite commerciale ; ils mesurent le nombre de critères vrais dans la grille décrite.
- **Historique des sprints** : fichiers `data/sprints/{id}.json` initialisés vides ; ne pas inventer de comptes rendus historiques. L'interface peut lire les vrais sprints quand ils sont ajoutés par les automatisations.
- **Statut plus récent facultatif** : si présent, `data/status/{id}.json` (format de la fiche projet correspondante dans `data/projects.json`) remplace ses objectifs/alertes/décisions pour le calcul et l'affichage.
- **Activité GitHub** : récupérée depuis l'API GitHub publique lors de la consultation de la section Sprints. Un commit n'est pas automatiquement un sprint.
- **Instructions publiques non confidentielles** : le formulaire « Mes instructions » permet de préparer une consigne et ouvre GitHub Issues prérempli. **L'utilisateur doit confirmer la publication dans GitHub.** Les automatisations sont désormais configurées pour rechercher les issues `[CONSIGNE][projet]` écrites par `cosscoll` au début du sprint. Les brouillons restent locaux et NE sont PAS lus. Les décisions sensibles ne passent pas par GitHub Issues.
- **Instructions et décisions privées** : portail `prive.html` créé, mais désactivé par `config/private.json` (`enabled: false`) jusqu'à création d'un projet Supabase dédié, migration/RLS et validation du propriétaire. Aucun secret publié.
- **Hébergement public** : fichiers prêts pour GitHub Pages ; activation de Pages et réponse HTTPS réelle à vérifier. Le dépôt public ne doit contenir aucune information confidentielle.

## Ouvrir le site via GitHub Pages

1. Aller à [Settings → Pages](https://github.com/cosscoll/Avancement-Projet/settings/pages).
2. Dans *Build and deployment*, choisir **Deploy from a branch**, la branche **main**, le répertoire **/(root)** puis **Save**.
3. Vérifier le résultat réel sur `https://cosscoll.github.io/Avancement-Projet/` seulement **après** activation et déploiement. Tant que ce n'est pas vérifié, ne pas déclarer le site en ligne.

L'hébergement et le code sont statiques sans dépendance NPM, build serveur, API payante ou secret. Les appels à GitHub API sont publics et peuvent être limités en volume.

## Structure

```text
index.html                Interface principale
prive.html                Portail privé prêt mais désactivé
assets/style.css          Mise en forme responsive et accessible
assets/app.js             Navigation, métriques, historique et formulaires GitHub
assets/private.js         Auth et commandes privées (uniquement après configuration)
config/private.json      Configuration publique sans secret (désactivée)
data/projects.json        Métadonnées et état de référence public
data/sprints/*.json       Comptes rendus vérifiés publics par projet
data/status/*.json        État public actualisé, un fichier par projet
database/*.sql            Schéma SQL sécurisé préparé, non appliqué
docs/schema.md            Format de synchronisation
```

## Format des sprints

Chaque automatisation doit gérer **uniquement** le fichier `data/sprints/<id>.json` de son propre projet ; lire le blob et son SHA avant modification, préserver les autres entrées, ajouter un compte rendu seulement après exécution réelle et éviter les doublons d'identifiant.

Exemple **illustratif de structure, pas un sprint réel** :

```json
[
  {
    "id": "id-unique-du-sprint",
    "started_at": "2026-10-16T08:10:00+02:00",
    "ended_at": "2026-10-16T08:21:00+02:00",
    "summary": "Résumé exact du sprint",
    "done": ["Action vérifiée et preuve conservée"],
    "blockers": ["Aucun ou blocage réel"],
    "next": "Prochaine action précise",
    "links": [
      { "label": "Commit GitHub", "url": "https://github.com/cosscoll/..." }
    ]
  }
]
```

Le fichier public ne doit jamais révéler des noms ou emails de prospects, secrets, données clients, tokens, contenus payants, codes cadeaux ou autres informations privées.

## Canal public de consignes — utilisable sans serveur privé

Dans l’espace d’un projet, ouvrir **Mes instructions**, rédiger une consigne NON CONFIDENTIELLE, cliquer **Transmettre sur GitHub**, puis terminer en cliquant **Submit new issue** sur GitHub. Seuls les tickets publiés dans https://github.com/cosscoll/Avancement-Projet/issues avec titre préfixé `[CONSIGNE][id]` et auteur `cosscoll` sont à consulter avant le sprint ; les questions `[DECISION][id]` ne valent jamais approbation d’une opération sensible.

Ce canal **n'est pas privé** : les autres internautes peuvent lire les issues. Pour toute instruction contenant des secrets, des données de clients ou une décision sensible, continuer à passer par une conversation ChatGPT jusqu’à la mise en service du backend privé.

## À faire : transmission sécurisée des instructions

Le besoin cible est : propriétaire authentifié → rédaction de consignes privées et décisions → stockage durable protégé par RLS → lecture autorisée par chaque automatisation au **début** de son sprint → accusé de lecture → exécution dans les limites permises → compte rendu final synchronisé.

Le seul projet Supabase actuellement connecté est dédié à IAgile. **Ne pas réutiliser sa base pour centraliser des données des quatre autres projets** et ne pas créer automatiquement un nouveau projet avec des coûts éventuels. Une base dédiée, un backend authentifié ou un mécanisme GitHub privé seront à valider et à tester avant activation.

Une instruction depuis ce site **ne permet jamais** d'autoriser Work, Codex, les agents partageant leur quota, une dépense ou l'activation/la désactivation d'une automatisation. Ces actions restent soumises à une demande directe du propriétaire dans ChatGPT.

## Vérifications

- Contrôler que `data/projects.json` et les cinq fichiers `data/sprints/*.json` sont en JSON valide.
- Contrôler la syntaxe JS, la navigation au clavier, l'affichage 320px/mobile, les états vides et `prefers-reduced-motion`.
- Vérifier GitHub Pages en HTTPS avant de remplacer les anciens liens d'avancement des projets.
- Tester de bout en bout les lectures/écritures des automatisations et l'authentification privée avant d'annoncer la synchronisation bidirectionnelle.

**Règle de sécurité** : cette application publique ne doit jamais embarquer de clé API privilégiée (Supabase service_role, GitHub PAT, clé Codex, etc.).
