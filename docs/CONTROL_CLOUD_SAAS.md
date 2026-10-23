# CONTROL Cloud — plateforme multi-utilisateurs (bêta technique)

**Statut vérifié au 23 octobre 2026 :** le projet Supabase indépendant **CONTROL Cloud** existe, est `ACTIVE_HEALTHY` dans une organisation `Free`, avec six tables protégées par RLS et 22 politiques. Les **INSCRIPTIONS ET CONNEXIONS PUBLIQUES RESTENT DÉSACTIVÉES** : tests Supabase Auth/JWT/PostgREST avec deux véritables utilisateurs, synchronisation mobile, OAuth et suppression de compte non validés. [Audit en lecture seule du 23/10](CONTROL_CLOUD_SECURITE_AUDIT_2026_10_23.md).

## Fichiers

- `app.html`, `assets/cloud-app.js`, `assets/cloud-app.css` : application mobile responsive, indépendante du CONTROL personnel.
- `config/cloud.json` : verrou de sécurité **`enabled:false`**, sans clé. Tant qu'il reste ainsi, `app.html` affiche « CONTROL Cloud se prépare » et ne propose pas de création de compte.
- `config/cloud.example.json` : exemple de configuration publique (ne jamais ajouter de clé `service_role`).
- `supabase/migrations/20261017_control_saas_v1.sql` : schéma PostgreSQL de six tables avec 22 politiques RLS et clés étrangères empêchant d'associer un élément à un projet d'un autre propriétaire.
- `supabase/functions/control-delete-account/index.ts` : fonction de suppression du compte nécessitant la vérification de l'identité. **Non déployée** et non exposée dans l'application tant que `accountDeletionEnabled` n'est pas explicitement activé.

## Infrastructure indépendante : étape accomplie, ne pas recréer

Au 23 octobre, le projet séparé **CONTROL Cloud** est présent et opérationnel côté infrastructure (statut `ACTIVE_HEALTHY`). Son organisation est en offre `Free`. La base IAgile Academy demeure exclue du périmètre ; **aucun nouveau projet ni aucune dépense ne sont nécessaires pour reproduire l'audit en lecture seule**. La gratuité de tout usage futur n'est pas acquise : vérifier les quotas et obtenir une autorisation explicite avant toute opération potentiellement facturable.

Les essais d'authentification réels restent à valider avant d'exposer des comptes dans CONTROL.

## Verrou de sécurité des migrations (ajouté après l'audit)

Les deux migrations SQL CONTROL sont désormais **bloquées par défaut**. Si elles sont lancées sans confirmation explicite de l'instance PostgreSQL, elles lèvent une exception et n'effectuent aucune création de table.

**Avant d'exécuter une migration**, vérifier sur la console Supabase que l'identifiant et le nom du projet correspondent bien à la nouvelle base **CONTROL Cloud indépendante**, et jamais à la base **IAgile Academy**. Sur cette nouvelle base uniquement, dans **la même session SQL que la migration**, exécuter :

```sql
SET app.control_isolated_project = 'confirmed';
-- ensuite exécuter le contenu de la migration CONTROL choisie
```

Ne jamais inscrire cette confirmation par défaut dans les fichiers de migrations, les scripts de production ou le projet IAgile. Si le mode d'exécution choisi n'autorise pas une confirmation de session sûre, interrompre la migration : mieux vaut attendre que risquer d'affecter une base existante. Ce verrou est un garde-fou supplémentaire, **pas une preuve** que la bonne instance est sélectionnée. Les comptes Cloud restent désactivés.

## Installation contrôlée — historique et étapes restant à tester

