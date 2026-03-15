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
  itemFragmentIds: [],
  encounterFragmentIds: ["frag-encounter-main"],
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
