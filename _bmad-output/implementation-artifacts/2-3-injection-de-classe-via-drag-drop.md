# Story 2.3: Injection de classe via drag & drop

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a joueur,
I want assigner une classe à mon Soldier en glissant un Item Class sur sa fiche,
so that mon soldat hérite des stats et armes de sa classe.

## Acceptance Criteria

1. **Given** un Actor Soldier ouvert et un Item Class dans un compendium ou la sidebar **When** le joueur drag & drop l'Item Class sur la fiche Soldier **Then** le classId est stocké dans l'Actor **And** les stats de base (combatStats easy/medium/hard) sont dérivées depuis la classe dans prepareDerivedData **And** l'image de la carte de classe s'affiche sur la fiche Soldier **And** les armes par défaut de la classe sont copiées comme owned Items sur l'Actor **And** une notification confirme l'assignation de classe

2. **Given** un Actor Soldier avec une classe déjà assignée **When** le joueur drop une nouvelle classe **Then** l'ancienne classe est remplacée (classId mis à jour) **And** les anciennes armes issues de la classe précédente sont supprimées **And** les armes par défaut de la nouvelle classe sont copiées comme owned Items

3. **Given** un joueur qui drop un Item Weapon (pas Class) sur la fiche **When** le drop est traité **Then** l'Item Weapon est ajouté comme owned Item (arme équipée) **And** aucune injection de classe ne se produit

4. **Given** un joueur qui drop un Item d'un type inconnu (ni Class ni Weapon) **When** le drop est traité **Then** le drop est ignoré ou géré par le comportement par défaut de Foundry

5. **Given** un Actor Soldier avec une classe assignée **When** la fiche est ré-ouverte **Then** l'image de classe, les combatStats dérivées et les armes équipées sont correctement affichées (persistance)

## Tasks / Subtasks

