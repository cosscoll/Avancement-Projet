# Protocole commun des sprints autonomes — v2 (19 octobre 2026)

**Portée** : Business 01 (`pack-pro`, XXh10), Business 02 (`banque-ia`, XXh20), UCP (`ucp`, XXh30), IAgile (`iagile`, XXh40), CONTROL IA (`control-ia`, XXh50) ; fuseau Europe/Paris. **N'active aucun autre projet ni tâche.** Ce document fixe la méthode commune, sans remplacer les spécifications, les décisions et les interdictions particulières de chaque projet.

## Principe : la preuve prime sur l'activité

Un commit, un test local, une archive ZIP, un état déclaratif ou une CI verte ne valent **pas** preuve que l'utilisateur peut utiliser le résultat en ligne. Le niveau atteint doit toujours être déclaré honnêtement :

1. `planned` — choisi, pas codé ;
2. `coded` — code accessible sur branche ou fichier versionné ;
3. `tested` — tests exécutés avec preuve (nature du test explicitée) ;
4. `merged` — commit présent sur branche principale ;
5. `deployed` — artefact/version effectivement servi par un environnement identifié ;
6. `verified_online` — URL réelle et parcours public/autorisé vérifiés, avec résultat daté ;
7. `operational` — parcours utilisateur complet, permissions et dépendances validés en conditions représentatives.

**Les niveaux supérieurs ne sont jamais inférés des niveaux inférieurs.** `not_verified`, `blocked` et `unknown` sont des réponses valides. Pour un livrable privé, `verified_online` exige une URL avec accès autorisé sans révéler de contenu premium ou données privées.

## Début du sprint : résultat ciblé

- Horodater l'exécution réelle (ISO 8601 avec fuseau si accessible) ; un lancement théorique XXh10 n'est pas une heure d'exécution prouvée.
- Lire uniquement dernier sprint + critiques non résolues + main/branches/PR/CI et nouvelles consignes authentifiées du propriétaire du projet.
- Choisir **un livrable prioritaire** : décrire `AVANT` (problème utilisateur reproductible) → `APRÈS` (critère mesurable) et au plus trois sous-objectifs.
- Définir le test d'acceptation et le lien attendu **avant** de coder. Un livrable nécessitant approbation, service payant, migration, accès tiers ou compte réel reste bloqué jusqu'à autorisation.
- Si un sprint précédent a commencé un chantier encore ouvert, **reprendre ce chantier** plutôt que créer des branches/prototypes parallèles.
- Début visible dans le fil de la tâche ChatGPT si les messages intermédiaires sont pris en charge ; sinon publier les détails de début et de fin dans la réponse finale, sans feindre une émission en temps réel.

## Pendant le sprint : livraison + autocritique

1. Vérifier SHA, changements concurrents, permissions et surface d'impact avant d'écrire. Une seule branche/PR cohérente par lot tant que possible.
2. Développer dans le dépôt ou système applicatif de référence, pas dans des ZIP isolés par défaut.
3. Exécuter tests adaptés (unitaire, intégration, UX, mobile, sécurité, RLS, comportement des navigateurs) et indiquer lesquels sont réels, simulés ou impossibles.
4. Autocritique priorisée P0/P1/P2, fondée sur les résultats ; **seconde passe corrective** et nouveau test durant le même sprint si réalisable.
5. PR, CI et intégration seulement si les vérifications nécessaires sont vertes et les conflits/risques connus acceptables. Contrôler la branche principale, puis le déploiement, puis le parcours utilisateur : ce sont trois validations différentes.
6. Si un outil ou un service refuse l'action, conserver erreur et artefacts et passer à une correction indépendante permise. **Jamais contourner un refus ni promettre une reprise automatique impossible.**

## Blocages et gestion des incidents

- Identifiant stable `blocker_id`, cause précise, première apparition, gravité, lien de preuve, responsable de la prochaine action.
- Si **deux sprints consécutifs** rencontrent **le même blocage non résolu**, passer en `incident` et faire de sa levée la première priorité ; interdire la répétition à l'identique et les faux progrès (réécrire les mêmes ZIP/tests).
- Si l'utilisateur doit autoriser un accès ou prendre une décision, indiquer la **seule action minimale indispensable** ; ne pas demander de confirmer un détail déjà autorisé.
- N'aggraver aucun risque de sécurité pour accélérer une mise en ligne.

## Contrat de preuve des rapports

