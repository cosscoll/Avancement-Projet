# CONTROL — Espaces projets multi-IA

## Objectif et état livré le 17 octobre 2026

L'accueil ouvre les espaces projets. Dans chaque projet, l'onglet **Espaces IA** permet de lier la véritable URL de son projet **ChatGPT**, **Claude**, **Gemini Notebook**, ou de sa tâche **Codex**. Les autres IA peuvent être ajoutées avec « Ajouter une autre IA ».

Les URL ne sont **pas** intégrées au dépôt GitHub public : elles sont enregistrées dans le stockage local du navigateur. Chaque bouton « Ouvrir mon espace » ouvre le fournisseur concerné avec la session de l'utilisateur. Les conversations et les nouveaux chats sont alors disponibles dans le fournisseur selon ses propres droits. Aucun contenu de chat privé n'est récupéré ou affiché directement dans CONTROL.

## Configuration

1. Ouvrir CONTROL, choisir un projet, puis **Espaces IA**.
2. Dans ChatGPT, ouvrir le projet dans le navigateur et copier son URL depuis la barre d'adresse (éviter de générer un lien de partage public).
3. Dans CONTROL, **Associer le projet** sous ChatGPT et coller cette URL.
4. Répéter depuis `https://claude.ai/projects` pour le projet Claude, et depuis Gemini → Notebooks pour le notebook correspondant. Codex accepte le lien d'une tâche ou de l'espace associé.
5. Les liens Drive et autres documents s'ajoutent dans l'onglet **Ressources**.

### Bilans et gestion

À côté de chaque IA, choisir **Mettre à jour le bilan**, puis « Copier la demande de bilan ». Coller cette demande dans le projet de l'IA concernée et copier son résultat dans CONTROL. Chaque rapport reste marqué comme fourni manuellement, avec la date d'enregistrement.

L'onglet **Gestion** permet de demander « Où en est chaque IA ? » ou « Que dit Claude ? ». La réponse est une **synthèse déterministe des bilans enregistrés**, pas une génération par LLM et pas une lecture de conversations privées. Les nouveaux rapports ne sont pas reçus automatiquement. Un bouton permet de copier une synthèse pour poursuivre une analyse dans un vrai chat ChatGPT.

Un bouton supplémentaire consulte les commits publics GitHub des projets dotés d'un dépôt. Un commit n'est pas assimilé automatiquement au travail d'une IA.

### Sauvegarde et confidentialité

- Aucune clé API, aucun token, aucun mot de passe demandé ou stocké.
- Les liens et les bilans sont seulement dans `localStorage` du navigateur où ils ont été saisis.
- L'export et l'import JSON depuis **Connexions** permettent de transférer les données volontairement entre appareils ; conserver ce fichier comme privé.
- Ne jamais copier de secrets dans un bilan. Ne pas utiliser un lien « Partager le projet » en mode public pour simplement remplir CONTROL.
- L'authentification OAuth et la synchronisation automatique des projets privés entre IA nécessiteraient des fonctions supplémentaires et, selon les services, des API ou connecteurs compatibles, non implémentés ici.
- Aucune dépense, aucun changement des automatisations.

## Validation

Vérifications de syntaxe JavaScript et de présence des éléments effectuées sur les sources après commit. Vérification réelle du rendu GitHub Pages et des ouvertures de liens en session Android à effectuer depuis un navigateur connecté. L'intégration complète de contenus privés n'est pas déclarée réalisée.
