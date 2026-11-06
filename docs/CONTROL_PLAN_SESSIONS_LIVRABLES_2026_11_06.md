# CONTROL — Plan des sessions de développement avec livraison visible

**Créé le 6 novembre 2026.** Dépôt : `cosscoll/Avancement-Projet`, branche de livraison : `main`. Site : https://cosscoll.github.io/Avancement-Projet/.

## Règle non négociable : une session = un progrès visible sur le site

Une session est un **bloc de développement cohérent par besoin utilisateur**, et non une succession d'audits ou de petites corrections sans résultat perceptible. La durée est adaptée à la mission, sans minuterie arbitraire.

Une session n'est déclarée **livrée** que si tous les éléments suivants sont réalisés :

1. **Fonction utilisateur** : rendre possible, plus rapide ou plus clair un parcours réel défini dans le cahier des charges.
2. **Preuve avant/après** : préciser quelle zone de l'interface a changé, quelle action fonctionne, et le chemin exact pour la tester.
3. **Implémentation sur `main`** : fichiers de l'application et tests enregistrés dans GitHub ; pas de simple mockup, maquette ou document de promesse.
4. **Recette** : tests Node et parcours Chromium réussis ; vérifier les 320/390 px si le composant est modifié sur mobile ; ne pas masquer une régression par la suppression de son test.
5. **Publication** : nouvelle version du cache de la PWA si ses fichiers précachés changent ; GitHub Pages déployé avec succès et tests sur les vrais fichiers publics ; aucune validation de publication si le run est encore en cours ou ancien.
6. **Compte rendu** : résultat visible, fichiers/commit, tests, preuve de publication, limites et prochain objectif. Documenter le sprint dans le cahier des charges.

Si la recette échoue, le changement reste **non livré**, et la suite prioritaire est de le réparer. Ne jamais annoncer une fonction comme connectée, synchronisée ou opérationnelle sans test correspondant.

## Planning ordonné — une livraison utilisateur par session

| Session | Priorité et besoin du cahier des charges | Résultat **visible** attendu sur le site | Recette obligatoire |
| --- | --- | --- | --- |
| **20 — publiée** | **P0 Accueil utile** : tâche en un geste | Dans « À traiter en priorité », bouton **+ Nouvelle tâche** vers le vrai formulaire ; sur un état vide, lien **Créer ma première tâche** | Navigation + focus, aucun enregistrement avant validation, test Chromium public, responsive |
| **21 — publiée dans l'application v97** | **P0 Onboarding** : prendre en main sans connaissances techniques | Guide de démarrage contextuel en 3 étapes maximum (projet → tâche → prochaine action), qui disparaît quand l'état local indique une vraie progression ; aucune connexion tierce obligatoire | État neuf, projet existant, stockage illisible, mobile et clavier |
| **22** | **P0/P1 À traiter** : traiter les urgences | Liste plus claire avec catégories « Aujourd'hui », « En retard », « À vérifier » et accès direct aux tâches ; terminée/rouverte uniquement après écriture locale confirmée | Contrôle des échéances, aucune fausse action exécutée, aucun doublon |
| **23** | **P1 Clients légers** : savoir qui relancer | Fiches clients plus utiles : état, prochaine étape, projet lié et raccourci **Créer la tâche de relance**, plus recherche ; aucune fonction CRM fictive | Association client↔projet↔tâche, filtres, erreurs stockage |
| **24** | **P1 Espace projet** : retrouver le contexte | Synthèse projet actionnable : prochaines tâches, dernières décisions sourcées, liens et blocages sans multiplier les onglets | Ne montrer que les éléments du projet, routes stables, erreurs claires |
| **25** | **P1 Recherche** : retrouver une information vite | Résultats unifiés plus accessibles depuis le parcours principal, groupés par type/projet, avec provenance, date et lien direct | Isolation projet, suppression, source non vérifiée, accent/casse et XSS |
| **26** | **P1 Assistants personnalisés** : faire travailler sa connaissance | Parcours guidé pour importer des exports IA, choisir ce qui entre en mémoire et créer/éditer un agent local avec consentement explicite | Import invalide, retrait mémoire, provenance, sauvegarde chiffrée |
| **27** | **P1 Délégation prudente** : préparer/valider une mission | File de missions IA avec statuts honnêtes **préparée / à valider / exécutée / vérifiée**, aperçu des données partagées avant tout envoi | Aucune exécution externe sans connecteur autorisé, état durable et journal |
| **28** | **P0 Sécurité et comptes** : travailler à plusieurs sans fuite | **Seulement après validation des dépendances serveur** : vrai parcours connexion/déconnexion et espace propre à chaque utilisateur ; sinon livrer l'écran de préparation des permissions sans faux compte fonctionnel | Deux vrais comptes A/B, JWT/RLS, révocation et restauration, zéro fuite |
| **29** | **P1 Première connexion officielle** : éviter la double saisie | Un premier connecteur réel et limité (Drive ou Calendar selon autorisation), avec connexion/déconnexion et visibilité des permissions, sinon écran d'information exact | Auth officielle, droits minimaux, données propres à l'utilisateur, suppression |
| **30** | **P1 Bilan** : savoir ce qui a avancé | Bilan « Aujourd'hui / semaine » basé uniquement sur événements locaux vérifiables, tâches clôturées et missions à confirmer | Dates, provenance, aucune métrique ou économie inventée |
| **31** | **P2 Notifications et automatisations** : éviter les oublis | Mode brouillon/simulation visible et paramétrable ; **aucune activation automatique** de tâches planifiées ou de consommation de quotas | Consentement spécifique, arrêt, coût, permissions, journal et tests |

