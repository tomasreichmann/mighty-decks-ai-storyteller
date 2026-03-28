import test from "node:test";
import assert from "node:assert/strict";

import {
  adventureModuleCounterSchema,
  adventureModuleIndexSchema,
} from "./adventureModule";

const createValidIndexCandidate = () => ({
  moduleId: "am-test",
  slug: "test-module",
  title: "Test Module",
  summary: "Summary",
  premise: "Premise",
  intent: "Intent",
  status: "draft",
  version: 1,
  sessionScope: "one_session_arc",
  launchProfile: "dual",
  authoringControlDefault: "curate_select",
  dos: ["Keep pressure visible"],
  donts: ["Avoid dead ends"],
  tags: ["draft"],
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
      titleImageUrl: "https://example.com/location.png",
      introductionMarkdown: "A floodlit plaza opens before the party.",
      descriptionMarkdown: "Actors gather here and the eastern gate leads onward.",
      mapImageUrl: "https://example.com/location-map.png",
      mapPins: [
        {
          pinId: "pin-main-location",
          x: 22,
          y: 48,
          targetFragmentId: "frag-location-main",
        },
        {
          pinId: "pin-main-actor",
          x: 54,
          y: 36,
          targetFragmentId: "frag-actor-main",
        },
        {
          pinId: "pin-main-encounter",
          x: 79,
          y: 61,
          targetFragmentId: "frag-encounter-main",
        },
        {
          pinId: "pin-main-quest",
          x: 88,
          y: 18,
          targetFragmentId: "frag-quest-main",
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
  questDetails: [
    {
      fragmentId: "frag-quest-main",
      questId: "quest-main",
      titleImageUrl: "https://example.com/quest-title.png",
    },
  ],
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
      containsSpoilers: false,
      intendedAudience: "shared",
    },
    {
      fragmentId: "frag-quest-main",
      kind: "quest",
      title: "Primary Quest",
      path: "quests/primary-quest.mdx",
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
          hookId: "hook-starter",
          title: "Starter Hook",
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
          summary: "Entry summary",
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
      placementLabel: "Escalation Clock",
      trigger: "When pressure rises.",
      rationale: "Keeps pacing visible.",
    },
  ],
  artifacts: [
    {
      artifactId: "artifact-frag-index",
      kind: "mdx",
      path: "index.mdx",
      sourceFragmentId: "frag-index",
      contentType: "text/markdown",
      createdAtIso: "2026-03-14T00:00:00.000Z",
    },
  ],
  updatedAtIso: "2026-03-14T00:00:00.000Z",
  postMvpExtension: true,
});

test("adventureModuleCounterSchema rejects currentValue above maxValue", () => {
  assert.throws(
    () =>
      adventureModuleCounterSchema.parse({
        slug: "threat-clock",
        iconSlug: "danger",
        title: "Threat Clock",
        currentValue: 6,
        maxValue: 5,
        description: "Tracks escalation.",
      }),
    /currentValue cannot exceed maxValue/i,
  );
});

test("adventureModuleIndexSchema rejects duplicate counter slugs", () => {
  assert.throws(
    () =>
      adventureModuleIndexSchema.parse({
        ...createValidIndexCandidate(),
        counters: [
          {
            slug: "threat-clock",
            iconSlug: "danger",
            title: "Threat Clock",
            currentValue: 1,
            description: "",
          },
          {
            slug: "threat-clock",
            iconSlug: "time",
            title: "Threat Clock Variant",
            currentValue: 2,
            description: "",
          },
        ],
      }),
    /duplicate counter slug/i,
  );
});

test("adventureModuleIndexSchema rejects missing asset card metadata", () => {
  assert.throws(
    () =>
      adventureModuleIndexSchema.parse({
        ...createValidIndexCandidate(),
        assetCards: [],
      }),
    /missing asset card metadata/i,
  );
});

test("adventureModuleIndexSchema accepts custom asset card metadata", () => {
  const parsed = adventureModuleIndexSchema.parse({
    ...createValidIndexCandidate(),
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
  });

  assert.equal(parsed.assetCards[0]?.kind, "custom");
});

