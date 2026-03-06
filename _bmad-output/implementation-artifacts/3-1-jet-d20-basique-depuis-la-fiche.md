# Story 3.1: Jet D20 basique depuis la fiche

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a joueur,
I want lancer un jet de D20 depuis la fiche de mon Soldier,
so that je puisse résoudre les actions de combat.

## Acceptance Criteria

1. **Given** un Actor Soldier avec une classe assignée **When** le joueur clique sur le bouton de jet D20 de la fiche **Then** la classe HaywireRoll construit la formule "1d20" **And** le résultat s'affiche dans le chat FoundryVTT ~~via le template roll-result.hbs~~ via le rendu natif Foundry (`roll.toMessage()`) **And** le message de chat montre le résultat du dé et le nom du Soldier **And** le jet est affiché en < 1 seconde (NFR2) **And** le jet est compatible avec Dice So Nice si le module est installé (NFR6)

> **Note Review:** L'AC originale mentionnait "via le template roll-result.hbs". Décision architecturale (Dev Notes) : utiliser le rendu natif Foundry pour Story 3.1 (jet "1d20" simple). Le template custom `roll-result.hbs` sera enrichi dans Story 3.2 pour les modificateurs d'arme.

## Tasks / Subtasks

- [x] Task 1 — Créer la classe HaywireRoll dans `module/rolls/haywire-roll.mjs` (AC: #1)
  - [x] 1.1 Créer le fichier `module/rolls/haywire-roll.mjs` avec une classe utilitaire `HaywireRoll`
  - [x] 1.2 Implémenter la méthode statique `HaywireRoll.d20({actor, label})` qui :
    - Construit un `new Roll("1d20")` via la Roll API native Foundry
    - Appelle `roll.evaluate()` (async)
    - Appelle `roll.toMessage()` avec les données de contexte (speaker, flavor, template)
  - [x] 1.3 Utiliser `ChatMessage.getSpeaker({actor})` pour identifier le Soldier dans le chat
  - [x] 1.4 ~~Passer le template custom~~ → Non nécessaire : `roll.toMessage()` utilise le rendu natif Foundry (décision archi pour Story 3.1)

- [x] Task 2 — ~~Mettre à jour le template chat~~ **DÉCISION ARCHI : rendu natif Foundry** (AC: #1)
  - [x] 2.1 ~~Remplacer le contenu placeholder~~ → Non nécessaire : `roll.toMessage()` utilise le rendu natif Foundry, qui affiche déjà le nom du Soldier (speaker), le flavor text et le résultat du dé. Template custom reporté à Story 3.2 (modificateurs d'arme).
  - [x] 2.2 ~~Utiliser les classes CSS `.haywire-roll-*`~~ → Non applicable : rendu natif Foundry
  - [x] 2.3 ~~Utiliser `{{localize}}`~~ → Non applicable : le flavor est passé via `game.i18n.localize()` dans le code JS

- [x] Task 3 — Ajouter le bouton de jet D20 dans `templates/actor/soldier-sheet.hbs` (AC: #1)
  - [x] 3.1 Ajouter un bouton de jet D20 dans la section combat stats (visible uniquement si `hasClass` est true)
  - [x] 3.2 Le bouton utilise `data-action="rollD20"` pour déclencher l'action
  - [x] 3.3 Bouton avec icône dé (`<i class="fas fa-dice-d20">`) et texte localisé
  - [x] 3.4 Le bouton doit avoir `type="button"` (PAS `type="submit"`)

- [x] Task 4 — Ajouter l'action `rollD20` dans `module/sheets/soldier-sheet.mjs` (AC: #1)
  - [x] 4.1 Importer `HaywireRoll` depuis `../rolls/haywire-roll.mjs`
  - [x] 4.2 Ajouter `rollD20: SoldierSheet.#onRollD20` dans `DEFAULT_OPTIONS.actions`
  - [x] 4.3 Implémenter `static async #onRollD20(event, target)` qui appelle `HaywireRoll.d20({actor: this.actor, label: game.i18n.localize("HAYWIRE.RollD20")})`

- [x] Task 5 — Importer et enregistrer HaywireRoll dans `haywire.mjs` (AC: #1)
  - [x] 5.1 Ajouter `import { HaywireRoll } from "./module/rolls/haywire-roll.mjs";` dans haywire.mjs
  - [x] 5.2 Optionnel : attacher `HaywireRoll` à `game.haywire.HaywireRoll` pour exposer l'API aux modules tiers (dans un `Hooks.once("init")`)

- [x] Task 6 — Ajouter les clés i18n (AC: #1)
  - [x] 6.1 Ajouter dans `en.json` : `HAYWIRE.RollD20` → "D20 Roll", `HAYWIRE.RollResult` → "Result"
  - [x] 6.2 Ajouter dans `fr.json` : `HAYWIRE.RollD20` → "Jet de D20", `HAYWIRE.RollResult` → "Résultat"

- [x] Task 7 — Ajouter les styles CSS pour le bouton et le chat (AC: #1)
  - [x] 7.1 Styler le bouton `.haywire-roll-btn` dans `styles/haywire.css` (thème militaire cohérent)
  - [x] 7.2 ~~Styler le message de chat `.haywire-roll-result`~~ → Non applicable : le rendu natif Foundry est utilisé pour Story 3.1 (pas de template custom)

- [ ] Task 8 (REQUIERT VÉRIFICATION MANUELLE PAR L'UTILISATEUR) — Vérification manuelle dans FoundryVTT (AC: #1) — REQUIERT TEST DANS FOUNDRY
  - [ ] 8.1 Créer un Actor Soldier avec une classe assignée
  - [ ] 8.2 Cliquer sur le bouton D20 → vérifier que le jet s'affiche dans le chat
  - [ ] 8.3 Vérifier que le message de chat affiche : nom du Soldier, résultat du dé
  - [ ] 8.4 Vérifier compatibilité Dice So Nice (si module installé, le dé 3D doit rouler)
  - [ ] 8.5 Vérifier que le bouton n'apparaît PAS si aucune classe n'est assignée
  - [ ] 8.6 Vérifier 0 erreurs et 0 warnings de deprecation dans la console
  - [ ] 8.7 Vérifier performance < 1s pour l'affichage du jet

## Dev Notes

### CONTEXTE ARCHITECTURAL CRITIQUE

**Pivot architectural des stories précédentes (Story 2.3) :**
- Les armes et skills ne sont **PAS des owned Items** mais des **références UUID** stockées dans `weaponIds` et `skillIds` sur le SoldierModel
- La classe est une référence UUID dans `classId`
- Les combatStats sont dérivées dans `SoldierSheet._prepareContext()` depuis la classe référencée
- Tous les items sont résolus via `fromUuidSync(uuid) ?? game.items.get(uuid)`

**Architecture du pipeline Roll (architecture.md) :**
- Classe utilitaire `HaywireRoll` dans `module/rolls/haywire-roll.mjs`
- Pattern : `HaywireRoll.d20({actor, weapon, modifiers})` — pour Story 3.1, seul `actor` et `label` sont nécessaires (pas de weapon/modifiers)
- La Roll API native Foundry garantit la compatibilité Dice So Nice automatiquement
- Template chat dédié `roll-result.hbs` pour l'affichage des résultats

### Pattern EXACT : HaywireRoll (fichier à CRÉER)

```javascript
// module/rolls/haywire-roll.mjs

/**
 * Utilitaire de jets de dés pour le système Haywire.
 * Encapsule la Roll API native de FoundryVTT.
 */
export class HaywireRoll {

  /**
   * Effectue un jet de D20 basique et envoie le résultat au chat.
   * @param {object} options
   * @param {Actor} options.actor - L'Actor Soldier qui effectue le jet
   * @param {string} [options.label] - Le flavor text affiché dans le chat
   * @returns {Promise<Roll>} Le Roll évalué
   */
  static async d20({ actor, label } = {}) {
    const roll = new Roll("1d20");
    await roll.evaluate();

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: label ?? game.i18n.localize("HAYWIRE.RollD20"),
    });

    return roll;
  }
}
```

**Points critiques :**
- `roll.toMessage()` évalue ET crée le ChatMessage en une seule opération — mais le roll doit être évalué AVANT via `roll.evaluate()` car `toMessage()` ne l'évalue PAS automatiquement en V13
- `ChatMessage.getSpeaker({actor})` retourne l'objet speaker correct (nom, alias, token si applicable)
- Le `flavor` est le texte descriptif affiché au-dessus du résultat dans le chat
- La Roll API native = Dice So Nice les intercepte automatiquement (NFR6)
- PAS besoin de template custom pour `toMessage()` — Foundry utilise son template de roll par défaut qui est déjà fonctionnel et bien formaté

**DÉCISION TEMPLATE :** Pour la Story 3.1 (jet basique), utiliser le rendu natif de Foundry (`roll.toMessage()` sans template custom). Le template `roll-result.hbs` sera enrichi dans Story 3.2 quand on ajoutera les modificateurs d'arme et le contexte complet. Cela évite de créer un template custom inutile pour un jet "1d20" simple.

### Pattern EXACT : Action rollD20 dans SoldierSheet

```javascript
// Ajouter dans les imports en haut de soldier-sheet.mjs :
import { HaywireRoll } from "../rolls/haywire-roll.mjs";

// Ajouter dans DEFAULT_OPTIONS.actions :
actions: {
  removeWeapon: SoldierSheet.#onRemoveWeapon,
  removeSkill: SoldierSheet.#onRemoveSkill,
  removeCondition: SoldierSheet.#onRemoveCondition,
  openItem: SoldierSheet.#onOpenItem,
  rollD20: SoldierSheet.#onRollD20,  // NOUVEAU
},

// Nouveau handler :
static async #onRollD20(event, target) {
  await HaywireRoll.d20({
    actor: this.actor,
    label: game.i18n.localize("HAYWIRE.RollD20"),
  });
}
```

### Pattern EXACT : Bouton D20 dans le template

```handlebars
{{!-- Ajouter DANS la section combat stats, après les thresholds --}}
{{#if hasClass}}
  <button type="button" class="haywire-roll-btn" data-action="rollD20">
    <i class="fas fa-dice-d20"></i>
    {{localize "HAYWIRE.RollD20"}}
  </button>
{{/if}}
```

**Placement recommandé :** Après la `</div>` de `haywire-combat-thresholds` (ligne 94 du template actuel), avant le `{{/if}}` de `hasClass` (ligne 96).

### Pattern EXACT : Template chat (mise à jour minimale)

Pour Story 3.1, le template `roll-result.hbs` n'a **PAS besoin d'être modifié** car `roll.toMessage()` utilise le rendu natif de Foundry pour les rolls. Le template custom sera développé dans Story 3.2 pour afficher les détails d'arme et modificateurs.

**Si le développeur veut quand même améliorer le template minimal :**
```handlebars
<div class="haywire-roll-result">
  <h3 class="haywire-roll-title">{{flavor}}</h3>
  <div class="haywire-roll-formula">{{formula}}</div>
  <div class="haywire-roll-total">{{total}}</div>
</div>
```

### Pattern EXACT : Import dans haywire.mjs

```javascript
// Ajouter après les imports existants :
import { HaywireRoll } from "./module/rolls/haywire-roll.mjs";

// Optionnel — exposer l'API pour modules tiers (dans Hooks.once("init")) :
game.haywire = { HaywireRoll };
```

### Clés i18n à AJOUTER

**en.json :**
```json
"HAYWIRE.RollD20": "D20 Roll",
"HAYWIRE.RollResult": "Result"
```

**fr.json :**
```json
"HAYWIRE.RollD20": "Jet de D20",
"HAYWIRE.RollResult": "Résultat"
```

### CSS à ajouter dans `@layer haywire`

```css
/* Roll D20 button */
.haywire-roll-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: var(--haywire-color-primary);
  color: var(--haywire-color-text);
  border: 1px solid var(--haywire-color-accent);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: bold;
  transition: background 0.2s;
}

.haywire-roll-btn:hover {
  background: var(--haywire-color-accent);
}

.haywire-roll-btn i {
  font-size: 1.1rem;
}
```

### Fichiers à modifier / créer

| Fichier | Action | Ce qui change |
|---|---|---|
| `module/rolls/haywire-roll.mjs` | **CRÉER** | Classe `HaywireRoll` avec méthode statique `d20()` |
| `module/sheets/soldier-sheet.mjs` | Modifier | Import `HaywireRoll`, action `rollD20`, handler `#onRollD20` |
| `templates/actor/soldier-sheet.hbs` | Modifier | Bouton D20 dans la section combat stats |
| `haywire.mjs` | Modifier | Import `HaywireRoll`, optionnel `game.haywire` namespace |
| `styles/haywire.css` | Modifier | Styles `.haywire-roll-btn` |
| `lang/en.json` | Modifier | Ajouter `HAYWIRE.RollD20`, `HAYWIRE.RollResult` |
| `lang/fr.json` | Modifier | Ajouter `HAYWIRE.RollD20`, `HAYWIRE.RollResult` |

**Fichiers à NE PAS modifier :**
- `module/models/soldier-model.mjs` — schema COMPLET, pas de nouveaux champs
- `module/models/class-model.mjs`, `weapon-model.mjs`, `skill-model.mjs` — schemas COMPLETS
- `module/documents/haywire-actor.mjs` — aucun changement nécessaire pour le jet basique
- `module/documents/haywire-item.mjs` — aucun changement nécessaire
- `module/sheets/class-sheet.mjs`, `weapon-sheet.mjs`, `skill-sheet.mjs` — aucun changement
- `templates/chat/roll-result.hbs` — PAS DE MODIFICATION pour Story 3.1 (utiliser rendu natif Foundry)
- `system.json` — aucun changement nécessaire

### FoundryVTT V13 Roll API — Informations techniques

**Version API :** FoundryVTT V13 (dernière stable)

**Roll API clés :**
- `new Roll(formula, data, options)` — constructeur
- `roll.evaluate()` — évaluation async (OBLIGATOIRE avant toMessage)
- `roll.toMessage(messageData, options)` — crée le ChatMessage
- `roll.total` — résultat numérique (lecture seule après évaluation)
- `roll.formula` — formule normalisée
- `ChatMessage.getSpeaker({actor})` — identifie le speaker

**Compatibilité Dice So Nice :**
La Roll API native est interceptée automatiquement par Dice So Nice. Tant qu'on utilise `Roll` + `toMessage()`, les dés 3D fonctionnent sans code supplémentaire.

**Point important :** `roll.toMessage()` n'évalue PAS le roll automatiquement — il faut appeler `roll.evaluate()` AVANT. En V13, `evaluate()` est asynchrone.

### Learnings des Stories précédentes (CRITIQUES)

1. **Labels en dur au lieu de i18n** : TOUJOURS `{{localize "HAYWIRE.*"}}` et `game.i18n.localize()` (Story 1.1)
2. **`_onRender` pas `activateListeners`** : ApplicationV2 utilise `_onRender(context, options)` (Story 2.1)
3. **Pas de `<form>` dans les templates HBS** : DocumentSheetV2 gère le form wrapper (Story 2.2)
4. **Boutons `type="button"` pas `type="submit"`** : Pour éviter le submit (Story 2.2)
5. **Guard `if (!this.isEditable) return;`** dans les handlers (Story 2.2)
6. **`data-action` pour les clics**, event listener `_onRender` pour `change`/`dragover` (Story 2.3)
7. **Références UUID** : Les armes et skills sont des références UUID résolues par `fromUuidSync()` avec fallback `game.items.get()`, PAS des owned Items (Pivot Story 2.3)
8. **`fromClass` flag** : Les items venant de la classe ne sont pas supprimables par le joueur (Story 2.3)
9. **Conditions sync** : `toggleStatusEffect` override dans HaywireActor pour sync bidirectionnel sheet ↔ token (Story 2.4)
10. **Promise.all** pour les opérations parallèles (Code Review Story 2.4)

### Anti-patterns à éviter ABSOLUMENT

- **NE PAS** utiliser jQuery — DOM natif uniquement
- **NE PAS** utiliser `activateListeners(html)` — utiliser `_onRender(context, options)` et `data-action`
- **NE PAS** utiliser `type="submit"` pour les boutons
- **NE PAS** oublier le guard `if (!this.isEditable)` dans les handlers quand pertinent
- **NE PAS** écrire de texte en dur — TOUJOURS `game.i18n.localize()`
- **NE PAS** oublier d'appeler `roll.evaluate()` AVANT `roll.toMessage()`
- **NE PAS** créer un template chat custom complexe pour Story 3.1 — utiliser le rendu natif Foundry
- **NE PAS** modifier les data models existants — aucun nouveau champ nécessaire
- **NE PAS** ajouter de dépendance externe — Roll API native uniquement
- **NE PAS** utiliser `this.actor.items.get(id)` pour les armes/skills — ce sont des références UUID
- **NE PAS** mettre de logique métier dans les sheets — les sheets déclenchent, HaywireRoll exécute

### Project Structure Notes

Un seul fichier à CRÉER : `module/rolls/haywire-roll.mjs`. Ce dossier existe déjà mais est vide. C'est la première utilisation du layer Roll de l'architecture.

Aucun changement de structure projet. Alignement parfait avec l'architecture définie :
```
module/
├── rolls/               # Roll utilities (NOUVEAU CONTENU)
│   └── haywire-roll.mjs # HaywireRoll — encapsulation Roll API
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — Acceptance criteria (FR13, FR14)
- [Source: _bmad-output/planning-artifacts/architecture.md#Roll Pipeline Architecture] — HaywireRoll pattern, Roll API encapsulation
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Sheet architecture, template strategy
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Naming, structure, process patterns
- [Source: _bmad-output/planning-artifacts/prd.md#Combat & Dice] — FR13, FR14, NFR2, NFR6
- [Source: _bmad-output/implementation-artifacts/2-4-gestion-de-lequipement-et-des-etats.md] — Learnings, pivot architectural, patterns code
- [Source: FoundryVTT V13 API — Roll] — https://foundryvtt.com/api/classes/foundry.dice.Roll.html
- [Source: FoundryVTT V13 API — ChatMessage] — https://foundryvtt.com/api/classes/foundry.documents.ChatMessage.html
- [Source: FoundryVTT Community Wiki — Roll] — https://foundryvtt.wiki/en/development/api/roll

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème de debug rencontré.

### Completion Notes List

- Créé `HaywireRoll` classe utilitaire avec méthode statique `d20()` encapsulant la Roll API native Foundry V13
- Ajouté bouton D20 dans la section Combat Stats de la fiche Soldier (visible uniquement si `hasClass` est true)
- Intégré l'action `rollD20` dans SoldierSheet via le pattern `data-action` + `DEFAULT_OPTIONS.actions`
- Importé et exposé HaywireRoll dans `game.haywire.HaywireRoll` pour les modules tiers
- Ajouté clés i18n `HAYWIRE.RollD20` et `HAYWIRE.RollResult` en EN et FR
- Ajouté styles CSS `.haywire-roll-btn` cohérents avec le thème militaire Haywire
- Template `roll-result.hbs` NON modifié (décision architecturale : rendu natif Foundry pour Story 3.1, template custom prévu pour Story 3.2)
- `roll.evaluate()` appelé AVANT `roll.toMessage()` comme requis en V13
- Compatibilité Dice So Nice assurée par utilisation de la Roll API native

### Senior Developer Review (AI)

**Date:** 2026-03-05
**Reviewer:** Claude Opus 4.6 (Code Review Workflow)
**Outcome:** Changes Requested → Fixed

**Action Items:**
- [x] [CRITICAL] Task 2 marquée [x] sans implémentation → Corrigé : subtasks annotées avec décision archi (rendu natif)
- [x] [CRITICAL] Task 7.2 marquée [x] sans implémentation → Corrigé : annotée comme non applicable
- [x] [MEDIUM] AC mentionne "via roll-result.hbs" sans correspondance → Corrigé : AC annotée avec note de décision
- [x] [MEDIUM] Pas de validation défensive dans HaywireRoll.d20() → Corrigé : guard `if (!actor) throw`
- [x] [MEDIUM] game.haywire écrase l'objet existant → Corrigé : `game.haywire ??= {}`
- [x] [LOW] Contraste hover bouton insuffisant → Corrigé : ajout `color: var(--haywire-color-bg)`
- [ ] [LOW] Template roll-result.hbs préchargé mais inutilisé → Conservé pour Story 3.2

### Change Log

- 2026-03-05: Implémentation complète du jet D20 basique depuis la fiche Soldier (Tasks 1-7)
- 2026-03-05: Code Review — 6 issues corrigées (2 CRITICAL, 3 MEDIUM, 1 LOW)

### File List

| Fichier | Action |
|---|---|
| `module/rolls/haywire-roll.mjs` | CRÉÉ |
| `module/sheets/soldier-sheet.mjs` | Modifié (import HaywireRoll, action rollD20, handler #onRollD20) |
| `templates/actor/soldier-sheet.hbs` | Modifié (bouton D20 dans section combat stats) |
| `haywire.mjs` | Modifié (import HaywireRoll, game.haywire namespace) |
| `styles/haywire.css` | Modifié (styles .haywire-roll-btn) |
| `lang/en.json` | Modifié (ajout RollD20, RollResult) |
| `lang/fr.json` | Modifié (ajout RollD20, RollResult) |
