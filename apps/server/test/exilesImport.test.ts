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

const writeImage = async (path: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, Buffer.from(ONE_PIXEL_PNG_BASE64, "base64"));
};

const writeFixtureFile = async (
  rootDir: string,
  relativePath: string,
  content: string,
): Promise<void> => {
  const absolutePath = join(rootDir, relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, "utf8");
};

const createExilesFixture = async (): Promise<{
  sourceDir: string;
  publicDir: string;
}> => {
  const sourceDir = mkdtempSync(join(tmpdir(), "mighty-decks-exiles-source-"));
  const publicDir = mkdtempSync(join(tmpdir(), "mighty-decks-exiles-public-"));

  await writeFixtureFile(
    sourceDir,
    "c0-intro.mdx",
    `---
title: "Exiles of the Hungry Void"
campaign: Exiles of the Hungry Void
chapter: 0
hook: "The Empire has exiled you to the edge of the Hungry Void."
prompt: "Intro chapter prompt."
---

![](/mighty-decks/encounters/exiles_of_the_hungry_void/exiles_of_the_hungry_void_horizontal.png)

# {title}

## Playable characters

<Columns>
![Machinist](/mighty-decks/encounters/exiles_of_the_hungry_void/characters/machinist_priest.png)
![Veteran](/mighty-decks/encounters/exiles_of_the_hungry_void/characters/augmented_veteran_male.png)
</Columns>

<List>
  <StuntCard {...exilesStuntMap.machine_speaker} />
</List>

<LinkList className="flex-col" links={ getOtherChapterEncounterLinks(import.meta.url) } />
`,
  );

  await writeFixtureFile(
    sourceDir,
    "c0-ship.mdx",
    `---
title: "The Ship"
campaign: Exiles of the Hungry Void
chapter: 0
prompt: "This page describes the player ship"
---

# The Ship

<AreaStage className="not-prose" />

<LinkList className="flex-col" links={ getCampaignChapterEncounters(campaign, chapter) } />
`,
  );

  await writeFixtureFile(
    sourceDir,
    "c0-dumped.mdx",
    `---
title: "Dumped in the Void"
campaign: Exiles of the Hungry Void
chapter: 0
hook: "The Empire has exiled you to the edge of the Hungry Void, dumping you on a derelict corvette."
prompt: "This is the introductory chapter of the campaign."
---

![](/mighty-decks/encounters/exiles_of_the_hungry_void/dumped.png)

# {title}

💡 {prompt}

<CounterCard {...counterMap.defense} title="Protect the Spin Drive" current={6} total={6} reward="You jump away" threat="Ship systems damaged, characters Injured" />

<LinkList className="flex-col" links={ getCampaignChapterEncounters(campaign, chapter + 1) } />
`,
  );

  await writeFixtureFile(
    sourceDir,
    "c1-transport-in-distress.mdx",
    `---
title: "Transport in Distress"
campaign: Exiles of the Hungry Void
chapter: 1
hook: "You jump into a system to find a smugglers' transport being pursued by a pirate corvette."
prompt: "This is an introductory ship-to-ship combat encounter."
---

# {title}

<List>
  <LayeredActorCard {...actorMap["animal_red"]} role={actorRoleMap["minion"]} />
</List>

<List>
  <Paper size="54x86" orientation="landscape" className="not-prose bg-cover rounded-md" style={{ backgroundImage: 'url(/mighty-decks/encounters/exiles_of_the_hungry_void/locations/docking_bay.png)' }} />
</List>

<LinkList className="flex-col" links={ getCampaignChapterEncounters(campaign, chapter + 1) } />
`,
  );

  await writeImage(
    join(
      publicDir,
      "mighty-decks",
      "encounters",
      "exiles_of_the_hungry_void",
      "exiles_of_the_hungry_void_horizontal.png",
    ),
  );
  await writeImage(
    join(
      publicDir,
      "mighty-decks",
      "encounters",
      "exiles_of_the_hungry_void",
      "dumped.png",
    ),
  );
  await writeImage(
    join(
      publicDir,
      "mighty-decks",
      "encounters",
      "exiles_of_the_hungry_void",
      "characters",
      "machinist_priest.png",
    ),
  );
  await writeImage(
    join(
      publicDir,
      "mighty-decks",
      "encounters",
      "exiles_of_the_hungry_void",
      "characters",
      "augmented_veteran_male.png",
    ),
  );
  await writeImage(
    join(
      publicDir,
      "mighty-decks",
      "encounters",
      "exiles_of_the_hungry_void",
      "locations",
      "docking_bay.png",
    ),
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
  };

  assert.equal(translated.index.title, "Exiles of the Hungry Void");
  assert.equal(translated.index.slug, "exiles-of-the-hungry-void");
  assert.equal(translated.index.sessionScope, "mini_campaign");
  assert.equal(translated.index.launchProfile, "dual");
  assert.equal(translated.index.locationFragmentIds.length, 1);
  assert.equal(translated.index.encounterFragmentIds.length, 2);
  assert.equal(translated.index.questFragmentIds.length, 2);
  assert.equal(
    translated.coverImageUrl?.startsWith("/api/adventure-artifacts/"),
    true,
  );

  const settingFragment = translated.fragments.find(
    (fragment) => fragment.fragment.fragmentId === translated.index.settingFragmentId,
  );
  assert.ok(settingFragment);
  assert.match(settingFragment?.content ?? "", /## Playable characters/i);
  assert.doesNotMatch(settingFragment?.content ?? "", /<Columns|<StuntCard|<LinkList/);

  const dumpedEncounter = translated.encounters.find(
    (encounter) => encounter.encounterSlug === "dumped-in-the-void",
  );
  assert.ok(dumpedEncounter);
  assert.equal(
    dumpedEncounter?.summary,
    "The Empire has exiled you to the edge of the Hungry Void, dumping you on a derelict corvette.",
  );
  assert.match(dumpedEncounter?.content ?? "", /## GM Intent/);
  assert.match(dumpedEncounter?.content ?? "", /Protect the Spin Drive/);
  assert.doesNotMatch(dumpedEncounter?.content ?? "", /<CounterCard|<LinkList/);
  assert.match(dumpedEncounter?.content ?? "", /\/api\/adventure-artifacts\//);

  const shipLocation = translated.locations[0];
  assert.equal(shipLocation?.title, "The Ship");
  assert.match(shipLocation?.descriptionMarkdown ?? "", /Stage/i);

  const chapterZeroQuest = translated.quests.find(
    (quest) => quest.questSlug === "chapter-0-exiles-of-the-hungry-void",
  );
  assert.ok(chapterZeroQuest);

  const chapterOneEncounterFragment = translated.fragments.find(
    (fragment) => fragment.fragment.title === "Transport in Distress",
  );
  assert.ok(chapterOneEncounterFragment);
  assert.equal(
    chapterOneEncounterFragment?.fragment.tags.includes("chapter-1"),
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
  };

  assert.equal(imported.index.slug, "exiles-of-the-hungry-void");
  assert.equal(imported.index.sessionScope, "mini_campaign");
  assert.equal(imported.index.launchProfile, "dual");
  assert.equal(imported.index.status, "draft");
  assert.equal(imported.locations.length, 1);
  assert.equal(imported.encounters.length, 2);
  assert.equal(imported.quests.length, 2);
  assert.equal(
    imported.encounters.some(
      (encounter) =>
        encounter.summary ===
        "You jump into a system to find a smugglers' transport being pursued by a pirate corvette.",
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
  assert.match(stdout, /Imported module 'Exiles of the Hungry Void'/);
  assert.match(stdout, /2 encounters, 2 quests/);

  const loaded = await moduleStore.getModuleBySlug(
    "exiles-of-the-hungry-void",
    "token-exiles",
  );
  assert.ok(loaded);
  assert.equal(loaded?.encounters.length, 2);
  assert.equal(loaded?.locations.length, 1);
});
