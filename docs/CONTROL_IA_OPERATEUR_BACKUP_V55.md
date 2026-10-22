# CONTROL IA — Sprint V55 : intentions sûres et différences de sauvegardes

**22 octobre 2026 — publié sur `main` uniquement après vérification CI.**

## Agent local — fiabilisation mesurable
- Banc de **53 intentions synthétiques** dans `tests/control-operator-intent-benchmark.test.mjs`. Couverture : lectures par projet, actions locales proposées, agenda, modifications et suppressions unitaires, limites des accès et refus d'instructions interdites.
- Reconnaissance des formulations **négatives** (« ne crée pas »), **explicatives** (« comment créer »), **simulées** (« sans rien créer »), **contradictoires** (créer et supprimer, créer une tâche et programmer un rendez-vous) et **destructrices en masse**. Ces requêtes ne préparent pas de mutation.
- L’assistant lit seulement les données locales de CONTROL après consentement de session, et chaque mutation reste sujette à un écran de contrôle « avant/après/risque » et à une confirmation. Aucun fournisseur IA externe déclenché par ce module.
- Les tests Chromium refusent explicitement les trois familles de demandes dangereuses. L'acceptation formelle IA-01 à IA-04 **reste ouverte**, le moteur n'étant pas un agent IA général.

## Sauvegardes — comparaison sans exposer les dossiers
- La revue de restauration en deux étapes affichait déjà les nombres. Elle calcule désormais, **par identifiant local unique**, les nombres d'entrées **ajoutées, retirées ou modifiées**, même si la quantité totale ne change pas.
- Réordonnancement des enregistrements et ordre différent des propriétés JSON n’occasionnent pas de fausses différences. Les entrées héritées sans ID unique sont étiquetées **comparaison incertaine** au lieu de produire une fausse précision.
- Aucun nom de projet, titre de tâche ni valeur privée ne figure dans le tableau ni dans les objets de comparaison retournés au navigateur : **uniquement des comptes et catégories prédéfinies**.
- Tableau accessible horizontalement sur petit écran et avertissement sur les éléments perdus ou écrasés.
- Import annulable et sauvegarde refusée lorsque l'état local a changé depuis l'analyse, avec tentative de retour arrière sur les trois magasins. Le test Chromium vérifie la détection des modifications **à totaux égaux**, sans révéler un titre de test secret.

## Vérification et limitations
- `service-worker.js` PWA V55 : invalidation du cache de la version précédente afin de servir la nouvelle interface et les règles de l'opérateur hors ligne.
- Tests Node, recette Chromium sur serveur local et recette **post-déploiement** sur Pages à contrôler sur le SHA exact du commit final.
- Les critères ACC-01..ACC-04, IA-01..IA-04 et la synchronisation Cloud demeurent **non vérifiés**. Les 53 cas sont **synthétiques**, pas une preuve de couverture du langage naturel libre.
- Aucune dépense ni consommation de quota Work/Codex, aucune automatisation ChatGPT créée ou réactivée.
