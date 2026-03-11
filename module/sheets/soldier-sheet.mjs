import {
  buildConditionsContext, resolveUuids, buildSkillsContext, buildWeaponsContext,
  bindConditionSelect, onRollD20, onRollShoot, onRemoveCondition, onOpenItem,
  registerItemHooks, unregisterItemHooks,
} from "./sheet-helpers.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Sheet for the Soldier actor type.
 * Supports sheet view and card view, lock toggle, drag-drop of class/weapon/skill/support items.
 * @extends ActorSheetV2
 */
export class SoldierSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/actor/soldier-sheet.hbs",
    },
    card: {
      template: "systems/haywire/templates/actor/soldier-card.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "actor", "soldier"],
    position: { width: 650, height: 550 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
    dragDrop: [{ dropSelector: null }],
    actions: {
      removeWeapon: SoldierSheet.#onRemoveWeapon,
      removeSkill: SoldierSheet.#onRemoveSkill,
      removeSupport: SoldierSheet.#onRemoveSupport,
      removeCondition: onRemoveCondition,
      openItem: onOpenItem,
      editPortrait: SoldierSheet.#onEditPortrait,
      rollD20: onRollD20,
      rollShoot: onRollShoot,
      toggleCardView: SoldierSheet.#onToggleCardView,
      toggleLock: SoldierSheet.#onToggleLock,
    },
  };

  /** @returns {boolean} Whether the sheet is locked */
  get _locked() {
    return this.actor.getFlag("haywire", "locked") ?? false;
  }

  /** @override */
  _getHeaderControls() {
    const controls = super._getHeaderControls();
    controls.unshift({
      icon: this._locked ? "fas fa-lock" : "fas fa-lock-open",
      label: this._locked ? "HAYWIRE.Unlock" : "HAYWIRE.Lock",
      action: "toggleLock",
    });
    const cardView = this.actor.getFlag("haywire", "cardView") ?? false;
    controls.unshift({
      icon: cardView ? "fas fa-sheet-plastic" : "fas fa-id-card",
      label: cardView ? "HAYWIRE.Settings.ShowSheet" : "HAYWIRE.Settings.ShowCard",
      action: "toggleCardView",
    });
    return controls;
  }

  static async #onToggleLock() {
    await this.actor.setFlag("haywire", "locked", !this._locked);
    this.render({ force: true, window: { controls: true } });
  }

  static async #onToggleCardView() {
    const current = this.actor.getFlag("haywire", "cardView") ?? false;
    await this.actor.setFlag("haywire", "cardView", !current);
    await this.close();
    this.render({ force: true });
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    const cardView = this.actor.getFlag("haywire", "cardView") ?? false;
    options.parts = cardView ? ["card"] : ["sheet"];
  }

  static async #onEditPortrait(event, target) {
    const tokenizer = game.modules.get("vtta-tokenizer");
    if (tokenizer?.active) {
      tokenizer.api.tokenizeActor(this.actor);
      return;
    }

    const fp = new FilePicker({
      type: "image",
      current: this.actor.img,
      callback: async (path) => {
        await this.actor.update({
          img: path,
          "prototypeToken.texture.src": path,
        });
      },
    });
    fp.render(true);
  }

  static async #onRemoveWeapon(event, target) {
    const uuid = target.dataset.weaponUuid;
    if (target.dataset.fromClass === "true") {
      const excluded = [...this.actor.system.excludedWeaponIds, uuid];
      await this.actor.update({ "system.excludedWeaponIds": excluded });
    } else {
      const weaponIds = this.actor.system.weaponIds.filter(id => id !== uuid);
      await this.actor.update({ "system.weaponIds": weaponIds });
    }
  }

  static async #onRemoveSkill(event, target) {
    const uuid = target.dataset.skillUuid;
    if (target.dataset.fromClass === "true") {
      const excluded = [...this.actor.system.excludedSkillIds, uuid];
      await this.actor.update({ "system.excludedSkillIds": excluded });
    } else {
      const skillIds = this.actor.system.skillIds.filter(id => id !== uuid);
      await this.actor.update({ "system.skillIds": skillIds });
    }
  }

  static async #onRemoveSupport(event, target) {
    const uuid = target.dataset.supportUuid;
    const supportIds = this.actor.system.supportIds.filter(id => id !== uuid);
    await this.actor.update({ "system.supportIds": supportIds });
  }

  /** @override */
  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    this._itemHooks = registerItemHooks(this, (item) => this.#isRelevantItem(item));
  }

  /**
   * Check if a changed item is relevant to this sheet's displayed data.
   * @param {Item} item - The item that was updated or deleted
   * @returns {boolean}
   */
  #isRelevantItem(item) {
    const system = this.actor.system;
    if (item.uuid === system.classId) return true;
    if (system.weaponIds.includes(item.uuid)) return true;
    if (system.skillIds.includes(item.uuid)) return true;
    if (system.supportIds.includes(item.uuid)) return true;
    if (this._classWeaponUuids?.includes(item.uuid)) return true;
    if (this._classSkillUuids?.includes(item.uuid)) return true;
    return false;
  }

  /** @override */
  _onClose(options) {
    super._onClose(options);
    unregisterItemHooks(this._itemHooks);
  }

  /* ---------------------------------------- */
  /*  Drag & Drop — References only           */
  /* ---------------------------------------- */

  /**
   * Handle item drops onto the soldier sheet.
   * @param {DragEvent} event - The drop event
   * @param {object} data - Drop data containing uuid
   * @returns {Promise<void|null>}
   * @override
   */
  async _onDropItem(event, data) {
    if (!this.isEditable || this._locked) return null;

    const uuid = data.uuid;
    const item = await fromUuid(uuid);
    if (!item) return null;

    switch (item.type) {
      case "class": return this.#onDropClassItem(item, uuid);
      case "weapon": return this.#onDropWeaponItem(item, uuid);
      case "skill": return this.#onDropSkillItem(item, uuid);
      case "support": return this.#onDropSupportItem(item, uuid);
      default:
        console.warn(`haywire | SoldierSheet: ${game.i18n.localize("HAYWIRE.InvalidDrop")} (type: ${item.type})`);
        return null;
    }
  }

  /**
   * @param {Item} item - The class item
   * @param {string} uuid - The class UUID
   */
  async #onDropClassItem(item, uuid) {
    const hadPreviousClass = !!this.actor.system.classId;

    /** @type {Record<string, unknown>} */
    const updateData = {
      "system.classId": uuid,
      "system.excludedWeaponIds": [],
      "system.excludedSkillIds": [],
    };
    if (item.system.combatStats) {
      updateData["system.combatStats.easy"] = item.system.combatStats.easy;
      updateData["system.combatStats.medium"] = item.system.combatStats.medium;
      updateData["system.combatStats.hard"] = item.system.combatStats.hard;
    }
    if (item.system.imagePath) {
      updateData.img = item.system.imagePath;
      updateData["prototypeToken.texture.src"] = item.system.imagePath;
    }
    await this.actor.update(updateData);

    const msgKey = hadPreviousClass ? "HAYWIRE.ClassReplaced" : "HAYWIRE.ClassAssigned";
    ui.notifications.info(game.i18n.format(msgKey, { name: item.name }));
  }

  async #onDropWeaponItem(_item, uuid) {
    if (this._classWeaponUuids?.includes(uuid)) return;
    if (this.actor.system.weaponIds.includes(uuid)) return;
    const weaponIds = [...this.actor.system.weaponIds, uuid];
    await this.actor.update({ "system.weaponIds": weaponIds });
  }

  async #onDropSkillItem(_item, uuid) {
    if (this._classSkillUuids?.includes(uuid)) return;
    if (this.actor.system.skillIds.includes(uuid)) return;
    const skillIds = [...this.actor.system.skillIds, uuid];
    await this.actor.update({ "system.skillIds": skillIds });
  }

  async #onDropSupportItem(_item, uuid) {
    if (this.actor.system.supportIds.includes(uuid)) return;
    const supportIds = [...this.actor.system.supportIds, uuid];
    await this.actor.update({ "system.supportIds": supportIds });
  }

  /* ---------------------------------------- */
  /*  Rendering & Visual Feedback             */
  /* ---------------------------------------- */

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    const cardView = this.actor.getFlag("haywire", "cardView") ?? false;
    this.setPosition(cardView ? { width: 400, height: 600 } : { width: 550, height: 550 });

    const dropZone = this.element.querySelector(".haywire-sheet-class-image");
    if (dropZone) {
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("haywire-drop-target");
      });
      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("haywire-drop-target");
      });
      dropZone.addEventListener("drop", () => {
        dropZone.classList.remove("haywire-drop-target");
      });
    }

    bindConditionSelect(this.element, this.actor, this.isEditable);
  }

  /**
   * Prepare render context: resolve class, weapons, skills, supports from UUIDs.
   * @override
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.isEditable = this.isEditable && !this._locked;

    // Resolve class by UUID (async to load full compendium data)
    const classId = context.system.classId;
    const classItem = classId ? (await fromUuid(classId)) : null;
    if (classId && !classItem) {
      console.warn(`haywire | SoldierSheet: classId "${classId}" introuvable pour actor "${this.actor.name}"`);
    }
    context.hasClass = !!classItem;
    context.className = classItem?.name ?? null;
    const defaultImg = "icons/svg/mystery-man.svg";
    const actorHasCustomImg = this.actor.img && this.actor.img !== defaultImg;
    context.classImage = actorHasCustomImg
      ? this.actor.img
      : (classItem?.system?.imagePath || null);
    context.classCardImage = classItem?.system?.imagePath || null;

    // CombatStats: use actor's (editable) values, fallback to class
    const actorStats = context.system.combatStats;
    const hasActorStats = actorStats.easy > 0 || actorStats.medium > 0 || actorStats.hard > 0;
    context.combatStats = hasActorStats
      ? actorStats
      : (classItem?.system?.combatStats ?? actorStats);

    // Cache class UUIDs for the synchronous #isRelevantItem hook
    this._classWeaponUuids = classItem?.system?.defaultWeapons ?? [];
    this._classSkillUuids = classItem?.system?.skillIds ?? [];

    // Skills + Weapons — parallel UUID resolution (filtering excluded)
    const excludedWeapons = context.system.excludedWeaponIds ?? [];
    const excludedSkills = context.system.excludedSkillIds ?? [];
    const classSkillIds = this._classSkillUuids.filter(id => !excludedSkills.includes(id));
    const classWeaponIds = this._classWeaponUuids.filter(id => !excludedWeapons.includes(id));
    const allSkillUuids = [...classSkillIds, ...(context.system.skillIds ?? [])];
    const allWeaponUuids = [...classWeaponIds, ...context.system.weaponIds];
    const allSupportUuids = context.system.supportIds ?? [];

    const [skillEntries, weaponEntries, supportEntries] = await Promise.all([
      resolveUuids(allSkillUuids),
      resolveUuids(allWeaponUuids),
      resolveUuids(allSupportUuids),
    ]);

    context.skills = buildSkillsContext(skillEntries).map((s, i) => ({
      ...s,
      fromClass: classSkillIds.includes(allSkillUuids[i]),
    }));

    context.supports = supportEntries.map(({ uuid, resolved: s, missing }) => ({
      uuid,
      name: s?.name ?? `[${uuid}]`,
      img: s?.img ?? null,
      missing,
    }));

    context.weapons = buildWeaponsContext(weaponEntries).map((w, i) => ({
      ...w,
      fromClass: classWeaponIds.includes(allWeaponUuids[i]),
    }));

    // Conditions
    Object.assign(context, buildConditionsContext(context.system.conditions));

    return context;
  }
}
