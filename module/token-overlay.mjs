/**
 * Token hover overlay — affiche un résumé de l'actor au survol d'un token.
 * - Soldier (card view) : image de classe
 * - Soldier (sheet view) : stats compactes
 * - OPFOR (card view) : cardImage
 * - OPFOR (sheet view) : stats compactes (combat stats, armes, skills)
 * @module token-overlay
 */
import { conditionLabel } from "./sheets/sheet-helpers.mjs";
import { getOrCreateElement, escapeHtml } from "./overlay-helpers.mjs";

/** @param {string} key - i18n key */
const i18n = (key) => game.i18n.localize(key);

/**
 * Render combat stats thresholds HTML.
 * @param {{ easy: number, medium: number, hard: number } | null} combatStats
 * @returns {string} HTML string
 */
function renderCombatStats(combatStats) {
  if (!combatStats) return "";
  return `<div class="haywire-overlay-combat">
    <div class="haywire-threshold"><span class="haywire-threshold-label">${i18n("HAYWIRE.CombatStats.Easy")}</span><span class="haywire-threshold-value">${combatStats.easy}</span></div>
    <div class="haywire-threshold"><span class="haywire-threshold-label">${i18n("HAYWIRE.CombatStats.Medium")}</span><span class="haywire-threshold-value">${combatStats.medium}</span></div>
    <div class="haywire-threshold"><span class="haywire-threshold-label">${i18n("HAYWIRE.CombatStats.Hard")}</span><span class="haywire-threshold-value">${combatStats.hard}</span></div>
  </div>`;
}

/**
 * Render weapon table rows from resolved weapon documents.
 * @param {Array<object|null>} weapons - Resolved weapon documents
 * @returns {string} HTML string
 */
