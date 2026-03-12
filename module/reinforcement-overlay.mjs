/**
 * Reinforcement Overlay — carte faction portrait en haut à gauche de la barre d'overlays.
 * - Apparaît si un leader ou opfor-unit avec skill "Support" est sur la scène + alert active
 * - Reste piné tant que la condition est remplie
 * - Bouton d20 → roll sur la table "{Faction} Reinforcements"
 * - Disparaît si le leader/skill support est retiré ou alert désactivée
 * @module reinforcement-overlay
 */
import { BaseOverlay, escapeHtml } from "./overlays/base-overlay.mjs";
import { rollCompendiumTable, OpforActivityMixin } from "./overlay-helpers.mjs";
import {
  FACTION_REINFORCEMENT_TABLES,
  FACTION_REINFORCEMENT_PATHS,
  REINFORCEMENT_SUPPORT_CARDS,
  COMPENDIUM_PACKS,
} from "./game-config.mjs";

export class ReinforcementOverlay extends OpforActivityMixin(BaseOverlay) {

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
  get imgSrc() { return FACTION_REINFORCEMENT_PATHS[this.faction]; }

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

  /** Roll on the faction's reinforcement table and post support card to chat. */
  async #rollReinforcementTable() {
    const tableName = FACTION_REINFORCEMENT_TABLES[this.faction];
    if (!tableName) return;

    try {
      const draw = await rollCompendiumTable(tableName);
      if (!draw?.results?.length) return;

      const resultText = (draw.results[0].description ?? draw.results[0].text ?? "").toLowerCase();
      const cardName = REINFORCEMENT_SUPPORT_CARDS[resultText];
      if (!cardName) return;

      const pack = game.packs.get(COMPENDIUM_PACKS.opforSupport);
      if (!pack) return;

      const index = await pack.getIndex();
      const cardEntry = index.find((e) => e.name === cardName);
      if (!cardEntry) {
        console.warn(`haywire | ReinforcementOverlay: support card "${cardName}" not found in compendium`);
        return;
      }

      const card = await pack.getDocument(cardEntry._id);
      if (!card) return;
      const imgSrc = card.faces?.[0]?.img ?? card.img;
      if (!imgSrc) return;

      await ChatMessage.create({
        content: `<div class="haywire-card-chat">
          <div class="haywire-card-chat-header">
            <i class="fas fa-crosshairs"></i> ${this.i18n("HAYWIRE.Reinforcement.Support")}
          </div>
          <img class="haywire-card-chat-img" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(card.name ?? "")}" />
        </div>`,
        whisper: game.users.filter((u) => u.isGM).map((u) => u.id),
      });
    } catch (err) {
      console.error("haywire | ReinforcementOverlay: rollReinforcementTable failed", err);
    }
  }
}

export default new ReinforcementOverlay();
