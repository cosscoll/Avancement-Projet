# CONTROL — Cahier des charges TPE : priorités entrepreneur
_Mise à jour : 5 novembre 2026 · version de travail 1.2 · ciblage indépendants et équipes de 2 à 10 personnes_


## Sprint suivant — relation Clients ↔ Tâches réelle (5 novembre 2026)

**Constat avant correction :** la fiche Client ouvrait le formulaire d'une tâche avec le projet présélectionné, mais l'enregistrement ne conservait **aucun identifiant client**. Ce lien seulement visuel ne permettait ni recherche fiable ni suivi des tâches client.

**Développé sur \`main\` (MVP local, pas Cloud) :**
- Une tâche peut porter \`clientId\` et référence **une fiche client existante** dans le même magasin local \`control-command-v1\`. Le projet rattaché doit correspondre à celui de la fiche ; une fiche « Sans projet » est autorisée sur tous les projets. Projet inconnu, identifiant client absent ou association incohérente : enregistrement refusé.
- Depuis la fiche Client, « Créer une tâche » préremplit **le projet, le client et la prochaine étape** (si renseignée) ; rien n'est automatiquement créé tant que l'utilisateur ne valide pas le formulaire.
- Le formulaire de création et celui de modification des tâches proposent un sélecteur Client. Changer le projet limite la liste aux fiches autorisées, et refuse un lien incohérent. Les tâches existantes **sans \`clientId\`** continuent de fonctionner.
- La liste des tâches indique le client lié et inclut son nom dans la recherche locale. La recherche universelle retrouve également les tâches par nom de client, avec accès à la tâche précise.
- La fiche Client expose les tâches effectivement liées, leur état et l'accès direct à chacune. « Voir toutes les tâches liées » ouvre la boîte de réception filtrée sur l'identifiant, **avec tâches en cours et terminées**.
- Supprimer une fiche demande confirmation ; les tâches et projets sont conservés et seul le \`clientId\` correspondant est détaché. Déplacer une fiche entre projets demande confirmation avant de détacher les tâches devenues incompatibles.
- Les créations, modifications et détachements passent tous par **\`commitLocal\`** : écriture transactionnelle, annulation en mémoire en cas de refus et détection de modification inter-onglets. Les sauvegardes existantes incluent le \`clientId\` sans nouvelle clé de stockage.
- Les noms et intitulés sont affichés échappés. Les liens internes utilisent des ID encodés. Les données restent **uniquement sur cet appareil** et n'ont pas de synchronisation multi-utilisateurs.
- Les styles suivent la charte « Simple & Humain » sur ordinateur et mobile, sans ajout au nombre de destinations principales. PWA **v82**.

**Critères d'acceptation à vérifier dans le vrai navigateur :**
1. Créer une fiche Client et une tâche à partir de sa prochaine étape ; vérifier l'identifiant client dans la tâche, sa présence sur la fiche, et l'absence de création automatique.
2. Créer une autre fiche sur un autre projet ; vérifier l'impossibilité de rattacher la tâche à cette fiche, y compris après changement de projet.
3. Terminer une tâche, puis « Voir toutes les tâches liées » : vérifier que les tâches terminées restent visibles.
4. Modifier l'organisation cliente pour la déplacer vers un autre projet ; vérifier que les tâches détachées sont conservées sans client, uniquement après confirmation.
5. Supprimer une fiche ; vérifier que ses tâches restent, sont dissociées et que les tâches des autres clients ne changent pas.
6. Recharger, ouvrir deux onglets, exporter et restaurer une sauvegarde : vérifier la conservation de \`clientId\` et le refus d'écrasement concurrent.
7. Tester à 320/390/1440 px, au clavier, hors ligne, avec données malformées, et vérifier les noms contenant des caractères HTML.
8. Vérifier que **ni l'équipe, ni Gmail, ni Claude/ChatGPT/Gemini ne sont présentés comme synchronisés**.

**Tests ajoutés :** \`tests/control-clients.test.mjs\` — validation des associations et filtres, préremplissage, recherche, maintien des tâches après suppression/déplacement, absence de connexion réseau, cache. Vérifications JS ciblées exécutées ; recette Playwright/Chromium en conditions réelles et diffusion GitHub Pages encore à confirmer. Aucun quota limité, service externe, automatisation ni Cloud activé.

### Décisions de conception à conserver
- La référence canonique dans la tâche est \`clientId\`, pas une copie du nom du client ; renommer le client ne doit pas casser les liens.
- Un client peut suivre plusieurs projets à terme, mais la version locale n'autorise actuellement **qu'un seul projet** (ou aucune association). Le modèle multi-projets sera conçu en phase Cloud après les rôles et permissions.
- Les « prochaines étapes » sont des intentions ; seules les tâches explicitement enregistrées sont comptées comme actions. Ne pas annoncer de relance envoyée ou de mission IA réalisée à partir d'un simple lien.
- Priorité P0 toujours bloquante pour le SaaS multi-utilisateurs : authentification, RLS et révocation vérifiées avec deux vrais comptes sur un projet Cloud indépendant, avant toute activation publique.

## Avancement du cahier des charges — 5 novembre 2026

**Sprint livré : première version de « Clients » (P1), sans Cloud.**

**Problème résolu :** un indépendant doit pouvoir retrouver ses organisations clientes, identifier leur projet associé et la prochaine démarche, sans passer par plusieurs logiciels.

**Disponible sur `main` :**
- `#/control/clients` — créer une fiche d'organisation ou de client non confidentielle, lui attribuer un statut **Prospect / En cours / Terminé**, associer un projet et déclarer une prochaine étape avec échéance.
- Rechercher et filtrer les fiches par texte, statut et projet, y compris les accents ; modifier et supprimer une fiche après confirmation.
- Depuis la fiche, ouvrir le projet et **préparer une nouvelle tâche** avec le projet présélectionné. La création de tâche est manuelle et conserve les règles existantes.
- Depuis un projet, accéder directement à ses clients associés ; depuis les outils supplémentaires et le centre de pilotage, ouvrir toutes les fiches.
- Recherche globale : les fiches associées à un projet connu sont indexées localement avec la prochaine étape et un lien vers Clients.
- Sauvegarde : le contenu `clients` est inclus dans l'état local `control-command-v1` et apparaît explicitement dans la comparaison avant restauration.
- Les dates impossibles, noms ou statuts invalides, projets inconnus, liens non HTTPS, identifiants dans les URL et paramètres secrets sont refusés.
- Les modifications utilisent `commitLocal` : refus si le stockage est illisible, a changé dans un autre onglet ou n'accepte pas l'écriture. Le contenu HTML saisi est échappé à l'affichage.
- Charte « Simple & Humain » conservée ; formulaire de création repliable si des fiches existent, responsive mobile. **Aucune activation Cloud, synchronisation ni notification.**

