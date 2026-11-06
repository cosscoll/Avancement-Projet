# CONTROL — Contrat graphique « Simple & Humain »
Date : 6 novembre 2026. Application statique : `cosscoll/Avancement-Projet`, branche `main`.

## Objectif
Une identité accueillante et immédiatement compréhensible pour la gestion de projet, sans remplacer la structure existante par une interface décorative. Tout nouvel écran, composant ou dialogue doit conserver la palette, la typographie, les contrastes et les états de navigation approuvés.

## Palette et tokens
- Fond crème `#FFF8F2` (`--control-cream`) ; surfaces papier `#FFFDFB` ; blanc `#FFFFFF`.
- Texte principal `#20252B` ; secondaire `#6D6763` ; bordure `#EDDED3`.
- Terracotta CTA **accessible** `#B8431F` (contraste sur blanc > 5:1) ; hover `#AE3C1D`.
- Orange vif `#F76A39` réservé aux éléments décoratifs : **pas** de texte blanc dessus (contraste insuffisant).
- Fonds accent pêche `#FFF0E5`, touches `#FFCAA3`. Statuts opérationnels restent sémantiques : succès `#16834B`, danger `#BB342B`. Les statuts ne doivent pas être maquillés par un simple changement de couleur.
- Police : **Poppins**, sans-serif de repli ; typographie monospaced conservée pour l’éditeur de code.

## Implémentation
La feuille finale `assets/control-brand-global.css` se charge **en dernier** dans `index.html`, `app.html`, `legacy.html`, `prive.html` et `testeurs.html`. Elle centralise les variables et les ajustements de styles du matériel antérieur. Les changements de charte ne doivent modifier ni route, ni accès, ni stockage, ni exécution d’IA. Les affichages qui précèdent cette feuille de style ne doivent pas imposer une autre identité avec `!important` après elle.

Routes protégées par les contrôles : accueil, projets, clients, actions, missions, recherche, sauvegarde, bibliothèque, laboratoire IA, IA locale, Studio IA (import, agents, mémoire), Claude/Gemini manuel, outils, guides de déploiement, constructeur, visios, dialogues d’aide/navigation, Cloud inactif, anciens tableaux et guide testeurs. Les prévisualisations des **sites créés par les utilisateurs** peuvent avoir leur propre identité à l’intérieur des iframes.

## Qualité et recette
- Tests de contrat `tests/control-brand-everywhere.test.mjs` : présence des cinq points d’entrée et ordre de chargement, palette, lisibilité et contrastes WCAG AA des textes, éléments de navigation secondaires.
- Chromium `tests/control-ia-browser-smoke.mjs` : vérification de styles **calculés**, pas seulement du CSS écrit ; huit écrans principaux, seize rubriques de gestion, dialogue « Trouver une fonction », anciens écrans, mobile à 320px et cache PWA.
- Vérification humaine avant livraison : voir sur téléphone et ordinateur les boutons primaires/secondaires et désactivés, les cases cochées, les erreurs/succès, les modales, les menus, les états vides, les longues descriptions et l'éditeur de code. Éviter de confondre contrôle automatique du CSS et inspection esthétique de toutes les combinaisons de contenus.
- Cache PWA : incrémenter les deux noms `control-shell-vN` et `control-public-data-vN` quand une feuille de style évolue, et mettre à jour les tests qui vérifient la version.

## Résultat session 6 novembre
Correction ciblée d'anciens bleus/gris froids dans la recherche de fonctions, les raccourcis, les parcours Studio IA, la validation manuelle d’actions locales, les formulaires, les guides, les panneaux de visio, le constructeur et le tableau de bord d’origine. La modification reste **purement visuelle**. Aucun compte Cloud n’est activé et aucune automatisation n’est créée.

### Recette complémentaire : modules de gestion (6 novembre)
Les boutons secondaires, listes de recherche, panneaux repliables, liens d'activité et tuiles d'outils sont contrôlés en **styles calculés** dans le navigateur. Les sélecteurs évitent les boutons de suppression, les actions primaires et les statuts métiers. La nouvelle passe ne touche qu'aux CSS et aux tests, avec cache PWA v116.
