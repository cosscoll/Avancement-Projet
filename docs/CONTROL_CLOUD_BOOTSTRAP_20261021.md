# CONTROL Cloud — création vérifiée le 21 octobre 2026

## Portée et isolation

- **Projet Supabase :** `CONTROL Cloud`, référence publique du projet `rvrmjjtdedidjnrkdery`.
- **Organisation :** `IAgile` (organisation de facturation seulement) ; **base de données, utilisateurs et endpoint distincts** de `IAgile Academy`.
- **Région :** `eu-west-3` (Paris).
- **Prix de création confirmé par l'outil Supabase :** 0 € / mois. Cela ne garantit pas l'absence de dépassement du forfait gratuit ou de frais associés à des services ultérieurs ; **aucun service payant ni surclassement autorisé**.
- **Statut observé :** ACTIVE_HEALTHY après création.
- **Migration appliquée à cette base uniquement :** `control_saas_v1` (version `20261021122113`), provenant de `supabase/migrations/20261017_control_saas_v1.sql`.
- **Aucune migration sur IAgile Academy.** Aucune donnée de ce projet n'a été copiée.
- **Aucune clé secrète, compte de test, mot de passe ou jeton de connexion ne doit être écrit dans ce dépôt public.**

## Contrôles réels sur CONTROL Cloud

| Contrôle | Résultat observé |
| --- | --- |
| Tables de données CONTROL | 6 |
| Tables avec RLS activé | 6 / 6 |
| Politiques de contrôle d'accès | 22 |
| Politiques du rôle anonyme | 0 |
| Grants du rôle anonyme sur les tables CONTROL | 0 |
| Alertes « security advisor » | 0 |
| Données persistées dans les tables après le test A/B | 0 |
| Comptes Auth permanents de test | 0 |

Le test A/B a été lancé **dans PostgreSQL réel** sous une transaction `BEGIN ... ROLLBACK`, en simulant les identités dans `request.jwt.claim.sub` et en prenant le rôle `authenticated`. Il a contrôlé la lecture, mise à jour, suppression et insertion interdite entre deux propriétaires. Après rollback, les compteurs de profils, projets, items et préférences sont revenus à zéro. **Cela démontre le comportement des policies SQL, mais n'est PAS une recette d'authentification avec deux véritables sessions Supabase Auth.**

## Barrières avant activation sur GitHub Pages

**La configuration `config/cloud.json` doit rester `enabled: false` tant que les étapes suivantes ne sont pas terminées :**

1. Deux **vrais utilisateurs** Supabase Auth de contrôle indépendants, créés avec autorisation explicite et identifiants de test gérés sans exposer de secrets.
2. Tests A/B sur l'API PostgREST et de bout en bout dans l'application avec **des JWT réellement émis**, y compris tentatives de falsification `owner_id`, changement de propriétaire et liens vers projets d'autrui.
3. Recette du cycle inscription, confirmation e-mail si configurée, connexion, expiration, déconnexion, restauration, export et suppression, sans fuite entre sessions.
4. Contrôle des limites et du forfait gratuit, des URL de redirection Auth et des politiques de sécurité. Utiliser **uniquement la clé publiable** `sb_publishable_*` dans un client public, jamais de clé secrète ou `service_role`.
5. Contrôle de la PWA sur GitHub Pages, puis sur navigateur mobile authentifié. Aucune publication de donnée privée dans le dépôt.

**Statut fonctionnel honnête :** backend indépendant et schéma de sécurité créés et contrôlés ; Cloud public désactivé ; authentification réelle A/B, synchronisation, permissions multi-appareils et exécution de fournisseurs non vérifiées. Ne pas changer l'état `real_verified` des critères V1.2.

[Documentation officielle des protections Supabase](https://supabase.com/docs/guides/api/securing-your-api)
