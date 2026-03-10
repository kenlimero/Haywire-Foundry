/**
 * Shared utilities for LevelDB packing scripts.
 */
import { ClassicLevel } from "classic-level";
import { readdir, readFile, rm } from "fs/promises";
import { join, basename } from "path";

/** Open a fresh LevelDB (deletes existing). */
export async function openDb(output) {
  await rm(output, { recursive: true, force: true });
  return new ClassicLevel(output, { keyEncoding: "utf8", valueEncoding: "utf8" });
}

/** Pack JSON files from a directory into LevelDB as items. */
export async function packJsonItems(inputDir, outputDir) {
  const db = await openDb(outputDir);

  const files = (await readdir(inputDir)).filter((f) => f.endsWith(".json"));
  console.log(`Packing ${files.length} files...`);

  for (const file of files) {
    const raw = await readFile(join(inputDir, file), "utf8");
    const data = JSON.parse(raw);
    const key = `!items!${data._id}`;
    data._key = key;
    await db.put(key, JSON.stringify(data));
    console.log(`  ${key} → ${data.name}`);
  }

  await db.close();
  console.log(`\nDone. ${files.length} entries packed into ${outputDir}`);
}

/** Convert a filename like "eagle_s_claw.webp" to "Eagle's Claw". */
export function fileToName(filename) {
  return basename(filename, ".webp")
    .replace(/_s_/g, "'s ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Write folder documents to a LevelDB. */
export async function writeFolders(db, folders, type, stats) {
  for (let i = 0; i < folders.length; i++) {
    const f = folders[i];
    const folderKey = `!folders!${f.id}`;
    const folder = {
      _id: f.id,
      _key: folderKey,
      name: f.name,
      type,
      sorting: "a",
      sort: (i + 1) * 100000,
      color: null,
      folder: f.parent ?? null,
      flags: {},
      _stats: stats,
    };
    await db.put(folderKey, JSON.stringify(folder));
    console.log(`Folder: ${f.name}${f.parent ? ` (child of ${f.parent})` : ""}`);
  }
}
