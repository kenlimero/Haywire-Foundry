import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { openDb, writeFolders } from "./pack-utils.mjs";

const INPUT = "packs/_source/classes";
const OUTPUT = "packs/player-classes";

const TIERS = [
  { dir: "tier1", id: "hwFld00000000001", name: "Tier 1 — Specialists", sort: 1 },
  { dir: "tier2", id: "hwFld00000000002", name: "Tier 2 — Core", sort: 2 },
  { dir: "tier3", id: "hwFld00000000003", name: "Tier 3 — Local", sort: 3 },
];

const STATS = { systemId: "haywire", systemVersion: "0.5.0", coreVersion: "13" };

const db = await openDb(OUTPUT);

// Create folders
await writeFolders(db, TIERS, "Item", STATS);

// Pack items
let count = 0;
for (const tier of TIERS) {
  const tierDir = join(INPUT, tier.dir);
  const files = (await readdir(tierDir)).filter(f => f.endsWith(".json"));
  console.log(`\n${tier.dir}: ${files.length} files`);

  for (const file of files) {
    const raw = await readFile(join(tierDir, file), "utf8");
    const data = JSON.parse(raw);
    data.folder = tier.id;
    const key = `!items!${data._id}`;
    data._key = key;
    await db.put(key, JSON.stringify(data));
    console.log(`  ${key} → ${data.name}`);
    count++;
  }
}

await db.close();
console.log(`\nDone. ${count} entries packed into ${OUTPUT}`);
