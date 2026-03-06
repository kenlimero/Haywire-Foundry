/**
 * Utilitaire de jets de dés pour le système Haywire.
 * Encapsule la Roll API native de FoundryVTT.
 */
export class HaywireRoll {

  /**
   * Effectue un jet de D20 basique et envoie le résultat au chat.
   * @param {object} options
   * @param {Actor} options.actor - L'Actor Soldier qui effectue le jet
   * @param {string} [options.label] - Le flavor text affiché dans le chat
   * @returns {Promise<Roll>} Le Roll évalué
   */
  static async d20({ actor, label } = {}) {
    if (!actor) throw new Error("HaywireRoll.d20 requires an actor");

    const roll = new Roll("1d20");
    await roll.evaluate();

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: label ?? game.i18n.localize("HAYWIRE.RollD20"),
    });

    return roll;
  }

  /**
   * Effectue un jet de tir avec une arme et envoie le résultat au chat.
   * @param {object} options
   * @param {Actor} options.actor - L'Actor Soldier qui tire
   * @param {Item} options.weapon - L'Item Weapon utilisé pour le tir
   * @returns {Promise<Roll>} Le Roll évalué
   */
  static async shoot({ actor, weapon } = {}) {
    if (!actor) throw new Error("HaywireRoll.shoot requires an actor");
    if (!weapon) throw new Error("HaywireRoll.shoot requires a weapon");

    const mod = weapon.system.modifiers ?? 0;
    const formula = mod !== 0 ? "1d20 + @mod" : "1d20";
    const roll = new Roll(formula, { mod });
    await roll.evaluate();

    // Résoudre les seuils de combat depuis la classe
    const classId = actor.system.classId;
    const classItem = classId ? (await fromUuid(classId)) : null;
    const combatStats = classItem?.system?.combatStats ?? { easy: "—", medium: "—", hard: "—" };

    // Préparer les données du template
    const templateData = {
      weaponName: weapon.name,
      formula: roll.formula,
      dieResult: roll.dice[0]?.total ?? roll.total,
      modifier: mod,
      modifierSign: mod >= 0 ? `+${mod}` : `${mod}`,
      total: roll.total,
      thresholds: {
        easy: combatStats.easy,
        medium: combatStats.medium,
        hard: combatStats.hard,
      },
    };

    // Rendre le template chat
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/haywire/templates/chat/roll-result.hbs",
      templateData,
    );

    // Créer le message de chat avec le roll attaché (pour Dice So Nice)
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: game.i18n.format("HAYWIRE.ShootWith", { weapon: weapon.name }),
      content,
      rolls: [roll],
      sound: CONFIG.sounds.dice,
    });

    return roll;
  }
}
