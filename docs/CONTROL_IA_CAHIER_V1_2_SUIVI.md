## Sprint — contexte des agents contrôlable (2 novembre 2026)

- Remplacement de la troncature de prompt globale par un budget distinct pour rôle, mémoires approuvées et archives historiques.
- Indication exacte du nombre de mémoires et archives effectivement incluses ou omises dans le prompt, avec aperçu du texte transmis au modèle local ; isolation des mémoires d'un autre projet.
- Les archives importées sont présentées comme données historiques non fiables, non comme instructions ; cela ne garantit pas la résistance totale d'un modèle expérimental aux attaques par injection.
- Arrêt d'une génération en cours si une mémoire est révoquée/corrigée ou si une conversation source est supprimée.
- Correction du texte des sauvegardes Studio : la sauvegarde générale peut les inclure et les chiffrer, l'export indépendant reste en clair.
- Cloud toujours désactivé, aucun fournisseur IA externe relié, aucune API payante.

## Sprint S2 — sûreté des sauvegardes chiffrées (2 novembre 2026)

La recette de sauvegarde unifiée est étendue à l'enveloppe chiffrée AES-GCM V2, au refus d'un mauvais mot de passe et à la validation des métadonnées cryptographiques. Les champs contenant des mots de passe sont effacés après soumission. Les anciens exports clairs restent acceptés. Les agents et mémoires du Studio IA sont inclus seulement lorsque leurs données locales existent, sans accès fournisseur et sans synchronisation Cloud.

## Sprint — sauvegarde unifiée du Studio IA, rétrocompatibilité (2 novembre 2026)

Le périmètre de la sauvegarde générale CONTROL est étendu au quatrième magasin `control-ai-studio-v1`, lorsqu'il existe. Les nouvelles sauvegardes (chiffrées AES-GCM si l'utilisateur définit un mot de passe, sinon JSON clair) transportent les agents locaux, mémoires, discussions et conversations importées. Le stockage Studio est vérifié avant export, chaque magasin est contrôlé contre les changements entre onglets avant téléchargement et après chiffrement.

La comparaison et le consentement à la restauration montrent des totaux Studio sans dévoiler le contenu. Les anciennes sauvegardes à trois espaces restent acceptées et laissent le Studio IA existant intact. L'échec d'un remplacement amorce le mécanisme de retour arrière déjà présent, sans prétendre garantir une transaction atomique multi-onglets.

Le panneau de sauvegarde indépendante du Studio reste disponible comme outil de récupération. Aucune synchronisation fournisseur ni activation Cloud.

## Sprint — récupération indépendante du Studio IA (2 novembre 2026)

**Risque évité :** les conversations locales, mémoires et agents de `control-ai-studio-v1` étaient absents de la sauvegarde générale de CONTROL. La sauvegarde globale existante reste volontairement sur trois magasins pour protéger ses anciens exports ; un encart avertit désormais clairement de ce manque avec un accès direct au Studio.

**Livraison locale :** export JSON du Studio, restauration indépendante avec validation stricte du schéma V1, intégrité des références, isolation des mémoires par projet, limites de taille, prévisualisation de quatre compteurs, annulation, confirmation de remplacement et refus si un autre onglet modifie les données. Une restauration n'active aucun compte ni API, et le fichier est non chiffré (à protéger).

**Limites restantes :** deux sauvegardes distinctes sont encore nécessaires, l'opération n'est pas une transaction entre onglets, et aucun accès Cloud ni historique natif n'est synchronisé. L'unification chiffrée des quatre magasins reste un chantier de fiabilité non terminé.

## Sprint Cloud P0 — garde d'ouverture et statut réel (2 novembre 2026)

