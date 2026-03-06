# Story 2.1: Fiche Soldier basique avec template

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a joueur,
I want créer un Actor Soldier et voir sa fiche avec les informations de base,
so that je puisse visualiser et gérer mon soldat.

## Acceptance Criteria

1. **Given** un monde Haywire chargé **When** le joueur crée un Actor de type Soldier **Then** la SoldierSheet s'ouvre avec le template soldier-sheet.hbs
2. **Given** un Actor Soldier ouvert **When** le joueur regarde la fiche **Then** la fiche affiche les champs HP (value/max), AP, conditions (modifiables)
3. **Given** un Actor Soldier sans classe assignée **When** la fiche s'affiche **Then** la zone image de carte affiche un placeholder (icône ou texte "Aucune classe assignée")
4. **Given** un Actor Soldier avec une classe assignée (classId valide) **When** la fiche s'affiche **Then** l'image de la carte de classe est affichée depuis le chemin imagePath de la classe
5. **Given** un Actor Soldier **When** la fiche s'affiche **Then** la liste des armes équipées (owned Items de type weapon) est affichée (vide initialement si pas de classe)
6. **Given** un Actor Soldier **When** la fiche est ouverte **Then** elle s'ouvre en < 500ms (NFR1)
7. **Given** un Actor Soldier avec la fiche ouverte **When** le joueur modifie une valeur (HP, AP) **Then** la valeur est sauvegardée automatiquement via submitOnChange
8. **Given** le système Haywire chargé **When** le CSS est inspecté **Then** le CSS utilise `@layer haywire` avec préfixes `.haywire-`

## Tasks / Subtasks

