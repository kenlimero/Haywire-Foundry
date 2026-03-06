# Story 2.4: Gestion de l'équipement et des états

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a joueur,
I want modifier les HP, AP, conditions de mon Soldier et gérer ses armes équipées,
so that je puisse suivre l'état de mon soldat pendant la partie.

## Acceptance Criteria

1. **Given** un Actor Soldier avec une classe assignée et des armes **When** le joueur modifie HP depuis la fiche **Then** la valeur est sauvegardée immédiatement via submitOnChange **And** HP respecte les bornes 0 ≤ HP ≤ HP max **And** AP est recalculé automatiquement (AP = HP courant)

2. **Given** un Actor Soldier avec une classe assignée **When** HP atteint 0 **Then** la condition "downed" est automatiquement ajoutée **And** quand HP remonte au-dessus de 0, "downed" est automatiquement retirée

3. **Given** un Actor Soldier **When** le joueur modifie la valeur de suppression **Then** les conditions "suppressed" (≥3) et "pinned" (≥6) sont automatiquement gérées **And** les badges de conditions se mettent à jour visuellement

4. **Given** un Actor Soldier **When** le joueur veut ajouter/retirer une condition manuellement (ex: "hidden", "stunned") **Then** il peut le faire depuis la fiche via une UI dédiée **And** les conditions manuelles coexistent avec les conditions automatiques

5. **Given** un Actor Soldier avec des armes référencées **When** le joueur clique sur le bouton supprimer d'une arme propre (pas de la classe) **Then** la référence UUID est retirée de `weaponIds` **And** la liste des armes se met à jour immédiatement

6. **Given** un joueur qui glisse un Item Weapon depuis un compendium ou la sidebar **When** le drop est traité sur la fiche Soldier **Then** le UUID de l'arme est ajouté à `weaponIds` **And** elle apparaît dans la liste des armes équipées

7. **Given** un joueur qui clique sur le nom d'une arme ou d'un skill dans la liste **When** le clic est traité **Then** la fiche de l'item (WeaponSheet ou SkillSheet) s'ouvre pour consultation/édition

8. **Given** un Actor Soldier avec des états modifiés (HP, conditions, armes) **When** la fiche est fermée et ré-ouverte **Then** tous les états sont correctement restaurés (persistance)

## Tasks / Subtasks

