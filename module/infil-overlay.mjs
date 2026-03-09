/**
 * Infil Card Overlay — miniature backcover sous le support overlay, côté gauche.
 * - Drag & drop d'un item ou du compendium remplace la backcover par l'image de la carte
 * - Une seule carte à la fois (remplace si déjà présente)
 * - Bouton Roll pour tirer une carte aléatoire du deck Infiltration
 */
export class InfilOverlay {
  static #el = null;
  static #previewEl = null;

  /** Nom du deck dans le compendium haywire.decks */
  static DECK_NAME = "Infiltration";

  static init() {
    this.#getOrCreate();
    this.render();

    const onSettingChange = (setting) => {
      if (setting.key === "haywire.infilCardIds") this.render();
    };
    Hooks.on("createSetting", onSettingChange);
    Hooks.on("updateSetting", onSettingChange);
  }

  /** UUIDs des cartes infil actives (max 1). */
  static get cardIds() {
    return game.settings.get("haywire", "infilCardIds") ?? [];
  }

  /** Met à jour la liste (GM only). */
  static async setCardIds(ids) {
    await game.settings.set("haywire", "infilCardIds", ids);
  }

  /** Reconstruit le HTML. */
  static async render() {
    const el = this.#el;
    if (!el) return;

    const cardIds = this.cardIds;
    const hasCard = cardIds.length > 0;
    const i18n = (k) => game.i18n.localize(k);

    let imgSrc = "systems/haywire/assets/cards/backcovers/infil.webp";
    let imgAlt = "Infil";

    if (hasCard) {
      const card = await fromUuid(cardIds[0]);
      if (card) {
        imgSrc = card?.faces?.[0]?.img ?? card?.img ?? imgSrc;
        imgAlt = card?.name ?? imgAlt;
      }
    }

    el.innerHTML = `
      <div class="haywire-support-thumb" title="${i18n("HAYWIRE.Infil.Label")}">
        <img src="${imgSrc}" alt="${imgAlt}" />
        ${hasCard ? `<span class="haywire-overlay-remove" title="${i18n("HAYWIRE.Support.Remove")}"><i class="fas fa-times"></i></span>` : ""}
        ${!hasCard ? `<span class="haywire-overlay-roll" title="${i18n("HAYWIRE.Roll")}"><i class="fas fa-dice"></i></span>` : ""}
      </div>`;

    const thumb = el.querySelector(".haywire-support-thumb");

    // Drag-and-drop — replaces the current card
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
      this.setCardIds([]);
    });

    // Roll button
    el.querySelector(".haywire-overlay-roll")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#rollCard();
    });
  }

  /* ---- Private ---- */

  static #getOrCreate() {
    if (!this.#el) {
      this.#el = document.createElement("div");
      this.#el.id = "haywire-infil-overlay";
      document.body.appendChild(this.#el);
    }
    if (!this.#previewEl) {
      this.#previewEl = document.createElement("div");
      this.#previewEl.id = "haywire-infil-preview";
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

    // Replace any existing card with the new one
    await this.setCardIds([data.uuid]);
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

    await this.setCardIds([uuid]);
  }
}
