import { createSimpleItemSheet } from "./simple-item-sheet.mjs";

export const SkillSheet = createSimpleItemSheet({
  template: "systems/haywire/templates/item/skill-sheet.hbs",
  cssClasses: ["skill"],
});
