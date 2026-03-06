---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Conception du système FoundryVTT pour Haywire V2 - priorité aux cartes d''unités'
session_goals: 'Explorer les approches pour créer les cartes de classes/unités dans FoundryVTT, avec gestion future de l''IA OPFOR et mesures grille/distance réelle'
selected_approach: 'ai-recommended'
techniques_used: ['Morphological Analysis', 'SCAMPER Method', 'Analogical Thinking', 'Reversal Inversion', 'First Principles', 'Constraint Mapping', 'What If Scenarios']
ideas_generated: 116
context_file: ''
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitateur:** Ricco
**Date:** 2026-03-04

## Session Overview

**Sujet:** Conception du système FoundryVTT V13 pour Haywire V2
**Objectifs:** Explorer les approches pour créer les cartes de classes/unités dans FoundryVTT, avec gestion future de l'IA OPFOR et mesures grille/distance réelle
**Cible :** FoundryVTT V13 (ApplicationV2, ESM, CSS Layers, Token Drag Measurement)

### Contexte

- HAYWIRE V2 est un wargame tactique solo/coop moderne asymétrique (par Martin Krasemann aka The Solo Wargamer)
- 30 classes jouables en 3 tiers avec cartes dédiées (stats, skills, équipement)
- 3 factions OPFOR : Insurgents, Cartel, Russian Armed Forces
- Nombreux decks de cartes : Threat Level, Fog of War, Operations, Infil, Supports, Reinforcements
- Véhicules avec templates et spots
- Les actions spécifiques OPFOR sont sur les cartes de faction (gestion future par le système)
- Mesures sur grille en priorité, distance réelle en option future
- **Priorité : création des cartes d'unité**
- Mix visuel fidèle + fonctionnalité interactive

### Paramètres de session

- Focus principal : design des fiches/cartes de classes pour FoundryVTT
- Les comportements IA OPFOR viendront dans une phase ultérieure
- Grille d'abord, mesures réelles ensuite
- FoundryVTT V13 obligatoire
- Les images de cartes existent déjà dans le répertoire V2
- Les conditions FoundryVTT natives gèrent les statuts sur tokens
- Les alertes sont automatiques mais les jets doivent être visibles

## Technique Selection

**Approche :** AI-Recommended Techniques (+ 4 techniques bonus)
**Techniques utilisées :**

1. **Morphological Analysis** — Déconstruction systématique des paramètres des cartes
2. **SCAMPER Method** — Transformation du physique vers le digital
3. **Analogical Thinking** — Inspiration d'autres systèmes FoundryVTT et jeux
4. **Reversal Inversion** — Inversion des problèmes pour révéler les priorités
5. **First Principles** — Capacités natives de FoundryVTT V13
6. **Constraint Mapping** — Contraintes techniques, UX et adoption
7. **What If Scenarios** — Possibilités radicales et extensions

## Inventaire complet des idées (116)

### Thème 1 : Architecture de données

| # | Idée | Description |
|---|---|---|
| 1 | Typage par Item FoundryVTT | Chaque type de carte = un type d'Item (playerClass, opforClass, weapon, skill, etc.) avec sheets spécialisées |
| 5 | Skills comme Items enfants | Chaque skill est un Item séparé attaché à l'Actor, réutilisable entre classes, avec Active Effects |
| 6 | Armes comme Items partagés | Profil complet (portée, dés, pénétration, règles spéciales), clic = dialogue de tir |
| 7 | Actor unique "Soldier" | Un seul type pour joueurs ET OPFOR avec champ `side`, simplifie PvP et capture |
| 64 | Actor + Items = brique de base | La classe est un Item qui injecte stats/skills dans l'Actor au drag-drop |
| 65 | TypeDataModel V13 | Schémas typés avec validation : SoldierData, WeaponData, ClassData, SkillData |
| 75 | Compteur suppression | Champ `system.suppression` dans le DataModel, mis à jour à chaque tir reçu |
| 76 | MVP minimal | Actor Soldier + Item Class + Item Weapon + jet D20 = jouable |
| 78 | Un seul Actor type | Pas de PlayerSoldier/OpforSoldier/Civilian séparés. Un "Soldier" avec `side` |
| 109 | JSON data-first | Structurer toutes les données en JSON avant de coder le système |
| 114 | Faction générique extensible | Modèle faction : nom, couleur, classes, threat levels, reinforcements, supports, vehicles |
| 115 | Véhicules composites | Actor véhicule avec Items "Slot" (conducteur, tourelle, passager) — phase future |

