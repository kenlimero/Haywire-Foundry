/**
 * Reinforcement Overlay — carte faction portrait en haut à gauche de la barre d'overlays.
 * - Apparaît si un leader ou opfor-unit avec skill "Support" est sur la scène + alert active
 * - Reste piné tant que la condition est remplie
 * - Bouton d20 → roll sur la table "{Faction} Reinforcements"
 * - Disparaît si le leader/skill support est retiré ou alert désactivée
 */
import {
  pinSvg, D20_SVG, onSettingsChange, getOrCreateElement,
  isOpforActivatable, rollCompendiumTable, showPreview, hidePreview,
  bindOpforActivityHooks,
} from "./overlay-helpers.mjs";

export class ReinforcementOverlay {
  static #el = null;
  static #previewEl = null;
  static #cachedActivatable = null;

  static FACTION_TABLE_NAMES = {
    cartels: "Cartel Reinforcements",
    insurgents: "Insurgent Reinforcements",
    russians: "Russian Reinforcements",
  };

  static FACTION_CARD_PATHS = {
    cartels: "systems/haywire/assets/opfor_cartels/reinforcements.webp",
    insurgents: "systems/haywire/assets/opfor_insurgents/reinforcements.webp",
    russians: "systems/haywire/assets/opfor_russians/reinforcements.webp",
  };

  static init() {
    this.#el = getOrCreateElement(this.#el, "haywire-reinforcement-overlay");
    this.#previewEl = getOrCreateElement(this.#previewEl, "haywire-reinforcement-preview");
    this.render();

    onSettingsChange(["threatAlert", "opforFaction"], () => {
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

  static get faction() {
    return game.settings.get("haywire", "opforFaction") ?? "cartels";
  }

  static async render() {
    const el = this.#el;
    if (!el) return;

    const activatable = await this.isActivatable();
    const faction = this.faction;
    const imgSrc = this.FACTION_CARD_PATHS[faction];
    const i18n = (k) => game.i18n.localize(k);

    if (!activatable || !imgSrc) {
      el.classList.remove("pinned");
      el.innerHTML = "";
      return;
    }

    el.classList.add("pinned");

    el.innerHTML = `
      <div class="haywire-reinforcement-card">
        <img class="haywire-reinforcement-thumb" src="${imgSrc}" alt="Reinforcements" />
        <button class="haywire-overlay-roll" title="${i18n("HAYWIRE.Reinforcement.Roll")}">${D20_SVG}</button>
        ${pinSvg(i18n("HAYWIRE.Pin"))}
      </div>`;

    const card = el.querySelector(".haywire-reinforcement-card");
    card.addEventListener("mouseenter", () => showPreview(this.#previewEl, imgSrc, "Reinforcements"));
    card.addEventListener("mouseleave", () => hidePreview(this.#previewEl));

    el.querySelector(".haywire-overlay-pin")?.addEventListener("click", (e) => {
      e.stopPropagation();
      el.classList.toggle("user-pinned");
    });

    el.querySelector(".haywire-overlay-roll")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#rollReinforcementTable();
    });
  }

  /* ---- Private ---- */

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

  static async #rollReinforcementTable() {
    const tableName = this.FACTION_TABLE_NAMES[this.faction];
    if (!tableName) return;
    const draw = await rollCompendiumTable(tableName);
    if (!draw?.results?.length) return;

    // Check if the result references a support card
    const resultText = (draw.results[0].description ?? draw.results[0].text ?? "").toLowerCase();
    const cardName = this.SUPPORT_CARD_NAMES[resultText];
    if (!cardName) return;

    // Find the matching support card in the compendium
    const pack = game.packs.get("haywire.opfor-support");
    if (!pack) return;
    const index = await pack.getIndex();
    const cardEntry = index.find((e) => e.name === cardName);
    if (!cardEntry) return;

    const card = await pack.getDocument(cardEntry._id);
    if (!card?.img) return;

    // Display the support card in chat
    await ChatMessage.create({
      content: `<div class="haywire-card-chat">
        <div class="haywire-card-chat-header">
          <i class="fas fa-crosshairs"></i> ${game.i18n.localize("HAYWIRE.Reinforcement.Support")}
        </div>
        <img class="haywire-card-chat-img" src="${card.img}" alt="${card.name}" />
      </div>`,
      whisper: game.users.filter((u) => u.isGM).map((u) => u.id),
    });
  }
}
