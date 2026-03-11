/**
 * Haywire — FoundryVTT V13 system for the HAYWIRE V2 tactical wargame.
 * Main entry point: registers document classes, data models, sheets, overlays, and hooks.
 * @module haywire
 */

// Data Models
import { SoldierModel } from "./module/models/soldier-model.mjs";
import { ClassModel } from "./module/models/class-model.mjs";
import { WeaponModel } from "./module/models/weapon-model.mjs";
import { SkillModel } from "./module/models/skill-model.mjs";
import { OpforUnitModel } from "./module/models/opfor-unit-model.mjs";
import { OpforSkillModel } from "./module/models/opfor-skill-model.mjs";
import { UnitModel } from "./module/models/unit-model.mjs";
import { SupportModel } from "./module/models/support-model.mjs";

// Documents
import { HaywireActor } from "./module/documents/haywire-actor.mjs";
import { HaywireItem } from "./module/documents/haywire-item.mjs";

// Rolls
import { HaywireRoll } from "./module/rolls/haywire-roll.mjs";

// Overlays
import { TokenOverlay } from "./module/token-overlay.mjs";
import threatOverlay from "./module/threat-overlay.mjs";
import supportOverlay from "./module/support-overlay.mjs";
import opforSupportOverlay from "./module/opfor-support-overlay.mjs";
import { SimpleCardOverlay } from "./module/simple-card-overlay.mjs";
import fogOfWarOverlay from "./module/fog-of-war-overlay.mjs";
import reinforcementOverlay from "./module/reinforcement-overlay.mjs";

// Mission reset
import { MissionReset } from "./module/mission-reset.mjs";

// Sheets
import { SoldierSheet } from "./module/sheets/soldier-sheet.mjs";
import { ClassSheet } from "./module/sheets/class-sheet.mjs";
import { WeaponSheet } from "./module/sheets/weapon-sheet.mjs";
import { SkillSheet } from "./module/sheets/skill-sheet.mjs";
import { OpforUnitSheet } from "./module/sheets/opfor-unit-sheet.mjs";
import { OpforSkillSheet } from "./module/sheets/opfor-skill-sheet.mjs";
import { UnitSheet } from "./module/sheets/unit-sheet.mjs";
import { SupportSheet } from "./module/sheets/support-sheet.mjs";

import { escapeHtml } from "./module/overlay-helpers.mjs";

/* ─── Settings Registration ──────────────────────────────────────────────── */

/** @type {Array<[string, object]>} World-scoped settings definitions */
const WORLD_SETTINGS = [
  ["opforFaction", {
    name: "HAYWIRE.Threat.Faction",
    hint: "HAYWIRE.Threat.FactionHint",
    config: true,
    type: String,
    default: "cartels",
    choices: { cartels: "Cartel", insurgents: "Insurgents", russians: "Russians" },
  }],
  ["threatLevel", { name: "HAYWIRE.Threat.Label", type: Number, default: 0, range: { min: 0, max: 9, step: 1 } }],
  ["threatAlert", { name: "HAYWIRE.Threat.Alert", type: Boolean, default: false }],
  ["supportCardIds", { name: "HAYWIRE.Support.Label", type: Array, default: [] }],
  ["opforSupportCardIds", { name: "HAYWIRE.OpforSupport.Label", type: Array, default: [] }],
  ["infilCardIds", { name: "HAYWIRE.Infil.Label", type: Array, default: [] }],
  ["operationsCardIds", { name: "HAYWIRE.Operations.Label", type: Array, default: [] }],
  ["fogOfWarCardId", { name: "HAYWIRE.FogOfWar.Label", type: String, default: "" }],
  ["fogOfWarDie", { name: "HAYWIRE.FogOfWar.DieHint", type: Number, default: 6 }],
  ["fogOfWarDrawnCards", { name: "Fog of War Drawn Cards", type: Array, default: [] }],
];

/**
 * Register all world-scoped settings.
 * Settings without explicit config:true are hidden from the settings UI.
 */
function registerSettings() {
  for (const [key, def] of WORLD_SETTINGS) {
    game.settings.register("haywire", key, {
      scope: "world",
      config: false,
      ...def,
    });
  }
}

/* ─── Sheet Registration ─────────────────────────────────────────────────── */

/** @type {Array<{docClass: typeof Document, sheet: typeof Application, types: string[], label: string}>} */
const SHEET_REGISTRATIONS = [
  { docClass: Actor, sheet: SoldierSheet, types: ["soldier"], label: "HAYWIRE.SheetSoldier" },
  { docClass: Actor, sheet: OpforUnitSheet, types: ["opfor-unit"], label: "HAYWIRE.SheetOpforUnit" },
  { docClass: Item, sheet: ClassSheet, types: ["class"], label: "HAYWIRE.SheetClass" },
  { docClass: Item, sheet: WeaponSheet, types: ["weapon"], label: "HAYWIRE.SheetWeapon" },
  { docClass: Item, sheet: SkillSheet, types: ["skill"], label: "HAYWIRE.SheetSkill" },
  { docClass: Item, sheet: OpforSkillSheet, types: ["opfor-skill"], label: "HAYWIRE.SheetOpforSkill" },
  { docClass: Item, sheet: UnitSheet, types: ["unit"], label: "HAYWIRE.SheetUnit" },
  { docClass: Item, sheet: SupportSheet, types: ["support"], label: "HAYWIRE.SheetSupport" },
];

