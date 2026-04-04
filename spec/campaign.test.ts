import test from "node:test";
import assert from "node:assert/strict";

import {
  campaignCreateRequestSchema,
  campaignDetailSchema,
  campaignSessionDetailSchema,
  campaignSessionTableCardReferenceSchema,
  campaignSessionTableTargetSchema,
} from "./campaign";

const createValidCampaignDetailCandidate = () => ({
  campaignId: "campaign-flooded-bells",
  sourceModuleId: "module-flooded-bells",
  sourceModuleSlug: "flooded-bells",
  sourceModuleTitle: "Flooded Bells",
  createdAtIso: "2026-03-15T00:00:00.000Z",
  updatedAtIso: "2026-03-15T00:00:00.000Z",
  index: {
    moduleId: "campaign-flooded-bells",
    slug: "flooded-bells-campaign",
    title: "Flooded Bells Campaign",
    summary: "A campaign fork of Flooded Bells.",
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
        isPlayerCharacter: true,
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
      isPlayerCharacter: true,
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
  quests: [
    {
      fragmentId: "frag-quest-main",
      questId: "quest-main",
      questSlug: "primary-quest",
      title: "Primary Quest",
      summary: "Quiet the bell and escape the drowning district.",
      titleImageUrl: "https://example.com/quest-title.png",
      content: "# Primary Quest",
    },
  ],
  sessions: [
    {
      sessionId: "session-one",
      status: "active",
      createdAtIso: "2026-03-15T01:00:00.000Z",
      updatedAtIso: "2026-03-15T01:05:00.000Z",
      closedAtIso: undefined,
      storytellerCount: 1,
      playerCount: 1,
      transcriptEntryCount: 2,
      transcriptPreview: "The bell tolls once as the plaza floods.",
    },
  ],
});

test("campaignCreateRequestSchema requires a source adventure module", () => {
  const parsed = campaignCreateRequestSchema.parse({
    sourceModuleId: "module-flooded-bells",
    title: "Flooded Bells Campaign",
    slug: "flooded-bells-campaign",
  });

  assert.equal(parsed.sourceModuleId, "module-flooded-bells");
});

test("campaignDetailSchema accepts module-derived content with session summaries", () => {
  const parsed = campaignDetailSchema.parse(createValidCampaignDetailCandidate());

  assert.equal(parsed.campaignId, "campaign-flooded-bells");
  assert.equal(parsed.actors[0]?.isPlayerCharacter, true);
  assert.equal(parsed.sessions[0]?.status, "active");
});

test("campaignSessionDetailSchema accepts setup and transcript state", () => {
  const parsed = campaignSessionDetailSchema.parse({
    sessionId: "session-one",
    status: "setup",
    createdAtIso: "2026-03-15T01:00:00.000Z",
    updatedAtIso: "2026-03-15T01:05:00.000Z",
    storytellerCount: 1,
    playerCount: 1,
    transcriptEntryCount: 2,
    transcriptPreview: "The bell tolls once as the plaza floods.",
    participants: [
      {
        participantId: "participant-storyteller",
        displayName: "Morgan",
        role: "storyteller",
        isMock: false,
        connected: true,
        joinedAtIso: "2026-03-15T01:00:00.000Z",
      },
      {
        participantId: "participant-player",
        displayName: "Jun",
        role: "player",
        isMock: false,
        connected: true,
        joinedAtIso: "2026-03-15T01:02:00.000Z",
      },
    ],
    claims: [
      {
        actorFragmentId: "frag-actor-main",
        participantId: "participant-player",
        claimedAtIso: "2026-03-15T01:03:00.000Z",
      },
    ],
    transcript: [
      {
        entryId: "event-created",
        kind: "system",
        text: "Session created.",
        createdAtIso: "2026-03-15T01:00:00.000Z",
      },
      {
        entryId: "message-1",
        kind: "group_message",
        participantId: "participant-player",
        authorDisplayName: "Jun",
        authorRole: "player",
        text: "I push open the floodgate.",
        createdAtIso: "2026-03-15T01:04:00.000Z",
      },
    ],
    table: [
      {
        tableEntryId: "table-entry-shared",
        target: { scope: "shared" },
        card: { type: "EffectCard", slug: "burning" },
        addedAtIso: "2026-03-15T01:03:30.000Z",
      },
      {
        tableEntryId: "table-entry-player",
        target: {
          scope: "participant",
          participantId: "participant-player",
        },
        card: {
          type: "AssetCard",
          slug: "medieval_lantern",
          modifierSlug: "base_hidden",
        },
        addedAtIso: "2026-03-15T01:03:45.000Z",
      },
    ],
  });

  assert.equal(parsed.claims[0]?.actorFragmentId, "frag-actor-main");
  assert.equal(parsed.transcript[1]?.kind, "group_message");
  assert.equal(parsed.table[0]?.target.scope, "shared");
  assert.equal(parsed.table[1]?.card.type, "AssetCard");
});

test("campaignSession table schemas accept shared and participant targets with typed card references", () => {
  const sharedTarget = campaignSessionTableTargetSchema.parse({
    scope: "shared",
  });
  const participantTarget = campaignSessionTableTargetSchema.parse({
    scope: "participant",
    participantId: "participant-player-a",
  });
  const stuntCard = campaignSessionTableCardReferenceSchema.parse({
    type: "StuntCard",
    slug: "power-attack",
  });
  const questCard = campaignSessionTableCardReferenceSchema.parse({
    type: "QuestCard",
    slug: "recover-the-shard",
  });

  assert.equal(sharedTarget.scope, "shared");
  assert.equal(participantTarget.scope, "participant");
  assert.equal(participantTarget.participantId, "participant-player-a");
  assert.equal(stuntCard.type, "StuntCard");
  assert.equal(questCard.type, "QuestCard");
});
