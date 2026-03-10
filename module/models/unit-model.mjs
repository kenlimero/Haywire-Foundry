import { uuidArrayField } from "./model-helpers.mjs";

export class UnitModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      tier: new fields.NumberField({ required: true, integer: true, min: 1, max: 2, initial: 1 }),
      role: new fields.StringField({ required: true, blank: true, initial: "" }),
      unitType: new fields.StringField({ required: true, blank: false, initial: "main" }),
      classIds: uuidArrayField(),
      supportCardIds: uuidArrayField(),
    };
  }
}
