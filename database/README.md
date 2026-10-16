# Stockage privé à installer — en attente d'autorisation

La migration SQL `001_control_schema.sql` est un **livrable préparé, non exécuté**. Ne pas la lancer sur la base Supabase « IAgile Academy » : ce centre pilote cinq projets indépendants.

## Étapes à réaliser, dans l'ordre

1. Choisir explicitement **l'organisation Supabase** cible pour un **nouveau projet dédié**. Une seule organisation actuellement visible porte le nom « IAgile ». Le coût doit être vérifié auprès de Supabase et confirmé à **0 €**, sans carte bancaire, abonnement, dépassement payant ou création s'il existe le moindre frais.
2. Créer le nouveau projet dédié, et y exécuter la migration en privilégiant les outils Supabase habituels.
3. Activer l'authentification email du propriétaire et la restriction à son seul compte. Appliquer le RLS avant de publier une quelconque donnée.
4. Enregistrer l'identifiant exact Auth du compte propriétaire dans `control_owners` via opération administrative isolée et approuvée ; **ne jamais** mettre cet ID ou une clé secrète sur GitHub.
5. Publier uniquement l'URL Supabase et la clé **publishable** sur la vitrine GitHub Pages ; celles-ci ne sont pas des secrets, mais les données resteront privées grâce au RLS. Aucune clé service_role ou secret serveur dans le navigateur.
6. Vérifier depuis une session anonyme que les tables privées renvoient **zéro donnée**, puis tester les droits du propriétaire et d'un second compte non autorisé si possible, en données synthétiques.
7. Ajouter les écrans sécurisés « Notes », « Décisions » et « Alertes » au tableau de bord.
8. Étendre les tâches programmées pour lire la base privée dès le **début** de leur sprint via le connecteur Supabase (quand ce projet dédié sera visible à ce connecteur), y enregistrer accusés de réception et rapports, puis conserver le suivi public expurgé GitHub.
9. Tester **de bout en bout** une instruction neutre et un sprint réel, avec preuves d'écriture et de lecture.

**Important** : une décision enregistrée dans la base, même « approuvée », ne doit pas déclencher une dépense, Work/Codex, modifier le statut d'une automatisation ou donner un accès privilégié. Ces instructions nécessitent une demande directe de l'utilisateur dans un chat.

Le dépôt public contient actuellement un canal **non confidentiel** via GitHub Issues. Les brouillons locaux ne sont pas encore lus par les automatisations.
