/**
 * CardOverlay — base class for single-card overlays.
 * Displays a backcover when empty, card face when populated.
 * Supports drag-drop, hover preview, pin, and optional remove/roll controls.
 * @module overlays/card-overlay
 */
import { BaseOverlay, escapeHtml } from "./base-overlay.mjs";
import { resolveCardImage, parseDropData } from "../overlay-helpers.mjs";

export class CardOverlay extends BaseOverlay {
  /** @type {string} Path to the backcover image */
  #backcoverImg;
  /** @type {string} Alt text when no card is present */
  #altText;
  /** @type {string} Setting key storing card UUID(s) */
  #cardSettingKey;
  /** @type {string} i18n key for the overlay label */
  #labelKey;

  /**
   * @param {object} config
   * @param {string} config.elementId
   * @param {string} [config.previewId]
   * @param {string[]} [config.settingKeys]
   * @param {string} config.backcoverImg   - Path to backcover image
   * @param {string} config.altText        - Default alt text
   * @param {string} config.cardSettingKey - Setting key for the card UUID
   * @param {string} config.labelKey       - i18n key for the label
   */
  constructor(config) {
    super(config);
    this.#backcoverImg = config.backcoverImg;
    this.#altText = config.altText;
    this.#cardSettingKey = config.cardSettingKey;
    this.#labelKey = config.labelKey;
  }

  /** @returns {string} Backcover image path */
  get backcoverImg() { return this.#backcoverImg; }

  /** @returns {string} Default alt text */
  get altText() { return this.#altText; }

  /** @returns {string} The setting key for card storage */
  get cardSettingKey() { return this.#cardSettingKey; }

  /** @returns {string} i18n label key */
  get labelKey() { return this.#labelKey; }

  /* ─── Card state ─────────────────────────────────────────────────────── */

  /** @returns {string} Current card UUID (first in the array, or empty) */
  get cardId() {
    const ids = this.getSetting(this.#cardSettingKey);
    return Array.isArray(ids) ? (ids[0] ?? "") : (ids ?? "");
  }

  /** @returns {boolean} Whether a card is currently set */
  get hasCard() { return !!this.cardId; }

  /**
   * Set the card UUID(s).
   * @param {string[]} ids
   */
  async setCardIds(ids) {
    await this.setSetting(this.#cardSettingKey, ids);
  }

  /** Clear the current card. */
  async clearCard() {
    await this.setCardIds([]);
  }

  /**
   * Resolve the current card image, falling back to backcover.
   * @returns {Promise<{imgSrc: string, imgAlt: string}>}
   */
  async getCardImage() {
    return resolveCardImage(
      this.hasCard ? this.cardId : null,
      this.#backcoverImg,
      this.#altText,
    );
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */

  /** @override */
  async buildHTML() {
    const { imgSrc, imgAlt } = await this.getCardImage();
    const hasCard = this.hasCard;

    return `
      <div class="haywire-support-thumb" title="${this.i18n(this.#labelKey)}">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(imgAlt)}" />
        ${this.pinHTML()}
        ${hasCard ? this.buildRemoveHTML() : ""}
        ${this.buildControlsHTML(hasCard)}
      </div>`;
  }

  /**
   * Build the remove button HTML. Override to customize or disable.
   * @returns {string}
   */
  buildRemoveHTML() {
    return `<span class="haywire-overlay-remove" title="${this.i18n("HAYWIRE.Support.Remove")}"><i class="fas fa-times"></i></span>`;
  }

  /**
   * Build additional controls HTML (roll button, die, etc.).
   * Override in subclasses to add custom controls.
   * @param {boolean} _hasCard - Whether a card is currently displayed
   * @returns {string}
   */
  buildControlsHTML(_hasCard) { return ""; }

  /** @override */
  bindEvents() {
    const thumb = this.el?.querySelector(".haywire-support-thumb");
    if (!thumb) return;

    this.bindPin();
    this.bindDragDrop(thumb, (e) => this.onDrop(e));
    this.#bindPreview(thumb);
    this.#bindRemove();
    this.bindCardEvents();
  }

  /**
   * Bind additional card-specific events. Override in subclasses.
   */
  bindCardEvents() {}

  /* ─── Drop handling ──────────────────────────────────────────────────── */

  /**
   * Handle a drop event. Override for custom drop logic.
   * @param {DragEvent} event
   */
  onDrop(event) {
    const data = parseDropData(event);
    if (!data) return;
    this.setCardIds([data.uuid]);
  }

  /* ─── Private ────────────────────────────────────────────────────────── */

  /**
   * @param {HTMLElement} thumb
   */
  #bindPreview(thumb) {
    if (!this.hasCard) return;
    thumb.addEventListener("mouseenter", async () => {
      const { imgSrc, imgAlt } = await this.getCardImage();
      this.showPreview(imgSrc, imgAlt);
    });
    thumb.addEventListener("mouseleave", () => this.hidePreview());
  }

  #bindRemove() {
    this.el?.querySelector(".haywire-overlay-remove")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hidePreview();
      this.clearCard();
    });
  }
}
