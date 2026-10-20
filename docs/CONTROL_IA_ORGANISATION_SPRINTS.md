# CONTROL IA — Organisation permanente des sprints (autonomes et conversations)

**Édition : 20 octobre 2026** · Responsable : CONTROL IA uniquement. Cette procédure complète les protocoles [V3](PROTOCOLE_SPRINTS_V3.md) et [V2](PROTOCOLE_SPRINTS_V2.md), sans supprimer l'autocritique, la seconde passe corrective, les tests ni les règles de publication. Les instructions privées V1.1 et BACK-001..042 restent privées.

## 1. Ce que nous construisons et comment nous mesurons le résultat

**Promesse produit :** une demande, un environnement cohérent, des informations avec sources, des actions autorisées réellement effectuées, des traces et une reprise sans duplication.

Les dix nouvelles améliorations sont décrites et dépendancées dans [`data/control-ia-strategy.json`](../data/control-ia-strategy.json) :

| Code | Amélioration | Phase | Dépend de |
|---|---|---:|---|
| IMP-05 | Permissions, consentement et approbations | 1 | CONTROL-ACCOUNT pour le multi-compte réel |
| IMP-03 | Mémoire de projet avec sources | 1 | IMP-05 |
| IMP-10 | Sauvegarde, checkpoint et reprise fiable | 1 | IMP-05 |
| IMP-02 | Recherche universelle sourcée | 1 | IMP-03, IMP-05 |
| IMP-01 | Mode Objectif et plan d'action | 2 | IMP-02, IMP-03, IMP-05, IMP-10 |
| IMP-04 | Boîte de réception des décisions | 3 | IMP-05, IMP-10 |
| IMP-06 | Supervision réelle des agents IA | 3 | IMP-01, IMP-05, IMP-10 |
| IMP-07 | Agenda et planificateur intelligent | 3 | IMP-01, IMP-05 |
| IMP-08 | Constructeur de workflows en langage naturel | 4 | IMP-01, IMP-05, IMP-10 |
| IMP-09 | Poste de commande mobile complet | 5 | IMP-04, IMP-05 |

**Phase zéro bloquante : `CONTROL-ACCOUNT`**, identité et stockage CONTROL indépendants, isolation A/B, synchronisation, suppression. Tant que la base CONTROL dédiée n'est pas approuvée à coût nul et testée, ne pas présenter de compte Cloud ni d'agent externe comme opérationnel. Les prototypes locaux peuvent progresser sous garde, mais ne valent pas le service final.

### Trois suivis, sans confusion

1. **Livraisons existantes** : [`data/control-ia-delivery.json`](../data/control-ia-delivery.json) est le registre des **9 capacités et 36 critères historiques** ; conserver ses identifiants et ses preuves.
2. **Programme des dix ajouts** : [`data/control-ia-strategy.json`](../data/control-ia-strategy.json), 10 initiatives et 30 critères **supplémentaires**. Ces 30 critères ne sont pas des tests réussis ; aucune amélioration n'est « opérationnelle » du seul fait de son inscription.
3. **Exécution/reprise** : [`data/sprint-state/control-ia.json`](../data/sprint-state/control-ia.json) pour le bail et checkpoint, [`docs/CONTROL_IA_RETROSPECTIVES.md`](CONTROL_IA_RETROSPECTIVES.md) pour les autocritiques et [`data/sprints/control-ia.json`](../data/sprints/control-ia.json) pour les bilans compatibles avec le contrat V2/V3.

**Indicateur principal :** part de missions réelles autorisées **terminées et vérifiées** parmi les missions engagées. Définition stricte : trace d'exécution, reçu, résultat accepté, permissions respectées. Ne jamais créer une valeur si nous n'avons pas d'échantillon mesuré. Mesurer séparément bugs P0 ouverts, couverture des parcours, preuves périmées, interruptions et délais de reprise.

## Publication directe sur `main` (demande du propriétaire du 20 octobre 2026)

**Règle prioritaire : aucune nouvelle Pull Request ni fusion pour livrer CONTROL IA.** Les changements nécessaires sont écrits **directement dans la branche `main`** via le connecteur GitHub. Pour réduire le risque, les étapes de qualité remplacent la fusion :

