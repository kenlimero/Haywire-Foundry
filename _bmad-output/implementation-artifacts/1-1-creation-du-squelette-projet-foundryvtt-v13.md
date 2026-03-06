# Story 1.1: Création du squelette projet FoundryVTT V13

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a développeur,
I want créer la structure de fichiers et le manifest system.json du système Haywire,
so that le système s'installe et se charge sur FoundryVTT V13.

## Acceptance Criteria

1. **Given** un serveur FoundryVTT V13 sans le système Haywire installé **When** le système est installé via le manifest system.json **Then** FoundryVTT reconnaît "Haywire" comme système disponible
2. **Given** le système Haywire installé **When** un monde utilisant ce système est lancé **Then** le système se charge sans erreur console (0 erreurs)
3. **Given** le système Haywire chargé **When** on inspecte les types de documents enregistrés **Then** les types Actor (soldier) et Item (class, weapon) sont enregistrés dans CONFIG
4. **Given** le système chargé **When** le fichier haywire.mjs est exécuté **Then** le `Hooks.once("init")` s'exécute avec les registrations des document types, data models et sheets
5. **Given** le système Haywire installé **When** on ouvre la sidebar Compendiums **Then** les compendiums "Classes" et "Armes" apparaissent (vides à ce stade)
6. **Given** le système chargé **When** on vérifie les langues **Then** les fichiers lang/en.json et lang/fr.json sont chargés avec les clés minimales (titre du système, noms des compendiums)

## Tasks / Subtasks

