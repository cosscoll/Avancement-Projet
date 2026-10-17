# CONTROL — Mise en ligne de sites web et assistants de déploiement (17 octobre 2026)

## Ce qui est livré

Une rubrique **« Mise en ligne »** accessible dans CONTROL personnel et intégrée à la version future CONTROL Cloud, **sans activer les inscriptions**.

**10 guides détaillés** : GitHub Pages, IONOS Deploy Now, IONOS Hébergement Web par SFTP, Vercel, Netlify, Cloudflare Pages, Render Static Sites, Railway (backend/full-stack), Firebase Hosting, et checklist universelle de publication/domaine. Chaque fiche propose étapes, prérequis, environnement recommandé, risques de coûts, diagnostics et une checklist de recette.

### Depuis CONTROL personnel

- Barre supérieure : **Publier un site** → `#/control/deploy`.
- **Tous les outils** → **Mettre un site en ligne**.
- Depuis un projet : onglet **Mise en ligne** ; le projet est pré-sélectionné dans les guides.
- Bibliothèques IA → **Voir les tutoriels de publication**.
- Boutons **Documentation officielle**, **Configurer**, **Ouvrir mon tableau de bord**.
- **Copier le prompt IA** pour préparer le déploiement du projet auprès de ChatGPT/Claude/Codex avec consignes de tests, coûts et interdiction d'action non autorisée.
- **+ Ajouter au projet** : ajoute le guide comme ressource du projet dans `localStorage`, pas une connexion OAuth.
- Pour GitHub Pages / IONOS Deploy Now, **Voir les déploiements GitHub** renvoie à `#/control/activity` avec le projet pré-sélectionné ; lecture à la demande des workflows **publics uniquement**, si un dépôt référencé est disponible. Cela ne prouve pas le statut de déploiement IONOS lui-même.

### Depuis la version CONTROL Cloud

La page future `app.html` comporte une route **Mise en ligne**, depuis les projets et la page Tous les outils. La même bibliothèque réutilisable est présente ; l'ajout d'un guide serait stocké dans les ressources privées de l'utilisateur **seulement quand Supabase Cloud sera mis en service et son isolation testée**. Le drapeau `config/cloud.json.enabled` reste à `false`.

### Niveaux d'intégration et limites

| Hébergeur | Disponible dans CONTROL personnel | Connexion future envisageable |
| --- | --- | --- |
| GitHub Pages | Guides + lecture des commits/workflows de dépôts publics | Connexion GitHub authentifiée pour dépôts privés et actions après autorisation |
| IONOS Deploy Now | Guides + redirection et lecture des GitHub Actions publics quand disponibles | Gestion des workflows GitHub associés, pas d'accès automatique à IONOS |
| IONOS Hébergement Web | Tutoriel SFTP, compte IONOS ouvert dans son application | Connexion serveur dédiée avec autorisations, gestion sécurisée des secrets et contrôle des coûts |
| Vercel | Guides et console officielle | Plugin Vercel connecté à ChatGPT Work possible selon habilitations ; **pas de contrôle direct par le site CONTROL** |
| Netlify, Cloudflare Pages, Render, Railway, Firebase | Guides, consoles officielles et prompts transférables aux IA | API/OAuth officiels côté serveur, après authentification et permissions, **non installés** |

**IMPORTANT :** un compte ChatGPT/Claude/Gemini et un lien dans CONTROL ne donnent pas l'accès API à l'hébergeur. Les prompts constituent une assistance à l'exécution dans le service connecté, pas une action automatisée par CONTROL. Aucune clé privée, mot de passe, OAuth refresh token ou URL de webhook secret ne doit être collé dans le catalogue, un prompt ou un dépôt GitHub public. Aucun paiement, domaine ou hébergement n'a été commandé.

### Parcours pédagogiques IAgile

Les tutoriels sont **complémentaires** des quatre formations. Le parcours « Créer des sites web 3D animés » bénéficie spécialement des options de déploiement statique ou SPA ; les parcours agents et automatisations disposent de guides pour les backends nécessitant serveur et fonctions. Aucune leçon premium d'IAgile n'a été mise en ligne.

### Fichiers

- `data/deployment-guides.json` : les 10 guides et les documents officiels.
- `assets/deployment-guides.js`, `assets/deployment-guides.css` : interface mobile responsive, filtre par type/complexité, étapes pliables, checklist, copie de prompts, lien console, ajout aux projets.
- `assets/command-center.js`, `index.html` : route `#/control/deploy`, onglet projet et suivi GitHub public.
- `assets/cloud-app.js`, `app.html` : catalogue Cloud préparé, mais **inscription désactivée**.
- `service-worker.js` : ressources et guides statiques ajoutés à la PWA, révision de cache.
- `tests/deployment-guides.test.mjs` : tests structurels, liens HTTPS, couverture des hébergeurs et restrictions de sécurité.

### Contrôles réalisés

- Relecture de la documentation officielle GitHub, IONOS, Vercel, Netlify, Cloudflare, Render, Railway, Firebase.
- Validation du catalogue : 10 guides, étapes complètes, liens HTTPS et intégrations explicitement qualifiées.
- Syntaxe JavaScript des modules modifiés.
- Simulation de rendu : **10 cartes et 10 tutoriels visibles**, filtre « serveur » produisant 2 guides, prompt IA copie les avertissements de déploiement.
- Vérification du lien entre le guide GitHub et la route d'activité de l'application.
- Tests automatiques structurels ajoutés au dépôt mais **non exécutés dans une vraie session Node/CI** au moment de l'intégration.
- Non vérifié sur appareil Android réel et publication GitHub Pages non confirmée : il faut valider le déploiement et la mise à jour de la PWA dans le navigateur.

### Évolutions ultérieures

Un gestionnaire « Mes hébergements » privé, avec connexions OAuth spécifiques à chaque utilisateur, statut de déploiement réellement confirmé via API, journal d'exécution signé, analyse IA des logs, bouton de prévisualisation, validation humaine avant production et contrôle des coûts. Cela nécessite un backend CONTROL authentifié, séparé de la base IAgile, toujours non déployé.
