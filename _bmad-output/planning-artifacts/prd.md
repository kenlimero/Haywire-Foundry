---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments:
  - product-brief-Haywire-Foundry-2026-03-04.md
  - brainstorming-session-2026-03-04-1500.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 1
  projectDocs: 0
workflowType: 'prd'
classification:
  projectType: developer_tool
  domain: gaming
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - Haywire-Foundry

**Author:** Ricco
**Date:** 2026-03-04

## Executive Summary

Haywire-Foundry est un système FoundryVTT V13 qui adapte le wargame tactique solo/coop HAYWIRE V2 (par Martin Krasemann / The Solo Wargamer) en expérience digitale native. Le projet cible les wargamers solo qui veulent jouer à Haywire sans investir dans le matériel physique (figurines, terrain, décors) ni subir le temps de setup conséquent avant chaque partie. La solution fournit des fiches de classe interactives fidèles aux cartes physiques, des compendiums prêts à l'emploi pour les 30 classes joueur, et une mécanique de combat D20 intégrée — le tout sur l'architecture V13 native (ESM, TypeDataModel, ApplicationV2).

### What Makes This Special

- **Premier wargame tactique solo sur FoundryVTT** — aucun système concurrent n'existe sur la plateforme, exclusivement orientée RPG (D&D, Pathfinder)
- **Solo-first** — conçu pour un joueur unique gérant son équipe, contrairement à tous les systèmes Foundry existants pensés pour un MJ + joueurs
- **Barrière d'entrée éliminée** — le matériel physique et le temps de setup disparaissent avec le digital
- **Fidélité + interactivité** — les cartes de classe sont visuellement reconnaissables mais enrichies de fonctionnalités digitales (jets intégrés, tracking temps réel)

## Project Classification

- **Type :** Developer Tool (système/plugin FoundryVTT V13)
- **Domaine :** Gaming / Wargame tactique solo
- **Complexité :** Moyenne — règles définies, plateforme structurante, adaptation des mécaniques asymétriques comme défi principal
- **Contexte :** Greenfield — aucun code existant, aucun concurrent direct

## Success Criteria

### User Success

- Le joueur solo peut créer un Actor Soldier, lui assigner une classe parmi les 30 disponibles, et lancer un jet de combat D20 depuis la fiche — sans consulter de document externe
- Les cartes de classe sont visuellement fidèles aux originales tout en étant interactives (stats visibles, jets intégrés)
- Le joueur retrouve immédiatement les classes via les compendiums sans configuration manuelle

### Business Success

- Projet personnel open-source — pas d'objectifs commerciaux
- Succès = système installable et jouable, fidèle à Haywire V2
- Bonus : retours positifs de la communauté FoundryVTT/wargaming solo

### Technical Success

- Le système se charge sans erreur sur FoundryVTT V13
- Architecture V13 native : ESM modules, TypeDataModel, ApplicationV2
- Compendiums fonctionnels avec les 30 classes et leurs images
- Jets D20 visibles dans le chat avec résolution correcte

### Measurable Outcomes

- 30/30 classes joueur intégrées avec cartes visuelles
- 0 erreur console au chargement du système
- Jet D20 fonctionnel avec résultat affiché dans le chat

## Product Scope & Development Phases

### MVP Strategy

**Approach :** Problem-solving MVP — résoudre le problème n.1 (accès au jeu sans matériel) avec le minimum fonctionnel.
**Resources :** 1 développeur solo (Ricco), projet personnel open-source.

