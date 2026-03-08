import { ClassicLevel } from "classic-level";
import { rm } from "fs/promises";

const OUTPUT = "packs/opfor-tables";

// ─── ID generators ───────────────────────────────────────────────────────────
let tableCounter = 0;
let resultCounter = 0;
const nextTableId = () => `hwTbl${String(++tableCounter).padStart(11, "0")}`;
const nextResultId = () => `hwRes${String(++resultCounter).padStart(11, "0")}`;

const STATS = { systemId: "haywire", systemVersion: "0.5.6", coreVersion: "13" };

// ─── Folder definitions ──────────────────────────────────────────────────────
const FOLDERS = {
  cartel:       { id: "hwFldOpfor000001", name: "Cartel",           parent: null },
  cartelTL:     { id: "hwFldOpfor000002", name: "Threat Levels",    parent: "hwFldOpfor000001" },
  cartelSup:    { id: "hwFldOpfor000003", name: "Support",          parent: "hwFldOpfor000001" },
  insurgents:   { id: "hwFldOpfor000004", name: "Insurgents",       parent: null },
  insurgentsTL: { id: "hwFldOpfor000005", name: "Threat Levels",    parent: "hwFldOpfor000004" },
  insurgentsSup:{ id: "hwFldOpfor000006", name: "Support",          parent: "hwFldOpfor000004" },
  russians:     { id: "hwFldOpfor000007", name: "Russians",         parent: null },
  russiansTL:   { id: "hwFldOpfor000008", name: "Threat Levels",    parent: "hwFldOpfor000007" },
  russiansSup:  { id: "hwFldOpfor000009", name: "Support",          parent: "hwFldOpfor000007" },
};

