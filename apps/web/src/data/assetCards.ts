import {
  assetBaseCatalog,
  assetModifierCatalog,
  type AssetBaseGroupLabel,
  type AssetBaseSlug,
  type AssetModifierSlug,
} from "@mighty-decks/spec/assetCards";

export interface AssetBaseCard {
  slug: AssetBaseSlug;
  title: string;
  imageUri: string;
  effect: string;
  deck: "base" | "medieval";
  group: AssetBaseGroupLabel;
}

export interface AssetModifierCard {
  slug: AssetModifierSlug;
  title: string;
  imageUri: string;
  effect: string;
  deck: string;
}

interface AssetBaseCardDetails {
  imageUri: string;
  effect: string;
}

interface AssetModifierCardDetails {
  imageUri: string;
  effect: string;
}

const assetDeckByGroup: Record<AssetBaseGroupLabel, AssetBaseCard["deck"]> = {
  "Asset Base": "base",
  "Asset Medieval": "medieval",
};

const assetBaseCardDetailsBySlug = {
  "medieval_gambeson": {
    imageUri: "/assets/medieval/gambeson.png",
    effect: "Light fabric armor. Negates 1\u00a0Injury from slashing damage.",
  },
  "medieval_chainmail": {
    imageUri: "/assets/medieval/chainmail.png",
    effect: "Medium metal armor. Negates 1\u00a0Injury from slashing and piercing damage. -1\u00a0Effect when sneaking, running, climbing or swimming.",
  },
  "medieval_plate_armor": {
    imageUri: "/assets/medieval/plate-armor.png",
    effect: "Heavy metal armor. Negates 2\u00a0slashing/piercing Injuries and 1\u00a0bludgeoning Injury. -2\u00a0Effect when sneaking, running, climbing or swimming.",
  },
  "medieval_buckler": {
    imageUri: "/assets/medieval/buckler.png",
    effect: "Light metal shield. +1\u00a0Effect when defending from melee attack once per round.",
  },
  "medieval_kite-shield": {
    imageUri: "/assets/medieval/kite-shield.png",
    effect: "Large wooden shield. +1\u00a0Effect when defending from melee or ranged attack. -1\u00a0Effect when sneaking, running, climbing or swimming.",
  },
  "medieval_dagger": {
    imageUri: "/assets/medieval/dagger.png",
    effect: "A light one-handed piercing melee weapon. Can be thrown 1\u00a0zone away.",
  },
  "medieval_hand_axe": {
    imageUri: "/assets/medieval/hand-axe.png",
    effect: "A light one-handed slashing melee weapon. Can be thrown 1\u00a0zone away.",
  },
  "medieval_longsword": {
    imageUri: "/assets/medieval/longsword.png",
    effect: "A medium one- or two-handed piercing or slashing melee weapon. +1\u00a0Effect when attacking while wielded with both hands.",
  },
  "medieval_zweihandler": {
    imageUri: "/assets/medieval/zweihandler.png",
    effect: "A heavy two-handed slashing melee weapon. +1\u00a0Effect when attacking.",
  },
  "medieval_great_axe": {
    imageUri: "/assets/medieval/great-axe.png",
    effect: "A heavy two-handed slashing melee weapon. +2\u00a0Effect when attacking multiple\u00a0enemies.",
  },
  "medieval_war_hammer": {
    imageUri: "/assets/medieval/war-hammer.png",
    effect: "A heavy two-handed piercing or bludgeoning melee weapon. +1\u00a0Effect against armor.",
  },
  "medieval_mace": {
    imageUri: "/assets/medieval/mace.png",
    effect: "A medium one-handed bludgeoning melee weapon. 1\u00a0Injury negated by armor turns to Distress instead.",
  },
  "medieval_morningstar": {
    imageUri: "/assets/medieval/morningstar.png",
    effect: "A medium one-handed bludgeoning melee weapon. Ignores shields.",
  },
  "medieval_staff": {
    imageUri: "/assets/medieval/staff.png",
    effect: "A light two-handed bludgeoning melee polearm weapon. +1\u00a0Effect when tripping an enemy.",
  },
  "medieval_spear": {
    imageUri: "/assets/medieval/spear.png",
    effect: "A medium two-handed piercing melee polearm weapon. Once per round outside your turn you can attack an enemy entering your zone.",
  },
  "medieval_billhook": {
    imageUri: "/assets/medieval/billhook.png",
    effect: "A heavy two-handed piercing or slashing polearm weapon. +1\u00a0Effect against cavalry.",
  },
  "medieval_hunting_bow": {
    imageUri: "/assets/medieval/hunting-bow.png",
    effect: "A light two-handed ranged weapon. Range: 1-2 zones away. -1\u00a0Effect when shooting targets in the same zone.",
  },
  "medieval_crossbow": {
    imageUri: "/assets/medieval/crossbow.png",
    effect: "A heavy two-handed ranged weapon. Range: 1-2 zones. Ignores Plate Armor. -1\u00a0Effect when shooting targets in the same zone.",
  },
  "medieval_hand_cannon": {
    imageUri: "/assets/medieval/hand-cannon.png",
    effect: "A heavy two-handed ranged weapon. Range: 0-2 zones away. Play 2\u00a0Outcome cards over 2\u00a0turns to load and fire. Add the Effect together.",
  },
  "medieval_riding_horse": {
    imageUri: "/assets/medieval/riding-horse.png",
    effect: "Can move 2 zones per turn. +1\u00a0Effect when attacking infantry on horseback.",
  },
  "medieval_wagon": {
    imageUri: "/assets/medieval/wagon.png",
    effect: "Can move 2 zones per turn. Capacity: 2 people in the front and up to 6 in the back. +1\u00a0Effect when defending from infantry.",
  },
  "medieval_grappling_hook": {
    imageUri: "/assets/medieval/grappling-hook.png",
    effect: "+1\u00a0Effect while climbing.",
  },
  "medieval_lockpick_set": {
    imageUri: "/assets/medieval/lockpick-set.png",
    effect: "Allows picking locks.",
  },
  "medieval_bandages": {
    imageUri: "/assets/medieval/bandages.png",
    effect: "Removes 2x\u00a0Injury. Usable during battle. Consumed after use.",
  },
  "medieval_healing_salve": {
    imageUri: "/assets/medieval/healing-salve.png",
    effect: "+1\u00a0Effect when healing to remove Injuries. Not usable during battle.",
  },
  "medieval_herbal_remedy": {
    imageUri: "/assets/medieval/herbal-remedy.png",
    effect: "Receive a Boost or negate Poison. Usable during battle. Consumed after use.",
  },
  "medieval_prayer_book": {
    imageUri: "/assets/medieval/prayer-book.png",
    effect: "+1\u00a0Effect when practicing religion to relieve Distress. Not usable during battle.",
  },
  "medieval_mead": {
    imageUri: "/assets/medieval/mead.png",
    effect: "Removes 2x\u00a0Distress. Usable during battle. Consumed after use.",
  },
  "medieval_grenade": {
    imageUri: "/assets/medieval/grenade.png",
    effect: "Play an Outcome card to throw the granade up to 1\u00a0zone away. Damages everything in the zone. Consumed after use.",
  },
  "medieval_lantern": {
    imageUri: "/assets/medieval/lantern.png",
    effect: "Provides light in the current zone. Can be used in the rain. Does not count as an open flame.",
  },
  "medieval_torch": {
    imageUri: "/assets/medieval/torch.png",
    effect: "Provides light in the current zone. Cannot be used in the rain. Counts as an open flame.",
  },
  "medieval_cannon": {
    imageUri: "/assets/medieval/cannon.png",
    effect: "A heavy explosive artillery weapon. Range: 1+\u00a0zones away. Ignores all shields and armor. Damages everything in the zone.",
  },
  "medieval_rations": {
    imageUri: "/assets/medieval/rations.png",
    effect: "Food and water to sustain a person for a day.",
  },
  "medieval_pouch": {
    imageUri: "/assets/medieval/pouch.png",
    effect: "A pouch can store easily accessable small things. Can be attached to a belt.",
  },
  "medieval_chest": {
    imageUri: "/assets/medieval/chest.png",
    effect: "A chest can store heavier things for easier transportation. Can be locked.",
  },
  "medieval_letter": {
    imageUri: "/assets/medieval/letter.png",
    effect: "A letter is a convenient way of passing information.",
  },
  "medieval_poison": {
    imageUri: "/assets/medieval/poison.png",
    effect: "Causes 1x Injury at the end of every Round until healed. Can be applied to a weapon. Usable during battle. Consumed after use.",
  },
  "medieval_key": {
    imageUri: "/assets/medieval/key.png",
    effect: "What does it open",
  },
  "medieval_trap": {
    imageUri: "/assets/medieval/trap.png",
    effect: "Causes 2x Injury and Stuck when stepped on. Takes a Success to escape from it.",
  },
  "medieval_tools": {
    imageUri: "/assets/medieval/tools.png",
    effect: "Tools for crafting.",
  },
  "medieval_digging": {
    imageUri: "/assets/medieval/digging.png",
    effect: "Usable for mining or breaking down obstacles.",
  },
  "medieval_ore": {
    imageUri: "/assets/medieval/ore.png",
    effect: "Does it contain precious metals, gems or is it just a fancy stone",
  },
  "medieval_stone": {
    imageUri: "/assets/medieval/stone.png",
    effect: "An excellent building material.",
  },
  "medieval_wood": {
    imageUri: "/assets/medieval/wood.png",
    effect: "Good for building, but quite flamable.",
  },
  "medieval_iron": {
    imageUri: "/assets/medieval/iron.png",
    effect: "Can be used to craft something useful by a blacksmith.",
  },
  "medieval_silver": {
    imageUri: "/assets/medieval/silver.png",
    effect: "Can be used to craft something pretty by a jewler.",
  },
  "medieval_gold": {
    imageUri: "/assets/medieval/gold.png",
    effect: "Can be used to craft something precious by a jewler.",
  },
  "base_light_weapon": {
    imageUri: "/assets/base/light_weapon.png",
    effect: "When attacking with Success or better, you may also play a\u00a0Partial Success to attack again.",
  },
  "base_heavy_weapon": {
    imageUri: "/assets/base/heavy_weapon.png",
    effect: "+1\u00a0Effect when attacking with Success or better.",
  },
  "base_reach_weapon": {
    imageUri: "/assets/base/reach_weapon.png",
    effect: "Attacks in same or adjacent zone. On\u00a0Success, prevent target\u2019s movement next round.",
  },
  "base_spread_weapon": {
    imageUri: "/assets/base/spread_weapon.png",
    effect: "Attack all enemies in your zone or an\u00a0adjacent\u00a0one.",
  },
  "base_throwable_weapon": {
    imageUri: "/assets/base/throwable_weapon.png",
    effect: "Throw to attack up to 2\u00a0zones away.",
  },
  "base_precision_weapon": {
    imageUri: "/assets/base/precision_weapon.png",
    effect: "Shoot to attack up to 3\u00a0zones away.",
  },
  "base_repeating_weapon": {
    imageUri: "/assets/base/repeating_weapon.png",
    effect: "Attack up to 3 targets 1-2 zones away. Draw from the Outcome Deck for each enemy. Stop on Fumble.",
  },
  "base_artillery_weapon": {
    imageUri: "/assets/base/artillery_weapon.png",
    effect: "Play an Outcome card. At the beginning of your next turn, attack all enemies in the targeted zone with the result.",
  },
  "base_light_armor": {
    imageUri: "/assets/base/light_armor.png",
    effect: "Reduce received Injury by\u00a01 and convert it to a Distress.",
  },
  "base_heavy_armor": {
    imageUri: "/assets/base/heavy_armor.png",
    effect: "Reduce received Injury by\u00a01.",
  },
  "base_shield": {
    imageUri: "/assets/base/shield.png",
    effect: "Convert a Partial Success into a Success when defending.",
  },
  "base_healing": {
    imageUri: "/assets/base/healing.png",
    effect: "Consumable.\\nRemove 1\u00a0Injury or spend an action and remove Effect +1\u00a0Injury.",
  },
  "base_comfort": {
    imageUri: "/assets/base/comfort.png",
    effect: "Consumable.\\nRemove 1\u00a0Distress or spend an action and remove Effect +1\u00a0Distress.",
  },
  "base_surge": {
    imageUri: "/assets/base/surge.png",
    effect: "Consumable.\\nReceive 2x\u00a0Boost.",
  },
  "base_tools": {
    imageUri: "/assets/base/tools.png",
    effect: "+1\u00a0Effect on an action while using a tool to work.",
  },
  "base_light": {
    imageUri: "/assets/base/light.png",
    effect: "Lights up current zone.",
  },
  "base_vehicle": {
    imageUri: "/assets/base/vehicle.png",
    effect: "On Move, you can move +1\u00a0zone further.",
  },
  "base_package": {
    imageUri: "/assets/base/package.png",
    effect: "Contains something important.",
  },
  "base_document": {
    imageUri: "/assets/base/document.png",
    effect: "Holds important information.",
  },
  "base_valuables": {
    imageUri: "/assets/base/valuables.png",
    effect: "Holds valuable items or currency.",
  },
  "base_key": {
    imageUri: "/assets/base/key.png",
    effect: "Opens something important.",
  },
  "base_resources": {
    imageUri: "/assets/base/resources.png",
    effect: "Basic resources for crafting or building.",
  },
} satisfies Record<AssetBaseSlug, AssetBaseCardDetails>;

