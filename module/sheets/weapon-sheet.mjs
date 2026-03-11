/**
 * Sheet for the Weapon item type.
 * @module weapon-sheet
 */
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class WeaponSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/item/weapon-sheet.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "item", "weapon"],
    position: { width: 550, height: 350 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.isEditable = this.isEditable;

    // Build weaponType choices from schema
    const choices = this.item.system.schema.getField("weaponType").choices;
    context.weaponTypeChoices = Object.entries(choices).map(([value, label]) => ({
      value,
      label: game.i18n.localize(label),
      selected: value === this.item.system.weaponType,
    }));

    return context;
  }
}
