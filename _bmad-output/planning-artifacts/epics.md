---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-03-04'
inputDocuments:
  - prd.md
  - architecture.md
---

# Haywire-Foundry - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Haywire-Foundry, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Le système peut s'installer sur FoundryVTT V13 en un clic depuis le hub
FR2: Le système peut se charger sans erreur et enregistrer ses types de documents (Actor Soldier, Item Class, Item Weapon)
FR3: Le système peut afficher ses compendiums dans la sidebar FoundryVTT
FR4: Le joueur peut créer un Actor de type Soldier
FR5: Le joueur peut assigner une classe à un Actor Soldier via drag & drop depuis le compendium
FR6: Le joueur peut voir la fiche de classe interactive avec l'image de la carte originale et les stats
FR7: Le joueur peut modifier les valeurs d'état de son Actor (HP, AP, conditions)
FR8: Le joueur peut équiper et déséquiper des armes sur son Actor
FR9: Le système peut stocker des Items de type Class avec nom, tier, stats et image de carte
FR10: Le système peut stocker des Items de type Weapon avec nom, type, portée, dégâts et modificateurs
FR11: Le joueur peut créer des Items Class et Weapon manuellement
FR12: Le joueur peut glisser des Items depuis les compendiums vers un Actor
FR13: Le joueur peut lancer un jet de D20 depuis la fiche de son Actor
FR14: Le système peut afficher le résultat du jet dans le chat FoundryVTT avec les détails (modificateurs, résultat)
FR15: Le joueur peut effectuer un jet de tir en sélectionnant une arme équipée
FR16: Le système peut appliquer les modificateurs d'arme au jet de combat
FR17: Le système peut fournir un compendium pré-rempli des 30 classes joueur
FR18: Chaque entrée de compendium peut afficher l'image de la carte de classe originale
FR19: Le système peut fournir un compendium des armes du jeu
FR20: Le joueur peut parcourir et rechercher dans les compendiums
FR21: Le joueur peut placer un token Actor Soldier sur une scène FoundryVTT
FR22: Le token peut afficher les informations de base de l'Actor (nom, HP)

### NonFunctional Requirements

NFR1: Les fiches d'Actor doivent s'ouvrir en < 500ms, mesuré via Performance API du navigateur
NFR2: Les jets de D20 doivent s'afficher dans le chat en < 1 seconde, mesuré via Performance API du navigateur
NFR3: Le chargement du système ne doit pas ralentir le démarrage du monde Foundry de plus de 2 secondes, mesuré via console navigateur
NFR4: Les compendiums doivent être navigables en < 200ms par interaction, mesuré via Performance API du navigateur
NFR5: Compatible exclusivement avec FoundryVTT V13
NFR6: Compatible avec le module Dice So Nice (jets 3D)
NFR7: Les compendiums doivent fonctionner avec le système de recherche natif de Foundry
NFR8: Les tokens doivent être compatibles avec Token Drag Measurement (V13)
NFR9: Le système ne doit pas interférer avec les modules Dice So Nice et Token Drag Measurement

### Additional Requirements

- Architecture spécifie une structure manuelle V13 (pas de starter template) — le squelette projet est la première story
- Structure projet : system.json + haywire.mjs + module/ (models, documents, sheets, rolls, helpers) + templates/ + styles/ + packs/ + assets/ + lang/
- TypeDataModels séparés : SoldierModel, ClassModel, WeaponModel (un fichier par modèle)
- Custom Documents : HaywireActor, HaywireItem avec prepareBaseData/prepareDerivedData
- Sheets DocumentSheetV2 : SoldierSheet (ActorSheetV2), ClassSheet, WeaponSheet
- Injection de classe hybride : référence (classId → stats dérivées) + copie (armes par défaut en owned Items)
- Pipeline D20 : classe HaywireRoll encapsulant la Roll API avec template chat dédié
- CSS Layers (@layer haywire) avec préfixe .haywire- pour isolation
- i18n : fichiers lang/en.json et lang/fr.json
- Distribution via system.json + releases GitHub
- Zéro dépendance externe, zéro bundler

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 1 | Installation en un clic |
| FR2 | Epic 1 | Chargement sans erreur, registration types |
| FR3 | Epic 1 | Compendiums dans la sidebar |
| FR4 | Epic 2 | Création Actor Soldier |
| FR5 | Epic 2 | Assignation classe via drag & drop |
| FR6 | Epic 2 | Fiche interactive avec image carte |
| FR7 | Epic 2 | Modification HP, AP, conditions |
| FR8 | Epic 2 | Équiper/déséquiper armes |
| FR9 | Epic 2 | Stockage Item Class |
| FR10 | Epic 2 | Stockage Item Weapon |
| FR11 | Epic 2 | Création manuelle Items |
| FR12 | Epic 2 | Drag Items compendium → Actor |
| FR13 | Epic 3 | Jet D20 depuis la fiche |
| FR14 | Epic 3 | Résultat jet dans le chat |
| FR15 | Epic 3 | Jet de tir avec arme sélectionnée |
| FR16 | Epic 3 | Modificateurs d'arme appliqués |
| FR17 | Epic 4 | Compendium 30 classes |
| FR18 | Epic 4 | Images cartes dans compendiums |
| FR19 | Epic 4 | Compendium armes |
| FR20 | Epic 4 | Navigation/recherche compendiums |
| FR21 | Epic 5 | Token sur scène |
| FR22 | Epic 5 | Infos Actor sur le token |

