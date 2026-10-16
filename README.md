# CONTROL — Centre de pilotage des projets

Tableau de bord statique initial pour les cinq projets : Pack Procédures Pro, Banque Outils IA, UCP, IAgile et TCG Thomas Deseur.

## État de développement

- **Interface créée** : navigation entre cinq projets, vue globale, objectifs et pourcentages calculés à partir de critères de recette, sprints, activité GitHub, alertes, décisions et brouillons de consignes.
- **Source publique initiale** : `data/projects.json`, états de référence datés du 16 octobre 2026. Les taux ne sont **pas** des taux de réussite commerciale ; ils mesurent le nombre de critères vrais dans la grille décrite.
- **Historique des sprints** : fichiers `data/sprints/{id}.json` initialisés vides ; ne pas inventer de comptes rendus historiques. L'interface peut lire les vrais sprints quand ils sont ajoutés par les automatisations.
- **Statut plus récent facultatif** : si présent, `data/status/{id}.json` (format de la fiche projet correspondante dans `data/projects.json`) remplace ses objectifs/alertes/décisions pour le calcul et l'affichage.
- **Activité GitHub** : récupérée depuis l'API GitHub publique lors de la consultation de la section Sprints. Un commit n'est pas automatiquement un sprint.
- **Instructions publiques non confidentielles** : le formulaire « Mes instructions » permet de préparer une consigne et ouvre GitHub Issues prérempli. **L'utilisateur doit confirmer la publication dans GitHub.** Les automatisations sont désormais configurées pour rechercher les issues `[CONSIGNE][projet]` écrites par `cosscoll` au début du sprint. Les brouillons restent locaux et NE sont PAS lus. Les décisions sensibles ne passent pas par GitHub Issues.
- **Instructions et décisions privées** : portail `prive.html` créé, mais désactivé par `config/private.json` (`enabled: false`) jusqu'à création d'un projet Supabase dédié, migration/RLS et validation du propriétaire. Aucun secret publié.
- **Hébergement public** : fichiers prêts pour GitHub Pages ; activation de Pages et réponse HTTPS réelle à vérifier. Le dépôt public ne doit contenir aucune information confidentielle.

## Ouvrir le site via GitHub Pages

1. Aller à [Settings → Pages](https://github.com/cosscoll/Avancement-Projet/settings/pages).
2. Dans *Build and deployment*, choisir **Deploy from a branch**, la branche **main**, le répertoire **/(root)** puis **Save**.
3. Vérifier le résultat réel sur `https://cosscoll.github.io/Avancement-Projet/` seulement **après** activation et déploiement. Tant que ce n'est pas vérifié, ne pas déclarer le site en ligne.

L'hébergement et le code sont statiques sans dépendance NPM, build serveur, API payante ou secret.

## Structure

```text
index.html                Interface principale
prive.html                Portail privé prêt mais désactivé
assets/style.css          Mise en forme responsive et accessible
assets/app.js             Navigation, métriques, historique et formulaires GitHub
assets/private.js         Auth et commandes privées (uniquement après configuration)
config/private.json      Configuration publique sans secret (désactivée)
data/projects.json        Métadonnées et état de référence public
data/sprints/*.json       Comptes rendus vérifiés publics par projet
data/status/*.json        État public actualisé, un fichier par projet
database/*.sql            Schéma SQL sécurisé préparé, non appliqué
docs/schema.md            Format de synchronisation
```

## Format des sprints

Chaque automatisation doit gérer **uniquement** le fichier `data/sprints/<id>.json` de son propre projet ; lire le blob et son SHA avant modification, préserver les autres entrées, ajouter un compte rendu seulement après exécution réelle et éviter les doublons d'identifiant.

Exemple **illustratif de structure, pas un sprint réel** :

```json
[
  {
    "id": "id-unique-du-sprint",
    "started_at": "2026-10-16T08:10:00+02:00",
    "ended_at": "2026-10-16T08:21:00+02:00",
    "summary": "Résumé exact du sprint",
    "done": ["Action vérifiée et preuve conservée"],
    "blockers": ["Aucun ou blocage réel"],
    "next": "Prochaine action précise",
    "links": [
      { "label": "Commit GitHub", "url": "https://github.com/cosscoll/..." }
    ]
  }
]
```

Le fichier public ne doit jamais révéler des noms ou emails de prospects, secrets, données clients, tokens, contenus payants, codes cadeaux ou autres informations privées.

## Canal public de consignes — utilisable sans serveur privé

Dans l’espace d’un projet, ouvrir **Mes instructions**, rédiger une consigne NON CONFIDENTIELLE, cliquer **Transmettre sur GitHub**, puis terminer en cliquant **Submit new issue** sur GitHub. Seuls les tickets publiés dans https://github.com/cosscoll/Avancement-Projet/issues avec titre préfixé `[CONSIGNE][id]` et auteur `cosscoll` sont à consulter avant le sprint ; les questions `[DECISION][id]` ne valent jamais approbation d’une opération sensible.

Ce canal **n'est pas privé** : les autres internautes peuvent lire les issues. Pour toute instruction contenant des secrets, des données de clients ou une décision sensible, continuer à passer par une conversation ChatGPT jusqu’à la mise en service du backend privé.

## À faire : transmission sécurisée des instructions

Le besoin cible est : propriétaire authentifié → rédaction de consignes privées et décisions → stockage durable protégé par RLS → lecture autorisée par chaque automatisation au **début** de son sprint → accusé de lecture → exécution dans les limites permises → compte rendu final synchronisé.

Le seul projet Supabase actuellement connecté est dédié à IAgile. **Ne pas réutiliser sa base pour centraliser des données des quatre autres projets** et ne pas créer automatiquement un nouveau projet avec des coûts éventuels. Une base dédiée, un backend authentifié ou un mécanisme GitHub privé seront à valider et à tester avant activation.

Une instruction depuis ce site **ne permet jamais** d'autoriser Work, Codex, les agents partageant leur quota, une dépense ou l'activation/la désactivation d'une automatisation. Ces actions restent soumises à une demande directe du propriétaire dans ChatGPT.

## Vérifications

- Contrôler que `data/projects.json` et les cinq fichiers `data/sprints/*.json` sont en JSON valide.
- Contrôler la syntaxe JS, la navigation au clavier, l'affichage 320px/mobile, les états vides et `prefers-reduced-motion`.
- Vérifier GitHub Pages en HTTPS avant de remplacer les anciens liens d'avancement des projets.
- Tester de bout en bout les lectures/écritures des automatisations et l'authentification privée avant d'annoncer la synchronisation bidirectionnelle.

**Règle de sécurité** : cette application publique ne doit jamais embarquer de clé API privilégiée (Supabase service_role, GitHub PAT, clé Codex, etc.).
