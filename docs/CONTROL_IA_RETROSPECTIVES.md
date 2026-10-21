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



## 20 octobre 2026 — Sprint conversation : consolidation cahier V1.2 et avancement vérifié

**Exécution :** `control-ia-20261020-1106-spec-v12` ; départ 11:05 Europe/Paris ; périmètre CONTROL IA exclusivement, bail validé dans `data/sprint-state/control-ia.json`, écritures directes sur `main` conformément au propriétaire. Aucun frais, aucune création Supabase ou accès à des données réelles.

**AVANT :** cahier V1.1 privé précis mais confusion dans le suivi public entre 22 tickets BACK et 42 scénarios T. Les dix nouvelles améliorations existaient dans un registre séparé sans liens vers les tickets et recettes; aucun aperçu consolidé dans la page CONTROL. Suivi historique : 3/36 critères vérifiés, 0/9 modules opérationnels, Cloud désactivé. Le dernier CI général était déjà rouge du fait d'une entrée V3 UCP avec incident invalide.

**Première passe réalisée :** création du cahier **intégral privé V1.2** en bibliothèque `/CONTROL-IA/CONTROL_IA_Cahier_des_charges_V1_2_PRIVE.md`, V1.1 conservée + annexe 22 BACK, 42 T, dix améliorations/30 critères et plan MVP. En public, création du registre expurgé `data/control-ia-requirements.json` avec 22 tickets liés à 42 scénarios et dix IMP, de `scripts/control-ia-requirements.mjs`, douze tests Node, workflow dédié, guide public `docs/CONTROL_IA_CAHIER_V1_2_SUIVI.md`. Aucun texte privé complet dans le dépôt. Conservation du tracker initial et focus `CONTROL-ACCOUNT`.

**Autocritique n°1 :** trois scénarios manquaient initialement de lien ticket (détectés avant écriture et corrigés) ; une variable de validateur masquait le constructeur global JavaScript `URL` (détecté par test et corrigé immédiatement) ; le test navigateur confondait chemins locaux et GitHub Pages (corrigé en fonction de la cible). Une exécution Chromium a ensuite révélé un timeout de démarrage du navigateur sur runner, amélioré en 30 s et journalisation des erreurs Chrome. Ces erreurs n'ont pas été cachées dans les comptes rendus de CI et aucun critère utilisateur n'a été artificiellement promu.

