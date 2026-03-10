import { openDb, writeFolders } from "./pack-utils.mjs";

const OUTPUT = "packs/opfor-units";

const STATS = { systemId: "haywire", systemVersion: "0.8.0", coreVersion: "13" };

// ─── UUID helpers ─────────────────────────────────────────────────────────────
const W = (id) => `Compendium.haywire.weapons.${id}`;
const S = (id) => `Compendium.haywire.opfor-skills.${id}`;

// Weapon UUIDs
const ASSAULT_RIFLE   = W("hwWpn00000000006");
const SMG             = W("hwWpn00000000004");
const SHOTGUN         = W("hwWpn00000000005");
const PISTOL          = W("hwWpn00000000003");
const SNIPER_RIFLE    = W("hwWpn00000000008");
const DMR             = W("hwWpn00000000023");
const LMG             = W("hwWpn00000000007");
const ROCKET_LAUNCHER = W("hwWpn00000000019");
const GRENADE_LAUNCHER = W("hwWpn00000000010");
const FRAG_GRENADE    = W("hwWpn00000000009");
const BODY_ARMOR      = W("hwWpn00000000022");
const MELEE_WEAPON    = W("hwWpn00000000002");

// Skill UUIDs
const ARMORED          = S("hwOsk00000000001");
const SHOCKWAVE        = S("hwOsk00000000002");
const HIGH_GROUND      = S("hwOsk00000000003");
const SUPPORT          = S("hwOsk00000000004");
const BODYGUARDS       = S("hwOsk00000000005");
const FRAGMENTATION    = S("hwOsk00000000006");
const CALL_OF_THE_MOB  = S("hwOsk00000000007");
const GUN_RUNNER       = S("hwOsk00000000008");
const RETURN_FIRE      = S("hwOsk00000000009");
const BLIND_FIRE       = S("hwOsk00000000010");
const MACHETE          = S("hwOsk00000000011");
const SUPPRESSIVE_FIRE = S("hwOsk00000000012");
const S_VEST           = S("hwOsk00000000013");
const NO_PITY          = S("hwOsk00000000014");
const MENTHOR          = S("hwOsk00000000015");
const FAST_PACED       = S("hwOsk00000000016");
const MOTIVATION       = S("hwOsk00000000017");
const GHILLIE_SUIT     = S("hwOsk00000000018");

// ─── Folder definitions ──────────────────────────────────────────────────────
const FOLDERS = [
  { id: "hwFldOpfUn000001", name: "Cartel" },
  { id: "hwFldOpfUn000002", name: "Insurgents" },
  { id: "hwFldOpfUn000003", name: "Russians" },
];

// ─── Behavior HTML helper ─────────────────────────────────────────────────────
function bh(steps) {
  return steps.map((step, i) => {
    const num = i + 1;
    return `<div class="opfor-behavior-step"><h4>${num} | ${step.question}</h4>${step.answers.map(a => `<p>${a}</p>`).join("")}</div>`;
  }).join("");
}

// ─── Unit definitions per faction ────────────────────────────────────────────
let unitCounter = 0;
const nextUnitId = () => `hwOfu${String(++unitCounter).padStart(11, "0")}`;

