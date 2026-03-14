import {
  actorBaseLayerCatalog,
  type ActorBaseLayerSlug,
  type ActorTacticalRoleSlug,
  type ActorTacticalSpecialSlug,
} from "@mighty-decks/spec/actorCards";

export type ActorCardActionType = "melee" | "ranged" | "direct" | "heal";
export type ActorCardJoin = "+" | "|";
export type ActorCardEffectType =
  | "toughness"
  | "shield"
  | "injury"
  | "distress"
  | "burning"
  | "freezing"
  | "stuck"
  | "hindered"
  | "complication"
  | "push"
  | "boost";

export interface ActorCardEffect {
  effectType: ActorCardEffectType;
  amount: number;
}

export type ActorCardAction =
  | string
  | {
      type: ActorCardActionType;
      count?: number;
      effect: Array<ActorCardEffect | ActorCardJoin>;
      splash?: boolean;
      range?: string;
    };

export interface ActorCardProfile {
  slug: string;
  name: string;
  deck: string;
  count: number;
  toughness?: string;
  toughnessBonus?: string;
  speed?: string;
  special?: string;
  actions?: ActorCardAction[];
  actionBonuses?: Array<string | null>;
  isModifier?: boolean;
}

const actorBaseFileName = (slug: string): string => slug.replaceAll("_", "-");

export const getActorBaseImageUri = (slug: ActorBaseLayerSlug): string =>
  `/actors/base/${actorBaseFileName(slug)}.png`;

export const getActorSpecialOverlayUri = (
  slug: ActorTacticalSpecialSlug,
): string => `/actors/base/${actorBaseFileName(slug)}.png`;

export const getActorTextIconUri = (iconName: string): string =>
  `/text-icons/${iconName}.png`;

export const actorBaseLayers = actorBaseLayerCatalog.map((entry) => ({
  ...entry,
  imageUri: getActorBaseImageUri(entry.slug),
}));

