# Installation de Business Control Center — 0 € et séparation d'IAgile

**Statut au 16 octobre 2026 : en attente de la création manuelle d'une organisation Supabase Free.**

## Règles non négociables

- Conserver l'organisation **IAgile** et le projet **IAgile Academy** (`daabfmdlgcwcykevvrcm`) **intacts** : aucune migration, aucune table, aucun nouveau compte, aucune mise à jour, aucune opération de suppression.
- Créer une **DEUXIÈME organisation Supabase** indépendante, nom suggéré **Business Control Center**, abonnement **Free uniquement**.
- Le connecteur Supabase actuellement disponible **ne sait pas créer des organisations**. Ce geste doit être fait par le propriétaire depuis le navigateur.
- Supabase prévoit **deux projets Free actifs au total** par propriétaire/administrateur, même dans deux organisations. L'un est déjà affecté à IAgile. Réserver l'autre au tableau de bord ; ne pas créer de troisième projet.
- En formule Free, les dépassements donnent lieu à des limitations, **pas à une facturation de dépassement**. Ne jamais souscrire un plan payant, installer des add-ons facturés, renseigner une carte de paiement pour ce projet, ni passer en Pro.
- Vérifier le **coût exact 0 € / mois** de la création **dans la nouvelle organisation**, après création de celle-ci et avant de créer le projet.
- Si le devis est différent de **0 €**, interrompre et demander l'accord de l'utilisateur (qui exige zéro frais, donc ne pas créer).
- Une deuxième organisation isole les **ressources et quotas facturés par organisation**, mais il existe une limite de deux projets actifs Free par propriétaire et des contraintes générales de compte ; ne pas affirmer garantie technique absolue contre tout incident externe.

## Étape utilisateur requise

1. Ouvrir [Supabase](https://supabase.com/dashboard/new).
2. Ouvrir le sélecteur d'organisation → **New organization**.
3. Nom : `Business Control Center` ; formule : **Free — 0 €**.
4. **Ne pas créer encore le projet**.
5. Revenir dans la conversation et répondre : « Nouvelle organisation Supabase Free créée ».

## Étapes à exécuter ensuite par l'assistant

1. Lister les organisations et identifier l'ID exact de `Business Control Center` (ne jamais inventer l'ID).
2. Vérifier le plan Free avec `get_organization`.
3. Demander à `get_cost` le prix du nouveau projet **dans cette organisation exacte** ; exiger **0 €**.
4. Créer seulement alors `Business Control Center`, en région Europe proche des données (par ex. `eu-west-3`) avec `create_project`. N'utiliser **aucun moyen de paiement**.
5. Vérifier `ACTIVE_HEALTHY`, l'ID, les URL et clés **publishable seulement** ; ne jamais inscrire de clé secrète/service_role dans GitHub.
6. Inspecter le schéma candidat `database/001_control_schema.sql`, le valider avec des mesures strictes de RLS et de moindre privilège, puis le déployer dans **le nouveau projet uniquement**.
7. Ajouter **le véritable utilisateur propriétaire** dans `control_owners` uniquement à partir d'un utilisateur Auth réellement identifié et après approbation ; ne jamais inventer un UUID.
8. Vérifier accès anonyme refusé, accès du propriétaire permis, et refus entre utilisateurs non autorisés. Tester les instructions, décisions et alertes avant activation.
9. Configurer `config/private.json` avec seulement une URL de projet et sa clé publique, laisser `enabled:false` tant que les tests ne sont pas passés.
10. Ne jamais prétendre que les automatisations peuvent lire des données privées par le simple fait que le navigateur peut s'authentifier : il faut un **canal machine autorisé et sécurisé** avec tests de bout en bout et droits minimaux, sans secret dans les tâches ou le dépôt public.
11. Avant d'annoncer le succès, recontrôler par `get_project` que **IAgile Academy** n'a fait l'objet d'aucune modification de notre part et qu'il reste sain.

## Ressources officielles

- [Billing on Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase) : 2 projets Free entre toutes les organisations du propriétaire.
- [Billing FAQ](https://supabase.com/docs/guides/platform/billing-faq) : règles sur organisations et quotas.
- [Cost Control](https://supabase.com/docs/guides/platform/cost-control) : aucune facturation de dépassement sur Free.

Ce guide n'autorise aucune dépense et ne modifie aucun autre projet.