- **Constat en lecture seule du projet Supabase CONTROL Cloud : statut `INACTIVE` au 2 novembre 2026.** Les notes d'octobre indiquant `ACTIVE_HEALTHY` sont historiques et ne valent pas preuve actuelle de disponibilité. Aucun réveil, changement de forfait, dépense ou compte test n'a été lancé.
- **Code livré :** huit barrières explicites dans `safeClientConfig`, toutes exigées avant de charger le SDK Cloud. Elles couvrent l'activité de l'instance, deux vraies identités Auth, le test JWT/PostgREST RLS A/B, les sessions et leur révocation, la suppression de compte, le retour PKCE, deux appareils et l'approbation d'ouverture.
- **Parcours utilisateur :** `app.html` affiche la situation actuelle, chaque contrôle non validé, la date d'observation Supabase et le fait que les déclarations de configuration ne remplacent pas une recette réelle. `config/cloud.json.enabled=false` demeure inchangé et les huit indicateurs restent `false`.
- **Limite :** barrière préventive côté navigateur, pas preuve cryptographique ou audit autonome des 8 contrôles ; même huit booléens `true` ne dispensent pas de l'autorisation du propriétaire ni de la recette de sécurité indépendante.
- **Blocage pour recette complète :** infrastructure Supabase inactive et absence de deux sessions Auth de recette validées ; ne pas lever les barrières avant ces vérifications.
- **Règle :** aucune automatisation ou API payante réactivée.

## Sprint de développement — édition des agents et mémoire (2 novembre 2026)

**Livré dans CONTROL personnel / V69 :** correction de mémoires approuvées avec versionnement (identifiant et périmètre conservés), modification du nom et des instructions d'un agent, affectation ou révocation de plusieurs mémoires et conversations sources, création d'agent sans importer de fichier, maintien de ses discussions existantes. Les mémoires d'un autre projet sont rejetées lors de l'édition ; les données restent locales. Le parcours de navigation et les modifications ont été ajoutés aux recettes Chromium ; tests de cœur fonctionnel : Node.js.

**Critères concernés :** `EXT-AGT-AC1`, `EXT-AGT-AC2`, `EXT-AGT-AC3` (progrès local seulement). Leur statut global reste **non vérifié** tant que l'authentification CONTROL et l'isolation de deux comptes réels, les autorisations fournisseurs et les scénarios multi-appareils n'ont pas été validés. Aucune activation OAuth, aucune dépense API, aucun agent planifié.

**À développer ensuite :** socle Auth Cloud A/B sur base isolée, sessions et suppression de compte, gestion des clients OAuth officiellement compatibles, puis API de conversation consentie ; l'accès natif aux anciens historiques reste subordonné aux API réellement offertes.

## Connexions directes aux comptes IA — priorité UX du 2 novembre 2026

**Demande utilisateur :** ne pas demander d'archives à importer pour utiliser le studio ; proposer une véritable connexion officielle de ChatGPT, Claude et Gemini. L'import manuel n'est plus le parcours principal et demeure seulement un recours facultatif.

**Première livraison UX :** la page `#/control/aistudio` ouvre désormais l'onglet « Connexions IA », montre les trois fournisseurs, le statut réel « Non connecté » et les modalités officielles ; les agents locaux sont accessibles sans archive. [Commit UX](https://github.com/cosscoll/Avancement-Projet/commit/0423703c4d206832fbe1babce908448f3c049386).

**Contrat fonctionnel à réaliser après l'identité CONTROL :** OAuth/OIDC officiel uniquement lorsqu'un client et des autorisations compatibles sont enregistrés, contrôle PKCE/state/nonce et vérification du callback, stockage de jetons hors GitHub Pages et hors données publiques, gestion des scopes, liste de connexions réellement vérifiées, déconnexion et révocation testées. Aucune simulation de connexion, aucun mot de passe/cookie Claude.ai, aucune récupération de conversations privées via scraping.

**Limitations non contournables :** Sign in with ChatGPT ne fournit pas les anciennes conversations/mémoires ; les abonnements Claude.ai ne sont pas déléguables directement à un site tiers ; Google OAuth pour Gemini API ne donne pas l'ancien historique de Gemini Apps. Les futures conversations créées à l'intérieur de CONTROL pourront être stockées par CONTROL si les API officielles, le consentement et les limites de coûts sont validés.