- [x] Task 1 — Override `_onDropItem` dans SoldierSheet pour router les drops par type (AC: #1, #3, #4)
  - [x] 1.1 Override `async _onDropItem(event, item)` dans SoldierSheet
  - [x] 1.2 Si `item.type === "class"` → appeler `this.#onDropClassItem(item)` (méthode privée)
  - [x] 1.3 Si `item.type === "weapon"` → appeler `super._onDropItem(event, item)` (crée un owned Item par défaut via ActorSheetV2)
  - [x] 1.4 Si autre type → ignorer (`return null`) avec `console.warn`
  - [x] 1.5 Ajouter `_onDropItem` dans les actions ou directement comme override de méthode

- [x] Task 2 — Implémenter `#onDropClassItem(item)` pour l'injection de classe (AC: #1, #2)
  - [x] 2.1 Si l'actor a déjà une classe (`system.classId`) → supprimer TOUTES les armes owned existantes via `this.actor.deleteEmbeddedDocuments("Item", weaponIds)`
  - [x] 2.2 Stocker `classId` = `item.uuid` via `this.actor.update({ "system.classId": item.uuid })`
  - [x] 2.3 Résoudre les armes par défaut depuis `item.system.defaultWeapons` (Array de strings)
  - [x] 2.4 Pour chaque nom d'arme dans defaultWeapons : chercher un Item Weapon correspondant dans les world items (`game.items`) et les compendium packs (`game.packs`), ou créer un Item Weapon minimal avec juste le nom
  - [x] 2.5 Créer les armes comme owned Items via `this.actor.createEmbeddedDocuments("Item", weaponDataArray)`
  - [x] 2.6 Afficher une notification de succès via `ui.notifications.info()` avec le nom de la classe assignée

- [x] Task 3 — Modifier `HaywireActor._prepareSoldierData()` pour résoudre classId comme UUID (AC: #1, #5)
  - [x] 3.1 Remplacer `game.items.get(system.classId)` par `fromUuidSync(system.classId)` pour supporter les UUID (compendium ET world items)
  - [x] 3.2 Garder un fallback `game.items.get(system.classId)` pour la rétrocompatibilité avec les classId de type ID simple
  - [x] 3.3 Vérifier que les combatStats, HP max et image sont toujours dérivés correctement

- [x] Task 4 — Mettre à jour `SoldierSheet._prepareContext()` pour résoudre le classItem via UUID (AC: #5)
  - [x] 4.1 Remplacer `game.items.get(classId)` par `fromUuidSync(classId)` avec fallback `game.items.get(classId)`
  - [x] 4.2 Vérifier que `hasClass`, `className`, `classImage` restent correctement résolus

- [x] Task 5 — Ajouter le feedback visuel de drop sur la zone image de classe (AC: #1)
  - [x] 5.1 Dans `_onRender`, ajouter des event listeners `dragover` et `dragleave` sur `.haywire-sheet-class-image`
  - [x] 5.2 Ajouter/retirer la classe CSS `haywire-drop-target` lors du survol
  - [x] 5.3 Ajouter les styles CSS pour `.haywire-drop-target` (bordure accent, fond légèrement lumineux)

- [x] Task 6 — Ajouter les clés i18n pour le feedback de drop (AC: #1, #2)
  - [x] 6.1 Ajouter `HAYWIRE.ClassAssigned` → EN: "Class assigned: {name}" / FR: "Classe assignée : {name}"
  - [x] 6.2 Ajouter `HAYWIRE.ClassReplaced` → EN: "Class replaced: {name}" / FR: "Classe remplacée : {name}"
  - [x] 6.3 Ajouter `HAYWIRE.InvalidDrop` → EN: "Only Class or Weapon items can be dropped here" / FR: "Seuls les items Classe ou Arme peuvent être déposés ici"

- [ ] Task 7 — Vérification manuelle dans FoundryVTT (AC: #1-#5) — REQUIERT TEST DANS FOUNDRY
  - [ ] 7.1 Créer un Item Class dans le monde avec des skills, armes par défaut et image
  - [ ] 7.2 Créer un Actor Soldier, drag & drop la classe sur la fiche → vérifier classId, combatStats, image, armes owned
  - [ ] 7.3 Drop une 2e classe → vérifier remplacement (anciennes armes supprimées, nouvelles créées)
  - [ ] 7.4 Drop un Item Weapon → vérifier ajout comme owned Item
  - [ ] 7.5 Fermer et ré-ouvrir la fiche → vérifier persistance
  - [ ] 7.6 Vérifier 0 erreurs et 0 warnings de deprecation dans la console
  - [ ] 7.7 Tester avec un Item Class depuis un compendium (si disponible)

## Dev Notes

### Contexte : fichiers à modifier

**IMPORTANT :** Tous les fichiers existent depuis Story 1.1. Cette story MODIFIE les fichiers existants.

| Fichier | État actuel | Ce qui doit changer |
|---|---|---|
| `module/sheets/soldier-sheet.mjs` | Sheet fonctionnelle avec _prepareContext, deleteItem action, hooks re-render | Ajouter override `_onDropItem`, méthode privée `#onDropClassItem`, event listeners drag feedback |
| `module/documents/haywire-actor.mjs` | `_prepareSoldierData` dérive combatStats via `game.items.get(classId)` | Remplacer `game.items.get()` par `fromUuidSync()` avec fallback |
| `styles/haywire.css` | CSS complet (SoldierSheet + ItemSheets) | Ajouter `.haywire-drop-target` styles |
| `lang/en.json` | Clés existantes incluant DragClassHint | Ajouter 3 clés (ClassAssigned, ClassReplaced, InvalidDrop) |
| `lang/fr.json` | Traductions FR complètes | Ajouter 3 traductions correspondantes |

**Fichiers à NE PAS modifier :**
- `module/models/soldier-model.mjs` — schema complet, `classId` est déjà un StringField qui accepte les UUIDs
- `module/models/class-model.mjs` — schema complet
- `module/models/weapon-model.mjs` — schema complet
- `module/documents/haywire-item.mjs` — stub minimal conforme
- `templates/actor/soldier-sheet.hbs` — le template est déjà complet (zone image, combatStats conditionnels, armes)
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
    position: { width: 650, height: 550 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
    actions: {
      deleteItem: SoldierSheet.#onDeleteItem,
    },
  };

  static async #onDeleteItem(event, target) {
    const itemId = target.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) await item.delete();
  }

  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    this._itemHooks = [
      Hooks.on("updateItem", (item) => {
        if (item.parent?.id === this.actor.id) this.render();
      }),
      Hooks.on("createItem", (item) => {
        if (item.parent?.id === this.actor.id) this.render();
      }),
      Hooks.on("deleteItem", (item) => {
        if (item.parent?.id === this.actor.id) this.render();
      }),
    ];
  }

  _onClose(options) {
    super._onClose(options);
    if (this._itemHooks) {
      Hooks.off("updateItem", this._itemHooks[0]);
      Hooks.off("createItem", this._itemHooks[1]);
      Hooks.off("deleteItem", this._itemHooks[2]);
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.source = this.actor.toObject().system;
    context.isEditable = this.isEditable;

    // Résolution image de classe
    const classId = context.system.classId;
    const classItem = classId ? game.items.get(classId) : null;
    if (classId && !classItem) {
      console.warn(`Haywire | SoldierSheet: classId "${classId}" not found in world items for actor "${this.actor.name}"`);
    }
    context.hasClass = !!classItem;
    context.className = classItem?.name ?? null;
    context.classImage = classItem?.system?.imagePath || null;

    // Owned Items de type weapon
    context.weapons = this.actor.items
      .filter(i => i.type === "weapon")
      .map(w => ({
        id: w.id,
        name: w.name,
        weaponType: game.i18n.localize(`HAYWIRE.WeaponType.${w.system.weaponType}`),
        range: w.system.range,
        rateOfFire: w.system.rateOfFire,
      }));

    // Conditions comme Array d'objets {key, label}
    context.conditions = [...context.system.conditions].map(c => ({
      key: c,
      label: game.i18n.localize(`HAYWIRE.Conditions.${c.charAt(0).toUpperCase() + c.slice(1)}`),
    }));

    return context;
  }
}
```

### Code source actuel — HaywireActor (module/documents/haywire-actor.mjs)

```javascript
export class HaywireActor extends Actor {
  prepareBaseData() {
    super.prepareBaseData();
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === "soldier") this._prepareSoldierData();
  }

  _prepareSoldierData() {
    const system = this.system;

    // Clamp HP to max
    system.hitPoints.value = Math.clamp(system.hitPoints.value, 0, system.hitPoints.max);

    // AP = current HP
    system.actionPoints = system.hitPoints.value;

    // Derive combat stats from assigned class
    if (system.classId) {
      const classItem = game.items.get(system.classId);
      if (classItem?.type === "class") {
        system.combatStats.easy = classItem.system.combatStats.easy;
        system.combatStats.medium = classItem.system.combatStats.medium;
        system.combatStats.hard = classItem.system.combatStats.hard;
      }
    }

    // Manage downed condition based on HP
    if (system.hitPoints.value <= 0) {
      system.conditions.add("downed");
    } else {
      system.conditions.delete("downed");
    }

    // Apply suppression → conditions
    if (system.suppression >= 6) {
      system.conditions.add("pinned");
      system.conditions.delete("suppressed");
    } else if (system.suppression >= 3) {
      system.conditions.add("suppressed");
      system.conditions.delete("pinned");
    } else {
      system.conditions.delete("pinned");
      system.conditions.delete("suppressed");
    }
  }
}
```

### Code source actuel — Template soldier-sheet.hbs (RÉFÉRENCE, NE PAS MODIFIER)

Le template est DÉJÀ complet pour cette story :
- Zone `.haywire-sheet-class-image` avec placeholder "Aucune classe assignée / Glissez une classe depuis le compendium"
- Section combatStats conditionnelle (`{{#if hasClass}}`)
- Table des armes avec bouton supprimer
- Tous les labels en i18n

**Aucune modification du template n'est nécessaire** — la zone image et le placeholder agissent naturellement comme zone de drop visuelle.

### Pattern CRITIQUE : `_onDropItem` dans ActorSheetV2 (V13)

**ActorSheetV2 fournit nativement le drag & drop.** La méthode `_onDropItem(event, item)` est appelée automatiquement quand un Item est droppé sur la fiche. Le paramètre `item` est le document Item DÉJÀ RÉSOLU (par Foundry via `fromUuid`).

**Signature :**
```javascript
async _onDropItem(event, item) → Promise<undefined | null | Item>
```

**Comportement par défaut :** Crée un embedded Item sur l'actor (owned Item) ou trie les items existants.

**Pour cette story :** Override dans SoldierSheet pour intercepter les drops de type "class" AVANT le comportement par défaut.

```javascript
// Pattern d'override recommandé
async _onDropItem(event, item) {
  if (!this.isEditable) return null;

  if (item.type === "class") {
    return this.#onDropClassItem(item);
  }
  if (item.type === "weapon") {
    return super._onDropItem(event, item); // Comportement par défaut = owned Item
  }

  // Type inconnu — ignorer
  console.warn(`haywire | SoldierSheet: drop ignoré, type "${item.type}" non supporté`);
  return null;
}
```

### Pattern CRITIQUE : Résolution UUID avec `fromUuidSync`

**Problème :** Le code actuel utilise `game.items.get(classId)` qui ne fonctionne que pour les world items. Quand un Item Class vient d'un compendium, son UUID est au format `Compendium.haywire.classes.Item.{id}`, pas un simple ID.

**Solution V13 :** `fromUuidSync(uuid)` résout de manière synchrone les documents déjà chargés en mémoire (world items ET compendium entries déjà visitées).

```javascript
// Pattern de résolution avec fallback
function resolveClassItem(classId) {
  if (!classId) return null;
  // Essayer fromUuidSync d'abord (supporte UUID complets)
  let classItem = fromUuidSync(classId);
  // Fallback pour les anciens classId stockés comme simples IDs
  if (!classItem) classItem = game.items.get(classId);
  return classItem?.type === "class" ? classItem : null;
}
```

**IMPORTANT :** `fromUuidSync` est une fonction globale dans FoundryVTT V13, pas besoin d'import. Pour les compendium items, le document doit avoir été chargé au préalable (ce qui est le cas après un drag depuis le compendium). Après un rechargement de page, les compendium packs sont réindexés mais les documents complets ne sont pas toujours en mémoire — dans ce cas, `fromUuidSync` retourne `null` et le fallback `game.items.get()` prend le relais (si l'item est aussi dans le monde).

### Pattern : Copie des armes par défaut

Le champ `defaultWeapons` du ClassModel est un `ArrayField<StringField>` — c'est une liste de **noms d'armes** (strings), PAS des références à des Item Weapon.

**Stratégie de copie :**
1. Pour chaque nom dans `defaultWeapons`
2. Chercher un Item Weapon correspondant dans les world items (`game.items.find(i => i.type === "weapon" && i.name === name)`)
3. Si trouvé → copier ses données complètes comme owned Item
4. Si pas trouvé → créer un Item Weapon minimal avec juste le nom

```javascript
async #createDefaultWeapons(defaultWeaponNames) {
  const weaponData = [];
  for (const name of defaultWeaponNames) {
    // Chercher un weapon existant par nom exact
    const existing = game.items.find(i => i.type === "weapon" && i.name === name);
    if (existing) {
      const data = existing.toObject();
      delete data._id; // Laisser Foundry générer un nouvel ID
      weaponData.push(data);
    } else {
      // Créer un weapon minimal
      weaponData.push({ name, type: "weapon" });
    }
  }
  if (weaponData.length) {
    await this.actor.createEmbeddedDocuments("Item", weaponData);
  }
}
```

### Pattern : Remplacement de classe (AC #2)

Quand un actor a déjà une classe et qu'une nouvelle est droppée :

```javascript
async #onDropClassItem(item) {
  const hadPreviousClass = !!this.actor.system.classId;

  // 1. Supprimer TOUTES les armes owned actuelles (si remplacement)
  if (hadPreviousClass) {
    const weaponIds = this.actor.items
      .filter(i => i.type === "weapon")
      .map(i => i.id);
    if (weaponIds.length) {
      await this.actor.deleteEmbeddedDocuments("Item", weaponIds);
    }
  }

  // 2. Stocker le UUID de la nouvelle classe
  await this.actor.update({ "system.classId": item.uuid });

  // 3. Copier les armes par défaut de la nouvelle classe
  await this.#createDefaultWeapons(item.system.defaultWeapons ?? []);

  // 4. Notification
  const msgKey = hadPreviousClass ? "HAYWIRE.ClassReplaced" : "HAYWIRE.ClassAssigned";
  ui.notifications.info(game.i18n.format(msgKey, { name: item.name }));
}
```

**ATTENTION — AC #2 précise :** "les anciennes armes issues de la classe précédente sont supprimées". On supprime TOUTES les armes owned (pas seulement celles qui correspondent aux defaultWeapons de l'ancienne classe) car il n'y a pas de mécanisme de tracking "quelle arme vient de la classe vs ajoutée manuellement". C'est un choix délibéré — le joueur devra ré-ajouter ses armes custom après un changement de classe. Si cette UX pose problème, une amélioration future pourrait tracker l'origine des armes.

### Pattern : Feedback visuel drag-over

La zone `.haywire-sheet-class-image` dans le template est naturellement la cible de drop visuelle. Le feedback se fait via un changement de bordure/fond.

```javascript
// Dans _onRender
_onRender(context, options) {
  super._onRender(context, options);
  const dropZone = this.element.querySelector(".haywire-sheet-class-image");
  if (!dropZone) return;

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("haywire-drop-target");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("haywire-drop-target");
  });
  dropZone.addEventListener("drop", () => {
    dropZone.classList.remove("haywire-drop-target");
  });
}
```

```css
/* CSS pour le feedback de drop */
.haywire-drop-target {
  border-color: var(--haywire-color-accent) !important;
  background: rgba(212, 160, 23, 0.15) !important;
  box-shadow: 0 0 8px rgba(212, 160, 23, 0.3);
}
```

**NOTE :** Le drop lui-même est géré par `_onDropItem` (appelé par ActorSheetV2 sur toute la sheet), pas par l'event listener du drop zone. Les listeners ici ne gèrent que le feedback VISUEL.

### Data Models — Schemas pertinents (RÉFÉRENCE, NE PAS MODIFIER)

**SoldierModel (module/models/soldier-model.mjs) :**
```
classId: StringField(required:false, blank:true, initial:"")  ← stockera le UUID
hitPoints: SchemaField { value: Number, max: Number }
actionPoints: Number
combatStats: SchemaField { easy: Number, medium: Number, hard: Number }
conditions: SetField<StringField>
suppression: Number
```

**ClassModel (module/models/class-model.mjs) :**
```
tier: Number(min:1, max:3, initial:1)
combatStats: SchemaField { easy: Number(init:5), medium: Number(init:9), hard: Number(init:13) }
skills: ArrayField<SchemaField { name: String, description: String }>
defaultWeapons: ArrayField<String(required, blank:false)>
imagePath: FilePathField(categories: ["IMAGE"])
```

### Clés i18n existantes pertinentes (RÉFÉRENCE)

**Déjà présentes :**
- `HAYWIRE.NoClassAssigned` → "Aucune classe assignée"
- `HAYWIRE.DragClassHint` → "Glissez une classe depuis le compendium"
- `HAYWIRE.EquippedWeapons` → "Armes équipées"
- `HAYWIRE.NoWeapons` → "Aucune arme équipée"

**Clés à AJOUTER :**
- `HAYWIRE.ClassAssigned` → EN: "Class assigned: {name}" / FR: "Classe assignée : {name}"
- `HAYWIRE.ClassReplaced` → EN: "Class replaced: {name}" / FR: "Classe remplacée : {name}"
- `HAYWIRE.InvalidDrop` → EN: "Only Class or Weapon items can be dropped here" / FR: "Seuls les items Classe ou Arme peuvent être déposés ici"

### Learnings des Stories précédentes (CRITIQUES)

**Erreurs corrigées en code review — NE PAS RÉPÉTER :**

1. **Template cassé après renommage de champ** : Vérifier la cohérence modèle ↔ template ↔ i18n (Story 1.2)
2. **Labels en dur au lieu de i18n** : TOUJOURS utiliser `{{localize "HAYWIRE.*"}}` et `game.i18n.localize()`/`.format()` (Story 1.1)
3. **WeaponModel choices format** : Les choices doivent être un objet `{value: "i18n.key"}`, pas un array (Story 1.1)
4. **Math.clamp (pas Math.clamped)** : Utiliser `Math.clamp()` en V13 (Story 1.2)
5. **Namespace V13 complet** : `foundry.applications.apps.DocumentSheetConfig.registerSheet()` (Story 1.1)
6. **`_onRender` pas `activateListeners`** : ApplicationV2 utilise `_onRender(context, options)`, pas l'ancien `activateListeners(html)` (Story 2.1)
7. **Pas de `<form>` dans les templates HBS** : DocumentSheetV2 gère le form wrapper (Story 2.2)
8. **Boutons `type="button"` pas `type="submit"`** : Pour éviter le submit du formulaire (Story 2.2)

**Patterns établis par Story 2.2 — ClassSheet :**
- `_onRender` avec event listeners DOM pour les actions dynamiques
- `_prepareContext` enrichi avec source, isEditable
- FilePicker pour la sélection d'images
- Add/remove sur ArrayField via `this.item.update()` explicite

### Anti-patterns à éviter ABSOLUMENT

- **NE PAS** créer de nouveau fichier — tous existent déjà
- **NE PAS** modifier les data models (soldier-model.mjs, class-model.mjs, weapon-model.mjs) — schemas COMPLETS
- **NE PAS** modifier le template soldier-sheet.hbs — il est DÉJÀ complet pour cette story
- **NE PAS** utiliser jQuery — DOM natif uniquement
- **NE PAS** utiliser `activateListeners(html)` — utiliser `_onRender(context, options)`
- **NE PAS** appeler `document.update()` dans `prepareDerivedData()` — provoque des boucles infinies
- **NE PAS** utiliser `document.data` — utiliser `document.system` (convention V13)
- **NE PAS** oublier le fallback `game.items.get()` après `fromUuidSync()` — rétrocompatibilité
- **NE PAS** mettre de logique métier dans la sheet — la logique de résolution de classe est dans le Document (HaywireActor) et la logique de drop dans la Sheet (SoldierSheet) car c'est un event handler UI
- **NE PAS** écrire de texte en dur dans les notifications — TOUJOURS `game.i18n.localize()` ou `game.i18n.format()`

### Project Structure Notes

Aucun changement de structure. Aucun nouveau fichier. Modifications in-place uniquement.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — Acceptance criteria originaux
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Injection de classe hybride (référence + copie)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Sheet patterns DocumentSheetV2
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Error handling convention
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow] — Flux complet Compendium → Drop → Actor → Render
- [Source: _bmad-output/implementation-artifacts/2-2-fiches-item-class-et-weapon.md] — Story précédente, learnings, patterns V13 sheets
- [Source: FoundryVTT V13 API — ActorSheetV2._onDropItem] — https://foundryvtt.com/api/classes/foundry.applications.sheets.ActorSheetV2.html
- [Source: FoundryVTT V13 API — fromUuidSync] — Résolution synchrone de documents par UUID
- [Source: FoundryVTT V13 API — DragDrop] — https://foundryvtt.com/api/classes/foundry.applications.ux.DragDrop.html

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun bug rencontré durant l'implémentation.

### Completion Notes List

- Tasks 1-6 complétées
- Task 7 (tests manuels dans FoundryVTT) reste à faire par l'utilisateur
- **PIVOT ARCHITECTURAL :** L'implémentation a divergé des ACs originaux par choix délibéré de l'utilisateur :
  - Les armes et skills ne sont **PAS** des owned Items mais des **références UUID** résolues au render
  - Les combatStats ne sont plus dérivées dans `prepareDerivedData` mais dans `_prepareContext` (car les références externes ne déclenchent pas prepareDerivedData)
  - Les skills sont devenues des Items standalone (type "skill") avec drag & drop
  - Le token et portrait de l'actor sont mis à jour avec l'image de la classe
- L'override `_onDropItem` route les drops par type (class → UUID + image, weapon → UUID, skill → UUID, autre → ignoré)
- `fromUuidSync()` avec fallback `game.items.get()` assure la compatibilité UUID compendium + ID monde
- Hooks `updateItem`/`deleteItem` avec `#isRelevantItem` pour re-render quand un item référencé change
- Clés i18n : ClassAssigned, ClassReplaced, InvalidDrop, DragWeaponHint, DragSkillHint, SheetSkill, CompendiumSkills + TYPES.Item.skill

### Change Log

| Date | Changement |
|---|---|
| 2026-03-05 | Tasks 1-6 implémentées, status → review |
| 2026-03-05 | Pivot architectural : owned items → références UUID (demande utilisateur) |
| 2026-03-05 | Ajout skills comme Items standalone (type "skill") avec drag & drop |
| 2026-03-05 | Token/portrait actor mis à jour avec image de classe |
| 2026-03-05 | Code review : fix déduplication armes, i18n orphelines, hints drag soldier |

### File List

| Fichier | Action |
|---|---|
| `module/sheets/soldier-sheet.mjs` | Modifié — `_onDropItem` (class/weapon/skill), `#onDropClassItem` (UUID + image token), `#onDropWeaponItem`/`#onDropSkillItem` (UUID avec déduplication classe), `_prepareContext` (résolution live UUIDs pour combatStats, skills, weapons), `_onRender` (feedback visuel), hooks `updateItem`/`deleteItem` avec `#isRelevantItem`, actions `removeWeapon`/`removeSkill` |
| `module/documents/haywire-actor.mjs` | Modifié — combatStats supprimées de `_prepareSoldierData` (déplacées dans SoldierSheet._prepareContext) |
| `module/models/soldier-model.mjs` | Modifié — ajout `weaponIds: ArrayField<StringField>`, `skillIds: ArrayField<StringField>` |
| `module/models/class-model.mjs` | Modifié — `skills: ArrayField<SchemaField>` → `skillIds: ArrayField<StringField>` (UUIDs) |
| `module/models/skill-model.mjs` | Créé — TypeDataModel avec `description: StringField` |
| `module/sheets/skill-sheet.mjs` | Créé — Sheet minimale (nom + description) |
| `module/sheets/class-sheet.mjs` | Modifié — `#onDrop` accepte weapon + skill, `_prepareContext` résout skillIds + defaultWeapons par UUID, remove skill/weapon par UUID |
| `templates/actor/soldier-sheet.hbs` | Modifié — skills (classe + propres avec fromClass flag), weapons par UUID (avec fromClass), hints drag |
| `templates/item/class-sheet.hbs` | Modifié — skills affichées comme noms résolus (drag & drop, plus d'inputs inline), weapons par UUID |
| `templates/item/skill-sheet.hbs` | Créé — fiche simple nom + description |
| `system.json` | Modifié — ajout `"skill": {}` dans documentTypes.Item, pack skills |
| `haywire.mjs` | Modifié — imports SkillModel + SkillSheet, CONFIG.Item.dataModels.skill, registerSheet skill, template preloading |
| `styles/haywire.css` | Modifié — ajout `.haywire-drop-target`, `.haywire-missing` |
| `lang/en.json` | Modifié — ajout/maj clés i18n (DragWeaponHint, DragSkillHint, SheetSkill, CompendiumSkills, InvalidDrop, TYPES.Item.skill, etc.) |
| `lang/fr.json` | Modifié — traductions FR correspondantes |
