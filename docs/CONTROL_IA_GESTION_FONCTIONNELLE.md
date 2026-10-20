# CONTROL IA — Pilotage par livraison fonctionnelle

**Mis en place : 19 octobre 2026.** Ce document décrit la gestion publique du développement CONTROL IA ; le cahier V1.1 complet reste privé. Il ne constitue **pas** un certificat de mise en production.

## Objectif et source de vérité

Le but n'est pas de maximiser les commits mais de rendre CONTROL utilisable dans des **parcours complets**, de façon progressive et démontrable. La source de vérité publique pour les fonctionnalités et critères d'acceptation est [`data/control-ia-delivery.json`](../data/control-ia-delivery.json). Le rapport d'autocritique et les correctifs ouverts restent consignés dans [`docs/CONTROL_IA_RETROSPECTIVES.md`](CONTROL_IA_RETROSPECTIVES.md).

Le tableau est visible dans **CONTROL IA locale → Progression fonctionnelle**, à l'adresse `#/control/localai`. Il s'agit d'un instantané documentaire public, jamais d'une mesure live d'agent ou d'un accès aux conversations d'autres personnes.

### Constat initial (19 octobre 2026)

- Base de navigation, actions locales et calendrier accessibles depuis le site personnel, mais **pas validés de bout en bout sur des appareils réels**.
- Routeur par règles et SmolLM2-135M expérimental : aucun orchestrateur universel.
- Missions IA **déclaratives**, pas télémétrie des fournisseurs.
- Backend CONTROL Cloud non activé : `config/cloud.json` reste `enabled:false`.
- Aucun compte unique externe, OAuth multi-outils, rappels serveur et push réellement opérationnels.
- Aucun agent développeur CONTROL capable de produire, tester et publier un site complet depuis une demande.
- Tests CI Node et GitHub Pages réussis avant création de ce suivi ; cela **ne** valide **pas** les parcours utilisateurs réels.

## Méthode permanente (inchangée)

Chaque déclenchement de l'automatisation horaire (XXh50 Europe/Paris) suit le cycle :

1. **Reprise critique** : lire la dernière rétrospective, les défauts P0/P1, le tableau fonctionnel, le code de `main`, les branches `control-ia/*`, PR et CI.
2. **Sélection** : viser en priorité une amélioration P0/P1 du **chemin critique** vers l'objectif principal ; décrire AVANT et APRÈS mesurables.
3. **Première passe de développement** : modifier le vrai code et les tests, exécuter les contrôles disponibles ; ne pas s'arrêter à un rapport.
4. **Autocritique n°1** : documenter les erreurs, les lacunes, le risque, les limites des preuves et les critères non satisfaits.
5. **Deuxième passe corrective** : corriger au moins un problème issu de sa propre critique quand les outils le permettent ; retester, puis nouvelle autocritique. Répéter si utile.
6. **Livraison contrôlée sur `main`** : tests préalables, vérification SHA, écriture directe sans Pull Request, relecture des fichiers, CI et contrôle distinct du site GitHub Pages. Contrôler les résultats de chaque étape séparément. En cas de blocage, conserver le patch, citer l'erreur et poursuivre un autre chantier non dangereux.
7. **Mémoire durable** : compléter la rétrospective et réviser le tracker fonctionnel **seulement sur la base de preuves** ; reprendre les points ouverts au sprint suivant.

Les lectures et tests indépendants peuvent être groupés pour gagner du temps. Ne jamais paralléliser des mutations susceptibles de se concurrencer. Éviter une refonte non nécessaire ou une répétition intégrale d'audit sans changement de périmètre.

## Objectif principal et limite du travail en parallèle

**Objectif initial : `CONTROL-ACCOUNT`**, identité interne sécurisée, base indépendante et synchronisation.

`work_in_progress_limit:1` signifie **un chantier principal actif**, poursuivi à travers plusieurs sprints jusqu'à la démonstration des critères. Les sous-tâches nécessaires à ce chantier sont autorisées (contrat de données, tests A/B, vérifications UX, migrations isolées). Une faille P0 peut interrompre cet objectif, mais son traitement doit être consigné et le focus repris. Si l'infrastructure requiert accord ou connexion, préparer tout ce qui est sûr hors ligne, puis traiter un chantier indépendant compatible en documentant le blocage ; ne pas forcer l'activation de Cloud.

Le **focus change** seulement lorsque : (a) le parcours est réellement validé, (b) une dépendance prioritaire découverte impose un changement motivé, ou (c) le propriétaire redéfinit la priorité. Le changement doit être documenté dans le journal et `focus_id`.

## États de livraison (ordre croissant)

