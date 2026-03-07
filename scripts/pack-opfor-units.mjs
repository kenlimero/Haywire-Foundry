import { ClassicLevel } from "classic-level";
import { rm } from "fs/promises";

const OUTPUT = "packs/opfor-units";

const STATS = { systemId: "haywire", systemVersion: "0.5.6", coreVersion: "13" };

// ─── Folder definitions ──────────────────────────────────────────────────────
const FOLDERS = [
  { id: "hwFldOpfUn000001", name: "Cartel" },
  { id: "hwFldOpfUn000002", name: "Insurgents" },
  { id: "hwFldOpfUn000003", name: "Russians" },
];

// ─── Unit definitions per faction ────────────────────────────────────────────
let unitCounter = 0;
const nextUnitId = () => `hwOfu${String(++unitCounter).padStart(11, "0")}`;

const UNITS = [
  // Cartel
  { name: "Soldado",             faction: 0, img: "systems/haywire/assets/opfor_cartels/soldado.webp" },
  { name: "Balacero",            faction: 0, img: "systems/haywire/assets/opfor_cartels/balacero.webp" },
  { name: "Halcón",              faction: 0, img: "systems/haywire/assets/opfor_cartels/halcon.webp" },
  { name: "Sanguinario",         faction: 0, img: "systems/haywire/assets/opfor_cartels/sanguinario.webp" },
  { name: "Sicario",             faction: 0, img: "systems/haywire/assets/opfor_cartels/sicario.webp" },
  { name: "Artillero",           faction: 0, img: "systems/haywire/assets/opfor_cartels/artillero.webp" },
  { name: "Leader",              faction: 0, img: "systems/haywire/assets/opfor_cartels/teniente.webp" },
  { name: "Federales",           faction: 0, img: "systems/haywire/assets/opfor_cartels/federales.webp" },
  { name: "Francotirador",       faction: 0, img: "systems/haywire/assets/opfor_cartels/francotirador.webp" },
  { name: "Patrullero",          faction: 0, img: "systems/haywire/assets/opfor_cartels/patrullero.webp" },
  { name: "Fusilero automático", faction: 0, img: "systems/haywire/assets/opfor_cartels/fusilero_automatico.webp" },

  // Insurgents
  { name: "Fighter",          faction: 1, img: "systems/haywire/assets/opfor_insurgents/fighter.webp" },
  { name: "True believer",    faction: 1, img: "systems/haywire/assets/opfor_insurgents/true_believer.webp" },
  { name: "Sniper",           faction: 1, img: "systems/haywire/assets/opfor_insurgents/sniper.webp" },
  { name: "Gunner",           faction: 1, img: "systems/haywire/assets/opfor_insurgents/gunner.webp" },
  { name: "Foreign advisor",  faction: 1, img: "systems/haywire/assets/opfor_insurgents/foreign_advisor.webp" },
  { name: "Rocketeer",        faction: 1, img: "systems/haywire/assets/opfor_insurgents/rocketeer.webp" },
  { name: "Executioner",      faction: 1, img: "systems/haywire/assets/opfor_insurgents/executioner.webp" },
  { name: "Cell leader",      faction: 1, img: "systems/haywire/assets/opfor_insurgents/cell_leader.webp" },

  // Russians
  { name: "Conscript",          faction: 2, img: "systems/haywire/assets/opfor_russians/conscript.webp" },
  { name: "Rifleman",           faction: 2, img: "systems/haywire/assets/opfor_russians/rifleman.webp" },
  { name: "Automatic rifleman", faction: 2, img: "systems/haywire/assets/opfor_russians/automatic_rifleman.webp" },
  { name: "Lieutenant",         faction: 2, img: "systems/haywire/assets/opfor_russians/lieutenant.webp" },
  { name: "AT specialist",      faction: 2, img: "systems/haywire/assets/opfor_russians/at_specialist.webp" },
  { name: "Assault",            faction: 2, img: "systems/haywire/assets/opfor_russians/assault.webp" },
  { name: "Sniper",             faction: 2, img: "systems/haywire/assets/opfor_russians/sniper.webp" },
  { name: "Machine gunner",     faction: 2, img: "systems/haywire/assets/opfor_russians/machine_gunner.webp" },
  { name: "Grenadier",          faction: 2, img: "systems/haywire/assets/opfor_russians/grenadier.webp" },
  { name: "Squad commander",    faction: 2, img: "systems/haywire/assets/opfor_russians/squad_commander.webp" },
];

// ═════════════════════════════════════════════════════════════════════════════
//  PACK INTO LEVELDB
// ═════════════════════════════════════════════════════════════════════════════
await rm(OUTPUT, { recursive: true, force: true });
const db = new ClassicLevel(OUTPUT, { keyEncoding: "utf8", valueEncoding: "utf8" });

// Write folders
for (let i = 0; i < FOLDERS.length; i++) {
  const f = FOLDERS[i];
  const folderKey = `!folders!${f.id}`;
  const folder = {
    _id: f.id,
    _key: folderKey,
    name: f.name,
    type: "Actor",
    sorting: "a",
    sort: (i + 1) * 100000,
    color: null,
    folder: null,
    flags: {},
    _stats: STATS,
  };
  await db.put(folderKey, JSON.stringify(folder));
  console.log(`Folder: ${f.name}`);
}

// Write unit items
console.log(`\nPacking ${UNITS.length} units...`);

for (const unit of UNITS) {
  const _id = nextUnitId();
  const key = `!actors!${_id}`;
  const folderId = FOLDERS[unit.faction].id;

  const doc = {
    _id,
    _key: key,
    name: unit.name,
    type: "opfor-unit",
    img: unit.img.replace(".webp", "-art.webp"),
    system: { cardImage: unit.img },
    effects: [],
    folder: folderId,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    prototypeToken: {
      name: unit.name,
      displayName: 20,
      disposition: -1,
      texture: { src: unit.img.replace(".webp", "-token.webp") },
    },
    _stats: STATS,
  };

  await db.put(key, JSON.stringify(doc));
  console.log(`  ${key} → ${unit.name} (${FOLDERS[unit.faction].name})`);
}

await db.close();
console.log(`\nDone. ${UNITS.length} units + ${FOLDERS.length} folders packed into ${OUTPUT}`);
