## Sprint — brouillons de discussion par agent (3 novembre 2026)

**Livré sur `main` :** les utilisateurs peuvent saisir un message avant de charger volontairement le modèle IA local ; le bouton d'envoi reste inactif sans modèle. Chaque brouillon est conservé dans le `sessionStorage` du navigateur, isolé par identifiant d'agent et de fil. Il survit aux changements de discussion, à la navigation dans CONTROL et à un rechargement du même onglet. Un refus du stockage de session est signalé ; une copie en mémoire reste possible tant que l'écran est monté.

**Protection des données :** les brouillons ne sont ni transmis à un service externe, ni inscrits dans les échanges enregistrés avant envoi, ni inclus dans les sauvegardes. Après écriture réussie de la question dans un fil, son brouillon est supprimé. La suppression confirmée d'un agent ou d'une discussion efface ses brouillons ; la restauration du Studio vide les brouillons temporaires pour éviter de mélanger les états. Un test Chromium vérifie aussi l'absence de fuite d'un brouillon entre deux agents.

**PWA :** caches publics portés en `v71` pour diffuser cette amélioration aux installations existantes, avec l'avis de mise à jour volontaire déjà disponible. Les tests Chromium couvrent actualisation, navigation, fil distinct, agent distinct, suppression et envoi avec moteur local simulé. Les tests sur téléphone physique et sur une véritable inférence du modèle de ~180 Mo restent à effectuer. Aucun Cloud, OAuth, appel API payant ou automatisation n'a été activé.

### Sprint PWA — mise à jour contrôlée (3 novembre 2026)

Bascule des caches publics PWA `v69 → v70` pour que les installations existantes téléchargent une nouvelle coque de l'application. La page signale un nouveau service worker avec « Actualiser » et « Plus tard » ; le rechargement n'est **jamais automatique** et demande confirmation pour éviter de perdre un formulaire. Le premier enregistrement PWA ne montre pas un faux avis de mise à jour. Les données personnelles locales ne sont jamais écrites dans les caches publics. Les tests sont effectués sur Chromium et sur des événements worker simulés ; validation sur téléphone Android réel encore nécessaire.

### Sprint S5 — recherche locale dans les discussions (3 novembre 2026)

La recherche du Studio IA parcourt les noms et messages locaux des agents, sans lire les archives importées non approuvées ni contacter un fournisseur externe. Elle retrouve un fil dans n'importe quel agent, affiche le total exact et ouvre le message correspondant. Une limite de 20 résultats affichés reste explicite. La recherche accepte les accents et traite toutes les valeurs utilisateur comme du texte échappé. Le contrôle de largeur mobile à 320 px et le parcours Chromium font partie de la recette.

### Sprint S4 — gestion des discussions (2 novembre 2026)

Amélioration des discussions des agents : renommage sans perte de messages, suppression confirmée d'un fil uniquement, interdiction de supprimer le dernier fil et sélection toujours mise à jour après une opération. Le menu « Gérer le fil » regroupe les actions destructives ; les contrôles de largeur 320 px et le parcours Chromium sont inclus dans la recette. Aucune API IA, connexion Cloud ni automatisation n'a été activée.

# CONTROL — Plan des sessions de développement manuelles

**Date :** 2 novembre 2026. **Branche de livraison :** `main` du dépôt `cosscoll/Avancement-Projet`.

Ce plan organise des interventions **déclenchées dans la conversation**. Il ne crée pas de travail en arrière-plan et ne programme aucune automatisation. Les automatisations précédemment désactivées restent désactivées. Il est interdit de lancer une consommation Work/Codex, une dépense API ou de réactiver le Cloud sans autorisation explicite.

## Méthode d'une session

1. Relire le dernier état réel du dépôt `main`, les tests récents et le cahier des charges privé sans publier le texte privé.
2. Limiter le travail à **un problème principal** et au plus deux correctifs associés ; ne pas multiplier les fonctionnalités sans recette.
3. Créer ou modifier le code directement sur `main` avec garde de concurrence SHA ; préserver les données personnelles, le code de production et les anciens formats.
4. Ajouter les tests du parcours positif, du refus, des conflits entre onglets et de la rétrocompatibilité.
5. Vérifier les tests Node, les tests Chromium et la publication Pages sur le dernier SHA ; corriger les échecs plutôt que les masquer.
6. Rendre un bilan très court : **changement visible, preuve, limites, prochain problème**.

### Sprint S2 — Recette chiffrée de la sauvegarde (2 novembre 2026)

