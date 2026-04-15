import type { OutcomeCardType } from "./adventureState";
import { campaignOutcomeCardDefinitions } from "./outcomeDeck";

type CsvRecord = Record<string, string>;

const hasMojibake = (value: string): boolean =>
  value.includes("Ã") ||
  value.includes("Â") ||
  value.includes("â") ||
  value.includes("ð") ||
  value.includes("\uFFFD");

const decodeMojibake = (value: string): string => {
  if (!hasMojibake(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (character) => character.charCodeAt(0) & 0xff);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return value;
  }
};

const sanitizeRichText = (value: string): string =>
  decodeMojibake(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
void sanitizeRichText;

const windows1252ByteByCodePoint = new Map<number, number>([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const hasCp1252Mojibake = (value: string): boolean =>
  value.includes("Â") ||
  value.includes("Ã") ||
  value.includes("â") ||
  value.includes("Å") ||
  value.includes("\uFFFD");

const toWindows1252Bytes = (value: string): Uint8Array | null => {
  const bytes: number[] = [];

  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) {
      return null;
    }
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }
    const mappedByte = windows1252ByteByCodePoint.get(codePoint);
    if (mappedByte === undefined) {
      return null;
    }
    bytes.push(mappedByte);
  }

  return Uint8Array.from(bytes);
};

const repairRulesText = (value: string): string => {
  let current = value;

  for (let pass = 0; pass < 4; pass += 1) {
    if (!hasCp1252Mojibake(current)) {
      break;
    }

    const bytes = toWindows1252Bytes(current);
    if (!bytes) {
      break;
    }

    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (decoded === current) {
      break;
    }

    current = decoded;
  }

  return current
    .replace(/\uFFFD/g, "")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]+/g, "")
    .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

const normalizeRulesRichText = (value: string): string =>
  repairRulesText(
    value.replace(/&nbsp;/gi, " ").replace(/<br\s*\/?>/gi, "\n"),
  );

const normalizePublicUri = (value: string): string =>
  value.trim().replace(/^\/mighty-decks\//, "/");

const parseCount = (value: string, fallback = 0): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCsv = (csv: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim().length > 0)) {
      rows.push(row);
    }
  }

  return rows;
};

const parseCsvRecords = (csv: string): CsvRecord[] => {
  const rows = parseCsv(csv);
  if (rows.length < 2) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => header.trim());

  return dataRows.map((dataRow) => {
    const record: CsvRecord = {};
    headers.forEach((header, headerIndex) => {
      record[header] = (dataRow[headerIndex] ?? "").trim();
    });
    return record;
  });
};

const splitEffectSections = (
  value: string,
): { noun: string; adjective?: string } => {
  const normalized = value
    .replace(/\u2014/g, "-")
    .replace(/\u2500/g, "-")
    .replace(/\u2013/g, "-");
  const separator = /-{2,}/;
  const match = separator.exec(normalized);

  if (!match || match.index < 0) {
    return { noun: normalized.trim() };
  }

  const noun = normalized.slice(0, match.index).trim();
  const adjective = normalized.slice(match.index + match[0].length).trim();
  return {
    noun,
    adjective: adjective.length > 0 ? adjective : undefined,
  };
};

const normalizeNoBreakSpaces = (value: string): string =>
  value
    .replace(/\+(\d+)\s+(?=[A-Za-z])/g, "+$1\u00a0")
    .replaceAll("Â ", "\u00a0");

interface OutcomeCsvRow {
  slug: string;
  title: string;
  icon: string;
  description: string;
  instructions: string;
  count: string;
  deck: string;
}

interface EffectCsvRow {
  slug: string;
  title: string;
  icon: string;
  effect: string;
  count: string;
  deck: string;
}

interface StuntCsvRow {
  slug: string;
  title: string;
  icon: string;
  requirements: string;
  effect: string;
  deck: string;
  count: string;
}

export interface RulesOutcomeCard {
  sourceSlug: string;
  slug: OutcomeCardType;
  title: string;
  iconUri: string;
  description: string;
  instructions: string;
  count: number;
  deck: string;
  code: string;
}

