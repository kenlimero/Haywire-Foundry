# Story 3.2: Jet de tir avec modificateurs d'arme

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a joueur,
I want effectuer un jet de tir en sélectionnant une arme équipée avec ses modificateurs appliqués,
so that le résultat du combat reflète les capacités de mon arme.

## Acceptance Criteria

1. **Given** un Actor Soldier avec des armes équipées **When** le joueur sélectionne une arme et lance un jet de tir **Then** HaywireRoll construit la formule "1d20 + modificateurs de l'arme" **And** le message de chat affiche : nom de l'arme, modificateurs appliqués, formule, résultat **And** le template roll-result.hbs affiche le contexte complet du jet

2. **Given** un Actor Soldier sans arme équipée **When** le joueur tente un jet de tir **Then** une notification d'avertissement s'affiche ("Aucune arme équipée")

## Tasks / Subtasks

- [x] Task 1 — Étendre `HaywireRoll` avec la méthode `shoot()` dans `module/rolls/haywire-roll.mjs` (AC: #1)
  - [x] 1.1 Ajouter la méthode statique `HaywireRoll.shoot({ actor, weapon })` qui :
    - Construit un `new Roll("1d20 + @mod", { mod: weapon.system.modifiers })` via la Roll API native
    - Appelle `roll.evaluate()` (async)
    - Prépare les données de template (nom arme, modificateur signé, formule, résultat, seuils de combat)
    - Rend le template `roll-result.hbs` via `renderTemplate()`
    - Crée le ChatMessage via `ChatMessage.create()` avec `rolls: [roll]` et `content: renderedHTML`
  - [x] 1.2 Validation défensive : `if (!actor) throw`, `if (!weapon) throw`
  - [x] 1.3 Utiliser `ChatMessage.getSpeaker({ actor })` pour le speaker
  - [x] 1.4 Passer les seuils de combat (easy/medium/hard) au template pour contexte complet

- [x] Task 2 — Mettre à jour le template chat `templates/chat/roll-result.hbs` (AC: #1)
  - [x] 2.1 Remplacer le contenu placeholder par un template complet affichant :
    - Nom de l'arme (titre)
    - Formule du jet (ex: "1d20 + 2")
    - Résultat du dé brut (le 1d20 seul)
    - Modificateur appliqué (signé, ex: "+2" ou "-1")
    - Total final (dé + modificateur)
    - Seuils de combat de référence (Easy/Medium/Hard) pour interprétation rapide
  - [x] 2.2 Utiliser les classes CSS `.haywire-roll-*` avec préfixe système
  - [x] 2.3 Utiliser `{{localize}}` pour tous les labels du template

- [x] Task 3 — Ajouter le bouton de tir par arme dans `templates/actor/soldier-sheet.hbs` (AC: #1, #2)
  - [x] 3.1 Ajouter une colonne `<th>` pour le bouton de tir dans le `<thead>` de la table des armes
  - [x] 3.2 Ajouter un bouton de tir dans chaque `<tr>` de weapon : `<button type="button" class="haywire-btn-shoot" data-action="rollShoot" data-weapon-uuid="{{this.uuid}}"><i class="fas fa-crosshairs"></i></button>`
  - [x] 3.3 Le bouton est visible uniquement si `hasClass` est true (le joueur doit avoir une classe pour les seuils)
  - [x] 3.4 Le bouton a `type="button"` (PAS `type="submit"`)

- [x] Task 4 — Ajouter l'action `rollShoot` dans `module/sheets/soldier-sheet.mjs` (AC: #1, #2)
  - [x] 4.1 Ajouter `rollShoot: SoldierSheet.#onRollShoot` dans `DEFAULT_OPTIONS.actions`
  - [x] 4.2 Implémenter `static async #onRollShoot(event, target)` qui :
    - Récupère le UUID de l'arme depuis `target.dataset.weaponUuid`
    - Résout l'Item Weapon via `fromUuidSync(uuid) ?? game.items.get(uuid)`
    - Si l'arme n'est pas trouvée → `ui.notifications.warn()` (AC: #2)
    - Appelle `HaywireRoll.shoot({ actor: this.actor, weapon })`

- [x] Task 5 — Exposer `modifiers` et `penetration` dans `_prepareContext` de `soldier-sheet.mjs` (AC: #1)
  - [x] 5.1 Ajouter `modifiers: w.system.modifiers` et `penetration: w.system.penetration` à chaque objet weapon dans le mapping de `context.weapons`
  - [x] 5.2 Les seuils de combat (`combatStats`) sont DÉJÀ dans le context (vérifié)

- [x] Task 6 — Ajouter les clés i18n (AC: #1, #2)
  - [x] 6.1 Ajouter dans `en.json` et `fr.json` les clés pour le jet de tir et le template chat
  - [x] 6.2 Clés nécessaires : `HAYWIRE.RollShoot`, `HAYWIRE.NoWeaponEquipped`, `HAYWIRE.ShootWith`, `HAYWIRE.RollFormula`, `HAYWIRE.RollTotal`, `HAYWIRE.DieResult`, `HAYWIRE.Thresholds`

- [x] Task 7 — Ajouter les styles CSS pour le template chat et le bouton de tir (AC: #1)
  - [x] 7.1 Styler le chat card `.haywire-roll-result` dans `styles/haywire.css` (thème militaire cohérent)
  - [x] 7.2 Styler le bouton compact `.haywire-btn-shoot` pour utilisation en table (icon-only, inline)
  - [x] 7.3 Styler les seuils de combat dans le chat (`.haywire-chat-threshold-*`)

- [ ] Task 8 (REQUIERT VÉRIFICATION MANUELLE PAR L'UTILISATEUR) — Vérification manuelle dans FoundryVTT (AC: #1, #2)
  - [ ] 8.1 Créer un Actor Soldier avec une classe assignée et des armes équipées
  - [ ] 8.2 Cliquer sur le bouton de tir d'une arme → vérifier que le jet s'affiche dans le chat avec tous les détails
  - [ ] 8.3 Vérifier que le message de chat affiche : nom de l'arme, modificateurs, formule, résultat total
  - [ ] 8.4 Vérifier que les seuils de combat sont affichés dans le chat pour référence
  - [ ] 8.5 Vérifier avec une arme avec modificateur positif (+2), négatif (-1), et zéro (0)
  - [ ] 8.6 Tester un Actor Soldier SANS arme équipée → vérifier la notification d'avertissement
  - [ ] 8.7 Vérifier compatibilité Dice So Nice (si module installé, le dé 3D doit rouler)
  - [ ] 8.8 Vérifier que le bouton D20 basique (Story 3.1) fonctionne toujours
  - [ ] 8.9 Vérifier 0 erreurs et 0 warnings de deprecation dans la console
  - [ ] 8.10 Vérifier performance < 1s pour l'affichage du jet

## Dev Notes

### CONTEXTE ARCHITECTURAL CRITIQUE

**Pivot architectural des stories précédentes (Story 2.3) :**
- Les armes ne sont **PAS des owned Items** mais des **références UUID** stockées dans `weaponIds` (ArrayField de StringField) sur le SoldierModel
- Les items armes sont résolus via `fromUuidSync(uuid) ?? game.items.get(uuid)`
- La classe est une référence UUID dans `classId`
- Les combatStats (easy/medium/hard) sont dérivés depuis la classe dans `SoldierSheet._prepareContext()`

**Architecture du pipeline Roll (architecture.md) :**
- Classe utilitaire `HaywireRoll` dans `module/rolls/haywire-roll.mjs`
- Pattern : `HaywireRoll.shoot({actor, weapon})` — nouvelle méthode pour Story 3.2
- Méthode existante `HaywireRoll.d20({actor, label})` — NE PAS MODIFIER, NE PAS CASSER
- La Roll API native Foundry garantit la compatibilité Dice So Nice automatiquement
- Template chat `roll-result.hbs` pour l'affichage enrichi des résultats

**Décision Story 3.1 reportée à Story 3.2 :**
Le template `roll-result.hbs` n'a PAS été utilisé en Story 3.1 (rendu natif Foundry). C'est dans cette Story 3.2 qu'il doit être enrichi pour afficher le contexte complet du jet de tir avec modificateurs d'arme.

### Pattern EXACT : HaywireRoll.shoot() (méthode à AJOUTER)

```javascript
// module/rolls/haywire-roll.mjs — AJOUTER cette méthode à la classe existante

/**
 * Effectue un jet de tir avec une arme et envoie le résultat au chat.
 * @param {object} options
 * @param {Actor} options.actor - L'Actor Soldier qui tire
 * @param {Item} options.weapon - L'Item Weapon utilisé pour le tir
 * @returns {Promise<Roll>} Le Roll évalué
 */
static async shoot({ actor, weapon } = {}) {
  if (!actor) throw new Error("HaywireRoll.shoot requires an actor");
  if (!weapon) throw new Error("HaywireRoll.shoot requires a weapon");

  const mod = weapon.system.modifiers ?? 0;
  const formula = mod !== 0 ? "1d20 + @mod" : "1d20";
  const roll = new Roll(formula, { mod });
  await roll.evaluate();

  // Résoudre les seuils de combat depuis la classe
  const classId = actor.system.classId;
  const classItem = classId ? (fromUuidSync(classId) ?? game.items.get(classId)) : null;
  const combatStats = classItem?.system?.combatStats ?? { easy: "—", medium: "—", hard: "—" };

  // Préparer les données du template
  const templateData = {
    weaponName: weapon.name,
    formula: roll.formula,
    dieResult: roll.dice[0]?.total ?? roll.total,
    modifier: mod,
    modifierSign: mod >= 0 ? `+${mod}` : `${mod}`,
    total: roll.total,
    thresholds: {
      easy: combatStats.easy,
      medium: combatStats.medium,
      hard: combatStats.hard,
    },
    labelFormula: game.i18n.localize("HAYWIRE.RollFormula"),
    labelTotal: game.i18n.localize("HAYWIRE.RollTotal"),
    labelThresholds: game.i18n.localize("HAYWIRE.Thresholds"),
    labelEasy: game.i18n.localize("HAYWIRE.CombatStats.Easy"),
    labelMedium: game.i18n.localize("HAYWIRE.CombatStats.Medium"),
    labelHard: game.i18n.localize("HAYWIRE.CombatStats.Hard"),
  };

  // Rendre le template chat
  const content = await renderTemplate(
    "systems/haywire/templates/chat/roll-result.hbs",
    templateData,
  );

  // Créer le message de chat avec le roll attaché (pour Dice So Nice)
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: game.i18n.format("HAYWIRE.ShootWith", { weapon: weapon.name }),
    content,
    rolls: [roll],
    sound: CONFIG.sounds.dice,
  });

  return roll;
}
```

**Points critiques :**
- `new Roll("1d20 + @mod", { mod })` — la syntaxe `@variable` avec objet data est le pattern standard Foundry pour les formules paramétrées
- `roll.dice[0]?.total` donne le résultat du dé brut (avant modificateurs)
- `ChatMessage.create()` avec `rolls: [roll]` attache le roll au message — Dice So Nice les intercepte automatiquement (NFR6)
- `renderTemplate()` est la fonction globale Foundry pour rendre un template Handlebars (disponible globalement, alias de `foundry.applications.handlebars.renderTemplate`)
- Le template `roll-result.hbs` est DÉJÀ préchargé dans `haywire.mjs` (ligne 91)
- Si le modificateur est 0, utiliser la formule "1d20" sans `+ @mod` pour un affichage plus propre
- Les labels i18n sont passés en data (pas de `{{localize}}` dans le template chat car `renderTemplate()` NE REND PAS les helpers Handlebars Foundry comme `localize` par défaut — il faut les passer en data)

**CORRECTION IMPORTANTE sur `{{localize}}` :**
En fait, `renderTemplate()` de Foundry **REND** les helpers Handlebars enregistrés (dont `localize`). Le helper `{{localize}}` EST disponible dans les templates rendus via `renderTemplate()`. On peut donc utiliser `{{localize "HAYWIRE.xxx"}}` directement dans le template HBS. Les deux approches fonctionnent :
- Approche A : passer les labels localisés en data → plus explicite, plus testable
- Approche B : utiliser `{{localize}}` dans le template → plus standard Foundry

Choisir l'approche B (utiliser `{{localize}}` dans le template) pour cohérence avec tous les autres templates du projet.

### Pattern EXACT : Template chat enrichi (à REMPLACER)

```handlebars
{{!-- templates/chat/roll-result.hbs --}}
<div class="haywire-roll-result">
  <div class="haywire-roll-header">
    <i class="fas fa-crosshairs"></i>
    <span class="haywire-roll-weapon-name">{{weaponName}}</span>
  </div>

  <div class="haywire-roll-details">
    <div class="haywire-roll-formula-line">
      <span class="haywire-roll-label">{{localize "HAYWIRE.RollFormula"}}</span>
      <span class="haywire-roll-value">{{formula}}</span>
    </div>

    {{#if modifier}}
    <div class="haywire-roll-modifier-line">
      <span class="haywire-roll-label">{{localize "HAYWIRE.Modifiers"}}</span>
      <span class="haywire-roll-value">{{modifierSign}}</span>
    </div>
    {{/if}}
  </div>

  <div class="haywire-roll-total-section">
    <span class="haywire-roll-total-label">{{localize "HAYWIRE.RollTotal"}}</span>
    <span class="haywire-roll-total-value">{{total}}</span>
  </div>

  <div class="haywire-roll-thresholds">
    <span class="haywire-roll-label">{{localize "HAYWIRE.Thresholds"}}</span>
    <div class="haywire-threshold-list">
      <span class="haywire-threshold haywire-threshold-easy">{{localize "HAYWIRE.CombatStats.Easy"}} {{thresholds.easy}}</span>
      <span class="haywire-threshold haywire-threshold-medium">{{localize "HAYWIRE.CombatStats.Medium"}} {{thresholds.medium}}</span>
      <span class="haywire-threshold haywire-threshold-hard">{{localize "HAYWIRE.CombatStats.Hard"}} {{thresholds.hard}}</span>
    </div>
  </div>
</div>
```

### Pattern EXACT : Action rollShoot dans SoldierSheet

```javascript
// Ajouter dans les imports en haut de soldier-sheet.mjs (DÉJÀ FAIT en Story 3.1) :
// import { HaywireRoll } from "../rolls/haywire-roll.mjs";

// Ajouter dans DEFAULT_OPTIONS.actions :
actions: {
  removeWeapon:    SoldierSheet.#onRemoveWeapon,
  removeSkill:     SoldierSheet.#onRemoveSkill,
  removeCondition: SoldierSheet.#onRemoveCondition,
  openItem:        SoldierSheet.#onOpenItem,
  rollD20:         SoldierSheet.#onRollD20,
  rollShoot:       SoldierSheet.#onRollShoot,  // NOUVEAU
},

// Nouveau handler :
static async #onRollShoot(event, target) {
  const weaponUuid = target.dataset.weaponUuid;
  if (!weaponUuid) return;

  const weapon = fromUuidSync(weaponUuid) ?? game.items.get(weaponUuid);
  if (!weapon) {
    ui.notifications.warn(game.i18n.localize("HAYWIRE.NoWeaponEquipped"));
    return;
  }

  await HaywireRoll.shoot({
    actor: this.actor,
    weapon,
  });
}
```

**Note importante :** Le handler AC #2 ("sans arme équipée") est géré par le fait que le bouton de tir n'apparaît que sur les armes existantes dans la table. Si un joueur n'a AUCUNE arme, la table est vide et il n'y a pas de bouton de tir — le cas est géré par l'UI elle-même. Le guard `if (!weapon)` couvre le cas où un UUID devient invalide (arme supprimée entre-temps).

Pour le cas explicite AC #2 où le joueur "tente un jet de tir" sans arme, on peut aussi garder un bouton de tir générique dans la section combat ou s'appuyer sur le fait que la table vide est explicite. Le pattern actuel (boutons par arme uniquement) suffit pour couvrir l'AC.

### Pattern EXACT : Mise à jour _prepareContext pour les modifiers

```javascript
// Dans SoldierSheet._prepareContext(), modifier le mapping des weapons :
context.weapons = allWeaponUuids.map(uuid => {
  const w = fromUuidSync(uuid) ?? game.items.get(uuid);
  if (!w) return { uuid, name: `[${uuid}]`, weaponType: "?", range: 0, rateOfFire: 0, modifiers: 0, penetration: 0, missing: true };
  return {
    uuid: w.uuid,
    name: w.name,
    weaponType: game.i18n.localize(`HAYWIRE.WeaponType.${w.system.weaponType}`),
    range: w.system.range,
    rateOfFire: w.system.rateOfFire,
    modifiers: w.system.modifiers,         // NOUVEAU
    penetration: w.system.penetration,     // NOUVEAU
    fromClass: classItem?.system?.defaultWeapons?.includes(uuid) ?? false,
  };
});
```

### Pattern EXACT : Bouton de tir par arme dans le template

```handlebars
{{!-- Dans templates/actor/soldier-sheet.hbs, modifier la table des armes --}}
<table class="haywire-weapons-table">
  <thead>
    <tr>
      <th>{{localize "HAYWIRE.Name"}}</th>
      <th>{{localize "HAYWIRE.Type"}}</th>
      <th>{{localize "HAYWIRE.Range"}}</th>
      <th>{{localize "HAYWIRE.RateOfFire"}}</th>
      <th>{{localize "HAYWIRE.Modifiers"}}</th>
      {{#if ../hasClass}}<th></th>{{/if}}
      {{#if ../isEditable}}<th></th>{{/if}}
    </tr>
  </thead>
  <tbody>
    {{#each weapons}}
      <tr class="{{#if this.missing}}haywire-missing{{/if}}">
        <td><a class="haywire-item-link" data-action="openItem" data-item-uuid="{{this.uuid}}">{{this.name}}</a></td>
        <td>{{this.weaponType}}</td>
        <td>{{this.range}}</td>
        <td>{{this.rateOfFire}}</td>
        <td>{{this.modifiers}}</td>
        {{#if ../hasClass}}
          <td class="haywire-weapon-actions">
            <button type="button" class="haywire-btn-shoot" data-action="rollShoot" data-weapon-uuid="{{this.uuid}}" title="{{localize 'HAYWIRE.RollShoot'}}">
              <i class="fas fa-crosshairs"></i>
            </button>
          </td>
        {{/if}}
        {{#if ../isEditable}}
          <td class="haywire-weapon-actions">
            {{#unless this.fromClass}}
              <button type="button" class="haywire-btn-delete" data-action="removeWeapon" data-weapon-uuid="{{this.uuid}}">
                <i class="fas fa-trash"></i>
              </button>
            {{/unless}}
          </td>
        {{/if}}
      </tr>
    {{/each}}
  </tbody>
</table>
```

### Clés i18n à AJOUTER

**en.json :**
```json
"HAYWIRE.RollShoot": "Shoot",
"HAYWIRE.NoWeaponEquipped": "No weapon equipped",
"HAYWIRE.ShootWith": "Shoot with {weapon}",
"HAYWIRE.RollFormula": "Formula",
"HAYWIRE.RollTotal": "Total",
"HAYWIRE.DieResult": "Die",
"HAYWIRE.Thresholds": "Thresholds"
```

**fr.json :**
```json
"HAYWIRE.RollShoot": "Tir",
"HAYWIRE.NoWeaponEquipped": "Aucune arme équipée",
"HAYWIRE.ShootWith": "Tir avec {weapon}",
"HAYWIRE.RollFormula": "Formule",
"HAYWIRE.RollTotal": "Total",
"HAYWIRE.DieResult": "Dé",
"HAYWIRE.Thresholds": "Seuils"
```

**Note :** Les clés `HAYWIRE.CombatStats.Easy`, `HAYWIRE.CombatStats.Medium`, `HAYWIRE.CombatStats.Hard`, `HAYWIRE.Modifiers`, `HAYWIRE.Penetration` existent DÉJÀ.

### CSS à ajouter dans `@layer haywire`

```css
/* Bouton de tir compact (dans la table des armes) */
.haywire-btn-shoot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  background: var(--haywire-color-primary);
  color: var(--haywire-color-accent);
  border: 1px solid var(--haywire-color-accent);
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background 0.2s;
}

.haywire-btn-shoot:hover {
  background: var(--haywire-color-accent);
  color: var(--haywire-color-bg);
}

/* Chat card — roll result */
.haywire-roll-result {
  padding: 0.5rem;
  background: var(--haywire-color-bg);
  border: 1px solid var(--haywire-color-primary);
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--haywire-color-text);
}

.haywire-roll-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: var(--haywire-color-accent);
}

.haywire-roll-details {
  margin-bottom: 0.5rem;
}

.haywire-roll-formula-line,
.haywire-roll-modifier-line {
  display: flex;
  justify-content: space-between;
  padding: 0.15rem 0;
}

.haywire-roll-label {
  color: var(--haywire-color-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
}

.haywire-roll-value {
  font-weight: bold;
}

.haywire-roll-total-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem;
  margin: 0.5rem 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  border: 1px solid var(--haywire-color-accent);
}

.haywire-roll-total-label {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8rem;
}

.haywire-roll-total-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--haywire-color-accent);
}

.haywire-roll-thresholds {
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.haywire-threshold-list {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.2rem;
}

.haywire-threshold {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-weight: bold;
}

.haywire-threshold-easy {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.haywire-threshold-medium {
  background: rgba(212, 160, 23, 0.2);
  color: var(--haywire-color-accent);
}

.haywire-threshold-hard {
  background: rgba(192, 57, 43, 0.2);
  color: var(--haywire-color-danger);
}
```

### Fichiers à modifier / créer

| Fichier | Action | Ce qui change |
|---|---|---|
| `module/rolls/haywire-roll.mjs` | Modifier | Ajouter méthode statique `shoot()` |
| `module/sheets/soldier-sheet.mjs` | Modifier | Action `rollShoot`, handler `#onRollShoot`, `_prepareContext` ajouter modifiers/penetration |
| `templates/actor/soldier-sheet.hbs` | Modifier | Colonne modifiers dans la table, bouton de tir par arme |
| `templates/chat/roll-result.hbs` | Modifier | Template complet pour affichage enrichi du jet de tir |
| `styles/haywire.css` | Modifier | Styles `.haywire-btn-shoot`, `.haywire-roll-result`, `.haywire-threshold-*` |
| `lang/en.json` | Modifier | Ajouter RollShoot, NoWeaponEquipped, ShootWith, RollFormula, RollTotal, DieResult, Thresholds |
| `lang/fr.json` | Modifier | Ajouter mêmes clés en français |

**Fichiers à NE PAS modifier :**
- `module/models/soldier-model.mjs` — schema COMPLET, pas de nouveaux champs
- `module/models/class-model.mjs` — schema COMPLET (combatStats déjà définis)
- `module/models/weapon-model.mjs` — schema COMPLET (modifiers déjà défini)
- `module/documents/haywire-actor.mjs` — aucun changement nécessaire
- `module/documents/haywire-item.mjs` — aucun changement nécessaire
- `module/sheets/class-sheet.mjs`, `weapon-sheet.mjs`, `skill-sheet.mjs` — aucun changement
- `haywire.mjs` — aucun changement nécessaire (roll-result.hbs DÉJÀ préchargé, HaywireRoll DÉJÀ importé)
- `system.json` — aucun changement nécessaire

### FoundryVTT V13 API — Informations techniques pour cette story

**Roll API avec formule paramétrée :**
- `new Roll("1d20 + @mod", { mod: 2 })` — la syntaxe `@variable` est remplacée par les valeurs de l'objet data
- `roll.evaluate()` — évaluation async (OBLIGATOIRE avant utilisation des résultats)
- `roll.dice[0].total` — résultat du premier dé (le 1d20 brut, avant modificateurs)
- `roll.total` — résultat total (dé + modificateurs)
- `roll.formula` — formule normalisée (ex: "1d20 + 2")

**Rendu de template + ChatMessage :**
- `renderTemplate(path, data)` — rend un template Handlebars et retourne le HTML (async)
- `ChatMessage.create({ speaker, flavor, content, rolls, sound })` — crée un message de chat
- `rolls: [roll]` — attache les rolls au message pour Dice So Nice et l'affichage interactif
- `CONFIG.sounds.dice` — joue le son de dés standard Foundry

**Compatibilité Dice So Nice :**
- Les rolls attachés via `rolls: [roll]` dans `ChatMessage.create()` sont interceptés par Dice So Nice automatiquement
- Le dé 3D roule AVANT que le contenu du message ne soit affiché — c'est le comportement standard

**game.i18n.format() :**
- `game.i18n.format("HAYWIRE.ShootWith", { weapon: "M4A1" })` → "Tir avec M4A1"
- Syntaxe de format string : `{variable}` dans la clé i18n (pas `{{variable}}`)

### Learnings des Stories précédentes (CRITIQUES)

1. **Labels en dur au lieu de i18n** : TOUJOURS `{{localize "HAYWIRE.*"}}` et `game.i18n.localize()` (Story 1.1)
2. **`_onRender` pas `activateListeners`** : ApplicationV2 utilise `_onRender(context, options)` (Story 2.1)
3. **Pas de `<form>` dans les templates HBS** : DocumentSheetV2 gère le form wrapper (Story 2.2)
4. **Boutons `type="button"` pas `type="submit"`** : Pour éviter le submit (Story 2.2)
5. **Guard `if (!this.isEditable) return;`** dans les handlers quand pertinent (Story 2.2)
6. **`data-action` pour les clics**, event listener `_onRender` pour `change`/`dragover` (Story 2.3)
7. **Références UUID** : Les armes et skills sont des références UUID résolues par `fromUuidSync()` avec fallback `game.items.get()`, PAS des owned Items (Pivot Story 2.3)
8. **`fromClass` flag** : Les items venant de la classe ne sont pas supprimables par le joueur (Story 2.3)
9. **Conditions sync** : `toggleStatusEffect` override dans HaywireActor pour sync bidirectionnel (Story 2.4)
10. **Promise.all** pour les opérations parallèles (Code Review Story 2.4)
11. **`roll.evaluate()` AVANT `roll.toMessage()`** : V13 n'évalue PAS automatiquement (Story 3.1)
12. **`game.haywire ??= {}`** : Ne pas écraser l'objet existant (Code Review Story 3.1)
13. **Validation défensive** : `if (!actor) throw` dans HaywireRoll (Code Review Story 3.1)

### Anti-patterns à éviter ABSOLUMENT

- **NE PAS** utiliser jQuery — DOM natif uniquement
- **NE PAS** utiliser `activateListeners(html)` — utiliser `_onRender(context, options)` et `data-action`
- **NE PAS** utiliser `type="submit"` pour les boutons
- **NE PAS** oublier le guard `if (!this.isEditable)` dans les handlers quand pertinent
- **NE PAS** écrire de texte en dur — TOUJOURS `game.i18n.localize()` ou `{{localize}}`
- **NE PAS** oublier d'appeler `roll.evaluate()` AVANT d'utiliser `roll.total` ou `roll.dice`
- **NE PAS** modifier la méthode `HaywireRoll.d20()` existante — ajouter `shoot()` à côté
- **NE PAS** modifier les data models existants — aucun nouveau champ nécessaire
- **NE PAS** ajouter de dépendance externe — Roll API native uniquement
- **NE PAS** utiliser `this.actor.items.get(id)` pour les armes — ce sont des références UUID
- **NE PAS** mettre de logique métier dans les sheets — les sheets déclenchent, HaywireRoll exécute
- **NE PAS** utiliser `roll.toMessage()` pour les jets de tir — utiliser `ChatMessage.create()` avec `rolls: [roll]` et `content` pour le template custom

### Project Structure Notes

Aucun fichier à créer. Tous les fichiers existent déjà. C'est uniquement de la modification de fichiers existants.

Structure des fichiers touchés :
```
module/
├── rolls/
│   └── haywire-roll.mjs    # Ajouter shoot()
├── sheets/
│   └── soldier-sheet.mjs   # Ajouter rollShoot action, modifiers dans context
templates/
├── actor/
│   └── soldier-sheet.hbs   # Ajouter colonne + bouton tir
├── chat/
│   └── roll-result.hbs     # Refonte complète du template
styles/
│   └── haywire.css          # Nouveaux styles
lang/
├── en.json                  # Nouvelles clés
└── fr.json                  # Nouvelles clés
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — Acceptance criteria (FR15, FR16)
- [Source: _bmad-output/planning-artifacts/architecture.md#Roll Pipeline Architecture] — HaywireRoll pattern, Roll API encapsulation
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Sheet architecture, template strategy
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Naming, structure, process patterns
- [Source: _bmad-output/planning-artifacts/prd.md#Combat & Dice] — FR15, FR16, NFR2, NFR6
- [Source: _bmad-output/implementation-artifacts/3-1-jet-d20-basique-depuis-la-fiche.md] — Learnings, HaywireRoll.d20(), patterns existants
- [Source: FoundryVTT V13 API — Roll] — https://foundryvtt.com/api/classes/foundry.dice.Roll.html
- [Source: FoundryVTT V13 API — ChatMessage] — https://foundryvtt.com/api/classes/foundry.documents.ChatMessage.html
- [Source: FoundryVTT V13 API — renderTemplate] — https://foundryvtt.com/api/v13/functions/foundry.applications.handlebars.renderTemplate.html

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème de debug rencontré.

### Completion Notes List

- Ajouté `HaywireRoll.shoot()` méthode statique avec formule `1d20 + @mod`, validation défensive, résolution des seuils de combat depuis la classe, rendu template custom, et ChatMessage.create() avec rolls attachés pour Dice So Nice
- Refait le template `roll-result.hbs` avec affichage complet : nom arme, formule, modificateur signé, total, seuils Easy/Medium/Hard colorés
- Ajouté bouton de tir par arme (icône crosshairs) dans la table des weapons de la fiche Soldier, visible uniquement si hasClass
- Ajouté colonne Modifiers dans la table des armes
- Ajouté action `rollShoot` dans SoldierSheet avec résolution UUID et guard weapon introuvable
- Exposé `modifiers` et `penetration` dans `_prepareContext` pour chaque weapon
- Ajouté 7 clés i18n en EN et FR (RollShoot, NoWeaponEquipped, ShootWith, RollFormula, RollTotal, DieResult, Thresholds)
- Ajouté styles CSS pour `.haywire-btn-shoot`, `.haywire-roll-result`, `.haywire-chat-threshold-*` avec thème militaire cohérent
- Classes CSS des seuils de chat renommées en `.haywire-chat-threshold-*` pour éviter conflit avec `.haywire-threshold` existant sur la fiche

### Change Log

- 2026-03-05: Implémentation complète du jet de tir avec modificateurs d'arme (Tasks 1-7)
- 2026-03-05: Code review — 2 MEDIUM + 4 LOW issues trouvés, 4 corrigés (M1: dieResult affiché dans chat, M2: ../ inutiles dans thead, L1: clé DieResult maintenant utilisée, L3: variable CSS --haywire-color-success)

### File List

| Fichier | Action |
|---|---|
| `module/rolls/haywire-roll.mjs` | Modifié (ajout méthode statique `shoot()`) |
| `module/sheets/soldier-sheet.mjs` | Modifié (action `rollShoot`, handler `#onRollShoot`, modifiers/penetration dans context) |
| `templates/actor/soldier-sheet.hbs` | Modifié (colonne Modifiers, bouton tir par arme) |
| `templates/chat/roll-result.hbs` | Modifié (template complet avec détails arme et seuils) |
| `styles/haywire.css` | Modifié (styles .haywire-btn-shoot, .haywire-roll-result, .haywire-chat-threshold-*) |
| `lang/en.json` | Modifié (ajout 7 clés i18n) |
| `lang/fr.json` | Modifié (ajout 7 clés i18n) |
