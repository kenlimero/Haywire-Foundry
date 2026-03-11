/**
 * Sheet for the Class item type.
 * Supports drag-drop of weapons and skills, image browsing.
 * @module class-sheet
 */
import { resolveUuids, buildSkillsContext, parseItemDrop } from "./sheet-helpers.mjs";

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

  /**
   * Handle item drops (weapons and skills).
   * @param {DragEvent} event
   */
  async #onDrop(event) {
    if (!this.isEditable) return;

    const drop = await parseItemDrop(event);
    if (!drop) return;

    const { uuid, item } = drop;
    if (item.type === "weapon") {
      if (this.item.system.defaultWeapons.includes(uuid)) return;
      await this.item.update({ "system.defaultWeapons": [...this.item.system.defaultWeapons, uuid] });
    } else if (item.type === "skill") {
      if (this.item.system.skillIds.includes(uuid)) return;
      await this.item.update({ "system.skillIds": [...this.item.system.skillIds, uuid] });
    } else {
      console.warn(`haywire | ClassSheet: ${game.i18n.localize("HAYWIRE.InvalidDrop")} (type: ${item.type})`);
    }
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.isEditable = this.isEditable;

    // Resolve skills + weapons in parallel
    const [skillEntries, weaponEntries] = await Promise.all([
      resolveUuids(this.item.system.skillIds ?? []),
      resolveUuids(this.item.system.defaultWeapons ?? []),
    ]);

    context.skills = buildSkillsContext(skillEntries);
    context.defaultWeapons = weaponEntries.map(({ uuid, resolved: w, missing }) => ({
      uuid,
      name: w?.name ?? `[${uuid}]`,
      missing,
    }));

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    if (!this.isEditable) return;

    this.element.addEventListener("dragover", (e) => e.preventDefault());
    this.element.addEventListener("drop", (e) => this.#onDrop(e));

    // Remove skill by UUID
    this.element.querySelectorAll("[data-action='remove-skill']").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        const uuid = event.currentTarget.dataset.skillUuid;
        const skills = this.item.system.skillIds.filter(id => id !== uuid);
        this.item.update({ "system.skillIds": skills });
      });
    });

    // Remove default weapon by UUID
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
