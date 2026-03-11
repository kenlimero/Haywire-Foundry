/**
 * Support Cards Overlay — miniature backcover au milieu à gauche.
 * - Hover sur la miniature : affiche le panneau de cartes support
 * - Hover sur une carte : affiche la carte en grand (style token overlay)
 * - Bouton "Activate" sur chaque carte → message chat + retrait de la carte
 * - Chaque carte est liée à un leader : si le leader est downed, ses cartes sont désactivées
 * - Quand un token avec des supportIds est posé sur la carte, ses cartes sont ajoutées
 * @module support-overlay
 */
import {
  pinSvg, parseDropData, bindPinToggle, bindDragDrop,
  onSettingsChange, showPreview, hidePreview, getOrCreateElement,
  createPanelToggle, escapeHtml,
} from "./overlay-helpers.mjs";

export class SupportOverlay {
  static #el = null;
  static #panelEl = null;
  static #previewEl = null;
  /** @type {{ show: () => void, hide: () => void } | null} */
  static #panelToggle = null;

  static init() {
    this.#el = getOrCreateElement(this.#el, "haywire-support-overlay");
    this.#panelEl = getOrCreateElement(this.#panelEl, "haywire-support-panel");
    this.#previewEl = getOrCreateElement(this.#previewEl, "haywire-support-preview");
    this.#panelToggle = createPanelToggle(this.#panelEl, this.#el, this.#previewEl);
    this.render();
    onSettingsChange(["supportCardIds"], () => this.render());

    Hooks.on("updateActor", (actor) => {
      const leaderIds = this.#getLeaderIds();
      if (leaderIds.has(actor.id)) this.render();
    });
  }

  /** @returns {Array<{uuid: string, leaderId: string}>} */
  static get cardEntries() {
    return game.settings.get("haywire", "supportCardIds") ?? [];
  }

