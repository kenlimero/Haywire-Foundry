/**
 * Data model for the OpFor Unit actor type.
 * @module opfor-unit-model
 */
import { uuidArrayField, combatStatsField, conditionsField, suppressionField } from "./model-helpers.mjs";

/** @extends foundry.abstract.TypeDataModel */
export class OpforUnitModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.StringField({ required: true, initial: "" }),
      cardImage: new fields.FilePathField({ categories: ["IMAGE"], required: false, initial: null }),
      faction: new fields.StringField({ required: true, initial: "" }),
      combatStats: combatStatsField(11, 15, 18),
      opforSkillIds: uuidArrayField(),
      weaponIds: uuidArrayField(),
      conditions: conditionsField(),
      suppression: suppressionField(),
      behavior: new fields.HTMLField({ required: true, initial: "" }),
    };
  }
}
