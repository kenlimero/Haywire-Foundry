/**
 * Support Cards Overlay — miniature backcover au milieu à gauche.
 * - Hover sur la miniature : affiche le panneau de cartes support
 * - Hover sur une carte : affiche la carte en grand (style token overlay)
 * - Bouton "Activate" sur chaque carte → message chat + retrait de la carte
 * - Chaque carte est liée à un leader : si le leader est downed, ses cartes sont désactivées
 * - Quand un token avec des supportIds est posé sur la carte, ses cartes sont ajoutées
 * @module support-overlay
 */
import { CardPanelOverlay } from "./overlays/card-panel-overlay.mjs";
import { escapeHtml } from "./overlays/base-overlay.mjs";
import { parseDropData } from "./overlay-helpers.mjs";
import { DECKS } from "./game-config.mjs";

export class SupportOverlay extends CardPanelOverlay {
  constructor() {
    super({
      elementId: "haywire-support-overlay",
      previewId: "haywire-support-preview",
      panelId: "haywire-support-panel",
      settingKeys: ["supportCardIds"],
      cardsSettingKey: "supportCardIds",
      backcoverImg: DECKS.support.backcover,
      labelKey: "HAYWIRE.Support.Label",
      iconClass: "fa-shield-alt",
    });
  }

  /* ─── Card entries (objects with uuid + leaderId) ────────────────────── */

  /** @override @returns {Array<{uuid: string, leaderId: string}>} */
  getCardEntries() { return this.getSetting("supportCardIds") ?? []; }

  /** @override @returns {string[]} */
  getCardUuids() { return this.getCardEntries().map((e) => e.uuid); }

  /**
   * Add support card UUIDs linked to a leader.
   * @param {string[]} uuids
   * @param {string} [leaderId=""]
   */
  async addCards(uuids, leaderId) {
    const current = this.getCardEntries();
    const existingUuids = new Set(current.map((e) => e.uuid));
    const newEntries = uuids
      .filter((uuid) => !existingUuids.has(uuid))
      .map((uuid) => ({ uuid, leaderId: leaderId ?? "" }));
    if (!newEntries.length) return;
    await this.setCardEntries([...current, ...newEntries]);
  }

  /** @override */
  async removeCard(uuid) {
    await this.setCardEntries(this.getCardEntries().filter((e) => e.uuid !== uuid));
  }

  /* ─── Hooks ──────────────────────────────────────────────────────────── */

  /** @override */
  bindHooks() {
    Hooks.on("updateActor", (actor) => {
      const leaderIds = this.#getLeaderIds();
      if (leaderIds.has(actor.id)) this.render();
    });
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */

  /** @override — thumbnail with active/downed badges */
  async buildHTML() {
    const entries = this.getCardEntries();
    const count = entries.length;
    const downedCount = entries.filter((e) => this.#isActorDowned(e.leaderId)).length;
    const activeCount = count - downedCount;
    const noActiveCards = activeCount === 0 && count > 0;

    return `
      <div class="haywire-support-thumb${noActiveCards ? " leader-downed" : ""}" title="${this.i18n("HAYWIRE.Support.Label")}">
        <img src="${escapeHtml(this.backcoverImg)}" alt="Support" />
        ${this.pinHTML()}
        ${activeCount > 0 ? `<span class="haywire-support-badge">${activeCount}</span>` : ""}
        ${downedCount > 0 ? `<span class="haywire-support-downed-icon" title="${this.i18n("HAYWIRE.Support.LeaderDowned")}"><i class="fas fa-skull"></i> ${downedCount}</span>` : ""}
      </div>`;
  }

  /** @override — validate drop is a support item */
  async onDrop(event) {
    const data = parseDropData(event);
    if (!data) return;

    const doc = await fromUuid(data.uuid);
    if (!doc || doc.type !== "support") {
      ui.notifications.warn("Only support items can be dropped here.");
      return;
    }
    await this.addCards([data.uuid], "");
  }

  /** @override — custom panel with leader badges, activate/remove buttons */
  buildPanelHTML(entries, resolved) {
    const count = entries.length;
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
          <span class="haywire-support-card-remove" data-uuid="${escapeHtml(entry.uuid)}" title="${this.i18n("HAYWIRE.Support.Remove")}"><i class="fas fa-times"></i></span>
          <img class="haywire-support-card-img" src="${escapeHtml(img)}" alt="${escapeHtml(name)}" />
          ${leaderName ? `<span class="haywire-support-card-leader${downed ? " downed" : ""}" title="${escapeHtml(leaderName)}"><i class="fas ${downed ? "fa-skull" : "fa-user-shield"}"></i> ${escapeHtml(leaderName)}</span>` : ""}
          <button class="haywire-support-activate" data-uuid="${escapeHtml(entry.uuid)}" data-name="${escapeHtml(name)}" data-img="${escapeHtml(img)}"
                  title="${downed ? this.i18n("HAYWIRE.Support.LeaderDowned") : this.i18n("HAYWIRE.Support.Activate")}"
                  ${downed ? "disabled" : ""}>
            <i class="fas fa-bullseye"></i> ${this.i18n("HAYWIRE.Support.Activate")}
          </button>
        </div>`;
      })
      .join("");

    return `
      <div class="haywire-support-panel-inner">
        <div class="haywire-support-panel-header">
          <i class="fas ${this.iconClass}"></i> ${this.i18n(this.labelKey)}
          <span class="haywire-support-count">${count}</span>
          <span class="haywire-support-purge" title="${this.i18n("HAYWIRE.Support.Purge")}"><i class="fas fa-trash"></i></span>
        </div>
        <div class="haywire-support-cards">${cardsHtml}</div>
      </div>`;
  }

  /** @override — add activate, remove, purge events */
  bindPanelEvents(panel) {
    super.bindPanelEvents(panel);

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
      await this.purgeAll();
    });
  }

  /* ─── Private ────────────────────────────────────────────────────────── */

  /** @returns {Set<string>} */
  #getLeaderIds() {
    return new Set(this.getCardEntries().map((e) => e.leaderId).filter(Boolean));
  }

  /**
   * @param {string} actorId
   * @returns {boolean}
   */
  #isActorDowned(actorId) {
    if (!actorId) return false;
    const actor = game.actors.get(actorId);
    return actor?.system.conditions?.has("downed") ?? false;
  }

  /**
   * @param {string} uuid
   * @param {string} name
   * @param {string} img
   */
  async #activateCard(uuid, name, img) {
    try {
      await ChatMessage.create({
        content: `<div class="haywire-card-chat">
          <div class="haywire-card-chat-header">
            <i class="fas fa-bullseye"></i> ${this.i18n("HAYWIRE.Support.Activated")}
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

export default new SupportOverlay();
