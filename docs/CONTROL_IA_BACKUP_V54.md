# CONTROL IA — Restauration locale prévisualisée · V54

**22 octobre 2026.** Livrable CONTROL-ACTIONS, sans synchronisation Cloud.

L’import se fait désormais en deux phases : 1) sélectionner puis examiner/déchiffrer une sauvegarde JSON (maximum 4 Mo) **sans modification locale** ; 2) visualiser dans un tableau les quantités des données actuellement enregistrées et celles de la sauvegarde. Les diminutions sont signalées, sans afficher les valeurs privées. Même quantité ne garantit pas même contenu.

Une action séparée et une confirmation explicite sont nécessaires pour remplacer les trois magasins locaux (commande, projets, brouillons d’automatisations). Des snapshots bruts empêchent d’écraser des modifications effectuées par un autre onglet pendant la prévisualisation, même si le nombre d’éléments n’a pas changé. Un rollback tente de restaurer les trois magasins en cas de quota refusé. L’import d’une sauvegarde valide est également autorisé pour réparer un magasin illisible ; le compteur actuel est alors présenté comme incomplet et la copie brute est recommandée.

Le comparateur est strictement local ; aucune action externe n’est lancée et aucune automatisation réactivée. Le cache PWA V54 inclut ce module.

**Contrôles nécessaires :** tests unitaires du comparateur et de la concurrence, Chromium avec fichier de sauvegarde synthétique, CI, déploiement et contrôle de la version publiée. Authentification et synchronisation entre appareils restent non validées.
