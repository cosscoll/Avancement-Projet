## CONTROL 20 — Une amélioration visible par session (6 novembre 2026)

**Organisation validée :** [plan des prochaines sessions avec livrables visibles, critères de recette et contrôle public](docs/CONTROL_PLAN_SESSIONS_LIVRABLES_2026_11_06.md). Chaque session doit modifier un parcours réellement utilisable sur le site, et ne sera clôturée que si le commit sur `main`, les tests Node, la recette Chromium publique et GitHub Pages sont confirmés. Aucun travail récurrent ou service payant n'est déclenché automatiquement.

**Session 20 publiée sur le site :** depuis l'accueil CONTROL v6, **« + Nouvelle tâche »** ouvre directement le formulaire, avec focus sur le titre ; l'état vide affiche **« Créer ma première tâche »**. Charte préservée, affichage responsive, cache **PWA v96**.

**Preuves :** [762/762 tests réussis](https://github.com/cosscoll/Avancement-Projet/actions/runs/42194565344) ; [publication GitHub Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/42194758506) ; [test Chromium sur le site publié, bouton et focus réussis](https://github.com/cosscoll/Avancement-Projet/actions/runs/42194841844). [Cahier des charges v1.12](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md).

## 6 novembre 2026 — CONTROL 19 : transfert portable AES-GCM et JSON

**Recette réelle ajoutée :** export de données fictives par les formulaires CONTROL, puis restauration dans deux contextes Chromium indépendants de la source (stockages locaux séparés), une fois avec chiffrement AES-GCM et une fois sans chiffrement. Mauvais mot de passe refusé, aperçu non destructif, consentement explicite, concordance des tâches/agents/mémoires et conservation après actualisation.

**Résultat :** [Chromium isolé réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/42193248162), [test du site public réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/42193304921), [761/761 tests Node réussis](https://github.com/cosscoll/Avancement-Projet/actions/runs/42193248145) et [Pages publié](https://github.com/cosscoll/Avancement-Projet/actions/runs/42193247376). Le test Chromium vérifie 25 fichiers publics octet par octet. Ceci ne remplace pas un essai sur deux appareils physiques ni des permissions Cloud vérifiées. Aucun service Cloud ou automatisation activé.

[Cahier des charges v1.11](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md).

## 6 novembre 2026 — CONTROL 18 : recherche fiabilisée, suite qualité entièrement verte

**Livré sur `main` :** recherche universelle compatible avec les anciens états locaux sans fiches Clients ; accès discret à l'état de CONTROL Cloud depuis les fonctions supplémentaires de l'accueil (sans connexion ni activation) ; tests du parcours actuel mis à jour pour les interfaces CONTROL v6/v7 et les caches PWA. **PWA v95**.

**Qualité vérifiée : 761 tests Node réussis sur 761**, 0 échec — [preuve GitHub Actions](https://github.com/cosscoll/Avancement-Projet/actions/runs/42191435913). Les erreurs historiques de tests attendus sur une ancienne interface ne sont plus comptées comme régressions de l'interface validée. La véritable recette de transfert chiffré entre deux navigateurs indépendants reste à effectuer. Aucun quota limité ni automatisation activé.

[Cahier des charges v1.10](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md).

## 6 novembre 2026 — CONTROL 17 : protection des imports en cours et cache PWA v94

**Corrections livrées directement sur `main` :** dans Sauvegardes et le Studio IA, une analyse asynchrone ne peut plus rouvrir une ancienne prévisualisation après remplacement du fichier, modification du fournisseur, annulation ou démontage de l'écran. Les fichiers chiffrés restent examinés localement avant consentement ; aucune écriture automatique, aucune synchronisation native des comptes ChatGPT/Claude/Gemini, aucune activation Cloud ni automatisation.

**Tests :** nouveaux scénarios de courses de lecture/déchiffrement et de restauration dans `tests/control-backup-import-race.test.mjs` et `tests/control-ai-studio-import-race.test.mjs`. Corrections des attentes obsolètes de tests de transaction. La suite CI historique n'est pas entièrement verte ; la diffusion publique de v94 et un transfert réel entre deux profils distincts restent à valider.

[Cahier des charges v1.9](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md).

## 6 novembre 2026 — CONTROL 16 : première recette réelle de sauvegarde sur GitHub Pages

**Navigation et import effectivement testés en navigateur :** la version **v91** servie sur GitHub Pages ouvrait bien les pages de sauvegarde et de diagnostic. Dans un profil de navigateur isolé, la prévisualisation, l'annulation, l'import confirmé et la persistance après rechargement ont été observés avec **un projet, un client et une tâche fictifs**. Les liens client–projet–tâche et le filtre par client fonctionnaient ; le diagnostic affichait zéro anomalie. Une sauvegarde enveloppée contenant des projets avec le même ID a été refusée, même en tentant d'invoquer le bouton désactivé par code.

**Amélioration livrée sur `main` :** messages d'erreur de sauvegarde compréhensibles et prédéfinis (notamment lorsque le JSON n'est pas un export CONTROL) ; deux fixtures fictives et des régressions navigateur réutilisables ; cache **PWA v92**. **63 contrôles ciblés JS/syntaxe exécutés et réussis.** La diffusion publique de v92, le test d'un fichier exporté et importé dans **deux vrais profils indépendants** et les essais de sauvegarde chiffrée restent à confirmer.

**Documents :** [cahier des charges v1.8](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md) · [recette en vrai navigateur, résultats et limites](docs/CONTROL_RECETTE_NAVIGATEUR_2026_11_06.md). Aucune automatisation, Cloud ni dépense activée.

## 6 novembre 2026 — CONTROL 15 : restauration transactionnelle testable

**Correction P0 sur `main` :** les doublons de projets personnalisés et les identifiants entrant en collision avec le catalogue officiel bloquent désormais toute restauration. Le moteur `applyTransaction` remplace la succession d'écritures dans l'interface par une transaction locale vérifiable : contrôle de concurrence, validation des écritures, retour arrière conditionnel sans écraser les modifications d'un autre onglet.

**Recette de logique :** tests avec deux stockages indépendants, conservation du Studio IA des sauvegardes historiques, transfert clients/projets/tâches, erreur de quota, modification concurrente et panne d'initialisation. Les **61 contrôles de logique/syntaxe** exécutés après l'intégration ont réussi. La recette navigateur sur deux profils réels et le déploiement GitHub Pages restent à valider.

**État :** cahier des charges [v1.7](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md), cache PWA **v91**, Cloud toujours désactivé, aucun coût ni automatisation activés.

## 5 novembre 2026 — CONTROL 14 : fiabilité de l'aperçu des projets et restauration protégée

**Correction livrée sur `main` :** les sauvegardes comptabilisent désormais les projets personnalisés tels que CONTROL les stocke réellement, dans `hub.custom`. L'aperçu détecte aussi les suppressions, remplacements d'identifiants ou modifications de projets à quantité constante, avec résultats anonymisés. Les anciens `hub.projects` restent lisibles comme espaces historiques distincts. Un catalogue de référence qui n'a pas été chargé n'est plus considéré par erreur comme une liste complète de projets inexistants.

**Sécurité renforcée :** l'import d'un fichier avec une liste de projets personnalisés non valide est bloqué, même si l'utilisateur coche un avertissement. Les sauvegardes historiques ne contenant pas cette liste restent compatibles. La restauration reste manuelle, avec comparaison, protection des modifications inter-onglets et confirmation finale. Pas de Cloud ni d'automatisation activés.

**Qualité :** 5 tests supplémentaires sur la comparaison des projets et tests de restauration non contournable. Les 51 contrôles ciblés de sauvegarde, intégrité et contrat d'accès préparatoire passent dans le banc JS ; la recette navigateur inclut désormais un scénario montrant le compteur de projets importés. Cache **PWA v89**. Les tests Chromium sur le site effectivement publié restent **non exécutés**.

[Cahier des charges v1.6](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md) · [Contrat de sécurité avant multi-utilisateur](docs/CONTROL_SECURITY_AB_ACCEPTANCE_2026_11_05.md).

## 5 novembre 2026 — CONTROL 13 : session longue « transfert + sécurité »

**Bloc 1 — sauvegardes portables (appliqué sur main) :** le contrôle d'import vérifie maintenant le catalogue des projets de CONTROL et les projets personnalisés du fichier, y compris les identifiants manquants, dupliqués et listes invalides. Il n'invente pas de projet manquant lorsque le catalogue est indisponible. Guide repliable de transfert manuel entre appareils depuis Sauvegardes. Aucune suppression automatique et aucune synchronisation implicite. PWA **v87**.

**Bloc 2 — contrat de permissions (préparé, pas déployé) :** security/control-access-contract.js (rôles owner/admin/editor/viewer, isolation A/B, contrôle des mémoires et agents partagés, confidentialité des connexions IA, refus des automatisations) et tests/control-access-contract.test.mjs. Ce contrat est une **simulation testable** et n'autorise aucune requête réelle. [Dossier de sécurité multi-utilisateurs et matrice des 20 tests A/B](docs/CONTROL_SECURITY_AB_ACCEPTANCE_2026_11_05.md).

**Bloc 3 — qualité et organisation :** 32 contrôles ciblés du diagnostic + contrat + syntaxe passés. Cahier des charges [v1.5](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md) actualisé. Les tests de navigateur en conditions réelles, la publication GitHub Pages et le protocole A/B avec un serveur actif **restent non vérifiés**. Aucun quota limité, automatisation, service payant ou accès Cloud n'a été activé.

## 5 novembre 2026 — CONTROL 12 : restauration avec contrôle d'intégrité

**P0 livré sur `main` :** l'aperçu de restauration analyse désormais les liens clients–tâches avant toute écriture. Il indique le nombre d'erreurs et d'avertissements sans exposer les noms ou les titres des enregistrements. Les références à un client absent, les liens entre projets incompatibles, les dates incorrectes et les identifiants dupliqués sont signalés. Les anciennes sauvegardes sans catalogue de projets complet sont examinées sans faux diagnostic automatique de projet introuvable.

**Consentement explicite :** lorsqu'une anomalie existe, le bouton d'application reste désactivé tant que l'utilisateur n'a pas reconnu l'avertissement. Le formulaire redemande une confirmation distincte avant remplacement et continue de vérifier les modifications inter-onglets. L'aperçu, la réinitialisation et l'annulation n'altèrent pas le stockage local.

**Tests et limites :** scénarios de diagnostic ajoutés à `tests/control-data-audit.test.mjs` et scénario navigateur simulant une sauvegarde corrompue ajouté à `tests/control-ia-browser-smoke.mjs`. Cache PWA **v84**. Les tests JS ciblés passent ; la recette en navigateur réel, le transfert entre deux profils indépendants et la publication GitHub Pages restent à confirmer. Pas de synchronisation Cloud, d'automatisation ou de service payant.

[Cahier des charges v1.4](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md).

## 5 novembre 2026 — CONTROL 11 : contrôle de cohérence des données locales

**P0 ajouté sur `main` :** `#/control/audit` analyse en lecture seule les liens entre projets, clients et tâches. Il signale les ID absents/en double, projets introuvables, associations client–tâche incohérentes, dates impossibles, statuts anciens et listes locales mal structurées. Chaque constat ouvre la fiche à vérifier ; **aucune donnée n'est corrigée ou supprimée automatiquement**. L'accès se fait depuis l'accueil, Sauvegardes et Règles et sécurité.

**Transparence :** les messages n'incluent pas les noms de clients ni les intitulés des tâches. Les totaux restent exhaustifs, l'affichage est plafonné à 120 signalements. Le diagnostic inspecte les collections persistées avant leur normalisation à l'ouverture, pour ne pas cacher des données de sauvegarde malformées. La charte « Simple & Humain » et le modèle de stockage local sont inchangés.

**Recette :** `tests/control-data-audit.test.mjs`, adaptation de `tests/control-ia-browser-smoke.mjs` et mise en cache PWA `v83`. Les contrôles ciblés ont été exécutés dans un environnement JS ; la recette visuelle et la publication sur GitHub Pages restent à vérifier séparément.

[Cahier des charges v1.3](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md) · aucun service payant, automatisation, authentification ou Cloud activé.

## 5 novembre 2026 — CONTROL 10 : vrai lien Clients ↔ Tâches

**Développement sur `main` :** les tâches peuvent désormais conserver l'identifiant d'une fiche client existante (et pas seulement le projet). Depuis Clients, « Créer une tâche » préremplit l'organisation, son projet et sa prochaine étape ; la tâche n'est créée qu'après validation. Depuis la fiche client, les tâches associées sont visibles, avec liens vers chacune et vue filtrée regroupant tâches actives et terminées. La recherche des tâches et la recherche universelle reconnaissent le client lié.

**Protection des données :** l'association ne peut référencer un client inexistant ou un client d'un autre projet. Une modification de projet ou suppression de fiche dissocie uniquement les tâches devenues incompatibles après confirmation, sans effacer les tâches. Les écritures restent transactionnelles, avec détection inter-onglets et prise en compte des sauvegardes existantes. **Aucun accès Cloud ou connecteur externe activé.**

**Tests :** nouvelles vérifications de relation client–tâche dans `tests/control-clients.test.mjs`, contrôle de la syntaxe du centre de commande et de la version PWA `v82`. Ces contrôles du code ne remplacent pas la recette sur le site réellement déployé. [Cahier des charges v1.2](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md).

## 5 novembre 2026 — CONTROL 09 : suivi client local relié aux projets

**Fonction du cahier des charges développée sur `main` :** page `#/control/clients` pour suivre les organisations clientes, leur statut (Prospect / En cours / Terminé), le projet associé et une prochaine étape datée. Création, recherche, filtres, édition et suppression confirmée. Accès depuis la zone avancée de l'accueil, le centre de pilotage et les projets. Un bouton ouvre la création de tâche avec le projet déjà sélectionné ; aucun rappel ni tâche n'est créé automatiquement.

**Données et sécurité :** les fiches sont uniquement dans `control-command-v1` sur cet appareil ; noms d'organisations non confidentiels recommandés, pas de contacts privés. Validation des dates, projets, statuts, liens HTTPS et références sensibles. Modifications transactionnelles avec détection de conflit inter-onglets. Les nouvelles fiches sont incluses dans les exports existants et comptées dans l'aperçu de restauration ; les anciennes sauvegardes restent compatibles.

**Vérification :** `tests/control-clients.test.mjs` (règles, navigation, filtres, sauvegarde, sécurité, cache) ; ajout d'un test à `tests/control-backup-review.test.mjs`. Les 8 cas dédiés ont été exécutés dans un environnement JS de contrôle ; la recette navigateur réelle et la distribution GitHub Pages ne sont pas encore confirmées. PWA `v81`.

**Cahier mis à jour :** [État des fonctionnalités, conditions de validation et priorités restantes](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md). Aucun compte Cloud, connecteur privé, automatisation ou dépense n'a été activé.

## 5 novembre 2026 — CONTROL 08 : charte « Simple & Humain » appliquée

**Identité validée appliquée à l'application existante sur `main` :** fond crème, blanc et pêche, orange terracotta pour les actions, texte anthracite, typographie Poppins (fallback hors ligne), logo « C » orange et pictogrammes/états harmonisés. La feuille centrale `assets/control-brand-simple-humain.css` intervient après les CSS historiques pour homogénéiser accueil, projets, tâches, assistants, recherche et présentation Cloud. Les structures, données locales, routes et formulaires ont été préservés.

**PWA :** manifeste crème, nouveau favicon/logo SVG, cache `v80` et style ajouté au shell hors ligne. Les icônes PNG historiques restent présentes en secours sur certaines installations Android et ne sont pas présentées comme ayant été remplacées. La collaboration Cloud reste désactivée et aucune automatisation ni dépense n'a été engagée.

**Contrôles :** `tests/control-brand-simple-humain.test.mjs` et mise à jour des tests de cache existants. [Dossier de charte graphique appliquée](docs/CONTROL_CHARTE_SIMPLE_HUMAIN_2026_11_05.md). La recette visuelle réelle sur Pages doit être confirmée séparément de l'enregistrement du code.

## 3 novembre 2026 — CONTROL 07 : cohérence visuelle de toute l'application personnelle

**Livraison sur `main` :** la charte de l'accueil CONTROL 06 (blanc, bleu foncé, contenu centré et quatre destinations visibles) s'applique maintenant aux **écrans internes** de l'application personnelle. L'ancienne barre latérale sombre et l'ancien pied de page mobile n'apparaissent plus lors du passage vers « À traiter », un projet, « Équipe », « Assistants » ou les autres outils. Un en-tête compact remplace ces menus ; sur mobile, les quatre destinations restent visibles en bas de l'écran.

**Navigation métier :** « Projets » ouvre désormais `#/projects`, véritable vue dédiée à la recherche et à la reprise de projets (sans les compteurs ni le bloc de demande de l'accueil). Dans un projet, les sections principales s'appellent « Mes IA », « Conversations », « Suivi » et « Documents & liens » ; les sept fonctions secondaires sont repliées tant qu'elles ne sont pas nécessaires. Un bouton **+ Tâche** permet d'ouvrir directement le formulaire de création sans passer par le moteur de recherche.

**Précautions :** les contenus de tâches, missions, projets et assistants n'ont pas été supprimés ni migrés. Ce changement concerne la navigation et la présentation, **pas** une activation du Cloud, de la collaboration ni des connecteurs IA. Les réglages et les parcours secondaires restent accessibles.

**Recette :** `tests/control-workspace-v7.test.mjs` couvre la structure, les liens et les protections. La recette navigateur `tests/control-ia-browser-smoke.mjs` a été adaptée pour vérifier la transition entre les pages, le formulaire de tâche, les projets et la navigation fixe mobile. Cache PWA v79. Ces tests doivent encore réussir sur la version réellement déployée avant de qualifier le rendu de validé.

## 3 novembre 2026 — CONTROL 06 : accueil conforme à la maquette entrepreneur

**Changement visuel réel sur `main` :** suppression, sur l'accueil personnel seulement, de l'ancienne grande bannière bleue, des cinq tuiles et du rail latéral sombre. La page est désormais centrée, sobre et compacte : logo CONTROL et « Mon entreprise », « Bonjour. », trois statistiques issues de données locales (urgences / à faire / en attente), zone « Demander à CONTROL », trois priorités cliquables et quatre destinations Accueil / Projets / Équipe / Assistants. Le bandeau secondaire « Mes projets » est replié par défaut mais s'ouvre depuis la navigation, avec conservation de la recherche et des formulaires de création. Les outils avancés restent accessibles dans un volet dédié. Le reste de l'application n'a pas été remplacé par une maquette statique.

**Honnêteté produit :** « Demander à CONTROL » ouvre le moteur de recherche de fonctionnalités existant : ce n'est pas encore une exécution par un agent IA relié aux services externes. Le bouton Équipe ouvre une page expliquant que les comptes collaboratifs sont en préparation ; aucune invitation n'est envoyée. Les trois indicateurs proviennent uniquement des données présentes dans le navigateur et affichent « — » si elles sont illisibles. Aucune donnée fictive du modèle n'est injectée.

**Contrôles ajoutés :** `tests/control-home-v6.test.mjs` et adaptation de la recette Chromium publique `tests/control-ia-browser-smoke.mjs` pour la nouvelle structure, l'ouverture des projets, le responsive 320/390 px, les assistants et la sauvegarde. Cache PWA `v77`. Une réussite du code ne vaut pas preuve visuelle de déploiement tant que la recette sur la version publique n'a pas tourné.

## 3 novembre 2026 — CONTROL : tâches modifiables et parcours quotidien simplifié

**Sur `main` :** l'écran **À traiter** dispose maintenant d'une recherche, de filtres, d'un formulaire d'édition par tâche, des actions Terminer/Rouvrir et de liens directs depuis les priorités du tableau de bord. La création est repliable ; les sources externes secondaires n'encombrent plus l'écran. Les anciennes données locales ne sont pas migrées ni supprimées.

**Sécurité des actions locales :** les modifications conservent la vérification des conflits entre onglets ; dates, priorités, statuts, projets et liens HTTPS sont validés. Sans succès d'enregistrement, l'application ne confirme pas l'action. Les données externes ne sont pas présentées comme synchronisées.

**Recette et limites :** tests de règles dans `tests/control-task-workflow.test.mjs` et de liens directs dans `tests/control-day-brief.test.mjs` ; syntaxe vérifiée séparément. Cache PWA `v76`. Aucun compte Cloud, collaboration multi-utilisateurs, service tiers payant ni automatisation activé. [Cahier des charges TPE et état livré](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md).

## 3 novembre 2026 — CONTROL 05 : priorités d'un entrepreneur et cahier des charges TPE

**Modifications sur `main` :** l'accueil personnel affiche désormais les actions en retard, celles prévues aujourd'hui et les missions à vérifier à partir des enregistrements locaux existants, avec les trois éléments les plus importants, un raccourci direct vers « Créer une tâche » et un état vide explicite. Les titres du tableau de bord et de la navigation ont été simplifiés. Les données malformées affichent un avertissement plutôt que des chiffres artificiels ; les titres de tâches sont échappés dans l'interface.

**Périmètre exact :** cette vue ne lit pas Gmail, les notifications privées des IA, les comptes des salariés ni une base Cloud. Aucune connexion ni automatisation n'a été activée, et aucune donnée existante n'a été migrée.

**Cahier des charges priorisé :** [CONTROL — parcours entrepreneur/TPE, sécurité, collaboration, CRM léger, intégrations et assistants](docs/CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md). Ajout d'un test Node dédié au calcul des priorités, aux dates, aux données invalides et à l'échappement HTML. Cache PWA passé à `v73` pour inclure les nouvelles ressources.

**Recette :** le commit de code ne vaut pas encore validation d'une utilisation réelle en équipe : accès Cloud, authentification multi-utilisateurs et intégrations restent bloqués tant que les contrôles de sécurité correspondants n'ont pas réussi. Les résultats CI et la version déployée doivent être vérifiés séparément.

## 3 novembre 2026 — CONTROL 04 : refonte visible de l'accueil

**Livraison réelle sur `main` :** refonte perceptible immédiatement de la page d'accueil personnelle, et non seulement un ajout interne. Le bandeau passe de « Interface V3 » à **« Vue 04 · Nouveau »**. La nouvelle présentation comprend une typographie et une hiérarchie revues, un grand panneau de recherche bleu foncé, une grille de cinq raccourcis distincts, un bloc « Reprendre mon travail » et trois indicateurs calculés depuis les données *locales* (projets accessibles, actions à traiter, agents créés sur cet appareil). Si les données sont illisibles, le compteur affiche « — » sans annoncer de faux chiffres.

**Éléments préservés :** toutes les routes des outils, la recherche de projet, la création d'espace, le panneau des nouveautés et les anciennes sauvegardes. Aucune donnée utilisateur modifiée lors de l'ouverture du tableau de bord. Aucun Cloud, IA externe, automatisation ou dépense n'a été activé.

**Preuves de recette :** 659 tests Node réussis sur 659 : https://github.com/cosscoll/Avancement-Projet/actions/runs/41646604316. Chromium sur la **version publique déployée**, rendu CONTROL 04, clic sur agents et vues 320/390 px : https://github.com/cosscoll/Avancement-Projet/actions/runs/41646671611. Déploiement GitHub Pages du code : https://github.com/cosscoll/Avancement-Projet/actions/runs/41646603054. Cache hors ligne porté en `v72` pour invalider la présentation ancienne ; en cas de PWA déjà ouverte, utiliser la notification de mise à jour ou recharger.

**Prochaines limites à traiter :** tests manuels sur un téléphone réel et poursuite de la refonte visuelle des écrans intérieurs, sans présenter les connexions externes comme actives.

## CONTROL — Brouillons sécurisés des agents, 3 novembre 2026

Un message peut désormais être rédigé sans charger les ~180 Mo du modèle IA expérimental. La saisie non envoyée est conservée par agent et par discussion dans l'onglet ouvert, même après rechargement ; l'envoi reste bloqué tant que le modèle n'est pas chargé. Les brouillons ne sont pas synchronisés ni inclus dans les sauvegardes. Cache PWA `v71`, tests Node et Chromium ajoutés. Les services Cloud et connexions externes restent désactivés.

## Sprint CONTROL — sécurité des sauvegardes et accès directs (2 novembre 2026)

- La sauvegarde unifiée à **quatre espaces** peut être chiffrée AES-GCM avec une phrase de passe. Les métadonnées cryptographiques sont contrôlées avant déchiffrement, les fichiers altérés et mots de passe incorrects sont refusés, et les champs de mot de passe sont vidés après la soumission.
- Sur l'accueil, deux nouveaux raccourcis : **Mes agents IA** et **Sauvegarder mes données**. La recherche d'outils présente la création d'agents locaux sans import obligatoire.
- Preuves : [642/642 tests Node](https://github.com/cosscoll/Avancement-Projet/actions/runs/41428061296), [Chromium](https://github.com/cosscoll/Avancement-Projet/actions/runs/41428061267), [GitHub Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/41428061271). Les tests Chromium incluent le chiffrement d'une sauvegarde avec agents et mémoires ; le contrôle des clics directs est ajouté ensuite.
- Cloud `enabled:false`, aucune intégration IA externe, aucune automatisation, aucune consommation API payante.

## Statut vérifié — 2 novembre 2026

**CONTROL personnel :** disponible sur [GitHub Pages](https://cosscoll.github.io/Avancement-Projet/). Le Studio « Comptes IA & agents » gère localement des mémoires approuvées, des assistants modifiables, leurs fils de discussion et des conversations exportées facultativement. **Aucun compte ChatGPT, Claude ou Gemini n'est connecté** ; aucune récupération native de leurs historiques. L'IA locale est expérimentale et ne se charge qu'après action de l'utilisateur.

**Fiabilité des sauvegardes :** la sauvegarde principale transporte désormais les données locales du Studio IA si elles existent, en plus des projets, actions et brouillons. Restauration prévisualisée, détection des éditions concurrentes, refus des références ou formats invalides ; anciens fichiers sans Studio IA compatibles et non destructifs pour les agents existants. Le Studio conserve également sa propre sauvegarde et restauration indépendantes.

**Preuves contrôlées :** [637/637 tests Node](https://github.com/cosscoll/Avancement-Projet/actions/runs/41426100486), [parcours Chromium complet](https://github.com/cosscoll/Avancement-Projet/actions/runs/41425742193), [publication GitHub Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/41426099535).

**Cloud CONTROL :** projet Supabase dédié constaté `INACTIVE` lors du contrôle en lecture seule du 2 novembre ; `config/cloud.json.enabled=false`. Les huit conditions d'authentification et sécurité sont encore non validées ; aucun compte Cloud ouvert. Les sessions A/B JWT/PostgREST et la synchronisation réelle entre appareils n'ont pas été démontrées. **Aucune automatisation ChatGPT, aucun quota Work/Codex ni API payante activés.**

**Organisation des prochaines sessions :** [plan de travail manuel, limites et critères de recette](docs/CONTROL_IA_PLAN_SESSIONS_MANUELLES.md). Les rubriques historiques V66/V65 ci-dessous documentent l'évolution antérieure et ne remplacent pas ce statut.

# CONTROL — Centre de pilotage des projets

## Avertissement multi-onglets — V66 (23 octobre 2026)

CONTROL signale maintenant les modifications de projets, tâches ou brouillons effectuées dans un autre onglet, y compris l'effacement complet du stockage. Un bandeau persistant propose **Recharger les données**, après confirmation explicite pour protéger les saisies non enregistrées. Aucun rechargement automatique, aucune activation Cloud ou automatisation.

Le code et les tests ciblés sont sur `main` ; les tests Chromium sur GitHub Pages et la suite GitHub Actions complète restent non confirmés pour le SHA actuel. [Protocole de recette](docs/CONTROL_LOCAL_MULTI_ONGLETS.md).


## Sauvegarde fiable entre plusieurs onglets — V65 (23 octobre 2026)

L'export local compare maintenant le contenu chargé dans l'onglet avec la version effectivement enregistrée. Il photographie les trois espaces de CONTROL (centre de commande, projets et brouillons d'automatisations), puis vérifie qu'ils n'ont pas changé **après tout chiffrement**, avant de télécharger le fichier. Si une autre fenêtre a écrit entre-temps, la sauvegarde est refusée avec un message explicite : le fichier ne doit pas masquer de modifications plus récentes. Les exports et imports ne créent aucun compte ni aucune automatisation.

Les contrôles ciblés de sauvegarde et de stockage passent en exécution JavaScript isolée ; la CI Node native, le navigateur public et les essais multi-onglets réels restent à confirmer. [Protocole de recette](docs/CONTROL_LOCAL_MULTI_ONGLETS.md).


## Audit P0 du Cloud CONTROL (23 octobre 2026)

L'infrastructure Supabase indépendante est désormais **vérifiée en lecture seule** : organisation sur offre Free, projet `ACTIVE_HEALTHY`, six tables RLS, 22 politiques d'isolation par propriétaire et aucune permission de données pour les accès anonymes. Ce constat **ne valide pas les comptes** : les essais avec deux vrais utilisateurs, leurs JWT, la synchronisation et le cycle de vie des comptes restent non réalisés. `config/cloud.json.enabled=false` et aucune dépense n'a été engagée. [Audit et prochaines recettes](docs/CONTROL_CLOUD_SECURITE_AUDIT_2026_10_23.md).


## Protection contre l’écrasement des données entre onglets (23 octobre 2026)

Les trois magasins locaux de CONTROL (projets, actions/missions/calendrier et brouillons d’automatisations) vérifient désormais que la version lue au chargement n’a pas changé avant de sauvegarder. Si un autre onglet a enregistré entre-temps, l’écriture est **refusée**, les mutations sont annulées localement et CONTROL demande de recharger. Cette prévention couvre les conflits séquentiels, **pas une transaction atomique ni une synchronisation Cloud** ; la validation serveur et les tests Auth A/B restent obligatoires. Tests ciblés : `tests/control-local-tab-isolation.test.mjs` et `tests/control-cross-tab-stores.test.mjs`.


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