- [x] Task 1 — Ajouter la gestion manuelle des conditions dans le template et la sheet (AC: #4)
  - [x] 1.1 Modifier `soldier-sheet.hbs` section conditions : ajouter un bouton × de suppression sur chaque badge (`data-action="removeCondition"` + `data-condition="{{this.key}}"`)
  - [x] 1.2 Modifier `soldier-sheet.hbs` : ajouter un `<select>` pour ajouter une condition (liste des conditions non encore actives)
  - [x] 1.3 Dans `_prepareContext` : calculer `availableConditions` = conditions HAYWIRE non présentes sur l'actor
  - [x] 1.4 Ajouter l'action `removeCondition` dans `DEFAULT_OPTIONS.actions`
  - [x] 1.5 Ajouter un event listener `change` sur le select dans `_onRender` pour ajouter une condition via `actor.update()`

- [x] Task 2 — Ajouter l'ouverture des fiches Item depuis les listes (AC: #7)
  - [x] 2.1 Modifier `soldier-sheet.hbs` : rendre le nom de chaque arme cliquable avec `<a data-action="openItem" data-item-uuid="{{this.uuid}}">`
  - [x] 2.2 Modifier `soldier-sheet.hbs` : rendre le nom de chaque skill cliquable de la même façon
  - [x] 2.3 Ajouter l'action `openItem` dans `DEFAULT_OPTIONS.actions` : résoudre l'item par UUID et ouvrir sa sheet

- [x] Task 3 — Ajouter les clés i18n (AC: #4)
  - [x] 3.1 Ajouter dans `en.json` et `fr.json` : `HAYWIRE.SelectCondition`

- [x] Task 4 — Ajouter le CSS pour les nouveaux éléments UI (AC: #4, #7)
  - [x] 4.1 Styler le bouton × dans les badges (`.haywire-condition-remove`)
  - [x] 4.2 Styler le select d'ajout de condition (`.haywire-condition-select`)
  - [x] 4.3 Styler les noms d'items cliquables (`.haywire-item-link`)

- [ ] Task 5 — Vérification manuelle dans FoundryVTT (AC: #1-#8) — REQUIERT TEST DANS FOUNDRY
  - [ ] 5.1 Modifier HP → vérifier sauvegarde immédiate et bornes
  - [ ] 5.2 HP à 0 → vérifier condition "downed" auto
  - [ ] 5.3 Suppression à 3/6 → vérifier "suppressed"/"pinned"
  - [ ] 5.4 Ajouter/retirer une condition manuellement
  - [ ] 5.5 Retirer une arme propre → vérifier que le UUID est retiré de weaponIds
  - [ ] 5.6 Drag & drop un Item Weapon → vérifier l'ajout du UUID
  - [ ] 5.7 Cliquer sur le nom d'une arme/skill → vérifier ouverture de la fiche
  - [ ] 5.8 Fermer/ré-ouvrir la fiche → vérifier persistance
  - [ ] 5.9 Vérifier 0 erreurs et 0 warnings de deprecation dans la console

## Dev Notes

### PIVOT ARCHITECTURAL (Story 2.3) — CONTEXTE CRITIQUE

**L'implémentation de Story 2.3 a divergé des ACs originaux par choix de l'utilisateur :**

- Les armes et skills ne sont **PAS des owned Items** mais des **références UUID** stockées dans `weaponIds` et `skillIds` (ArrayField<StringField>) sur le SoldierModel
- Les combatStats sont dérivées dans `SoldierSheet._prepareContext()` (pas dans `_prepareSoldierData()`) car les références externes ne déclenchent pas `prepareDerivedData`
- Les skills sont un type d'Item standalone (type "skill") avec leur propre SkillModel et SkillSheet
- La classe est aussi une référence UUID (pas de copie d'armes par défaut — les `defaultWeapons` de la classe sont des UUID résolus au render)
- Items `fromClass` ne sont pas supprimables par le joueur (pas de bouton delete)
- Le portrait et le token de l'actor sont mis à jour avec l'image de la classe

### Ce qui FONCTIONNE DÉJÀ (ne pas ré-implémenter)

| Fonctionnalité | Implémenté dans | AC |
|---|---|---|
| HP éditable avec `min="0"` et `max` | `soldier-sheet.hbs:31` + `_prepareSoldierData` `Math.clamp` | #1 ✓ |
| AP dérivé en lecture seule (= HP courant) | `_prepareSoldierData:18` + template:39 | #1 ✓ |
| Condition "downed" auto (HP=0) | `_prepareSoldierData:24-28` | #2 ✓ |
| Conditions "suppressed"/"pinned" auto | `_prepareSoldierData:38-47` | #3 ✓ |
| Suppression éditable | `soldier-sheet.hbs:47` | #3 ✓ |
| Retrait arme propre via `removeWeapon` action | `SoldierSheet.#onRemoveWeapon` | #5 ✓ |
| Ajout arme via drag & drop (UUID) | `SoldierSheet.#onDropWeaponItem` | #6 ✓ |
| Re-render auto via hooks `updateItem`/`deleteItem` | `SoldierSheet._onFirstRender` + `#isRelevantItem` | #5, #6 ✓ |
| Persistance des états | Architecture Foundry (documents persistés en DB) | #8 ✓ |

### Ce qui doit être AJOUTÉ par cette story

1. **Gestion manuelle des conditions** (AC #4) — UI select + bouton × sur badges
2. **Ouverture des fiches Item** (AC #7) — clic sur nom d'arme/skill → ouvre la sheet

### Contexte : fichiers à modifier

| Fichier | Ce qui doit changer |
|---|---|
| `templates/actor/soldier-sheet.hbs` | Section conditions : bouton × sur badges + select ajout. Section armes/skills : noms cliquables |
| `module/sheets/soldier-sheet.mjs` | Actions `removeCondition` + `openItem`, listener `change` sur select condition, `availableConditions` dans `_prepareContext` |
| `styles/haywire.css` | Styles `.haywire-condition-remove`, `.haywire-condition-select`, `.haywire-item-link` |
| `lang/en.json` | Ajouter `HAYWIRE.SelectCondition` |
| `lang/fr.json` | Ajouter traduction correspondante |

**Fichiers à NE PAS modifier :**
- `module/models/soldier-model.mjs` — schema complet (`weaponIds`, `skillIds`, `conditions` SetField)
- `module/documents/haywire-actor.mjs` — `_prepareSoldierData` est complet
- `module/models/class-model.mjs`, `weapon-model.mjs`, `skill-model.mjs` — schemas complets
- `module/documents/haywire-item.mjs` — aucun changement nécessaire
- `module/sheets/class-sheet.mjs`, `weapon-sheet.mjs`, `skill-sheet.mjs` — aucun changement nécessaire
- `haywire.mjs`, `system.json` — aucun changement nécessaire

### Code source actuel — SoldierSheet (module/sheets/soldier-sheet.mjs)

```javascript
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class SoldierSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static PARTS = {
    sheet: { template: "systems/haywire/templates/actor/soldier-sheet.hbs" },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "actor", "soldier"],
    position: { width: 650, height: 550 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
    dragDrop: [{ dropSelector: null }],
    actions: {
      removeWeapon: SoldierSheet.#onRemoveWeapon,
      removeSkill: SoldierSheet.#onRemoveSkill,
    },
  };

  static async #onRemoveWeapon(event, target) {
    const uuid = target.dataset.weaponUuid;
    const weaponIds = this.actor.system.weaponIds.filter(id => id !== uuid);
    await this.actor.update({ "system.weaponIds": weaponIds });
  }

  static async #onRemoveSkill(event, target) {
    const uuid = target.dataset.skillUuid;
    const skillIds = this.actor.system.skillIds.filter(id => id !== uuid);
    await this.actor.update({ "system.skillIds": skillIds });
  }

  // ... _onFirstRender (hooks updateItem/deleteItem), _onClose, #isRelevantItem ...
  // ... _onDropItem (class/weapon/skill routing), #onDropClassItem, #onDropWeaponItem, #onDropSkillItem ...

  _onRender(context, options) {
    super._onRender(context, options);
    const dropZone = this.element.querySelector(".haywire-sheet-class-image");
    if (!dropZone) return;
    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("haywire-drop-target"); });
    dropZone.addEventListener("dragleave", () => { dropZone.classList.remove("haywire-drop-target"); });
    dropZone.addEventListener("drop", () => { dropZone.classList.remove("haywire-drop-target"); });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.source = this.actor.toObject().system;
    context.isEditable = this.isEditable;

    // ... résolution classe par UUID (fromUuidSync + fallback) ...
    // ... combatStats dérivées live depuis la classe ...
    // ... skills (classe + propres) résolues par UUID avec { uuid, name, description, missing, fromClass } ...
    // ... weapons (classe + propres) résolues par UUID avec { uuid, name, weaponType, range, rateOfFire, fromClass, missing } ...

    // Conditions
    context.conditions = [...context.system.conditions].map(c => ({
      key: c,
      label: game.i18n.localize(`HAYWIRE.Conditions.${c.charAt(0).toUpperCase() + c.slice(1)}`),
    }));

    return context;
  }
}
```

### Code source actuel — SoldierModel (module/models/soldier-model.mjs)

```javascript
export class SoldierModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      hitPoints: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
        max: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
      }),
      actionPoints: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
      classId: new fields.StringField({ required: false, blank: true, initial: "" }),
      conditions: new fields.SetField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      weaponIds: new fields.ArrayField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      skillIds: new fields.ArrayField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      suppression: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      combatStats: new fields.SchemaField({
        easy: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        medium: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        hard: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      }),
    };
  }
}
```

### Pattern EXACT : Gestion manuelle des conditions (SetField)

Le champ `conditions` est un `SetField<StringField>`. Pour modifier un Set dans FoundryVTT V13 :

```javascript
// Ajouter une condition
const conditions = new Set(this.actor.system.conditions);
conditions.add("hidden");
await this.actor.update({ "system.conditions": [...conditions] });

// Retirer une condition
const conditions = new Set(this.actor.system.conditions);
conditions.delete("stunned");
await this.actor.update({ "system.conditions": [...conditions] });
```

**ATTENTION :** Ne PAS utiliser `system.conditions.add()` directement dans un handler — ça modifie le Set en mémoire sans persister.

**NOTE conditions auto-gérées :** Les conditions "downed", "suppressed" et "pinned" sont recalculées dans `_prepareSoldierData()` à chaque `prepareDerivedData()`. Un joueur peut les retirer manuellement, mais elles seront ré-ajoutées au prochain cycle si les conditions mécaniques sont toujours réunies. C'est le comportement attendu.

### Pattern EXACT : Actions `removeCondition` et `openItem`

```javascript
// Ajouter dans DEFAULT_OPTIONS.actions :
actions: {
  removeWeapon: SoldierSheet.#onRemoveWeapon,
  removeSkill: SoldierSheet.#onRemoveSkill,
  removeCondition: SoldierSheet.#onRemoveCondition,  // NOUVEAU
  openItem: SoldierSheet.#onOpenItem,                 // NOUVEAU
},

static async #onRemoveCondition(event, target) {
  const condition = target.closest("[data-condition]").dataset.condition;
  const conditions = new Set(this.actor.system.conditions);
  conditions.delete(condition);
  await this.actor.update({ "system.conditions": [...conditions] });
}

static async #onOpenItem(event, target) {
  const uuid = target.dataset.itemUuid;
  const item = fromUuidSync(uuid) ?? game.items.get(uuid);
  if (item) item.sheet.render(true);
}
```

### Pattern EXACT : Select d'ajout de condition dans `_onRender`

Le `<select>` ne peut PAS utiliser le système d'actions ApplicationV2 (basé sur les clics). Il faut un event listener `change` dans `_onRender` :

```javascript
_onRender(context, options) {
  super._onRender(context, options);

  // Drag feedback existant (drop zone classe)
  const dropZone = this.element.querySelector(".haywire-sheet-class-image");
  if (dropZone) {
    dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("haywire-drop-target"); });
    dropZone.addEventListener("dragleave", () => { dropZone.classList.remove("haywire-drop-target"); });
    dropZone.addEventListener("drop", () => { dropZone.classList.remove("haywire-drop-target"); });
  }

  // NOUVEAU : Listener pour le select d'ajout de condition
  const conditionSelect = this.element.querySelector(".haywire-condition-select");
  if (conditionSelect) {
    conditionSelect.addEventListener("change", async (e) => {
      if (!this.isEditable) return;
      const condition = e.target.value;
      if (!condition) return;
      const conditions = new Set(this.actor.system.conditions);
      conditions.add(condition);
      await this.actor.update({ "system.conditions": [...conditions] });
    });
  }
}
```

### Pattern EXACT : `availableConditions` dans `_prepareContext`

```javascript
// AJOUTER après le bloc context.conditions existant :
const HAYWIRE_CONDITIONS = ["suppressed", "pinned", "downed", "hidden", "stunned"];
const currentConditions = [...context.system.conditions];
context.availableConditions = HAYWIRE_CONDITIONS
  .filter(c => !currentConditions.includes(c))
  .map(c => ({
    key: c,
    label: game.i18n.localize(`HAYWIRE.Conditions.${c.charAt(0).toUpperCase() + c.slice(1)}`),
  }));
```

### Pattern EXACT : Modifications du template

**Section conditions (remplace lignes 50-58 de soldier-sheet.hbs) :**
```handlebars
{{!-- Conditions avec gestion manuelle --}}
<div class="haywire-sheet-conditions">
  <label>{{localize "HAYWIRE.Conditions.Label"}}</label>
  <div class="haywire-conditions-list">
    {{#each conditions}}
      <span class="haywire-condition-badge haywire-condition-{{this.key}}" data-condition="{{this.key}}">
        {{this.label}}
        {{#if ../isEditable}}
          <button type="button" class="haywire-condition-remove" data-action="removeCondition">
            <i class="fas fa-times"></i>
          </button>
        {{/if}}
      </span>
    {{/each}}
  </div>
  {{#if isEditable}}
  {{#if availableConditions.length}}
    <select class="haywire-condition-select">
      <option value="">{{localize "HAYWIRE.SelectCondition"}}</option>
      {{#each availableConditions}}
        <option value="{{this.key}}">{{this.label}}</option>
      {{/each}}
    </select>
  {{/if}}
  {{/if}}
</div>
```

**Nom d'arme cliquable (remplace ligne 121 `<td>{{this.name}}</td>`) :**
```handlebars
<td><a class="haywire-item-link" data-action="openItem" data-item-uuid="{{this.uuid}}">{{this.name}}</a></td>
```

**Nom de skill cliquable (remplace ligne 87 `<span class="haywire-skill-name">{{this.name}}</span>`) :**
```handlebars
<a class="haywire-item-link haywire-skill-name" data-action="openItem" data-item-uuid="{{this.uuid}}">{{this.name}}</a>
```

### CSS à ajouter dans `@layer haywire`

```css
/* Condition remove button (inside badge) */
.haywire-condition-remove {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0 0 0 0.25rem;
  font-size: 0.65rem;
  opacity: 0.6;
  line-height: 1;
}

.haywire-condition-remove:hover {
  opacity: 1;
}

/* Condition select dropdown */
.haywire-condition-select {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--haywire-color-text);
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--haywire-color-primary);
  border-radius: 3px;
  padding: 0.2rem 0.4rem;
}

/* Item name clickable link (weapons & skills) */
.haywire-item-link {
  color: var(--haywire-color-text);
  text-decoration: none;
  cursor: pointer;
}

.haywire-item-link:hover {
  color: var(--haywire-color-accent);
  text-decoration: underline;
}
```

### Clés i18n

**Déjà présentes (NE PAS DUPLIQUER) :**
- `HAYWIRE.Conditions.Label`, `.Suppressed`, `.Pinned`, `.Downed`, `.Hidden`, `.Stunned`
- `HAYWIRE.HitPoints`, `HAYWIRE.ActionPoints`, `HAYWIRE.Suppression`
- `HAYWIRE.EquippedWeapons`, `HAYWIRE.NoWeapons`, `HAYWIRE.DragWeaponHint`
- `HAYWIRE.Skills`, `HAYWIRE.DragSkillHint`, `HAYWIRE.NoSkills`

**Clé à AJOUTER :**
- `HAYWIRE.SelectCondition` → EN: "Select a condition..." / FR: "Sélectionner une condition..."

### Learnings des Stories précédentes (CRITIQUES)

1. **Labels en dur au lieu de i18n** : TOUJOURS `{{localize "HAYWIRE.*"}}` et `game.i18n.localize()` (Story 1.1)
2. **`_onRender` pas `activateListeners`** : ApplicationV2 utilise `_onRender(context, options)` (Story 2.1)
3. **Pas de `<form>` dans les templates HBS** : DocumentSheetV2 gère le form wrapper (Story 2.2)
4. **Boutons `type="button"` pas `type="submit"`** : Pour éviter le submit (Story 2.2)
5. **Guard `if (!this.isEditable) return;`** dans les handlers (Story 2.2)
6. **`data-action` pour les clics**, event listener `_onRender` pour `change`/`dragover` (Story 2.3)
7. **Références UUID** : Les armes et skills sont des références UUID résolues par `fromUuidSync()` avec fallback `game.items.get()`, PAS des owned Items (Pivot Story 2.3)
8. **`fromClass` flag** : Les items venant de la classe ne sont pas supprimables par le joueur (Story 2.3)

### Anti-patterns à éviter ABSOLUMENT

- **NE PAS** créer de nouveau fichier — tous existent déjà
- **NE PAS** modifier les data models — schemas COMPLETS
- **NE PAS** modifier `haywire-actor.mjs` — `_prepareSoldierData` est COMPLET
- **NE PAS** utiliser jQuery — DOM natif uniquement
- **NE PAS** utiliser `activateListeners(html)` — utiliser `_onRender(context, options)`
- **NE PAS** modifier `system.conditions.add()`/`.delete()` directement — passer par `actor.update()`
- **NE PAS** écrire de texte en dur — TOUJOURS `game.i18n.localize()`
- **NE PAS** utiliser `type="submit"` pour les boutons
- **NE PAS** oublier le guard `if (!this.isEditable)`
- **NE PAS** traiter les armes/skills comme des owned Items — ce sont des RÉFÉRENCES UUID
- **NE PAS** utiliser `this.actor.items.get(id)` pour les armes/skills — utiliser `fromUuidSync(uuid)`

### Project Structure Notes

Aucun changement de structure. Aucun nouveau fichier. Modifications in-place uniquement.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — Acceptance criteria originaux (FR7, FR8)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — SoldierModel schema, conditions SetField
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Sheet patterns DocumentSheetV2
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns] — Document lifecycle, error handling
- [Source: _bmad-output/implementation-artifacts/2-3-injection-de-classe-via-drag-drop.md] — Pivot architectural UUID, _onDropItem, _onRender, removeWeapon/removeSkill actions
- [Source: _bmad-output/implementation-artifacts/2-2-fiches-item-class-et-weapon.md] — Learnings code review, _onRender listeners
- [Source: FoundryVTT V13 API — ActorSheetV2] — https://foundryvtt.com/api/classes/foundry.applications.sheets.ActorSheetV2.html
- [Source: FoundryVTT V13 API — ApplicationV2] — https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A

### Completion Notes List

- Task 1: Gestion manuelle des conditions — bouton × sur badges, select d'ajout, action `removeCondition`, listener `change` dans `_onRender`, `availableConditions` dans `_prepareContext`
- Task 2: Ouverture des fiches Item — noms cliquables avec `data-action="openItem"`, résolution UUID avec warning console si introuvable
- Task 3: Clé i18n `HAYWIRE.SelectCondition` + `HAYWIRE.Suppression.1-6` + renommage `SuppressionLabel` en EN et FR
- Task 4: CSS ajouté pour `.haywire-condition-remove`, `.haywire-condition-select`, `.haywire-item-link`
- Task 5: Tests manuels requis dans FoundryVTT (non automatisable)
- Post-story: Sync bidirectionnel sheet ↔ token via `toggleStatusEffect` override + `_syncTokenConditions` (Promise.all)
- Post-story: 6 niveaux suppression token (sup-1 à sup-6) avec icônes SVG, AP = HP - pénalité (suppressed: -1, pinned: -2)
- Post-story: CONFIG.statusEffects remplacé par conditions Haywire
- Code Review: H1 (sequential await → Promise.all), M1 (_onUpdate filtré), M3 (retrait suppressed/pinned réduit au lieu de reset), M4 (warning UUID introuvable)

### Change Log

- `module/documents/haywire-actor.mjs` — Ajout `toggleStatusEffect` override (sync bidirectionnel sheet ↔ token), `_onUpdate` → `_syncTokenConditions` (parallel via Promise.all), AP = HP - pénalité suppression
- `module/sheets/soldier-sheet.mjs` — Ajout actions `removeCondition` et `openItem` (avec warning si UUID introuvable), listener `change` sur select condition dans `_onRender`, `availableConditions` dans `_prepareContext`
- `templates/actor/soldier-sheet.hbs` — Section conditions enrichie (bouton ×, select), noms armes/skills cliquables, label suppression → `SuppressionLabel`
- `styles/haywire.css` — Styles `.haywire-condition-remove`, `.haywire-condition-select`, `.haywire-item-link`
- `haywire.mjs` — `CONFIG.statusEffects` remplacé par conditions Haywire (downed, hidden, stunned, sup-1 à sup-6)
- `lang/en.json` — Ajout `HAYWIRE.SelectCondition`, `HAYWIRE.Suppression.1-6`, renommage `Suppression` → `SuppressionLabel`
- `lang/fr.json` — Idem en français
- `assets/icons/sup-1.svg` à `sup-6.svg` — 6 icônes SVG pour niveaux de suppression (CRÉÉS)

### File List

- `module/documents/haywire-actor.mjs`
- `module/sheets/soldier-sheet.mjs`
- `templates/actor/soldier-sheet.hbs`
- `styles/haywire.css`
- `haywire.mjs`
- `lang/en.json`
- `lang/fr.json`
- `assets/icons/sup-1.svg`
- `assets/icons/sup-2.svg`
- `assets/icons/sup-3.svg`
- `assets/icons/sup-4.svg`
- `assets/icons/sup-5.svg`
- `assets/icons/sup-6.svg`
