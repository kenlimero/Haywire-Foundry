/**
 * Token hover overlay — affiche un résumé de l'actor au survol d'un token.
 * - Soldier (card view) : image de classe
 * - Soldier (sheet view) : stats compactes
 * - OPFOR (card view) : cardImage
 * - OPFOR (sheet view) : stats compactes (combat stats, armes, skills)
 */
import { conditionLabel } from "./sheets/sheet-helpers.mjs";
import { getOrCreateElement } from "./overlay-helpers.mjs";

const i18n = (key) => game.i18n.localize(key);

/** Render combat stats thresholds HTML. */
function renderCombatStats(combatStats) {
  if (!combatStats) return "";
  return `<div class="haywire-overlay-combat">
    <div class="haywire-threshold"><span class="haywire-threshold-label">${i18n("HAYWIRE.CombatStats.Easy")}</span><span class="haywire-threshold-value">${combatStats.easy}</span></div>
    <div class="haywire-threshold"><span class="haywire-threshold-label">${i18n("HAYWIRE.CombatStats.Medium")}</span><span class="haywire-threshold-value">${combatStats.medium}</span></div>
    <div class="haywire-threshold"><span class="haywire-threshold-label">${i18n("HAYWIRE.CombatStats.Hard")}</span><span class="haywire-threshold-value">${combatStats.hard}</span></div>
  </div>`;
}

/** Render weapon table rows from resolved weapon documents. */
function renderWeaponRows(weapons) {
  const rows = weapons
    .filter((w) => w)
    .map((w) => `<tr><td>${w.name}</td><td>${i18n(`HAYWIRE.WeaponType.${w.system.weaponType}`)}</td><td>${w.system.range}</td><td>${w.system.rateOfFire}</td><td>${w.system.modifiers}</td></tr>`)
    .join("");
  if (!rows) return "";
  return `<table class="haywire-overlay-weapons"><thead><tr><th>${i18n("HAYWIRE.Name")}</th><th>${i18n("HAYWIRE.Type")}</th><th>${i18n("HAYWIRE.Range")}</th><th>${i18n("HAYWIRE.RateOfFire")}</th><th>${i18n("HAYWIRE.Modifiers")}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/** Render skill list HTML from resolved skill documents. */
function renderSkills(skills) {
  const html = skills
    .filter((s) => s)
    .map((s) => `<div class="haywire-overlay-skill"><strong>${s.name}</strong><br/><span class="haywire-overlay-skill-desc">${s.system?.description ?? ""}</span></div>`)
    .join("");
  if (!html) return "";
  return `<div class="haywire-overlay-section"><label>${i18n("HAYWIRE.Skills")}</label>${html}</div>`;
}

/** Render condition badges HTML from conditions Set. */
function renderConditions(conditions) {
  const list = [...conditions];
  if (!list.length) return "";
  const badges = list
    .map((c) => `<span class="haywire-condition-badge haywire-condition-${c}">${conditionLabel(c)}</span>`)
    .join("");
  return `<div class="haywire-overlay-conditions">${badges}</div>`;
}

export class TokenOverlay {
  static #el = null;
  static #currentTokenId = null;

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

  static get currentTokenId() {
    return this.#currentTokenId;
  }

  static hide() {
    this.#currentTokenId = null;
    if (this.#el) {
      this.#el.classList.remove("visible");
    }
  }


  /* ---- OPFOR ---- */

  static async #renderOpfor(actor) {
    const hasCard = !!actor.system.cardImage;
    const cardView = hasCard && (actor.getFlag("haywire", "cardView") ?? true);

    if (cardView) {
      return `<img src="${actor.system.cardImage}" alt="${actor.name}" class="haywire-overlay-opfor" />`;
    }

    const system = actor.system;
    const [weapons, skills] = await Promise.all([
      Promise.all((system.weaponIds ?? []).map((uuid) => fromUuid(uuid))),
      Promise.all((system.opforSkillIds ?? []).map((uuid) => fromUuid(uuid))),
    ]);

    const behavior = system.behavior?.trim();
    const leftCol = `
      <div class="haywire-overlay-col">
        <div class="haywire-overlay-header">${actor.name}${system.faction ? ` <span class="haywire-overlay-faction">${system.faction}</span>` : ""}</div>
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

  static async #renderSoldier(actor) {
    const cardView = actor.getFlag("haywire", "cardView") ?? false;
    if (cardView) {
      const classId = actor.system.classId;
      if (!classId) return "";
      const classItem = await fromUuid(classId);
      const img = classItem?.system?.imagePath;
      return img ? `<img src="${img}" alt="${actor.name}" />` : "";
    }

    const system = actor.system;
    const classItem = system.classId ? await fromUuid(system.classId) : null;
    const combatStats = classItem?.type === "class" ? classItem.system.combatStats : system.combatStats;

    const excludedWeapons = system.excludedWeaponIds ?? [];
    const classWeaponIds = (classItem?.system?.defaultWeapons ?? []).filter((id) => !excludedWeapons.includes(id));
    const allWeaponUuids = [...classWeaponIds, ...system.weaponIds];

    const excludedSkills = system.excludedSkillIds ?? [];
    const classSkillIds = (classItem?.system?.skillIds ?? []).filter((id) => !excludedSkills.includes(id));
    const allSkillUuids = [...classSkillIds, ...(system.skillIds ?? [])];

    const [weapons, skills] = await Promise.all([
      Promise.all(allWeaponUuids.map((uuid) => fromUuid(uuid))),
      Promise.all(allSkillUuids.map((uuid) => fromUuid(uuid))),
    ]);

    return `
      <div class="haywire-overlay-stats">
        <div class="haywire-overlay-header">${actor.name}</div>
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
