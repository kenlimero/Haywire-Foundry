import { readdir } from "fs/promises";
import { openDb, fileToName } from "./pack-utils.mjs";

const OUTPUT = "packs/player-support";
const IMG_DIR = "assets/cards/supports";
const ASSET_PREFIX = "systems/haywire/assets/cards/supports";

const STATS = { systemId: "haywire", systemVersion: "0.9.3", coreVersion: "13" };

// ─── ID generator ────────────────────────────────────────────────────────────
let counter = 0;
const nextId = () => `hwSup${String(++counter).padStart(11, "0")}`;

// ═══════════════════════════════════════════════════════════════════════════════
//  PACK INTO LEVELDB
// ═══════════════════════════════════════════════════════════════════════════════
const db = await openDb(OUTPUT);

const files = (await readdir(IMG_DIR))
  .filter(f => f.endsWith(".webp"))
  .sort();

for (const file of files) {
  const id = nextId();
  const key = `!items!${id}`;
  const name = fileToName(file);
  const img = `${ASSET_PREFIX}/${file}`;

  const doc = {
    _id: id,
    _key: key,
    name,
    type: "support",
    img,
    system: {
      description: "",
    },
    effects: [],
    folder: null,
    sort: counter * 100000,
    ownership: { default: 0 },
    flags: {},
    _stats: STATS,
  };

  await db.put(key, JSON.stringify(doc));
  console.log(`  ${name} → ${key}`);
}

await db.close();
console.log(`\nDone. ${files.length} support items packed into ${OUTPUT}`);
