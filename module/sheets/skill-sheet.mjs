const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class SkillSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/item/skill-sheet.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "item", "skill"],
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
