# CONTROL — Pilotage Codex sur téléphone (version assistée)

## Fonction disponible

Dans [CONTROL](https://cosscoll.github.io/Avancement-Projet/#/codex), rubrique **Codex** :

1. Choisir un des projets possédant un dépôt GitHub.
2. Décrire la modification voulue et toucher **Copier la mission**.
3. Toucher **Ouvrir Codex** pour accéder à ChatGPT. Dans l'application ChatGPT, ouvrir **Codex**, choisir son environnement cloud déjà publié pour **ce même dépôt**, puis coller et envoyer la mission.
4. Suivre le travail réel depuis Codex Cloud, y compris les résultats et les tests.
5. Une fois une pull request créée sur GitHub, revenir dans CONTROL et consulter **Suivre les résultats**. Les PR listées sont celles du dépôt, quelle que soit leur origine ; **une PR GitHub n'est pas automatiquement une tâche Codex**.
6. Facultatif : coller le lien de la tâche Codex dans CONTROL pour pouvoir la rouvrir rapidement depuis cet appareil (stockage local seulement).

## Préparation de Codex Cloud

Selon la documentation officielle, créer et publier un environnement Codex Cloud sur le **web ou l'application de bureau** est une étape préalable. Sur le téléphone, un environnement publié peut ensuite être sélectionné pour lancer une tâche. Le dépôt GitHub doit être autorisé pour le compte connecté. Vérifier les limites du forfait ChatGPT avant chaque exécution.

Docs : https://learn.chatgpt.com/docs/environments/cloud-environments
Aide : https://help.openai.com/fr-fr/articles/20001545-using-codex-cloud

## Limites de sécurité et de fonctionnement

- Cette version **n'exécute pas** Codex directement depuis CONTROL. Le clic « Copier » ne soumet aucune tâche, aucune API n'est appelée pour la création de tâches, et aucune consommation de quota n'est déclenchée par CONTROL.
- L'application **n'accède pas aux conversations, contextes privés, journaux ou exécutions Codex**. Ces résultats sont consultables dans l'application Codex ; CONTROL affiche seulement les PR GitHub publiques du dépôt choisi.
- La PWA GitHub Pages est un site **public**. Ne jamais placer de token ChatGPT/OpenAI, d'identifiant API, de secret, de données client ou de mot de passe dans le dépôt, GitHub Issues ou le formulaire.
- Les requêtes de lecture des pull requests passent par l'API REST GitHub publique et peuvent être limitées ou indisponibles.
- Un lien de tâche enregistré n'est disponible **que sur le navigateur de cet appareil**.
- Les tâches Codex utilisent les quotas de ton forfait quand **tu les soumets dans Codex**, pas dans CONTROL. Aucun crédit payant, service payant ou clé API n'a été créé pour ce module.
- Les automatisations ChatGPT existantes **ne lancent pas Codex et ne sont pas reprogrammées** par cette interface.
- Aucun compte backend, OAuth ou système d'autorisation directe n'est installé dans cette version.
- Le déploiement GitHub Pages et le rendu réel sur Android doivent être testés sur appareil ; les contrôles de la source ne sont pas des tests physiques.

## Intégration directe envisagée, uniquement après nouvelle approbation

Pour démarrer/consulter des tâches **sans quitter CONTROL**, il faudrait une API/support de Codex authentifié officiellement et une passerelle backend sécurisée avec droits minimaux, journal des actions, confirmation explicite des exécutions et budget plafonné à 0 €. Le site statique GitHub Pages **ne peut pas garder de clé secrète**. Ne pas déployer de proxy utilisant les cookies de session ChatGPT ou des API internes non documentées.

L'étape directe reste **non réalisée**.
