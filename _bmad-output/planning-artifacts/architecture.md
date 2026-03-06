---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-04'
inputDocuments:
  - prd.md
  - product-brief-Haywire-Foundry-2026-03-04.md
  - brainstorming-session-2026-03-04-1500.md
workflowType: 'architecture'
project_name: 'Haywire-Foundry'
user_name: 'Ricco'
date: '2026-03-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
22 FRs organisés en 6 capability areas : System Foundation (3), Actor Management (5), Item Management (4), Combat & Dice (4), Compendiums & Content (4), Token & Scene Integration (2). Le mécanisme central est l'injection de classe (Item Class → Actor Soldier) qui pilote stats, armes et affichage de la fiche.

**Non-Functional Requirements:**
- Performance : fiches < 500ms, jets < 1s, chargement < 2s, compendiums < 200ms
- Integration : FoundryVTT V13 exclusif, compatible Dice So Nice et Token Drag Measurement
- Zéro dépendance externe, zéro interférence avec modules tiers

**Scale & Complexity:**
- Primary domain : Plugin/système FoundryVTT V13 (JavaScript ESM)
- Complexity level : Medium
- Estimated architectural components : ~8 modules

### Technical Constraints & Dependencies

- FoundryVTT V13 API exclusivement (TypeDataModel, ApplicationV2, DocumentSheetV2, Roll API, Cards API future)
- JavaScript ESM natif — pas de TypeScript, pas de bundler (convention V13)
- CSS Layers pour le theming (convention V13)
- Images JPG des cartes de classe existantes dans le répertoire V2 du jeu physique
- system.json conforme aux spécifications V13 pour distribution via le hub

### Cross-Cutting Concerns Identified

- **Injection de classe** — Le drag-drop d'un Item Class sur un Actor Soldier doit propager stats, armes par défaut et image. Affecte Actor Management, Item Management, et Compendiums.
- **Pipeline de jets D20** — La Roll API est utilisée par Combat & Dice mais doit être extensible pour les phases futures (détection, alerte, OPFOR). Les jets doivent être visibles dans le chat et compatibles Dice So Nice.
- **Assets images** — Les 30 cartes de classe JPG doivent être embarquées dans le package et référencées par les Items Class et les compendiums. Gestion des chemins d'assets.
- **Extensibilité post-MVP** — L'architecture doit supporter les ajouts futurs (OPFOR, Cards API, conditions automatisées) sans refactoring majeur.

## Starter Template Evaluation

### Primary Technology Domain

Plugin/Système FoundryVTT V13 (JavaScript ESM) — domaine spécialisé sans framework web générique.

### Starter Options Considered

**1. Asacolips Boilerplate (v2.0.1, mai 2024)**
- Starter communautaire le plus connu pour FoundryVTT
- Cible Foundry v11, utilise template.json, Handlebars, ancien framework Application
- Non compatible V13 : pas d'ApplicationV2, pas d'ESM natif, pas de CSS Layers
- Statut : Obsolète pour un projet V13-only

**2. Simple Worldbuilding (v0.8.2, juin 2023)**
- Système officiel Foundry pour prototypage
- APIs pre-V13, structure datée
- Statut : Non adapté comme base de code

**3. Structure manuelle V13 (approche custom)**
- Basée sur la documentation officielle FoundryVTT V13 et les guides API
- Utilise nativement TypeDataModel, ApplicationV2/DocumentSheetV2, ESM, CSS Layers
- Aucune dette technique héritée d'anciennes versions
- Statut : Recommandé

### Selected Starter: Structure manuelle V13

**Rationale for Selection:**
Aucun starter communautaire n'est à jour pour FoundryVTT V13. Le boilerplate Asacolips cible v11 et nécessiterait une réécriture complète pour utiliser ApplicationV2, TypeDataModel et ESM. La structure officielle documentée par Foundry est minimale (~6 fichiers) et correspond exactement à nos contraintes : zéro dépendance, zéro bundler, APIs V13 natives.

**Initialization Command:**