const assetModifierCardDetailsBySlug = {
  "base_fast": {
    imageUri: "/assets/base/fast.png",
    effect: "May be used twice in a round at -1\u00a0Effect each.",
  },
  "base_empowered": {
    imageUri: "/assets/base/empowered.png",
    effect: "+1\u00a0Effect on Success or better.",
  },
  "base_wide": {
    imageUri: "/assets/base/wide.png",
    effect: "Affects an additional target in the same zone.",
  },
  "base_burning": {
    imageUri: "/assets/base/burning.png",
    effect: "Inflicts 1\u00a0Burning per attack or defend action.",
  },
  "base_freezing": {
    imageUri: "/assets/base/freezing.png",
    effect: "Inflicts 1\u00a0Freezing per attack or defend action.",
  },
  "base_insulating": {
    imageUri: "/assets/base/insulating.png",
    effect: "Protects from 1\u00a0Freezing or 1\u00a0Burning per defend action.",
  },
  "base_irritating": {
    imageUri: "/assets/base/irritating.png",
    effect: "Inflicts 1\u00a0Distress per attack or defend action.",
  },
  "base_penetrating": {
    imageUri: "/assets/base/penetrating.png",
    effect: "Ignores 1\u00a0Injury reduction / atk. or inflicts 1\u00a0Injury / def. action.",
  },
  "base_fragile": {
    imageUri: "/assets/base/fragile.png",
    effect: "Makes an item consumable. Discard after first use.",
  },
  "base_permanent": {
    imageUri: "/assets/base/permanent.png",
    effect: "Makes a consumable permanent.",
  },
  "base_hidden": {
    imageUri: "/assets/base/hidden.png",
    effect: "Not revealed until first use.",
  },
  "base_annoying": {
    imageUri: "/assets/base/annoying.png",
    effect: "On action, suffer 1\u00a0Distress.",
  },
  "base_dangerous": {
    imageUri: "/assets/base/dangerous.png",
    effect: "On action, +1\u00a0Effect and suffer 1\u00a0Injury.",
  },
  "base_pushing": {
    imageUri: "/assets/base/pushing.png",
    effect: "On action, move target to an adjacent zone.",
  },
  "base_pulling": {
    imageUri: "/assets/base/pulling.png",
    effect: "On action, move target to your zone.",
  },
  "base_area": {
    imageUri: "/assets/base/area.png",
    effect: "Affects all targets in the zone.",
  },
} satisfies Record<AssetModifierSlug, AssetModifierCardDetails>;

