/**
 * Shared schema field helpers for Haywire data models.
 */

const fields = foundry.data.fields;

/** UUID array field (e.g. weaponIds, skillIds, supportCardIds). */
export function uuidArrayField() {
  return new fields.ArrayField(
    new fields.StringField({ required: true, blank: false }),
    { required: true, initial: [] },
  );
}

/** Combat stats schema (easy/medium/hard thresholds). */
export function combatStatsField(easy = 0, medium = 0, hard = 0) {
  return new fields.SchemaField({
    easy: new fields.NumberField({ required: true, integer: true, min: 0, initial: easy }),
    medium: new fields.NumberField({ required: true, integer: true, min: 0, initial: medium }),
    hard: new fields.NumberField({ required: true, integer: true, min: 0, initial: hard }),
  });
}

/** Conditions set field (shared by soldier and opfor-unit). */
export function conditionsField() {
  return new fields.SetField(
    new fields.StringField({ required: true, blank: false }),
    { required: true, initial: [] },
  );
}

/** Suppression number field (0-6). */
export function suppressionField() {
  return new fields.NumberField({ required: true, integer: true, min: 0, max: 6, initial: 0 });
}

/** Simple description-only data model (used by skill, support, opfor-skill). */
export class DescriptionModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.StringField({ required: true, initial: "" }),
    };
  }
}
