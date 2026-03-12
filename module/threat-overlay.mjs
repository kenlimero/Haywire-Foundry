/**
 * Threat Level Overlay — gyrophare fixe en haut au centre de l'écran.
 * - Niveau 0 : gyrophare éteint (pas d'alerte) + bouton sélection faction
 * - Niveaux 1-9 : gyrophare allumé, couleur selon la sévérité
 * - Hover : affiche une carte résumé du niveau de menace
 * - Boutons +/- (GM uniquement) pour ajuster le niveau
 * - Bouton alerte (GM) : active/désactive l'alerte (lueur rouge pulsante)
 * @module threat-overlay
 */
import { BaseOverlay } from "./overlays/base-overlay.mjs";
import { rollCompendiumTable } from "./overlay-helpers.mjs";
import opforSupportOverlay from "./opfor-support-overlay.mjs";
import {
  FACTION_THREAT_PATHS,
  FACTION_THREAT_TABLES,
  FACTION_FOLDER_TO_KEY,
  COMPENDIUM_PACKS,
} from "./game-config.mjs";

export class ThreatOverlay extends BaseOverlay {

  constructor() {
    super({
      elementId: "haywire-threat-overlay",
      previewId: "haywire-threat-preview",
      settingKeys: ["threatLevel", "threatAlert", "opforFaction"],
    });
  }

  /** @returns {number} Current threat level (0-9) */
  get level() { return this.getSetting("threatLevel"); }

  /** @returns {boolean} Whether alert is active */
  get alert() { return this.getSetting("threatAlert"); }

  /** @returns {string} Current faction key */
  get faction() { return this.getSetting("opforFaction") || ""; }

  /** @returns {boolean} Whether a faction is selected */
  get hasFaction() { return !!this.faction; }

  /**
   * Set the threat level (clamped 0-9). Disables alert if set to 0.
   * @param {number} value
   */
  async setLevel(value) {
    const clamped = Math.clamp(value, 0, 9);
    await this.setSetting("threatLevel", clamped);
    if (clamped === 0 && this.alert) await this.toggleAlert();
  }

  /** Toggle the alert state. */
  async toggleAlert() {
    await this.setSetting("threatAlert", !this.alert);
  }

  /** @override — always visible (beacon renders inactive state) */
  async isVisible() { return true; }

  /** @override */
  async buildHTML() {
    const level = this.level;
    const isActive = level > 0;
    const isAlert = this.alert;

    const el = this.el;
    if (el) {
      el.className = `haywire-threat ${isActive ? "active" : "inactive"}${isAlert ? " alert" : ""}`;
    }

    const factionBtn = !isActive && this.isGM
      ? `<button class="haywire-threat-btn haywire-threat-faction-btn" title="${this.i18n("HAYWIRE.Threat.FactionHint")}"><i class="fas fa-skull-crossbones"></i></button>`
      : "";

    return `
      <div class="haywire-threat-beacon">
        <div class="haywire-threat-beacon-base"></div>
        <div class="haywire-threat-beacon-collar"></div>
        <div class="haywire-threat-beacon-dome"></div>
        <div class="haywire-threat-beacon-glow"></div>
        <div class="haywire-threat-level">${isActive ? level : "—"}</div>
        ${isActive && this.isGM ? `<button class="haywire-threat-d20" title="${this.i18n("HAYWIRE.Threat.RollTable")}"><i class="fas fa-dice-d20"></i></button>` : ""}
      </div>
      ${this.isGM ? `<div class="haywire-threat-controls">
        <button class="haywire-threat-btn" data-action="decrease" title="${this.i18n("HAYWIRE.Threat.Decrease")}" ${level <= 0 ? "disabled" : ""}>
          <i class="fas fa-minus"></i>
        </button>
        <button class="haywire-threat-btn" data-action="increase" title="${this.i18n("HAYWIRE.Threat.Increase")}" ${level >= 9 || !this.hasFaction ? "disabled" : ""}>
          <i class="fas fa-plus"></i>
        </button>
        <button class="haywire-threat-btn haywire-threat-alert-btn ${isAlert ? "active" : ""}" data-action="alert" title="${this.i18n("HAYWIRE.Threat.Alert")}" ${!isActive ? "disabled" : ""}>
          <i class="fas fa-bell"></i>
        </button>
        ${factionBtn}
      </div>` : ""}`;
  }

