# Installer CONTROL sur un téléphone — gratuitement

**CONTROL** est une **Progressive Web App (PWA)**, c'est-à-dire un site web installable comme une application. Elle ne nécessite pas de publication sur l'App Store ou le Play Store et n'ajoute aucun abonnement.

Adresse : https://cosscoll.github.io/Avancement-Projet/

## iPhone / iPad (Safari)

1. Ouvrir le lien ci-dessus **dans Safari**. Si le lien s'ouvre dans une autre application, utiliser « Ouvrir dans Safari ».
2. Toucher le bouton **Partager** (carré et flèche vers le haut).
3. Choisir **Sur l'écran d'accueil**, puis **Ajouter**. Selon la version d'iOS/iPadOS, l'option peut se trouver dans la liste à faire défiler.
4. L'icône **CONTROL** apparaît sur l'écran d'accueil. L'ouvrir pour afficher le tableau de bord sans interface de navigateur.

## Android (Chrome)

1. Ouvrir le lien dans **Google Chrome**.
2. Toucher le menu **⋮** et choisir **Installer l'application** ou **Ajouter à l'écran d'accueil**.
3. Confirmer. Un raccourci **CONTROL** avec l'icône du tableau de bord apparaît.
4. Selon le modèle et la version du navigateur, un bouton **Installer l'application** peut également être proposé directement dans le tableau de bord.

## Fonctions et limites

- La navigation mobile, les cinq automatisations suivies, le catalogue de projets et les derniers rapports publics restent disponibles.
- Une fois ouverte en ligne, l'application met en cache son interface et des copies de données **publiques** pour permettre une consultation limitée hors connexion. Le bandeau **Hors connexion** prévient que les données peuvent être anciennes.
- **Sans connexion Internet**, aucune consigne GitHub ne peut être transmise et aucun rapport nouveau ne peut être récupéré.
- Le bouton **Actualiser** recharge les données publiques lorsque la connexion est disponible.
- Les modifications du site sont accessibles automatiquement après déploiement et récupération des ressources, parfois après une réouverture.
- Les consignes privées ne sont **pas encore synchronisées** : le stockage Supabase distinct reste à configurer ; les brouillons locaux et GitHub Issues conservent leurs règles de confidentialité respectives.
- **L'installation PWA ne crée pas de notifications push de sprint**. Les notifications des automatisations passent pour le moment par l'application officielle ChatGPT et ses propres paramètres ; des notifications directes CONTROL nécessiteraient un backend privé et un abonnement push Web valide (non configurés).
- Aucun logiciel acheté, store, frais ni modification d'IAgile Academy.

## Dépannage

- Si l'option d'installation n'est pas visible : vérifier que le site est chargé en **HTTPS** et que l'application est ouverte dans Safari sur iPhone ou Chrome sur Android, puis recharger.
- Si le tableau reste ancien : rouvrir l'application avec connexion Internet, utiliser **Actualiser**, et attendre la prise en compte de la dernière mise à jour GitHub Pages.
- Si des données récentes ne sont pas disponibles hors ligne : elles n'avaient pas été mises en cache lors de la dernière visite en ligne ; ce n'est pas une preuve d'échec du sprint.
- Sur iPhone, l'installation depuis un navigateur autre que Safari peut présenter un menu différent selon la version d'iOS.

**Vérification requise :** la présence des fichiers PWA dans GitHub et la syntaxe du code peuvent être contrôlées à distance. L'installation et le comportement exact sur l'appareil doivent être validés lors d'un essai réel sur iOS ou Android.
