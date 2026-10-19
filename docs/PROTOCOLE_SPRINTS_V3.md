# Sprints V3 — verrous coopératifs, reprise, incidents et recette publique

Ce document complète [le protocole V2](PROTOCOLE_SPRINTS_V2.md). Il s'applique uniquement aux **cinq automatisations actives** : `pack-pro`, `banque-ia`, `ucp`, `iagile`, `control-ia`. Il ne démarre ni ne suspend aucune tâche ChatGPT.

## 1. Un verrou coopératif, pas un service de verrouillage global

Le fichier `data/sprint-state/<project>.json` contient l'état partagé **par projet**, sans secrets. Le module `scripts/sprint-v3.mjs` définit `requestLease`, `heartbeat`, `saveCheckpoint`, `finishLease`, `repeatedIncidents` et `recommendedAction`. Les tests de régression sont dans `tests/sprint-v3.test.mjs`.

**Important** : un fichier GitHub ne peut pas empêcher un autre outil extérieur d'écrire dans le dépôt. Le verrou n'est efficace **que si chaque processus coopère** et vérifie le verrou avant de modifier le projet ; il ne protège pas les modifications déjà faites sur le PC ou dans un autre dépôt. GitHub Pages est aussi différé par rapport à GitHub. Ne jamais annoncer « verrouillage distribué garanti ».

### Début d'une exécution ChatGPT

1. Déterminer `project`, `run_id` stable **unique par session**, date/heure réelle `started_at`, objectif concret. Ne pas utiliser de jeton personnel ou e-mail comme ID.
2. Lire depuis la branche principale GitHub le fichier `data/sprint-state/<project>.json` **avec son SHA blob**. Ne pas écrire dans le fichier d'un autre projet.
3. Si `status=running` et `lease.expires_at` dans le futur et propriétaire différent, **ne pas toucher au code du projet**. Rapporter le conflit, et utiliser l'heure suivante ; ne pas voler le verrou.
4. Si bail expiré, préserver `checkpoint` et `recovered_from` : le travail précédent n'est PAS terminé. Le reprendre avant tout nouveau chantier.
5. Préparer l'état `running` avec bail de **45 minutes** maximum, `run_id`, date réelle et objectif. Appliquer via GitHub Contents API **avec le SHA blob reçu à l'étape 2** ; un refus 409/422 implique une nouvelle lecture et une nouvelle évaluation, jamais une écriture forcée. Recharger le fichier et confirmer que le bail est bien le vôtre avant toute mutation du projet. Un échec = pas de propriété du verrou.
6. Pendant un sprint de plus de 45 minutes, renouveler le bail AVANT expiration en relisant le SHA et en vérifiant le `run_id`. Un concurrent ou un ancien bail expiré interdit la reprise non contrôlée.
7. Après une étape durable, enregistrer le checkpoint (fichiers réellement modifiés, branche, URL de PR, étapes déjà validées, **prochaine action concrète**). Le contenu est public : jamais de clé, secret, dossier privé ni donnée client.
8. Fin : publier les résultats et preuves dans le journal du projet après vérification, puis remettre le bail à `idle` **uniquement si run_id concorde et SHA actuel valide**. En cas d'interruption avant fin, le fichier restera `running` jusqu'à expiration ; la prochaine exécution doit récupérer le checkpoint.
9. La lecture/écriture du verrou par le connecteur GitHub est une opération effective, pas un simple commentaire. **Si les outils ne permettent pas de l'appliquer, annoncer « verrou non acquis » et ne jamais prétendre avoir protégé les écritures.**

Les décisions structurées du module Javascript peuvent être suivies à l'identique avec le connecteur si Node n'est pas accessible. La protection complémentaire contre modifications simultanées reste le contrôle des SHAs, des PR et des conflits.

## 2. Reprise après interruption et correction prioritaire

- En cas de `status=running` expiré, reprendre les `checkpoint.next_action`, `branch`, `pr_url` et `files` après revue de la branche principale actuelle.
- Ne pas confondre les données du checkpoint avec une preuve de réussite : vérifier la présence effective des commits et résultats de CI.
- Choisir d'abord l'incident récurrent P0, ensuite le checkpoint en attente, ensuite le travail utile sur le backlog. `recommendedAction` encode cet ordre pour les rapports structurés.
- Les modifications concurrentes non coopératives restent possibles ; ne jamais forcer un merge pour les éliminer.

## 3. Incidents qui reviennent

Chaque rapport nouveau peut porter un tableau `incidents` :

```json
[{"blocker_id":"deployment-stale-pages","status":"open","consecutive_sprints":2,"next_action":"Comparer SHA de la page et inspecter le workflow Pages"}]
```

Le même `blocker_id` doit désigner la même cause ; **jamais** dériver un identifiant stable d'une description approximative d'échec. Si un identifiant apparaît `open` dans les **deux derniers sprints consécutifs**, `repeatedIncidents` le signale comme `incident`. Réviser la stratégie sans contourner les permissions, et signaler uniquement l'intervention utile du propriétaire. Un sprint où l'incident n'est pas mentionné ne prouve pas sa résolution : une résolution exige statut `closed` avec test ou preuve.

## 4. Preuve réelle des sites publics

- CONTROL : `.github/workflows/public-deploy-smoke.yml` (sur push main ciblé, déclenchement manuel et contrôle périodique, si GitHub Actions autorise l'exécution).
- Business 01/02 : workflows `.github/workflows/verify-live.yml` de chaque dépôt ; contrôle après push main et manuel.
- Tests : comparer le SHA-256 du HTML public à l'HTML sur `main`, lancer Chromium en modes desktop et mobile, tester un parcours public sans authentification, le titre et l'absence de débordement horizontal. Les échecs conservent un rapport JSON et éventuellement une capture de **page publique uniquement**.
- La preuve est un **run GitHub Actions terminé avec `conclusion: success`**, associé au commit et à l'URL, et ses artefacts. Une suite réussie n'est jamais présentée comme une recette complète des comptes, de la connexion OAuth, des APIs, des notifications sur Android physique ou de la formation payante privée.
- Une comparaison HTML qui échoue peut indiquer un déploiement GitHub Pages en retard ou une différence de compilation ; ne pas forcer une fusion/rollback sans diagnostic.

## 5. Métriques honnêtes dans CONTROL

Une future interface pourra lire les fichiers `data/sprint-state/*.json` et les derniers journaux V2. Afficher « bail déclaré jusqu'à ... », **pas « ChatGPT travaille maintenant »**. L'état est asynchrone et se base sur le dernier commit publié, pas sur le moteur d'exécution ChatGPT.

Indicateurs à calculer sans valeurs fictives : livraisons vérifiées sur 7 jours, derniers contrôles HTTP, incidents persistants, PR non fusionnées, code sans recette, âge des preuves et actions nécessaires.

## 6. Contraintes permanentes

Zéro dépense, aucun Work/Codex/agent workspace/Excel, aucun outil consommant directement ou indirectement un quota limité 5 h ou hebdomadaire. Github Actions dans des dépôts publics uniquement, avec permissions `contents: read`, sans secret ni service payant ; les tests ne créent pas de comptes et ne lancent aucune transaction. Les restrictions par projet et les confirmations sensibles priment toujours sur la vitesse. Fréquence et activation inchangées. 