```bash
# Pas de CLI — création manuelle de la structure V13
mkdir -p systems/haywire/{module/sheets,styles,packs,lang,assets/cards,templates}
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
JavaScript ESM natif — un point d'entrée `haywire.mjs` déclaré dans `esmodules` du system.json

**Styling Solution:**
CSS Layers (convention V13) — fichiers CSS dans `styles/`, déclarés dans `styles` du system.json

**Build Tooling:**
Aucun — pas de bundler, pas de transpiler, édition directe des fichiers source

**Testing Framework:**
À définir à l'étape des décisions architecturales (Quench pour tests in-Foundry ou tests unitaires externes)

**Code Organization:**

```
haywire/
├── system.json              # Manifest V13
├── haywire.mjs              # Point d'entrée ESM
├── module/
│   ├── data-models.mjs      # TypeDataModel (Soldier, Class, Weapon)
│   ├── documents.mjs        # Custom Actor/Item classes
│   └── sheets/
│       ├── soldier-sheet.mjs  # ActorSheetV2
│       ├── class-sheet.mjs    # DocumentSheetV2
│       └── weapon-sheet.mjs   # DocumentSheetV2
├── styles/
│   └── haywire.css           # CSS Layers
├── templates/                # HTML templates (Handlebars ou HTML partials)
├── packs/                    # Compendiums (30 classes, armes)
├── assets/
│   └── cards/                # 30 images JPG des cartes de classe
└── lang/
    ├── en.json
    └── fr.json