## Epic List

### Epic 1: Squelette système et fondations
Le système s'installe sur FoundryVTT V13, se charge sans erreur, et enregistre ses types de documents. Le joueur peut voir le système dans Foundry avec les compendiums dans la sidebar.
**FRs couverts:** FR1, FR2, FR3

### Epic 2: Soldats et classes de combat
Le joueur peut créer un Soldier, lui assigner une classe depuis le compendium, et voir sa fiche interactive complète avec l'image de carte, les stats et les armes. Il peut modifier HP/AP/conditions et gérer l'équipement.
**FRs couverts:** FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12

### Epic 3: Combat et jets D20
Le joueur peut lancer des jets de combat D20 depuis sa fiche, avec les modificateurs d'arme appliqués et le résultat affiché dans le chat FoundryVTT.
**FRs couverts:** FR13, FR14, FR15, FR16

### Epic 4: Compendiums et contenu prêt à jouer
Les 30 classes joueur sont disponibles dans les compendiums avec images de cartes originales, plus les armes du jeu. Le joueur parcourt et recherche sans configuration.
**FRs couverts:** FR17, FR18, FR19, FR20

### Epic 5: Tokens et intégration scène
Le joueur peut placer ses Soldiers sur une scène Foundry avec tokens affichant nom et HP.
**FRs couverts:** FR21, FR22

## Epic 1: Squelette système et fondations

Le système s'installe sur FoundryVTT V13, se charge sans erreur, et enregistre ses types de documents. Le joueur peut voir le système dans Foundry avec les compendiums dans la sidebar.

### Story 1.1: Création du squelette projet FoundryVTT V13

As a développeur,
I want créer la structure de fichiers et le manifest system.json du système Haywire,
So that le système s'installe et se charge sur FoundryVTT V13.

**Acceptance Criteria:**

**Given** un serveur FoundryVTT V13 sans le système Haywire installé
**When** le système est installé via le manifest system.json
**Then** FoundryVTT reconnaît "Haywire" comme système disponible
**And** le système se charge sans erreur console (0 erreurs)
**And** les types de documents sont enregistrés (Actor: Soldier, Item: Class, Weapon)
**And** le fichier haywire.mjs exécute le Hooks.once("init") avec les registrations

### Story 1.2: Data models et documents custom

As a développeur,
I want implémenter les TypeDataModels (SoldierModel, ClassModel, WeaponModel) et les documents custom (HaywireActor, HaywireItem),
So that le système dispose de la couche de données structurée pour les Soldiers, Classes et Armes.

**Acceptance Criteria:**

**Given** le squelette projet de la Story 1.1 chargé
**When** un Actor Soldier est créé via l'UI Foundry
**Then** l'Actor possède les champs du SoldierModel (hitPoints, actionPoints, classId, conditions)
**And** un Item Class créé possède les champs du ClassModel (name, tier, stats, imagePath, defaultWeapons)
**And** un Item Weapon créé possède les champs du WeaponModel (name, type, range, damage, modifiers)
**And** les valeurs initiales par défaut sont correctement appliquées
**And** prepareBaseData et prepareDerivedData s'exécutent sans erreur

### Story 1.3: Compendiums vides et i18n

