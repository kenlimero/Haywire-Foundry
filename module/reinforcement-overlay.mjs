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


  static async #rollReinforcementTable() {
    const tableName = this.FACTION_TABLE_NAMES[this.faction];
    if (!tableName) return;
    await rollCompendiumTable(tableName);
  }
}