Chaque tâche conserve l'historique sans écrasement dans :
- `data/sprints/pack-pro.json`
- `data/sprints/banque-ia.json`
- `data/sprints/ucp.json`
- `data/sprints/iagile.json`
- CONTROL IA : `docs/CONTROL_IA_RETROSPECTIVES.md` et, si un journal structuré dédié est créé, `data/sprints/control-ia.json`.

Les anciens rapports sont conservés tels quels. Les **nouveaux** rapports gardent les champs existants (`id, started_at, ended_at, summary, done, blockers, next, links`) et peuvent ajouter :

```json
{
  "schema_version": 2,
  "id": "nom-du-projet-date-heure-unique",
  "started_at": "2026-10-19T10:10:00+02:00",
  "ended_at": "2026-10-19T10:17:00+02:00",
  "objectives": [
    {"before": "Parcours indisponible", "after": "Parcours testé sur URL réelle", "acceptance": "Ouvrir l'URL et terminer l'action"}
  ],
  "summary": "Résultat factuel, sans succès inventé",
  "done": ["Modification effectivement réalisée"],
  "deliverables": [
    {"name": "Nom du livrable", "kind": "code", "stage": "coded", "repository": "owner/repo", "ref": "SHA vérifié", "url": "https://github.com/owner/repo/commit/SHA", "online_url": null, "online_verified_at": null}
  ],
  "quality": {"checks_run": ["nom du test"], "checks_passed": ["nom du test"], "checks_failed": [], "real_browser_verified": false, "ci": "not_verified"},
  "blockers": ["Cause vérifiée du blocage"],
  "incidents": [{"blocker_id": "id-stable", "consecutive_sprints": 1, "status": "open", "next_action": "Étape concrète autorisée"}],
  "next": "Action précise du prochain sprint",
  "links": [{"label": "Commit", "url": "https://github.com/owner/repo/commit/SHA"}]
}
```

Cet objet est **un exemple de structure**, pas un sprint effectivement réalisé. Utiliser les vrais horodatages, pas ceux de l'exemple. Ne publier ni secrets, ni emails privés, ni documents premium. Un champ inconnu peut être omis : **ne pas inventer de preuve**. Les fichiers JSON existants sont des tableaux de rapports ; mise à jour après lecture du SHA, sans écrasement de travaux concurrents. Pour un statut `verified_online`, renseigner une URL directe et l'heure du contrôle **réel** ainsi que le résultat du test.

## Bilan visible dans ChatGPT (6 à 10 lignes)

**▶ DÉBUT** — projet, date/heure réelle Paris, 1 objectif principal + sous-objectifs, livrable attendu.

**■ FIN** — début/fin réels ; réalisé ; autocritique et correction ; livrable avec lien et SHA ; tests locaux/CI ; fusion sur main (oui/non) ; **en ligne (vérifié / non vérifié / non)** ; blocage et prochaine action. Si pas de livrable : « Aucun livrable publié ».

Le message final doit toujours contenir ces deux phases si le canal ne peut pas afficher de message pendant la session. Les notifications du compte sont indépendantes de ce protocole. Ne pas prétendre que le fil de la tâche met à jour une autre conversation automatiquement.

## Indicateurs utiles dans CONTROL

Calculer à partir des preuves, **jamais de valeurs illustratives présentées comme réelles** :
- livraisons `verified_online` des sept derniers jours ;
- objectifs acceptés et refusés/non vérifiés ;
- incidents P0/P1 ouverts et nombre de sprints bloqués par cause ;
- âge du dernier livrable vérifié ; 
- travaux codés/PR sans fusion, fusionnés sans déploiement, déployés sans recette.

Afficher la provenance et l'horodatage de la dernière synchronisation. Un journal statique GitHub n'est **pas** un indicateur d'exécution en direct de ChatGPT.

## Règles globales immuables

**Budget 0 €**, aucun Work, Codex, agent workspace, Excel ou autre modèle/mécanisme à quota limité cinq heures ou hebdomadaire, ni consommation indirecte ; pas de facturation/API payante ; respect des accès, des refus d'outil, de l'isolation entre projets et des validations utilisateur. Ne pas modifier activation/cadence des cinq tâches sans demande utilisateur. Aucune vente, prospection, opération sur comptes clients ou migration irréversible non autorisée. Préserver les specs privées IAgile, UCP et CONTROL.

## Retour d'expérience hebdomadaire

Comparer **les livraisons utilisables** et les incidents persistants sur 7 jours, pour réprioriser le backlog, sans créer de nouvelle automatisation. Ce contrôle peut s'effectuer dans les sprints existants ; une nouvelle tâche n'est pas nécessaire.
