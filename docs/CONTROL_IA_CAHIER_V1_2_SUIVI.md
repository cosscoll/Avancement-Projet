# CONTROL IA — Suivi du cahier V1.2 (index public, contenu privé)

**Mise à jour : 21 octobre 2026.** Ce fichier est uniquement un **suivi public expurgé**. Le cahier des charges fonctionnel et technique V1.2 intégral, conservant la V1.1 et ses annexes, se trouve en bibliothèque personnelle privée :

`/CONTROL-IA/CONTROL_IA_Cahier_des_charges_V1_2_PRIVE.md`

**Ne pas transférer le contenu complet du cahier privé dans GitHub public, ni publier les conversations, clés, comptes, documents et données privés.** Les identifiants et liens de test déjà publics peuvent être suivis dans ce dépôt.

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

## Vérifications complémentaires V63 — recherche et parcours projets (22 octobre 2026)

- **Routes personnelles :** décodage du seul segment d'identifiant pour conserver les caractères spéciaux (notamment `/` encodé) ; les échappements URI malformés sont rejetés sans bloquer toute l'interface.
- **Recherche des projets :** ignore les accents, accepte les mots dans un ordre différent et annonce le nombre de résultats. Le compteur n'expose aucune information externe.
- **Tests ciblés :** 44 vérifications réussies dans un exécuteur JavaScript isolé sur les fichiers de `main`. La recette Chromium prévoit aussi « ifsi revisions » → « Révisions IFSI » ; elle n'est **pas encore exécutée** sur le site publié.
- **Limitations :** cela ne prouve ni l'exécution du `node --test` natif sur le dernier commit ni la réussite GitHub Actions ni la synchronisation Cloud. Aucun critère V1.2 de plus n'est promu vérifié.

## Complément V63 — création directe et navigation fiable (22 octobre 2026)

- Depuis « Trouver une fonction » et la recherche de l’accueil, une demande explicite **« créer un nouveau projet »** ouvre le formulaire du projet (`#/new-project`) avec focus sur le champ Nom ; Annuler referme sans modifier les projets.
- Une demande explicite **« créer une tâche »** ouvre le formulaire « Ajouter une action » (`#/control/inbox/new`) avec focus sur le Titre, sans écritures automatiques.
- Les demandes de consultation (« mes tâches », « mes projets ») restent orientées vers **les listes**, pas les formulaires. Distinction testée pour éviter les fausses créations.
- Le test de sécurité du catalogue Cloud a été aligné sur le comportement fail-closed : **aucune entrée sans authentification**, ressources accessibles uniquement dans une session autorisée. Cloud public demeure désactivé.
- Tests ciblés isolés sur les chemins de navigation : **29 réussis sur 29** ; versions des assertions offline et du service worker alignées sur **V63**. Le navigateur réel, les GitHub Actions natifs du HEAD final et la recette mobile physique **ne sont pas encore vérifiés**.
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
