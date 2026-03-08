import { ClassicLevel } from "classic-level";
import { readdir, readFile, rm } from "fs/promises";
import { join } from "path";

const INPUT = "packs/_source/opfor-skills";
const OUTPUT = "packs/opfor-skills";

// Clean output
await rm(OUTPUT, { recursive: true, force: true });

const db = new ClassicLevel(OUTPUT, { keyEncoding: "utf8", valueEncoding: "utf8" });

const files = (await readdir(INPUT)).filter(f => f.endsWith(".json"));
console.log(`Packing ${files.length} files...`);

for (const file of files) {
  const raw = await readFile(join(INPUT, file), "utf8");
  const data = JSON.parse(raw);
  const key = `!items!${data._id}`;
  data._key = key;
  await db.put(key, JSON.stringify(data));
  console.log(`  ${key} → ${data.name}`);
}

await db.close();
console.log(`\nDone. ${files.length} entries packed into ${OUTPUT}`);