export const actorTacticalSpecialMap = {
  tough: {
    slug: "tough",
    name: "Tough",
    deck: "base mod",
    count: 1,
    toughnessBonus: "+[toughness][toughness]",
    isModifier: true,
  },
  shielded: {
    slug: "shielded",
    name: "Shielded",
    deck: "base mod",
    count: 4,
    toughnessBonus: "+[shield]",
    special: "-1[injury] taken",
    isModifier: true,
  },
  armoured: {
    slug: "armoured",
    name: "Armoured",
    deck: "base mod",
    count: 1,
    toughnessBonus: "+[shield][shield]",
    special: "-2[injury] taken",
    isModifier: true,
  },
  alpha: {
    slug: "alpha",
    name: "Alpha",
    deck: "base mod",
    count: 1,
    special: "+[toughness] and +[injury] for all attacks",
    toughnessBonus: "+[toughness]",
    actionBonuses: ["+[injury]", "+[injury]"],
    isModifier: true,
  },
  dangerous: {
    slug: "dangerous",
    name: "Dangerous",
    deck: "base mod",
    count: 1,
    special: "Primary attack also deals +[injury]",
    actionBonuses: ["+[injury]"],
    isModifier: true,
  },
  burning: {
    slug: "burning",
    name: "Burning",
    deck: "base mod",
    count: 4,
    special: "Primary attack also deals +[burning]",
    actionBonuses: ["+[burning]"],
    isModifier: true,
  },
  fiery: {
    slug: "fiery",
    name: "Fiery",
    deck: "base mod",
    count: 1,
    special: "Secondary attack deals [burning] instead",
    actionBonuses: [null, "[replace][burning]"],
    isModifier: true,
  },
  freezing: {
    slug: "freezing",
    name: "Freezing",
    deck: "base mod",
    count: 4,
    special: "Primary attack also deals +[freezing]",
    actionBonuses: ["+[freezing]"],
    isModifier: true,
  },
  icy: {
    slug: "icy",
    name: "Icy",
    deck: "base mod",
    count: 1,
    special: "Secondary attack deals [freezing] instead",
    actionBonuses: [null, "[replace][freezing]"],
    isModifier: true,
  },
  irritating: {
    slug: "irritating",
    name: "Irritating",
    deck: "base mod",
    count: 4,
    special: "Primary attack also deals +[distress]",
    actionBonuses: ["+[distress]"],
    isModifier: true,
  },
  corrupting: {
    slug: "corrupting",
    name: "Corrupting",
    deck: "base mod",
    count: 1,
    special: "Secondary attack deals [distress] instead",
    actionBonuses: [null, "[replace][distress]"],
    isModifier: true,
  },
  fast: {
    slug: "fast",
    name: "Fast",
    deck: "base mod",
    count: 4,
    speed: "+[speed]",
    special: "Moves an extra zone per turn",
    isModifier: true,
  },
  harassing: {
    slug: "harassing",
    name: "Harassing",
    deck: "base mod",
    count: 1,
    special: "Secondary attack also deals +[complication]",
    actionBonuses: [null, "+[complication]"],
    isModifier: true,
  },
  slowing: {
    slug: "slowing",
    name: "Slowing",
    deck: "base mod",
    count: 1,
    special: "Secondary attack also deals +[hindered]",
    actionBonuses: [null, "+[hindered]"],
    isModifier: true,
  },
  elemental: {
    slug: "elemental",
    name: "Elemental",
    deck: "base mod",
    count: 4,
    special: "All attacks can deal [freezing] or [burning]",
    actionBonuses: ["+[freezing]/+[burning]", "+[freezing]/+[burning]"],
    isModifier: true,
  },
  charging: {
    slug: "charging",
    name: "Charging",
    deck: "base mod",
    count: 1,
    special: "Primary attack also deals +[injury2] when entering a zone",
    actionBonuses: ["(+[injury2])"],
    isModifier: true,
  },
  suicide: {
    slug: "suicide",
    name: "Suicide",
    deck: "base mod",
    count: 4,
    special: "Can die and deal 2x[injury][splash]",
    isModifier: true,
  },
  grabbing: {
    slug: "grabbing",
    name: "Grabbing",
    deck: "base mod",
    count: 2,
    special: "[melee] attack also deals +[stuck]",
    actionBonuses: ["(+[stuck])", "(+[stuck])"],
    isModifier: true,
  },
  webbing: {
    slug: "webbing",
    name: "Webbing",
    deck: "base mod",
    count: 2,
    special: "Primary attack also deals +[stuck][splash]",
    actionBonuses: ["+[stuck][splash]", null],
    isModifier: true,
  },
  reaching: {
    slug: "reaching",
    name: "Reaching",
    deck: "base mod",
    count: 1,
    special: "[melee] attack reaches to adjacent zones",
    actionBonuses: ["([range]0-1)", "([range]0-1)"],
    isModifier: true,
  },
  healing: {
    slug: "healing",
    name: "Healing",
    deck: "base mod",
    count: 1,
    special: "Heal 2x[injury] from one ally in the zone",
    isModifier: true,
  },
  restoring: {
    slug: "restoring",
    name: "Restoring",
    deck: "base mod",
    count: 1,
    special: "Heal [injury] from all allies in the zone",
    isModifier: true,
  },
  regenerating: {
    slug: "regenerating",
    name: "Regenerating",
    deck: "base mod",
    count: 4,
    special: "Heal [injury2] at the end of the turn",
    toughnessBonus: "[heal][heal]",
    isModifier: true,
  },
  encouraging: {
    slug: "encouraging",
    name: "Encouraging",
    deck: "base mod",
    count: 1,
    special: "[boost] all allies in the zone",
    isModifier: true,
  },
} as const satisfies Record<ActorTacticalSpecialSlug, ActorCardProfile>;