**État :** conception et écran UX réalisés ; **0 compte réellement lié**, **0 autorisation OAuth active**, **0 ancienne conversation synchronisée**. Le cahier conserve ses 10 nouveaux critères EXT non vérifiés, Cloud `enabled:false`, aucune dépense ni quota Work/Codex autorisé.

Sources officielles : https://developers.openai.com/siwc/website · https://code.claude.com/docs/en/legal-and-compliance · https://ai.google.dev/gemini-api/docs/oauth.

# CONTROL IA — Suivi du cahier V1.2 (index public, contenu privé)

**Mise à jour : 23 octobre 2026.** Ce fichier est uniquement un **suivi public expurgé**. Le cahier des charges fonctionnel et technique V1.2 intégral, conservant la V1.1 et ses annexes, se trouve en bibliothèque personnelle privée :

`/CONTROL-IA/CONTROL_IA_Cahier_des_charges_V1_2_PRIVE.md`

**Ne pas transférer le contenu complet du cahier privé dans GitHub public, ni publier les conversations, clés, comptes, documents et données privés.** Les identifiants et liens de test déjà publics peuvent être suivis dans ce dépôt.

## Reprise locale sûre — V66 : notifier les changements entre onglets (23 octobre 2026)

- **Amélioration utilisable :** un panneau persistant et accessible prévient si les projets, actions ou brouillons d'automatisation ont changé dans un autre onglet. La notification n'effectue aucune écriture ni rechargement automatique.
- **Protection du brouillon :** recharger nécessite une confirmation explicite qui prévient de la perte possible des formulaires non enregistrés ; ignorer le message n'autorise pas les modifications périmées grâce aux garde-fous V64.
- **Cas particulier testé :** `localStorage.clear()` avec clé et valeurs nulles est reconnu.
- **Preuve ciblée :** 5 tests de notification et 5 tests du stockage des projets exécutés avec succès en JavaScript isolé ; le contrôle régressif du shell PWA V66 a également été passé. Une vérification Chromium figure dans le script de smoke, mais **son exécution réelle n'est pas confirmée**.
- **Statut du cahier :** IMP-10 reste `in_code`, 0/3 critères IMP-10 pleinement acceptés. Pas de modification des 3/36 critères historiques validés ; Cloud `enabled:false`.

[Recette multi-onglets et limitations](CONTROL_LOCAL_MULTI_ONGLETS.md)

## Fiabilité P0 — export de sauvegardes V65 (23 octobre 2026)

**Traçabilité du programme des dix améliorations :** `IMP-10` (Reprise et récupération fiable des travaux) passe de `planned` à **`in_code`** car son volet prévention des écrasements locaux et sauvegardes cohérentes a du code et des tests. **0/3 critères IMP-10 acceptés** : la reprise de mission par checkpoint, une coordination réellement atomique et les preuves d'échec restent incomplètes. Cela ne modifie ni les 3/36 critères historiques certifiés ni les 0/10 améliorations opérationnelles.



- **Défaut corrigé :** un export lancé dans un onglet périmé pouvait recopier en mémoire d'anciennes actions ou missions, même si un autre onglet avait déjà enregistré une version plus récente.
- **Protection :** comparaison avec la dernière version chargée du centre de commande, photographie des **trois magasins locaux**, puis recontrôle après la préparation et après tout chiffrement asynchrone. L'export est annulé si un changement intervient avant la création du fichier.
- **Information utilisateur :** la page Sauvegardes explique pourquoi une exportation peut être refusée et demande un rechargement.
- **Vérification ciblée :** 7 nouveaux scénarios pour l'export (dont le véritable gestionnaire asynchrone), et 48 contrôles de régression centrés sur les sauvegardes, la corruption, le stockage entre onglets et la récupération exécutés avec succès en JavaScript isolé. CI native complète et navigateur public non encore vérifiés sur le SHA final.
- **Limite :** une photographie de `localStorage` ne fournit pas une transaction atomique entre tous les onglets ; les tests manuels multi-onglets et la future synchronisation Cloud demeurent nécessaires. Les 36 critères historiques et 30 critères IMP conservent leurs statuts antérieurs ; aucune recette supplémentaire certifiée.