### Thème 2 : Fiches / Sheets de classe

| # | Idée | Description |
|---|---|---|
| 2 | Fiche hybride | Image carte en header/arrière-plan + éléments interactifs cliquables superposés |
| 3 | Double vue toggle | Bascule entre vue "Carte originale JPG" et vue "Fiche interactive" |
| 4 | Layout HTML/CSS fidèle | Recréer la structure visuelle de la carte (disposition, couleurs) en HTML, chaque zone interactive |
| 29 | Tooltips contextuels | Survol arme = profil complet, survol skill = description + coût |
| 31 | Vue unique sans onglets | Identité + AP/HP + skills + armes + conditions en un seul écran |
| 49 | Inspiration D&D 5e | Header compact, items drag-drop, jets en un clic — conventions FoundryVTT connues |
| 58 | Identité visuelle Haywire | Couleurs (jaune joueur, marron OPFOR, orange FoW, vert support), fonts, textures militaires |
| 62 | Carte vivante | Affiche l'état en temps réel : AP restants, conditions actives, munitions utilisées |
| 79 | ApplicationV2 + partials | ActorSheetV2 avec partials Handlebars réutilisables (stats, skills, equipment) |
| 83 | Gestion inline Items V13 | Updates Items inline séparés de l'update Actor (piège ApplicationV2) |
| 85 | CSS custom properties faction | Variables CSS par faction, compatibles thème clair/sombre V13 |

### Thème 3 : Combat et interaction

| # | Idée | Description |
|---|---|---|
| 10 | Dialogue combat intelligent | Cible → arme → portée → difficulté auto → jet → résultat (touché/raté/jam/headshot) |
| 30 | Scatter dice visuel | Bouton lance D6 direction + D6 distance, affiche flèche sur la map |
| 32 | Flow tir 2 clics | Sélectionner tireur → clic droit cible → calcul auto → jet |
| 54 | Tir depuis la map | Résoudre un tir en 2 clics max sans ouvrir de fiche |
| 69 | Measured Templates natifs | Cercles pour grenades/fragmentation, persistent pour fumigènes (3 tours) |
| 74 | Calcul difficulté contextuel | Couvert + armure cible → Easy/Medium/Hard proposé automatiquement |
| 84 | DialogV2 | Dialogues de combat riches avec preview du jet et sélection d'arme |
| 101 | Sons d'armes | Audio au tir : rafale, coup unique, explosion. Supprimé = étouffé |

### Thème 4 : Conditions et statuts

| # | Idée | Description |
|---|---|---|
| 8 | Tracker AP visuel | Cercles cliquables pour dépenser les AP, liés à la blessure et conditions |
| 11 | Suppression visuelle | Marqueurs empilés sur le token (comme D6 en physique) |
| 17 | Conditions custom Haywire | Suppressed, Pinned, Downed, Hidden, Overwatch, Alerted, Jammed avec Active Effects |
| 21 | Indicateur "Activé" | Overlay sur le token quand tous les AP sont dépensés, reset auto en début de tour |
| 28 | Barre jauge suppression | 0→3 = jaune (suppressed), 3→6 = rouge (pinned), visuel immédiat |
| 46 | Inspiration Alien RPG | Compteur cliquable +/- pour la suppression, pattern UX prouvé |
| 66 | Active Effects | Suppressed → ap.max=1, Pinned → ap.max=0, Body Armor → modifie difficulté |

### Thème 5 : Détection et alerte

