/**
 * Shared constants and utilities for overlay modules.
 * @module overlay-helpers
 */

/**
 * Escape HTML special characters to prevent XSS in dynamic content.
 * @param {string} str - Raw string to escape
 * @returns {string} Escaped string safe for HTML insertion
 */
export function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Pin SVG markup (used in all overlay thumbnails).
 * @param {string} title - Tooltip text for the pin
 * @returns {string} HTML string with the pin SVG
 */
export function pinSvg(title) {
  return `<span class="haywire-overlay-pin" title="${escapeHtml(title)}"><svg viewBox="0 0 384 512"><path d="M300.8 203.9L290 213.1H273c-7.7 0-15 3.2-20.3 8.5L194.7 279.6 104.4 189.3l58-58c5.3-5.3 8.5-12.6 8.5-20.3V94.1l9.2-10.9C196.3 64.5 220.2 54 245.2 54h48c23.2 0 45.6 8.2 63.1 23L384 101.3 282.7 202.6zM96 297.4l87.6 87.6L57.6 511c-5.8 5.8-14.3 8-22.2 5.7S21.5 508.5 19.3 500.6c-2.3-7.9-.1-16.4 5.7-22.2L96 297.4z"/></svg></span>`;
}


/** OPFOR leader name pattern (used by isOpforActivatable). */
const LEADER_NAMES = /^(squad commander|cell leader|leader)$/i;

/**
 * Check if OPFOR support/reinforcement overlays should be active.
 * Requires: alert active + at least one non-downed opfor-unit with leader name or "Support" skill.
 * @returns {Promise<boolean>}
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
      try {
        const skill = await fromUuid(uuid);
        if (skill?.name?.toLowerCase() === "support") return true;
      } catch (err) {
        console.warn(`haywire | isOpforActivatable: failed to resolve skill UUID "${uuid}"`, err);
      }
    }
  }
  return false;
}

/**
 * Create a DOM element if it doesn't exist yet, appended to document.body.
 * @param {HTMLElement|null} ref - Existing element reference (or null)
 * @param {string} id - DOM id for the element
 * @returns {HTMLElement} The existing or newly created element
 */
export function getOrCreateElement(ref, id) {
  if (ref) return ref;
  const el = document.createElement("div");
  el.id = id;
  document.body.appendChild(el);
  return el;
}

/**
 * Show a preview image in a preview element.
 * @param {HTMLElement|null} previewEl - The preview container
 * @param {string} img - Image source URL
 * @param {string} name - Alt text / name
 */
export function showPreview(previewEl, img, name) {
  if (!previewEl || !img) return;
  previewEl.innerHTML = `<img src="${escapeHtml(img)}" alt="${escapeHtml(name)}" />`;
  previewEl.classList.add("visible");
}

/**
 * Hide a preview element.
 * @param {HTMLElement|null} previewEl - The preview container
 */
export function hidePreview(previewEl) {
  previewEl?.classList.remove("visible");
}

/**
 * Parse drop event data, returning {uuid} or null.
 * @param {DragEvent} event - The drop event
 * @returns {{ uuid: string, [key: string]: unknown } | null} Parsed drop data or null
 */
export function parseDropData(event) {
  try {
    const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    return data?.uuid ? data : null;
  } catch {
    return null;
  }
}

/**
 * Bind pin toggle on an overlay element.
 * @param {HTMLElement} el - The overlay root element
 */
export function bindPinToggle(el) {
  el.querySelector(".haywire-overlay-pin")?.addEventListener("click", (e) => {
    e.stopPropagation();
    el.classList.toggle("user-pinned");
  });
}

/**
 * Bind standard drag-over/leave/drop on a thumbnail element.
 * @param {HTMLElement} thumb - The thumbnail element
 * @param {(event: DragEvent) => void} onDropCallback - Handler for drop events
 */
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

/**
 * Register setting change hooks (createSetting + updateSetting) for given keys.
 * @param {string[]} keys - Setting key suffixes (e.g. ["threatLevel", "threatAlert"])
 * @param {(setting: object) => void} callback - Handler called when a matching setting changes
 */
export function onSettingsChange(keys, callback) {
  const handler = (setting) => {
    if (keys.some((k) => setting.key === `haywire.${k}`)) callback(setting);
  };
  Hooks.on("createSetting", handler);
  Hooks.on("updateSetting", handler);
}

