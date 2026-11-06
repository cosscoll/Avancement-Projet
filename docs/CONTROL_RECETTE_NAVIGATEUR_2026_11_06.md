# CONTROL — Recette de navigateur réelle et transfert manuel
**Date : 6 novembre 2026 · Site : https://cosscoll.github.io/Avancement-Projet/**

## Périmètre

Recette réalisée sur **le site GitHub Pages public**, dans une session de navigateur isolée disposant initialement de **zéro clé de localStorage**. Les données de test sont fictives ; aucun compte réel, secret, service payant, automatisation ou projet utilisateur existant n'a été manipulé.

Le navigateur public a servi la **PWA v91** au moment de ces tests. Les corrections et tests complémentaires ont ensuite été intégrés à `main` dans la **PWA v92**. **La diffusion et le rendu public de v92 ne sont pas encore attestés par cette recette.**

## Résultats observés dans le vrai navigateur

| ID | Test | Résultat observé |
| --- | --- | --- |
| BR-01 | Ouvrir la page `#/control/backup` | **PASS** — Titre « Sauvegarde et récupération », export/import visibles, aucune erreur console observée |
| BR-02 | Vérifier modules JS et cache sur le site public | **PASS** — `CONTROL_BACKUP_REVIEW.applyTransaction` et `CONTROL_DATA_AUDIT.inspectBackup` présents ; caches `control-shell-v91` et `control-public-data-v91` activés |
| BR-03 | Lire la session de test initiale | **PASS** — Aucun enregistrement local avant import |
| BR-04 | Prévisualiser une sauvegarde **enveloppée** au format `control-v2-plain` comprenant 1 projet personnalisé, 1 client et 1 tâche | **PASS** — Tableau : 0 → 1 dans chaque catégorie, un ajout, aucune suppression |
| BR-05 | Annuler cette première prévisualisation | **PASS** — Aperçu masqué, stockage intégralement inchangé |
| BR-06 | Restaurer volontairement le jeu de données fictives, avec confirmation de navigation | **PASS** — Trois zones enregistrées : command, hub, automations ; références `clientId` et `project` intactes |
| BR-07 | Ouvrir `#/control/clients` après restauration | **PASS** — « Entreprise Démo » et sa tâche « Relancer fournisseur fictif » visibles, avec projet associé |
| BR-08 | Ouvrir `#/control/audit` après restauration | **PASS** — 16 projets (catalogue + projet fictif), 1 client, 1 tâche, **0 erreur et 0 avertissement** |
| BR-09 | Recharger puis vérifier le stockage | **PASS** — Le client, le projet et la tâche restent enregistrés avec la liaison client–tâche |
| BR-10 | Ouvrir `#/control/inbox?client=test-client-001` | **PASS** — Filtre client sélectionné et tâche liée visible |
| BR-11 | Prévisualiser un **fichier enveloppé** avec deux projets personnalisés portant le même identifiant | **PASS** — 1 erreur, message « Identifiant répété », restauration impossible, bouton désactivé et case d'acceptation masquée |
| BR-12 | Tenter de déclencher le bouton désactivé par code, puis annuler | **PASS** — Aucune modification de `localStorage` |
| BR-13 | Prévisualiser un JSON sans `format` ni enveloppe | **OBSERVÉ** — La v91 affichait un message générique peu utile. La correction et sa protection contre la divulgation de données ont été livrées dans v92, **pas encore revérifiées publiquement** |

**Limites de la preuve :** BR-01 à BR-12 concernent **un seul véritable profil de navigateur** avec plusieurs navigations et rechargements. Un second profil indépendant a été demandé mais l'ouverture du navigateur a expiré ; il ne doit **pas** être déclaré validé. Le test d'un export téléchargé puis importé physiquement dans un navigateur B n'a pas été effectué.

## Fichiers de test reproductibles sur main

- `tests/fixtures/control-backup-valid-fictif.json` : sauvegarde versionnée avec un client, un projet et une tâche associée, sans secret.
- `tests/fixtures/control-backup-duplicate-project-fictif.json` : sauvegarde versionnée qui doit **toujours** être refusée, même après déclenchement direct du gestionnaire.
- `tests/control-ia-browser-smoke.mjs` : scenarios de vérification du cache, de l'import, des anomalies et du message de format inconnu, à exécuter dans Chromium.
- `tests/control-data-audit.test.mjs` et `tests/control-backup-review.test.mjs` : validité des enveloppes, règles de sauvegarde et messages d'erreur prédéfinis.

**63 contrôles ciblés JS/syntaxe ont été exécutés avec succès après les corrections**, mais ne représentent pas l'exécution complète de toute la suite Node et navigateur du dépôt. Le fonctionnement public de v92 doit être vérifié séparément.

## Prochaines étapes P0

1. Ouvrir **un véritable deuxième profil B indépendant** avec son propre stockage vide, transférer le fichier réellement exporté depuis A et comparer les données avant/après.
2. Vérifier l'export chiffré AES-GCM, la protection contre un mot de passe incorrect et l'import chiffré dans B.
3. Valider l'import quand le disque est plein, quand une écriture échoue et quand deux onglets modifient les mêmes projets.
4. Tester les parcours à 320, 390 et 1440 px, clavier et hors connexion ; collecter des captures expurgées.
5. Sur GitHub Pages, confirmer le service worker **v92**, la nouvelle erreur compréhensible et les scénarios de navigateur enregistrés dans le script.
6. Avant tout partage multi-utilisateurs : vérifier les politiques **RLS/JWT** avec les deux comptes A/B de test prévus dans le dossier sécurité ; ne pas activer le Cloud sans les validations requises.

**Règle de publication :** une correction présente sur GitHub `main` n'est pas automatiquement une preuve que tous les navigateurs reçoivent déjà la dernière PWA. Les caches, la publication Pages et la recette réelle doivent être distingués.
