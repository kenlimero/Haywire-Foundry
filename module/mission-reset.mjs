/**
 * Mission Reset — toolbar buttons that reset game state.
 * Two options: reset state only, or reset state + delete all tokens.
 * GM only, with confirmation dialog.
 */
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

  static async #resetAll(deleteTokens) {
    // Reset all world settings
    await game.settings.set("haywire", "fogOfWarDrawnCards", []);
    await game.settings.set("haywire", "fogOfWarCardId", "");
    await game.settings.set("haywire", "fogOfWarDie", 6);
    await game.settings.set("haywire", "supportCardIds", []);
    await game.settings.set("haywire", "opforSupportCardIds", []);
    await game.settings.set("haywire", "infilCardIds", []);
    await game.settings.set("haywire", "operationsCardIds", []);
    await game.settings.set("haywire", "threatLevel", 0);
    await game.settings.set("haywire", "threatAlert", false);

    const tokens = canvas.tokens?.placeables ?? [];

    if (deleteTokens) {
      // Delete all tokens from the scene
      const ids = tokens.map((t) => t.id);
      if (ids.length) await canvas.scene.deleteEmbeddedDocuments("Token", ids);
    } else {
      // Reset soldier tokens HP, suppression, conditions
      for (const token of tokens) {
        const actor = token.actor;
        if (!actor || actor.type !== "soldier") continue;
        await actor.update({
          "system.hitPoints.value": actor.system.hitPoints.max,
          "system.suppression": 0,
          "system.conditions": [],
        });
      }
    }

    // Confirmation chat message (whisper to GM)
    ChatMessage.create({
      content: `<p><strong><i class="fas fa-bomb"></i> ${game.i18n.localize("HAYWIRE.MissionReset.Done")}</strong></p>`,
      whisper: ChatMessage.getWhisperRecipients("GM"),
    });
  }
}
