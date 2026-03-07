// Haywire — Système FoundryVTT V13 pour le wargame tactique HAYWIRE V2

// Data Models
import { SoldierModel } from "./module/models/soldier-model.mjs";
import { ClassModel } from "./module/models/class-model.mjs";
import { WeaponModel } from "./module/models/weapon-model.mjs";
import { SkillModel } from "./module/models/skill-model.mjs";

// Documents
import { HaywireActor } from "./module/documents/haywire-actor.mjs";
import { HaywireItem } from "./module/documents/haywire-item.mjs";

// Rolls
import { HaywireRoll } from "./module/rolls/haywire-roll.mjs";

// Sheets
import { SoldierSheet } from "./module/sheets/soldier-sheet.mjs";
import { ClassSheet } from "./module/sheets/class-sheet.mjs";
import { WeaponSheet } from "./module/sheets/weapon-sheet.mjs";
import { SkillSheet } from "./module/sheets/skill-sheet.mjs";

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
  };
  CONFIG.Item.dataModels = {
    class: ClassModel,
    weapon: WeaponModel,
    skill: SkillModel,
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

  // Token bar attributes
  CONFIG.Actor.trackableAttributes = {
    soldier: {
      bar: ["hitPoints"],
      value: ["actionPoints"],
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
    "systems/haywire/templates/item/class-sheet.hbs",
    "systems/haywire/templates/item/weapon-sheet.hbs",
    "systems/haywire/templates/item/skill-sheet.hbs",
    "systems/haywire/templates/chat/roll-result.hbs",
  ]);

  console.log("haywire | Système Haywire initialisé");
});

// Prototype token defaults pour les nouveaux Actors Soldier
Hooks.on("preCreateActor", (actor) => {
  if (actor.type !== "soldier") return;
  actor.updateSource({
    "prototypeToken.actorLink": true,
    "prototypeToken.displayName": CONST.TOKEN_DISPLAY_MODES.HOVER,
    "prototypeToken.displayBars": CONST.TOKEN_DISPLAY_MODES.HOVER,
    "prototypeToken.bar1.attribute": "hitPoints",
    "prototypeToken.disposition": CONST.TOKEN_DISPOSITIONS.FRIENDLY,
  });
});
