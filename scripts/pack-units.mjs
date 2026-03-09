import { ClassicLevel } from "classic-level";
import { rm } from "fs/promises";

const OUTPUT = "packs/units";
const STATS = { systemId: "haywire", systemVersion: "0.8.6", coreVersion: "13" };

// ─── ID generators ───────────────────────────────────────────────────────────
let itemCounter = 0;
let folderCounter = 0;
const nextItemId = () => `hwUnt${String(++itemCounter).padStart(11, "0")}`;
const nextFolderId = () => `hwFldUnt${String(++folderCounter).padStart(8, "0")}`;

// ─── Class UUID helpers ──────────────────────────────────────────────────────
const CLS = (id) => `Compendium.haywire.classes.${id}`;

const CLASS_IDS = {
  "Team Leader":       CLS("hwCls00000000001"),
  "Assault":           CLS("hwCls00000000002"),
  "Combat Lifesaver":  CLS("hwCls00000000003"),
  "Pointman":          CLS("hwCls00000000004"),
  "Breacher":          CLS("hwCls00000000005"),
  "Dog Handler":       CLS("hwCls00000000006"),
  "Demolition":        CLS("hwCls00000000007"),
  "Support":           CLS("hwCls00000000008"),
  "Gunner":            CLS("hwCls00000000009"),
  "Sniper":            CLS("hwCls00000000010"),
  "Recon":             CLS("hwCls00000000011"),
  "Spotter":           CLS("hwCls00000000012"),
  "Advisor":           CLS("hwCls00000000013"),
  "Drone Specialist":  CLS("hwCls00000000014"),
  "Undercover Agent":  CLS("hwCls00000000015"),
  "Deniable Asset":    CLS("hwCls00000000016"),
  "Saboteur":          CLS("hwCls00000000017"),
  "Shield Operator":   CLS("hwCls00000000018"),
  "Negotiator":        CLS("hwCls00000000019"),
  "Squad Leader":      CLS("hwCls00000000020"),
  "Fire Team Leader":  CLS("hwCls00000000021"),
  "Medic":             CLS("hwCls00000000022"),
  "Rifleman":          CLS("hwCls00000000023"),
  "Grenadier":         CLS("hwCls00000000024"),
  "Automatic Rifleman":CLS("hwCls00000000025"),
  "Machine Gunner":    CLS("hwCls00000000026"),
  "Marksman":          CLS("hwCls00000000027"),
  "AT Specialist":     CLS("hwCls00000000028"),
  "Local Fighter":     CLS("hwCls00000000029"),
  "Interpreter":       CLS("hwCls00000000030"),
};

// ─── Support Card UUID helpers ───────────────────────────────────────────────
// Support deck = hwDck00000000001, cards sorted alphabetically by filename
const SUPPORT_DECK = "hwDck00000000001";
const SUP = (id) => `Compendium.haywire.decks.${SUPPORT_DECK}.Card.${id}`;

const SUPPORT_IDS = {
  "Artillery Barrage": SUP("hwCrd00000000001"),
  "Covering Fire":     SUP("hwCrd00000000002"),
  "Diversion":         SUP("hwCrd00000000003"),
  "Gun Run":           SUP("hwCrd00000000004"),
  "Hellfire Missile":  SUP("hwCrd00000000005"),
  "Medevac":           SUP("hwCrd00000000006"),
  "Mortar Strike":     SUP("hwCrd00000000007"),
  "Rally Cry":         SUP("hwCrd00000000008"),
  "Scout Sniper":      SUP("hwCrd00000000009"),
  "Smoke Screen":      SUP("hwCrd00000000010"),
  "Suicide UGV":       SUP("hwCrd00000000011"),
  "Swarm":             SUP("hwCrd00000000012"),
  "Tactical Jammer":   SUP("hwCrd00000000013"),
  "Tactical Retreat":  SUP("hwCrd00000000014"),
  "UAV Scanning":      SUP("hwCrd00000000015"),
  "UGV":               SUP("hwCrd00000000016"),
};