- [x] Task 1 — Enrichir le template soldier-sheet.hbs avec le layout complet (AC: #1, #2, #3, #5)
  - [x] 1.1 Structurer le template en sections : header (nom + image), stats (HP, AP), conditions, armes équipées
  - [x] 1.2 Section header : afficher le nom de l'Actor (`name` éditable) et la zone image de carte
  - [x] 1.3 Section image : si `classImage` existe → afficher l'image ; sinon → placeholder texte "Aucune classe assignée" avec icône
  - [x] 1.4 Section stats : inputs numériques pour HP value (name="system.hitPoints.value"), HP max (name="system.hitPoints.max", lecture seule — dérivé de la classe), AP (lecture seule — dérivé de HP)
  - [x] 1.5 Section conditions : afficher les conditions actives depuis `system.conditions` sous forme de badges/tags (lecture seule, gérées programmatiquement)
  - [x] 1.6 Section suppression : afficher le compteur de suppression (name="system.suppression") comme input numérique
  - [x] 1.7 Section armes : itérer sur `weapons` (owned Items de type weapon) et afficher nom, type, portée, rateOfFire pour chaque arme — liste vide si pas d'armes
  - [x] 1.8 Section combat stats : afficher les 3 seuils (Easy/Medium/Hard) si une classe est assignée — lecture seule (dérivés)
  - [x] 1.9 Utiliser `{{localize "HAYWIRE.*"}}` pour TOUS les labels (jamais de texte en dur)
  - [x] 1.10 Ne PAS inclure de balise `<form>` dans le template — DocumentSheetV2 gère le wrapper form automatiquement via `tag: "form"`

- [x] Task 2 — Enrichir SoldierSheet._prepareContext() pour fournir les données au template (AC: #2, #3, #4, #5)
  - [x] 2.1 Passer `actor`, `system` (= actor.system), `source` (= actor.toObject().system) dans le contexte
  - [x] 2.2 Résoudre l'image de classe : si `system.classId` → lookup `game.items.get(classId)` → extraire `imagePath` → passer comme `classImage`
  - [x] 2.3 Passer `className` : nom de la classe assignée (ou null)
  - [x] 2.4 Filtrer les owned Items de type "weapon" → passer comme `weapons` (Array)
  - [x] 2.5 Passer `conditions` comme Array depuis le Set pour itération dans le template
  - [x] 2.6 Passer `hasClass` (boolean) pour les conditions d'affichage dans le template
  - [x] 2.7 Passer `isEditable` depuis `this.isEditable` pour contrôler les inputs éditables

- [x] Task 3 — Implémenter le CSS de la fiche Soldier dans haywire.css (AC: #6, #8)
  - [x] 3.1 Définir les variables CSS du thème HAYWIRE dans `:root` à l'intérieur du `@layer haywire` : couleurs militaires (vert olive, kaki, tons sombres), typographie
  - [x] 3.2 Styler `.haywire-sheet-header` : layout flex, nom en grand, zone image à droite
  - [x] 3.3 Styler `.haywire-sheet-stats` : layout grid pour HP/AP avec inputs numériques stylés
  - [x] 3.4 Styler `.haywire-sheet-conditions` : badges colorés pour chaque condition active
  - [x] 3.5 Styler `.haywire-sheet-weapons` : liste des armes sous forme de tableau ou cartes
  - [x] 3.6 Styler `.haywire-sheet-combat` : affichage des 3 seuils combat (Easy/Medium/Hard)
  - [x] 3.7 Styler `.haywire-placeholder` : style pour le placeholder "Aucune classe assignée"
  - [x] 3.8 Vérifier que TOUS les sélecteurs sont préfixés `.haywire-` et dans `@layer haywire`
  - [x] 3.9 Objectif : fiche fonctionnelle et lisible, pas de polish final — design sobre militaire

- [x] Task 4 — Ajouter les clés i18n manquantes pour la fiche (AC: #2, #3)
  - [x] 4.1 Ajouter dans en.json/fr.json : `HAYWIRE.NoClassAssigned`, `HAYWIRE.EquippedWeapons`, `HAYWIRE.NoWeapons`, `HAYWIRE.DragClassHint` (les clés CombatStats.Label, Conditions.Label, Suppression existaient déjà)
  - [x] 4.2 Vérifier la cohérence avec les clés existantes (pas de doublons)

- [ ] Task 5 — Vérification manuelle dans FoundryVTT (AC: #1-#8) — REQUIERT TEST DANS FOUNDRY
  - [ ] 5.1 Créer un Actor Soldier, vérifier que la fiche s'ouvre avec le nouveau layout
  - [ ] 5.2 Vérifier l'affichage du placeholder "Aucune classe assignée"
  - [ ] 5.3 Vérifier que HP est modifiable et se sauvegarde automatiquement
  - [ ] 5.4 Vérifier que AP est en lecture seule (dérivé de HP)
  - [ ] 5.5 Créer un Item Weapon, le glisser manuellement sur l'Actor → vérifier qu'il apparaît dans la liste des armes
  - [ ] 5.6 Vérifier le CSS : pas de débordement, thème militaire visible, isolation `@layer haywire`
  - [ ] 5.7 Mesurer le temps d'ouverture de la fiche (NFR1 < 500ms)
  - [ ] 5.8 Vérifier 0 erreurs et 0 warnings de deprecation dans la console

## Dev Notes

### Contexte : code existant à modifier (PAS de nouveaux fichiers)

**IMPORTANT :** Tous les fichiers existent déjà depuis les Stories 1.1/1.2. Cette story MODIFIE les fichiers existants — **AUCUN nouveau fichier à créer.**

**État actuel des fichiers à modifier :**

| Fichier | État actuel | Ce qui doit changer |
|---|---|---|
| `templates/actor/soldier-sheet.hbs` | Template minimal (nom + HP/AP/classId basiques) | Réécrire avec layout complet (image, conditions, armes, combat stats) |
| `module/sheets/soldier-sheet.mjs` | `_prepareContext` minimal (actor + system) | Enrichir avec classImage, weapons, conditions, hasClass |
| `styles/haywire.css` | Stub vide `@layer haywire {}` | Implémenter le thème militaire complet pour la fiche |
| `lang/en.json` | 30+ clés existantes | Ajouter ~4 clés manquantes |
| `lang/fr.json` | Traductions FR complètes | Ajouter les traductions correspondantes |

**Fichiers à NE PAS modifier :**
- `module/models/soldier-model.mjs` — schema complet et correct
- `module/documents/haywire-actor.mjs` — logique prepareDerivedData complète
- `haywire.mjs` — registration pattern OK
- `system.json` — manifest OK

### Code source actuel — SoldierSheet (module/sheets/soldier-sheet.mjs)

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

### Code source actuel — Template (templates/actor/soldier-sheet.hbs)

```handlebars
<section class="haywire-sheet-body">
  <h1 class="haywire-sheet-title">{{actor.name}}</h1>

  <div class="haywire-sheet-stats">
    <div class="haywire-stat">
      <label>{{localize "HAYWIRE.HitPoints"}}</label>
      <input type="number" name="system.hitPoints.value" value="{{system.hitPoints.value}}" min="0" />
      <span>/ {{system.hitPoints.max}}</span>
    </div>
    <div class="haywire-stat">
      <label>{{localize "HAYWIRE.ActionPoints"}}</label>
      <input type="number" name="system.actionPoints" value="{{system.actionPoints}}" min="0" />
    </div>
    <div class="haywire-stat">
      <label>{{localize "HAYWIRE.ClassId"}}</label>
      <span class="haywire-class-id">{{system.classId}}</span>
    </div>
  </div>
</section>
```

### Code source actuel — HaywireActor (module/documents/haywire-actor.mjs)

```javascript
export class HaywireActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === "soldier") this._prepareSoldierData();
  }

  _prepareSoldierData() {
    const system = this.system;
    // Clamp HP, AP = HP, derive combatStats from class, manage conditions
    system.hitPoints.value = Math.clamp(system.hitPoints.value, 0, system.hitPoints.max);
    system.actionPoints = system.hitPoints.value;
    if (system.classId) {
      const classItem = game.items.get(system.classId);
      if (classItem?.type === "class") {
        system.combatStats.easy = classItem.system.combatStats.easy;
        // ... medium, hard
      }
    }
    // Manage downed, suppressed, pinned conditions automatically
  }
}
```

### SoldierModel — Schema complet (RÉFÉRENCE, NE PAS MODIFIER)

```
hitPoints: SchemaField { value: Number(min:0, init:2), max: Number(min:0, init:2) }
actionPoints: Number(min:0, init:2)         // DERIVÉ: AP = HP courant (lecture seule sur la fiche)
classId: String(blank:true, init:"")        // UUID/ID de l'Item Class assigné
conditions: SetField<String>                // "suppressed","pinned","downed","hidden","stunned"
suppression: Number(min:0, init:0)          // Compteur de points de suppression
combatStats: SchemaField {                  // DERIVÉS depuis la classe (lecture seule sur la fiche)
  easy: Number(min:0, init:0),
  medium: Number(min:0, init:0),
  hard: Number(min:0, init:0)
}
```

### Clés i18n existantes (RÉFÉRENCE)

**Déjà présentes dans en.json/fr.json :**
- `HAYWIRE.HitPoints` / `HAYWIRE.ActionPoints` / `HAYWIRE.ClassId`
- `HAYWIRE.Suppression`
- `HAYWIRE.CombatStats.Label` / `.Easy` / `.Medium` / `.Hard`
- `HAYWIRE.Conditions.Label` / `.Suppressed` / `.Pinned` / `.Downed` / `.Hidden` / `.Stunned`
- `HAYWIRE.WeaponType.Primary` / `.Secondary` / `.Sidearm` / `.Equipment`
- `HAYWIRE.Name` / `HAYWIRE.Type` / `HAYWIRE.Range` / `HAYWIRE.RateOfFire`
- `HAYWIRE.ImagePath` / `HAYWIRE.Tier`

**Clés à AJOUTER :**
- `HAYWIRE.NoClassAssigned` → EN: "No class assigned" / FR: "Aucune classe assignée"
- `HAYWIRE.EquippedWeapons` → EN: "Equipped Weapons" / FR: "Armes équipées"
- `HAYWIRE.NoWeapons` → EN: "No weapons equipped" / FR: "Aucune arme équipée"
- `HAYWIRE.DragClassHint` → EN: "Drag a class from the compendium" / FR: "Glissez une classe depuis le compendium"

### Patterns V13 OBLIGATOIRES pour la SoldierSheet

**_prepareContext — pattern enrichi :**
```javascript
async _prepareContext(options) {
  const context = await super._prepareContext(options);
  context.actor = this.actor;
  context.system = this.actor.system;
  context.source = this.actor.toObject().system; // Données brutes (non dérivées)
  context.isEditable = this.isEditable;

  // Résolution image de classe
  const classItem = context.system.classId ? game.items.get(context.system.classId) : null;
  context.hasClass = !!classItem;
  context.className = classItem?.name ?? null;
  context.classImage = classItem?.system?.imagePath ?? null;

  // Owned Items de type weapon
  context.weapons = this.actor.items.filter(i => i.type === "weapon");

  // Conditions comme Array pour itération HBS
  context.conditions = [...context.system.conditions];

  return context;
}
```

**Template HBS — bindings de formulaire :**
- Les inputs avec `name="system.fieldName"` sont automatiquement liés au document par DocumentSheetV2
- **Lecture seule** : utiliser `disabled` ou afficher comme `<span>` (pas d'input)
- **NE PAS** inclure de balise `<form>` — DocumentSheetV2 wraps automatiquement avec `tag: "form"`
- Utiliser `{{#each weapons}}` pour itérer sur les armes
- Utiliser `{{#if hasClass}}` pour afficher conditionnellement l'image vs placeholder
- Utiliser `{{#each conditions}}` pour afficher les badges de conditions

**Champs éditables vs lecture seule :**

| Champ | Éditable ? | Raison |
|---|---|---|
| `system.hitPoints.value` | OUI | Le joueur gère les HP manuellement |
| `system.hitPoints.max` | NON | Dérivé de la classe (2 par défaut) |
| `system.actionPoints` | NON | Dérivé: AP = HP courant |
| `system.suppression` | OUI | Le joueur ajoute/retire les points de suppression |
| `system.combatStats.*` | NON | Dérivés de la classe |
| `conditions` | NON | Gérées programmatiquement par prepareDerivedData |
| `actor.name` | OUI | Le joueur nomme son soldat |

**CSS — structure @layer obligatoire :**
```css
@layer haywire {
  :root {
    --haywire-color-primary: #4a5c3c;    /* Vert olive */
    --haywire-color-secondary: #8b7d5b;  /* Kaki */
    --haywire-color-bg: #2a2a2a;         /* Fond sombre */
    --haywire-color-text: #e0d8c8;       /* Texte clair */
    --haywire-color-danger: #c0392b;     /* Rouge pour HP bas */
    --haywire-color-accent: #d4a017;     /* Or pour headers */
  }

  .haywire-sheet-header { /* ... */ }
  .haywire-sheet-stats { /* ... */ }
  .haywire-sheet-conditions { /* ... */ }
  .haywire-sheet-weapons { /* ... */ }
  .haywire-sheet-combat { /* ... */ }
}
```

### Learnings des Stories 1.1, 1.2 et 1.3 (CRITIQUES)

**Erreurs corrigées en code review — NE PAS RÉPÉTER :**

1. **Math.clamped → Math.clamp** : `Math.clamped()` est déprécié en V13. Utiliser `Math.clamp()`. (Story 1.2, issue #3)
2. **Template cassé après renommage de champ** : Le renommage `damage` → `rateOfFire` dans le modèle n'a PAS été répercuté dans le template HBS, causant une régression. **Leçon : toujours vérifier la cohérence modèle <-> template <-> i18n** (Story 1.2, issue #1)
3. **Labels en dur au lieu de i18n** : Les templates doivent TOUJOURS utiliser `{{localize "HAYWIRE.*"}}`, jamais de texte en dur (Story 1.1, issue H1)
4. **prepareData() redondant** : Ne pas implémenter `prepareData()` — utiliser `prepareBaseData()` et `prepareDerivedData()` séparément (Story 1.1, issue M2)
5. **Namespace V13 complet** : Utiliser `foundry.applications.apps.DocumentSheetConfig.registerSheet()` et `foundry.applications.handlebars.loadTemplates()` — pas les globals (Story 1.1)

### Décisions architecturales pertinentes

**Logique métier UNIQUEMENT dans les Documents :**
- La SoldierSheet NE FAIT QUE de l'affichage. ZÉRO calcul dans la sheet ou le template.
- Tous les calculs (AP = HP, combatStats dérivés, conditions auto) sont dans `HaywireActor._prepareSoldierData()`
- La sheet ne fait que lire et passer les données au template via `_prepareContext()`

**Injection de classe — scope de cette story :**
- Cette story affiche UNIQUEMENT les données déjà dérivées par `prepareDerivedData()`
- Le drag & drop de classe sera implémenté dans Story 2.3
- Pour tester l'affichage de l'image de classe : créer un Item Class avec `imagePath`, puis assigner manuellement son ID dans le champ `classId` d'un Actor Soldier

**Armes équipées — scope de cette story :**
- Cette story affiche UNIQUEMENT les owned Items de type "weapon" déjà présents sur l'Actor
- L'ajout d'armes via drag & drop sera finalisé dans Story 2.3/2.4
- Pour tester : créer un Item Weapon manuellement et le glisser sur un Actor via la sidebar Foundry (le drop basique fonctionne déjà nativement)

**DEFAULT_OPTIONS.position — augmenter la hauteur :**
- La fiche actuelle est 600x400 — la nouvelle fiche avec image + armes + conditions aura besoin de plus de place
- Passer à `{ width: 650, height: 550 }` ou ajuster selon le contenu final

### Anti-patterns à éviter ABSOLUMENT

- **NE PAS** créer de nouveau fichier — tous existent déjà
- **NE PAS** modifier `haywire-actor.mjs` — la logique métier est COMPLÈTE pour cette story
- **NE PAS** modifier `soldier-model.mjs` — le schema est COMPLET
- **NE PAS** utiliser jQuery — DOM natif uniquement (`this.element.querySelector()`)
- **NE PAS** mettre de `<form>` dans le template HBS — DocumentSheetV2 le gère
- **NE PAS** mettre de logique de calcul dans le template (pas de `{{math}}` ou calculs HBS)
- **NE PAS** utiliser `activateListeners(html)` — c'est l'ancien API. Utiliser `_onRender(context, options)` si des listeners DOM sont nécessaires
- **NE PAS** oublier les préfixes `.haywire-` sur TOUS les sélecteurs CSS
- **NE PAS** écrire de texte en dur dans le template — TOUJOURS utiliser `{{localize}}`

### Project Structure Notes

Aucun changement de structure. Aucun nouveau fichier. Modifications in-place uniquement.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — Acceptance criteria originaux
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Sheet patterns, template strategy, styling
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Naming, CSS, communication patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — Architectural boundaries (presentation layer)
- [Source: _bmad-output/implementation-artifacts/1-1-creation-du-squelette-projet-foundryvtt-v13.md] — Code review fixes (H1, H2, M1-M4)
- [Source: _bmad-output/implementation-artifacts/1-2-data-models-et-documents-custom.md] — Data model enrichi, code review fixes (Math.clamp, template cassé)
- [Source: _bmad-output/implementation-artifacts/1-3-compendiums-vides-et-i18n.md] — Patterns V13 confirmés, i18n audit
- [Source: _bmad-output/planning-artifacts/prd.md#Technical Requirements] — NFR1 < 500ms, NFR5 V13 only
- [Source: FoundryVTT V13 API — ActorSheetV2] — https://foundryvtt.com/api/classes/foundry.applications.sheets.ActorSheetV2.html
- [Source: FoundryVTT V13 API — HandlebarsApplicationMixin] — https://foundryvtt.com/api/functions/foundry.applications.api.HandlebarsApplicationMixin.html
- [Source: FoundryVTT V13 API — DocumentSheetV2] — https://foundryvtt.com/api/classes/foundry.applications.api.DocumentSheetV2.html

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème rencontré durant l'implémentation.

### Completion Notes List

- **Task 1 :** Template soldier-sheet.hbs réécrit avec layout complet : header (nom éditable + image classe/placeholder), stats HP/AP, suppression, conditions (badges), combat stats (3 seuils conditionnels si classe), armes équipées (tableau). Tous les labels utilisent `{{localize}}`. Aucune balise `<form>`. Champs lecture seule affichés en `<span>`.
- **Task 2 :** `_prepareContext()` enrichi avec `source`, `isEditable`, `classImage`, `className`, `hasClass`, `weapons` (owned items type weapon), `conditions` (Array depuis Set). Lookup classe via `game.items.get(classId)`.
- **Task 3 :** CSS thème militaire complet dans `@layer haywire` — variables `:root` (vert olive, kaki, fond sombre, accent or), styles pour header, stats, suppression, conditions (badges colorés par type), combat stats (3 seuils), armes (tableau), placeholder. Tous sélecteurs préfixés `.haywire-`.
- **Task 4 :** 4 clés i18n ajoutées en EN/FR : `NoClassAssigned`, `EquippedWeapons`, `NoWeapons`, `DragClassHint`. Les clés `CombatStats.Label`, `Conditions.Label`, `Suppression` existaient déjà — pas de doublons.
- **Position fiche** augmentée de 600x400 à 650x550 pour accommoder le nouveau contenu.
- **Position weapon-sheet** ajustée à 750x250 (plus large, moins haute).
- **deleteItem action** : bouton suppression d'arme via `data-action="deleteItem"` + handler dans `static DEFAULT_OPTIONS.actions`.
- **Item Hooks** : re-render automatique via `Hooks.on("updateItem/createItem/deleteItem")` dans `_onFirstRender`, cleanup dans `_onClose`.
- **Task 5 :** EN ATTENTE — requiert vérification manuelle dans FoundryVTT par l'utilisateur.

### Code Review Fixes (2026-03-05)

- **H1** : Conditions affichent désormais les labels localisés (`HAYWIRE.Conditions.*`) au lieu des valeurs brutes.
- **H2** : `weapon-sheet.mjs` ajouté à la File List.
- **H3** : Warning console quand `classId` est défini mais l'item n'existe pas dans `game.items`.
- **M1** : Fallback `onerror` sur l'image de classe — affiche le nom de classe si l'image est cassée.
- **M2** : Fonctionnalité deleteItem documentée dans les Completion Notes.

### Change Log

- 2026-03-05 : Implémentation Tasks 1-4 — Template HBS complet, _prepareContext enrichi, CSS thème militaire, clés i18n ajoutées. Task 5 (vérification manuelle) en attente.
- 2026-03-05 : Code review fixes — H1 (conditions localisées), H2 (file list), H3 (classId warning), M1 (image fallback), M2 (deleteItem documenté).

### File List

- `templates/actor/soldier-sheet.hbs` — Réécrit : layout complet avec header, stats, suppression, conditions, combat stats, armes
- `module/sheets/soldier-sheet.mjs` — Modifié : _prepareContext enrichi, deleteItem action, hooks item, position 650x550
- `module/sheets/weapon-sheet.mjs` — Modifié : position ajustée à 750x250
- `styles/haywire.css` — Réécrit : thème militaire complet dans @layer haywire
- `lang/en.json` — Modifié : +4 clés i18n (NoClassAssigned, EquippedWeapons, NoWeapons, DragClassHint)
- `lang/fr.json` — Modifié : +4 clés i18n correspondantes en français
