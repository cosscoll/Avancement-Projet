# CONTROL — Assistant de support intégré (17 octobre 2026)

## Fonctionnalité livrée

Un **chatbot d'assistance interne** est accessible depuis les pages de CONTROL personnel et de la future version CONTROL Cloud, via un bouton flottant **« ◈ Assistance »** au-dessus du menu mobile. Il répond en français aux questions concernant le fonctionnement de CONTROL et propose des procédures pas à pas, des liens directs vers les rubriques et des sources officielles quand elles existent.

### Ce que le chatbot sait faire actuellement

- **32 réponses documentaires** : démarrer, créer des projets, connecter ChatGPT/Claude/Gemini/Codex par URL, missions multi-IA, automatisations, quotas, bibliothèques et formations IAgile, fichiers, coûts, notifications, sauvegardes, confidentialité, dépannage.
- **10 procédures d'hébergement** : GitHub Pages, IONOS Deploy Now, IONOS SFTP, Vercel, Netlify, Cloudflare Pages, Render, Railway, Firebase, vérification de production.
- **87 outils IA** : retrouver une fiche précise (Three.js, n8n, LangGraph, Blender, etc.) ou recommander des outils par parcours (3D, agents, automatisation, productivité).
- **Aide contextualisée** : questions suggérées selon la rubrique actuellement consultée (déploiement, automatisations, outils IA).
- **Orientation** : boutons intégrés ouvrant la bonne page CONTROL ou la documentation officielle de l'éditeur, sans quitter le chatbot tant qu'il est nécessaire.
- **Informations du projet** : le chatbot peut répondre au nombre de projets/actions/missions référencés par CONTROL lorsque le client lui fournit des statistiques, sans ouvrir les comptes privés des IA.
- **Mobile et clavier** : fermeture par Escape, bouton d'effacement, envoi par Entrée, retour à la ligne avec Maj+Entrée, interface responsive, aria-labels et zones accessibles.

### Ce que le chatbot **ne prétend pas** faire

Cette version utilise un **moteur documentaire avec recherche d'intentions et réponses vérifiables**, pas un grand modèle de langage génératif en ligne. Elle n'invente pas de réponse aux questions inconnues : elle indique les limites et redirige l'utilisateur vers les bonnes pages. Elle n'a aucun accès au contenu privé de ChatGPT, Claude, Gemini, Gmail ou GitHub privé.

Aucun fournisseur IA, abonnement, clé API, endpoint payant ou action engageante n'a été activé pour le chat. Les réponses ne modifient ni les projets, ni les automatisations, ni les déploiements. La différence avec un véritable assistant génératif doit rester **claire pour l'utilisateur** : le chatbot est utile immédiatement pour guider, mais la conversation libre et le raisonnement approfondi nécessiteraient un modèle IA officiellement relié par une **fonction serveur sécurisée**, sur une infrastructure encore non déployée.

### Données et confidentialité

- Le contenu des questions et réponses n'est **pas envoyé à un serveur**, à un service tiers ou à une base de données.
- L'historique du chat reste **uniquement en mémoire de l'onglet**, et peut être effacé par « Effacer » ; aucune entrée n'est écrite en localStorage, IndexedDB ou Supabase par le chatbot.
- Les données consultées sont exclusivement les **trois fichiers publics de documentation** : `data/help-center.json`, `data/ai-tool-libraries.json`, `data/deployment-guides.json`.
- Les résumés de projets utilisent seulement les nombres fournis par le client CONTROL actif. Le chat remet son état à zéro lors d'un changement de compte ou d'une déconnexion CLOUD ; les requêtes en cours sont annulées logiquement pour éviter la fuite d'informations après un changement de compte.
- Aucun mot de passe, cookie de session ou token n'est demandé.
- Le chatbot peut afficher des réponses partielles lorsque le réseau est absent ; les documents publics sont ajoutés au cache de l'application personnelle (PWA).

### Cloud

Le script est chargé dans `app.html`, y compris pendant la préparation du compte, pour expliquer pourquoi Cloud n'est pas encore ouvert. Il **n'active pas** l'inscription : `config/cloud.json.enabled=false` est inchangé. Une fois l'authentification Cloud activée et vérifiée, ses boutons navigueront vers les écrans internes du compte autorisé. Aucune navigation vers des données privées sans session valide.

### Fichiers

- `data/help-center.json` : connaissances et procédures générales.
- `assets/control-help.js` : dialogue, recherche documentaire pondérée, procédures d'hébergement, fiches outils IA, état de session et navigation.
- `assets/control-help.css` : design responsive et accessibilité.
- `index.html`, `app.html`, `assets/cloud-app.js` : intégration et adaptateurs.
- `service-worker.js` : mise en cache des ressources de support publiques.
- `tests/control-help.test.mjs` : vérifications de l'ancrage des réponses, des 13 requêtes types, du comportement inconnu et des limites Cloud.

### Recette de publication

1. Ouvrir CONTROL sur Android, vérifier la bulle « Assistance » sur l'accueil, les projets, les bibliothèques, les automatisations et la page Mise en ligne.
2. Demander « Comment publier mon site sur GitHub Pages ? » et contrôler l'exactitude des étapes et du lien.
3. Demander « Comment connecter mon projet Claude ? », vérifier qu'aucune synchronisation privée n'est promise.
4. Demander « Quels outils pour créer un agent IA ? », vérifier la proposition LangGraph/Agents SDK/Flowise.
5. Demander « Comment sauvegarder mes projets ? », vérifier la redirection vers Sauvegardes.
6. Poser une question hors sujet : le chatbot ne doit pas inventer de réponse ni de source.
7. Tester ouverture/fermeture, clavier, rotation et scrolling en mobile.
8. Simuler un changement de compte Cloud : vérifier que le brouillon et l'historique disparaissent.
9. Vérifier le cache et l'absence de requêtes d'authentification privées de la part du chatbot.
10. Confirmer la disponibilité des nouveaux fichiers sur GitHub Pages. Les vérifications de l'interface Android réelle restent à effectuer.

## Évolution prévue pour un vrai modèle IA

Lorsque le backend CONTROL Cloud indépendant sera disponible, on pourra ajouter (après accord du propriétaire) un endpoint serveur de discussion avec authentification, contrôle des quotas, limitations de coûts, recherche sourcée et permissions par utilisateur. Ne jamais mettre une clé API de modèle dans un frontend GitHub Pages. À ce stade, aucun modèle génératif n'est connecté.
