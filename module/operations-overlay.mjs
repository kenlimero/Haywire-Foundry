/**
 * Operations Card Overlay — miniature backcover sous l'infil overlay, côté gauche.
 * - Drag & drop d'un item ou du compendium remplace la backcover par l'image de la carte
 * - Une seule carte à la fois (remplace si déjà présente)
 * - Clic droit pour retirer la carte et revenir à la backcover
 */
export class OperationsOverlay {
  static #el = null;
  static #previewEl = null;

  static init() {
    this.#getOrCreate();
    this.render();

    const onSettingChange = (setting) => {
      if (setting.key === "haywire.operationsCardIds") this.render();
    };
    Hooks.on("createSetting", onSettingChange);
    Hooks.on("updateSetting", onSettingChange);
  }

  /** UUIDs des cartes opérations actives (max 1). */
  static get cardIds() {
    return game.settings.get("haywire", "operationsCardIds") ?? [];
  }

  /** Met à jour la liste (GM only). */
  static async setCardIds(ids) {
    await game.settings.set("haywire", "operationsCardIds", ids);
  }

  /** Reconstruit le HTML. */
  static async render() {
    const el = this.#el;
    if (!el) return;

    const cardIds = this.cardIds;
    const hasCard = cardIds.length > 0;
    const i18n = (k) => game.i18n.localize(k);

    let imgSrc = "systems/haywire/assets/cards/backcovers/operation.webp";
    let imgAlt = "Operations";

    if (hasCard) {
      const card = await fromUuid(cardIds[0]);
      if (card) {
        imgSrc = card?.faces?.[0]?.img ?? card?.img ?? imgSrc;
        imgAlt = card?.name ?? imgAlt;
      }
    }

    el.innerHTML = `
      <div class="haywire-support-thumb" title="${i18n("HAYWIRE.Operations.Label")}">
        <img src="${imgSrc}" alt="${imgAlt}" />
        ${hasCard ? `<span class="haywire-overlay-remove" title="${i18n("HAYWIRE.Support.Remove")}"><i class="fas fa-times"></i></span>` : ""}
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
  }

  /* ---- Private ---- */

  static #getOrCreate() {
    if (!this.#el) {
      this.#el = document.createElement("div");
      this.#el.id = "haywire-operations-overlay";
      document.body.appendChild(this.#el);
    }
    if (!this.#previewEl) {
      this.#previewEl = document.createElement("div");
      this.#previewEl.id = "haywire-operations-preview";
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
}
