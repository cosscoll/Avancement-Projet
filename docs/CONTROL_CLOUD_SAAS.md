# CONTROL Cloud — plateforme multi-utilisateurs (bêta technique)

**Statut au 17 octobre 2026 : code et schéma prêts, INSCRIPTIONS DÉSACTIVÉES.** Ne pas présenter cette préparation comme un service de comptes fonctionnel. Le projet Supabase CONTROL indépendant, ses tests de séparation des utilisateurs, l'activation OAuth et la procédure de suppression de compte ne sont **pas encore réalisés**.

## Fichiers

- `app.html`, `assets/cloud-app.js`, `assets/cloud-app.css` : application mobile responsive, indépendante du CONTROL personnel.
- `config/cloud.json` : verrou de sécurité **`enabled:false`**, sans clé. Tant qu'il reste ainsi, `app.html` affiche « CONTROL Cloud se prépare » et ne propose pas de création de compte.
- `config/cloud.example.json` : exemple de configuration publique (ne jamais ajouter de clé `service_role`).
- `supabase/migrations/20261017_control_saas_v1.sql` : schéma PostgreSQL de six tables avec 22 politiques RLS et clés étrangères empêchant d'associer un élément à un projet d'un autre propriétaire.
- `supabase/functions/control-delete-account/index.ts` : fonction de suppression du compte nécessitant la vérification de l'identité. **Non déployée** et non exposée dans l'application tant que `accountDeletionEnabled` n'est pas explicitement activé.

## Étape nécessaire avant de créer l'infrastructure

Demander à l'utilisateur **dans quelle organisation Supabase** installer CONTROL : la seule organisation accessible actuellement s'appelle « IAgile » (offre Free). Le projet IAgile Academy est actuellement le seul projet présent et **ne doit pas être réutilisé**. Il faut créer un **nouveau projet Supabase exclusivement pour CONTROL**, même s'il se trouve dans une organisation existante.

Avant toute création, consulter le prix réel avec `get_cost`, prévenir l'utilisateur et respecter les éventuelles demandes de confirmation. Ne jamais lancer une ressource facturée ni contourner une limite de projet gratuit.

## Installation contrôlée après validation de l'organisation

1. Créer un nouveau projet Supabase **CONTROL Cloud** dans la région européenne retenue par le propriétaire. Ne jamais migrer le schéma dans la base IAgile existante.
2. Exécuter **une seule fois**, sur le nouveau projet vide uniquement, la migration `supabase/migrations/20261017_control_saas_v1.sql`.
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