```

**Development Experience:**
Édition directe dans le dossier `Data/systems/` de FoundryVTT — rechargement via F5 ou hot-reload natif V13

**Note:** La création de cette structure sera la première story d'implémentation.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data model granularity et stratégie de validation
- Mécanisme d'injection de classe (cross-cutting concern #1)
- Pipeline de jets D20 (cross-cutting concern #2)
- Organisation des sheets ApplicationV2

**Important Decisions (Shape Architecture):**
- Gestion des assets images
- Stratégie de testing
- Convention d'error handling

**Deferred Decisions (Post-MVP):**
- Cards API integration (Phase 2)
- Conditions automatisées pipeline
- OPFOR Actor type et IA comportementale
- Système de scènes pré-configurées

### Data Architecture

**Data Model Granularity:**
- Décision : Un fichier ESM par TypeDataModel
- Fichiers : `soldier-model.mjs`, `class-model.mjs`, `weapon-model.mjs`
- Rationale : 3 modèles au MVP, mais extensibilité post-MVP (OPFOR, conditions) sans fichier monolithique
- Affects : module/, imports dans haywire.mjs

**Data Validation Strategy:**
- Décision : Validation hybride schema + prepare
- Schema TypeDataModel : types, required, choices, ranges (structure)
- prepareBaseData : valeurs par défaut, normalisation
- prepareDerivedData : calculs dérivés (stats effectives après injection classe)
- Rationale : Le schema attrape les erreurs de type, prepare gère la logique métier HAYWIRE

**Class Injection Mechanism:**
- Décision : Approche hybride référence + copie
- Référence : L'Actor Soldier stocke l'ID de l'Item Class source. Les stats de base (tier, HP max, AP, image carte) sont dérivées dans prepareDerivedData depuis la classe référencée
- Copie : Les armes par défaut de la classe sont copiées comme Items embarqués (owned Items) sur l'Actor, car un Soldier peut changer d'arme en jeu
- Mise à jour : Si la classe source est modifiée dans le compendium, les Soldiers existants reflètent automatiquement les nouvelles stats mais conservent leurs armes personnalisées
- Affects : Actor Management, Item Management, Compendiums, Sheets

### Authentication & Security

N/A — Gérée intégralement par le framework FoundryVTT (permissions utilisateur, ownership des documents, rôles GM/Player/Observer).

### API & Communication Patterns

**Error Handling Convention:**
- Décision : `ui.notifications` pour les erreurs utilisateur, `console.warn`/`console.error` pour le debug développeur
- Exemples : "Aucune classe assignée" → notification warning ; schema invalide → console.error
- Rationale : Convention standard FoundryVTT, familière aux utilisateurs et développeurs de modules

**Roll Pipeline Architecture:**
- Décision : Classe utilitaire `HaywireRoll` encapsulant la Roll API
- Pattern : `HaywireRoll.d20({actor, weapon, modifiers})` → construit la formule, évalue, envoie au chat
- Extensibilité : Méthode modulaire acceptant un objet options, permettant d'ajouter des types de jets (détection, alerte) sans modifier la signature
- Chat template : Template Handlebars dédié pour les messages de jet (affichage résultat + contexte arme)
- Affects : Combat & Dice, compatible Dice So Nice (Roll API native = support automatique)

### Frontend Architecture

**Sheet Architecture:**
- Décision : DocumentSheetV2 pour toutes les fiches
- SoldierSheet extends ActorSheetV2 — fiche principale avec image carte, stats, armes, bouton jet D20
- ClassSheet extends DocumentSheetV2 — édition des données de classe (stats, armes par défaut, image)
- WeaponSheet extends DocumentSheetV2 — édition des propriétés d'arme
- Rationale : ApplicationV2 est le framework natif V13, pas de legacy à supporter

**Template Strategy:**
- Décision : Templates Handlebars (`.hbs`) dans `templates/`
- Structure : `templates/actor/soldier-sheet.hbs`, `templates/item/class-sheet.hbs`, `templates/item/weapon-sheet.hbs`, `templates/chat/roll-result.hbs`
- Rationale : Handlebars est le moteur de templates natif de Foundry, documenté et supporté

**Styling Architecture:**
- Décision : CSS Layers avec un seul fichier `haywire.css`
- Layer : `@layer haywire { ... }` pour isolation du scope
- Variables CSS pour les couleurs du thème HAYWIRE (vert militaire, tons sombres)
- Rationale : Convention V13, évite les conflits CSS avec Foundry core et les modules tiers

### Infrastructure & Deployment

**Distribution:**
- Décision : Package système via system.json + releases GitHub
- Le manifest pointe vers les releases tagguées
- Installation en un clic depuis le hub FoundryVTT
- Rationale : Circuit standard de distribution FoundryVTT

**Testing Strategy:**
- Décision : Tests manuels in-Foundry pour le MVP
- Pas de framework de test automatisé au MVP (overhead disproportionné pour ~8 modules)
- Checklist de test basée sur les User Journeys du PRD (Marc, Sophie, Alex)
- Post-MVP : Évaluer Quench pour tests automatisés in-Foundry si la complexité augmente
- Rationale : Le système est testable uniquement dans un contexte Foundry en cours d'exécution

**Asset Management:**
- Décision : Images dans `assets/cards/` avec nommage normalisé
- Convention : `{class-name-kebab-case}.jpg` (ex: `assault-trooper.jpg`)
- Référence dans les Items Class via chemin relatif : `systems/haywire/assets/cards/{name}.jpg`
- Les 30 images sont embarquées dans le package distribué
- Affects : Compendiums, Class Items, Actor sheets (affichage carte)

### Decision Impact Analysis

**Implementation Sequence:**
1. Structure projet + system.json + haywire.mjs (squelette)
2. TypeDataModels (Soldier, Class, Weapon) avec validation schema
3. Custom Documents (HaywireActor, HaywireItem) avec prepareData
4. Sheets DocumentSheetV2 + templates Handlebars
5. Injection de classe (drag-drop + prepareDerivedData)
6. Pipeline de jets D20 (HaywireRoll + chat template)
7. Compendiums (30 classes + armes) + assets images
8. Token integration

**Cross-Component Dependencies:**
- Les Sheets dépendent des DataModels (données à afficher) et des Documents (méthodes métier)
- L'injection de classe dépend des DataModels Soldier et Class + du Document Actor
- Le pipeline D20 dépend du Document Actor (stats) et Item Weapon (modificateurs)
- Les Compendiums dépendent des DataModels Item Class et Weapon finalisés

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
8 domaines où des agents AI pourraient diverger dans un système FoundryVTT V13

### Naming Patterns

**File Naming:**
- Fichiers ESM : `kebab-case.mjs` (ex: `soldier-model.mjs`, `soldier-sheet.mjs`)
- Templates Handlebars : `kebab-case.hbs` (ex: `soldier-sheet.hbs`, `roll-result.hbs`)
- CSS : `haywire.css` (fichier unique)
- Assets images : `kebab-case.jpg` (ex: `assault-trooper.jpg`)

**Code Naming:**
- Classes : `PascalCase` (ex: `SoldierModel`, `SoldierSheet`, `HaywireRoll`)
- Fonctions/méthodes : `camelCase` (ex: `prepareDerivedData`, `rollD20Attack`)
- Constantes : `UPPER_SNAKE_CASE` (ex: `SYSTEM_ID`, `DEFAULT_HP`)
- Champs data model : `camelCase` (ex: `hitPoints`, `actionPoints`, `classId`)
- Variables locales : `camelCase`

**Préfixe système:**
- Toutes les classes exportées sont préfixées `Haywire` (ex: `HaywireActor`, `HaywireItem`, `HaywireRoll`)
- Exception : les data models utilisent le nom du type (ex: `SoldierModel`, `ClassModel`, `WeaponModel`)
- Rationale : Évite les collisions de noms avec Foundry core et les modules tiers

**CSS Naming:**
- Sélecteurs : `.haywire-{component}-{element}` (ex: `.haywire-sheet-header`, `.haywire-roll-result`)
- Variables CSS : `--haywire-{property}` (ex: `--haywire-color-primary`, `--haywire-font-size`)
- Layer : `@layer haywire`

### Structure Patterns

**Project Organization:**

```
module/
├── models/              # TypeDataModels (un fichier par type)
│   ├── soldier-model.mjs
│   ├── class-model.mjs
│   └── weapon-model.mjs
├── documents/           # Custom Document classes
│   ├── haywire-actor.mjs
│   └── haywire-item.mjs
├── sheets/              # DocumentSheetV2 (un fichier par sheet)
│   ├── soldier-sheet.mjs
│   ├── class-sheet.mjs
│   └── weapon-sheet.mjs
├── rolls/               # Roll utilities
│   └── haywire-roll.mjs
└── helpers/             # Handlebars helpers, utilitaires partagés
    └── handlebars-helpers.mjs