  /** @override */
  bindEvents() {
    this.el?.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "increase") this.setLevel(this.level + 1);
        else if (action === "decrease") this.setLevel(this.level - 1);
        else if (action === "alert") this.toggleAlert();
      });
    });

    this.el?.querySelector(".haywire-threat-d20")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#rollThreatTable();
    });

    this.el?.querySelector(".haywire-threat-faction-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#showFactionDialog();
    });

    const beacon = this.el?.querySelector(".haywire-threat-beacon");
    beacon?.addEventListener("mouseenter", () => this.#showCard());
    beacon?.addEventListener("mouseleave", () => this.hidePreview());
  }

  /* ─── Private ────────────────────────────────────────────────────────── */

  #showCard() {
    const level = this.level;
    if (level <= 0) return;

    const pathPrefix = FACTION_THREAT_PATHS[this.faction];
    if (!pathPrefix) return;

    const src = `${pathPrefix}${String(level).padStart(2, "0")}.webp`;
    this.showPreview(src, `Threat Level ${level}`);
  }

  async #rollThreatTable() {
    const level = this.level;
    const prefix = FACTION_THREAT_TABLES[this.faction];
    if (!prefix || level <= 0) return;
    try {
      await rollCompendiumTable(`${prefix} ${level}`);
    } catch (err) {
      console.error("haywire | ThreatOverlay: rollThreatTable failed", err);
    }
  }

  async #showFactionDialog() {
    const pack = game.packs.get(COMPENDIUM_PACKS.opforSupport);
    if (!pack) {
      ui.notifications.error(`Compendium ${COMPENDIUM_PACKS.opforSupport} not found.`);
      return;
    }

    let index;
    try {
      index = await pack.getIndex({ fields: ["folder"] });
    } catch (err) {
      console.error("haywire | ThreatOverlay: failed to load compendium index", err);
      ui.notifications.error("Failed to load opfor-support compendium.");
      return;
    }

    const folders = pack.folders;
    if (!folders.size) {
      ui.notifications.warn("No folders found in opfor-support compendium.");
      return;
    }

    /** @type {import("foundry").DialogV2Button[]} */
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
      window: { title: this.i18n("HAYWIRE.Threat.ImportFaction") },
      content: `<p>${this.i18n("HAYWIRE.Threat.FactionHint")}</p>`,
      buttons,
    });
  }

  /**
   * Import all support cards from a faction folder into the opfor support overlay.
   * @param {Collection} index - Compendium index
   * @param {Folder} folder - Faction folder
   */
  async #importFaction(index, folder) {
    const entries = index.filter((e) => e.folder === folder._id);
    if (!entries.length) {
      ui.notifications.warn(`No cards found in folder "${folder.name}".`);
      return;
    }

    const factionKey = FACTION_FOLDER_TO_KEY[folder.name];
    if (!factionKey) {
      console.warn(`haywire | ThreatOverlay: unknown faction folder "${folder.name}"`);
      return;
    }

    try {
      await this.setSetting("opforFaction", factionKey);
      if (this.level === 0) await this.setLevel(1);
      await opforSupportOverlay.setCardEntries([]);
      const uuids = entries.map((e) => `Compendium.${COMPENDIUM_PACKS.opforSupport}.Item.${e._id}`);
      await opforSupportOverlay.addCards(uuids);
      ui.notifications.info(`${entries.length} ${folder.name} support cards imported.`);
    } catch (err) {
      console.error(`haywire | ThreatOverlay: importFaction failed for "${folder.name}"`, err);
      ui.notifications.error("Failed to import faction support cards.");
    }
  }
}

export default new ThreatOverlay();