1. **Fait :** le projet Supabase indépendant **CONTROL Cloud** existe. Ne pas créer un deuxième projet.
2. **Fait côté base :** les six tables, 22 politiques RLS et clé étrangère composite sont présentes (audit en lecture seule du 23/10). **Ne pas réexécuter les migrations** sur ces tables sans besoin démontré ni autorisation.
3. Configurer dans Supabase **Authentication → URL Configuration** : Site URL `https://cosscoll.github.io/Avancement-Projet/app.html` et redirect URL autorisée `https://cosscoll.github.io/Avancement-Projet/app.html`. Les liens e-mail et OAuth doivent retourner exactement à cette adresse HTTPS. Ajuster si le domaine officiel change.
4. Vérifier l'envoi d'e-mails d'authentification et les quotas/délivrabilité du fournisseur. L'option **Google OAuth** exige de configurer le client OAuth et la page de consentement Google ; la simple connexion au compte Google ne donne pas les droits Google Drive/Gmail.
5. Déployer la fonction `control-delete-account` avec vérification JWT activée et variable d'environnement `CONTROL_ALLOWED_ORIGIN=https://cosscoll.github.io`. La clé de service ne doit exister que dans les secrets du fournisseur, **jamais dans les fichiers GitHub**.
6. Activer les options de protection disponibles : confirmation des e-mails, prévention des abus, CAPTCHA/rate limits si la fonctionnalité est ouverte à des tiers, restrictions des redirections.
7. Tester les deux comptes **A et B** (voir protocole de recette) en créant de véritables sessions distinctes. Si un test d'isolation échoue, **stopper l'ouverture**.
8. Renseigner `config/cloud.json` avec `enabled:true`, `supabaseUrl` et la **clé publishable publique** `sb_publishable_...`. Garder `allowRegistration:false`, `allowGoogleLogin:false` et `accountDeletionEnabled:false` pendant les premiers tests sur invitation. Activer chaque drapeau **uniquement après** validation du flux correspondant (création publique, OAuth Google, suppression du compte).
9. Vérifier l'inscription, la connexion par lien magique, le login Google, la création des projets, le chargement multi-appareils, l'import volontaire et les sauvegardes. Tester sur Android et iOS.
10. Préparer politiques de confidentialité, mentions légales, CGU, politique de conservation/suppression et gestion des données, et réaliser une validation sécurité / RGPD avant l'ouverture publique.

## Ce qui est réellement implémenté dans l'interface

Les comptes passent par Supabase Auth (liens e-mail et bouton Google, sous réserve de configuration). Les projets, tâches, missions, fiches d'automatisations, liens vers les IA et Drive, décisions, calendriers, revenus, dépenses et rapports sont stockés dans des tables isolées par propriétaire. Les nouvelles données sont relues depuis le serveur quand on ouvre l'application ou revient sur l'onglet, ce qui permet la synchronisation multi-appareils lorsque le backend est prêt.

Un compte neuf part d'un espace **vide** et ne reçoit **jamais** automatiquement les projets personnels de l'auteur. Le propriétaire de l'ancien CONTROL peut lancer volontairement **Importer mon ancien CONTROL** depuis **le même navigateur**. L'opération vérifie deux confirmations, crée des projets privés et copie les raccourcis et bilans locaux. Elle ne transfère pas l'historique réel des conversations des IA.

Les accès ChatGPT, Claude, Gemini, Codex, GitHub et Google Drive sont pour le moment des **liens profonds**, non des connexions à leurs contenus privés. Les abonnements de l'utilisateur ne sont pas convertis en accès API. L'assistant CONTROL IA est une synthèse des données du compte, pas un modèle LLM interrogeant automatiquement les IA. La fiche des automatisations est informative et ne modifie pas directement leur programmation officielle.

Le fichier de sauvegarde Cloud peut être chiffré par AES-256-GCM/PBKDF2 à partir d'un mot de passe choisi par l'utilisateur, mais il n'y a pas de sauvegarde serveur confirmée. Le stockage local de l'ancienne version est conservé jusqu'à une migration validée.

## Recette obligatoire : séparation multi-utilisateurs

Utiliser deux comptes réels distincts dans un projet de TEST CONTROL (jamais IAgile).

