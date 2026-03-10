import { openDb, writeFolders } from "./pack-utils.mjs";

const OUTPUT = "packs/opfor-support";

const STATS = { systemId: "haywire", systemVersion: "0.9.3", coreVersion: "13" };

// ─── ID generator ────────────────────────────────────────────────────────────
let counter = 0;
const nextId = () => `hwOsp${String(++counter).padStart(11, "0")}`;

// ─── Folder definitions ──────────────────────────────────────────────────────
const FOLDERS = [
  { id: "hwFldOpSup000001", name: "Cartel" },
  { id: "hwFldOpSup000002", name: "Insurgents" },
  { id: "hwFldOpSup000003", name: "Russians" },
];

// ─── Support card definitions per faction ────────────────────────────────────
const CARDS = [
  // Cartel
  { name: "Blend In",      faction: 0, img: "systems/haywire/assets/opfor_cartels/support_blend_in.webp" },
  { name: "Human Shield",  faction: 0, img: "systems/haywire/assets/opfor_cartels/support_human_shield.webp" },
  { name: "Heli Sniper",   faction: 0, img: "systems/haywire/assets/opfor_cartels/support_heli_sniper.webp" },

  // Insurgents
  { name: "Chemical Strike",  faction: 1, img: "systems/haywire/assets/opfor_insurgents/support_chemical_strike.webp" },
  { name: "Hidden Sniper",    faction: 1, img: "systems/haywire/assets/opfor_insurgents/support_hidden_sniper.webp" },
  { name: "Mortar Shelling",  faction: 1, img: "systems/haywire/assets/opfor_insurgents/support_mortar_shelling.webp" },

  // Russians
  { name: "FPV Drone",          faction: 2, img: "systems/haywire/assets/opfor_russians/support_fpv_drone.webp" },
  { name: "Artillery Barrage",  faction: 2, img: "systems/haywire/assets/opfor_russians/support_artillery_barrage.webp" },
  { name: "Medallon Mine",      faction: 2, img: "systems/haywire/assets/opfor_russians/support_medallon_mine.webp" },
];

// ═════════════════════════════════════════════════════════════════════════════
//  PACK INTO LEVELDB
// ═════════════════════════════════════════════════════════════════════════════
const db = await openDb(OUTPUT);

// Write folders
await writeFolders(db, FOLDERS, "Item", STATS);

console.log(`\nPacking ${CARDS.length} support cards...`);

for (const card of CARDS) {
  const id = nextId();
  const key = `!items!${id}`;
  const folderId = FOLDERS[card.faction].id;

  const doc = {
    _id: id,
    _key: key,
    name: card.name,
    type: "support",
    img: card.img,
    system: {
      description: "",
    },
    effects: [],
    folder: folderId,
    sort: counter * 100000,
    ownership: { default: 0 },
    flags: {},
    _stats: STATS,
  };

  await db.put(key, JSON.stringify(doc));
  console.log(`  ${key} → ${card.name} (${FOLDERS[card.faction].name})`);
}

await db.close();
console.log(`\nDone. ${CARDS.length} support cards + ${FOLDERS.length} folders packed into ${OUTPUT}`);
