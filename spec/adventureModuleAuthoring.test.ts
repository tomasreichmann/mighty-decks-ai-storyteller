import test from "node:test";
import assert from "node:assert/strict";

import {
  adventureModuleDetailSchema,
  adventureModuleUpdateAssetRequestSchema,
} from "./adventureModuleAuthoring";

const createValidModuleDetailCandidate = () => ({
  index: {
    moduleId: "am-location-detail",
    slug: "location-detail",
    title: "Location Detail",
    summary: "Summary",
    premise: "Premise",
    intent: "Intent",
    status: "draft",
    version: 1,
    sessionScope: "one_session_arc",
    launchProfile: "dual",
    authoringControlDefault: "curate_select",
    dos: [],
    donts: [],
    tags: [],
    storytellerSummaryFragmentId: "frag-storyteller-summary",
    storytellerSummaryMarkdown: "# Storyteller Summary",
    playerSummaryFragmentId: "frag-player-summary",
    playerSummaryMarkdown: "# Player Summary",
    paletteFragmentId: "frag-palette",
    settingFragmentId: "frag-setting",
    componentMapFragmentId: "frag-component-map",
    locationFragmentIds: ["frag-location-main"],
    locationDetails: [
      {
        fragmentId: "frag-location-main",
        titleImageUrl: "https://example.com/location-image.png",
        introductionMarkdown: "Read this directly to players.",
        descriptionMarkdown: "Actors gather here and hazards crowd the exits.",
        mapImageUrl: "https://example.com/location-map.png",
        mapPins: [
          {
            pinId: "pin-location",
            x: 18,
            y: 46,
            targetFragmentId: "frag-location-main",
          },
          {
            pinId: "pin-actor",
            x: 61,
            y: 29,
            targetFragmentId: "frag-actor-main",
          },
        ],
      },
    ],
    actorFragmentIds: ["frag-actor-main"],
    actorCards: [
      {
        fragmentId: "frag-actor-main",
        baseLayerSlug: "civilian",
        tacticalRoleSlug: "pawn",
      },
    ],
    counters: [],
    assetFragmentIds: ["frag-asset-main"],
    assetCards: [
      {
        fragmentId: "frag-asset-main",
        kind: "custom",
        modifier: "Smoldering",
        noun: "Lantern Shard",
        nounDescription: "Glows brighter around hidden doors.",
        adjectiveDescription: "Whispers when ward-lines start to fail.",
        iconUrl: "https://example.com/assets/lantern-shard.png",
        overlayUrl: "https://example.com/assets/lantern-shard-overlay.png",
      },
    ],
    itemFragmentIds: [],
    encounterFragmentIds: ["frag-encounter-main"],
    encounterDetails: [
      {
        fragmentId: "frag-encounter-main",
        prerequisites: "Level 3+ or already tracking the flooded bell quest.",
        titleImageUrl: "https://example.com/encounter-title.png",
      },
    ],
    questFragmentIds: ["frag-quest-main"],
    imagePromptFragmentIds: [],
    fragments: [
      {
        fragmentId: "frag-index",
        kind: "index",
        title: "Index",
        path: "index.mdx",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-storyteller-summary",
        kind: "storyteller_summary",
        title: "Storyteller Summary",
        path: "storyteller-summary.mdx",
        containsSpoilers: true,
        intendedAudience: "storyteller",
      },
      {
        fragmentId: "frag-player-summary",
        kind: "player_summary",
        title: "Player Summary",
        path: "player-summary.mdx",
        containsSpoilers: false,
        intendedAudience: "players",
      },
      {
        fragmentId: "frag-palette",
        kind: "palette",
        title: "Palette",
        path: "palette.mdx",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-setting",
        kind: "setting",
        title: "Setting",
        path: "setting.mdx",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-location-main",
        kind: "location",
        title: "Primary Location",
        path: "locations/primary-location.mdx",
        summary: "Flooded plaza beneath an iron bell.",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-actor-main",
        kind: "actor",
        title: "Primary Actor",
        path: "actors/primary-actor.mdx",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-asset-main",
        kind: "asset",
        title: "Primary Asset",
        path: "assets/primary-asset.mdx",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-encounter-main",
        kind: "encounter",
        title: "Primary Encounter",
        path: "encounters/primary-encounter.mdx",
        summary: "Cross the flooding plaza before the bell rings twice.",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-quest-main",
        kind: "quest",
        title: "Primary Quest",
        path: "quests/primary-quest.mdx",
        summary: "Quiet the bell and escape the drowning district.",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-component-map",
        kind: "component_map",
        title: "Component Map",
        path: "components/component-map.mdx",
        containsSpoilers: true,
        intendedAudience: "storyteller",
      },
    ],
    questGraphs: [
      {
        questId: "quest-main",
        title: "Primary Quest Graph",
        hooks: [
          {
            hookId: "hook-main",
            title: "Main Hook",
            prompt: "Prompt",
            entryNodeIds: ["node-entry"],
            clueExamples: [],
          },
        ],
        nodes: [
          {
            nodeId: "node-entry",
            nodeType: "scene",
            title: "Entry",
            summary: "Summary",
            locationFragmentId: "frag-location-main",
            encounterFragmentIds: ["frag-encounter-main"],
            actorFragmentIds: ["frag-actor-main"],
            assetFragmentIds: ["frag-asset-main"],
            itemFragmentIds: [],
            exitNotes: [],
          },
        ],
        edges: [],
        entryNodeIds: ["node-entry"],
        conclusionNodeIds: ["node-entry"],
        conclusions: [
          {
            conclusionId: "conclusion-main",
            title: "Conclusion",
            summary: "Summary",
            sampleOutcomes: [],
            forwardHooks: [],
          },
        ],
      },
    ],
    componentOpportunities: [
      {
        opportunityId: "opp-main",
        componentType: "counter",
        strength: "recommended",
        timing: "during_action",
        fragmentId: "frag-encounter-main",
        fragmentKind: "encounter",
        questId: "quest-main",
        nodeId: "node-entry",
        placementLabel: "Bell Toll",
        trigger: "When pressure rises.",
        rationale: "Tracks pacing.",
      },
    ],
    artifacts: [
      {
        artifactId: "artifact-index",
        kind: "mdx",
        path: "index.mdx",
        sourceFragmentId: "frag-index",
        contentType: "text/markdown",
        createdAtIso: "2026-03-15T00:00:00.000Z",
      },
    ],
    updatedAtIso: "2026-03-15T00:00:00.000Z",
    postMvpExtension: true,
  },
  fragments: [
    {
      fragment: {
        fragmentId: "frag-index",
        kind: "index",
        title: "Index",
        path: "index.mdx",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      content: "# Index",
    },
    {
      fragment: {
        fragmentId: "frag-storyteller-summary",
        kind: "storyteller_summary",
        title: "Storyteller Summary",
        path: "storyteller-summary.mdx",
        containsSpoilers: true,
        intendedAudience: "storyteller",
      },
      content: "# Storyteller Summary",
    },
    {
      fragment: {
        fragmentId: "frag-player-summary",
        kind: "player_summary",
        title: "Player Summary",
        path: "player-summary.mdx",
        containsSpoilers: false,
        intendedAudience: "players",
      },
      content: "# Player Summary",
    },
    {
      fragment: {
        fragmentId: "frag-palette",
        kind: "palette",
        title: "Palette",
        path: "palette.mdx",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      content: "# Palette",
    },
    {
      fragment: {
        fragmentId: "frag-setting",
        kind: "setting",
        title: "Setting",
        path: "setting.mdx",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      content: "# Setting",
    },
    {
      fragment: {
        fragmentId: "frag-location-main",
        kind: "location",
        title: "Primary Location",
        path: "locations/primary-location.mdx",
        summary: "Flooded plaza beneath an iron bell.",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      content: "# Primary Location",
    },
    {
      fragment: {
        fragmentId: "frag-actor-main",
        kind: "actor",
        title: "Primary Actor",
        path: "actors/primary-actor.mdx",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      content: "# Primary Actor",
    },
    {
      fragment: {
        fragmentId: "frag-asset-main",
        kind: "asset",
        title: "Primary Asset",
        path: "assets/primary-asset.mdx",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      content: "# Primary Asset",
    },
    {
      fragment: {
        fragmentId: "frag-encounter-main",
        kind: "encounter",
        title: "Primary Encounter",
        path: "encounters/primary-encounter.mdx",
        summary: "Cross the flooding plaza before the bell rings twice.",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      content: "# Primary Encounter",
    },
    {
      fragment: {
        fragmentId: "frag-quest-main",
        kind: "quest",
        title: "Primary Quest",
        path: "quests/primary-quest.mdx",
        summary: "Quiet the bell and escape the drowning district.",
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      content: "# Primary Quest",
    },
    {
      fragment: {
        fragmentId: "frag-component-map",
        kind: "component_map",
        title: "Component Map",
        path: "components/component-map.mdx",
        containsSpoilers: true,
        intendedAudience: "storyteller",
      },
      content: "# Component Map",
    },
  ],
  actors: [
    {
      fragmentId: "frag-actor-main",
      actorSlug: "primary-actor",
      title: "Primary Actor",
      baseLayerSlug: "civilian",
      tacticalRoleSlug: "pawn",
      content: "# Primary Actor",
    },
  ],
  counters: [],
  assets: [
    {
      fragmentId: "frag-asset-main",
      assetSlug: "primary-asset",
      title: "Primary Asset",
      kind: "custom",
      modifier: "Smoldering",
      noun: "Lantern Shard",
      nounDescription: "Glows brighter around hidden doors.",
      adjectiveDescription: "Whispers when ward-lines start to fail.",
      iconUrl: "https://example.com/assets/lantern-shard.png",
      overlayUrl: "https://example.com/assets/lantern-shard-overlay.png",
      content: "# Primary Asset",
    },
  ],
  locations: [
    {
      fragmentId: "frag-location-main",
      locationSlug: "primary-location",
      title: "Primary Location",
      summary: "Flooded plaza beneath an iron bell.",
      titleImageUrl: "https://example.com/location-image.png",
      introductionMarkdown: "Read this directly to players.",
      descriptionMarkdown: "Actors gather here and hazards crowd the exits.",
      mapImageUrl: "https://example.com/location-map.png",
      mapPins: [
        {
          pinId: "pin-location",
          x: 18,
          y: 46,
          targetFragmentId: "frag-location-main",
        },
        {
          pinId: "pin-actor",
          x: 61,
          y: 29,
          targetFragmentId: "frag-actor-main",
        },
      ],
    },
  ],
  encounters: [
    {
      fragmentId: "frag-encounter-main",
      encounterSlug: "primary-encounter",
      title: "Primary Encounter",
      summary: "Cross the flooding plaza before the bell rings twice.",
      prerequisites: "Level 3+ or already tracking the flooded bell quest.",
      titleImageUrl: "https://example.com/encounter-title.png",
      content: "# Primary Encounter",
    },
  ],
  ownedByRequester: true,
});

test("adventureModuleDetailSchema accepts resolved locations joined from location metadata", () => {
  const parsed = adventureModuleDetailSchema.parse(createValidModuleDetailCandidate());

  assert.equal(parsed.locations.length, 1);
  assert.equal(parsed.locations[0]?.locationSlug, "primary-location");
  assert.equal(parsed.locations[0]?.mapPins[0]?.targetFragmentId, "frag-location-main");
});

test("adventureModuleDetailSchema rejects resolved locations that do not match location metadata", () => {
  const candidate = createValidModuleDetailCandidate();
  candidate.locations[0] = {
    ...candidate.locations[0],
    titleImageUrl: "https://example.com/unexpected.png",
  };

  assert.throws(
    () => adventureModuleDetailSchema.parse(candidate),
    /resolved location .* does not match index location metadata/i,
  );
});

test("adventureModuleDetailSchema accepts resolved custom assets joined from custom asset metadata", () => {
  const candidate = createValidModuleDetailCandidate();
  candidate.index.assetCards = [
    {
      fragmentId: "frag-asset-main",
      kind: "custom",
      modifier: "Smoldering",
      noun: "Lantern Shard",
      nounDescription: "Glows brighter around hidden doors.",
      adjectiveDescription: "Whispers when ward-lines start to fail.",
      iconUrl: "https://example.com/assets/lantern-shard.png",
      overlayUrl: "https://example.com/assets/lantern-shard-overlay.png",
    },
  ];
  candidate.assets = [
    {
      fragmentId: "frag-asset-main",
      assetSlug: "primary-asset",
      title: "Primary Asset",
      kind: "custom",
      modifier: "Smoldering",
      noun: "Lantern Shard",
      nounDescription: "Glows brighter around hidden doors.",
      adjectiveDescription: "Whispers when ward-lines start to fail.",
      iconUrl: "https://example.com/assets/lantern-shard.png",
      overlayUrl: "https://example.com/assets/lantern-shard-overlay.png",
      content: "# Primary Asset",
    },
  ];

  const parsed = adventureModuleDetailSchema.parse(candidate);

  assert.equal(parsed.assets[0]?.kind, "custom");
  assert.equal(parsed.assets[0]?.noun, "Lantern Shard");
});

test("adventureModuleDetailSchema accepts resolved encounters joined from encounter metadata", () => {
  const parsed = adventureModuleDetailSchema.parse(createValidModuleDetailCandidate());

  assert.equal(parsed.encounters.length, 1);
  assert.equal(parsed.encounters[0]?.encounterSlug, "primary-encounter");
  assert.equal(
    parsed.encounters[0]?.prerequisites,
    "Level 3+ or already tracking the flooded bell quest.",
  );
});

test("adventureModuleDetailSchema rejects resolved encounters that do not match encounter metadata", () => {
  const candidate = createValidModuleDetailCandidate();
  candidate.encounters[0] = {
    ...candidate.encounters[0],
    titleImageUrl: "https://example.com/unexpected-encounter-image.png",
  };

  assert.throws(
    () => adventureModuleDetailSchema.parse(candidate),
    /resolved encounter .* does not match index encounter metadata/i,
  );
});

test("adventureModuleUpdateAssetRequestSchema accepts custom asset fields", () => {
  const parsed = adventureModuleUpdateAssetRequestSchema.parse({
    title: "Storm Lantern",
    summary: "Portable ward light with a hidden shutter.",
    modifier: "Smoldering",
    noun: "Lantern Shard",
    nounDescription: "Glows brighter around hidden doors.",
    adjectiveDescription: "Whispers when ward-lines start to fail.",
    iconUrl: "https://example.com/assets/lantern-shard.png",
    overlayUrl: "https://example.com/assets/lantern-shard-overlay.png",
    content: "# Storm Lantern\n\nKeeps the corridor lit in rain and fog.",
  });

  assert.equal(parsed.noun, "Lantern Shard");
});

test("adventureModuleUpdateAssetRequestSchema rejects legacy layered asset payload fields", () => {
  assert.throws(
    () =>
      adventureModuleUpdateAssetRequestSchema.parse({
        title: "Storm Lantern",
        summary: "Portable ward light with a hidden shutter.",
        baseAssetSlug: "medieval_lantern",
        modifierSlug: "base_hidden",
        content: "# Storm Lantern\n\nKeeps the corridor lit in rain and fog.",
      }),
    /baseAssetSlug|modifierSlug/i,
  );
});

test("adventureModule encounter request schemas accept encounter authoring fields", async () => {
  const mod = await import("./adventureModuleAuthoring");

  const createParsed = mod.adventureModuleCreateEncounterRequestSchema.parse({
    title: "Rope Bridge Escape",
  });
  const updateParsed = mod.adventureModuleUpdateEncounterRequestSchema.parse({
    title: "Rope Bridge Escape",
    summary: "Cross the collapsing bridge before the rear guard catches up.",
    prerequisites: "Already escaped the prison cells.",
    titleImageUrl: "https://example.com/bridge-escape.png",
    content: "# Rope Bridge Escape\n\nKeep the bridge intact long enough to cross.",
  });

  assert.equal(createParsed.title, "Rope Bridge Escape");
  assert.equal(
    updateParsed.prerequisites,
    "Already escaped the prison cells.",
  );
});