// ─── Helper ──────────────────────────────────────────────────────────────────
function cls(...names) {
  return names.map(n => {
    const id = CLASS_IDS[n];
    if (!id) throw new Error(`Unknown class: "${n}"`);
    return id;
  });
}

function sup(...names) {
  return names.map(n => {
    const id = SUPPORT_IDS[n];
    if (!id) throw new Error(`Unknown support card: "${n}"`);
    return id;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  UNIT DEFINITIONS (from PDF pages 42-43)
// ═════════════════════════════════════════════════════════════════════════════

const UNITS = [
  // ── Tier 1 — Main Units ──────────────────────────────────────────────────
  {
    name: "Hunter",
    tier: 1,
    unitType: "main",
    role: "Jack of all trades",
    classIds: cls("Team Leader", "Assault", "Combat Lifesaver", "Support", "Sniper", "Demolition"),
    supportCardIds: sup("Covering Fire", "UGV"),
  },
  {
    name: "Neptune",
    tier: 1,
    unitType: "main",
    role: "Direct Action",
    classIds: cls("Team Leader", "Assault", "Breacher", "Pointman", "Dog Handler", "Support"),
    supportCardIds: sup("Tactical Jammer", "Gun Run"),
  },
  {
    name: "Wolfpack",
    tier: 1,
    unitType: "main",
    role: "Reconnaissance, Target Acquisition",
    classIds: cls("Team Leader", "Recon", "Sniper", "Spotter", "Drone Specialist", "Assault"),
    supportCardIds: sup("UAV Scanning", "Hellfire Missile"),
  },
  {
    name: "Havoc",
    tier: 1,
    unitType: "main",
    role: "Special Reconnaissance",
    classIds: cls("Team Leader", "Recon", "Sniper", "Support", "Gunner", "Demolition"),
    supportCardIds: sup("Rally Cry", "Swarm"),
  },
  {
    name: "Goliath",
    tier: 1,
    unitType: "main",
    role: "Local Force Training",
    classIds: cls("Team Leader", "Advisor", "Assault", "Combat Lifesaver", "Interpreter", "Local Fighter"),
    supportCardIds: sup("Smoke Screen", "Mortar Strike"),
  },
  {
    name: "Satory",
    tier: 1,
    unitType: "main",
    role: "Counter-Terrorism, Hostage Rescue",
    classIds: cls("Team Leader", "Shield Operator", "Breacher", "Assault", "Pointman", "Negotiator"),
    supportCardIds: sup("Tactical Retreat", "Scout Sniper"),
  },
  {
    name: "Zenith",
    tier: 1,
    unitType: "main",
    role: "Sabotage, Covert Action",
    classIds: cls("Team Leader", "Demolition", "Saboteur", "Drone Specialist", "Undercover Agent", "Deniable Asset"),
    supportCardIds: sup("Diversion", "Suicide UGV"),
  },

  // ── Tier 1 — Additional Units ────────────────────────────────────────────
  {
    name: "Jawbreaker",
    tier: 1,
    unitType: "additional",
    role: "Clandestine Operations",
    classIds: cls("Undercover Agent", "Deniable Asset"),
    supportCardIds: [],
  },
  {
    name: "Watcher",
    tier: 1,
    unitType: "additional",
    role: "Target Acquisition",
    classIds: cls("Sniper", "Spotter"),
    supportCardIds: [],
  },
  {
    name: "Darkstar",
    tier: 1,
    unitType: "additional",
    role: "Combat Search and Rescue",
    classIds: cls("Assault", "Combat Lifesaver"),
    supportCardIds: [],
  },
  {
    name: "Stalker",
    tier: 1,
    unitType: "additional",
    role: "Recon",
    classIds: cls("Recon", "Drone Specialist"),
    supportCardIds: [],
  },
  {
    name: "Outlaw",
    tier: 1,
    unitType: "additional",
    role: "Guerilla",
    classIds: cls("Interpreter", "Local Fighter"),
    supportCardIds: [],
  },

  // ── Tier 2 — Units ───────────────────────────────────────────────────────
  {
    name: "Wolverine 3-1",
    tier: 2,
    unitType: "main",
    role: "Infantry Rifle Squad",
    classIds: cls("Squad Leader", "Fire Team Leader", "Rifleman", "Grenadier", "Automatic Rifleman"),
    supportCardIds: sup("Medevac", "Artillery Barrage"),
  },
  {
    name: "Wolverine 3-2",
    tier: 2,
    unitType: "additional",
    role: "Marksman Team",
    classIds: cls("Fire Team Leader", "Marksman"),
    supportCardIds: [],
  },
  {
    name: "Wolverine 3-3",
    tier: 2,
    unitType: "additional",
    role: "Heavy Gunner Team",
    classIds: cls("Fire Team Leader", "Machine Gunner"),
    supportCardIds: [],
  },
  {
    name: "Wolverine 3-4",
    tier: 2,
    unitType: "additional",
    role: "AT Team",
    classIds: cls("Fire Team Leader", "AT Specialist"),
    supportCardIds: [],
  },
  {
    name: "Wolverine 3-5",
    tier: 2,
    unitType: "additional",
    role: "Medic Team",
    classIds: cls("Fire Team Leader", "Medic"),
    supportCardIds: [],
  },
];

// ═════════════════════════════════════════════════════════════════════════════
//  PACK INTO LEVELDB
// ═════════════════════════════════════════════════════════════════════════════
await rm(OUTPUT, { recursive: true, force: true });
const db = new ClassicLevel(OUTPUT, { keyEncoding: "utf8", valueEncoding: "utf8" });

// Create folders: Tier 1 Main, Tier 1 Additional, Tier 2
const folders = [
  { name: "Tier 1 — Main Units", sort: 100000 },
  { name: "Tier 1 — Additional Units", sort: 200000 },
  { name: "Tier 2 — Units", sort: 300000 },
];

const folderIds = {};
for (const f of folders) {
  const folderId = nextFolderId();
  const folderKey = `!folders!${folderId}`;
  const folderDoc = {
    _id: folderId,
    _key: folderKey,
    name: f.name,
    type: "Item",
    folder: null,
    description: "",
    sorting: "a",
    sort: f.sort,
    color: null,
    flags: {},
    _stats: STATS,
  };
  await db.put(folderKey, JSON.stringify(folderDoc));
  folderIds[f.name] = folderId;
  console.log(`Folder: ${f.name} → ${folderKey}`);
}

function getFolderId(unit) {
  if (unit.tier === 2) return folderIds["Tier 2 — Units"];
  if (unit.unitType === "additional") return folderIds["Tier 1 — Additional Units"];
  return folderIds["Tier 1 — Main Units"];
}

// Create unit items
for (const unit of UNITS) {
  const itemId = nextItemId();
  const itemKey = `!items!${itemId}`;
  const folderId = getFolderId(unit);

  const doc = {
    _id: itemId,
    _key: itemKey,
    name: unit.name,
    type: "unit",
    img: "icons/svg/combat.svg",
    system: {
      tier: unit.tier,
      role: unit.role,
      unitType: unit.unitType,
      classIds: unit.classIds,
      supportCardIds: unit.supportCardIds,
    },
    effects: [],
    flags: {},
    folder: folderId,
    sort: itemCounter * 100000,
    ownership: { default: 0 },
    _stats: STATS,
  };

  await db.put(itemKey, JSON.stringify(doc));
  console.log(`Unit: ${unit.name} (${unit.role}) → ${itemKey}`);
}

await db.close();
console.log(`\nDone. ${UNITS.length} units packed into ${OUTPUT}`);
