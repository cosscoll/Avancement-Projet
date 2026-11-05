# CONTROL — Sécurité multi-utilisateurs : contrat et recette A/B
Édition : 5 novembre 2026 — Statut **préparatoire, non déployé, non certifié**

## Objectif
Préparer le partage des projets, tâches, clients et agents entre indépendants et petites équipes, sans rendre accessibles les données ou connexions IA personnelles d’un collaborateur.

**État réel :** la PWA personnelle conserve des données sur l'appareil. Le projet CONTROL Cloud dédié (référence rvrmjjtdedidjnrkdery) était noté INACTIVE au dernier relevé du 3 novembre 2026. Dans config/cloud.json, enabled=false et les huit contrôles de lancement sont à false. Aucune migration ni ouverture d'accès n'est engagée ici.

Le fichier security/control-access-contract.js est un **contrat de résultats attendus**, non un mécanisme d'autorisation. Il est vérifié par tests/control-access-contract.test.mjs et n'est chargé par aucune application web. Seules des règles serveur/PostgreSQL RLS vérifiées avec de vrais comptes pourront protéger les données.

## Matrice des permissions envisagées

| Action | Propriétaire | Admin | Éditeur | Lecteur | Externe |
| --- | --- | --- | --- | --- | --- |
| Consulter projet et tâches accessibles | Oui | Oui | Oui | Oui | Non |
| Créer ou modifier une tâche | Oui | Oui | Oui | Non | Non |
| Inviter des membres | Oui | Oui | Non | Non | Non |
| Supprimer un projet | Oui | Non | Non | Non | Non |
| Consulter les fiches clients | Oui | Oui | Oui | Autorisation supplémentaire | Non |
| Modifier une fiche client | Oui | Oui | Oui | Non | Non |
| Voir la mémoire ou les conversations privées d'un autre membre | Non sans partage explicite | Idem | Idem | Idem | Non |
| Modifier les agents ou mémoires d'un autre membre | Non | Non | Non | Non | Non |
| Voir les jetons et connexions IA d'un autre membre | Non | Non | Non | Non | Non |
| Exécuter des automatisations ou des missions à coût | Désactivé | Désactivé | Désactivé | Désactivé | Désactivé |

Même un propriétaire d'entreprise ne doit pas automatiquement accéder aux souvenirs, historiques privés ou connexions personnelles d'un salarié.

## Modèle cible — à comparer aux six tables Cloud existantes avant toute migration

- **Organisation / membership** : identifiant d'entreprise, créateur, utilisateurs membres, rôle et état actif. L'appartenance et le rôle doivent provenir d'une table contrôlée en base, et non d'un champ modifiable par le navigateur.
- **Projet / project membership** : rattachement à l'organisation et autorisation projet par projet. Aucun membre ne voit automatiquement tous les projets d'une organisation.
- **Tâches et clients** : clés de projet et d'organisation cohérentes sur INSERT **et** UPDATE, index sur la portée de consultation, lien clientId validé sur serveur.
- **Agents et mémoires** : propriétaire individuel, partage explicite par ressource, possibilité de retirer le partage, version et provenance des sources.
- **Conversations IA** : historique importé identifiable, consentement distinct au partage, aucune prétention de synchronisation native non offerte officiellement.
- **Connexions IA** : jetons chiffrés côté serveur, jamais exposés à une autre personne, ni inclus dans le JavaScript public.
- **Journal d'audit** : auteur authentifié, horodatage serveur, type d'accès et changements de droits ; aucune donnée secrète copiée dans les journaux.

## Règles de sécurité incontournables

