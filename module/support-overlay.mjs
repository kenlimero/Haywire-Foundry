/**
 * Support Cards Overlay — miniature backcover au milieu à gauche.
 * - Hover sur la miniature : affiche le panneau de cartes support
 * - Hover sur une carte : affiche la carte en grand (style token overlay)
 * - Bouton "Activate" sur chaque carte → message chat + retrait de la carte
 * - Chaque carte est liée à un leader : si le leader est downed, ses cartes sont désactivées
 * - Quand un token avec des supportIds est posé sur la carte, ses cartes sont ajoutées
 */
export class SupportOverlay {
  static #el = null;
  static #panelEl = null;
  static #previewEl = null;
  static #hideTimeout = null;

  static init() {
    this.#getOrCreate();
    this.render();

    const onSettingChange = (setting) => {
      if (setting.key === "haywire.supportCardIds") this.render();
    };
    Hooks.on("createSetting", onSettingChange);
    Hooks.on("updateSetting", onSettingChange);

    // Re-render when any leader actor is updated (may become downed)
    Hooks.on("updateActor", (actor) => {
      const leaderIds = this.#getLeaderIds();
      if (leaderIds.has(actor.id)) {
        this.render();
      }
    });
  }

  /** Entries des cartes support actives: [{uuid, leaderId}, ...] */
  static get cardEntries() {
    return game.settings.get("haywire", "supportCardIds") ?? [];
  }

  /** IDs uniques des leaders liés aux cartes actives. */
  static #getLeaderIds() {
    const entries = this.cardEntries;
    return new Set(entries.map((e) => e.leaderId).filter(Boolean));
  }

  /** Vérifie si un leader donné est downed. */
  static isActorDowned(actorId) {
    if (!actorId) return false;
    const actor = game.actors.get(actorId);
    if (!actor) return false;
    return actor.system.conditions?.has("downed") ?? false;
  }

  /** Met à jour la liste (GM only). */
  static async setCardEntries(entries) {
    await game.settings.set("haywire", "supportCardIds", entries);
  }

  /** Ajoute des cartes liées à un leader. */
  static async addCards(uuids, leaderId) {
    const current = this.cardEntries;
    const existingUuids = new Set(current.map((e) => e.uuid));
    const newEntries = uuids
      .filter((uuid) => !existingUuids.has(uuid))
      .map((uuid) => ({ uuid, leaderId: leaderId ?? "" }));
    if (newEntries.length === 0) return;
    await this.setCardEntries([...current, ...newEntries]);
  }

  /** Retire une carte de la liste après activation. */
  static async removeCard(uuid) {
    const entries = this.cardEntries.filter((e) => e.uuid !== uuid);
    await this.setCardEntries(entries);
  }

  /** Reconstruit le HTML. */
  static async render() {
    const el = this.#el;
    const panel = this.#panelEl;
    if (!el || !panel) return;

    const entries = this.cardEntries;
    const count = entries.length;
    const downedCount = entries.filter((e) => this.isActorDowned(e.leaderId)).length;
    const activeCount = count - downedCount;
    const i18n = (k) => game.i18n.localize(k);

    // Thumbnail toujours visible — bordure rouge uniquement si plus aucune carte activable
    const noActiveCards = activeCount === 0 && count > 0;
    el.innerHTML = `
      <div class="haywire-support-thumb${noActiveCards ? " leader-downed" : ""}" title="${i18n("HAYWIRE.Support.Label")}">
        <img src="systems/haywire/assets/cards/backcovers/support.webp" alt="Support" />
        ${activeCount > 0 ? `<span class="haywire-support-badge">${activeCount}</span>` : ""}
        ${downedCount > 0 ? `<span class="haywire-support-downed-icon" title="${i18n("HAYWIRE.Support.LeaderDowned")}"><i class="fas fa-skull"></i> ${downedCount}</span>` : ""}
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
    await this.#renderPanel(panel, entries, count, i18n);
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

  static async #renderPanel(panel, entries, count, i18n) {
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

    const resolved = await Promise.all(entries.map((e) => fromUuid(e.uuid)));
    const cardsHtml = entries
      .map((entry, i) => {
        const card = resolved[i];
        const name = card?.name ?? "???";
        const img = card?.faces?.[0]?.img ?? card?.img ?? "icons/svg/card-hand.svg";
        const downed = this.isActorDowned(entry.leaderId);
        const leaderActor = entry.leaderId ? game.actors.get(entry.leaderId) : null;
        const leaderName = leaderActor?.name ?? "";
        return `
        <div class="haywire-support-card${downed ? " disabled" : ""}" data-preview-img="${img}" data-preview-name="${name}">
          <span class="haywire-support-card-remove" data-uuid="${entry.uuid}" title="${i18n("HAYWIRE.Support.Remove")}"><i class="fas fa-times"></i></span>
          <img class="haywire-support-card-img" src="${img}" alt="${name}" />
          ${leaderName ? `<span class="haywire-support-card-leader${downed ? " downed" : ""}" title="${leaderName}"><i class="fas ${downed ? "fa-skull" : "fa-user-shield"}"></i> ${leaderName}</span>` : ""}
          <button class="haywire-support-activate" data-uuid="${entry.uuid}" data-name="${name}" data-img="${img}"
                  title="${downed ? i18n("HAYWIRE.Support.LeaderDowned") : i18n("HAYWIRE.Support.Activate")}"
                  ${downed ? "disabled" : ""}>
            <i class="fas fa-bullseye"></i> ${i18n("HAYWIRE.Support.Activate")}
          </button>
        </div>`;
      })
      .join("");

    panel.innerHTML = `
      <div class="haywire-support-panel-inner">
        <div class="haywire-support-panel-header">
          <i class="fas fa-shield-alt"></i> ${i18n("HAYWIRE.Support.Label")}
          <span class="haywire-support-count">${count}</span>
          <span class="haywire-support-purge" title="${i18n("HAYWIRE.Support.Purge")}"><i class="fas fa-trash"></i></span>
        </div>
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

    // Remove button
    panel.querySelectorAll(".haywire-support-card-remove").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.removeCard(btn.dataset.uuid);
      });
    });

    // Purge all cards
    panel.querySelector(".haywire-support-purge")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.setCardEntries([]);
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

    await this.addCards([data.uuid], "");
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
