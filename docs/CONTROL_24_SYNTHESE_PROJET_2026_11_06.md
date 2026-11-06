# CONTROL 24 — Synthèse opérationnelle de chaque projet

_Date : 6 novembre 2026 — livraison en ligne sur `main`._

## Besoin utilisateur traité

À l'ouverture d'un espace projet (onglet **Mes IA** ou **Suivi**), afficher les éléments utiles à sa gestion **sans se perdre dans les rubriques** :

- **Prochaines tâches** : jusqu'à 3 actions encore ouvertes, associées exactement à l'identifiant du projet ; priorité aux échéances en retard, puis du jour et aux actions critiques. Accès direct aux tâches et création préremplie pour ce projet.
- **Notes de suivi** : extrait des notes locales `memo` de ce seul projet et mention datée de son dernier bilan IA, **saisi manuellement**. Les décisions structurées restent consultables dans la recherche CONTROL et ne sont pas encore listées dans cette carte. Accès à la rubrique Suivi pour modifier.
- **Ressources utiles** : liens HTTPS associés au projet, dont dépôt public, site, liens enregistrés et accès à tous les documents. Pas de lien avec identifiants intégrés ni de protocole non sécurisé.

L'encart est intégré à l'interface claire validée, avec trois cartes sur ordinateur et une seule colonne sur téléphone. Le contenu est rafraîchi à partir du stockage local lors du changement de projet ou de la modification des notes.

## Sécurité et limites assumées

Les tâches sont strictement filtrées par `action.project === project.id` et les notes sont lues sous `control-hub-v2[project.id]`. L'absence ou la corruption de `control-command-v1` ne déclenche **aucune écriture** ni fausse métrique. Les bilans externes ne sont **pas synchronisés**.

**Filtrage corrigé et vérifié :** le lien « Toutes les tâches du projet » applique effectivement le paramètre de projet sur les tâches, missions, compteurs et raccourcis de « À traiter ». Un bandeau permet de revenir à l'affichage général. Les tâches d'un autre projet ne sont plus visibles dans cet écran filtré.

**PWA v101 :** les fichiers JS et CSS de la synthèse sont inclus dans le précache. Un test Chromium sur le véritable site a confirmé leur présence dans le cache et la réapparition du panneau après un **rechargement complet sans connexion**.

## Fichiers effectivement modifiés / créés

`assets/control-project-brief.js`, `assets/control-project-brief.css`, `assets/control-onboarding.js`, `assets/control-day-brief.css`, `tests/control-project-brief.test.mjs`, `tests/control-project-brief-browser.mjs`.

## Recette et statut

- [Qualité Node — 786 tests réussis sur 786](https://github.com/cosscoll/Avancement-Projet/actions/runs/42203126523) : traitement des tâches, isolation logique, échappement HTML, validation des liens et compatibilité.
- [Publication GitHub Pages réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/42203126058).
- [Recette Chromium générale du site public réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/42203195010) : contrôle public global, **sans prétendre qu'elle vérifie précisément les nouvelles cartes**.
- [Recette ciblée Chromium publique réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/42206519001) : séparation des tâches/notes/liens entre deux projets, navigation et filtrage réel, affichage à 390 px, précache et rechargement sans réseau. Test exécuté dans le workflow de recette après chaque publication.

**Bilan de session :** CONTROL 24 est livré et vérifié en ligne pour les parcours annoncés, avec des tests sur les données, l'interface et l'accès hors ligne. La présentation détaillée des décisions structurées dans le panneau reste une amélioration possible et ne doit pas être confondue avec les notes manuelles déjà visibles.
