# CONTROL — Interface V2, lisible et mobile-first

Date : 16 octobre 2026. Projet : `cosscoll/Avancement-Projet`.

## Objectif

Résoudre trois plaintes confirmées par l’utilisateur :
1. Ancienne palette néon sombre fatigante pour les yeux.
2. Trop de cartes et messages concurrents ; informations difficiles à retrouver.
3. Expérience mobile médiocre, menus et onglets difficilement explorables.

## Direction artistique

Une console claire et calme, sans effets 3D ni gradients décoratifs agressifs.

| Élément | Référence V2 |
| --- | --- |
| Fond de l'application | `#f5f7fa` |
| Surfaces des cartes | `#ffffff` |
| Texte principal | `#202d40` |
| Texte secondaire | `#53677c` |
| Bordures | `#e1e7ef` |
| Accent principal / actions | `#355c82` |
| État prudentiel | Beige discret, sans grand bandeau jaune saturé |

Des cartes à bordure fine, ombre très légère, typographie lisible et hiérarchie forte remplacent les fonds bleus/noirs saturés et les titres/indicateurs multicolores.

## Structure et logique de navigation

- Page par défaut : **Automatisations**.
- Une seule liste compacte des cinq tâches : identité, horaire, statut daté, dernier bilan, accès au projet et aux sprints.
- Quatre indicateurs utiles, puis les détails, et **une seule zone de blocages**.
- Longues précisions techniques/notifications dans un panneau **repliable**, pas dans des messages de couleur qui prennent le dessus.
- Recherche rapide Ctrl+K conservée.
- Barre d'accès rapide **fixe en bas sur téléphone** : Tâches / Sprints / Projets / Consignes.
- Tiroir latéral réservé à l'exploration détaillée, fermé au clic sur l'arrière-plan et avec Echap.
- Pour chacun des cinq projets automatisés : ses six onglets sont visibles en grille **3 × 2** sur téléphone, au lieu d'une rangée difficile à parcourir horizontalement.
- Liens existants vers sites publics et GitHub préservés.

## Responsive

Adaptations ciblées aux petites largeurs, y compris 390 px et moins :

- Cartes en une seule colonne.
- Statistiques en deux colonnes.
- Typographie secondaire et liens d'action agrandis.
- Espacement mobile plus régulier, barre d'accès rapide accessible au pouce.
- Gestion du « safe area » des téléphones à encoches/gestes.
- Menu mobile hors de l'écran seulement tant qu'il est fermé, arrière-plan cliquable.
- Respect de `prefers-reduced-motion` (règle conservée).

## Implémentation

- **`assets/theme.css`** : surcharges isolées de la V1 pour conserver les styles de secours.
- **`index.html`** : nouvelle feuille de style, navigation mobile et fond neutre.
- **`assets/app.js`** : liste de tâches compacte, infos repliées, navigation basse et menu latéral géré proprement.
- **`manifest.webmanifest`** : couleurs PWA harmonisées.
- **`service-worker.js`** : cache renommé et nouvelle CSS préchargée, stratégie réseau en priorité conservée.

Aucune modification des projets métier, automations, Supabase ni des données sensibles.

## Tests et limites de recette

- Syntaxe JavaScript et JSON de la source vérifiée.
- Routage et gestion du menu mobile éprouvés par tests de DOM simulé.
- Présence des fichiers CSS, manifest et PWA dans GitHub vérifiée.
- **Aucun navigateur réel Android ou iOS piloté à ce stade ; aucune certification WCAG ni validation visuelle physique affirmée**.
- Le serveur GitHub Pages reste inaccessible depuis notre environnement : vérifier le chargement sur téléphone après la publication GitHub Pages.

## Étapes de recette humaine conseillées

Tester à 320, 360, 390, 768, 1024 et 1440 px (Chrome/Firefox, Android Chrome, iOS Safari si possible). Contrôler : contrastes réels, débordements, menu mobile, quatre onglets fixes, les six onglets projets, recherche, boutons « Visiter le site », chargement des sprints, mode hors ligne/retour en ligne et mise à jour PWA.

La synchronisation de données reste **publique par GitHub** ; cette refonte visuelle n'ajoute ni backend privé ni notifications push natives.
