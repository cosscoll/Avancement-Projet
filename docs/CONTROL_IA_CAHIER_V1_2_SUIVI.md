# CONTROL IA — Suivi du cahier V1.2 (index public, contenu privé)

**Date : 20 octobre 2026.** Ce fichier est uniquement un **suivi public expurgé**. Le cahier des charges fonctionnel et technique V1.2 intégral, conservant la V1.1 et ses annexes, se trouve en bibliothèque personnelle privée :

`/CONTROL-IA/CONTROL_IA_Cahier_des_charges_V1_2_PRIVE.md`

**Ne pas transférer le contenu complet du cahier privé dans GitHub public, ni publier les conversations, clés, comptes, documents et données privés.** Les identifiants et liens de test déjà publics peuvent être suivis dans ce dépôt.

## Correction vérifiée de nomenclature

- **22 tickets de développement historiques** `BACK-001` → `BACK-022`.
- **42 scénarios de recette** `T-01` → `T-42`, provenant de deux sections du document original.
- **9 capacités historiques et 36 critères** dans [`data/control-ia-delivery.json`](../data/control-ia-delivery.json).
- **10 améliorations et 30 critères supplémentaires** dans [`data/control-ia-strategy.json`](../data/control-ia-strategy.json).

Les anciennes mentions « 42 tickets BACK » étaient incorrectes : il s'agit bien de **42 scénarios T**, pas de 42 tickets de développement.

Le registre machine consultable [`data/control-ia-requirements.json`](../data/control-ia-requirements.json) relie chacun des 22 tickets à sa capacité principale et à ses recettes `T`, avec liens inverses vérifiés, états distincts et preuves publiques minimales. Il **ne contient pas** le texte du cahier privé.

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

## MVP : cinq jalons successifs

1. **Identité indépendante** : vrai projet CONTROL distinct de toutes les autres bases ; création uniquement après approbation explicite et attestation coût 0 €, contrôle RLS par deux vrais utilisateurs, sessions révoquées, export/suppression. La configuration Cloud reste `enabled:false` jusqu'à la recette.
2. **Recherche et contexte** : retrouver le bon projet avec ses sources, son horodatage, ses droits et une mémoire isolée par projet.
3. **Actions internes certifiées** : préparation/dry-run, approbation, écriture une seule fois, identifiant, relecture et audit.
4. **Reprise fiable des missions** : sauvegarde des checkpoints, erreurs et confirmations, recovery sans doublon, preuve que la tâche est réellement terminée.
5. **Recette utilisateur représentative** : Chromium pour le site public, puis appareils Android et iOS réels, accessibilité et sécurité. Aucun statut opérationnel sans ces vérifications pour le parcours cible.

Après ce socle, développer successivement le mode Objectif, la supervision/boîte de réception/agenda, les automatisations et le mobile avancé, selon les dépendances de la stratégie existante.

## Sprints classiques et automatisés

Même source de vérité et bail coopératif `data/sprint-state/control-ia.json` (45 minutes, contrôle SHA) ; **un chantier fonctionnel à la fois**. Une demande utilisateur peut réorienter explicitement le focus. Chaque sprint fait développement → tests → autocritique → correction dans la même session → retest → **écriture directe sur main** selon la politique du propriétaire → CI → vérification de publication → point de reprise.

L'outil [`scripts/control-ia-requirements.mjs`](../scripts/control-ia-requirements.mjs) et ses 12 tests protègent la cardinalité et les liens des 22/42/10 entités, les preuves et l'absence de divulgation accidentelle de détails privés. [Workflow de validation V1.2](../.github/workflows/control-ia-requirements.yml). Une modification du registre qui forge un statut entièrement vérifié à partir d'un test fictif doit être refusée.

## Points de décision et blocages

- **P0 :** absence d'instance CONTROL indépendante et d'authentification réelle, ne pas utiliser la base IAgile.
- **P1 :** ordonnanceur de rappels, agents IA réels et OAuth exigent une infrastructure / autorisation spécifiques, sans aucun coût non approuvé.
- **P1 :** checkpoint PWA v38 non publié à examiner avant de reconstruire ; les tests allégués localement ne sont pas une preuve de mise en ligne.
- **CI générale partagée :** le dernier run rouge observé après les écritures UCP contient un incident de format de journal UCP ; il n'autorise pas à désactiver les tests, à réécrire des preuves ou à modifier l'application UCP hors de son propre sprint.

Le prochain sprint CONTROL peut avancer sur les contrats de permissions et tests liés au compte tout en gardant l'activation Cloud bloquée, conformément au cahier.


**Complément sécurité du 20/10 :** la [preuve simulée T-16](https://github.com/cosscoll/Avancement-Projet/actions/runs/39403753476) couvre cinq transitions du client A/B avec réponses tardives ; aucune authentification JWT réelle n'a été effectuée, donc T-16 reste **non vérifié intégralement** et les comptes Cloud restent désactivés.
