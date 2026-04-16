import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { AdventureArtifactStore } from "../src/persistence/AdventureArtifactStore";
import { AdventureModuleStore } from "../src/persistence/AdventureModuleStore";
import { runImportAdventureModuleCli } from "../src/adventureModule/cli/runImportAdventureModuleCli";
import { translateExilesAdventureModule } from "../src/adventureModule/import/translateExilesAdventureModule";

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

const modulePublicRootSegments = [
  "mighty-decks",
  "encounters",
  "exiles_of_the_hungry_void",
];

const modulePublicPath = (publicDir: string, ...segments: string[]): string =>
  join(publicDir, ...modulePublicRootSegments, ...segments);

const writeFixtureFile = async (
  rootDir: string,
  relativePath: string,
  content: string,
): Promise<void> => {
  const absolutePath = join(rootDir, relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, "utf8");
};

const writeImage = async (
  rootDir: string,
  relativePath: string,
  salt: string,
): Promise<void> => {
  const absolutePath = join(rootDir, relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  const buffer = Buffer.concat([
    Buffer.from(ONE_PIXEL_PNG_BASE64, "base64"),
    Buffer.from(`-${salt}`, "utf8"),
  ]);
  await writeFile(absolutePath, buffer);
};

const createImageDataUri = (
  contentType: "image/png" | "image/jpeg",
  salt: string,
): string =>
  `data:${contentType};base64,${Buffer.concat([
    Buffer.from(ONE_PIXEL_PNG_BASE64, "base64"),
    Buffer.from(`-${salt}`, "utf8"),
  ]).toString("base64")}`;

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createExilesFixture = async (): Promise<{
  sourceDir: string;
  publicDir: string;
}> => {
  const sourceDir = mkdtempSync(join(tmpdir(), "mighty-decks-exiles-source-"));
  const publicDir = mkdtempSync(join(tmpdir(), "mighty-decks-exiles-public-"));

  await Promise.all(
    [
      ["exiles_of_the_hungry_void_horizontal.png", "intro-horizontal"],
      ["crew.png", "crew"],
      ["dumped.png", "dumped"],
      ["scenes/a_transport_ship_in_distress.png", "transport"],
      ["scenes/mining_colony_has_a_pest_problem.png", "mining"],
      ["scenes/abandoned_research_station.png", "research"],
      ["scenes/dead_in_space.png", "dead-in-space"],
      ["scenes/graveyard_bazaar.png", "bazaar"],
      ["scenes/graveyard_bazaar_concert.png", "bazaar-concert"],
      ["scenes/trip_into_the_unknown.png", "nebula"],
      ["scenes/siege_of_rock_bottom.png", "siege"],
      ["scenes/cursed_prison_transport.png", "prison"],
      ["scenes/missile_stockpile_raid.png", "missiles"],
      ["characters/machinist_priest.png", "machinist-priest"],
      ["characters/crimson_witch.png", "crimson-witch"],
      ["characters/crimson_warlock.png", "crimson-warlock"],
      ["characters/augmented_veteran_male.png", "augmented-veteran-male"],
      ["characters/augmented_veteran_female.png", "augmented-veteran-female"],
      ["characters/noble_empath_male.png", "noble-empath-male"],
      ["characters/noble_empath_female.png", "noble-empath-female"],
      ["characters/void_seer_male.png", "void-seer-male"],
      ["characters/void_seer_female.png", "void-seer-female"],
      ["characters/robot_surgeon_male.png", "robot-surgeon-male"],
      ["characters/robot_surgeon_female.png", "robot-surgeon-female"],
      ["characters/critter_raider.png", "critter-raider-1"],
      ["characters/critter_raider_2.png", "critter-raider-2"],
      ["characters/tunnel_critter.png", "tunnel-critter"],
      ["characters/tunnel_critter_brood_mother.png", "tunnel-brood-mother"],
      ["characters/void_horror.png", "void-horror-character"],
      ["void_horror.png", "void-horror-inline"],
      ["exiles-of-the-hungry-void-title.jpg", "title-art"],
      ["assets/alien_container.png", "alien-container"],
      ["locations/docking_bay.png", "docking-bay"],
      ["locations/cargo_hold.png", "cargo-hold"],
      ["locations/crew_quarters.png", "crew-quarters"],
      ["locations/spin_drive.png", "spin-drive"],
      ["locations/engine_room.png", "engine-room"],
      ["locations/reactor.png", "reactor"],
      ["locations/shield_generator.png", "shield-generator"],
      ["locations/weapons_station.png", "weapons-station"],
      ["locations/cockpit.png", "cockpit"],
      ["locations/missile_bay.png", "missile-bay"],
      ["locations/life_support.png", "life-support"],
      ["locations/sensor_array.png", "sensor-array"],
      ["stunts/machine_speaker.png", "machine-speaker"],
      ["stunts/servo_arms.png", "servo-arms"],
      ["stunts/specialized_augments.png", "specialized-augments"],
    ].map(([relativePath, salt]) =>
      writeImage(publicDir, join(...modulePublicRootSegments, relativePath), salt),
    ),
  );

  const pageFixtures = [
    {
      relativePath: "c0-intro.mdx",
      content: `---
title: "Exiles of the Hungry Void"
campaign: Exiles of the Hungry Void
chapter: 0
hook: "The Empire has exiled you to the edge of the Hungry Void, dumping you on a derelict corvette with a warning never to return to Empire space."
prompt: "This is the introductory chapter of the campaign. The players are introduced to their characters and the ship they have been exiled on. They need to work together to get the ship operational and escape the Void Horror that appears as they are about to leave."
---

![](/mighty-decks/encounters/exiles_of_the_hungry_void/exiles_of_the_hungry_void_horizontal.png)

# {title}

### Machinist-Priest Heretic
<List><StuntCard {...exilesStuntMap.machine_speaker} /><StuntCard {...exilesStuntMap.servo_arms} /></List>

### Crimson Witch/Warlock
<List><StuntCard {...exilesStuntMap.blood_sense} /><StuntCard {...exilesStuntMap.hemomancy} /></List>

### Augmented Veteran
<List><StuntCard {...exilesStuntMap.weapon_proficiency} /><StuntCard {...exilesStuntMap.augmented_body} /></List>

### Noble Empath
<List><StuntCard {...exilesStuntMap.surface_thoughts} /><StuntCard {...exilesStuntMap.empathic_touch} /></List>

### Void-seer
<List><StuntCard {...exilesStuntMap.certified_navigator} /><StuntCard {...exilesStuntMap.space_folding} /></List>

### Synthetic Medic
<List><StuntCard {...exilesStuntMap.knowledge_base} /><StuntCard {...exilesStuntMap.expert_doctor} /></List>

The Void Horror appears as they are about to leave.
`,
    },
    {
      relativePath: "c0-ship.mdx",
      content: `---
title: "The Ship"
campaign: Exiles of the Hungry Void
chapter: 0
prompt: "This page describes the player ship"
---

# The Ship

<AreaStage className="not-prose" />
`,
    },
    {
      relativePath: "c0-dumped.mdx",
      content: `---
title: "Dumped in the Void"
campaign: Exiles of the Hungry Void
chapter: 0
hook: "The Empire has exiled you to the edge of the Hungry Void."
prompt: "The crew is dumped on a space-ship in disrepair."
---

![""](/mighty-decks/encounters/exiles_of_the_hungry_void/dumped.png)

# {title}

## Storyteller info (do not read out loud)

- The crew is being dumped on a ship in disrepair.
- Foreshadow the main antagonist the Shadow Horror.

<CounterCard {...counterMap.defense} title="Protect the Spin Drive" current={6} total={6} reward="You jump away" threat="Ship systems damaged, characters Injured" />
`,
    },
    {
      relativePath: "c1-transport-in-distress.mdx",
      content: `---
title: "Transport in Distress"
campaign: Exiles of the Hungry Void
chapter: 1
hook: "You jump into a system to find a smugglers' transport being pursued by a pirate corvette through an asteroid field."
prompt: "This is an introductory ship-to-ship combat encounter."
---

# {title}

-   Contacting the pirates reveals they are a couple of beat-up humanoid bugs called the Xithrax.
-   The crew can salvage a Disruptor Mk I.

### Xithrax Raiders

-   They are dumb and bloodthirsty.

<List>
    <LayeredActorCard {...actorMap["animal_red"]} role={actorRoleMap["minion"]} />
</List>

<List>
    <Paper size="54x86" orientation="landscape" className="not-prose bg-cover rounded-md" style={{ backgroundImage: 'url(/public/mighty-decks/encounters/exiles_of_the_hungry_void/locations/docking_bay.png)' }} />
</List>
`,
    },
    {
      relativePath: "c1-abandoned-research-station.mdx",
      content: `---
title: "Abandoned Research Station"
campaign: Exiles of the Hungry Void
chapter: 1
hook: "You've picked up a faint, automated signal from a derelict Imperial research station, adrift and silent in the Void."
prompt: "This is a quick exploration encounter. The crew boards the station and splits up to investigate different sections."
---

![](/mighty-decks/encounters/exiles_of_the_hungry_void/scenes/abandoned_research_station.png)

# Abandoned Research Station

- The station seems abandoned.
- Search the Canteen, Armory, Garden, Lab, or Crew Quarters.

<LinkList className="flex-col" links={ getOtherChapterEncounterLinks(import.meta.url) } />
<LinkList className="flex-col" links={ getCampaignChapterEncounters(campaign, chapter + 1) } />
`,
    },
    {
      relativePath: "c1-dead-in-space.mdx",
      content: `---
title: "Dead in space"
campaign: Exiles of the Hungry Void
chapter: 1
hook: "A cryptic distress call from a Hadean cultist ship offers a mysterious gift in exchange for aid."
prompt: "The players must choose how to respond to the distress call."
---

![](/mighty-decks/encounters/exiles_of_the_hungry_void/scenes/dead_in_space.png)

# Dead in space

-   1 Effect: you identify the crew as Hadeans.
-   Upon opening, you find a book titled Ritual of raising dead.
`,
    },
    {
      relativePath: "c1-mining-colony-has-a-pest-problem.mdx",
      content: `---
title: "Mining Colony Has a Pest Problem"
campaign: Exiles of the Hungry Void
chapter: 1
hook: "An automated mining outpost offers a reward for clearing out hostile wildlife."
prompt: "The crew must first track the creatures to their nest, then fight a wave of smaller critters, followed by a larger brood mother boss."
---

![](/mighty-decks/encounters/exiles_of_the_hungry_void/scenes/mining_colony_has_a_pest_problem.png)

# {title}

### Tunnel critter battle

-   There are twice as many Tunnel critters as players.
-   At the start of the 3rd round the Tunnel critter brood mother appears.

<List>
    <LayeredActorCard {...actorMap.animal_red} role={actorRoleMap.pawn} />
    <LayeredActorCard {...actorMap.claw_green} role={actorRoleMap.tank} modifier={actorModifierMap.reaching} />
</List>
`,
    },
    {
      relativePath: "c2-graveyard-bazaar.mdx",
      content: `---
title: "Graveyard Bazaar"
campaign: Exiles of the Hungry Void
chapter: 2
hook: "You dock at the Graveyard Bazaar, a sprawling, chaotic marketplace."
prompt: "This is a social/downtime encounter."
---

![](/mighty-decks/encounters/exiles_of_the_hungry_void/scenes/graveyard_bazaar.png)

# Graveyard Bazaar

![](/mighty-decks/encounters/exiles_of_the_hungry_void/assets/alien_container.png)

-   The Smugglers
-   The Void Seers
-   The Death Cultists
-   The Machinist Church

_If you check on the Void Seers, they are gone._
`,
    },
    {
      relativePath: "c3-trip-into-the-unknown.mdx",
      content: `---
title: "Trip into the Unknown"
campaign: Exiles of the Hungry Void
chapter: 3
hook: "Unsettling gravity waves from a nearby nebula match the void entity's signature."
prompt: "This encounter is a push-your-luck scenario."
---

![](/mighty-decks/encounters/exiles_of_the_hungry_void/scenes/trip_into_the_unknown.png)

# Trip into the Unknown

_You learn that the science vessel belonged to the Void Seers._
`,
    },
    {
      relativePath: "c3-siege-of-rock-bottom.mdx",
      content: `---
title: "Siege of Rock Bottom"
campaign: Exiles of the Hungry Void
chapter: 3
hook: "You detect an explosion of comm's traffic from a nearby smuggler station."
prompt: "This encounter gives players an opportunity to choose a side in the conflict."
---

![](/mighty-decks/encounters/exiles_of_the_hungry_void/scenes/siege_of_rock_bottom.png)

# Siege of Rock Bottom

The Machinists and Smugglers both demand your help.

### 1. Side with the Machinist Church

### 2. Side with the Smugglers

### 3. Retrieve the Relic

-   The relic is an ancient data-reading device labeled Biskma.
`,
    },
    {
      relativePath: "c3-cursed-prison-transport.mdx",
      content: `---
title: "Cursed Prison Transport"
campaign: Exiles of the Hungry Void
chapter: 3
hook: "An Imperial prison transport ship issued a distress call."
prompt: "This encounter has players decide if they want to catch some escape pods."
---

![](/mighty-decks/encounters/exiles_of_the_hungry_void/scenes/cursed_prison_transport.png)

# Cursed Prison Transport

<CounterCard {...counterMap.agreement} title="Escape Pods" />

-   A strange Artifact: a pulsating, obsidian idol in the shape of an unborn baby.
-   Upon opening, you find a book titled Ritual of raising dead.
`,
    },
    {
      relativePath: "c3-missile-stockpile.mdx",
      content: `---
title: "Missile Stockpile Raid"
campaign: Exiles of the Hungry Void
chapter: 3
hook: "You detected a concentration of materials normally used for missile production at a nearby asteroid field."
prompt: "This encounter is a quick one-round threat into resolution encounter."
---

![](/mighty-decks/encounters/exiles_of_the_hungry_void/scenes/missile_stockpile_raid.png)

# Missile Stockpile Raid

- A missile battery launches a volley of rockets immediately when the ship jumps in.

<LayeredActorCard {...actorMap.artillery_fire} role={actorRoleMap.ranger} modifier={actorModifierMap.tough} />
<LinkList className="flex-col" links={ getOtherChapterEncounterLinks(import.meta.url) } />
<LinkList className="flex-col" links={ getCampaignChapterEncounters(campaign, chapter + 1) } />
`,
    },
  ] as const;

  await Promise.all(
    pageFixtures.map((page) => writeFixtureFile(sourceDir, page.relativePath, page.content)),
  );

  return { sourceDir, publicDir };
};

test("translates legacy Exiles MDX into a normalized adventure module", async () => {
  const { sourceDir, publicDir } = await createExilesFixture();
  const artifactRoot = mkdtempSync(join(tmpdir(), "mighty-decks-exiles-artifacts-"));
  const artifactStore = new AdventureArtifactStore({
    rootDir: artifactRoot,
    fileRouteBasePath: "/api/adventure-artifacts",
  });
  await artifactStore.initialize();

  const translated = (await translateExilesAdventureModule({
    sourceDir,
    publicDir,
    artifactStore,
    nowIso: "2026-04-15T12:00:00.000Z",
  })) as unknown as {
    coverImageUrl?: string;
    index: {
      title: string;
      slug: string;
      sessionScope: string;
      launchProfile: string;
      locationFragmentIds: string[];
      encounterFragmentIds: string[];
      questFragmentIds: string[];
      settingFragmentId: string;
      storytellerSummaryMarkdown: string;
      playerSummaryMarkdown: string;
      actorFragmentIds: string[];
      actorCards: Array<{ fragmentId: string; baseLayerSlug: string; tacticalRoleSlug: string }>;
      assetFragmentIds: string[];
      assetCards: Array<
        | {
            fragmentId: string;
            kind: "custom";
            modifier: string;
            noun: string;
            nounDescription: string;
            adjectiveDescription: string;
            iconUrl: string;
            overlayUrl: string;
          }
        | {
            fragmentId: string;
            kind: "legacy_layered";
            baseAssetSlug: string;
            modifierSlug?: string;
          }
      >;
      componentOpportunities: Array<{
        opportunityId: string;
        componentType: string;
        strength: string;
        timing: string;
        fragmentId?: string;
        fragmentKind?: string;
        placementLabel: string;
        trigger: string;
        rationale: string;
      }>;
      questGraphs: Array<{
        questId: string;
        nodes: Array<{
          nodeId: string;
          title: string;
          actorFragmentIds: string[];
          assetFragmentIds: string[];
        }>;
      }>;
    };
    fragments: Array<{
      fragment: {
        fragmentId: string;
        title: string;
        tags: string[];
      };
      content: string;
    }>;
    encounters: Array<{
      encounterSlug: string;
      title: string;
      summary?: string;
      content: string;
    }>;
    locations: Array<{
      title: string;
      introductionMarkdown: string;
      descriptionMarkdown: string;
    }>;
    quests: Array<{
      questSlug: string;
      title: string;
    }>;
    actors: Array<{
      fragmentId: string;
      actorSlug: string;
      title: string;
      isPlayerCharacter: boolean;
      content: string;
      baseLayerSlug: string;
      tacticalRoleSlug: string;
    }>;
    assets: Array<
      | {
          fragmentId: string;
          assetSlug: string;
          title: string;
          kind: "custom";
          iconUrl: string;
          content: string;
        }
      | {
          fragmentId: string;
          assetSlug: string;
          title: string;
          kind: "legacy_layered";
          baseAssetSlug: string;
          content: string;
        }
    >;
  };

  const titleArtRecord = await artifactStore.persistDataImageUri(
    createImageDataUri("image/jpeg", "title-art"),
    { hint: "title-art" },
  );
  const voidHorrorRecord = await artifactStore.persistDataImageUri(
    createImageDataUri("image/png", "void-horror-inline"),
    { hint: "void-horror" },
  );
  const dockingBayRecord = await artifactStore.persistDataImageUri(
    createImageDataUri("image/png", "docking-bay"),
    { hint: "docking-bay" },
  );
  const alienContainerRecord = await artifactStore.persistDataImageUri(
    createImageDataUri("image/png", "alien-container"),
    { hint: "alien-container" },
  );

  assert.equal(translated.index.title, "Exiles of the Hungry Void");
  assert.equal(translated.index.slug, "exiles-of-the-hungry-void");
  assert.equal(translated.index.sessionScope, "mini_campaign");
  assert.equal(translated.index.launchProfile, "dual");
  assert.equal(translated.index.locationFragmentIds.length, 1);
  assert.equal(translated.index.encounterFragmentIds.length, 10);
  assert.equal(translated.index.questFragmentIds.length, 4);
  assert.equal(translated.index.actorFragmentIds.length, 15);
  assert.equal(translated.index.assetFragmentIds.length, 5);
  assert.equal(translated.index.actorCards.length, 15);
  assert.equal(translated.index.assetCards.length, 5);
  assert.equal(translated.coverImageUrl, titleArtRecord.fileUrl);
  assert.match(translated.index.storytellerSummaryMarkdown, /void-horror/i);
  assert.match(
    translated.index.storytellerSummaryMarkdown,
    /<GameCard type="ActorCard" slug="void-horror" \/>/,
  );
  assert.match(
    translated.index.storytellerSummaryMarkdown,
    new RegExp(escapeRegExp(voidHorrorRecord.fileUrl)),
  );
  assert.match(
    translated.index.playerSummaryMarkdown,
    /<GameCard type="ActorCard" slug="machinist-priest-heretic" \/>/,
  );
  assert.match(
    translated.index.playerSummaryMarkdown,
    new RegExp(escapeRegExp(titleArtRecord.fileUrl)),
  );
  assert.equal(
    translated.index.componentOpportunities.filter(
      (opportunity) => opportunity.componentType === "layered_actor",
    ).length,
    15,
  );
  assert.equal(
    translated.index.componentOpportunities.filter(
      (opportunity) => opportunity.componentType === "layered_asset",
    ).length,
    5,
  );

  const settingFragment = translated.fragments.find(
    (fragment) => fragment.fragment.fragmentId === translated.index.settingFragmentId,
  );
  assert.ok(settingFragment);
  assert.match(
    settingFragment?.content ?? "",
    /<GameCard type="ActorCard" slug="machinist-priest-heretic" \/>/,
  );
  assert.match(
    settingFragment?.content ?? "",
    /<GameCard type="ActorCard" slug="crimson-witch-warlock" \/>/,
  );
  assert.match(
    settingFragment?.content ?? "",
    /<GameCard type="ActorCard" slug="void-horror" \/>/,
  );
  assert.doesNotMatch(settingFragment?.content ?? "", /<Columns|<StuntCard|<LinkList/);

  const dumpedEncounter = translated.encounters.find(
    (encounter) => encounter.encounterSlug === "dumped-in-the-void",
  );
  assert.ok(dumpedEncounter);
  assert.match(
    dumpedEncounter?.content ?? "",
    /<GameCard type="ActorCard" slug="void-horror" \/>/,
  );
  assert.doesNotMatch(dumpedEncounter?.content ?? "", /Shadow Horror/i);
  assert.doesNotMatch(dumpedEncounter?.content ?? "", /<CounterCard|<LinkList/);

  const transportEncounter = translated.encounters.find(
    (encounter) => encounter.encounterSlug === "transport-in-distress",
  );
  assert.ok(transportEncounter);
  assert.match(
    transportEncounter?.content ?? "",
    /<GameCard type="ActorCard" slug="xithrax-raiders" \/>/,
  );
  assert.match(
    transportEncounter?.content ?? "",
    /<GameCard type="AssetCard" slug="disruptor-mk-i" \/>/,
  );
  assert.match(
    transportEncounter?.content ?? "",
    new RegExp(escapeRegExp(dockingBayRecord.fileUrl)),
  );

  const abandonedEncounter = translated.encounters.find(
    (encounter) => encounter.encounterSlug === "abandoned-research-station",
  );
  assert.ok(abandonedEncounter);

  const missileEncounter = translated.encounters.find(
    (encounter) => encounter.encounterSlug === "missile-stockpile-raid",
  );
  assert.ok(missileEncounter);
  assert.match(missileEncounter?.content ?? "", /Artillery Fire/i);

  const miningEncounter = translated.encounters.find(
    (encounter) => encounter.encounterSlug === "mining-colony-has-a-pest-problem",
  );
  assert.ok(miningEncounter);
  assert.match(
    miningEncounter?.content ?? "",
    /<GameCard type="ActorCard" slug="tunnel-critter" \/>/,
  );
  assert.match(
    miningEncounter?.content ?? "",
    /<GameCard type="ActorCard" slug="tunnel-critter-brood-mother" \/>/,
  );

  const deadInSpaceEncounter = translated.encounters.find(
    (encounter) => encounter.encounterSlug === "dead-in-space",
  );
  assert.ok(deadInSpaceEncounter);
  assert.match(
    deadInSpaceEncounter?.content ?? "",
    /<GameCard type="ActorCard" slug="hadeans" \/>/,
  );
  assert.match(
    deadInSpaceEncounter?.content ?? "",
    /<GameCard type="AssetCard" slug="ritual-of-raising-dead" \/>/,
  );

  const graveyardBazaarEncounter = translated.encounters.find(
    (encounter) => encounter.encounterSlug === "graveyard-bazaar",
  );
  assert.ok(graveyardBazaarEncounter);
  assert.match(
    graveyardBazaarEncounter?.content ?? "",
    /<GameCard type="ActorCard" slug="smugglers" \/>/,
  );
  assert.match(
    graveyardBazaarEncounter?.content ?? "",
    /<GameCard type="ActorCard" slug="void-seers" \/>/,
  );
  assert.match(
    graveyardBazaarEncounter?.content ?? "",
    /<GameCard type="ActorCard" slug="death-cultists" \/>/,
  );
  assert.match(
    graveyardBazaarEncounter?.content ?? "",
    /<GameCard type="ActorCard" slug="machinist-church" \/>/,
  );
  assert.match(
    graveyardBazaarEncounter?.content ?? "",
    new RegExp(escapeRegExp(alienContainerRecord.fileUrl)),
  );

  const siegeEncounter = translated.encounters.find(
    (encounter) => encounter.encounterSlug === "siege-of-rock-bottom",
  );
  assert.ok(siegeEncounter);
  assert.match(
    siegeEncounter?.content ?? "",
    /<GameCard type="ActorCard" slug="machinist-church" \/>/,
  );
  assert.match(
    siegeEncounter?.content ?? "",
    /<GameCard type="ActorCard" slug="smugglers" \/>/,
  );
  assert.match(siegeEncounter?.content ?? "", /<GameCard type="AssetCard" slug="biskma" \/>/);

  const cursedTransportEncounter = translated.encounters.find(
    (encounter) => encounter.encounterSlug === "cursed-prison-transport",
  );
  assert.ok(cursedTransportEncounter);
  assert.match(
    cursedTransportEncounter?.content ?? "",
    /<GameCard type="AssetCard" slug="obsidian-idol" \/>/,
  );
  assert.match(
    cursedTransportEncounter?.content ?? "",
    /<GameCard type="AssetCard" slug="ritual-of-raising-dead" \/>/,
  );

  const actorFragment = translated.fragments.find(
    (fragment) => fragment.fragment.title === "Machinist-Priest Heretic",
  );
  assert.ok(actorFragment);
  assert.match(actorFragment?.content ?? "", /Machine Speaker/);

  const assetFragment = translated.fragments.find(
    (fragment) => fragment.fragment.title === "Alien Container",
  );
  assert.ok(assetFragment);
  assert.match(assetFragment?.content ?? "", new RegExp(escapeRegExp(alienContainerRecord.fileUrl)));

  const componentMapFragment = translated.fragments.find(
    (fragment) => fragment.fragment.title === "Component Map",
  );
  assert.ok(componentMapFragment);
  assert.match(
    componentMapFragment?.content ?? "",
    /<GameCard type="ActorCard" slug="machinist-priest-heretic" \/>/,
  );
  assert.match(
    componentMapFragment?.content ?? "",
    /<GameCard type="AssetCard" slug="alien-container" \/>/,
  );
  assert.match(
    componentMapFragment?.content ?? "",
    /<GameCard type="AssetCard" slug="obsidian-idol" \/>/,
  );

  const firstActorCard = translated.index.actorCards.find(
    (actorCard) => actorCard.fragmentId === translated.index.actorFragmentIds[0],
  );
  assert.ok(firstActorCard);
  assert.equal(firstActorCard?.baseLayerSlug, "cog");
  assert.equal(firstActorCard?.tacticalRoleSlug, "champion");

  const alienContainerAsset = translated.assets.find(
    (asset) => asset.assetSlug === "alien-container",
  );
  assert.ok(alienContainerAsset);
  assert.equal(alienContainerAsset?.kind, "custom");
  assert.equal(alienContainerAsset?.iconUrl, alienContainerRecord.fileUrl);

  const xithraxActor = translated.actors.find(
    (actor) => actor.actorSlug === "xithrax-raiders",
  );
  assert.ok(xithraxActor);
  const transportNode = translated.index.questGraphs
    .flatMap((graph) => graph.nodes)
    .find((node) => node.title === "Transport in Distress");
  assert.ok(transportNode);
  assert.ok(transportNode?.actorFragmentIds.includes(xithraxActor.fragmentId));

  const graveyardNode = translated.index.questGraphs
    .flatMap((graph) => graph.nodes)
    .find((node) => node.title === "Graveyard Bazaar");
  assert.ok(graveyardNode);
  assert.ok(graveyardNode?.assetFragmentIds.includes(alienContainerAsset.fragmentId));

  assert.equal(
    translated.fragments.every((fragment) =>
      !/<LayeredActorCard|<LayeredAssetCard|<LinkList/.test(fragment.content),
    ),
    true,
  );
});

test("imports translated Exiles content through AdventureModuleStore.importModule", async () => {
  const { sourceDir, publicDir } = await createExilesFixture();
  const artifactRoot = mkdtempSync(join(tmpdir(), "mighty-decks-exiles-artifacts-"));
  const moduleRoot = mkdtempSync(join(tmpdir(), "mighty-decks-exiles-modules-"));
  const artifactStore = new AdventureArtifactStore({
    rootDir: artifactRoot,
    fileRouteBasePath: "/api/adventure-artifacts",
  });
  const moduleStore = new AdventureModuleStore({
    rootDir: moduleRoot,
  });
  await artifactStore.initialize();
  await moduleStore.initialize();

  const translated = await translateExilesAdventureModule({
    sourceDir,
    publicDir,
    artifactStore,
    nowIso: "2026-04-15T12:00:00.000Z",
  });
  const imported = (await moduleStore.importModule({
    source: translated,
    creatorToken: "token-exiles",
    title: "Exiles of the Hungry Void",
    slug: "exiles-of-the-hungry-void",
    status: "draft",
  })) as unknown as {
    index: {
      slug: string;
      sessionScope: string;
      launchProfile: string;
      status: string;
      actorCards: Array<{ fragmentId: string }>;
      assetCards: Array<{ fragmentId: string }>;
    };
    encounters: Array<{
      encounterSlug: string;
      summary?: string;
      content: string;
    }>;
    locations: Array<{
      title: string;
    }>;
    quests: Array<{
      questSlug: string;
    }>;
    actors: Array<{ actorSlug: string }>;
    assets: Array<{ assetSlug: string }>;
  };

  assert.equal(imported.index.slug, "exiles-of-the-hungry-void");
  assert.equal(imported.index.sessionScope, "mini_campaign");
  assert.equal(imported.index.launchProfile, "dual");
  assert.equal(imported.index.status, "draft");
  assert.equal(imported.locations.length, 1);
  assert.equal(imported.encounters.length, 10);
  assert.equal(imported.quests.length, 4);
  assert.equal(imported.actors.length, 15);
  assert.equal(imported.assets.length, 5);
  assert.equal(
    imported.encounters.some(
      (encounter) =>
        encounter.summary ===
        "You jump into a system to find a smugglers' transport being pursued by a pirate corvette through an asteroid field.",
    ),
    true,
  );
  assert.equal(
    imported.encounters.every(
      (encounter) => !/<CounterCard|<LayeredActorCard|<LinkList/.test(encounter.content),
    ),
    true,
  );
});

test("import CLI imports Exiles content into the adventure module store", async () => {
  const { sourceDir, publicDir } = await createExilesFixture();
  const artifactRoot = mkdtempSync(join(tmpdir(), "mighty-decks-exiles-artifacts-"));
  const moduleRoot = mkdtempSync(join(tmpdir(), "mighty-decks-exiles-modules-"));
  const artifactStore = new AdventureArtifactStore({
    rootDir: artifactRoot,
    fileRouteBasePath: "/api/adventure-artifacts",
  });
  const moduleStore = new AdventureModuleStore({
    rootDir: moduleRoot,
  });
  await artifactStore.initialize();
  await moduleStore.initialize();

  let stdout = "";
  let stderr = "";
  const exitCode = await runImportAdventureModuleCli(
    [
      "--source-dir",
      sourceDir,
      "--public-dir",
      publicDir,
      "--creator-token",
      "token-exiles",
    ],
    {
      moduleStore,
      artifactStore,
      moduleRootDir: moduleRoot,
      stdout: {
        write: (chunk: string) => {
          stdout += chunk;
          return true;
        },
      },
      stderr: {
        write: (chunk: string) => {
          stderr += chunk;
          return true;
        },
      },
    },
  );

  assert.equal(exitCode, 0);
  assert.equal(stderr, "");
  const parsed = JSON.parse(stdout) as {
    ok: boolean;
    result: {
      counts: {
        locations: number;
        encounters: number;
        quests: number;
      };
      module: {
        index: {
          slug: string;
          actorCards: Array<{ fragmentId: string }>;
          assetCards: Array<{ fragmentId: string }>;
        };
      };
    };
  };
  assert.equal(parsed.ok, true);
  assert.equal(parsed.result.module.index.slug, "exiles-of-the-hungry-void");
  assert.equal(parsed.result.counts.locations, 1);
  assert.equal(parsed.result.counts.encounters, 10);
  assert.equal(parsed.result.counts.quests, 4);
  assert.equal(parsed.result.module.index.actorCards.length, 15);
  assert.equal(parsed.result.module.index.assetCards.length, 5);

  const loaded = await moduleStore.getModuleBySlug(
    "exiles-of-the-hungry-void",
    "token-exiles",
  );
  assert.ok(loaded);
  assert.equal(loaded?.encounters.length, 10);
  assert.equal(loaded?.locations.length, 1);
  assert.equal(loaded?.actors.length, 15);
  assert.equal(loaded?.assets.length, 5);
});