| # | Idée | Description |
|---|---|---|
| 18 | Jets détection narratifs | D20 auto dans le chat avec contexte complet (qui, seuil, couvert, résultat) |
| 19 | Propagation alerte cascade | Alerte groupe → alerte globale fin de tour, chaque étape loguée |
| 22 | Threat tokens = Actors | Actor avec rotation (direction), état (révélé/non), lien RollTable |
| 34 | Tokens secrets | Image silhouette côté joueur, contenu révélé à la LOS |
| 68 | Rotation = direction | La rotation native du token FoundryVTT = la direction du threat token |
| 86 | LOS Foundry ≠ LOS Haywire | Foundry = vision/murs. Haywire = 180° basé direction tête. Deux systèmes différents |
| 90 | Secret solo = les jets | En solo, le secret vient des jets de dés (threat tokens), pas de la vision |
| 102 | Animation révélation | Silhouette se dissout → jet D20 → OPFOR apparaissent (Sequencer) |
| 105 | Fog of war visuel | Zones non explorées avec effet brouillard via vision/éclairage Foundry |

### Thème 6 : Flow de tour et phases

| # | Idée | Description |
|---|---|---|
| 9 | Barre d'actions contextuelle | Actions disponibles quand un token est sélectionné, coût AP affiché, grisé si insuffisant |
| 20 | Combat Tracker 3 phases | Player Phase → OPFOR Phase → Spawn Phase, guide l'ordre correct |
| 23 | Mouvement aléatoire OPFOR | Scatter dice virtuel pour les non-alertés, déplacement auto ou assisté |
| 37 | Macros hotbar | "Nouveau tour", "Phase OPFOR", "Scatter dice", "Tirer FoW", "Jet de spawn" |
| 40 | Compteur Threat Level | Visible dans l'interface, auto-incrémenté à chaque tour |
| 56 | Comportement OPFOR guidé | Arbre décisionnel affiché step-by-step pour le joueur solo |
| 60 | Mode full-auto OPFOR | Optionnel, résout la phase OPFOR automatiquement — phase future |
| 72 | Phases asymétriques | LE composant custom central — Foundry n'a pas de concept natif de phases |
| 88 | Manuel d'abord | Pas d'IA native dans Foundry — rendre le mode manuel fluide AVANT d'automatiser |
| 112 | Raccourcis clavier | M=Move, S=Sneak, K=Stalk, C=Combat, G=Grenade, O=Overwatch, F=First Aid |

### Thème 7 : Decks de cartes et tables

| # | Idée | Description |
|---|---|---|
| 12 | Threat Level = RollTable | D20 sur la RollTable du niveau actuel → résultat dans le chat |
| 13 | FoW = Deck Cards | Les 15 cartes FoW en deck piochable avec images originales orange |
| 14 | Operations = JournalEntries | Image carte + briefing narratif + setup comme checklist |
| 25 | Infil = placement assisté | Carte Infil sélectionnée → zone valide highlight sur la map |
| 33 | Cards API Foundry | FoW, Infil, Operations utilisent le système Cards natif (pioche, défausse) |
| 38 | Briefing immersif | JournalEntry avec image, briefing italique, instructions setup |
| 39 | Éliminer tables papier | Toutes les tables D20 = RollTables automatisées, zéro PDF pendant la partie |
| 47 | Inspiration Savage Worlds | L'API Cards est mature pour les decks de jeu |
| 67 | RollTable exhaustives | Threat level (5 niveaux × 3 factions), reinforcements, vehicles, inside buildings |

### Thème 8 : Setup de partie et organisation

| # | Idée | Description |
|---|---|---|
| 15 | Compendiums par faction | Player Classes, OPFOR Insurgents, OPFOR Cartel, OPFOR Russians, Weapons, etc. |
| 16 | Configurateur d'équipe | Choix unité → classes dispo → sélection soldats → contraintes respectées |
| 24 | Wizard création partie | Pas-à-pas : faction → opération → threat tokens → spawn points → équipe → infil |
| 57 | Setup < 5 minutes | Scènes pré-configurées avec threat tokens et spawn points |
| 77 | Compendiums = boîte de jeu | L'organisation des compendiums reflète les decks physiques |
| 92 | Images ≠ données | Les JPG sont des illustrations, les données doivent être saisies/structurées |
| 93 | Import JSON par faction | Format importable pour ne pas tout saisir à la main |
| 95 | Monde de démo | Adventure Compendium avec scène + acteurs + tokens prêt à jouer |

