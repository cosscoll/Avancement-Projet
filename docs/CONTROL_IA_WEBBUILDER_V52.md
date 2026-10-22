# CONTROL IA — Créateur de sites avec pages multiples · V52

**22 octobre 2026 — prototype de création de sites locaux, module CONTROL-WEBBUILDER.**

## Nouvelles fonctionnalités
- Choix entre **page unique** (sections sur l'accueil) et **site 3 pages** (Accueil, Prestations, Contact).
- Dans le site multipage, navigation HTML relative (`./index.html`, `./services.html`, `./contact.html`) sans serveur, script ou dépendance externe.
- Chaque page dispose d'un document HTML autonome avec titre, description, contenu, lien de navigation et feuille de style commune.
- Le navigateur d'aperçus CONTROL permet de visualiser séparément chaque page sur largeur bureau ou mobile, dans la même `iframe sandbox=""`.
- Export multipage ZIP : `index.html`, `services.html`, `contact.html`, `styles.css`, `standalone.html`, `README.md`. La version standalone reste une page autonome.
- Héritage des trois directions graphiques, neuf palettes, trois typos et textes générés par **règles locales uniquement**, avec validation utilisateur avant enregistrement.
- Modification de structure et retour à une version précédente gardent l'historique sécurisé existant. Les liens de contact sans e-mail explicite n'envoient rien.
- Cache PWA **v52** pour que les fichiers actualisés soient disponibles hors ligne.

## Assurance qualité
- Vérification d'intégrité ZIP (six entrées), liens relatifs entre pages, `aria-current`, échappement HTML, absence de code exécutable et absence de sortie du dossier.
- Recette réelle Chromium : formulaire Structure, sélection des pages, lecture des HTML produits, ZIP et sauvegarde.
- Le test de production ne dépend désormais plus d'une version de cache codée en dur : il lit les versions déclarées dans `service-worker.js`.
- La version effectivement disponible sur GitHub Pages doit être confirmée après publication par hash de fichiers et exécution Chromium complète.

## Hors périmètre
Aucun agent de génération libre ni édition de code arbitraire, aucune mise en ligne automatique, aucune synchronisation réelle et aucun accès à des comptes tiers. `WEB-01..WEB-04` restent non intégralement validés. Aucun budget externe, crédit, quota Work/Codex ou automatisation ChatGPT sollicité.
