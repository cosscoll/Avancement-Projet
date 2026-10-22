# CONTROL — Navigation V3 : parcours et lisibilité

**Date :** 22 octobre 2026 · **Périmètre :** application personnelle PWA et structure privée Cloud toujours désactivée. Cette version prolonge la refonte V3 précédente sans retirer les fonctionnalités des projets.

## Problème utilisateur

Après l'ajout de nombreuses capacités, l'utilisateur n'arrivait plus à retrouver certains boutons. La précédente amélioration V2 rendait les catégories accessibles par un moteur de recherche, mais les vues des projets conservaient un menu « Plus » cachant des rubriques, le formulaire « Nouveau projet » se trouvait loin du bouton, et certains écrans longs obligeaient à faire défiler de nombreux champs avant de voir les données utiles.

## Architecture de navigation retenue

- **Desktop :** véritable panneau latéral permanent (projets, priorités, CONTROL IA, recherche de fonctions, missions, calendrier, automatisations et outils), avec une liste de projets récents. Sur mobile, la barre de quatre destinations reste prioritaire ; la recherche de fonctions dispose d'un bouton tactile et du raccourci Ctrl/⌘+K sur ordinateur.
- **Projet personnel :** quatre rubriques principales + sept rubriques supplémentaires, regroupées dans une zone identifiable. Les sept rubriques sont **visibles sur ordinateur**, mais repliées par défaut sur mobile lorsqu'aucune d'elles n'est active. Le panneau se déploie sur demande et reste ouvert si l'utilisateur visite une rubrique avancée.
- **Projet Cloud :** les mêmes principes s'appliquent aux quatre rubriques principales et huit supplémentaires. La recherche contextuelle présente **douze rubriques** du projet sélectionné ; elle refuse la navigation hors projet. Ce code ne prouve pas l'activation des comptes ni le fonctionnement réel des permissions Auth.
- **Recherche contextuelle :** le bouton « Chercher dans ce projet » ouvre effectivement la catégorie du projet, plutôt que la catégorie générique « Essentiels ». La recherche ne transmet aucune donnée à un fournisseur externe.
- **Créer un projet :** le bouton signale l'état ouvert/fermé via `aria-expanded`, affiche un formulaire visible, le fait défiler dans la zone de lecture et y dirige le focus. Un bouton permet de fermer sans créer de données. Le formulaire Cloud et la création d'éléments conservent leur logique de sauvegarde et gagnent un défilement/une mise au focus similaires.
- **Tous les outils :** champ de recherche dédié, regroupements automatiquement ouverts si une fonction correspond à la recherche, compteur de résultats accessible et restauration des catégories initialement ouvertes lorsque le champ est effacé. Le filtrage accepte les accents et ne change ni les liens ni les données.
- **Missions IA :** le suivi et les indicateurs restent accessibles immédiatement. Le formulaire de création est désormais rangé dans un panneau `details` à ouverture volontaire. Les fonctionnalités « Préparer la mission » et « Préparer un plan avec plusieurs IA » restent présentes et inchangées.

## Hygiène de publication

Après les correctifs de navigation du 22 octobre, la PWA utilise les caches **`control-shell-v58`** et **`control-public-data-v58`**. Les ressources publiques sont servies en priorité depuis le réseau et conservées localement pour le mode hors connexion ; cette rotation renouvelle également le précache lors de l'installation du nouveau service worker. `assets/workspace-shell.css` est une ressource critique mise en cache ; la page Cloud privée n'est pas précachée.

La mention **INTERFACE V3** dans l'en-tête permet de repérer visuellement une ancienne page en cache. Les navigateurs peuvent nécessiter un rechargement lorsque le service worker vient de se mettre à jour.

## Tests et preuve

- `tests/control-ux-project-discovery.test.mjs` : quatre rubriques principales et onze rubriques personnelles, douze rubriques Cloud conditionnelles, panneau mobile repliable, boutons/formulaires et état Cloud non activé.
- `tests/control-ux-task-first.test.mjs` : filtrage d'outils, restauration des catégories, création de mission à la demande, conservation des routes et de la sécurité Cloud.
- `tests/control-ia-browser-smoke.mjs` : vrai Chromium sur le site publié : volet desktop à 1440 px, ouvrir et fermer le formulaire de création, ouvrir les sept rubriques avancées du projet, recherche contextuelle jusqu'au Laboratoire, ouverture d’un projet par son nom, filtre visio dans « Tous les outils », ouverture du formulaire Missions, navigation projet sur 320 px sans débordement.
- `tests/pwa-atomic-install.test.mjs` : cache critique/offline après la rotation V56.

