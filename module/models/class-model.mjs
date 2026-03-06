export class ClassModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      tier: new fields.NumberField({ required: true, integer: true, min: 1, max: 3, initial: 1 }),
      combatStats: new fields.SchemaField({
        easy: new fields.NumberField({ required: true, integer: true, min: 1, initial: 5 }),
        medium: new fields.NumberField({ required: true, integer: true, min: 1, initial: 9 }),
        hard: new fields.NumberField({ required: true, integer: true, min: 1, initial: 13 }),
      }),
      skillIds: new fields.ArrayField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      defaultWeapons: new fields.ArrayField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      imagePath: new fields.FilePathField({ categories: ["IMAGE"], required: false }),
    };
  }
}
