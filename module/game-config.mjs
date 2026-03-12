/**
 * Centralized game configuration — all game-specific data lives here.
 * Code modules import from this file instead of hardcoding faction names,
 * card paths, deck names, or other game content.
 *
 * To add a new faction or deck, update only this file.
 * @module game-config
 */

/* ─── Factions ────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} FactionConfig
 * @property {string} key - Internal setting key (e.g. "cartels")
 * @property {string} label - Display label (e.g. "Cartel")
 * @property {string} folderName - Compendium folder name (e.g. "Cartel")
 * @property {string} threatCardPathPrefix - Path prefix for threat level card images
 * @property {string} threatTablePrefix - Table name prefix for threat levels
 * @property {string} reinforcementTableName - Reinforcement roll table name
 * @property {string} reinforcementCardPath - Reinforcement card image path
 */

/** @type {Record<string, FactionConfig>} Faction definitions keyed by setting key */
export const FACTIONS = {
  cartels: {
    key: "cartels",
    label: "Cartel",
    folderName: "Cartel",
    threatCardPathPrefix: "systems/haywire/assets/opfor_cartels/cartel_threat_level_",
    threatTablePrefix: "Cartel Threat Level",
    reinforcementTableName: "Cartel Reinforcements",
    reinforcementCardPath: "systems/haywire/assets/opfor_cartels/reinforcements.webp",
  },
  insurgents: {
    key: "insurgents",
    label: "Insurgents",
    folderName: "Insurgents",
    threatCardPathPrefix: "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_",
    threatTablePrefix: "Insurgent Threat Level",
    reinforcementTableName: "Insurgent Reinforcements",
    reinforcementCardPath: "systems/haywire/assets/opfor_insurgents/reinforcements.webp",
  },
  russians: {
    key: "russians",
    label: "Russians",
    folderName: "Russians",
    threatCardPathPrefix: "systems/haywire/assets/opfor_russians/russians_threat_level_",
    threatTablePrefix: "Russian Threat Level",
    reinforcementTableName: "Russian Reinforcements",
    reinforcementCardPath: "systems/haywire/assets/opfor_russians/reinforcements.webp",
  },
};

/** Derived: folder name → faction key mapping (built from FACTIONS) */
export const FACTION_FOLDER_TO_KEY = Object.fromEntries(
  Object.values(FACTIONS).map((f) => [f.folderName, f.key]),
);

/** Derived: faction key → threat card path prefix (built from FACTIONS) */
export const FACTION_THREAT_PATHS = Object.fromEntries(
  Object.values(FACTIONS).map((f) => [f.key, f.threatCardPathPrefix]),
);

/** Derived: faction key → threat table name prefix (built from FACTIONS) */
export const FACTION_THREAT_TABLES = Object.fromEntries(
  Object.values(FACTIONS).map((f) => [f.key, f.threatTablePrefix]),
);

/** Derived: faction key → reinforcement table name (built from FACTIONS) */
export const FACTION_REINFORCEMENT_TABLES = Object.fromEntries(
  Object.values(FACTIONS).map((f) => [f.key, f.reinforcementTableName]),
);

/** Derived: faction key → reinforcement card image path (built from FACTIONS) */
export const FACTION_REINFORCEMENT_PATHS = Object.fromEntries(
  Object.values(FACTIONS).map((f) => [f.key, f.reinforcementCardPath]),
);

/** Derived: setting choices for opforFaction (built from FACTIONS) */
export const FACTION_CHOICES = Object.fromEntries(
  Object.values(FACTIONS).map((f) => [f.key, f.label]),
);

/** Default faction key */
export const DEFAULT_FACTION = "cartels";

/* ─── Reinforcement Support Card Mapping ──────────────────────────────────── */

/**
 * Maps reinforcement roll result text (lowercased) to opfor-support card name.
 * Used by ReinforcementOverlay to look up the corresponding support card.
 * @type {Record<string, string>}
 */