| État tracker | Signification — ce qu'on peut affirmer |
|---|---|
| `not_started` | Fonction cible non commencée. |
| `in_code` | Du code pertinent existe ; fonctionnement final non validé. |
| `ci_tested` | Tests techniques attestés par un run CI réel avec lien. |
| `integrated` | Code intégré avec preuves CI ; pas encore publié. |
| `deployed` | Code publié avec preuve ; **le parcours n'est pas encore vérifié**. |
| `user_verified` | Recette réelle vérifiée et sourcée ; des critères peuvent encore manquer. |
| `operational` | **Tous** les critères passent, sont sourcés, les dépendances sont opérationnelles et il n'existe plus de blocage. |

Une transition ne peut pas être fondée sur un compte rendu IA non prouvé. Le validateur `scripts/control-ia-readiness.mjs` refuse les promotions de statut incohérentes : code déclaré déployé sans URL, validation utilisateur sans preuve de parcours, critère marqué validé sans lien, état opérationnel avec prérequis manquants.

**Les critères sont conservateurs : non vérifié = non validé.** Le fait qu'un test CI soit vert n'autorise pas à cocher la recette réelle. Pour un critère validé, ajouter une preuve consultable (test GitHub, capture/rapport de recette expurgé, journal autorisé, URL d'artefact), datée dans la rétrospective et compatible avec la confidentialité.

### Exemples de critères de réception

**Compte CONTROL** : inscription et connexion autorisées ; deux comptes A/B incapables de se lire mutuellement ; données retrouvées sur deux appareils ; déconnexion, export et suppression vérifiés. **Ne jamais réutiliser la base IAgile.**

**Action utilisateur** : demande comprise ; confirmation explicite ; écriture persistée ; même action relue et vérifiée sur le bon compte ; refus sûr si permission absente ; résultat et horodatage prouvés.

**Agenda / visio** : rendez-vous créé, retrouvé et modifié après reconnexion ; horaire/fuseau respectés ; conflit ou doublon refusé ; invitation externe émise uniquement avec OAuth et confirmation, avec preuve du fournisseur.

**Agent IA externe** : preuve de déclenchement, identifiant d'exécution fournisseur, résultat réel, échec/annulation gérés, jamais statut « en cours » inventé. Les modèles/outils à quota limité et appels facturables restent interdits dans cette automatisation.

**Génération de site** : prompt → fichiers → prévisualisation isolée → tests → correction → validation humaine → publication vérifiée ; aucun déploiement automatique sur compte tiers sans autorisation.

## Conditions de qualité non négociables

- Tests unitaires + régressions critiques ; intégration et tests navigateur réels lorsqu'ils sont matériellement possibles.
- Sécurité : isolation, permissions, contrôle des ressources, secrets absents de GitHub, sauvegarde/rollback et aucune dépense.
- Usabilité desktop et mobile, performances et accessibilité avec preuve, sinon « non vérifié ».
- Pas de publication privée sur GitHub Pages ; le tableau public ne contient aucun détail confidentiel.
- `config/cloud.json` reste désactivé tant que la base CONTROL indépendante, la validation des coûts à 0 €, les RLS A/B et l'autorisation explicite ne sont pas obtenues.
- Les refus d'outil ou limites de quotas sont documentés et jamais contournés.

## Livrables de chaque sprint

Chaque bilan doit préciser : identifiant de l'objectif `CONTROL-*` et tickets `BACK-*` ; état AVANT/APRÈS ; 1re passe + autocritique + 2e passe corrective + nouvelle autocritique ; tests exécutés et résultats ; SHA du commit direct `main`, CI et statut des contrôles ; déploiement ; recette réelle ou mention « non vérifiée » ; critères modifiés avec preuves ; défauts ouverts et prochain travail.

**Ne pas faire passer un sprint de code pour une livraison fonctionnelle.** Un sprint sans progrès vérifiable doit le dire et préserver le focus et les critiques.

## Commande de validation

À exécuter avant PR et dans la CI (Node 22) :

```bash
node scripts/control-ia-readiness.mjs
node --test tests/control-ia-delivery.test.mjs
```

La suite générale continue avec `node --test tests/*.test.mjs`. Des tests de recette manuelle Android/iOS resteront nécessaires ; la CI ne les simule pas.

## Contraintes permanentes

Automation CONTROL IA active à XXh50, méthode de développement/autocritique inchangée, **budget 0 €**, pas de Work/Codex/agents workspace/Excel ou quota partagé limité dans les sprints. Chaque connexion tierce requiert un consentement explicite fournisseur par fournisseur. Aucun changement de cadence sans demande du propriétaire.


**Consigne propriétaire du 20 octobre 2026 :** l'organisation active est décrite dans [CONTROL_IA_ORGANISATION_SPRINTS.md](CONTROL_IA_ORGANISATION_SPRINTS.md). Les prochaines livraisons CONTROL IA se font directement dans `main`, sans fusion PR, mais uniquement après contrôles préalables et avec validation réelle CI/site. Le mécanisme ne garantit pas l'absence absolue d'échec ; tout défaut doit rester visible et être traité sans compromettre les critères de sécurité.
