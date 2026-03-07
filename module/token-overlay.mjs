/**
 * Token hover overlay — affiche un résumé de l'actor au survol d'un token.
 * - Soldier (card view) : image de classe
 * - Soldier (sheet view) : stats compactes
 * - OPFOR : cardImage
 */
export class TokenOverlay {
  static #el = null;
  static #currentTokenId = null;

  static async show(token) {
    const actor = token.actor;
    if (!actor) return;

    // Éviter de re-render si on survole le même token
    if (this.#currentTokenId === token.id) return;
    this.#currentTokenId = token.id;

    const el = this.#getOrCreate();

    let html = "";
    if (actor.type === "opfor-unit") {
      html = this.#renderOpfor(actor);
    } else if (actor.type === "soldier") {
      html = await this.#renderSoldier(actor);
    }

    if (!html) {
      this.hide();
      return;
    }

    el.innerHTML = html;
    el.classList.toggle("opfor", actor.type === "opfor-unit");
    el.classList.add("visible");
  }

  static hide() {
    this.#currentTokenId = null;
    if (this.#el) {
      this.#el.classList.remove("visible");
    }
  }

  static #getOrCreate() {
    if (!this.#el) {
      this.#el = document.createElement("div");
      this.#el.id = "haywire-token-overlay";
      document.body.appendChild(this.#el);
    }
    return this.#el;
  }

  /* ---- OPFOR ---- */

  static #renderOpfor(actor) {
    const img = actor.system.cardImage;
    if (!img) return "";
    return `<img src="${img}" alt="${actor.name}" class="haywire-overlay-opfor" />`;
  }

  /* ---- Soldier ---- */

  static async #renderSoldier(actor) {
    const cardView = game.settings.get("haywire", "soldierCardView");

    if (cardView) {
      return this.#renderSoldierCard(actor);
    }
    return this.#renderSoldierStats(actor);
  }

  static async #renderSoldierCard(actor) {
    const classId = actor.system.classId;
    if (!classId) return "";
    const classItem = await fromUuid(classId);
    const img = classItem?.system?.imagePath;
    if (!img) return "";
    return `<img src="${img}" alt="${actor.name}" />`;
  }

  static async #renderSoldierStats(actor) {
    const system = actor.system;

    // Résoudre la classe pour les combat stats et les armes
    const classItem = system.classId ? await fromUuid(system.classId) : null;
    const combatStats = classItem?.type === "class" ? classItem.system.combatStats : system.combatStats;

    // Résoudre les armes
    const excludedWeapons = system.excludedWeaponIds ?? [];
    const classWeaponIds = (classItem?.system?.defaultWeapons ?? []).filter(id => !excludedWeapons.includes(id));
    const allWeaponUuids = [...classWeaponIds, ...system.weaponIds];
    const weapons = await Promise.all(allWeaponUuids.map(uuid => fromUuid(uuid)));

    // Conditions
    const conditions = [...system.conditions];
    const conditionLabel = c => game.i18n.localize(`HAYWIRE.Conditions.${c.charAt(0).toUpperCase() + c.slice(1)}`);

    // Construire le HTML
    const i18n = key => game.i18n.localize(key);
    const weaponRows = weapons
      .filter(w => w)
      .map(w => `<tr><td>${w.name}</td><td>${i18n(`HAYWIRE.WeaponType.${w.system.weaponType}`)}</td><td>${w.system.range}</td><td>${w.system.rateOfFire}</td><td>${w.system.modifiers}</td></tr>`)
      .join("");

    const conditionBadges = conditions
      .map(c => `<span class="haywire-condition-badge haywire-condition-${c}">${conditionLabel(c)}</span>`)
      .join("");

    const combatHtml = combatStats
      ? `<div class="haywire-overlay-combat">
          <div class="haywire-threshold"><span class="haywire-threshold-label">${i18n("HAYWIRE.CombatStats.Easy")}</span><span class="haywire-threshold-value">${combatStats.easy}</span></div>
          <div class="haywire-threshold"><span class="haywire-threshold-label">${i18n("HAYWIRE.CombatStats.Medium")}</span><span class="haywire-threshold-value">${combatStats.medium}</span></div>
          <div class="haywire-threshold"><span class="haywire-threshold-label">${i18n("HAYWIRE.CombatStats.Hard")}</span><span class="haywire-threshold-value">${combatStats.hard}</span></div>
        </div>`
      : "";

    return `
      <div class="haywire-overlay-stats">
        <div class="haywire-overlay-header">${actor.name}</div>
        <div class="haywire-overlay-bars">
          <span class="haywire-overlay-stat">${i18n("HAYWIRE.HitPoints")}: ${system.hitPoints.value}/${system.hitPoints.max}</span>
          <span class="haywire-overlay-stat">${i18n("HAYWIRE.ActionPoints")}: ${system.actionPoints.value}</span>
        </div>
        ${conditions.length ? `<div class="haywire-overlay-conditions">${conditionBadges}</div>` : ""}
        ${combatHtml}
        ${weaponRows ? `<table class="haywire-overlay-weapons"><thead><tr><th>${i18n("HAYWIRE.Name")}</th><th>${i18n("HAYWIRE.Type")}</th><th>${i18n("HAYWIRE.Range")}</th><th>${i18n("HAYWIRE.RateOfFire")}</th><th>${i18n("HAYWIRE.Modifiers")}</th></tr></thead><tbody>${weaponRows}</tbody></table>` : ""}
      </div>`;
  }
}
