import { HaywireRoll } from "../rolls/haywire-roll.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class OpforUnitSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/actor/opfor-unit-sheet.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "actor", "opfor-unit"],
    position: { width: 750, height: 556 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
    actions: {
      rollD20: OpforUnitSheet.#onRollD20,
    },
  };

  static async #onRollD20(event, target) {
    await HaywireRoll.d20({
      actor: this.actor,
      label: game.i18n.localize("HAYWIRE.RollD20"),
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.isEditable = this.isEditable;
    return context;
  }
}
