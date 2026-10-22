# CONTROL IA — Constructeur multipages et stabilité PWA V53

**22 octobre 2026 — avancement fonctionnel partiel du module CONTROL-WEBBUILDER.**

## Livré
- Un formulaire de brief libre génère **localement par règles** une première proposition de site, sans consommer un modèle d'IA ni joindre un service externe.
- Choix d'un site à **une page** ou **trois pages distinctes** : Accueil, Prestations, Contact. Dans le mode trois pages, l'atelier génère `index.html`, `services.html`, `contact.html`, `styles.css`, `standalone.html` et `README.md`.
- Liens internes relatifs, sans scripts ni CDN, avec un contact par e-mail seulement si une adresse valable a été renseignée. Le mode une page utilise des ancres locales.
- Visualisation de chaque page dans une iframe isolée, avec formats ordinateur et mobile ; export ZIP créé intégralement sur l'appareil.
- Trois univers graphiques, neuf palettes à fort contraste, trois typographies, aperçu réactif, huit contrôles statiques indicatifs et historique de huit versions précédentes.
- Réutiliser le brief préserve les choix multipages et les options graphiques compatibles, sans écriture avant l'enregistrement explicite.
- Cache service worker **v53** actualisé afin que le constructeur fonctionne aussi hors ligne.

## Tests
Tests Node : intégrité des six fichiers et des liens, injection HTML refusée, archives lisibles, palettes, historique, contexte des briefs et transitions de structure. Chromium : formulaire, sauvegarde, restauration, prévisualisation page par page, export, utilisation hors ligne. La vérification de production compare les octets publiés et lit les noms de caches attendus dans le service worker au lieu de coder une version ancienne en dur.

## Non validé
Le prototype n'est pas un agent IA capable de générer ou d'exécuter arbitrairement du code. Aucune publication automatique autorisée. Auth Cloud, synchronisation multi-appareils, contrôle WCAG/Lighthouse réel et critères WEB-01 à WEB-04 ne sont **pas intégralement acceptés**. Aucune automatisation ChatGPT réactivée ni dépense ou quota Work/Codex engagés.