**État de recette :** les tests natifs, Chromium et le déploiement doivent être associés au SHA exact de la version finale. Toute documentation ou clôture ultérieure déclenche un nouveau SHA, à vérifier séparément.

## Amélioration incrémentale : recherche des fonctions (22 octobre 2026)

- **Trouver une fonction** accepte mieux les requêtes françaises naturelles : accents, singulier/pluriel, synonymes contrôlés et expressions telles que « créer un nouveau projet », « organiser une réunion », « consulter les échéances », « modifier les paramètres » ou « sauvegarder mes données ».
- **Accès direct aux projets :** les projets disponibles dans la session sont retrouvables par nom, avec une entrée « Mes projets ». Avant authentification Cloud, aucune liste de projets privés n’est exposée par ce moteur ; le routeur Cloud vérifie également que le projet cible figure dans les projets chargés pour l’utilisateur.
- **Reprendre une fonction :** l'onglet « Essentiels » du moteur propose jusqu'à quatre fonctions récemment ouvertes, hors fonctions déjà visibles dans les essentiels. Seuls leurs identifiants sont conservés dans le `sessionStorage` de l'application personnelle ; aucune requête ni nom de projet n'est sauvegardé par ce mécanisme et aucun historique ne s'affiche dans Cloud.
- **Accès clavier :** quand une recherche contient des résultats, la touche Entrée ouvre directement le premier. La navigation Flèche haut / Flèche bas conserve son comportement, sans ajouter de menu supplémentaire.
- **Accessibilité :** les résultats sont des boutons natifs dans un groupe nommé, sans rôle `listbox` simulé ; une pression sur Flèche haut depuis le champ renvoie au dernier résultat. Seul le compteur de résultats est annoncé en direct aux lecteurs d’écran.
- **Sécurité :** le moteur ne lit que le catalogue local des routes autorisées déjà existantes. Il ne transmet aucune requête à une IA externe, n'active aucun compte Cloud et ne prétend pas chercher dans tous les documents privés.
- **Vérifications :** 29 tests ciblés réussis dans un exécuteur JavaScript isolé à partir des fichiers du dépôt : 9 sur la recherche et l'accès clavier, 18 sur la structure et les parcours d'interface, 2 sur le registre d'automatisations archivé. Les assertions des tests natifs ont été exécutées sans le vrai processus `node --test`, faute d'accès réseau au clone local ; il s'agit donc de **contrôles partiels**. Le scénario `tests/control-ia-browser-smoke.mjs` a été étendu, **mais non exécuté dans Chromium** pour ce SHA. La CI GitHub Actions et le rendu de GitHub Pages restent non confirmés.
- **Portée :** amélioration UX incrémentale, **aucun critère Auth/JWT/RLS ou recette utilisateur physique nouvellement marqué vérifié**.


## Historique des automatisations : statut exact

Le registre CONTROL conserve l'instantané daté du **17 octobre 2026** sans aucune connexion temps réel aux tâches ChatGPT. Après correction, les fiches archivées portent « Archive · statut actuel inconnu », y compris celles déclarées actives au moment de l'ancien relevé. Le registre ne réactive, ne modifie et ne synchronise aucune tâche réelle. Le test `tests/control-automations-archive.test.mjs` vérifie cette distinction et l'absence d'écriture locale lors de la consultation.

## Reste à approfondir

- Tests d'utilisation réelle sur le téléphone de l'utilisateur : ressenti et nombre de gestes pour accomplir les tâches les plus fréquentes.
- Harmonisation des formulaires de données Cloud après acceptation Auth/JWT réelle.
- Exécution réelle des fournisseurs IA et synchronisation inter-appareils **non déduites de la présence d'un bouton**.
- Aucune activation de `config/cloud.json.enabled`, aucun compte Auth créé, aucune dépense ni automatisation lancée pendant ce chantier.
