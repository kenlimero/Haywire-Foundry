/**
 * Shared helpers for Haywire actor/item sheets.
 * @module sheet-helpers
 */

/** @type {string[]} All Haywire condition keys. */
const HAYWIRE_CONDITIONS = ["suppressed", "pinned", "downed", "hidden", "injured", "overwatch"];

/**
 * Localized label for a condition key.
 * @param {string} c - Condition key (e.g. "downed")
 * @returns {string} Localized label
 */
export function conditionLabel(c) {
  return game.i18n.localize(`HAYWIRE.Conditions.${c.charAt(0).toUpperCase() + c.slice(1)}`);
}

/**
 * Build conditions context (current + available) from a conditions Set.
 * @param {Set<string>} conditions - Current conditions set
 * @returns {{ conditions: Array<{key: string, label: string}>, availableConditions: Array<{key: string, label: string}> }}
 */
export function buildConditionsContext(conditions) {
  return {
    conditions: [...conditions].map((c) => ({ key: c, label: conditionLabel(c) })),
    availableConditions: HAYWIRE_CONDITIONS
      .filter((c) => !conditions.has(c))
      .map((c) => ({ key: c, label: conditionLabel(c) })),
  };
}

/**
 * Resolve an array of UUIDs in parallel, returning [{uuid, resolved, missing}, ...].
 * @param {string[]} uuids - Array of UUIDs to resolve
 * @returns {Promise<Array<{uuid: string, resolved: object|null, missing: boolean}>>}
 */
export async function resolveUuids(uuids) {
  const resolved = await Promise.all(
    uuids.map((uuid) => fromUuid(uuid).catch((err) => {
      console.warn(`haywire | resolveUuids: failed to resolve "${uuid}"`, err);
      return null;
    })),
  );
  return uuids.map((uuid, i) => ({ uuid, resolved: resolved[i], missing: !resolved[i] }));
}

/**
 * Build a skill context array from resolved UUID entries.
 * @param {Array<{uuid: string, resolved: object|null, missing: boolean}>} entries
 * @returns {Array<{uuid: string, name: string, description: string, missing: boolean}>}
 */
export function buildSkillsContext(entries) {
  return entries.map(({ uuid, resolved: s, missing }) => ({
    uuid,
    name: s?.name ?? `[${uuid}]`,
    description: s?.system?.description ?? "",
    missing,
  }));
}

/**
 * Build a weapon context array from resolved UUID entries.
 * @param {Array<{uuid: string, resolved: object|null, missing: boolean}>} entries
 * @returns {Array<{uuid: string, name: string, weaponType: string, range: number, rateOfFire: number, modifiers: number, penetration: number, missing: boolean}>}
 */
export function buildWeaponsContext(entries) {
  return entries.map(({ uuid, resolved: w, missing }) => {
    if (missing) return { uuid, name: `[${uuid}]`, weaponType: "?", range: 0, rateOfFire: 0, modifiers: 0, penetration: 0, missing: true };
    return {
      uuid,
      name: w.name,
      weaponType: game.i18n.localize(`HAYWIRE.WeaponType.${w.system.weaponType}`),
      range: w.system.range,
      rateOfFire: w.system.rateOfFire,
      modifiers: w.system.modifiers,
      penetration: w.system.penetration,
    };
  });
}

/**
 * Bind condition select change handler.
 * @param {HTMLElement} element - The sheet element
 * @param {Actor} actor - The actor document
 * @param {boolean} isEditable - Whether the sheet is editable
 */
export function bindConditionSelect(element, actor, isEditable) {
  const select = element.querySelector(".haywire-condition-select");
  if (!select) return;
  select.addEventListener("change", async (e) => {
    if (!isEditable) return;
    const condition = e.target.value;
    if (!condition) return;
    await actor.toggleStatusEffect(condition, { active: true });
  });
}

// ── Shared action handlers (used as ApplicationV2 actions, `this` = sheet) ──

/**
 * Roll a d20 for the actor.
 * Used as an ApplicationV2 action handler (`this` is the sheet instance).
 */
export async function onRollD20() {
  const { HaywireRoll } = await import("../rolls/haywire-roll.mjs");
  await HaywireRoll.d20({ actor: this.actor, label: game.i18n.localize("HAYWIRE.RollD20") });
}

/**
 * Roll a shoot action with a weapon.
 * Used as an ApplicationV2 action handler (`this` is the sheet instance).
 * @param {Event} event - The triggering event
 * @param {HTMLElement} target - The action target element
 */
export async function onRollShoot(event, target) {
  const weaponUuid = target.dataset.weaponUuid;
  if (!weaponUuid) return;
  const weapon = await fromUuid(weaponUuid);
  if (!weapon) {
    ui.notifications.warn(game.i18n.localize("HAYWIRE.NoWeaponEquipped"));
    return;
  }
  const { HaywireRoll } = await import("../rolls/haywire-roll.mjs");
  await HaywireRoll.shoot({ actor: this.actor, weapon });
}

/**
 * Remove a condition from the actor.
 * Used as an ApplicationV2 action handler (`this` is the sheet instance).
 * @param {Event} event - The triggering event
 * @param {HTMLElement} target - The action target element
 */
export async function onRemoveCondition(event, target) {
  const conditionEl = target.closest("[data-condition]");
  if (!conditionEl) return;
  await this.actor.toggleStatusEffect(conditionEl.dataset.condition, { active: false });
}

/**
 * Open an item sheet by UUID.
 * Used as an ApplicationV2 action handler (`this` is the sheet instance).
 * @param {Event} event - The triggering event
 * @param {HTMLElement} target - The action target element
 */
export async function onOpenItem(event, target) {
  const uuid = target.dataset.itemUuid;
  if (!uuid) return;
  const item = await fromUuid(uuid);
  if (!item) {
    console.warn(`haywire | item UUID "${uuid}" introuvable`);
    return;
  }
  item.sheet.render(true);
}

/**
 * Parse drop event data for item drops. Returns {uuid, item} or null.
 * @param {DragEvent} event - The drop event
 * @returns {Promise<{uuid: string, item: object} | null>}
 */
export async function parseItemDrop(event) {
  event.preventDefault();

  let data;
  try {
    data = JSON.parse(event.dataTransfer.getData("text/plain"));
  } catch {
    return null;
  }
  if (!data?.uuid) return null;

  const item = await fromUuid(data.uuid);
  if (!item) return null;

  return { uuid: data.uuid, item };
}

/**
 * Register item update/delete hooks and clean them up on close.
 * Shared between SoldierSheet and OpforUnitSheet.
 * @param {object} sheet - The sheet instance (ApplicationV2)
 * @param {(item: object) => boolean} isRelevantFn - Predicate to test if an item change is relevant
 * @returns {number[]} Array of hook IDs for cleanup
 */
export function registerItemHooks(sheet, isRelevantFn) {
  return [
    Hooks.on("updateItem", (item) => {
      if (isRelevantFn(item)) sheet.render();
    }),
    Hooks.on("deleteItem", (item) => {
      if (isRelevantFn(item)) sheet.render();
    }),
  ];
}

/**
 * Unregister item hooks by their IDs.
 * @param {number[]} hookIds - Hook IDs returned by registerItemHooks
 */
export function unregisterItemHooks(hookIds) {
  if (!hookIds) return;
  Hooks.off("updateItem", hookIds[0]);
  Hooks.off("deleteItem", hookIds[1]);
}
