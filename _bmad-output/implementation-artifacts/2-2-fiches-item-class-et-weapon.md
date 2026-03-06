# Story 2.2: Fiches Item Class et Weapon

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a joueur,
I want créer et éditer des Items Class et Weapon avec leurs fiches dédiées,
so that je puisse gérer les classes et armes du jeu.

## Acceptance Criteria

1. **Given** un monde Haywire chargé **When** le joueur crée un Item de type Class **Then** la ClassSheet s'affiche avec les champs : nom, tier, combat stats (easy/medium/hard), skills, armes par défaut, image de carte
2. **Given** un Item Class ouvert **When** le joueur modifie tier, combatStats, imagePath **Then** les valeurs sont sauvegardées automatiquement via submitOnChange
3. **Given** un Item Class ouvert **When** le joueur ajoute un skill (nom + description) **Then** le skill apparaît dans la liste et est sauvegardé
4. **Given** un Item Class avec des skills **When** le joueur supprime un skill **Then** le skill est retiré et la sauvegarde est immédiate
5. **Given** un Item Class ouvert **When** le joueur ajoute une arme par défaut (texte) **Then** l'arme apparaît dans la liste defaultWeapons
6. **Given** un Item Class ouvert **When** le joueur clique sur le champ image **Then** un file picker s'ouvre pour sélectionner une image depuis assets/cards/
7. **Given** un monde Haywire chargé **When** le joueur crée un Item de type Weapon **Then** la WeaponSheet s'affiche avec les champs : nom, type (Primary/Secondary/Sidearm/Equipment), portée, cadence de tir, pénétration, modificateurs, spécial
8. **Given** un Item Weapon ouvert **When** le joueur modifie n'importe quel champ **Then** la valeur est sauvegardée automatiquement
9. **Given** les fiches Class et Weapon **When** le CSS est inspecté **Then** le CSS utilise les mêmes variables et conventions que la SoldierSheet (`.haywire-*`, `@layer haywire`)

## Tasks / Subtasks

