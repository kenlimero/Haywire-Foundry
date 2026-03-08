export class OpforUnitModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.StringField({ required: true, initial: "" }),
      cardImage: new fields.FilePathField({ categories: ["IMAGE"], required: false, initial: null }),
      faction: new fields.StringField({ required: true, initial: "" }),
      combatStats: new fields.SchemaField({
        easy: new fields.NumberField({ required: true, integer: true, min: 1, initial: 11 }),
        medium: new fields.NumberField({ required: true, integer: true, min: 1, initial: 15 }),
        hard: new fields.NumberField({ required: true, integer: true, min: 1, initial: 18 }),
      }),
      opforSkillIds: new fields.ArrayField(new fields.StringField()),
      weaponIds: new fields.ArrayField(new fields.StringField()),
      conditions: new fields.SetField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      suppression: new fields.NumberField({ required: true, integer: true, min: 0, max: 6, initial: 0 }),
      behavior: new fields.HTMLField({ required: true, initial: "" }),
    };
  }
}
