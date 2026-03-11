/**
 * Custom Actor class for the Haywire system.
 * Manages soldier and opfor-unit derived data, conditions, and token sync.
 * @extends Actor
 */
export class HaywireActor extends Actor {

  /** Conditions synced between sheet and token (excluding suppressed/pinned managed via suppression). */
  static TOKEN_CONDITIONS = ["downed", "hidden", "injured", "overwatch"];

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === "soldier") this.#prepareSoldierData();
    else if (this.type === "opfor-unit") this.#prepareOpforData();
  }

  #prepareSoldierData() {
    const system = this.system;

    // Clamp HP to max
    system.hitPoints.value = Math.clamp(system.hitPoints.value, 0, system.hitPoints.max);

    // Legacy cleanup: remove "stunned" from actors created before condition rework
    system.conditions.delete("stunned");

    // Wound track: MAX HP → injured (1 HP) → downed (0 HP), mutually exclusive
    if (system.hitPoints.value <= 0) {
      system.conditions.add("downed");
      system.conditions.delete("injured");
    } else if (system.hitPoints.value < system.hitPoints.max) {
      system.conditions.add("injured");
      system.conditions.delete("downed");
    } else {
      system.conditions.delete("injured");
      system.conditions.delete("downed");
    }

    // Suppression → conditions
    this.#applySuppression();

    // AP = HP - penalty from suppression conditions (suppressed: -1, pinned: -2)
    let apPenalty = 0;
    if (system.conditions.has("pinned")) apPenalty = 2;
    else if (system.conditions.has("suppressed")) apPenalty = 1;
    system.actionPoints.max = system.hitPoints.max;
    system.actionPoints.value = Math.max(0, system.hitPoints.value - apPenalty);
  }

  #prepareOpforData() {
    this.#applySuppression();
  }

  /**
   * Apply suppression level → conditions (pinned supersedes suppressed).
   * Shared between soldier and opfor-unit.
   */
  #applySuppression() {
    const system = this.system;
    const suppression = system.suppression;

    if (suppression >= 6) {
      system.conditions.add("pinned");
      system.conditions.delete("suppressed");
    } else if (suppression >= 3) {
      system.conditions.add("suppressed");
      system.conditions.delete("pinned");
    } else {
      system.conditions.delete("pinned");
      system.conditions.delete("suppressed");
    }
  }

  /* ---------------------------------------- */
  /*  Conditions ↔ Token Status Effects Sync  */
  /* ---------------------------------------- */

  /**
   * Toggle a status effect on this actor.
   * Routes suppression-related statuses through the suppression value,
   * and Haywire conditions through the conditions set.
   * @param {string} statusId - The status effect ID
   * @param {object} [options={}] - Options including {active: boolean}
   * @override
   */
  async toggleStatusEffect(statusId, options = {}) {
    // Suppression levels (sup-1 to sup-6): token click → set suppression value
    if (statusId.startsWith("sup-")) {
      const level = parseInt(statusId.split("-")[1], 10);
      if (Number.isNaN(level) || level < 1 || level > 6) return;
      const newSuppression = this.system.suppression === level ? 0 : level;
      await this.update({ "system.suppression": newSuppression });
      return;
    }

    // Suppressed/pinned via sheet → route to suppression value
    if (statusId === "suppressed" || statusId === "pinned") {
      const threshold = statusId === "pinned" ? 6 : 3;
      const shouldBeActive = options.active ?? !this.system.conditions.has(statusId);
      const newSuppression = shouldBeActive
        ? Math.max(this.system.suppression, threshold)
        : Math.min(this.system.suppression, threshold - 1);
      await this.update({ "system.suppression": newSuppression });
      return;
    }

    // Standard Haywire conditions (downed, hidden, injured, overwatch)
    if (!HaywireActor.TOKEN_CONDITIONS.includes(statusId)) {
      return super.toggleStatusEffect(statusId, options);
    }

    const isActive = this.statuses.has(statusId);
    const shouldBeActive = options.active ?? !isActive;
    if (isActive === shouldBeActive) return;

    const conditions = new Set(this.system.conditions);
    if (shouldBeActive) conditions.add(statusId);
    else conditions.delete(statusId);

    /** @type {Record<string, unknown>} */
    const updateData = { "system.conditions": [...conditions] };

    // Inverse mechanic sync: toggle condition ↔ HP (soldiers only)
    if (this.type === "soldier") {
      if (statusId === "injured") {
        updateData["system.hitPoints.value"] = shouldBeActive ? 1 : this.system.hitPoints.max;
      } else if (statusId === "downed") {
        updateData["system.hitPoints.value"] = shouldBeActive ? 0 : 1;
      }
    }

    await this.update(updateData);
  }

  /**
   * After update, sync token status effects if conditions/suppression/HP changed.
   * @override
   */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    if (!["soldier", "opfor-unit"].includes(this.type) || userId !== game.user.id) return;

    const s = changed.system;
    if (!s) return;
    if (s.conditions !== undefined || s.suppression !== undefined || s.hitPoints !== undefined) {
      this.#syncTokenConditions();
    }
  }

  /**
   * Synchronize all token status effects to match current actor conditions and suppression.
   */
  async #syncTokenConditions() {
    const toggles = [];

    // Sync standard conditions (downed, hidden, injured, overwatch)
    for (const id of HaywireActor.TOKEN_CONDITIONS) {
      const hasCondition = this.system.conditions.has(id);
      const hasEffect = this.statuses.has(id);
      if (hasCondition !== hasEffect) {
        toggles.push(Actor.prototype.toggleStatusEffect.call(this, id, { active: hasCondition }));
      }
    }

    // Sync suppression level marker (only the current level is visible)
    const suppression = Math.min(this.system.suppression, 6);
    for (let i = 1; i <= 6; i++) {
      const id = `sup-${i}`;
      const shouldBeActive = suppression > 0 && i === suppression;
      const hasEffect = this.statuses.has(id);
      if (shouldBeActive !== hasEffect) {
        toggles.push(Actor.prototype.toggleStatusEffect.call(this, id, { active: shouldBeActive }));
      }
    }

    if (toggles.length) await Promise.all(toggles);
  }
}