**Seconde passe corrective :** nouveau composant visible sur `#/control/localai` indiquant 22 tickets, 42 recettes, dix améliorations et **0/42 scénarios certifiés, 4 contrôles partiels/simulés** ; ajout de contraste mobile et de tests Chromium local/public, intégrité SHA-256 de onze ressources servies. Correction des références obsolètes `BACK-001..042` dans la stratégie, le validateur et le runbook ; mise à jour de la tâche programmée CONTROL vers le référentiel V1.2 (sans changement d'horaire ou de statut).

**Retest / preuves :** [douze tests V1.2 et script de traçabilité réussis](https://github.com/cosscoll/Avancement-Projet/actions/runs/39400570624), [cohérence stratégique réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/39400570658), [recette Chromium réelle local ET Pages réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/39400244904), [déploiement Pages réussi après les modifications](https://github.com/cosscoll/Avancement-Projet/actions/runs/39400570591). Chromium a confirmé affichage V1.2, création/annulation/tâches/agenda local, interdiction des actions inter-projets, permissions, DST, largeur 320/390px et PWA publique hors ligne. L'accès Cloud reste expressément désactivé.

**Autocritique n°2 / limites restantes :** ces succès démontrent la traçabilité du cahier et l'interface locale, PAS que la plateforme dispose de vrais comptes, OAuth, backend, agents IA, notifications fermées ou appareil Android/iOS réel. **CI générale toujours rouge** : [run 39400525720](https://github.com/cosscoll/Avancement-Projet/actions/runs/39400525720) en raison de `ucp-20261020T083418Z-v3: invalid incident entry` dans le journal d'un AUTRE projet. L'échec est indépendant des nouveaux tests CONTROL, et ne doit être ni occulté, ni contourné par assouplissement de la validation ni réparé sous le bail CONTROL ; à prendre en charge par le sprint UCP autorisé. Aucun ticket BACK ou scénario T supplémentaire n'est certifié aujourd'hui; quatre contrôles sont seulement partiels, non opérationnels.

**Checkpoint prochain sprint :** reprendre la PWA v38 inachevée en revalidant les sources/patchs, puis continuer `CONTROL-ACCOUNT` via contrôle des permissions, scénarios T-15/T-16/T-21 et contrats d'authentification, sans créer de base ni débloquer les inscriptions avant confirmation explicite du coût nul et autorisation du propriétaire. Garder `data/control-ia-requirements.json` à jour uniquement sur preuve réelle et tester les parcours lors de chaque nouvelle livraison. Conserver le checkpoint PWA antérieur dans le fichier d'état.


## 20 octobre 2026 — PWA v39 — reprise de la v38 non publiée (2026-10-20T09:41:20.424Z)

**Objet avant → après :** service worker public v37 : rafraîchissements réseau susceptibles de mettre en cache un HTTP 200 HTML comme JS et installation PWA insuffisamment atomique ; suivi public V1.2 absent du cache initial → **PWA v39 réellement publiée** qui rejette les réponses aux types incorrects, préserve l'ancien cache si la nouvelle installation échoue, permet au suivi V1.2 de se charger hors ligne et conserve les accès Cloud désactivés.

**Reprise contrôlée :** bail exclusif `control-ia-20261020-v38-pwa-resume-classic`, archive privée `/CONTROL-IA/CONTROL_IA_Sprint38_PWA_Correctif_Local.zip`, retrospective Sprint38 lue. Branche d'origine `control-ia/pwa-atomic-v38-20261019-1754` retrouvée sans correctif publié. **Premier passage :** restauration des sources, `node --check` et 15/15 tests locaux réussis ; inspection du `service-worker.js` public encore v37.

**Autocritique n°1 :** P0 installation du cache principal incomplète qui peut pourtant activer un worker ; P1 cache contaminable par faux contenu `text/html` HTTP 200 ; P1 absence de `data/control-ia-requirements.json` dans les données publiques hors ligne ; P1 fixtures MIME des tests de navigation insuffisantes ; P2 aucune vraie recette Android physique.

**Deuxième passage corrective :** version `control-shell-v39` et `control-public-data-v39`, contrôle MIME lors de l'installation et du rafraîchissement des scripts, styles, HTML et manifeste ; installation des éléments critiques avec échec explicite, nettoyage seulement des nouveaux caches, activation uniquement après installation du noyau ; traitement prudent du JSON public et précache de la matrice V1.2 ; exclusion inchangée des pages privées, de la configuration Cloud et des requêtes cross-origin. Correctif des fixtures HTTP et ajout de **15 tests unitaires PWA** réels dans `tests/pwa-atomic-install.test.mjs`, complétant les deux tests de navigation (17 tests PWA), plus assertions dans la recette Chromium sur cache v39, lecture du registre 22/42 hors ligne et comparaison SHA-256 du service worker avec la version publiée.

**Retest après correction :** [recette Chromium local et GitHub Pages SUCCESS](https://github.com/cosscoll/Avancement-Projet/actions/runs/39401977906). Vérification SHA des **12 actifs publics**, PWA v39 activée, rechargement complètement hors ligne de CONTROL IA, suivi V1.2 accessible, 390/320 px sans débordement, permissions et agenda locaux inchangés, Cloud toujours fermé. [CI Node général](https://github.com/cosscoll/Avancement-Projet/actions/runs/39401998657) : 156 tests réussis sur 157 ; **un échec historique du rapport de sprint UCP (invalid incident entry)** hors chantier CONTROL, déjà présent avant la v39 ; aucun assouplissement/contournement ni fausse présentation de CI globale verte. [GitHub Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/39401976656) déployé sur commit intégrant le code PWA ; [fichiers sur main](https://github.com/cosscoll/Avancement-Projet/blob/main/service-worker.js).

**Autocritique n°2 :** réussite vérifiée dans Chromium isolé sur le site en ligne, **pas de test physique Android/iOS** ; l'expérience hors ligne concerne uniquement les données publiques déjà mises en cache, aucune synchronisation de compte ni notification serveur ; les types MIME atypiques du fournisseur peuvent provoquer un refus sûr de mise en cache (à tester avant nouveau domaine). Aucun critère T-31/32 (notifications physiques) ni compte CONTROL Cloud déclaré validé. Le checkpoint PWA v38 non publié est maintenant **repris et remplacé par v39 attestée**, l'archive historique reste conservée en Library ; la prochaine étape fonctionnelle doit revenir à BACK-004/005 et aux permissions d'authentification sécurisées (T-15/16/21), sans ouvrir de base tierce non autorisée.


## 20 octobre 2026 — Renforcement P0 du portail CONTROL-ACCOUNT (2026-10-20T09:55:27.287Z)

**Objectif avant → après :** client Cloud encore désactivé mais acceptant en théorie un JWT de type `eyJ...` (potentiellement `service_role`), URL Supabase contenant credentials/query, et absence de validation explicite de la référence d'un projet CONTROL indépendant. **Après :** `safeClientConfig` refuse ces configurations, exige une clé moderne `sb_publishable_`, une URL HTTPS propre, une correspondance de référence et `independentProjectConfirmed:true` (tout en gardant la vraie configuration `enabled:false`). Le changement ne suffit jamais pour autoriser l'ouverture de comptes réels.

**Première passe :** `assets/cloud-app.js` durci et `config/cloud.example.json` rendu fermé par défaut. 12 tests Node de configuration ajoutés pour rejeter secrets, JWT service_role encodé, ancien JWT anon, credentials URL, params, fragment, origine étrangère et références de projet contradictoires. CI Cloud indépendante ajoutée pour empêcher le retour de ces erreurs, sans utiliser de crédits API ou une base Supabase.

**Autocritique 1 :** le contrôle côté navigateur ne prouve PAS que l'instance est distincte d'IAgile, ni que Supabase RLS/Auth réelle fonctionne ; les réponses réseau tardives de l'ancien utilisateur pourraient divulguer ses données si le client réécrivait son cache après changement de compte. Notre environnement de tests manquait d'exercice du code de session `verifiedSession` / `reload` réel.

**Deuxième passe :** création de `tests/control-cloud-session-isolation.test.mjs` reprenant **les vraies fonctions clientes du projet** avec réseau et comptes A/B synthétiques. Scénarios : lecture normale A, changement A→B pendant lecture A en cours, déconnexion pendant un chargement, erreur tardive A après connexion B, déduplication d'un rafraîchissement du même utilisateur. Le premier harness a signalé une dépendance manquante `panel()` ; ajoutée au simulateur puis cinq tests réussis. Workflow Cloud séparé complète le jeu à **20/20 tests réussis** ([GitHub Actions](https://github.com/cosscoll/Avancement-Projet/actions/runs/39403753476)). Aucune inscription, aucun token tiers, aucune dépense.

**Preuves et publication :** [recette Chromium sur GitHub Pages réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/39403871371) après correctif d'adoption du service worker, avec fermeture du panneau Cloud, sécurités locales et V1.2 ; [matrice V1.2 12 tests réussis](https://github.com/cosscoll/Avancement-Projet/actions/runs/39403988250), désormais **cinq** preuves partielles (T-05, T-14, T-15, T-16, T-25), zéro recette T certifiée intégralement. Lien de recette synthétique T-16 ajouté à `data/control-ia-requirements.json` sans modifier `real_verified` ni les 3/36 critères historiques. Site déployé via [Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/39403987638). CI générale : 173/174 tests verts au [run 39403670989](https://github.com/cosscoll/Avancement-Projet/actions/runs/39403670989), **échec historique UCP** sur un autre journal ; non masqué.

**Autocritique 2 :** les cinq essais de session utilisent des faux utilisateurs et une API de données simulée ; ils ne prouvent NI vraie validation JWT ni PostgREST, ni compartimentage après changement de session sur un fournisseur déployé. Les nouveaux drapeaux de configuration exigent une vérification *humaine* indépendante en plus de ce contrôle UI ; ne pas les considérer comme une preuve anti-réutilisation du projet IAgile. Les anciens JWT anon ne pourront plus être employés au navigateur (choix de sûreté : clé moderne publishable requise). Prochaine étape : instance CONTROL séparée à coût vérifié nul et approuvée, migrations sous verrou, deux vraies sessions JWT avec recette A/B, bascule sur deux appareils et export/suppression des données. **Cloud encore `enabled:false`.**


## 21 octobre 2026 — Restauration de l'automatisation CONTROL IA (2026-10-21T07:14:16.337Z)

**Situation AVANT :** tâche ChatGPT `CONTROL IA — Développement autonome` (ID `6ad3ee49b79c8191b1f3f441ea7fea3a`) constatée désactivée ; dernier lancement enregistré le 20/10 à 13:52 UTC. `data/sprint-state/control-ia.json` avait `status=running` avec bail `control-ia-20261020125015408-9ufh9o` expiré le 20/10 à 13:35 UTC. À l'audit, CI générale et contrat des rapports échouaient sur la même entrée d'incident du journal UCP du 20/10 08:34 UTC.

**Diagnostic factuel :** dans la fenêtre 12:40–13:55 UTC du sprint CONTROL interrompu, un seul commit CONTROL est enregistré dans le dépôt central : acquisition du bail (`e0431fbf...`). **Aucune publication de code CONTROL ou recette supplémentaire dans cette fenêtre n'a pu être confirmée** ; le checkpoint antérieur de tests de sécurité Cloud reste la dernière preuve de travail achevé. Le journal UCP `ucp-20261020T083418Z-v3` contenait `incidents[0].id = ucp-public-site-unverified` mais omettait `blocker_id`, exigé par `scripts/sprint-contract.mjs`. Toutes les 73 entrées UCP ont été conservées ; aucune prétention de recette réelle nouvelle.

**Passe de correction :** récupération du bail CONTROL expiré avec nouveau `run_id` unique, preservation `checkpoint`, `last_completed` et historique `recovered_from`. Acquisition séparée d'un bail UCP inactif, ajout du seul champ `blocker_id` égal à l'ID existant, relecture SHA et libération du bail UCP sans modifier son application ni ses résultats. Activation explicite de la tâche CONTROL demandée par l'utilisateur, fréquence XXh50 Europe/Paris inchangée et sans toucher aux autres automatisations.

**Autocritique 1 :** les anciennes exécutions ChatGPT Tasks peuvent s'arrêter avant libération de bail ; GitHub seul ne prouve pas pourquoi la tâche a été désactivée. Un verrou GitHub est coopératif et ne constitue pas un mutex global. Un workflow Pages vert ne prouve pas que le déclenchement horaire ChatGPT se produira à l'avenir. Les notifications de cette tâche sont configurées côté plateforme et peuvent être désactivées indépendamment.

**Deuxième passe et tests :** correction de la preuve documentaire et test réel de l'intégrité des rapports sur `main`. Au commit `4c3479819054c76e2e3555075755d41714674c51` : [CI générale 174/174 PASS](https://github.com/cosscoll/Avancement-Projet/actions/runs/39560080318), [contrat de rapports 14/14 PASS](https://github.com/cosscoll/Avancement-Projet/actions/runs/39560080290), [déploiement Pages PASS](https://github.com/cosscoll/Avancement-Projet/actions/runs/39560079395). Les échecs précédents restent consultables et ne sont pas effacés.

**Autocritique 2 :** correction du champ UCP prouvée et tâche CONTROL `is_enabled:true` confirmée par le service Tasks, mais **prochain lancement effectif XXh50 encore non observé** à la date de cette note : ne pas prétendre qu'un sprint autonome a déjà repris ni que des notifications mobiles fonctionnent. La cause technique précise de la désactivation antérieure n'a pas été déterminée. La priorité fonctionnelle demeure CONTROL-ACCOUNT, authentification réelle et base CONTROL indépendante toujours bloquées par approbation/infrastructure à 0 €. Le prochain sprint devra contrôler d'abord `recovered_from`, l'absence de code à reprendre pour le run interrompu, le checkpoint authentification, puis acquérir son propre bail et produire un résultat concret avec ses preuves.

## 21 octobre 2026 — CONTROL-ACCOUNT, doubles sessions et nettoyage réseau

**Avant :** après une vérification de session répétée sur le même compte, `verifiedSession()` incrémentait `epoch`, invalidait le chargement privé en cours et ne lançait aucun rechargement de remplacement tant que `waiting` était vrai : affichage potentiellement vide. Un second cas concernait une déconnexion suivie d'une reconnexion rapide au même identifiant : l'ancienne requête pouvait remettre `waiting=false` pendant le nouveau chargement.

**Première passe :** test de régression reproduit en échec (**6/7** avant correctif). Ajout d'un compteur `verificationSeq` distinct de l'epoch de données, renouvellement de l'epoch seulement quand le compte change ou est perdu, et invalidation explicite à la déconnexion. Publication dans `main` : code [15401dcd](https://github.com/cosscoll/Avancement-Projet/commit/15401dcd7742012499e335de476f2f9c532ad248), test [f3562441](https://github.com/cosscoll/Avancement-Projet/commit/f35624412750c838019c60676a94b4ade506c49b).

**Autocritique 1 :** le verrou asynchrone `waitingOwner` était indexé uniquement par identifiant utilisateur. Le même utilisateur peut reprendre une nouvelle session pendant que la requête de la session précédente se termine : les propriétaires égaux n'impliquent pas des générations de session égales.

**Deuxième passe :** test de la reconnexion du même compte reproduit en échec (**7/8**). Ajout de la condition `token===epoch` à la libération du verrou, puis publication du code [9c66ff2b](https://github.com/cosscoll/Avancement-Projet/commit/9c66ff2b4ff7c2c11d83aecac5d669f72702fc0c) et du test [87bac45e](https://github.com/cosscoll/Avancement-Projet/commit/87bac45ebdc2c03467791974ea6cf11a7aa74282).

**Contrôle après publication :** relecture des fichiers réels `assets/cloud-app.js` et `tests/control-cloud-session-isolation.test.mjs` depuis `main`, exécution des huit fonctions de tests de régression dans un moteur JavaScript isolé : **8/8 réussis**, syntaxe JavaScript valide. Ces simulations sont utiles mais ne remplacent **ni** les GitHub Actions Node ni des essais avec des comptes Supabase réels.

**Autocritique 2 et suite :** statut de la CI la plus récente et du déploiement Pages **non vérifiable** avec les outils disponibles ; ne pas ajouter des preuves fictives. Cloud reste désactivé et le jalon CONTROL-ACCOUNT réel reste bloqué en l'absence d'un projet Supabase CONTROL distinct, autorisé et garanti sans frais. Prochaine tâche : contrôler CI/Pages au bon SHA, journal d'exécution horaire, puis poursuivre un critère de compte indépendant sans nouvelles créations de services payants.


## 21 octobre 2026 — CONTROL-ACCOUNT : isolation des écritures et accusés de suppression

**Défaut reproduit :** requête A mise en attente, utilisateur B actif avant son retour. L'ancienne fonction \`saveItem\` appelait \`audit\` avec \`authUser.id\` courant, insérant un événement sous B pour une entité de A, puis déclenchait dans B un rechargement et le message « Enregistré dans votre compte privé ». Les cinq opérations concernées étaient \`saveItem\`, \`saveProject\`, \`eraseItem\`, \`eraseProject\` et \`markDone\`. Les suppressions ne confirmaient aucune ligne réellement affectée avant d'annoncer la réussite.

**Première passe :** capture de \`owner\` et \`epoch\` à l'entrée de chaque action et revalidation de cette session après les retours asynchrones, avant l'audit, après l'audit et après le rafraîchissement. \`audit\` reçoit explicitement l'owner de l'opération. Les deux suppressions utilisent \`select('id').single()\` et refusent un résultat sans ligne. Code dans \`main\` : [05cda5b](https://github.com/cosscoll/Avancement-Projet/commit/05cda5bcc2cff617e7d8f38c60925fa5318231b2).

**Autocritique 1 :** la première reproduction ne couvrait que le retour de requête avant l'audit ; une requête qui finit pendant un changement de compte, puis attend l'audit ou le rafraîchissement, peut également entraîner une navigation ou une notification trompeuse. Ajout d'une recette dédiée sur le CODE du dépôt et intégration au workflow Cloud : [a029574](https://github.com/cosscoll/Avancement-Projet/commit/a029574b3f87df52617158f63ac37749c49f57d8), [5d97836](https://github.com/cosscoll/Avancement-Projet/commit/5d97836f4cf6078b02bce1b60981a247c655e6d9).

**Deuxième passe :** tests de l'audit différé, du rechargement différé et de la déconnexion/reconnexion du même propriétaire pendant une opération : **15/15 simulations de mutation réussies** et ancienne suite de chargement de session **8/8 réussie**, donc 23 fonctions de test source-extraites exécutées en moteur JS isolé. Renforcement des trois cas ajouté au fichier de recette : [bfa62af](https://github.com/cosscoll/Avancement-Projet/commit/bfa62af5e73094cfc0aa6796fe7425277a4f49ae).

**Autocritique 2 et blocages persistants :** ces tests ne sont **pas** une preuve d'exécution Node sur GitHub Actions, ni d'une requête HTTP aboutie sur la version Pages, ni d'une authentification Supabase réelle. Les connexions réseau à GitHub Pages et à l'API publique GitHub ont échoué dans l'environnement présent. Aucune création de projet Supabase ni modification de la base IAgile ; CONTROL Cloud reste désactivé. Une requête A peut avoir été enregistrée sur le serveur après un changement de compte, même si l'application supprime son ancien message de réussite : relire le compte d'origine pour vérifier. D'autres écritures asynchrones hors CRUD de base exigent des contrôles propres lors des prochains sprints. **Prochain jalon :** preuve CI/Pages associée aux commits actuels, puis audit et tests des fonctions asynchrones de mission et de réunion.


## 21 octobre 2026 — développement CONTROL sur main, vérification réelle APRÈS Pages

**Consigne propriétaire confirmée :** pour CONTROL, développer, corriger et sauvegarder directement dans la branche `main` du dépôt `cosscoll/Avancement-Projet`, sans création de branche ni PR. Garder le bail coopératif et les SHA conditionnels, les prétests de sécurité, la CI et une preuve de publication. Un commit sur `main` ne prouve pas à lui seul la publication sur GitHub Pages.

**Problème reproduit :** le workflow de recette `CONTROL IA — Recette navigateur Chromium` contrôlait les 12 fichiers HTTP publics dès le `push`, avant le build/déploiement Pages. Le run historique [39575087501](https://github.com/cosscoll/Avancement-Projet/actions/runs/39575087501) avait échoué sur un `assets/cloud-app.js` obsolète alors que Chromium local avait réussi.

**Première passe :** déplacer la vérification publique vers un job déclenché par `deployment_status` seulement pour `success` sur `github-pages`, vérifier que `deployment.sha` correspond au `main` checkout, puis comparer les octets de 12 fichiers publics avant d'exécuter Chromium. Le job local reste sur `push`. [Commit direct main 4e88d95](https://github.com/cosscoll/Avancement-Projet/commit/4e88d95cd0e9162cf3b9963058ca280c34c4f2ef). Preuve publique réelle à ce SHA : [Chromium 39577771105, vert](https://github.com/cosscoll/Avancement-Projet/actions/runs/39577771105).

**Autocritique 1 :** les événements de déploiement successifs partageaient le même groupe de concurrence avec le `push` : le test local du premier commit a été annulé alors que son test en ligne a réussi. **Deuxième passe :** isoler les groupes par nom d'événement, ref et statut `deployment_status` ; aucune suppression ou désactivation de tests. [Commit direct main 1464cbf](https://github.com/cosscoll/Avancement-Projet/commit/1464cbf69b247702c94a46998f392ea9e1a90352).

**Recette de la deuxième passe, preuves GitHub Actions sur le même SHA 1464cbf :** [Chromium local après push 39577830659 : vert](https://github.com/cosscoll/Avancement-Projet/actions/runs/39577830659), [Pages 39577830376 : déploiement réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39577830376), [Chromium sur pages réellement publiées 39577895141 : vert](https://github.com/cosscoll/Avancement-Projet/actions/runs/39577895141). Les contrôles en ligne incluent correspondance octet à octet des 12 fichiers HTML/JS/JSON, tâches et agenda locaux, navigation, écran mobile simulé, PWA hors ligne et maintien du garde-fou Cloud.

**Autocritique 2 :** les événements intermédiaires `deployment_status` apparaissent comme des jobs ignorés, ils ne constituent pas une preuve de publication ; seul le run postdéploiement réellement exécuté et vert compte. Les tests GitHub Chromium ne remplacent pas un téléphone physique, et la réussite de CONTROL personnel ne valide pas une base multi-utilisateurs : `config/cloud.json.enabled` reste `false`. Les prochaines étapes restent l'audit des écritures asynchrones des réunions/missions, puis l'accord pour une base CONTROL indépendante à 0 € si vérifiable.


## 21 octobre 2026 — CONTROL-ACCOUNT : huit intégrations asynchrones et écrans obsolètes

**Avant :** les modules Cloud de visioconférence, commandes Claude/Gemini, laboratoire et bibliothèque d'outils comportaient huit fonctions asynchrones vérifiant tout au plus l'ID de l'utilisateur. Une déconnexion suivie d'une reconnexion au **même ID** avant la réponse de la requête pouvait injecter une ligne d'une ancienne session dans un nouveau cache ou annoncer une opération qui n'avait pas été confirmée pour la nouvelle session. Reproduction red sur les huit callbacks réels extraits d'\`assets/cloud-app.js\`.

**Première passe :** ajout systématique du jeton de génération \`mutationSession()\` à l'entrée de chacun des huit callbacks (Visio create/update/remove, Command dispatch/create/update mission, Lab saveMission, Catalog onAdd). Après le réseau, une session remplacée retourne \`false\` sans toucher au nouveau cache. Le dispatch vérifie l'appartenance de la mission avant l'appel API, puis revalide la session après la relecture serveur ; les lignes renvoyant \`owner_id\` sont vérifiées. [Commit main 9e217f7](https://github.com/cosscoll/Avancement-Projet/commit/9e217f75a982f56b77083a4b5326e0c34fe81fc5).

**Autocritique 1 :** les gardes ne suffisaient pas si un ancien composant conservait ses callbacks *après* un changement de compte : cliquer depuis cette ancienne vue pouvait créer une opération sous le nouvel utilisateur. Une ancienne fonction de lecture pouvait même accéder au cache courant d'un autre utilisateur. **Deuxième passe :** quatre captures \`mountedSession\` associées à Visio, Command, Lab et Catalogue, vérifiées *avant* toute nouvelle requête et appliquées aux lecteurs privés (listes, contexte, liens d'espace et état d'un outil). [Correctif main 43b5771](https://github.com/cosscoll/Avancement-Projet/commit/43b5771289bed27faf376bf782055974df354d42).

**Tests permanents :** [40 tests Node](https://github.com/cosscoll/Avancement-Projet/commit/e280d9921c08259bf853f59b6682bdb66d8809ac) : 8 faux retours sous une reconnexion A identique, 8 changements A→B, 8 parcours normaux A, 8 tentatives d'écriture depuis anciennes vues montées, 4 tests négatifs/de concurrence et 4 tests d'exposition des données de nouvelles sessions. La suite est invoquée via le [workflow Cloud dédié](https://github.com/cosscoll/Avancement-Projet/commit/dc2fdc2171d7237db16984521471b557fa3a7a8b).

**Preuves réelles du commit \`e280d9921c08259bf853f59b6682bdb66d8809ac\` :** [CI Cloud 78/78](https://github.com/cosscoll/Avancement-Projet/actions/runs/39580789879), [CI générale 232/232](https://github.com/cosscoll/Avancement-Projet/actions/runs/39580789994), [GitHub Pages déployées](https://github.com/cosscoll/Avancement-Projet/actions/runs/39580789090), [Chromium postdéploiement vert](https://github.com/cosscoll/Avancement-Projet/actions/runs/39580913525) avec les 12 actifs publics conformes octet par octet à la version testée. Aucune branche ni PR.

**Autocritique 2 :** ces 40 tests sont synthétiques (requêtes simulées et utilisateurs A/B fictifs) même s'ils exécutent le code réellement versionné avec Node. Le navigateur réel valide l'interface publique et la présence de la source Cloud, **pas** des comptes authentifiés ou une base privée. La mise en place réelle de CONTROL-ACCOUNT exige une instance Supabase CONTROL distincte, l'accord explicite du propriétaire pour tout nouvel accès, une garantie de coût nul, puis des tests Auth/JWT/RLS entre deux utilisateurs réels. \`config/cloud.json.enabled:false\` demeure inchangé. Une mutation réseau déjà terminée avant le changement de session peut exister côté serveur même si le client ne montre aucune confirmation dans le nouveau compte : la relire dans le compte d'origine. Étape suivante : auditer la migration historique, les exports/imports et la suppression de compte, sans altérer les autres projets.


## 21 octobre 2026 — CONTROL-ACCOUNT : import hérité, export et suppression

**Défaut initial reproduit sur le code de production :** le compte A confirmait l'import de projets historiques ; un changement de session A→B pendant les deux téléchargements de catalogues amenait `importLegacy` à insérer des projets et une note privée de A sous `owner_id=B`, à enregistrer les préférences de B puis à annoncer un transfert réussi. Cette reproduction utilisait un backend simulé, pas une base Supabase active.

**Correctif direct `main` :** [56648b7](https://github.com/cosscoll/Avancement-Projet/commit/56648b7c96326daf2be6e389c1fc8c886dc61a2a) retient `mutationSession()` à l'entrée du transfert et refuse de poursuivre si son propriétaire ou génération de session change, après les chargements et chaque écriture, avant de modifier le cache, d'enregistrer le marqueur final, de naviguer ou d'afficher une réussite. Les exports ne peuvent plus déclencher un téléchargement après changement de compte pendant le chiffrement. Une réponse tardive du backend de suppression du compte A ne peut plus déconnecter le nouveau compte B.

**Recettes permanentes :** [11 tests](https://github.com/cosscoll/Avancement-Projet/commit/26490addf0b6bd5f659c3a45e90c9d5a73d285ea) d'import A→B après fetch/projet/ressource/préférences, reconnexion A, import normal A, export chiffré/clair et suppression confirmée/non autorisée. Ils sont reliés au workflow Cloud : [01c1e19](https://github.com/cosscoll/Avancement-Projet/commit/01c1e198af9a9fb5123b605173ebaecfe9ebcbeb). **Preuves du même SHA 01c1e19 :** [CI Cloud 89/89](https://github.com/cosscoll/Avancement-Projet/actions/runs/39582822619), [GitHub Pages réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39582822702), [Chromium sur la version publique réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39582888205).

**Autocritique :** la gestion des migrations n'est pas transactionnelle : si une requête a déjà abouti sur A avant le changement de session, sa ligne peut subsister sur A ; le client ne prétend pas avoir annulé la transaction serveur. Les tests sont synthétiques et l'application Cloud reste volontairement désactivée. Il faut toujours une instance CONTROL distincte approuvée à 0 €, deux vrais comptes Auth avec JWT et RLS, et une recette multi-appareils pour conclure `CONTROL-ACCOUNT`. Le prochain chantier est la cohérence entre le registre historique des 9 capacités et la liste canonique des 22 tickets, sans perdre la trace des anciens identifiants incohérents.


## 21 octobre 2026 — Traçabilité BACK V1.2 : 19 références historiques hors catalogue

**Défaut vérifié :** `data/control-ia-delivery.json` contenait 19 références actives `BACK-023` à `BACK-042` dans les capacités Compte, Connecteurs, Agenda, Rappels et Qualité, alors que le registre canonique `data/control-ia-requirements.json` ne contient que `BACK-001` à `BACK-022`. Le validateur V1.2 protégeait la liste de 22 tickets, mais pas les liens externes `source_tickets` des capacités.

**Correction sur main, sans perte :** chaque référence absente de la nomenclature canonique a été déplacée dans `legacy_unmapped_ticket_refs` de sa capacité d'origine. Les 19 anciennes étiquettes restent conservées dans leur ordre initial pour une réconciliation future avec le cahier privé. Aucun ticket officiel, état de recette, critère, statut ni preuve n'a été inventé ou requalifié. Les capacités Agenda et Rappels n'ont pas de lien BACK canonique démontré : elles gardent un tableau `source_tickets` vide, ce qui est préférable à une correspondance fictive. [Changement  c26a7b2](https://github.com/cosscoll/Avancement-Projet/commit/c26a7b222fbe249a35ecea8528c096183023a488).

**Deuxième passe :** `scripts/control-ia-requirements.mjs` vérifie les sources réelles, les doublons, le chevauchement entre étiquettes archivées et vraies références et la cohérence du compte historique. Quatre tests permanents supplémentaires portent la suite à **16 tests**. [Code validateur 9ad9824](https://github.com/cosscoll/Avancement-Projet/commit/9ad9824b36db3deee56d6c6efde685895380a124), [tests d7c2e10](https://github.com/cosscoll/Avancement-Projet/commit/d7c2e10ead022bc7bbc5e6c8628baa524abf4301).

**Preuves :** [GitHub Actions V1.2 : 16/16](https://github.com/cosscoll/Avancement-Projet/actions/runs/39584035439), [Pages réussies](https://github.com/cosscoll/Avancement-Projet/actions/runs/39584036998), [Chromium public après déploiement réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39584287643), tous sur le même SHA `8c63aa3f2d4505055e13b9addafca09b1743a52f`.

**Autocritique :** la cohérence des IDs n'est pas une recette fonctionnelle. Elle ne débloque pas un compte Cloud, un rappel serveur, ni la réalisation des 42 scénarios. Toute future correspondance des anciennes étiquettes avec un ticket canonique doit être fondée sur le cahier privé exact, sans le transférer sur GitHub public et sans effacer l'historique. Prochain sprint P0 : corriger une nouvelle course démontrée dans la déconnexion asynchrone Cloud (la fin de la déconnexion de A peut réinitialiser le compte B récemment connecté).


## 21 octobre 2026 — Déconnexion asynchrone : une ancienne session ne peut pas effacer la suivante

**Défaut reproduit :** quand A lançait `client.auth.signOut({scope:'local'})`, puis que B se connectait pendant l'attente, la fin de la promesse reprenait un code qui vidait `authUser`, `cache` et l'interface sans vérifier le compte courant. Même problème après confirmation de suppression de compte sur le serveur, au moment de la déconnexion locale ; reproduction avant correctif avec réponses différées en JavaScript isolé.

**Première passe :** capturer `mutationSession()` dans l'action `logout` et revalider avant et après l'attente de `signOut`; faire de même après `signOut` sur la suppression de compte. Vérifier `signedOut.error` avant tout message de réussite de la déconnexion locale. [Commit direct main 372141b](https://github.com/cosscoll/Avancement-Projet/commit/372141b2c25904be02402c1016b381e762fedd1b).

**Deuxième passe :** huit tests complémentaires, portant la suite lifecycle à **19 tests**, garantissent que le retour tardif de A n'efface pas B, ne réinitialise pas une nouvelle session A, ne réagit pas une seconde fois si l'événement SDK `SIGNED_OUT` s'est déclenché entre-temps, n'invente pas de réussite en cas d'échec et préserve la déconnexion normale. [Tests 0edd1da](https://github.com/cosscoll/Avancement-Projet/commit/0edd1da2aa561dce7d0352269a1d94f05211bc9c).

**Vérification exacte SHA `0edd1da2aa561dce7d0352269a1d94f05211bc9c` :** [CI Cloud 97/97](https://github.com/cosscoll/Avancement-Projet/actions/runs/39584799187), [CI générale 255/255](https://github.com/cosscoll/Avancement-Projet/actions/runs/39584799394), [Pages réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39584798321), [Chromium sur site public après déploiement réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39584868792).

**Autocritique et suite :** les tests des comptes restent des simulations et ne peuvent pas garantir les effets internes de `signOut` dans un SDK Supabase réel. L'événement `onAuthStateChange('SIGNED_OUT')` possède son propre chemin asynchrone : examiner les événements ordonnés dans le prochain sprint sans désactiver la suppression immédiate des données au logout. `config/cloud.json` reste `enabled:false` ; aucun projet externe supplémentaire, aucune dépense et aucune authentification A/B réelle.


## 21 octobre 2026 — Événement SIGNED_OUT tardif : récupération d'une session valide

**Défaut reproduit :** après une authentification réussie du compte B, un événement tardif `SIGNED_OUT` provenant d'une précédente session A effaçait immédiatement `authUser`, les caches et l'interface. Si aucun autre événement `SIGNED_IN` n'arrivait ensuite, B restait bloqué sur le formulaire de connexion même lorsque l'API de vérification renvoyait toujours B. Reproduction red avec la vraie fonction du callback d'authentification et les fonctions réelles `verifiedSession` / `reload` du dépôt, en simulant l'API externe.

**Correctif sécurisé :** après `SIGNED_OUT`, vider **immédiatement** toutes les données locales, réinitialiser les protections d'appel, montrer l'écran de connexion, puis programmer `verifiedSession()` après l'événement pour vérifier l'identité effective auprès de l'API Auth. Si B est effectivement valide, restaurer uniquement son espace et recharger ses données filtrées par `owner_id`. Si aucune session n'existe, rester déconnecté. Le numéro de vérification `verificationSeq` empêche qu'une vérification plus ancienne ne ressuscite A. [Code `main` 1096ead](https://github.com/cosscoll/Avancement-Projet/commit/1096eade36e363ac3e9a6a30268e231fa80746c6).

**Deuxième passe :** quatre nouveaux tests d'événements de session, portant la suite à 12, couvrent `SIGNED_OUT` tardif après B, déconnexion authentique, inversion des événements et nouvelle connexion au même compte A. Les tests déclenchent les callbacks extraits du code de production. [Tests b4664d7](https://github.com/cosscoll/Avancement-Projet/commit/b4664d7be164f3b7067710d5dfcca6b858d22160).

**Preuves exactes SHA `b4664d7be164f3b7067710d5dfcca6b858d22160` :** [CI Cloud 101/101](https://github.com/cosscoll/Avancement-Projet/actions/runs/39585459362), [frontend 259/259](https://github.com/cosscoll/Avancement-Projet/actions/runs/39585459387), [Pages réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39585458752), [Chromium postdéploiement réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39585511880).

**Autocritique :** l'écran de connexion peut apparaître brièvement en cas d'événement tardif, parce que la confidentialité impose de ne pas conserver l'ancien cache en attendant la vérification. Les cas de test utilisent une simulation du fournisseur Auth ; aucune garantie de comportement de son SDK interne n'est donnée sans l'instance réelle et les deux comptes A/B. Ce correctif n'autorise ni le démarrage de CONTROL Cloud ni la réutilisation de la base IAgile. Le prochain jalon reste la preuve d'un backend indépendant approuvé à coût nul, puis une recette de sessions et de règles RLS réelles.


## 21 octobre 2026 — IMP-05 : diff, risque, périmètre et reçu local avant exécution

**Avant :** le moteur local de CONTROL proposait et enregistrait déjà certaines tâches et échéances après consentement, mais la confirmation affichait seulement un résumé et le nom du projet ; elle ne détaillait ni le **changement avant/après**, ni le **risque**, ni le numéro de reçu du journal `operatorAudit`. Un formulaire pouvait ainsi manquer de clarté sur la modification réellement approuvée.

**Premier développement, sans infrastructure externe :** nouvelle fonction déterministe `reviewAction` dans `assets/control-operator-core.js`, qui compare la cible et les données actuelles aux attentes inscrites dans la proposition. Elle distingue création de tâche, création/déplacement/suppression d'échéance locale et changement déclaratif d'état d'une tâche. Le panneau `assets/control-operator.js` affiche par texte sûr la cible, l'état avant, l'état après et le niveau de risque ; il réévalue la proposition quand l'utilisateur modifie les champs et **juste avant** tout enregistrement. Permission ou périmètre retiré, projet renommé/supprimé, état/date modifié, titre ou date invalide : action refusée, aucune écriture. Aucun message n'assimile un statut local à une exécution de fournisseur IA.

**Reçu réel :** `assets/command-center.js` expose `operatorReceipt` depuis la dernière entrée sauvegardée du journal local ; l'interface ne l'affiche qu'après `operatorExecute` confirmé. **Autocritique n°1 :** le premier chemin de composants n'avait pas transmis `receipt` à travers `assets/local-ai.js`. Un test Chromium renforcé a signalé l'échec au lieu de produire un faux vert. Le correctif de seconde passe [8e75c73](https://github.com/cosscoll/Avancement-Projet/commit/8e75c73713dc3bcc0aa5b8685c20cb293d19a7d5) a raccordé cet adaptateur ; assertion de reçu conservée.

**Tests :** [18 nouveaux tests Node](https://github.com/cosscoll/Avancement-Projet/commit/7e8d31fff22c0ddd9c46adcf9e5463e286ed6e11) couvrent calcul du diff, niveau de risque, isolation des projets, révocation de scope/consentement, changement de cible, dates obsolètes et reçu provenant du stockage. [CI générale 277/277](https://github.com/cosscoll/Avancement-Projet/actions/runs/39587241317) ; [recette Chrome isolé réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/39587241379) avec vrai formulaire, blocage des permissions révoquées, écriture locale et reçu. [Pages réussies](https://github.com/cosscoll/Avancement-Projet/actions/runs/39587240349) et [recette Chrome postdéploiement réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/39587349013). Toutes ces preuves portent sur le commit **`8e75c73713dc3bcc0aa5b8685c20cb293d19a7d5`**.

**Autocritique n°2 :** `reviewAction` est une protection du parcours **local** ; les données restent enregistrées sur cet appareil et peuvent être éditées via les outils du navigateur. Les fonctions de préparation, confirmation et journaux ne constituent pas des droits serveur, un service d'approbation entre utilisateurs ni une autorisation OAuth. `IMP-05` conserve donc son statut d'initiative non pleinement validée. Pour les actions multi-comptes, le système doit contrôler les autorisations **sur un backend CONTROL indépendant**, deux vrais JWT, règles RLS A/B et révocation en cours d'exécution. Infrastructure Cloud toujours désactivée, prix tiers 0 € non présumé.

**Suite utile :** travailler sur l'idempotence des confirmations/reprises locales (`IMP-10`) et la mémoire cloisonnée par projet (`IMP-03`) tant que le backend réel n'est pas approuvé. Toujours un seul chantier à la fois, commits directs dans `main`, CI et preuve Pages sur le SHA réellement publié.


## 21 octobre 2026 — IMP-10 : confirmation locale idempotente et reçu conservé

**Avant :** le journal local `db.operatorAudit` attestait qu'une tâche/échéance avait été écrite, mais rien ne reliait une proposition approuvée à une identité d'opération stable. Une reprise ou un double envoi ultérieur de la même proposition pouvait effectuer une **deuxième écriture** et créer des doublons. Le reçu public de la dernière action pouvait aussi provenir d'une action différente en cas de nouveau journal entre temps.

**Première passe :** chaque proposition du panneau `assets/control-operator.js` reçoit un identifiant local unique `approvalId` qui reste inchangé lorsque l'intitulé/la date sont édités. Dans `assets/command-center.js`, l'enregistrement conserve `approval_id` et la signature exacte de l'action dans le même journal `operatorAudit`. Si le même identifiant revient avec la même cible et une signature identique, le moteur réutilise la **référence réelle de l'écriture déjà confirmée**, sans mutation supplémentaire. Si la signature diffère ou que le projet a été retiré, l'action est refusée. En cas d'échec du stockage, l'audit et les modifications sont tous deux annulés avant toute nouvelle tentative. [Implémentation](https://github.com/cosscoll/Avancement-Projet/commit/8ce413757a9a62a119076edb99af50c90c6db407).

**Autocritique et deuxième passe :** la source du reçu utilisait auparavant la dernière entrée de la liste, ce qui n'était pas correct pour un replay d'une opération antérieure. Elle retrouve désormais la ligne `operatorAudit` correspondant exactement à l'exécution demandée. Le contrôle ne doit pas être un mécanisme d'autorisation : avant même de réutiliser une preuve de succès, le projet doit toujours exister et être autorisé pour le contexte local courant. La collision d'une clé avec une action différente doit être rejetée.

**Tests :** [13 régressions permanentes](https://github.com/cosscoll/Avancement-Projet/commit/36c366786df0e8502a6c2a3f75b95b2084e4703a) : double clic/rejeu logique, redémarrage du moteur sur un stockage conservé, collision, projet retiré, échec puis retry, demandes distinctes, création d'événement, suppression/déplacement d'échéance et clôture de tâche. **Preuves sur le SHA `36c366786df0e8502a6c2a3f75b95b2084e4703a` :** [290/290 tests Node](https://github.com/cosscoll/Avancement-Projet/actions/runs/39588124741), [GitHub Pages déployé](https://github.com/cosscoll/Avancement-Projet/actions/runs/39588123999), [Chromium sur Pages avec contrôle des fichiers publics réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39588195602).

**Limites :** la recherche de doublons utilise les **200 dernières lignes du journal local** et l'écriture n'est pas transactionnelle entre plusieurs onglets ou appareils ; ne pas appeler ce mécanisme « exactement une fois » global. Aucune synchronisation authentifiée, moteur externe, fournisseur IA, API payante ou base privée n'a été activé. `IMP-10` demeure **partiellement implémenté localement**, pas accepté intégralement selon le cahier des charges. Prochaine étape : vérifier s'il existe déjà une mémoire locale par projet avec source/version/révocation ; si des lacunes sont confirmées, développer `IMP-03` sans exposer les contenus privés.


## 21 octobre 2026 — IMP-03 : décisions locales versionnées et mémoire par projet

**Défaut confirmé :** dans le panneau Mémoire, une création/suppression effectuait `db.decisions.push` ou un filtrage, puis appelait `save()` **sans contrôler sa réussite**. En cas de stockage refusé, le tableau en mémoire continuait d'afficher une décision créée/supprimée comme si l'enregistrement avait réussi. Les utilisateurs ne pouvaient pas corriger une décision existante en gardant son identifiant, sa date d'origine et un numéro de version.

**Première passe :** nouvelles fonctions `writeDecision`, `removeDecision` et `decisionVersion` dans `assets/command-center.js`. Elles valident le projet, le titre, la justification et la source **déclarée** ; création en version 1 ou correction en version N+1 en gardant ID et date d'origine. La correction doit préciser la version attendue, sinon elle est refusée. Deux décisions de même titre normalisé et de contenu divergent au sein d'un seul projet sont refusées comme potentiellement contradictoires ; les projets différents restent indépendants. Une écriture ou suppression échouée provoque un retour à l'état précédent au lieu d'un faux succès. Les anciens enregistrements sans `version` restent lisibles comme version 1.

**Deuxième passe utilisateur :** le tableau Mémoire affiche le projet, la date, le numéro de version et la source déclarée ; un bouton Corriger préremplit le formulaire. L'export explicite de contexte est limité au projet choisi et cite la provenance et la version des décisions, sans prétendre avoir vérifié le contenu externe. La suppression enregistre la nouvelle liste seulement si le stockage confirme.

**Preuves techniques :** [15 tests permanents](https://github.com/cosscoll/Avancement-Projet/commit/729db5f5e10f9f2f32ade8832fb2c3a391957c20) pour versions obsolètes, projet non autorisé, doublon/contradiction, source manuelle, échec de stockage à la création/correction/suppression et isolation de suppression. [Suite générale 305/305](https://github.com/cosscoll/Avancement-Projet/actions/runs/39589297732). [Recette Chrome locale](https://github.com/cosscoll/Avancement-Projet/actions/runs/39589297700) : formulaire réel v1, bouton Corriger, passage v2 et suppression. [GitHub Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/39589296550) et [Chrome public postdéploiement](https://github.com/cosscoll/Avancement-Projet/actions/runs/39589355732) réussis sur le SHA **`741f542b95519e626f10dc92592a6b37235aaea2`**.

**Autocritique :** les conflits détectés portent sur les titres identiques, pas sur toutes les contradictions sémantiques. La provenance est un champ saisi, non une source certifiée ni un contrôle de validité temporelle. Un stockage local ne fournit pas la suppression synchronisée entre appareils, une transaction multi-onglets garantie, ni l'isolation Auth/RLS de deux utilisateurs. **`IMP-03` est un progrès local et non une acceptation intégrale V1.2** ; aucun statut `real_verified` des exigences privées n'est modifié. Le Cloud reste désactivé et toute dépense interdite.

**Suite :** inspecter la recherche locale `IMP-02` pour enrichir les résultats en source/version/date, filtrer strictement par projet, ne pas afficher de décisions supprimées ou de contexte périmé et permettre l'ouverture de l'élément concerné. Conserver les mêmes barrières de permissions, tests, main et publication.


## 21 octobre 2026 — IMP-02 : recherche locale avec périmètre, provenance et liens exacts

**Défaut initial reproduit :** `search()` créait une liste de résultats à l'ouverture de la page, puis la filtrait sur saisie sans recalculer les sources. Si une décision était corrigée ou supprimée pendant que la recherche restait affichée, son ancien contenu pouvait continuer à figurer dans les résultats. Il n'y avait ni filtre par projet, ni provenance/version/date de décision, ni lien vers la ligne exacte de mémoire.

**Correction directe sur `main` :** `searchResults(scope,query)` consulte les tableaux locaux **à chaque interrogation**, limite les sources aux projets effectivement présents dans CONTROL et refuse les scopes inexistants. Les six types couverts sont projet, action, mission, événement, décision et ressource HTTPS vérifiée par le filtre d'URL existant. L'utilisateur peut sélectionner « Tous les projets » ou un projet précis. Pour les décisions locales, la recherche affiche **source déclarée**, version, date déclarée ou manquante et « à revalider » si la date est ancienne (seuil indicatif 90 jours, pas un contrôle externe). Les résultats n'affichent pas de provenance inventée.

**Navigation et suppression :** un lien `#/control/memory/<id>` ouvre l'enregistrement de mémoire ciblé dans CONTROL, marqué et ramené à l'écran. Si l'ID n'existe plus ou si le projet a disparu, le panneau indique l'absence de la décision sans reproduire l'ancien contenu. Les résultats n'utilisent plus de cache d'index séparé qui survivrait à la suppression. [Implémentation](https://github.com/cosscoll/Avancement-Projet/commit/c7e2e0ee5ff0ad8e63e015cc482d6ed55d1f11c6).

**Tests et preuve :** [12 tests](https://github.com/cosscoll/Avancement-Projet/commit/230da340440a48d6e6dfad88b8a28c8f3c88c833) de scope, suppression, correction de version, source manquante, état de fraîcheur, sécurité des liens et navigation. [GitHub Node 317/317](https://github.com/cosscoll/Avancement-Projet/actions/runs/39590970137), [Chromium local](https://github.com/cosscoll/Avancement-Projet/actions/runs/39590969956) avec contrôle réel des filtres et du deep link, [Pages réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39590968946), [Chromium sur site public](https://github.com/cosscoll/Avancement-Projet/actions/runs/39591100473), tous sur le SHA `6a5311dd2ad47e1f84b79ee9463cbef1894a6806`.

**Autocritique :** aucune source n'est certifiée par un fournisseur externe et un âge de 90 jours n'est qu'un avertissement heuristique. Les résultats se régénèrent lors de la recherche ou du changement de périmètre, **pas au moyen d'une indexation temps réel entre onglets et appareils**. Le filtre local ne constitue pas une autorisation Auth/RLS serveur. `IMP-02` est donc implémenté et testé **localement seulement**, sans acceptation complète V1.2, sans activation de CONTROL Cloud, sans paiement et sans divulgation de données privées de tiers.

**Suite :** avancer vers `IMP-01` via un plan explicable en lecture seule, à partir de la mémoire et des tâches du projet effectivement sélectionné ; toute exécution devra réutiliser les permissions et confirmations `IMP-05`, la protection contre les rejouements `IMP-10`, puis obtenir une preuve distincte d'action effectuée.


## 21 octobre 2026 — IMP-01 : objectif local vers plan éditable et sourcé

**Constat :** CONTROL savait synthétiser les états de projets, mais ne proposait pas de parcours explicitement séparé entre « décrire un objectif », « préparer un plan », « vérifier/modifier les étapes » et « enregistrer une proposition ». L'étape inverse — exécution réelle sous permissions — n'est toujours pas disponible.

**Première passe sur `main` :** ajout `proposeGoal(projectId,goal)` dans `assets/command-center.js`. Il prépare une liste déterministe d'étapes assorties de **critères de réussite** et d'une **source** provenant des actions/décisions du seul projet autorisé, ou d'une suggestion locale clairement nommée non vérifiée. Aucune instruction ou conversation privée de fournisseur IA n'est lue. Une route `#/control/goals` et des raccourcis ajoutent un formulaire d'objectif avec prévisualisation modifiable des titres et critères.

**Contrôle de l'enregistrement :** `saveGoalPlan` refuse un projet supprimé, les champs hors limites, les étapes incomplètes et la réutilisation d'un identifiant de proposition avec un contenu différent. Un deuxième enregistrement strictement identique renvoie la même référence de plan. Si le stockage local échoue, la modification de tableau est annulée. La sauvegarde porte le statut **`proposition`** et ne crée aucune tâche, aucun rendez-vous, ni aucune exécution de fournisseur IA. [Code](https://github.com/cosscoll/Avancement-Projet/commit/944be4b144223d276bbc66dc020a893d55bbc637).

**Deuxième passe (tests sur la vraie UI) :** [12 tests Node](https://github.com/cosscoll/Avancement-Projet/commit/2232e92d946087e0d9db678d5f5ead3aa76d5e95) couvrent les projets distincts, les sources des décisions, les critères obligatoires, les modifications, les rejouements, l'échec de stockage et la non-exécution. Le [parcours Chromium](https://github.com/cosscoll/Avancement-Projet/actions/runs/39592103880) a vérifié la séparation UCP/IAgile, la modification d'un critère, l'enregistrement de l'objectif UCP et l'absence d'une création de tâche involontaire.

**Preuves :** [GitHub Actions 329/329](https://github.com/cosscoll/Avancement-Projet/actions/runs/39592107242), [Pages réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39592108116), [Chromium public postdéploiement réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/39592172395) sur le SHA publié `e2d8306ec0f2c761f136de88fc1bfaa067c30d5d`, qui contient les changements IMP-01.

**Autocritique :** ce planificateur n'est ni un modèle général, ni une recherche approfondie, ni un exécuteur autonome. Les sources utilisées restent des saisies locales et peuvent être périmées. Les plans ne se synchronisent pas entre appareils, et un reçu local ne valide aucune action métier externe. **Ne pas classer `IMP-01` comme intégralement terminé ou certifié** : il lui manque l'exécution étape par étape avec consentement et résultat prouvé, l'idempotence authentifiée et la reprise serveur. Une autre automatisation du dépôt partagé a poussé un commit de bail UCP pendant ce sprint ; les preuves citées portent explicitement sur le SHA de Pages et pas indistinctement sur toutes les révisions suivantes.

**Suite :** relier chaque proposition d'étape à une confirmation locale vérifiée `IMP-05`, avec reçu et `IMP-10` pour les redémarrages, sans jamais exécuter une action ou fournisseur sans autorisation. Préserver la logique du mono-projet, les coûts nuls et les tests Chromium lors de chaque modification.


## 21 octobre 2026 — IMP-01 : confirmer chaque étape avant création d’une tâche locale + nouveau backend CONTROL Cloud

**Point de reprise :** le sprint CONTROL ouvert à 11 h 48 UTC s'était limité à l'acquisition du verrou ; son bail a expiré à 12 h 33 UTC sans commit fonctionnel CONTROL. L'historique, les commits du dépôt partagé (UCP seulement) et l'ancien checkpoint ont été contrôlés avant récupération du bail propre à cette session, à 12 h 40 UTC. Le bail précédent a été conservé dans `recovered_expired_lease` et ne doit pas être déclaré comme un sprint terminé.

**Avant :** le planificateur local d'objectifs enregistrait des listes d'étapes sourcées, mais aucune étape ne pouvait être convertie en tâche par une validation individuelle. **Après :** le plan enregistré montre chaque étape, sa source et son critère ; le bouton « Préparer une tâche locale » ouvre un formulaire indépendant avec le nom du projet, l'état avant, l'état après et le risque. Aucun ajout à l'Agenda, aucune IA externe et aucune action automatique. La tâche n'est effectivement créée qu'après consentement explicite, relecture des données et appel au moteur local déjà protégé `IMP-05` et idempotent `IMP-10`. La tâche garde le statut local « à faire », sans prétendre qu'une mission métier est terminée.

**Autocritique n°1 puis deuxième passe :** un titre de tâche édité après la prévisualisation aurait pu invalider l'état « après » initial. Le code recalcule l'aperçu au moindre changement de titre et retire le consentement déjà coché. Avant l'écriture, il revérifie projet, plan, signature de la proposition, titre affiché, appartenance et absence de reçu de tâche déjà créée. Après écriture, le vrai numéro de reçu local est conservé ; revisiter le plan ne rejoue pas la même étape. Testées aussi : référence de plan obsolète, étape sans source, projet retiré, stockage refusé, collision d'identifiant.

**Tests de code et navigateur :** 12 nouveaux tests permanents `tests/control-goal-step-approval.test.mjs`, [suite générale 341/341](https://github.com/cosscoll/Avancement-Projet/actions/runs/39602311548) ; [Chromium local](https://github.com/cosscoll/Avancement-Projet/actions/runs/39602176753) et [postdéploiement public](https://github.com/cosscoll/Avancement-Projet/actions/runs/39602313933) sur `1eb4621fd4e9002f823a9ffe77c488b3ab14547f`. La suite a d'abord échoué sur une assertion fragile qui cherchait littéralement « IMP-05 » dans le texte du composant ; le test a été corrigé pour vérifier le consentement affiché et la véritable fonction de révision, **sans retirer les contrôles de permissions et de reçus**. Une publication Pages supplémentaire sur `ff4c1188f2829fb7e180af5ba3b5c1e0b27b0bde` avec le runbook Cloud s'est également terminée avec succès : [Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/39602485724), [Chromium public](https://github.com/cosscoll/Avancement-Projet/actions/runs/39602558986).

**CONTROL Cloud réellement créé avec l'accord explicite du propriétaire :** organisation Supabase gratuite existante « IAgile » mais **deuxième projet totalement indépendant** « CONTROL Cloud », région Paris, devis de création **0 € / mois** (ce devis ne garantit aucun dépassement de quota). Migration propre `control_saas_v1` appliquée uniquement dans la base CONTROL, 6 tables avec 6 RLS activées, 22 policies, aucun grant/policy anonymous et zéro alerte de l'analyseur de sécurité. Une transaction de tests PostgreSQL réelle a fait deux jeux d'identités A/B **simulés** par `request.jwt.claim.sub`, refusant les lectures/écritures croisées, avant `ROLLBACK` intégral. Aucun vrai utilisateur Auth enregistré, donc **aucune revendication d'authentification réelle entre deux JWT Supabase**. Voir [runbook non confidentiel](./CONTROL_CLOUD_BOOTSTRAP_20261021.md).

**Limites / suite :** `config/cloud.json.enabled` reste `false` volontairement. Les comptes Auth et leurs JWT réellement émis, tests A/B via PostgREST, synchronisation multi-appareils, contrôles mobiles matériels et exécution d'agents restent non vérifiés ; aucun statut `real_verified` V1.2 n'a été augmenté. Prochain sprint : tests de vrais comptes isolés et intégration prudente de CONTROL Cloud, après examen de la confidentialité des comptes de test et des garde-fous de coût. Développer ensuite l'approbation et l'exécution réelle uniquement sur preuve et nouvelle autorisation.


## 21 octobre 2026 — Nouveautés CONTROL visibles sur l'accueil et PWA v40

**Signal utilisateur :** « aucun changement visible c'est normal ? ». Les contrôles GitHub ont d'abord prouvé que le code `main`, Pages et le navigateur public étaient synchronisés ; en revanche l'accueil « Mes projets » n'affichait aucun lien direct vers les nouveaux outils et CONTROL Cloud restait désactivé pour raison de sécurité. Il s'agissait donc principalement d'un **défaut de découvrabilité**, pas d'un échec de synchronisation GitHub.

**Correction orientée utilisateur :** ajout direct dans `index.html`, à la suite des raccourcis et avant la liste des projets, d'un panneau « Nouveautés disponibles » : **Planifier un objectif**, **Recherche par projet**, **Mémoire des décisions**. Des liens réels pointent vers `#/control/goals`, `#/control/search` et `#/control/memory`. Le panneau précise clairement que l'utilisation reste locale sur cet appareil et que CONTROL Cloud multiutilisateur n'est **pas encore activé**. Styles discrets, accès clavier, grille mobile empilée sans surcharger la liste de projets.

**PWA et tests :** la version des deux caches du service worker est passée de `v39` à `v40`, avec les règles réseau-en-premier et le refus de fichiers HTML erronés dans le cache conservés. Six nouveaux tests vérifient la visibilité, les routes, le statut Cloud, les styles mobiles et l'invalidation du cache. La vraie recette Chromium a été enrichie : elle retourne sur l'accueil, confirme la présence des trois liens et ouvre le planificateur avant de parcourir le reste des tests.

**Incidents et correction :** les anciens tests atomiques PWA et la recette Chromium hors ligne attendaient explicitement des caches v39. Un premier run Node puis un premier contrôle public ont donc échoué *sur la version attendue du cache*, **alors que le navigateur vérifiait déjà l'accueil mis à jour**. Les assertions ont été adaptées à v40, sans supprimer les vérifications de sécurité ni les parcours de reprise hors ligne. Version finalement vérifiée `445868ff8b2618f743cd68d680aad16602ba2f9c` : [347/347 tests Node](https://github.com/cosscoll/Avancement-Projet/actions/runs/39604460675), [Chromium local](https://github.com/cosscoll/Avancement-Projet/actions/runs/39604460622), [GitHub Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/39604458769) et [Chromium public](https://github.com/cosscoll/Avancement-Projet/actions/runs/39604602243) tous verts sur le **même SHA**. Le Chromium public a testé les deux largeurs mobiles, la mise en cache PWA et la réouverture hors connexion.

**Limites et règle de suite :** la recette a utilisé un profil Chromium neuf ; si l'utilisateur continue à voir une ancienne version, faire recharger la page *en ligne* depuis le navigateur ou réouvrir l'application installée. La base Supabase CONTROL Cloud indépendante et sécurisée existe, mais les vrais comptes A/B, JWT/PostgREST et synchronisation ne sont pas encore validés : pas d'activation ni de déclaration de SaaS terminé. Un sprint ne peut plus être présenté comme « visible » uniquement sur la base de commits et de scénarios internes : tester aussi la **découvrabilité réelle depuis l'accueil**.


## 21 octobre 2026 — CONTROL Cloud : RLS sur les six tables, vraie recette JWT prête mais non exécutée

**Avancement du backend existant :** le projet Supabase indépendant `CONTROL Cloud` (`rvrmjjtdedidjnrkdery`) est toujours `ACTIVE_HEALTHY` dans le forfait gratuit de l'organisation IAgile, mais **sans partage de base** avec IAgile Academy. Une deuxième recette a testé les **six** tables du schéma (profil, projet, élément, préférence, connexion et audit) sous les identités A et B simulées par `request.jwt.claim.sub`, la lecture interdite du rôle `anon`, les mises à jour/suppressions croisées et l'usurpation `owner_id`. Aucun blocage : toutes les assertions ont réussi dans le vrai PostgreSQL. **`ROLLBACK` : 0 utilisateur Auth, 0 enregistrement CONTROL ; Security Advisor : 0 alerte.**

**Nouvelle capacité vérifiable :** un exécutable `tests/control-cloud-real-auth-e2e.mjs` permet, lorsque deux comptes Auth dédiés seront réellement disponibles, de récupérer ou accepter leurs JWT, les faire vérifier par `/auth/v1/user` sur le vrai projet CONTROL, vérifier l'absence de droits non connectés et l'isolation en API PostgREST sur les six tables. Il teste les refus `PATCH`, `DELETE`, `owner_id` forgé et association à un projet d'autrui ; il supprime les données qu'il a créées, et signale comme échec toute suppression incomplète. Pour éviter les dégâts en cas de faille RLS, il ajoute même au registre de nettoyage tout enregistrement inattendu qui aurait été accepté. **Aucun vrai compte ni jeton Auth n'a été créé ou utilisé dans ce sprint.** Les 16 nouveaux tests Node sont des contrôles d'intégrité du moteur, pas une preuve de deux JWT réels.

**Exécution sécurisée prévue :** `.github/workflows/control-cloud-real-auth.yml` est **manuel uniquement** ; il exige une confirmation explicite de deux comptes de test vides et des secrets GitHub Actions. Aucun secret, mot de passe, clé privée ni JWT n'est dans le dépôt public. Le runner accepte uniquement la clé `sb_publishable_*` et refuse d'agir sur un autre Supabase que CONTROL Cloud. Guide : [CONTROL_CLOUD_AUTH_E2E_GUIDE.md](./CONTROL_CLOUD_AUTH_E2E_GUIDE.md).

**Changement visible et honnête :** `app.html` affiche « CONTROL Cloud : base prête, accès en validation », avec le statut des 6 tables et les véritables connexions A/B restant à tester. Un lien depuis le panneau « Nouveautés disponibles » sur l'accueil ouvre l'état Cloud. La page continue à masquer l'authentification et le workspace ; le fichier `config/cloud.json` reste `enabled: false`.

**Preuves de livraison :** [363/363 tests Node](https://github.com/cosscoll/Avancement-Projet/actions/runs/39609004604), [déploiement Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/39609003181), [Chromium public après déploiement](https://github.com/cosscoll/Avancement-Projet/actions/runs/39609069781), tous verts sur le SHA **`babc5a2a75981cebe80d04dfb624fd68d509eb30`**. La recette Chromium valide aussi la page Cloud bloquée, les affichages mobiles et le cache hors connexion de la PWA.

**Blocage objectif :** l'outil Supabase connecté ne permet pas la création/connexion de deux utilisateurs Auth réels et aucun identifiant de test dédié n'a été fourni. **Ne pas déclarer une recette Auth/PostgREST réellement effectuée** : le test SQL à identité simulée et le test Node à fausses entrées ont des portées différentes. Pour poursuivre la montée en service, préparer deux vrais comptes de test contrôlés, les secrets nécessaires (hors conversation et hors GitHub public), puis lancer le workflow manuel. Ne pas activer `CONTROL Cloud` sur la PWA avant preuve de ce test et parcours complet Auth/synchronisation. Aucune dépense, aucun forfait payant et aucune modification d'IAgile Academy.



## 21 octobre 2026 — CONTROL-ACCOUNT : isolation du client, vérification négative et confirmations de missions (session classique)

**Début réel :** 13:50:47 UTC. **Objectif :** améliorer la confiance dans les données et les écritures entre comptes sans activer CONTROL Cloud ni consommer de services payants. Verrou coopératif `control-ia` acquis, SHA confirmé et respecté. Le checkpoint précédent a été relu : base CONTROL distincte en ligne, RLS testées par SQL, vrai Auth A/B toujours non prouvé.

**AVANT :** le client rechargeait les réponses d'un filtre `owner_id` sans contrôler chaque ligne rendue ; la création d'un lot de quatre missions annonçait la réussite après un simple retour sans erreur, même si le compte avait changé ; la recette E2E pouvait manquer le nettoyage d'une insertion interdite dont le reçu était masqué, ou confondre une erreur HTTP avec l'absence d'effet de bord.

**Première passe :** durcissement de `tests/control-cloud-real-auth-e2e.mjs` avec marqueurs uniques et recherche post-écriture, y compris en cas de réponse HTTP 403 ; contrôle explicite des impossibilités de nettoyage ; nouvelle suite `tests/control-cloud-real-auth-simulated.test.mjs` reproduisant des défauts d'isolation et de réponse sans appel réseau réel. Les tests documentaires et workflows Cloud ont été adaptés. Commits de départ : [E2E fail-closed](https://github.com/cosscoll/Avancement-Projet/commit/f857f8c7ee80f00efc994b1df1de57765f55110a), [simulation A/B](https://github.com/cosscoll/Avancement-Projet/commit/bdb53941622da3397652a4da51cda5d9a422ddf7).

**Autocritique n°1 :** le simulateur initial traitait à tort la table `control_profiles.user_id` comme si elle possédait `owner_id`, provoquant sept échecs ; la nouvelle logique devait aussi détecter un effet de bord après une réponse d'échec HTTP. Correction effective du simulateur et de la recherche systématique par marqueur, puis **9/9 scénarios A/B passés** sous environnement V8 avec API HTTP simulée.

**Deuxième passe :** `assets/cloud-app.js` rejette désormais une collection de projets/tâches malformée ou contenant un propriétaire étranger, ainsi que des préférences d'un autre compte. Trois régressions ont été ajoutées ; le banc de test a été corrigé pour simuler correctement le bouton de réessai sur la page d'erreur. **15/15 tests de session passés** dans le même environnement V8. La création groupée de quatre missions a également été renforcée : capture de session avant saisie, vérification du projet, réponses de quatre enregistrements et nouveau contrôle après `reload` ; **6/6 scénarios simulés passés**. Les 16 contrôles statiques des garde-fous E2E et du statut Cloud ont également été exécutés dans V8 avec dépendances adaptées : **46/46 contrôles simulés/statistiques passés au total**.

**Vérification directe de la base CONTROL (lecture seule) :** projet `rvrmjjtdedidjnrkdery` `ACTIVE_HEALTHY`, 6/6 tables avec RLS, 22 politiques basées sur `auth.uid()`, Security Advisor sans alerte, et zéro ligne dans `auth.users` et les six tables métier. Aucune donnée créée ou changée sur Supabase durant cette session.

**Autocritique n°2 et limites :** aucune vraie session JWT, aucun test PostgREST sur deux utilisateurs Auth réels, aucune recette Android physique et aucune confirmation CI Pages sur les derniers commits obtenue depuis les outils disponibles. Les 46 vérifications en V8 ne sont **pas** les suites Node natives ni un déploiement attesté. Une réponse HTTP confirmée ne remplace pas la preuve de contenu réel ; le client Cloud reste désactivé (`config/cloud.json.enabled=false`). Ne promouvoir **aucun** scénario T, critère IMP ou capacité à `real_verified` ou `operational` sur cette base.

**Prochaine action :** contrôle natif complet sur le dernier SHA, puis fourniture par le propriétaire de deux comptes Auth de test autorisés et de secrets GitHub Actions via le guide public [CONTROL Cloud Auth E2E](CONTROL_CLOUD_AUTH_E2E_GUIDE.md). Lancer la recette réelle uniquement après accord. Conserver les quotas gratuits, la séparation IAgile, le verrou coopératif et la publication directe sur `main`.


## 21 octobre 2026 — CONTROL-ACCOUNT : reçus vérifiés, import exclusif, export paginé des six tables

**Sprint conversation classique débuté à 14:45 UTC**, sous bail coopératif 45 minutes `data/sprint-state/control-ia.json` acquis et relu. Chantier principal : `CONTROL-ACCOUNT`. Budget 0 €, commits directs sur `main`, aucune donnée personnelle ni clé de service placée dans le dépôt.

**Problèmes reproductibles :** la création de quatre missions pouvait être déclenchée deux fois en parallèle et accepter des identifiants répétés ; une importation historique pouvait être lancée plusieurs fois avant sa fin ; le validateur Cloud acceptait tout domaine Supabase si le champ de référence autocertifié correspondait à l'URL (ce qui n'interdisait pas IAgile Academy) ; des sauvegardes/suppressions pouvaient annoncer succès avec des reçus attribués à un autre utilisateur ; un export utilisait les caches partiels plafonnés à 500 projets et 2 000 éléments, et omettait le profil, les connexions et l'audit.

**Corrections publiées directement sur `main` :**
- `assets/cloud-app.js` : blocage des lots de missions simultanés dans un onglet, validation de quatre identifiants distincts, désengagement du verrou par `finally`, conservation du contrôle de session après un appel asynchrone ; gardien équivalent pour les importations historiques concurrentes du même onglet.
- `safeClientConfig` refuse maintenant **tout projet Supabase autre que** la référence déjà contrôlée `rvrmjjtdedidjnrkdery`, même si l'URL et `controlProjectRef` se correspondent. La clé publiable moderne et les autres protections antérieures demeurent exigées.
- Sauvegardes de projets et fiches : reçus contenant obligatoirement un `id` et `owner_id` du compte courant ; les modifications confirment aussi l'ID d'origine. Suppressions et passage à terminé : nouvelle sélection `id,owner_id` et contrôles des valeurs exactes avant audit, navigation ou message de succès.
- L'export privé ne réutilise plus un cache limité : pagination de 400 lignes par requête dans un ordre d'ID déterministe, contrôle propriétaire et anti-doublon, refus d'un export incomplet, abandon au changement de session. Le JSON inclut désormais les **six tables métier** : profil (`user_id`), projets, éléments, préférences, connexions sans jetons et événements d'audit. Une limite documentée de 50 000 lignes par collection empêche une réussite trompeuse pour des comptes gigantesques.
- `config/cloud.json` : la note est rectifiée pour rappeler que la base CONTROL indépendante existe mais que l'ouverture des comptes et le stockage public restent désactivés.

**Tests / seconde passe corrective :** suites de régression ajoutées dans `tests/control-cloud-four-missions-session.test.mjs`, `tests/control-cloud-account-lifecycle.test.mjs`, `tests/control-cloud-config-gate.test.mjs` et `tests/control-cloud-mutation-session.test.mjs`. En reprise transversale sur le code GitHub réellement enregistré, **117/117 scénarios** ont réussi dans le moteur V8 en exécutant les bancs de test exacts avec adaptations des API Node ; 13/13 gardes de config et 9/9 simulations E2E HTTP ont également réussi dans le même environnement. Un test isolé Node.js 22 avait validé auparavant 6/6 scénarios du correctif de lot. **Ces résultats sont des simulations / tests natifs partiels, pas la preuve d'une CI GitHub Actions complète ou d'une connexion Auth réelle.**

**Vérification service :** Supabase CONTROL Cloud réel `ACTIVE_HEALTHY`, conseiller sécurité sans alerte ; `auth.users`, projets et éléments vérifiés vides en lecture seule. Le code PWA de Cloud ne se sert pas du cache du service worker public, qui ne capture ni `app.html` ni `assets/cloud-app.js` pour l'accès privé. Aucune modification SQL, création de compte test, activation Cloud, paiement ou opération sur IAgile Academy n'a été effectuée.

**Autocritique et limites :** la prévention des doublons en mémoire ne protège ni deux onglets ni deux appareils : une clé d'idempotence transactionnelle serveur est encore nécessaire. Le nouvel export lit les pages successivement sans snapshot transactionnel serveur ; des mutations simultanées peuvent empêcher une cohérence parfaite. L'Auth réelle A/B et la recette PostgREST/JWT restent bloquées par l'absence de deux comptes de test dédiés et de secrets GitHub Actions. La réussite de CI Node native pour le SHA final et le déploiement exact GitHub Pages ne sont **pas** encore démontrés par les outils de consultation disponibles. N'augmenter aucun `real_verified` sans preuve correspondante ; Cloud reste `enabled:false`.

**Point de reprise :** vérifier le dernier SHA dans GitHub Actions/Pages puis, après préparation approuvée de deux comptes Auth CONTROL vides et de secrets GitHub Actions, lancer manuellement la recette A/B déjà codée. Ensuite tester rétablissement/révocation des sessions, export complet, suppression, navigation authentifiée et mobile physique. Aucun accès à des clients réels ni service facturé.


## 21 octobre 2026 — Sprint CONTROL-ACCOUNT : CI native rétablie et écritures vérifiées

**Sprint conversation classique : 16:10–16:21 UTC**, sous verrou coopératif CONTROL `data/sprint-state/control-ia.json` avec writes SHA contrôlés directement sur `main`, budget 0 € et Cloud désactivé.

**Blocage CI réel identifié et corrigé.** Jusqu'à ce sprint, l'exécution **native** GitHub Actions qualité échouait avec 403 tests réussis sur 404 : `data/control-ia-strategy.json.handoff.next_steps` contenait cinq actions, contre une limite de trois imposée par le validateur de gouvernance. L'historique des vrais logs a été récupéré ; la stratégie a été réorganisée en **trois actions** sans supprimer aucun test ni assouplir les règles. Le commit `19637a2e65f4961c8b162b08992ad91c108674a9` a ensuite obtenu **success** sur qualité, gouvernance et traçabilité V1.2, ainsi que GitHub Pages.

**Autres corrections directes sur `main`.** Le rechargement `reload(silent)` renvoie désormais `true` après un rechargement vérifié et `false` en cas de refus, échec, conflit de requête ou session devenue obsolète. Les opérations Cloud de création, modification, suppression, validation de tâche, création de quatre missions et migration des anciens projets ne confondent plus une écriture HTTP confirmée et un rafraîchissement du compte réellement vérifié : elles refusent d'afficher une réussite trompeuse en cas de relecture échouée. Des tests natifs couvrent les refus RLS, requêtes simultanées et les confirmations supprimées. Les intégrations du Laboratoire IA, du catalogue, des visios et du poste de commande vérifient plus strictement l'identité du compte, du projet et de l'élément dans les réponses serveur, dont les suppressions de visio et la relecture après dispatch. De nouveaux tests reproduisent des reçus croisés, incomplets ou falsifiés.

**Erreur de test reproduite et corrigée pendant la session :** le nouveau test d'un reçu de mission falsifié supposait que le cache initial était vide alors qu'il contenait déjà deux éléments. L'assertion a été corrigée pour vérifier qu'ils restent inchangés. Une première exécution CI native était donc rouge pendant la modification ; elle a été corrigée avant la clôture, sans supprimer ni ignorer de scénario.

**Preuves natives pour le commit code final `d4e9a45e63d56aa59c5b5b47947b61ddc2731519` :**
- Qualité et régressions : [GitHub Actions 39633670993](https://github.com/cosscoll/Avancement-Projet/actions/runs/39633670993), **423 tests Node.js / 423 pass, 0 fail**, logs consultés ;
- Protection pré-connexion Cloud : [GitHub Actions 39633670965](https://github.com/cosscoll/Avancement-Projet/actions/runs/39633670965), **success** ;
- GitHub Pages : [GitHub Actions 39633669229](https://github.com/cosscoll/Avancement-Projet/actions/runs/39633669229), **success** ;
- Recette navigateur Chromium après déploiement : [GitHub Actions 39633745069](https://github.com/cosscoll/Avancement-Projet/actions/runs/39633745069), job « Recette Chromium après publication Pages sur main » **success**. Le job d'autres contrôles UI a été `skipped`, pas un test exécuté.

**Portée et limites.** L'historique de CI et la publication sont cette fois **réellement** vérifiés pour le commit de code, contrairement aux seuls tests V8 simulés du sprint précédent. La recette Chromium atteste les contrôles publics automatisés décrits par le workflow, **pas** une utilisation sur téléphone physique. Aucun véritable utilisateur Auth Supabase, JWT A/B, session multi-appareils, écriture RLS en conditions de deux comptes ni appel payant de Claude/Gemini/Codex n'a été testé ; aucun scénario ACC ni autre critère formel n'est promu sans preuve. `config/cloud.json.enabled=false` reste exigé. Les verrous in-page empêchent les doubles écritures dans le même onglet mais non entre appareils sans idempotence serveur.

**Prochaine reprise :** préparer puis effectuer avec validation du propriétaire la recette Auth/JWT A/B sur deux comptes dédiés de la base CONTROL indépendante, secrets stockés exclusivement dans GitHub Actions. Valider le cycle de vie, l'export complet et les permissions serveur avant toute activation. Poursuivre ensuite l'idempotence inter-appareils. Aucune nouvelle dépense, aucun accès à la base IAgile.


## 21 octobre 2026 — Sprint sauvegarde chiffrée et synchronisation sans troncature

**Objectif :** perfectionner `CONTROL-ACCOUNT`, en conservant un seul chantier prioritaire, des commits directs dans `main`, le verrou coopératif et zéro dépense. Le blocage des comptes Cloud n'a pas été levé.

**Défauts réparés dans `assets/cloud-app.js` :**
1. La sauvegarde auparavant paginée pouvait accepter une réponse API plus courte que les données réelles sans comparer le nombre total côté serveur ; les collections sont désormais contrôlées par `count: exact` après chaque extraction et par un **second tour de comptage** en fin d'export. Si le volume change, aucune sauvegarde partielle n'est produite.
2. Le tableau de bord affichait au plus 500 projets et 2 000 éléments sans preuve de complétude. Désormais : pagination par 400, comptage `exact`, ordre déterministe par ID pour la lecture, refus des lignes d'autres propriétaires, des identifiants répétés, des changements de comptage et des collections au-delà de la capacité d'affichage (5 000 projets, 10 000 éléments). L'interface revient ensuite à l'ordre « plus récent d'abord ».
3. La sauvegarde chiffrée existait dans le code mais n'était pas accessible en un clic depuis la page du compte. Bouton ajouté, export en clair explicitement signalé comme sensible, restauration automatique encore absente clairement indiquée. Saisie du mot de passe chiffrant par `<dialog>` avec `input type=password`, contrôle de 12 caractères minimum, possibilité d'annulation/Escape et CSS mobile, au lieu de l'ancien `prompt` non masqué.

**Tests :** nouvelles régressions dans `tests/control-cloud-account-lifecycle.test.mjs` et `tests/control-cloud-session-isolation.test.mjs` pour exports tronqués, comptages absents/incohérents, dérive tardive après l'export, pagination au-delà de 1 000 éléments, limites explicites, doublons, ordre d'affichage et boîte de dialogue masquée. Une série intermédiaire de tests a échoué après l'ajout de nouveaux contrôles de nombre de lignes et un mock DOM incomplet ; les assertions, le mock de requêtes PostgREST et le délai du test de chiffrement ont été corrigés, sans supprimer de tests.

**Preuves natives :** commit de code `d0a1524f7c53fcf8a150066aae31bd9b509e3ecd` : GitHub Actions qualité [39645241802](https://github.com/cosscoll/Avancement-Projet/actions/runs/39645241802) **436 tests / 436 réussis**, et workflow Cloud pre-auth [39645241709](https://github.com/cosscoll/Avancement-Projet/actions/runs/39645241709) **success**. Le commit de documentation et le dernier SHA de clôture doivent avoir leurs propres validations avant toute affirmation sur le dernier état.

**Limites :** malgré ces contrôles, pas de vrai snapshot transactionnel si d'autres appareils modifient des données sans changer le nombre total de lignes ; le nombre de projets/éléments au-delà du plafond produit une erreur plutôt qu'une interface partiellement trompeuse ; pas d'importation RESTAURATION à partir du fichier exporté ; `CONTROL Cloud` encore `enabled:false`, aucun JWT A/B de deux comptes Auth, ni tests physiques multi-appareils. Aucun critère `real_verified` ajouté.


## 21 octobre 2026 — Préparation de la restauration : inspection locale AES-GCM et isolation du compte

**Sprint manuel commencé à 17:49 UTC**, verrou coopératif unique `control-ia-20261021-backup-recovery-1749`, commits sur `main` uniquement, budget zéro. Concentration `CONTROL-ACCOUNT` : aucune dépense, aucun compte Auth créé et Cloud public toujours désactivé.

**Amélioration livrée :** l'écran « Mon compte » accepte désormais un **fichier JSON de sauvegarde CONTROL pour inspection locale**, plafonné à 50 Mio, sans upload ni écriture dans Supabase. Le format clair `control-cloud-export-v1` et le format chiffré `control-cloud-encrypted-v1` sont pris en charge. Pour le format chiffré, CONTROL réutilise PBKDF2-SHA256 (200 000 itérations) et AES-GCM, avec boîte de dialogue de mot de passe masquée et annulation. Le tampon de données déchiffrées est effacé après décodage.

**Contrôles systématiques :** vérification du compte `accountId` face à la session, du profil et des préférences, du propriétaire et des identifiants uniques pour les quatre collections, de la date, du schéma et des références projet ↔ éléments. Un changement de compte durant la lecture ou la saisie du mot de passe annule tout affichage. La prévisualisation ne renvoie que les quantités d'enregistrements et la date, jamais de titres, liens ou secrets. Une sauvegarde incorrecte ou appartenant à un autre compte est refusée. **Aucune restauration serveur, migration silencieuse, ou modification du cache n'est tentée** ; l'interface le précise.

**Recette :** nouveau `tests/control-cloud-backup-inspection.test.mjs`, 17 scénarios dédiés avec vrais exercices WebCrypto AES-GCM/PBKDF2 sous Node 22, falsification de l'enveloppe chiffrée, compte étranger, identifiants dupliqués, données orphelines, JSON invalide, taille excessive, concurrence, changement de session et refus d'upload. Les tests de cycle de vie du compte ont été adaptés à la nouvelle signature réutilisable du dialogue masqué `askBackupPassword(mode)`, sans supprimer de scénario.

**Preuves vérifiées pour le code du sprint :** [GitHub Actions qualité run 39648039792](https://github.com/cosscoll/Avancement-Projet/actions/runs/39648039792), **453 tests Node natifs, 453 pass, 0 fail**, code SHA `403308f4be3ad55a45cfcaa2625efd51b7e47725`. [Pages build 39648025505](https://github.com/cosscoll/Avancement-Projet/actions/runs/39648025505) et [Chromium après publication 39648111947](https://github.com/cosscoll/Avancement-Projet/actions/runs/39648111947) succès. Ces contrôles ne simulent pas une authentification Supabase réelle avec deux comptes.

**Limites :** cette fonctionnalité est un **pré-contrôle de restauration**, pas une restauration. Les exports passés dans une autre version ou un autre compte restent refusés plutôt que migrés automatiquement ; toute compatibilité future devra être testée et consentie. La suite du cahier doit prévoir le plan de restauration/rollback transactionnel, un verrou d'idempotence serveur inter-appareils et la recette JWT/RLS A/B après accord du propriétaire. `config/cloud.json.enabled=false`, aucun critère `real_verified` supplémentaire.
