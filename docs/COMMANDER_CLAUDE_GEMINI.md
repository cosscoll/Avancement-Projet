# CONTROL — Commander Claude et Gemini et centraliser leurs résultats

**État : 17 octobre 2026.** Cette fonctionnalité a deux niveaux distincts et explicitement affichés dans l'interface.

## 1. Poste de commande installé — UTILISABLE MAINTENANT

CONTROL personnel : `#/control/command` (également sous **Tous les outils**, **Missions IA** et onglet **Plus → Commander mes IA** dans chaque projet). Le poste est intégré à la PWA mobile. La future version CONTROL Cloud utilise la même interface, mais **les comptes Cloud sont volontairement désactivés**.

1. Sélectionner un projet.
2. Écrire une mission et cocher **Claude**, **Gemini** ou les deux.
3. **Préparer les missions** crée de vraies entrées de suivi CONTROL, distinctes par fournisseur, dans le stockage de la version en cours. Cela **n'envoie pas** les consignes aux services externes.
4. **Copier la mission** et **Ouvrir Claude/Gemini** puis coller le prompt dans leur véritable interface.
5. Une fois la réponse obtenue, **Suivre / Résultat** : coller le livrable, indiquer un statut, une URL de preuve et enregistrer.
6. Les deux résultats apparaissent dans deux colonnes du **même projet**, avec date et provenance (saisie manuellement ou, à terme, API vérifiée).

Les missions existantes de Claude/Gemini dans CONTROL apparaissent également dans ce poste. Aucune conversation privée antérieure n'est importée automatiquement.

### Stockage et sécurité

- CONTROL personnel : utilise les missions existantes sous la clé locale `control-command-v1`, avec sauvegarde de résultat et rollback en cas d'erreur de stockage.
- CONTROL Cloud (après ouverture sécurisée) : utilise `control_items` déjà préparée avec RLS par utilisateur et clé étrangère de projet du même propriétaire. Le champ `details` conserve le résultat et son origine ; les écritures utilisent le contrôle de concurrence `updated_at`.
- Le poste de commande ne stocke **pas** de clé API, ne contacte pas automatiquement les fournisseurs et n'envoie aucune donnée vers un tiers.
- Les textes de résultats rapportés manuellement sont signalés comme tels : « Validé par vous » ne signifie pas que la réalité du déploiement ou du test a été vérifiée par un service indépendant.
- Les promesses de synchronisation des historiques des applications Claude/Gemini sont exclues : une conversation via API CONTROL sera distincte des conversations privées dans leurs applications.

## 2. Commande API directe — CODE PRÉPARÉ, DÉSACTIVÉ

Une Edge Function serveur **`control-ai-dispatch`**, non déployée, est préparée sous `supabase/functions/control-ai-dispatch/index.ts`.

Elle n'accepte une mission que si toutes les conditions suivantes sont vraies :

- Projet CONTROL Cloud **indépendant** créé, schéma RLS vérifié et utilisateur authentifié avec JWT vérifié serveur.
- `CONTROL_AI_DISPATCH_ENABLED=true` **ET** `config/cloud.json.aiDispatchEnabled=true` après revue.
- Compte présent dans `CONTROL_AI_APPROVED_USER_IDS` côté serveur.
- Fournisseur autorisé individuellement, via `CONTROL_AI_ALLOW_CLAUDE=true` et/ou `CONTROL_AI_ALLOW_GEMINI=true`, tous deux absents/désactivés par défaut.
- Clés API serveur privées et modèles autorisés via `CONTROL_CLAUDE_API_KEY`, `CONTROL_CLAUDE_MODEL`, `CONTROL_GEMINI_API_KEY`, `CONTROL_GEMINI_MODEL`.
- `CONTROL_AI_DAILY_LIMIT` entier entre 1 et 10, avec **compteur journalier atomique** en base préparé par `supabase/migrations/20261017_control_ai_dispatch.sql`, accessible à la seule clé service_role.
- Mission appartenant à ce même utilisateur (ID UUID, statut **todo**, fournisseur Claude/Gemini, longueur bornée).
- Validation explicite à l'envoi (confirmant la possible consommation facturée).

Après autorisation, la fonction démarre l'appel au fournisseur, puis conserve le résultat sous **l'identité et le projet de l'utilisateur**, avec `origin:'api'`, la date, le modèle et l'état `review` (« À vérifier »). Aucun code GitHub n'est automatiquement modifié ni publié. En cas d'échec, elle signale l'échec sans annoncer de résultat inexistant.

**Cette architecture n'est pas une protection financière absolue** : un plafond d'appels et de tokens ne garantit pas 0 €. Les tarifs et l'éligibilité à l'API gratuite évoluent. Il faudra examiner le solde des comptes, l'usage et définir un seuil budgétaire indépendant du code avant activation publique. La clé API ne doit jamais être saisie dans CONTROL ou mise sur GitHub. Les abonnements ChatGPT, Claude ou Gemini ne fournissent pas nécessairement de crédit API réutilisable.

### Installation future obligatoire

1. Obtenir une autorisation du propriétaire pour un **nouveau projet Supabase CONTROL séparé d'IAgile Academy**, et vérifier son coût réel.
2. Appliquer le schéma `supabase/migrations/20261017_control_saas_v1.sql` **uniquement** à ce nouveau projet, après sauvegarde des originaux.
3. Tester deux utilisateurs distincts (lecture, écriture, suppression, fuite et changement de compte) avec preuves de RLS.
4. Appliquer **ensuite** la migration quota `20261017_control_ai_dispatch.sql` sur CONTROL exclusivement.
5. Configurer et déployer l'Edge Function, la vérification JWT, les secrets côté serveur, l'origine HTTPS et l'allowlist privée, avec **tous les interrupteurs sur OFF pendant les tests**.
6. Vérifier requêtes non autorisées (autre utilisateur, autre projet, statut différent, mission inexistante, clé manquante, limite atteinte, validation absente) et concurrence/doublons.
7. Vérifier un vrai appel sur un **compte et un modèle explicitement approuvés**, uniquement après autorisation des coûts ou garantie du niveau gratuit choisi.
8. Tester délais, erreurs fournisseur, sauvegarde de résultats, remontée dans l'interface et bilan de consommation. Puis seulement lever le drapeau applicatif de lancement pour les comptes autorisés.

## 3. Connexion aux dépôts GitHub — PHASE SUIVANTE

L'API Claude et l'API Gemini **ne possèdent pas l'historique du compte GitHub** et ne peuvent pas modifier ses dépôts via le poste de commande actuel. Une future passerelle GitHub App/OAuth CONTROL pourrait lire des fichiers de projet **autorisés**, en constituer un contexte limité puis les transmettre à Claude/Gemini avec les permissions et budget validés.

La publication automatique serait une opération distincte, jamais une conséquence implicite d'une réponse IA. Définir GitHub comme **source vérifiable** de commits/PR/tests, et CONTROL comme **registre de missions et de résultats**.

## 4. UX/UI

Le poste est dans **Outils** plutôt qu'en ajout d'une cinquième icône permanente. Il ne présente que trois étapes : projet + objectif, destinataires, résultats par fournisseur. Écran mobile à colonne unique ; ordinateur à deux colonnes. Tous les modules anciens sont conservés.

**Aucun nouveau coût, clé API ou projet Supabase n'a été engagé.** Les modifications sont des fichiers GitHub préparés et des fonctionnalités statiques/client exploitables immédiatement dans CONTROL personnel ; les API restent désactivées.
