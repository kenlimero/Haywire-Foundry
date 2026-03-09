/**
 * Support Cards Overlay — miniature backcover au milieu à gauche.
 * - Hover sur la miniature : affiche le panneau de cartes support
 * - Hover sur une carte : affiche la carte en grand (style token overlay)
 * - Bouton "Activate" sur chaque carte → message chat + retrait de la carte
 * - Si le leader est downed, les boutons sont désactivés
 */
export class SupportOverlay {
  static #el = null;
  static #panelEl = null;
  static #previewEl = null;
  static #hideTimeout = null;

  static init() {
    this.#getOrCreate();
    this.render();

    Hooks.on("updateSetting", (setting) => {
      if (setting.key === "haywire.supportCardIds" || setting.key === "haywire.supportLeaderId") {
        this.render();
      }
    });

    // Re-render when the leader actor is updated (may become downed)
    Hooks.on("updateActor", (actor) => {
      const leaderId = this.leaderId;
      if (leaderId && actor.id === leaderId) {
        this.render();
      }
    });
  }

  /** UUIDs des cartes support actives. */
  static get cardIds() {
    return game.settings.get("haywire", "supportCardIds");
  }

  /** ID de l'acteur leader. */
  static get leaderId() {
    return game.settings.get("haywire", "supportLeaderId");
  }

  /** Le leader est-il downed ? */
  static get isLeaderDowned() {
    const leaderId = this.leaderId;
    if (!leaderId) return false;
    const leader = game.actors.get(leaderId);
    if (!leader) return false;
    return leader.system.conditions?.has("downed") ?? false;
  }

  /** Met à jour la liste (GM only). */
  static async setCardIds(ids) {
    await game.settings.set("haywire", "supportCardIds", ids);
  }

  /** Retire une carte de la liste après activation. */
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
    const leaderDowned = this.isLeaderDowned;
    const i18n = (k) => game.i18n.localize(k);

    // Thumbnail toujours visible
    el.innerHTML = `
      <div class="haywire-support-thumb${leaderDowned ? " leader-downed" : ""}" title="${i18n("HAYWIRE.Support.Label")}">
        <img src="systems/haywire/assets/cards/backcovers/support.webp" alt="Support" />
        ${count > 0 ? `<span class="haywire-support-badge">${count}</span>` : ""}
        ${leaderDowned ? `<span class="haywire-support-downed-icon" title="${i18n("HAYWIRE.Support.LeaderDowned")}"><i class="fas fa-skull"></i></span>` : ""}
      </div>`;

    // Bind hover show/hide
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

    // Keep panel visible when hovering the panel itself
    panel.addEventListener("mouseenter", () => this.#showPanel());
    panel.addEventListener("mouseleave", () => this.#hidePanel());

    // Pre-render panel content
    await this.#renderPanel(panel, cardIds, count, leaderDowned, i18n);
  }

  /* ---- Private ---- */

  static #getOrCreate() {
    if (!this.#el) {
      this.#el = document.createElement("div");
      this.#el.id = "haywire-support-overlay";
      document.body.appendChild(this.#el);
    }
    if (!this.#panelEl) {
      this.#panelEl = document.createElement("div");
      this.#panelEl.id = "haywire-support-panel";
      document.body.appendChild(this.#panelEl);
    }
    if (!this.#previewEl) {
      this.#previewEl = document.createElement("div");
      this.#previewEl.id = "haywire-support-preview";
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

  static async #renderPanel(panel, cardIds, count, leaderDowned, i18n) {
    if (count === 0) {
      panel.innerHTML = `
        <div class="haywire-support-panel-inner">
          <div class="haywire-support-panel-header">
            <i class="fas fa-shield-alt"></i> ${i18n("HAYWIRE.Support.Label")}
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
        const img = card?.faces?.[0]?.img ?? card?.img ?? "icons/svg/card-hand.svg";
        return `
        <div class="haywire-support-card${leaderDowned ? " disabled" : ""}" data-preview-img="${img}" data-preview-name="${name}">
          <img class="haywire-support-card-img" src="${img}" alt="${name}" />
          <button class="haywire-support-activate" data-uuid="${uuid}" data-name="${name}" data-img="${img}"
                  title="${leaderDowned ? i18n("HAYWIRE.Support.LeaderDowned") : i18n("HAYWIRE.Support.Activate")}"
                  ${leaderDowned ? "disabled" : ""}>
            <i class="fas fa-bullseye"></i> ${i18n("HAYWIRE.Support.Activate")}
          </button>
        </div>`;
      })
      .join("");

    const downedBanner = leaderDowned
      ? `<div class="haywire-support-downed-banner"><i class="fas fa-skull"></i> ${i18n("HAYWIRE.Support.LeaderDowned")}</div>`
      : "";

    panel.innerHTML = `
      <div class="haywire-support-panel-inner">
        <div class="haywire-support-panel-header">
          <i class="fas fa-shield-alt"></i> ${i18n("HAYWIRE.Support.Label")}
          <span class="haywire-support-count">${count}</span>
        </div>
        ${downedBanner}
        <div class="haywire-support-cards">${cardsHtml}</div>
      </div>`;

    this.#bindPanelEvents(panel);
  }

  static #bindPanelEvents(panel) {
    // Card hover → preview
    panel.querySelectorAll(".haywire-support-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        this.#showPreview(card.dataset.previewImg, card.dataset.previewName);
      });
      card.addEventListener("mouseleave", () => {
        this.#hidePreview();
      });
    });

    // Activate button (only if not disabled)
    panel.querySelectorAll(".haywire-support-activate:not([disabled])").forEach((btn) => {
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
    if (!data.uuid) return;

    const doc = await fromUuid(data.uuid);
    if (!doc || doc.type !== "support") {
      ui.notifications.warn("Only support items can be dropped here.");
      return;
    }

    const currentIds = this.cardIds;
    if (currentIds.includes(data.uuid)) return;

    await this.setCardIds([...currentIds, data.uuid]);
  }

  static async #activateCard(uuid, name, img) {
    const i18n = (k) => game.i18n.localize(k);
    const speaker = ChatMessage.getSpeaker();

    await ChatMessage.create({
      content: `<div class="haywire-card-chat">
        <div class="haywire-card-chat-header">
          <i class="fas fa-bullseye"></i> ${i18n("HAYWIRE.Support.Activated")}
        </div>
        <img class="haywire-card-chat-img" src="${img}" alt="${name}" />
        <div class="haywire-card-chat-name">${name}</div>
      </div>`,
      speaker,
    });

    // Remove the card from available support
    await this.removeCard(uuid);
  }
}
