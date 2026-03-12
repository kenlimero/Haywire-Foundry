/**
 * Mission Reset — toolbar buttons that reset game state.
 * Two options: reset state only, or reset state + delete all tokens.
 * GM only, with confirmation dialog.
 * @module mission-reset
 */

import { SETTING_DEFAULTS } from "./game-config.mjs";

export class MissionReset {
  /** Register the toolbar buttons via Foundry's scene controls API. */
  static init() {
    Hooks.on("getSceneControlButtons", (controls) => {
      if (!game.user.isGM) return;
      controls["haywire-reset"] = {
        name: "haywire-reset",
        title: "HAYWIRE.MissionReset.Label",
        icon: "fas fa-bomb",
        visible: true,
        tools: {
          "reset-mission": {
            name: "reset-mission",
            title: "HAYWIRE.MissionReset.ResetState",
            icon: "fas fa-rotate-left",
            button: true,
            onChange: () => this.#confirmReset(false),
          },
          "reset-mission-tokens": {
            name: "reset-mission-tokens",
            title: "HAYWIRE.MissionReset.ResetAll",
            icon: "fas fa-skull-crossbones",
            button: true,
            onChange: () => this.#confirmReset(true),
          },
        },
      };
    });
  }

  /**
   * Show confirmation dialog before resetting.
   * @param {boolean} deleteTokens - Whether to also delete all tokens
   */
  static async #confirmReset(deleteTokens) {
    const key = deleteTokens ? "ConfirmContentAll" : "ConfirmContent";
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("HAYWIRE.MissionReset.ConfirmTitle") },
      content: `<p>${game.i18n.localize(`HAYWIRE.MissionReset.${key}`)}</p>`,
      yes: { default: false },
      no: { default: true },
    });
    if (!confirmed) return;

    await this.#resetAll(deleteTokens);
  }

  /**
   * Reset all world settings and optionally delete tokens.
   * Settings are reset in parallel for better performance.
   * @param {boolean} deleteTokens - Whether to also delete all tokens
   */
  static async #resetAll(deleteTokens) {
    // Reset all world settings in parallel
    await Promise.all(
      SETTING_DEFAULTS.map(([key, value]) => game.settings.set("haywire", key, value)),
    );

    const tokens = canvas.tokens?.placeables ?? [];

    if (deleteTokens) {
      const ids = tokens.map((t) => t.id);
      if (ids.length) await canvas.scene.deleteEmbeddedDocuments("Token", ids);
    } else {
      // Reset soldier tokens HP, suppression, conditions in parallel
      const updates = tokens
        .filter((t) => t.actor?.type === "soldier")
        .map((t) => t.actor.update({
          "system.hitPoints.value": t.actor.system.hitPoints.max,
          "system.suppression": 0,
          "system.conditions": [],
        }));
      if (updates.length) await Promise.all(updates);
    }

    // Confirmation chat message (whisper to GM)
    await ChatMessage.create({
      content: `<p><strong><i class="fas fa-bomb"></i> ${game.i18n.localize("HAYWIRE.MissionReset.Done")}</strong></p>`,
      whisper: ChatMessage.getWhisperRecipients("GM"),
    });
  }
}