**Limites assumées :** il ne s'agit **pas** encore d'un CRM partagé. Les informations restent en local sur l'appareil. Ne pas y inscrire de coordonnées personnelles, pièces commerciales privées ou secrets. Une prochaine étape déclarée ne crée aucune tâche ni rappel tant que l'utilisateur ne clique pas pour en créer une. Une fiche sans projet reste consultable dans Clients, mais n'entre pas dans la recherche globale filtrée par projet. Les champs de coordonnées nécessiteront l'authentification, les permissions par organisation et un stockage serveur sécurisé.

**Vérifications :** `tests/control-clients.test.mjs` (données et dates, recherche, statuts, intégrations, sécurité et cache), `assets/control-clients.js` (règles pures) ; `tests/control-backup-review.test.mjs` vérifie la visibilité des fiches dans un aperçu de restauration. Cache PWA v81. Les tests exécutés hors navigateur doivent être distingués des tests utilisateur et de la publication réelle.

### Périmètre prioritaire après ce sprint

| Priorité | Capacité | Situation vérifiée dans le dépôt | Prochaine condition réelle |
| --- | --- | --- | --- |
| P0 | Tâches et suivi local | Fonctionnel en version personnelle ; tests ciblés présents | Recette navigateur, sauvegarde et restauration réelles sur mobile |
| P0 | Accès Cloud et séparation des comptes | **Bloqué/désactivé** ; 8 critères de lancement non validés | Projet CONTROL actif, deux comptes Auth A/B, preuve RLS/JWT et révocation de session, validation expresse |
| P1 | Clients légers | **MVP local livré**, sans coordonnées privées | Tests d'usage ; modèle serveur, droits et liens avec tâches multi-utilisateurs |
| P1 | Agents et mémoires | Studio d'import manuel et assistants locaux expérimentaux | Permissions par projet, sources révisables, exécution réelle seulement après autorisations officielles |
| P1 | Connecteurs Gmail/Agenda/Drive | Aucun fournisseur privé autorisé dans l'application personnelle | Choisir un premier flux officiel, OAuth scopes minimaux, déconnexion et audit |
| P1 | Collaborateurs et validation | Pages préparatoires, aucun partage opérationnel | Cloud testé puis invitations, rôles, commentaires et audit |
| P2 | Automatisations | **Non activées** conformément à l'interdiction actuelle | Accord explicite ultérieur, simulation, plafonds, audit et arrêt |

