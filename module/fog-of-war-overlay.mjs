/**
 * Fog of War Overlay — miniature backcover en haut, entre OPFOR support et le threat level.
 * - die=0 : affiche un bouton Roll d6 (1ère fois uniquement)
 * - Clic roll : lance un d6, affiche le résultat, message chat
 * - Si 6 : tire immédiatement une carte fog of war
 * - Si <6 : décompte -1 par clic
 * - À 1 (sans afficher) : tire une carte automatiquement
 * - Après tirage/suppression : compteur repart à 6 (pas de nouveau roll)
 */
export class FogOfWarOverlay {
  static #el = null;
  static #previewEl = null;

  /** Nom du deck dans le compendium haywire.decks */
  static DECK_NAME = "Fog of War";

  static init() {
    this.#getOrCreate();
    this.render();

    const onSettingChange = (setting) => {
      if (setting.key === "haywire.fogOfWarCardId" || setting.key === "haywire.fogOfWarDie") {
        this.render();
      }
    };
    Hooks.on("createSetting", onSettingChange);
    Hooks.on("updateSetting", onSettingChange);
  }

  /** UUID de la carte fog of war active (ou ""). */
  static get cardId() {
    return game.settings.get("haywire", "fogOfWarCardId") ?? "";
  }

  /** Valeur actuelle du dé (0=needs roll, 2-6=countdown). */
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

  /** Reconstruit le HTML. */
  static async render() {
    const el = this.#el;
    if (!el) return;

    const cardId = this.cardId;
    const hasCard = !!cardId;
    const die = this.die;
    const i18n = (k) => game.i18n.localize(k);

    let imgSrc = "systems/haywire/assets/cards/backcovers/fog.webp";
    let imgAlt = "Fog of War";

    if (hasCard) {
      const card = await fromUuid(cardId);
      if (card) {
        imgSrc = card?.faces?.[0]?.img ?? card?.img ?? imgSrc;
        imgAlt = card?.name ?? imgAlt;
      }
    }

    // die=0 → roll button, die>0 → show countdown number
    const needsRoll = die === 0 && !hasCard;
    const showDie = die > 0 && !hasCard;

    const pinSvg = `<span class="haywire-overlay-pin" title="${i18n("HAYWIRE.Pin")}"><svg viewBox="0 0 384 512"><path d="M300.8 203.9L290 213.1H273c-7.7 0-15 3.2-20.3 8.5L194.7 279.6 104.4 189.3l58-58c5.3-5.3 8.5-12.6 8.5-20.3V94.1l9.2-10.9C196.3 64.5 220.2 54 245.2 54h48c23.2 0 45.6 8.2 63.1 23L384 101.3 282.7 202.6zM96 297.4l87.6 87.6L57.6 511c-5.8 5.8-14.3 8-22.2 5.7S21.5 508.5 19.3 500.6c-2.3-7.9-.1-16.4 5.7-22.2L96 297.4z"/></svg></span>`;
    el.innerHTML = `
      <div class="haywire-support-thumb" title="${i18n("HAYWIRE.FogOfWar.Label")}">
        <img src="${imgSrc}" alt="${imgAlt}" />
        ${pinSvg}
        ${hasCard ? `<span class="haywire-overlay-remove" title="${i18n("HAYWIRE.Support.Remove")}"><i class="fas fa-times"></i></span>` : ""}
        ${needsRoll ? `<span class="haywire-overlay-roll" title="${i18n("HAYWIRE.Roll")}"><i class="fas fa-dice"></i></span>` : ""}
        ${showDie ? `<span class="haywire-fog-die" title="${i18n("HAYWIRE.FogOfWar.DieHint")}">${die}</span>` : ""}
      </div>`;

    const thumb = el.querySelector(".haywire-support-thumb");

    // Pin toggle
    el.querySelector(".haywire-overlay-pin")?.addEventListener("click", (e) => {
      e.stopPropagation();
      el.classList.toggle("user-pinned");
    });

    // Drag-and-drop
    thumb.addEventListener("dragover", (e) => {
      e.preventDefault();
      thumb.classList.add("drag-over");
    });
    thumb.addEventListener("dragleave", () => {
      thumb.classList.remove("drag-over");
    });
    thumb.addEventListener("drop", (e) => this.#onDrop(e, thumb));

    // Preview on hover (only when a card is set)
    if (hasCard) {
      thumb.addEventListener("mouseenter", () => this.#showPreview(imgSrc, imgAlt));
      thumb.addEventListener("mouseleave", () => this.#hidePreview());
    }

    // Remove button — clear card, countdown restarts at 6
    el.querySelector(".haywire-overlay-remove")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#hidePreview();
      this.setCardId("");
    });

    // Roll button — roll a d6 to start the countdown
    el.querySelector(".haywire-overlay-roll")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#onRollDie();
    });

    // Die click — decrement countdown, draw card at 1
    el.querySelector(".haywire-fog-die")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#onDieClick();
    });
  }

  /* ---- Private ---- */

  static #getOrCreate() {
    if (!this.#el) {
      this.#el = document.createElement("div");
      this.#el.id = "haywire-fog-overlay";
      document.body.appendChild(this.#el);
    }
    if (!this.#previewEl) {
      this.#previewEl = document.createElement("div");
      this.#previewEl.id = "haywire-fog-preview";
      document.body.appendChild(this.#previewEl);
    }
  }

  static #showPreview(img, name) {
    const preview = this.#previewEl;
    if (!preview) return;
    preview.innerHTML = `<img src="${img}" alt="${name}" />`;
    preview.classList.add("visible");
  }

  static #hidePreview() {
    this.#previewEl?.classList.remove("visible");
  }

  static async #onDrop(event, thumb) {
    event.preventDefault();
    thumb.classList.remove("drag-over");

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }
    if (!data.uuid) return;

    await this.setCardId(data.uuid);
  }

  /** Roll d6 button clicked — roll, post chat, handle result. */
  static async #onRollDie() {
    const roll = await new Roll("1d6").evaluate();
    const result = roll.total;

    // Chat message with roll result
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
      // Immediately draw a card, then countdown restarts at 6
      await this.#rollCard();
      await this.setDie(6);
    } else {
      await this.setDie(result);
    }
  }

  /** Die countdown clicked — decrement, draw card when reaching 1. */
  static async #onDieClick() {
    const current = this.die;
    if (current <= 2) {
      // Would go to 1 — draw card without showing 1, restart at 6
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

    // Deck exhausted — notify GM and reshuffle
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

    // Record drawn card
    await this.setDrawnCards([...drawnIds, picked._id]);
    await this.setCardId(uuid);

    // Public chat message with card image
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
