# Classes
[x] les skills ne sont pas implémentées
    [x] lister les skills et faire le compedium avec. Prendre les images de classes pour faire les skills. Si elle existe déjà ne pas la faire.
    [x] ajouter les skills aux classes par des liens UUID.

# OPFOR
[P] créer les OPPFOR.
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

# Actorsheet
[x] une fois une classe drag and drop dans l'actorsheet, pouvoir supprimer et modifier l'équipement sans modifier la classe dans item.
[x] pouvoir drag and drop directement du compendium dans l'arctorsheet.
[x] Persistance des états sur l'actor.
[x] Modifier le token dans l'actorsheet. Par défaut, c'est celui de la classe mais on pourrait vouloir le personnaliser.
[x] Compatibilité avec tokenizer.
[x] lock la fiche contre les modif
[-] Unlock par défaut

# Token
[x] conditions rondes mais carré autour quand posé.
[x] afficher les AP
[x] impossible de supprimer la condition injured, seulement l'ajout de HP le permet. Faire en sorte que la condition injured puisse être retirée et ajouter dans ce cas 1HP.

# Compendiums
[x] Compendiums : le bouton import ne fonctionne pas
## Classes
[x] le compendium de classe doit être trier par tier
[x] créer les groupes d'intervention. Composé de plusieurs classes se sont des équipes prêtent à l'action.
## Weapons
[?] Weapons/equipements : supprimer les doublons.
## Gestion des véhicules
[-] Implémenter le compendium de véhicules

# Combat
[-] Déterminer les actions de combat
    [-] joueurs
    [-] OPPFOR
[-] faire l'affichage en overlay de l'actorsheet de l'actor dont c'est le tour pour déclencher ses actions.

# Gestion des Unités
[x] Faire une sheet pour les unités et y mettre les UUID des classes
[x] importé l'unités, créait un répertoire dans Actor avec le nom de l'unité et les différents actor avec des classes.
    [x] Les actors importés ont tous 1HP sur 1
[-] faire un pack de carte support et retirer du pack deck

# System
[x] mettre une image sur le système 
[P] setting :
    [P] afficher la fiche de soldier type founcdry ou juste l'image - un paramètre pour soldier et un autre pour opfor.
        [x] les sheet affichent unitairement html ou carte
        [-] refaire les settings globaux
        [-] faire un setting uniquement pour le type de fiche sur l'overlay
    [-] overlay on/off
    [-] configuration du répertoire d'importation pour tous les types :
        [-] soldier
        [–] opfor
        [-] skill
        [-] weapons
[P] gestion des decks :
    [x] créer les decks et l'affichage.
    [-] trouver un moyen de faire automatiquement. 
[-] Overlay support
[-] Overlay FOG

# Mécanisme de jeu
[-] Implémenter les mécanismes de jeu