**Règle de livraison :** ne pas annoncer « terminé » ou « synchronisé » si seule une page ou une simulation existe. Les liens vers les services tiers ne suffisent pas à établir une connexion, et l'affichage de données locales ne prouve pas la collaboration inter-comptes.

## Sprint suivant — parcours de tâches opérationnel (3 novembre 2026)

**Livré sur \`main\` dans l'application personnelle :**
- Rechercher des tâches par intitulé et projet, sans autre outil ni connexion.
- Filtrer En attente / En retard / Aujourd'hui / À vérifier / Terminées.
- Modifier directement l'intitulé, le projet, la priorité, l'échéance, le statut et le lien de référence.
- Marquer terminé et rouvrir ; les champs historiques et autres enregistrements sont conservés.
- Accéder à une tâche précise depuis les trois priorités de l'accueil via un lien local, qui ouvre le formulaire correspondant.
- Réduire la densité de l'écran par des formulaires repliables et un volet « Sources externes » secondaire.
- Refuser les dates impossibles, les liens non HTTPS ou sensibles, les priorités et statuts inconnus, et les projets non reconnus sans effacer les anciennes références.
- Utiliser l'enregistrement local transactionnel existant, y compris l'annulation en mémoire si la persistance échoue et la détection de modification inter-onglets.

**Non livré :** assignation à un salarié, gestion de clients, rappels multi-appareils, synchronisation Cloud, accès aux emails privés, contrôle automatique des IA, traitement hors navigateur. Ces fonctions exigent les étapes de sécurité P0.

**Tests prévus dans le dépôt :** \`tests/control-task-workflow.test.mjs\` couvre règles de dates, priorisation, modifications et restrictions de liens. \`tests/control-day-brief.test.mjs\` inclut la liaison directe accueil → tâche. **La vérification du parcours public et les tests physiques ne peuvent pas être déduits de la seule présence du code.**


## Correction de la maquette d'accueil — CONTROL 06 (3 novembre 2026)

**Décision :** la précédente page CONTROL 04/05 était fonctionnellement enrichie mais visuellement non conforme à la maquette validée. CONTROL 06 remplace sa composition, au lieu d'ajouter une nouvelle couche de fonctionnalités.

**Écran cible effectivement codé sur `main` :** interface blanche et épurée centrée, en-tête CONTROL / Mon entreprise, Bonjour, trois compteurs d'activité locale, bloc Demander à CONTROL, trois tâches prioritaires et quatre destinations principales Accueil / Projets / Équipe / Assistants. Les projets sont accessibles via un panneau replié et le bouton Projets. Les outils techniques restent dans les rubriques secondaires. Le rail sombre et le grand héros bleu ne doivent plus apparaître **sur l'accueil**.

**Contraintes de vérité :** aucun chiffre fictif, aucun assistant connecté annoncé à tort, aucune équipe fictive. « Demander à CONTROL » continue d'utiliser le moteur de recherche de fonctions existant ; « Équipe » ouvre un écran de disponibilité honnête tant que la collaboration sécurisée n'est pas activée.

**Recette obligatoire :** vérifier sur la version réellement déployée les sections DOM, les paramètres 320/390/1440 px, le masquage du menu latéral sur l'accueil, l'absence de débordement, l'accès à chaque destination, la création d'un projet et la conservation des sauvegardes. Tester l'application extérieure à l'accueil pour éviter de casser les autres écrans. Tests dédiés : `tests/control-home-v6.test.mjs` et adaptation du smoke Chromium `tests/control-ia-browser-smoke.mjs`. Cache PWA v77.

## CONTROL 07 — Application homogène et navigation lisible (3 novembre 2026)

**Objectif :** faire correspondre les écrans de travail à la maquette d'accueil, plutôt que présenter deux interfaces différentes selon la page.

**Changements réalisés dans l'application personnelle :**
- Menu latéral sombre remplacé, sur les écrans internes, par un en-tête compact et les quatre entrées Accueil / Projets / Équipe / Assistants ; navigation fixe en bas sur petit écran.
- Les fonctions de recherche restent accessibles dans l'en-tête, avec un bouton direct « + Tâche » menant au formulaire existant.
- `#/projects` ouvre désormais une vue projets dédiée : recherche et reprise de projets, sans les compteurs et le panneau d'assistance de l'accueil. La création et le suivi continuent d'utiliser les enregistrements existants.
- Les pages « À traiter », les espaces projets et les outils IA partagent une base graphique blanche, bleu foncé, surfaces lisibles et contrôles adaptés au mobile ; les interfaces métier et leurs données sont conservées.
- Dans un projet : Mes IA, Conversations, Suivi, Documents & liens. Les fonctions secondaires sont repliées par défaut, sauf lorsqu'une fonction avancée est sélectionnée.
- La page Équipe reste informative et verrouillée tant que l'authentification et les permissions ne sont pas sûres. Pas d'illusion de collaboration opérationnelle.

