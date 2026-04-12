/**
 * One-off generator: merges lobby positions + Valve ids + counter-pick attr/cx,
 * assigns tags/weakness heuristics + per-hero overrides. Run: node scripts/build-heroes-data.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "heroes-data.js");

const IMG_TO_ID = {
  abaddon: 102, alchemist: 73, ancient_apparition: 68, antimage: 1, arc_warden: 113, axe: 2, bane: 3, batrider: 65,
  beastmaster: 38, bloodseeker: 4, bounty_hunter: 62, brewmaster: 78, bristleback: 99, broodmother: 61, centaur: 96,
  chaos_knight: 81, chen: 66, clinkz: 56, rattletrap: 51, crystal_maiden: 5, dark_seer: 55, dark_willow: 119, dawnbreaker: 135,
  dazzle: 50, death_prophet: 43, disruptor: 87, doom_bringer: 69, dragon_knight: 49, drow_ranger: 6, earth_spirit: 107,
  earthshaker: 7, elder_titan: 103, ember_spirit: 106, enchantress: 58, enigma: 33, faceless_void: 41, grimstroke: 121,
  gyrocopter: 72, hoodwink: 123, huskar: 59, invoker: 74, wisp: 91, jakiro: 64, juggernaut: 8, keeper_of_the_light: 90,
  kunkka: 23, legion_commander: 104, leshrac: 52, lich: 31, life_stealer: 54, lina: 25, lion: 26, lone_druid: 80, luna: 48,
  lycan: 77, magnataur: 97, marci: 136, mars: 129, medusa: 94, meepo: 82, mirana: 9, monkey_king: 114, morphling: 10,
  muerta: 138, naga_siren: 89, furion: 53, necrolyte: 36, night_stalker: 60, nyx_assassin: 88, ogre_magi: 84, omniknight: 57,
  oracle: 111, obsidian_destroyer: 76, pangolier: 120, phantom_assassin: 44, phantom_lancer: 12, phoenix: 110, primal_beast: 137,
  puck: 13, pudge: 14, pugna: 45, queenofpain: 39, razor: 15, riki: 32, rubick: 86, sand_king: 16, shadow_demon: 79, nevermore: 11,
  shadow_shaman: 27, silencer: 75, skywrath_mage: 101, slardar: 28, slark: 93, snapfire: 128, sniper: 35, spectre: 67,
  spirit_breaker: 71, storm_spirit: 17, sven: 18, techies: 105, templar_assassin: 46, terrorblade: 109, tidehunter: 29,
  shredder: 98, tinker: 34, tiny: 19, treant: 83, troll_warlord: 95, tusk: 100, abyssal_underlord: 108, undying: 85, ursa: 70,
  vengefulspirit: 20, venomancer: 40, viper: 47, visage: 92, void_spirit: 126, warlock: 37, weaver: 63, windrunner: 21,
  winter_wyvern: 112, witch_doctor: 30, skeleton_king: 42, zuus: 22, ringmaster: 131, kez: 145,
};

const LOBBY = [
  ["abaddon", [3, 5], "Abaddon"], ["alchemist", [1, 2], "Alchemist"], ["ancient_apparition", [4, 5], "Ancient Apparition"],
  ["antimage", [1, 2], "Anti-Mage"], ["arc_warden", [1, 2], "Arc Warden"], ["axe", [3, 4], "Axe"], ["bane", [4, 5], "Bane"],
  ["batrider", [2, 3], "Batrider"], ["beastmaster", [3, 4], "Beastmaster"], ["bloodseeker", [1, 2], "Bloodseeker"],
  ["bounty_hunter", [3, 4], "Bounty Hunter"], ["brewmaster", [2, 3], "Brewmaster"], ["bristleback", [1, 3], "Bristleback"],
  ["broodmother", [2, 3], "Broodmother"], ["centaur", [3, 4], "Centaur Warrunner"], ["chaos_knight", [1, 3], "Chaos Knight"],
  ["chen", [4, 5], "Chen"], ["clinkz", [1, 4], "Clinkz"], ["rattletrap", [4, 5], "Clockwerk"], ["crystal_maiden", [4, 5], "Crystal Maiden"],
  ["dark_seer", [3, 4], "Dark Seer"], ["dark_willow", [4, 5], "Dark Willow"], ["dawnbreaker", [3, 4], "Dawnbreaker"],
  ["dazzle", [2, 5], "Dazzle"], ["death_prophet", [2, 3], "Death Prophet"], ["disruptor", [4, 5], "Disruptor"],
  ["doom_bringer", [3, 4], "Doom"], ["dragon_knight", [2, 3], "Dragon Knight"], ["drow_ranger", [1, 2], "Drow Ranger"],
  ["earth_spirit", [2, 4], "Earth Spirit"], ["earthshaker", [3, 4], "Earthshaker"], ["elder_titan", [4, 5], "Elder Titan"],
  ["ember_spirit", [1, 2], "Ember Spirit"], ["enchantress", [4, 5], "Enchantress"], ["enigma", [3, 4], "Enigma"],
  ["faceless_void", [1, 3], "Faceless Void"], ["grimstroke", [4, 5], "Grimstroke"], ["gyrocopter", [1, 4], "Gyrocopter"],
  ["hoodwink", [2, 4], "Hoodwink"], ["huskar", [1, 2], "Huskar"], ["invoker", [2, 4], "Invoker"], ["wisp", [4, 5], "Io"],
  ["jakiro", [4, 5], "Jakiro"], ["juggernaut", [1, 2], "Juggernaut"], ["keeper_of_the_light", [4, 5], "Keeper of the Light"],
  ["kunkka", [2, 3], "Kunkka"], ["legion_commander", [1, 3], "Legion Commander"], ["leshrac", [2, 4], "Leshrac"],
  ["lich", [4, 5], "Lich"], ["life_stealer", [1, 3], "Lifestealer"], ["lina", [1, 2], "Lina"], ["lion", [4, 5], "Lion"],
  ["lone_druid", [1, 3], "Lone Druid"], ["luna", [1, 4], "Luna"], ["lycan", [1, 3], "Lycan"], ["magnataur", [2, 3], "Magnus"],
  ["marci", [3, 4], "Marci"], ["mars", [2, 3], "Mars"], ["medusa", [1, 2], "Medusa"], ["meepo", [1, 2], "Meepo"],
  ["mirana", [2, 4], "Mirana"], ["monkey_king", [1, 2], "Monkey King"], ["morphling", [1, 2], "Morphling"],
  ["muerta", [1, 2], "Muerta"], ["naga_siren", [1, 4], "Naga Siren"], ["furion", [4, 5], "Nature's Prophet"],
  ["necrolyte", [2, 3], "Necrophos"], ["night_stalker", [2, 3], "Night Stalker"], ["nyx_assassin", [2, 4], "Nyx Assassin"],
  ["ogre_magi", [3, 5], "Ogre Magi"], ["omniknight", [3, 5], "Omniknight"], ["oracle", [4, 5], "Oracle"],
  ["obsidian_destroyer", [1, 2], "Outworld Destroyer"], ["pangolier", [2, 3], "Pangolier"], ["phantom_assassin", [1, 2], "Phantom Assassin"],
  ["phantom_lancer", [1, 2], "Phantom Lancer"], ["phoenix", [3, 4], "Phoenix"], ["primal_beast", [2, 3], "Primal Beast"],
  ["puck", [2, 4], "Puck"], ["pudge", [1, 4], "Pudge"], ["pugna", [2, 4], "Pugna"], ["queenofpain", [2, 4], "Queen of Pain"],
  ["razor", [1, 3], "Razor"], ["riki", [1, 4], "Riki"], ["rubick", [2, 4], "Rubick"], ["sand_king", [3, 4], "Sand King"],
  ["shadow_demon", [4, 5], "Shadow Demon"], ["nevermore", [1, 2], "Shadow Fiend"], ["shadow_shaman", [4, 5], "Shadow Shaman"],
  ["silencer", [2, 5], "Silencer"], ["skywrath_mage", [2, 4], "Skywrath Mage"], ["slardar", [1, 3], "Slardar"],
  ["slark", [1, 2], "Slark"], ["snapfire", [2, 4], "Snapfire"], ["sniper", [1, 2], "Sniper"], ["spectre", [1, 3], "Spectre"],
  ["spirit_breaker", [3, 4], "Spirit Breaker"], ["storm_spirit", [2, 4], "Storm Spirit"], ["sven", [1, 3], "Sven"],
  ["techies", [2, 4], "Techies"], ["templar_assassin", [1, 2], "Templar Assassin"], ["terrorblade", [1, 2], "Terrorblade"],
  ["tidehunter", [3, 4], "Tidehunter"], ["shredder", [2, 3], "Timbersaw"], ["tinker", [2, 4], "Tinker"], ["tiny", [2, 4], "Tiny"],
  ["treant", [4, 5], "Treant Protector"], ["troll_warlord", [1, 2], "Troll Warlord"], ["tusk", [3, 4], "Tusk"],
  ["abyssal_underlord", [3, 5], "Underlord"], ["undying", [4, 5], "Undying"], ["ursa", [1, 2], "Ursa"],
  ["vengefulspirit", [4, 5], "Vengeful Spirit"], ["venomancer", [3, 4], "Venomancer"], ["viper", [2, 3], "Viper"],
  ["visage", [2, 3], "Visage"], ["void_spirit", [2, 4], "Void Spirit"], ["warlock", [4, 5], "Warlock"],
  ["weaver", [1, 4], "Weaver"], ["windrunner", [2, 4], "Windranger"], ["winter_wyvern", [4, 5], "Winter Wyvern"],
  ["witch_doctor", [4, 5], "Witch Doctor"], ["skeleton_king", [1, 3], "Wraith King"], ["zuus", [2, 4], "Zeus"],
  ["ringmaster", [4, 5], "Ringmaster"], ["kez", [1, 2], "Kez"],
];

const ATTR_CX = {
  1: ["agi", 2], 2: ["str", 1], 3: ["uni", 2], 4: ["agi", 1], 5: ["int", 1], 6: ["agi", 1], 7: ["str", 2], 8: ["agi", 1],
  9: ["agi", 2], 10: ["agi", 3], 11: ["agi", 2], 12: ["agi", 2], 13: ["int", 3], 14: ["str", 1], 15: ["agi", 1], 16: ["uni", 2],
  17: ["int", 3], 18: ["str", 1], 19: ["str", 2], 20: ["agi", 1], 21: ["uni", 2], 22: ["int", 1], 23: ["str", 2], 25: ["int", 1],
  26: ["int", 1], 27: ["int", 1], 28: ["str", 1], 29: ["str", 1], 30: ["int", 1], 31: ["int", 1], 32: ["agi", 1], 33: ["uni", 3],
  34: ["int", 3], 35: ["agi", 1], 36: ["int", 1], 37: ["int", 1], 38: ["uni", 2], 39: ["int", 2], 40: ["uni", 1], 41: ["agi", 2],
  42: ["str", 1], 43: ["uni", 1], 44: ["agi", 1], 45: ["int", 1], 46: ["agi", 2], 47: ["agi", 1], 48: ["agi", 1], 49: ["str", 1],
  50: ["uni", 2], 51: ["str", 2], 52: ["int", 2], 53: ["uni", 2], 54: ["str", 2], 55: ["int", 3], 56: ["agi", 1], 57: ["str", 1],
  58: ["int", 2], 59: ["str", 2], 60: ["str", 1], 61: ["agi", 2], 62: ["agi", 1], 63: ["agi", 2], 64: ["int", 1], 65: ["uni", 3],
  66: ["int", 3], 67: ["agi", 2], 68: ["int", 2], 69: ["str", 2], 70: ["agi", 1], 71: ["str", 1], 72: ["agi", 2], 73: ["str", 2],
  74: ["int", 3], 75: ["int", 1], 76: ["int", 2], 77: ["str", 2], 78: ["uni", 3], 79: ["int", 3], 80: ["agi", 3], 81: ["str", 1],
  82: ["agi", 3], 83: ["str", 1], 84: ["str", 1], 85: ["str", 2], 86: ["int", 3], 87: ["int", 2], 88: ["uni", 2], 89: ["agi", 3],
  90: ["int", 1], 91: ["uni", 3], 92: ["uni", 3], 93: ["agi", 2], 94: ["agi", 2], 95: ["agi", 2], 96: ["str", 1], 97: ["uni", 2],
  98: ["str", 3], 99: ["str", 1], 100: ["str", 1], 101: ["int", 1], 102: ["uni", 1], 103: ["str", 3], 104: ["str", 2], 105: ["uni", 3],
  106: ["agi", 3], 107: ["str", 3], 108: ["str", 1], 109: ["agi", 2], 110: ["str", 3], 111: ["int", 3], 112: ["int", 2],
  113: ["uni", 3], 114: ["agi", 2], 119: ["int", 2], 120: ["uni", 3], 121: ["int", 2], 123: ["agi", 2], 126: ["uni", 3],
  128: ["uni", 2], 129: ["str", 2], 131: ["int", 2], 135: ["str", 2], 136: ["uni", 2], 137: ["str", 1], 138: ["int", 2], 145: ["agi", 3],
};

const TAG_SILENCE = new Set([3, 7, 26, 27, 34, 39, 45, 52, 58, 64, 66, 75, 79, 86, 87, 90, 105, 111, 112, 121, 131]);
const TAG_GAP_CLOSE = new Set([2, 6, 7, 14, 17, 19, 23, 28, 29, 31, 38, 45, 51, 54, 60, 65, 69, 71, 96, 97, 100, 104, 106, 107, 108, 114, 120, 126, 129, 137, 145]);
const TAG_MANA_BURN = new Set([1, 15, 36, 39, 45, 47, 52, 74, 75, 76, 91, 98, 111]);
const TAG_MAGIC_RESIST = new Set([1, 11, 34, 42, 54, 57, 59, 70, 78, 85, 94, 102, 108]);
const TAG_MAGIC_REFLECT = new Set([86]);
const TAG_PUR_DAMAGE = new Set([10, 36, 59, 69, 85, 98, 108]);

const OVERRIDES = {
  1: { tags: ["gap_close", "mana_burn", "magic_resist"], weakness: ["silence", "lockdown", "early_pressure"] },
  10: { tags: ["magic_damage", "save_escape"], weakness: ["silence", "mana_burn", "long_lockdown"] },
  13: { tags: ["magic_burst", "mobility"], weakness: ["silence", "gap_close"] },
  14: { tags: ["magic_resist", "disable"], weakness: ["kite", "mana_burn", "armor_reduction"] },
  34: { tags: ["magic_burst", "global_pressure"], weakness: ["gap_close", "silence"] },
  41: { tags: ["save_escape", "chrono"], weakness: ["mana_burn", "silence"] },
  44: { tags: ["physical_burst", "gap_close"], weakness: ["magic_damage", "miss_chance"] },
  59: { tags: ["magic_damage"], weakness: ["pure_damage", "break", "silence"] },
  74: { tags: ["magic_burst", "disable"], weakness: ["gap_close", "silence"] },
  76: { tags: ["mana_burn", "magic_burst"], weakness: ["gap_close", "silence"] },
  82: { tags: ["physical_right_click", "split_push"], weakness: ["aoe_control", "silence", "cleave"] },
  91: { tags: ["save_heal", "relocate"], weakness: ["silence", "burst_magic"] },
  94: { tags: ["magic_resist", "split_shot"], weakness: ["mana_burn", "pure_damage"] },
  106: { tags: ["magic_burst", "mobility"], weakness: ["silence", "root"] },
  114: { tags: ["gap_close", "physical_burst"], weakness: ["silence", "true_strike"] },
};

function uniq(a) {
  return [...new Set(a)];
}

function inferFromRoles(id, attr, positions) {
  const tags = [];
  const weakness = [];
  const p = new Set(positions);
  if (p.has(1)) {
    tags.push("physical_right_click", "farm_scale");
    weakness.push("silence", "gap_close", "armor_reduction");
  }
  if (p.has(2)) {
    tags.push("magic_burst", "mobility");
    weakness.push("silence", "gank");
  }
  if (p.has(3)) {
    tags.push("tank_initiation", "disable");
    weakness.push("mana_burn", "kite", "pure_damage");
  }
  if (p.has(4) || p.has(5)) {
    tags.push("save_heal", "vision_control", "disable");
    weakness.push("gap_close", "silence", "dust_true_strike");
  }
  if (attr === "str") {
    tags.push("tank_frontline");
    weakness.push("mana_burn", "kite");
  } else if (attr === "int") {
    tags.push("magic_damage");
    weakness.push("gap_close", "silence");
  } else if (attr === "agi") {
    tags.push("physical_damage");
    weakness.push("silence", "point_target_disable");
  } else {
    tags.push("flex_toolkit");
    weakness.push("silence", "burst_magic");
  }
  return { tags: uniq(tags), weakness: uniq(weakness) };
}

function mergeOverride(base, ov) {
  if (!ov) return base;
  return {
    tags: uniq([...(ov.tags || []), ...base.tags]),
    weakness: uniq([...(ov.weakness || []), ...base.weakness]),
  };
}

function applyAbilityTags(id, tags) {
  const t = new Set(tags);
  if (TAG_SILENCE.has(id)) t.add("silence");
  if (TAG_GAP_CLOSE.has(id)) t.add("gap_close");
  if (TAG_MANA_BURN.has(id)) t.add("mana_burn");
  if (TAG_MAGIC_RESIST.has(id)) t.add("magic_resist");
  if (TAG_MAGIC_REFLECT.has(id)) t.add("magic_reflect");
  if (TAG_PUR_DAMAGE.has(id)) t.add("pure_damage");
  return [...t];
}

const heroes = [];
for (const [imgName, positions, name] of LOBBY) {
  const id = IMG_TO_ID[imgName];
  if (!id) throw new Error("Missing valve id for " + imgName);
  const ac = ATTR_CX[id] || ["uni", 2];
  const base = inferFromRoles(id, ac[0], positions);
  let merged = mergeOverride(base, OVERRIDES[id]);
  merged = { ...merged, tags: applyAbilityTags(id, merged.tags) };
  heroes.push({
    id,
    name,
    imgName,
    positions,
    attr: ac[0],
    cx: ac[1],
    tags: merged.tags,
    weakness: merged.weakness,
  });
}
heroes.sort((a, b) => a.id - b.id);

const header = `/**
 * Shared Dota 2 hero roster (Valve numeric ids). Used by lobby.html + counterPickLobby.html.
 * tags = offensive/toolkit strengths; weakness = vulnerability keys for counter-pick matching.
 * Generated by scripts/build-heroes-data.mjs — re-run after editing that script.
 */
