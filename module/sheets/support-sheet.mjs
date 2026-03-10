import { createSimpleItemSheet } from "./simple-item-sheet.mjs";

export const SupportSheet = createSimpleItemSheet({
  template: "systems/haywire/templates/item/support-sheet.hbs",
  cssClasses: ["support"],
  width: 500,
  height: 400,
});
