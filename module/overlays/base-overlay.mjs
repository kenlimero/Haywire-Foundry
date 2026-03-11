/**
 * BaseOverlay — abstract base class for all Haywire overlays.
 * Handles DOM creation/caching, pin toggle, hover preview, settings hooks, and render lifecycle.
 * Designed for singleton instances (one per overlay) or multi-instance (SimpleCardOverlay).
 * @module overlays/base-overlay
 */
import {
  escapeHtml, pinSvg, showPreview as showPreviewHelper,
  hidePreview as hidePreviewHelper, parseDropData,
} from "../overlay-helpers.mjs";

export class BaseOverlay {
  /** @type {HTMLElement|null} */
  #el = null;
  /** @type {HTMLElement|null} */
  #previewEl = null;
  /** @type {string} DOM id for the overlay root element */
  #elementId;
  /** @type {string} DOM id for the preview element */
  #previewId;
  /** @type {string[]} Setting keys that trigger re-render */
  #settingKeys;

  /**
   * @param {object} config
   * @param {string} config.elementId   - DOM id for the overlay root element
   * @param {string} [config.previewId] - DOM id for the preview element
   * @param {string[]} [config.settingKeys] - Setting keys that trigger re-render on change
   */
  constructor({ elementId, previewId = "", settingKeys = [] }) {
    this.#elementId = elementId;
    this.#previewId = previewId;
    this.#settingKeys = settingKeys;
  }

  /** @returns {HTMLElement|null} The overlay root element */
  get el() { return this.#el; }

  /** @returns {HTMLElement|null} The preview element */
  get previewEl() { return this.#previewEl; }

  /** @returns {string} */
  get elementId() { return this.#elementId; }

  /* ─── Lifecycle ──────────────────────────────────────────────────────── */

  /** Create DOM elements, bind settings hooks, first render. */
  init() {
    this.#el = this.#ensureElement(this.#elementId);
    if (this.#previewId) {
      this.#previewEl = this.#ensureElement(this.#previewId);
    }
    this.#bindSettingsHooks();
    this.bindHooks();
    this.render();
  }

  /**
   * Re-render the overlay. Calls buildHTML() then bindEvents().
   * Checks isVisible() and toggles the `hidden` class accordingly.
   */
  async render() {
    const el = this.#el;
    if (!el) return;

    const visible = await this.isVisible();
    if (!visible) {
      if (!el.classList.contains("user-pinned")) {
        el.innerHTML = "";
      }
      return;
    }

    el.innerHTML = await this.buildHTML();
    this.bindEvents();
  }

  /** Remove DOM elements and clean up. */
  destroy() {
    this.#el?.remove();
    this.#previewEl?.remove();
    this.#el = null;
    this.#previewEl = null;
  }

  /* ─── Override in subclasses ─────────────────────────────────────────── */

  /**
   * Build the inner HTML of the overlay.
   * @returns {Promise<string>|string} HTML string
   */
  async buildHTML() { return ""; }

  /** Bind event listeners after render. Called after buildHTML(). */
  bindEvents() {}

  /**
   * Register additional FoundryVTT hooks beyond settings changes.
   * Called once during init().
   */
  bindHooks() {}

  /**
   * Whether the overlay should be visible.
   * Override for conditional visibility (e.g. alert + leader check).
   * @returns {Promise<boolean>|boolean}
   */
  async isVisible() { return true; }

  /* ─── Shared utilities ──────────────────────────────────────────────── */

  /** @returns {boolean} Whether the current user is a GM */
  get isGM() { return game.user.isGM; }

  /**
   * Localize an i18n key.
   * @param {string} key
   * @returns {string}
   */
  i18n(key) { return game.i18n.localize(key); }

  /**
   * Get a haywire game setting.
   * @param {string} key
   * @returns {*}
   */
  getSetting(key) { return game.settings.get("haywire", key); }

  /**
   * Set a haywire game setting.
   * @param {string} key
   * @param {*} value
   */
  async setSetting(key, value) { await game.settings.set("haywire", key, value); }

  /** Render the pin SVG markup. */
  pinHTML() { return pinSvg(this.i18n("HAYWIRE.Pin")); }

  /** Bind pin toggle click on the overlay root element. */
  bindPin() {
    this.#el?.querySelector(".haywire-overlay-pin")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#el.classList.toggle("user-pinned");
    });
  }

  /**
   * Show a preview image.
   * @param {string} img - Image source URL
   * @param {string} alt - Alt text
   */
  showPreview(img, alt) {
    showPreviewHelper(this.#previewEl, img, alt);
  }

  /** Hide the preview. */
  hidePreview() {
    hidePreviewHelper(this.#previewEl);
  }

  /**
   * Bind drag-drop on a target element.
   * @param {HTMLElement} target - Element to receive drag events
   * @param {(event: DragEvent) => void} onDropCallback
   */
  bindDragDrop(target, onDropCallback) {
    target.addEventListener("dragover", (e) => {
      e.preventDefault();
      target.classList.add("drag-over");
    });
    target.addEventListener("dragleave", () => {
      target.classList.remove("drag-over");
    });
    target.addEventListener("drop", (e) => {
      e.preventDefault();
      target.classList.remove("drag-over");
      onDropCallback(e);
    });
  }

  /* ─── Private ────────────────────────────────────────────────────────── */

  /**
   * Get or create a DOM element by id, appended to document.body.
   * @param {string} id
   * @returns {HTMLElement}
   */
  #ensureElement(id) {
    let el = document.getElementById(id);
    if (el) return el;
    el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
    return el;
  }

  /** Subscribe to setting changes and re-render. */
  #bindSettingsHooks() {
    if (!this.#settingKeys.length) return;
    const handler = (setting) => {
      if (this.#settingKeys.some((k) => setting.key === `haywire.${k}`)) {
        this.render();
      }
    };
    Hooks.on("createSetting", handler);
    Hooks.on("updateSetting", handler);
  }
}

// Re-export helpers that subclasses and concrete overlays still need
export { escapeHtml, parseDropData };
