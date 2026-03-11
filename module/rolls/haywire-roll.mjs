/**
 * Dice roll utilities for the Haywire system.
 * Wraps the native FoundryVTT Roll API.
 * @module haywire-roll
 */
export class HaywireRoll {

  /**
   * Roll a basic D20 and post the result to chat.
   * @param {object} options
   * @param {Actor} options.actor - The Actor performing the roll
   * @param {string} [options.label] - Flavor text for the chat message
   * @returns {Promise<Roll>} The evaluated Roll
   * @throws {Error} If actor is not provided
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
   * Roll a shoot action with a weapon and post the result to chat.
   * Resolves combat thresholds from the actor's class or direct stats.
   * @param {object} options
   * @param {Actor} options.actor - The Actor performing the shot
   * @param {Item} options.weapon - The Weapon Item used
   * @returns {Promise<Roll>} The evaluated Roll
   * @throws {Error} If actor or weapon is not provided
   */
  static async shoot({ actor, weapon } = {}) {
    if (!actor) throw new Error("HaywireRoll.shoot requires an actor");
    if (!weapon) throw new Error("HaywireRoll.shoot requires a weapon");

    const mod = weapon.system.modifiers ?? 0;
    const formula = mod !== 0 ? "1d20 + @mod" : "1d20";
    const roll = new Roll(formula, { mod });
    await roll.evaluate();

    // Resolve combat thresholds from class (soldier) or directly (opfor-unit)
    let combatStats = { easy: "—", medium: "—", hard: "—" };
    if (actor.system.combatStats?.easy) {
      combatStats = actor.system.combatStats;
    }
    const classId = actor.system.classId;
    if (classId) {
      try {
        const classItem = await fromUuid(classId);
        if (classItem?.system?.combatStats) combatStats = classItem.system.combatStats;
      } catch (err) {
        console.warn(`haywire | HaywireRoll.shoot: failed to resolve classId "${classId}"`, err);
      }
    }

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

    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/haywire/templates/chat/roll-result.hbs",
      templateData,
    );

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