1. Créer un compte A, puis ses projets et plusieurs ressources. Se déconnecter.
2. Créer un compte B : aucun projet, lien ou contenu de A ne doit être visible.
3. Sur B, essayer l'API PostgREST en utilisant son propre JWT pour lire `control_projects`, `control_items`, `control_preferences` et `control_audit_events` du propriétaire A : **0 ligne** ou refus.
4. Avec B, essayer de créer un élément `owner_id=A`, d'éditer un enregistrement A ou de rattacher `project_id=A` avec `owner_id=B` : **refus RLS ou clé étrangère**.
5. Avec une clé publique et **sans session**, essayer SELECT / INSERT : **interdit**.
6. Vérifier que A retrouve bien ses données après changement de téléphone/navigateur et ne voit jamais celles de B.
7. Vérifier les caractères HTML malveillants et les URL avec paramètres `token`, `api_key` : l'interface doit les neutraliser/refuser.
8. Tester les courses entre déconnexion de A et connexion de B, les requêtes lentes, la mise à jour concurrente sur deux appareils et les limites de pagination.
9. Tester le lien magique (redirection correcte), Google OAuth et la rotation/expiration des sessions.
10. Vérifier l'export et la restauration du JSON chiffré et la suppression du compte B via fonction sécurisée, puis confirmer l'absence de données B.
11. Contrôler le budget, les quotas e-mails/API, les coûts et les erreurs de rate limit.
12. Ne mettre en production publique que si les résultats sont consignés avec preuves.

## Passage futur du site public à une entrée obligatoire par compte

L'ancien `index.html` est **délibérément préservé** pour ne pas couper l'accès aux projets actuels ou donner une fausse impression que l'authentification protège déjà ses pages. Lorsque les tests précédents seront réussis, remplacer `index.html` par une page d'orientation/connexion qui redirige vers `app.html` et supprimer tout accès de production à l'ancien tableau de bord. Mettre à jour le Service Worker pour que les nouvelles pages de connexion soient servies en **réseau obligatoire** et ne soient jamais remplacées par la page personnelle hors ligne.

Ne pas prétendre que la nouvelle adresse est déjà une application publiquement authentifiée. L'ouverture à tous exige le backend et des contrôles opérationnels.

## Coûts et limites

Le code n'engage aucune dépense. Créer un nouveau projet Supabase, héberger des données, expédier des e-mails, utiliser un fournisseur IA/API ou déployer des fonctions peut avoir des limites gratuites ou des coûts variables. Le propriétaire doit vérifier et autoriser tout coût non nul au préalable.

## Interrupteurs de lancement (fail-closed)

- `enabled:false` : aucune page de connexion active, écran de préparation uniquement.
- `enabled:true`, `allowRegistration:false` : authentification e-mail de comptes existants/invités, aucune création libre de comptes via OTP.
- `allowRegistration:true` : inscription libre par e-mail ; n'activer qu'après validation des protections et des obligations légales.
- `allowGoogleLogin:true` : afficher le bouton Google **uniquement** quand le fournisseur OAuth est correctement configuré. OAuth Google peut créer des comptes ; ne pas activer pendant une bêta fermée sans mécanisme d'invitation supplémentaire.
- `accountDeletionEnabled:true` : exposer la suppression définitive uniquement si l'Edge Function JWT vérifiée est déployée et testée.


## Recette PostgreSQL indépendante A/B — 19 octobre 2026

