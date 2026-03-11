/**
 * Sheet for the Unit item type.
 * Supports deploying soldiers from class roster, drag-drop of classes,
 * support card display, and hover previews.
 * @module unit-sheet
 */
import { resolveUuids, parseItemDrop } from "./sheet-helpers.mjs";
import { escapeHtml } from "../overlay-helpers.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class UnitSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static PARTS = {
    sheet: {
      template: "systems/haywire/templates/item/unit-sheet.hbs",
    },
  };

  static DEFAULT_OPTIONS = {
    classes: ["haywire", "item", "unit"],
    position: { width: 550, height: 650 },
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
    actions: {
      deployUnit: UnitSheet.#onDeployUnit,
      showSupport: UnitSheet.#onShowSupport,
      removeClass: UnitSheet.#onRemoveClass,
      removeSupport: UnitSheet.#onRemoveSupport,
    },
  };

  /**
   * Handle class item drops.
   * @param {DragEvent} event
   */
  async #onDrop(event) {
    if (!this.isEditable) return;

    const drop = await parseItemDrop(event);
    if (!drop) return;

    if (drop.item.type === "class") {
      if (this.item.system.classIds.includes(drop.uuid)) return;
      await this.item.update({ "system.classIds": [...this.item.system.classIds, drop.uuid] });
    } else {
      console.warn("haywire | UnitSheet: Only Class items can be dropped here");
    }
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.isEditable = this.isEditable;

    // Resolve classes and support cards in parallel
    const [classEntries, supportEntries] = await Promise.all([
      resolveUuids(this.item.system.classIds ?? []),
      resolveUuids(this.item.system.supportCardIds ?? []),
    ]);

    context.classes = classEntries.map(({ uuid, resolved: c, missing }) => ({
      uuid,
      name: c?.name ?? `[${uuid}]`,
      img: c?.system?.imagePath ?? c?.img ?? null,
      missing,
    }));

    context.supportCards = supportEntries.map(({ uuid, resolved: s, missing }) => ({
      uuid,
      name: s?.name ?? `[${uuid}]`,
      img: s?.faces?.[0]?.img ?? s?.img ?? null,
      missing,
    }));

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    this.#bindHoverPreview();

    if (!this.isEditable) return;

    this.element.addEventListener("dragover", (e) => e.preventDefault());
    this.element.addEventListener("drop", (e) => this.#onDrop(e));
  }

  #bindHoverPreview() {
    const el = this.element;
    el.querySelectorAll("[data-preview-img]").forEach((node) => {
      const orientation = node.closest(".haywire-support-entry") ? "landscape" : "portrait";
      node.addEventListener("mouseenter", () => {
        this.#showPreview(node.dataset.previewImg, node.dataset.previewName, orientation);
      });
      node.addEventListener("mouseleave", () => this.#hidePreview());
    });
  }

  /**
   * @param {string} img - Image source
   * @param {string} name - Alt text
   * @param {"portrait"|"landscape"} [orientation="portrait"]
   */
  #showPreview(img, name, orientation = "portrait") {
    if (!img) return;
    if (!this._previewEl) {
      this._previewEl = document.createElement("div");
      this._previewEl.id = "haywire-unit-preview";
      document.body.appendChild(this._previewEl);
    }
    this._previewEl.innerHTML = `<img src="${escapeHtml(img)}" alt="${escapeHtml(name)}" />`;
    this._previewEl.classList.remove("portrait", "landscape");
    this._previewEl.classList.add("visible", orientation);
  }

  #hidePreview() {
    this._previewEl?.classList.remove("visible");
  }

  /** @override */
  _onClose(options) {
    this._previewEl?.remove();
    this._previewEl = null;
    return super._onClose(options);
  }

  // ── Actions ─────

  /**
   * Deploy unit: create soldier actors from class roster.
   * Assigns support cards to the leader.
   */
  static async #onDeployUnit() {
    const unit = this.item;
    const unitName = unit.name;
    const classUuids = unit.system.classIds ?? [];

    if (!classUuids.length) {
      ui.notifications.warn("No classes defined for this unit.");
      return;
    }

    // Create or find the folder
    let folder = game.folders.find(f => f.name === unitName && f.type === "Actor");
    if (!folder) {
      folder = await Folder.create({ name: unitName, type: "Actor" });
    }

    // Resolve all classes in parallel
    const resolvedClasses = await Promise.all(
      classUuids.map(uuid => fromUuid(uuid).catch((err) => {
        console.warn(`haywire | UnitSheet.deploy: failed to resolve class "${uuid}"`, err);
        return null;
      })),
    );

    const actorsData = [];
    for (let i = 0; i < classUuids.length; i++) {
      const cls = resolvedClasses[i];
      if (!cls) continue;

      const classUuid = classUuids[i];
      const combatStats = cls.system.combatStats ?? { easy: 5, medium: 9, hard: 13 };

      actorsData.push({
        name: cls.name,
        type: "soldier",
        img: cls.system.imagePath || cls.img || "icons/svg/mystery-man.svg",
        folder: folder.id,
        system: {
          hitPoints: { value: 2, max: 2 },
          actionPoints: { value: 2, max: 2 },
          classId: classUuid,
          combatStats,
        },
      });
    }

    if (!actorsData.length) {
      ui.notifications.warn("No valid classes found to deploy.");
      return;
    }

    const created = await Actor.createDocuments(actorsData);

    // Find the leader actor (Team Leader or Squad Leader)
    const leader = created.find((a) => /leader/i.test(a.name));

    // Store support card UUIDs on the leader actor
    const supportCardIds = unit.system.supportCardIds ?? [];
    if (supportCardIds.length && leader) {
      await leader.update({ "system.supportIds": [...supportCardIds] });
    }

    ui.notifications.info(`${created.length} soldiers created in folder "${unitName}".`);
  }

  /**
   * Show a support card image in a popout.
   * @param {Event} event
   * @param {HTMLElement} target
   */
  static #onShowSupport(event, target) {
    const src = target.dataset.src;
    const title = target.dataset.title;
    if (!src) return;
    const popout = new foundry.applications.apps.ImagePopout({
      src,
      uuid: null,
      caption: "",
      window: { title },
    });
    popout.render(true).then(() => popout.setPosition({ width: 556, height: 450 }));
  }

  /**
   * @param {Event} event
   * @param {HTMLElement} target
   */
  static async #onRemoveClass(event, target) {
    if (!this.isEditable) return;
    const uuid = target.dataset.classUuid;
    const classIds = this.item.system.classIds.filter(id => id !== uuid);
    await this.item.update({ "system.classIds": classIds });
  }

  /**
   * @param {Event} event
   * @param {HTMLElement} target
   */
  static async #onRemoveSupport(event, target) {
    if (!this.isEditable) return;
    const uuid = target.dataset.supportUuid;
    const supportCardIds = this.item.system.supportCardIds.filter(id => id !== uuid);
    await this.item.update({ "system.supportCardIds": supportCardIds });
  }
}