templates/
├── actor/
│   └── soldier-sheet.hbs
├── item/
│   ├── class-sheet.hbs
│   └── weapon-sheet.hbs
└── chat/
    └── roll-result.hbs
```

**Règle de structure :** Un module = un fichier = une responsabilité. Pas de fichiers "fourre-tout" ou "utils.mjs" générique.

### Format Patterns

**Data Model Schema Convention:**
- Chaque champ utilise les types natifs Foundry : `StringField`, `NumberField`, `SchemaField`, `ArrayField`
- Valeurs par défaut toujours explicites dans le schema (`initial: 0`, `initial: ""`)
- Pas de valeurs `null` dans les data models — utiliser des valeurs par défaut vides

**Template Data Convention:**
- Les sheets passent les données via `getData()` → objet plat, pas de nesting profond
- Variables template préfixées par contexte : `actor.system.hitPoints`, pas de raccourcis ambigus
- Helpers Handlebars pour la logique de présentation (ex: `{{formatDamage weapon}}`)

### Communication Patterns

**Hooks FoundryVTT:**
- Nommage : `haywire.{action}` (ex: `haywire.classInjected`, `haywire.rollCompleted`)
- Payload : toujours un objet `{actor, item, ...}` — jamais des arguments positionnels
- Rationale : Permet aux modules tiers de hook sur les événements HAYWIRE de manière stable

**Drag & Drop Convention:**
- Le handler `_onDropItem` dans SoldierSheet gère toute la logique d'injection de classe
- Validation du type d'Item dropé avant traitement
- Notification utilisateur via `ui.notifications` en cas d'erreur (ex: "Seuls les Items Class peuvent être assignés")

### Process Patterns

**Error Handling:**
- Erreurs utilisateur : `ui.notifications.warn("Message en français")` ou `.error()`
- Erreurs développeur : `console.error("haywire |", message)` avec préfixe système
- Jamais de `throw` silencieux — toujours notifier ou logger
- Messages utilisateur toujours en français (langue du jeu)

**Document Lifecycle:**
- `prepareBaseData()` : normalisation, valeurs par défaut, nettoyage
- `prepareDerivedData()` : calculs dérivés (stats effectives = classe + modifiers)
- `_onCreate()` / `_onUpdate()` / `_onDelete()` : effets de bord (ex: suppression d'armes quand une classe est retirée)
- Pas de logique métier dans les sheets — les sheets affichent, les documents calculent

**Registration Pattern dans haywire.mjs:**

```javascript
// Pattern d'enregistrement dans Hooks.once("init")
Hooks.once("init", () => {
  CONFIG.Actor.documentClass = HaywireActor;
  CONFIG.Item.documentClass = HaywireItem;
  // Enregistrement des data models dans documentTypes
  // Enregistrement des sheets
  // Chargement des templates Handlebars
  // Enregistrement des helpers Handlebars
});
```

### Enforcement Guidelines

**All AI Agents MUST:**
- Préfixer toutes les classes exportées avec `Haywire` (sauf data models)
- Utiliser `kebab-case` pour les fichiers, `camelCase` pour les champs de données
- Placer la logique métier dans les Documents, jamais dans les Sheets
- Utiliser `ui.notifications` pour les erreurs utilisateur, `console.error` pour le debug
- Respecter le lifecycle Foundry : schema → prepareBase → prepareDerived → render
- Ne jamais importer de dépendance externe — uniquement les APIs FoundryVTT V13

**Anti-Patterns:**
- `utils.mjs` ou `helpers.mjs` fourre-tout → créer un module spécifique par responsabilité
- Logique métier dans une sheet (calculs, validations) → déplacer dans le Document
- `document.update()` dans `prepareDerivedData()` → provoque des boucles infinies
- Accès direct à `document.data` → utiliser `document.system` (convention V13)
- CSS sans préfixe `.haywire-` → risque de collision avec Foundry core

## Project Structure & Boundaries

### Complete Project Directory Structure

```
haywire/
├── system.json                          # Manifest V13 (id, esmodules, styles, packs, documentTypes)
├── haywire.mjs                          # Point d'entrée ESM — Hooks.once("init"), registrations
├── module/
│   ├── models/                          # TypeDataModels
│   │   ├── soldier-model.mjs            # SoldierModel extends TypeDataModel
│   │   ├── class-model.mjs              # ClassModel extends TypeDataModel
│   │   └── weapon-model.mjs             # WeaponModel extends TypeDataModel
│   ├── documents/                       # Custom Document classes
│   │   ├── haywire-actor.mjs            # HaywireActor extends Actor — prepareData, injection
│   │   └── haywire-item.mjs             # HaywireItem extends Item — prepareData
│   ├── sheets/                          # DocumentSheetV2
│   │   ├── soldier-sheet.mjs            # SoldierSheet extends ActorSheetV2
│   │   ├── class-sheet.mjs              # ClassSheet extends DocumentSheetV2 (ItemSheet)
│   │   └── weapon-sheet.mjs             # WeaponSheet extends DocumentSheetV2 (ItemSheet)
│   ├── rolls/                           # Roll pipeline
│   │   └── haywire-roll.mjs             # HaywireRoll — encapsulation Roll API
│   └── helpers/                         # Utilitaires spécifiques
│       └── handlebars-helpers.mjs       # Helpers Handlebars (formatDamage, etc.)
├── templates/                           # Templates Handlebars
│   ├── actor/
│   │   └── soldier-sheet.hbs            # Fiche Soldier (image carte, stats, armes, jet D20)
│   ├── item/
│   │   ├── class-sheet.hbs              # Fiche Class (stats, armes défaut, image)
│   │   └── weapon-sheet.hbs             # Fiche Weapon (type, range, damage, modifiers)
│   └── chat/
│       └── roll-result.hbs              # Message de jet D20 dans le chat
├── styles/
│   └── haywire.css                      # CSS Layers (@layer haywire) — thème complet
├── packs/
│   ├── classes/                         # Compendium : 30 classes de soldats
│   └── weapons/                         # Compendium : armes du jeu
├── assets/
│   └── cards/                           # 30 images JPG des cartes de classe
│       ├── assault-trooper.jpg
│       ├── sniper.jpg
│       └── ...                          # (30 fichiers total)
└── lang/
    ├── en.json                          # Traductions anglais
    └── fr.json                          # Traductions français