- [x] Task 1 — Créer le fichier system.json conforme V13 (AC: #1, #5, #6)
  - [x] 1.1 Définir les métadonnées (id: "haywire", title, version, compatibility V13)
  - [x] 1.2 Déclarer `esmodules: ["haywire.mjs"]`
  - [x] 1.3 Déclarer `styles: ["styles/haywire.css"]`
  - [x] 1.4 Déclarer `documentTypes` avec Actor.soldier et Item.class, Item.weapon
  - [x] 1.5 Déclarer `packs` pour les compendiums classes et weapons
  - [x] 1.6 Déclarer `languages` pour en.json et fr.json
  - [x] 1.7 Configurer `primaryTokenAttribute` pour les barres HP
  - [x] 1.8 Configurer `initiative: "1d20"`
- [x] Task 2 — Créer le point d'entrée haywire.mjs (AC: #2, #3, #4)
  - [x] 2.1 Implémenter `Hooks.once("init")` avec registration des document classes
  - [x] 2.2 Enregistrer `CONFIG.Actor.documentClass` et `CONFIG.Item.documentClass`
  - [x] 2.3 Enregistrer `CONFIG.Actor.dataModels` et `CONFIG.Item.dataModels`
  - [x] 2.4 Enregistrer les sheets via `DocumentSheetConfig.registerSheet()`
  - [x] 2.5 Configurer `CONFIG.Actor.trackableAttributes` pour les barres token
  - [x] 2.6 Appeler `loadTemplates()` pour pré-charger les templates HBS
  - [x] 2.7 Ajouter un `console.log("haywire | Système initialisé")` de confirmation
- [x] Task 3 — Créer la structure de dossiers complète (AC: #2)
  - [x] 3.1 Créer `module/models/` avec fichiers stub (soldier-model.mjs, class-model.mjs, weapon-model.mjs)
  - [x] 3.2 Créer `module/documents/` avec stubs (haywire-actor.mjs, haywire-item.mjs)
  - [x] 3.3 Créer `module/sheets/` avec stubs (soldier-sheet.mjs, class-sheet.mjs, weapon-sheet.mjs)
  - [x] 3.4 Créer `module/rolls/` (vide)
  - [x] 3.5 Créer `module/helpers/` (vide)
  - [x] 3.6 Créer `templates/actor/`, `templates/item/`, `templates/chat/` avec fichiers HBS minimaux
  - [x] 3.7 Créer `styles/haywire.css` avec `@layer haywire {}` vide
  - [x] 3.8 Créer `packs/classes/` et `packs/weapons/` (dossiers vides pour LevelDB)
  - [x] 3.9 Créer `assets/cards/` (dossier vide pour les images futures)
- [x] Task 4 — Créer les fichiers de localisation (AC: #6)
  - [x] 4.1 Créer `lang/en.json` avec clés minimales (HAYWIRE.System, HAYWIRE.CompendiumClasses, HAYWIRE.CompendiumWeapons, noms de types)
  - [x] 4.2 Créer `lang/fr.json` avec traductions françaises correspondantes
- [x] Task 5 — Créer les stubs de data models (AC: #3, #4)
  - [x] 5.1 `soldier-model.mjs` : SoldierModel extends TypeDataModel avec defineSchema() (hitPoints, actionPoints, classId)
  - [x] 5.2 `class-model.mjs` : ClassModel extends TypeDataModel avec defineSchema() (tier, imagePath)
  - [x] 5.3 `weapon-model.mjs` : WeaponModel extends TypeDataModel avec defineSchema() (weaponType, range, damage, modifiers)
- [x] Task 6 — Créer les stubs de documents custom (AC: #3, #4)
  - [x] 6.1 `haywire-actor.mjs` : HaywireActor extends Actor avec prepareData() passthrough
  - [x] 6.2 `haywire-item.mjs` : HaywireItem extends Item avec prepareData() passthrough
- [x] Task 7 — Créer les stubs de sheets (AC: #4)
  - [x] 7.1 `soldier-sheet.mjs` : SoldierSheet extends HandlebarsApplicationMixin(ActorSheetV2)
  - [x] 7.2 `class-sheet.mjs` : ClassSheet extends HandlebarsApplicationMixin(ItemSheetV2)
  - [x] 7.3 `weapon-sheet.mjs` : WeaponSheet extends HandlebarsApplicationMixin(ItemSheetV2)
  - [x] 7.4 Templates HBS minimaux correspondants (affichage basique du nom et stats)
- [ ] Task 8 — Vérification manuelle (AC: #1-#6) — REQUIERT TEST DANS FOUNDRY
  - [ ] 8.1 Copier/lier le dossier dans le Data/systems/ de FoundryVTT
  - [ ] 8.2 Créer un monde test, vérifier 0 erreurs console
  - [ ] 8.3 Vérifier que les compendiums apparaissent dans la sidebar
  - [ ] 8.4 Vérifier que les types Actor/Item sont disponibles à la création

## Dev Notes

### Décisions architecturales critiques

- **Zéro dépendance externe, zéro bundler** — le code source EST le code distribué. Pas de npm, pas de build step.
- **JavaScript ESM natif** exclusivement (`.mjs`). Pas de TypeScript, pas de CommonJS.
- **Structure manuelle V13** — aucun starter template utilisé (Asacolips est obsolète pour V13).
- **Un fichier = une responsabilité** — pas de fichiers monolithiques "utils.mjs" ou "data-models.mjs".

### Patterns V13 obligatoires

**Registration Pattern dans haywire.mjs :**
```javascript
import { SoldierModel } from "./module/models/soldier-model.mjs";
import { ClassModel } from "./module/models/class-model.mjs";
import { WeaponModel } from "./module/models/weapon-model.mjs";
import { HaywireActor } from "./module/documents/haywire-actor.mjs";
import { HaywireItem } from "./module/documents/haywire-item.mjs";
import { SoldierSheet } from "./module/sheets/soldier-sheet.mjs";
import { ClassSheet } from "./module/sheets/class-sheet.mjs";
import { WeaponSheet } from "./module/sheets/weapon-sheet.mjs";

Hooks.once("init", () => {
  // Document classes
  CONFIG.Actor.documentClass = HaywireActor;
  CONFIG.Item.documentClass = HaywireItem;

  // Data models — clés = noms des sous-types dans system.json > documentTypes
  CONFIG.Actor.dataModels = {
    soldier: SoldierModel,
  };
  CONFIG.Item.dataModels = {
    class: ClassModel,
    weapon: WeaponModel,
  };

  // Sheets — V13 utilise DocumentSheetConfig.registerSheet()
  DocumentSheetConfig.registerSheet(Actor, "haywire", SoldierSheet, {
    types: ["soldier"],
    makeDefault: true,
    label: "HAYWIRE.SheetSoldier",
  });
  DocumentSheetConfig.registerSheet(Item, "haywire", ClassSheet, {
    types: ["class"],
    makeDefault: true,
    label: "HAYWIRE.SheetClass",
  });
  DocumentSheetConfig.registerSheet(Item, "haywire", WeaponSheet, {
    types: ["weapon"],
    makeDefault: true,
    label: "HAYWIRE.SheetWeapon",
  });

  // Token bar attributes
  CONFIG.Actor.trackableAttributes = {
    soldier: {
      bar: ["hitPoints"],
      value: ["actionPoints"],
    },
  };

  // Pré-chargement templates
  loadTemplates([
    "systems/haywire/templates/actor/soldier-sheet.hbs",
    "systems/haywire/templates/item/class-sheet.hbs",
    "systems/haywire/templates/item/weapon-sheet.hbs",
  ]);

  console.log("haywire | Système Haywire initialisé");
});
```

**system.json — format V13 :**
```json
{
  "id": "haywire",
  "title": "Haywire",
  "description": "Système FoundryVTT pour le wargame tactique solo/coop HAYWIRE V2",
  "version": "0.1.0",
  "compatibility": {
    "minimum": "13",
    "verified": "13",
    "maximum": "13"
  },
  "authors": [{ "name": "Ricco" }],
  "esmodules": ["haywire.mjs"],
  "styles": ["styles/haywire.css"],
  "languages": [
    { "lang": "en", "name": "English", "path": "lang/en.json" },
    { "lang": "fr", "name": "Français", "path": "lang/fr.json" }
  ],
  "documentTypes": {
    "Actor": {
      "soldier": {}
    },
    "Item": {
      "class": {},
      "weapon": {}
    }
  },
  "packs": [
    {
      "name": "classes",
      "label": "HAYWIRE.CompendiumClasses",
      "type": "Item",
      "system": "haywire"
    },
    {
      "name": "weapons",
      "label": "HAYWIRE.CompendiumWeapons",
      "type": "Item",
      "system": "haywire"
    }
  ],
  "primaryTokenAttribute": "hitPoints",
  "initiative": "1d20",
  "grid": { "distance": 1, "units": "" },
  "socket": false
}
```

**Sheet V13 — pattern obligatoire :**
```javascript
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class SoldierSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/actor/soldier-sheet.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "actor", "soldier"],
    position: { width: 600, height: 400 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    return context;
  }
}
```

**TypeDataModel V13 — pattern obligatoire :**
```javascript
export class SoldierModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      hitPoints: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 10 }),
        max: new fields.NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      }),
      actionPoints: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
      classId: new fields.StringField({ required: false, blank: true, initial: "" }),
    };
  }
}
```

### Changements V13 CRITIQUES à respecter

| Ancien (V11/V12) | Nouveau (V13) |
|---|---|
| `template.json` pour types | `documentTypes` dans system.json (Record<string, object>) |
| `Actors.registerSheet(...)` | `DocumentSheetConfig.registerSheet(Actor, ...)` |
| `getData(options)` | `async _prepareContext(options)` |
| `activateListeners(html)` (jQuery) | `_onRender(context, options)` (DOM natif) |
| Single `template` property | Static `PARTS` object (multi-templates) |
| `this.element.find(...)` | `this.element.querySelector(...)` |
| `document.data` | `document.system` |

### Conventions de nommage obligatoires

- **Fichiers :** `kebab-case.mjs` (ex: `soldier-model.mjs`)
- **Classes :** `PascalCase` avec préfixe `Haywire` pour documents/sheets (ex: `HaywireActor`, `SoldierSheet`)
- **Champs data model :** `camelCase` (ex: `hitPoints`, `actionPoints`, `classId`)
- **CSS :** `@layer haywire`, sélecteurs `.haywire-*`, variables `--haywire-*`
- **Constantes :** `UPPER_SNAKE_CASE` (ex: `SYSTEM_ID`)
- **i18n :** Préfixe `HAYWIRE.` pour toutes les clés de traduction

### Anti-patterns à éviter ABSOLUMENT

- **NE PAS** créer un fichier `template.json` — déprécié en V13
- **NE PAS** utiliser l'ancienne API `ActorSheet` (AppV1) — utiliser `ActorSheetV2`
- **NE PAS** utiliser jQuery — utiliser les APIs DOM natives
- **NE PAS** utiliser `document.data` — utiliser `document.system`
- **NE PAS** importer de dépendance externe (npm, CDN)
- **NE PAS** utiliser `Actors.registerSheet()` — utiliser `DocumentSheetConfig.registerSheet()`
- **NE PAS** mettre de logique métier dans les sheets
- **NE PAS** appeler `this.update()` dans `prepareDerivedData()` (boucle infinie)

### Project Structure Notes

Structure cible complète à créer :
```
haywire/
├── system.json
├── haywire.mjs
├── module/
│   ├── models/
│   │   ├── soldier-model.mjs
│   │   ├── class-model.mjs
│   │   └── weapon-model.mjs
│   ├── documents/
│   │   ├── haywire-actor.mjs
│   │   └── haywire-item.mjs
│   ├── sheets/
│   │   ├── soldier-sheet.mjs
│   │   ├── class-sheet.mjs
│   │   └── weapon-sheet.mjs
│   ├── rolls/
│   └── helpers/
├── templates/
│   ├── actor/
│   │   └── soldier-sheet.hbs
│   ├── item/
│   │   ├── class-sheet.hbs
│   │   └── weapon-sheet.hbs
│   └── chat/
│       └── roll-result.hbs
├── styles/
│   └── haywire.css
├── packs/
│   ├── classes/
│   └── weapons/
├── assets/
│   └── cards/
└── lang/
    ├── en.json
    └── fr.json
```

- Le dossier racine du système DOIT s'appeler `haywire` (= id du system.json)
- Les images de cartes de classe seront dans `assets/cards/` au format `kebab-case.jpg`
- Les compendiums V13 utilisent LevelDB — les dossiers `packs/classes/` et `packs/weapons/` resteront vides jusqu'au remplissage via Foundry CLI ou UI

### Informations techniques V13 récentes

- **FoundryVTT V13 stable** est la version cible (compatibility verified: 13)
- **DocumentSheetV2** a remplacé les anciennes classes de sheets — V13 a SUPPRIMÉ les registrations par défaut, il faut OBLIGATOIREMENT appeler `DocumentSheetConfig.registerSheet()`
- **PARTS** remplace le single `template` — chaque PART est un chunk HTML indépendant avec son propre template
- **`_prepareContext()`** doit être `async` pour supporter `TextEditor.enrichHTML()`
- **Compendiums** : pas besoin de `path` dans system.json — Foundry gère automatiquement les fichiers LevelDB dans `packs/<name>/`
- **Foundry CLI** (`@foundryvtt/foundryvtt-cli`) : utile pour `fvtt package pack/unpack` des compendiums, mais pas nécessaire pour cette story (compendiums vides)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — Décision structure manuelle V13
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — Data models, injection, rolls
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Naming, structure, communication patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — Structure complète et boundaries
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — Acceptance criteria originaux
- [Source: _bmad-output/planning-artifacts/prd.md#Technical Requirements] — Contraintes techniques
- [Source: FoundryVTT V13 API — TypeDataModel] — https://foundryvtt.com/api/classes/foundry.abstract.TypeDataModel.html
- [Source: FoundryVTT V13 API — DocumentSheetV2] — https://foundryvtt.com/api/classes/foundry.applications.api.DocumentSheetV2.html
- [Source: FoundryVTT V13 API — ActorSheetV2] — https://foundryvtt.com/api/classes/foundry.applications.sheets.ActorSheetV2.html
- [Source: FoundryVTT V13 API — HandlebarsApplicationMixin] — https://foundryvtt.com/api/functions/foundry.applications.api.HandlebarsApplicationMixin.html
- [Source: FoundryVTT V13 System Development Guide] — https://foundryvtt.com/article/system-development/
- [Source: FoundryVTT V13 System Data Models Guide] — https://foundryvtt.com/article/system-data-models/

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Tous les fichiers JSON validés avec python3 json.tool : VALID
- Tous les fichiers MJS validés avec node --check : SYNTAX OK
- Structure de dossiers vérifiée via find : conforme à l'architecture

### Completion Notes List

- Tasks 1-7 complétées : squelette système FoundryVTT V13 complet
- system.json V13 avec documentTypes (pas template.json), esmodules, styles, packs, languages
- haywire.mjs : registration pattern V13 complet (CONFIG.Actor/Item.documentClass, dataModels, DocumentSheetConfig.registerSheet, trackableAttributes, loadTemplates)
- 3 TypeDataModels : SoldierModel (hitPoints, actionPoints, classId), ClassModel (tier, imagePath), WeaponModel (weaponType, range, damage, modifiers)
- 2 Documents custom : HaywireActor, HaywireItem avec lifecycle passthrough
- 3 Sheets V13 : SoldierSheet (ActorSheetV2), ClassSheet (ItemSheetV2), WeaponSheet (ItemSheetV2) — toutes avec HandlebarsApplicationMixin, PARTS, DEFAULT_OPTIONS, _prepareContext
- 4 Templates HBS : soldier-sheet, class-sheet, weapon-sheet, roll-result (chat)
- CSS Layer : @layer haywire (stub)
- i18n : en.json et fr.json avec clés HAYWIRE.*
- Task 8 (vérification manuelle dans FoundryVTT) reste à effectuer par l'utilisateur

### Senior Developer Review

**Review Date:** 2026-03-04
**Reviewer Model:** Claude Opus 4.6 (fresh context)
**Result:** PASS — All issues fixed automatically

**Issues Found & Fixed:**
| # | Severity | Description | Fix Applied |
|---|----------|-------------|-------------|
| H1 | HIGH | weapon-sheet.hbs — labels d'arme en dur au lieu de i18n | Remplacé par `{{localize "HAYWIRE.WeaponType.*"}}` |
| H2 | HIGH | Templates incomplets — champs du schema manquants | Ajouté tous les champs manquants aux 3 templates |
| M1 | MEDIUM | WeaponModel choices format incorrect | Converti de array à object avec clés i18n |
| M2 | MEDIUM | prepareData() redondant dans documents | Supprimé, gardé uniquement prepareBaseData/prepareDerivedData |
| M3 | MEDIUM | Clés i18n TYPES.* manquantes | Ajouté TYPES.Actor.soldier, TYPES.Item.class, TYPES.Item.weapon |
| M4 | MEDIUM | FilePathField avec initial: "" invalide | Supprimé le paramètre initial |

**Action Items:** 0

### Change Log

- 2026-03-04 : Création initiale du squelette système FoundryVTT V13 (Tasks 1-7)
- 2026-03-04 : Code review — 6 issues (2 HIGH, 4 MEDIUM) corrigées automatiquement

### File List

- system.json (NEW)
- haywire.mjs (NEW)
- module/models/soldier-model.mjs (NEW)
- module/models/class-model.mjs (NEW, MODIFIED — M4 fix)
- module/models/weapon-model.mjs (NEW, MODIFIED — M1 fix)
- module/documents/haywire-actor.mjs (NEW, MODIFIED — M2 fix)
- module/documents/haywire-item.mjs (NEW, MODIFIED — M2 fix)
- module/sheets/soldier-sheet.mjs (NEW)
- module/sheets/class-sheet.mjs (NEW)
- module/sheets/weapon-sheet.mjs (NEW)
- templates/actor/soldier-sheet.hbs (NEW, MODIFIED — H2 fix)
- templates/item/class-sheet.hbs (NEW, MODIFIED — H2 fix)
- templates/item/weapon-sheet.hbs (NEW, MODIFIED — H1, H2 fix)
- templates/chat/roll-result.hbs (NEW)
- styles/haywire.css (NEW)
- lang/en.json (NEW, MODIFIED — M3 fix)
- lang/fr.json (NEW, MODIFIED — M3 fix)
- packs/classes/ (NEW - empty dir)
- packs/weapons/ (NEW - empty dir)
- assets/cards/ (NEW - empty dir)
- module/rolls/ (NEW - empty dir)
- module/helpers/ (NEW - empty dir)
