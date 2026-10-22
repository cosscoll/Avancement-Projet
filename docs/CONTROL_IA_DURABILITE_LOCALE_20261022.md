# CONTROL IA — Fiabilité des données locales · 22 octobre 2026

## Incident corrigé
Le centre de commande permettait à plusieurs formulaires de modifier leur état en mémoire, de rafraîchir l'écran et d'annoncer « enregistré » même si `localStorage.setItem` échouait (quota atteint, stockage privé bloqué, etc.). Une mission pouvait aussi être marquée « terminée » sans compte rendu avant d'être refusée, tout en restant mutée en mémoire.

## Correctifs livrés
- `commitLocal` exige la sauvegarde complète avant toute confirmation visuelle, sinon restaure l'état précédent en mémoire et conserve le formulaire.
- Opérations protégées : messages du centre, création/clôture des actions, création de missions individuelles ou des quatre étapes multi-IA, mise à jour de mission, événements, ressources, dépenses, revenus, plafond indicatif, règles globales et choix de notification.
- La validation « mission terminée » précède désormais toute mutation.
- Un JSON local corrompu n'est plus interprété comme une base vide réinscriptible. Les modifications sont bloquées et un avertissement invite à récupérer le texte brut ou à importer une sauvegarde valide.
- Depuis « Sauvegarde et récupération », la récupération brute crée un fichier .txt sur l'appareil. L'export classique est refusé tant que la source est corrompue ; la restauration validée peut débloquer l'espace.
- Cache PWA v45 pour diffuser le JavaScript corrigé aux installations existantes.

## Recette et limites
- Tests `tests/control-local-mutations.test.mjs` : succès, échec/exception d'écriture, lot interrompu, source corrompue, récupération et validation préalable des statuts.
- Les tests CI et la recette Chromium doivent être vérifiés **au SHA final** ; un commit isolé ne suffit pas à attester les scénarios réels T-01 à T-42.
- L'écriture locale n'est ni un synchroniseur entre appareils, ni une identité Supabase, ni une sauvegarde distante. CONTROL Cloud demeure `config/cloud.json.enabled=false` tant que JWT Auth A/B et parcours réels n'ont pas été validés.
- Les autres espaces locaux (HUB et AUTOMATISATIONS) ne bénéficient pas automatiquement de cette transaction ; leur récupération est distincte.
- Aucun compte, automatisation ChatGPT, connecteur payant ou agent externe n'a été activé pour ce chantier.