export const actorTacticalRoleMap = {
  pawn: {
    slug: "pawn",
    name: "Pawn",
    deck: "base",
    count: 4,
    toughness: "[toughness]",
    speed: "[speed]",
    actions: [
      { type: "melee", effect: [{ effectType: "injury", amount: 1 }] },
      {
        type: "ranged",
        effect: [{ effectType: "injury", amount: 1 }],
        range: "1",
      },
    ],
  },
  minion: {
    slug: "minion",
    name: "Minion",
    deck: "base",
    count: 4,
    toughness: "[toughness][toughness]",
    speed: "[speed]",
    actions: [
      { type: "melee", effect: [{ effectType: "injury", amount: 1 }] },
      {
        type: "ranged",
        effect: [{ effectType: "injury", amount: 1 }],
        range: "1-2",
      },
    ],
  },
  thug: {
    slug: "thug",
    name: "Thug",
    deck: "base",
    count: 4,
    toughness: "[toughness][toughness]",
    speed: "[speed]",
    actions: [
      { type: "melee", effect: [{ effectType: "injury", amount: 2 }] },
      {
        type: "ranged",
        effect: [{ effectType: "injury", amount: 1 }],
        range: "1",
      },
    ],
  },
  brute: {
    slug: "brute",
    name: "Brute",
    deck: "base",
    count: 2,
    toughness: "[toughness][toughness][toughness]",
    speed: "[speed]",
    actions: [
      { type: "melee", effect: [{ effectType: "injury", amount: 2 }] },
      {
        type: "melee",
        effect: [{ effectType: "injury", amount: 1 }],
        splash: true,
      },
    ],
  },
  tank: {
    slug: "tank",
    name: "Tank",
    deck: "base",
    count: 2,
    toughness: "[toughness6]",
    speed: "[speed]",
    actions: [
      { type: "melee", effect: [{ effectType: "injury", amount: 2 }] },
      "[direct][push][range]1[splash]",
    ],
  },
  champion: {
    slug: "champion",
    name: "Champion",
    deck: "base",
    count: 1,
    toughness: "[toughness][toughness][toughness][toughness]",
    speed: "[speed]",
    actions: [
      { type: "melee", effect: [{ effectType: "injury", amount: 3 }] },
      {
        type: "direct",
        effect: [{ effectType: "distress", amount: 2 }],
        splash: true,
      },
    ],
  },
  assassin: {
    slug: "assassin",
    name: "Assassin",
    deck: "base",
    count: 1,
    toughness: "[toughness][toughness]",
    speed: "[speed]",
    actions: ["[melee][injury4]", "[direct][complication2][splash]"],
  },
  skirmisher: {
    slug: "skirmisher",
    name: "Skirmisher",
    deck: "base",
    count: 4,
    toughness: "[toughness][toughness]",
    speed: "[speed]",
    actions: [
      {
        type: "melee",
        effect: [{ effectType: "injury", amount: 1 }],
        count: 2,
      },
      {
        type: "ranged",
        effect: [{ effectType: "injury", amount: 1 }],
        count: 2,
        range: "1-2",
      },
    ],
  },
  ranger: {
    slug: "ranger",
    name: "Ranger",
    deck: "base",
    count: 4,
    toughness: "[toughness][toughness][toughness]",
    speed: "[speed]",
    actions: [
      {
        type: "ranged",
        effect: [{ effectType: "injury", amount: 2 }],
        range: "1-2",
      },
      { type: "melee", effect: [{ effectType: "injury", amount: 2 }] },
    ],
  },
  stalker: {
    slug: "stalker",
    name: "Stalker",
    deck: "base",
    count: 2,
    toughness: "[toughness][toughness]",
    speed: "[speed]",
    actions: [
      { type: "melee", effect: [{ effectType: "injury", amount: 3 }] },
      {
        type: "ranged",
        effect: [{ effectType: "injury", amount: 3 }],
        range: "1-2",
      },
    ],
  },
  commando: {
    slug: "commando",
    name: "Commando",
    deck: "base",
    count: 2,
    toughness: "[toughness][toughness][toughness]",
    speed: "[speed]",
    actions: [
      { type: "melee", effect: [{ effectType: "injury", amount: 3 }] },
      {
        type: "ranged",
        effect: [{ effectType: "injury", amount: 1 }],
        count: 3,
        range: "1-2",
      },
    ],
  },
  marksman: {
    slug: "marksman",
    name: "Marksman",
    deck: "base",
    count: 2,
    toughness: "[toughness][toughness]",
    speed: "[speed]",
    actions: [
      {
        type: "ranged",
        effect: [{ effectType: "injury", amount: 3 }],
        range: "1-3",
      },
      { type: "melee", effect: [{ effectType: "injury", amount: 1 }] },
    ],
  },
  sniper: {
    slug: "sniper",
    name: "Sniper",
    deck: "base",
    count: 1,
    toughness: "[toughness][toughness]",
    speed: "[speed]",
    actions: [
      "[ranged][injury4][range]1-inf",
      { type: "melee", effect: [{ effectType: "injury", amount: 1 }] },
    ],
  },
  grenadier: {
    slug: "grenadier",
    name: "Grenadier",
    deck: "base",
    count: 2,
    toughness: "[toughness][toughness]",
    speed: "[speed]",
    actions: [
      {
        type: "ranged",
        effect: [{ effectType: "injury", amount: 2 }],
        splash: true,
        range: "1",
      },
      { type: "melee", effect: [{ effectType: "injury", amount: 1 }] },
    ],
  },
  bomber: {
    slug: "bomber",
    name: "Bomber",
    deck: "base",
    count: 1,
    toughness: "[toughness][toughness][toughness]",
    speed: "[speed]",
    actions: [
      {
        type: "ranged",
        effect: [{ effectType: "injury", amount: 3 }],
        splash: true,
        range: "0",
      },
    ],
  },
  artillery: {
    slug: "artillery",
    name: "Artillery",
    deck: "base",
    count: 2,
    toughness: "[toughness][toughness]",
    speed: "[speed]",
    actions: [
      {
        type: "ranged",
        effect: [{ effectType: "injury", amount: 2 }],
        splash: true,
        range: "1-inf",
      },
    ],
  },
} as const satisfies Record<ActorTacticalRoleSlug, ActorCardProfile>;

export const actorTacticalRoles = Object.values(actorTacticalRoleMap);
export const actorTacticalSpecials = Object.values(actorTacticalSpecialMap);
