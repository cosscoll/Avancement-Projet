# CONTROL — Interface V3 · Refonte visuelle effective

**21 octobre 2026 — Constat utilisateur :** après un premier sprint de navigation, l’écran n’avait pratiquement pas changé. Les trois cartes blanches et la grille de projets étaient restées intactes. Ajouter un champ « Trouver une fonction » sans revoir la structure n'était pas suffisant.

## Direction d'interface appliquée

1. **Véritable logiciel de pilotage sur grand écran :** un rail latéral sombre de 262 px, fixe, avec destinations essentielles, outils, missions, calendrier, automatisations et les cinq projets récemment consultés. Son état actif reflète la route en cours. La zone de travail est indépendante, et non plus un site étroit centré avec boutons empilés.
2. **Tableau de bord éditorial plutôt que cartes génériques :** fond ivoire chaud, contraste bleu nuit, accents sable légers, typographies resserrées, grand espace « Qu’allez-vous faire aujourd’hui ? » et trois actions directement exploitables. Les projets prennent une présentation **en lignes cliquables** sur deux colonnes desktop / une seule colonne mobile, et leur ordre d’accès récent est préservé.
3. **Contenu réellement priorisé :** les projets apparaissent visuellement avant le panneau des annonces/nouveautés, relégué en bas et replié. Les formulaires, raccourcis, pages anciennes et sous-sections demeurent disponibles : aucune suppression fonctionnelle pour simplifier l’écran.
4. **Responsivité distincte :** la sidebar disparaît en dessous de 960 px, la navigation mobile existante à quatre destinations revient, et le moteur universel « Trouver » reste accessible. Le dashboard se réorganise en une colonne sur petit écran.
5. **Même structure pour le Cloud** *lorsque le compte sera activé et connecté* : barre latérale et tableau de bord privés, sans changer le formulaire d'authentification ou le dispositif de sécurité. La barre latérale Cloud porte l'attribut `hidden` tant que le `workspace` authentifié n'est pas visible. **`config/cloud.json.enabled=false` est conservé.**
6. **Version visible « INTERFACE V3 » :** repère volontaire en haut de page pour identifier immédiatement une session navigateur/PWA utilisant encore l’ancienne interface. Le service worker a été incrémenté en **v42** pour invalider les ressources de l’ancien design et embarquer le nouveau CSS.

## Fichiers

- `index.html` : rail et projet récents avec échappement des titres, nouveau dashboard et cartes de projets redessinées ;
- `app.html` et `assets/cloud-app.js` : même shell dans l’espace privé, conditionné à la connexion ;
- `assets/workspace-shell.css` : design responsive complet, hiérarchie, navigation, états et marqueur de version ;
- `service-worker.js` : CSS V3 précaché dans la génération v42 ;
- `tests/control-workspace-shell.test.mjs` : contrats de layout, navigation, Cloud, sécurité et PWA ;
- `tests/control-ia-browser-smoke.mjs` : géométrie **Chromium réel à 1 440 px** (rail fixe, canvas séparé, projets placés au-dessus des annonces, pas de débordement), plus navigation réelle **à 320 px**.

## Critères de recette

- La capture desktop doit désormais présenter **à gauche une sidebar bleu nuit** et, au centre, un dashboard très distinct du précédent. Si un utilisateur voit toujours trois cartes côte à côte sur fond gris, **ce n’est pas la V3**.
- Ne jamais confondre succès de publication Pages et validation d’un espace privé authentifié.
- Poursuivre une passe UX sur les écrans internes Missions, Paramètres et Outils selon les parcours réellement effectués, sans inventer de fonctionnalités opérationnelles ni engager de dépenses.

Les preuves précises du dernier commit de code et des workflows figurent dans le journal de sprint CONTROL. Les anciens tests de quatre destinations mobiles sont conservés : ils ciblent `#bottomnav`, sans confondre ce menu et la nouvelle sidebar desktop.
