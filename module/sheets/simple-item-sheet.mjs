/**
 * Factory for simple item sheets that only display name + description.
 * Used by skill, support, and opfor-skill item types.
 * @module simple-item-sheet
 */
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * Create a simple item sheet class with the given configuration.
 * @param {object} config
 * @param {string} config.template - Handlebars template path
 * @param {string[]} config.cssClasses - Additional CSS classes
 * @param {number} [config.width=450] - Default window width
 * @param {number} [config.height=250] - Default window height
 * @returns {typeof ItemSheetV2} A new sheet class
 */
export function createSimpleItemSheet({ template, cssClasses, width = 450, height = 250 }) {
  return class extends HandlebarsApplicationMixin(ItemSheetV2) {
    static PARTS = { sheet: { template } };

    static DEFAULT_OPTIONS = {
      classes: ["haywire", "item", ...cssClasses],
      position: { width, height },
      form: { submitOnChange: true, closeOnSubmit: false },
      window: { resizable: true },
    };

    /** @override */
    async _prepareContext(options) {
      const context = await super._prepareContext(options);
      context.item = this.item;
      context.system = this.item.system;
      context.isEditable = this.isEditable;
      return context;
    }
  };
}
