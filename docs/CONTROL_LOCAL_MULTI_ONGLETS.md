# CONTROL IA — Protection du stockage entre plusieurs onglets (V64)

Date : 23 octobre 2026. Portée : application personnelle locale. **Aucune activation Cloud ni synchronisation entre appareils.**

## Risque et principe

Deux onglets ayant chargé la même version des données pouvaient réenregistrer un ancien état et effacer une action ou un projet ajouté entre-temps.

Les trois zones locales suivies sont :

| Stockage | Données concernées | Contrôle |
|---|---|---|
| `control-command-v1` | Actions, missions, événements, réunions, décisions | Référence du dernier contenu lu puis vérification avant écriture |
| `control-hub-v2` | Fiches projets, liens, notes, espaces IA | Même protection avec restauration de l'objet et des tableaux existants en cas d'échec |
| `control-automations-v1` | Fiches et brouillons du registre | Refus d'enregistrer un brouillon issu d'un état obsolète |

Une tentative d'écriture après une modification externe retourne `false`, conserve l'état enregistré et indique de recharger l'application. Un retour arrière est appliqué aux changements non enregistrés par les transactions locales.

Cette protection n'est **pas une opération comparer-et-écrire atomique entre navigateurs**, ne remplace pas un verrou transactionnel serveur, ni les vérifications JWT/RLS et la synchronisation prévue par `CONTROL-ACCOUNT`.

## Avertissement permanent en cas de changement externe (V66)

Le panneau personnel contient maintenant un avertissement persistant et accessible (`role="alert"`) lorsque le navigateur reçoit un événement `storage` concernant l'un des trois registres CONTROL. Contrairement au message temporaire, il reste visible pendant la navigation entre les pages. L'utilisateur dispose d'un bouton **« Recharger les données »**, mais le rechargement nécessite une confirmation expliquant le risque de perdre une saisie non enregistrée. L'application n'écrit aucune donnée en réaction à cet événement.

Le cas `localStorage.clear()` est couvert : un navigateur émet un événement où `key`, `oldValue` et `newValue` valent `null`. Le panneau s'affiche aussi dans ce cas. Les clés étrangères au projet et les événements sans changement de valeur sont ignorés.

**Tests isolés :** `tests/control-cross-tab-notice.test.mjs` (5 cas), ainsi que la vérification de non-régression du stockage projets. **Scénario Chromium prévu** dans `tests/control-ia-browser-smoke.mjs` ; exécution réelle et validation mobile non confirmées. Le message n'est pas une synchronisation automatique : pour éviter de perdre les formulaires incomplets, c'est l'utilisateur qui décide quand recharger.

## Recette manuelle à réaliser dans un navigateur réel

1. Ouvrir CONTROL dans deux onglets **A** et **B** du même navigateur/profil, à partir de la même version de données ; créer une sauvegarde d'abord.
2. Dans **A**, ajouter une action test et vérifier qu'elle est conservée après un rechargement de **A**.
3. Sans recharger **B**, essayer de créer une autre action : **B doit afficher l'avertissement de conflit**, refuser la confirmation et préserver l'action de **A**.
4. Recharger **B**, puis créer la deuxième action : **les deux actions doivent être présentes**.
5. Répéter sur une fiche projet (modifier des liens ou notes dans chaque onglet) puis sur un brouillon d'automatisation **sans rien programmer chez ChatGPT ou d'autres fournisseurs**.
6. Tester un `localStorage` plein/refusé et une valeur JSON illisible ; le stockage initial ne doit pas être remplacé par une liste vide. Vérifier l'option de récupération des données brutes.
7. Vérifier le comportement sur Chrome desktop et sur un vrai téléphone. Consigner le navigateur, le SHA déployé et des captures/étapes reproductibles.

## Export de sauvegarde cohérent (V65)

Un nouvel audit a constaté que l'export utilisait un état `db` conservé en mémoire, susceptible d'être plus ancien que le stockage partagé avec un autre onglet. L'export de CONTROL compare désormais le dernier état de commande chargé avec la version effectivement enregistrée, puis capture les trois zones. Si le moindre espace change pendant la préparation **ou pendant le chiffrement asynchrone**, l'export s'interrompt avant de créer le fichier.

Recette manuelle complémentaire : ouvrir CONTROL dans les onglets A et B, conserver « Sauvegardes » ouvert dans B, modifier une action dans A, puis déclencher l'export depuis B ; **aucun fichier périmé ne doit être produit** et un message doit demander le rechargement. Renouveler avec une modification d'un lien de projet et d'un brouillon d'automatisation pendant une exportation chiffrée (sans activer de tâche réelle).

Tests : `tests/control-backup-export-consistency.test.mjs`, sept cas ciblés dont deux scénarios exécutant le véritable gestionnaire asynchrone de téléchargement avec versions stables/modifiées. Les tests isolés ne remplacent pas les essais dans Chromium ni sur mobile.

## Tests de code disponibles

- `tests/control-local-tab-isolation.test.mjs` : conflit, conservation de l'écriture récente, rechargement, suite d'écritures du même onglet et stockage défectueux.
- `tests/control-cross-tab-stores.test.mjs` : brouillons d'automatisations, liens de projets, refus des écritures périmées et absence d'activation des programmations réelles.
- `tests/control-local-mutations.test.mjs`, `tests/control-hub-corruption.test.mjs`, `tests/control-automation-draft-storage.test.mjs` : protections historiques contre corruption et échec d'écriture.

**Situation actuelle :** tests ciblés exécutés dans un environnement JavaScript isolé. Le flux `node --test tests/*.test.mjs` sous GitHub Actions, la recette Chromium publiée et les essais sur appareils physiques ne sont pas encore prouvés sur cette version. Le nombre de critères d'acceptation V1.2 certifiés **reste inchangé**.
