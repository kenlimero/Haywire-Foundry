import { ClassicLevel } from "classic-level";
import { rm } from "fs/promises";

const OUTPUT = "packs/oppfor-tables";

// ─── ID generators ───────────────────────────────────────────────────────────
let tableCounter = 0;
let resultCounter = 0;
const nextTableId = () => `hwTbl${String(++tableCounter).padStart(11, "0")}`;
const nextResultId = () => `hwRes${String(++resultCounter).padStart(11, "0")}`;

// ─── Helper to build a RollTable document ────────────────────────────────────
function makeTable(name, img, rows) {
  const _id = nextTableId();
  const results = rows.map(([lo, hi, text]) => ({
    _id: nextResultId(),
    type: 0,
    text,
    img,
    range: [lo, hi],
    drawn: false,
    weight: 1,
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
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    _stats: { systemId: "haywire", systemVersion: "0.3.0", coreVersion: "13" },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  CARTEL
// ═════════════════════════════════════════════════════════════════════════════
const cartelTables = [
  makeTable("Cartel Threat Level 1", "assets/oppfor_cartels/cartel_threat_level_01.jpg", [
    [1, 5, "Nothing"],
    [6, 10, "Civilian"],
    [11, 11, "1x Soldado, 1x Balacero"],
    [12, 12, "1x Soldado, 1x Halcón"],
    [13, 13, "1x Soldado, 1x Sanguinario"],
    [14, 14, "1x Soldado, 1x Sicario"],
    [15, 15, "1x Soldado, 1x Artillero"],
    [16, 18, "3x Soldados"],
    [19, 20, "3x Soldados, 1x Leader"],
  ]),
  makeTable("Cartel Threat Level 2", "assets/oppfor_cartels/cartel_threat_level_02.jpg", [
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
  ]),
  makeTable("Cartel Threat Level 3", "assets/oppfor_cartels/cartel_threat_level_03.jpg", [
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
  ]),
  makeTable("Cartel Threat Level 4", "assets/oppfor_cartels/cartel_threat_level_04.jpg", [
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
  ]),
  makeTable("Cartel Threat Level 5", "assets/oppfor_cartels/cartel_threat_level_05.jpg", [
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
  ]),
  makeTable("Cartel Threat Level 6", "assets/oppfor_cartels/cartel_threat_level_06.jpg", [
    [1, 2, "2x Federales"],
    [3, 4, "2x Soldados"],
    [5, 6, "2x Soldados, 1x Balacero"],
    [7, 8, "2x Soldados, 1x Halcón"],
    [9, 10, "2x Soldados, 1x Sanguinario"],
    [11, 12, "2x Soldados, 1x Sicario"],
    [13, 14, "2x Soldados, 1x Artillero"],
    [15, 18, "3x Soldados"],
    [19, 20, "3x Soldados, 1x Leader"],
  ]),
  makeTable("Cartel Threat Level 7", "assets/oppfor_cartels/cartel_threat_level_07.jpg", [
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
  ]),
  makeTable("Cartel Threat Level 8", "assets/oppfor_cartels/cartel_threat_level_08.jpg", [
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
  ]),
  makeTable("Cartel Threat Level 9", "assets/oppfor_cartels/cartel_threat_level_09.jpg", [
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
  ]),
  makeTable("Cartel Reinforcements - Supports", "assets/oppfor_cartels/reinforcements.jpg", [
    [1, 6, "Nothing"],
    [7, 10, "1 enemy group"],
    [11, 14, "2 enemy groups"],
    [15, 16, "Blend in support"],
    [17, 18, "Human shield support"],
    [19, 20, "Heli sniper support"],
  ]),
  makeTable("Cartel Reinforcements - Vehicles", "assets/oppfor_cartels/reinforcements.jpg", [
    [1, 4, "Civilian vehicle"],
    [5, 8, "Pickup"],
    [9, 14, "Technical"],
    [15, 20, "Light armored vehicle"],
  ]),
];

// ═════════════════════════════════════════════════════════════════════════════
//  INSURGENTS
// ═════════════════════════════════════════════════════════════════════════════
const insurgentTables = [
  makeTable("Insurgent Threat Level 1", "assets/oppfor_insurgents/insurgents_threat_level_01.jpg", [
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
  ]),
  makeTable("Insurgent Threat Level 2", "assets/oppfor_insurgents/insurgents_threat_level_02.jpg", [
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
  ]),
  makeTable("Insurgent Threat Level 3", "assets/oppfor_insurgents/insurgents_threat_level_03.jpg", [
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
  ]),
  makeTable("Insurgent Threat Level 4", "assets/oppfor_insurgents/insurgents_threat_level_04.jpg", [
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
  ]),
  makeTable("Insurgent Threat Level 5", "assets/oppfor_insurgents/insurgents_threat_level_05.jpg", [
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
  ]),
  makeTable("Insurgent Threat Level 6", "assets/oppfor_insurgents/insurgents_threat_level_06.jpg", [
    [1, 3, "2 Fighters"],
    [4, 5, "2x Fighters, 1x True believer"],
    [6, 7, "2x Fighters, 1x Sniper"],
    [8, 9, "2x Fighters, 1x Gunner"],
    [10, 11, "2x Fighters, 1x Foreign advisor"],
    [12, 13, "2x Fighters, 1x Rocketeer"],
    [14, 15, "2x Fighters, 1x Executioner"],
    [16, 18, "3x Fighters"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ]),
  makeTable("Insurgent Threat Level 7", "assets/oppfor_insurgents/insurgents_threat_level_07.jpg", [
    [1, 3, "2x Fighters, 1x True believer"],
    [4, 6, "2x Fighters, 1x Sniper"],
    [7, 9, "2x Fighters, 1x Gunner"],
    [10, 12, "2x Fighters, 1x Foreign advisor"],
    [13, 15, "2x Fighters, 1x Rocketeer"],
    [16, 18, "2x Fighters, 1x Executioner"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ]),
  makeTable("Insurgent Threat Level 8", "assets/oppfor_insurgents/insurgents_threat_level_08.jpg", [
    [1, 3, "3x Fighters, 1x True believer"],
    [4, 6, "3x Fighters, 1x Sniper"],
    [7, 9, "3x Fighters, 1x Gunner"],
    [10, 12, "3x Fighters, 1x Foreign advisor"],
    [13, 15, "3x Fighters, 1x Rocketeer"],
    [16, 18, "3x Fighters, 1x Executioner"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ]),
  makeTable("Insurgent Threat Level 9", "assets/oppfor_insurgents/insurgents_threat_level_09.jpg", [
    [1, 3, "4x Fighters, 1x True believer"],
    [4, 6, "4x Fighters, 1x Sniper"],
    [7, 9, "4x Fighters, 1x Gunner"],
    [10, 12, "4x Fighters, 1x Foreign advisor"],
    [13, 15, "4x Fighters, 1x Rocketeer"],
    [16, 18, "4x Fighters, 1x Executioner"],
    [19, 20, "3x Fighters, 1x Cell leader"],
  ]),
  makeTable("Insurgent Reinforcements - Supports", "assets/oppfor_insurgents/reinforcements.jpg", [
    [1, 6, "Nothing"],
    [7, 10, "1 enemy group"],
    [11, 14, "2 enemy groups"],
    [15, 16, "Chemical strike"],
    [17, 18, "Hidden sniper"],
    [19, 20, "Mortar shelling"],
  ]),
  makeTable("Insurgent Reinforcements - Vehicles", "assets/oppfor_insurgents/reinforcements.jpg", [
    [1, 4, "Civilian vehicle"],
    [5, 8, "Pickup"],
    [9, 12, "Technical"],
    [13, 16, "Light armored vehicle"],
    [17, 18, "VBIED"],
    [19, 20, "Medium or heavy armored vehicle"],
  ]),
];

// ═════════════════════════════════════════════════════════════════════════════
//  RUSSIANS
// ═════════════════════════════════════════════════════════════════════════════
const russianTables = [
  makeTable("Russian Threat Level 1", "assets/oppfor_russians/russians_threat_level_01.jpg", [
    [1, 8, "Nothing"],
    [9, 10, "2x Conscripts"],
    [11, 12, "2x Riflemen"],
    [13, 14, "1x Rifleman, 1x Automatic rifleman"],
    [15, 16, "1x Rifleman, 1x Lieutenant"],
    [17, 18, "1x Rifleman, 1x AT specialist"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ]),
  makeTable("Russian Threat Level 2", "assets/oppfor_russians/russians_threat_level_02.jpg", [
    [1, 6, "Nothing"],
    [7, 8, "2x Conscripts"],
    [9, 10, "2x Riflemen"],
    [11, 12, "1x Rifleman, 1x Automatic rifleman"],
    [13, 14, "1x Rifleman, 1x Lieutenant"],
    [15, 16, "1x Rifleman, 1x AT specialist"],
    [17, 18, "3x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ]),
  makeTable("Russian Threat Level 3", "assets/oppfor_russians/russians_threat_level_03.jpg", [
    [1, 4, "Nothing"],
    [5, 6, "2x Conscripts"],
    [7, 9, "2x Riflemen"],
    [10, 12, "1x Rifleman, 1x Automatic rifleman"],
    [13, 14, "1x Rifleman, 1x Lieutenant"],
    [15, 16, "1x Rifleman, 1x AT specialist"],
    [17, 18, "3x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ]),
  makeTable("Russian Threat Level 4", "assets/oppfor_russians/russians_threat_level_04.jpg", [
    [1, 2, "Nothing"],
    [3, 5, "2x Conscripts"],
    [6, 8, "2x Riflemen"],
    [9, 11, "1x Rifleman, 1x Automatic rifleman"],
    [12, 14, "1x Rifleman, 1x Lieutenant"],
    [15, 16, "1x Rifleman, 1x AT specialist"],
    [17, 18, "3x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ]),
  makeTable("Russian Threat Level 5", "assets/oppfor_russians/russians_threat_level_05.jpg", [
    [1, 3, "2x Conscripts"],
    [4, 6, "2x Riflemen"],
    [7, 9, "1x Rifleman, 1x Automatic rifleman"],
    [10, 12, "1x Rifleman, 1x Lieutenant"],
    [13, 15, "1x Rifleman, 1x AT specialist"],
    [16, 18, "3x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ]),
  makeTable("Russian Threat Level 6", "assets/oppfor_russians/russians_threat_level_06.jpg", [
    [1, 6, "2x Assaults"],
    [7, 9, "1x Rifleman, 1x Automatic rifleman"],
    [10, 12, "1x Rifleman, 1x Lieutenant"],
    [13, 15, "1x Rifleman, 1x AT specialist"],
    [16, 18, "3x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ]),
  makeTable("Russian Threat Level 7", "assets/oppfor_russians/russians_threat_level_07.jpg", [
    [1, 3, "3x Assaults"],
    [4, 6, "2x Assaults, 1x Sniper"],
    [7, 9, "2x Riflemen, 1x Automatic rifleman"],
    [10, 12, "2x Riflemen, 1x Lieutenant"],
    [13, 15, "2x Riflemen, 1x AT specialist"],
    [16, 18, "4x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ]),
  makeTable("Russian Threat Level 8", "assets/oppfor_russians/russians_threat_level_08.jpg", [
    [1, 3, "3x Assaults"],
    [4, 6, "3x Assaults, 1x Sniper"],
    [7, 9, "3x Assaults, 1x Machine gunner"],
    [10, 12, "3x Riflemen, 1x Lieutenant"],
    [13, 15, "3x Riflemen, 1x AT specialist"],
    [16, 18, "5x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ]),
  makeTable("Russian Threat Level 9", "assets/oppfor_russians/russians_threat_level_09.jpg", [
    [1, 3, "4x Assaults"],
    [4, 6, "4x Assaults, 1x Sniper"],
    [7, 9, "4x Assaults, 1x Machine gunner"],
    [10, 12, "4x Riflemen, 1x Lieutenant"],
    [13, 15, "4x Assaults, 1x Grenadier"],
    [16, 18, "6x Riflemen"],
    [19, 20, "3x Riflemen, 1x Squad commander"],
  ]),
  makeTable("Russian Reinforcements - Supports", "assets/oppfor_russians/reinforcements.jpg", [
    [1, 6, "Nothing"],
    [7, 10, "1 enemy group"],
    [11, 14, "2 enemy groups"],
    [15, 16, "FPV drone"],
    [17, 18, "Artillery barrage"],
    [19, 20, "Medallon mine"],
  ]),
  makeTable("Russian Reinforcements - Vehicles", "assets/oppfor_russians/reinforcements.jpg", [
    [1, 6, "Civilian vehicle"],
    [7, 12, "Light armored vehicle"],
    [13, 18, "Medium armored vehicle"],
    [19, 20, "Heavy armored vehicle"],
  ]),
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

console.log(`Packing ${allTables.length} tables...`);

for (const table of allTables) {
  const key = `!tables!${table._id}`;
  const resultCount = table.results.length;

  // Store results as separate sub-documents (Foundry V13 embedded collections)
  for (const result of table.results) {
    const resultKey = `!tables.results!${table._id}.${result._id}`;
    result._key = resultKey;
    await db.put(resultKey, JSON.stringify(result));
  }

  // Store table document WITHOUT embedded results array
  const tableDoc = { ...table, results: [], _key: key };
  await db.put(key, JSON.stringify(tableDoc));
  console.log(`  ${key} → ${table.name} (${resultCount} results)`);
}

await db.close();
console.log(`\nDone. ${allTables.length} tables packed into ${OUTPUT}`);
