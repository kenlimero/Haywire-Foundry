/**
 * CardPanelOverlay — base class for multi-card overlays with an expandable panel.
 * Displays a thumbnail with badge count; hover reveals a panel with a card grid.
 * Supports drag-drop to add cards, deduplication, and panel toggle with timeout.
 * @module overlays/card-panel-overlay
 */
import { BaseOverlay, escapeHtml } from "./base-overlay.mjs";
import { parseDropData, showPreview, hidePreview, createPanelToggle } from "../overlay-helpers.mjs";

/**
 * @typedef {import("./base-overlay.mjs").BaseOverlayConfig & {
 *   panelId: string,
 *   cardsSettingKey: string,
 *   backcoverImg: string,
 *   labelKey: string,
 *   iconClass?: string,
 * }} CardPanelOverlayConfig
 */

export class CardPanelOverlay extends BaseOverlay {
  /** @type {HTMLElement|null} */
  #panelEl = null;
  /** @type {{ show: () => void, hide: () => void }|null} */
  #panelToggle = null;
  /** @type {string} */
  #cardsSettingKey;
  /** @type {string} */
  #backcoverImg;
  /** @type {string} */
  #labelKey;
  /** @type {string} */
  #panelId;
  /** @type {string} */
  #iconClass;

  /** @param {CardPanelOverlayConfig} config */
  constructor(config) {
    super(config);
    this.#cardsSettingKey = config.cardsSettingKey;
    this.#backcoverImg = config.backcoverImg;
    this.#labelKey = config.labelKey;
    this.#panelId = config.panelId;
    this.#iconClass = config.iconClass ?? "fa-shield-alt";
  }