export const TAG_LABELS = {
  gap_close: "Gap closer",
  silence: "Silence",
  mana_burn: "Mana burn / burn",
  magic_resist: "Magic resist / shield",
  magic_reflect: "Reflect / return magic",
  magic_damage: "Magic damage",
  magic_burst: "Magic burst",
  physical_burst: "Physical burst",
  physical_right_click: "Right-click carry",
  pure_damage: "Pure / mixed damage",
  break: "Break / passive disable",
  disable: "Hard disable",
  lockdown: "Long lockdown",
  long_lockdown: "Long lockdown",
  root: "Roots",
  save_escape: "Save / escape",
  save_heal: "Save / heal",
  vision_control: "Vision",
  vision_true: "True sight",
  dust_true_strike: "Reveal / true strike",
  tank_initiation: "Initiation tank",
  tank_frontline: "Frontline tank",
  farm_scale: "Late-game scale",
  split_push: "Split push",
  global_pressure: "Global pressure",
  mobility: "Mobility",
  kite: "Kite susceptible",
  early_pressure: "Early pressure weak",
  gank: "Gank vulnerable",
  aoe_control: "AoE control",
  cleave: "Cleave / illusions",
  miss_chance: "Evasion / miss",
  point_target_disable: "Single-target disable",
  flex_toolkit: "Flexible toolkit",
  armor_reduction: "Armor reduction weak",
};

