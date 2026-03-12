/**
 * Shared constants and utilities for overlay modules.
 * @module overlay-helpers
 */
import {
  LEADER_NAME_PATTERN,
  OPFOR_ACTIVITY_SKILL,
  COMPENDIUM_PACKS,
} from "./game-config.mjs";

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

/**
 * Check if OPFOR support/reinforcement overlays should be active.
 * Requires: alert active + at least one non-downed opfor-unit with leader name or "Support" skill.
 * Resolves all skill UUIDs in parallel for performance.
 * @returns {Promise<boolean>}
 */
export async function isOpforActivatable() {
  const alertActive = game.settings.get("haywire", "threatAlert");
  if (!alertActive) return false;

  const scene = game.scenes?.active;
  if (!scene) return false;

  // Collect all skill UUIDs from non-downed opfor-units (skip leaders — they match immediately)
  const skillUuidsToResolve = [];
  for (const token of scene.tokens) {
    const actor = token.actor;
    if (!actor || actor.type !== "opfor-unit") continue;
    if (actor.system.conditions?.has("downed")) continue;
    if (LEADER_NAME_PATTERN.test(actor.name)) return true;

    for (const uuid of actor.system.opforSkillIds ?? []) {
      skillUuidsToResolve.push(uuid);
    }
  }

  if (!skillUuidsToResolve.length) return false;

  // Batch resolve all skill UUIDs in parallel
  const skills = await Promise.all(
    skillUuidsToResolve.map((uuid) => fromUuid(uuid).catch((err) => {
      console.warn(`haywire | isOpforActivatable: failed to resolve skill UUID "${uuid}"`, err);
      return null;
    })),
  );
  return skills.some((skill) => skill?.name?.toLowerCase() === OPFOR_ACTIVITY_SKILL);
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
 * @returns {Promise<{ uuid: string, card: { _id: string, name?: string, img?: string, faces?: Array<{img?: string}> }, deckId: string } | null>}
 */
export async function drawRandomCard(deckName, excludeIds = []) {
  const pack = game.packs.get(COMPENDIUM_PACKS.decks);
  if (!pack) {
    console.warn(`haywire | drawRandomCard: compendium ${COMPENDIUM_PACKS.decks} not found`);
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
  const excludeSet = excludeIds.length ? new Set(excludeIds) : null;
  const available = excludeSet
    ? allCards.filter((c) => !excludeSet.has(c._id))
    : allCards;

  if (!available.length) return null;

  const picked = available[Math.floor(Math.random() * available.length)];
  const uuid = `Compendium.${COMPENDIUM_PACKS.decks}.Cards.${deckEntry._id}.Card.${picked._id}`;
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
 * Mixin that adds opfor activity visibility caching to a BaseOverlay subclass.
 * Overlays using this mixin are only visible when isOpforActivatable() returns true.
 * The cache is invalidated on every render and on scene/actor changes.
 * @param {typeof import("./overlays/base-overlay.mjs").BaseOverlay} Base
 * @returns {typeof Base}
 */
export function OpforActivityMixin(Base) {
  return class extends Base {
    /** @type {boolean|null} */
    #cachedActivatable = null;

    /** @override */
    bindHooks() {
      bindOpforActivityHooks(() => { this.#cachedActivatable = null; this.render(); });
    }

    /** @override */
    async isVisible() {
      if (this.#cachedActivatable !== null) return this.#cachedActivatable;
      this.#cachedActivatable = await isOpforActivatable();
      return this.#cachedActivatable;
    }

    /** @override — invalidate cache before re-checking visibility */
    async render() {
      this.#cachedActivatable = null;
      await super.render();
    }
  };
}

/**
 * Roll on a named table from haywire.opfor-tables compendium.
 * @param {string} tableName - Name of the RollTable to roll on
 * @returns {Promise<object|null>} The draw results, or null on failure
 */
export async function rollCompendiumTable(tableName) {
  const pack = game.packs.get(COMPENDIUM_PACKS.opforTables);
  if (!pack) {
    console.warn(`haywire | rollCompendiumTable: compendium ${COMPENDIUM_PACKS.opforTables} not found`);
    return null;
  }

  const index = await pack.getIndex();
  const entry = index.find((e) => e.name === tableName);
  if (!entry) {
    ui.notifications.warn(`Table "${tableName}" not found.`);
    return null;
  }

  const table = await pack.getDocument(entry._id);
  if (!table) {
    console.warn(`haywire | rollCompendiumTable: failed to load table document "${tableName}"`);
    return null;
  }
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
