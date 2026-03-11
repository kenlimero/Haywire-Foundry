/**
 * Threat Level Overlay — gyrophare fixe en haut au centre de l'écran.
 * - Niveau 0 : gyrophare éteint (pas d'alerte) + bouton sélection faction
 * - Niveaux 1-9 : gyrophare allumé, couleur selon la sévérité
 * - Hover : affiche une carte résumé du niveau de menace
 * - Boutons +/- (GM uniquement) pour ajuster le niveau
 * - Bouton alerte (GM) : active/désactive l'alerte (lueur rouge pulsante)
 */
import { OpforSupportOverlay } from "./opfor-support-overlay.mjs";
import { rollCompendiumTable, getOrCreateElement, showPreview, hidePreview } from "./overlay-helpers.mjs";

export class ThreatOverlay {
  static #el = null;
  static #previewEl = null;

  static FACTION_PATHS = {
    cartels: "systems/haywire/assets/opfor_cartels/cartel_threat_level_",
    insurgents: "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_",
    russians: "systems/haywire/assets/opfor_russians/russians_threat_level_",
  };

  static FACTION_TABLE_NAMES = {
    cartels: "Cartel Threat Level",
    insurgents: "Insurgent Threat Level",
    russians: "Russian Threat Level",
  };

  static init() {
    this.#el = getOrCreateElement(this.#el, "haywire-threat-overlay");
    this.#previewEl = getOrCreateElement(this.#previewEl, "haywire-threat-preview");
    this.render();

    Hooks.on("updateSetting", (setting) => {
      if (setting.key === "haywire.threatLevel" || setting.key === "haywire.threatAlert" || setting.key === "haywire.opforFaction") {
        this.render();
      }
    });
  }

  static get level() {
    return game.settings.get("haywire", "threatLevel");
  }

  static get alert() {
    return game.settings.get("haywire", "threatAlert");
  }

  static get faction() {
    return game.settings.get("haywire", "opforFaction") || "";
  }

  static get hasFaction() {
    return !!this.faction;
  }

  static async setLevel(value) {
    const clamped = Math.clamp(value, 0, 9);
    await game.settings.set("haywire", "threatLevel", clamped);
    if (clamped === 0 && this.alert) await this.toggleAlert();
  }

  static async toggleAlert() {
    await game.settings.set("haywire", "threatAlert", !this.alert);
  }

  static render() {
    const el = this.#el;
    if (!el) return;

    const level = this.level;
    const isActive = level > 0;
    const isAlert = this.alert;
    const isGM = game.user.isGM;
    const i18n = (k) => game.i18n.localize(k);
    el.className = `haywire-threat ${isActive ? "active" : "inactive"}${isAlert ? " alert" : ""}`;

    const factionBtn = !isActive && isGM
      ? `<button class="haywire-threat-btn haywire-threat-faction-btn" title="${i18n("HAYWIRE.Threat.FactionHint")}"><i class="fas fa-skull-crossbones"></i></button>`
      : "";

    el.innerHTML = `
      <div class="haywire-threat-beacon">
        <div class="haywire-threat-beacon-base"></div>
        <div class="haywire-threat-beacon-collar"></div>
        <div class="haywire-threat-beacon-dome"></div>
        <div class="haywire-threat-beacon-glow"></div>
        <div class="haywire-threat-level">${isActive ? level : "—"}</div>
        ${isActive && isGM ? `<button class="haywire-threat-d20" title="${i18n("HAYWIRE.Threat.RollTable")}"><i class="fas fa-dice-d20"></i></button>` : ""}
      </div>
      ${isGM ? `<div class="haywire-threat-controls">
        <button class="haywire-threat-btn" data-action="decrease" title="${i18n("HAYWIRE.Threat.Decrease")}" ${level <= 0 ? "disabled" : ""}>
          <i class="fas fa-minus"></i>
        </button>
        <button class="haywire-threat-btn" data-action="increase" title="${i18n("HAYWIRE.Threat.Increase")}" ${level >= 9 || !this.hasFaction ? "disabled" : ""}>
          <i class="fas fa-plus"></i>
        </button>
        <button class="haywire-threat-btn haywire-threat-alert-btn ${isAlert ? "active" : ""}" data-action="alert" title="${i18n("HAYWIRE.Threat.Alert")}" ${!isActive ? "disabled" : ""}>
          <i class="fas fa-bell"></i>
        </button>
        ${factionBtn}
      </div>` : ""}`;

    el.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "increase") this.setLevel(this.level + 1);
        else if (action === "decrease") this.setLevel(this.level - 1);
        else if (action === "alert") this.toggleAlert();
      });
    });

    el.querySelector(".haywire-threat-d20")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#rollThreatTable();
    });

    el.querySelector(".haywire-threat-faction-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#showFactionDialog();
    });

    const beacon = el.querySelector(".haywire-threat-beacon");
    beacon.addEventListener("mouseenter", () => this.#showCard());
    beacon.addEventListener("mouseleave", () => this.#hideCard());
  }

  /* ---- Private ---- */


  static #showCard() {
    const level = this.level;
    if (level <= 0) return;

    const pathPrefix = this.FACTION_PATHS[this.faction];
    if (!pathPrefix) return;

    const src = `${pathPrefix}${String(level).padStart(2, "0")}.webp`;
    showPreview(this.#previewEl, src, `Threat Level ${level}`);
  }

  static async #rollThreatTable() {
    const level = this.level;
    const prefix = this.FACTION_TABLE_NAMES[this.faction];
    if (!prefix || level <= 0) return;
    await rollCompendiumTable(`${prefix} ${level}`);
  }

  static #hideCard() {
    hidePreview(this.#previewEl);
  }

  static FACTION_KEYS = {
    Cartel: "cartels",
    Insurgents: "insurgents",
    Russians: "russians",
  };

  static async #showFactionDialog() {
    const pack = game.packs.get("haywire.opfor-support");
    if (!pack) {
      ui.notifications.error("Compendium haywire.opfor-support not found.");
      return;
    }

    const index = await pack.getIndex({ fields: ["folder"] });
    const folders = pack.folders;
    if (!folders.size) {
      ui.notifications.warn("No folders found in opfor-support compendium.");
      return;
    }

    const buttons = [];
    for (const folder of folders) {
      buttons.push({
        action: folder.id,
        label: folder.name,
        icon: "fas fa-skull-crossbones",
        callback: () => this.#importFaction(index, folder),
      });
    }

    await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("HAYWIRE.Threat.ImportFaction") },
      content: `<p>${game.i18n.localize("HAYWIRE.Threat.FactionHint")}</p>`,
      buttons,
    });
  }

  static async #importFaction(index, folder) {
    const entries = index.filter((e) => e.folder === folder._id);
    if (!entries.length) {
      ui.notifications.warn(`No cards found in folder "${folder.name}".`);
      return;
    }

    const factionKey = this.FACTION_KEYS[folder.name];
    if (factionKey) {
      await game.settings.set("haywire", "opforFaction", factionKey);
      if (this.level === 0) await this.setLevel(1);
    }

    await OpforSupportOverlay.setCardIds([]);
    const uuids = entries.map((e) => `Compendium.haywire.opfor-support.Item.${e._id}`);
    await OpforSupportOverlay.addCards(uuids);
    ui.notifications.info(`${entries.length} ${folder.name} support cards imported.`);
  }
}