**Core User Journeys Supported :**
- Journey 1 (Marc - Solo) : parcours complet supporté
- Journey 2 (Sophie - Coop) : partiellement supporté (fiches et jets en multi, pas d'automatisation OPFOR)

### Phase 1 — MVP

1. Squelette système FoundryVTT V13 (system.json, ESM, TypeDataModel, ApplicationV2)
2. Actor Soldier avec fiche de classe interactive
3. Items Class + Weapon avec données de jeu structurées
4. Compendiums des 30 classes joueur avec cartes visuelles
5. Mécanique de jet D20 avec résultat visible dans le chat

### Phase 2 — Growth

- OPFOR : 3 factions (Insurgents, Cartel, Russian Armed Forces) avec classes ennemies
- Decks de cartes (Fog of War, Operations, Infil, Supports) via Cards API
- Tracking automatisé (conditions, AP, suppression, alerte)

### Phase 3 — Expansion

- Scènes pré-configurées et environnements prêts à jouer
- Véhicules et mécaniques associées
- Mode coop/PvP structuré et outils communautaires
- Automatisation complète de l'OPFOR avec IA comportementale

### Risk Mitigation

- **Technical :** API V13 récente — mitigation via documentation officielle et patterns des systèmes existants (dnd5e, pf2e)
- **Market :** Niche spécialisée — projet passion sans pression commerciale, validation par usage personnel
- **Resource :** Développeur solo — MVP minimal (5 capabilities), architecture extensible

## User Journeys

### Journey 1 : Marc découvre et joue sa première partie solo

**Opening Scene :** Marc, wargamer solo, tombe sur Haywire-Foundry en parcourant le hub FoundryVTT. Il joue déjà à D&D sur Foundry et cherche quelque chose de tactique pour ses soirées solo. Haywire V2 l'intéressait mais le matériel physique l'a toujours freiné.

**Rising Action :** Il installe le système en un clic depuis Foundry. Il crée un nouveau monde, ouvre la sidebar Actors, et crée un Actor Soldier. Il parcourt le compendium des classes — 30 choix avec les cartes visuelles qu'il reconnaît du PDF. Il drag & drop la classe "Breacher" sur son actor. La fiche s'affiche avec l'image de la carte originale, les stats, et les armes associées.

**Climax :** Il clique sur le bouton de tir depuis sa fiche. Le D20 roule dans le chat avec le résultat clairement affiché. Il réalise qu'il vient de faire en 3 minutes ce qui lui aurait pris 30 minutes de setup en physique.

**Resolution :** Marc enchaîne les classes, explore les différentes options. Il a trouvé son jeu solo tactique sur Foundry.

### Journey 2 : Sophie organise une partie coop

**Opening Scene :** Sophie joue à D&D avec ses amis sur Foundry. Un soir, le MJ annule. Elle propose "on teste Haywire en coop ?"

**Rising Action :** Elle crée un monde Haywire-Foundry, les joueurs se connectent. Chacun crée son Actor Soldier et choisit sa classe dans le compendium. Les fiches sont claires, chacun comprend ses capacités.

**Climax :** En partie, chacun lance ses jets depuis sa fiche. Les résultats s'affichent dans le chat partagé. La coordination tactique se fait naturellement.

**Resolution :** La session remplace avantageusement la soirée D&D annulée. Le groupe ajoute Haywire à sa rotation.

### Journey 3 : Alex crée du contenu personnalisé

**Opening Scene :** Alex a joué une vingtaine de parties et connaît bien le système. Il veut créer une opération custom dans un contexte urbain.

**Rising Action :** Il utilise l'éditeur de scènes natif de Foundry pour placer sa map. Il crée des Actors OPFOR depuis les compendiums (post-MVP). Il configure les positions de départ.

**Climax :** Sa scène custom fonctionne parfaitement avec le système. Les mécaniques s'appliquent naturellement à son contenu original.

**Resolution :** Il partage sa scène avec la communauté. D'autres joueurs découvrent Haywire via son contenu.

### Journey Requirements Summary

| Capability | Journey 1 (Solo) | Journey 2 (Coop) | Journey 3 (Créateur) |
|---|---|---|---|
| Installation système | ✅ | ✅ | ✅ |
| Création Actor Soldier | ✅ | ✅ | ✅ |
| Compendium classes | ✅ | ✅ | ✅ |
| Fiche interactive | ✅ | ✅ | ✅ |
| Jet D20 dans le chat | ✅ | ✅ | ✅ |
| Multi-joueurs | — | ✅ | — |
| Éditeur de scènes | — | — | ✅ (natif Foundry) |

## Technical Requirements

### Architecture

- **Langage :** JavaScript ESM natif (pas de TypeScript, pas de bundler — convention V13)
- **Plateforme cible :** FoundryVTT V13 exclusivement
- **API Surface :** TypeDataModel pour les schémas de données, ApplicationV2/DocumentSheetV2 pour les fiches, Roll API pour les jets D20
- **Installation :** Manifest system.json hébergé, installation en un clic via le hub FoundryVTT
- **Structure de données :** 1 Actor type (Soldier), 2 Item types (Class, Weapon), compendiums JSON

### Distribution

- Package distribué via le hub FoundryVTT (manifest URL)
- system.json conforme aux spécifications V13
- Assets images (cartes de classes) embarqués dans le package
- Aucune dépendance externe requise

### Data Model

- **Actor Soldier :** HP, AP (2), conditions, classe assignée, armes équipées
- **Item Class :** nom, tier, stats, image de carte, armes par défaut
- **Item Weapon :** nom, type (Primary/Secondary/Sidearm), portée, dégâts, modificateurs
- **Compendiums :** 30 classes joueur pré-remplies avec images et données

### Implementation Patterns

- ESM imports, no globals, CSS Layers (patterns V13)
- Hooks Foundry natifs (renderActorSheet, preCreateItem, etc.)
- Roll API native pour compatibilité chat et Dice So Nice
- Images JPG existantes dans le répertoire V2

## Functional Requirements

### System Foundation

- FR1: Le système peut s'installer sur FoundryVTT V13 en un clic depuis le hub
- FR2: Le système peut se charger sans erreur et enregistrer ses types de documents (Actor Soldier, Item Class, Item Weapon)
- FR3: Le système peut afficher ses compendiums dans la sidebar FoundryVTT

### Actor Management

- FR4: Le joueur peut créer un Actor de type Soldier
- FR5: Le joueur peut assigner une classe à un Actor Soldier via drag & drop depuis le compendium
- FR6: Le joueur peut voir la fiche de classe interactive avec l'image de la carte originale et les stats
- FR7: Le joueur peut modifier les valeurs d'état de son Actor (HP, AP, conditions)
- FR8: Le joueur peut équiper et déséquiper des armes sur son Actor

### Item Management

- FR9: Le système peut stocker des Items de type Class avec nom, tier, stats et image de carte
- FR10: Le système peut stocker des Items de type Weapon avec nom, type, portée, dégâts et modificateurs
- FR11: Le joueur peut créer des Items Class et Weapon manuellement
- FR12: Le joueur peut glisser des Items depuis les compendiums vers un Actor

### Combat & Dice

- FR13: Le joueur peut lancer un jet de D20 depuis la fiche de son Actor
- FR14: Le système peut afficher le résultat du jet dans le chat FoundryVTT avec les détails (modificateurs, résultat)
- FR15: Le joueur peut effectuer un jet de tir en sélectionnant une arme équipée
- FR16: Le système peut appliquer les modificateurs d'arme au jet de combat

### Compendiums & Content

- FR17: Le système peut fournir un compendium pré-rempli des 30 classes joueur
- FR18: Chaque entrée de compendium peut afficher l'image de la carte de classe originale
- FR19: Le système peut fournir un compendium des armes du jeu
- FR20: Le joueur peut parcourir et rechercher dans les compendiums

### Token & Scene Integration

- FR21: Le joueur peut placer un token Actor Soldier sur une scène FoundryVTT
- FR22: Le token peut afficher les informations de base de l'Actor (nom, HP)

## Non-Functional Requirements

### Performance

- Les fiches d'Actor doivent s'ouvrir en < 500ms, mesuré via Performance API du navigateur
- Les jets de D20 doivent s'afficher dans le chat en < 1 seconde, mesuré via Performance API du navigateur
- Le chargement du système ne doit pas ralentir le démarrage du monde Foundry de plus de 2 secondes, mesuré via console navigateur
- Les compendiums doivent être navigables en < 200ms par interaction, mesuré via Performance API du navigateur

### Integration

- Compatible exclusivement avec FoundryVTT V13
- Compatible avec le module Dice So Nice (jets 3D)
- Les compendiums doivent fonctionner avec le système de recherche natif de Foundry
- Les tokens doivent être compatibles avec Token Drag Measurement (V13)
- Le système ne doit pas interférer avec les modules Dice So Nice et Token Drag Measurement
