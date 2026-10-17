# CONTROL — Centre de commande multi-IA (17 octobre 2026)

## État livré

La page d'accueil reste exclusivement centrée sur la sélection des projets. Depuis le menu mobile à cinq entrées (« Projets », « À traiter », « Missions », « Automatisations », « CONTROL IA »), une nouvelle couche de gestion est disponible dans `assets/command-center.js` et `assets/command-center.css`.

Les données du centre sont enregistrées sous la clé navigateur `control-command-v1`. Les anciennes données de projets `control-hub-v2` et les brouillons d'automatisations `control-automations-v1` sont préservés. Aucune base privée nouvelle, aucune clé API, aucun paiement ni modification de programmation des tâches.

### Fonctionnalités opérationnelles dans le navigateur

| Module | Route | Fonctionnement |
|---|---|---|
| Chef de projet central | `#/control/manager` | Synthèse locale et questions orientées projet fondées sur les comptes rendus IA renseignés, les actions, les missions, les décisions et les états GitHub vérifiés **dans la session courante**. Préparation d'un contexte à copier dans ChatGPT. **Ce n'est pas un modèle LLM connecté en direct aux chats privés.** |
| Boîte universelle | `#/control/inbox` | Liste des actions locales ouvertes, échéances dépassées, missions « à vérifier », alertes du référentiel daté et raccourcis Gmail/Agenda/ChatGPT. **Aucune récupération des messages Gmail ou notifications externes.** |
| Missions multi-IA | `#/control/missions` | Création, répartition (ChatGPT, Claude, Codex, Gemini), états à lancer/en cours/à vérifier/terminée, préparation de prompt, copie, redirection vers le fournisseur, résultats déclarés et avertissement de conflits de périmètre. Bouton pour créer un plan de quatre missions coordonnées. **Pas d'exécution directe sur les IA.** |
| Calendrier | `#/control/calendar` | Événements locaux avec échéances, relevé **daté** des quatre automatisations connues et liens Google Agenda / ChatGPT / Claude. **Pas de connexion aux calendriers privés.** |
| Activité et développement | `#/control/activity` | Requêtes à la demande sur l'API GitHub **publique** pour commits, PR ouvertes et workflows, avec état partiel signalé. Accès branches/tests/déploiements/versions. Pas de merge, déploiement ou rollback automatique. |
| Bibliothèque | `#/control/library` | Recherche par titre de liens Drive, GitHub, sites et IA déjà associés, ajout d'autres URL HTTPS. Ne recherche pas le contenu des fichiers privés. |
| Mémoire | `#/control/memory` | Historique local des décisions, justification, source et fiche de contexte à transmettre aux IA. |
| Budget | `#/control/budget` | Dépenses et budgets indicatifs renseignés manuellement ; comparaison au seuil. Aucune mesure des coûts réels, tokens ou quotas fournisseurs. |
| Recherche | `#/control/search` | Recherche des projets, actions, missions, décisions et ressources référencés. Pas d'indexation des conversations privées. |
| Sauvegarde | `#/control/backup` | Export/import de toutes les données navigateur de CONTROL en JSON, option AES-256-GCM avec dérivation PBKDF2-SHA256 et mot de passe de 12 caractères minimum ; le fichier est téléchargé localement. |
| Règles et sécurité | `#/control/settings` | Configuration locale des règles globales ajoutées aux prompts de mission, consultation des limites et demande facultative de permission Notification Web. Pas de push hors application. |
| Automatisations | `#/automations` | Gestion des fiches datées / fournisseurs et brouillons manuels livrée précédemment. Aucune écriture directe dans les tâches privées. |

### Contraintes de sécurité

1. Le site reste servi **publiquement** par GitHub Pages : aucune donnée de mission, clé ou rapport privé n'est envoyée au dépôt. Éviter d'y saisir des secrets et des données personnelles sensibles, même dans le stockage local.
2. Les appels à l'API publique GitHub sont limités en volume et peuvent échouer ; ne jamais transformer un résultat partiel en réussite d'un test ou en travail d'une IA particulière.
3. La base de données privée et la connexion OAuth pour Google Drive, Gmail, Agenda, Claude, Gemini, Codex et ChatGPT ne sont **pas déployées**. Leur disponibilité API diffère selon les fournisseurs.
4. Les règles enregistrées dans CONTROL ne garantissent pas leur respect chez les fournisseurs : seules les instructions effectivement transmises/confirmées le peuvent.
5. La sauvegarde chiffrée nécessite de conserver son mot de passe. Sans mot de passe, l'export JSON est en clair.
6. Aucune action commerciale, dépense, achat de crédits, modification d'automatisation, publication ou connexion engageante n'est effectuée par le centre.

## Prochaine architecture pour la vraie synchronisation

Cette version est un **MVP fonctionnel côté navigateur**, pas un orchestrateur intégré de tous les comptes privés. Pour obtenir la version réellement interopérable décrite, il faudra :
- un backend dédié avec authentification, séparation des utilisateurs/projets, secrets serveur et autorisations revocables ;
- les API officielles et OAuth disponibles par fournisseur ;
- une base privée pour données, preuves, tâches et journal d'audit ;
- un moteur d'orchestration avec idempotence, contrôle des coûts, validation humaine et protections contre modifications concurrentes ;
- des tests de sécurité, la gestion des données confidentielles et des sauvegardes restaurables vérifiées.

Aucun de ces services n'est annoncé comme installé. Ne pas réutiliser la base d'IAgile pour CONTROL sans validation explicite.

## Vérifications effectuées

- Chargement et analyse des fichiers GitHub dans la branche principale.
- Compilation syntaxique via `new Function` des scripts JavaScript modifiés.
- Simulations de rendu de chacune des 12 routes du centre ; toutes ont produit du HTML sans exception avec DOM simulé.
- Mise à jour de la navigation responsive et du cache PWA, sans changer le routage du catalogue existant.
- Aucune confirmation de disponibilité du site GitHub Pages : l'environnement de vérification HTTP extérieur n'a pas pu accéder à son URL. Test visuel et fonctionnel Android nécessaire, particulièrement la PWA et le stockage local.