**Code ajouté et fusionné :** [PR #21](https://github.com/cosscoll/Avancement-Projet/pull/21). Le workflow [CONTROL Cloud — PostgreSQL RLS A/B](../.github/workflows/control-cloud-rls.yml) lance un **PostgreSQL 16 jetable sur GitHub Actions**, sans connexion à un projet Supabase, abonnement ou modification d'une base IAgile. Il crée deux utilisateurs factices, simule les rôles de base Supabase et la fonction auth.uid(), puis applique les migrations CONTROL existantes.

**Scénarios réellement exécutés :** migration bloquée sans confirmation (y compris quota IA), six tables métier isolées entre A et B, accès aux propres lignes, refus de lectures/modifications croisées, usurpation du propriétaire, rattachement inter-projets refusé par clé étrangère composite, accès anonyme interdit, journal audit non modifiable par le client, fonction quota IA réservée au rôle service. Deuxième passe : refus d'une session sans auth.uid() et tentative de réassignation de owner_id.

**Résultat :** [CI RLS sur main réussie](https://github.com/cosscoll/Avancement-Projet/actions/runs/39233284788), et [CI générale](https://github.com/cosscoll/Avancement-Projet/actions/runs/39233285019). Scripts : [fixtures](../tests/control-cloud-pg-fixtures.sql), [assertions A/B](../tests/control-cloud-rls-ab.sql). Le résultat valide le **comportement PostgreSQL des politiques dans cet environnement fictif uniquement**.

**Toujours NON testé :** aucune authentification Supabase Auth réelle, signature et rotation JWT, vraie API PostgREST, permissions/configuration du futur projet CONTROL, appels multi-appareils, backend connecté, suppression des comptes ni Android physique. Un rôle authenticated et une fonction auth.uid() **simulés** ne valident pas les sessions fournisseur ; il ne s'agit pas d'un audit de sécurité complet. Critères ACC-01 à ACC-04 **non vérifiés**. Cloud enabled:false inchangé.

**Prochaine recette après confirmation/autorisation d'une instance CONTROL réellement indépendante à coût nul :** deux utilisateurs de TEST authentifiés par Supabase, leurs propres JWT (jamais enregistrés dans un dépôt public), tests PostgREST A/B, sessions expirées et révoquées, synchronisation sur deux appareils autorisés, export et suppression. L'échec d'un seul scénario bloque l'activation publique.


## Renforcement de la configuration et des sessions — 20 octobre 2026

**Code déployé sur `main` ; authentification réelle toujours NON ACTIVÉE.**

Le frontal refuse maintenant toute initialisation Supabase lorsque l'URL ne correspond pas à un projet proprement indiqué : `enabled:true` doit être accompagné de `independentProjectConfirmed:true` et de `controlProjectRef` égal au sous-domaine du projet distinct `.supabase.co`. Une URL avec identifiants, paramètres, fragment, chemin secondaire, protocole non HTTPS ou port non standard est refusée. Ces drapeaux ne constituent **pas** une preuve de séparation réelle : ils obligent seulement à passer une vérification explicite avant toute tentative de connexion.

**Clé publique uniquement :** seuls les identifiants modernes `sb_publishable_...` sont acceptés par la configuration du navigateur. Les anciens JWT `eyJ...` sont refusés, car un token de rôle `service_role` peut se présenter sous cette forme sans texte visible `service_role`. Les clés `sb_secret_...`, `service_role` et tous secrets ne doivent jamais apparaître dans les fichiers publics. Le contrôle JavaScript est complémentaire à de vraies règles RLS, OAuth et tests serveur ; ne pas le considérer comme substitut.

Exemple : [`config/cloud.example.json`](../config/cloud.example.json), conservant `enabled:false` et `independentProjectConfirmed:false` par défaut. Ne renseigner la référence d'un futur projet CONTROL indépendant qu'après accord utilisateur, contrôle de son prix et vérification qu'il n'est pas IAgile. Sans ces conditions, le panneau « CONTROL Cloud se prépare » reste le seul parcours autorisé.

**Preuves disponibles :** [CI de configuration et tests de session synthétique](https://github.com/cosscoll/Avancement-Projet/actions/runs/39403753476), 20/20 réussis. Parmi eux, les fonctions `verifiedSession` et `reload` de la vraie application Cloud sont exercées avec deux utilisateurs fictifs : isolation des réponses tardives A→B, déconnexion pendant un chargement, refus d'afficher des erreurs obsolètes de A, et fusion de rafraîchissements simultanés. Ces scénarios restent des **simulations du client**, pas des connexions Supabase avec JWT vérifiés. Le cahier `T-16` est suivi comme preuve partielle uniquement, sans validation complète.

**Blocage P0 maintenu au 23/10 :** le projet Supabase indépendant et les protections RLS sont confirmés, mais **la recette Auth/PostgREST par deux véritables utilisateurs et la synchronisation multi-appareils n'existent pas encore comme preuves acceptées**. Les critères `ACC-01..04`, `T-15/16/21` restent non certifiés ; `config/cloud.json.enabled=false`.
