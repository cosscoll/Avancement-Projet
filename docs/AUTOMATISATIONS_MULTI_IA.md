# CONTROL — Automatisations multi-IA

Dernière intégration : 17 octobre 2026.

## Utilisation sur téléphone

- Ouvrir **CONTROL → Automatisations** depuis le menu du bas ou le bouton de l’en-tête.
- Choisir le fournisseur : **ChatGPT, Codex, Claude, Gemini** ou toute IA personnalisée précédemment ajoutée à un projet.
- Choisir une automatisation. La fiche affiche l’objectif, les règles, les contraintes, la fréquence, le projet/conversation associé, le modèle et le mode d’utilisation/quotas — **si ces informations sont connues**.
- Choisir **Préparer une modification** pour enregistrer un brouillon local ; **Copier la demande de modification** transmet le texte au presse-papiers ; **Gérer réellement dans [IA]** ouvre les fonctions de gestion natives du fournisseur.
- Pour ajouter une automatisation Claude, Gemini ou Codex, choisir l’IA puis **Référencer une automatisation**. Ce référencement n’exécute rien et ne crée pas de tâche chez le fournisseur.

## Origine des données et fiabilité

Les quatre automatisations ChatGPT actives au relevé du 17/10/2026 sont décrites dans `data/automations.json`, sous forme d’un **résumé public minimal** (pas les prompts complets ni les secrets). Le catalogue ne donne **pas** d’accès temps réel, et les statuts peuvent changer après le relevé. Ne pas réintroduire les tâches désactivées. Les modèles effectivement choisis ne sont pas confirmés dans le relevé : afficher **Modèle effectif non vérifié**. Les contraintes de non-utilisation de quotas partagés ne signifient pas que tous les tokens sont illimités.

Pour les IA externes, l’utilisateur peut créer une fiche locale de suivi, mais la liste de tâches privées n’est pas automatiquement récupérée. Tous les brouillons, URL et annotations sont conservés dans `localStorage` du navigateur. **L’application ne met pas à jour les paramètres du fournisseur à elle seule.** Aucun jeton d’authentification ou clé API ne doit être saisi ici.

## Gestion native par service

- **ChatGPT** : `https://chatgpt.com/scheduled` ; sélectionner la tâche dans Planifiées pour consulter ou modifier. Les automatisations Codex sont séparées.
- **Codex** : `https://chatgpt.com/codex` ; consulter les tâches et automatisations disponibles dans Codex.
- **Claude** : `https://claude.ai/` ; en interface compatible, utiliser Cowork > Scheduled / Planifiées. La disponibilité dépend du compte et de la version.
- **Gemini** : `https://gemini.google.com/` ; utiliser Paramètres et aide > Actions planifiées, ou la page des tâches programmées. Les programmes de tâches et ceux de conversations ne sont pas toujours identiques.

Des liens directs vers une tâche ne sont affichés que lorsque l’utilisateur a renseigné une URL HTTPS valide. Un lien fourni volontairement ne prouve ni permission ni connexion API.

## Navigation entre IA

CONTROL reste un **point de départ** : un lien vers un projet dans ChatGPT, Claude ou Gemini ouvre le site officiel dans un autre onglet ou l’application concernée (comportement selon le téléphone). Quand on se trouve sur Claude, il faut **revenir à CONTROL** pour ouvrir le projet ChatGPT ou Gemini. L’interface native Claude ne contient pas automatiquement un menu CONTROL. Conserver CONTROL comme application sur l’écran d’accueil simplifie le retour.

## Sécurité et coût

Le dépôt et GitHub Pages restent publics : ne jamais publier les prompts complets privés, URL contenant des jetons, données sensibles, secrets ou informations clients. Les champs ajoutés depuis le navigateur ne sont pas publiés dans GitHub. Aucune action de paiement, changement de plan ou modification d’automatisation réelle n’est déclenchée par cette fonctionnalité. Un changement appliqué dans l’interface ChatGPT/Claude/Gemini reste une action séparée et explicite de l’utilisateur.

## Recette

Sources JavaScript chargées depuis la branche principale. Contrôle de syntaxe et tests simulés des routes `#/automations`, `#/automations/ChatGPT`, `#/automations/ChatGPT/chatgpt-ucp` et `#/automations/Claude` réalisés ; vérification navigateur réelle et accès public du déploiement non confirmés dans l’environnement de développement. Le manifeste PWA et la version du cache hors ligne sont mis à jour.
