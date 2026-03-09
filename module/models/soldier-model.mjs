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
      conditions: new fields.SetField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      weaponIds: new fields.ArrayField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      skillIds: new fields.ArrayField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      excludedWeaponIds: new fields.ArrayField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      excludedSkillIds: new fields.ArrayField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      supportIds: new fields.ArrayField(
        new fields.StringField({ required: true, blank: false }),
        { required: true, initial: [] },
      ),
      suppression: new fields.NumberField({ required: true, integer: true, min: 0, max: 6, initial: 0 }),
      combatStats: new fields.SchemaField({
        easy: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        medium: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        hard: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      }),
    };
  }
}
