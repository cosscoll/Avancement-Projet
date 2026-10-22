# CONTROL IA — Premier atelier de création web (V49)

**22 octobre 2026 · Lot CONTROL-WEBBUILDER, prototype local.**

## Fonctionnalités
- Trois directions visuellement distinctes : studio éditorial, atelier artisanal et produit numérique.
- Personnalisation du nom, de la signature, du titre, de la description, des trois prestations, du texte CTA et d'un e-mail de contact facultatif.
- Aperçu interactif par CSS dans une iframe `sandbox=""` sans permissions de scripts, de formulaires, de même origine ou de navigation principale. Aucun CDN, appel d'API ou transfert de données du site.
- Visualisation ordinateur/mobile et consultation du HTML autonome en lecture seule.
- Brouillons associés facultativement à un projet CONTROL, sauvegardés **dans le magasin local CONTROL déjà couvert par les exports chiffrés** ; limitation à 40 brouillons, gestion explicite des enregistrements refusés par le navigateur et suppression après confirmation.
- Archive ZIP créée localement avec quatre fichiers : `index.html`, `styles.css`, `standalone.html` et `README.md`. HTML/CSS sans dépendance réseau ; contenu utilisateur HTML-échappé et chemins ZIP strictement filtrés.
- Route `#/control/webbuilder` accessible via la recherche de fonctions et le catalogue d'outils. Mise en cache PWA V49 pour accès hors ligne.

## Ce qui n'est **pas** livré
**Ceci n'est pas une génération par agent IA à partir d'un prompt libre.** La génération est déterministe à partir de modèles paramétrables et n'édite pas n'importe quel fichier. Aucune exécution JavaScript du site généré, aucun clonage de site tiers et aucune publication automatique ou synchronisation multi-appareils. Les critères WEB-01 à WEB-04, tickets BACK-015 à BACK-019 et scénarios T-10 à T-13 restent **non entièrement vérifiés**.

## Contrôles
- `tests/control-web-builder.test.mjs` : trois modèles, HTML sécurisé, limites des entrées, validation des ZIP, absence de scripts et de requêtes, modules UI et stockage local protégé.
- `tests/control-ia-browser-smoke.mjs` : formulaire réel, iframe sandbox, mise à jour de l'aperçu, vue mobile, archive ZIP, sauvegarde et persistance après rafraîchissement, aperçu hors ligne.
- Le résultat des GitHub Actions et la recette Chromium **de production** doivent être contrôlés au commit final pour certifier cette livraison.

Aucune automatisation de ChatGPT/Codex/Claude n'a été créée ou réactivée ; aucun crédit payant n'est utilisé.