export interface RulesEffectCard {
  slug: string;
  title: string;
  iconUri: string;
  nounEffect: string;
  adjectiveEffect?: string;
  count: number;
  deck: string;
  code: string;
}

export interface RulesStuntCard {
  slug: string;
  title: string;
  iconUri: string;
  requirements?: string;
  effect: string;
  count: number;
  deck: string;
  code: string;
}

const outcomesCsvRaw = `"slug","title","icon","description","instructions","count","deck"
"special","Special action","/mighty-decks/outcomes/special-action.png","Activate your special action","3â€‚Effect",1,"base"
"success","Success","/mighty-decks/outcomes/success.png","It worked!","2â€‚Effect",3,"base"
"partial","Partial success","/mighty-decks/outcomes/partial-success.png","It mostly worked","1â€‚Effect",3,"base"
"fumble","Fumble","/mighty-decks/outcomes/fumble.png","It failed!<BR>Bonuses to Effect do not apply","Catastrophe: 3 orÂ only Fumbles after draw.",4,"base"
"chaos","Chaos","/mighty-decks/outcomes/chaos.png","Something unexpected happened","Cannot be used for defense",1,"base"`;

const effectsCsvRaw = `"slug","title","icon","effect","count","deck"
"injury","Injury","/mighty-decks/effects/injury.png","4xÂ Injury âžœ Unconscious.â”€â”€Use an action or an Asset to heal and discard.",4,"base"
"distress","Distress","/mighty-decks/effects/distress.png","3xÂ Distress âžœ Panic.<BR>4xÂ Distress âžœ Hopeless.â”€â”€Use an action or an Asset to recover and discard.",4,"base"
"dying","Dying","/mighty-decks/effects/dying.png","4xÂ Injury: You cannot take actions until someone revives you. Check optional dying rules.â”€â”€Heal your Injuries to discard.",1,"base"
"panicked","Panicked","/mighty-decks/effects/panicked.png","3xÂ Distress: You can only play the top card of your Outcome deck.â”€â”€Recover from your Distress to discard.",1,"base"
"hopeless","Hopeless","/mighty-decks/effects/hopeless.png","4xÂ Distress: You can only flee or give up.â”€â”€Recover from your Distress to discard.",1,"base"
"stuck","Stuck","/mighty-decks/effects/stuck.png","You cannot move, but you can still take other actions.â”€â”€Use an action to free yourself and discard.",1,"base"
"hindered","Hindered","/mighty-decks/effects/hindered.png","You can only move or take actions, but not both.â”€â”€Use an action to free yourself and discard.",1,"base"
"boost","Boost","/mighty-decks/effects/boost.png","Your next action or defense has +1Â Effect or +1Â Move.",1,"base"
"complication","Complication","/mighty-decks/effects/complication.png","A Complication makes your life harder.â”€â”€Next action or defense has -1Â Effect, then discard.",1,"base"
"freezing","Freezing","/mighty-decks/effects/freezing.png","Every turn you end with 2xÂ Freezing or more, you receive a Distress. Cancelled by Burning.â”€â”€Use an action or an Asset to discard.",2,"base"
"burning","Burning","/mighty-decks/effects/burning.png","Every turn you end with 2xÂ Burning or more, you receive an Injury. Cancelled by Freezing.â”€â”€Use an action or an Asset to discard.",2,"base"
"infection","Spore infection","/LP/icons/spore-infection.png","+1Â Doom",0,"base"
"doom","Doom","/mighty-decks/doom.png","You are loosing your humanity.â”€â”€3xÂ Doom: You transform into a monster.",0,"base"
"salvation","Salvation","/mighty-decks/salvation.png","You are regaining your humanity.â”€â”€3x Salvation: You transform back into a hero.",0,"base"`;
const stuntsCsvRaw = [
  `"slug","title","icon","requirements","effect","deck","count"`,
  `"dontGiveUp","Don't Give Up","/mighty-decks/stunts/base/dont-give-up.png","Recover from Panicked.","You need +1Â Distress to get Panicked or Hopeless.","Brawler",1`,
  `"bringThePain","Bring the Pain","/mighty-decks/stunts/base/bring-the-pain.png","Recover from Unconscious.","You need +1Â Injury to get Unconscious.","Brawler",1`,
  `"fearless","Fearless","/mighty-decks/stunts/base/fearless.png","Defend from a Distress while Panicked.","You are always Panicked, but you get Hindered instead of Hopeless.","Brawler",1`,
  `"pummel","Pummel","/mighty-decks/stunts/base/pummel.png","Knock out an opponent unarmed.","Playing a Partial Success to attack an opponent while unarmed inflicts +1Â Injury.","Brawler",1`,
  `"flex","Flex","/mighty-decks/stunts/base/flex.png","Impress or intimidate someone with your body.","+1Â Effect when using your body to impress or intimidate.","Brawler",1`,
  `"oversizedWeaponry","Oversized Weaponry","/mighty-decks/stunts/base/oversized-weaponry.png","Hit something with a weapon too large to wield easily.","You can use oversized weapons. You can wield two-handed weapons in one hand.","Brawler",1`,
  `"offensiveThrow","Offensive Throw","/mighty-decks/stunts/base/offensive-throw.png","Throw something most people cannot throw.","You can throw characters of your size or smaller up to 1Â zone away.","Brawler",1`,
  `"powerAttack","Power Attack","/mighty-decks/stunts/base/power-attack.png","Strike an enemy so hard they stagger or fall.","Your melee attacks leave enemies openâ€”they receive a Complication.","Brawler",1`,
  `"warCry","War Cry","/mighty-decks/stunts/base/war-cry.png","Intimidate multiple opponents at once.","Play Success to intimidate all enemies in your zone, giving them 1Â Distress.","Brawler",1`,
  `"grapple","Grapple","/mighty-decks/stunts/base/grapple.png","Restrain an enemy in close combat.","When you successfully block a melee attack, you automatically grapple the attacker.","Brawler",1`,
  `"chokeOut","Choke Out","/mighty-decks/stunts/base/choke-out.png","Hold an opponent down until they submit or pass out.","If you grapple an enemy for 2Â consecutive turns, they lose consciousness.","Brawler",1`,
  `"smash","Smash","/mighty-decks/stunts/base/smash.png","Knock down 3 or more opponents with a single melee attack.","You can split you melee attack Effect between enemies in the same zone.","Brawler",1`,
  `"seductive","Seductive","/mighty-decks/stunts/base/seductive.png","Seduce someone.","Receive 2xÂ Boosts at the start of a social Encounter with a character that may find you attractive.","Spy",1`,
  `"elusive","Elusive","/mighty-decks/stunts/base/elusive.png","Retreat from a zone where you received an Injury.","Once per round, you can move to an adjacent zone when you defend from taking any Injury.","Spy",1`,
  `"ghostStep","Ghost Step","/mighty-decks/stunts/base/ghost-step.png","Sneak past an enemy without being detected.","+1Â Effect while moving silently.","Spy",1`,
  `"masterOfDisguise","Master of Disguise","/mighty-decks/stunts/base/master-of-disguise.png","Deceive someone by assuming a false identity.","+1Â Effect when you assume a false identity.","Spy",1`,
  `"venomous","Venomous","/mighty-decks/stunts/base/venomous.png","Poison someone.","You can apply poison to a weapon and attack with it in 1Â action. You don't poison yourself by mistake.","Spy",1`,
  `"forger","Forger","/mighty-decks/stunts/base/forger.png","Deceive someone with a forged evidence.","+1Â Effect when manipulating with forged documents. The documents always hold up under casual inspection.","Spy",1`,
  `"stalker","Stalker","/mighty-decks/stunts/base/stalker.png","Knock-out or assassinate    an unaware target in 1Â action.","Your attacks deal +1Â Injury or Distress to unaware enemies.","Spy",1`,
  `"safecracker","Safecracker","/mighty-decks/stunts/base/safecracker.png","Break a lock.","+1Â Effect when braking into or out of locked places or containers.","Spy",1`,
  `"pickpocket","Pickpocket","/mighty-decks/stunts/base/pickpocket.png","Steal an item from a person without them noticing.","When you play a Success or better to pickpocket someone, you get an extra asset.","Spy",1`,
  `"stagedAccident","Staged Accident","/mighty-decks/stunts/base/staged-accident.png","Kill or knock-out someone indirectly.","+1 Effect when hurting someone indirectly.","Spy",1`,
  `"hiddenArsenal","Hidden Arsenal","/mighty-decks/stunts/base/hidden-arsenal.png","Smuggle a weapon somewhere.","Once per scene, reveal a hidden weapon to attack with +2 Effect.","Spy",1`,
  `"rallyingCall","Rallying Call","/mighty-decks/stunts/base/rallying-call.png","Boost an ally.","Play a Success to allow all allies that can hear you to discard a Complication or receive a Boost.","Ranger",1`,
  `"forager","Forager","/mighty-decks/stunts/base/forager.png","Forage some food.","You get 2x the food when foraging.","Ranger",1`,
  `"tracker","Tracker","/mighty-decks/stunts/base/tracker.png","Find someone you are tracking.","+1 Effect while tracking.","Ranger",1`,
  `"camouflage","Camouflage","/mighty-decks/stunts/base/camouflage.png","Camouflaging yourself from an enemy for 3 rounds.","Your camouflage always holds up unless inspected.","Ranger",1`,
  `"hunter","Hunter","/mighty-decks/stunts/base/hunter.png","Knock-out or kill an enemy with one shot.","Hitting an enemy without an Injury inflicts +1 Injury.","Ranger",1`,
  `"animalTrainer","Animal Trainer","/mighty-decks/stunts/base/animal-trainer.png","Make an animal follow your command.","Play a Special Action to teach your pet a new trick.","Ranger",1`,
  `"trapper","Trapper","/mighty-decks/stunts/base/trapper.png","Make a trap and capture an enemy or an animal in it.","Your traps don't hurt you or your allies.","Ranger",1`,
  `"marksman","Marksman","/mighty-decks/stunts/base/marksman.png","Hit a target 3 zones away.","You can shoot ranged weapons 1Â zone further.","Ranger",1`,
  `"weaponMaintenance","Weapon Maintenance","/mighty-decks/stunts/base/weapon-maintenance.png","Repair a broken weapon.","Weapons never break or jam when you use them.","Ranger",1`,
  `"penetration","Penetration","/mighty-decks/stunts/base/penetration.png","Hurt two enemies with one shot.","You can apply extra ranged Injury left after defeating an enemy to another enemy in the same zone.","Ranger",1`,
  `"survivor","Survivor","/mighty-decks/stunts/base/survivor.png","Survive a natural hazard without consequences.","You get +1Â Effect when dealing with natural hazards.","Ranger",1`,
  `"animalFriend","Animal Friend","/mighty-decks/stunts/base/animal-friend.png","Calm down an aggressive animal.","+1 Effect when handling animals.","Ranger",1`,
  `"strategist","Strategist","/mighty-decks/stunts/base/strategist.png","Reach a +4 Effect on your action.","Your Outcome card hand limit is increased byÂ 1.","Scholar",1`,
  `"volatileMastery","Volatile Mastery","/mighty-decks/stunts/base/volatile-mastery.png","Blow something up.","You never hit yourself with your own explosives.","Scholar",1`,
  `"linguist","Linguist","/mighty-decks/stunts/base/linguist.png","Gain a clue by studying a text document.","+1Â Effect when decoding or translating. You can always recognize a language by text or speech.",Scholar,1`,
  `"historian","Historian","/mighty-decks/stunts/base/historian.png","Recall or uncover a historical event.","You always know 1Â useful fact about any historical site, artifact, or tradition relevant to your setting.",Scholar,1`,
  `"botanist","Botanist","/mighty-decks/stunts/base/botanist.png","Identify a rare or useful plant in the wild.","You automatically recognize common plants. You receive +1Â Effect when using plants for medicine, poison, or alchemy.",Scholar,1`,
  `"chemist","Chemist","/mighty-decks/stunts/base/chemist.png","Create an effective potion, poison, or explosive compound.","Chemicals you craft have +1Â Effect or +1Â round duration.",Scholar,1`,
  `"tinkerer","Tinkerer","/mighty-decks/stunts/base/tinkerer.png","Repair or modify a device to serve an unintended purpose.","You don't need specialized tools when repairing or crafting.",Scholar,1`,
  `"physician","Physician","/mighty-decks/stunts/base/physician.png","Treat a diseased person.","+1 Effect when treating Injuries and diseases outside battle.",Scholar,1`,
  `"inventor","Inventor","/mighty-decks/stunts/base/inventor.png","Design and build a completely new tool or device.","Play a Special Action to invent a gadget tailored to the current situation. Destroy a non-consumable item for a +1Â Effect.",Scholar,1`,
  `"academic","Academic","/mighty-decks/stunts/base/academic.png","Teach an ally a new skill.","Play Partial Success to give an ally a Boost and discard a Complication.",Scholar,1`,
  `"powerfulRhetoric","Powerful Rhetoric","/mighty-decks/stunts/base/powerful-rhetoric.png","Make a speech.","Playing a Partial Success when persuading or debating counts as a Success.",Scholar,1`,
  `"medic","Medic","/mighty-decks/stunts/base/medic.png","Revive a fallen ally.","+1 Effect when treating Injuries in battle.","Scholar",1`,
  `"foresight","Foresight","/mighty-decks/stunts/base/foresight.png","Fortell something.","Receive a clue from the Storyteller in exchange for 2xÂ Distress.","Mystic",1`,
  `"senseDanger","Sense Danger","/mighty-decks/stunts/base/sense-danger.png","Detect an unseen threat before it strikes.","You receive +1Â Effect when trying to notice ambushes, traps, or hidden dangers.","Mystic",1`,
  `"readEmotions","Read Emotions","/mighty-decks/stunts/base/read-emotions.png","Call out a liar.","Play a Success to detect underlying emotions of a character.","Mystic",1`,
  `"markAnOmen","Mark an Omen","/mighty-decks/stunts/base/mark-an-omen.png","Act on a superstition.","Play a Success to make all enemies in the same zone gain 1Â Distress.","Mystic",1`,
  `"genusLoci","Genus Loci","/mighty-decks/stunts/base/genus-loci.png","Connect with a place or object's lingering essence.","Play a Success to glimpse into an object or locationâ€™s past and learn a hidden truth.","Mystic",1`,
  `"guideEmotions","Guide Emotions","/mighty-decks/stunts/base/guide-emotions.png","Talk someone down from attacking you.","+1 Effect when trying to calm someone down.","Mystic",1`,
  `"crowdControl","Crowd Control","/mighty-decks/stunts/base/crowd-control.png","Sway a crowd to obey you.","Play a Special Action to control command a crowd, calming, riling up, or directing them.","Mystic",1`,
  `"bless","Bless","/mighty-decks/stunts/base/bless.png","Bless someone.","Once per scene, play a Success to remove a status card other than Injury from an ally.","Mystic",1`,
  `"circleOfProtection","Circle of Protection","/mighty-decks/stunts/base/circle-of-protection.png","Create a protective boundary.","Once per session, play a Success to shield yourself and allies in your zone from the next hostile action.","Mystic",1`,
  `"tactician","Tactician","/mighty-decks/stunts/base/tactician.png","Execute a named tactic.","Once per scene, play a Success to prevent your ally in the same zone from receiving any cards until your next turn.",Scholar,0`,
  `"lastStand","Last Stand","/mighty-decks/stunts/base/last-stand.png","Defeat an enemy while one Injury away from being Unconscious.","Receive 1 less negative Effect card but at least 1 when you already have at least 5.","Brawler",0`,
  `"kleptomaniac","Kleptomaniac","/mighty-decks/stunts/base/kleptomaniac.png","Steal something you don't need.","When stealing or looting, play up to 3 cards from your Outcome deck. Get an extra Asset for Success, Distress for Fumble and Injury for Chaos.","Universal",0`,
  `"hardenedSkin","Hardened Skin","/mighty-decks/stunts/base/hardened-skin.png","Receive 3Â Injury from one attack and remain standing.","Unarmed attacks against you deal -1Â Injury.","Brawler",0`,
  `"enterTrance","Enter Trance","/mighty-decks/stunts/base/enter-trance.png","Experience a trance like state.","Play a Success to fall into a trance and ignore a mental or environmental hazard or charm someone to stun them for a round.","Mystic",0`,
  `"sweetLies","Sweet Lies","/mighty-decks/stunts/base/sweet-lies.png","Manipulate someone into trusting you with false information.","Partial Success does not raise suspicion when deceiving someone.","Spy",0`,
  `"escapist","Escapist","/mighty-decks/stunts/base/escapist.png","Lose enemies chasing you.","+1Â Effect when escaping enemies without leaving a trace.","Spy",0`,
  `"vibe","Vibe","/mighty-decks/stunts/base/vibe.png","Make a friend.","You receive +1Â Effect when making a first impression or making someone like you.","Mystic",0`,
  `"hex","Hex","/mighty-decks/stunts/base/hex.png","Curse someone.","Once per scene, play Success to make a person believe you cursed them. They receive 2x Distress. Usable once per scene.","Mystic",0`,
  `"protector","Protector","/mighty-decks/stunts/base/protector.png","Take a hit for someone else.","Play an Outcome card to defend someone in your zone. You receive any unblocked Injuries.","Brawler",0`,
  `"forwardAssault","Forward Assault","/mighty-decks/stunts/base/forward-assault.png","Make all your allies assault a zone in one turn.","Designate a zone. +1 Effect to everyone who moves into that zone and attacks during the next turn.","Mystic",0`,
  `"coverFire","Cover Fire","/mighty-decks/stunts/base/cover-fire.png","Intimidate a group of enemies with your firepower.","Once per scene, play a Success to inflict -1 Effect on all enemies' attacks in the zone until your next turn.","Ranger",0`,
  `"evasive","Evasive Maneuver","/mighty-decks/evasive-maneuver.png",,"+1Â Effect on driving, riding, or piloting to avoid something.","Universal",0`,
  `"charge","Charge","/mighty-decks/charge.png","Defeat an enemy in melee right after entering a zone.","+1Â Effect on melee attacking after moving to a zone.","Universal",0`,
  `"ballistic","Ballistic","/mighty-decks/ballistic.png","Defeat an enemy with a ranged attack without a line of sight.","+1Â Effect on shooting two or more zones away.","Universal",0`,
  `"acrobatic","Acrobatic","/mighty-decks/acrobat.png",,"You can combine the Effect of 2 Outcome cards to overcome a movement-based challenge.","Universal",0`,
  `"calm","Calm Under Pressure","/mighty-decks/calm.png",,"Needs rework: Gain Boost every time you get Distress. You no longer get the benefit of this effect once you lose a Distress until the end of the Encounter.","Universal",0`,
  `"rage","Rage","/mighty-decks/rage.png",,"Once per encounter, you can explode with rage and get as many Boosts as you have Distresses. You lose all Boosts, if you lose a Distress and at the end of the Encounter.","Universal",0`,
  `"recklessAttack","Reckless Attack","/mighty-decks/reckless-attack.png","Receive an Injury during your attack.","Gain a Complication to add +1Â Effect to your melee attack.","Universal",0`,
  `"brushItOff","Brush It Off","/mighty-decks/brush-it-off.png",,"Every time you receive an Injury and don't have any Complications, you can choose to receive a Complication instead.","Universal",0`,
  `"joker","Joker","/mighty-decks/joker.png",,"Any time you receive a Distress and you don't have any Complications you can choose to receive a Complication instead.","Universal",0`,
  `"ghost","Ghost","/mighty-decks/ghost.png",,"You can choose to receive a Distress for a +2Â Effect when trying to avoid detection.","Universal",0`,
  `"allIn","All In","/mighty-decks/all-in.png",,"You can choose to play up to 3Â Outcome cards from your hand for combined Effect. You cannot play a Fumble or Chaos this way. Don't draw any Outcome cards at the end of your turn.","Universal",0`,
  `"burglar","Burglar","/mighty-decks/burglar.png",,"You can choose to receive a Distress for a +2Â Effect when trying to break into something.","Universal",0`,
  `"tactical","Tactical","/mighty-decks/tactical.png",,"At the beginning of a combat Encounter, draw two extra Outcome cards. Only draw Outcome cards when you have fewer cards in hand than your hand limit.","Universal",0`,
  `"analytical","Analytical","/mighty-decks/blackboard.png",,"At the beginning of an expertise-based Encounter, draw two extra Outcome cards. Only draw Outcome cards when you have fewer cards in hand than your hand limit.","Universal",0`,
  `"sympathetic","Sympathetic","/mighty-decks/sympathetic.png",,"At the beginning of a social Encounter, draw two extra Outcome cards. Only draw Outcome cards when you have fewer cards in hand than your hand limit.","Universal",0`,
  `"intuitive","Intuitive","/mighty-decks/intuitive.png",,"At the beginning of an Encounter, you can look at the top 3Â cards of your Outcome deck, discard one and put the rest back in any order.","Universal",0`,
  `"assassin","Assassin","/mighty-decks/dagger.png",,"+2 Effect when you attack someone who is not aware of you.","Universal",0`,
  `"ruthless","Ruthless","/mighty-decks/ruthless.png",,"When you finish an enemy, you can choose to give all other enemies in the zone that can see you aÂ Distress orÂ Injury.","Universal",0`,
  `"elemental","Elemental","/mighty-decks/elemental.png",,"+1Â Effect on Success when you use an element you are proficient in. You receive an extra Distress card when damaged by an opposite element.","Fantasy",0`,
  `"timeStop","Time Stop","/mighty-decks/time-stop.png","Fulfill a Counter with your action.","Receive a Distress to prevent a turn or round Counter from advancing.","Fantasy",0`,
  `"recklessPiloting","Reckless Driving","/mighty-decks/car-jump.png",,"+1Â Effect on driving, riding, or piloting to cause damage.","Modern",0`,
  `"burst","Burst fire","/mighty-decks/burst.png","Requires a repeat-fire weapon.","You can hit a number of targets in a zone equal to your EffectÂ +1 for 1Â Effect each.","Modern",0`,
  `"whiteHat","White Hat Hacker","/LP/icons/whiteHat.png",,"+1Â Effect when hacking for altruistic reasons.","Modern",0`,
  `"sharpshooter","Sharpshooter","/mighty-decks/sharpshooter.png",Requires a ranged or thrown weapon.,"+1Â Effect on shooting or throwing at an inanimate object.","Modern",0`,
  `"overclock","Overclock","/mighty-decks/overclock.png",,"Gain a Burning and draw an extra Outcome card to your hand.","Modern",0`,
  `"psychonaut","Psychonaut","/mighty-decks/psychonaut.png",,"You can ignore one effect of any bio-chemical consumable or increase its EffectÂ byÂ 1.","Modern",0`,
  `"chargedAttack","Charged attack","/mighty-decks/charged.png",Requires a charge weapon.,"You can play an Outcome card from the deck each turn to add its Effect to your next attack. Fumble cancels previous Effect.","Sci-Fi",0`,
  `"upload","Upload","/LP/icons/upload.png",Requires a synthetic body.,"You can upload your consciousness into a different powered down machine.","Sci-Fi",0`,
  `"turret","Deploy a turret","/LP/icons/turret.png",,"Deploy a small turret in your Zone. Play an outcome card. For that many turns the turret can attack up to 1Â zone away with 1Â Effect during your turn.","sci-Fi",0`,
  `"heatSink","Heat Sink","/LP/icons/cooler.png","Requires a synthetic body.","Action: touch two allies (or self) in your zone and discard any pairs of Heat and Freezing cards.","Sci-Fi",0`,
].join("\n");

