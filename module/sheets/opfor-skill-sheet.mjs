import { createSimpleItemSheet } from "./simple-item-sheet.mjs";

export const OpforSkillSheet = createSimpleItemSheet({
  template: "systems/haywire/templates/item/skill-sheet.hbs",
  cssClasses: ["opfor-skill"],
});
