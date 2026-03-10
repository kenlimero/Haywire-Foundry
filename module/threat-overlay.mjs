/**
 * Threat Level Overlay — gyrophare fixe en haut au centre de l'écran.
 * - Niveau 0 : gyrophare éteint (pas d'alerte)
 * - Niveaux 1-9 : gyrophare allumé, couleur selon la sévérité
 * - Hover : affiche une carte résumé du niveau de menace
 * - Boutons +/- (GM uniquement) pour ajuster le niveau
 * - Bouton alerte (GM) : active/désactive l'alerte (lueur rouge pulsante)
 */
export class ThreatOverlay {
  static #el = null;
  static #cardEl = null;

  /** Maps faction setting value to asset path prefix. */
  static FACTION_PATHS = {
    cartels: "systems/haywire/assets/opfor_cartels/cartel_threat_level_",
    insurgents: "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_",
    russians: "systems/haywire/assets/opfor_russians/russians_threat_level_",
  };

  /** Maps faction setting value to RollTable name prefix. */
  static FACTION_TABLE_NAMES = {
    cartels: "Cartel Threat Level",
    insurgents: "Insurgent Threat Level",
    russians: "Russian Threat Level",
  };

  /** Crée le widget et écoute les changements de setting. */
  static init() {
    this.#getOrCreate();
    this.render();

    // Re-render quand un setting pertinent change
    Hooks.on("updateSetting", (setting) => {
      if (setting.key === "haywire.threatLevel" || setting.key === "haywire.threatAlert" || setting.key === "haywire.opforFaction") {
        this.render();
      }
    });
  }

  /** Niveau courant (0-9). */
  static get level() {
    return game.settings.get("haywire", "threatLevel");
  }

  /** Alerte active ? */
  static get alert() {
    return game.settings.get("haywire", "threatAlert");
  }

  /** Faction OPFOR sélectionnée. */
  static get faction() {
    return game.settings.get("haywire", "opforFaction") ?? "cartels";
  }

  /** Met à jour le niveau (GM only). */
  static async setLevel(value) {
    const clamped = Math.clamp(value, 0, 9);
    await game.settings.set("haywire", "threatLevel", clamped);
    if (clamped === 0 && this.alert) await this.toggleAlert();
  }

  /** Bascule l'état d'alerte (GM only). */
  static async toggleAlert() {
    await game.settings.set("haywire", "threatAlert", !this.alert);
  }

  /** Reconstruit le HTML du widget. */
  static render() {
    const el = this.#el;
    if (!el) return;

    const level = this.level;
    const isActive = level > 0;
    const isAlert = this.alert;
    const isGM = game.user.isGM;
    const i18n = (k) => game.i18n.localize(k);
    el.className = `haywire-threat ${isActive ? "active" : "inactive"}${isAlert ? " alert" : ""}`;

    const d20Svg = `<svg viewBox="0 0 512 512"><path d="M48.7 125.8l53.2 31.9c7.8 4.7 17.8 2 22.2-5.9L201.6 12.1c3-5.3-.6-11.9-6.6-11.9H144c-3.4 0-6.5 1.5-8.6 4.2L48.7 125.8zm416.6 0L378.6 4.4c-2.1-2.7-5.2-4.2-8.6-4.2h-51c-6 0-9.6 6.6-6.6 11.9l77.5 139.7c4.4 7.9 14.4 10.6 22.2 5.9l53.2-31.9zM36.3 161.7L3.8 280.4c-2 7.3 2.2 14.9 9.3 17.6l191.2 72C204.1 197.5 111.3 162 36.3 161.7zm439.4 0c-75 .3-167.8 35.8-168 208.3l191.2-72c7.1-2.7 11.3-10.3 9.3-17.6l-32.5-118.7zM256 208c-76.5 0-138.5 62-138.5 138.5S179.5 485 256 485s138.5-62 138.5-138.5S332.5 208 256 208z"/></svg>`;

    el.innerHTML = `
      <div class="haywire-threat-beacon">
        <div class="haywire-threat-beacon-base"></div>
        <div class="haywire-threat-beacon-collar"></div>
        <div class="haywire-threat-beacon-dome"></div>
        <div class="haywire-threat-beacon-glow"></div>
        <div class="haywire-threat-level">${isActive ? level : "—"}</div>
        ${isActive && isGM ? `<button class="haywire-threat-d20" title="${i18n("HAYWIRE.Threat.RollTable")}">${d20Svg}</button>` : ""}
      </div>
      ${isGM ? `<div class="haywire-threat-controls">
        <button class="haywire-threat-btn" data-action="decrease" title="${i18n("HAYWIRE.Threat.Decrease")}" ${level <= 0 ? "disabled" : ""}>
          <i class="fas fa-minus"></i>
        </button>
        <button class="haywire-threat-btn" data-action="increase" title="${i18n("HAYWIRE.Threat.Increase")}" ${level >= 9 ? "disabled" : ""}>
          <i class="fas fa-plus"></i>
        </button>
        <button class="haywire-threat-btn haywire-threat-alert-btn ${isAlert ? "active" : ""}" data-action="alert" title="${i18n("HAYWIRE.Threat.Alert")}" ${!isActive ? "disabled" : ""}>
          <i class="fas fa-bell"></i>
        </button>
      </div>` : ""}`;

    // Bind events
    el.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "increase") this.setLevel(this.level + 1);
        else if (action === "decrease") this.setLevel(this.level - 1);
        else if (action === "alert") this.toggleAlert();
      });
    });

    // d20 roll button
    el.querySelector(".haywire-threat-d20")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#rollThreatTable();
    });

    // Hover → show threat card
    const beacon = el.querySelector(".haywire-threat-beacon");
    beacon.addEventListener("mouseenter", () => this.#showCard());
    beacon.addEventListener("mouseleave", () => this.#hideCard());
  }

  /* ---- Private ---- */

  static #getOrCreate() {
    if (!this.#el) {
      this.#el = document.createElement("div");
      this.#el.id = "haywire-threat-overlay";
      document.body.appendChild(this.#el);
    }
    if (!this.#cardEl) {
      this.#cardEl = document.createElement("div");
      this.#cardEl.id = "haywire-threat-card";
      document.body.appendChild(this.#cardEl);
    }
    return this.#el;
  }

  static #showCard() {
    const level = this.level;
    const card = this.#cardEl;

    if (level <= 0) {
      card.classList.remove("visible");
      return;
    }

    const faction = this.faction;
    const pathPrefix = this.FACTION_PATHS[faction];

    if (!pathPrefix) {
      const i18n = (k) => game.i18n.localize(k);
      card.innerHTML = `<div class="haywire-threat-card-msg">${i18n("HAYWIRE.Threat.NoFaction")}</div>`;
      card.classList.add("visible");
      return;
    }

    const src = `${pathPrefix}${String(level).padStart(2, "0")}.webp`;
    const alertClass = this.alert ? " alert" : "";
    card.innerHTML = `<img class="haywire-threat-card-img${alertClass}" src="${src}" />`;
    card.classList.add("visible");
  }

  static async #rollThreatTable() {
    const level = this.level;
    const faction = this.faction;
    const prefix = this.FACTION_TABLE_NAMES[faction];
    if (!prefix || level <= 0) return;

    const tableName = `${prefix} ${level}`;
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

  static #hideCard() {
    this.#cardEl?.classList.remove("visible");
  }
}