export const REINFORCEMENT_SUPPORT_CARDS = {
  "blend in support": "Blend In",
  "human shield support": "Human Shield",
  "heli sniper support": "Heli Sniper",
  "chemical strike": "Chemical Strike",
  "hidden sniper": "Hidden Sniper",
  "mortar shelling": "Mortar Shelling",
  "fpv drone": "FPV Drone",
  "artillery barrage": "Artillery Barrage",
  "medallon mine": "Medallon Mine",
};

/* ─── Decks ───────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} DeckConfig
 * @property {string} name - Deck name in the compendium
 * @property {string} backcover - Backcover image path
 * @property {string} [settingKey] - World setting key for card IDs
 * @property {string} [altText] - Alt text for images
 * @property {string} [labelKey] - i18n key for the label
 * @property {string} [chatLabelKey] - i18n key for chat messages
 * @property {string} [iconClass] - FontAwesome icon class
 * @property {number} [defaultDie] - Default die value (fog of war)
 */

/** @type {Record<string, DeckConfig>} Deck configurations */
export const DECKS = {
  support: {
    name: "Support",
    backcover: "systems/haywire/assets/cards/backcovers/support.webp",
  },
  opforSupport: {
    name: "OPFOR Support",
    backcover: "systems/haywire/assets/cards/backcovers/support-opfor.webp",
  },
  infiltration: {
    name: "Infiltration",
    settingKey: "infilCardIds",
    backcover: "systems/haywire/assets/cards/backcovers/infil.webp",
    altText: "Infil",
    labelKey: "HAYWIRE.Infil.Label",
    chatLabelKey: "HAYWIRE.Infil.CardDrawn",
    iconClass: "fa-id-card",
  },
  operations: {
    name: "Operations",
    settingKey: "operationsCardIds",
    backcover: "systems/haywire/assets/cards/backcovers/operation.webp",
    altText: "Operations",
    labelKey: "HAYWIRE.Operations.Label",
    chatLabelKey: "HAYWIRE.Operations.CardDrawn",
    iconClass: "fa-map",
  },
  fogOfWar: {
    name: "Fog of War",
    backcover: "systems/haywire/assets/cards/backcovers/fog.webp",
    defaultDie: 6,
  },
};

/* ─── Compendium Pack Names ───────────────────────────────────────────────── */

/** @type {Record<string, string>} Compendium pack identifiers */
export const COMPENDIUM_PACKS = {
  decks: "haywire.decks",
  opforTables: "haywire.opfor-tables",
  opforSupport: "haywire.opfor-support",
};

/* ─── OPFOR Activity Patterns ─────────────────────────────────────────────── */

/**
 * Regex pattern matching OPFOR leader unit names.
 * Used to determine if opfor support/reinforcement overlays should activate.
 * @type {RegExp}
 */
export const LEADER_NAME_PATTERN = /^(squad commander|cell leader|leader)$/i;

/** Skill name that triggers opfor activity (case-insensitive comparison) */
export const OPFOR_ACTIVITY_SKILL = "support";

/* ─── Status Effects ──────────────────────────────────────────────────────── */

/**
 * @typedef {object} StatusEffectConfig
 * @property {string} id - Internal effect identifier
 * @property {string} name - i18n key for the display name
 * @property {string} img - Token icon image path
 */

/** @type {StatusEffectConfig[]} Token condition/status effects replacing Foundry defaults */
export const STATUS_EFFECTS = [
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

/* ─── World Settings Defaults ─────────────────────────────────────────────── */

/**
 * Default values for all resettable world settings.
 * Used by mission-reset and settings registration.
 * @type {Array<[string, unknown]>}
 */
export const SETTING_DEFAULTS = [
  ["fogOfWarDrawnCards", []],
  ["fogOfWarCardId", ""],
  ["fogOfWarDie", DECKS.fogOfWar.defaultDie],
  ["supportCardIds", []],
  ["opforSupportCardIds", []],
  ["infilCardIds", []],
  ["operationsCardIds", []],
  ["threatLevel", 0],
  ["threatAlert", false],
  ["opforFaction", ""],
];
