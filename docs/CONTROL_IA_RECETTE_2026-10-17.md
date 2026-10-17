# CONTROL IA — reprise et recette du modèle local (17 octobre 2026)

## État vérifié dans le code
- `assets/local-ai.js` monte l'interface, conserve les 14 derniers messages par projet dans localStorage et demande un accord explicite avant d'inclure un contexte de projet.
- `assets/local-ai-worker.js` charge `onnx-community/SmolLM2-135M-Instruct-ONNX-MHA` via Transformers.js 3.8.1, WebAssembly et quantification q4.
- Le chargement n'est déclenché que par un clic. Arrêter termine le worker. Les réponses ne sont pas des actions exécutées.
- Aucune API GitHub, Claude, Gemini ou Codex n'est accessible au modèle local.

## Recette obligatoire avant de déclarer l'IA fonctionnelle sur Android
1. Ouvrir CONTROL sur Chrome Android et accéder à `#/control/localai`.
2. Vérifier que le modèle ne se télécharge pas avant l'appui sur « Charger le modèle ».
3. Charger le modèle sur un réseau autorisé ; noter durée, volume transféré, erreurs console et mémoire.
4. Envoyer « Réponds en français en une phrase : bonjour » ; vérifier une réponse générée.
5. Sélectionner deux projets distincts, envoyer une question dans chacun, revenir en arrière et vérifier l'isolation des historiques.
6. Vérifier que le contexte est désactivé par défaut et se désactive lors du changement de projet.
7. Interrompre une génération, recharger le modèle et vérifier qu'une nouvelle réponse est possible.
8. Effacer une conversation ; recharger la page et confirmer sa disparition.
9. Tester la navigation hors ligne après chargement ; ne pas promettre que le modèle fonctionne hors ligne sans essai réel.
10. Tester l'installation PWA et un retour après fermeture de Chrome.
11. Vérifier qu'aucune clé API ni donnée de projet sensible ne se retrouve dans le dépôt ou les GitHub Issues.

## Conditions pour passer à une IA qui agit
- Définir un catalogue d'outils avec permissions minimales, validation explicite de chaque action sensible et journal d'audit.
- Exécuter les actions côté backend authentifié, jamais à partir d'une clé secrète placée dans GitHub Pages.
- Isoler les données des projets et des utilisateurs, tester les règles RLS et les accès refusés.
- Prévoir les erreurs, limites de quota, coûts maximaux et mécanismes d'arrêt.
- Ne jamais présenter une action proposée ou simulée comme une action exécutée.

## État de cette reprise
Inspection statique des deux fichiers réalisée. Aucun essai réel Android ni test d'inférence n'a été effectué dans cette session. Aucun fournisseur externe n'a été activé et aucune dépense n'a été engagée.
