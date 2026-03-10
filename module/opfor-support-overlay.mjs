/**
 * OPFOR Support Cards Overlay — miniature backcover à gauche de l'alerte.
 * - Hover sur la miniature : affiche le panneau de cartes support OPFOR
 * - Hover sur une carte : affiche la carte en grand (style token overlay)
 * - Visible uniquement si l'alerte est active ET un leader/support skill non-downed est sur la scène
 */
import {
  pinSvg, parseDropData, bindPinToggle, bindDragDrop,
  onSettingsChange, isOpforActivatable, showPreview, hidePreview,
  getOrCreateElement, bindOpforActivityHooks,
} from "./overlay-helpers.mjs";

export class OpforSupportOverlay {
  static #el = null;
  static #panelEl = null;
  static #previewEl = null;
  static #hideTimeout = null;
  static #cachedActivatable = null;

  static init() {
    this.#el = getOrCreateElement(this.#el, "haywire-opfor-support-overlay");
    this.#panelEl = getOrCreateElement(this.#panelEl, "haywire-opfor-support-panel");
    this.#previewEl = getOrCreateElement(this.#previewEl, "haywire-opfor-support-preview");
    this.render();

    onSettingsChange(["opforSupportCardIds", "threatAlert"], () => {
      this.#cachedActivatable = null;
      this.render();
    });

    bindOpforActivityHooks(() => { this.#cachedActivatable = null; this.render(); });
  }

  static async isActivatable() {
    if (this.#cachedActivatable !== null) return this.#cachedActivatable;
    this.#cachedActivatable = await isOpforActivatable();
    return this.#cachedActivatable;
  }

  static get cardIds() {
    return game.settings.get("haywire", "opforSupportCardIds") ?? [];
  }

  static async setCardIds(ids) {
    await game.settings.set("haywire", "opforSupportCardIds", ids);
  }

  static async addCards(uuids) {
    const current = this.cardIds;
    const existing = new Set(current);
    const newIds = uuids.filter((uuid) => !existing.has(uuid));
    if (newIds.length === 0) return;
    await this.setCardIds([...current, ...newIds]);
  }

  static async removeCard(uuid) {
    await this.setCardIds(this.cardIds.filter((id) => id !== uuid));
  }

  static async render() {
    const el = this.#el;
    const panel = this.#panelEl;
    if (!el || !panel) return;

    const cardIds = this.cardIds;
    const count = cardIds.length;
    const activatable = await this.isActivatable();
    const i18n = (k) => game.i18n.localize(k);

    if (!activatable) {
      el.innerHTML = "";
      panel.innerHTML = "";
      return;
    }

    el.innerHTML = `
      <div class="haywire-support-thumb" title="${i18n("HAYWIRE.OpforSupport.Label")}">
        <img src="systems/haywire/assets/cards/backcovers/support-opfor.webp" alt="OPFOR Support" />
        ${pinSvg(i18n("HAYWIRE.Pin"))}
      </div>`;

    const thumb = el.querySelector(".haywire-support-thumb");
    thumb.addEventListener("mouseenter", () => this.#showPanel());
    thumb.addEventListener("mouseleave", () => this.#hidePanel());
    bindPinToggle(el);
    bindDragDrop(thumb, (e) => this.#onDrop(e));

    panel.addEventListener("mouseenter", () => this.#showPanel());
    panel.addEventListener("mouseleave", () => this.#hidePanel());

    await this.#renderPanel(panel, cardIds, count, i18n);
  }

  /* ---- Private ---- */


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
      hidePreview(this.#previewEl);
    }, 100);
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

    panel.querySelectorAll(".haywire-support-card").forEach((card) => {
      card.addEventListener("mouseenter", () => showPreview(this.#previewEl, card.dataset.previewImg, card.dataset.previewName));
      card.addEventListener("mouseleave", () => hidePreview(this.#previewEl));
    });
  }

  static async #onDrop(event) {
    const data = parseDropData(event);
    if (!data || data.type !== "Item") return;

    const current = this.cardIds;
    if (current.includes(data.uuid)) return;
    await this.setCardIds([...current, data.uuid]);
  }
}