**Ce tableau est un ordre de sessions, pas un engagement de dates ni une affirmation que les modules bloqués sont prêts.** L'ordre peut changer pour corriger un bug réel ou une dépendance. La prochaine session peut démarrer lors d'une nouvelle demande de poursuite dans la conversation ; aucune tâche ne s'exécute d'elle-même entre deux messages.

## Règles de cadrage et d'architecture

- **Charte** : conserver l'interface validée CONTROL v6/v7 (accueil clair, vocabulaire humain et navigation principale simple). Ne pas redessiner l'application pour livrer un sprint.
- **Technique** : réutiliser les modules déjà existants et leurs routes, renforcer les tests, conserver le filtrage et la protection des données locales. Éviter une nouvelle infrastructure avant que son besoin soit vérifié.
- **Sécurité** : pas de mot de passe, JWT, clé API ou information privée dans GitHub Pages ou le code JavaScript public.
- **Comptes et IA tierces** : connexion à ChatGPT/Claude/Gemini et reprise de leurs historiques/mémoires **non actuellement opérationnelles**. Un lien ou un fichier exporté à la main n'est pas une synchronisation native.
- **Pas de dépenses** : ne pas consommer de quota Work/Codex ou démarrer d'automatisation programmée. Ne pas initier un service payant ou connecter des comptes sans autorisation explicite.
- **Priorité produit** : une amélioration qui raccourcit une tâche courante passe avant l'ajout d'un module expérimental.

## Journal de livraison — à compléter après chaque sprint

| Session | Résultat | Commit | Tests Node | Chromium public | GitHub Pages |
| --- | --- | --- | --- | --- | --- |
| 20 | **Publié :** « + Nouvelle tâche » sur l’accueil et « Créer ma première tâche » si la liste est vide ; focus sur le formulaire, sans sauvegarde implicite | [945cfc8](https://github.com/cosscoll/Avancement-Projet/commit/945cfc8b05244bb566ca097d88428ad37c29cdae) | [762/762](https://github.com/cosscoll/Avancement-Projet/actions/runs/42194565344) | [Réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/42194841844) | [Réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/42194758506) |

| 21 | **Application livrée :** « Bien démarrer avec CONTROL » en 3 étapes réelles (projet → tâche → tâche terminée), masqué après usage confirmé et en présence de données corrompues | [code et recette](https://github.com/cosscoll/Avancement-Projet/commit/1ba5462b866cb17ce1a3122917e45b4bab5bf74c) | [772/772](https://github.com/cosscoll/Avancement-Projet/actions/runs/42196714258) | [Chromium complet réussi](https://github.com/cosscoll/Avancement-Projet/actions/runs/42196714495) | [Déploiement v97](https://github.com/cosscoll/Avancement-Projet/actions/runs/42196512270) |

Pour chaque livraison suivante, ajouter une ligne avec les preuves correspondantes et ne passer le statut à « publié » qu'après déploiement public confirmé.

## Cahier des charges source

[CONTROL — Cahier des charges TPE v1.13](CONTROL_CAHIER_DES_CHARGES_TPE_2026_11_03.md). Les parties « priorités », « navigation », « onboarding », « IA et mémoires », « sécurité » et « recette mesurable » font foi sur les livrables attendus, sous réserve des dépendances techniques et des permissions.