- Renforcer le contrôle de l'enveloppe chiffrée V2 : `iterations` fixes à 180 000, dimensions du sel/IV, longueur maximale, erreurs lisibles pour mot de passe erroné ou fichier altéré.
- Ne pas conserver les mots de passe dans les champs de formulaire après lecture ; restaurer uniquement après comparaison et confirmation.
- Tester réellement les quatre magasins, dont les agents et mémoires, avec chiffrement AES-GCM, mot de passe incorrect, données altérées, fichier ancien sans Studio et annulation.
- Garder `config/cloud.json.enabled=false`, aucune API distante ou automatisation activée.

### Sprint S3 — première simplification du tableau de bord (2 novembre 2026)

Deux raccourcis explicites sont ajoutés à « Accès directs » sur l'accueil : **Mes agents IA** et **Sauvegarder mes données**. Les descriptions du moteur de recherche sont révisées pour présenter la création d'agents sans import comme parcours principal et la sauvegarde unifiée avec mémoires. Ces raccourcis ne lancent aucune action et n'établissent aucune connexion externe.

**À vérifier sur appareil réel :** lisibilité tactile et hauteur du panneau à 320/390 px ; le parcours Chromium automatisé mesure le débordement mais pas la qualité perçue.

## Sessions prioritaires

| Ordre | Chantier | Livrable concret | Condition de recette |
|---|---|---|---|
| S1 — Livrée | Sauvegardes Studio IA | Sauvegarde unifiée avec Studio, restauration contrôlée et anciens fichiers préservés | Tests Node, Chromium, quatre magasins, conflits, retour arrière |
| S2 — Livrée | Reprise fiable et sécurité des données locales | Essais supplémentaires de restauration chiffrée et simulation d'échec sur le quatrième magasin, revue des limites de taille et des doublons | Aucun écrasement silencieux, messages d'erreur actionnables, rétrocompatibilité |
| S3 — En cours | UX/UI et découverte des fonctions | Élaguer les menus redondants, privilégier les accès directs aux projets, messages et agents | Parcours fréquents mesurés sur 320/390/1440 px et au clavier ; vérification physique mobile restant à réaliser |
| S4 | Fiabilité des agents et mémoires | Sources traçables, sélection de mémoire révisable, limites de contexte visibles, meilleure gestion des discussions | La révocation agit sur les prochains prompts, aucune fuite de mémoire d'un autre projet |
| S5 — Bloquée | Comptes CONTROL Cloud | Deux vrais comptes Auth indépendants, JWT/RLS A/B, cycles de vie des sessions, révocation, suppression | 8/8 prérequis prouvés et approbation explicite ; ne pas réactiver Supabase ou les inscriptions avant |
| S6 — Bloquée | Connexions IA officielles | OAuth uniquement pour les fournisseurs et permissions réellement disponibles | Session authentifiée, scopes limités, déconnexion/révocation, aucune fausse récupération d'historique |
| S7 | Contrôle du cahier des charges | Réconciliation du suivi, des tickets, du journal des sprints et des preuves | Aucun critère promu « vérifié » par une simple réussite de CI |

## Décisions et limites

- Le **Studio IA local** est utilisable indépendamment des connexions externes ; les imports de fichiers ne sont plus le parcours principal et restent facultatifs.
- Une connexion avec l'identité ChatGPT ou Google n'implique **pas** l'accès aux conversations/mémoires natives. Un compte Claude.ai personnel n'est pas une autorisation d'utiliser son abonnement via une API tierce.
- La sauvegarde des appareils n'est **pas** une synchronisation Cloud. La comparaison des versions en stockage local n'est pas une transaction réellement atomique entre deux onglets.
- Les authentifications Cloud sont désactivées jusqu'à validation A/B réelle. **Aucun mot de passe, cookie de session ou jeton de fournisseur** ne doit être publié sur GitHub Pages, dans un journal ou dans un fichier de configuration.
- Les tests techniques réussis ne valent pas certification de tous les critères historiques du cahier : conserver la distinction entre `in_code`, `ci_tested`, `deployed`, `user_verified` et `operational`.

## État vérifié de S1

À la date de ce plan, les tests Native Node passent **637/637**, la recette navigateur incluant le Studio IA réussit, et GitHub Pages a publié la version du code avec sauvegarde unifiée. Les anciens fichiers restent acceptés ; lorsque leur section Studio est absente, les agents déjà enregistrés sur l'appareil ne sont pas modifiés. Les essais sur de vrais téléphones et comptes Cloud restent non réalisés.

Preuves : [tests Node](https://github.com/cosscoll/Avancement-Projet/actions/runs/41426100486) · [Chromium](https://github.com/cosscoll/Avancement-Projet/actions/runs/41425742193) · [Pages](https://github.com/cosscoll/Avancement-Projet/actions/runs/41426099535).