1. Activer RLS sur chaque table exposée au Data API. Le seul rôle PostgreSQL « authenticated » n'est pas une autorisation d'accès à toutes les lignes.
2. Pour les écritures UPDATE, vérifier à la fois USING (ligne d'origine) et WITH CHECK (nouvel état). Prévoir une politique SELECT compatible. Vérifier également INSERT, DELETE et l'impossibilité de transférer une ligne vers un autre projet.
3. Ne pas baser une autorisation sur user_metadata, modifiable par l'utilisateur. Ne pas considérer une affirmation de rôle côté interface comme preuve.
4. Un utilisateur révoqué ne doit plus obtenir les lignes protégées sur la prochaine requête ; les effets de durée de vie des JWT et des sessions doivent être testés explicitement.
5. Les vues et fonctions privilégiées ne doivent pas contourner RLS. Vérifier security_invoker pour les vues appropriées et éviter les fonctions SECURITY DEFINER exposées.
6. Ne jamais publier une clé service_role, une clé secrète ou des jetons OAuth dans GitHub Pages, les logs ou un export destiné à un collaborateur.
7. L'export, la révocation des connexions et la suppression de compte doivent être testés avec les données partagées et non partagées.
8. Aucune case de lancement Cloud ne peut être déclarée validée sans preuve d'un test réel.

Références officielles à revérifier lors de l'implémentation :
https://supabase.com/docs/guides/database/postgres/row-level-security
https://supabase.com/docs/guides/auth/sessions
https://supabase.com/docs/guides/api/securing-your-api

## Matrice des 20 scénarios A/B à exécuter sur environnement autorisé

| ID | Scénario | Résultat attendu |
| --- | --- | --- |
| AB-01 | A crée un projet PA | PA appartient à A |
| AB-02 | B lit PA sans membership | Aucune ligne / refus |
| AB-03 | B modifie une tâche de PA via ID connu | Refus |
| AB-04 | B supprime une tâche PA | Refus |
| AB-05 | B crée une tâche en forçant project_id=PA | Refus |
| AB-06 | B déplace sa propre tâche vers PA par UPDATE | Refus par WITH CHECK |
| AB-07 | A ajoute B en lecteur à PA | B ne voit que les lignes explicitement autorisées |
| AB-08 | B lecteur tente UPDATE sur PA | Refus |
| AB-09 | A élève B en éditeur, B modifie une tâche | Succès sur PA uniquement |
| AB-10 | B change user_metadata pour s'annoncer admin | Aucun gain de permission |
| AB-11 | B prétend être owner via une requête API | Aucun gain de permission |
| AB-12 | A retire B de PA ; B relit la ressource | Refus, vérifier session/JWT |
| AB-13 | B UPDATE une ligne qu'il ne peut pas SELECT | Refus |
| AB-14 | A partage expressément un seul agent avec B | B lit uniquement cet agent |
| AB-15 | B recherche une mémoire ou conversation non partagée de A | Refus |
| AB-16 | B lit la connexion ChatGPT/Claude/Gemini de A | Refus, aucun jeton exposé |
| AB-17 | A exporte son compte | Export complet seulement pour ses données autorisées |
| AB-18 | B tente de supprimer le compte ou projet de A | Refus |
| AB-19 | A supprime son compte de test | Suppression/rétention conformes, droits révoqués |
| AB-20 | A et B travaillent sur deux appareils | Aucune fuite via API, cache ou PWA |

**Preuve attendue pour chaque cas :** horodatage, rôle, requête, statut HTTP, nombre de lignes, résultat observable, version de schéma et capture expurgée. Ne jamais stocker de JWT, mot de passe, cookie ou jeton dans les rapports publics.

## Organisation du développement par lots

1. **Lot de préparation sans réseau :** règles attendues testables, sauvegarde locale, audit des clients, dossiers de recette.
2. **Lot d'inventaire en lecture seule :** schéma réel des six tables, politiques, privilèges, paramètres Data API, flux Auth, journal des incidents. Aucun changement à ce stade.
3. **Lot de migration sur base de test explicitement autorisée :** script généré depuis le schéma réel, revue SQL, test de toutes les politiques et tests HTTP A/B.
4. **Lot de validation :** suppression de compte, révocation, partage et retrait des mémoires, données d'équipe, transferts entre appareils.
5. **Ouverture éventuelle :** seulement après les huit contrôles vérifiés et une autorisation humaine de lancement distincte.

## État d'avancement vérifiable

| Élément | État |
| --- | --- |
| Matrice des permissions | Documentée |
| Contrat d'acceptation local | Écrit, tests unitaires |
| Contrôle des données et sauvegardes | Développé dans la PWA personnelle |
| Inventaire du schéma serveur dans cette session | Non réalisé |
| Migration RLS exécutée et testée | Non réalisée |
| Comptes Auth A/B réels | Non créés |
| Tests JWT/révocation/export/suppression | Non effectués |
| Cloud public / automatisations | Désactivés |

Ce dossier n'atteste **aucune** disponibilité de comptes connectés. Les résultats d'un test JavaScript ne prouvent jamais qu'une base PostgreSQL applique réellement RLS.