// ─── Helper to build a RollTable document ────────────────────────────────────
function makeTable(name, img, rows, folderId) {
  const _id = nextTableId();
  const results = rows.map(([lo, hi, text]) => ({
    _id: nextResultId(),
    type: "text",
    name: "",
    img: null,
    description: text,
    weight: 1,
    range: [lo, hi],
    drawn: false,
    flags: {},
    _stats: STATS,
  }));
  return {
    _id,
    name,
    img,
    description: "",
    results,
    formula: "1d20",
    replacement: true,
    displayRoll: true,
    folder: folderId,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    _stats: STATS,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  CARTEL
// ═════════════════════════════════════════════════════════════════════════════
const cartelTables = [
  makeTable("Cartel Threat Level 1", "systems/haywire/assets/opfor_cartels/cartel_threat_level_01.webp", [
    [1, 5, "Nothing"],
    [6, 10, "Civilian"],
    [11, 11, "1x Soldado, 1x Balacero"],
    [12, 12, "1x Soldado, 1x Halcón"],
    [13, 13, "1x Soldado, 1x Sanguinario"],
    [14, 14, "1x Soldado, 1x Sicario"],
    [15, 15, "1x Soldado, 1x Artillero"],
    [16, 18, "3x Soldados"],
    [19, 20, "3x Soldados, 1x Leader"],
  ], FOLDERS.cartelTL.id),
  makeTable("Cartel Threat Level 2", "systems/haywire/assets/opfor_cartels/cartel_threat_level_02.webp", [
    [1, 4, "Nothing"],
    [5, 8, "Civilian"],
    [9, 10, "2x Soldados"],
    [11, 11, "1x Soldado, 1x Balacero"],
    [12, 12, "1x Soldado, 1x Halcón"],
    [13, 13, "1x Soldado, 1x Sanguinario"],
    [14, 14, "1x Soldado, 1x Sicario"],
    [15, 15, "1x Soldado, 1x Artillero"],
    [16, 18, "3x Soldados"],
    [19, 20, "3x Soldados, 1x Leader"],
  ], FOLDERS.cartelTL.id),
  makeTable("Cartel Threat Level 3", "systems/haywire/assets/opfor_cartels/cartel_threat_level_03.webp", [
    [1, 3, "Nothing"],
    [4, 6, "Civilian"],
    [7, 8, "2x Soldados"],
    [9, 10, "1x Soldado, 1x Balacero"],
    [11, 12, "1x Soldado, 1x Halcón"],
    [13, 13, "1x Soldado, 1x Sanguinario"],
    [14, 14, "1x Soldado, 1x Sicario"],
    [15, 15, "1x Soldado, 1x Artillero"],
    [16, 18, "3x Soldados"],
    [19, 20, "3x Soldados, 1x Leader"],
  ], FOLDERS.cartelTL.id),
  makeTable("Cartel Threat Level 4", "systems/haywire/assets/opfor_cartels/cartel_threat_level_04.webp", [
    [1, 2, "Nothing"],
    [3, 4, "Civilian"],
    [5, 6, "2x Soldados"],
    [7, 8, "1x Soldado, 1x Balacero"],
    [9, 10, "1x Soldado, 1x Halcón"],
    [11, 12, "1x Soldado, 1x Sanguinario"],
    [13, 14, "1x Soldado, 1x Sicario"],
    [15, 15, "1x Soldado, 1x Artillero"],
    [16, 18, "3x Soldados"],
    [19, 20, "3x Soldados, 1x Leader"],
  ], FOLDERS.cartelTL.id),
  makeTable("Cartel Threat Level 5", "systems/haywire/assets/opfor_cartels/cartel_threat_level_05.webp", [
    [1, 1, "Nothing"],
    [2, 2, "Civilian"],
    [3, 4, "2x Soldados"],
    [5, 6, "2x Soldados, 1x Balacero"],
    [7, 8, "2x Soldados, 1x Halcón"],
    [9, 10, "2x Soldados, 1x Sanguinario"],
    [11, 12, "2x Soldados, 1x Sicario"],
    [13, 14, "2x Soldados, 1x Artillero"],
    [15, 18, "3x Soldados"],
    [19, 20, "3x Soldados, 1x Leader"],
  ], FOLDERS.cartelTL.id),
  makeTable("Cartel Threat Level 6", "systems/haywire/assets/opfor_cartels/cartel_threat_level_06.webp", [
    [1, 2, "2x Federales"],
    [3, 4, "2x Soldados"],
    [5, 6, "2x Soldados, 1x Balacero"],
    [7, 8, "2x Soldados, 1x Halcón"],
    [9, 10, "2x Soldados, 1x Sanguinario"],
    [11, 12, "2x Soldados, 1x Sicario"],
    [13, 14, "2x Soldados, 1x Artillero"],
    [15, 18, "3x Soldados"],
    [19, 20, "3x Soldados, 1x Leader"],
  ], FOLDERS.cartelTL.id),
  makeTable("Cartel Threat Level 7", "systems/haywire/assets/opfor_cartels/cartel_threat_level_07.webp", [
    [1, 2, "3x Federales"],
    [3, 4, "2x Federales, 1x Francotirador"],
    [5, 6, "2x Federales, 1x Patrullero"],
    [7, 8, "2x Federales, 1x Fusilero automático"],
    [9, 10, "2x Soldados, 1x Balacero"],
    [11, 12, "2x Soldados, 1x Halcón"],
    [13, 14, "2x Soldados, 1x Sanguinario"],
    [15, 16, "2x Soldados, 1x Sicario"],
    [17, 18, "2x Soldados, 1x Artilleroos"],
    [19, 20, "3x Soldados, 1x Leader"],
  ], FOLDERS.cartelTL.id),
  makeTable("Cartel Threat Level 8", "systems/haywire/assets/opfor_cartels/cartel_threat_level_08.webp", [
    [1, 2, "4x Federales"],
    [3, 4, "3x Federales, 1x Francotirador"],
    [5, 6, "3x Federales, 1x Patrullero"],
    [7, 8, "3x Federales, 1x Fusilero automático"],
    [9, 10, "3x Soldados, 1x Balacero"],
    [11, 12, "3x Soldados, 1x Halcón"],
    [13, 14, "3x Soldados, 1x Sanguinario"],
    [15, 16, "3x Soldados, 1x Sicario"],
    [17, 18, "3x Soldados, 1x Artilleroos"],
    [19, 20, "3x Soldados, 1x Leader"],
  ], FOLDERS.cartelTL.id),
  makeTable("Cartel Threat Level 9", "systems/haywire/assets/opfor_cartels/cartel_threat_level_09.webp", [
    [1, 2, "5x Federales"],
    [3, 4, "4x Federales, 1x Francotirador"],
    [5, 6, "4x Federales, 1x Patrullero"],
    [7, 8, "4x Federales, 1x Fusilero automático"],
    [9, 10, "4x Soldados, 1x Balacero"],
    [11, 12, "4x Soldados, 1x Halcón"],
    [13, 14, "4x Soldados, 1x Sanguinario"],
    [15, 16, "4x Soldados, 1x Sicario"],
    [17, 18, "4x Soldados, 1x Artilleroos"],
    [19, 20, "3x Soldados, 1x Leader"],
  ], FOLDERS.cartelTL.id),
  // Reinforcement card — at faction root
  makeTable("Cartel Reinforcements", "systems/haywire/assets/opfor_cartels/reinforcements.webp", [
    [1, 6, "Nothing"],
    [7, 10, "1 enemy group"],
    [11, 14, "2 enemy groups"],
    [15, 16, "Blend in support"],
    [17, 18, "Human shield support"],
    [19, 20, "Heli sniper support"],
  ], FOLDERS.cartel.id),
  // Vehicles — in Support subfolder
  makeTable("Cartel Reinforcements - Vehicles", "systems/haywire/assets/opfor_cartels/reinforcements.webp", [
    [1, 4, "Civilian vehicle"],
    [5, 8, "Pickup"],
    [9, 14, "Technical"],
    [15, 20, "Light armored vehicle"],
  ], FOLDERS.cartelSup.id),
];

// ═════════════════════════════════════════════════════════════════════════════
//  INSURGENTS
// ═════════════════════════════════════════════════════════════════════════════
const insurgentTables = [
  makeTable("Insurgent Threat Level 1", "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_01.webp", [
    [1, 5, "Nothing"],
    [6, 10, "Civilian"],
    [11, 11, "1x Fighter, 1x True believer"],
    [12, 12, "1x Fighter, 1x Sniper"],
    [13, 13, "1x Fighter, 1x Gunner"],
    [14, 14, "1x Fighter, 1x Foreign advisor"],
    [15, 15, "1x Fighter, 1x Rocketeer"],
    [16, 16, "1x Fighter, 1x Executioner"],
    [17, 18, "3x Fighters"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ], FOLDERS.insurgentsTL.id),
  makeTable("Insurgent Threat Level 2", "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_02.webp", [
    [1, 4, "Nothing"],
    [5, 8, "Civilian"],
    [9, 9, "2 Fighters"],
    [10, 10, "1x Fighter, 1x True believer"],
    [11, 11, "1x Fighter, 1x Sniper"],
    [12, 12, "1x Fighter, 1x Gunner"],
    [13, 13, "1x Fighter, 1x Foreign advisor"],
    [14, 14, "1x Fighter, 1x Rocketeer"],
    [15, 15, "1x Fighter, 1x Executioner"],
    [16, 18, "3x Fighters"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ], FOLDERS.insurgentsTL.id),
  makeTable("Insurgent Threat Level 3", "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_03.webp", [
    [1, 3, "Nothing"],
    [4, 6, "Civilian"],
    [7, 8, "2 Fighters"],
    [9, 10, "1x Fighter, 1x True believer"],
    [11, 11, "1x Fighter, 1x Sniper"],
    [12, 12, "1x Fighter, 1x Gunner"],
    [13, 13, "1x Fighter, 1x Foreign advisor"],
    [14, 14, "1x Fighter, 1x Rocketeer"],
    [15, 15, "1x Fighter, 1x Executioner"],
    [16, 18, "3x Fighters"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ], FOLDERS.insurgentsTL.id),
  makeTable("Insurgent Threat Level 4", "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_04.webp", [
    [1, 2, "Nothing"],
    [3, 4, "Civilian"],
    [5, 6, "2 Fighters"],
    [7, 8, "1x Fighter, 1x True believer"],
    [9, 10, "1x Fighter, 1x Sniper"],
    [11, 12, "1x Fighter, 1x Gunner"],
    [13, 13, "1x Fighter, 1x Foreign advisor"],
    [14, 14, "1x Fighter, 1x Rocketeer"],
    [15, 15, "1x Fighter, 1x Executioner"],
    [16, 18, "3x Fighters"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ], FOLDERS.insurgentsTL.id),
  makeTable("Insurgent Threat Level 5", "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_05.webp", [
    [1, 1, "Nothing"],
    [2, 2, "Civilian"],
    [3, 4, "2 Fighters"],
    [5, 6, "1x Fighter, 1x True believer"],
    [7, 8, "1x Fighter, 1x Sniper"],
    [9, 10, "1x Fighter, 1x Gunner"],
    [11, 12, "1x Fighter, 1x Foreign advisor"],
    [13, 14, "1x Fighter, 1x Rocketeer"],
    [15, 15, "1x Fighter, 1x Executioner"],
    [16, 18, "3x Fighters"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ], FOLDERS.insurgentsTL.id),
  makeTable("Insurgent Threat Level 6", "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_06.webp", [
    [1, 3, "2 Fighters"],
    [4, 5, "2x Fighters, 1x True believer"],
    [6, 7, "2x Fighters, 1x Sniper"],
    [8, 9, "2x Fighters, 1x Gunner"],
    [10, 11, "2x Fighters, 1x Foreign advisor"],
    [12, 13, "2x Fighters, 1x Rocketeer"],
    [14, 15, "2x Fighters, 1x Executioner"],
    [16, 18, "3x Fighters"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ], FOLDERS.insurgentsTL.id),
  makeTable("Insurgent Threat Level 7", "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_07.webp", [
    [1, 3, "2x Fighters, 1x True believer"],
    [4, 6, "2x Fighters, 1x Sniper"],
    [7, 9, "2x Fighters, 1x Gunner"],
    [10, 12, "2x Fighters, 1x Foreign advisor"],
    [13, 15, "2x Fighters, 1x Rocketeer"],
    [16, 18, "2x Fighters, 1x Executioner"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ], FOLDERS.insurgentsTL.id),
  makeTable("Insurgent Threat Level 8", "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_08.webp", [
    [1, 3, "3x Fighters, 1x True believer"],
    [4, 6, "3x Fighters, 1x Sniper"],
    [7, 9, "3x Fighters, 1x Gunner"],
    [10, 12, "3x Fighters, 1x Foreign advisor"],
    [13, 15, "3x Fighters, 1x Rocketeer"],
    [16, 18, "3x Fighters, 1x Executioner"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ], FOLDERS.insurgentsTL.id),
  makeTable("Insurgent Threat Level 9", "systems/haywire/assets/opfor_insurgents/insurgents_threat_level_09.webp", [
    [1, 3, "4x Fighters, 1x True believer"],
    [4, 6, "4x Fighters, 1x Sniper"],
    [7, 9, "4x Fighters, 1x Gunner"],
    [10, 12, "4x Fighters, 1x Foreign advisor"],
    [13, 15, "4x Fighters, 1x Rocketeer"],
    [16, 18, "4x Fighters, 1x Executioner"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ], FOLDERS.insurgentsTL.id),
  // Reinforcement card — at faction root
  makeTable("Insurgent Reinforcements", "systems/haywire/assets/opfor_insurgents/reinforcements.webp", [
    [1, 6, "Nothing"],
    [7, 10, "1 enemy group"],
    [11, 14, "2 enemy groups"],
    [15, 16, "Chemical strike"],
    [17, 18, "Hidden sniper"],
    [19, 20, "Mortar shelling"],
  ], FOLDERS.insurgents.id),
  // Vehicles — in Support subfolder
  makeTable("Insurgent Reinforcements - Vehicles", "systems/haywire/assets/opfor_insurgents/reinforcements.webp", [
    [1, 4, "Civilian vehicle"],
    [5, 8, "Pickup"],
    [9, 12, "Technical"],
    [13, 16, "Light armored vehicle"],
    [17, 18, "VBIED"],
    [19, 20, "Medium or heavy armored vehicle"],
  ], FOLDERS.insurgentsSup.id),
];

// ═════════════════════════════════════════════════════════════════════════════
//  RUSSIANS
// ═════════════════════════════════════════════════════════════════════════════
const russianTables = [
  makeTable("Russian Threat Level 1", "systems/haywire/assets/opfor_russians/russians_threat_level_01.webp", [
    [1, 8, "Nothing"],
    [9, 10, "2x Conscripts"],
    [11, 12, "2x Riflemen"],
    [13, 14, "1x Rifleman, 1x Automatic rifleman"],
    [15, 16, "1x Rifleman, 1x Lieutenant"],
    [17, 18, "1x Rifleman, 1x AT specialist"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ], FOLDERS.russiansTL.id),
  makeTable("Russian Threat Level 2", "systems/haywire/assets/opfor_russians/russians_threat_level_02.webp", [
    [1, 6, "Nothing"],
    [7, 8, "2x Conscripts"],
    [9, 10, "2x Riflemen"],
    [11, 12, "1x Rifleman, 1x Automatic rifleman"],
    [13, 14, "1x Rifleman, 1x Lieutenant"],
    [15, 16, "1x Rifleman, 1x AT specialist"],
    [17, 18, "3x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ], FOLDERS.russiansTL.id),
  makeTable("Russian Threat Level 3", "systems/haywire/assets/opfor_russians/russians_threat_level_03.webp", [
    [1, 4, "Nothing"],
    [5, 6, "2x Conscripts"],
    [7, 9, "2x Riflemen"],
    [10, 12, "1x Rifleman, 1x Automatic rifleman"],
    [13, 14, "1x Rifleman, 1x Lieutenant"],
    [15, 16, "1x Rifleman, 1x AT specialist"],
    [17, 18, "3x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ], FOLDERS.russiansTL.id),
  makeTable("Russian Threat Level 4", "systems/haywire/assets/opfor_russians/russians_threat_level_04.webp", [
    [1, 2, "Nothing"],
    [3, 5, "2x Conscripts"],
    [6, 8, "2x Riflemen"],
    [9, 11, "1x Rifleman, 1x Automatic rifleman"],
    [12, 14, "1x Rifleman, 1x Lieutenant"],
    [15, 16, "1x Rifleman, 1x AT specialist"],
    [17, 18, "3x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ], FOLDERS.russiansTL.id),
  makeTable("Russian Threat Level 5", "systems/haywire/assets/opfor_russians/russians_threat_level_05.webp", [
    [1, 3, "2x Conscripts"],
    [4, 6, "2x Riflemen"],
    [7, 9, "1x Rifleman, 1x Automatic rifleman"],
    [10, 12, "1x Rifleman, 1x Lieutenant"],
    [13, 15, "1x Rifleman, 1x AT specialist"],
    [16, 18, "3x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ], FOLDERS.russiansTL.id),
  makeTable("Russian Threat Level 6", "systems/haywire/assets/opfor_russians/russians_threat_level_06.webp", [
    [1, 6, "2x Assaults"],
    [7, 9, "1x Rifleman, 1x Automatic rifleman"],
    [10, 12, "1x Rifleman, 1x Lieutenant"],
    [13, 15, "1x Rifleman, 1x AT specialist"],
    [16, 18, "3x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ], FOLDERS.russiansTL.id),
  makeTable("Russian Threat Level 7", "systems/haywire/assets/opfor_russians/russians_threat_level_07.webp", [
    [1, 3, "3x Assaults"],
    [4, 6, "2x Assaults, 1x Sniper"],
    [7, 9, "2x Riflemen, 1x Automatic rifleman"],
    [10, 12, "2x Riflemen, 1x Lieutenant"],
    [13, 15, "2x Riflemen, 1x AT specialist"],
    [16, 18, "4x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ], FOLDERS.russiansTL.id),
  makeTable("Russian Threat Level 8", "systems/haywire/assets/opfor_russians/russians_threat_level_08.webp", [
    [1, 3, "3x Assaults"],
    [4, 6, "3x Assaults, 1x Sniper"],
    [7, 9, "3x Assaults, 1x Machine gunner"],
    [10, 12, "3x Riflemen, 1x Lieutenant"],
    [13, 15, "3x Riflemen, 1x AT specialist"],
    [16, 18, "5x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ], FOLDERS.russiansTL.id),
  makeTable("Russian Threat Level 9", "systems/haywire/assets/opfor_russians/russians_threat_level_09.webp", [
    [1, 3, "4x Assaults"],
    [4, 6, "4x Assaults, 1x Sniper"],
    [7, 9, "4x Assaults, 1x Machine gunner"],
    [10, 12, "4x Riflemen, 1x Lieutenant"],
    [13, 15, "4x Assaults, 1x Grenadier"],
    [16, 18, "6x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ], FOLDERS.russiansTL.id),
  // Reinforcement card — at faction root
  makeTable("Russian Reinforcements", "systems/haywire/assets/opfor_russians/reinforcements.webp", [
    [1, 6, "Nothing"],
    [7, 10, "1 enemy group"],
    [11, 14, "2 enemy groups"],
    [15, 16, "FPV drone"],
    [17, 18, "Artillery barrage"],
    [19, 20, "Medallon mine"],
  ], FOLDERS.russians.id),
  // Vehicles — in Support subfolder
  makeTable("Russian Reinforcements - Vehicles", "systems/haywire/assets/opfor_russians/reinforcements.webp", [
    [1, 6, "Civilian vehicle"],
    [7, 12, "Light armored vehicle"],
    [13, 18, "Medium armored vehicle"],
    [19, 20, "Heavy armored vehicle"],
  ], FOLDERS.russiansSup.id),
];

// ═════════════════════════════════════════════════════════════════════════════
//  PACK INTO LEVELDB
// ═════════════════════════════════════════════════════════════════════════════
const allTables = [...cartelTables, ...insurgentTables, ...russianTables];

// Validate ranges cover 1-20
for (const table of allTables) {
  const covered = new Set();
  for (const r of table.results) {
    for (let i = r.range[0]; i <= r.range[1]; i++) covered.add(i);
  }
  for (let i = 1; i <= 20; i++) {
    if (!covered.has(i)) {
      console.error(`ERROR: ${table.name} missing roll value ${i}`);
      process.exit(1);
    }
  }
}

await rm(OUTPUT, { recursive: true, force: true });
const db = new ClassicLevel(OUTPUT, { keyEncoding: "utf8", valueEncoding: "utf8" });

// Write folders
let folderSort = 0;
for (const [key, f] of Object.entries(FOLDERS)) {
  const folderKey = `!folders!${f.id}`;
  const folder = {
    _id: f.id,
    _key: folderKey,
    name: f.name,
    type: "RollTable",
    sorting: "a",
    sort: ++folderSort * 100000,
    color: null,
    folder: f.parent,
    flags: {},
    _stats: STATS,
  };
  await db.put(folderKey, JSON.stringify(folder));
  console.log(`Folder: ${f.name}${f.parent ? ` (child of ${f.parent})` : ""}`);
}

// Create sublevel for results (Foundry V13 embedded collection pattern)
const resultsSublevel = db.sublevel("tables.results", { keyEncoding: "utf8", valueEncoding: "utf8" });

console.log(`\nPacking ${allTables.length} tables...`);

for (const table of allTables) {
  const key = `!tables!${table._id}`;
  const resultCount = table.results.length;

  // Write each result into the sublevel, keyed as "{tableId}.{resultId}"
  const resultIds = [];
  for (const result of table.results) {
    const resultKey = `${table._id}.${result._id}`;
    await resultsSublevel.put(resultKey, JSON.stringify(result));
    resultIds.push(result._id);
  }

  // Store table document with results as array of IDs (not full objects)
  const tableDoc = { ...table, results: resultIds, _key: key };
  await db.put(key, JSON.stringify(tableDoc));
  console.log(`  ${key} → ${table.name} (${resultCount} results)`);
}

await db.close();
console.log(`\nDone. ${allTables.length} tables + ${Object.keys(FOLDERS).length} folders packed into ${OUTPUT}`);
