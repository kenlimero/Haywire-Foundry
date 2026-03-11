/**
 * Shared constants and utilities for overlay modules.
 */

/** Pin SVG markup (used in all overlay thumbnails). */
export function pinSvg(title) {
  return `<span class="haywire-overlay-pin" title="${title}"><svg viewBox="0 0 384 512"><path d="M300.8 203.9L290 213.1H273c-7.7 0-15 3.2-20.3 8.5L194.7 279.6 104.4 189.3l58-58c5.3-5.3 8.5-12.6 8.5-20.3V94.1l9.2-10.9C196.3 64.5 220.2 54 245.2 54h48c23.2 0 45.6 8.2 63.1 23L384 101.3 282.7 202.6zM96 297.4l87.6 87.6L57.6 511c-5.8 5.8-14.3 8-22.2 5.7S21.5 508.5 19.3 500.6c-2.3-7.9-.1-16.4 5.7-22.2L96 297.4z"/></svg></span>`;
}


/** OPFOR leader name pattern (used by isOpforActivatable). */
const LEADER_NAMES = /^(squad commander|cell leader|leader)$/i;

/**
 * Check if OPFOR support/reinforcement overlays should be active.
 * Requires: alert active + at least one non-downed opfor-unit with leader name or "Support" skill.
 */
export async function isOpforActivatable() {
  const alertActive = game.settings.get("haywire", "threatAlert");
  if (!alertActive) return false;

  const scene = game.scenes?.active;
  if (!scene) return false;

  for (const token of scene.tokens) {
    const actor = token.actor;
    if (!actor || actor.type !== "opfor-unit") continue;
    if (actor.system.conditions?.has("downed")) continue;

    if (LEADER_NAMES.test(actor.name)) return true;

    const skillUuids = actor.system.opforSkillIds ?? [];
    for (const uuid of skillUuids) {
      const skill = await fromUuid(uuid);
      if (skill?.name?.toLowerCase() === "support") return true;
    }
  }
  return false;
}

/** Create a DOM element if it doesn't exist yet, appended to document.body. */
export function getOrCreateElement(ref, id) {
  if (!ref) {
    ref = document.createElement("div");
    ref.id = id;
    document.body.appendChild(ref);
  }
  return ref;
}

/** Show a preview image in a preview element. */
export function showPreview(previewEl, img, name) {
  if (!previewEl) return;
  previewEl.innerHTML = `<img src="${img}" alt="${name}" />`;
  previewEl.classList.add("visible");
}

/** Hide a preview element. */
export function hidePreview(previewEl) {
  previewEl?.classList.remove("visible");
}

/** Parse drop event data, returning {uuid} or null. */
export function parseDropData(event) {
  try {
    const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    return data?.uuid ? data : null;
  } catch {
    return null;
  }
}

/** Bind pin toggle on an overlay element. */
export function bindPinToggle(el) {
  el.querySelector(".haywire-overlay-pin")?.addEventListener("click", (e) => {
    e.stopPropagation();
    el.classList.toggle("user-pinned");
  });
}

/** Bind standard drag-over/leave/drop on a thumbnail element. */
export function bindDragDrop(thumb, onDropCallback) {
  thumb.addEventListener("dragover", (e) => {
    e.preventDefault();
    thumb.classList.add("drag-over");
  });
  thumb.addEventListener("dragleave", () => {
    thumb.classList.remove("drag-over");
  });
  thumb.addEventListener("drop", (e) => {
    e.preventDefault();
    thumb.classList.remove("drag-over");
    onDropCallback(e);
  });
}

/** Register setting change hooks (createSetting + updateSetting) for given keys. */
export function onSettingsChange(keys, callback) {
  const handler = (setting) => {
    if (keys.some((k) => setting.key === `haywire.${k}`)) callback(setting);
  };
  Hooks.on("createSetting", handler);
  Hooks.on("updateSetting", handler);
}

/** Resolve a card image from a UUID. Returns {imgSrc, imgAlt} or defaults. */
export async function resolveCardImage(uuid, defaultImg, defaultAlt) {
  if (!uuid) return { imgSrc: defaultImg, imgAlt: defaultAlt };
  const card = await fromUuid(uuid);
  if (!card) return { imgSrc: defaultImg, imgAlt: defaultAlt };
  return {
    imgSrc: card.faces?.[0]?.img ?? card.img ?? defaultImg,
    imgAlt: card.name ?? defaultAlt,
  };
}

/** Draw a random card from a named deck in haywire.decks compendium. Returns {uuid, card} or null. */
export async function drawRandomCard(deckName) {
  const pack = game.packs.get("haywire.decks");
  if (!pack) return null;

  const index = await pack.getIndex();
  const deckEntry = index.find((e) => e.name === deckName);
  if (!deckEntry) return null;

  const deck = await pack.getDocument(deckEntry._id);
  if (!deck?.cards?.size) return null;

  const cards = Array.from(deck.cards);
  const picked = cards[Math.floor(Math.random() * cards.length)];
  const uuid = `Compendium.haywire.decks.Cards.${deckEntry._id}.Card.${picked._id}`;
  return { uuid, card: picked };
}

/** Bind hooks that invalidate opfor activity cache and re-render on scene/actor changes. */
export function bindOpforActivityHooks(invalidateAndRender) {
  Hooks.on("createToken", invalidateAndRender);
  Hooks.on("deleteToken", invalidateAndRender);
  Hooks.on("updateActor", (actor) => {
    if (actor.type === "opfor-unit") invalidateAndRender();
  });
}

/** Roll on a named table from haywire.opfor-tables compendium. Returns draw results. */
export async function rollCompendiumTable(tableName) {
  const pack = game.packs.get("haywire.opfor-tables");
  if (!pack) return null;

  const index = await pack.getIndex();
  const entry = index.find((e) => e.name === tableName);
  if (!entry) {
    ui.notifications.warn(`Table "${tableName}" not found.`);
    return null;
  }

  const table = await pack.getDocument(entry._id);
  return table.draw();
}