[Protocole de recette multi-onglets et export](CONTROL_LOCAL_MULTI_ONGLETS.md)

## Audit P0 des comptes CONTROL Cloud — 23 octobre 2026

**Infrastructure indépendante vérifiée en lecture seule, sans création de compte ni dépense :** le projet `CONTROL Cloud` est `ACTIVE_HEALTHY`, son organisation est au forfait `Free`, six tables ont leur RLS activée, 22 politiques de propriétaire sont présentes, les quatre privilèges de données pour le rôle anonyme sont refusés sur les six tables et la clé étrangère composite protège le rattachement d'un élément au projet du même propriétaire. L'advisor Supabase ne signale aucune alerte et aucune fonction RPC `public` n'est exposée.

**Ancien blocage levé :** il n'est plus nécessaire de créer une nouvelle infrastructure CONTROL pour commencer la validation des politiques déjà déployées. **Blocage P0 restant :** deux vraies sessions Supabase Auth avec JWT distincts, isolation PostgREST A/B réelle, synchronisation entre appareils, révocation et suppression du compte, vérifications physiques et autorisation explicite avant activation de `config/cloud.json`.

Le plan de recette réelle existant `tests/control-cloud-real-auth-e2e.mjs` reste non exécuté. Les exigences `ACC-01..04` ne sont donc **pas acceptées**. [Rapport de sécurité du 23 octobre](CONTROL_CLOUD_SECURITE_AUDIT_2026_10_23.md) · [Procédure Cloud et historique](CONTROL_CLOUD_SAAS.md).

## Correction vérifiée de nomenclature

- **22 tickets de développement historiques** `BACK-001` → `BACK-022`.
- **42 scénarios de recette** `T-01` → `T-42`, provenant de deux sections du document original.
- **9 capacités historiques et 36 critères** dans [`data/control-ia-delivery.json`](../data/control-ia-delivery.json).
- **10 améliorations et 30 critères supplémentaires** dans [`data/control-ia-strategy.json`](../data/control-ia-strategy.json).

Les anciennes mentions « 42 tickets BACK » étaient incorrectes : il s'agit bien de **42 scénarios T**, pas de 42 tickets de développement.

Le registre machine consultable [`data/control-ia-requirements.json`](../data/control-ia-requirements.json) relie chacun des 22 tickets à sa capacité principale et à ses recettes `T`, avec liens inverses vérifiés, états distincts et preuves publiques minimales. Il **ne contient pas** le texte du cahier privé.


### Réconciliation des références historiques — 21 octobre 2026

Le registre des 9 capacités comportait **19 anciennes étiquettes** `BACK-023` à `BACK-042` (numérotation non continue) qui **n'appartiennent pas** au cahier canonique de 22 tickets. Elles provoquaient une divergence entre les fiches de capacités et la liste officielle.

Ces 19 étiquettes sont maintenant conservées **sans perte**, dans `legacy_unmapped_ticket_refs` de la capacité concernée. En parallèle, `source_tickets` ne contient plus que des identifiants existants `BACK-001` à `BACK-022`. Les capacités Agenda et Rappels n'ont pas de ticket canonique démontré dans leur ancien lien ; leurs historiques sont conservés, mais aucun ticket de remplacement n'a été inventé et aucune preuve de validation ajoutée.

Le validateur `scripts/control-ia-requirements.mjs` contrôle désormais les références `source_tickets`, l'unicité des anciennes étiquettes, l'absence de chevauchement avec les tickets canoniques et le nombre conservé. **16 tests** de recette de la nomenclature (12 précédents + 4 nouveaux) protègent ces règles.