const outcomeSlugAliasMap: Record<string, OutcomeCardType> = {
  "special-action": "special-action",
  special: "special-action",
  success: "success",
  "partial-success": "partial-success",
  partial: "partial-success",
  fumble: "fumble",
  chaos: "chaos",
};

const parseOutcomeCsvRows = (): OutcomeCsvRow[] =>
  parseCsvRecords(outcomesCsvRaw).map((record) => ({
    slug: record.slug ?? "",
    title: record.title ?? "",
    icon: record.icon ?? "",
    description: record.description ?? "",
    instructions: record.instructions ?? "",
    count: record.count ?? "0",
    deck: record.deck ?? "base",
  }));

const parseEffectCsvRows = (): EffectCsvRow[] =>
  parseCsvRecords(effectsCsvRaw).map((record) => ({
    slug: record.slug ?? "",
    title: record.title ?? "",
    icon: record.icon ?? "",
    effect: record.effect ?? "",
    count: record.count ?? "0",
    deck: record.deck ?? "base",
  }));

const parseStuntCsvRows = (): StuntCsvRow[] =>
  parseCsvRecords(stuntsCsvRaw).map((record) => ({
    slug: record.slug ?? "",
    title: record.title ?? "",
    icon: record.icon ?? "",
    requirements: record.requirements ?? "",
    effect: record.effect ?? "",
    deck: record.deck ?? "base",
    count: record.count ?? "0",
  }));

