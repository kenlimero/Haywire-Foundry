/**
 * Fog of War Overlay — miniature backcover en haut, entre OPFOR support et le threat level.
 * - die=5 : état initial, affiche un dé cliquable avec la valeur cible
 * - Clic dé : lance 1d6, si résultat >= valeur cible → tire une carte fog of war
 *   puis décrémente la valeur cible de 1 (la brume devient plus probable)
 * - Après tirage : la carte s'affiche, le compteur continue sa descente
 * - die=0 : plus de checks fog disponibles (reset mission pour recommencer)
 * @module fog-of-war-overlay
 */
import { CardOverlay } from "./overlays/card-overlay.mjs";
import { escapeHtml } from "./overlays/base-overlay.mjs";
import { drawRandomCard } from "./overlay-helpers.mjs";

export class FogOfWarOverlay extends CardOverlay {
  static DECK_NAME = "Fog of War";

  constructor() {
    super({
      elementId: "haywire-fog-overlay",
      previewId: "haywire-fog-preview",
      settingKeys: ["fogOfWarCardId", "fogOfWarDie"],
      backcoverImg: "systems/haywire/assets/cards/backcovers/fog.webp",
      altText: "Fog of War",
      cardSettingKey: "fogOfWarCardId",
      labelKey: "HAYWIRE.FogOfWar.Label",
    });
  }

  /** @returns {number} Current die target value */
  get die() { return this.getSetting("fogOfWarDie") || 6; }

  /** @param {number} value */
  async setDie(value) { await this.setSetting("fogOfWarDie", value); }

  /** @returns {string[]} Already drawn card IDs */
  get drawnCards() { return this.getSetting("fogOfWarDrawnCards") ?? []; }

  /** @param {string[]} ids */
  async setDrawnCards(ids) { await this.setSetting("fogOfWarDrawnCards", ids); }

  /* ─── Card state override ────────────────────────────────────────────── */

  /**
   * FogOfWar stores a single string, not an array.
   * @override
   */
  get cardId() { return this.getSetting("fogOfWarCardId") ?? ""; }

  /** @override */
  async setCardIds(ids) { await this.setSetting("fogOfWarCardId", ids[0] ?? ""); }

  /** @override */
  async clearCard() { await this.setSetting("fogOfWarCardId", ""); }

  /* ─── Render ─────────────────────────────────────────────────────────── */

  /** @override — no remove button on fog overlay */
  buildRemoveHTML() { return ""; }

  /** @override — die counter instead of roll button */
  buildControlsHTML(_hasCard) {
    const die = this.die;
    if (die <= 0) return "";
    return `<span class="haywire-fog-die" title="${this.i18n("HAYWIRE.FogOfWar.DieHint")}"><span class="fog-die-number">${die}+</span><span class="fog-die-icon"><i class="fas fa-dice"></i></span></span>`;
  }

  /** @override */
  bindCardEvents() {
    this.el?.querySelector(".haywire-fog-die")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hidePreview();
      this.#onDieClick();
    });
  }

  /* ─── Private ────────────────────────────────────────────────────────── */

  async #onDieClick() {
    const target = this.die;
    if (target <= 0) return;

    const roll = await new Roll("1d6").evaluate();
    const result = roll.total;
    const label = this.i18n("HAYWIRE.FogOfWar.Label");
    const triggered = result >= target;

    const outcomeKey = triggered ? "HAYWIRE.FogOfWar.Triggered" : "HAYWIRE.FogOfWar.Safe";
    const outcomeText = this.i18n(outcomeKey);
    const outcomeClass = triggered ? "fog-triggered" : "fog-safe";

    await ChatMessage.create({
      content: `<div class="haywire-card-chat">
        <div class="haywire-card-chat-header">
          <i class="fas fa-cloud-fog"></i> ${label}
        </div>
        <p style="padding:0.5rem;font-size:1.2rem;margin:0;">
          <strong>${this.i18n("HAYWIRE.FogOfWar.DieRolled")} ${result}</strong>
          (${target}+)
          — <span class="${outcomeClass}">${outcomeText}</span>
        </p>
      </div>`,
      speaker: { alias: label },
    });

    if (triggered) {
      await this.#rollCard();
    } else {
      await this.clearCard();
    }

    await this.setDie(target - 1);
  }

  async #rollCard() {
    let drawnIds = this.drawnCards;

    let result = await drawRandomCard(FogOfWarOverlay.DECK_NAME, drawnIds);

    if (!result) {
      await ChatMessage.create({
        content: `<p><strong>${this.i18n("HAYWIRE.FogOfWar.DeckExhausted")}</strong></p>`,
        whisper: ChatMessage.getWhisperRecipients("GM"),
      });
      drawnIds = [];
      await this.setDrawnCards([]);
      result = await drawRandomCard(FogOfWarOverlay.DECK_NAME);
    }

    if (!result) return;

    const { uuid, card: picked } = result;
    await this.setDrawnCards([...drawnIds, picked._id]);
    await this.setCardIds([uuid]);

    const faceImg = picked.faces?.[0]?.img ?? picked.img;
    const cardName = picked.name ?? "???";
    await ChatMessage.create({
      content: `<div class="haywire-card-chat">
      <div class="haywire-card-chat-header">
        <i class="fas fa-cloud-fog"></i> ${this.i18n("HAYWIRE.FogOfWar.CardDrawn")}
      </div>
      <img class="haywire-card-chat-img" src="${escapeHtml(faceImg)}" alt="${escapeHtml(cardName)}" data-action="showCard" data-src="${escapeHtml(faceImg)}" data-title="${escapeHtml(cardName)}"/>
    </div>`,
      speaker: { alias: this.i18n("HAYWIRE.FogOfWar.Label") },
    });
  }
}

export default new FogOfWarOverlay();