**Inchangé :** 22 tickets officiels, 42 recettes, 9 capacités, 36 critères historiques (dont 3 validés), 10 améliorations et 30 critères supplémentaires. L'état des comptes Cloud reste non vérifié et la configuration Cloud reste désactivée.

## État constaté au lancement de V1.2

| Catégorie | Enregistré | Validation complète prouvée |
|---|---:|---:|
| Capacités historiques | 9 | 0 opérationnelle |
| Critères historiques | 36 | 3 validés |
| Tickets BACK | 22 | 0 ticket clos avec preuve exhaustive |
| Recettes T | 42 | 0 recette intégrale certifiée |
| Recettes T avec preuve partielle/simulée | 5 | Non équivalentes à une recette réelle |
| Améliorations IMP | 10 | 0 opérationnelle |
| Critères d'amélioration | 30 | 0 validé |

**Une CI verte, une application statique disponible ou un test avec un utilisateur fictif ne suffisent pas à attester une authentification réelle, une intégration externe, un appareil Android/iOS physique ou une disponibilité serveur.**

Preuves techniques déjà identifiées : [recette navigateur locale](https://github.com/cosscoll/Avancement-Projet/actions/runs/39230180420), [RLS PostgreSQL A/B fictif](https://github.com/cosscoll/Avancement-Projet/actions/runs/39233284788). Les tests partiels portent sur les identifiants `T-05`, `T-14`, `T-15`, `T-16`, `T-25`. Ils gardent le statut `partial_mock`, pas `real_verified`.

## Sécurisation V64 — conflits entre onglets (23 octobre 2026)

- **Problème corrigé :** si deux onglets CONTROL chargent le même état puis l'un modifie les projets, tâches, décisions, réunions ou brouillons d'automatisations, le second pouvait écraser le premier sans savoir que les données avaient changé.
- **Mécanisme :** les trois sources locales (`control-command-v1`, `control-hub-v2`, `control-automations-v1`) mémorisent le contenu exact lu et refusent un enregistrement si la version en stockage a changé depuis ; l'utilisateur reçoit un message demandant de recharger. Les transactions déjà prévues annulent la mutation en mémoire en cas de refus.
- **Protocole de recette :** [Essai multi-onglets et limites de protection](CONTROL_LOCAL_MULTI_ONGLETS.md) : séquence A/B, protection de l'onglet en retard, réessai après rechargement, refus de quota, collecte de preuves SHA/navigateur.
- **Couverture :** 10 nouveaux contrôles ciblés et 22 tests existants de stockage/corruption exécutés avec succès dans un environnement JavaScript isolé. Les deux autres registres de sécurité et la suite Native Node complète restent à vérifier sur GitHub Actions et navigateur pour ce commit.
- **Limite :** ce contrôle de version du stockage local n'est **pas une transaction atomique inter-onglets** et ne garantit ni une écriture concurrente parfaitement sérialisée ni la synchronisation serveur entre appareils. C'est une prévention des écrasements *séquentiels* de versions obsolètes. Auth JWT/RLS A/B et reprise multi-appareils restent des exigences P0 non validées.
- **Statuts du cahier inchangés :** 22 tickets BACK, 42 recettes, 3/36 critères historiques prouvés, 0/10 améliorations pleinement opérationnelles. Aucune recette supplémentaire déclarée terminée du seul fait de ces tests.

## Vérifications complémentaires V64 — recherche et parcours projets (22 octobre 2026)

- **Routes personnelles :** décodage du seul segment d'identifiant pour conserver les caractères spéciaux (notamment `/` encodé) ; les échappements URI malformés sont rejetés sans bloquer toute l'interface.
- **Recherche des projets :** ignore les accents, accepte les mots dans un ordre différent et annonce le nombre de résultats. Le compteur n'expose aucune information externe.
- **Tests ciblés :** 44 vérifications réussies dans un exécuteur JavaScript isolé sur les fichiers de `main`. La recette Chromium prévoit aussi « ifsi revisions » → « Révisions IFSI » ; elle n'est **pas encore exécutée** sur le site publié.
- **Limitations :** cela ne prouve ni l'exécution du `node --test` natif sur le dernier commit ni la réussite GitHub Actions ni la synchronisation Cloud. Aucun critère V1.2 de plus n'est promu vérifié.

## Complément V64 — création directe et navigation fiable (22 octobre 2026)

- Depuis « Trouver une fonction » et la recherche de l’accueil, une demande explicite **« créer un nouveau projet »** ouvre le formulaire du projet (`#/new-project`) avec focus sur le champ Nom ; Annuler referme sans modifier les projets.
- Une demande explicite **« créer une tâche »** ouvre le formulaire « Ajouter une action » (`#/control/inbox/new`) avec focus sur le Titre, sans écritures automatiques.
- Les demandes de consultation (« mes tâches », « mes projets ») restent orientées vers **les listes**, pas les formulaires. Distinction testée pour éviter les fausses créations.
- Le test de sécurité du catalogue Cloud a été aligné sur le comportement fail-closed : **aucune entrée sans authentification**, ressources accessibles uniquement dans une session autorisée. Cloud public demeure désactivé.
- Tests ciblés isolés sur les chemins de navigation : **29 réussis sur 29** ; versions des assertions offline et du service worker alignées sur **V64**. Le navigateur réel, les GitHub Actions natifs du HEAD final et la recette mobile physique **ne sont pas encore vérifiés**.
- **Aucune recette BACK/T/IMP promue** sans preuve réelle ; le blocage P0 Auth JWT/RLS A/B demeure inchangé.

## Itération V59 — réduction des clics et contrôle des régressions (22 octobre 2026)

- Accueil : un formulaire visible ouvre directement le moteur de recherche local avec une intention ou un nom de projet. Aucun résultat n'est exécuté automatiquement ; les utilisateurs confirment la page à ouvrir.
- Qualité : anciennes assertions PWA V55 encore présentes dans deux tests réparées ; test transverse `tests/control-pwa-cache-contract.test.mjs` ajouté pour signaler toute nouvelle désynchronisation.
- `tests/control-home-direct-intent.test.mjs` vérifie la saisie, la transmission de la requête et l'absence de mutation ; `tests/control-ia-browser-smoke.mjs` prépare le parcours « budget » à réaliser sur site public.
- Cache installé : **V59**. **Contrôles de syntaxe et tests ciblés réalisés**, **CI complète et recette Chromium publique non vérifiées pour cette révision**. Aucun critère BACK/T/IMP clos par déduction.

## Correctifs additionnels du 22 octobre 2026 — expérience utilisateur

- Recherche de fonctions : ouverture du premier résultat avec **Entrée**, raccourcis **Reprendre** pour les quatre dernières fonctions de la session personnelle, aucun historique récemment ouvert en Cloud.
- Requêtes inutilisables (« je veux », uniquement des mots de liaison) : elles n'affichent plus artificiellement toutes les fonctions.
- Automatisations : le relevé daté du 17 octobre est marqué « archive, statut actuel inconnu » dans **les trois surfaces concernées** : registre, calendrier et ancienne interface ; aucune programmation réelle n'est modifiée.
- Service worker : rotation du précache en **V59** ; anciens contrats de tests mis à niveau ; **32 tests ciblés réussis dans un moteur JavaScript isolé**, mais pas encore la CI native complète ni Chromium publié.
- **Aucune nouvelle recette V1.2 ni aucun IMP réputé validé** sur la seule base de ces tests partiels.

## Complément V3 — navigation et découverte, 22 octobre 2026

La navigation CONTROL V3 a été améliorée directement sur `main` : formulations françaises naturelles, recherche des écrans et **accès direct aux projets par leur nom**. Les noms des projets Cloud ne sont pas fournis par le moteur lorsque l'utilisateur n'est pas authentifié. Tests de non-régression et scénario Chromium ajoutés ; la PWA publique utilise le cache V56.

**Frontière d'acceptation :** ceci est un moteur de navigation, **pas** la recherche universelle sourcée IMP-02 : il ne recherche ni dans Gmail, ni dans Drive privé, ni dans les conversations des fournisseurs. Aucun critère historique Auth/Cloud ni aucun critère IMP n'est considéré comme validé par cette amélioration. La CI complète, le navigateur de production sur le SHA final et les appareils physiques restent à vérifier. Le registre et le nombre de critères validés demeurent inchangés.

Détails : [parcours UX V3](CONTROL_UX_V3_PARCOURS.md) et [état de reprise prudent](../data/sprint-state/control-ia.json).

## Nouveaux modules approuvés — avenant privé du 2 novembre 2026

Le cahier privé `/CONTROL-IA/CONTROL_IA_Cahier_des_charges_V1_2_PRIVE.md` contient désormais **l'annexe C** ajoutant deux lots au périmètre officiel de CONTROL :

- **`EXT-IA-001` — Comptes IA, historique et mémoire :** importer volontairement des archives exportables ChatGPT, Claude et Gemini, retrouver les fils et leurs sources, approuver des mémoires isolées par projet et gérer leur suppression. Connexion officielle seulement lorsque les permissions du fournisseur permettent l'accès visé ; pas d'accès automatique aux historiques natifs par OAuth ordinaire.
- **`EXT-AGT-001` — Studio d'agents personnalisés :** créer un agent depuis une ou plusieurs conversations sélectionnées, choisir et approuver les mémoires à lui transmettre, modifier son rôle/instructions, reprendre ses conversations persistantes et afficher les sources utilisées.

**10 nouveaux critères d'acceptation `EXT-IA-AC1..5` et `EXT-AGT-AC1..5`**, initialement non vérifiés, font l'objet d'un registre public expurgé : [`data/control-ia-scope-extensions.json`](../data/control-ia-scope-extensions.json).

**Dépendances impératives :** compte CONTROL réel et isolation A/B, import sûr des fichiers, consentement source par source, suppression/révocation, séparation entre données importées et instructions d'agent, aucune permission implicite ni API payante. Les fils importés n'autorisent ni commande de fournisseur ni accès à la mémoire native. Les fonctions de configuration et d'import local peuvent être réalisées avant une connexion API.

**Périmètre V1.2 historique conservé :** 22 tickets BACK, 42 recettes T, 10 améliorations IMP, 36 critères historiques et 30 critères IMP. Les deux ajouts `EXT` restent comptés séparément pour ne pas falsifier l'avancement précédent. **État au 2 novembre :** une première interface **locale** est déployée dans `#/control/aistudio` (import des fichiers reconnus, mémoire manuelle approuvée, agents, discussions et génération facultative avec le petit modèle IA local). **Aucun des 10 nouveaux critères n'est déclaré entièrement vérifié** : les comptes Cloud, le véritable OAuth des fournisseurs, la synchronisation native des historiques/mémoires et les essais physiques multi-appareils restent à développer. [Code](../assets/control-ai-studio.js) · [Recette Chromium](https://github.com/cosscoll/Avancement-Projet/actions/runs/41413819471).

## MVP : cinq jalons successifs

1. **Identité indépendante** : vrai projet CONTROL distinct de toutes les autres bases ; création uniquement après approbation explicite et attestation coût 0 €, contrôle RLS par deux vrais utilisateurs, sessions révoquées, export/suppression. La configuration Cloud reste `enabled:false` jusqu'à la recette.
2. **Recherche et contexte** : retrouver le bon projet avec ses sources, son horodatage, ses droits et une mémoire isolée par projet.
3. **Actions internes certifiées** : préparation/dry-run, approbation, écriture une seule fois, identifiant, relecture et audit.
4. **Reprise fiable des missions** : sauvegarde des checkpoints, erreurs et confirmations, recovery sans doublon, preuve que la tâche est réellement terminée.
5. **Recette utilisateur représentative** : Chromium pour le site public, puis appareils Android et iOS réels, accessibilité et sécurité. Aucun statut opérationnel sans ces vérifications pour le parcours cible.

Après ce socle, développer successivement le mode Objectif, la supervision/boîte de réception/agenda, les automatisations et le mobile avancé, selon les dépendances de la stratégie existante.

## Sprints classiques et automatisés

Même source de vérité et bail coopératif `data/sprint-state/control-ia.json` (45 minutes, contrôle SHA) ; **un chantier fonctionnel à la fois**. Une demande utilisateur peut réorienter explicitement le focus. Chaque sprint fait développement → tests → autocritique → correction dans la même session → retest → **écriture directe sur main** selon la politique du propriétaire → CI → vérification de publication → point de reprise.

L'outil [`scripts/control-ia-requirements.mjs`](../scripts/control-ia-requirements.mjs) et ses 16 tests protègent la cardinalité et les liens des 22/42/10 entités, les preuves et l'absence de divulgation accidentelle de détails privés. [Workflow de validation V1.2](../.github/workflows/control-ia-requirements.yml). Une modification du registre qui forge un statut entièrement vérifié à partir d'un test fictif doit être refusée.

## Points de décision et blocages — mise à jour du 21 octobre 2026

- **P0 — Auth réelle :** le projet Supabase indépendant **CONTROL Cloud** est créé et son état a été vérifié `ACTIVE_HEALTHY` ; la séparation avec IAgile est assurée au niveau du projet. En revanche, aucun parcours complet avec **deux véritables utilisateurs Supabase Auth et JWT distincts** n'a été validé. `config/cloud.json.enabled=false` reste obligatoire.
- **P0 — synchronisation multi-appareils :** l'interface privée a maintenant une lecture paginée avec comptage exact, détection des identifiants doublés, contrôle de propriétaire et limites d'affichage explicites (5 000 projets et 10 000 éléments). Cette qualité de code n'est pas une preuve de fonctionnement multi-utilisateurs ou sur Android physique.
- **P1 — export privé :** les six tables sont couvertes, les données paginées sont comptées puis recomptées avant téléchargement, et le mot de passe de chiffrement est saisi dans un dialogue masqué adapté au mobile. La restauration automatisée, le snapshot transactionnel et l'idempotence serveur entre appareils restent **à réaliser**.
- **P1 — orchestration réelle :** les rappels, agents IA, OAuth et commandes effectives de services tiers exigent encore des connexions autorisées et une infrastructure vérifiée. Aucun coût supplémentaire n'est autorisé.
- **Qualité CI démontrée :** le correctif de fondations au commit `d0a1524f7c53fcf8a150066aae31bd9b509e3ecd` a passé **436/436 tests Node natifs** (preuve [GitHub Actions](https://github.com/cosscoll/Avancement-Projet/actions/runs/39645241802)) et le workflow [Cloud pre-auth](https://github.com/cosscoll/Avancement-Projet/actions/runs/39645241709). Les commits de suivi ou de documentation ultérieurs doivent être vérifiés sur leur propre SHA. La PWA v38 n'est plus un chantier « non publié » à reconstruire : le travail d'intégration a été suivi dans les sprints précédents, avec des recettes Pages/Chromium enregistrées.

**Suivi formel conservateur :** les **22 tickets BACK / 42 scénarios T** restent historiques, et les **36 critères des 9 capacités** ne sont pas promus du seul fait d'un test simulé ou d'une publication de code. La validation réelle du compte et la synchronisation sont toujours des portes d'acceptation non franchies.


**Complément sécurité du 20/10 :** la [preuve simulée T-16](https://github.com/cosscoll/Avancement-Projet/actions/runs/39403753476) couvre cinq transitions du client A/B avec réponses tardives ; aucune authentification JWT réelle n'a été effectuée, donc T-16 reste **non vérifié intégralement** et les comptes Cloud restent désactivés.
