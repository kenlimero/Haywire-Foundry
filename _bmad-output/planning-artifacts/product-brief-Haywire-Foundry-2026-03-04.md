---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - brainstorming-session-2026-03-04-1500.md
date: 2026-03-04
author: Ricco
---

# Product Brief: Haywire-Foundry

## Executive Summary

Haywire-Foundry est un système FoundryVTT V13 qui adapte le wargame tactique solo/coop HAYWIRE V2 en expérience digitale complète. Le projet vise à éliminer la barrière d'entrée principale du jeu — le setup conséquent en matériel physique (figurines, terrain, cartes, tokens, dés spéciaux, decks multiples) — en fournissant des environnements de jeu prêts à jouer et des outils de création de contenu. C'est le premier système wargame tactique solo sur FoundryVTT, une plateforme jusqu'ici exclusivement orientée jeux de rôle.

---

## Core Vision

### Problem Statement

Jouer à HAYWIRE V2 requiert un investissement matériel important (figurines, terrain, décors) et un temps de setup conséquent avant chaque partie (placement de threat tokens, préparation des decks de cartes, consultation de tables de référence, tracking de nombreux statuts). Cette barrière d'entrée décourage les joueurs potentiels et rallonge le temps entre les parties pour les joueurs existants — un comble pour un jeu conçu pour être "fast paced".

### Problem Impact

