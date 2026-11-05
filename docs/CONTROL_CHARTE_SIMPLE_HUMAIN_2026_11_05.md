# CONTROL — Charte graphique « Simple & Humain »
Application : 5 novembre 2026 · release graphique v80 · branche main.

## Objectif
Une plateforme de gestion de projet et de pilotage multi-IA chaleureuse, claire et compréhensible. Le design doit réduire la charge visuelle sans remplacer l'architecture des écrans.

La charte est appliquée aux styles existants. Elle ne constitue pas une refonte des pages, des fonctions ou des données.

## Identité
- Logo : CONTROL en anthracite avec un C orange épais sur fond crème.
- Typographie : Poppins en priorité, puis Avenir Next, Segoe UI et system-ui en fallback.
- Éléments : icônes en trait, lignes subtiles, coins doux, ombres légères, pas de relief ou d'animation 3D artificiels.
- Surfaces : ivoire en fond général, blanc pour les cartes, pêche très clair pour les panneaux secondaires et l'état sélectionné.

## Palette
| Rôle | HEX | Application |
|---|---|---|
| Orange de marque | #F76A39 | Symbole, illustration, accents |
| Orange d'action accessible | #B8431F | Boutons, liens actifs, texte orange |
| Orange au survol | #AE3C1D | Boutons survolés |
| Pêche | #FFCAA3 | Surfaces d'accompagnement |
| Crème | #FFF8F2 | Arrière-plan principal |
| Blanc | #FFFFFF | Cartes et blocs de contenu |
| Anthracite | #20252B | Titres et texte principal |
| Gris-brun | #6D6763 | Textes secondaires |
| Séparateurs | #EDDED3 | Bordures |
| Succès | #16834B | États terminés |
| Erreur | #BB342B | Échec, retard |
| Information | #245DAD | Informations secondaires |

Le choix de l'orange d'action foncé garantit le contraste texte blanc / orange et texte orange / pêche d'au moins 4,5:1 ; l'orange vif reste un accent visuel.

## Fichiers en production
- assets/control-brand-simple-humain.css : tokens et styles de marque, chargés en dernier pour respecter le comportement actuel.
- index.html : couleur de thème, feuille de style et symbole orange pour l'accueil et les écrans internes.
- app.html : identité alignée de la page Cloud sans modification des permissions ou de l'authentification.
- assets/icon.svg : logo C pour les en-têtes et le favicon.
- manifest.webmanifest : thèmes crème et icône SVG prioritaire, avec conservation des PNG de secours.
- service-worker.js : cache shell v80 incluant la charte.
- tests/control-brand-simple-humain.test.mjs : vérifications de la marque, du contraste, des pages et du Cloud désactivé.

## Comportement préservé
La navigation Accueil / Projets / Équipe / Assistants, la création de tâches, les imports d'archives IA, les mémoires, les projets, les sauvegardes et les restrictions Cloud conservent leurs fonctions et leurs données.

## Recette de validation
À vérifier sur GitHub Pages après publication : accueil, Projets, À traiter, Assistants et un projet à 320 px, 390 px et sur ordinateur ; cache actualisé, lisibilité, couleurs, formulaires et absence de débordement. Les polices externes peuvent être absentes hors connexion (fallback prévu). Les icônes PNG héritées peuvent rester visibles sur les anciennes installations de PWA jusqu'à leur actualisation.

La présence du code sur main ne prouve pas à elle seule que la version en production a été inspectée visuellement.
