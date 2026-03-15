import {
  assetBaseBaseCatalog,
  assetBaseMedievalCatalog,
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

export const assetBaseCards: AssetBaseCard[] = [
  {
    slug: "medieval_gambeson" as AssetBaseSlug,
    title: "Gambeson",
    imageUri: "/assets/medieval/gambeson.png",
    effect: "Light fabric armor. Negates 1\u00a0Injury from slashing damage.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_chainmail" as AssetBaseSlug,
    title: "Chainmail",
    imageUri: "/assets/medieval/chainmail.png",
    effect:
      "Medium metal armor. Negates 1\u00a0Injury from slashing and piercing damage. -1\u00a0Effect when sneaking, running, climbing or swimming.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_plate_armor" as AssetBaseSlug,
    title: "Plate Armor",
    imageUri: "/assets/medieval/plate-armor.png",
    effect:
      "Heavy metal armor. Negates 2\u00a0slashing/piercing Injuries and 1\u00a0bludgeoning Injury. -2\u00a0Effect when sneaking, running, climbing or swimming.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_buckler" as AssetBaseSlug,
    title: "Buckler",
    imageUri: "/assets/medieval/buckler.png",
    effect:
      "Light metal shield. +1\u00a0Effect when defending from melee attack once per round.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_kite-shield" as AssetBaseSlug,
    title: "Kite Shield",
    imageUri: "/assets/medieval/kite-shield.png",
    effect:
      "Large wooden shield. +1\u00a0Effect when defending from melee or ranged attack. -1\u00a0Effect when sneaking, running, climbing or swimming.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_dagger" as AssetBaseSlug,
    title: "Dagger",
    imageUri: "/assets/medieval/dagger.png",
    effect:
      "A light one-handed piercing melee weapon. Can be thrown 1\u00a0zone away.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_hand_axe" as AssetBaseSlug,
    title: "Hand Axe",
    imageUri: "/assets/medieval/hand-axe.png",
    effect:
      "A light one-handed slashing melee weapon. Can be thrown 1\u00a0zone away.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_longsword" as AssetBaseSlug,
    title: "Longsword",
    imageUri: "/assets/medieval/longsword.png",
    effect:
      "A medium one- or two-handed piercing or slashing melee weapon. +1\u00a0Effect when attacking while wielded with both hands.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_zweihandler" as AssetBaseSlug,
    title: "Zweih\u00e4nder",
    imageUri: "/assets/medieval/zweihandler.png",
    effect:
      "A heavy two-handed slashing melee weapon. +1\u00a0Effect when attacking.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_great_axe" as AssetBaseSlug,
    title: "Greataxe",
    imageUri: "/assets/medieval/great-axe.png",
    effect:
      "A heavy two-handed slashing melee weapon. +2\u00a0Effect when attacking multiple\u00a0enemies.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_war_hammer" as AssetBaseSlug,
    title: "War Hammer",
    imageUri: "/assets/medieval/war-hammer.png",
    effect:
      "A heavy two-handed piercing or bludgeoning melee weapon. +1\u00a0Effect against armor.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_mace" as AssetBaseSlug,
    title: "Mace",
    imageUri: "/assets/medieval/mace.png",
    effect:
      "A medium one-handed bludgeoning melee weapon. 1\u00a0Injury negated by armor turns to Distress instead.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_morningstar" as AssetBaseSlug,
    title: "Morningstar",
    imageUri: "/assets/medieval/morningstar.png",
    effect: "A medium one-handed bludgeoning melee weapon. Ignores shields.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_staff" as AssetBaseSlug,
    title: "Staff",
    imageUri: "/assets/medieval/staff.png",
    effect:
      "A light two-handed bludgeoning melee polearm weapon. +1\u00a0Effect when tripping an enemy.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_spear" as AssetBaseSlug,
    title: "Spear",
    imageUri: "/assets/medieval/spear.png",
    effect:
      "A medium two-handed piercing melee polearm weapon. Once per round outside your turn you can attack an enemy entering your zone.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_billhook" as AssetBaseSlug,
    title: "Billhook",
    imageUri: "/assets/medieval/billhook.png",
    effect:
      "A heavy two-handed piercing or slashing polearm weapon. +1\u00a0Effect against cavalry.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_hunting_bow" as AssetBaseSlug,
    title: "Hunting Bow",
    imageUri: "/assets/medieval/hunting-bow.png",
    effect:
      "A light two-handed ranged weapon. Range: 1-2 zones away. -1\u00a0Effect when shooting targets in the same zone.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_crossbow" as AssetBaseSlug,
    title: "Crossbow",
    imageUri: "/assets/medieval/crossbow.png",
    effect:
      "A heavy two-handed ranged weapon. Range: 1-2 zones. Ignores Plate Armor. -1\u00a0Effect when shooting targets in the same zone.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_hand_cannon" as AssetBaseSlug,
    title: "Hand-Cannon",
    imageUri: "/assets/medieval/hand-cannon.png",
    effect:
      "A heavy two-handed ranged weapon. Range: 1-2 zones away. Play 2\u00a0Outcome cards over 2\u00a0turns to load and fire. Add the Effect together. -1\u00a0Effect when shooting targets in the same zone.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_riding_horse" as AssetBaseSlug,
    title: "Riding Horse",
    imageUri: "/assets/medieval/riding-horse.png",
    effect:
      "Can move 2 zones per turn. +1\u00a0Effect when attacking infantry on horseback.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_wagon" as AssetBaseSlug,
    title: "Horse-Drawn Wagon",
    imageUri: "/assets/medieval/wagon.png",
    effect:
      "Can move 2 zones per turn. Capacity: 2 people in the front and up to 6 in the back. +1\u00a0Effect when defending from infantry.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_grappling_hook" as AssetBaseSlug,
    title: "Grappling Hook and Rope",
    imageUri: "/assets/medieval/grappling-hook.png",
    effect: "+1\u00a0Effect while climbing.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_lockpick_set" as AssetBaseSlug,
    title: "Lockpick Set",
    imageUri: "/assets/medieval/lockpick-set.png",
    effect: "Allows picking locks.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_bandages" as AssetBaseSlug,
    title: "Bandages",
    imageUri: "/assets/medieval/bandages.png",
    effect: "Removes 2x\u00a0Injury. Usable during battle. Consumed after use.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_healing_salve" as AssetBaseSlug,
    title: "Healing Salve",
    imageUri: "/assets/medieval/healing-salve.png",
    effect:
      "+1\u00a0Effect when healing to remove Injuries. Not usable during battle.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_herbal_remedy" as AssetBaseSlug,
    title: "Herbal Remedy",
    imageUri: "/assets/medieval/herbal-remedy.png",
    effect:
      "Receive a Boost or negate Poison. Usable during battle. Consumed after use.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_prayer_book" as AssetBaseSlug,
    title: "Prayer Book",
    imageUri: "/assets/medieval/prayer-book.png",
    effect:
      "+1\u00a0Effect when practicing religion to relieve Distress. Not usable during battle.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_mead" as AssetBaseSlug,
    title: "Mead",
    imageUri: "/assets/medieval/mead.png",
    effect:
      "Removes 2x\u00a0Distress. Usable during battle. Consumed after use.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_grenade" as AssetBaseSlug,
    title: "Grenade",
    imageUri: "/assets/medieval/grenade.png",
    effect:
      "Play an Outcome card to throw the granade up to 1\u00a0zone away. Damages everything in the zone. Consumed after use.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_lantern" as AssetBaseSlug,
    title: "Lantern",
    imageUri: "/assets/medieval/lantern.png",
    effect:
      "Provides light in the current zone. Can be used in the rain. Does not count as an open flame.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_torch" as AssetBaseSlug,
    title: "Torch",
    imageUri: "/assets/medieval/torch.png",
    effect:
      "Provides light in the current zone. Cannot be used in the rain. Counts as an open flame.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_cannon" as AssetBaseSlug,
    title: "Cannon",
    imageUri: "/assets/medieval/cannon.png",
    effect:
      "A heavy explosive artillery weapon. Range: 2+\u00a0zones away. -1\u00a0Effect when shooting targets 1\u00a0zone away. Cannot target the same zone. Ignores all shields and armor. Damages everything in the zone.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_rations" as AssetBaseSlug,
    title: "Rations",
    imageUri: "/assets/medieval/rations.png",
    effect: "Food and water to sustain a person for a day.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_pouch" as AssetBaseSlug,
    title: "Pouch",
    imageUri: "/assets/medieval/pouch.png",
    effect:
      "A pouch can store easily accessable small things. Can be attached to a belt.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_chest" as AssetBaseSlug,
    title: "Chest",
    imageUri: "/assets/medieval/chest.png",
    effect:
      "A chest can store heavier things for easier transportation. Can be locked.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_letter" as AssetBaseSlug,
    title: "Letter",
    imageUri: "/assets/medieval/letter.png",
    effect: "A letter is a convenient way of passing information.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_poison" as AssetBaseSlug,
    title: "Poison",
    imageUri: "/assets/medieval/poison.png",
    effect:
      "Causes 1x Injury at the end of every Round until healed. Can be applied to a weapon. Usable during battle. Consumed after use.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_key" as AssetBaseSlug,
    title: "Key",
    imageUri: "/assets/medieval/key.png",
    effect: "What does it open",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_trap" as AssetBaseSlug,
    title: "Trap",
    imageUri: "/assets/medieval/trap.png",
    effect:
      "Causes 2x Injury and Stuck when stepped on. Takes a Success to escape from it.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_tools" as AssetBaseSlug,
    title: "Tools",
    imageUri: "/assets/medieval/tools.png",
    effect: "Tools for crafting.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_digging" as AssetBaseSlug,
    title: "Digging tools",
    imageUri: "/assets/medieval/digging.png",
    effect: "Usable for mining or breaking down obstacles.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_ore" as AssetBaseSlug,
    title: "Ore",
    imageUri: "/assets/medieval/ore.png",
    effect: "Does it contain precious metals, gems or is it just a fancy stone",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_stone" as AssetBaseSlug,
    title: "Stone",
    imageUri: "/assets/medieval/stone.png",
    effect: "An excellent building material.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_wood" as AssetBaseSlug,
    title: "Wood",
    imageUri: "/assets/medieval/wood.png",
    effect: "Good for building, but quite flamable.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_iron" as AssetBaseSlug,
    title: "Iron",
    imageUri: "/assets/medieval/iron.png",
    effect: "Can be used to craft something useful by a blacksmith.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_silver" as AssetBaseSlug,
    title: "Silver",
    imageUri: "/assets/medieval/silver.png",
    effect: "Can be used to craft something pretty by a jewler.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "medieval_gold" as AssetBaseSlug,
    title: "Gold",
    imageUri: "/assets/medieval/gold.png",
    effect: "Can be used to craft something precious by a jewler.",
    deck: "medieval" as "base" | "medieval",
    group: "Asset Medieval" as AssetBaseGroupLabel,
  },
  {
    slug: "base_light_weapon" as AssetBaseSlug,
    title: "Light Weapon",
    imageUri: "/assets/base/light_weapon.png",
    effect:
      "When attacking with Success or better, you may also play a\u00a0Partial Success to attack again.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_heavy_weapon" as AssetBaseSlug,
    title: "Heavy Weapon",
    imageUri: "/assets/base/heavy_weapon.png",
    effect: "+1\u00a0Effect when attacking with Success or better.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_reach_weapon" as AssetBaseSlug,
    title: "Reach Weapon",
    imageUri: "/assets/base/reach_weapon.png",
    effect:
      "Attacks in same or adjacent zone. On\u00a0Success, prevent target\u2019s movement next round.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_spread_weapon" as AssetBaseSlug,
    title: "Spread Weapon",
    imageUri: "/assets/base/spread_weapon.png",
    effect: "Attack all enemies in your zone or an\u00a0adjacent\u00a0one.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_throwable_weapon" as AssetBaseSlug,
    title: "Throwable Weapon",
    imageUri: "/assets/base/throwable_weapon.png",
    effect: "Throw to attack up to 2\u00a0zones away.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_precision_weapon" as AssetBaseSlug,
    title: "Precision Weapon",
    imageUri: "/assets/base/precision_weapon.png",
    effect: "Shoot to attack up to 3\u00a0zones away.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_repeating_weapon" as AssetBaseSlug,
    title: "Repeating Weapon",
    imageUri: "/assets/base/repeating_weapon.png",
    effect:
      "Attack up to 3 targets 1-2 zones away. Draw from the Outcome Deck for each enemy. Stop on Fumble.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_artillery_weapon" as AssetBaseSlug,
    title: "Artillery Weapon",
    imageUri: "/assets/base/artillery_weapon.png",
    effect:
      "Play an Outcome card. At the beginning of your next turn, attack all enemies in the targeted zone with the result.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_light_armor" as AssetBaseSlug,
    title: "Light Armor",
    imageUri: "/assets/base/light_armor.png",
    effect: "Reduce received Injury by\u00a01 and convert it to a Distress.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_heavy_armor" as AssetBaseSlug,
    title: "Heavy Armor",
    imageUri: "/assets/base/heavy_armor.png",
    effect: "Reduce received Injury by\u00a01.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_shield" as AssetBaseSlug,
    title: "Shield",
    imageUri: "/assets/base/shield.png",
    effect: "Convert a Partial Success into a Success when defending.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_healing" as AssetBaseSlug,
    title: "Healing",
    imageUri: "/assets/base/healing.png",
    effect:
      "Consumable.\\nRemove 1\u00a0Injury or spend an action and remove Effect +1\u00a0Injury.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_comfort" as AssetBaseSlug,
    title: "Comfort",
    imageUri: "/assets/base/comfort.png",
    effect:
      "Consumable.\\nRemove 1\u00a0Distress or spend an action and remove Effect +1\u00a0Distress.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_surge" as AssetBaseSlug,
    title: "Surge",
    imageUri: "/assets/base/surge.png",
    effect: "Consumable.\\nReceive 2x\u00a0Boost.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_tools" as AssetBaseSlug,
    title: "Tools",
    imageUri: "/assets/base/tools.png",
    effect: "+1\u00a0Effect on an action while using a tool to work.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_light" as AssetBaseSlug,
    title: "Light",
    imageUri: "/assets/base/light.png",
    effect: "Lights up current zone.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_vehicle" as AssetBaseSlug,
    title: "Vehicle",
    imageUri: "/assets/base/vehicle.png",
    effect: "On Move, you can move +1\u00a0zone further.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_package" as AssetBaseSlug,
    title: "Package",
    imageUri: "/assets/base/package.png",
    effect: "Contains something important.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_document" as AssetBaseSlug,
    title: "Document",
    imageUri: "/assets/base/document.png",
    effect: "Holds important information.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_valuables" as AssetBaseSlug,
    title: "Valuables",
    imageUri: "/assets/base/valuables.png",
    effect: "Holds valuable items or currency.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_key" as AssetBaseSlug,
    title: "Key",
    imageUri: "/assets/base/key.png",
    effect: "Opens something important.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
  {
    slug: "base_resources" as AssetBaseSlug,
    title: "Resources",
    imageUri: "/assets/base/resources.png",
    effect: "Basic resources for crafting or building.",
    deck: "base" as "base" | "medieval",
    group: "Asset Base" as AssetBaseGroupLabel,
  },
];

export const assetModifierCards: AssetModifierCard[] = [
  {
    slug: "base_fast" as AssetModifierSlug,
    title: "Fast",
    imageUri: "/assets/base/fast.png",
    effect: "May be used twice in a round at -1\u00a0Effect each.",
    deck: "base mod",
  },
  {
    slug: "base_empowered" as AssetModifierSlug,
    title: "Empowered",
    imageUri: "/assets/base/empowered.png",
    effect: "+1\u00a0Effect on Success or better.",
    deck: "base mod",
  },
  {
    slug: "base_wide" as AssetModifierSlug,
    title: "Wide",
    imageUri: "/assets/base/wide.png",
    effect: "Affects an additional target in the same zone.",
    deck: "base mod",
  },
  {
    slug: "base_burning" as AssetModifierSlug,
    title: "Burning",
    imageUri: "/assets/base/burning.png",
    effect: "Inflicts 1\u00a0Burning per attack or defend action.",
    deck: "base mod",
  },
  {
    slug: "base_freezing" as AssetModifierSlug,
    title: "Freezing",
    imageUri: "/assets/base/freezing.png",
    effect: "Inflicts 1\u00a0Freezing per attack or defend action.",
    deck: "base mod",
  },
  {
    slug: "base_insulating" as AssetModifierSlug,
    title: "Insulating",
    imageUri: "/assets/base/insulating.png",
    effect:
      "Protects from 1\u00a0Freezing or 1\u00a0Burning per defend action.",
    deck: "base mod",
  },
  {
    slug: "base_irritating" as AssetModifierSlug,
    title: "Irritating",
    imageUri: "/assets/base/irritating.png",
    effect: "Inflicts 1\u00a0Distress per attack or defend action.",
    deck: "base mod",
  },
  {
    slug: "base_penetrating" as AssetModifierSlug,
    title: "Penetrating",
    imageUri: "/assets/base/penetrating.png",
    effect:
      "Ignores 1\u00a0Injury reduction / atk. or inflicts 1\u00a0Injury / def. action.",
    deck: "base mod",
  },
  {
    slug: "base_fragile" as AssetModifierSlug,
    title: "Fragile",
    imageUri: "/assets/base/fragile.png",
    effect: "Makes an item consumable. Discard after first use.",
    deck: "base mod",
  },
  {
    slug: "base_permanent" as AssetModifierSlug,
    title: "Permanent",
    imageUri: "/assets/base/permanent.png",
    effect: "Makes a consumable permanent.",
    deck: "base mod",
  },
  {
    slug: "base_hidden" as AssetModifierSlug,
    title: "Hidden",
    imageUri: "/assets/base/hidden.png",
    effect: "Not revealed until first use.",
    deck: "base mod",
  },
  {
    slug: "base_annoying" as AssetModifierSlug,
    title: "Annoying",
    imageUri: "/assets/base/annoying.png",
    effect: "On action, suffer 1\u00a0Distress.",
    deck: "base mod",
  },
  {
    slug: "base_dangerous" as AssetModifierSlug,
    title: "Dangerous",
    imageUri: "/assets/base/dangerous.png",
    effect: "On action, +1\u00a0Effect and suffer 1\u00a0Injury.",
    deck: "base mod",
  },
  {
    slug: "base_pushing" as AssetModifierSlug,
    title: "Pushing",
    imageUri: "/assets/base/pushing.png",
    effect: "On action, move target to an adjacent zone.",
    deck: "base mod",
  },
  {
    slug: "base_pulling" as AssetModifierSlug,
    title: "Pulling",
    imageUri: "/assets/base/pulling.png",
    effect: "On action, move target to your zone.",
    deck: "base mod",
  },
  {
    slug: "base_area" as AssetModifierSlug,
    title: "Area",
    imageUri: "/assets/base/area.png",
    effect: "Affects all targets in the zone.",
    deck: "base mod",
  },
];

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
  "Asset Base": assetBaseBaseCatalog
    .map((entry) => assetBaseCardsBySlug.get(entry.slug)!)
    .filter(Boolean),
  "Asset Medieval": assetBaseMedievalCatalog
    .map((entry) => assetBaseCardsBySlug.get(entry.slug)!)
    .filter(Boolean),
};
