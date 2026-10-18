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