As a joueur,
I want voir les compendiums Haywire dans la sidebar FoundryVTT,
So that je sais que le système est prêt et que les compendiums seront disponibles.

**Acceptance Criteria:**

**Given** le système Haywire chargé dans un monde FoundryVTT
**When** le joueur ouvre la sidebar Compendiums
**Then** les compendiums "Classes" et "Armes" apparaissent dans la liste
**And** les fichiers lang/en.json et lang/fr.json sont chargés
**And** les labels des compendiums sont traduits selon la langue du client
**And** le chargement du système ne ralentit pas le démarrage de plus de 2 secondes (NFR3)

## Epic 2: Soldats et classes de combat

Le joueur peut créer un Soldier, lui assigner une classe depuis le compendium, et voir sa fiche interactive complète avec l'image de carte, les stats et les armes. Il peut modifier HP/AP/conditions et gérer l'équipement.

### Story 2.1: Fiche Soldier basique avec template

As a joueur,
I want créer un Actor Soldier et voir sa fiche avec les informations de base,
So that je puisse visualiser et gérer mon soldat.

**Acceptance Criteria:**

**Given** un monde Haywire chargé
**When** le joueur crée un Actor de type Soldier
**Then** la SoldierSheet s'ouvre avec le template soldier-sheet.hbs
**And** la fiche affiche les champs HP, AP, conditions (modifiables)
**And** la fiche affiche une zone pour l'image de carte (placeholder si pas de classe)
**And** la fiche affiche la liste des armes équipées (vide initialement)
**And** la fiche s'ouvre en < 500ms (NFR1)
**And** le CSS utilise @layer haywire avec préfixes .haywire-

### Story 2.2: Fiches Item Class et Weapon

As a joueur,
I want créer et éditer des Items Class et Weapon avec leurs fiches dédiées,
So that je puisse gérer les classes et armes du jeu.

**Acceptance Criteria:**

**Given** un monde Haywire chargé
**When** le joueur crée un Item de type Class
**Then** la ClassSheet s'affiche avec les champs : nom, tier, stats, image de carte, armes par défaut
**And** tous les champs sont éditables et sauvegardés

**Given** un monde Haywire chargé
**When** le joueur crée un Item de type Weapon
**Then** la WeaponSheet s'affiche avec les champs : nom, type (Primary/Secondary/Sidearm), portée, dégâts, modificateurs
**And** tous les champs sont éditables et sauvegardés

### Story 2.3: Injection de classe via drag & drop

As a joueur,
I want assigner une classe à mon Soldier en glissant un Item Class sur sa fiche,
So that mon soldat hérite des stats et armes de sa classe.

**Acceptance Criteria:**

**Given** un Actor Soldier ouvert et un Item Class dans un compendium ou la sidebar
**When** le joueur drag & drop l'Item Class sur la fiche Soldier
**Then** le classId est stocké dans l'Actor
**And** les stats de base (HP max, AP, tier) sont dérivées depuis la classe dans prepareDerivedData
**And** l'image de la carte de classe s'affiche sur la fiche Soldier
**And** les armes par défaut de la classe sont copiées comme owned Items sur l'Actor
**And** une notification confirme l'assignation de classe

**Given** un Actor Soldier avec une classe déjà assignée
**When** le joueur drop une nouvelle classe
**Then** l'ancienne classe est remplacée
**And** les armes par défaut sont mises à jour

**Given** un joueur qui drop un Item Weapon (pas Class) sur la fiche
**When** le drop est traité
**Then** l'Item Weapon est ajouté comme owned Item (arme équipée)
**And** aucune injection de classe ne se produit

### Story 2.4: Gestion de l'équipement et des états

As a joueur,
I want modifier les HP, AP, conditions de mon Soldier et gérer ses armes équipées,
So that je puisse suivre l'état de mon soldat pendant la partie.

**Acceptance Criteria:**

**Given** un Actor Soldier avec une classe assignée et des armes
**When** le joueur modifie HP ou AP depuis la fiche
**Then** les valeurs sont sauvegardées immédiatement
**And** les valeurs respectent les bornes (HP ≥ 0, AP ≥ 0)

**Given** un Actor Soldier avec des armes équipées
**When** le joueur supprime une arme de la fiche
**Then** l'owned Item Weapon est supprimé de l'Actor

**Given** un joueur qui glisse un Item Weapon depuis un compendium
**When** le drop est traité sur la fiche Soldier
**Then** l'arme est ajoutée aux owned Items de l'Actor

