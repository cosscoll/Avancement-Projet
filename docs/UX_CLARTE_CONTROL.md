# CONTROL — Règles UX/UI de clarté (17 octobre 2026)

## Décision produit

CONTROL centralise de nombreuses possibilités (projets, IA, missions, automatisations, bibliothèque, formation, hébergement, ressources et fonctions futures). **L'accumulation ne doit jamais se traduire par un tableau de bord saturé.** Une interface simple n'est pas une interface appauvrie : les fonctions restent accessibles, mais sont dévoilées au moment opportun.

La priorité est : **retrouver mon projet, voir ce qui demande mon attention, puis accomplir une action**.

### 1. Quatre destinations permanentes

Sur Android et dans la future version Cloud :

1. **Projets** — espace de travail, accès aux IA et au contenu associé.
2. **À traiter** — urgences, échéances et validations enregistrées.
3. **CONTROL IA** — synthèse et orientation dans les données disponibles.
4. **Outils** — ensemble des modules avancés, rangés par usage.

La navigation antérieure à cinq entrées reste accessible par les pages Outils : missions, automatisations et gestion ne sont pas supprimées. Les parcours rapides renvoient vers ces pages.

### 2. Accueil orienté tâches

- Une seule action principale **Nouveau projet**.
- Trois raccourcis concrets : À traiter, créer avec une IA, tous les outils.
- Jusqu'à **six projets** visibles au premier affichage ; bouton **Afficher tous les projets** pour le reste.
- La recherche révèle toutes les correspondances, indépendamment de cette limite d'affichage.
- Dans CONTROL personnel, les projets récemment ouverts remontent en tête du navigateur de l'utilisateur (identifiants stockés localement).
- Les explications techniques sur la synchronisation privée ne saturent plus l'accueil : un encart pliable les conserve.

### 3. Un projet, quatre espaces visibles

**CONTROL personnel** : Espaces IA, Conversations, Gestion, Ressources. Dans **Plus** : Outils IA, Mise en ligne, Laboratoire IA, Connexions.

**CONTROL Cloud** (lorsqu'il sera autorisé à ouvrir) : Espaces IA, Conversations, Actions, Ressources. Dans **Plus** : Missions, Automatisations, Bilans, Décisions, Notes, Calendrier, Budget, Revenus. Les raccourcis vers le Laboratoire, les bibliothèques et la publication sont également regroupés dans un encart pliable.

L'onglet actif dans Plus provoque l'ouverture du groupe ; l'utilisateur ne perd pas le contexte de la page. Aucune donnée ni capacité fonctionnelle n'est supprimée.

### 4. Outils rangés par finalité

**CONTROL personnel** : Essentiels (ouvert), Explorer, Organiser — les deux derniers repliés par défaut.

**CONTROL Cloud** : Créer et publier, Organiser, Suivre et protéger — la catégorie contenant l'outil actif est ouverte, les autres repliées.

### 5. Design visuel

- Fond clair, cartes blanches, accent bleu sobre ; pas de couleurs saturées concurrentes.
- Moins de boutons simultanés, libellés explicites et clics/touchers confortables.
- Taille de zone d'action proche ou supérieure à 43 px ; focus clavier préservé.
- Grille mobile adaptée de 320 px au desktop.
- Une action principale par vue ; les autres dans Outils et Plus.
- Étiquettes « brouillon », « non vérifié », « redirection externe » quand nécessaires : la clarté UX comprend aussi la clarté sur les capacités réelles.

### Périmètre et limite

Cette révision est une **refonte de l'architecture d'information et de la densité**. Elle ne prétend ni connecter de nouveaux services externes, ni activer les comptes Cloud, ni créer une IA autonome, ni facturer quoi que ce soit. La version Cloud reste **désactivée** au niveau de `config/cloud.json`.

### Fichiers et recette

- `index.html` : quatre destinations, accueil concis, historique récent local, onglets Plus.
- `assets/command-center.js` : trois groupes d'outils au lieu d'une grille massive.
- `app.html` et `assets/cloud-app.js` : navigation Cloud cohérente, projets progressifs, catégories d'outils.
- `assets/ux-clarity.css` : système CSS unifié, sobre et responsive.
- `service-worker.js` : mise à jour du cache de la PWA.

Tests à confirmer dans un vrai navigateur : écran Android à 320/360/412 px, tablette et desktop ; tabulation clavier ; ouverture de Plus ; création et ouverture d'un projet ; recherche parmi plus de six projets ; navigation par les quatre destinations ; liens de missions/automatisations ; retour arrière et conservation des données ; version hors ligne. Sans cette recette, ne pas annoncer « validé sur Android ».