1. Avant toute écriture : vérifier le bail CONTROL IA, examiner le fichier courant et son SHA, comparer les changements attendus, valider la syntaxe et exécuter les tests possibles sans publier. **Si le changement est trop risqué à valider, ne pas écrire.**
2. Écrire un lot cohérent directement sur `main`, séquentiellement, sans écraser des fichiers modifiés par d'autres. Si plusieurs fichiers dépendent les uns des autres, éviter une version transitoire dangereuse ; ne déclarer le lot livré qu'après vérification de tous ses fichiers.
3. Relire immédiatement chaque fichier écrit et comparer le blob SHA au contenu voulu. Contrôler `main`, les résultats CI spécifiques et la suite de régression générale ; inspecter la cause précise de tout échec.
4. Vérifier ensuite le déploiement GitHub Pages et, quand applicable, le parcours réel sur la version servie. Un run Pages vert ne garantit pas une interaction ou un compte connecté.
5. En cas de **nouvelle régression causée par la livraison**, appliquer le correctif testé ou un retour arrière sûr, en conservant le journal ; ne pas masquer le test, rétrograder les contrôles ni prétendre que zéro erreur est garanti. Un échec **préexistant et indépendant** reste visible et doit être corrigé par la voie autorisée du projet concerné, sans falsifier son historique.

Cette règle concerne **les prochains sprints automatiques comme nos conversations classiques**. Elle n'autorise ni dépenses, ni contournement GitHub, ni écrasement concurrent, ni modification de projets tiers sans leur bail. Les anciennes PR peuvent être relues pour récupérer du code, mais **pas de nouvelle PR pour CONTROL**.

## 2. Même méthode pour les deux types de sprints

| Étape obligatoire | Automatisation horaire | Conversation classique |
|---|---|---|
| 0. Lire source de vérité | Dernière stratégie, ancien tracker, critiques, checkpoint, main, PR et CI. | Exactement pareil ; la conversation n'efface jamais un checkpoint existant. |
| 1. Acquérir bail | `control-ia`, `run_id` unique, expiration 45 min, SHA GitHub + relecture. | **Le même bail**. Si l'automatisation le détient encore, ne pas faire d'écriture concurrente. |
| 2. Définir objectif | **Une** capacité principale, sous-objectif AVANT→APRÈS et test pré-définis ; trois sous-objectifs maximum. | La priorité reste identique sauf décision utilisateur explicite ; documenter toute réorientation. |
| 3. Première passe | Développement effectif et tests dans le périmètre autorisé. | Développement effectif ; possibilité de lot plus large si vérifiable dans la session. |
| 4. Autocritique | Liste P0/P1/P2 prouvée, lacunes et limites. | Identique, aucune autocritique décorative. |
| 5. Deuxième passe | Corriger le défaut le plus grave réalisable, retester et refaire une critique. | Identique ; répéter si une correction utile reste réalisable. |
| 6. Livrer | Contrôles préalables, écriture **directe dans `main`**, SHA revérifiés, CI puis site public contrôlés distinctement. | Identique. Aucun succès annoncé avant preuve. |
| 7. Transmettre | Checkpoint, critères, incidents, preuves, prochain pas, libérer son bail. | Identique : le sprint automatique **reprend exactement ce checkpoint**. |

**Le mode conversation classique ne doit pas créer un deuxième chantier concurrent simplement parce que le travail est manuel.** Un ordre du propriétaire peut changer la priorité ; l'écart au focus est écrit, daté et justifié dans la stratégie/rétrospective.

### Si l'automatisation démarre pendant une conversation

- Si cette conversation détient un bail encore valide, l'automatisation **ne modifie aucun code ni document CONTROL** ; elle peut lire et préparer un diagnostic sans toucher à l'état protégé.
- Si le bail appartient à l'automatisation, une conversation classique attend la fin de son bail pour muter ou s'en tient à une analyse.
- Si un bail est expiré, reprendre le **checkpoint** et vérifier les branches, commits/PR/CI avant toute nouvelle écriture.
- Un verrou GitHub est **coopératif** ; il n'empêche pas une personne ou un outil non coopératif de modifier les fichiers. Toujours vérifier les SHA, l'état actuel de `main` et les tests après mise à jour.

### Comment terminer une session sans perdre le travail

Même si une fonctionnalité est incomplète, laisser une seule **prochaine action concrète**, par exemple : « exécuter le test de connexion A/B dans une base CONTROL dédiée dès que les accès seront approuvés ». Écrire aussi les fichiers déjà modifiés, commit `main`, anciennes branches/PR seulement si déjà existantes, SHA, CI, blocage et priorité de reprise. Ne jamais effacer une critique ouverte sans preuve. Libérer uniquement le bail de son `run_id`. Si un checkpoint ancien contient encore du travail non fusionné, **l'archiver dans la rétrospective/stratégie avant de le remplacer**.

## 3. Planification : priorité unique, dépendances et réalisme