- Les joueurs intéressés par Haywire ne franchissent pas le pas faute de matériel
- Les joueurs existants espacent leurs parties à cause du temps de préparation
- Le tracking en cours de partie (suppression, alerte, threat level, comportements OPFOR) est source d'erreurs et ralentit le jeu
- Le jeu solo, mode principal de Haywire, souffre particulièrement car le joueur gère TOUT seul (son équipe + l'OPFOR + le tracking)

### Why Existing Solutions Fall Short

- **Aucun système FoundryVTT** n'existe pour Haywire ni pour aucun wargame tactique solo
- **Tabletop Simulator (TTS)** offre une table virtuelle mais zéro automatisation — le joueur fait tout manuellement comme en physique
- **Les PDF et tables de référence** restent la norme, obligeant à jongler entre le plateau et la documentation pendant la partie
- **L'écosystème FoundryVTT** est entièrement orienté RPG (D&D, Pathfinder, etc.) — aucun système ne propose un flow asymétrique solo avec IA OPFOR

### Proposed Solution

Un système FoundryVTT V13 natif qui :
- Fournit des **environnements de jeu prêts à jouer** (scènes pré-configurées avec threat tokens, spawn points, opérations) pour lancer une partie en quelques minutes
- Offre des **fiches de classe interactives** fidèles aux cartes physiques mais enrichies de fonctionnalités digitales (jets de dés intégrés, tracking d'état en temps réel, tooltips)
- Automatise le **tracking** (suppression, AP, conditions, threat level, alerte) pour que le joueur se concentre sur les décisions tactiques
- Permet aux joueurs de **créer leurs propres contenus** (scènes, opérations) en exploitant les outils natifs de FoundryVTT
- Est conçu **solo-first** avec support coop et PvP natif

### Key Differentiators

- **Premier wargame tactique solo sur FoundryVTT** — terrain vierge, aucune concurrence directe
- **Solo-first** — contrairement à tous les systèmes Foundry existants pensés pour un MJ + joueurs
- **Prêt à jouer** — des environnements complets éliminent le setup, la barrière n.1
- **Fidélité visuelle + interactivité** — les cartes de classe sont reconnaissables mais vivantes (état en temps réel)
- **Exploite FoundryVTT V13** — Token Drag Measurement, ApplicationV2, Cards API, CSS Layers comme briques natives

## Target Users

### Primary Users

**Le Joueur Solo — "Marc"**
- Wargamer solo passionné, joue principalement en semaine après le travail
- Connaît Haywire V2 (ou le découvre) mais hésite à investir dans le matériel physique (figurines, terrain, décors)
- Veut lancer une partie rapidement sans 30 minutes de setup
- Utilise déjà FoundryVTT pour du JDR et cherche à élargir son usage
- **Frustration actuelle** : trop de matériel à acquérir et préparer, tracking manuel fastidieux en solo (gérer son équipe + l'OPFOR + les statuts)
- **Succès** : lancer une opération complète en moins de 5 minutes de setup, se concentrer uniquement sur les décisions tactiques

### Secondary Users

**Le Joueur Coop/PvP — "Sophie"**
- Joue en groupe sur FoundryVTT, cherche une alternative tactique aux systèmes RPG classiques
- Découvre Haywire via la communauté Foundry ou un ami
- Apprécie le mode coop (équipe vs OPFOR) ou PvP pour des sessions entre amis
- **Succès** : une session multijoueur fluide où chacun gère son escouade sans friction

**Le Créateur de Contenu — "Alex"**
- Joueur expérimenté qui veut créer ses propres scènes, opérations et scénarios
- Utilise les outils natifs de FoundryVTT (éditeur de scènes, journaux) pour produire du contenu personnalisé
- Potentiellement contributeur à la communauté en partageant ses créations
- **Succès** : pouvoir créer et partager facilement des opérations originales

### User Journey

1. **Découverte** : Marc trouve Haywire-Foundry sur le hub FoundryVTT ou via la communauté wargaming solo
2. **Onboarding** : Il installe le système, ouvre une scène pré-configurée — ses premiers threat tokens sont déjà placés, le deck Fog of War est prêt
3. **Première partie** : Il choisit une classe, lance l'opération — tout le tracking est automatique. Il se concentre sur la tactique
4. **Moment "aha!"** : La première alerte OPFOR se déclenche automatiquement, les jets sont visibles, il réalise qu'il n'a plus rien à gérer manuellement
5. **Usage régulier** : Il enchaîne les opérations avec différentes classes et difficultés, explore le contenu
6. **Long terme** : Il commence à créer ses propres scènes et partage avec la communauté

## Success Metrics

### Critères de Succès Utilisateur

- **Jouabilité** : une partie complète de Haywire V2 peut être jouée de bout en bout sur FoundryVTT (sélection de classe → opération → résolution)
- **Cartes fonctionnelles** : toutes les cartes de jeu (classes, OPFOR, supports, opérations, Fog of War, Infil) sont disponibles et utilisables dans le système
- **Setup minimal** : lancer une partie ne prend pas plus de quelques minutes vs 30+ minutes en physique
- **Tracking automatisé** : le joueur n'a pas à gérer manuellement les statuts, conditions et jets qui peuvent être automatisés

### Business Objectives

- Projet personnel open-source — pas d'objectifs commerciaux
- Succès = le système est jouable et fidèle à l'expérience Haywire V2
- Bonus : intérêt de la communauté wargaming/FoundryVTT

### Key Performance Indicators

- **KPI 1** : Partie solo complète jouable (oui/non)
- **KPI 2** : 30 classes joueur intégrées avec cartes (x/30)
- **KPI 3** : 3 factions OPFOR fonctionnelles (x/3)
- **KPI 4** : Decks de cartes opérationnels (Fog of War, Operations, Infil, Supports)

## MVP Scope

### Core Features

1. **Squelette système FoundryVTT V13** : system.json, modules ESM, TypeDataModel, ApplicationV2 — architecture V13 native
2. **Actor Soldier** : type d'acteur unique avec fiche de classe interactive (image de carte + stats + état en temps réel)
3. **Items Class + Weapon** : données de jeu structurées en Items Foundry avec les stats de chaque classe et arme
4. **Compendiums** : les 30 classes joueur avec leurs cartes visuelles intégrées, prêtes à l'emploi
5. **Jet D20** : mécanique de combat de base avec jet visible dans le chat, résolution des tirs et actions

### Out of Scope for MVP

- Automatisation OPFOR (IA comportementale des ennemis)
- Véhicules et leurs mécaniques
- Decks de cartes (Fog of War, Operations, Infil, Supports)
- Scènes pré-configurées et environnements prêts à jouer
- Mode coop/PvP multijoueur
- Outils de création de contenu communautaire
- Tracking automatisé avancé (suppression, alerte, threat level)

### MVP Success Criteria

- Le système s'installe et se charge correctement dans FoundryVTT V13
- Un Actor Soldier peut être créé avec une classe assignée
- Les 30 classes joueur sont disponibles via compendium avec leurs cartes
- Un jet de D20 peut être effectué depuis la fiche avec résultat visible

### Future Vision

- **Phase 2** : OPFOR (3 factions avec classes ennemies et comportements de base)
- **Phase 3** : Decks de cartes (Fog of War, Operations, Infil, Supports) via Cards API
- **Phase 4** : Tracking automatisé (conditions, AP, suppression, alerte)
- **Phase 5** : Scènes pré-configurées et environnements prêts à jouer
- **Phase 6** : Véhicules et mécaniques associées
- **Phase 7** : Mode coop/PvP et outils communautaires
