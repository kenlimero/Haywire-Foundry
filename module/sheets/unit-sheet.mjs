const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class UnitSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/item/unit-sheet.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "item", "unit"],
    position: { width: 550, height: 650 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
    actions: {
      deployUnit: UnitSheet.#onDeployUnit,
      showSupport: UnitSheet.#onShowSupport,
      removeClass: UnitSheet.#onRemoveClass,
      removeSupport: UnitSheet.#onRemoveSupport,
    },
  };

  async #onDrop(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (e) {
      return;
    }
    if (!data.uuid) return;

    const doc = await fromUuid(data.uuid);
    if (!doc) return;

    const uuid = data.uuid;

    if (data.type === "Item" && doc.type === "class") {
      if (this.item.system.classIds.includes(uuid)) return;
      const classIds = [...this.item.system.classIds, uuid];
      await this.item.update({ "system.classIds": classIds });
    } else {
      console.warn("haywire | UnitSheet: Only Class items can be dropped here");
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.isEditable = this.isEditable;

    // Resolve classes
    const classUuids = this.item.system.classIds ?? [];
    const resolvedClasses = await Promise.all(classUuids.map(uuid => fromUuid(uuid)));
    context.classes = classUuids.map((uuid, i) => {
      const c = resolvedClasses[i];
      return {
        uuid,
        name: c?.name ?? `[${uuid}]`,
        missing: !c,
      };
    });

    // Resolve support cards
    const supportUuids = this.item.system.supportCardIds ?? [];
    const resolvedSupports = await Promise.all(supportUuids.map(uuid => fromUuid(uuid)));
    context.supportCards = supportUuids.map((uuid, i) => {
      const s = resolvedSupports[i];
      return {
        uuid,
        name: s?.name ?? `[${uuid}]`,
        img: s?.faces?.[0]?.img ?? s?.img ?? null,
        missing: !s,
      };
    });

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);

    if (!this.isEditable) return;

    // Drop handler (editing only)
    this.element.addEventListener("dragover", (e) => e.preventDefault());
    this.element.addEventListener("drop", (e) => this.#onDrop(e));
  }

  // ── Actions (work even from compendium via ApplicationV2 delegation) ─────

  static async #onDeployUnit() {
    const unit = this.item;
    const unitName = unit.name;
    const classUuids = unit.system.classIds ?? [];

    if (!classUuids.length) {
      ui.notifications.warn("No classes defined for this unit.");
      return;
    }

    // Create or find the folder
    let folder = game.folders.find(f => f.name === unitName && f.type === "Actor");
    if (!folder) {
      folder = await Folder.create({ name: unitName, type: "Actor" });
    }

    // Resolve all classes and create soldiers
    const resolvedClasses = await Promise.all(classUuids.map(uuid => fromUuid(uuid)));
    const actorsData = [];

    for (let i = 0; i < classUuids.length; i++) {
      const cls = resolvedClasses[i];
      if (!cls) continue;

      const classUuid = classUuids[i];
      const combatStats = cls.system.combatStats ?? { easy: 5, medium: 9, hard: 13 };

      // Weapons & skills are loaded automatically from the class via classId
      // so we don't set weaponIds/skillIds here to avoid duplication
      actorsData.push({
        name: cls.name,
        type: "soldier",
        img: cls.system.imagePath || cls.img || "icons/svg/mystery-man.svg",
        folder: folder.id,
        system: {
          hitPoints: { value: 1, max: 1 },
          actionPoints: { value: 2, max: 2 },
          classId: classUuid,
          combatStats,
        },
      });
    }

    const created = await Actor.createDocuments(actorsData);
    ui.notifications.info(`${created.length} soldiers created in folder "${unitName}".`);
  }

  static #onShowSupport(event, target) {
    const src = target.dataset.src;
    const title = target.dataset.title;
    const popout = new ImagePopout({
      src,
      uuid: null,
      caption: "",
      window: { title },
    });
    popout.render(true).then(() => popout.setPosition({ width: 556, height: 450 }));
  }

  static async #onRemoveClass(event, target) {
    if (!this.isEditable) return;
    const uuid = target.dataset.classUuid;
    const classIds = this.item.system.classIds.filter(id => id !== uuid);
    await this.item.update({ "system.classIds": classIds });
  }

  static async #onRemoveSupport(event, target) {
    if (!this.isEditable) return;
    const uuid = target.dataset.supportUuid;
    const supportCardIds = this.item.system.supportCardIds.filter(id => id !== uuid);
    await this.item.update({ "system.supportCardIds": supportCardIds });
  }
}
