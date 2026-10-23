# CONTROL Cloud — Audit de configuration en lecture seule

**Date : 23 octobre 2026 — périmètre : projet Supabase indépendant CONTROL Cloud.**

Cet audit a consulté uniquement les métadonnées Supabase et PostgreSQL. **Aucun utilisateur, compte de test, clé, token, contenu privé ou donnée applicative n'a été consulté ou modifié.** Aucune migration, ressource facturable ou automatisation n'a été créée.

## État constaté

| Vérification | Résultat |
|---|---|
| Projet indépendant | `CONTROL Cloud` existe ; `ACTIVE_HEALTHY` |
| Région | `eu-west-3` |
| Offre de l'organisation | `Free` au moment du contrôle ; ne garantit pas la gratuité d'un futur usage |
| Tables applicatives | 6 tables `public.control_*` |
| RLS activée | 6/6 |
| Politiques RLS | 22, ciblant exclusivement le rôle `authenticated` |
| Lecture / ajout / modification / suppression par `anon` | 0 table autorisée sur 6 pour ces quatre opérations |
| Politiques d'écriture | `WITH CHECK` lié à `auth.uid()` ; mises à jour avec `USING` et `WITH CHECK` |
| Isolation des ressources liées | FK composite `control_items(project_id, owner_id)` → `control_projects(id, owner_id)` présente |
| Journal des événements d'audit | Uniquement SELECT et INSERT par propriétaire, pas de politique UPDATE/DELETE |
| Fonctions `public` exposées | 0 |
| Alertes de l'advisor de sécurité Supabase | Aucune alerte signalée lors de cette lecture |
| Connexion CONTROL Cloud accessible au public | **Non** : `config/cloud.json.enabled=false` |

Tables auditées : `control_profiles`, `control_projects`, `control_items`, `control_preferences`, `control_connections`, `control_audit_events`.

Les politiques de propriétaires utilisent `auth.uid()`, comparé à `user_id` (profil) ou `owner_id` (autres tables) ; l'essentiel des tables dispose de règles SELECT/INSERT/UPDATE/DELETE. **Ce contrôle porte sur les définitions des règles**, pas sur leur exécution avec de vrais JWT.

## Requêtes de contrôle reproductibles (lecture seule)

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename like 'control_%'
order by tablename, cmd, policyname;

select c.relname,
       c.relrowsecurity,
       has_table_privilege('anon', c.oid, 'SELECT') as anon_select,
       has_table_privilege('anon', c.oid, 'INSERT') as anon_insert,
       has_table_privilege('anon', c.oid, 'UPDATE') as anon_update,
       has_table_privilege('anon', c.oid, 'DELETE') as anon_delete
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname like 'control_%' and c.relkind = 'r';

select conrelid::regclass, conname, pg_get_constraintdef(oid)
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid in ('public.control_items'::regclass,
                   'public.control_projects'::regclass);
```

## Ce que cet audit ne valide pas

- **ACC-01, ACC-02 :** sessions Auth réelles A/B, deux JWT différents, refus d'accès croisé via l'API PostgREST, propriété des lignes, renouvellement et révocation.
- **ACC-03 :** synchronisation réelle de projets et tâches sur deux navigateurs/appareils.
- **ACC-04 :** déconnexion, export, suppression effective du compte et nettoyage.
- Consentement final du propriétaire pour les essais authentifiés et tout changement d'activation.
- Exhaustivité d'un audit de sécurité : un advisor sans alerte n'est pas une certification de sécurité.

## Prochain essai P0, conditionnel à l'autorisation du propriétaire

Utiliser le lanceur existant `tests/control-cloud-real-auth-e2e.mjs` sur **deux comptes de recette dédiés et vides**, jamais sur des comptes ou projets réels. Employer exclusivement la clé publique et les jetons individuels des comptes, sans `service_role`. Vérifier les six tables, lecture anonyme interdite, usurpation de propriétaire refusée, rattachement inter-projets refusé et suppression complète des données de test. Consigner le SHA, les résultats et l'environnement, **sans publier les JWT, secrets ou emails de test**.

Ne pas déduire de la configuration observée une autorisation d'ouvrir les inscriptions. **Le verrou `enabled:false` doit rester en place.**

**Impact sur le cahier V1.2 :** infrastructure confirmée et prérequis de sécurité inspectés en lecture seule ; **0/4 critères de la capacité CONTROL-ACCOUNT acceptés à ce stade**, sans promotion artificielle.