  /** @returns {HTMLElement|null} The panel element */
  get panelEl() { return this.#panelEl; }

  /** @returns {{ show: () => void, hide: () => void }|null} */
  get panelToggle() { return this.#panelToggle; }

  /** @returns {string} Setting key for card storage */
  get cardsSettingKey() { return this.#cardsSettingKey; }

  /** @returns {string} */
  get backcoverImg() { return this.#backcoverImg; }

  /** @returns {string} */
  get labelKey() { return this.#labelKey; }

  /** @returns {string} */
  get iconClass() { return this.#iconClass; }

  /* ─── Lifecycle ──────────────────────────────────────────────────────── */

  /** @override */
  init() {
    super.init();
    this.#panelEl = this.#ensurePanelElement();
    this.#panelToggle = createPanelToggle(this.#panelEl, this.el, this.previewEl);
  }

  /** @override */
  destroy() {
    this.#panelEl?.remove();
    this.#panelEl = null;
    this.#panelToggle = null;
    super.destroy();
  }

  /* ─── Card state ─────────────────────────────────────────────────────── */

  /**
   * Get the raw card entries from settings.
   * Override if the setting stores objects instead of plain UUIDs.
   * @returns {Array}
   */
  getCardEntries() {
    return this.getSetting(this.#cardsSettingKey) ?? [];
  }

  /**
   * Set the card entries.
   * @param {Array} entries
   */
  async setCardEntries(entries) {
    await this.setSetting(this.#cardsSettingKey, entries);
  }

  /**
   * Get card UUIDs from entries. Override if entries are objects.
   * @returns {string[]}
   */
  getCardUuids() {
    const entries = this.getCardEntries();
    if (!entries.length) return [];
    return typeof entries[0] === "string" ? entries : entries.map((e) => e.uuid);
  }

  /** @returns {number} Number of cards */
  get cardCount() { return this.getCardEntries().length; }

  /**
   * Add card UUIDs, skipping duplicates.
   * @param {string[]} uuids
   */
  async addCards(uuids) {
    const current = this.getCardUuids();
    const existing = new Set(current);
    const newUuids = uuids.filter((uuid) => !existing.has(uuid));
    if (!newUuids.length) return;
    await this.setCardEntries([...this.getCardEntries(), ...newUuids]);
  }

  /**
   * Remove a card by UUID.
   * @param {string} uuid
   */
  async removeCard(uuid) {
    const entries = this.getCardEntries();
    if (typeof entries[0] === "string") {
      await this.setCardEntries(entries.filter((id) => id !== uuid));
    } else {
      await this.setCardEntries(entries.filter((e) => e.uuid !== uuid));
    }
  }

  /** Clear all cards. */
  async purgeAll() {
    await this.setCardEntries([]);
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */

  /** @override */
  async buildHTML() {
    const count = this.cardCount;
    return `
      <div class="haywire-support-thumb" title="${this.i18n(this.#labelKey)}">
        <img src="${escapeHtml(this.#backcoverImg)}" alt="${this.i18n(this.#labelKey)}" />
        ${this.pinHTML()}
        ${this.buildBadgeHTML(count)}
      </div>`;
  }

  /**
   * Build the badge HTML showing card count. Override to customize.
   * @param {number} _count
   * @returns {string}
   */
  buildBadgeHTML(_count) { return ""; }

  /** @override */
  bindEvents() {
    const thumb = this.el?.querySelector(".haywire-support-thumb");
    if (!thumb) return;

    thumb.addEventListener("mouseenter", () => this.#panelToggle?.show());
    thumb.addEventListener("mouseleave", () => this.#panelToggle?.hide());
    this.bindDragDrop(thumb, (e) => this.onDrop(e));
    this.bindPin();

    this.#panelEl?.addEventListener("mouseenter", () => this.#panelToggle?.show());
    this.#panelEl?.addEventListener("mouseleave", () => this.#panelToggle?.hide());

    this.renderPanel();
  }

  /**
   * Render the panel content. Override for custom panel layout.
   */
  async renderPanel() {
    const panel = this.#panelEl;
    if (!panel) return;

    const entries = this.getCardEntries();
    if (!entries.length) {
      panel.innerHTML = this.buildEmptyPanelHTML();
      return;
    }

    const uuids = this.getCardUuids();
    const resolved = await Promise.all(uuids.map((uuid) => fromUuid(uuid).catch(() => null)));
    panel.innerHTML = this.buildPanelHTML(entries, resolved);
    this.bindPanelEvents(panel);
  }

  /**
   * Build the empty panel HTML.
   * @returns {string}
   */
  buildEmptyPanelHTML() {
    return `
      <div class="haywire-support-panel-inner">
        <div class="haywire-support-panel-header">
          <i class="fas ${this.#iconClass}"></i> ${this.i18n(this.#labelKey)}
        </div>
        <div class="haywire-support-empty">${this.i18n("HAYWIRE.Unit.NoSupport")}</div>
      </div>`;
  }

  /**
   * Build the populated panel HTML. Override in subclasses.
   * @param {Array} entries - Raw card entries
   * @param {Array} resolved - Resolved card documents
   * @returns {string}
   */
  buildPanelHTML(entries, resolved) {
    const cardsHtml = this.getCardUuids()
      .map((_uuid, i) => {
        const card = resolved[i];
        const name = card?.name ?? "???";
        const img = card?.faces?.[0]?.img ?? card?.img ?? "icons/svg/card-hand.svg";
        return `
        <div class="haywire-support-card" data-preview-img="${escapeHtml(img)}" data-preview-name="${escapeHtml(name)}">
          <img class="haywire-support-card-img" src="${escapeHtml(img)}" alt="${escapeHtml(name)}" />
        </div>`;
      })
      .join("");

    return `
      <div class="haywire-support-panel-inner">
        <div class="haywire-support-panel-header">
          <i class="fas ${this.#iconClass}"></i> ${this.i18n(this.#labelKey)}
        </div>
        <div class="haywire-support-cards">${cardsHtml}</div>
      </div>`;
  }

  /**
   * Bind events on panel cards (hover preview). Override to add more.
   * @param {HTMLElement} panel
   */
  bindPanelEvents(panel) {
    panel.querySelectorAll(".haywire-support-card").forEach((card) => {
      card.addEventListener("mouseenter", () => this.showPreview(card.dataset.previewImg, card.dataset.previewName));
      card.addEventListener("mouseleave", () => this.hidePreview());
    });
  }

  /* ─── Drop handling ──────────────────────────────────────────────────── */

  /**
   * Handle a drop event. Override for custom drop validation.
   * @param {DragEvent} event
   */
  onDrop(event) {
    const data = parseDropData(event);
    if (!data) return;
    this.addCards([data.uuid]);
  }

  /* ─── Private ────────────────────────────────────────────────────────── */

  #ensurePanelElement() {
    let el = document.getElementById(this.#panelId);
    if (el) return el;
    el = document.createElement("div");
    el.id = this.#panelId;
    document.body.appendChild(el);
    return el;
  }
}
