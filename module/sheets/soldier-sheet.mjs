import { HaywireRoll } from "../rolls/haywire-roll.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class SoldierSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/actor/soldier-sheet.hbs",
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
      removeCondition: SoldierSheet.#onRemoveCondition,
      openItem: SoldierSheet.#onOpenItem,
      rollD20: SoldierSheet.#onRollD20,
      rollShoot: SoldierSheet.#onRollShoot,
    },
  };

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
    const skillIds = this.actor.system.skillIds.filter(id => id !== uuid);
    await this.actor.update({ "system.skillIds": skillIds });
  }

  static async #onRemoveCondition(event, target) {
    const condition = target.closest("[data-condition]").dataset.condition;
    await this.actor.toggleStatusEffect(condition, { active: false });
  }

  static async #onOpenItem(event, target) {
    const uuid = target.dataset.itemUuid;
    const item = await fromUuid(uuid);
    if (!item) {
      console.warn(`haywire | SoldierSheet: item UUID "${uuid}" introuvable`);
      return;
    }
    item.sheet.render(true);
  }

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
    if (item.uuid === system.classId) return true;
    if (system.weaponIds.includes(item.uuid)) return true;
    if (system.skillIds.includes(item.uuid)) return true;
    const classItem = system.classId ? fromUuidSync(system.classId) : null;
    if (classItem?.system?.defaultWeapons?.includes(item.uuid)) return true;
    if (classItem?.system?.skillIds?.includes(item.uuid)) return true;
    return false;
  }

  _onClose(options) {
    super._onClose(options);
    if (this._itemHooks) {
      Hooks.off("updateItem", this._itemHooks[0]);
      Hooks.off("deleteItem", this._itemHooks[1]);
    }
  }

  /* ---------------------------------------- */
  /*  Drag & Drop — Références uniquement     */
  /* ---------------------------------------- */

  async _onDropItem(event, data) {
    if (!this.isEditable) return null;

    // Résoudre l'item depuis le UUID des données de drop
    const item = await fromUuid(data.uuid);
    if (!item) return null;

    if (item.type === "class") {
      return this.#onDropClassItem(item);
    }
    if (item.type === "weapon") {
      return this.#onDropWeaponItem(item);
    }
    if (item.type === "skill") {
      return this.#onDropSkillItem(item);
    }

    console.warn(`haywire | SoldierSheet: ${game.i18n.localize("HAYWIRE.InvalidDrop")} (type: ${item.type})`);
    return null;
  }

  async #onDropClassItem(item) {
    const hadPreviousClass = !!this.actor.system.classId;

    // 1. Stocker le UUID de la classe
    await this.actor.update({ "system.classId": item.uuid });

    // 2. Mettre à jour portrait et token avec l'image de la classe (update séparé)
    if (item.system.imagePath) {
      await this.actor.update({
        img: item.system.imagePath,
        "prototypeToken.texture.src": item.system.imagePath,
      });
    }

    const msgKey = hadPreviousClass ? "HAYWIRE.ClassReplaced" : "HAYWIRE.ClassAssigned";
    ui.notifications.info(game.i18n.format(msgKey, { name: item.name }));
  }

  async #onDropWeaponItem(item) {
    // Éviter les doublons (vérifier aussi les armes de la classe)
    const classId = this.actor.system.classId;
    const classItem = classId ? (await fromUuid(classId)) : null;
    const classWeaponIds = classItem?.system?.defaultWeapons ?? [];
    if (classWeaponIds.includes(item.uuid)) return;
    if (this.actor.system.weaponIds.includes(item.uuid)) return;

    const weaponIds = [...this.actor.system.weaponIds, item.uuid];
    await this.actor.update({ "system.weaponIds": weaponIds });
  }

  async #onDropSkillItem(item) {
    // Éviter les doublons (vérifier aussi les skills de la classe)
    const classId = this.actor.system.classId;
    const classItem = classId ? (await fromUuid(classId)) : null;
    const classSkillIds = classItem?.system?.skillIds ?? [];
    if (classSkillIds.includes(item.uuid)) return;
    if (this.actor.system.skillIds.includes(item.uuid)) return;

    const skillIds = [...this.actor.system.skillIds, item.uuid];
    await this.actor.update({ "system.skillIds": skillIds });
  }

  /* ---------------------------------------- */
  /*  Rendering & Visual Feedback             */
  /* ---------------------------------------- */

  _onRender(context, options) {
    super._onRender(context, options);

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

    const conditionSelect = this.element.querySelector(".haywire-condition-select");
    if (conditionSelect) {
      conditionSelect.addEventListener("change", async (e) => {
        if (!this.isEditable) return;
        const condition = e.target.value;
        if (!condition) return;
        await this.actor.toggleStatusEffect(condition, { active: true });
      });
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.source = this.actor.toObject().system;
    context.isEditable = this.isEditable;

    // Résolution classe par UUID (async pour charger les données complètes du compendium)
    const classId = context.system.classId;
    const classItem = classId ? (await fromUuid(classId)) : null;
    if (classId && !classItem) {
      console.warn(`haywire | SoldierSheet: classId "${classId}" introuvable pour actor "${this.actor.name}"`);
    }
    context.hasClass = !!classItem;
    context.className = classItem?.name ?? null;
    context.classImage = classItem?.system?.imagePath || null;

    // CombatStats dérivées live depuis la classe
    if (classItem?.type === "class") {
      context.combatStats = {
        easy: classItem.system.combatStats.easy,
        medium: classItem.system.combatStats.medium,
        hard: classItem.system.combatStats.hard,
      };
    } else {
      context.combatStats = context.system.combatStats;
    }

    // Skills — classe + propres, résolues par UUID
    const classSkillIds = classItem?.system?.skillIds ?? [];
    const ownSkillIds = context.system.skillIds ?? [];
    const allSkillUuids = [...classSkillIds, ...ownSkillIds];
    const resolvedSkills = await Promise.all(allSkillUuids.map(uuid => fromUuid(uuid)));
    context.skills = allSkillUuids.map((uuid, i) => {
      const s = resolvedSkills[i];
      return {
        uuid,
        name: s?.name ?? `[${uuid}]`,
        description: s?.system?.description ?? "",
        missing: !s,
        fromClass: classSkillIds.includes(uuid),
      };
    });

    // Résolution armes par UUID — classe + propres
    const allWeaponUuids = [
      ...(classItem?.system?.defaultWeapons ?? []),
      ...context.system.weaponIds,
    ];
    const resolvedWeapons = await Promise.all(allWeaponUuids.map(uuid => fromUuid(uuid)));
    context.weapons = allWeaponUuids.map((uuid, i) => {
      const w = resolvedWeapons[i];
      if (!w) return { uuid, name: `[${uuid}]`, weaponType: "?", range: 0, rateOfFire: 0, modifiers: 0, penetration: 0, missing: true };
      return {
        uuid,
        name: w.name,
        weaponType: game.i18n.localize(`HAYWIRE.WeaponType.${w.system.weaponType}`),
        range: w.system.range,
        rateOfFire: w.system.rateOfFire,
        modifiers: w.system.modifiers,
        penetration: w.system.penetration,
        fromClass: classItem?.system?.defaultWeapons?.includes(uuid) ?? false,
      };
    });

    // Conditions
    context.conditions = [...context.system.conditions].map(c => ({
      key: c,
      label: game.i18n.localize(`HAYWIRE.Conditions.${c.charAt(0).toUpperCase() + c.slice(1)}`),
    }));

    // Conditions disponibles pour ajout manuel
    const HAYWIRE_CONDITIONS = ["suppressed", "pinned", "downed", "hidden", "stunned"];
    const currentConditions = [...context.system.conditions];
    context.availableConditions = HAYWIRE_CONDITIONS
      .filter(c => !currentConditions.includes(c))
      .map(c => ({
        key: c,
        label: game.i18n.localize(`HAYWIRE.Conditions.${c.charAt(0).toUpperCase() + c.slice(1)}`),
      }));

    return context;
  }
}
