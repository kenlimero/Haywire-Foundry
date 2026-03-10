/**
 * Reinforcement Overlay — carte faction portrait en haut à gauche de la barre d'overlays.
 * - Apparaît si un leader ou opfor-unit avec skill "Support" est sur la scène + alert active
 * - Reste piné tant que la condition est remplie
 * - Bouton d20 → roll sur la table "{Faction} Reinforcements"
 * - Disparaît si le leader/skill support est retiré ou alert désactivée
 */
export class ReinforcementOverlay {
  static #el = null;
  static #previewEl = null;
  static #cachedActivatable = null;

  /** Leader name pattern (same as OpforSupportOverlay). */
  static LEADER_NAMES = /^(squad commander|cell leader|leader)$/i;

  /** Maps faction key → reinforcement table name in compendium. */
  static FACTION_TABLE_NAMES = {
    cartels: "Cartel Reinforcements",
    insurgents: "Insurgent Reinforcements",
    russians: "Russian Reinforcements",
  };

  /** Maps faction key → reinforcement card image path. */
  static FACTION_CARD_PATHS = {
    cartels: "systems/haywire/assets/opfor_cartels/reinforcements.webp",
    insurgents: "systems/haywire/assets/opfor_insurgents/reinforcements.webp",
    russians: "systems/haywire/assets/opfor_russians/reinforcements.webp",
  };

