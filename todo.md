# Classes
[x] les skills ne sont pas implémentées
    [x] lister les skills et faire le compedium avec. Prendre les images de classes pour faire les skills. Si elle existe déjà ne pas la faire.
    [x] ajouter les skills aux classes par des liens UUID.

# OPFOR
[x] créer les OPPFOR.
    [x] créer les compendiums
        [x] Units
        [x] threat level et reinforcement
    [x] créer les différentes actorsheet image
    [x] créer les différentes actorsheet modif
    [x] la taille de la sheet n'est pas bonne
    [x] actorsheet modifiable avec skills et équipements
    [x] créer leurs tables de threath level et reinforcement
    [x] ajouter un bouton pour switcher entre la carte et la feuille.
    [x] rendre les behavior éditable
    [x] lock la fiche contre les modif
    [x] ajout de faction dans la carte
    [x] les conditions ne fonctionnent pas
    [x] Overlay du support OPFOR
        [x] liaison à la carte support
        [x] importation des 3 cartes automatiquement

# Actorsheet
[x] une fois une classe drag and drop dans l'actorsheet, pouvoir supprimer et modifier l'équipement sans modifier la classe dans item.
[x] pouvoir drag and drop directement du compendium dans l'arctorsheet.
[x] Persistance des états sur l'actor.
[x] Modifier le token dans l'actorsheet. Par défaut, c'est celui de la classe mais on pourrait vouloir le personnaliser.
[x] Compatibilité avec tokenizer.
[x] lock la fiche contre les modif
[x] Unlock par défaut
[x] ajouter le support au actorsheet
[-] **Retransformer les classes en simple actor configurable**

# Token
[x] conditions rondes mais carré autour quand posé.
[x] afficher les AP
[x] impossible de supprimer la condition injured, seulement l'ajout de HP le permet. Faire en sorte que la condition injured puisse être retirée et ajouter dans ce cas 1HP.
[x] bug overlay si token effacé, il s'affiche toujours

# Compendiums
[x] Compendiums : le bouton import ne fonctionne pas
## Classes
[x] le compendium de classe doit être trier par tier
[x] créer les groupes d'intervention. Composé de plusieurs classes se sont des équipes prêtent à l'action.
## Gestion des véhicules
[-] Implémenter le compendium de véhicules
## Support
[x] Faire un compendium drag-and-drop des cartes supports

# Combat
[-] Déterminer les actions de combat
    [-] joueurs
    [-] OPPFOR
[-] faire l'affichage en overlay de l'actorsheet de l'actor dont c'est le tour pour déclencher ses actions.

# Gestion des Unités
[x] Faire une sheet pour les unités et y mettre les UUID des classes
[x] importé l'unités, créait un répertoire dans Actor avec le nom de l'unité et les différents actor avec des classes.
    [x] Les actors importés ont tous 1HP sur 1
[x] faire un pack de carte support et retirer du pack deck
[x] les cartes support dans l'unit ne sont pas en paysage (css global du type de carte résolu lorsque overlay à été fait)
[x] faire un overlay des classes
[x] faire un overlay des cartes support sans clic
[x] Lorsqu'une unité est déployé, l'actor team leader ou squad leader ont l'UUID des cartes support de l'unité. Ces cartes supports seront importéés dans l'overlay.

# System
[x] mettre une image sur le système 
[P] setting :
    [P] afficher la fiche de soldier type founcdry ou juste l'image - un paramètre pour soldier et un autre pour opfor.
        [x] les sheet affichent unitairement html ou carte
        [-] refaire les settings globaux
        [-] faire un setting uniquement pour le type de fiche sur l'overlay
    [-] overlay on/off
    [P] configuration du répertoire d'importation pour tous les types :
        [-] soldier
        [x] Units
        [–] opfor
        [-] skill
        [-] weapons
[x] gestion des decks aléatoire :
    [x] créer les decks et l'affichage.
    [x] trouver un moyen de faire automatiquement. 
[-] **Avoir un bouton de reset de game**
    - déterminer les actions
## OVerlay
[x] faire disparaitre les overlay
[-] faire des types opfor, player support, infil et opération pour ne pas drag les items des autres.
### Overlay support
[x] Overlay support
    [x] importation d'unité
    [x] drag-and-drop de carte support
    [x] Gestion de l'activation
    [x] Gestion de l'unité et du leader
        [x] leader downed plus de support
        [x] comment faire en cas d'importation où d'utilisation pour ne pas faire l'import de l'unité à chaque fois ?
            - liaison avec le leader ?
        [x] indiquer le nombre utilisable et non utilisable
        [x] lié le opfor support au leader opfor
### Overlay FOG
[x] Overlay FOG
### Overlay Infil
[x] Overlay Infil
### Overlay Operation
[x] Overlay Infil


# Mécanisme de jeu
[-] Implémenter les mécanismes de jeu
