export class HaywireActor extends Actor {

  // Conditions synchro sheet ↔ token (hors suppressed/pinned qui sont gérés via suppression)
  static TOKEN_CONDITIONS = ["downed", "hidden", "injured", "overwatch"];

  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === "soldier") this._prepareSoldierData();
  }

  _prepareSoldierData() {
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

    // Apply suppression → conditions (pinned supersedes suppressed)
    if (system.suppression >= 6) {
      system.conditions.add("pinned");
      system.conditions.delete("suppressed");
    } else if (system.suppression >= 3) {
      system.conditions.add("suppressed");
      system.conditions.delete("pinned");
    } else {
      system.conditions.delete("pinned");
      system.conditions.delete("suppressed");
    }

    // AP = HP - pénalité conditions (suppressed: -1, pinned: -2)
    let apPenalty = 0;
    if (system.conditions.has("pinned")) apPenalty = 2;
    else if (system.conditions.has("suppressed")) apPenalty = 1;
    system.actionPoints = Math.max(0, system.hitPoints.value - apPenalty);
  }

  /* ---------------------------------------- */
  /*  Conditions ↔ Token Status Effects Sync  */
  /* ---------------------------------------- */

  async toggleStatusEffect(statusId, options = {}) {
    // Suppression levels (sup-1 à sup-6) : clic token → set suppression value
    if (statusId.startsWith("sup-")) {
      const level = parseInt(statusId.split("-")[1], 10);
      const newSuppression = this.system.suppression === level ? 0 : level;
      await this.update({ "system.suppression": newSuppression });
      return;
    }

    // Suppressed/pinned via la fiche → route vers suppression value
    if (statusId === "suppressed") {
      const shouldBeActive = options.active ?? !this.system.conditions.has("suppressed");
      const newSuppression = shouldBeActive ? Math.max(this.system.suppression, 3) : Math.min(this.system.suppression, 2);
      await this.update({ "system.suppression": newSuppression });
      return;
    }
    if (statusId === "pinned") {
      const shouldBeActive = options.active ?? !this.system.conditions.has("pinned");
      const newSuppression = shouldBeActive ? Math.max(this.system.suppression, 6) : Math.min(this.system.suppression, 5);
      await this.update({ "system.suppression": newSuppression });
      return;
    }

    // Conditions Haywire standard (downed, hidden, injured, overwatch)
    if (!HaywireActor.TOKEN_CONDITIONS.includes(statusId)) {
      return super.toggleStatusEffect(statusId, options);
    }

    const isActive = this.statuses.has(statusId);
    const shouldBeActive = options.active ?? !isActive;
    if (isActive === shouldBeActive) return;

    const conditions = new Set(this.system.conditions);
    if (shouldBeActive) conditions.add(statusId);
    else conditions.delete(statusId);

    const updateData = { "system.conditions": [...conditions] };

    // Sync mécanique inverse : injured → HP=1, downed → HP=0
    if (shouldBeActive && statusId === "injured") {
      updateData["system.hitPoints.value"] = 1;
    } else if (shouldBeActive && statusId === "downed") {
      updateData["system.hitPoints.value"] = 0;
    }

    await this.update(updateData);
  }

  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    if (this.type !== "soldier" || userId !== game.user.id) return;

    // Sync token seulement si conditions ou suppression ont changé
    const s = changed.system;
    if (!s) return;
    if (s.conditions !== undefined || s.suppression !== undefined || s.hitPoints !== undefined) {
      this._syncTokenConditions();
    }
  }

  async _syncTokenConditions() {
    const toggles = [];

    // Sync conditions standard (downed, hidden, injured, overwatch)
    for (const id of HaywireActor.TOKEN_CONDITIONS) {
      const hasCondition = this.system.conditions.has(id);
      const hasEffect = this.statuses.has(id);
      if (hasCondition !== hasEffect) {
        toggles.push(Actor.prototype.toggleStatusEffect.call(this, id, { active: hasCondition }));
      }
    }

    // Sync suppression level marker (seul le niveau actuel est visible)
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