function registerSheets() {
  for (const { docClass, sheet, types, label } of SHEET_REGISTRATIONS) {
    foundry.applications.apps.DocumentSheetConfig.registerSheet(docClass, "haywire", sheet, {
      types,
      makeDefault: true,
      label,
    });
  }
}

/* ─── Init Hook ──────────────────────────────────────────────────────────── */

Hooks.once("init", () => {
  // Expose API for third-party modules
  game.haywire ??= {};
  game.haywire.HaywireRoll = HaywireRoll;

  // Document classes
  CONFIG.Actor.documentClass = HaywireActor;
  CONFIG.Item.documentClass = HaywireItem;

  // Data models
  CONFIG.Actor.dataModels = {
    soldier: SoldierModel,
    "opfor-unit": OpforUnitModel,
  };
  CONFIG.Item.dataModels = {
    class: ClassModel,
    weapon: WeaponModel,
    skill: SkillModel,
    "opfor-skill": OpforSkillModel,
    unit: UnitModel,
    support: SupportModel,
  };

  registerSheets();

  // Token bar attributes
  CONFIG.Actor.trackableAttributes = {
    soldier: {
      bar: ["hitPoints", "actionPoints"],
      value: [],
    },
    "opfor-unit": {
      bar: [],
      value: ["suppression"],
    },
  };

  // Replace default token conditions with Haywire's
  CONFIG.statusEffects = [
    { id: "downed", name: "HAYWIRE.Conditions.Downed", img: "systems/haywire/assets/tokens/downed.webp" },
    { id: "hidden", name: "HAYWIRE.Conditions.Hidden", img: "systems/haywire/assets/tokens/hidden.webp" },
    { id: "injured", name: "HAYWIRE.Conditions.Injured", img: "systems/haywire/assets/tokens/injured.webp" },
    { id: "overwatch", name: "HAYWIRE.Conditions.Overwatch", img: "systems/haywire/assets/tokens/overwatch.webp" },
    { id: "sup-1", name: "HAYWIRE.Suppression.1", img: "systems/haywire/assets/icons/sup-1.svg" },
    { id: "sup-2", name: "HAYWIRE.Suppression.2", img: "systems/haywire/assets/icons/sup-2.svg" },
    { id: "sup-3", name: "HAYWIRE.Suppression.3", img: "systems/haywire/assets/icons/sup-3.svg" },
    { id: "sup-4", name: "HAYWIRE.Suppression.4", img: "systems/haywire/assets/icons/sup-4.svg" },
    { id: "sup-5", name: "HAYWIRE.Suppression.5", img: "systems/haywire/assets/icons/sup-5.svg" },
    { id: "sup-6", name: "HAYWIRE.Suppression.6", img: "systems/haywire/assets/icons/sup-6.svg" },
  ];

  // Preload templates
  foundry.applications.handlebars.loadTemplates([
    "systems/haywire/templates/actor/soldier-sheet.hbs",
    "systems/haywire/templates/actor/soldier-card.hbs",
    "systems/haywire/templates/actor/opfor-unit-sheet.hbs",
    "systems/haywire/templates/actor/opfor-unit-card.hbs",
    "systems/haywire/templates/partials/conditions.hbs",
    "systems/haywire/templates/partials/combat-stats.hbs",
    "systems/haywire/templates/item/class-sheet.hbs",
    "systems/haywire/templates/item/weapon-sheet.hbs",
    "systems/haywire/templates/item/skill-sheet.hbs",
    "systems/haywire/templates/item/unit-sheet.hbs",
    "systems/haywire/templates/item/support-sheet.hbs",
    "systems/haywire/templates/chat/roll-result.hbs",
  ]);

  registerSettings();
  MissionReset.init();

  console.log("haywire | Système Haywire initialisé");
});

/* ─── Simple Card Overlay Instances ──────────────────────────────────────── */

const infilOverlay = new SimpleCardOverlay({
  settingKey: "infilCardIds",
  deckName: "Infiltration",
  elId: "haywire-infil-overlay",
  previewId: "haywire-infil-preview",
  backcover: "systems/haywire/assets/cards/backcovers/infil.webp",
  altText: "Infil",
  labelKey: "HAYWIRE.Infil.Label",
  chatLabelKey: "HAYWIRE.Infil.CardDrawn",
  iconClass: "fa-id-card",
});

