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

