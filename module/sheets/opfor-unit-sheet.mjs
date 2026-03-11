import {
  buildConditionsContext, resolveUuids, buildSkillsContext, buildWeaponsContext,
  bindConditionSelect, onRollD20, onRollShoot, onRemoveCondition, onOpenItem,
  registerItemHooks, unregisterItemHooks,
} from "./sheet-helpers.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Sheet for the OpFor Unit actor type.
 * Supports sheet view and card view, lock toggle, behavior editing, drag-drop of weapon/opfor-skill items.
 * @extends ActorSheetV2
 */
export class OpforUnitSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/actor/opfor-unit-sheet.hbs",
    },
    card: {
      template: "systems/haywire/templates/actor/opfor-unit-card.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "actor", "opfor-unit"],
    position: { width: 750, height: 556 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
    dragDrop: [{ dropSelector: null }],
    actions: {
      rollD20: onRollD20,
      rollShoot: onRollShoot,
      removeWeapon: OpforUnitSheet.#onRemoveWeapon,
      removeSkill: OpforUnitSheet.#onRemoveSkill,
      removeCondition: onRemoveCondition,
      openItem: onOpenItem,
      toggleCardView: OpforUnitSheet.#onToggleCardView,
      editBehavior: OpforUnitSheet.#onEditBehavior,
      toggleLock: OpforUnitSheet.#onToggleLock,
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
    if (this.actor.system.cardImage) {
      const cardView = this.actor.getFlag("haywire", "cardView") ?? true;
      controls.unshift({
        icon: cardView ? "fas fa-sheet-plastic" : "fas fa-id-card",
        label: cardView ? "HAYWIRE.Settings.ShowSheet" : "HAYWIRE.Settings.ShowCard",
        action: "toggleCardView",
      });
    }
    return controls;
  }

  static async #onToggleLock() {
    const newLocked = !this._locked;
    await this.actor.setFlag("haywire", "locked", newLocked);
    if (newLocked) this._editingBehavior = false;
    this.render({ force: true, window: { controls: true } });
  }

  static async #onToggleCardView() {
    const current = this.actor.getFlag("haywire", "cardView") ?? true;
    await this.actor.setFlag("haywire", "cardView", !current);
    await this.close();
    this.render({ force: true });
  }

  _editingBehavior = false;

  static async #onEditBehavior() {
    this._editingBehavior = !this._editingBehavior;
    this.render();
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    const hasCard = !!this.actor.system.cardImage;
    const cardView = hasCard && (this.actor.getFlag("haywire", "cardView") ?? true);
    options.parts = cardView ? ["card"] : ["sheet"];
  }

  static async #onRemoveWeapon(event, target) {
    const uuid = target.dataset.weaponUuid;
    const weaponIds = this.actor.system.weaponIds.filter(id => id !== uuid);
    await this.actor.update({ "system.weaponIds": weaponIds });
  }

  static async #onRemoveSkill(event, target) {
    const uuid = target.dataset.skillUuid;
    const opforSkillIds = this.actor.system.opforSkillIds.filter(id => id !== uuid);
    await this.actor.update({ "system.opforSkillIds": opforSkillIds });
  }

  /* ---------------------------------------- */
  /*  Item hooks                              */
  /* ---------------------------------------- */

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
    return system.weaponIds.includes(item.uuid) || system.opforSkillIds.includes(item.uuid);
  }

  /** @override */
  _onClose(options) {
    super._onClose(options);
    this._editingBehavior = false;
    unregisterItemHooks(this._itemHooks);
  }

  /* ---------------------------------------- */
  /*  Drag & Drop                             */
  /* ---------------------------------------- */

  /**
   * Handle item drops onto the opfor unit sheet.
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

    if (item.type === "weapon") {
      if (this.actor.system.weaponIds.includes(uuid)) return null;
      const weaponIds = [...this.actor.system.weaponIds, uuid];
      await this.actor.update({ "system.weaponIds": weaponIds });
      return;
    }

    if (item.type === "opfor-skill") {
      if (this.actor.system.opforSkillIds.includes(uuid)) return null;
      const opforSkillIds = [...this.actor.system.opforSkillIds, uuid];
      await this.actor.update({ "system.opforSkillIds": opforSkillIds });
      return;
    }

    console.warn(`haywire | OpforUnitSheet: ${game.i18n.localize("HAYWIRE.OpforInvalidDrop")} (type: ${item.type})`);
    return null;
  }

  /* ---------------------------------------- */
  /*  Rendering                               */
  /* ---------------------------------------- */

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    const hasCard = !!this.actor.system.cardImage;
    const cardView = hasCard && (this.actor.getFlag("haywire", "cardView") ?? true);
    this.setPosition(cardView ? { width: 750, height: 556 } : { width: 860, height: 600 });

    bindConditionSelect(this.element, this.actor, this.isEditable);
  }

  /**
   * Prepare render context: resolve weapons, skills from UUIDs.
   * @override
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.isEditable = this.isEditable && !this._locked;
    context.combatStats = this.actor.system.combatStats;
    context.behavior = this.actor.system.behavior;
    context.editingBehavior = this._editingBehavior;
    context.fields = this.actor.system.schema.fields;
    context.faction = this.actor.system.faction;
    context.cardImage = this.actor.system.cardImage;

    // Resolve opfor skills and weapons in parallel
    const [skillEntries, weaponEntries] = await Promise.all([
      resolveUuids(this.actor.system.opforSkillIds ?? []),
      resolveUuids(this.actor.system.weaponIds ?? []),
    ]);

    context.skills = buildSkillsContext(skillEntries);
    context.weapons = buildWeaponsContext(weaponEntries);
    context.hasWeapons = context.weapons.length > 0;
    context.hasSkills = context.skills.length > 0;

    // Conditions
    Object.assign(context, buildConditionsContext(this.actor.system.conditions));

    return context;
  }
}
