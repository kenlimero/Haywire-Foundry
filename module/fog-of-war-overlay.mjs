/**
 * Fog of War Overlay — miniature backcover en haut, entre OPFOR support et le threat level.
 * - die=0 : affiche un bouton Roll d6 (1ère fois uniquement)
 * - Clic roll : lance un d6, affiche le résultat, message chat
 * - Si 6 : tire immédiatement une carte fog of war
 * - Si <6 : décompte -1 par clic
 * - À 1 (sans afficher) : tire une carte automatiquement
 * - Après tirage/suppression : compteur repart à 6 (pas de nouveau roll)
 */
import {
  pinSvg, parseDropData, bindPinToggle, bindDragDrop,
  onSettingsChange, resolveCardImage, showPreview, hidePreview,
  getOrCreateElement,
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

  static get cardId() {
    return game.settings.get("haywire", "fogOfWarCardId") ?? "";
  }

  static get die() {
    return game.settings.get("haywire", "fogOfWarDie") ?? 0;
  }

  static async setCardId(id) {
    await game.settings.set("haywire", "fogOfWarCardId", id);
  }

  static async setDie(value) {
    await game.settings.set("haywire", "fogOfWarDie", value);
  }

  static get drawnCards() {
    return game.settings.get("haywire", "fogOfWarDrawnCards") ?? [];
  }

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

    const needsRoll = die === 0 && !hasCard;
    const showDie = die > 0 && !hasCard;

    el.innerHTML = `
      <div class="haywire-support-thumb" title="${i18n("HAYWIRE.FogOfWar.Label")}">
        <img src="${imgSrc}" alt="${imgAlt}" />
        ${pinSvg(i18n("HAYWIRE.Pin"))}
        ${hasCard ? `<span class="haywire-overlay-remove" title="${i18n("HAYWIRE.Support.Remove")}"><i class="fas fa-times"></i></span>` : ""}
        ${needsRoll ? `<span class="haywire-overlay-roll" title="${i18n("HAYWIRE.Roll")}"><i class="fas fa-dice"></i></span>` : ""}
        ${showDie ? `<span class="haywire-fog-die" title="${i18n("HAYWIRE.FogOfWar.DieHint")}">${die}</span>` : ""}
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
      this.setCardId("");
    });

    el.querySelector(".haywire-overlay-roll")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#onRollDie();
    });

    el.querySelector(".haywire-fog-die")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#onDieClick();
    });
  }

  /* ---- Private ---- */


  static #onDrop(event) {
    const data = parseDropData(event);
    if (!data) return;
    this.setCardId(data.uuid);
  }

  static async #onRollDie() {
    const roll = await new Roll("1d6").evaluate();
    const result = roll.total;
    const label = game.i18n.localize("HAYWIRE.FogOfWar.Label");
    const rolled = game.i18n.localize("HAYWIRE.FogOfWar.DieRolled");

    ChatMessage.create({
      content: `<div class="haywire-card-chat">
        <div class="haywire-card-chat-header">
          <i class="fas fa-cloud-fog"></i> ${label}
        </div>
        <p style="padding:0.5rem;font-size:1.2rem;margin:0;"><strong>${rolled} ${result}</strong></p>
      </div>`,
      speaker: { alias: label },
    });

    if (result === 6) {
      await this.#rollCard();
      await this.setDie(6);
    } else {
      await this.setDie(result);
    }
  }

  static async #onDieClick() {
    const current = this.die;
    if (current <= 2) {
      await this.#rollCard();
      await this.setDie(6);
    } else {
      await this.setDie(current - 1);
    }
  }

  static async #rollCard() {
    const pack = game.packs.get("haywire.decks");
    if (!pack) return;

    const index = await pack.getIndex();
    const deckEntry = index.find((e) => e.name === this.DECK_NAME);
    if (!deckEntry) return;

    const deck = await pack.getDocument(deckEntry._id);
    if (!deck?.cards?.size) return;

    const allCards = Array.from(deck.cards);
    let drawnIds = this.drawnCards;
    let available = allCards.filter((c) => !drawnIds.includes(c._id));

    if (available.length === 0) {
      ChatMessage.create({
        content: `<p><strong>${game.i18n.localize("HAYWIRE.FogOfWar.DeckExhausted")}</strong></p>`,
        whisper: ChatMessage.getWhisperRecipients("GM"),
      });
      drawnIds = [];
      await this.setDrawnCards([]);
      available = allCards;
    }

    const picked = available[Math.floor(Math.random() * available.length)];
    const uuid = `Compendium.haywire.decks.Cards.${deckEntry._id}.Card.${picked._id}`;

    await this.setDrawnCards([...drawnIds, picked._id]);
    await this.setCardId(uuid);

    const faceImg = picked.faces?.[0]?.img ?? picked.img;
    const cardName = picked.name ?? "???";
    ChatMessage.create({
      content: `<div class="haywire-card-chat">
      <div class="haywire-card-chat-header">
        <i class="fas fa-cloud-fog"></i> ${game.i18n.localize("HAYWIRE.FogOfWar.CardDrawn")}
      </div>
      <img class="haywire-card-chat-img" src="${faceImg}" alt="${cardName}" data-action="showCard" data-src="${faceImg}" data-title="${cardName}"/>
    </div>`,
      speaker: { alias: game.i18n.localize("HAYWIRE.FogOfWar.Label") },
    });
  }
}
