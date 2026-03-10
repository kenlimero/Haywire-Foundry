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

    el.innerHTML = `
      <div class="haywire-threat-beacon">
        <div class="haywire-threat-beacon-base"></div>
        <div class="haywire-threat-beacon-collar"></div>
        <div class="haywire-threat-beacon-dome"></div>
        <div class="haywire-threat-beacon-glow"></div>
        <div class="haywire-threat-level">${isActive ? level : "—"}</div>
      </div>
      ${isGM ? `<div class="haywire-threat-controls">
        <button class="haywire-threat-btn" data-action="decrease" title="${i18n("HAYWIRE.Threat.Decrease")}" ${level <= 0 ? "disabled" : ""}>
          <i class="fas fa-minus"></i>
        </button>
        <button class="haywire-threat-btn" data-action="increase" title="${i18n("HAYWIRE.Threat.Increase")}" ${level >= 9 ? "disabled" : ""}>
          <i class="fas fa-plus"></i>
        </button>
        <button class="haywire-threat-btn haywire-threat-alert-btn ${isAlert ? "active" : ""}" data-action="alert" title="${i18n("HAYWIRE.Threat.Alert")}">
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

    const src = `${this.FACTION_PATHS[this.faction]}${String(level).padStart(2, "0")}.webp`;
    const alertClass = this.alert ? " alert" : "";
    card.innerHTML = `<img class="haywire-threat-card-img${alertClass}" src="${src}" />`;
    card.classList.add("visible");
  }

  static #hideCard() {
    this.#cardEl?.classList.remove("visible");
  }
}
