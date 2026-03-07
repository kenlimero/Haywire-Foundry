/**
 * Migration script: Convert custom IDs to valid Foundry V13 format.
 * Foundry V13 requires _id to match /^[a-zA-Z0-9]{16}$/ (exactly 16 alphanumeric chars).
 *
 * Old format: haywireClass00002 (18 chars) → New format: hwCls00000000002 (16 chars)
 */
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const PACKS_ROOT = "packs/_source";

// ID prefix mappings (old prefix → new prefix, with target total length = 16)
const PREFIXES = {
  haywireClass: "hwCls",   // 12 → 5 chars prefix
  haywireWeapon: "hwWpn",  // 13 → 5 chars prefix
  haywireSkill: "hwSkl",   // 12 → 5 chars prefix
};

function migrateId(oldId) {
  for (const [oldPrefix, newPrefix] of Object.entries(PREFIXES)) {
    if (oldId.startsWith(oldPrefix)) {
      const numPart = oldId.slice(oldPrefix.length);
      const num = parseInt(numPart, 10);
      return newPrefix + String(num).padStart(11, "0");
    }
  }
  return oldId; // unchanged if no match
}

function migrateUuid(uuid) {
  // Replace IDs inside Compendium UUIDs like "Compendium.haywire.weapons.haywireWeapon00006"
  return uuid.replace(/(haywireClass|haywireWeapon|haywireSkill)\d+/g, (match) => migrateId(match));
}

async function migrateJsonFiles(dir) {
  const files = (await readdir(dir)).filter(f => f.endsWith(".json"));
  let count = 0;

  for (const file of files) {
    const filePath = join(dir, file);
    const raw = await readFile(filePath, "utf8");
    // Replace all occurrences of old IDs in the entire JSON string
    const migrated = raw.replace(/(haywireClass|haywireWeapon|haywireSkill)\d+/g, (match) => migrateId(match));

    if (migrated !== raw) {
      await writeFile(filePath, migrated, "utf8");
      count++;
      const data = JSON.parse(migrated);
      console.log(`  ${file}: _id=${data._id}`);
    }
  }
  return count;
}

console.log("=== Migrating IDs to Foundry V13 format (16 alphanumeric chars) ===\n");

console.log("Classes:");
const classCount = await migrateJsonFiles(join(PACKS_ROOT, "classes"));
console.log(`  → ${classCount} files updated\n`);

console.log("Weapons:");
const weaponCount = await migrateJsonFiles(join(PACKS_ROOT, "weapons"));
console.log(`  → ${weaponCount} files updated\n`);

console.log("Skills:");
const skillCount = await migrateJsonFiles(join(PACKS_ROOT, "skills"));
console.log(`  → ${skillCount} files updated\n`);

// Validation: check all IDs are exactly 16 alphanumeric chars
console.log("Validating...");
const ID_REGEX = /^[a-zA-Z0-9]{16}$/;
let errors = 0;

for (const subdir of ["classes", "weapons", "skills"]) {
  const dir = join(PACKS_ROOT, subdir);
  const files = (await readdir(dir)).filter(f => f.endsWith(".json"));
  for (const file of files) {
    const data = JSON.parse(await readFile(join(dir, file), "utf8"));
    if (!ID_REGEX.test(data._id)) {
      console.error(`  ERROR: ${file} has invalid _id: "${data._id}" (${data._id.length} chars)`);
      errors++;
    }
    // Check UUID references in classes
    if (data.system?.defaultWeapons) {
      for (const uuid of data.system.defaultWeapons) {
        const id = uuid.split(".").pop();
        if (!ID_REGEX.test(id)) {
          console.error(`  ERROR: ${file} has invalid weapon UUID: "${uuid}"`);
          errors++;
        }
      }
    }
    if (data.system?.skillIds) {
      for (const uuid of data.system.skillIds) {
        const id = uuid.split(".").pop();
        if (!ID_REGEX.test(id)) {
          console.error(`  ERROR: ${file} has invalid skill UUID: "${uuid}"`);
          errors++;
        }
      }
    }
  }
}

if (errors === 0) {
  console.log("  All IDs valid!\n");
} else {
  console.error(`\n  ${errors} validation errors found!`);
  process.exit(1);
}

console.log(`Done. ${classCount + weaponCount + skillCount} files migrated.`);
console.log("Run 'npm run build:classes && npm run build:weapons && npm run build:skills && npm run build:oppfor-tables' to rebuild packs.");
