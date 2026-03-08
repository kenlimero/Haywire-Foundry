import { HaywireRoll } from "../rolls/haywire-roll.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

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
      rollD20: OpforUnitSheet.#onRollD20,
      rollShoot: OpforUnitSheet.#onRollShoot,
      removeWeapon: OpforUnitSheet.#onRemoveWeapon,
      removeSkill: OpforUnitSheet.#onRemoveSkill,
      openItem: OpforUnitSheet.#onOpenItem,
      toggleCardView: OpforUnitSheet.#onToggleCardView,
      editBehavior: OpforUnitSheet.#onEditBehavior,
      toggleLock: OpforUnitSheet.#onToggleLock,
    },
  };

  _locked = true;

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
    this._locked = !this._locked;
    if (this._locked) this._editingBehavior = false;
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

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    const hasCard = !!this.actor.system.cardImage;
    const cardView = hasCard && (this.actor.getFlag("haywire", "cardView") ?? true);
    options.parts = cardView ? ["card"] : ["sheet"];
  }

  static async #onRollD20(event, target) {
    await HaywireRoll.d20({
      actor: this.actor,
      label: game.i18n.localize("HAYWIRE.RollD20"),
    });
  }

  static async #onRollShoot(event, target) {
    const weaponUuid = target.dataset.weaponUuid;
    if (!weaponUuid) return;

    const weapon = await fromUuid(weaponUuid);
    if (!weapon) {
      ui.notifications.warn(game.i18n.localize("HAYWIRE.NoWeaponEquipped"));
      return;
    }

    await HaywireRoll.shoot({
      actor: this.actor,
      weapon,
    });
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

  static async #onOpenItem(event, target) {
    const uuid = target.dataset.itemUuid;
    const item = await fromUuid(uuid);
    if (!item) {
      console.warn(`haywire | OpforUnitSheet: item UUID "${uuid}" introuvable`);
      return;
    }
    item.sheet.render(true);
  }

  /* ---------------------------------------- */
  /*  Item hooks                              */
  /* ---------------------------------------- */

  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    this._itemHooks = [
      Hooks.on("updateItem", (item) => {
        if (this.#isRelevantItem(item)) this.render();
      }),
      Hooks.on("deleteItem", (item) => {
        if (this.#isRelevantItem(item)) this.render();
      }),
    ];
  }

  #isRelevantItem(item) {
    const system = this.actor.system;
    if (system.weaponIds.includes(item.uuid)) return true;
    if (system.opforSkillIds.includes(item.uuid)) return true;
    return false;
  }

  _onClose(options) {
    super._onClose(options);
    this._editingBehavior = false;
    if (this._itemHooks) {
      Hooks.off("updateItem", this._itemHooks[0]);
      Hooks.off("deleteItem", this._itemHooks[1]);
    }
  }

  /* ---------------------------------------- */
  /*  Drag & Drop                             */
  /* ---------------------------------------- */

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

  _onRender(context, options) {
    super._onRender(context, options);

    const hasCard = !!this.actor.system.cardImage;
    const cardView = hasCard && (this.actor.getFlag("haywire", "cardView") ?? true);
    if (cardView) {
      this.setPosition({ width: 750, height: 556 });
    } else {
      this.setPosition({ width: 860, height: 600 });
    }
  }

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

    // Resolve opfor skills
    const skillUuids = this.actor.system.opforSkillIds ?? [];
    const resolvedSkills = await Promise.all(skillUuids.map(uuid => fromUuid(uuid)));
    context.skills = skillUuids.map((uuid, i) => {
      const s = resolvedSkills[i];
      return {
        uuid,
        name: s?.name ?? `[${uuid}]`,
        description: s?.system?.description ?? "",
        missing: !s,
      };
    });

    // Resolve weapons
    const weaponUuids = this.actor.system.weaponIds ?? [];
    const resolvedWeapons = await Promise.all(weaponUuids.map(uuid => fromUuid(uuid)));
    context.weapons = weaponUuids.map((uuid, i) => {
      const w = resolvedWeapons[i];
      if (!w) return { uuid, name: `[${uuid}]`, weaponType: "?", range: 0, rateOfFire: 0, modifiers: 0, missing: true };
      return {
        uuid,
        name: w.name,
        weaponType: game.i18n.localize(`HAYWIRE.WeaponType.${w.system.weaponType}`),
        range: w.system.range,
        rateOfFire: w.system.rateOfFire,
        modifiers: w.system.modifiers,
      };
    });

    context.hasWeapons = context.weapons.length > 0;
    context.hasSkills = context.skills.length > 0;

    return context;
  }
}
