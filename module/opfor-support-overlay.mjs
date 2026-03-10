/**
 * OPFOR Support Cards Overlay — miniature backcover à gauche de l'alerte.
 * - Hover sur la miniature : affiche le panneau de cartes support OPFOR
 * - Hover sur une carte : affiche la carte en grand (style token overlay)
 * - Bouton "Activate" sur chaque carte → message chat + retrait de la carte
 * - Activable uniquement si l'alerte est levée ET un leader OPFOR avec le skill "Support" est sur le canvas
 */
export class OpforSupportOverlay {
  static #el = null;
  static #panelEl = null;
  static #previewEl = null;
  static #hideTimeout = null;
  static #cachedActivatable = null;

  /** Noms de leaders OPFOR connus. */
  static LEADER_NAMES = /^(squad commander|cell leader|leader)$/i;

  static init() {
    this.#getOrCreate();
    this.render();

    const onSettingChange = (setting) => {
      if (setting.key === "haywire.opforSupportCardIds" || setting.key === "haywire.threatAlert") {
        this.#cachedActivatable = null;
        this.render();
      }
    };
    Hooks.on("createSetting", onSettingChange);
    Hooks.on("updateSetting", onSettingChange);

    // Re-render when tokens are added/removed (leader may appear/disappear)
    Hooks.on("createToken", () => { this.#cachedActivatable = null; this.render(); });
    Hooks.on("deleteToken", () => { this.#cachedActivatable = null; this.render(); });

    // Re-render when an opfor-unit actor is updated (may gain/lose downed)
    Hooks.on("updateActor", (actor) => {
      if (actor.type === "opfor-unit") {
        this.#cachedActivatable = null;
        this.render();
      }
    });
  }

  /**
   * Vérifie si le support OPFOR est activable :
   * 1. L'alerte doit être active
   * 2. Un leader OPFOR avec le skill "Support" doit être sur le canvas et non downed
   */
  static async isActivatable() {
    if (this.#cachedActivatable !== null) return this.#cachedActivatable;

    // Check alert
    const alertActive = game.settings.get("haywire", "threatAlert");
    if (!alertActive) {
      this.#cachedActivatable = false;
      return false;
    }

    // Find opfor-unit tokens on canvas with leader name or "Support" skill
    const scene = game.scenes?.active;
    if (!scene) { this.#cachedActivatable = false; return false; }

    for (const token of scene.tokens) {
      const actor = token.actor;
      if (!actor || actor.type !== "opfor-unit") continue;
      if (actor.system.conditions?.has("downed")) continue;

      // Check by name
      if (this.LEADER_NAMES.test(actor.name)) {
        this.#cachedActivatable = true;
        return true;
      }

      // Check by skill name "Support"
      const skillUuids = actor.system.opforSkillIds ?? [];
      for (const uuid of skillUuids) {
        const skill = await fromUuid(uuid);
        if (skill?.name?.toLowerCase() === "support") {
          this.#cachedActivatable = true;
          return true;
        }
      }
    }

    this.#cachedActivatable = false;
    return false;
  }

  /** UUIDs des cartes support OPFOR actives. */
  static get cardIds() {
    return game.settings.get("haywire", "opforSupportCardIds") ?? [];
  }

  /** Met à jour la liste (GM only). */
  static async setCardIds(ids) {
    await game.settings.set("haywire", "opforSupportCardIds", ids);
  }

  /** Ajoute des cartes. */
  static async addCards(uuids) {
    const current = this.cardIds;
    const existing = new Set(current);
    const newIds = uuids.filter((uuid) => !existing.has(uuid));
    if (newIds.length === 0) return;
    await this.setCardIds([...current, ...newIds]);
  }

  /** Retire une carte après activation. */
  static async removeCard(uuid) {
    const ids = this.cardIds.filter((id) => id !== uuid);
    await this.setCardIds(ids);
  }

  /** Reconstruit le HTML. */
  static async render() {
    const el = this.#el;
    const panel = this.#panelEl;
    if (!el || !panel) return;

    const cardIds = this.cardIds;
    const count = cardIds.length;
    const activatable = await this.isActivatable();
    const i18n = (k) => game.i18n.localize(k);

    const pinSvg = `<span class="haywire-overlay-pin" title="${i18n("HAYWIRE.Pin")}"><svg viewBox="0 0 384 512"><path d="M300.8 203.9L290 213.1H273c-7.7 0-15 3.2-20.3 8.5L194.7 279.6 104.4 189.3l58-58c5.3-5.3 8.5-12.6 8.5-20.3V94.1l9.2-10.9C196.3 64.5 220.2 54 245.2 54h48c23.2 0 45.6 8.2 63.1 23L384 101.3 282.7 202.6zM96 297.4l87.6 87.6L57.6 511c-5.8 5.8-14.3 8-22.2 5.7S21.5 508.5 19.3 500.6c-2.3-7.9-.1-16.4 5.7-22.2L96 297.4z"/></svg></span>`;
    el.innerHTML = `
      <div class="haywire-support-thumb${!activatable && count > 0 ? " leader-downed" : ""}" title="${i18n("HAYWIRE.OpforSupport.Label")}">
        <img src="systems/haywire/assets/cards/backcovers/support-opfor.webp" alt="OPFOR Support" />
        ${pinSvg}
        ${count > 0 ? `<span class="haywire-support-badge">${activatable ? count : 0}</span>` : ""}
        ${!activatable && count > 0 ? `<span class="haywire-support-downed-icon" title="${i18n("HAYWIRE.OpforSupport.Locked")}"><i class="fas fa-lock"></i> ${count}</span>` : ""}
      </div>`;

    const thumb = el.querySelector(".haywire-support-thumb");
    thumb.addEventListener("mouseenter", () => this.#showPanel());
    thumb.addEventListener("mouseleave", () => this.#hidePanel());

    // Pin toggle
    el.querySelector(".haywire-overlay-pin")?.addEventListener("click", (e) => {
      e.stopPropagation();
      el.classList.toggle("user-pinned");
    });

    // Drag-and-drop support items onto the backcover
    thumb.addEventListener("dragover", (e) => {
      e.preventDefault();
      thumb.classList.add("drag-over");
    });
    thumb.addEventListener("dragleave", () => {
      thumb.classList.remove("drag-over");
    });
    thumb.addEventListener("drop", (e) => this.#onDrop(e, thumb));

    panel.addEventListener("mouseenter", () => this.#showPanel());
    panel.addEventListener("mouseleave", () => this.#hidePanel());

    await this.#renderPanel(panel, cardIds, count, activatable, i18n);
  }

  /* ---- Private ---- */

  static #getOrCreate() {
    if (!this.#el) {
      this.#el = document.createElement("div");
      this.#el.id = "haywire-opfor-support-overlay";
      document.body.appendChild(this.#el);
    }
    if (!this.#panelEl) {
      this.#panelEl = document.createElement("div");
      this.#panelEl.id = "haywire-opfor-support-panel";
      document.body.appendChild(this.#panelEl);
    }
    if (!this.#previewEl) {
      this.#previewEl = document.createElement("div");
      this.#previewEl.id = "haywire-opfor-support-preview";
      document.body.appendChild(this.#previewEl);
    }
  }

  static #showPanel() {
    clearTimeout(this.#hideTimeout);
    this.#panelEl?.classList.add("visible");
    this.#el?.classList.add("pinned");
  }

  static #hidePanel() {
    clearTimeout(this.#hideTimeout);
    this.#hideTimeout = setTimeout(() => {
      this.#panelEl?.classList.remove("visible");
      this.#el?.classList.remove("pinned");
      this.#hidePreview();
    }, 100);
  }

  static #showPreview(img, name) {
    const preview = this.#previewEl;
    if (!preview) return;
    preview.innerHTML = `<img src="${img}" alt="${name}" />`;
    preview.classList.add("visible");
  }

  static #hidePreview() {
    this.#previewEl?.classList.remove("visible");
  }

  static async #renderPanel(panel, cardIds, count, activatable, i18n) {
    const importBtn = game.user.isGM && count === 0
      ? `<button class="haywire-opfor-import-faction" title="${i18n("HAYWIRE.OpforSupport.SelectFaction")}">
           <i class="fas fa-file-import"></i> ${i18n("HAYWIRE.OpforSupport.ImportFaction")}
         </button>`
      : "";

    if (count === 0) {
      panel.innerHTML = `
        <div class="haywire-support-panel-inner">
          <div class="haywire-support-panel-header">
            <i class="fas fa-skull-crossbones"></i> ${i18n("HAYWIRE.OpforSupport.Label")}
          </div>
          <div class="haywire-support-empty">${i18n("HAYWIRE.Unit.NoSupport")}</div>
          ${importBtn}
        </div>`;
      this.#bindImportButton(panel);
      return;
    }

    const lockedBanner = !activatable
      ? `<div class="haywire-support-locked-banner"><i class="fas fa-lock"></i> ${i18n("HAYWIRE.OpforSupport.Locked")}</div>`
      : "";

    const resolved = await Promise.all(cardIds.map((uuid) => fromUuid(uuid)));
    const cardsHtml = cardIds
      .map((uuid, i) => {
        const card = resolved[i];
        const name = card?.name ?? "???";
        const img = card?.img ?? "icons/svg/card-hand.svg";
        return `
        <div class="haywire-support-card${!activatable ? " disabled" : ""}" data-preview-img="${img}" data-preview-name="${name}">
          <span class="haywire-support-card-remove" data-uuid="${uuid}" title="${i18n("HAYWIRE.Support.Remove")}"><i class="fas fa-times"></i></span>
          <img class="haywire-support-card-img" src="${img}" alt="${name}" />
          <button class="haywire-support-activate" data-uuid="${uuid}" data-name="${name}" data-img="${img}"
                  title="${!activatable ? i18n("HAYWIRE.OpforSupport.Locked") : i18n("HAYWIRE.Support.Activate")}"
                  ${!activatable ? "disabled" : ""}>
            <i class="fas fa-bullseye"></i> ${i18n("HAYWIRE.Support.Activate")}
          </button>
        </div>`;
      })
      .join("");

    panel.innerHTML = `
      <div class="haywire-support-panel-inner">
        <div class="haywire-support-panel-header">
          <i class="fas fa-skull-crossbones"></i> ${i18n("HAYWIRE.OpforSupport.Label")}
          <span class="haywire-support-count">${count}</span>
          <span class="haywire-support-purge" title="${i18n("HAYWIRE.Support.Purge")}"><i class="fas fa-trash"></i></span>
        </div>
        ${lockedBanner}
        <div class="haywire-support-cards">${cardsHtml}</div>
      </div>`;

    this.#bindPanelEvents(panel);
  }

  static #bindPanelEvents(panel) {
    panel.querySelectorAll(".haywire-support-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        this.#showPreview(card.dataset.previewImg, card.dataset.previewName);
      });
      card.addEventListener("mouseleave", () => {
        this.#hidePreview();
      });
    });

    panel.querySelectorAll(".haywire-support-activate").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const { uuid, name, img } = btn.dataset;
        await this.#activateCard(uuid, name, img);
      });
    });

    // Remove button
    panel.querySelectorAll(".haywire-support-card-remove").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.removeCard(btn.dataset.uuid);
      });
    });

    // Purge all cards
    panel.querySelector(".haywire-support-purge")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.setCardIds([]);
    });
  }

  static async #onDrop(event, thumb) {
    event.preventDefault();
    thumb.classList.remove("drag-over");

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }
    if (!data.uuid || data.type !== "Item") return;

    const current = this.cardIds;
    if (current.includes(data.uuid)) return;

    await this.setCardIds([...current, data.uuid]);
  }

  static #bindImportButton(panel) {
    panel.querySelector(".haywire-opfor-import-faction")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#showFactionDialog();
    });
  }

  static async #showFactionDialog() {
    const pack = game.packs.get("haywire.opfor-support");
    if (!pack) {
      ui.notifications.error("Compendium haywire.opfor-support not found.");
      return;
    }

    // Get all folders from the pack to build faction choices
    const index = await pack.getIndex({ fields: ["folder"] });
    const folders = pack.folders;
    if (!folders.size) {
      ui.notifications.warn("No folders found in opfor-support compendium.");
      return;
    }

    const buttons = [];
    for (const folder of folders) {
      buttons.push({
        action: folder.id,
        label: folder.name,
        icon: "fas fa-skull-crossbones",
        callback: () => this.#importFaction(index, folder),
      });
    }

    await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("HAYWIRE.OpforSupport.ImportFaction") },
      content: `<p>${game.i18n.localize("HAYWIRE.OpforSupport.SelectFaction")}</p>`,
      buttons,
    });
  }

  /** Maps compendium folder names to opforFaction setting keys. */
  static FACTION_KEYS = {
    Cartel: "cartels",
    Insurgents: "insurgents",
    Russians: "russians",
  };

  static async #importFaction(index, folder) {
    const entries = index.filter((e) => e.folder === folder._id);
    if (!entries.length) {
      ui.notifications.warn(`No cards found in folder "${folder.name}".`);
      return;
    }

    // Update the world faction setting to match the selected faction
    const factionKey = this.FACTION_KEYS[folder.name];
    if (factionKey) {
      await game.settings.set("haywire", "opforFaction", factionKey);
    }

    const uuids = entries.map((e) => `Compendium.haywire.opfor-support.Item.${e._id}`);
    await this.addCards(uuids);
    ui.notifications.info(`${entries.length} ${folder.name} support cards imported.`);
  }

  static async #activateCard(_uuid, name, img) {
    const i18n = (k) => game.i18n.localize(k);

    try {
      await ChatMessage.create({
        content: `<div class="haywire-card-chat">
          <div class="haywire-card-chat-header">
            <i class="fas fa-skull-crossbones"></i> ${i18n("HAYWIRE.OpforSupport.Activated")}
          </div>
          <img class="haywire-card-chat-img" src="${img}" alt="${name}" />
        </div>`,
      });
    } catch (err) {
      console.error("OpforSupportOverlay | ChatMessage.create failed", err);
    }

  }
}