- [x] Task 1 — Réécrire le template class-sheet.hbs avec tous les champs du ClassModel (AC: #1, #2, #6)
  - [x] 1.1 Section header : nom de l'Item (`name` éditable) et image de carte avec file picker
  - [x] 1.2 Section tier : input numérique (name="system.tier", min=1, max=3)
  - [x] 1.3 Section combat stats : 3 inputs numériques pour easy, medium, hard (name="system.combatStats.easy" etc.) avec labels i18n — format "X+" affiché visuellement
  - [x] 1.4 Section skills : liste itérable des skills existants (nom + description), chaque skill éditable in-place, bouton supprimer par skill
  - [x] 1.5 Section skills : bouton "Ajouter un skill" qui ajoute une entrée vide à la liste
  - [x] 1.6 Section defaultWeapons : liste itérable des noms d'armes (texte), chaque entrée éditable, bouton supprimer par entrée
  - [x] 1.7 Section defaultWeapons : bouton "Ajouter une arme" qui ajoute une entrée vide
  - [x] 1.8 Section image : utiliser le file picker natif Foundry (`type="file"` avec `data-action="browseFiles"` ou implémentation via _onRender)
  - [x] 1.9 Utiliser `{{localize "HAYWIRE.*"}}` pour TOUS les labels
  - [x] 1.10 Ne PAS inclure de balise `<form>` dans le template

- [x] Task 2 — Enrichir ClassSheet._prepareContext() et ajouter les actions (AC: #1, #3, #4, #5, #6)
  - [x] 2.1 Passer `item`, `system`, `source` (= item.toObject().system), `isEditable` dans le contexte
  - [x] 2.2 Passer `skills` comme Array depuis system.skills pour itération HBS
  - [x] 2.3 Passer `defaultWeapons` comme Array depuis system.defaultWeapons pour itération HBS
  - [x] 2.4 Implémenter la gestion add/remove pour skills dans _onRender ou via actions DOM
  - [x] 2.5 Implémenter la gestion add/remove pour defaultWeapons dans _onRender ou via actions DOM
  - [x] 2.6 Implémenter le file picker pour imagePath (via `FilePicker.browse()` ou `_onEditImage`)
  - [x] 2.7 Augmenter DEFAULT_OPTIONS.position si nécessaire (la fiche Class est plus riche que prévu)

- [x] Task 3 — Enrichir le template weapon-sheet.hbs (AC: #7, #8)
  - [x] 3.1 Vérifier que TOUS les champs du WeaponModel sont présents et correctement liés (weaponType, range, rateOfFire, penetration, modifiers, special)
  - [x] 3.2 Le template actuel est DÉJÀ quasi-complet — vérifier la cohérence des noms de champs et des clés i18n
  - [x] 3.3 Ajouter le CSS classes `.haywire-*` manquantes si nécessaire pour cohérence

- [x] Task 4 — Enrichir WeaponSheet._prepareContext() (AC: #7, #8)
  - [x] 4.1 Passer `item`, `system`, `source`, `isEditable` dans le contexte
  - [x] 4.2 Passer les choices de weaponType pour le select (depuis le schema si possible)

- [x] Task 5 — Ajouter le CSS des fiches Item dans haywire.css (AC: #9)
  - [x] 5.1 Styler `.haywire-sheet-body` pour les fiches Item (réutiliser les variables CSS de Story 2.1)
  - [x] 5.2 Styler `.haywire-skills-list` : liste des skills avec inputs inline et boutons supprimer
  - [x] 5.3 Styler `.haywire-weapons-list` : liste des armes par défaut
  - [x] 5.4 Styler `.haywire-image-picker` : zone image cliquable avec preview
  - [x] 5.5 Styler `.haywire-add-button` / `.haywire-remove-button` : boutons d'ajout/suppression
  - [x] 5.6 Vérifier cohérence visuelle avec la SoldierSheet (même thème militaire)

- [x] Task 6 — Ajouter les clés i18n manquantes (AC: #1, #7)
  - [x] 6.1 Vérifier toutes les clés nécessaires pour les nouveaux éléments de la ClassSheet
  - [x] 6.2 Ajouter dans en.json/fr.json : `HAYWIRE.AddSkill`, `HAYWIRE.RemoveSkill`, `HAYWIRE.AddWeapon`, `HAYWIRE.RemoveWeapon`, `HAYWIRE.SkillName`, `HAYWIRE.SkillDescription`

- [ ] Task 7 — Vérification manuelle dans FoundryVTT (AC: #1-#9) — REQUIERT TEST DANS FOUNDRY
  - [ ] 7.1 Créer un Item Class, vérifier que tous les champs s'affichent
  - [ ] 7.2 Ajouter/supprimer des skills, vérifier la sauvegarde
  - [ ] 7.3 Ajouter/supprimer des armes par défaut, vérifier la sauvegarde
  - [ ] 7.4 Tester le file picker pour l'image de carte
  - [ ] 7.5 Créer un Item Weapon, vérifier que tous les champs s'affichent et se sauvegardent
  - [ ] 7.6 Vérifier le CSS cohérent avec la SoldierSheet
  - [ ] 7.7 Vérifier 0 erreurs et 0 warnings de deprecation dans la console

## Dev Notes

### Contexte : fichiers existants à modifier (PAS de nouveaux fichiers)

**IMPORTANT :** Tous les fichiers existent depuis Story 1.1. Cette story MODIFIE les fichiers existants.

**État actuel des fichiers à modifier :**

| Fichier | État actuel | Ce qui doit changer |
|---|---|---|
| `templates/item/class-sheet.hbs` | Minimal (nom + tier + imagePath seulement) | Réécrire avec combatStats, skills add/remove, defaultWeapons add/remove, file picker |
| `templates/item/weapon-sheet.hbs` | Quasi-complet (tous les champs du schema) | Vérifier cohérence, ajouter classes CSS `.haywire-*` |
| `module/sheets/class-sheet.mjs` | `_prepareContext` minimal (item + system) | Enrichir context + implémenter actions add/remove skills/weapons + file picker |
| `module/sheets/weapon-sheet.mjs` | `_prepareContext` minimal (item + system) | Enrichir context (source, isEditable, weaponTypeChoices) |
| `styles/haywire.css` | Stub ou styles de Story 2.1 | Ajouter styles des fiches Item |
| `lang/en.json` | Clés existantes | Ajouter ~6 clés (AddSkill, RemoveSkill, etc.) |
| `lang/fr.json` | Traductions FR existantes | Ajouter traductions correspondantes |

**Fichiers à NE PAS modifier :**
- `module/models/class-model.mjs` — schema complet et correct
- `module/models/weapon-model.mjs` — schema complet et correct
- `module/documents/haywire-item.mjs` — stub minimal conforme
- `haywire.mjs` — registration pattern OK
- `system.json` — manifest OK

### Code source actuel — ClassSheet (module/sheets/class-sheet.mjs)

```javascript
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class ClassSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/item/class-sheet.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "item", "class"],
    position: { width: 500, height: 400 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    return context;
  }
}
```

### Code source actuel — Template class-sheet.hbs

```handlebars
<section class="haywire-sheet-body">
  <h1 class="haywire-sheet-title">{{item.name}}</h1>

  <div class="haywire-sheet-stats">
    <div class="haywire-stat">
      <label>{{localize "HAYWIRE.Tier"}}</label>
      <input type="number" name="system.tier" value="{{system.tier}}" min="1" max="3" />
    </div>
    <div class="haywire-stat">
      <label>{{localize "HAYWIRE.ImagePath"}}</label>
      <input type="text" name="system.imagePath" value="{{system.imagePath}}" placeholder="systems/haywire/assets/cards/..." />
    </div>
  </div>
</section>
```

**MANQUENT dans le template actuel :**
- `system.combatStats.easy` / `.medium` / `.hard` — les 3 seuils de combat
- `system.skills` — la liste de skills (ArrayField de SchemaField {name, description})
- `system.defaultWeapons` — la liste d'armes par défaut (ArrayField de StringField)
- File picker natif pour l'image au lieu d'un simple input text

### Code source actuel — WeaponSheet (module/sheets/weapon-sheet.mjs)

```javascript
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class WeaponSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/item/weapon-sheet.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "item", "weapon"],
    position: { width: 500, height: 400 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    return context;
  }
}
```

### Code source actuel — Template weapon-sheet.hbs

```handlebars
<section class="haywire-sheet-body">
  <h1 class="haywire-sheet-title">{{item.name}}</h1>

  <div class="haywire-sheet-stats">
    <div class="haywire-stat">
      <label>{{localize "HAYWIRE.Type"}}</label>
      <select name="system.weaponType">
        <option value="Primary" {{#if (eq system.weaponType "Primary")}}selected{{/if}}>{{localize "HAYWIRE.WeaponType.Primary"}}</option>
        <option value="Secondary" {{#if (eq system.weaponType "Secondary")}}selected{{/if}}>{{localize "HAYWIRE.WeaponType.Secondary"}}</option>
        <option value="Sidearm" {{#if (eq system.weaponType "Sidearm")}}selected{{/if}}>{{localize "HAYWIRE.WeaponType.Sidearm"}}</option>
        <option value="Equipment" {{#if (eq system.weaponType "Equipment")}}selected{{/if}}>{{localize "HAYWIRE.WeaponType.Equipment"}}</option>
      </select>
    </div>
    <!-- ... range, rateOfFire, penetration, modifiers, special — TOUS présents -->
  </div>
</section>
```

**Le template weapon-sheet.hbs est DÉJÀ quasi-complet** — tous les champs du WeaponModel sont présents avec les bons noms et les bonnes clés i18n. Seuls les classes CSS et un éventuel enrichissement visuel sont nécessaires.

### Data Models — Schemas complets (RÉFÉRENCE, NE PAS MODIFIER)

**ClassModel (module/models/class-model.mjs) :**
```
tier: Number(min:1, max:3, init:1)
combatStats: SchemaField {
  easy: Number(min:1, init:5),      // Seuil D20 cible à découvert
  medium: Number(min:1, init:9),    // Seuil D20 derrière couverture OU armure
  hard: Number(min:1, init:13)      // Seuil D20 couverture ET armure
}
skills: ArrayField<SchemaField { name: String(required), description: String(init:"") }>
defaultWeapons: ArrayField<String(required, blank:false)>
imagePath: FilePathField(categories: ["IMAGE"])
```

**WeaponModel (module/models/weapon-model.mjs) :**
```
weaponType: String(init:"Primary", choices: {Primary, Secondary, Sidearm, Equipment})
range: Number(min:0, init:0)           // Portée en pouces (0 = mêlée)
rateOfFire: Number(min:1, init:1)      // Nombre de D20 par action
penetration: Number(min:0, init:0)     // Anti-véhicule
modifiers: Number(init:0)             // Modificateur au jet
special: String(blank:true, init:"")   // Règles spéciales (Frag, Smoke, etc.)
```

### Clés i18n existantes (RÉFÉRENCE)

**Déjà présentes pour les fiches Item :**
- `HAYWIRE.Tier`, `HAYWIRE.ImagePath`
- `HAYWIRE.CombatStats.Label` / `.Easy` / `.Medium` / `.Hard`
- `HAYWIRE.Skills`, `HAYWIRE.DefaultWeapons`
- `HAYWIRE.Type`, `HAYWIRE.Range`, `HAYWIRE.RateOfFire`, `HAYWIRE.Penetration`, `HAYWIRE.Modifiers`, `HAYWIRE.Special`
- `HAYWIRE.WeaponType.Primary` / `.Secondary` / `.Sidearm` / `.Equipment`
- `HAYWIRE.Name`

**Clés à AJOUTER :**
- `HAYWIRE.AddSkill` → EN: "Add Skill" / FR: "Ajouter une compétence"
- `HAYWIRE.RemoveSkill` → EN: "Remove" / FR: "Supprimer"
- `HAYWIRE.AddWeapon` → EN: "Add Weapon" / FR: "Ajouter une arme"
- `HAYWIRE.RemoveWeapon` → EN: "Remove" / FR: "Supprimer"
- `HAYWIRE.SkillName` → EN: "Skill Name" / FR: "Nom de compétence"
- `HAYWIRE.SkillDescription` → EN: "Description" / FR: "Description"

### Pattern CRITIQUE : ArrayField add/remove dans ApplicationV2

**Le défi principal de cette story** est la gestion des listes dynamiques (skills et defaultWeapons) dans le framework ApplicationV2/DocumentSheetV2. Les ArrayField ne sont PAS gérés automatiquement par `submitOnChange` pour l'ajout/suppression d'éléments.

**Pattern recommandé — _onRender avec event listeners DOM :**

```javascript
// Dans ClassSheet
_onRender(context, options) {
  super._onRender(context, options);

  // Bouton ajouter un skill
  this.element.querySelector("[data-action='add-skill']")?.addEventListener("click", () => {
    const skills = this.item.system.skills.concat([{ name: "", description: "" }]);
    this.item.update({ "system.skills": skills });
  });

  // Boutons supprimer un skill
  this.element.querySelectorAll("[data-action='remove-skill']").forEach(btn => {
    btn.addEventListener("click", (event) => {
      const index = Number(event.currentTarget.dataset.index);
      const skills = this.item.system.skills.filter((_, i) => i !== index);
      this.item.update({ "system.skills": skills });
    });
  });

  // Même pattern pour defaultWeapons
}
```

**Template HBS pour les skills — pattern avec index :**

```handlebars
{{#each skills}}
<div class="haywire-skill-entry" data-index="{{@index}}">
  <input type="text" name="system.skills.{{@index}}.name" value="{{this.name}}"
         placeholder="{{localize 'HAYWIRE.SkillName'}}" />
  <input type="text" name="system.skills.{{@index}}.description" value="{{this.description}}"
         placeholder="{{localize 'HAYWIRE.SkillDescription'}}" />
  <button type="button" data-action="remove-skill" data-index="{{@index}}">
    <i class="fas fa-trash"></i>
  </button>
</div>
{{/each}}
<button type="button" data-action="add-skill">
  <i class="fas fa-plus"></i> {{localize "HAYWIRE.AddSkill"}}
</button>
```

**IMPORTANT — bindings pour ArrayField dans submitOnChange :**
- Les champs `name="system.skills.0.name"` sont automatiquement résolus par DocumentSheetV2 lors du submit
- L'édition in-place des valeurs existantes fonctionne avec submitOnChange
- L'ajout et la suppression nécessitent un `this.item.update()` explicite (pas de submitOnChange)
- Le bouton add/remove DOIT être `type="button"` (pas `type="submit"`) pour éviter un submit du formulaire

### Pattern : File Picker pour imagePath

**Approche recommandée — file picker Foundry natif :**

```javascript
// Dans ClassSheet._onRender
this.element.querySelector("[data-action='browse-image']")?.addEventListener("click", async () => {
  const picker = new FilePicker({
    type: "image",
    current: this.item.system.imagePath || "systems/haywire/assets/cards/",
    callback: (path) => {
      this.item.update({ "system.imagePath": path });
    },
  });
  picker.browse();
});
```

**Template HBS pour le file picker :**

```handlebars
<div class="haywire-image-picker">
  {{#if system.imagePath}}
    <img src="{{system.imagePath}}" class="haywire-class-image" data-action="browse-image" />
  {{else}}
    <div class="haywire-placeholder" data-action="browse-image">
      <i class="fas fa-image"></i>
      {{localize "HAYWIRE.ImagePath"}}
    </div>
  {{/if}}
</div>
```

### Dépendance Story 2.1

**IMPORTANT :** Story 2.1 crée le CSS de base (`haywire.css` avec variables, thème militaire). Si Story 2.1 n'est PAS encore implémentée au moment où Story 2.2 est développée :
- Le dev agent doit créer les variables CSS lui-même dans `@layer haywire`
- Ou attendre que Story 2.1 soit terminée

Si Story 2.1 EST implémentée :
- Réutiliser les variables CSS existantes (`--haywire-color-primary`, `--haywire-color-bg`, etc.)
- Ajouter les styles des fiches Item en complément dans le même `@layer haywire`

### Learnings des Stories précédentes (CRITIQUES)

**Erreurs corrigées en code review — NE PAS RÉPÉTER :**

1. **Template cassé après renommage de champ** : Le renommage `damage` → `rateOfFire` dans le modèle n'a PAS été répercuté dans le template HBS. **Leçon : vérifier la cohérence modèle <-> template <-> i18n** (Story 1.2)
2. **Labels en dur au lieu de i18n** : TOUJOURS utiliser `{{localize "HAYWIRE.*"}}` (Story 1.1)
3. **WeaponModel choices format** : Les choices doivent être un objet `{value: "i18n.key"}`, pas un array (Story 1.1)
4. **Math.clamp (pas Math.clamped)** : Utiliser `Math.clamp()` en V13 (Story 1.2)
5. **Namespace V13 complet** : `foundry.applications.apps.DocumentSheetConfig.registerSheet()` (Story 1.1)

### Données du domaine HAYWIRE V2

**Cartes de classe (p.27) — ce que la ClassSheet doit permettre de saisir :**
- **Nom** : ex. "Team Leader", "Breacher", "Sniper"
- **Tier** : 1, 2 ou 3 (rang de la classe)
- **Combat Stats** : 3 seuils D20 (Easy/Medium/Hard) — ex. Team Leader = 5+ | 9+ | 13+
- **Skills** : liste de compétences avec nom et description — ex. { name: "EMPOWER", description: "Give 1 of his AP to another friendly model" }
- **Armes par défaut** : liste texte — ex. "Assault rifle, pistol, melee weapon, frag & stun grenade, body armor"
- **Image** : photo de la carte physique (JPG dans assets/cards/)

### Anti-patterns à éviter ABSOLUMENT

- **NE PAS** créer de nouveau fichier — tous existent déjà
- **NE PAS** modifier les data models (class-model.mjs, weapon-model.mjs) — schemas COMPLETS
- **NE PAS** utiliser jQuery — DOM natif uniquement
- **NE PAS** mettre de `<form>` dans les templates HBS
- **NE PAS** utiliser `activateListeners(html)` — utiliser `_onRender(context, options)`
- **NE PAS** utiliser `type="submit"` pour les boutons add/remove — utiliser `type="button"`
- **NE PAS** oublier les préfixes `.haywire-` sur TOUS les sélecteurs CSS
- **NE PAS** écrire de texte en dur dans les templates — TOUJOURS `{{localize}}`
- **NE PAS** modifier haywire-item.mjs — stub minimal conforme

### Project Structure Notes

Aucun changement de structure. Aucun nouveau fichier. Modifications in-place uniquement.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — Acceptance criteria originaux
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Sheet patterns, template strategy
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — ClassModel, WeaponModel schema decisions
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Naming, CSS, file structure
- [Source: _bmad-output/implementation-artifacts/1-1-creation-du-squelette-projet-foundryvtt-v13.md] — Code review fixes
- [Source: _bmad-output/implementation-artifacts/1-2-data-models-et-documents-custom.md] — Data model enrichi, learnings
- [Source: _bmad-output/implementation-artifacts/2-1-fiche-soldier-basique-avec-template.md] — Story précédente, patterns V13 sheets
- [Source: HAYWIRE V2 Rulebook v2.0.4 p.27] — Classes et cartes
- [Source: FoundryVTT V13 API — ItemSheetV2] — https://foundryvtt.com/api/classes/foundry.applications.sheets.ItemSheetV2.html
- [Source: FoundryVTT V13 API — HandlebarsApplicationMixin] — https://foundryvtt.com/api/functions/foundry.applications.api.HandlebarsApplicationMixin.html
- [Source: FoundryVTT V13 API — FilePicker] — https://foundryvtt.com/api/classes/foundry.applications.apps.FilePicker.html

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème rencontré. Implémentation fluide suivant les patterns documentés dans les Dev Notes.

### Completion Notes List

- **Task 1** : Template class-sheet.hbs entièrement réécrit avec header (nom éditable + image picker), tier, combatStats (3 inputs éditables), skills (liste dynamique avec add/remove), defaultWeapons (liste dynamique avec add/remove). Tous les labels en i18n, pas de `<form>`, boutons `type="button"`.
- **Task 2** : ClassSheet.mjs enrichi — `_prepareContext` passe item, system, source, isEditable, skills, defaultWeapons. `_onRender` implémente 5 event listeners : add-skill, remove-skill, add-weapon, remove-weapon, browse-image (FilePicker). Position augmentée à 550x600.
- **Task 3** : Template weapon-sheet.hbs enrichi avec header (nom éditable), select dynamique via weaponTypeChoices, classes CSS `.haywire-*` cohérentes, `isEditable` pour disable, stats en 2 rangées.
- **Task 4** : WeaponSheet.mjs enrichi — `_prepareContext` passe source, isEditable, weaponTypeChoices (construit depuis le schema). Position ajustée à 550x350.
- **Task 5** : CSS ajouté dans `@layer haywire` : `.haywire-sheet-section`, `.haywire-image-picker`, `.haywire-class-image`, `.haywire-threshold-input`, `.haywire-skills-list`, `.haywire-skill-entry`, `.haywire-skill-name`, `.haywire-skill-desc`, `.haywire-weapons-list`, `.haywire-weapon-entry`, `.haywire-weapon-name`, `.haywire-add-button`, `.haywire-remove-button`, `.haywire-special-input`, `.haywire-stat select`. Réutilise toutes les variables CSS de Story 2.1.
- **Task 6** : 6 clés i18n ajoutées en EN et FR : AddSkill, RemoveSkill, AddWeapon, RemoveWeapon, SkillName, SkillDescription.
- **Task 7** : REQUIERT TEST MANUEL dans FoundryVTT par l'utilisateur.

### Change Log

- 2026-03-05 : Implémentation complète des fiches Item Class et Weapon (Tasks 1-6). ClassSheet avec gestion dynamique skills/weapons/file picker. WeaponSheet enrichie avec choices dynamiques. CSS cohérent avec SoldierSheet. i18n EN/FR complet.
- 2026-03-05 : **Code Review (AI)** — 4 HIGH, 3 MEDIUM, 1 LOW trouvés. 6 issues corrigés automatiquement :
  - [H1-H2] Ajout `disabled`/`{{#if isEditable}}` sur inputs skills/weapons et boutons add/remove dans class-sheet.hbs
  - [H3] Ajout guard `if (!this.isEditable) return;` dans ClassSheet._onRender
  - [H4] Correction FilePicker : `picker.browse()` → `picker.render(true)`
  - [M1] Valeurs par défaut non-vides ("New") pour add-skill/add-weapon (respect blank:false)
  - [M2] Suppression `context.source` inutilisé dans ClassSheet et WeaponSheet
  - [M3] weaponTypeChoices via getField().choices — à vérifier en test manuel
  - [L1] Section tier isolée — non corrigé (cosmétique)

### File List

- `templates/item/class-sheet.hbs` — MODIFIÉ (réécriture complète)
- `templates/item/weapon-sheet.hbs` — MODIFIÉ (enrichi avec header, isEditable, weaponTypeChoices)
- `module/sheets/class-sheet.mjs` — MODIFIÉ (_prepareContext enrichi, _onRender avec actions)
- `module/sheets/weapon-sheet.mjs` — MODIFIÉ (_prepareContext enrichi, weaponTypeChoices)
- `styles/haywire.css` — MODIFIÉ (ajout styles fiches Item)
- `lang/en.json` — MODIFIÉ (ajout 6 clés i18n)
- `lang/fr.json` — MODIFIÉ (ajout 6 clés i18n)
