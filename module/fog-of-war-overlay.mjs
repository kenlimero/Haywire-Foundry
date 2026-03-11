/**
 * Fog of War Overlay — miniature backcover en haut, entre OPFOR support et le threat level.
 * - die=5 : état initial, affiche un dé cliquable avec la valeur cible
 * - Clic dé : lance 1d6, si résultat >= valeur cible → tire une carte fog of war
 *   puis décrémente la valeur cible de 1 (la brume devient plus probable)
 * - Après tirage : la carte s'affiche, le compteur continue sa descente
 * - die=0 : plus de checks fog disponibles (reset mission pour recommencer)
 * @module fog-of-war-overlay
 */
import {
  pinSvg, parseDropData, bindPinToggle, bindDragDrop,
  onSettingsChange, resolveCardImage, showPreview, hidePreview,
  getOrCreateElement, drawRandomCard, escapeHtml,
} from "./overlay-helpers.mjs";

export class FogOfWarOverlay {
  static #el = null;
  static #previewEl = null;

  static DECK_NAME = "Fog of War";

  static init() {
    this.#el = getOrCreateElement(this.#el, "haywire-fog-overlay");
    this.#previewEl = getOrCreateElement(this.#previewEl, "haywire-fog-preview");
    this.render();
    onSettingsChange(["fogOfWarCardId", "fogOfWarDie"], () => this.render());
  }

  /** @returns {string} Current fog card UUID */
  static get cardId() {
    return game.settings.get("haywire", "fogOfWarCardId") ?? "";
  }

  /** @returns {number} Current die target value */
  static get die() {
    return game.settings.get("haywire", "fogOfWarDie") || 6;
  }

  /** @param {string} id */
  static async setCardId(id) {
    await game.settings.set("haywire", "fogOfWarCardId", id);
  }

  /** @param {number} value */
  static async setDie(value) {
    await game.settings.set("haywire", "fogOfWarDie", value);
  }

  /** @returns {string[]} Already drawn card IDs */
  static get drawnCards() {
    return game.settings.get("haywire", "fogOfWarDrawnCards") ?? [];
  }

  /** @param {string[]} ids */
  static async setDrawnCards(ids) {
    await game.settings.set("haywire", "fogOfWarDrawnCards", ids);
  }

  static async render() {
    const el = this.#el;
    if (!el) return;

    const cardId = this.cardId;
    const hasCard = !!cardId;
    const die = this.die;
    const i18n = (k) => game.i18n.localize(k);

    const { imgSrc, imgAlt } = await resolveCardImage(
      hasCard ? cardId : null,
      "systems/haywire/assets/cards/backcovers/fog.webp",
      "Fog of War",
    );

    const showDie = die > 0;

    el.innerHTML = `
      <div class="haywire-support-thumb" title="${i18n("HAYWIRE.FogOfWar.Label")}">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(imgAlt)}" />
        ${pinSvg(i18n("HAYWIRE.Pin"))}
        ${showDie ? `<span class="haywire-fog-die" title="${i18n("HAYWIRE.FogOfWar.DieHint")}"><span class="fog-die-number">${die}+</span><span class="fog-die-icon"><i class="fas fa-dice"></i></span></span>` : ""}
      </div>`;

    const thumb = el.querySelector(".haywire-support-thumb");
    bindPinToggle(el);
    bindDragDrop(thumb, (e) => this.#onDrop(e));

    if (hasCard) {
      thumb.addEventListener("mouseenter", () => showPreview(this.#previewEl, imgSrc, imgAlt));
      thumb.addEventListener("mouseleave", () => hidePreview(this.#previewEl));
    }

    el.querySelector(".haywire-fog-die")?.addEventListener("click", (e) => {
      e.stopPropagation();
      hidePreview(this.#previewEl);
      this.#onDieClick();
    });
  }

  /* ---- Private ---- */

  /** @param {DragEvent} event */
  static #onDrop(event) {
    const data = parseDropData(event);
    if (!data) return;
    this.setCardId(data.uuid);
  }

  static async #onDieClick() {
    const target = this.die;
    if (target <= 0) return;

    const roll = await new Roll("1d6").evaluate();
    const result = roll.total;
    const label = game.i18n.localize("HAYWIRE.FogOfWar.Label");
    const triggered = result >= target;

    const outcomeKey = triggered ? "HAYWIRE.FogOfWar.Triggered" : "HAYWIRE.FogOfWar.Safe";
    const outcomeText = game.i18n.localize(outcomeKey);
    const outcomeClass = triggered ? "fog-triggered" : "fog-safe";

    await ChatMessage.create({
      content: `<div class="haywire-card-chat">
        <div class="haywire-card-chat-header">
          <i class="fas fa-cloud-fog"></i> ${label}
        </div>
        <p style="padding:0.5rem;font-size:1.2rem;margin:0;">
          <strong>${game.i18n.localize("HAYWIRE.FogOfWar.DieRolled")} ${result}</strong>
          (${target}+)
          — <span class="${outcomeClass}">${outcomeText}</span>
        </p>
      </div>`,
      speaker: { alias: label },
    });

    if (triggered) {
      await this.#rollCard();
    } else {
      await this.setCardId("");
    }

    await this.setDie(target - 1);
  }

  /**
   * Draw a random fog of war card, excluding already drawn ones.
   * Uses the shared drawRandomCard helper with excludeIds for deduplication.
   */
  static async #rollCard() {
    let drawnIds = this.drawnCards;

    // First attempt: draw excluding already drawn cards
    let result = await drawRandomCard(this.DECK_NAME, drawnIds);

    // If deck exhausted, reset drawn cards and try again
    if (!result) {
      await ChatMessage.create({
        content: `<p><strong>${game.i18n.localize("HAYWIRE.FogOfWar.DeckExhausted")}</strong></p>`,
        whisper: ChatMessage.getWhisperRecipients("GM"),
      });
      drawnIds = [];
      await this.setDrawnCards([]);
      result = await drawRandomCard(this.DECK_NAME);
    }

    if (!result) return;

    const { uuid, card: picked } = result;
    await this.setDrawnCards([...drawnIds, picked._id]);
    await this.setCardId(uuid);

    const faceImg = picked.faces?.[0]?.img ?? picked.img;
    const cardName = picked.name ?? "???";
    await ChatMessage.create({
      content: `<div class="haywire-card-chat">
      <div class="haywire-card-chat-header">
        <i class="fas fa-cloud-fog"></i> ${game.i18n.localize("HAYWIRE.FogOfWar.CardDrawn")}
      </div>
      <img class="haywire-card-chat-img" src="${escapeHtml(faceImg)}" alt="${escapeHtml(cardName)}" data-action="showCard" data-src="${escapeHtml(faceImg)}" data-title="${escapeHtml(cardName)}"/>
    </div>`,
      speaker: { alias: game.i18n.localize("HAYWIRE.FogOfWar.Label") },
    });
  }
}
