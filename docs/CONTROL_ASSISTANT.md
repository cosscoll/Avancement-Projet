# CONTROL IA — Assistant d'accompagnement utilisateur

## Périmètre livré dans le dépôt
- Modèle génératif local expérimental SmolLM2-135M, exécuté dans le navigateur après demande explicite de chargement.
- CONTROL Coach : aide structurée sans modèle pour les blocages, les priorités, les clients, les intégrations, la mise en ligne, les quotas, les sauvegardes et la coordination.
- Transfert des plans du Coach vers le champ du modèle génératif, ou copie du plan.
- Création d'une tâche de suivi dans le projet sélectionné, **uniquement après confirmation de l'utilisateur** ; stockage local, sans envoi automatique.
- Historique séparé par projet. Contexte des projets au modèle génératif uniquement après consentement. Le Coach à règles n'accède pas au contexte des projets.
- Instructions du modèle distinctes des données de projet non fiables.

## Limites à ne pas masquer
- Les conseils du Coach sont des procédures préécrites classées par intention ; il ne raisonne pas comme un grand modèle.
- Le modèle local est petit, expérimental et potentiellement lent ou inutilisable sur certains téléphones.
- Aucun accès automatique aux comptes ChatGPT, Claude, Gemini, Codex ou GitHub ; aucune action externe.
- Pas de synchronisation des historiques et tâches entre appareils sans backend authentifié.
- Aucun essai réel Android ou test d'inférence sur le navigateur n'est confirmé par les tests statiques.
- Les tâches créées depuis le Coach sont des rappels génériques, pas une exécution du plan complet.

## Recette de la nouvelle fonction « Ajouter une tâche »
1. Ouvrir `#/control/localai` et sélectionner un projet.
2. Demander un plan d'action, cliquer « Ajouter une tâche » puis annuler : aucune tâche ne doit apparaître.
3. Réessayer et confirmer : une tâche « Suivi : … » doit apparaître dans `#/control/inbox` pour ce projet.
4. Sélectionner « Conversation générale » et réessayer : l'ajout doit être refusé.
5. Désactiver le stockage local dans un environnement de test et vérifier que la tâche n'est pas considérée comme enregistrée.
6. Recharger la page : la tâche confirmée doit être conservée dans le même navigateur.
7. Vérifier le fonctionnement au clavier et sur Android, et le cache PWA après mise à jour.

## Prochains chantiers prioritaires
1. Vérifier GitHub Actions, GitHub Pages, Chrome Android et le chargement réel du modèle.
2. Améliorer le guidage contextuel avec données de projet autorisées, provenance et dates des informations.
3. Ajouter une couche d'outils à permissions minimales et journaux d'audit, avec backend authentifié et validation humaine.
4. Préparer la synchronisation multi-appareils, sans utiliser une base de données appartenant à un autre projet.
5. Tester accessibilité, performance et sécurité avant de présenter CONTROL IA comme pleinement opérationnelle.

Aucun achat ni abonnement n'est requis pour les fonctionnalités décrites ici.

## Sprint CONTROL IA — 18 octobre 2026 : commandes locales

La section « Agir dans CONTROL » est intégrée à l'écran #/control/localai. C'est un interpréteur déterministe pour les données CONTROL personnelles, **pas un modèle génératif ni un orchestrateur externe**.

### Capacités ajoutées
- Consulter les fiches de projets, leur statut de référence, les missions attribuées et les tâches.
- Consulter les événements et rendez-vous enregistrés localement.
- Préparer puis créer une tâche ou un événement, terminer une tâche, déplacer ou supprimer un événement local.
- Exiger le consentement avant d'interroger les données du navigateur, une confirmation avant écriture et une confirmation renforcée avant suppression.
- Valider l'appartenance au projet, les dates et les intitulés ; restaurer l'état en cas d'échec du stockage.
- Journaliser localement les 200 dernières actions acceptées, sans conserver le prompt original.

### Exemples de prompts
« Où en est UCP ? », « Quelle IA travaille sur UCP ? », « Mes tâches », « Mon agenda », « Crée une tâche préparer les maquettes pour UCP », « Programme un rendez-vous le 25/10/2026 à 14h30 pour UCP », « Termine la tâche Tester le site », « Déplace le rendez-vous Revue de projet au 25/10/2026 à 16h pour UCP », « Supprime le rendez-vous Revue de projet ».

### Fichiers et tests
Modules assets/control-operator-core.js et assets/control-operator.js ; adaptateur dans assets/command-center.js ; intégration dans assets/local-ai.js, assets/local-ai.css et index.html ; tests comportementaux dans tests/control-operator.test.mjs ; précache PWA actualisé dans service-worker.js.

Les tests automatiques valident les réponses déclaratives, l'isolation du projet sélectionné, la création d'une proposition sans écriture, la validation des dates, l'exécution des actions et le retour arrière en cas de stockage refusé. Ils **ne remplacent pas la recette sur navigateur Android**.

### Limites et prochaines priorités
- Les connexions privées aux IA, aux agendas externes et aux e-mails ne sont pas actives. Aucune invitation, visio réelle, notification push ni opération externe n'est déclenchée par ce module.
- Les statuts « en cours » sont des informations saisies dans CONTROL, pas des preuves d'activité en temps réel.
- Sans CONTROL Cloud authentifié et testé, les données et le journal sont locaux, non synchronisés et non inviolables.
- Prochaines étapes : recette mobile et navigateur, véritable registre d'outils avec permissions, synchronisation sécurisée des statuts et calendriers, orchestration multi-IA, agent développeur sandboxé, tests de bout en bout.

## CONTROL IA V1.1 — 18 octobre 2026

Revue de sécurité : contrôle de portée projet et validation des heures locales ambiguës/inexistantes. Trois tests de portée et un test DST ajoutés sur branche de revue. La CI et la recette Android restent non vérifiées. Voir docs/CONTROL_IA_RETROSPECTIVES.md pour les écarts et priorités. Aucun service externe activé.
