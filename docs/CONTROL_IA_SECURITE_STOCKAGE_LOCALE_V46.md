# CONTROL IA — Sécurité du stockage local et sauvegardes v46

**22 octobre 2026 · Périmètre :** PWA personnelle statique, sans comptes externes ni coûts supplémentaires.

## Risques corrigés
1. La sauvegarde auparavant produisait silencieusement `{}` quand le stockage Projets ou Automatisations contenait un JSON invalide. Un utilisateur aurait pu conserver un export incomplet puis écraser ses données en le restaurant.
2. L'accueil utilisait un repli silencieux `{}` sur un `control-hub-v2` corrompu. Toute nouvelle écriture pouvait écraser définitivement la valeur initiale.
3. Des formulaires de liens, conversations, espaces IA, bilans et notes pouvaient afficher leur réussite alors que l'enregistrement local échouait.

## Livraison
- Les trois magasins `control-command-v1`, `control-hub-v2` et `control-automations-v1` sont validés avant export ; tout magasin invalide bloque la sauvegarde classique avec un avertissement.
- Chaque espace corrompu peut être téléchargé localement comme **texte brut** non déchiffré, sans transmission réseau, afin de préserver les données originales.
- L'espace Projets ne transforme plus un magasin illisible en nouvelles données écrites ; un bandeau d'alerte indique le chemin de récupération.
- Les modifications aux conversations, documents de projet, IA associées, bilans, notes et historique se font via `commitHub` : mutation, écriture, confirmation ; en cas de refus du navigateur, restauration de l'état en mémoire sans perdre les références des écrans.
- L'importation de liens/projets ne confirme plus un faux succès si l'écriture a échoué.
- La version du cache du service worker devient **v46** afin de remplacer les copies hors ligne précédentes.

## Recette
- `tests/control-hub-corruption.test.mjs` : JSON corrompus/primitifs, quota, rollback conservant les références imbriquées, opérations partiellement échouées et confirmation.
- `tests/control-local-mutations.test.mjs` : protection des trois espaces pendant l'export et récupération.
- `tests/control-ia-browser-smoke.mjs` : vérifications dans Chromium réel de l'export bloqué et du refus d'écraser des projets corrompus. Aucune création de compte ni donnée réelle modifiée.
- Les workflows de tests, navigateur et Pages doivent être **verts pour le SHA final** avant de déclarer la publication vérifiée.

## Hors périmètre / limitations
La validation de deux vrais comptes Supabase Auth, la synchronisation Android/iOS, les actions de services IA externes et les notifications push exigent toujours une recette séparée. `config/cloud.json.enabled=false` reste inchangé. Ces corrections **ne changent aucun** des états de validation canonique BACK/T/IMP sans preuve intégrale de recette.

Les sauvegardes simples non chiffrées restent sensibles : employer le chiffrement proposé et ne pas publier leur contenu. Ne jamais considérer un fichier brut comme une sauvegarde restaurable validée.
