# CONTROL 24 — Synthèse opérationnelle de chaque projet

_Date : 6 novembre 2026 — livraison en ligne sur `main`._

## Besoin utilisateur traité

À l'ouverture d'un espace projet (onglet **Mes IA** ou **Suivi**), afficher les éléments utiles à sa gestion **sans se perdre dans les rubriques** :

- **Prochaines tâches** : jusqu'à 3 actions encore ouvertes, associées exactement à l'identifiant du projet ; priorité aux échéances en retard, puis du jour et aux actions critiques. Accès direct aux tâches et création préremplie pour ce projet.
- **Décisions et notes** : extrait des notes locales `memo` de ce seul projet et mention datée de son dernier bilan IA, **saisi manuellement**. Accès à la rubrique Suivi pour modifier.
- **Ressources utiles** : liens HTTPS associés au projet, dont dépôt public, site, liens enregistrés et accès à tous les documents. Pas de lien avec identifiants intégrés ni de protocole non sécurisé.

L'encart est intégré à l'interface claire validée, avec trois cartes sur ordinateur et une seule colonne sur téléphone. Le contenu est rafraîchi à partir du stockage local lors du changement de projet ou de la modification des notes.

## Sécurité et limites assumées

Les tâches sont strictement filtrées par `action.project === project.id` et les notes sont lues sous `control-hub-v2[project.id]`. L'absence ou la corruption de `control-command-v1` ne déclenche **aucune écriture** ni fausse métrique. Les bilans externes ne sont **pas synchronisés**.

**Point encore à corriger :** le lien secondaire « Toutes les tâches du projet » ouvre actuellement l'écran général `À traiter` avec le paramètre de projet, mais cet écran ne filtre pas encore effectivement ses lignes par projet. Les trois raccourcis vers les tâches sont en revanche calculés sur le bon projet. Ne pas déclarer le filtre global comme terminé. Conserver cette correction en **P0** pour la suite.

**PWA :** le service worker reste en v99. Les fichiers JS et CSS actuels sont demandés sur le réseau lorsqu'on est en ligne, mais la nouvelle synthèse n'est pas encore incluse dans le précache hors ligne. **L'accès hors ligne à cette nouveauté reste non validé.**

## Fichiers effectivement modifiés / créés

`assets/control-project-brief.js`, `assets/control-project-brief.css`, `assets/control-onboarding.js`, `assets/control-day-brief.css`, `tests/control-project-brief.test.mjs`, `tests/control-project-brief-browser.mjs`.

## Recette et statut

- [Qualité Node — 786 tests réussis sur 786](https://github.com/cosscoll/Avancement-Projet/actions/runs/42203126523) : traitement des tâches, isolation logique, échappement HTML, validation des liens et compatibilité.
- [Publication GitHub Pages réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/42203126058).
- [Recette Chromium générale du site public réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/42203195010) : contrôle public global, **sans prétendre qu'elle vérifie précisément les nouvelles cartes**.
- Le scénario Chromium spécifique est disponible dans `tests/control-project-brief-browser.mjs`, mais son exécution CI n'a pas encore pu être intégrée au workflow existant. **Recette détaillée du nouveau panneau : en attente**.

**Bilan de session :** amélioration visible développée et publiée en ligne. Session partiellement validée ; la recette navigateur spécifique, le vrai filtrage par projet de l'écran général et le précache hors ligne restent à achever avant clôture complète.
