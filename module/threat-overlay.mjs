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

  /** Crée le widget et écoute les changements de setting. */
  static init() {
    this.#getOrCreate();
    this.render();

    // Re-render quand un setting pertinent change
    Hooks.on("updateSetting", (setting) => {
      if (setting.key === "haywire.threatLevel" || setting.key === "haywire.threatAlert") {
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
    const severity = this.#getSeverity(level);

    el.className = `haywire-threat ${isActive ? "active" : "inactive"} severity-${severity}${isAlert ? " alert" : ""}`;

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

  static #getSeverity(level) {
    if (level === 0) return "none";
    if (level <= 3) return "low";
    if (level <= 6) return "medium";
    return "high";
  }

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
    const isAlert = this.alert;
    const card = this.#cardEl;
    const i18n = (k) => game.i18n.localize(k);
    const severity = this.#getSeverity(level);

    const severityLabel = level === 0
      ? i18n("HAYWIRE.Threat.NoAlert")
      : i18n(`HAYWIRE.Threat.Severity.${severity.charAt(0).toUpperCase() + severity.slice(1)}`);

    const levelBars = Array.from({ length: 9 }, (_, i) => {
      const n = i + 1;
      const filled = n <= level;
      const barSeverity = this.#getSeverity(n);
      return `<div class="haywire-threat-bar ${filled ? "filled" : ""} severity-${barSeverity}"></div>`;
    }).join("");

    const alertBadge = isAlert
      ? `<div class="haywire-threat-card-alert"><i class="fas fa-bell"></i> ${i18n("HAYWIRE.Threat.AlertActive")}</div>`
      : "";

    card.innerHTML = `
      <div class="haywire-threat-card-inner severity-${severity}${isAlert ? " alert" : ""}">
        <div class="haywire-threat-card-header">
          <i class="fas fa-radiation"></i>
          ${i18n("HAYWIRE.Threat.Label")}
        </div>
        ${alertBadge}
        <div class="haywire-threat-card-level">${level === 0 ? "—" : level}</div>
        <div class="haywire-threat-card-severity">${severityLabel}</div>
        <div class="haywire-threat-bars">${levelBars}</div>
        ${level > 0 ? `<div class="haywire-threat-card-hint">${i18n("HAYWIRE.Threat.TableHint")}</div>` : ""}
      </div>`;

    card.classList.add("visible");
  }

  static #hideCard() {
    this.#cardEl?.classList.remove("visible");
  }
}
