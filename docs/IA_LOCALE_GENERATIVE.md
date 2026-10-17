# CONTROL IA Locale — IA générative réellement exécutée dans le navigateur

**Ajouté le 17 octobre 2026.** Fonctionnalité personnelle accessible à `#/control/localai` et depuis chaque projet dans **Plus → CONTROL IA locale**. L'ancienne assistance documentaire et le tableau de bord CONTROL IA restent disponibles indépendamment.

## Ce qui est implémenté

- **Véritable génération de texte** par un modèle open source dans le navigateur (pas de réponses écrites à l'avance).
- Modèle initial **`onnx-community/SmolLM2-135M-Instruct-ONNX-MHA`**, quantification **q4**, calcul **WebAssembly / CPU**.
- Moteur **Transformers.js 3.8.1** chargé depuis jsDelivr dans un **Web Worker module**, donc hors du fil de rendu principal.
- **Aucun chargement du modèle sans action volontaire** sur « Charger le modèle ». Le téléchargement initial des poids quantifiés est d'environ **182 Mo** plus les dépendances ; le téléchargement et le décodage peuvent nécessiter davantage de mémoire et de temps selon l'appareil.
- Barre de progression pendant le téléchargement, statuts explicites, bouton d'arrêt et prise en charge des erreurs.
- Conversations **séparées par projet et conversation générale**, historique local des 14 derniers messages maximum.
- Contexte par projet **désactivé par défaut** ; l'utilisateur peut autoriser son emploi en lecture seule. Il se limite au nom, résumé public du projet et à quelques intitulés/statuts de tâches et missions **du projet sélectionné**. Aucun lien d'accès privé, token, API ni conversation privée n'est ajouté automatiquement.
- L'écran précise systématiquement que les réponses ne sont **pas vérifiées**, et que l'IA ne possède **aucune autorisation d'agir** sur GitHub, sur le calendrier ou sur les comptes tiers.
- Les données de conversation sont conservées dans le navigateur de l'appareil sous `control-local-ai-v1` ; on peut effacer un chat. Aucune synchronisation avec les comptes Cloud (non activés).
- Le modèle cesse de fonctionner (worker terminé) à la sortie de la page pour libérer la mémoire du téléphone. Le navigateur peut mettre les fichiers en cache, mais leur disponibilité hors ligne dépend des caches externes, de l'espace disponible et des paramètres du navigateur.

## Fichiers

- `assets/local-ai.js` : UI, états, mémoire des conversations, contexte de projet et gestion du worker.
- `assets/local-ai-worker.js` : téléchargement opt-in et inférence **réelle**.
- `assets/local-ai.css` : styles sobres et responsive, utilisables sur Android et ordinateur.
- `assets/command-center.js`, `index.html` : liens et intégration projet/outils.
- `service-worker.js` : mise en cache **des fichiers de l'application**, sans précharger de poids tiers de grande taille.
- `tests/local-ai.test.mjs` : tests automatisés en **faux worker** sur navigation, consentement, mémoire, séparation des projets, résultats et vie privée. **N'exécute pas les 182 Mo du véritable modèle.**

## Conditions et limites

L'IA fonctionne sans **facturation d'API**, mais demande une **connexion au premier téléchargement**, une quantité de mémoire et de calcul suffisante, ainsi qu'un navigateur supportant Web Workers / WebAssembly. Un téléphone Android ancien peut ne pas réussir à la charger ; les modèles de 135 millions de paramètres ont des capacités faibles par rapport aux modèles commerciaux modernes, notamment en français, en raisonnement long et en codage.

Téléchargement des ressources sur deux fournisseurs : jsDelivr pour la bibliothèque, Hugging Face pour le modèle. Ces services voient normalement la requête réseau lors du téléchargement. **Les messages de chat ne sont pas envoyés à ces serveurs par le code applicatif CONTROL** ; la génération est locale.

**Les chats sont enregistrés en clair dans le stockage local du navigateur.** Ne pas y mettre mots de passe, clés API, données sensibles de clients ou autres informations secrètes. Les données peuvent disparaître en cas de nettoyage du stockage et ne sont pas synchronisées entre appareils.

Le modèle n'a **pas** accès aux comptes ChatGPT, Claude ou Gemini. Il ne dispose pas d'une connexion automatique aux dépôts GitHub. Les résultats qu'il produit sont des suggestions textuelles à vérifier, pas des actions garanties, ni des publications.

### Recette indispensable avant toute affirmation de compatibilité Android

1. Ouvrir l'application sur **Chrome Android**, puis accéder à `#/control/localai`.
2. Avant d'appuyer sur charger : vérifier qu'aucune requête réseau de modèle n'est déclenchée.
3. Cliquer sur **Charger le modèle**, patienter, observer la taille du téléchargement, la progression et la mémoire utilisée ; refuser les autorisations particulières inattendues.
4. Confirmer que le statut devient « IA prête ». Poser une question (« Donne 3 étapes pour créer un site web simple ») et **vérifier qu'une vraie réponse est générée**, sans texte simulé.
5. Tester le contexte par projet, le changement de projet, le rechargement de page, l'effacement, le refus de stockage et l'arrêt en cours de génération.
6. Tester l'absence d'accès aux documents des autres projets et aux clés privées.
7. Vérifier le fonctionnement avec connexion lente et si le modèle peut être relancé après fermeture (dépend du cache du navigateur).
8. Mesurer le temps jusqu'à première réponse, la vitesse, la mémoire, la stabilité et la qualité des réponses en français. Si le modèle est trop faible, proposer une option de modèle plus puissant, **avec consentement sur la taille du téléchargement et la mémoire requise**.

### Sources officielles

- [Transformers.js : exécuter des modèles dans le navigateur](https://huggingface.co/docs/transformers.js)
- [Modèle quantifié SmolLM2 135M Instruct ONNX MHA](https://huggingface.co/onnx-community/SmolLM2-135M-Instruct-ONNX-MHA)
- [Dépendance JavaScript versionnée](https://www.jsdelivr.com/package/npm/@huggingface/transformers)
- [Limitations mémoire / API WebAssembly](https://developer.mozilla.org/fr/docs/WebAssembly)

## Suite logique

Après une **recette réelle sur Android et ordinateur**, vérifier la compatibilité des appareils et l'intérêt du modèle. Développer ensuite en phases indépendantes : un modèle de meilleure qualité optionnel, les actions CONTROL autorisées explicitement (via confirmations), la mémoire RAG **par compte** dans un CONTROL Cloud privé, puis seulement le pilotage multi-IA après autorisations et quotas. Ne pas activer d'API payante, de projet cloud ou de dépendance à la base IAgile Academy.

**État déclaré : le code, les écrans, la génération modèle et les tests JavaScript de simulation sont versionnés ; la validation de l'inférence sur navigateur Android réel reste à faire.**