### Thème 9 : Spécificités FoundryVTT V13

| # | Idée | Description |
|---|---|---|
| 79 | ApplicationV2 + partials | ActorSheetV2, partials Handlebars réutilisables |
| 80 | CSS Layers | Thème Haywire sans conflits de spécificité, compatible clair/sombre |
| 81 | Token Drag Measurement | Mesure pendant le drag = mouvement Haywire natif (6"/3"/1") |
| 82 | ESM Modules | Architecture propre : data-models/, sheets/, helpers/ en import/export |
| 83 | DocumentSheetV2 | Updates Items inline séparés (breaking change V13) |
| 84 | DialogV2 | Dialogues riches pour le combat |
| 85 | CSS custom properties | Variables couleurs par faction |

### Thème 10 : Multiplayer, communauté et au-delà

| # | Idée | Description |
|---|---|---|
| 26 | Coop ownership | Chaque joueur contrôle ses soldats |
| 27 | PvP fog of war réel | Défenseur invisible pour l'attaquant via vision Foundry |
| 41 | Slider automatisation | Le joueur choisit combien il délègue au système |
| 42 | Info vient au joueur | Rappels contextuels des règles pendant le jeu |
| 61 | Système enseigne les règles | Tooltips en situation, onboarding intégré |
| 63 | Solo-first | Mode solo par défaut sans configuration, contrairement aux autres systèmes |
| 94 | Interface pour non-joueurs Foundry | Termes Haywire partout, pas de jargon Foundry |
| 96 | Mode companion de table | Fiches + jets sans map, assistant de table physique |
| 97 | Historique / AAR | Chat persistant = journal de bataille exportable |
| 98 | Campagne persistante | Roster d'unité entre missions, blessés, KIA |
| 99 | Statistiques de jeu | Taux réussite, kills, tours avant alerte, post-partie |
| 100 | Modding communautaire | Format documenté, les joueurs ajoutent factions/opérations |
| 106 | Partage opérations | Export Adventure Compendium, partage Discord |
| 107 | Mode streaming | Vue caméra auto, overlays info |
| 108 | Import photos figurines | Découper ses propres photos en tokens |
| 110 | MVP sans map | Fiches + jets seuls = le minimum jouable |
| 111 | Bilingue FR/EN | i18n natif Foundry, fichiers de localisation |
| 113 | Règles in-game | JournalEntry cherchable, plus besoin du PDF |
| 116 | Tracker campagne | Historique unité automatique entre missions |

### Idées additionnelles (SCAMPER, Reverse, Constraints)

| # | Idée | Description |
|---|---|---|
| 33 | Cards API pour decks | FoW, Infil, Operations en CardStacks natifs |
| 35 | Toggle grille/distance | Settings système pour mode grille ou mesure réelle |
| 36 | Portes = Wall Doors | États open/closed/locked natifs + jet D20 + action Breach |
| 43 | Inspiration LANCER | Fiche mech compacte = modèle pour fiche soldat |
| 44 | Inspiration WH40K | Unit card avec stats + armes cliquables = structure Haywire |
| 45 | Inspiration XCOM | Zones de mouvement highlight (6" bleu, 3" jaune, 1" vert) |
| 48 | Sweet spot TTS↔JV | Entre le tout manuel et le tout automatique |
| 50 | Inspiration Bolt Action | Combat tracker modifié pour wargame, pas RPG |
| 51 | Esthétique C2 militaire | HUD ops center, sobre et fonctionnel |
| 52 | Inspiration R6 Siege | Phase planning : plan bâtiment, entrées, objectifs |
| 53 | Feedback visuel | Animations légères : flash tir, shake touché (Sequencer) |
| 55 | Chat cards stylisées | Messages thématiques par type (combat jaune, FoW orange, OPFOR marron) |
| 59 | Architecture évolutive | Stats par classe (pas hardcodées tier), skills Items séparés, tables éditables |
| 87 | Diagonale grille | Choix : diagonale 1" simplifié ou 1.41" réaliste, dans les settings |
| 89 | Performance 40+ tokens | Active Effects légers, recalcul ciblé pas global |
| 91 | Règles simplifiées digital | Définir les adaptations avec le game designer |
| 103 | Briefings narratifs | Effet radio militaire, dossier classifié pour l'opération |
| 104 | Zoom caméra combat | Léger zoom sur la zone d'action pendant un tir |

## Concepts de rupture

1. **#76 + #110** — Le MVP est minimaliste : Actor + Class + Weapon + jet D20, jouable sans map
2. **#109** — Data-first : structurer le JSON de toutes les données avant de coder
3. **#78** — Un seul type d'Actor "Soldier" pour tout (KISS)
4. **#62** — La carte digitale est "vivante", pas une image statique
5. **#54** — Le combat se résout depuis la map, jamais depuis la fiche
6. **#81** — Token Drag Measurement V13 = mouvement Haywire natif
7. **#72** — Le Combat Tracker 3 phases est LE composant custom central
8. **#63** — Solo-first, contrairement à tous les autres systèmes FoundryVTT

## Priorités : Quick Wins vers MVP jouable

### Quick Win 1 : Données structurées en JSON (#109)
- Créer JSON par type : player-classes, weapons, skills, opfor par faction
- Saisir les 30 classes joueur, profils d'armes, skills, classes OPFOR
- **Mesure :** Toutes les données du jeu en JSON validé

### Quick Win 2 : Squelette système V13 (#76, #65, #78, #82)
- system.json, DataModels (SoldierData, ClassData, WeaponData, SkillData)
- Structure ESM : module/data-models/, module/sheets/, module/helpers/
- **Mesure :** Le système s'installe, un Actor Soldier se crée, Items attachables

### Quick Win 3 : Fiche Actor Soldier basique (#31, #62, #79)
- ActorSheetV2 compact : header, AP/HP cliquables, stats → jet D20, skills, armes
- CSS thème militaire basique
- **Mesure :** Fiche ouverte, clic stat → D20 dans le chat

### Quick Win 4 : Compendiums pré-remplis (#77, #15)
- Import JSON dans compendiums FoundryVTT
- Player Classes (30), Weapons, Skills, OPFOR par faction
- **Mesure :** Drag-drop "Team Leader" → fiche complète

### Quick Win 5 : Jet de combat fonctionnel (#32, #74)
- Clic arme → DialogV2 (difficulté) → jet D20 → chat card stylisée
- Résultat : touché/raté/jam (1)/headshot (20)
- **Mesure :** Tir complet en 2 clics avec résultat lisible

## Roadmap post-MVP

| Phase | Contenu | Idées clés |
|---|---|---|
| Phase 2 | Conditions, suppression, AP tracking auto | #17, #66, #28, #8 |
| Phase 3 | Combat Tracker 3 phases, flow de tour | #20, #72, #40, #37 |
| Phase 4 | Threat tokens, détection, alerte | #22, #18, #19, #68 |
| Phase 5 | Decks (FoW, Infil, Operations) | #13, #33, #14, #25 |
| Phase 6 | Véhicules | #115 |
| Phase 7 | Automatisation OPFOR | #60, #73, #56 |

## Session Summary

**Réalisations :**
- **116 idées** générées à travers 7 techniques de créativité
- **10 thèmes** identifiés couvrant tous les aspects du système
- **8 concepts de rupture** structurants pour l'architecture
- **5 quick wins** formant un chemin clair vers le MVP
- **Roadmap 7 phases** du MVP à l'automatisation complète

**Insights clés :**
- FoundryVTT V13 est particulièrement adapté à Haywire (Token Drag Measurement, ApplicationV2, Cards API)
- L'approche data-first (JSON) permet de commencer immédiatement sans coder
- Un seul Actor "Soldier" avec des Items typés est l'architecture la plus simple et flexible
- Le mode solo-first est une différenciation unique dans l'écosystème FoundryVTT
- Le Combat Tracker 3 phases est le seul composant vraiment custom nécessaire
