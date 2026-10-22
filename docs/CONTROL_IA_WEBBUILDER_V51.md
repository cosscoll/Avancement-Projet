# CONTROL IA — Création de sites depuis un brief local · V51

**22 octobre 2026 — fonctionnalité partielle, non assimilable à un agent autonome.**

## Fonctionnalités utilisables
- Accès par « Tous les outils », recherche CONTROL et nouveautés repliées de l'accueil.
- Brief de projet saisi librement ; règles locales pour proposer un univers, une accroche, une description et des prestations. La génération n'utilise aucun modèle IA ni service externe et **n'enregistre rien avant confirmation**.
- Trois univers (studio, artisan, produit), neuf palettes prédéfinies avec contraste élevé et trois typographies. Personnalisation complète des textes, aperçu interactif sur ordinateur/mobile.
- Iframe d'aperçu isolée `sandbox=""`, sans exécution de scripts ni chargement d'actifs externes.
- Huit contrôles statiques avec corrections guidées, sans compter les textes des modèles comme personnalisés ; cela n'est ni un audit Lighthouse ni une certification WCAG.
- Historique des huit versions antérieures et restauration en nouvelle version, avec protection contre l'écrasement des données du navigateur.
- Export de quatre fichiers statiques via ZIP : `index.html`, `styles.css`, `standalone.html`, `README.md`. Lien vers une procédure de publication **manuelle**.
- Les fichiers du constructeur sont prévus pour le cache hors ligne PWA **v51**.

## Test et suivi
`tests/control-web-builder.test.mjs` vérifie modèles, briefs, sécurité HTML, contraste, ZIP et versions. `tests/control-ia-browser-smoke.mjs` vérifie en Chromium les parcours de saisie, sauvegarde, restauration, prévisualisation, création depuis brief et fonctionnement sans réseau. Les preuves en production doivent correspondre au SHA du commit final, avec égalité de hash des actifs.

**Non livré :** génération réellement libre par agent IA, édition du code arbitraire dans une sandbox d'exécution, déploiement direct après approbation, synchronisation multi-appareils. Les critères WEB-01 à WEB-04 restent non entièrement vérifiés. CONTROL Cloud reste désactivé ; aucune automatisation externe ni dépense n'a été activée.
