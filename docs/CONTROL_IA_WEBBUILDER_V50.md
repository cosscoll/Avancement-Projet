# CONTROL IA — Constructeur de sites, fiabilité des itérations (V50)

**22 octobre 2026.** Extension incrémentale de l'atelier local V49, sans agent payant ni publication automatique.

## Nouveau parcours utilisable
- Le contrôle des 8 éléments essentiels identifie les **textes d'exemple** (titre, description, trois prestations) au lieu de les compter comme travaux personnalisés.
- Les avertissements pointent directement vers le champ à corriger. Score indicatif : ce n'est ni un audit Lighthouse ni une conformité WCAG garantie.
- Sauvegarder un brouillon modifié crée une nouvelle version ; les **8 versions antérieures** sont conservées localement. Restaurer une ancienne version demande une confirmation et crée une **nouvelle** version : la version remplacée reste consultable dans l'historique.
- Cliquer « Enregistrer » sans modification ne crée pas de version artificielle.
- L'atelier reste accessible par le catalogue, la recherche de fonctions, ainsi que les « nouveautés » repliées de l'accueil.
- Cache hors ligne PWA V50, module constructeur toujours sans scripts externes, cadre de prévisualisation à `sandbox=""`.

## Preuves et limitations
- `tests/control-web-builder.test.mjs` vérifie score honnête, versions, restauration, archive ZIP, sécurité du HTML et absence de dépendances.
- `tests/control-ia-browser-smoke.mjs` vérifie avec Chromium la saisie, l'aperçu, la persistance, l'historique, la restauration confirmée et l'usage hors ligne.
- Les scénarios de bout en bout WEB-01..WEB-04 **ne sont pas intégralement validés** : il manque la vraie génération libre pilotée par IA, le montage arbitraire des fichiers et la publication contrôlée par autorisation.
- Aucun modèle à quota limité, aucun tiers facturant à l'usage, aucune automatisation ChatGPT activée.

**Qualité de publication :** seul le workflow Chromium exécuté en mode production **après** le déploiement, et comparant les octets réellement servis, prouve que la version affichée correspond à ce commit.
