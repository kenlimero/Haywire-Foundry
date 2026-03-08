const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class OpforSkillSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/item/opfor-skill-sheet.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "item", "opfor-skill"],
    position: { width: 450, height: 250 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.isEditable = this.isEditable;
    return context;
  }
}