const outcomeDefinitionBySlug = new Map(
  campaignOutcomeCardDefinitions.map((definition) => [definition.slug, definition] as const),
);

export const rulesOutcomeCards: RulesOutcomeCard[] = parseOutcomeCsvRows()
  .map((row) => {
    const normalizedSourceSlug = row.slug.trim().toLowerCase();
    const canonicalSlug = outcomeSlugAliasMap[normalizedSourceSlug];
    if (!canonicalSlug) {
      return null;
    }

    const definition = outcomeDefinitionBySlug.get(canonicalSlug);
    if (!definition) {
      return null;
    }

    const card: RulesOutcomeCard = {
      sourceSlug: normalizedSourceSlug,
      slug: canonicalSlug,
      title: definition.title,
      iconUri: normalizePublicUri(row.icon),
      description: normalizeRulesRichText(row.description),
      instructions: normalizeRulesRichText(row.instructions),
      count: definition.count,
      deck: normalizeRulesRichText(row.deck) || "base",
      code: definition.shortcode,
    };
    return card;
  })
  .filter((value): value is RulesOutcomeCard => value !== null);

export const rulesEffectCards: RulesEffectCard[] = parseEffectCsvRows().flatMap(
  (row) => {
    const count = parseCount(row.count, 0);
    if (count <= 0) {
      return [];
    }

    const sanitizedEffect = normalizeRulesRichText(row.effect);
    const sections = splitEffectSections(sanitizedEffect);

    return [
      {
        slug: row.slug.trim(),
        title: normalizeRulesRichText(row.title),
        iconUri: normalizePublicUri(row.icon),
        nounEffect: sections.noun,
        adjectiveEffect: sections.adjective,
        count,
        deck: normalizeRulesRichText(row.deck) || "base",
        code: `@effect/${row.slug.trim()}`,
      } satisfies RulesEffectCard,
    ];
  },
);
export const rulesStuntCards: RulesStuntCard[] = parseStuntCsvRows().flatMap(
  (row) => {
    const count = parseCount(row.count, 0);
    if (count <= 0) {
      return [];
    }

    const requirements = normalizeNoBreakSpaces(
      normalizeRulesRichText(row.requirements),
    );
    const effect = normalizeNoBreakSpaces(
      normalizeRulesRichText(row.effect),
    );

    return [
      {
        slug: row.slug.trim(),
        title: normalizeRulesRichText(row.title),
        iconUri: normalizePublicUri(row.icon),
        requirements: requirements.length > 0 ? requirements : undefined,
        effect,
        count,
        deck: normalizeRulesRichText(row.deck) || "base",
        code: `@stunt/${row.slug.trim()}`,
      } satisfies RulesStuntCard,
    ];
  },
);

export const rulesOutcomeCardSlugs = rulesOutcomeCards.map((card) => card.slug);
export const rulesEffectCardSlugs = rulesEffectCards.map((card) => card.slug);
export const rulesStuntCardSlugs = rulesStuntCards.map((card) => card.slug);

export const rulesOutcomeCardsBySlug = Object.fromEntries(
  rulesOutcomeCards.map((card) => [card.slug, card] as const),
) as Record<RulesOutcomeCard["slug"], RulesOutcomeCard>;

export const rulesEffectCardsBySlug = Object.fromEntries(
  rulesEffectCards.map((card) => [card.slug, card] as const),
) as Record<string, RulesEffectCard>;

export const rulesStuntCardsBySlug = Object.fromEntries(
  rulesStuntCards.map((card) => [card.slug, card] as const),
) as Record<string, RulesStuntCard>;
