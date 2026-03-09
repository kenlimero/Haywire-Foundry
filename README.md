# HAYWIRE V2 - FoundryVTT System

![Foundry V13](https://img.shields.io/badge/FoundryVTT-V13-green)
![Version](https://img.shields.io/badge/version-0.10.10-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

> [Version francaise ci-dessous](#fr---haywire-v2---systeme-foundryvtt)

---

# EN - HAYWIRE V2 - FoundryVTT System

A complete FoundryVTT V13 system for the **HAYWIRE V2** tactical solo/cooperative wargame. Command your special operations team, manage threats, and play through dynamic scenarios with card-driven mechanics.

## Table of Contents

- [Installation](#installation)
- [Actors](#actors)
- [Items](#items)
- [Card Decks](#card-decks)
- [Combat & Rolls](#combat--rolls)
- [Token & Conditions](#token--conditions)
- [UI Overlays](#ui-overlays)
- [Compendiums](#compendiums)
- [Unit Deployment](#unit-deployment)

## Installation

1. In FoundryVTT, go to **Game Systems** > **Install System**
2. Paste the manifest URL:
   ```
   https://raw.githubusercontent.com/kenlimero/Haywire-Foundry/main/system.json
   ```
3. Click **Install**

## Actors

### Soldier

- Full character sheet with **Hit Points**, **Action Points** (derived from HP), and **Suppression** tracking (0-6 scale)
- Assign a **Class** via drag-and-drop from compendium, inheriting default weapons, skills, and combat stats
- Manage **Weapons**, **Skills**, and **Support Cards** independently from class defaults using an exclusion system
- **Card View** toggle: switch between a full-size class card image and the detailed stat sheet
- **Lock/Unlock** mechanism to prevent accidental edits during gameplay
- **Combat statistics** tracking (easy/medium/hard casualties)
- Compatible with **Tokenizer** for custom portraits
- Automatic **condition management**: HP changes sync with injured/downed states

### OPFOR Unit

- Automated enemy units with independent **combat stats** (easy/medium/hard thresholds)
- **Faction** assignment (Cartel, Insurgents, Russians, etc.)
- Editable **Behavior** field for AI tactical instructions
- **OPFOR-specific skills** and shared weapon system
- Same Card View / Sheet View toggle and lock system as soldiers
- Full condition and suppression tracking

## Items

| Type | Description |
|------|-------------|
| **Class** | 30 player classes across 3 tiers with combat stats, default weapons, and skills |
| **Weapon** | 23 weapons (Primary, Secondary, Sidearm, Equipment) with range, rate of fire, penetration, and modifiers |
| **Skill** | 40 player skills with HTML descriptions |
| **OPFOR Skill** | Enemy-specific abilities linked to OPFOR units |
| **Unit** | Team templates (tier 1-2) with pre-configured class and support card compositions |
| **Support** | 16 player support action cards (Artillery, Medevac, Smoke Screen, etc.) |

## Card Decks

Four card decks drive the game's dynamic events:

| Deck | Cards | Description |
|------|-------|-------------|
| **Support** | 16 | Player support actions (Artillery Barrage, Covering Fire, Medevac, Mortar Strike, Smoke Screen...) |
| **Operations** | 30 | Mission objectives and scenario cards |
| **Infiltration** | 30 | Beer-themed callsign cards for soldier identification |
| **Fog of War** | 30 | Random event cards (Ambush, IED, Civilians, Comms Blackout, Contact Front...) |

- Each deck has custom **back cover** artwork
- Cards can be **dealt**, **drawn**, **played**, and **shuffled** using FoundryVTT's card system
- Card draws are posted to **chat** with image preview
- Click any card image to open a full-size **ImagePopout** viewer

## Combat & Rolls

- **D20 Roll**: Basic 1d20 roll posted to chat with flavor text
- **Shoot Roll**: 1d20 + weapon modifiers, displaying:
  - Die result, modifier, and total
  - Combat thresholds comparison (easy/medium/hard) from the soldier's class or OPFOR unit
- Formatted chat messages with dedicated roll template
- **Dice So Nice** compatible

## Token & Conditions

- **9 custom status effects** replacing Foundry defaults:
  - Core conditions: Downed, Hidden, Injured, Overwatch
  - Suppression levels: sup-1 through sup-6 (visual markers on token)
- **Automatic condition sync**: changes on sheet reflect on token and vice versa
- **Wound track**: Max HP > Injured (1 HP) > Downed (0 HP) with automatic transitions
- **Suppression pipeline**: 3+ = Suppressed, 6 = Pinned (with AP penalties: -1 / -2)
- **Token bars**: Soldiers show Action Points + Hit Points; OPFOR shows Suppression
- Status effect icons rendered as **clean circles** (custom styling removes default squares)

## UI Overlays

### Threat Level Beacon

- Fixed beacon at **top-center** of the screen with 3D rotating light effect
- Displays current **threat level** (0-9) with color-coded severity:
  - 0 = Inactive | 1-3 = Low (green) | 4-6 = Medium (yellow/orange) | 7-9 = High (red)
- **Alert state** with pulsing red glow
- GM controls: +/- buttons to adjust threat level, alert toggle
- Hover card shows threat description and linked OPFOR tables

### Token Overlay

- Hover over any token to see a **preview panel**:
  - **Card View**: Full-size class/unit card image
  - **Sheet View**: Compact stats (HP, AP, weapons table, skills, combat thresholds, conditions)
- Auto-hides when cursor leaves, handles deleted tokens gracefully

### Player Support Overlay

- Left-side panel with **thumbnail badge** showing active card count
- Hover to expand a **card grid** with all available support cards
- **Activate** button: removes card and posts to chat
- **Leader link**: cards tied to team leaders; if leader is downed, cards are grayed out with skull indicator
- Auto-imports support cards when a soldier with assigned supports is placed on the map

### OPFOR Support Overlay

- OPFOR support cards activatable only when **specific conditions are met**:
  1. Threat alert must be **active**
  2. An OPFOR leader unit (Squad Commander, Cell Leader, or unit with Support skill) must be **on the map**
  3. The leader must **not be downed**
- Red border warning when conditions are unmet
- Drag-and-drop support cards from OPFOR Support compendium

## Compendiums

11 compendium packs organized in folders:

| Pack | Type | Content |
|------|------|---------|
| Player Classes | Item | 30 classes (Tier 1-3): Assault, Sniper, Breacher, Advisor, Gunner, Recon... |
| Weapons | Item | 23 weapons: Assault Rifles, SMGs, Shotguns, Sniper Rifles, Pistols, Equipment |
| Player Skills | Item | 40 player skills |
| Player Units | Item | Pre-built team compositions ready to deploy |
| Player Support | Item | 16 support action cards |
| OPFOR Units | Actor | Pre-configured enemy units by faction |
| OPFOR Tables | RollTable | Threat-level encounter tables for 3 factions (Cartel, Insurgents, Russians) with 9 threat levels each |
| OPFOR Support | Item | OPFOR support actions |
| OPFOR Skills | Item | Enemy-specific abilities |
| Decks | Cards | 4 card decks (Support, Operations, Infiltration, Fog of War) |

## Unit Deployment

- **Unit templates** contain pre-configured class compositions and support card assignments
- Click **Deploy Unit** to automatically create all soldier actors in a dedicated folder
- Each deployed soldier inherits their class's weapons, skills, and combat stats
- Support cards are assigned to team leaders and imported into the Support Overlay
- Drag-and-drop from the Player Units compendium

---

# FR - HAYWIRE V2 - Systeme FoundryVTT

Un systeme FoundryVTT V13 complet pour le wargame tactique solo/cooperatif **HAYWIRE V2**. Commandez votre equipe d'operations speciales, gerez les menaces et jouez des scenarios dynamiques avec des mecaniques basees sur les cartes.

## Sommaire

- [Installation](#installation-1)
- [Acteurs](#acteurs)
- [Objets](#objets)
- [Paquets de Cartes](#paquets-de-cartes)
- [Combat & Jets](#combat--jets)
- [Token & Conditions](#token--conditions-1)
- [Surcouches d'Interface](#surcouches-dinterface)
- [Compendiums](#compendiums-1)
- [Deploiement d'Unites](#deploiement-dunites)

## Installation

1. Dans FoundryVTT, allez dans **Systemes de jeu** > **Installer un systeme**
2. Collez l'URL du manifeste :
   ```
   https://raw.githubusercontent.com/kenlimero/Haywire-Foundry/main/system.json
   ```
3. Cliquez sur **Installer**

## Acteurs

### Soldat

- Fiche de personnage complete avec **Points de Vie**, **Points d'Action** (derives des PV), et suivi de la **Suppression** (echelle 0-6)
- Assignation de **Classe** par glisser-deposer depuis le compendium, heritant des armes, competences et stats de combat par defaut
- Gestion des **Armes**, **Competences** et **Cartes de Soutien** independamment des valeurs par defaut de la classe via un systeme d'exclusion
- Bascule **Vue Carte** : alternez entre l'image de la carte de classe en plein ecran et la fiche de stats detaillee
- Mecanisme de **Verrouillage** pour eviter les modifications accidentelles en cours de partie
- Suivi des **statistiques de combat** (pertes facile/moyen/difficile)
- Compatible avec **Tokenizer** pour les portraits personnalises
- Gestion automatique des **conditions** : les changements de PV synchronisent les etats blesse/a terre

### Unite OPFOR

- Unites ennemies automatisees avec des **stats de combat** independantes (seuils facile/moyen/difficile)
- Assignation de **Faction** (Cartel, Insurges, Russes, etc.)
- Champ **Comportement** editable pour les instructions tactiques de l'IA
- **Competences specifiques OPFOR** et systeme d'armes partage
- Meme bascule Vue Carte / Vue Fiche et systeme de verrouillage que les soldats
- Suivi complet des conditions et de la suppression

## Objets

| Type | Description |
|------|-------------|
| **Classe** | 30 classes de joueur sur 3 tiers avec stats de combat, armes et competences par defaut |
| **Arme** | 23 armes (Principale, Secondaire, Arme de poing, Equipement) avec portee, cadence de tir, penetration et modificateurs |
| **Competence** | 40 competences joueur avec descriptions HTML |
| **Competence OPFOR** | Capacites specifiques aux ennemis liees aux unites OPFOR |
| **Unite** | Modeles d'equipe (tier 1-2) avec compositions de classes et cartes de soutien pre-configurees |
| **Soutien** | 16 cartes d'action de soutien joueur (Artillerie, Medevac, Ecran de fumee, etc.) |

## Paquets de Cartes

Quatre paquets de cartes animent les evenements dynamiques du jeu :

| Paquet | Cartes | Description |
|--------|--------|-------------|
| **Soutien** | 16 | Actions de soutien joueur (Barrage d'artillerie, Tir de couverture, Medevac, Tir de mortier, Ecran de fumee...) |
| **Operations** | 30 | Objectifs de mission et cartes de scenario |
| **Infiltration** | 30 | Cartes d'indicatif sur theme de bieres pour l'identification des soldats |
| **Brouillard de Guerre** | 30 | Cartes d'evenements aleatoires (Embuscade, IED, Civils, Blackout radio, Contact frontal...) |

- Chaque paquet a ses propres **illustrations de dos de carte**
- Les cartes peuvent etre **distribuees**, **piochees**, **jouees** et **melangees** via le systeme de cartes de FoundryVTT
- Les pioches sont affichees dans le **chat** avec apercu d'image
- Cliquez sur l'image d'une carte pour ouvrir un visualiseur **ImagePopout** en plein ecran

## Combat & Jets

- **Jet de D20** : jet basique de 1d20 affiche dans le chat avec texte descriptif
- **Jet de Tir** : 1d20 + modificateurs d'arme, affichant :
  - Resultat du de, modificateur et total
  - Comparaison des seuils de combat (facile/moyen/difficile) depuis la classe du soldat ou l'unite OPFOR
- Messages de chat formates avec template de jet dedie
- Compatible **Dice So Nice**

## Token & Conditions

- **9 effets de statut personnalises** remplacant les valeurs par defaut de Foundry :
  - Conditions principales : A terre, Cache, Blesse, Surveillance
  - Niveaux de suppression : sup-1 a sup-6 (marqueurs visuels sur le token)
- **Synchronisation automatique des conditions** : les changements sur la fiche se refletent sur le token et inversement
- **Piste de blessures** : PV max > Blesse (1 PV) > A terre (0 PV) avec transitions automatiques
- **Pipeline de suppression** : 3+ = Supprime, 6 = Cloue (avec penalites de PA : -1 / -2)
- **Barres de token** : les soldats affichent Points d'Action + Points de Vie ; OPFOR affiche la Suppression
- Icones d'effets de statut en **cercles nets** (style personnalise supprimant les carres par defaut)

## Surcouches d'Interface

### Balise de Niveau de Menace

- Balise fixe en **haut-centre** de l'ecran avec effet de gyrophare 3D rotatif
- Affiche le **niveau de menace** actuel (0-9) avec code couleur de severite :
  - 0 = Inactif | 1-3 = Bas (vert) | 4-6 = Moyen (jaune/orange) | 7-9 = Eleve (rouge)
- **Etat d'alerte** avec pulsation rouge
- Controles MJ : boutons +/- pour ajuster le niveau de menace, bascule d'alerte
- Carte au survol affichant la description de menace et les tables OPFOR liees

### Surcouche de Token

- Survolez n'importe quel token pour voir un **panneau d'apercu** :
  - **Vue Carte** : Image de carte de classe/unite en plein ecran
  - **Vue Fiche** : Stats compactes (PV, PA, tableau d'armes, competences, seuils de combat, conditions)
- Se masque automatiquement quand le curseur quitte le token, gere correctement les tokens supprimes

### Surcouche de Soutien Joueur

- Panneau lateral gauche avec **badge miniature** affichant le nombre de cartes actives
- Survolez pour deployer une **grille de cartes** avec tous les soutiens disponibles
- Bouton **Activer** : retire la carte et la publie dans le chat
- **Lien au leader** : cartes liees aux chefs d'equipe ; si le leader est a terre, les cartes sont grisees avec indicateur de crane
- Importation automatique des cartes de soutien quand un soldat avec des soutiens assignes est place sur la carte

### Surcouche de Soutien OPFOR

- Cartes de soutien OPFOR activables uniquement lorsque des **conditions specifiques sont remplies** :
  1. L'alerte de menace doit etre **active**
  2. Un leader OPFOR (Commandant d'escouade, Chef de cellule, ou unite avec competence Soutien) doit etre **sur la carte**
  3. Le leader ne doit **pas etre a terre**
- Bordure rouge d'avertissement quand les conditions ne sont pas remplies
- Glisser-deposer des cartes de soutien depuis le compendium Soutien OPFOR

## Compendiums

11 compendiums organises en dossiers :

| Compendium | Type | Contenu |
|------------|------|---------|
| Classes Joueur | Item | 30 classes (Tier 1-3) : Assaut, Sniper, Brecheur, Conseiller, Artilleur, Reconnaissance... |
| Armes | Item | 23 armes : Fusils d'assaut, PM, Fusils a pompe, Fusils de precision, Pistolets, Equipement |
| Competences Joueur | Item | 40 competences joueur |
| Unites Joueur | Item | Compositions d'equipes pre-construites pretes au deploiement |
| Soutien Joueur | Item | 16 cartes d'action de soutien |
| Unites OPFOR | Acteur | Unites ennemies pre-configurees par faction |
| Tables OPFOR | Table aleatoire | Tables de rencontre par niveau de menace pour 3 factions (Cartel, Insurges, Russes) avec 9 niveaux chacune |
| Soutien OPFOR | Item | Actions de soutien OPFOR |
| Competences OPFOR | Item | Capacites specifiques aux ennemis |
| Paquets | Cartes | 4 paquets de cartes (Soutien, Operations, Infiltration, Brouillard de Guerre) |

## Deploiement d'Unites

- Les **modeles d'unite** contiennent des compositions de classes et assignations de cartes de soutien pre-configurees
- Cliquez sur **Deployer l'Unite** pour creer automatiquement tous les acteurs soldats dans un dossier dedie
- Chaque soldat deploye herite des armes, competences et stats de combat de sa classe
- Les cartes de soutien sont assignees aux chefs d'equipe et importees dans la Surcouche de Soutien
- Glisser-deposer depuis le compendium Unites Joueur

---

## Languages / Langues

| Language / Langue | Status / Statut |
|-------------------|-----------------|
| English | Fully supported |
| Francais | Entierement supporte |

## System Requirements / Configuration Requise

- **FoundryVTT**: Version 13
- **Compatible modules / Modules compatibles**: Tokenizer, Dice So Nice

## Author / Auteur

**Ricco** - [GitHub](https://github.com/kenlimero)

## License

MIT