```

### Architectural Boundaries

**Document Layer (module/documents/):**
- Toute logique métier HAYWIRE : calculs de stats, injection de classe, gestion des armes
- Interface exclusive avec la base Foundry (CRUD, prepareData lifecycle)
- Les Documents sont la seule couche autorisée à appeler `this.update()`, `this.createEmbeddedDocuments()`

**Model Layer (module/models/):**
- Définition pure des schemas de données (champs, types, valeurs initiales)
- Validation structurelle via les validators natifs TypeDataModel
- Pas de logique métier — uniquement la forme des données

**Presentation Layer (module/sheets/ + templates/):**
- Affichage et interaction utilisateur uniquement
- Les sheets appellent les méthodes des Documents, jamais de logique directe
- Les templates reçoivent des données pré-calculées, pas de calcul dans Handlebars

**Roll Layer (module/rolls/):**
- Encapsulation de la Roll API Foundry
- Construction des formules, évaluation, envoi au chat
- Isolé pour extensibilité post-MVP (nouveaux types de jets)

### Requirements to Structure Mapping

**FR Category → Files:**

| Capability Area | FRs | Fichiers principaux |
|---|---|---|
| System Foundation (FR1-3) | system.json, haywire.mjs | Squelette, manifest, registration |
| Actor Management (FR4-8) | soldier-model.mjs, haywire-actor.mjs, soldier-sheet.mjs/hbs | Création, fiche, stats, image |
| Item Management (FR9-12) | class-model.mjs, weapon-model.mjs, haywire-item.mjs, class-sheet.mjs/hbs, weapon-sheet.mjs/hbs | Classes, armes, édition |
| Combat & Dice (FR13-16) | haywire-roll.mjs, roll-result.hbs | Jets D20, modificateurs, chat |
| Compendiums (FR17-20) | packs/classes/, packs/weapons/, assets/cards/ | 30 classes, armes, images |
| Token & Scene (FR21-22) | haywire-actor.mjs (token config) | Token image, barres HP |

**Cross-Cutting Concerns → Files:**

| Concern | Fichiers impactés |
|---|---|
| Injection de classe | haywire-actor.mjs (prepareData + _onDropItem), soldier-sheet.mjs (drag-drop UI), class-model.mjs (données source) |
| Pipeline D20 | haywire-roll.mjs (logique), roll-result.hbs (affichage), soldier-sheet.mjs (bouton jet) |
| Assets images | assets/cards/*.jpg, class-model.mjs (champ imagePath), soldier-sheet.hbs (affichage carte) |
| i18n | lang/en.json, lang/fr.json, tous les templates (clés de traduction) |

### Data Flow

```
Compendium (Item Class)
    │
    ▼ drag-drop