**Tests de non-régression ajoutés/adaptés :** `tests/control-workspace-v7.test.mjs` ; recette Chromium `tests/control-ia-browser-smoke.mjs` sur parcours Projets, Équipe, création de tâche et navigation fixe mobile. Une recette mobile réelle doit contrôler l'absence de défilement horizontal et la lisibilité du bas de page derrière la navigation.

**Reste à faire :** vérifier la publication GitHub Pages, une vraie recette navigateur visuelle, les comptes A/B et les règles de sécurité Cloud, la synchronisation multi-appareils et les connecteurs métiers. **Aucun changement de Cloud, d'automatisation ni de quota payant.**

## Décision produit

**Promesse** : « Je sais ce qui est important, je retrouve le contexte et je délègue sans perdre le contrôle. »
CONTROL doit **réduire le travail administratif et la double saisie**, et non recréer tous les logiciels existants. La réussite se mesure au nombre de tâches effectivement simplifiées, pas au nombre de modules disponibles.

### Cible première
- Indépendants et petites agences/services qui ont 5–30 clients, plusieurs projets et déjà Drive, un calendrier, une messagerie et un ou plusieurs outils IA.
- Équipes légères (2–10 personnes) : dirigeants qui doivent suivre les délégations et validations.
- Les commerces/équipes chantier restent des cibles secondaires ; ne pas intégrer prématurément ERP, stock ou comptabilité.

## Statut honnête au 03/11/2026

