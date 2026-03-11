/**
 * OPFOR Support Cards Overlay — miniature backcover à gauche de l'alerte.
 * - Hover sur la miniature : affiche le panneau de cartes support OPFOR
 * - Hover sur une carte : affiche la carte en grand (style token overlay)
 * - Visible uniquement si l'alerte est active ET un leader/support skill non-downed est sur la scène
 * @module opfor-support-overlay
 */
import { CardPanelOverlay } from "./overlays/card-panel-overlay.mjs";
import { isOpforActivatable, bindOpforActivityHooks, parseDropData } from "./overlay-helpers.mjs";

export class OpforSupportOverlay extends CardPanelOverlay {
  /** @type {boolean|null} */
  #cachedActivatable = null;

  constructor() {
    super({
      elementId: "haywire-opfor-support-overlay",
      previewId: "haywire-opfor-support-preview",
      panelId: "haywire-opfor-support-panel",
      settingKeys: ["opforSupportCardIds", "threatAlert"],
      cardsSettingKey: "opforSupportCardIds",
      backcoverImg: "systems/haywire/assets/cards/backcovers/support-opfor.webp",
      labelKey: "HAYWIRE.OpforSupport.Label",
      iconClass: "fa-skull-crossbones",
    });
  }

  /** @override */
  bindHooks() {
    bindOpforActivityHooks(() => { this.#cachedActivatable = null; this.render(); });
  }

  /** @override */
  async isVisible() {
    if (this.#cachedActivatable !== null) return this.#cachedActivatable;
    this.#cachedActivatable = await isOpforActivatable();
    return this.#cachedActivatable;
  }

  /** @override — invalidate cache before re-checking visibility */
  async render() {
    this.#cachedActivatable = null;
    await super.render();
  }

  /** @override — also clear panel when not visible */
  async buildHTML() {
    const visible = await this.isVisible();
    if (!visible) {
      if (this.panelEl) this.panelEl.innerHTML = "";
      return "";
    }
    return super.buildHTML();
  }

  /** @override — validate drop is an Item type */
  onDrop(event) {
    const data = parseDropData(event);
    if (!data || data.type !== "Item") return;
    const current = this.getCardUuids();
    if (current.includes(data.uuid)) return;
    this.addCards([data.uuid]);
  }
}

export default new OpforSupportOverlay();