test("adventureModuleIndexSchema accepts tagged legacy layered asset metadata", () => {
  const parsed = adventureModuleIndexSchema.parse({
    ...createValidIndexCandidate(),
    assetCards: [
      {
        fragmentId: "frag-asset-main",
        kind: "legacy_layered",
        baseAssetSlug: "base_package",
        modifierSlug: "base_hidden",
      },
    ],
  });

  assert.equal(parsed.assetCards[0]?.kind, "legacy_layered");
});

test("adventureModuleIndexSchema rejects missing location detail metadata", () => {
  assert.throws(
    () =>
      adventureModuleIndexSchema.parse({
        ...createValidIndexCandidate(),
        locationDetails: [],
      }),
    /missing location detail metadata/i,
  );
});

test("adventureModuleIndexSchema rejects missing encounter detail metadata", () => {
  assert.throws(
    () =>
      adventureModuleIndexSchema.parse({
        ...createValidIndexCandidate(),
        encounterDetails: [],
      }),
    /missing encounter detail metadata/i,
  );
});

test("adventureModuleIndexSchema accepts quest detail metadata joined to quest graphs", () => {
  const parsed = adventureModuleIndexSchema.parse(createValidIndexCandidate());

  assert.equal(parsed.questDetails[0]?.questId, "quest-main");
  assert.equal(
    parsed.questDetails[0]?.titleImageUrl,
    "https://example.com/quest-title.png",
  );
});

test("adventureModuleIndexSchema rejects missing quest detail metadata", () => {
  assert.throws(
    () =>
      adventureModuleIndexSchema.parse({
        ...createValidIndexCandidate(),
        questDetails: [],
      }),
    /missing quest detail metadata/i,
  );
});

test("adventureModuleIndexSchema rejects quest detail metadata that references an unknown quest graph", () => {
  assert.throws(
    () =>
      adventureModuleIndexSchema.parse({
        ...createValidIndexCandidate(),
        questDetails: [
          {
            fragmentId: "frag-quest-main",
            questId: "quest-missing",
          },
        ],
      }),
    /quest detail metadata references unknown quest graph id/i,
  );
});

test("adventureModuleIndexSchema rejects duplicate encounter detail fragment ids", () => {
  assert.throws(
    () =>
      adventureModuleIndexSchema.parse({
        ...createValidIndexCandidate(),
        encounterDetails: [
          {
            fragmentId: "frag-encounter-main",
            prerequisites: "Level 3+",
            titleImageUrl: "https://example.com/encounter-a.png",
          },
          {
            fragmentId: "frag-encounter-main",
            prerequisites: "Ongoing flooded bell quest.",
            titleImageUrl: "https://example.com/encounter-b.png",
          },
        ],
      }),
    /duplicate encounter detail fragment id/i,
  );
});

test("adventureModuleIndexSchema rejects duplicate location pin ids", () => {
  assert.throws(
    () =>
      adventureModuleIndexSchema.parse({
        ...createValidIndexCandidate(),
        locationDetails: [
          {
            fragmentId: "frag-location-main",
            introductionMarkdown: "Intro",
            descriptionMarkdown: "Description",
            mapPins: [
              {
                pinId: "pin-duplicate",
                x: 10,
                y: 10,
                targetFragmentId: "frag-actor-main",
              },
              {
                pinId: "pin-duplicate",
                x: 20,
                y: 20,
                targetFragmentId: "frag-quest-main",
              },
            ],
          },
        ],
      }),
    /duplicate location map pin id/i,
  );
});

test("adventureModuleIndexSchema rejects location pin targets outside supported kinds", () => {
  assert.throws(
    () =>
      adventureModuleIndexSchema.parse({
        ...createValidIndexCandidate(),
        locationDetails: [
          {
            fragmentId: "frag-location-main",
            introductionMarkdown: "Intro",
            descriptionMarkdown: "Description",
            mapPins: [
              {
                pinId: "pin-invalid-target",
                x: 35,
                y: 55,
                targetFragmentId: "frag-asset-main",
              },
            ],
          },
        ],
      }),
    /location map pin target/i,
  );
});
