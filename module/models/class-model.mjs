import { uuidArrayField, combatStatsField } from "./model-helpers.mjs";

export class ClassModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      tier: new fields.NumberField({ required: true, integer: true, min: 1, max: 3, initial: 1 }),
      combatStats: combatStatsField(5, 9, 13),
      skillIds: uuidArrayField(),
      defaultWeapons: uuidArrayField(),
      imagePath: new fields.FilePathField({ categories: ["IMAGE"], required: false }),
    };
  }
}
