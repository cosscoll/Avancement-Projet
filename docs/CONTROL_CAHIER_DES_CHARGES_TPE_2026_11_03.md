# CONTROL — Cahier des charges TPE : priorités entrepreneur
_Mise à jour : 6 novembre 2026 · version de travail 1.14 · ciblage indépendants et équipes de 2 à 10 personnes_


## CONTROL 22 — Triage clair et actions réellement enregistrées (6 novembre 2026)

**Besoins P0/P1 livrés directement sur `main` :** la page **« À traiter »** regroupe désormais chaque tâche ou mission locale dans **une seule catégorie** : « En retard » (échéance dépassée), « Aujourd’hui » (échéance du jour), « À vérifier » (missions IA au statut `review`), « À suivre » (autres tâches ouvertes) ou « Terminées » (actions clôturées). Les catégories disposent d'en-têtes lisibles et de compteurs correspondant aux lignes visibles. Les éléments annulés ne sont pas mélangés aux tâches ouvertes.

**Parcours utilisateur réellement amélioré :** cinq boutons de filtre rapide avec compteurs et `aria-pressed` donnent accès aux tâches en attente, en retard, du jour, à vérifier et terminées. Ils réutilisent le moteur de recherche et le filtrage par client déjà présents, sans ajouter de nouvelle navigation. Après recherche ou filtre, les sections vides sont masquées. Les boutons existants « Terminer » et « Rouvrir » et le formulaire « Modifier » conservent leurs écritures locales protégées contre les changements inter-onglets ; un clic sur un filtre n'écrit aucune donnée.

**Architecture et sécurité :** `assets/control-task-workflow.js` expose la classification pure `bucket` et le regroupement `group`, utilisés par `assets/command-center.js`, avec styles mobiles dans `assets/command-center.css`. Aucun connecteur distant, événement externe ou automatisation créé. Cache **PWA v98**.

