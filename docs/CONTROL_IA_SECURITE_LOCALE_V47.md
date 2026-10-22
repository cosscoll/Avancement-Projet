# CONTROL IA — Audit de tous les chemins d'écriture du stockage personnel (V47)

**22 octobre 2026 · code public sans secret.**

## Ce qui a été sécurisé
- **Projet / HUB :** le tableau de bord refuse d'écraser une valeur JSON corrompue, préserve le contenu brut et annonce le défaut. Une transaction `commitHub` n'annonce le succès que si le stockage du navigateur confirme l'écriture, et restaure la mémoire imbriquée sur échec.
- **Accès indirects :** l'enregistrement des outils du catalogue et des guides d'hébergement passe désormais par `window.CONTROL_HUB_STORAGE.commit` au lieu de `localStorage.setItem('control-hub-v2', ...)`. Cela ferme les chemins qui contournaient la protection de l'accueil.
- **Brouillons Automatisations :** `control-automations-v1` détecte les JSON corrompus, refuse tout écrasement, affiche un avertissement et annule une création/modification refusée par quota.
- **Sauvegardes :** validation préalable de trois magasins ; toute source illisible bloque l'export complet et permet la récupération du texte brut sans appel réseau ni prétention de restaurabilité.
- **Déploiement mobile / hors ligne :** rotation de service worker à `control-shell-v47` / `control-public-data-v47` pour livrer les corrections à une PWA installée.

## Vérifications ajoutées
- `tests/control-automation-draft-storage.test.mjs` : JSON malformés, primitives, refus de stockage, écritures réussies, échecs partiels, absence de contournement par catalogue.
- `tests/control-hub-corruption.test.mjs` : stockage projets corrompu, rollback de sous-objets, refus de double confirmation.
- `tests/control-local-mutations.test.mjs` : sauvegardes multi-magasin et récupération.
- `tests/control-ia-browser-smoke.mjs` : Chromium réel — destruction empêchée de HUB et AUTOMATISATIONS, conservation des données brutes et refus d'une fausse création.
- Publication et recette navigateur doivent être contrôlées sur le commit final, y compris le hash des actifs publics.

## Limites assumées
Aucune automatisation ChatGPT ou tâche tierce n'est exécutée par cette fonctionnalité. Aucun compte Supabase n'a été créé ou activé ; `config/cloud.json.enabled=false`. Le cahier canonique V1.2 reste privé et les statuts BACK/T/IMP ne changent pas faute de recette utilisateur authentifiée et multi-appareils. Les trois espaces personnels demeurent propres à chaque navigateur, non synchronisés.

Les fichiers bruts peuvent contenir des informations sensibles : conserver localement et privilégier une sauvegarde chiffrée valide.
