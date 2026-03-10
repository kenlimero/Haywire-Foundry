// Haywire — Système FoundryVTT V13 pour le wargame tactique HAYWIRE V2

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

// Token overlay
import { TokenOverlay } from "./module/token-overlay.mjs";

// Threat level overlay
import { ThreatOverlay } from "./module/threat-overlay.mjs";

// Support cards overlay
import { SupportOverlay } from "./module/support-overlay.mjs";
import { OpforSupportOverlay } from "./module/opfor-support-overlay.mjs";

// Infil & Operations card overlays
import { InfilOverlay } from "./module/infil-overlay.mjs";
import { OperationsOverlay } from "./module/operations-overlay.mjs";

// Fog of War overlay
import { FogOfWarOverlay } from "./module/fog-of-war-overlay.mjs";

// Reinforcement overlay
import { ReinforcementOverlay } from "./module/reinforcement-overlay.mjs";

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

Hooks.once("init", () => {
  // Expose API for third-party modules
  game.haywire ??= {};
  game.haywire.HaywireRoll = HaywireRoll;

  // Document classes
  CONFIG.Actor.documentClass = HaywireActor;
  CONFIG.Item.documentClass = HaywireItem;

  // Data models — clés = noms des sous-types dans system.json > documentTypes
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

  // Sheets — V13 utilise le namespace complet
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "haywire", SoldierSheet, {
    types: ["soldier"],
    makeDefault: true,
    label: "HAYWIRE.SheetSoldier",
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "haywire", ClassSheet, {
    types: ["class"],
    makeDefault: true,
    label: "HAYWIRE.SheetClass",
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "haywire", WeaponSheet, {
    types: ["weapon"],
    makeDefault: true,
    label: "HAYWIRE.SheetWeapon",
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "haywire", SkillSheet, {
    types: ["skill"],
    makeDefault: true,
    label: "HAYWIRE.SheetSkill",
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "haywire", OpforSkillSheet, {
    types: ["opfor-skill"],
    makeDefault: true,
    label: "HAYWIRE.SheetOpforSkill",
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, "haywire", OpforUnitSheet, {
    types: ["opfor-unit"],
    makeDefault: true,
    label: "HAYWIRE.SheetOpforUnit",
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "haywire", UnitSheet, {
    types: ["unit"],
    makeDefault: true,
    label: "HAYWIRE.SheetUnit",
  });
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, "haywire", SupportSheet, {
    types: ["support"],
    makeDefault: true,
    label: "HAYWIRE.SheetSupport",
  });

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

  // Remplacer les conditions token par défaut par celles de Haywire
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

  // Pré-chargement templates
  foundry.applications.handlebars.loadTemplates([
    "systems/haywire/templates/actor/soldier-sheet.hbs",
    "systems/haywire/templates/actor/soldier-card.hbs",
    "systems/haywire/templates/actor/opfor-unit-sheet.hbs",
    "systems/haywire/templates/actor/opfor-unit-card.hbs",
    "systems/haywire/templates/item/opfor-skill-sheet.hbs",
    "systems/haywire/templates/item/class-sheet.hbs",
    "systems/haywire/templates/item/weapon-sheet.hbs",
    "systems/haywire/templates/item/skill-sheet.hbs",
    "systems/haywire/templates/item/unit-sheet.hbs",
    "systems/haywire/templates/item/support-sheet.hbs",
    "systems/haywire/templates/chat/roll-result.hbs",
  ]);

  // OPFOR faction setting (world-scoped, visible in settings)
  game.settings.register("haywire", "opforFaction", {
    name: "HAYWIRE.Threat.Faction",
    hint: "HAYWIRE.Threat.FactionHint",
    scope: "world",
    config: true,
    type: String,
    default: "cartels",
    choices: {
      cartels: "Cartel",
      insurgents: "Insurgents",
      russians: "Russians",
    },
  });

  // Threat level setting (world-scoped, GM only)
  game.settings.register("haywire", "threatLevel", {
    name: "HAYWIRE.Threat.Label",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
    range: { min: 0, max: 9, step: 1 },
  });

  game.settings.register("haywire", "threatAlert", {
    name: "HAYWIRE.Threat.Alert",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  // Support cards overlay setting (world-scoped, array of {uuid, leaderId} entries)
  game.settings.register("haywire", "supportCardIds", {
    name: "HAYWIRE.Support.Label",
    scope: "world",
    config: false,
    type: Array,
    default: [],
  });

  // OPFOR support cards overlay setting (world-scoped, array of card UUIDs)
  game.settings.register("haywire", "opforSupportCardIds", {
    name: "HAYWIRE.OpforSupport.Label",
    scope: "world",
    config: false,
    type: Array,
    default: [],
  });

  // Infil cards overlay setting (world-scoped, array of card UUIDs)
  game.settings.register("haywire", "infilCardIds", {
    name: "HAYWIRE.Infil.Label",
    scope: "world",
    config: false,
    type: Array,
    default: [],
  });

  // Operations cards overlay setting (world-scoped, array of card UUIDs)
  game.settings.register("haywire", "operationsCardIds", {
    name: "HAYWIRE.Operations.Label",
    scope: "world",
    config: false,
    type: Array,
    default: [],
  });

  // Fog of War overlay settings
  game.settings.register("haywire", "fogOfWarCardId", {
    name: "HAYWIRE.FogOfWar.Label",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register("haywire", "fogOfWarDie", {
    name: "HAYWIRE.FogOfWar.DieHint",
    scope: "world",
    config: false,
    type: Number,
    default: 0,
  });

  game.settings.register("haywire", "fogOfWarDrawnCards", {
    name: "Fog of War Drawn Cards",
    scope: "world",
    config: false,
    type: Array,
    default: [],
  });

  // Register scene control button for mission reset (must be in init, before ready)
  MissionReset.init();

  console.log("haywire | Système Haywire initialisé");
});

// Initialiser l'overlay Threat Level une fois le jeu prêt
Hooks.once("ready", () => {
  ThreatOverlay.init();
  SupportOverlay.init();
  OpforSupportOverlay.init();
  InfilOverlay.init();
  OperationsOverlay.init();
  FogOfWarOverlay.init();
  ReinforcementOverlay.init();
});

// Masquer le carré de fond derrière les icônes d'effets sur les tokens (garder uniquement le sprite rond)
Hooks.on("refreshToken", (token) => {
  if (!token.effects) return;
  for (const child of token.effects.children) {
    if (child instanceof PIXI.Graphics) child.visible = false;
  }
});

// Overlay au survol d'un token
Hooks.on("hoverToken", (token, hovered) => {
  if (hovered) TokenOverlay.show(token);
  else TokenOverlay.hide();
});

// Masquer l'overlay si le token affiché est supprimé
Hooks.on("deleteToken", (tokenDoc) => {
  if (TokenOverlay.currentTokenId === tokenDoc.id) TokenOverlay.hide();
});

// ─── Card draw display in chat ──────────────────────────────────────────────
function _postCardChatMessage(origin, cards, action) {
  for (const cardData of cards) {
    const faceImg = cardData.faces?.[0]?.img ?? cardData.face?.img ?? origin.img;
    const cardName = cardData.name ?? "???";
    ChatMessage.create({
      content: `<div class="haywire-card-chat">
        <div class="haywire-card-chat-header">
          <i class="fas fa-cards"></i> ${origin.name} — ${action}
        </div>
        <img class="haywire-card-chat-img" src="${faceImg}" alt="${cardName}" data-action="showCard" data-src="${faceImg}" data-title="${cardName}"/>
        <div class="haywire-card-chat-name">${cardName}</div>
      </div>`,
      speaker: { alias: origin.name },
    });
  }
}

// dealCards: deck → hand(s) via Deal
Hooks.on("dealCards", (origin, destinations, context) => {
  const cards = context.toCreate?.flat() ?? [];
  _postCardChatMessage(origin, cards, "Deal");
});

// passCards: covers draw, play, pass, discard
Hooks.on("passCards", (origin, destination, context) => {
  const cards = context.toCreate ?? [];
  _postCardChatMessage(origin, cards, context.action ?? "Draw");
});

// Hover on card image in chat → show preview overlay (top-right)
{
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
        preview.innerHTML = `<img src="${img.src}" alt="${img.alt}" />`;
        preview.classList.add("visible");
      });
      img.addEventListener("mouseleave", () => {
        getChatPreview().classList.remove("visible");
      });
    });
  });
}

// Quand un token est posé sur la carte, importer ses cartes support dans l'overlay
Hooks.on("createToken", (tokenDoc) => {
  const actor = tokenDoc.actor;
  if (!actor || actor.type !== "soldier") return;
  const supportIds = actor.system.supportIds ?? [];
  if (!supportIds.length) return;
  SupportOverlay.addCards(supportIds, actor.id);
});

// Prototype token defaults pour les nouveaux Actors Soldier
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
