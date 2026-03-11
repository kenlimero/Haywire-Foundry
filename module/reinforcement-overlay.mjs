/**
 * Reinforcement Overlay — carte faction portrait en haut à gauche de la barre d'overlays.
 * - Apparaît si un leader ou opfor-unit avec skill "Support" est sur la scène + alert active
 * - Reste piné tant que la condition est remplie
 * - Bouton d20 → roll sur la table "{Faction} Reinforcements"
 * - Disparaît si le leader/skill support est retiré ou alert désactivée
 * @module reinforcement-overlay
 */
import { BaseOverlay, escapeHtml } from "./overlays/base-overlay.mjs";
import { isOpforActivatable, rollCompendiumTable, bindOpforActivityHooks } from "./overlay-helpers.mjs";

export class ReinforcementOverlay extends BaseOverlay {
  /** @type {boolean|null} */
  #cachedActivatable = null;

  /** @type {Record<string, string>} Faction key → reinforcement table name */
  static FACTION_TABLE_NAMES = {
    cartels: "Cartel Reinforcements",
    insurgents: "Insurgent Reinforcements",
    russians: "Russian Reinforcements",
  };

  /** @type {Record<string, string>} Faction key → reinforcement card image path */
  static FACTION_CARD_PATHS = {
    cartels: "systems/haywire/assets/opfor_cartels/reinforcements.webp",
    insurgents: "systems/haywire/assets/opfor_insurgents/reinforcements.webp",
    russians: "systems/haywire/assets/opfor_russians/reinforcements.webp",
  };

  /** Map reinforcement result text (lowercased) to opfor-support card name. */
  static SUPPORT_CARD_NAMES = {
    "blend in support": "Blend In",
    "human shield support": "Human Shield",
    "heli sniper support": "Heli Sniper",
    "chemical strike": "Chemical Strike",
    "hidden sniper": "Hidden Sniper",
    "mortar shelling": "Mortar Shelling",
    "fpv drone": "FPV Drone",
    "artillery barrage": "Artillery Barrage",
    "medallon mine": "Medallon Mine",
  };

  constructor() {
    super({
      elementId: "haywire-reinforcement-overlay",
      previewId: "haywire-reinforcement-preview",
      settingKeys: ["threatAlert", "opforFaction"],
    });
  }

  /** @returns {string} Current OPFOR faction key */
  get faction() { return this.getSetting("opforFaction") || ""; }

  /** @returns {string|undefined} Card image path for current faction */
  get imgSrc() { return ReinforcementOverlay.FACTION_CARD_PATHS[this.faction]; }

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
    // Invalidate cache on every render triggered by settings change
    this.#cachedActivatable = null;
    await super.render();
  }

  /** @override */
  async buildHTML() {
    const imgSrc = this.imgSrc;
    if (!imgSrc) return "";

    return `
      <div class="haywire-reinforcement-card">
        <img class="haywire-reinforcement-thumb" src="${escapeHtml(imgSrc)}" alt="Reinforcements" />
        <button class="haywire-overlay-roll" title="${this.i18n("HAYWIRE.Reinforcement.Roll")}"><i class="fas fa-dice-d20"></i></button>
        ${this.pinHTML()}
      </div>`;
  }

  /** @override */
  bindEvents() {
    const card = this.el?.querySelector(".haywire-reinforcement-card");
    if (!card) return;

    const imgSrc = this.imgSrc;
    card.addEventListener("mouseenter", () => this.showPreview(imgSrc, "Reinforcements"));
    card.addEventListener("mouseleave", () => this.hidePreview());

    this.bindPin();

    this.el?.querySelector(".haywire-overlay-roll")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#rollReinforcementTable();
    });
  }

  async #rollReinforcementTable() {
    const tableName = ReinforcementOverlay.FACTION_TABLE_NAMES[this.faction];
    if (!tableName) return;

    const draw = await rollCompendiumTable(tableName);
    if (!draw?.results?.length) return;

    const resultText = (draw.results[0].description ?? draw.results[0].text ?? "").toLowerCase();
    const cardName = ReinforcementOverlay.SUPPORT_CARD_NAMES[resultText];
    if (!cardName) return;

    const pack = game.packs.get("haywire.opfor-support");
    if (!pack) return;

    const index = await pack.getIndex();
    const cardEntry = index.find((e) => e.name === cardName);
    if (!cardEntry) return;

    const card = await pack.getDocument(cardEntry._id);
    if (!card?.img) return;

    await ChatMessage.create({
      content: `<div class="haywire-card-chat">
        <div class="haywire-card-chat-header">
          <i class="fas fa-crosshairs"></i> ${this.i18n("HAYWIRE.Reinforcement.Support")}
        </div>
        <img class="haywire-card-chat-img" src="${escapeHtml(card.img)}" alt="${escapeHtml(card.name)}" />
      </div>`,
      whisper: game.users.filter((u) => u.isGM).map((u) => u.id),
    });
  }
}

export default new ReinforcementOverlay();
