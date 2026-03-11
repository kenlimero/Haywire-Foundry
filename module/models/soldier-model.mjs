/**
 * Data model for the Soldier actor type.
 * @module soldier-model
 */
import { uuidArrayField, combatStatsField, conditionsField, suppressionField } from "./model-helpers.mjs";

/** @extends foundry.abstract.TypeDataModel */
export class SoldierModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      hitPoints: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
        max: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
      }),
      actionPoints: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
        max: new fields.NumberField({ required: true, integer: true, min: 0, initial: 2 }),
      }),
      classId: new fields.StringField({ required: false, blank: true, initial: "" }),
      conditions: conditionsField(),
      weaponIds: uuidArrayField(),
      skillIds: uuidArrayField(),
      excludedWeaponIds: uuidArrayField(),
      excludedSkillIds: uuidArrayField(),
      supportIds: uuidArrayField(),
      suppression: suppressionField(),
      combatStats: combatStatsField(),
    };
  }
}