/**
 * Resolve a card image from a UUID. Returns {imgSrc, imgAlt} or defaults.
 * @param {string|null} uuid - Card UUID to resolve
 * @param {string} defaultImg - Fallback image path
 * @param {string} defaultAlt - Fallback alt text
 * @returns {Promise<{ imgSrc: string, imgAlt: string }>}
 */
export async function resolveCardImage(uuid, defaultImg, defaultAlt) {
  if (!uuid) return { imgSrc: defaultImg, imgAlt: defaultAlt };
  try {
    const card = await fromUuid(uuid);
    if (!card) return { imgSrc: defaultImg, imgAlt: defaultAlt };
    return {
      imgSrc: card.faces?.[0]?.img ?? card.img ?? defaultImg,
      imgAlt: card.name ?? defaultAlt,
    };
  } catch (err) {
    console.warn(`haywire | resolveCardImage: failed to resolve UUID "${uuid}"`, err);
    return { imgSrc: defaultImg, imgAlt: defaultAlt };
  }
}

/**
 * Draw a random card from a named deck in haywire.decks compendium.
 * Optionally excludes already-drawn card IDs.
 * @param {string} deckName - Name of the deck to draw from
 * @param {string[]} [excludeIds=[]] - Card _id values to exclude from the draw
 * @returns {Promise<{ uuid: string, card: object, deckId: string } | null>}
 */
export async function drawRandomCard(deckName, excludeIds = []) {
  const pack = game.packs.get("haywire.decks");
  if (!pack) {
    console.warn("haywire | drawRandomCard: compendium haywire.decks not found");
    return null;
  }

  const index = await pack.getIndex();
  const deckEntry = index.find((e) => e.name === deckName);
  if (!deckEntry) {
    console.warn(`haywire | drawRandomCard: deck "${deckName}" not found`);
    return null;
  }

  const deck = await pack.getDocument(deckEntry._id);
  if (!deck?.cards?.size) return null;

  const allCards = Array.from(deck.cards);
  const available = excludeIds.length
    ? allCards.filter((c) => !excludeIds.includes(c._id))
    : allCards;

  if (!available.length) return null;

  const picked = available[Math.floor(Math.random() * available.length)];
  const uuid = `Compendium.haywire.decks.Cards.${deckEntry._id}.Card.${picked._id}`;
  return { uuid, card: picked, deckId: deckEntry._id };
}

/**
 * Bind hooks that invalidate opfor activity cache and re-render on scene/actor changes.
 * @param {() => void} invalidateAndRender - Callback to invalidate cache and trigger render
 */
export function bindOpforActivityHooks(invalidateAndRender) {
  Hooks.on("createToken", invalidateAndRender);
  Hooks.on("deleteToken", invalidateAndRender);
  Hooks.on("updateActor", (actor) => {
    if (actor.type === "opfor-unit") invalidateAndRender();
  });
}

/**
 * Roll on a named table from haywire.opfor-tables compendium.
 * @param {string} tableName - Name of the RollTable to roll on
 * @returns {Promise<object|null>} The draw results, or null on failure
 */
export async function rollCompendiumTable(tableName) {
  const pack = game.packs.get("haywire.opfor-tables");
  if (!pack) {
    console.warn("haywire | rollCompendiumTable: compendium haywire.opfor-tables not found");
    return null;
  }

  const index = await pack.getIndex();
  const entry = index.find((e) => e.name === tableName);
  if (!entry) {
    ui.notifications.warn(`Table "${tableName}" not found.`);
    return null;
  }

  const table = await pack.getDocument(entry._id);
  return table.draw();
}

/**
 * Manage show/hide panel with timeout for overlay panels.
 * @param {HTMLElement} panelEl - The panel element to show/hide
 * @param {HTMLElement} overlayEl - The overlay root element
 * @param {HTMLElement|null} [previewEl=null] - Optional preview element to hide on panel close
 * @param {number} [delay=100] - Hide delay in ms
 * @returns {{ show: () => void, hide: () => void }}
 */
export function createPanelToggle(panelEl, overlayEl, previewEl = null, delay = 100) {
  let hideTimeout = null;
  return {
    show() {
      clearTimeout(hideTimeout);
      panelEl?.classList.add("visible");
      overlayEl?.classList.add("pinned");
    },
    hide() {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        panelEl?.classList.remove("visible");
        overlayEl?.classList.remove("pinned");
        if (previewEl) hidePreview(previewEl);
      }, delay);
    },
  };
}
