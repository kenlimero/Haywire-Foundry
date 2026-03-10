/**
 * OPFOR Support Cards Overlay — miniature backcover à gauche de l'alerte.
 * - Hover sur la miniature : affiche le panneau de cartes support OPFOR
 * - Hover sur une carte : affiche la carte en grand (style token overlay)
 * - Visible uniquement si l'alerte est active ET un leader/support skill non-downed est sur la scène
 */
export class OpforSupportOverlay {
  static #el = null;
  static #panelEl = null;
  static #previewEl = null;
  static #hideTimeout = null;
  static #cachedActivatable = null;

  /** Noms de leaders OPFOR connus. */
  static LEADER_NAMES = /^(squad commander|cell leader|leader)$/i;

  static init() {
    this.#getOrCreate();
    this.render();

    const onSettingChange = (setting) => {
      if (setting.key === "haywire.opforSupportCardIds" || setting.key === "haywire.threatAlert") {
        this.#cachedActivatable = null;
        this.render();
      }
    };
    Hooks.on("createSetting", onSettingChange);
    Hooks.on("updateSetting", onSettingChange);

    Hooks.on("createToken", () => { this.#cachedActivatable = null; this.render(); });
    Hooks.on("deleteToken", () => { this.#cachedActivatable = null; this.render(); });
    Hooks.on("updateActor", (actor) => {
      if (actor.type === "opfor-unit") {
        this.#cachedActivatable = null;
        this.render();
      }
    });
  }

  /**
   * Vérifie si l'overlay doit être visible :
   * 1. L'alerte doit être active
   * 2. Un leader OPFOR ou unit avec skill "Support" non-downed sur la scène
   */
  static async isActivatable() {
    if (this.#cachedActivatable !== null) return this.#cachedActivatable;

    const alertActive = game.settings.get("haywire", "threatAlert");
    if (!alertActive) {
      this.#cachedActivatable = false;
      return false;
    }

    const scene = game.scenes?.active;
    if (!scene) { this.#cachedActivatable = false; return false; }

    for (const token of scene.tokens) {
      const actor = token.actor;
      if (!actor || actor.type !== "opfor-unit") continue;
      if (actor.system.conditions?.has("downed")) continue;

      if (this.LEADER_NAMES.test(actor.name)) {
        this.#cachedActivatable = true;
        return true;
      }

      const skillUuids = actor.system.opforSkillIds ?? [];
      for (const uuid of skillUuids) {
        const skill = await fromUuid(uuid);
        if (skill?.name?.toLowerCase() === "support") {
          this.#cachedActivatable = true;
          return true;
        }
      }
    }

    this.#cachedActivatable = false;
    return false;
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
    const activatable = await this.isActivatable();
    const i18n = (k) => game.i18n.localize(k);

    // Hide overlay when conditions not met (alert + leader/support skill)
    if (!activatable) {
      el.innerHTML = "";
      panel.innerHTML = "";
      return;
    }

    const pinSvg = `<span class="haywire-overlay-pin" title="${i18n("HAYWIRE.Pin")}"><svg viewBox="0 0 384 512"><path d="M300.8 203.9L290 213.1H273c-7.7 0-15 3.2-20.3 8.5L194.7 279.6 104.4 189.3l58-58c5.3-5.3 8.5-12.6 8.5-20.3V94.1l9.2-10.9C196.3 64.5 220.2 54 245.2 54h48c23.2 0 45.6 8.2 63.1 23L384 101.3 282.7 202.6zM96 297.4l87.6 87.6L57.6 511c-5.8 5.8-14.3 8-22.2 5.7S21.5 508.5 19.3 500.6c-2.3-7.9-.1-16.4 5.7-22.2L96 297.4z"/></svg></span>`;
    el.innerHTML = `
      <div class="haywire-support-thumb" title="${i18n("HAYWIRE.OpforSupport.Label")}">
        <img src="systems/haywire/assets/cards/backcovers/support-opfor.webp" alt="OPFOR Support" />
        ${pinSvg}
      </div>`;

    const thumb = el.querySelector(".haywire-support-thumb");
    thumb.addEventListener("mouseenter", () => this.#showPanel());
    thumb.addEventListener("mouseleave", () => this.#hidePanel());

    // Pin toggle
    el.querySelector(".haywire-overlay-pin")?.addEventListener("click", (e) => {
      e.stopPropagation();
      el.classList.toggle("user-pinned");
    });

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
    this.#el?.classList.add("pinned");
  }

  static #hidePanel() {
    clearTimeout(this.#hideTimeout);
    this.#hideTimeout = setTimeout(() => {
      this.#panelEl?.classList.remove("visible");
      this.#el?.classList.remove("pinned");
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
      .map((_uuid, i) => {
        const card = resolved[i];
        const name = card?.name ?? "???";
        const img = card?.img ?? "icons/svg/card-hand.svg";
        return `
        <div class="haywire-support-card" data-preview-img="${img}" data-preview-name="${name}">
          <img class="haywire-support-card-img" src="${img}" alt="${name}" />
        </div>`;
      })
      .join("");

    panel.innerHTML = `
      <div class="haywire-support-panel-inner">
        <div class="haywire-support-panel-header">
          <i class="fas fa-skull-crossbones"></i> ${i18n("HAYWIRE.OpforSupport.Label")}
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

}
