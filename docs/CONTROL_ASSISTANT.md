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