SoldierSheet._onDropItem()
    │
    ▼ appel document
HaywireActor._onDropItem()
    ├── stocke classId dans system
    ├── copie armes par défaut → createEmbeddedDocuments("Item")
    └── trigger prepareData()
         │
         ▼
HaywireActor.prepareDerivedData()
    ├── lookup Item Class via classId
    ├── dérive stats (HP, AP, tier) depuis la classe
    └── met à jour image carte
         │
         ▼
SoldierSheet.getData() → render template
    └── soldier-sheet.hbs affiche stats, armes, image carte
         │
         ▼ clic bouton jet
HaywireRoll.d20({actor, weapon})
    ├── construit formule "1d20 + modifiers"
    ├── Roll.evaluate()
    └── ChatMessage.create() avec roll-result.hbs
```

### Development Workflow

**Setup développeur:**
1. Clone le repo dans `{userData}/Data/systems/haywire/`
2. Lancer FoundryVTT, créer un World avec le système Haywire
3. Éditer les fichiers source directement
4. F5 pour recharger — les changements ESM et CSS sont pris immédiatement

**Pas de build step** — le code source EST le code distribué.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Stack 100% FoundryVTT V13 natif — aucun conflit de versions ou de dépendances
- JavaScript ESM + TypeDataModel + ApplicationV2 + CSS Layers : toutes ces APIs font partie du même framework V13
- Zéro dépendance externe élimine tout risque d'incompatibilité

**Pattern Consistency:**
- Naming conventions uniformes : kebab-case fichiers, PascalCase classes, camelCase champs/méthodes
- Préfixe `Haywire` cohérent sur toutes les classes exportées (sauf models)
- Préfixe CSS `.haywire-` et `--haywire-` cohérent avec le layer `@layer haywire`
- Lifecycle document (schema → prepareBase → prepareDerived → render) respecté dans tous les patterns

**Structure Alignment:**
- Structure finale (étapes 5-6) avec sous-dossiers `models/`, `documents/`, `sheets/`, `rolls/`, `helpers/` est cohérente avec la décision "un fichier par responsabilité"
- Note : La structure de l'étape 3 (Code Organization) montrait des fichiers consolidés pré-décision — la structure finale des étapes 5-6 prévaut

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| FR | Couverture architecturale | Statut |
|---|---|---|
| FR1-3 (System Foundation) | system.json, haywire.mjs, registration pattern | ✅ |
| FR4-8 (Actor Management) | SoldierModel, HaywireActor, SoldierSheet, injection de classe | ✅ |
| FR9-12 (Item Management) | ClassModel, WeaponModel, HaywireItem, ClassSheet, WeaponSheet | ✅ |
| FR13-16 (Combat & Dice) | HaywireRoll, roll-result.hbs, Roll API pipeline | ✅ |
| FR17-20 (Compendiums) | packs/classes/, packs/weapons/, assets/cards/ | ✅ |
| FR21-22 (Token & Scene) | HaywireActor token config, primaryTokenAttribute | ✅ |

**Non-Functional Requirements Coverage:**

| NFR | Couverture architecturale | Statut |
|---|---|---|
| Performance fiches < 500ms | DocumentSheetV2 natif, pas de calcul dans les templates | ✅ |
| Performance jets < 1s | HaywireRoll encapsule Roll API natif | ✅ |
| Chargement < 2s | Zéro dépendance, ESM natif, pas de bundler | ✅ |
| Compendiums < 200ms | Compendiums natifs Foundry | ✅ |
| Compatible Dice So Nice | Roll API native = support automatique | ✅ |
| Compatible Token Drag Measurement | Token standard Foundry = support automatique | ✅ |
| Zéro interférence modules | CSS Layers isolé, préfixe haywire-, pas de monkey-patching | ✅ |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- Toutes les décisions critiques documentées avec rationale
- Pas de versions à vérifier (stack = FoundryVTT V13 uniquement)
- Patterns avec exemples concrets (code JavaScript, conventions CSS)

**Structure Completeness:**
- Arbre projet complet avec ~20 fichiers identifiés
- Chaque fichier a un rôle documenté et une classe associée
- Boundaries clairement définies entre 4 layers

**Pattern Completeness:**
- 8 catégories de conflit potentiel couvertes
- Anti-patterns documentés avec alternatives
- Registration pattern avec exemple de code

### Gap Analysis Results

**Critical Gaps:** 0

**Important Gaps:** 1
- Le format exact des compendiums (JSON source vs DB Foundry) n'est pas spécifié — les compendiums V13 utilisent des dossiers LevelDB, mais la création initiale peut se faire via l'UI Foundry puis export. Ce détail sera traité dans les stories d'implémentation.

**Nice-to-Have Gaps:** 2
- Pas de guide de contribution / onboarding développeur (pas nécessaire pour un projet solo MVP)
- Pas de spécification détaillée du thème CSS (couleurs exactes, typographie) — sera défini lors de l'implémentation UX

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium, ~8 modules)
- [x] Technical constraints identified (FoundryVTT V13 API only)
- [x] Cross-cutting concerns mapped (4 concerns)

**✅ Architectural Decisions**
- [x] Critical decisions documented (data models, injection, rolls, sheets)
- [x] Technology stack fully specified (JS ESM, V13 APIs)
- [x] Integration patterns defined (lifecycle, drag-drop, hooks)
- [x] Performance considerations addressed (natif Foundry, zéro overhead)

**✅ Implementation Patterns**
- [x] Naming conventions established (files, code, CSS)
- [x] Structure patterns defined (un fichier = une responsabilité)
- [x] Communication patterns specified (hooks, drag-drop, notifications)
- [x] Process patterns documented (error handling, lifecycle, registration)

**✅ Project Structure**
- [x] Complete directory structure defined (~20 fichiers)
- [x] Component boundaries established (4 layers)
- [x] Integration points mapped (data flow diagram)
- [x] Requirements to structure mapping complete (22 FRs → fichiers)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — architecture simple, stack homogène, patterns bien définis

**Key Strengths:**
- Zéro dépendance externe = zéro risque de breaking changes
- Stack homogène (tout FoundryVTT V13) = pas de conflits de versions
- Structure claire avec boundaries strictes = agents AI peuvent travailler sur des fichiers isolés
- Data flow documenté end-to-end = pas d'ambiguïté sur les interactions

**Areas for Future Enhancement:**
- Tests automatisés (Quench) quand la complexité augmente post-MVP
- Cards API integration (Phase 2)
- Thème CSS détaillé lors de l'implémentation UX
- Guide de contribution si le projet devient collaboratif

### Implementation Handoff

**AI Agent Guidelines:**
- Suivre toutes les décisions architecturales exactement comme documentées
- Utiliser les patterns d'implémentation de manière cohérente sur tous les composants
- Respecter la structure projet et les boundaries entre layers
- Référencer ce document pour toute question architecturale
- Logique métier dans les Documents, jamais dans les Sheets

**First Implementation Priority:**
Création du squelette projet : system.json + haywire.mjs + structure de dossiers + registration pattern minimal
