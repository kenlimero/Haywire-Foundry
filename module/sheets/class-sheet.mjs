const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class ClassSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/item/class-sheet.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "item", "class"],
    position: { width: 550, height: 600 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
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
    if (data?.type !== "Item" || !data.uuid) return;

    const item = await fromUuid(data.uuid);
    if (!item) return;

    // IMPORTANT : utiliser data.uuid car item.uuid est cassé pour les compendiums (_id: null)
    const uuid = data.uuid;
    if (item.type === "weapon") {
      if (this.item.system.defaultWeapons.includes(uuid)) return;
      const weapons = [...this.item.system.defaultWeapons, uuid];
      await this.item.update({ "system.defaultWeapons": weapons });
    } else if (item.type === "skill") {
      if (this.item.system.skillIds.includes(uuid)) return;
      const skills = [...this.item.system.skillIds, uuid];
      await this.item.update({ "system.skillIds": skills });
    } else {
      console.warn(`haywire | ClassSheet: ${game.i18n.localize("HAYWIRE.InvalidDrop")} (type: ${item.type})`);
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.isEditable = this.isEditable;
    // Résoudre skills + armes en parallèle
    const skillUuids = this.item.system.skillIds ?? [];
    const weaponUuids = this.item.system.defaultWeapons ?? [];

    const [resolvedSkills, resolvedWeapons] = await Promise.all([
      Promise.all(skillUuids.map(uuid => fromUuid(uuid))),
      Promise.all(weaponUuids.map(uuid => fromUuid(uuid))),
    ]);

    context.skills = skillUuids.map((uuid, i) => {
      const s = resolvedSkills[i];
      return {
        uuid,
        name: s?.name ?? `[${uuid}]`,
        description: s?.system?.description ?? "",
        missing: !s,
      };
    });

    context.defaultWeapons = weaponUuids.map((uuid, i) => {
      const w = resolvedWeapons[i];
      return {
        uuid,
        name: w?.name ?? `[${uuid}]`,
        missing: !w,
      };
    });

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    if (!this.isEditable) return;

    // Drop d'un Item Weapon → ajouter son UUID aux armes par défaut
    this.element.addEventListener("dragover", (e) => e.preventDefault());
    this.element.addEventListener("drop", (e) => this.#onDrop(e));

    // Remove skill (par UUID)
    this.element.querySelectorAll("[data-action='remove-skill']").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const uuid = event.currentTarget.dataset.skillUuid;
        const skills = this.item.system.skillIds.filter(id => id !== uuid);
        this.item.update({ "system.skillIds": skills });
      });
    });

    // Remove default weapon (par UUID)
    this.element.querySelectorAll("[data-action='remove-weapon']").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const uuid = event.currentTarget.dataset.weaponUuid;
        const weapons = this.item.system.defaultWeapons.filter(id => id !== uuid);
        this.item.update({ "system.defaultWeapons": weapons });
      });
    });

    // File picker for class card image
    this.element.querySelector("[data-action='browse-image']")?.addEventListener("click", async () => {
      const picker = new FilePicker({
        type: "image",
        current: this.item.system.imagePath || "systems/haywire/assets/classes/",
        callback: (path) => {
          this.item.update({ "system.imagePath": path });
        },
      });
      picker.render(true);
    });
  }
}
