# CONTROL Cloud — Recette réelle des comptes A/B (non encore exécutée)

**État au 21 octobre 2026 :** la base Supabase indépendante **CONTROL Cloud** existe dans l'organisation gratuite IAgile. Projet : `rvrmjjtdedidjnrkdery`, région Paris. **6 tables / 6 RLS / 22 policies**. La configuration publique `config/cloud.json` reste `enabled: false`.

## Tests disponibles

- **SQL PostgreSQL réel** : effectué sur CONTROL Cloud le 21/10, avec deux identités *simulées* par `SET LOCAL request.jwt.claim.sub`, insertions dans les 6 tables, lecture de chaque propriétaire, interdiction des mises à jour croisées et contrôle des droits `anon`. Résultat OK ; transaction `ROLLBACK`, aucun compte ni projet conservé.
- **Recette E2E Auth/PostgREST réelle** : code `tests/control-cloud-real-auth-e2e.mjs` et workflow manuel `.github/workflows/control-cloud-real-auth.yml`. **Non exécutée contre des comptes Auth réels à cette date.** Elle s'arrête volontairement si les identifiants dédiés manquent. Le CI standard ne simule pas deux JWT réels.

## Prérequis sans frais supplémentaires

1. Dans [CONTROL Cloud sur Supabase](https://supabase.com/dashboard/project/rvrmjjtdedidjnrkdery), préparer **deux comptes Auth de test distincts**, exclusivement dédiés à CONTROL, avec des adresses e-mail autorisées et contrôlées (pas de comptes clients). Confirmer leur inscription selon le mécanisme Supabase réellement activé. Ne pas inscrire publiquement des utilisateurs avant les vérifications.
2. Les deux comptes doivent être **vides** (aucun profil, projet, élément, préférence, connexion ou audit préalable). Le script refuse un compte non vide pour éviter toute modification de données préexistantes.
3. Obtenir la **clé publique moderne** `sb_publishable_*` du projet CONTROL Cloud (Dashboard > Settings > API Keys). Une clé `sb_secret_*`, `service_role` ou JWT anon historique est **interdite**. Aucune clé secrète ne doit être committée sur GitHub, copiée dans un message ou injectée dans un navigateur public.
4. Déposer les secrets **uniquement** dans les secrets GitHub Actions sécurisés du dépôt (ou de l'environnement `control-cloud-test`) : `CONTROL_TEST_PUBLISHABLE_KEY`, puis pour les deux comptes soit `CONTROL_TEST_A_JWT` et `CONTROL_TEST_B_JWT` (jetons utilisateur fraîchement émis), soit les paires `CONTROL_TEST_A_EMAIL` / `CONTROL_TEST_A_PASSWORD` et `CONTROL_TEST_B_EMAIL` / `CONTROL_TEST_B_PASSWORD` si la connexion par mot de passe est autorisée dans ce projet.
5. Lancer manuellement **Actions > CONTROL Cloud — Vrais JWT A/B (déclenchement manuel) > Run workflow** et cocher la confirmation des deux comptes de test. Ce workflow n'est **pas déclenché automatiquement**, afin de ne pas effectuer de tests live et consommer des quotas sans demande explicite. Il n'emploie ni API d'administration Auth ni clé de service.
6. Ne déclarer la recette **validée** qu'avec un run GitHub Actions vert comportant les preuves de **deux JWT réellement acceptés par `/auth/v1/user`**, test PostgREST du rôle non connecté sur les 6 tables, lecture croisée A/B vide, interdiction de modification/suppression/insertion étrangère, et **nettoyage confirmé** de toutes les données créées. Un test de nettoyage incomplet marque le job en échec.
7. Contrôler ensuite les redirections Auth, l'envoi de magic links/Google, la restauration de session, la déconnexion et le parcours utilisateur sur `app.html`. **Ce n'est qu'après cela** que l'on peut envisager la bascule explicite de `config/cloud.json.enabled` à `true` avec la clé publiable et le référentiel du projet (jamais une clé privée). La synchronisation et les appareils réels restent des recettes distinctes.

## Limites importantes

- Les nouveaux comptes sont **créés par Supabase Auth**, pas par insertion directe dans `auth.users` pour la recette E2E. Le script n'essaie ni d'envoyer un e-mail vers une adresse fictive ni de contourner la vérification d'identité.
- Les tests SQL simulés ne démontrent **pas** une émission réelle de JWT. Ils sont utiles mais insuffisants pour ouvrir l'application multiutilisateur.
- Le journal `control_audit_events` est volontairement **append-only** : la recette réelle **lit** cette table mais n'y crée pas de ligne, afin que le nettoyage reste complet avec les seuls droits du compte de test.
- Le script conserve les données *uniquement* pendant le test et tente leur suppression en `finally`. Une interruption brutale du runner peut nécessiter une revue manuelle des deux comptes de test ; le préfixe `CONTROL-E2E-` aide à reconnaître les enregistrements, sans supprimer des données d'un compte réel.
- **Le forfait gratuit implique des quotas** ; l'accord de création à 0 €/mois ne donne pas droit à des dépassements payants. Ne pas activer de plan payant ou de services facturés pour cette recette.
- Le script ne transfère aucune donnée depuis **IAgile Academy** et refuse un autre `project_ref` que `rvrmjjtdedidjnrkdery`.

**Sécurité :** aucune donnée secrète, clé, JWT, e-mail de test ou mot de passe réel ne figure dans ce document ou dans les fichiers publics du dépôt.

Références : [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [JWT](https://supabase.com/docs/guides/auth/jwts), [API et RLS](https://supabase.com/docs/guides/api/securing-your-api).
