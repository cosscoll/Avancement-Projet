# CONTROL IA — Agenda local fiable (lot fonctionnel V48)

**22 octobre 2026 · Cible :** CONTROL-CALENDAR · application personnelle statique.

## Livré sur l'écran Calendrier
- Création d'événements avec heure **locale**, projet, détails et durée de 15 à 240 minutes.
- Modification d'un événement existant, avec validation et conservation de son identifiant ; suppression avec confirmation.
- Détection de conflits sur intervalles stricts, événements de tous les projets et réunions CONTROL Visios. Les créneaux adjacents sont autorisés. Un chevauchement exige une confirmation explicite avant écriture.
- Validation des heures inexistantes au passage à l'heure d'été. Les événements existants sans durée sont réputés durer 30 minutes.
- Export **.ics** à importer manuellement. Échappement des caractères spéciaux, dates UTC, lignes limitées à 75 octets sans casser l'Unicode.
- Écriture locale atomique avec retour arrière sur échec du stockage.
- Nouvelle bibliothèque `assets/control-calendar-core.js` disponible hors ligne et traitée comme ressource essentielle en PWA v48.

## Recettes
- `tests/control-calendar-core.test.mjs` : cas de date impossibles, passage d'heure Amsterdam, durées, chevauchements, réunions, anciens enregistrements, export et tentatives d'injection iCalendar.
- `tests/control-ia-browser-smoke.mjs` : navigation Chromium, heures enregistrées, refus du conflit sans confirmation, confirmation explicite, modification et création ICS ; vérification de l'agenda offline.
- Critères canoniques BACK/T/IMP inchangés sans recette globale d'acceptation.

## Limites
Aucun accès Google/Microsoft réel, aucune invitation envoyée, aucun rappel serveur, aucun déclenchement automatique. Les disponibilités ne concernent que le navigateur local. L'heure d'automne répétée peut rester ambiguë. Le Cloud conserve `enabled=false`. Aucune automatisation ChatGPT réactivée et aucun coût engagé.
