/**
 * Simple Card Overlay — generic single-card overlay with drag-drop and random draw.
 * Used for Infiltration and Operations decks.
 * Instantiated with a config object to avoid class duplication.
 * @module simple-card-overlay
 */
import {
  pinSvg, parseDropData, bindPinToggle, bindDragDrop,
  onSettingsChange, resolveCardImage, drawRandomCard,
  showPreview, hidePreview, getOrCreateElement, escapeHtml,
} from "./overlay-helpers.mjs";

/**
 * @typedef {object} SimpleCardOverlayConfig
 * @property {string} settingKey   - e.g. "infilCardIds"
 * @property {string} deckName     - e.g. "Infiltration"
 * @property {string} elId         - e.g. "haywire-infil-overlay"
 * @property {string} previewId    - e.g. "haywire-infil-preview"
 * @property {string} backcover    - e.g. "systems/haywire/assets/cards/backcovers/infil.webp"
 * @property {string} altText      - e.g. "Infil"
 * @property {string} labelKey     - e.g. "HAYWIRE.Infil.Label"
 * @property {string} [chatLabelKey] - e.g. "HAYWIRE.Infil.CardDrawn"
 * @property {string} [iconClass]  - e.g. "fa-id-card"
 */

export class SimpleCardOverlay {
  /** @type {HTMLElement|null} */
  #el = null;
  /** @type {HTMLElement|null} */
  #previewEl = null;
  /** @type {SimpleCardOverlayConfig} */
  #config;

  /**
   * @param {SimpleCardOverlayConfig} config
   */
  constructor(config) {
    this.#config = config;
  }

  init() {
    this.#el = getOrCreateElement(this.#el, this.#config.elId);
    this.#previewEl = getOrCreateElement(this.#previewEl, this.#config.previewId);
    this.render();
    onSettingsChange([this.#config.settingKey], () => this.render());
  }

  /** @returns {string[]} Current card UUIDs */
  get cardIds() {
    return game.settings.get("haywire", this.#config.settingKey) ?? [];
  }

  /** @param {string[]} ids */
  async setCardIds(ids) {
    await game.settings.set("haywire", this.#config.settingKey, ids);
  }

  async render() {
    const el = this.#el;
    if (!el) return;

    const cardIds = this.cardIds;
    const hasCard = cardIds.length > 0;
    const cfg = this.#config;

    const { imgSrc, imgAlt } = await resolveCardImage(
      hasCard ? cardIds[0] : null, cfg.backcover, cfg.altText,
    );

    const i18n = (k) => game.i18n.localize(k);
    el.innerHTML = `
      <div class="haywire-support-thumb" title="${i18n(cfg.labelKey)}">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(imgAlt)}" />
        ${pinSvg(i18n("HAYWIRE.Pin"))}
        ${hasCard ? `<span class="haywire-overlay-remove" title="${i18n("HAYWIRE.Support.Remove")}"><i class="fas fa-times"></i></span>` : ""}
        ${!hasCard ? `<span class="haywire-overlay-roll" title="${i18n("HAYWIRE.Roll")}"><i class="fas fa-dice"></i></span>` : ""}
      </div>`;

    const thumb = el.querySelector(".haywire-support-thumb");
    bindPinToggle(el);
    bindDragDrop(thumb, (e) => this.#onDrop(e));

    if (hasCard) {
      thumb.addEventListener("mouseenter", () => showPreview(this.#previewEl, imgSrc, imgAlt));
      thumb.addEventListener("mouseleave", () => hidePreview(this.#previewEl));
    }

    el.querySelector(".haywire-overlay-remove")?.addEventListener("click", (e) => {
      e.stopPropagation();
      hidePreview(this.#previewEl);
      this.setCardIds([]);
    });

    el.querySelector(".haywire-overlay-roll")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#rollCard();
    });
  }

  /* ---- Private ---- */

  /** @param {DragEvent} event */
  #onDrop(event) {
    const data = parseDropData(event);
    if (!data) return;
    this.setCardIds([data.uuid]);
  }

  async #rollCard() {
    const result = await drawRandomCard(this.#config.deckName);
    if (!result) return;
    await this.setCardIds([result.uuid]);

    const card = result.card;
    const faceImg = card.faces?.[0]?.img ?? card.img ?? "";
    const cardName = card.name ?? "???";
    const cfg = this.#config;
    const label = game.i18n.localize(cfg.chatLabelKey ?? cfg.labelKey);
    const icon = cfg.iconClass ?? "fa-cards";

    await ChatMessage.create({
      content: `<div class="haywire-card-chat">
        <div class="haywire-card-chat-header">
          <i class="fas ${icon}"></i> ${escapeHtml(label)}
        </div>
        <img class="haywire-card-chat-img" src="${escapeHtml(faceImg)}" alt="${escapeHtml(cardName)}" data-action="showCard" data-src="${escapeHtml(faceImg)}" data-title="${escapeHtml(cardName)}"/>
      </div>`,
      speaker: { alias: label },
    });
  }
}
