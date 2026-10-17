# CONTROL — Visios et rendez-vous internes et clients

**Version ajoutée : 17 octobre 2026.**
Page personnelle : `#/control/meetings`.
Navigation : **Outils → Organiser → Visios et rendez-vous** ; également depuis **Plus → Visios** dans chaque projet et depuis **Calendrier**.

## Fonctionnalités utilisables maintenant

- Créer une fiche de rendez-vous **équipe interne** ou **clients/prospects** avec sujet, projet, date, durée et fournisseur.
- **Google Meet**, **Zoom** ou **Microsoft Teams** : ouvrir la page officielle du fournisseur, y créer la réunion, **coller son vrai lien d'invitation** dans CONTROL et enregistrer la fiche. CONTROL ne possède pas d'autorisation de créer des réunions chez ces fournisseurs à l'insu du compte.
- **Inviter** : utiliser le partage natif du téléphone ou copier le texte de l'invitation, comprenant le lien et la date ; l'envoi est effectué explicitement par l'utilisateur.
- **Agenda** : ouvrir un formulaire Google Agenda *prérempli*, à vérifier puis enregistrer par l'utilisateur ; aucun événement Google n'est automatiquement créé.
- **.ics** : télécharger un événement compatible avec les calendriers courants pour import manuel.
- **Rejoindre** : ouvrir le vrai lien visio dans son service officiel.
- **Compte rendu et notes** dans CONTROL, sans audio ni vidéo enregistré.
- Filtre équipe / client, rendez-vous futurs visibles en priorité, anciens rendez-vous repliés pour préserver une interface sobre.
- Les prochaines visios sont visibles dans l'agenda interne CONTROL personnel. Les fiches locales sont incluses dans l'export existant `control-command-v1` et donc dans la sauvegarde CONTROL.

### Visio dans CONTROL : mode test Jitsi

Un mode **« Jitsi (test) »** est proposé **pour des essais techniques internes uniquement**, avec génération d'une salle utilisant `crypto.getRandomValues` et ouverture d'un lecteur vidéo directement dans la page, **seulement après une action explicite** de l'utilisateur. Le script `https://meet.jit.si/external_api.js` n'est chargé qu'au clic ; on peut fermer le module, et son iframe est détruite lorsque le panneau est quitté.

**Restriction officielle importante** : Jitsi précise que la plateforme publique `meet.jit.si` peut être utilisée pour tester l'intégration, **mais n'est pas destinée aux applications en production**. Pour des visios clients/prospects réelles, CONTROL exige un lien Meet, Zoom ou Teams créé chez le fournisseur. Pour offrir ultérieurement une véritable salle intégrée en production sous marque CONTROL, il faudra déployer son propre serveur Jitsi ou souscrire une solution Jitsi as a Service, avec authentification, contrôle d'accès, consentements et budget explicite.

Documentation officielle :
- https://jitsi.org/api/
- https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/
- https://jitsi.org/security/
- https://jitsi.org/meet-jit-si-privacy/
- https://support.google.com/meet/answer/17302648?hl=fr-FR
- https://support.zoom.com/hc/fr/article?id=zm_kb&sysparm_article=KB0063703
- https://support.microsoft.com/fr-fr/teams/meetings/join-a-meeting-in-microsoft-teams

## Confidentialité

Le code source et le dépôt GitHub public ne contiennent aucun lien client ou titre de rendez-vous réel.

**Version personnelle :** les données du rendez-vous (dont le lien de réunion et les éventuelles notes) restent dans le stockage local `control-command-v1` du navigateur ; **elles ne sont pas chiffrées au repos par le navigateur**. Utiliser une exportation CONTROL chiffrée par mot de passe pour les sauvegarder. Le lien est sensible : quiconque l'obtient pourrait tenter de rejoindre selon les permissions du fournisseur. Ne pas intégrer d'informations personnelles non nécessaires dans le titre ou la note. Il n'y a pas d'invitation automatique à un tiers.

**CONTROL Cloud, future version :** les rendez-vous seraient stockés dans `control_items` avec `kind='event'` et `details.controlVisio=true`, associés à `owner_id` et au `project_id` autorisé ; RLS et vérification de propriété sur modification/suppression. Cloud reste non activé : `config/cloud.json.enabled=false`. **Aucune ouverture publique de compte, aucune synchronisation multi-utilisateur ni visibilité partagée d'équipe n'est opérationnelle à ce stade.**

Les flux caméra/audio, les fonctionnalités de salle d'attente, les enregistrements et les obligations contractuelles dépendent du fournisseur de vidéo. CONTROL ne doit pas prétendre fournir du chiffrement vidéo de bout en bout, une prise de rendez-vous publique, l'envoi d'e-mails automatiques ou une authentification de participants à ce stade.

## Livrables techniques

- `assets/visio-center.js` : module public UI, validation de liens officiels, invitation, agenda, ICS, Jitsi embarqué sur demande.
- `assets/visio-center.css` : interface responsive, hiérarchie visuelle claire.
- `assets/command-center.js`, `index.html` : stockage local, agenda, accès projets et Outils.
- `assets/cloud-app.js`, `app.html` : préparation des fiches privées dans Cloud non ouvert.
- `assets/control-help.js`, `data/help-center.json` : aide conversationnelle dédiée.
- `service-worker.js` : nouvelle version du cache Android PWA.
- `tests/visio-center.test.mjs` : tests de liens, format ICS, sécurité et routage.

## Vérifications et étapes futures

Les contrôles de syntaxe, des liens des fournisseurs et de la génération ICS peuvent s'exécuter sans API ni achats. **La vidéo Jitsi doit être vérifiée dans un vrai navigateur mobile**, avec permissions caméra/micro explicitement accordées, navigateur HTTPS, et éventuellement connexion hôte Jitsi. **Les visios Google/Zoom/Teams doivent être testées avec de vrais liens créés par l'utilisateur**.

Évolutions ultérieures : connexion Google Agenda / Microsoft 365 autorisée par utilisateur, disponibilité réelle, réservation de créneaux publics pour prospects, confirmation automatique par e-mail seulement après consentement, authentification multi-utilisateur et partage par rôle, salles d'attente et intégration de visioconférence commerciale hébergée correctement.

Aucun abonnement, hébergement vidéo payant ou compte client externe n'a été créé.
