import {
  buildConditionsContext, resolveUuids, buildSkillsContext, buildWeaponsContext,
  bindConditionSelect, onRollD20, onRollShoot, onRemoveCondition, onOpenItem,
} from "./sheet-helpers.mjs";

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

  get _locked() {
    return this.actor.getFlag("haywire", "locked") ?? false;
  }

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

  static async #onRemoveSupport(event, target) {
    const uuid = target.dataset.supportUuid;
    const supportIds = this.actor.system.supportIds.filter(id => id !== uuid);
    await this.actor.update({ "system.supportIds": supportIds });
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
    if (system.supportIds.includes(item.uuid)) return true;
    // Utiliser le cache résolu au dernier render (évite fromUuidSync sur compendium)
    if (this._classWeaponUuids?.includes(item.uuid)) return true;
    if (this._classSkillUuids?.includes(item.uuid)) return true;
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
    if (item.type === "support") {
      return this.#onDropSupportItem(item, uuid);
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

  async #onDropSupportItem(_item, uuid) {
    if (this.actor.system.supportIds.includes(uuid)) return;

    const supportIds = [...this.actor.system.supportIds, uuid];
    await this.actor.update({ "system.supportIds": supportIds });
  }

  /* ---------------------------------------- */
  /*  Rendering & Visual Feedback             */
  /* ---------------------------------------- */

  _onRender(context, options) {
    super._onRender(context, options);

    // Ajuster la taille selon le mode carte/sheet
    const cardView = this.actor.getFlag("haywire", "cardView") ?? false;
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

    bindConditionSelect(this.element, this.actor, this.isEditable);
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
