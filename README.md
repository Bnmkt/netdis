# NetDis

 _Tracker de perturbation réseau_

NetDis est un programme de traçabilité de perturbation réseau simple qui envoie des requêtes de façon ponctuelle à un ou plusieurs hôtes définis.

## Tables des matières
  - [Fonctionnalités](#fonctionnalits)
  - [Utilisations](#utilisation)
    - [Installation](#etape_1__linstallation)
    - [Connexion](#etape_2__connexion)
    - [Le dashboard](#etape_3__decouverte_du_dashboard)
    - [L'historique](#etape_4__decouverte_de_lhistorique)
      - [Disclaimer](#disclaimer)
    - [Les paramètres](#etape_5__decouverte_des_parametres)
  - [Pour les curieux](#logique_de_compression)

## Fonctionnalités

  - Traçabilité de perturbation à l'aide de Ping.
  - Sauvegarde des données récupérées.
  - Interprétation des données sous forme de graphique et tableaux.
  - Indicateur de perturbations par type, hebdomadaire et journalier.
  - Système de connexion basique

## Utilisation
Installation : Install.bat

Lancement : Start.bat

Fermeture : Stop.bat

GUI : http://127.0.0.1:8422

### Étape 1 : l'installation
Dans un premier temps vous serez invité à lancer le fichier _Install.bat_ en **mode administrateur**.

Le mode administrateur est requis car le programme crée un service dans le **Plannificateur de tâches** qui s'éxecutera au lancement de la session.

### Étape 2 : Connexion

Une fois l'installation terminée, vous vous retrouverez sur cette page ci : http://127.0.0.1:8422/readme

![les 3 bouttons](/assets/md/buttons.png)

Vous avez 3 boutons situé sur la gauche de la fenêtre, le premier vous affichera le tableau de bord, le second l'historique et le dernier vous amènera aux paramètres du site. Dans un premier temps, ces 3 boutons vous redirigerons sur la même page : [La page de connexion](http://127.0.0.1:8422/login)


![Formulaire de connexion](/assets/md/login.png)

Les identifiants par défaut :

**Pseudo :** admin

**Mot de passe :** password

*Attention à la casse !*

### Étape 3 : Découverte du Dashboard

Le Dashboard se compose de 4 panneaux :

- État réseau
- Perturbation hebdomadaire
- Répartition journalière
- Données supplémentaires

#### État réseau

Le panneau d'état réseau est divisé en 2 segment, les deux première ligne indiques des données informative et juste en dessous le graphique d'état réseau. 

![Panneau d'état réseau](/assets/md/real_graph.png)

La première ligne vous indique le dernière hôte cible et la fréquence à laquelle vous allez lui envoyer un ping.

La seconde ligne vous indique sur combien de temps le graph du dessous s'écoule.

Le graphique du dessous est de graphique en barre allant de -5 _(connexion perdue)_ à X _(Ping haut)_

Voici un faux graphique de données avec un exemple de coupure et de temps haut

![Faux graphique avec coupure et temps haut](/assets/md/fake_graph2.png)

#### Les panneau de perturbations

Vous avez deux panneaux de perturbations, l'un est hebdomadaire et l'autre est journalier

![Graphique camembert des perturbation hebdomadaire](/assets/md/round_dash1.png)

##### Perturbations hebdomadaire

Ce graphique en camembert affiche pour l'instant 3 type de valeurs :
- Les coupures (Absence de réponse lors d'un ping)
- Les ping (Valeur supérieures à 100ms)
- Les ping haut (Valeur étant au double des ping classique)


![Graphique camembert des perturbation journalière](/assets/md/round_dash2.png)

##### Perturbations journalière

Ce graphique en camembert affiche 3 type de données en pourcent :
- Le temps journalier sans perturbations
- Le temps journalier avec des ping (haut ou bas sans distinctions)
- le temps journalier avec des coupures

Le pourcentage affiché est celui du temps journalier sans perturbations. La teinte de celui ci vire progressivement vers le rouge, arrivé à 80% celui-ci l'est totalement, montrant un problème dans l'état réel du réseau journalier.

**Attention** les coupures représentes des valeur reçue par le programme, si celui ne tourne pas il n'y a pas de déterction de coupure.

#### Les informations supplémentaires

Ce panneau affiche quelque statistiques pouvant être utile telle que le pourcentage d'utilisation récente pour chaque hôtes ainsi que d'autres données telle que l'uptime, le poid théorique du dossier, les pings élevé enregistré depuis le début, etc...

![panneau d'information supplémentaires](/assets/md/more_stats.png)

### Étape 4 : Découverte de l'historique

#### Disclaimer

Si il y a bien une route intéressante c'est bien celle de l'historique.

Cette page vous affiche simplement tout ce qu'il s'est passé depuis le début de l'éxecution du programme.

Elle est complète mais elle peut surtout être incoyablement lourde à charger... Par exemple en utilisation maximale le programme peut générer 86 400 ligne dans la base de données. Ces données sont regroupée au minimum par minutes. le programme va donc faire une moyenne et retourner 1440 ligne et ceci pour une seule journée. Imaginons que nous voulions récupérer les données d'une année entière ça nous donnée 86 400 * 365 = 31 536 000 / 60 = 525 600. Sans compter que derrière ces données sont triées, modifiée, traitées... et ce "simple" calcul peut prendre plusieurs secondes avant d'être réalisé voir même minutes pour les machines les plus faibles.

Donc soyez vigilant lors du paramètrage de l'historique !

#### Modification de la période

Vous trouverez en haut de la page la période affichée par l'historique.

Le bouton "Modifier" à sa droite vous dirige vers les paramètres.

![Période de l'historique](/assets/md/edit_history.png)

#### Panneaux journalier

L'historique se compose de panneaux journalier affichant pour chacun les données du jour référant.

![Panneau journalier](/assets/md/histoy_crate.png)

Sur le haut du panneau vous y retrouverez :

  - La date
  - Un bouton d'agrandissement _(Met le panneau en pleine page)_
  - Un bouton de téléchargement _(Télécharge le graphique sur l'appareil)_

Vous y retrouverez ensuite un graphique interractif suivit d'un menu rétractable affichant le détail de la journée.

Par défaut celui-ci affiche toutes les entrées du jour. Voyons comment se composent celles-ci.

![Détail journalier complet](/assets/md/history_table_full.png)

Vous y voyez un tableau trié par défaut par heure de début.

**Dans ce tableau il y a :** 

Le type de défaut ; L'heure de début ; L'heure de fin ; La durée ; La moyenne sur la durée ; La valeur haute de la durée.

Chaque type d'entrée peut être triée selon l'un de ces type.

Via les paramètres il est également possible d'exclure les durée inférieur à un certain temps, voici un exemple du même tableau sans les latences (flêche vers le haut) inférieure à 2 minutes.

Vous pouvez y voir 7/18 entrées car les entrées inférieures à 2 minutes n'y sont pas inclues.


![Détail journalier sans les latences inférieure à 2 minutes](/assets/md/history_crate_short.png)


**Attention !** Le pic présent sur ces tableaux est une moyenne de la minute courrante. Par exemple sur les images des (informations supplémentaire)[#les_informations_supplementaires] on m'affiche un ping max de 1093 ms, le pic haut affiché dans le tableau sera forcément inférieur si ce pic n'a duré qu'un instant.

### Étape 5 : Découverte des paramètres

### L'icone de la barre de tâche

## Logique de compression

Une entrée correspond à :
```json
{host:"hostname", value:20, timestamp:1739884672985}
```

On va regrouper les entrées par hôtes similaire et compter les hôtes :
```json
[
   3,
   "google.be",
   "google.com",
   "google.eu",
   [{value:X, timestamp:Y}, ...],
   [{value:X, timestamp:Y}, ...],
   [{value:X, timestamp:Y}, ...]
]
```

Ensuite nous récupérons une autre valeur qui peut se répéter, les valeurs :
```json
[
   3,
   "google.be",
   "google.com",
   "google.eu",
   [
      3,
      24,
      15,
      16,
      [
         739884672985, 739884672988, 739884672995, 739884673002
      ],
      [],
      []
   ],
]
```

Et pour terminer, les timestamps sont toujours affiché dans le même ordre, croissant.
Nous pouvons donc également afficher entièrement uniquement le premier timestamp et pour les autres ne stocker que le rapport avec le précédent.
Voici un exemple d'un segment réel :
```json
[
  3, // N host
  "google.com", 
  "google.eu", 
  "google.be", 
  [ // google.com
    10, // N Val for google.com
    20, 
    16, 
    14, 
    15, 
    17, 
    19, 
    18, 
    22, 
    13, 
    21, 
    [1739882581941, 1029], // 20
    [1739882582934, 1002, 1007, 1021, 979, 927, 1000,1000, 999], // 16
    [1739882583934, 995, 989, 993, 998, 12012, 1002, 1007, 1034, 983, 977, 999, 38021, 999, 997, 1006, 
     993, 998, 1001, 1002, 975, 1002, 14996, 996, 1018, 954, 1016, 1041,962, 999, 1001, 1001], // 14
    [1739884627973, 1007, 19012, 998, 992, 1000, 1000, 1001, 1036, 969, 973, 1000, 1017, 984, 994, 1001, 3032, 990, 1002, 9011, 995], // 15
    [1739884629965, 1140, 999], // 17
    [1739884631973, 1052], // 19
    [1739884670997, 1013], // 18
    [1739884671996], // 22
    [1739884674023, 994, 1010, 1001], // 13
    [1739884742105, 1001, 1011] // 21
  ],
  [ // google.eu
    6, // N Val for google.eu
    13, 
    14, 
    15, 
    16, 
    20, 
    23, 
    [17398846,32986, 8009, 1004, 991, 992, 983], // 13
    [1739884633976, 1037, 967, 997, 997, 1003, 32023, 992, 993, 30005, 995, 1010, 1003, 1004, 998, 1000, 1009, 10017, 1014], // 14
    [1739884636026, 977, 1001, 1005, 987, 12006, 1004, 1011, 13007, 1005, 994, 998, 1004, 999, 998, 999, 1002, 987, 999], // 15
    [1739884686003, 6000, 1009], // 16
    [1739884700008], // 20
    [1739884702012] // 23
  ],
  [ // google.be
    7,  // N Val for google.be
    18, 
    13,
    14, 
    15, 
    16, 
    24, 
    17, 
    [1739884637973], // 18
    [1739884638977, 998, 1008, 1011, 994, 989], // 13
    [1739884640971, 1009, 9991, 1000, 1000, 999, 1000, 1005, 999, 997, 1001, 991, 1013, 1005, 995,1001, 8001, 1000, 1010], // 14
    [1739884641971, 1004, 1003, 992, 1004, 989, 1013], // 15
    [1739884688011, 1009, 1003, 993], // 16
    [1739884693011], // 24
    [1739884695009, 1003, 1007] // 17 
  ]
]
```