export const assetBaseCards: AssetBaseCard[] = assetBaseCatalog.map((entry) => ({
  slug: entry.slug,
  title: entry.title,
  imageUri: assetBaseCardDetailsBySlug[entry.slug].imageUri,
  effect: assetBaseCardDetailsBySlug[entry.slug].effect,
  deck: assetDeckByGroup[entry.group],
  group: entry.group,
}));

export const assetModifierCards: AssetModifierCard[] = assetModifierCatalog.map((entry) => ({
  slug: entry.slug,
  title: entry.title,
  imageUri: assetModifierCardDetailsBySlug[entry.slug].imageUri,
  effect: assetModifierCardDetailsBySlug[entry.slug].effect,
  deck: "base mod",
}));

export const assetBaseCardsBySlug = new Map(
  assetBaseCards.map((entry) => [entry.slug, entry] as const),
);

export const assetModifierCardsBySlug = new Map(
  assetModifierCards.map((entry) => [entry.slug, entry] as const),
);

export const assetBaseCardsByGroup: Record<
  AssetBaseGroupLabel,
  AssetBaseCard[]
> = {
  "Asset Base": assetBaseCards.filter((entry) => entry.group === "Asset Base"),
  "Asset Medieval": assetBaseCards.filter((entry) => entry.group === "Asset Medieval"),
};
