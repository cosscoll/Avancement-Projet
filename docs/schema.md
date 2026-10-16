# Contrat de synchronisation — CONTROL (version 1)

Ce fichier décrit les données publiques admissibles et la future connexion privée. Il ne constitue **pas** une preuve de synchronisation active.

## Identifiants de projet

`pack-pro`, `banque-ia`, `ucp`, `iagile`, `tcg`.

## Public : statuts et objectifs

Le fichier initial `data/projects.json` contient cinq fiches. Une automatisation peut créer `data/status/<id>.json` contenant les champs de la fiche correspondante :

- `id`, `name`, `status`, `description` : informations générales, sans secrets.
- `objectives` : tableau de `{name,desc,criteria:[{name,done}]}`. `done` est un booléen : `true` prouvé, `false` non accompli ; éviter de marquer `true` un travail seulement prévu.
- `alerts` : tableau de `{title,description,level}` avec faits publics uniquement.
- `decisions` : tableau de `{title,description,state}`, en lecture seule côté public. **Aucune décision prise depuis le site ne vaut autorisation tant que l'authentification et l'accusé de réception ne sont pas mis en place.**

Le pourcentage est calculé comme `critères terminés / critères évalués × 100`. Si aucun critère n'est évalué, afficher `—%`. L'évolution de la grille de critères doit être documentée : ce n'est ni un progrès temporel ni un indicateur de vente.

## Public : rapports par sprint

Une automatisation n'écrit que dans son propre fichier : `data/sprints/<id>.json`. Chaque objet :

```json
{
  "id": "sprint-unique-id",
  "started_at": "2026-10-16T09:10:00+02:00",
  "ended_at": "2026-10-16T09:18:00+02:00",
  "summary": "Résultat vérifié du sprint",
  "done": ["Fait réellement effectué"],
  "blockers": ["Échec précis et son impact, ou tableau vide"],
  "next": "Action prévue au prochain sprint",
  "links": [{"label":"Commits","url":"https://github.com/cosscoll/..."}]
}
```

Les historiques sont initialement vides. Ne pas remplir avec des exemples ni réécrire les précédents comptes rendus. Contrôler SHA et état du dépôt avant chaque modification. Ne pas effacer ou dupliquer les anciens sprints. Chaque résultat doit distinguer « conçu », « testé », « intégré » et « publié ».

## Privé : commandes et décisions (non activées)

La source privée prévue doit enregistrer les champs `project_id`, `instruction_id`, `author_user_id`, `body`, `created_at`, `read_at`, `status`, `sprint_id`, `decision`, `approved_at` et une piste d'audit. Prévoir :
1. Authentification du propriétaire ; refus par défaut à tous les tiers.
2. Stockage séparé des cinq projets avec contrôle d'accès (RLS ou solution équivalente).
3. Au début du sprint : lecture des consignes privées autorisées, horodatage de réception, validation de conformité et priorité.
4. En fin de sprint : compte rendu privé complet et rapport public expurgé synchronisés, statut des instructions traité.
5. Jamais de clé privilégiée dans le navigateur ou dans le GitHub public.
6. Le site ne peut ni autoriser Work/Codex, ni engager des frais, ni modifier le statut des automatisations. Ces pouvoirs restent aux commandes directes de l'utilisateur dans ChatGPT.

Le backend privé dédié n'est pas encore connecté : jusqu'à sa mise en place, les brouillons du site sont **locaux** et **invisibles pour les automatisations**. Ne pas annoncer un fonctionnement bidirectionnel sans test de bout en bout.
