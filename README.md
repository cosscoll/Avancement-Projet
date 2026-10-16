# CONTROL — Centre de pilotage des projets

Tableau de bord statique initial pour les cinq projets : Pack Procédures Pro, Banque Outils IA, UCP, IAgile et TCG Thomas Deseur.

## État de développement

- **Interface créée** : navigation entre cinq projets, vue globale, objectifs et pourcentages calculés à partir de critères de recette, sprints, activité GitHub, alertes, décisions et brouillons de consignes.
- **Source publique initiale** : `data/projects.json`, états de référence datés du 16 octobre 2026. Les taux ne sont **pas** des taux de réussite commerciale ; ils mesurent le nombre de critères vrais dans la grille décrite.
- **Historique des sprints** : fichiers `data/sprints/{id}.json` initialisés vides ; ne pas inventer de comptes rendus historiques. L'interface peut lire les vrais sprints quand ils sont ajoutés par les automatisations.
- **Statut plus récent facultatif** : si présent, `data/status/{id}.json` (format de la fiche projet correspondante dans `data/projects.json`) remplace ses objectifs/alertes/décisions pour le calcul et l'affichage.
- **Activité GitHub** : récupérée depuis l'API GitHub publique lors de la consultation de la section Sprints. Un commit n'est pas automatiquement un sprint.
- **Instructions et décisions privées** : **PAS ENCORE CONNECTÉES**. Les champs « Mes instructions » ne sauvegardent qu'un brouillon dans le stockage du navigateur. Il n'est **pas lu** par les automatisations ; le bouton de décision est volontairement absent tant que le backend sécurisé n'est pas configuré.
- **Hébergement public** : fichiers prêts pour GitHub Pages ; activation de Pages et réponse HTTPS réelle à vérifier. Le dépôt public ne doit contenir aucune information confidentielle.

## Ouvrir le site via GitHub Pages

1. Aller à [Settings → Pages](https://github.com/cosscoll/Avancement-Projet/settings/pages).
2. Dans *Build and deployment*, choisir **Deploy from a branch**, la branche **main**, le répertoire **/(root)** puis **Save**.
3. Vérifier le résultat réel sur `https://cosscoll.github.io/Avancement-Projet/` seulement **après** activation et déploiement. Tant que ce n'est pas vérifié, ne pas déclarer le site en ligne.

L'hébergement et le code sont statiques sans dépendance NPM, build serveur, API payante ou secret.

## Structure

```text
index.html                Interface principale
assets/style.css          Mise en forme responsive et accessible
assets/app.js             Navigation, métriques, historique, brouillons locaux
data/projects.json        Métadonnées et état de référence public
data/sprints/*.json       Comptes rendus vérifiés publics par projet
data/status/*.json        État public actualisé facultatif, un fichier par projet
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