  static init() {
    this.#getOrCreate();
    this.render();

    const onSettingChange = (setting) => {
      if (setting.key === "haywire.threatAlert" || setting.key === "haywire.opforFaction") {
        this.#cachedActivatable = null;
        this.render();
      }
    };
    Hooks.on("createSetting", onSettingChange);
    Hooks.on("updateSetting", onSettingChange);

    // Re-render when tokens are added/removed (leader may appear/disappear)
    Hooks.on("createToken", () => { this.#cachedActivatable = null; this.render(); });
    Hooks.on("deleteToken", () => { this.#cachedActivatable = null; this.render(); });

    // Re-render when an opfor-unit actor is updated (may gain/lose downed)
    Hooks.on("updateActor", (actor) => {
      if (actor.type === "opfor-unit") {
        this.#cachedActivatable = null;
        this.render();
      }
    });
  }

  /**
   * Check if the overlay should be visible.
   * Same logic as OpforSupportOverlay.isActivatable():
   * 1. threatAlert must be active
   * 2. At least one non-downed opfor-unit with leader name or "Support" skill
   */
  static async isActivatable() {
    if (this.#cachedActivatable !== null) return this.#cachedActivatable;

    const alertActive = game.settings.get("haywire", "threatAlert");
    if (!alertActive) {
      this.#cachedActivatable = false;
      return false;
    }

    const scene = game.scenes?.active;
    if (!scene) { this.#cachedActivatable = false; return false; }

    for (const token of scene.tokens) {
      const actor = token.actor;
      if (!actor || actor.type !== "opfor-unit") continue;
      if (actor.system.conditions?.has("downed")) continue;

      if (this.LEADER_NAMES.test(actor.name)) {
        this.#cachedActivatable = true;
        return true;
      }

      const skillUuids = actor.system.opforSkillIds ?? [];
      for (const uuid of skillUuids) {
        const skill = await fromUuid(uuid);
        if (skill?.name?.toLowerCase() === "support") {
          this.#cachedActivatable = true;
          return true;
        }
      }
    }

    this.#cachedActivatable = false;
    return false;
  }

  /** Current faction key. */
  static get faction() {
    return game.settings.get("haywire", "opforFaction") ?? "cartels";
  }

  /** Rebuild the overlay HTML. */
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

    // Auto-pin when activatable
    el.classList.add("pinned");

    const pinSvg = `<span class="haywire-overlay-pin" title="${i18n("HAYWIRE.Pin")}"><svg viewBox="0 0 384 512"><path d="M300.8 203.9L290 213.1H273c-7.7 0-15 3.2-20.3 8.5L194.7 279.6 104.4 189.3l58-58c5.3-5.3 8.5-12.6 8.5-20.3V94.1l9.2-10.9C196.3 64.5 220.2 54 245.2 54h48c23.2 0 45.6 8.2 63.1 23L384 101.3 282.7 202.6zM96 297.4l87.6 87.6L57.6 511c-5.8 5.8-14.3 8-22.2 5.7S21.5 508.5 19.3 500.6c-2.3-7.9-.1-16.4 5.7-22.2L96 297.4z"/></svg></span>`;

    const d20Svg = `<svg viewBox="0 0 512 512"><path d="M48.7 125.8l53.2 31.9c7.8 4.7 17.8 2 22.2-5.9L201.6 12.1c3-5.3-.6-11.9-6.6-11.9H144c-3.4 0-6.5 1.5-8.6 4.2L48.7 125.8zm416.6 0L378.6 4.4c-2.1-2.7-5.2-4.2-8.6-4.2h-51c-6 0-9.6 6.6-6.6 11.9l77.5 139.7c4.4 7.9 14.4 10.6 22.2 5.9l53.2-31.9zM36.3 161.7L3.8 280.4c-2 7.3 2.2 14.9 9.3 17.6l191.2 72C204.1 197.5 111.3 162 36.3 161.7zm439.4 0c-75 .3-167.8 35.8-168 208.3l191.2-72c7.1-2.7 11.3-10.3 9.3-17.6l-32.5-118.7zM256 208c-76.5 0-138.5 62-138.5 138.5S179.5 485 256 485s138.5-62 138.5-138.5S332.5 208 256 208z"/></svg>`;

    el.innerHTML = `
      <div class="haywire-reinforcement-card">
        <img class="haywire-reinforcement-thumb" src="${imgSrc}" alt="Reinforcements" />
        <button class="haywire-overlay-roll" title="${i18n("HAYWIRE.Reinforcement.Roll")}">${d20Svg}</button>
        ${pinSvg}
      </div>`;

    const card = el.querySelector(".haywire-reinforcement-card");

    // Preview on hover (on the whole card container so d20 button doesn't cancel it)
    card.addEventListener("mouseenter", () => this.#showPreview(imgSrc));
    card.addEventListener("mouseleave", () => this.#hidePreview());

    // Pin toggle
    el.querySelector(".haywire-overlay-pin")?.addEventListener("click", (e) => {
      e.stopPropagation();
      el.classList.toggle("user-pinned");
    });

    // d20 roll button
    el.querySelector(".haywire-overlay-roll")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#rollReinforcementTable();
    });
  }

  /* ---- Private ---- */

  static #getOrCreate() {
    if (!this.#el) {
      this.#el = document.createElement("div");
      this.#el.id = "haywire-reinforcement-overlay";
      document.body.appendChild(this.#el);
    }
    if (!this.#previewEl) {
      this.#previewEl = document.createElement("div");
      this.#previewEl.id = "haywire-reinforcement-preview";
      document.body.appendChild(this.#previewEl);
    }
  }

  static #showPreview(img) {
    const preview = this.#previewEl;
    if (!preview) return;
    preview.innerHTML = `<img src="${img}" alt="Reinforcements" />`;
    preview.classList.add("visible");
  }

  static #hidePreview() {
    this.#previewEl?.classList.remove("visible");
  }

  static async #rollReinforcementTable() {
    const faction = this.faction;
    const tableName = this.FACTION_TABLE_NAMES[faction];
    if (!tableName) return;

    const pack = game.packs.get("haywire.opfor-tables");
    if (!pack) return;

    const index = await pack.getIndex();
    const entry = index.find((e) => e.name === tableName);
    if (!entry) {
      ui.notifications.warn(`Table "${tableName}" not found.`);
      return;
    }

    const table = await pack.getDocument(entry._id);
    await table.draw();
  }
}