### Réellement présent sur le site personnel (d'après le dépôt)
- Espaces projets, tâches locales, missions enregistrées, liens vers les IA, calendrier, rendez-vous, recherche de fonctions, backups et assistants locaux expérimentaux.
- Accueil « Vue 05 » : bloc de priorités **calculé uniquement** à partir de \`control-command-v1\`, avec tâches en retard, échéances du jour, missions \`review\`, trois éléments prioritaires et accès direct à la création.
- Sauvegarde locale ; consultation des données existantes sans accès aux services privés.

### Pas encore à présenter comme opérationnel
- Authentification et synchronisation Cloud, comptes de salariés et isolation multi-organisations démontrée de bout en bout.
- Connexion native aux comptes privés ChatGPT / Claude / Gemini et reprise automatique de leurs conversations/mémoires.
- Lecture des vrais emails/événements Google et création de rendez-vous distante sans connecteur explicite.
- Exécution directe des missions multi-IA et automatisations autonomes, notifications push.
- IA locale expérimentale : ne pas la vendre comme un assistant général équivalent à un fournisseur commercial.

## Parcours cible : une journée

1. **8h / Je regarde** : au plus trois éléments urgents ; afficher source, date de mise à jour, responsabilité, échéance ; en cas de données absentes « non connecté », jamais « tout va bien ».
2. **9h / Je traite** : ouvrir le contexte de l'action, attribuer une personne, changer état/date, conserver la décision.
3. **11h / Je délègue** : préparer une tâche humaine ou une mission IA ; vérifier coûts et autorisations ; demander validation avant toute action externe engageante.
4. **15h / Je retrouve** : recherche par client, projet, mot, fichier ou décision avec permissions et provenance.
5. **18h / Je clôture** : bilan des actions réelles ; retards et validations restants ; aucun chiffre fictif.

## Navigation et langage

Premier niveau cible : **Accueil, Projets, Clients, Équipe, Assistants** (adaptation mobile avec éléments secondaires dans « Plus »).
- Accueil : urgences, tâches du jour, « créer une tâche », recherche globale, activité récente **datée**.
- Projet : vue synthèse, tâches, personnes, documents/liens, décisions, missions IA. Éviter 10 onglets égaux.
- Clients : fiche simple (coordonnées autorisées, projet, devis/statut référencé, échange, prochaine action). Ce n'est pas un CRM complet.
- Équipe : responsables, tâches assignées, blocages, accès et invitations après Cloud sécurisé.
- Assistants : modèles de missions (« clients », « suivi de projet », « rédaction », « administratif »), connaissance attachée, permissions, historique et frais.
- « Plus » : laboratoire développeur, catalogues, publication, outils expérimentaux, comptes/connexions, sauvegardes.

Les titres doivent exprimer des actions : « Suivre mes missions » plutôt que « Orchestration multi-IA », « À traiter » plutôt que « Flux opérationnel ». Toujours distinguer « préparé », « enregistré localement », « transmis », « exécuté » et « vérifié ».

## Priorités d'exécution

| Rang | Fonction | Dépendances et critères d'acceptation |
| --- | --- | --- |
| P0 | Données fiables | Sauvegarde/restauration vérifiées, dates valides, erreurs de stockage explicites, ne jamais écraser une donnée concurrente. |
| P0 | Accueil utile | 3 éléments prioritaires issus des seules sources autorisées, accès « créer une tâche » en un geste, état vide utile, aucun faux compte externe. **Livré en première version locale le 03/11**. |
| P0 | Auth et multi-tenant | Supabase CONTROL séparé, 2 vrais comptes A/B, RLS prouvée, révocation de session, suppression/export, test inter-appareils AVANT activation publique. |
| P0 | Sécurité | Identifiants/secrets jamais en localStorage/public GitHub ; validation des entrées ; XSS, CSRF et contrôle des autorisations sur serveur ; journal d'événements. |
| P1 | Équipe | Rôles propriétaire/admin/collaborateur/invité, invitations sécurisées, attribution, visibilité par projet, commentaires, validation des travaux. |
| P1 | Première intégration | Connexion officielle autorisée Gmail/Calendar/Drive (une seule chaîne bout en bout avant d'en multiplier), permissions minimales, sync incrémentale et déconnexion. |
| P1 | Boîte de réception | Fédérer tâches locales, retours IA et éléments connectés ; afficher la provenance, éviter les doublons, assigner/archiver/report. |
| P1 | Clients légers | Création, modification, recherche et liaison clients ↔ projets ↔ prochaines actions, export ; aucun inventaire ou comptabilité complète. |
| P1 | Assistants IA | Modèle d'agent à partir d'un besoin ; contexte autorisé, mémoire révisable, pièces jointes, validation, état/erreur/coût visibles. |
| P2 | Automatisations | Déclencheurs et répétitions après permissions, mode brouillon/simulation, limite budgétaire, arrêt et audit ; activation explicitement consentie. |
| P2 | Pilotage financier | Synthèse de données saisies ou de connecteurs, pas de calcul comptable/financier non vérifié. |

## Schéma de données cible (phase Cloud, non déployée)

Entités : \`organizations\`, \`memberships\`, \`customers\`, \`projects\`, \`tasks\`, \`task_activity\`, \`documents\`, \`decisions\`, \`connectors\`, \`external_refs\`, \`ai_agents\`, \`knowledge_sources\`, \`agent_runs\`, \`approvals\`, \`audit_events\`.

Chaque table métier Cloud porte l'identifiant d'organisation, propriétaire, créateur, horodatage, version ; RLS + vérification serveur du rôle. Source externe avec \`provider\`, \`external_id\`, \`synced_at\` et permissions pour éviter la double création. Les tâches conservent responsable, statut, priorité, échéance et activité.

Ne PAS réutiliser la base IAgile. Ne PAS activer le Cloud tant que les huit critères de \`config/cloud.json\` sont faux.

## IA & mémoires importées

- Import manuel de fichiers exportés : analyser seulement les formats autorisés ; laisser l'utilisateur sélectionner/éditer les faits conservés dans la mémoire propre à CONTROL.
- Montrer source, date et projet autorisé de chaque connaissance ; bouton « supprimer » et gestion des durées de conservation.
- Un lien vers ChatGPT/Claude/Gemini ne vaut pas connexion. Une clé API ne donne pas accès à tous les chats privés de l'application correspondante.
- Exécution : \`draft → permission_required → running → completed/failed → reviewed\`. Montrer séparément les actions réellement exécutées et les prompts préparés.
- Permissions lecture/écriture par connecteur et projet ; confirmation avant envoi externe, publication, suppression, invitation, dépense.
- Mode local expérimental séparé des assistants connectés ; estimation et plafond de coût avant mission payante.

## Onboarding

4 étapes maximum : créer un espace → choisir son objectif (projets / clients / IA) → facultativement connecter un outil officiel → **obtenir un premier résultat réel**. Ne jamais demander de connexion obligatoire à une IA tierce.

## Recette mesurable (objectifs à tester, pas résultats constatés)

- 8–12 entrepreneurs non initiés, répartis entre solo / micro-équipe et niveau digital variable.
- Nouveau projet <2 min, tâche assignée <45 s, première valeur <5 min, retrouver une info <30 s, trois urgences repérées <15 s.
- 100 % des actions IA affichent statut, date, provenance, niveau d'autorisation et preuve si elles ont été exécutées.
- Test A/B des permissions : utilisateur B ne voit aucune donnée privée de A (incluant API, recherches et téléchargements) ; membre désinvité perd l'accès.
- Tester 320/390 px, clavier, lecteur d'écran, perte réseau, autre appareil, deux onglets, mauvaises données et sauvegarde/restauration.
- Tests de non-régression sur toutes les routes et vérification du **site public réellement déployé** ; réussite de la CI seule ne suffit pas.
- Mesurer tâches faites, temps gagné, erreurs, adoption après 7/30 jours et demandes d'aide.

## Décisions de périmètre

**À ne pas développer en priorité** : logiciel de comptabilité complet, RH/paye, ERP, hébergeur, visioconférence propriétaire, doublon intégral de CRM, scraping privé de conversations IA, automations non approuvées, nouvelles ressources catalogue sans usage démontré.

**Règle** : toute nouvelle proposition doit indiquer son problème utilisateur, la preuve de besoin, une priorité, la fonction remplacée ou simplifiée, les risques de coûts et un test d'acceptation.

## Travail effectivement engagé le 03/11

- Création de \`assets/control-day-brief.js\` et \`.css\`.
- Vue 05 de la page personnelle : urgences locales et accès rapide, vocabulaire orienté actions ; aucune donnée externe prétendue connectée.
- Tests de calcul de priorité, absence/corruption des données, échéances, neutralisation de contenus HTML dans les tâches.
- Invalidation du cache PWA version 73 pour que la modification soit visible après actualisation.

Ce document définit la cible future ; il ne constitue pas la preuve que les fonctions P1/P2 existent aujourd'hui.
