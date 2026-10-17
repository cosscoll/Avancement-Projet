# CONTROL — Laboratoire IA intégré (17 octobre 2026)

## Objectif

Rendre CONTROL **utile avant les futures connexions API privées** grâce à de véritables outils de préparation, d'analyse et de validation utilisables directement sur Android et ordinateur. Les fonctions ne dépendent d'aucun fournisseur de modèles ni d'une clé API. Elles complètent les bibliothèques IAgile, les missions et les tutoriels de publication existants.

## 7 outils opérationnels côté navigateur

| Module | Entrée | Résultat | Limites |
|---|---|---|---|
| Brief IA | Objectif, type de mission, IA, règles, projet choisi, contexte local optionnel | Prompt structuré avec consignes, critères de réussite, risques et livrables ; copie, ouverture de l'IA, ajout comme mission CONTROL | Ne déclenche pas l'IA cible ; tokens affichés = estimation caractères/4, pas calcul tarifaire |
| Comparer les IA | Deux réponses collées et un même objectif | Tableau **d'indicateurs textuels observables** (présence d'étapes, indices de preuve, termes attendus) | **Ni score de vérité, ni évaluation sémantique**, ne peut pas conclure quel modèle répond réellement mieux |
| Audit HTML | HTML d'un site collé | Checklist de balises lang/title/description/viewport/H1, alt, formulaires, liens, IDs, quelques motifs de secrets | Statique ; ne lance pas le site, ne teste pas la sécurité serveur, l'accessibilité complète, le temps de chargement ou les routes |
| Vérifier JSON | Texte JSON collé + clés requises | Erreur de syntaxe explicite, formatage et identification des clés manquantes | Pas de validation JSON Schema complète ou de garantie métier |
| Comparer versions | Deux textes ou extraits de code | Lignes modifiées à position identique | Pas de diff Git intelligent ni de contrôle de compilation |
| Plan de recette | Fonctionnalité/objectifs et type de livraison | Checklist de contrôles à effectuer et à copier | Ne réalise aucun test réel |
| Sécurité des prompts | Texte local | Masquage de quelques motifs de clés API, identifiants d'URL, tokens et valeurs de secrets | Motifs incomplets, secrets inconnus possibles : relecture humaine impérative |

## Intégration CONTROL personnel

- Nouvelle rubrique **Laboratoire IA** : `#/control/lab`.
- Dans **Tous les outils**, une carte conduit au Laboratoire.
- Dans l'en-tête personnel, un bouton permet d'y accéder immédiatement.
- Dans chaque projet CONTROL, un onglet **Laboratoire IA** pré-sélectionne le projet.
- Le **Brief IA** peut utiliser (sur action de l'utilisateur) les actions, missions, décisions et états locaux du projet, ainsi que les bilans IA copiés manuellement en option. Les sources déclaratives sont présentées comme **non vérifiées**.
- Le bouton **Créer une mission CONTROL** enregistre réellement l'instruction dans le stockage local `control-command-v1`, après sélection d'un projet et sous contrôle du quota de longueur. Si le stockage échoue, l'enregistrement est annulé.
- Le bouton **Ouvrir l'IA** ouvre l'espace officiel ou le lien de projet associé, **sans connexion API implicite**.

## Intégration Cloud (préparée, inscriptions désactivées)

- L'interface `app.html` possède également la route **Laboratoire IA** et les liens de projet correspondants.
- Lorsque le backend et les comptes seront activés puis validés, le Brief IA pourra enregistrer une mission dans `public.control_items`, avec `owner_id` et `project_id` du compte authentifié, soumis au contrôle RLS.
- **Aucune inscription ni base CONTROL Cloud ne sont activées par ce travail.** `config/cloud.json.enabled=false` reste en place.
- Les prompts, textes comparés, extraits HTML et JSON ne sont pas automatiquement stockés dans GitHub, Supabase, localStorage ni transmis à une IA externe. Ils ne restent qu'en mémoire de l'onglet jusqu'à sa fermeture ou une navigation.
- La copie des prompts et la sauvegarde explicitement demandée d'une mission sont les seules sorties souhaitées.

## Vérifications réalisées

- Contrôle de syntaxe JavaScript de l'interface personnelle, Cloud, du centre de commande, du module Laboratoire et du Service Worker.
- Tests des fonctions JavaScript de préparation de prompt, masquage de secrets, validateur JSON, comparaison de versions et indicateurs de réponse.
- Vérification des routes personnelles et Cloud, du maintien de la désactivation des inscriptions et de l'intégration dans le cache PWA v18.
- Suite de tests Node ajoutée : `tests/ai-lab.test.mjs` (exécuter `node --test tests/ai-lab.test.mjs`).
- **Les tests navigateur réels Android, la vérification publique de la nouvelle version GitHub Pages et les tests de création de mission via l'UI sur appareil restent à effectuer.**

## Étapes futures (nécessitant autorisations et infrastructure)

Pour permettre à CONTROL d'exécuter les IA et non seulement de préparer leurs instructions : authentification multi-utilisateur, base privée, intégrations officielles distinctes par fournisseur, proxy serveur pour appels aux modèles, registre d'outils MCP autorisés, enregistrement des preuves, limites de consommation et validation humaine des actions engageantes. Les abonnements de type ChatGPT/Claude ne sont pas automatiquement des crédits API et ne doivent jamais être simulés.
