import { readdir } from "fs/promises";
import { openDb, fileToName } from "./pack-utils.mjs";

const OUTPUT = "packs/decks";

const STATS = { systemId: "haywire", systemVersion: "0.6.1", coreVersion: "13" };

// ─── ID generators ───────────────────────────────────────────────────────────
let deckCounter = 0;
let cardCounter = 0;
const nextDeckId = () => `hwDck${String(++deckCounter).padStart(11, "0")}`;
const nextCardId = () => `hwCrd${String(++cardCounter).padStart(11, "0")}`;

// ─── Deck definitions ───────────────────────────────────────────────────────
const DECKS = [
  {
    name: "Support",
    imgDir: "assets/cards/supports",
    backImg: "systems/haywire/assets/cards/backcovers/support.webp",
    assetPrefix: "systems/haywire/assets/cards/supports",
  },
  {
    name: "Operations",
    imgDir: "assets/cards/operations",
    backImg: "systems/haywire/assets/cards/backcovers/operation.webp",
    assetPrefix: "systems/haywire/assets/cards/operations",
  },
  {
    name: "Infiltration",
    imgDir: "assets/cards/infil",
    backImg: "systems/haywire/assets/cards/backcovers/infil.webp",
    assetPrefix: "systems/haywire/assets/cards/infil",
  },
  {
    name: "Fog of War",
    imgDir: "assets/cards/fogofwar",
    backImg: "systems/haywire/assets/cards/backcovers/fog.webp",
    assetPrefix: "systems/haywire/assets/cards/fogofwar",
  },
];

// ═════════════════════════════════════════════════════════════════════════════
//  PACK INTO LEVELDB
// ═════════════════════════════════════════════════════════════════════════════
const db = await openDb(OUTPUT);

// Create sublevel for embedded cards
const cardsSublevel = db.sublevel("cards.cards", { keyEncoding: "utf8", valueEncoding: "utf8" });

let totalCards = 0;

for (const deck of DECKS) {
  const deckId = nextDeckId();
  const deckKey = `!cards!${deckId}`;

  // Read card images from directory
  const files = (await readdir(deck.imgDir))
    .filter(f => f.endsWith(".webp"))
    .sort();

  const cardIds = [];

  for (const file of files) {
    const cardId = nextCardId();
    const cardName = fileToName(file);
    const cardImg = `${deck.assetPrefix}/${file}`;

    const card = {
      _id: cardId,
      name: cardName,
      type: "base",
      description: "",
      suit: "",
      value: null,
      face: 0,
      faces: [{ name: cardName, img: cardImg, text: "" }],
      back: { name: deck.name, img: deck.backImg, text: "" },
      drawn: false,
      origin: null,
      width: null,
      height: null,
      rotation: 0,
      sort: cardIds.length * 100,
      system: {},
      ownership: { default: -1 },
      flags: {},
      _stats: STATS,
    };

    await cardsSublevel.put(`${deckId}.${cardId}`, JSON.stringify(card));
    cardIds.push(cardId);
  }

  const deckDoc = {
    _id: deckId,
    _key: deckKey,
    name: deck.name,
    type: "deck",
    img: deck.backImg,
    description: "",
    cards: cardIds,
    width: null,
    height: null,
    rotation: 0,
    displayCount: false,
    folder: null,
    sort: (deckCounter) * 100000,
    ownership: { default: 0 },
    system: {},
    flags: {},
    _stats: STATS,
  };

  await db.put(deckKey, JSON.stringify(deckDoc));
  console.log(`Deck: ${deck.name} (${files.length} cards) → ${deckKey}`);
  totalCards += files.length;
}

await db.close();
console.log(`\nDone. ${DECKS.length} decks with ${totalCards} total cards packed into ${OUTPUT}`);
