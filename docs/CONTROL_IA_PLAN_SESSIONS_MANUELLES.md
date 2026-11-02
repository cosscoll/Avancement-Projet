# CONTROL — Plan des sessions de développement manuelles

**Date :** 2 novembre 2026. **Branche de livraison :** `main` du dépôt `cosscoll/Avancement-Projet`.

Ce plan organise des interventions **déclenchées dans la conversation**. Il ne crée pas de travail en arrière-plan et ne programme aucune automatisation. Les automatisations précédemment désactivées restent désactivées. Il est interdit de lancer une consommation Work/Codex, une dépense API ou de réactiver le Cloud sans autorisation explicite.

## Méthode d'une session

1. Relire le dernier état réel du dépôt `main`, les tests récents et le cahier des charges privé sans publier le texte privé.
2. Limiter le travail à **un problème principal** et au plus deux correctifs associés ; ne pas multiplier les fonctionnalités sans recette.
3. Créer ou modifier le code directement sur `main` avec garde de concurrence SHA ; préserver les données personnelles, le code de production et les anciens formats.
4. Ajouter les tests du parcours positif, du refus, des conflits entre onglets et de la rétrocompatibilité.
5. Vérifier les tests Node, les tests Chromium et la publication Pages sur le dernier SHA ; corriger les échecs plutôt que les masquer.
6. Rendre un bilan très court : **changement visible, preuve, limites, prochain problème**.

## Sessions prioritaires

| Ordre | Chantier | Livrable concret | Condition de recette |
|---|---|---|---|
| S1 — Livrée | Sauvegardes Studio IA | Sauvegarde unifiée avec Studio, restauration contrôlée et anciens fichiers préservés | Tests Node, Chromium, quatre magasins, conflits, retour arrière |
| S2 — Prochaine | Reprise fiable et sécurité des données locales | Essais supplémentaires de restauration chiffrée et simulation d'échec sur le quatrième magasin, revue des limites de taille et des doublons | Aucun écrasement silencieux, messages d'erreur actionnables, rétrocompatibilité |
| S3 | UX/UI et découverte des fonctions | Élaguer les menus redondants, privilégier les accès directs aux projets, messages et agents | Parcours fréquents mesurés sur 320/390/1440 px et au clavier ; vérification physique mobile restant à réaliser |
| S4 | Fiabilité des agents et mémoires | Sources traçables, sélection de mémoire révisable, limites de contexte visibles, meilleure gestion des discussions | La révocation agit sur les prochains prompts, aucune fuite de mémoire d'un autre projet |
| S5 — Bloquée | Comptes CONTROL Cloud | Deux vrais comptes Auth indépendants, JWT/RLS A/B, cycles de vie des sessions, révocation, suppression | 8/8 prérequis prouvés et approbation explicite ; ne pas réactiver Supabase ou les inscriptions avant |
| S6 — Bloquée | Connexions IA officielles | OAuth uniquement pour les fournisseurs et permissions réellement disponibles | Session authentifiée, scopes limités, déconnexion/révocation, aucune fausse récupération d'historique |
| S7 | Contrôle du cahier des charges | Réconciliation du suivi, des tickets, du journal des sprints et des preuves | Aucun critère promu « vérifié » par une simple réussite de CI |

## Décisions et limites

- Le **Studio IA local** est utilisable indépendamment des connexions externes ; les imports de fichiers ne sont plus le parcours principal et restent facultatifs.
- Une connexion avec l'identité ChatGPT ou Google n'implique **pas** l'accès aux conversations/mémoires natives. Un compte Claude.ai personnel n'est pas une autorisation d'utiliser son abonnement via une API tierce.
- La sauvegarde des appareils n'est **pas** une synchronisation Cloud. La comparaison des versions en stockage local n'est pas une transaction réellement atomique entre deux onglets.
- Les authentifications Cloud sont désactivées jusqu'à validation A/B réelle. **Aucun mot de passe, cookie de session ou jeton de fournisseur** ne doit être publié sur GitHub Pages, dans un journal ou dans un fichier de configuration.
- Les tests techniques réussis ne valent pas certification de tous les critères historiques du cahier : conserver la distinction entre `in_code`, `ci_tested`, `deployed`, `user_verified` et `operational`.

## État vérifié de S1

À la date de ce plan, les tests Native Node passent **637/637**, la recette navigateur incluant le Studio IA réussit, et GitHub Pages a publié la version du code avec sauvegarde unifiée. Les anciens fichiers restent acceptés ; lorsque leur section Studio est absente, les agents déjà enregistrés sur l'appareil ne sont pas modifiés. Les essais sur de vrais téléphones et comptes Cloud restent non réalisés.

Preuves : [tests Node](https://github.com/cosscoll/Avancement-Projet/actions/runs/41426100486) · [Chromium](https://github.com/cosscoll/Avancement-Projet/actions/runs/41425742193) · [Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/41426099535).
