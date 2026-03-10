/**
 * Fog of War Overlay — miniature backcover en haut, entre OPFOR support et le threat level.
 * - Affiche un dé 6 faces sur la backcover, partant de 6
 * - Chaque clic décrémente le dé de 1
 * - À 1, un roll sur le deck Fog of War est fait, la carte tirée remplace la backcover, le dé repasse à 6
 * - Preview de la carte au hover quand une carte est active
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

  /** Valeur actuelle du dé (1–6). */
  static get die() {
    return game.settings.get("haywire", "fogOfWarDie") ?? 6;
  }

  static async setCardId(id) {
    await game.settings.set("haywire", "fogOfWarCardId", id);
  }

  static async setDie(value) {
    await game.settings.set("haywire", "fogOfWarDie", value);
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

    const pinSvg = `<span class="haywire-overlay-pin" title="${i18n("HAYWIRE.Pin")}"><svg viewBox="0 0 384 512"><path d="M300.8 203.9L290 213.1H273c-7.7 0-15 3.2-20.3 8.5L194.7 279.6 104.4 189.3l58-58c5.3-5.3 8.5-12.6 8.5-20.3V94.1l9.2-10.9C196.3 64.5 220.2 54 245.2 54h48c23.2 0 45.6 8.2 63.1 23L384 101.3 282.7 202.6zM96 297.4l87.6 87.6L57.6 511c-5.8 5.8-14.3 8-22.2 5.7S21.5 508.5 19.3 500.6c-2.3-7.9-.1-16.4 5.7-22.2L96 297.4z"/></svg></span>`;
    el.innerHTML = `
      <div class="haywire-support-thumb" title="${i18n("HAYWIRE.FogOfWar.Label")}">
        <img src="${imgSrc}" alt="${imgAlt}" />
        ${pinSvg}
        ${hasCard ? `<span class="haywire-overlay-remove" title="${i18n("HAYWIRE.Support.Remove")}"><i class="fas fa-times"></i></span>` : ""}
        ${!hasCard ? `<span class="haywire-fog-die" title="${i18n("HAYWIRE.FogOfWar.DieHint")}">${die}</span>` : ""}
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

    // Remove button
    el.querySelector(".haywire-overlay-remove")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#hidePreview();
      this.setCardId("");
    });

    // Die click — decrement, roll at 1
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

  static async #onDieClick() {
    const current = this.die;
    if (current <= 1) {
      // Roll on the Fog of War deck and reset die
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

    const cards = Array.from(deck.cards);
    const picked = cards[Math.floor(Math.random() * cards.length)];
    const uuid = `Compendium.haywire.decks.Cards.${deckEntry._id}.Card.${picked._id}`;

    await this.setCardId(uuid);
  }
}