**Recette complète :** [GitHub Actions — qualité #42198750687](https://github.com/cosscoll/Avancement-Projet/actions/runs/42198750687) : **777 tests réussis sur 777** ; [recette Chromium locale #42198606871](https://github.com/cosscoll/Avancement-Projet/actions/runs/42198606871) et [recette Chromium sur le site public #42198822103](https://github.com/cosscoll/Avancement-Projet/actions/runs/42198822103) : affichage d'un jeu de tâches fictives réparties dans les cinq sections, aucun doublon, filtrage/état vide, sélection « À vérifier », recherche et réouverture d'une tâche confirmée dans le stockage local après clic. La recette publique vérifie aussi l'identité octet pour octet de **26 fichiers** du site. [Publication GitHub Pages #42198749691](https://github.com/cosscoll/Avancement-Projet/actions/runs/42198749691) : réussie.

**Prochaine session 23 :** clients et relances actionnables, création de tâches préremplies à partir des informations client déjà autorisées, liaison client-projet robuste, tests de stockage corrompu et vérifications 320/390 px. N'introduire ni CRM complet ni faux accès à Gmail/Calendar.



## CONTROL 21 — Démarrage accompagné, trois étapes vérifiables (6 novembre 2026)

**Livré dans l'application réelle (`main`) :** sur un appareil neuf, un encart « Bien démarrer avec CONTROL » apparaît dans l'accueil validé CONTROL v6, avec une progression ancrée dans les données locales :

1. **Créer ou ouvrir un projet** : lien vers le formulaire existant, focus sur le nom, prise en compte uniquement après enregistrement ou vraie consultation d'un espace.
2. **Ajouter une première tâche** : lien direct `#/control/inbox/new`, qui ouvre le vrai formulaire de création.
3. **Traiter cette action** : lien direct `#/control/inbox`, accomplie uniquement lorsqu'une tâche enregistrée passe réellement au statut `done`.

Le guide se masque automatiquement après l'achèvement d'une tâche ou pour les comptes ayant déjà suffisamment d'activité enregistrée. Il ne modifie ni la base locale ni les quotas lors de l'affichage. En cas de stockage corrompu, il ne présente pas une fausse première utilisation : les alertes existantes de CONTROL conservent la priorité. Aucune connexion ChatGPT, Claude, Gemini ou Cloud n'est demandée.

**Technique :** nouveau module pur `assets/control-onboarding.js`, intégré dans `index.html`, CSS limité à `assets/control-home-v6.css`, ajout à la liste de fichiers critiques PWA **v97**. Les six sections de l'accueil restent dans l'ordre validé.

**Recettes réussies :** [suite Node #42196714258](https://github.com/cosscoll/Avancement-Projet/actions/runs/42196714258) **772 tests sur 772** ; [Chromium local #42196714495](https://github.com/cosscoll/Avancement-Projet/actions/runs/42196714495) : enregistrement réel d'un projet, d'une tâche et clôture dans un contexte Chromium isolé, avec vérification des trois états du guide et de sa disparition ; recette initiale de navigation avec annulation sans changement de progression. Les sauvegardes et autres fonctions de CONTROL restent intactes. [Publication GitHub Pages #42197121357](https://github.com/cosscoll/Avancement-Projet/actions/runs/42197121357) **réussie**, et [recette Chromium après publication #42197199832](https://github.com/cosscoll/Avancement-Projet/actions/runs/42197199832) **réussie** : 26 fichiers du site public contrôlés octet par octet, nouveau guide vérifié sur appareil vierge, parcours complet jusqu'à la tâche terminée, disparition du guide confirmée. CONTROL 21 est livré et vérifié en ligne (pas sur un téléphone physique).

**Suivant :** CONTROL 22 — rendre la liste « À traiter » plus lisible par catégories du jour / retards / validations, sans masquer la provenance ni transformer une suggestion en action réellement exécutée.


## CONTROL 20 — Première livraison UX et protocole de sessions visibles (6 novembre 2026)

**Besoin P0 :** lancer une tâche en un geste à partir de l'accueil, sans trouver les sous-menus. **Livraison dans le code sur `main` :** bouton « + Nouvelle tâche » dans la section existante « À traiter en priorité » et « Créer ma première tâche » si la liste est vide. Les deux ouvrent la vraie page `#/control/inbox/new`, qui met le curseur dans le titre sans enregistrer quoi que ce soit avant la confirmation. Une présentation compacte sur ordinateur et mobile conserve les six sections de l'interface CONTROL v6 validée. PWA **v96**.

**Recette :** nouveau test de non-régression `control-home-v6.test.mjs`, vérification de navigation et de focus en Chromium. [Qualité Node #42194565344](https://github.com/cosscoll/Avancement-Projet/actions/runs/42194565344) : **762 tests sur 762 réussis** au commit `945cfc8b05`. [Déploiement GitHub Pages #42194758506](https://github.com/cosscoll/Avancement-Projet/actions/runs/42194758506) **réussi** et [recette Chromium sur le site public #42194841844](https://github.com/cosscoll/Avancement-Projet/actions/runs/42194841844) **réussie** : les 25 fichiers publics contrôlés correspondent au commit déployé, et le nouveau bouton ouvre effectivement le formulaire avec focus sur le titre. CONTROL 20 est livré.

**Organisation des sessions suivantes :** [Plan de développement par livrables visibles](CONTROL_PLAN_SESSIONS_LIVRABLES_2026_11_06.md). Chaque session doit produire une amélioration utilisateur sur le site, tests Node + Chromium, cache PWA mis à jour si nécessaire, déploiement GitHub Pages confirmé et compte rendu avec preuves. La priorité va à l'onboarding, puis au traitement des tâches, aux clients, aux espaces projets, à la recherche et aux assistants ; l'authentification et les connecteurs réels restent bloqués sans preuves d'isolation et autorisations. Aucune automatisation récurrente, consommation de quota limité ou dépense non approuvée.


## Sprint CONTROL 19 — Sauvegarde portable entre stockages Chromium isolés (6 novembre 2026)

**Mission validée sur le site public :** la recette navigateur emploie le protocole DevTools pour créer deux contextes Chromium indépendants du navigateur source, chacun avec son stockage local, son cache et ses cookies. Elle exporte par le formulaire réel une archive chiffrée AES-GCM et une archive JSON claire (avec uniquement des données synthétiques), puis les restaure par le formulaire réel dans deux destinations vierges.

**Contrôles réussis :**
- mauvais mot de passe AES-GCM refusé sans ouverture de l’aperçu ni modification des données ;
- prévisualisation intégrale et comparaison des volumes sans écriture sur la destination ;
- avertissements d’intégrité et consentement explicite avant restauration ;
- concordance du nombre de tâches, d’agents, de mémoires et du nom de l’agent après import ;
- conservation des agents et des données après rechargement complet de chaque contexte ;
- contextes de test détruits après la recette, sans donnée client ni accès tiers.

**Preuves :** [Chromium local #42193248162](https://github.com/cosscoll/Avancement-Projet/actions/runs/42193248162) ; [test du véritable GitHub Pages #42193304921](https://github.com/cosscoll/Avancement-Projet/actions/runs/42193304921) (25 fichiers publics vérifiés octet pour octet) ; [qualité Node #42193248145](https://github.com/cosscoll/Avancement-Projet/actions/runs/42193248145) (761/761) ; [publication #42193247376](https://github.com/cosscoll/Avancement-Projet/actions/runs/42193247376) réussie.

**Portée :** deux contextes Chromium isolés ne sont pas deux appareils physiques. Ce test valide le transfert et la persistance réels, pas une synchronisation automatique, des comptes tiers natifs, ni les autorisations Cloud/JWT/RLS. PWA v95 inchangée, Cloud et automatisations non activés, aucune dépense.

**P0 suivant :** migration entre appareils physiques, faible espace disque, perte du navigateur en pleine transaction, modifications inter-onglets, accessibilité au clavier et audit mobile 320/390 px. Les comptes multi-utilisateurs restent soumis aux tests d’isolation réelle et à l’autorisation explicite.



## Sprint de stabilisation — recherche et couverture qualité (6 novembre 2026)

**Correctif réel livré directement sur `main` :** le moteur de recherche universelle n'appelle plus `find` sur une collection `clients` absente dans les données historiques. Il accepte une ancienne sauvegarde ne contenant pas cette liste sans planter, tout en préservant les règles de filtrage par projet et de liens HTTPS. Les scénarios de recherche, y compris l'isolation des projets, passent dans les tests Node.

**Visibilité sans activation :** l'accueil comporte désormais un lien discret « Voir l’état de CONTROL Cloud » dans les outils avancés, avec un rappel clair que la connexion multi-utilisateurs n'est pas activée. Aucune authentification, synchronisation ni dépense engagée.

**Dette de tests corrigée :** les régressions historiques vérifiaient parfois les écrans CONTROL 04, un cache PWA obsolète ou une navigation sombre retirée lors de la validation de l'accueil CONTROL v6 et de l'espace v7. Ces assertions ont été remplacées par des contrôles portant sur les écrans réellement conservés, sans supprimer les tests de sécurité, de transfert ou de routage. Les simulations de navigateur ont été adaptées aux classes du document actuel.

**Résultat confirmé :** GitHub Actions [Contrôle qualité #42191435913](https://github.com/cosscoll/Avancement-Projet/actions/runs/42191435913) : **761 tests exécutés, 761 réussis, 0 échec** au commit `0a2fb2aba3`. Le service worker est passé à **v95** pour les modifications du shell. Ce résultat ne certifie pas un véritable transfert chiffré entre deux profils indépendants ni la sécurité de la plateforme Cloud non activée.

**Priorités restantes :** vérifier le déploiement v95 sur le site public après publication, réaliser le transfert manuel profil A → profil B (plain et AES-GCM), tester le faible espace de stockage et les modifications inter-onglets dans deux navigateurs distincts ; conserver le verrou de sécurité Cloud et n'envisager les connexions officielles aux comptes IA qu'après contrôle des permissions et autorisations.

## Session P0 — Annulation fiable des analyses de fichiers (6 novembre 2026)

**Livré sur `main` :** les imports de sauvegarde CONTROL et les imports d'archives du Studio IA ne peuvent plus publier une ancienne prévisualisation après changement de fichier, de fournisseur IA, annulation, nouvel examen ou démontage du Studio. La vérification garde un numéro de génération ; toute lecture différée ou déchiffrement terminé en retard est ignoré, y compris en cas d'erreur. Les boutons de confirmation sont neutralisés dès qu'une sélection invalide l'aperçu. Les données ne sont toujours écrites qu'après confirmation explicite.

**Périmètre exact :** `assets/command-center.js` (sauvegardes générales), `assets/control-ai-studio.js` (conversations ChatGPT/Claude/Gemini exportées manuellement et restauration locale des agents/mémoires), tests de courses asynchrones `tests/control-backup-import-race.test.mjs` et `tests/control-ai-studio-import-race.test.mjs`, corrections de régressions historiques du moteur de sauvegarde, cache PWA **v94**. Aucun accès natif aux comptes tiers, aucune connexion Cloud ou automatisation activés.

**Recette :** les tests Node simulent des changements de fichier durant lecture/déchiffrement et des réponses arrivant dans le désordre. Les tests de navigateur en CI et la présence du code dans GitHub ne remplacent ni une recette sur le site public recevant effectivement v94, ni le transfert réel d'une archive chiffrée entre deux profils indépendants. La suite complète conserve des tests historiques en échec sans lien avec ce correctif ; les distinguer des tests de sécurité récemment ajoutés.

**Recette automatisée après corrections :** contrôle GitHub Actions [Qualité et régressions #42189879161](https://github.com/cosscoll/Avancement-Projet/actions/runs/42189879161) : **761 tests, 726 réussis, 35 en échec**. Au début de cette session, 50 tests échouaient sur 757 ; les huit nouveaux tests de concurrence sont tous réussis. Les tests PWA historiques liés aux anciens noms de cache ont été réalignés sur la version courante. Les 35 échecs restants concernent des parcours et hypothèses de l'interface historique, ainsi que des simulations locales : ils demandent un triage détaillé et ne sont ni considérés comme validés, ni supprimés. Le contrôle de navigateur automatisé [#42189887981](https://github.com/cosscoll/Avancement-Projet/actions/runs/42189887981) est réussi ; la [publication GitHub Pages #42189879083](https://github.com/cosscoll/Avancement-Projet/actions/runs/42189879083) a réussi au commit de la PWA v94. Ceci ne prouve pas que chaque appareil a actualisé son service worker ni que l'import manuel entre deux profils indépendants fonctionne.

**Suite prioritaire :** analyser les 35 échecs restants à partir des comportements présents dans le produit, réparer les vrais dysfonctionnements et réaligner seulement les assertions obsolètes ; réaliser ensuite la vraie recette navigateur A/B avant toute ouverture Cloud.

## Session P0 — Recette réelle sur GitHub Pages (6 novembre 2026)

**Mission accomplie partiellement en conditions réelles :** pour la première fois, la restauration des données de CONTROL a été testée directement sur **https://cosscoll.github.io/Avancement-Projet/** dans un navigateur isolé, avec uniquement des projets, tâches et clients fictifs. Le navigateur public affichait **PWA v91** et les modules de restauration étaient effectivement chargés.

**Résultats réels constatés :**
- La page Sauvegardes présente les formulaires d'export et d'import ; aucune erreur JavaScript n'a été relevée à l'ouverture.
- Un import `control-v2-plain` de démonstration a affiché correctement **0 → 1 projet personnalisé, 0 → 1 client, 0 → 1 tâche**, avec annulation sans modification des données.
- Après une restauration confirmée, les trois zones de stockage ont contenu les références de test ; l'écran Clients montrait la tâche reliée, le filtre de tâches retrouvait le client, et le diagnostic indiquait **0 erreur / 0 avertissement**. Les données étaient toujours présentes après rechargement.
- Une sauvegarde fictive contenant deux projets avec le **même identifiant** a affiché **« Restauration impossible »**, désactivé le bouton et masqué la case de consentement. Une tentative de déclenchement du bouton par code n'a modifié aucun enregistrement.
- Les tests ont révélé une faiblesse d'ergonomie : le JSON sans enveloppe CONTROL affichait un message d'erreur générique. Une fonction pure `safeImportError` a donc été ajoutée à `assets/control-backup-review.js`, avec des messages préétablis compréhensibles sans exposer les détails du fichier, et intégrée dans le parcours d'import.
- Deux sauvegardes fictives versionnées et sans secret sont fournies dans `tests/fixtures/`. Les tests Chromium du dépôt incluent désormais le blocage des doublons même si le gestionnaire est invoqué directement, et l'explication des fichiers non reconnus.
- **63 contrôles ciblés de logique/syntaxe passent sur 63** après intégration et version PWA **v92** enregistrée sur `main`.

**Ce qui n'est pas encore prouvé :**
- L'ouverture d'un **second profil de navigateur indépendant** a expiré. Le test d'export physique depuis le navigateur A puis import dans B est **non validé**. Les deux stockages simulés par les tests Node ne remplacent pas un second vrai profil.
- La publication **v92** et son nouveau message d'erreur n'ont pas été revérifiés publiquement : l'ancienne session de navigateur de test n'était plus accessible à la fin. Seule la diffusion de **v91** a été attestée pendant la recette.
- Aucun test bout-en-bout d'export chiffré, de faible espace disque sur le navigateur public ou d'ouverture Cloud ne peut être considéré réussi.

**Rapport détaillé, preuve et grille de recette :** [CONTROL_RECETTE_NAVIGATEUR_2026_11_06.md](CONTROL_RECETTE_NAVIGATEUR_2026_11_06.md). Les résultats reproductibles sont encadrés par `tests/control-ia-browser-smoke.mjs`, `tests/control-backup-review.test.mjs` et `tests/control-data-audit.test.mjs`.

**Suite P0 :** valider deux profils indépendants A/B, export chiffré et restauration effective ; tester les supports mobiles et le cache hors ligne ; vérifier les permissions RLS/JWT serveur uniquement sur un environnement autorisé. Le Cloud et les automatisations restent désactivés, sans consommation de services payants.

## Session P0 — Restauration transactionnelle et tests de transfert (6 novembre 2026)

**Bilan technique et correction réelle sur `main` :**
- Les doublons d'identifiants de projets personnalisés et les collisions entre un projet importé et le catalogue officiel provoquent désormais **un refus non contournable de restauration**. Une confirmation de l'utilisateur n'autorise plus le remplacement d'un fichier avec ces identifiants ambigus.
- Le mécanisme de restauration n'est plus un grand bloc opaque dans l'interface. Son application transactionnelle est centralisée dans `assets/control-backup-review.js`, via `applyTransaction`. L'interface n'y accède qu'après l'examen du fichier, la validation des anomalies et la confirmation de remplacement.
- La transaction vérifie l'état des **quatre zones locales** avant et pendant les écritures, contrôle le contenu de chaque écriture et empêche une modification inter-onglets d'être écrasée silencieusement. Si un stockage refuse l'opération ou si l'initialisation échoue, elle restaure seulement les valeurs encore identiques à celles qu'elle vient d'écrire ; si une autre session les a changées, elle signale un retour arrière incertain. Lorsqu'une réinitialisation de l'interface échoue après l'écriture, l'état en mémoire est également rechargé depuis les données revenues à leur version précédente. Ce mécanisme est un **retour arrière au mieux**, pas une transaction atomique de base de données : les espaces localStorage sont remplacés successivement.
- Les sauvegardes historiques sans Studio IA restent compatibles : une restauration sans section Studio conserve les agents/mémoires de l'appareil.
- La **PWA v91** précache les nouveaux fichiers et impose des tests de version cohérents.

**Vérification indépendante de la logique de restauration :**
- `tests/control-backup-review.test.mjs` couvre deux stockages indépendants (équivalents à des profils de navigateur séparés), les clients et tâches liées, les projets personnalisés, une sauvegarde héritée, une panne de quota pendant l'écriture, le refus des modifications concurrentes, un échec d'initialisation et le cas de concurrence sur une donnée déjà écrite.
- `tests/control-data-audit.test.mjs` vérifie le blocage des identifiants de projet répétés ou réutilisant ceux du catalogue et la validation de sauvegardes mal structurées.
- **61 vérifications de logique et de syntaxe exécutées avec succès dans l'environnement JavaScript d'essai**. La suite Node globale, un test navigateur piloté sur la vraie application et GitHub Pages restent des contrôles séparés non confirmés par cette session.

**Important :** un stockage simulé indépendant n'est pas un test utilisateur dans deux vrais navigateurs. Une session de recette réelle doit encore exporter un fichier sur le profil A, l'importer sur le profil B, comparer les données, tester les erreurs de stockage et confirmer le rendu dans Chromium/Firefox et sur mobile.

### Suite prioritaire

1. Exécuter la recette navigateur publiée, corriger les anomalies de navigation et d'import constatées.
2. Tester le transfert A/B avec un fichier de démonstration sans données privées, vérifier la restauration des projets, tâches, clients et agents.
3. Inventorier les autorisations serveur réelles (RLS, JWT, révocation) avant d'envisager des comptes multi-utilisateurs. Le contrat local ne remplace pas cette vérification.
4. Ne pas activer les automatisations, dépenses ou fonctions Cloud sans instruction expresse.

## Sprint P0 — Fiabilité du transfert de projets (5 novembre 2026)

**Audit et problème réellement corrigé :** l'aperçu de sauvegarde comptait les anciens `hub.projects`, alors que l'application personnelle conserve les nouveaux projets dans **`hub.custom`**. Des projets personnalisés pouvaient donc apparaître comme absents dans la comparaison, même si le fichier les contenait. Un test de sauvegarde utilisait aussi un cache PWA obsolète.

### Fonctions réellement modifiées sur main

- Le contrôle de sauvegarde distingue les **espaces projets historiques** et les **projets personnalisés**. Pour les seconds, il compare les identifiants stables : nombre de projets, ajouts, suppressions, remplacement d'un identifiant et modification du contenu à quantité constante.
- La comparaison n'affiche **ni nom privé, ni URL, ni identifiant personnel**. Les doublons et identifiants ambigus sont signalés comme résultats incertains, sans inventer une comparaison exacte.
- La restauration vérifie le catalogue officiel seulement lorsque les projets de référence ont réellement été chargés. Sans catalogue de référence, le résultat mentionne une couverture partielle plutôt que signaler à tort les projets comme inconnus.
- Une sauvegarde contenant une liste `hub.custom` non-tableau ou des projets personnalisés sans identifiant/nom valide est **non restaurable** : le bouton reste désactivé et le gestionnaire bloque toute tentative, même après un clic forcé ou une coche de consentement. Le diagnostic reste en lecture seule et ne supprime aucune donnée.
- Une sauvegarde historique **sans `hub.custom`** continue d'être acceptée dans ce contrôle. Le remplacement des autres données reste soumis à l'aperçu, à la confirmation finale et à la détection de modification inter-onglets.
- Le cahier des charges conserve la différence entre le **transfert manuel** par fichier, livré localement, et la **synchronisation multi-appareils**, toujours absente tant que le Cloud n'est pas sécurisé.

### Recette ajoutée / corrigée

- `tests/control-backup-review.test.mjs` : comparaison moderne, changement du nombre de projets, changement de contenu sans changement de quantité, remplacement d'ID, réorganisation, dossiers historiques et anomalies de doublons. Vérification du cache actuel.
- `tests/control-data-audit.test.mjs` : pré-vol avec catalogue complet ou absent, projets personnalisés malformés, refus non contournable et maintien des sauvegardes historiques.
- `tests/control-ia-browser-smoke.mjs` : scénario de contrôle du compteur de projets importés dans l'aperçu et vérification que l'annulation ne modifie pas le stockage local. **Scénario écrit, mais non exécuté dans un vrai navigateur pendant cette session.**
- **51 contrôles ciblés réussis sur 51** dans une exécution JavaScript de modules et tests avec vérification de syntaxe. Cela n'atteste **pas** le succès de toute la suite de tests du dépôt ni le rendu GitHub Pages.

### Restant à valider avant clôture de P0

1. Exécuter la recette Chromium intégrale sur le code de `main` et vérifier les fichiers effectivement servis par GitHub Pages.
2. Exporter une sauvegarde dans un navigateur A, la restaurer dans un profil B neuf, vérifier réellement les projets `custom`, clients, tâches liées et agents, puis réexporter et comparer.
3. Tester un projet supprimé du catalogue, une sauvegarde trop ancienne, un stockage saturé, une interruption pendant la restauration et une erreur de révocation de lien.
4. Inventorier en lecture seule les tables et règles du projet Supabase indépendant ; **n'activer aucun compte** sans la recette A/B documentée et l'approbation distincte.

## Session structurée — Sauvegardes portables et sécurité collaborative (5 novembre 2026)

**Objectif :** avancer plusieurs missions liées dans la même session, sans automatisation, sans ouvrir le Cloud et sans arrêter le travail à une seule amélioration de surface.

### Lot A — Fiabiliser le transfert manuel de projets entre appareils

**Livré sur main :** l'aperçu d'import détecte les incohérences client–tâche et, lorsqu'un catalogue de projets connu est disponible, il vérifie également les références des projets du fichier. Les projets de base sont fournis par le catalogue CONTROL ; les projets personnels sont reconstruits à partir de la liste importée du Hub. Cette distinction évite les fausses alertes de projet manquant en l'absence de catalogue complet. Les références orphelines et identifiants dupliqués sont signalés sans écriture. Le formulaire de sauvegarde inclut un **guide repliable de transfert entre deux appareils** (export, déplacement du fichier, inspection avant remplacement, vérification après restauration). Le transfert reste manuel et remplace les données, sans fusion ni synchronisation automatique.

**Preuves de code :** assets/control-data-audit.js, assets/command-center.js et tests/control-data-audit.test.mjs. PWA **v87**, ressources critiques précachées. Les projets personnalisés malformés ou sans identifiant sont aussi signalés et jamais supprimés silencieusement.

### Lot B — Préparer sérieusement les rôles et le partage

**Livré dans le dépôt, mais non activé dans l'application :**
- Le contrat exécutable security/control-access-contract.js décrit un modèle **deny by default** avec rôles propriétaire, administrateur, éditeur et lecteur. Il refuse les non-membres, les sessions invalides, les permissions de lecture/écriture non autorisées et l'exécution automatique des IA, même lorsqu'un simple drapeau local le demande.
- Les agents, mémoires, conversations et connexions aux fournisseurs IA ne deviennent **jamais publics du seul fait de l'appartenance à un projet**. Un partage IA exige une action explicite et doit être appliqué côté serveur.
- Le dossier docs/CONTROL_SECURITY_AB_ACCEPTANCE_2026_11_05.md définit le modèle cible, les contraintes RLS, les interdictions (user_metadata, clés secrètes côté client, partage implicite) et **20 scénarios de recette A/B** à vérifier avec deux vrais utilisateurs.
- Les tests/control-access-contract.test.mjs protègent le contrat attendu. **Ce JavaScript est un outil de recette, pas un mécanisme de sécurité ni une intégration dans le site.**

### Lot C — Vérifications et limites

**32 contrôles ciblés réussis sur 32** lors de cette session, dont 27 tests de logique/contrat et 5 vérifications de syntaxe. Les anciens tests et la recette navigateur complète sur GitHub Pages ne sont pas considérés exécutés par cette vérification ciblée.

**Reste bloquant P0 :** projet Supabase indépendant actif et inventorié, vérification réelle des six tables et policies existantes, essais JWT/PostgREST avec comptes A/B, révocation, suppression/export de compte, tests sur deux appareils, et autorisation explicite de lancement. Les huit contrôles de config/cloud.json restent à false et Cloud demeure désactivé.

### Protocole des prochaines longues sessions

1. Commencer par le bilan des fonctionnalités et des problèmes attestés sur main.
2. Regrouper les changements en une **mission utilisateur cohérente** (par exemple sauvegardes + diagnostic + transfert) plutôt que multiplier les micro-commits sans bénéfice visible.
3. Développer puis exécuter les tests pertinents, traiter les régressions et actualiser la PWA pour chaque changement de code hors ligne.
4. Livrer un bilan court : réellement disponible, seulement préparé, encore bloqué, et preuves GitHub. Ne jamais annoncer « Cloud fonctionnel » sur la base de tests locaux.
5. Aucun déclenchement récurrent ou travail en arrière-plan sans nouvel accord explicite.

## Sprint P0 — contrôle de sauvegarde avant restauration (5 novembre 2026)

**Problème corrigé :** l'aperçu de restauration comparait déjà les quantités de fichiers locaux, mais il ne vérifiait pas si les relations clients ↔ tâches du fichier importé étaient cohérentes. Une sauvegarde structurellement recevable pouvait donc être importée avec un client manquant, un lien entre deux projets différents ou une date impossible, sans avertissement adapté.

**Fonction disponible sur `main` :**
- Le formulaire « Examiner la sauvegarde » réalise désormais **deux contrôles successifs**, sans écriture : validation du format et comparaison des volumes, puis audit des clients et tâches contenus dans le fichier.
- Le diagnostic détecte dates impossibles, statuts/priorités atypiques, doublons d'identifiants, titres absents, client lié introuvable, liens entre projets différents et collections locales mal structurées. Son résumé contient des **comptages et messages génériques**, jamais le nom du client ou le texte d'une tâche.
- Un ancien fichier dont le catalogue complet des projets est inconnu **n'est pas automatiquement accusé d'avoir des projets manquants**. La vérification des projets absents nécessite le catalogue local complet après restauration.
- Si le diagnostic signale au moins un problème, le bouton « Appliquer la restauration » est désactivé jusqu'à ce que l'utilisateur coche **« J'ai pris connaissance des anomalies »**. Le clic final demande toujours une confirmation distincte.
- Un nouvel examen, un changement de fichier/mot de passe ou une annulation réinitialise l'autorisation. Un clic déclenché autrement que par l'interface reste protégé par une validation explicite dans le gestionnaire d'événements.
- Une modification du stockage par un autre onglet entre l'examen et la confirmation continue d'annuler la restauration. Le mécanisme de retour arrière et la compatibilité des sauvegardes anciennes sont conservés.
- Aucun diagnostic ne modifie automatiquement les données, n'envoie de requête extérieure ou n'active l'accès Cloud. Mise en cache PWA **v84** ; identité « Simple & Humain » inchangée.

**Tests et preuves :** les tests unitaires de `tests/control-data-audit.test.mjs` incluent le cas client introuvable, l'incompatibilité de projet, une sauvegarde historique sans fiches Clients, les collections malformées, la non-divulgation de données et l'absence de modification du fichier. La recette Chromium `tests/control-ia-browser-smoke.mjs` inclut un fichier volontairement incohérent : son bouton doit être désactivé, les données inchangées, puis une autorisation explicite doit permettre de poursuivre sans déclencher la restauration ; l'annulation doit conserver l'état initial. **L'exécution complète de la recette sur le navigateur public n'a pas été confirmée.**

### Critères d'acceptation avant une vraie ouverture multi-appareil

| Contrôle | Critère |
| --- | --- |
| Export à partir du navigateur A | Fichier réellement téléchargé, non tronqué, identifiable, contenant les clients et liens clientId |
| Aperçu avant import dans le navigateur B | Quantités avant/après compréhensibles et anomalies de relations détectées sans aucune écriture |
| Sauvegarde chiffrée | Mot de passe erroné refusé, mot de passe correct accepté pour inspection ; jamais réaffiché |
| Anomalie volontaire | Bouton désactivé jusqu'à validation explicite, puis confirmation finale toujours demandée |
| Données modifiées pendant l'examen | Refus, absence d'écrasement silencieux |
| Échec d'écriture pendant la restauration | Retour arrière des valeurs écrites, ou indication explicite si l'écriture concurrente rend le retour arrière incertain |
| Rechargement et comparaison A/B | Comptage et liaisons client–projet–tâche identiques après restauration, avec aucun envoi externe |
| PWA / responsive | Fonctionnement hors ligne sur shell précaché, écrans 320 / 390 / 1440 px, navigation clavier |
| Données confidentielles | Aucune information personnelle ou conversation privée affichée dans les diagnostics de sauvegarde |
| Sécurité Cloud | Toujours désactivé jusqu'aux huit validations de `config/cloud.json` |

**Étape P0 encore ouverte :** conduire la vraie recette entre deux profils de navigateur indépendants, puis établir les comptes A/B du backend indépendant (RLS/JWT, révocation, suppression/export), uniquement après disponibilité du projet et accord explicite. Cette livraison améliore le transfert **manuel** de fichiers ; elle ne constitue ni la synchronisation Cloud ni l'import natif des conversations ChatGPT, Claude et Gemini.

## Sprint de fiabilité des données — CONTROL 11 (5 novembre 2026)

**Objectif P0 :** avant de créer des comptes, de synchroniser des clients ou de déléguer des tâches, signaler les incohérences existantes sans les masquer et sans écraser les données.

### Fonctionnalité effectivement développée dans l'application personnelle

- **État des données** : page dédiée `#/control/audit`, accessible depuis l'accueil (outils secondaires), les sauvegardes et les règles de sécurité. Charte « Simple & Humain » conservée.
- **Lecture seule** : aucune suppression, migration, validation automatique, connexion distante, collecte d'informations, activation de notifications ou action sur des comptes externes.
- Contrôle local des collections **projets, clients et tâches**, y compris des listes mal structurées sauvegardées dans `control-command-v1` avant normalisation des données de l'interface.
- Contrôles : identifiants absents ou en double, titres clients/tâches manquants, projets inexistants, liens tâche → client cassés ou incompatibles avec le projet, dates impossibles, statuts et priorités inhabituels.
- Présentation du nombre de fiches examinées, des **erreurs** et des **points à vérifier** ; les diagnostics sont limités à 120 entrées affichables pour rester lisibles, mais le total des problèmes est conservé. Les noms clients et détails des tâches **ne sont pas copiés** dans les messages de diagnostic.
- Chaque signalement renvoie vers la fiche client, la tâche ou la liste des projets. Une fiche client peut être mise en évidence par `#/control/clients?client=<id>`, sans changer la donnée.
- Les problèmes sont corrigés uniquement par l'utilisateur dans les formulaires existants, soumis aux validations et à la protection contre les modifications d'un autre onglet. Bouton **Relancer le diagnostic** après correction.
- Cache PWA **v83** incluant les nouveaux modules et les styles, pour consultation hors ligne dans le shell personnel.

### Recette et limites

| Test d'acceptation | Attendu |
| --- | --- |
| Une fiche client et sa tâche cohérente | Aucun faux signalement |
| Client supprimé dont la tâche conserve l'ancien `clientId` | Erreur + accès à la tâche pour retirer/corriger le lien |
| Une tâche d'un projet A liée à un client du projet B | Erreur sans modification automatique |
| Date `2026-02-30`, ancien statut et priorité inconnue | Signalement explicite ; aucun calcul ne les présente comme valides |
| Deux clients, tâches ou projets portant le même ID | Signaler la duplication sans fusion |
| Fichier local avec `clients` ou `actions` non-tableau | Erreur dans l'analyse des données persistées, même si l'interface charge un tableau vide |
| 135 anomalies | Total 135 ; affichage plafonné et avertissement sur les résultats non présentés |
| Lancement et relance de l'audit | Contenu de `control-command-v1` strictement inchangé |
| Navigation vers une fiche puis sauvegarde | Aucun écrasement non sollicité ; vérification inter-onglets |
| Version navigateur public | Contrôle réel nécessaire après publication GitHub Pages (non déduit des commits) |

**Tests ajoutés** : `tests/control-data-audit.test.mjs` vérifie les données valides, les incohérences, la non-divulgation de détails privés, l'absence de mutation, la limite d'affichage, les liens et la disponibilité hors ligne. La recette Chromium `tests/control-ia-browser-smoke.mjs` est étendue pour contrôler la route et l'absence de modification du stockage.

**Non couvert** : les permissions Supabase RLS, les mots de passe, les accès Google/ChatGPT/Claude/Gemini, les données des autres appareils ou un audit de cybersécurité. Le Cloud CONTROL reste désactivé et son projet serveur était noté `INACTIVE` au dernier relevé du 3 novembre. Toute activation nécessite les huit critères de sécurité de `config/cloud.json` et un accord exprès.

**Prochaine priorité P0 :** valider une sauvegarde/restauration réelle dans deux navigateurs, vérifier les données importées et préparer un protocole A/B de tests d'accès à deux comptes **sans activer** l'environnement multi-utilisateur avant les validations. Ensuite seulement : rôles, invitations et synchronisation officielle.

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