function renderWeaponRows(weapons) {
  const rows = weapons
    .filter((w) => w)
    .map((w) => `<tr><td>${escapeHtml(w.name)}</td><td>${i18n(`HAYWIRE.WeaponType.${w.system.weaponType}`)}</td><td>${w.system.range}</td><td>${w.system.rateOfFire}</td><td>${w.system.modifiers}</td></tr>`)
    .join("");
  if (!rows) return "";
  return `<table class="haywire-overlay-weapons"><thead><tr><th>${i18n("HAYWIRE.Name")}</th><th>${i18n("HAYWIRE.Type")}</th><th>${i18n("HAYWIRE.Range")}</th><th>${i18n("HAYWIRE.RateOfFire")}</th><th>${i18n("HAYWIRE.Modifiers")}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/**
 * Render skill list HTML from resolved skill documents.
 * @param {Array<object|null>} skills - Resolved skill documents
 * @returns {string} HTML string
 */
function renderSkills(skills) {
  const html = skills
    .filter((s) => s)
    .map((s) => `<div class="haywire-overlay-skill"><strong>${escapeHtml(s.name)}</strong><br/><span class="haywire-overlay-skill-desc">${s.system?.description ?? ""}</span></div>`)
    .join("");
  if (!html) return "";
  return `<div class="haywire-overlay-section"><label>${i18n("HAYWIRE.Skills")}</label>${html}</div>`;
}

/**
 * Render condition badges HTML from conditions Set.
 * @param {Set<string>} conditions
 * @returns {string} HTML string
 */
function renderConditions(conditions) {
  const list = [...conditions];
  if (!list.length) return "";
  const badges = list
    .map((c) => `<span class="haywire-condition-badge haywire-condition-${c}">${conditionLabel(c)}</span>`)
    .join("");
  return `<div class="haywire-overlay-conditions">${badges}</div>`;
}

/**
 * Token hover overlay — shows actor summary on token hover.
 */
export class TokenOverlay {
  static #el = null;
  /** @type {string|null} */
  static #currentTokenId = null;

  /**
   * Show the overlay for a hovered token.
   * @param {Token} token - The hovered token PlaceableObject
   */
  static async show(token) {
    const actor = token.actor;
    if (!actor) return;

    if (this.#currentTokenId === token.id) return;
    this.#currentTokenId = token.id;

    this.#el = getOrCreateElement(this.#el, "haywire-token-overlay");
    const el = this.#el;

    let html = "";
    if (actor.type === "opfor-unit") {
      html = await this.#renderOpfor(actor);
    } else if (actor.type === "soldier") {
      html = await this.#renderSoldier(actor);
    }

    if (!html) {
      this.hide();
      return;
    }

    el.innerHTML = html;
    const isOpfor = actor.type === "opfor-unit";
    const isOpforCard = isOpfor
      && (actor.getFlag("haywire", "cardView") ?? true)
      && !!actor.system.cardImage;
    const isOpforWide = isOpfor && !isOpforCard && !!actor.system.behavior?.trim();
    el.classList.toggle("opfor", isOpforCard);
    el.classList.toggle("opfor-wide", isOpforWide);
    el.classList.add("visible");
  }

  /** @returns {string|null} ID of the currently displayed token */
  static get currentTokenId() {
    return this.#currentTokenId;
  }

  /** Hide the overlay. */
  static hide() {
    this.#currentTokenId = null;
    if (this.#el) {
      this.#el.classList.remove("visible");
    }
  }

  /* ---- OPFOR ---- */

  /**
   * @param {Actor} actor
   * @returns {Promise<string>} HTML content
   */
  static async #renderOpfor(actor) {
    const hasCard = !!actor.system.cardImage;
    const cardView = hasCard && (actor.getFlag("haywire", "cardView") ?? true);

    if (cardView) {
      return `<img src="${escapeHtml(actor.system.cardImage)}" alt="${escapeHtml(actor.name)}" class="haywire-overlay-opfor" />`;
    }

    const system = actor.system;
    const safeResolve = (uuid) => fromUuid(uuid).catch(() => null);
    const [weapons, skills] = await Promise.all([
      Promise.all((system.weaponIds ?? []).map(safeResolve)),
      Promise.all((system.opforSkillIds ?? []).map(safeResolve)),
    ]);

    const behavior = system.behavior?.trim();
    const leftCol = `
      <div class="haywire-overlay-col">
        <div class="haywire-overlay-header">${escapeHtml(actor.name)}${system.faction ? ` <span class="haywire-overlay-faction">${escapeHtml(system.faction)}</span>` : ""}</div>
        ${renderConditions(system.conditions)}
        ${renderCombatStats(system.combatStats)}
        ${renderSkills(skills)}
        ${renderWeaponRows(weapons)}
      </div>`;

    const rightCol = behavior
      ? `<div class="haywire-overlay-col haywire-overlay-behavior">
          <label>${i18n("HAYWIRE.Behavior")}</label>
          <div class="haywire-overlay-behavior-content">${behavior}</div>
        </div>`
      : "";

    return `<div class="haywire-overlay-stats ${behavior ? "haywire-overlay-two-col" : ""}">${leftCol}${rightCol}</div>`;
  }

  /* ---- Soldier ---- */

  /**
   * @param {Actor} actor
   * @returns {Promise<string>} HTML content
   */
  static async #renderSoldier(actor) {
    const cardView = actor.getFlag("haywire", "cardView") ?? false;
    if (cardView) {
      const classId = actor.system.classId;
      if (!classId) return "";
      const classItem = await fromUuid(classId).catch(() => null);
      const img = classItem?.system?.imagePath;
      return img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(actor.name)}" />` : "";
    }

    const system = actor.system;
    const classItem = system.classId ? await fromUuid(system.classId).catch(() => null) : null;
    const combatStats = classItem?.type === "class" ? classItem.system.combatStats : system.combatStats;

    const excludedWeapons = new Set(system.excludedWeaponIds ?? []);
    const classWeaponIds = (classItem?.system?.defaultWeapons ?? []).filter((id) => !excludedWeapons.has(id));
    const allWeaponUuids = [...classWeaponIds, ...system.weaponIds];

    const excludedSkills = new Set(system.excludedSkillIds ?? []);
    const classSkillIds = (classItem?.system?.skillIds ?? []).filter((id) => !excludedSkills.has(id));
    const allSkillUuids = [...classSkillIds, ...(system.skillIds ?? [])];

    const safeResolve = (uuid) => fromUuid(uuid).catch(() => null);
    const [weapons, skills] = await Promise.all([
      Promise.all(allWeaponUuids.map(safeResolve)),
      Promise.all(allSkillUuids.map(safeResolve)),
    ]);

    return `
      <div class="haywire-overlay-stats">
        <div class="haywire-overlay-header">${escapeHtml(actor.name)}</div>
        <div class="haywire-overlay-bars">
          <span class="haywire-overlay-stat">${i18n("HAYWIRE.HitPoints")}: ${system.hitPoints.value}/${system.hitPoints.max}</span>
          <span class="haywire-overlay-stat">${i18n("HAYWIRE.ActionPoints")}: ${system.actionPoints.value}</span>
        </div>
        ${renderConditions(system.conditions)}
        ${renderCombatStats(combatStats)}
        ${renderSkills(skills)}
        ${renderWeaponRows(weapons)}
      </div>`;
  }
}
