/**
 * OPFOR Support Cards Overlay — miniature backcover au milieu à gauche, sous le player support.
 * - Hover sur la miniature : affiche le panneau de cartes support OPFOR
 * - Hover sur une carte : affiche la carte en grand (style token overlay)
 * - Bouton "Activate" sur chaque carte → message chat + retrait de la carte
 * - Pas de drag-and-drop ni d'import automatique
 */
export class OpforSupportOverlay {
  static #el = null;
  static #panelEl = null;
  static #previewEl = null;
  static #hideTimeout = null;

  static init() {
    this.#getOrCreate();
    this.render();

    Hooks.on("updateSetting", (setting) => {
      if (setting.key === "haywire.opforSupportCardIds") {
        this.render();
      }
    });
  }

  /** UUIDs des cartes support OPFOR actives. */
  static get cardIds() {
    return game.settings.get("haywire", "opforSupportCardIds") ?? [];
  }

  /** Met à jour la liste (GM only). */
  static async setCardIds(ids) {
    await game.settings.set("haywire", "opforSupportCardIds", ids);
  }

  /** Ajoute des cartes. */
  static async addCards(uuids) {
    const current = this.cardIds;
    const existing = new Set(current);
    const newIds = uuids.filter((uuid) => !existing.has(uuid));
    if (newIds.length === 0) return;
    await this.setCardIds([...current, ...newIds]);
  }

  /** Retire une carte après activation. */
  static async removeCard(uuid) {
    const ids = this.cardIds.filter((id) => id !== uuid);
    await this.setCardIds(ids);
  }

  /** Reconstruit le HTML. */
  static async render() {
    const el = this.#el;
    const panel = this.#panelEl;
    if (!el || !panel) return;

    const cardIds = this.cardIds;
    const count = cardIds.length;
    const i18n = (k) => game.i18n.localize(k);

    el.innerHTML = `
      <div class="haywire-support-thumb" title="${i18n("HAYWIRE.OpforSupport.Label")}">
        <img src="systems/haywire/assets/cards/backcovers/support-opfor.webp" alt="OPFOR Support" />
        ${count > 0 ? `<span class="haywire-support-badge">${count}</span>` : ""}
      </div>`;

    const thumb = el.querySelector(".haywire-support-thumb");
    thumb.addEventListener("mouseenter", () => this.#showPanel());
    thumb.addEventListener("mouseleave", () => this.#hidePanel());

    // Drag-and-drop support items onto the backcover
    thumb.addEventListener("dragover", (e) => {
      e.preventDefault();
      thumb.classList.add("drag-over");
    });
    thumb.addEventListener("dragleave", () => {
      thumb.classList.remove("drag-over");
    });
    thumb.addEventListener("drop", (e) => this.#onDrop(e, thumb));

    panel.addEventListener("mouseenter", () => this.#showPanel());
    panel.addEventListener("mouseleave", () => this.#hidePanel());

    await this.#renderPanel(panel, cardIds, count, i18n);
  }

  /* ---- Private ---- */

  static #getOrCreate() {
    if (!this.#el) {
      this.#el = document.createElement("div");
      this.#el.id = "haywire-opfor-support-overlay";
      document.body.appendChild(this.#el);
    }
    if (!this.#panelEl) {
      this.#panelEl = document.createElement("div");
      this.#panelEl.id = "haywire-opfor-support-panel";
      document.body.appendChild(this.#panelEl);
    }
    if (!this.#previewEl) {
      this.#previewEl = document.createElement("div");
      this.#previewEl.id = "haywire-opfor-support-preview";
      document.body.appendChild(this.#previewEl);
    }
  }

  static #showPanel() {
    clearTimeout(this.#hideTimeout);
    this.#panelEl?.classList.add("visible");
  }

  static #hidePanel() {
    clearTimeout(this.#hideTimeout);
    this.#hideTimeout = setTimeout(() => {
      this.#panelEl?.classList.remove("visible");
      this.#hidePreview();
    }, 100);
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

  static async #renderPanel(panel, cardIds, count, i18n) {
    if (count === 0) {
      panel.innerHTML = `
        <div class="haywire-support-panel-inner">
          <div class="haywire-support-panel-header">
            <i class="fas fa-skull-crossbones"></i> ${i18n("HAYWIRE.OpforSupport.Label")}
          </div>
          <div class="haywire-support-empty">${i18n("HAYWIRE.Unit.NoSupport")}</div>
        </div>`;
      return;
    }

    const resolved = await Promise.all(cardIds.map((uuid) => fromUuid(uuid)));
    const cardsHtml = cardIds
      .map((uuid, i) => {
        const card = resolved[i];
        const name = card?.name ?? "???";
        const img = card?.img ?? "icons/svg/card-hand.svg";
        return `
        <div class="haywire-support-card" data-preview-img="${img}" data-preview-name="${name}">
          <img class="haywire-support-card-img" src="${img}" alt="${name}" />
          <button class="haywire-support-activate" data-uuid="${uuid}" data-name="${name}" data-img="${img}"
                  title="${i18n("HAYWIRE.Support.Activate")}">
            <i class="fas fa-bullseye"></i> ${i18n("HAYWIRE.Support.Activate")}
          </button>
        </div>`;
      })
      .join("");

    panel.innerHTML = `
      <div class="haywire-support-panel-inner">
        <div class="haywire-support-panel-header">
          <i class="fas fa-skull-crossbones"></i> ${i18n("HAYWIRE.OpforSupport.Label")}
          <span class="haywire-support-count">${count}</span>
        </div>
        <div class="haywire-support-cards">${cardsHtml}</div>
      </div>`;

    this.#bindPanelEvents(panel);
  }

  static #bindPanelEvents(panel) {
    panel.querySelectorAll(".haywire-support-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        this.#showPreview(card.dataset.previewImg, card.dataset.previewName);
      });
      card.addEventListener("mouseleave", () => {
        this.#hidePreview();
      });
    });

    panel.querySelectorAll(".haywire-support-activate").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const { uuid, name, img } = btn.dataset;
        await this.#activateCard(uuid, name, img);
      });
    });
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
    if (!data.uuid || data.type !== "Item") return;

    const current = this.cardIds;
    if (current.includes(data.uuid)) return;

    await this.setCardIds([...current, data.uuid]);
  }

  static async #activateCard(uuid, name, img) {
    const i18n = (k) => game.i18n.localize(k);
    const speaker = ChatMessage.getSpeaker();

    await ChatMessage.create({
      content: `<div class="haywire-card-chat">
        <div class="haywire-card-chat-header">
          <i class="fas fa-skull-crossbones"></i> ${i18n("HAYWIRE.OpforSupport.Activated")}
        </div>
        <img class="haywire-card-chat-img" src="${img}" alt="${name}" />
        <div class="haywire-card-chat-name">${name}</div>
      </div>`,
      speaker,
    });

    await this.removeCard(uuid);
  }
}