const UNITS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CARTEL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Soldado", faction: 0, factionName: "Cartel",
    img: "systems/haywire/assets/opfor_cartels/soldado.webp",
    combatStats: { easy: 11, medium: 15, hard: 18 },
    opforSkillIds: [],
    weaponIds: [ASSAULT_RIFLE],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No and the Soldado has 2AP.</strong> Use 1AP to Move up to 6\" toward the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>No and the Soldado has 1AP.</strong> Use 1AP to enter overwatch facing the closest enemy.",
      ]},
      { question: "Is the Soldado in cover?", answers: [
        "<strong>Yes and the Soldado has 2AP left.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Soldado has 1AP left.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No and the Soldado has 2AP left.</strong> Use 1AP to move to closest cover which keep LOS on the enemy and use the second AP to do 1 combat action at the closest target.",
        "<strong>No and the Soldado has 1AP left.</strong> Use 1 AP to do 1 combat action at the closest target.",
      ]},
    ]),
  },
  {
    name: "Balacero", faction: 0, factionName: "Cartel",
    img: "systems/haywire/assets/opfor_cartels/balacero.webp",
    combatStats: { easy: 11, medium: 15, hard: 18 },
    opforSkillIds: [GUN_RUNNER, RETURN_FIRE],
    weaponIds: [SMG, SHOTGUN],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" toward the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
      ]},
      { question: "Can the enemy be flanked to remove its cover by using the remaining AP to do move actions?", answers: [
        "<strong>Yes.</strong> Use the remaining AP to move the Balacero in a flanking position and use his Gunrunner ability to do 1 combat action at the closest target.",
        "<strong>No.</strong> Proceed to step 3.",
      ]},
      { question: "Is the enemy in weapon's range? (18\" for SMG, 12\" for shotgun)", answers: [
        "<strong>Yes and the Balacero has 2AP.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Balacero has 0 or 1AP.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No and the Balacero has 2AP.</strong> Use 1AP to move up to 6\" toward the closest enemy and proceed back to step 3.",
        "<strong>No and the Balacero has 1AP.</strong> Use 1AP to move up to 6\" toward the closest cover.",
      ]},
    ]),
  },
  {
    name: "Halcón", faction: 0, factionName: "Cartel",
    img: "systems/haywire/assets/opfor_cartels/halcon.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [HIGH_GROUND],
    weaponIds: [SNIPER_RIFLE, DMR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes and the Halcón has 2AP.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Halcón has 1AP.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No.</strong> Proceed to step 2.",
      ]},
      { question: "Is the Halcón facing a direction where enemies are present?", answers: [
        "<strong>No.</strong> Use 1AP to Move up to 6\" toward the closest enemy while staying on that high point and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>Yes.</strong> Use 1AP to enter overwatch.",
      ]},
    ]),
  },
  {
    name: "Sanguinario", faction: 0, factionName: "Cartel",
    img: "systems/haywire/assets/opfor_cartels/sanguinario.webp",
    combatStats: { easy: 11, medium: 15, hard: 18 },
    opforSkillIds: [BLIND_FIRE, MACHETE],
    weaponIds: [LMG, MELEE_WEAPON],
    behavior: bh([
      { question: "Is there an enemy within 12\"?", answers: [
        "<strong>Yes.</strong> Use 2AP to move this model in base to base contact with the enemy model and use a third AP to enter melee combat.",
        "<strong>No.</strong> Proceed to step 2.",
      ]},
      { question: "Are there 2 enemies or more in LOS?", answers: [
        "<strong>Yes and the Sanguinario has 2AP.</strong> Use the blind fire ability to fire at all visible enemies.",
        "<strong>Yes and the Sanguinario has 1AP.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No.</strong> Proceed to step 3.",
      ]},
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes and the Sanguinario has 2AP.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Sanguinario has 1AP.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" toward the closest enemy and proceed back to step 3. Stop the movement when an enemy enters LOS.",
      ]},
    ]),
  },
  {
    name: "Sicario", faction: 0, factionName: "Cartel",
    img: "systems/haywire/assets/opfor_cartels/sicario.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [FRAGMENTATION, CALL_OF_THE_MOB, ARMORED],
    weaponIds: [ASSAULT_RIFLE, FRAG_GRENADE, BODY_ARMOR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" toward the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
      ]},
      { question: "Is the enemy within 12\"? (If a grenade has already been used, proceed to step 3)", answers: [
        "<strong>Yes and the Sicario has 2AP left.</strong> Use 1AP to move to the closest cover that keeps LOS and range to the target and use 1AP to throw a fragmentation grenade at that target.",
        "<strong>Yes and the Sicario has 1AP left.</strong> Use 1 AP to throw a fragmentation grenade at that target.",
        "<strong>No.</strong> Proceed to step 3.",
      ]},
      { question: "Is the Sicario in cover?", answers: [
        "<strong>Yes and the Sicario has 2AP left.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Sicario has 1AP left.</strong> Use 1 AP to do a combat action at the closest target in LOS.",
        "<strong>No and the Sicario has 2AP left.</strong> Use 1AP to move to closest cover which keeps LOS to this target and use the second AP to do a combat actions at the closest target in LOS.",
        "<strong>No and the Sicario has 1AP left.</strong> Use 1 AP to do a combat action at the closest target in LOS.",
      ]},
    ]),
  },
  {
    name: "Artillero", faction: 0, factionName: "Cartel",
    img: "systems/haywire/assets/opfor_cartels/artillero.webp",
    combatStats: { easy: 11, medium: 15, hard: 18 },
    opforSkillIds: [SHOCKWAVE],
    weaponIds: [ROCKET_LAUNCHER, GRENADE_LAUNCHER],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" toward the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
      ]},
      { question: "Is the Artillero in cover?", answers: [
        "<strong>Yes.</strong> Use 1AP to do 1 combat action at the closest target (using a grenade or rocket launcher ends this model turn).",
        "<strong>No and the Artillero has 2AP left.</strong> Use 1AP to move to closest cover which keep LOS on the enemy and use the second AP to do 1 combat action at the closest target.",
        "<strong>No and the Artillero has 1AP left.</strong> Use 1 AP to do 1 combat action at the closest target.",
      ]},
    ]),
  },
  {
    name: "Leader", faction: 0, factionName: "Cartel",
    img: "systems/haywire/assets/opfor_cartels/teniente.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [SUPPORT, BODYGUARDS, ARMORED],
    weaponIds: [ASSAULT_RIFLE, SMG, PISTOL, BODY_ARMOR],
    behavior: bh([
      { question: "Is the Teniente in cover?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" toward the closest cover and proceed to step 2.",
      ]},
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes and the Teniente has 2AP left.</strong> Use 2AP to do 2 Combat actions at the closest target.",
        "<strong>Yes and the Teniente has 1AP left.</strong> Use 1AP to do 1 Combat action at the closest target.",
        "<strong>No.</strong> Use 1AP to enter Overwatch facing the closest enemy.",
      ]},
    ]),
  },
  {
    name: "Federales", faction: 0, factionName: "Cartel",
    img: "systems/haywire/assets/opfor_cartels/federales.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [ARMORED],
    weaponIds: [ASSAULT_RIFLE],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No and the Federales has 2AP.</strong> Use 1AP to Move up to 6\" toward the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>No and the Federales has 1AP.</strong> Use 1AP to enter overwatch facing the closest enemy.",
      ]},
      { question: "Is the Federales in cover?", answers: [
        "<strong>Yes and the Federales has 2AP left.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Federales has 1AP left.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No and the Federales has 2AP left.</strong> Use 1AP to move to closest cover which keep LOS on the enemy and use the second AP to do 1 combat action at the closest target.",
        "<strong>No and the Federales has 1AP left.</strong> Use 1AP to move to closest cover and if possible break LOS with the enemy.",
      ]},
    ]),
  },
  {
    name: "Francotirador", faction: 0, factionName: "Cartel",
    img: "systems/haywire/assets/opfor_cartels/francotirador.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [ARMORED, HIGH_GROUND],
    weaponIds: [SNIPER_RIFLE, DMR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes and the Francotirador has 2AP.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Francotirador has 1AP.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No.</strong> Proceed to step 2.",
      ]},
      { question: "Is the Francotirador facing a direction where enemies are present?", answers: [
        "<strong>No.</strong> Use 1AP to Move up to 6\" toward the closest enemy while staying on that high point and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>Yes.</strong> Use 1AP to enter overwatch.",
      ]},
    ]),
  },
  {
    name: "Patrullero", faction: 0, factionName: "Cartel",
    img: "systems/haywire/assets/opfor_cartels/patrullero.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [ARMORED, GUN_RUNNER, FAST_PACED, FRAGMENTATION],
    weaponIds: [SMG, SHOTGUN, FRAG_GRENADE],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1.",
      ]},
      { question: "Is the enemy within 12\"? (If a grenade has already been used, proceed to step 3)", answers: [
        "<strong>Yes and the Patrullero has 2AP left.</strong> Use 1AP to move to the closest cover that keeps LOS and range to the target and use 1AP to throw a fragmentation grenade at that target.",
        "<strong>Yes and the Patrullero has 0 or 1AP left.</strong> Use 1 AP to throw a fragmentation grenade at that target.",
        "<strong>No.</strong> Proceed to step 3.",
      ]},
      { question: "Is the enemy in weapon's range? (18\" for SMG, 12\" for shotgun)", answers: [
        "<strong>Yes and the Patrullero has 2AP.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Patrullero has 0 or 1AP.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No and the Patrullero has 2AP.</strong> Use 1AP to move up to 6\" toward the closest enemy and proceed back to step 3.",
        "<strong>No and the Patrullero has 1AP.</strong> Use 1AP to move up to 6\" toward the closest cover and proceed back to step 3.",
      ]},
    ]),
  },
  {
    name: "Fusilero automático", faction: 0, factionName: "Cartel",
    img: "systems/haywire/assets/opfor_cartels/fusilero_automatico.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [ARMORED, SUPPRESSIVE_FIRE],
    weaponIds: [LMG],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No and the Fusilero automático has 2AP.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>No and the Fusilero automático has 1AP.</strong> Use 1AP to enter overwatch facing the closest enemy.",
      ]},
      { question: "Is the Fusilero automático in cover?", answers: [
        "<strong>Yes and the Fusilero automático has 2AP left.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Fusilero automático has 1AP left.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No and the Fusilero automático has 2AP left.</strong> Use 1AP to move to closest cover which keep LOS on the enemy and use the second AP to do 1 combat action at the closest target.",
        "<strong>No and the Fusilero automático has 1AP left.</strong> Use 1AP to move up to 6\" toward the closest cover.",
      ]},
    ]),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INSURGENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Fighter", faction: 1, factionName: "Insurgents",
    img: "systems/haywire/assets/opfor_insurgents/fighter.webp",
    combatStats: { easy: 11, medium: 15, hard: 18 },
    opforSkillIds: [],
    weaponIds: [ASSAULT_RIFLE],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No and the Fighter has 2AP.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>No and the Fighter has 1AP.</strong> Use 1AP to enter overwatch facing the closest enemy.",
      ]},
      { question: "Is the Fighter in cover?", answers: [
        "<strong>Yes and the Fighter has 2AP left.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Fighter has 1AP left.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No and the Fighter has 2AP left.</strong> Use 1AP to move to closest cover which keep LOS on the enemy and use the second AP to do 1 combat action at the closest target.",
        "<strong>No and the Fighter has 1AP left.</strong> Use 1 AP to do 1 combat action at the closest target.",
      ]},
    ]),
  },
  {
    name: "True believer", faction: 1, factionName: "Insurgents",
    img: "systems/haywire/assets/opfor_insurgents/true_believer.webp",
    combatStats: { easy: 11, medium: 15, hard: 18 },
    opforSkillIds: [S_VEST, CALL_OF_THE_MOB],
    weaponIds: [ROCKET_LAUNCHER, GRENADE_LAUNCHER],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes or no.</strong> Use 2AP to Move 12\" towards the closest enemy.",
      ]},
    ]),
  },
  {
    name: "Sniper", faction: 1, factionName: "Insurgents",
    img: "systems/haywire/assets/opfor_insurgents/sniper.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [HIGH_GROUND],
    weaponIds: [SNIPER_RIFLE, DMR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes and the Sniper has 2AP.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Sniper has 1AP.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No.</strong> Proceed to step 2.",
      ]},
      { question: "Is the Sniper facing a direction where enemies are present?", answers: [
        "<strong>Yes.</strong> Use 1AP to enter overwatch.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" towards the closest enemy while staying on that high point and proceed back to step 1. Stop the movement when an enemy enters LOS.",
      ]},
    ]),
  },
  {
    name: "Gunner", faction: 1, factionName: "Insurgents",
    img: "systems/haywire/assets/opfor_insurgents/gunner.webp",
    combatStats: { easy: 11, medium: 15, hard: 18 },
    opforSkillIds: [BLIND_FIRE],
    weaponIds: [LMG],
    behavior: bh([
      { question: "Are there 2 enemies or more in LOS?", answers: [
        "<strong>Yes and the Gunner has 2AP.</strong> Use the blind fire ability to fire at all visible enemies.",
        "<strong>Yes and the gunner has 1AP.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No.</strong> Proceed to step 2.",
      ]},
      { question: "Is there 1 enemy in LOS?", answers: [
        "<strong>Yes and the Gunner has 2AP.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Gunner has 1AP.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" toward the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
      ]},
    ]),
  },
  {
    name: "Foreign advisor", faction: 1, factionName: "Insurgents",
    img: "systems/haywire/assets/opfor_insurgents/foreign_advisor.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [MENTHOR, FRAGMENTATION, ARMORED],
    weaponIds: [ASSAULT_RIFLE, FRAG_GRENADE, BODY_ARMOR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
      ]},
      { question: "Is the enemy within 12\"? (If a grenade has already been used, proceed to step 3)", answers: [
        "<strong>Yes and the Foreign advisor has 2AP left.</strong> Use 1AP to move to the closest cover that keeps LOS and range to the target and use 1AP to throw a fragmentation grenade at that target.",
        "<strong>Yes and the Foreign advisor has 1AP left.</strong> Use 1 AP to throw a fragmentation grenade at that target.",
        "<strong>No.</strong> Proceed to step 3.",
      ]},
      { question: "Is the Foreign advisor in cover?", answers: [
        "<strong>Yes and the Foreign advisor has 2AP left.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Foreign advisor has 1AP left.</strong> Use 1 AP to do a combat action at the closest target in LOS.",
        "<strong>No and the Foreign advisor has 2AP left.</strong> Use 1AP to move to closest cover which keep LOS to this target and use the second AP to do a combat actions at the closest target in LOS.",
        "<strong>No and the Foreign advisor has 1AP left.</strong> Use 1AP to move to closest cover and if possible break LOS with the enemy.",
      ]},
    ]),
  },
  {
    name: "Rocketeer", faction: 1, factionName: "Insurgents",
    img: "systems/haywire/assets/opfor_insurgents/rocketeer.webp",
    combatStats: { easy: 11, medium: 15, hard: 18 },
    opforSkillIds: [SHOCKWAVE],
    weaponIds: [ROCKET_LAUNCHER, GRENADE_LAUNCHER],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
      ]},
      { question: "Is the Rocketeer in cover?", answers: [
        "<strong>Yes.</strong> Use 1AP to do 1 combat action at the closest target (using a grenade or rocket launcher ends this model turn).",
        "<strong>No and the Rocketeer has 2AP left.</strong> Use 1AP to move to closest cover which keep LOS on the enemy and use the second AP to do 1 combat action at the closest target.",
        "<strong>No and the Rocketeer has 1AP left.</strong> Use 1 AP to do 1 combat action at the closest target.",
      ]},
    ]),
  },
  {
    name: "Executioner", faction: 1, factionName: "Insurgents",
    img: "systems/haywire/assets/opfor_insurgents/executioner.webp",
    combatStats: { easy: 11, medium: 15, hard: 18 },
    opforSkillIds: [MACHETE, NO_PITY],
    weaponIds: [ASSAULT_RIFLE, MELEE_WEAPON],
    behavior: bh([
      { question: "Is there an enemy within 6\"?", answers: [
        "<strong>Yes.</strong> Use 1AP to move the Executioner in base to base contact with the closest enemy model and use the 2nd AP to do a combat action in melee with 2 combat dice since the Executioner is equipped with a machete.",
        "<strong>No.</strong> Proceed to step 2.",
      ]},
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Use 1AP to move towards the closest target while using cover and use the 2nd AP to do a combat action at the closest target.",
        "<strong>No.</strong> Proceed to step 3.",
      ]},
      { question: "Is there a civilian on the board?", answers: [
        "<strong>Yes.</strong> Use 2AP to move towards the closest civilian.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" towards the closest enemy and use the 2nd AP to enter overwatch.",
      ]},
    ]),
  },
  {
    name: "Cell leader", faction: 1, factionName: "Insurgents",
    img: "systems/haywire/assets/opfor_insurgents/cell_leader.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [SUPPORT, BODYGUARDS, ARMORED],
    weaponIds: [ASSAULT_RIFLE, PISTOL, BODY_ARMOR],
    behavior: bh([
      { question: "Is the Cell leader in cover?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" towards the closest cover and proceed to step 2.",
      ]},
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes and the Cell leader has 2AP left.</strong> Use 2AP to do 2 Combat actions at the closest target.",
        "<strong>Yes and the Cell leader has 1AP left.</strong> Use 1AP to do 1 Combat action at the closest target.",
        "<strong>No.</strong> Use 1AP to enter Overwatch facing the closest enemy.",
      ]},
    ]),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RUSSIANS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Conscript", faction: 2, factionName: "Russians",
    img: "systems/haywire/assets/opfor_russians/conscript.webp",
    combatStats: { easy: 11, medium: 14, hard: 18 },
    opforSkillIds: [ARMORED],
    weaponIds: [ASSAULT_RIFLE, LMG, BODY_ARMOR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No and the Conscript has 2AP.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>No and the Conscript has 1AP.</strong> Use 1AP to enter overwatch facing the closest enemy.",
      ]},
      { question: "Is the Conscript in cover?", answers: [
        "<strong>Yes and the Conscript has 2AP left.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Conscript has 1AP left.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No and the Conscript has 2AP left.</strong> Use 1AP to move to closest cover which keep LOS on the enemy and use the second AP to do 1 combat action at the closest target.",
        "<strong>No and the Conscript has 1AP left.</strong> Use 1AP to move to closest cover and if possible break LOS with the enemy.",
      ]},
    ]),
  },
  {
    name: "Rifleman", faction: 2, factionName: "Russians",
    img: "systems/haywire/assets/opfor_russians/rifleman.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [ARMORED],
    weaponIds: [ASSAULT_RIFLE, BODY_ARMOR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No and the Rifleman has 2AP.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>No and the Rifleman has 1AP.</strong> Use 1AP to enter overwatch facing the closest enemy.",
      ]},
      { question: "Is the Rifleman in cover?", answers: [
        "<strong>Yes and the Rifleman has 2AP left.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Rifleman has 1AP left.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No and the Rifleman has 2AP left.</strong> Use 1AP to move to closest cover which keep LOS on the enemy and use the second AP to do 1 combat action at the closest target.",
        "<strong>No and the Rifleman has 1AP left.</strong> Use 1 AP to do 1 combat action at the closest target.",
      ]},
    ]),
  },
  {
    name: "Automatic rifleman", faction: 2, factionName: "Russians",
    img: "systems/haywire/assets/opfor_russians/automatic_rifleman.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [BLIND_FIRE, ARMORED],
    weaponIds: [ASSAULT_RIFLE, LMG, BODY_ARMOR],
    behavior: bh([
      { question: "Are there 2 enemies or more in LOS?", answers: [
        "<strong>Yes and the Automatic rifleman has 2AP.</strong> Use the blind fire ability to fire at all visible enemies.",
        "<strong>Yes and the Automatic rifleman has 1AP.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No.</strong> Proceed to step 2.",
      ]},
      { question: "Is there 1 enemy in LOS?", answers: [
        "<strong>Yes and the Automatic rifleman has 2AP.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Automatic rifleman has 1AP.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
      ]},
    ]),
  },
  {
    name: "Lieutenant", faction: 2, factionName: "Russians",
    img: "systems/haywire/assets/opfor_russians/lieutenant.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [MOTIVATION, ARMORED],
    weaponIds: [ASSAULT_RIFLE, GRENADE_LAUNCHER, BODY_ARMOR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No and the Lieutenant has 2AP.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>No and the Lieutenant has 1AP.</strong> Use 1AP to enter overwatch facing the closest enemy. When doing an overwatch shot, use the rifle.",
      ]},
      { question: "Is the Lieutenant in cover?", answers: [
        "<strong>Yes and the Lieutenant has 2AP left.</strong> Use 1AP to do 1 combat action using the rifle at the closest target and use the 2nd AP to a 2nd combat action at the closest target using the grenade launcher.",
        "<strong>Yes and the Lieutenant has 1AP left.</strong> Use 1AP to do 1 combat action at the closest target using the grenade launcher.",
        "<strong>No and the Lieutenant has 2AP left.</strong> Use 1AP to move to the closest cover which keep LOS on the enemy and use the second AP to do 1 combat action at the closest target using the grenade launcher.",
        "<strong>No and the Lieutenant has 1AP left.</strong> Use 1AP to move to the closest cover and if possible break LOS with the enemy.",
      ]},
    ]),
  },
  {
    name: "AT specialist", faction: 2, factionName: "Russians",
    img: "systems/haywire/assets/opfor_russians/at_specialist.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [SHOCKWAVE, ARMORED],
    weaponIds: [ASSAULT_RIFLE, ROCKET_LAUNCHER, BODY_ARMOR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No and the AT specialist has 2AP.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>No and the AT specialist has 1AP.</strong> Use 1AP to enter overwatch facing the closest enemy. When doing an overwatch shot, use the rocket launcher.",
      ]},
      { question: "Is the AT specialist in cover?", answers: [
        "<strong>Yes.</strong> Use 1AP to do 1 combat action at the closest target (using a rocket launcher ends this model turn).",
        "<strong>No and the AT specialist has 2AP left.</strong> Use 1AP to move to the closest cover which keeps LOS on the enemy and use the second AP to do 1 combat action at the closest target using the rocket launcher.",
        "<strong>No and the AT specialist has 1AP left.</strong> Use 1 AP to do 1 combat action at the closest target using the rocket launcher.",
      ]},
    ]),
  },
  {
    name: "Assault", faction: 2, factionName: "Russians",
    img: "systems/haywire/assets/opfor_russians/assault.webp",
    combatStats: { easy: 7, medium: 11, hard: 15 },
    opforSkillIds: [ARMORED],
    weaponIds: [ASSAULT_RIFLE, FRAG_GRENADE, BODY_ARMOR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
      ]},
      { question: "Is the enemy within 12\"? (If a grenade has already been used, proceed to step 3)", answers: [
        "<strong>Yes and the Assault has 2AP left.</strong> Use 1AP to move to the closest cover that keeps LOS and range to the target and use 1AP to throw a fragmentation grenade at that target.",
        "<strong>Yes and the Assault has 1AP left.</strong> Use 1 AP to throw a fragmentation grenade at that target.",
        "<strong>No.</strong> Proceed to step 3.",
      ]},
      { question: "Is the Assault in cover?", answers: [
        "<strong>Yes and the Assault has 2AP left.</strong> Use 2AP to do 2 combat actions at the closest target.",
        "<strong>Yes and the Assault has 1AP left.</strong> Use 1 AP to do a combat action at the closest target.",
        "<strong>No and the Assault has 2AP left.</strong> Use 1AP to move to closest cover which keep LOS to this target and use the second AP to do a combat actions at the closest target.",
        "<strong>No and the Assault has 1AP left.</strong> Use 1AP to move to closest cover and if possible break LOS with the enemy.",
      ]},
    ]),
  },
  {
    name: "Sniper", faction: 2, factionName: "Russians",
    img: "systems/haywire/assets/opfor_russians/sniper.webp",
    combatStats: { easy: 6, medium: 10, hard: 14 },
    opforSkillIds: [GHILLIE_SUIT],
    weaponIds: [ASSAULT_RIFLE, FRAG_GRENADE, BODY_ARMOR],
    behavior: bh([
      { question: "Is the Sniper in a good firing position that covers a good portion of the board?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No.</strong> Use 2AP to move up to 12\" towards the best firing position within that range.",
      ]},
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Use 2AP to do 2 combat action at the closest target.",
        "<strong>No.</strong> Use 1AP to enter overwatch facing the closest enemy.",
      ]},
    ]),
  },
  {
    name: "Machine gunner", faction: 2, factionName: "Russians",
    img: "systems/haywire/assets/opfor_russians/machine_gunner.webp",
    combatStats: { easy: 7, medium: 11, hard: 15 },
    opforSkillIds: [SUPPRESSIVE_FIRE, ARMORED],
    weaponIds: [LMG, BODY_ARMOR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No and the Machine gunner has 2AP.</strong> Use 1AP to Move up to 6\" toward the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>No and the Machine gunner has 1AP.</strong> Use 1AP to enter overwatch facing the closest enemy.",
      ]},
      { question: "Is the Machine gunner in cover?", answers: [
        "<strong>Yes and the Machine gunner has 2AP left.</strong> Use 1AP to do 1 combat action at the closest target and use the 2nd AP to do a 2nd combat action at the next closest target in LOS.",
        "<strong>Yes and the Machine gunner has 1AP left.</strong> Use 1AP to do 1 combat action at the closest target.",
        "<strong>No and the Machine gunner has 2AP left.</strong> Use 1AP to move to closest cover which keep LOS on the enemy and use the second AP to do 1 combat action at the closest target.",
        "<strong>No and the Machine gunner has 1AP left.</strong> Use 1AP to move up to 6\" toward the closest cover.",
      ]},
    ]),
  },
  {
    name: "Grenadier", faction: 2, factionName: "Russians",
    img: "systems/haywire/assets/opfor_russians/grenadier.webp",
    combatStats: { easy: 7, medium: 11, hard: 15 },
    opforSkillIds: [SHOCKWAVE, ARMORED],
    weaponIds: [ASSAULT_RIFLE, GRENADE_LAUNCHER, ROCKET_LAUNCHER, BODY_ARMOR],
    behavior: bh([
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No and the Grenadier has 2AP.</strong> Use 1AP to Move up to 6\" towards the closest enemy and proceed back to step 1. Stop the movement when an enemy enters LOS.",
        "<strong>No and the Grenadier has 1AP.</strong> Use 1AP to enter overwatch facing the closest enemy. When doing an overwatch shot, use the launcher.",
      ]},
      { question: "Is the Grenadier in cover?", answers: [
        "<strong>Yes and the Grenadier has 2AP left.</strong> Use 1AP to do 1 combat action using the rifle at the closest target and use the 2nd AP to do a 2nd combat action at the closest target using the grenade or rocket launcher.",
        "<strong>Yes and the Grenadier has 1AP left.</strong> Use 1AP to do 1 combat action at the closest target using the grenade or rocket launcher.",
        "<strong>No and the Grenadier has 2AP left.</strong> Use 1AP to move to the closest cover which keep LOS on the enemy and use the second AP to do 1 combat action at the closest target using the grenade or rocket launcher.",
        "<strong>No and the Grenadier has 1AP left.</strong> Use 1AP to move to the closest cover which keeps LOS on the enemy.",
      ]},
    ]),
  },
  {
    name: "Squad commander", faction: 2, factionName: "Russians",
    img: "systems/haywire/assets/opfor_russians/squad_commander.webp",
    combatStats: { easy: 8, medium: 12, hard: 16 },
    opforSkillIds: [SUPPORT, BODYGUARDS, ARMORED],
    weaponIds: [ASSAULT_RIFLE, BODY_ARMOR],
    behavior: bh([
      { question: "Is the Squad commander in cover?", answers: [
        "<strong>Yes.</strong> Proceed to step 2.",
        "<strong>No.</strong> Use 1AP to Move up to 6\" towards the closest cover and proceed to step 2.",
      ]},
      { question: "Is there an enemy in LOS?", answers: [
        "<strong>Yes and the Cell leader has 2AP left.</strong> Use 2AP to do 2 Combat actions at the closest target.",
        "<strong>Yes and the Cell leader has 1AP left.</strong> Use 1AP to do 1 Combat action at the closest target.",
        "<strong>No.</strong> Use 1AP to enter Overwatch facing the closest enemy.",
      ]},
    ]),
  },
];

// ═════════════════════════════════════════════════════════════════════════════
//  PACK INTO LEVELDB
// ═════════════════════════════════════════════════════════════════════════════
const db = await openDb(OUTPUT);

// Write folders
await writeFolders(db, FOLDERS, "Actor", STATS);

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
    system: {
      cardImage: unit.img,
      faction: unit.factionName,
      combatStats: unit.combatStats,
      opforSkillIds: unit.opforSkillIds,
      weaponIds: unit.weaponIds,
      behavior: unit.behavior,
    },
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
