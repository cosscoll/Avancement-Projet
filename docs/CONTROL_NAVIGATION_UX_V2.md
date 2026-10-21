# CONTROL — Navigation V2 centrée sur les usages

**Date :** 21 octobre 2026 · **Portée :** PWA personnelle (`index.html`) et espace privé Cloud (`app.html`).

## Problème résolu

CONTROL a accumulé de nombreuses fonctionnalités. Le menu de quatre destinations était relativement court, mais les capacités secondaires étaient cachées sous « Plus », dispersées entre projets et outils, et les utilisateurs devaient connaître les noms techniques pour retrouver une action. L’accueil mélangeait également projets, nouveautés et nombreux raccourcis. La présente refonte améliore la **trouvabilité**, sans retirer les fonctionnalités ou modifier leurs données.

## Architecture retenue

- **Navigation persistante :** quatre destinations seulement — **Projets / À traiter / CONTROL IA / Outils**. La barre mobile reste courte, sans cinquième onglet compressé.
- **Accès transversal « Trouver une fonction » :** bouton évident sur ordinateur, bouton fixe « Trouver » au-dessus de la navigation basse sur mobile ; raccourci clavier **Ctrl+K** ou **⌘K**. La recherche fonctionne par nom et par intention, avec synonymes, mots usuels ignorés et classement des résultats les plus pertinents, sans accès à des conversations privées. Exemple : `visio`, `décision`, `publier un site`, `budget`.
- **Catégories à dévoilement progressif :** Essentiels, Organiser, IA & création, Ressources & publication, Compte & sécurité, et Dans ce projet lorsque pertinent. Le bouton « Tout voir » est disponible ; aucune catégorie ne supprime le chemin d’accès d’une autre fonction.
- **Parcours projet :** quatre catégories immédiates et un accès « Sections du projet » qui révèle directement les sections auparavant sous « Plus ». Le moteur propose les sections de **ce projet actif** uniquement, jamais celles d’un autre.
- **Repère de position :** fil « Vous êtes ici » sur les pages et accès direct aux projets, y compris depuis l’espace Cloud authentifié.
- **Accueil :** trois décisions prioritaires (mes priorités, piloter mes projets, trouver une fonction) et les nouveautés repliées par défaut, plutôt qu’un long catalogue avant les projets.
- **Lisibilité :** palette claire et douce, hiérarchie de texte plus nette, grands contrôles tactiles, menu mobile en panneau inférieur, focus visible, fermeture par Échap, piège de tabulation dans le dialogue, navigation par flèches et adaptation aux écrans de 320 px.

## Respect des frontières de sécurité

Le code `assets/navigation-hub.js` ne réalise aucun appel réseau, ne manipule ni secrets ni données utilisateur, et ne stocke **pas les recherches saisies**. Les libellés de destination sont échappés avant insertion. Les entrées Cloud non disponibles ne sont pas proposées et le navigateur de fonctions est inaccessible si `authUser` est absent. La base Cloud indépendante reste **désactivée** (`config/cloud.json.enabled=false`), et aucune fonctionnalité IA/API externe n’est artificiellement déclarée active.

L’utilisation du service worker public est conservée pour la PWA : version **v41**, avec `navigation-hub.js` et `navigation-hub.css` en ressources essentielles du cache hors ligne. La page Cloud privée demeure **network-only**.

## Points de contrôle

- `tests/control-navigation-hub.test.mjs` : concordance des liens publics et Cloud, support clavier, maintien des 11 sections de projet, filtres et sécurité.
- `tests/control-ia-browser-smoke.mjs` : **vrai Chromium** en viewport 320 px, ouverture du menu, recherche d’intention `visio`, accès à la page Visios et absence de débordement horizontal. Vérification des octets publiés de `navigation-hub.js` et `navigation-hub.css`.
- `tests/pwa-atomic-install.test.mjs` : nouvelle génération de cache offline v41 avec les ressources de navigation indispensables.
- Sur le commit de code `b518c40594f22de9983b47e4ad4f9d75c36c3a40` : [qualité 466/466](https://github.com/cosscoll/Avancement-Projet/actions/runs/39652408040), [recette Chromium après publication](https://github.com/cosscoll/Avancement-Projet/actions/runs/39652479453), [déploiement Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/39652407546).

## Suite UX recommandée

Après utilisation réelle, mesurer **le nombre de taps pour retrouver une fonctionnalité** et les points d’abandon sur Android : la recherche de **fonctions** et la recherche de **données de projets** restent intentionnellement distinctes. Les fonctionnalités Cloud nécessitant Auth réelle resteront soumises aux permissions et tests A/B. Poursuivre l’harmonisation interne des écrans les plus longs (missions, suivi et paramètres) sans remettre tous les boutons sur l’accueil.
