# CONTROL IA — Rétrospectives et critiques ouvertes
Document public de suivi technique limité à CONTROL IA. Source de spécifications complète V1.1 conservée dans la Bibliothèque privée, jamais reproduite ici.

## 2026-10-18 — Sprint 02h50 (Europe/Paris)
**Base inspectée :** main à 8a050195e6ad50fcceaad8e925fa37f08a788e3a. **Branche de revue :** control-ia/fail-closed-scope-dst-20261018.
**Cible avant → après :** 3 scénarios de portée auparavant dangereux (portée supprimée, demande vers autre projet, demande multi-projets) doivent désormais produire 0 proposition de mutation et 0 divulgation ; deux heures DST à risque doivent être refusées par l'exécuteur local.

### Première passe
- Modifié `assets/control-operator-core.js` : validation anticipée du projet sélectionné et des noms de projets mentionnés ; aucune interprétation si la portée est inconnue, contradictoire ou ambiguë.
- Ajouté `tests/control-operator-scope-regression.test.mjs` : 3 scénarios de refus. Code des tests commité ; **pas de résultat de suite GitHub vérifié**.
- Commit : `93409bb884dd58c41626220f698003c52a0aa4a6`. Aucun autre projet modifié.

### Autocritique n°1 (après première passe)
| Critique | Gravité | Ce qui reste insuffisant | Correction/priorité et preuve attendue | Tickets |
|---|---|---|---|---|
| C-001 | P0 | Avant correctif, un scope sélectionné absent pouvait afficher toutes les tâches ; le choix de projet par défaut pouvait créer dans le mauvais projet | Contrôle fail-closed et tests négatifs, puis CI réelle | BACK-005, 008, 010 |
| C-002 | P0 | `new Date(local)` normalise silencieusement l'heure inexistante et choisit une occurrence ambiguë lors du passage à l'heure d'hiver | Valider heure civile avant toute mutation, tests Europe/Paris | BACK-027, 030, 042 |
| C-003 | P0 | Les protections sont locales : pas de session authentifiée, tenant, RLS ni base CONTROL dédiée | Infrastructure isolée autorisée, tests A/B réels avant ouverture | BACK-004, 005, 023 |
| C-004 | P1 | Détection par alias textuel susceptible de faux positifs ; homonymies et alias courts non évalués | Jeu de requêtes FR, taux de faux refus et non-divulgation | BACK-008, 022 |
| C-005 | P1 | Aucun navigateur Android/iOS ni parcours GitHub Pages réel testé | CI et recette multi-appareils avec captures | BACK-020, 040 |

### Deuxième passe corrective
- Ajouté `validateLocalDateTime` au cœur : refuse les heures inexistantes et les heures répétées dans le fuseau de l'appareil.
- Appliqué le validateur dans `assets/control-operator.js` et aux deux mutations de calendrier de `assets/command-center.js`.
- Ajouté `tests/control-operator-dst.test.mjs` : changement d'heure Europe/Paris, cas 29 mars et 25 octobre 2026.
- Commit de code : `0efeff55dc8bd8a0586c016e92ef956177f267a0`.
- **Test effectivement exécuté :** reproduction isolée de l'algorithme de validation sous Node avec `TZ=Europe/Paris` : 6/6 assertions réussies. Cela **ne valide pas** le test du dépôt, l'intégration navigateur, ni le calendrier du profil CONTROL.
- CI du commit : 0 statut et 0 exécution PR remontés lors de la vérification ; aucune réussite CI revendiquée.