  /**
   * @returns {Set<string>} Set of leader actor IDs
   */
  static #getLeaderIds() {
    return new Set(this.cardEntries.map((e) => e.leaderId).filter(Boolean));
  }

  /**
   * Check if a leader actor is downed.
   * @param {string} actorId - Actor ID to check
   * @returns {boolean}
   */
  static #isActorDowned(actorId) {
    if (!actorId) return false;
    const actor = game.actors.get(actorId);
    return actor?.system.conditions?.has("downed") ?? false;
  }

  /**
   * @param {Array<{uuid: string, leaderId: string}>} entries
   */
  static async setCardEntries(entries) {
    await game.settings.set("haywire", "supportCardIds", entries);
  }

  /**
   * Add support card UUIDs linked to a leader.
   * @param {string[]} uuids - Card UUIDs to add
   * @param {string} [leaderId=""] - Leader actor ID
   */
  static async addCards(uuids, leaderId) {
    const current = this.cardEntries;
    const existingUuids = new Set(current.map((e) => e.uuid));
    const newEntries = uuids
      .filter((uuid) => !existingUuids.has(uuid))
      .map((uuid) => ({ uuid, leaderId: leaderId ?? "" }));
    if (newEntries.length === 0) return;
    await this.setCardEntries([...current, ...newEntries]);
  }

  /**
   * Remove a card by UUID.
   * @param {string} uuid - Card UUID to remove
   */
  static async removeCard(uuid) {
    await this.setCardEntries(this.cardEntries.filter((e) => e.uuid !== uuid));
  }

  static async render() {
    const el = this.#el;
    const panel = this.#panelEl;
    if (!el || !panel) return;

    const entries = this.cardEntries;
    const count = entries.length;
    const downedCount = entries.filter((e) => this.#isActorDowned(e.leaderId)).length;
    const activeCount = count - downedCount;
    const i18n = (k) => game.i18n.localize(k);

    const noActiveCards = activeCount === 0 && count > 0;
    el.innerHTML = `
      <div class="haywire-support-thumb${noActiveCards ? " leader-downed" : ""}" title="${i18n("HAYWIRE.Support.Label")}">
        <img src="systems/haywire/assets/cards/backcovers/support.webp" alt="Support" />
        ${pinSvg(i18n("HAYWIRE.Pin"))}
        ${activeCount > 0 ? `<span class="haywire-support-badge">${activeCount}</span>` : ""}
        ${downedCount > 0 ? `<span class="haywire-support-downed-icon" title="${i18n("HAYWIRE.Support.LeaderDowned")}"><i class="fas fa-skull"></i> ${downedCount}</span>` : ""}
      </div>`;

    const thumb = el.querySelector(".haywire-support-thumb");
    thumb.addEventListener("mouseenter", () => this.#panelToggle.show());
    thumb.addEventListener("mouseleave", () => this.#panelToggle.hide());
    bindDragDrop(thumb, (e) => this.#onDrop(e));
    bindPinToggle(el);

    panel.addEventListener("mouseenter", () => this.#panelToggle.show());
    panel.addEventListener("mouseleave", () => this.#panelToggle.hide());

    await this.#renderPanel(panel, entries, count, i18n);
  }

  /* ---- Private ---- */

  /**
   * Render the panel content with resolved card data.
   * @param {HTMLElement} panel
   * @param {Array<{uuid: string, leaderId: string}>} entries
   * @param {number} count
   * @param {(key: string) => string} i18n
   */
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
        const downed = this.#isActorDowned(entry.leaderId);
        const leaderActor = entry.leaderId ? game.actors.get(entry.leaderId) : null;
        const leaderName = leaderActor?.name ?? "";
        return `
        <div class="haywire-support-card${downed ? " disabled" : ""}" data-preview-img="${escapeHtml(img)}" data-preview-name="${escapeHtml(name)}">
          <span class="haywire-support-card-remove" data-uuid="${escapeHtml(entry.uuid)}" title="${i18n("HAYWIRE.Support.Remove")}"><i class="fas fa-times"></i></span>
          <img class="haywire-support-card-img" src="${escapeHtml(img)}" alt="${escapeHtml(name)}" />
          ${leaderName ? `<span class="haywire-support-card-leader${downed ? " downed" : ""}" title="${escapeHtml(leaderName)}"><i class="fas ${downed ? "fa-skull" : "fa-user-shield"}"></i> ${escapeHtml(leaderName)}</span>` : ""}
          <button class="haywire-support-activate" data-uuid="${escapeHtml(entry.uuid)}" data-name="${escapeHtml(name)}" data-img="${escapeHtml(img)}"
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

  /**
   * @param {HTMLElement} panel
   */
  static #bindPanelEvents(panel) {
    panel.querySelectorAll(".haywire-support-card").forEach((card) => {
      card.addEventListener("mouseenter", () => showPreview(this.#previewEl, card.dataset.previewImg, card.dataset.previewName));
      card.addEventListener("mouseleave", () => hidePreview(this.#previewEl));
    });

    panel.querySelectorAll(".haywire-support-activate:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const { uuid, name, img } = btn.dataset;
        await this.#activateCard(uuid, name, img);
      });
    });

    panel.querySelectorAll(".haywire-support-card-remove").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.removeCard(btn.dataset.uuid);
      });
    });

    panel.querySelector(".haywire-support-purge")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.setCardEntries([]);
    });
  }

  /**
   * @param {DragEvent} event
   */
  static async #onDrop(event) {
    const data = parseDropData(event);
    if (!data) return;

    const doc = await fromUuid(data.uuid);
    if (!doc || doc.type !== "support") {
      ui.notifications.warn("Only support items can be dropped here.");
      return;
    }
    await this.addCards([data.uuid], "");
  }

  /**
   * Activate a support card: post to chat and remove from overlay.
   * @param {string} uuid
   * @param {string} name
   * @param {string} img
   */
  static async #activateCard(uuid, name, img) {
    const i18n = (k) => game.i18n.localize(k);

    try {
      await ChatMessage.create({
        content: `<div class="haywire-card-chat">
          <div class="haywire-card-chat-header">
            <i class="fas fa-bullseye"></i> ${i18n("HAYWIRE.Support.Activated")}
          </div>
          <img class="haywire-card-chat-img" src="${escapeHtml(img)}" alt="${escapeHtml(name)}" />
        </div>`,
      });
    } catch (err) {
      console.error("haywire | SupportOverlay: ChatMessage.create failed", err);
    }

    await this.removeCard(uuid);
  }
}
