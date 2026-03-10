/**
 * Factory for simple item sheets that only display name + description.
 * Used by skill, support, and opfor-skill item types.
 */
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export function createSimpleItemSheet({ template, cssClasses, width = 450, height = 250 }) {
  return class extends HandlebarsApplicationMixin(ItemSheetV2) {
    static PARTS = { sheet: { template } };

    static DEFAULT_OPTIONS = {
      classes: ["haywire", "item", ...cssClasses],
      position: { width, height },
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
  };
}