### Autocritique n°2 — après correction
| Critique | État | Gravité | Preuve manquante / amélioration prioritaire |
|---|---|---|---|
| C-001 | Code corrigé ; tests dépôt NON VÉRIFIÉS | P0 | Faire tourner suite Node et scénario navigateur ; tester le changement de projet entre proposition et confirmation |
| C-002 | Algorithme corrigé pour fuseau appareil ; intégration NON VÉRIFIÉE | P0 | Vérifier le fuseau IANA du compte, dates et récurrences serveur ; exécuter tests DST intégrés |
| C-003 | Ouvert | P0 | Base CONTROL séparée et tests RLS A/B, uniquement après autorisation |
| C-004 | Ouvert | P1 | Ajouter un corpus de 30 requêtes, mesurer faux positifs et ambiguïtés |
| C-005 | Ouvert | P1 | CI, Chrome Android, Safari iOS, PWA et accessibilité |

**Risques et régressions possibles :** le fuseau de l'appareil peut différer de celui du profil ; les tests Node peuvent être sensibles à l'environnement ; l'absence de PR/CI empêche toute déclaration de validation ; la sélection de projets par alias peut refuser des questions légitimes. Pas d'OAuth, push, rappel serveur ou publication effectués.

**Avant/après prouvé :** 0/3 tests de garde présents avant, 3 scénarios de test ajoutés (résultat NON VÉRIFIÉ) ; 0/2 transitions DST explicitement rejetées par l'ancienne validation locale, 2/2 rejetées dans une reproduction Node isolée du nouvel algorithme. 6/6 cas de reproduction validés ; aucune métrique de production mesurée.

### Plan d'amélioration du prochain sprint (ordre obligatoire)
1. **P0 C-001/C-002** : faire exécuter la suite de tests du dépôt ; corriger tout échec, vérifier intégration exécuteur, puis documenter SHA et résultat.
2. **P0 C-002** : étendre les cas de fuseaux IANA, horaires ambigus, profil différent du téléphone et refus sans écriture ; ne pas annoncer conformité BACK-027 avant tests serveur.
3. **P0 C-003** : sécuriser contrats et feature flags en attendant une base dédiée et une autorisation, sans ouvrir de connexion.
4. **P1 C-004/C-005** : corpus anti-faux-positifs, parcours mobile et métriques de latence.
5. Les autres tickets restent non vérifiés ou bloqués ; ne pas les clôturer par déduction.

## État des 42 tickets après ce sprint
État conservateur : « partiel » signifie code/documentation incomplets ou recette non vérifiée ; aucun ticket déclaré terminé.
| Ticket | État |
|---|---|
| BACK-001 | partiel (inventaire V1.1 à revalider) |
| BACK-002 | partiel (audit limité au routeur local) |
| BACK-003 | non vérifié |
| BACK-004 | bloqué : approbation et base dédiée |
| BACK-005 | partiel : portée locale, pas RBAC serveur |
| BACK-006 | non vérifié |
| BACK-007 | non vérifié |
| BACK-008 | partiel : routeur local |
| BACK-009 | partiel : réponses déterministes non RAG |
| BACK-010 | partiel : confirmations et audit local |
| BACK-011 | non vérifié |
| BACK-012 | non vérifié |
| BACK-013 | bloqué : connexion et coût |
| BACK-014 | non vérifié |
| BACK-015 | non vérifié |
| BACK-016 | non vérifié |
| BACK-017 | non vérifié |
| BACK-018 | non vérifié |
| BACK-019 | non vérifié |
| BACK-020 | non vérifié : Android réel |
| BACK-021 | partiel : documentation seulement |
| BACK-022 | partiel : tests ajoutés, CI absente |
| BACK-023 | bloqué : identité serveur |
| BACK-024 | bloqué : OAuth non autorisé |
| BACK-025 | bloqué : vault serveur absent |
| BACK-026 | partiel : agenda local uniquement |
| BACK-027 | partiel : DST appareil, pas IANA profil |
| BACK-028 | non vérifié |
| BACK-029 | non vérifié |
| BACK-030 | partiel : confirmation locale |
| BACK-031 | bloqué : scheduler serveur absent |
| BACK-032 | non vérifié |
| BACK-033 | bloqué : push serveur absent |
| BACK-034 | non vérifié |
| BACK-035 | bloqué : OAuth Google absent |
| BACK-036 | bloqué : OAuth Microsoft absent |
| BACK-037 | partiel : interface locale, aucun envoi |
| BACK-038 | non vérifié |
| BACK-039 | bloqué : backend authentifié absent |
| BACK-040 | non vérifié : iOS physique |
| BACK-041 | non vérifié |
| BACK-042 | partiel : régression DST ajoutée, CI absente |