## Epic 3: Combat et jets D20

Le joueur peut lancer des jets de combat D20 depuis sa fiche, avec les modificateurs d'arme appliqués et le résultat affiché dans le chat FoundryVTT.

### Story 3.1: Jet D20 basique depuis la fiche

As a joueur,
I want lancer un jet de D20 depuis la fiche de mon Soldier,
So that je puisse résoudre les actions de combat.

**Acceptance Criteria:**

**Given** un Actor Soldier avec une classe assignée
**When** le joueur clique sur le bouton de jet D20 de la fiche
**Then** la classe HaywireRoll construit la formule "1d20"
**And** le résultat s'affiche dans le chat FoundryVTT via le template roll-result.hbs
**And** le message de chat montre le résultat du dé et le nom du Soldier
**And** le jet est affiché en < 1 seconde (NFR2)
**And** le jet est compatible avec Dice So Nice si le module est installé (NFR6)

### Story 3.2: Jet de tir avec modificateurs d'arme

As a joueur,
I want effectuer un jet de tir en sélectionnant une arme équipée avec ses modificateurs appliqués,
So that le résultat du combat reflète les capacités de mon arme.

**Acceptance Criteria:**

**Given** un Actor Soldier avec des armes équipées
**When** le joueur sélectionne une arme et lance un jet de tir
**Then** HaywireRoll construit la formule "1d20 + modificateurs de l'arme"
**And** le message de chat affiche : nom de l'arme, modificateurs appliqués, formule, résultat
**And** le template roll-result.hbs affiche le contexte complet du jet

**Given** un Actor Soldier sans arme équipée
**When** le joueur tente un jet de tir
**Then** une notification d'avertissement s'affiche ("Aucune arme équipée")

## Epic 4: Compendiums et contenu prêt à jouer

Les 30 classes joueur sont disponibles dans les compendiums avec images de cartes originales, plus les armes du jeu. Le joueur parcourt et recherche sans configuration.

### Story 4.1: Compendium des 30 classes joueur avec images

As a joueur,
I want parcourir un compendium pré-rempli des 30 classes joueur avec les images des cartes originales,
So that je puisse choisir et assigner des classes à mes Soldiers sans configuration.

**Acceptance Criteria:**

**Given** le système Haywire chargé
**When** le joueur ouvre le compendium "Classes"
**Then** 30 entrées de classes sont listées avec leurs noms
**And** chaque entrée affiche l'image de la carte de classe originale (JPG depuis assets/cards/)
**And** le joueur peut ouvrir la fiche d'une classe pour voir ses stats complètes
**And** le joueur peut drag & drop une classe depuis le compendium vers un Actor
**And** la navigation dans le compendium est < 200ms par interaction (NFR4)

### Story 4.2: Compendium des armes et recherche

As a joueur,
I want parcourir un compendium des armes et rechercher dans tous les compendiums,
So that je puisse trouver rapidement les éléments dont j'ai besoin.

**Acceptance Criteria:**

**Given** le système Haywire chargé
**When** le joueur ouvre le compendium "Armes"
**Then** les armes du jeu sont listées avec leurs propriétés (type, portée, dégâts)

**Given** les compendiums Classes et Armes chargés
**When** le joueur utilise la barre de recherche native Foundry
**Then** les résultats filtrent correctement les entrées par nom (NFR7)

## Epic 5: Tokens et intégration scène

Le joueur peut placer ses Soldiers sur une scène Foundry avec tokens affichant nom et HP.

### Story 5.1: Token Soldier sur scène

As a joueur,
I want placer mes Soldiers sur une scène Foundry avec des tokens affichant nom et HP,
So that je puisse visualiser le champ de bataille et suivre mes unités.

**Acceptance Criteria:**

**Given** un Actor Soldier avec une classe assignée et une scène Foundry ouverte
**When** le joueur glisse l'Actor sur la scène
**Then** un token est placé avec l'image de l'Actor
**And** le nom du Soldier est affiché au-dessus du token
**And** la barre de HP est visible sur le token (primaryTokenAttribute configuré)
**And** les modifications de HP depuis la fiche sont reflétées sur le token en temps réel
**And** le token est compatible avec Token Drag Measurement (NFR8)
**And** le système n'interfère pas avec Dice So Nice ni Token Drag Measurement (NFR9)