const operationsOverlay = new SimpleCardOverlay({
  settingKey: "operationsCardIds",
  deckName: "Operations",
  elId: "haywire-operations-overlay",
  previewId: "haywire-operations-preview",
  backcover: "systems/haywire/assets/cards/backcovers/operation.webp",
  altText: "Operations",
  labelKey: "HAYWIRE.Operations.Label",
  chatLabelKey: "HAYWIRE.Operations.CardDrawn",
  iconClass: "fa-map",
});

/* ─── Ready Hook — Initialize Overlays ───────────────────────────────────── */

Hooks.once("ready", () => {
  threatOverlay.init();
  supportOverlay.init();
  opforSupportOverlay.init();
  infilOverlay.init();
  operationsOverlay.init();
  fogOfWarOverlay.init();
  reinforcementOverlay.init();
});

/* ─── Token Hooks ────────────────────────────────────────────────────────── */

// Hide square background behind token status effect icons (keep only the round sprite)
Hooks.on("refreshToken", (token) => {
  if (!token.effects) return;
  for (const child of token.effects.children) {
    if (child instanceof PIXI.Graphics) child.visible = false;
  }
});

// Token hover overlay
Hooks.on("hoverToken", (token, hovered) => {
  if (hovered) TokenOverlay.show(token);
  else TokenOverlay.hide();
});

// Hide overlay if the displayed token is deleted
Hooks.on("deleteToken", (tokenDoc) => {
  if (TokenOverlay.currentTokenId === tokenDoc.id) TokenOverlay.hide();
});

/* ─── Card Draw Chat Display ─────────────────────────────────────────────── */

/**
 * Post a chat message for each card in a card operation (deal/draw/play).
 * @param {object} origin - The source deck/hand
 * @param {object[]} cards - Array of card data objects
 * @param {string} action - Action label (e.g. "Deal", "Draw")
 */
function _postCardChatMessage(origin, cards, action) {
  for (const cardData of cards) {
    const faceImg = cardData.faces?.[0]?.img ?? cardData.face?.img ?? origin.img;
    const cardName = cardData.name ?? "???";
    ChatMessage.create({
      content: `<div class="haywire-card-chat">
        <div class="haywire-card-chat-header">
          <i class="fas fa-cards"></i> ${escapeHtml(origin.name)} — ${escapeHtml(action)}
        </div>
        <img class="haywire-card-chat-img" src="${escapeHtml(faceImg)}" alt="${escapeHtml(cardName)}" data-action="showCard" data-src="${escapeHtml(faceImg)}" data-title="${escapeHtml(cardName)}"/>
        <div class="haywire-card-chat-name">${escapeHtml(cardName)}</div>
      </div>`,
      speaker: { alias: origin.name },
    });
  }
}

Hooks.on("dealCards", (origin, destinations, context) => {
  const cards = context.toCreate?.flat() ?? [];
  _postCardChatMessage(origin, cards, "Deal");
});

Hooks.on("passCards", (origin, destination, context) => {
  const cards = context.toCreate ?? [];
  _postCardChatMessage(origin, cards, context.action ?? "Draw");
});

/* ─── Chat Card Image Preview ────────────────────────────────────────────── */

{
  /** @type {HTMLElement|null} */
  let chatPreviewEl = null;

  function getChatPreview() {
    if (!chatPreviewEl) {
      chatPreviewEl = document.createElement("div");
      chatPreviewEl.id = "haywire-chat-preview";
      document.body.appendChild(chatPreviewEl);
    }
    return chatPreviewEl;
  }

  Hooks.on("renderChatMessageHTML", (_message, html) => {
    html.querySelectorAll(".haywire-card-chat-img")?.forEach(img => {
      img.addEventListener("mouseenter", () => {
        const preview = getChatPreview();
        preview.innerHTML = `<img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" />`;
        preview.classList.add("visible");
      });
      img.addEventListener("mouseleave", () => {
        getChatPreview().classList.remove("visible");
      });
    });
  });
}

/* ─── Auto-import Support Cards on Token Creation ────────────────────────── */

Hooks.on("createToken", (tokenDoc) => {
  const actor = tokenDoc.actor;
  if (!actor || actor.type !== "soldier") return;
  const supportIds = actor.system.supportIds ?? [];
  if (!supportIds.length) return;
  supportOverlay.addCards(supportIds, actor.id);
});

/* ─── Prototype Token Defaults for New Soldier Actors ────────────────────── */

Hooks.on("preCreateActor", (actor) => {
  if (actor.type !== "soldier") return;
  actor.updateSource({
    "prototypeToken.actorLink": true,
    "prototypeToken.displayName": CONST.TOKEN_DISPLAY_MODES.HOVER,
    "prototypeToken.displayBars": CONST.TOKEN_DISPLAY_MODES.ALWAYS,
    "prototypeToken.bar1.attribute": "actionPoints",
    "prototypeToken.disposition": CONST.TOKEN_DISPOSITIONS.FRIENDLY,
  });
});
