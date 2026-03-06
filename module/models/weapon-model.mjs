export class WeaponModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      weaponType: new fields.StringField({
        required: true,
        initial: "Primary",
        choices: {
          Primary: "HAYWIRE.WeaponType.Primary",
          Secondary: "HAYWIRE.WeaponType.Secondary",
          Sidearm: "HAYWIRE.WeaponType.Sidearm",
          Equipment: "HAYWIRE.WeaponType.Equipment",
        },
      }),
      range: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      rateOfFire: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      penetration: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      modifiers: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      special: new fields.StringField({ required: false, blank: true, initial: "" }),
    };
  }
}
