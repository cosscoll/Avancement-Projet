# CONTROL — Bibliothèques d'outils IA (17 octobre 2026)

## Fonction et périmètre

Nouvelle bibliothèque publique de **87 outils** sélectionnés, organisée en **9 catégories** et **4 parcours** correspondant aux formations IAgile. Elle inclut **12 kits pratiques** contenant des combinaisons d'outils et un prompt de démarrage personnalisable.

Le catalogue est un **complément pratique des formations** : aucun contenu pédagogique premium, aucune correction ou ressource privée d'IAgile n'est publiée dans GitHub.

### Les quatre parcours

| Parcours | Outils | Kits |
| --- | ---: | ---: |
| Créer des sites web 3D animés | 26 | 3 |
| Créer des agents personnalisés | 24 | 3 |
| Automatiser une tâche fastidieuse | 18 | 3 |
| Simplifier les processus du quotidien | 19 | 3 |
| **Total** | **87** | **12** |

Catégories : moteurs/scènes 3D, animations/interactions, modèles/ressources 3D, agents/frameworks, RAG/recherche/évaluation, workflows, données/intégrations, recherche/IA locale, création/production.

### Fonctionnalités de la bibliothèque

- Recherche texte (accent-insensible), filtres par parcours, catégorie, complexité et conditions d'accès.
- Fiches avec résumé, cas pratique, type d'accès, niveau, lien vers le **site officiel**.
- Affichage progressif de 24 cartes pour la performance mobile.
- Favoris locaux uniquement dans CONTROL personnel (clé `control-tool-favorites-v1`).
- **Ajouter au projet** dans CONTROL personnel : ajoute un lien dédoublonné au stockage déjà existant `control-hub-v2`; visible dans l'onglet Ressources du projet.
- **Ajouter au projet** dans CONTROL Cloud **une fois l'inscription et l'infrastructure activées** : crée une ressource privée `control_items` du compte, vérifiée par les règles de propriété et RLS.
- Chaque kit propose des outils réels avec liens directs, une application concrète et un prompt prêt à copier pour démarrer avec l'IA choisie.
- Aucun fournisseur n'est installé, authentifié, payé ou exécuté automatiquement.

### Accès

- CONTROL personnel : onglet **Bibliothèques IA** dans l'en-tête, ou **Outils → Bibliothèques IA**.
- Depuis un projet : **Outils IA** puis ouverture du catalogue avec projet pré-sélectionné.
- URL de la bibliothèque : `#/control/catalog`.
- CONTROL Cloud `app.html` (préparé, **inscriptions non activées**) : projets → Outils IA, ou Tous les outils → Outils IA.

### Confidentialité, droits, prix

Les fiches sont des références **éditoriales** vers les sites des éditeurs. Aucune affiliation ou certification IAgile/CONTROL ne découle de leur présence.

L'accès noté « code libre » décrit seulement le logiciel. Cela ne signifie **pas** que l'hébergement, les API, les modèles ou les contenus tiers sont gratuits. Les licences, limitations, prix et accès changent régulièrement : les utilisateurs doivent les vérifier sur les sites officiels avant utilisation. Les bibliothèques 3D externes peuvent avoir des licences différentes selon le modèle ou la texture téléchargée.

Les données publiques du catalogue figurent dans `data/ai-tool-libraries.json`. Les ressources privées d'un utilisateur ne sont **jamais** écrites dans le dépôt GitHub. La version personnelle utilise un stockage local sur le navigateur ; Cloud reste désactivé tant qu'une base sécurisée n'est pas opérationnelle.

### Architecture, QA et tests

- `data/ai-tool-libraries.json` — registre, parcours, catégories, accès, 87 fiches, 12 kits.
- `assets/tool-catalog.js` — UI avec parcours/filtres/kits, sécurité du HTML et lien officiel HTTPS.
- `assets/tool-catalog.css` — rendu mobile accessible, couleurs douces.
- `tests/ai-tool-catalog.test.mjs` — smoke tests à lancer avec `node --test tests/ai-tool-catalog.test.mjs`.

Contrôles effectués sur les sources : 87 IDs uniques, 87 URL HTTPS de référence, 12 kits uniquement composés d'outils existants, 4 parcours valides, parse JavaScript des modules et branchement dans les deux interfaces. Les tests du site public GitHub Pages et une recette réelle Android restent nécessaires.

Améliorations futures possibles : packs de workflows importables avec versions et licences vérifiées, votes/avis modérés, remontées de liens obsolètes, modération et filtre de compatibilité par fournisseur. Aucune automatisation de téléchargement ou intégration payante n'est activée.