1. **P0 immédiat :** fuite de données, suppression accidentelle, violation de permissions, reprise interrompue, régression sur le vrai site, échec de validation empêchant une livraison CONTROL.
2. **Chantier principal `CONTROL-ACCOUNT` :** renforcer tests et contrats RLS/JWT, documenter la création d'une instance CONTROL indépendante. **Ne rien déployer sur IAgile**.
3. **Quand un blocage externe persiste :** conserver le focus, travailler sur une étape sûre et réutilisable de IMP-05 (permissions), IMP-03 (contrat mémoire) ou IMP-10 (reprise), **sans activer de fournisseur externe**. Aucun détour purement cosmétique.
4. **Après fonctionnement du compte :** IMP-05 → IMP-03 et IMP-10 → IMP-02 → IMP-01 → IMP-04/06/07 → IMP-08 → IMP-09. Les contrôles UX, accessibilité et mobile s'ajoutent à **chaque** étape et ne sont pas repoussés à la fin.

Les sous-étapes doivent être **verticales** : interface utile + logique + stockage approprié + autorisation + test de scénario + preuve. Ne pas construire dix écrans vides. Lorsqu'une fonctionnalité peut avancer sans backend, créer un prototype local clairement étiqueté, testable et sans faux statut « connecté ».

### Enchaînement type des prochains sprints

- **Reprise immédiate** : examiner le checkpoint PWA `control-ia/pwa-atomic-v38-20261019-1754` encore inachevé ; vérifier s'il existe vraiment un code/une PR et ne pas retaper aveuglément un ancien patch. Vérifier les échecs CI actuels dus aux rapports d'autres projets ; ne pas falsifier leur validation ni éditer leurs données pour une livraison CONTROL.
- **Deuxième objectif** : inspecter l'identité Cloud en mode désactivé, construire des tests de permissions et préparer une recette authentifiée A/B **sans créer de comptes réels**.
- **Sous-chantier permis en cas de blocage durable** : contrat et tests IMP-05 pour la granularité projet/outil/action, puis IMP-10 pour checkpoints et idempotence ; retour ensuite au compte Cloud dès que la dépendance est levée.

## 4. Conditions de passage d'une étape

Avant de cocher un critère : **preuve reproductible** liée à son ID, scène/parcours testé, SHA, URL et horodatage. Distinguer :
- écrit dans une branche ;
- vérifié par tests automatiques ;
- fusionné dans `main` ;
- version effectivement servie par GitHub Pages / backend ;
- testé en véritable navigateur avec une session adaptée ;
- **opérationnel** après validation des dépendances, permissions, erreurs et conditions d'usage.

Le pipeline public peut tester Chromium et RLS sur comptes fictifs. Cela ne prouve ni API tierce, ni véritable compte Supabase, ni Android/iOS physique. **Ne jamais promouvoir une capacité en cas d'ambiguïté**.

Dépendance non disponible ? Noter un `blocker_id` stable, son nombre de sprints consécutifs, son impact, une alternative sûre et l'approbation éventuellement requise. Après deux sprints identiques : incident à diagnostiquer, pas une boucle.

## 5. Sortie standard à chaque sprint

**Début (si visible)** : projet CONTROL IA, type `automatique` ou `conversation`, heure Paris réellement connue, bail acquis oui/non, objectif, AVANT et résultat visé.

**Fin :** début/fin réels ; focus/initiative (`CONTROL-*`/`IMP-*`) ; développements ; autocritique initiale ; correction et nouvelle autocritique ; fichiers/commits directs `main` (anciennes PR facultatives) ; CI et nombre réel de tests ; `main`, déploiement, recette réelle (oui/non/non vérifié) ; critères avant/après **avec preuves** ; incidents, checkpoint et **première action précise du prochain sprint**.

Le résumé doit rester bref ; la preuve et la mémoire durable dans les fichiers. En cas de limite d'outil, laisser des fichiers de reprise mais **ne pas inventer une exécution continue**.

## 6. Sécurité et coûts inchangés

**0 €**, pas de Work, Codex, agents workspace, Excel ou quotas limités pour les sprints automatisés. Aucune API facturable, aucun achat, permission de compte tiers ou activation Cloud sans consentement explicite ; aucune donnée privée publiée sur GitHub. Les conversations classiques respectent également les garde-fous du projet et peuvent utiliser uniquement les outils permis et autorisés dans leur contexte.

**Important au 20/10 :** l'automatisation `CONTROL IA — Développement autonome` était désactivée lors de cette vérification. Cette procédure **ne la réactive pas** automatiquement et ne modifie ni sa programmation ni les autres automatisations. Son prompt peut être actualisé même si son statut reste désactivé ; il faudra une demande distincte pour relancer les exécutions horaires.
