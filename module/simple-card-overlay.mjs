/**
 * Simple Card Overlay — generic single-card overlay with drag-drop and random draw.
 * Used for Infiltration and Operations decks.
 * Instantiated with a config object to avoid class duplication.
 * @module simple-card-overlay
 */
import { CardOverlay } from "./overlays/card-overlay.mjs";
import { escapeHtml } from "./overlays/base-overlay.mjs";
import { drawRandomCard } from "./overlay-helpers.mjs";

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

export class SimpleCardOverlay extends CardOverlay {
  /** @type {string} */
  #deckName;
  /** @type {string} */
  #chatLabelKey;
  /** @type {string} */
  #iconClass;

  /**
   * @param {SimpleCardOverlayConfig} config
   */
  constructor(config) {
    super({
      elementId: config.elId,
      previewId: config.previewId,
      settingKeys: [config.settingKey],
      backcoverImg: config.backcover,
      altText: config.altText,
      cardSettingKey: config.settingKey,
      labelKey: config.labelKey,
    });
    this.#deckName = config.deckName;
    this.#chatLabelKey = config.chatLabelKey ?? config.labelKey;
    this.#iconClass = config.iconClass ?? "fa-cards";
  }

  /** @override — show roll button when no card is present */
  buildControlsHTML(hasCard) {
    if (hasCard) return "";
    return `<span class="haywire-overlay-roll" title="${this.i18n("HAYWIRE.Roll")}"><i class="fas fa-dice"></i></span>`;
  }

  /** @override */
  bindCardEvents() {
    this.el?.querySelector(".haywire-overlay-roll")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#rollCard();
    });
  }

  async #rollCard() {
    const result = await drawRandomCard(this.#deckName);
    if (!result) return;
    await this.setCardIds([result.uuid]);

    const card = result.card;
    const faceImg = card.faces?.[0]?.img ?? card.img ?? "";
    const cardName = card.name ?? "???";
    const label = this.i18n(this.#chatLabelKey);

    await ChatMessage.create({
      content: `<div class="haywire-card-chat">
        <div class="haywire-card-chat-header">
          <i class="fas ${this.#iconClass}"></i> ${escapeHtml(label)}
        </div>
        <img class="haywire-card-chat-img" src="${escapeHtml(faceImg)}" alt="${escapeHtml(cardName)}" data-action="showCard" data-src="${escapeHtml(faceImg)}" data-title="${escapeHtml(cardName)}"/>
      </div>`,
      speaker: { alias: label },
    });
  }
}
