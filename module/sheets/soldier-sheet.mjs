import { HaywireRoll } from "../rolls/haywire-roll.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

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
      removeCondition: SoldierSheet.#onRemoveCondition,
      openItem: SoldierSheet.#onOpenItem,
      editPortrait: SoldierSheet.#onEditPortrait,
      rollD20: SoldierSheet.#onRollD20,
      rollShoot: SoldierSheet.#onRollShoot,
      toggleCardView: SoldierSheet.#onToggleCardView,
      toggleLock: SoldierSheet.#onToggleLock,
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
    const cardView = game.settings.get("haywire", "soldierCardView");
    controls.unshift({
      icon: cardView ? "fas fa-sheet-plastic" : "fas fa-id-card",
      label: cardView ? "HAYWIRE.Settings.ShowSheet" : "HAYWIRE.Settings.ShowCard",
      action: "toggleCardView",
    });
    return controls;
  }

  static async #onToggleLock() {
    this._locked = !this._locked;
    this.render({ force: true, window: { controls: true } });
  }

  static async #onToggleCardView() {
    const current = game.settings.get("haywire", "soldierCardView");
    await game.settings.set("haywire", "soldierCardView", !current);
    await this.close();
    this.render({ force: true });
  }

  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    const cardView = game.settings.get("haywire", "soldierCardView");
    if (cardView) {
      options.parts = ["card"];
    } else {
      options.parts = ["sheet"];
    }
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
    const isFromClass = target.dataset.fromClass === "true";
    if (isFromClass) {
      const excluded = [...this.actor.system.excludedWeaponIds, uuid];
      await this.actor.update({ "system.excludedWeaponIds": excluded });
    } else {
      const weaponIds = this.actor.system.weaponIds.filter(id => id !== uuid);
      await this.actor.update({ "system.weaponIds": weaponIds });
    }
  }

  static async #onRemoveSkill(event, target) {
    const uuid = target.dataset.skillUuid;
    const isFromClass = target.dataset.fromClass === "true";
    if (isFromClass) {
      const excluded = [...this.actor.system.excludedSkillIds, uuid];
      await this.actor.update({ "system.excludedSkillIds": excluded });
    } else {
      const skillIds = this.actor.system.skillIds.filter(id => id !== uuid);
      await this.actor.update({ "system.skillIds": skillIds });
    }
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
    // Utiliser le cache résolu au dernier render (évite fromUuidSync sur compendium)
    if (this._classWeaponUuids?.includes(item.uuid)) return true;
    if (this._classSkillUuids?.includes(item.uuid)) return true;
    return false;
  }

  _onClose(options) {
    super._onClose(options);
    this._locked = true;
    if (this._itemHooks) {
      Hooks.off("updateItem", this._itemHooks[0]);
      Hooks.off("deleteItem", this._itemHooks[1]);
    }
  }

  /* ---------------------------------------- */
  /*  Drag & Drop — Références uniquement     */
  /* ---------------------------------------- */

  async _onDropItem(event, data) {
    if (!this.isEditable || this._locked) return null;

    // Résoudre l'item depuis le UUID des données de drop
    // IMPORTANT : garder data.uuid car item.uuid est cassé pour les compendiums (_id: null)
    const uuid = data.uuid;
    const item = await fromUuid(uuid);
    if (!item) return null;

    if (item.type === "class") {
      return this.#onDropClassItem(item, uuid);
    }
    if (item.type === "weapon") {
      return this.#onDropWeaponItem(item, uuid);
    }
    if (item.type === "skill") {
      return this.#onDropSkillItem(item, uuid);
    }

    console.warn(`haywire | SoldierSheet: ${game.i18n.localize("HAYWIRE.InvalidDrop")} (type: ${item.type})`);
    return null;
  }

  async #onDropClassItem(item, uuid) {
    const hadPreviousClass = !!this.actor.system.classId;

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
    // Éviter les doublons (utilise le cache résolu au dernier render)
    if (this._classWeaponUuids?.includes(uuid)) return;
    if (this.actor.system.weaponIds.includes(uuid)) return;

    const weaponIds = [...this.actor.system.weaponIds, uuid];
    await this.actor.update({ "system.weaponIds": weaponIds });
  }

  async #onDropSkillItem(_item, uuid) {
    // Éviter les doublons (utilise le cache résolu au dernier render)
    if (this._classSkillUuids?.includes(uuid)) return;
    if (this.actor.system.skillIds.includes(uuid)) return;

    const skillIds = [...this.actor.system.skillIds, uuid];
    await this.actor.update({ "system.skillIds": skillIds });
  }

  /* ---------------------------------------- */
  /*  Rendering & Visual Feedback             */
  /* ---------------------------------------- */

  _onRender(context, options) {
    super._onRender(context, options);

    // Ajuster la taille selon le mode carte/sheet
    const cardView = game.settings.get("haywire", "soldierCardView");
    if (cardView) {
      this.setPosition({ width: 400, height: 600 });
    } else {
      this.setPosition({ width: 550, height: 550 });
    }

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
    context.isEditable = this.isEditable && !this._locked;

    // Résolution classe par UUID (async pour charger les données complètes du compendium)
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

    // CombatStats : utiliser celles de l'actor (modifiables), fallback sur la classe
    const actorStats = context.system.combatStats;
    const hasActorStats = actorStats.easy > 0 || actorStats.medium > 0 || actorStats.hard > 0;
    context.combatStats = hasActorStats
      ? actorStats
      : (classItem?.system?.combatStats ?? actorStats);

    // Cache des UUIDs classe pour le hook synchrone #isRelevantItem
    this._classWeaponUuids = classItem?.system?.defaultWeapons ?? [];
    this._classSkillUuids = classItem?.system?.skillIds ?? [];

    // Skills + Weapons — résolution parallèle par UUID (filtrage des exclus)
    const excludedWeapons = context.system.excludedWeaponIds ?? [];
    const excludedSkills = context.system.excludedSkillIds ?? [];
    const classSkillIds = this._classSkillUuids.filter(id => !excludedSkills.includes(id));
    const classWeaponIds = this._classWeaponUuids.filter(id => !excludedWeapons.includes(id));
    const allSkillUuids = [...classSkillIds, ...(context.system.skillIds ?? [])];
    const allWeaponUuids = [...classWeaponIds, ...context.system.weaponIds];

    const [resolvedSkills, resolvedWeapons] = await Promise.all([
      Promise.all(allSkillUuids.map(uuid => fromUuid(uuid))),
      Promise.all(allWeaponUuids.map(uuid => fromUuid(uuid))),
    ]);

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
        fromClass: classWeaponIds.includes(uuid),
      };
    });

    // Conditions
    const conditionLabel = c => game.i18n.localize(`HAYWIRE.Conditions.${c.charAt(0).toUpperCase() + c.slice(1)}`);
    const currentConditions = [...context.system.conditions];
    context.conditions = currentConditions.map(c => ({ key: c, label: conditionLabel(c) }));

    // Conditions disponibles pour ajout manuel
    const HAYWIRE_CONDITIONS = ["suppressed", "pinned", "downed", "hidden", "injured", "overwatch"];
    context.availableConditions = HAYWIRE_CONDITIONS
      .filter(c => !currentConditions.includes(c))
      .map(c => ({ key: c, label: conditionLabel(c) }));

    return context;
  }
}