## 2026-10-18 — Reprise et réparation du circuit de livraison (vers 10h00 Paris)

**Incident réellement observé :** les sprints avaient travaillé sur des branches `control-ia/*` mais leurs commits n'apparaissaient pas sur `main`. La consultation exclusive de `main` a donc conduit à un diagnostic incomplet (« aucun travail »). La branche `control-ia/approval-timezone-20261018-0350` pointait sur `25c9e0795fb2ec5ebcb296d2c763b6a7b7465f90` et contenait quatre commits en avance, avec deux suites de tests et des corrections de portée/DST. Les comptes rendus automatisés signalent des refus ponctuels de création de PR et des échecs de clonage (DNS), pas une absence totale d'exécution.

**Correction réellement effectuée :** ouverture de [PR #4](https://github.com/cosscoll/Avancement-Projet/pull/4), passage au vert du [workflow de tests de la PR](https://github.com/cosscoll/Avancement-Projet/actions/runs/39109662942), puis fusion de la PR dans `main` sous `5e76cc9f2c2c1d2e888b8159dcc7e4748ab488a0`. [Tests de `main`](https://github.com/cosscoll/Avancement-Projet/actions/runs/39109704637) et [GitHub Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/39109703950) réussis sur le commit fusionné. Cache PWA v36 ensuite demandé pour actualiser les scripts côté appareil ; sa CI et sa publication doivent être vérifiées séparément.

**Automatisation conservée active à XXh50.** Instructions corrigées pour rechercher `main`, **branches**, **PR** et rétrospectives avant de conclure à une absence de livraison ; réutiliser le connecteur GitHub plutôt qu'un clone réseau fragile, réessayer une PR par la voie autorisée et ne jamais considérer un commit sur branche comme déployé. Journaliser les blocages avec détails et maintenir les critiques ouvertes.

**Autocritique :** la fusion et la CI vérifient les tests Node et le déploiement, **pas** une recette Chrome Android physique, ni la vérification métier complète des interprétations de langage ; la gestion des fuseaux horaires est pour l'instant celle du navigateur, pas un compte synchronisé. Un refus d'API ou de PR lors d'un prochain sprint ne pourra pas être supprimé par un simple changement de prompt. Les séquences d'amélioration doivent inclure des tests représentatifs et éviter des succès déclaratifs.

**Prochaine priorité P0 :** reproduire un scénario de portée inter-projet et un rendez-vous dans la PWA publiée, ajouter des tests end-to-end Chrome Android si un vrai navigateur est accessible. Ensuite, reprendre les critiques C-003 (identité/RLS), C-004 (faux positifs du routeur) et C-005 (recette appareils) sans service facturable. Conserver la documentation V1.1 privée.

## 2026-10-18 — Reprise corrective PR #6 (13h56 Paris)
- Tickets BACK-010/022/030, statut partiel ; autres BACK-001..042 inchangés (table précédente).
- Base: PR #6 sur branche `control-ia/snapshot-failclosed-20261018`, CI précédente 89/91 en échec, tests historiques manquaient les préconditions attendues.
- Première passe: commit `dbda503` transmet `expectedStatus` et `expectedDate` aux tests existants.
- Autocritique: P0 une exception de `save()` ou une valeur truthy non booléenne pouvait laisser une mutation locale non sauvegardée ; P1 CI complète non encore observée.
- Deuxième passe: `a2d52ba` rollback sur exception/valeur non strictement true ; `e82ff612` ajoute deux scénarios de régression.
- Preuve: écritures GitHub réussies. Les tests n'ont PAS encore été exécutés sur le nouveau SHA : workflow GitHub Actions non retourné au moment du contrôle. Ne pas fusionner avant CI verte et absence de conflit.
- Critiques ouvertes: P0 authentification serveur/RLS et atomicité multi-appareils ; P1 recette Android/iOS, test navigateur et vérification Pages ; P1 CI du dernier SHA à attendre.
- Prochain sprint: vérifier le run CI du SHA `e82ff612b3f3ae6ffc740d06fc73949fc0981267`, corriger les éventuels échecs, fusionner seulement après validation, vérifier déploiement et parcours réel.

## 2026-10-19 — Mise en place du pilotage par livraisons (PR #8)

**Décision utilisateur :** conserver les sprints horaires avec développement, autocritique, second sprint correctif, retests et publication contrôlée, mais les concentrer sur des fonctionnalités réellement opérationnelles, une capacité principale à la fois.

**AVANT :** revue par tickets et correctifs techniques, sans source unique distinguant clairement prototype, code testé, déploiement et recette utilisateur ; le nombre de commits et de tests pouvait donner une impression excessive d'achèvement.

**Première passe :** création de `data/control-ia-delivery.json` (9 capacités, 36 critères initialement NON VALIDÉS, un focus `CONTROL-ACCOUNT`, WIP=1), de `scripts/control-ia-readiness.mjs`, de `assets/control-delivery.js` et CSS (panneau public), et de `docs/CONTROL_IA_GESTION_FONCTIONNELLE.md`. La PWA et le routeur de l'IA locale affichent maintenant le suivi déclaratif.

**Autocritique n°1 :**
- P0 : un code publié ne démontre ni inscription authentifiée, ni synchronisation entre appareils, ni fonctionnement d'agent externe ; aucun critère métier ne peut être validé sans recette réelle.
- P0 : des déclarations de livraison pourraient dériver vers « opérationnel » sur la seule base de commits, sans preuves.
- P1 : ce tracker est un instantané GitHub public mis à jour par les sprints, pas une télémétrie live ; ses preuves URL sont soumises au jugement humain.
- P1 : les sites/pages disponibles publiquement et les nouveaux styles ne sont pas encore éprouvés sur un vrai Android/iOS par ce sprint.

**Deuxième passe corrective :** introduction de 8 tests `tests/control-ia-delivery.test.mjs` vérifiant schéma/objectif, absence de preuves, statut de déploiement sans URL, dépendances non résolues, absence de preuves de recette, doublons et cycles ; CI GitHub mise à jour pour vérifier le tracker avant toute fusion. Mise à jour du cache PWA v37 pour rendre les ressources accessibles hors ligne. Automatisation CONTROL IA réorientée explicitement vers `focus_id` et les critères de réception sans changer sa cadence (XXh50) ou ses contraintes de coût/quota.

**Preuves :** [PR #8 fusionnée](https://github.com/cosscoll/Avancement-Projet/pull/8) ; merge `e52db06d05460a216c3bf0c6e60b3aaca177c61d` ; [CI sur main réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/39221475096) avec **102/102 tests Node réussis, 0 échec**, y compris nouveau validateur et 8 tests fonctionnels de gouvernance ; [déploiement Pages réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39221475420). Le contenu HTML a été publié selon GitHub ; aucun parcours navigateur réel ni réponse HTTP de Pages n'a été vérifié depuis cet environnement.

**NOUVELLE AUTOCRITIQUE :** l'ajout d'un tracker n'est **pas** la livraison de CONTROL-ACCOUNT, ni la preuve que CONTROL IA est un agent universel. Les 36 critères restent non validés, **0/9 capacités totalement opérationnelles** selon ce référentiel exigeant ; validation utilisateur, CI navigateur et test Android/iOS non réalisés. Un lien de preuve pourrait être trompeur sans vérification du contenu ; conserver audit manuel et tests métier. L'objectif principal reste bloqué avant activation Cloud par la base CONTROL dédiée, les droits RLS A/B, la validation du coût nul et l'accord explicite du propriétaire.

**Priorité du prochain sprint :** CONTROL-ACCOUNT — inspecter les contrats et migrations existants, préparer/renforcer les tests d'isolation et la recette authentifiée de façon sûre et gratuite, puis avancer sur l'infrastructure uniquement après les autorisations nécessaires. Continuer les corrections P0 transverses ; ne changer ni focus ni critères sans justification vérifiable.

## 2026-10-19 — Recette d'intégration réelle CONTROL IA : Chrome, pages publiques et données locales

**Besoin utilisateur :** « faire des tests pour vérifier que tout fonctionne comme demandé », puis continuer jusqu'à vérifier les parcours et corriger les blocages constatés. La présente recette ne change ni les règles des sprints ni l'objectif principal `CONTROL-ACCOUNT`.

**Avant :** tests Node verts mais pas de preuve systématique du fonctionnement du chat local, du tableau de suivi, des tâches et de l'agenda dans un vrai navigateur. La CI pouvait être verte alors que le parcours utilisateur était inutilisable ; les tests sur la version publiée n'étaient pas garantis sur les octets du commit testé.

**Première passe :** ajout via [PR #11](https://github.com/cosscoll/Avancement-Projet/pull/11) d'une recette Chromium à profil éphémère sur site servi localement : tableau de 9 fonctionnalités, consentement explicite, tâche enregistrée une seule fois dans UCP, lecture/rechargement, calendrier daté, refus inter-projets, mobile 390 px et absence d'erreurs JavaScript. [Run browser](https://github.com/cosscoll/Avancement-Projet/actions/runs/39226940150). Même suite ensuite branchée à l'URL GitHub Pages via [PR #12](https://github.com/cosscoll/Avancement-Projet/pull/12) et [PR #13](https://github.com/cosscoll/Avancement-Projet/pull/13) ; preuve initiale sur le domaine public : [run 39229089496](https://github.com/cosscoll/Avancement-Projet/actions/runs/39229089496).

**Autocritique n°1 :** P1 consentement, suppression, échec de sauvegarde, changement d'heure et détails des formulaires non couverts ; P1 tests exécutés sur interface locale mais pas toujours même version que la vraie production ; P1 vérification du stockage sans contrôle d'affichage dans les écrans « À traiter » et « Calendrier ».

**Deuxième passe corrective :**
- [PR #16](https://github.com/cosscoll/Avancement-Projet/pull/16) : ajoute aux parcours Chromium l'annulation sans écriture, la terminaison non répétable, le déplacement et la suppression avec confirmation, le refus après changement de projet avant validation, le retrait de consentement, l'échec simulé du stockage sans tâche fantôme, et les heures inexistantes/ambiguës de Europe/Paris. Vérification responsive aussi en 320 px. [Preuve publique et locale](https://github.com/cosscoll/Avancement-Projet/actions/runs/39230180420).
- [PR #17](https://github.com/cosscoll/Avancement-Projet/pull/17) : sécurité de la recette publique. Vérification SHA-256 des six fichiers du code et des données réellement servis par GitHub Pages **avant** d'accepter le résultat du navigateur ; échec explicite en cas de version ancienne. [Preuve correspondance octet-à-octet et recette Chromium](https://github.com/cosscoll/Avancement-Projet/actions/runs/39230629604).
- [PR #19](https://github.com/cosscoll/Avancement-Projet/pull/19) : test du passage CONTROL IA → « À traiter » (tâche visible dans le vrai écran) → CONTROL IA → « Calendrier » (événement et heure visibles), suivi du déplacement lisible depuis le chat et de la suppression effectivement visible dans le calendrier. [Recette locale et publique renforcée](https://github.com/cosscoll/Avancement-Projet/actions/runs/39231084718).

**Blocages de CI diagnostiqués et corrigés :** deux rapports existants de Pack Procédures Pro avaient des statuts « verified_online » sans les champs de preuve exigés par le validateur V2. Les journaux CI publics ont été consultés pour vérifier les événements et dates réellement démontrés, puis les champs `quality`, `online_url`, `online_verified_at`, `online_evidence_url` ont été ajoutés sans effacer l'historique ni inventer de preuve physique. Ne pas interpréter ces corrections de métadonnées comme une nouvelle validation du produit commercial Pack Pro.

**Résultats confirmés :**
- [CI générale](https://github.com/cosscoll/Avancement-Projet/actions/runs/39231084702) : **116/116 tests Node réussis**, zéro échec.
- [Recette du site public](https://github.com/cosscoll/Avancement-Projet/actions/runs/39231084718) : contrôle navigateur **réel Chromium headless**, version publique vérifiée par SHA-256 des six actifs, étapes métier locales passées à 320/390 px (émulations d'écran), sans erreur JS non interceptée.
- [Déploiement GitHub Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/39231084707) : réussi.
- Deux critères du tracker désormais étayés et cochés localement : **ACT-01** (tâche créée, terminée, relue/rechargée) et **CAL-01** (rendez-vous local créé, affiché, déplacé, supprimé). Un troisième critère, **QA-01**, était déjà étayé par un run précédent. En tout **3/36 critères vérifiés, 0/9 fonctionnalités complètement opérationnelles** ; états « deployed » et « ci_tested » inchangés là où les dépendances restent manquantes.

**Autocritique n°2 — risques encore ouverts :**
- **P0 / CONTROL-ACCOUNT** : aucun compte utilisateur CONTROL authentifié et aucune séparation RLS multi-comptes ni synchronisation inter-appareils réelle vérifiés ; Cloud `enabled:false` volontaire. Les tests utilisent un profil navigateur synthétique éphémère, pas un compte utilisateur réel.
- **P1 / CONTROL-AGENTS et CONNECTORS** : aucun vrai fournisseur Claude, Gemini, ChatGPT, Codex, Gmail/Calendar connecté et piloté par cet assistant. Les missions « en cours » restent déclaratives. Aucun test navigateur local ne peut prouver des exécutions d'API absentes.
- **P1 / CONTROL-REMINDERS** : notifications lorsque l'application est fermée non opérationnelles sans backend et permissions autorisés.
- **P1 / appareils physiques** : 320/390 px dans Chrome headless **ne vaut pas** recette Android ou iOS réelle, ni test tactile, clavier, lecteur d'écran, sessions prolongées ou conditions réseau dégradées.
- **P1 / QA** : les six actifs comparés prouvent la parité de la version testée sur les fichiers contrôlés ; ils ne garantissent pas la stabilité de tout service tiers, l'absence de bugs hors parcours exercés, ni l'isolation multi-utilisateur.
- **P2 / coût** : aucune API payante ou ressource Cloud supplémentaire activée ; budget nul inchangé.

**Prochaine priorité :** conserver le focus `CONTROL-ACCOUNT`, concevoir/vérifier le schéma et les permissions de la base CONTROL dédiée sans activation anticipée, préparer des tests RLS A/B isolés et une recette de synchronisation multi-appareils. L'utilisateur doit approuver toute activation d'infrastructure ou consentement OAuth nécessaire. Le prochain sprint reprend en priorité ces risques et ne ferme aucun critère sans preuve réelle.

### Complément de recette PWA hors connexion — 19 octobre 2026

L'autocritique a relevé un risque non testé : le raccourci PWA sur téléphone pouvait sembler installé sans que l'interface ou ses données publiques résistent à une coupure réseau. [PR #20](https://github.com/cosscoll/Avancement-Projet/pull/20), fusionnée, ajoute une recette Chromium sur le **site public HTTPS** après vérification des empreintes SHA-256 : service worker activé, cache de la coque présent, coupure réseau complète simulée via DevTools, rechargement et présence effective de l'interface CONTROL IA et du tracker public.

**Résultat :** [CI navigateur publiée](https://github.com/cosscoll/Avancement-Projet/actions/runs/39231769083), test PWA hors ligne **réussi** ; [CI générale](https://github.com/cosscoll/Avancement-Projet/actions/runs/39231769042) et [déploiement Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/39231768184) réussis.

**Limite cruciale :** ce test confirme seulement la disponibilité de la **coque publique et du suivi en cache** dans Chrome headless, réseau simulé hors ligne. Il ne prouve PAS la persistance Cloud, la synchronisation en différé, le fonctionnement d'Android installé sur écran d'accueil, Safari iOS, le chargement offline du modèle IA (poids externes), les rappels push ou les connexions externes. Aucun critère `operational` supplémentaire n'est coché. Le critère QA-01 reçoit la preuve PWA, sans augmenter artificiellement le nombre de fonctionnalités terminées. Il faut encore une vraie recette sur les appareils de l'utilisateur.


## 19 octobre 2026 — Recette P0 des permissions CONTROL Cloud, sans base distante

**AVANT :** tests Node statiques et code des six tables RLS mais aucun test PostgreSQL A/B réel. Focus maintenu : CONTROL-ACCOUNT ; pas de comptes réels ni de Cloud activé.

**Première passe :** PR #21. Ajout du workflow GitHub Actions avec PostgreSQL 16 jetable, auth.uid() et rôles fictifs, application du véritable SQL CONTROL sous verrou, exercices A/B sur six tables, refus anonymes, protection contre usurpation de propriétaire et clé étrangère composite. Résultat : CI PostgreSQL verte.

**Autocritique n°1 :** P0 une simulation de JWT ne démontre pas Supabase Auth ni la sécurité de la future instance CONTROL ; P1 les cas de sujet absent et réaffectation de propriétaire n'étaient pas couverts ; P1 le verrou de la seconde migration méritait un test négatif distinct.

**Deuxième passe :** ajout des tests de sujet absent malgré le rôle authenticated, de mise à jour owner_id vers un autre compte, de refus du SQL de quota IA sur base non confirmée. Retest de la même suite SQL. Résultat final : [CI PostgreSQL A/B verte](https://github.com/cosscoll/Avancement-Projet/actions/runs/39233284788) sur main après fusion [PR #21](https://github.com/cosscoll/Avancement-Projet/pull/21), [CI Node générale verte](https://github.com/cosscoll/Avancement-Projet/actions/runs/39233285019), [publication Pages verte](https://github.com/cosscoll/Avancement-Projet/actions/runs/39233283566). Aucune donnée ou instance distante touchée.

**Autocritique n°2 :** blocage P0 confirmé : aucun backend CONTROL indépendant autorisé, pas de vrai compte Supabase, JWT/PostgREST ou synchronisation A/B réelle testés. Ce mock PostgreSQL n'est pas une certification de sécurité d'une instance Supabase. La migration garde son verrou ; config/cloud.json reste désactivé. Aucune augmentation artificielle du taux de capacités opérationnelles : **3/36 critères vérifiés (les précédents), 0/9 modules opérationnels**, ACC-01..04 non validés. Le tracker reçoit uniquement le lien vers la preuve de test RLS *simulé*.

**Prochain sprint utile :** préparer une recette instrumentée PostgREST/JWT sur une future instance CONTROL DÉDIÉE et inspecter l'interface d'authentification avec comptes fictifs sans créer d'infrastructure nouvelle ; ne connecter/activer la vraie base qu'après vérification des coûts exacts à 0 € et autorisation du propriétaire. Tester isolation A/B, expiration, changement de session et persistance multi-appareils avant tout statut opérationnel.


## 20 octobre 2026 — Publication DIRECTE sur main, sans PR

**Décision du propriétaire :** ne plus dépendre de la fusion de PR pour les changements CONTROL ; écrire directement sur `main` en préservant tests, vérification des SHA et publication. L'automatisation et les documents de gouvernance ont été mis en cohérence, sa fréquence et son activation n'ont pas été modifiées par cette session.

**Avant :** PR #24 ouverte avec stratégie de dix améliorations et 12 tests dédiés réussis, mais absente de main. CI générale rouge en raison d'anciens rapports mal structurés de plusieurs projets.

**Première passe :** acquisition et vérification du bail `control-ia`. Lecture des cinq fichiers validés sur la branche et publication directe sur `main`, relecture systématique de chacun et comparaison des blobs SHA (5/5 identiques). PR #24 close **sans fusion** après report exact du contenu. Ajout des règles permanentes de publication directe préflight → écriture SHA → CI post-commit → recette du site au tracker, validateur, test de non-régression, protocole et automatisation (qui conserve son état). Le programme IMP-01..IMP-10 et ses 30 critères supplémentaires reste séparé des 9 capacités/36 critères originaux ; aucune fonction produit marquée terminée.

**Autocritique n°1 :** les tests dédiés de la nouvelle stratégie étaient verts, mais la CI globale restait rouge : métadonnées non conformes dans certains rapports historiques `pack-pro`, `ucp` et `iagile`. Passer ces tests en silence ou retoucher les statuts des logiciels aurait masqué les vrais écarts ; d'où nécessité de contrôler les preuves externes et d'obtenir les baux coopératifs des projets concernés avant toute normalisation administrative.

**Deuxième passe corrective :** contrôles des Actions GitHub de Pack Procédures Pro (runs 39233969523, 39227859705, 39234542774, 39237376013, 39239006653 et 39388870475), de la PR fermée sans fusion #28 et du commit existant 758d3297 ; normalisation des seules métadonnées du journal public (preuve URL/date fournie par les exécutions vérifiées, champs de qualité et objectifs, aucun changement du code des autres applications). Sur UCP, noms de livrables et objectifs V2 complétés en conservant le libellé initial, sans prétendre à un test Android réel. Sur IAgile, `deliverables: []` ajouté au sprint bloqué : zéro livraison revendiquée. Sur Pack Pro, V4 ajoute seulement les blocages déjà listés dans le rapport et sa preuve navigateur publique. Ces corrections ont été faites sous baux coopératifs distincts, sans falsifier ni effacer l'historique.

**Résultat vérifié avant clôture :** [qualité générale : 130/130 tests réussis](https://github.com/cosscoll/Avancement-Projet/actions/runs/39390035544), [contrat de rapport : 14/14](https://github.com/cosscoll/Avancement-Projet/actions/runs/39390035582), [GitHub Pages : déploiement réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39390036811), et [gouvernance des dix améliorations : run dédié réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39388934063). La suite QA généraliste n'est pas un test Supabase Auth ni la validation des dix nouvelles fonctionnalités, qui restent à construire.

**Autocritique n°2 / suite :** il reste impossible de garantir zéro échec futur : une autre automatisation pourrait toujours écrire un rapport non conforme, un test post-commit peut détecter une nouvelle régression et Pages peut être momentanément en retard. Les scripts de production des rapports devraient appliquer le contrat V2/V3 **avant** écriture, dans le respect des baux de chaque projet ; ne jamais supprimer la validation globale. Le checkpoint PWA v38 reste inachevé (ancienne branche / écritures refusées) et doit être repris en priorité au prochain sprint CONTROL autorisé. Focus produit `CONTROL-ACCOUNT` inchangé, Cloud désactivé sans base CONTROL indépendante et autorisation, aucun travail externe ou coût.