/** @param {{ tags?: string[], weakness?: string[], positions?: number[], attr?: string, cx?: number }} hero */
export function heroTagTooltipLines(hero) {
  const lines = [];
  const tagStr = (hero.tags || []).map((k) => TAG_LABELS[k] || k).join(", ");
  const weakStr = (hero.weakness || []).map((k) => TAG_LABELS[k] || k).join(", ");
  if (tagStr) lines.push("Strengths: " + tagStr);
  if (weakStr) lines.push("Weak to: " + weakStr);
  lines.push(\`Pos: \${(hero.positions || []).join(", ")}\`);
  lines.push(\`\${hero.attr?.toUpperCase() || "?"} · Complexity \${hero.cx || "?"}\`);
  return lines;
}

/**
 * Pool hero ids that counter every enemy: for each enemy, at least one weakness key appears in candidate.tags.
 */
export function getCounterHeroIdsFromTags(enemyHeroIds, poolHeroIds, roster = HEROES) {
  const byId = new Map(roster.map((h) => [h.id, h]));
  const enemies = (enemyHeroIds || []).map((id) => byId.get(id)).filter(Boolean);
  if (!enemies.length) return new Set();
  const pool = (poolHeroIds || []).map((id) => byId.get(id)).filter(Boolean);
  const out = new Set();
  for (const h of pool) {
    const hTags = new Set(h.tags || []);
    let ok = true;
    for (const e of enemies) {
      const ws = e.weakness || [];
      if (!ws.length) continue;
      const hit = ws.some((w) => hTags.has(w));
      if (!hit) {
        ok = false;
        break;
      }
    }
    if (ok) out.add(h.id);
  }
  return out;
}

export const HEROES = `;

const dataJson = JSON.stringify(heroes, null, 2);
fs.writeFileSync(outPath, header + dataJson + ";\n", "utf8");
console.log("Wrote", outPath, "heroes:", heroes.length);
