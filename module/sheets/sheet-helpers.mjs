/**
 * Shared helpers for Haywire actor/item sheets.
 */

/** All Haywire condition keys. */
const HAYWIRE_CONDITIONS = ["suppressed", "pinned", "downed", "hidden", "injured", "overwatch"];

/** Localized label for a condition key. */
export function conditionLabel(c) {
  return game.i18n.localize(`HAYWIRE.Conditions.${c.charAt(0).toUpperCase() + c.slice(1)}`);
}

/** Build conditions context (current + available) from a conditions Set. */
export function buildConditionsContext(conditions) {
  const current = [...conditions];
  return {
    conditions: current.map((c) => ({ key: c, label: conditionLabel(c) })),
    availableConditions: HAYWIRE_CONDITIONS
      .filter((c) => !current.includes(c))
      .map((c) => ({ key: c, label: conditionLabel(c) })),
  };
}

/** Resolve an array of UUIDs in parallel, returning [{uuid, resolved, missing}, ...]. */
export async function resolveUuids(uuids) {
  const resolved = await Promise.all(uuids.map((uuid) => fromUuid(uuid)));
  return uuids.map((uuid, i) => ({ uuid, resolved: resolved[i], missing: !resolved[i] }));
}

/** Build a skill context array from resolved UUID entries. */
export function buildSkillsContext(entries) {
  return entries.map(({ uuid, resolved: s, missing }) => ({
    uuid,
    name: s?.name ?? `[${uuid}]`,
    description: s?.system?.description ?? "",
    missing,
  }));
}

/** Build a weapon context array from resolved UUID entries. */
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

/** Bind condition select change handler. */
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

/** Roll a d20 for the actor. */
export async function onRollD20() {
  const { HaywireRoll } = await import("../rolls/haywire-roll.mjs");
  await HaywireRoll.d20({ actor: this.actor, label: game.i18n.localize("HAYWIRE.RollD20") });
}

/** Roll a shoot action with a weapon. */
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

/** Remove a condition from the actor. */
export async function onRemoveCondition(event, target) {
  const condition = target.closest("[data-condition]").dataset.condition;
  await this.actor.toggleStatusEffect(condition, { active: false });
}

/** Open an item sheet by UUID. */
export async function onOpenItem(event, target) {
  const uuid = target.dataset.itemUuid;
  const item = await fromUuid(uuid);
  if (!item) {
    console.warn(`haywire | item UUID "${uuid}" introuvable`);
    return;
  }
  item.sheet.render(true);
}

/** Parse drop event data for item drops. Returns {uuid, item} or null. */
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
