import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import {
  adventureModuleIndexSchema,
  type AdventureModuleIndex,
} from "@mighty-decks/spec/adventureModule";
import {
  defaultActorBaseLayerSlug,
  defaultActorTacticalRoleSlug,
} from "@mighty-decks/spec/actorCards";
import {
  defaultLocationDescriptionMarkdown,
  defaultLocationIntroductionMarkdown,
  createBlankCustomAssetCard,
  makePrefixedIdentifier,
} from "./shared";

export const createActorFragmentContent = (title: string): string =>
  `# ${title}\n\n## Public Face\n\nDescribe how this actor appears to players.\n\n## Agenda\n\n- Add the actor's main motivation.\n- Add what they want right now.\n\n## Pressure Moves\n\n- Add how they escalate the scene.\n`;

export const createEncounterFragmentContent = (title: string): string =>
  `# ${title}\n\n## Goal\n\nDescribe what the players are trying to accomplish in this encounter.\n\n## Pressure\n\n- Add what makes this encounter urgent.\n- Add how the situation escalates if the players stall.\n\n## Resolution\n\n- Add likely success, cost, and fail-forward outcomes.\n`;

export const createQuestFragmentContent = (title: string): string =>
  `# ${title}\n\n## Hook\n\nDescribe why the players should care about this quest right now.\n\n## Rising Trouble\n\n- Add the first complication or revelation.\n- Add how pressure escalates if the players hesitate.\n\n## Likely Conclusions\n\n- Add the clean win, costly win, or dangerous fallout.\n`;

export const createAssetFragmentContent = (title: string): string =>
  `# ${title}\n\n## What It Is\n\nDescribe what this asset looks like and why it matters.\n\n## Leverage\n\n- Add what this asset makes easier.\n- Add who wants it or fears it.\n\n## Complications\n\n- Add the cost, limit, or risk of using it.\n`;

export const composeLocationFragmentContent = (
  title: string,
  introductionMarkdown: string,
  descriptionMarkdown: string,
): string => {
  const normalizedIntroduction =
    introductionMarkdown.trim().length > 0 ? introductionMarkdown.trim() : "";
  const normalizedDescription =
    descriptionMarkdown.trim().length > 0 ? descriptionMarkdown.trim() : "";

  return `# ${title}\n\n## Introduction\n\n${normalizedIntroduction}\n\n## Description\n\n${normalizedDescription}\n`;
};

export const normalizeLocationFragmentContent = (content: string): string =>
  content.replace(/\r\n/g, "\n").trim();

export const createStarterQuestGraph = (input: {
  questId: string;
  questSlug: string;
  title: string;
  summary?: string;
  locationFragmentId?: string;
  encounterFragmentId?: string;
  actorFragmentId?: string;
  assetFragmentId?: string;
}): AdventureModuleIndex["questGraphs"][number] => {
  const hookId = makePrefixedIdentifier("hook", input.questSlug);
  const entryNodeId = makePrefixedIdentifier("node-entry", input.questSlug);
  const conclusionNodeId = makePrefixedIdentifier("node-conclusion", input.questSlug);
  const edgeId = makePrefixedIdentifier("edge-entry-to-conclusion", input.questSlug);
  const conclusionId = makePrefixedIdentifier("conclusion", input.questSlug);
  const encounterFragmentIds = input.encounterFragmentId ? [input.encounterFragmentId] : [];
  const actorFragmentIds = input.actorFragmentId ? [input.actorFragmentId] : [];
  const assetFragmentIds = input.assetFragmentId ? [input.assetFragmentId] : [];

  return {
    questId: input.questId,
    title: input.title,
    ...(input.summary ? { summary: input.summary } : {}),
    hooks: [
      {
        hookId,
        title: "Opening Hook",
        prompt: "Introduce the quest, the immediate pressure, and why acting now matters.",
        entryNodeIds: [entryNodeId],
        clueExamples: [
          "A witness offers a lead with a price.",
          "A visible consequence makes delay costly.",
        ],
      },
    ],
    nodes: [
      {
        nodeId: entryNodeId,
        nodeType: "scene",
        title: "Opening Lead",
        summary: "Establish the quest goal, the first complication, and a clear next move.",
        ...(input.locationFragmentId ? { locationFragmentId: input.locationFragmentId } : {}),
        encounterFragmentIds,
        actorFragmentIds,
        assetFragmentIds,
        itemFragmentIds: [],
        pressureCounterHint: "Escalate when the players hesitate or attract attention.",
        exitNotes: [
          "Press forward before the pressure peaks.",
          "Secure leverage that will matter in the finale.",
        ],
      },
      {
        nodeId: conclusionNodeId,
        nodeType: "conclusion",
        title: "Immediate Resolution",
        summary: "Resolve the core pressure and show the fallout that follows the quest.",
        ...(input.locationFragmentId ? { locationFragmentId: input.locationFragmentId } : {}),
        encounterFragmentIds,
        actorFragmentIds,
        assetFragmentIds,
        itemFragmentIds: [],
        exitNotes: ["Show the cost of victory or the next threat it reveals."],
      },
    ],
    edges: [
      {
        edgeId,
        fromNodeId: entryNodeId,
        toNodeId: conclusionNodeId,
        label: "Escalate",
        clueHint: "A strong lead or consequence pushes the story into its conclusion.",
      },
    ],
    entryNodeIds: [entryNodeId],
    conclusionNodeIds: [conclusionNodeId],
    conclusions: [
      {
        conclusionId,
        title: "Primary Outcome",
        summary: "The quest ends with a visible change, a cost, and a hook for what comes next.",
        sampleOutcomes: ["The players succeed, but someone important pays the price."],
        forwardHooks: ["A rival claims the fallout before the players can stabilize it."],
      },
    ],
  };
};

const createStarterComponentOpportunities = (): AdventureModuleIndex["componentOpportunities"] => [
  {
    opportunityId: "opp-primary-encounter-pressure",
    componentType: "counter",
    strength: "recommended",
    timing: "during_action",
    fragmentId: "frag-encounter-main",
    fragmentKind: "encounter",
    placementLabel: "Encounter Pressure",
    trigger: "Escalate the opening encounter when the players hesitate or the threat advances.",
    rationale:
      "Gives the starter draft a visible pressure tool tied to the first playable beat.",
    notes: "Replace this seed with module-specific opportunities as authoring progresses.",
  },
];

const createStarterArtifacts = (
  fragments: ReadonlyArray<AdventureModuleIndex["fragments"][number]>,
  nowIso: string,
): AdventureModuleIndex["artifacts"] =>
  fragments.map((fragment) => ({
    artifactId: `artifact-${fragment.fragmentId}`,
    kind: "mdx",
    path: fragment.path,
    title: fragment.title,
    sourceFragmentId: fragment.fragmentId,
    contentType: "text/markdown",
    generatedBy: "author",
    createdAtIso: nowIso,
  }));

export const createDefaultFragmentContent = (
  index: AdventureModuleIndex,
): AdventureModuleDetail["fragments"] => {
  const locationDetailByFragmentId = new Map(
    index.locationDetails.map((locationDetail) => [
      locationDetail.fragmentId,
      locationDetail,
    ] as const),
  );
  const contentByKind: Partial<Record<AdventureModuleIndex["fragments"][number]["kind"], string>> =
    {
      index: "# Module Index\n\nThis module index is managed by the authoring editor.",
      storyteller_summary:
        "# Storyteller Summary\n\nSpoiler-ready guidance for a Storyteller running this module.",
      player_summary:
        "# Player Summary\n\nSpoiler-free invitation text for potential players.",
      palette: "# Palette\n\n## Dos\n- Keep pressure visible\n\n## Donts\n- Do not hard-lock progress",
      setting: "# Setting\n\nDescribe the core premise, tone, and pressure vectors.",
      actor: "# Actor\n\nKey goals, behavior under pressure, and leverage.",
      asset: "# Asset\n\nImportant resources and scene leverage.",
      item: "# Item\n\nOptional tools or relics that affect choices.",
      encounter: "# Encounter\n\nScene pressure, stakes, and fail-forward outcomes.",
      quest: "# Quest\n\nHooks, beats, and likely conclusions.",
      component_map:
        "# Component Opportunity Map\n\nDocument where Mighty Decks components are recommended.",
      image_prompt: "# Image Prompt\n\nPrompt text for optional generated images.",
    };

  return index.fragments.map((fragment) => ({
    fragment,
    content:
      fragment.kind === "location"
        ? composeLocationFragmentContent(
            fragment.title,
            locationDetailByFragmentId.get(fragment.fragmentId)?.introductionMarkdown ?? "",
            locationDetailByFragmentId.get(fragment.fragmentId)?.descriptionMarkdown ?? "",
          )
        : contentByKind[fragment.kind] ??
          `# ${fragment.title}\n\nDraft content for ${fragment.kind.replaceAll("_", " ")}.`,
  }));
};

export const createBlankIndex = (input: {
  moduleId: string;
  slug: string;
  title: string;
  seedPrompt?: string;
  sessionScope?: AdventureModuleIndex["sessionScope"];
  launchProfile?: AdventureModuleIndex["launchProfile"];
  nowIso: string;
}): AdventureModuleIndex => {
  const fragments: AdventureModuleIndex["fragments"] = [
    {
      fragmentId: "frag-index",
      kind: "index",
      title: "Index",
      path: "index.mdx",
      summary: "Canonical module metadata and fragment manifest.",
      tags: ["index"],
      containsSpoilers: false,
      intendedAudience: "shared",
    },
    {
      fragmentId: "frag-storyteller-summary",
      kind: "storyteller_summary",
      title: "Storyteller Summary",
      path: "storyteller-summary.mdx",
      summary: "Spoiler-ready Storyteller overview.",
      tags: ["summary", "spoilers"],
      containsSpoilers: true,
      intendedAudience: "storyteller",
    },
    {
      fragmentId: "frag-player-summary",
      kind: "player_summary",
      title: "Player Summary",
      path: "player-summary.mdx",
      summary: "Spoiler-safe player invitation.",
      tags: ["summary", "players"],
      containsSpoilers: false,
      intendedAudience: "players",
    },
    {
      fragmentId: "frag-palette",
      kind: "palette",
      title: "Palette",
      path: "palette.mdx",
      summary: "Dos and donts for tone and boundaries.",
      tags: ["palette"],
      containsSpoilers: false,
      intendedAudience: "shared",
    },
    {
      fragmentId: "frag-setting",
      kind: "setting",
      title: "Setting",
      path: "setting.mdx",
      summary: "World premise and pressure vectors.",
      tags: ["setting"],
      containsSpoilers: false,
      intendedAudience: "shared",
    },
    {
      fragmentId: "frag-location-main",
      kind: "location",
      title: "Primary Location",
      path: "locations/primary-location.mdx",
      summary: "A key place where events unfold.",
      tags: ["location"],
      containsSpoilers: false,
      intendedAudience: "shared",
    },
    {
      fragmentId: "frag-actor-main",
      kind: "actor",
      title: "Primary Actor",
      path: "actors/primary-actor.mdx",
      summary: "Main actor driving pressure.",
      tags: ["actor"],
      containsSpoilers: false,
      intendedAudience: "shared",
    },
    {
      fragmentId: "frag-asset-main",
      kind: "asset",
      title: "Primary Asset",
      path: "assets/primary-asset.mdx",
      summary: "A key asset involved in the module.",
      tags: ["asset"],
      containsSpoilers: false,
      intendedAudience: "shared",
    },
    {
      fragmentId: "frag-encounter-main",
      kind: "encounter",
      title: "Primary Encounter",
      path: "encounters/primary-encounter.mdx",
      summary: "Core encounter beat.",
      tags: ["encounter"],
      containsSpoilers: false,
      intendedAudience: "shared",
    },
    {
      fragmentId: "frag-quest-main",
      kind: "quest",
      title: "Primary Quest",
      path: "quests/primary-quest.mdx",
      summary: "Node-based quest progression.",
      tags: ["quest"],
      containsSpoilers: false,
      intendedAudience: "shared",
    },
    {
      fragmentId: "frag-component-map",
      kind: "component_map",
      title: "Component Map",
      path: "components/component-map.mdx",
      summary: "Mighty Decks component opportunity map.",
      tags: ["components"],
      containsSpoilers: true,
      intendedAudience: "storyteller",
    },
  ];

  const hint = input.seedPrompt?.trim().slice(0, 220);
  const premise = hint && hint.length > 0 ? hint : "Draft adventure module premise.";
  const componentOpportunities = createStarterComponentOpportunities();
  const artifacts = createStarterArtifacts(fragments, input.nowIso);

  return adventureModuleIndexSchema.parse({
    moduleId: input.moduleId,
    slug: input.slug,
    title: input.title,
    summary: hint && hint.length > 0 ? hint : "Draft adventure module summary.",
    premise,
    intent:
      "Deliver a one-session arc with clear hooks, escalating pressure, and fail-forward outcomes.",
    status: "draft",
    version: 1,
    sessionScope: input.sessionScope ?? "one_session_arc",
    launchProfile: input.launchProfile ?? "dual",
    authoringControlDefault: "curate_select",
    dos: ["Keep pressure visible", "Provide multiple entry hooks"],
    donts: ["Avoid single-path bottlenecks"],
    tags: ["draft", "authoring"],
    storytellerSummaryFragmentId: "frag-storyteller-summary",
    storytellerSummaryMarkdown:
      "# Storyteller Summary\n\nSpoiler-ready guidance for a Storyteller running this module.",
    playerSummaryFragmentId: "frag-player-summary",
    playerSummaryMarkdown:
      "# Player Summary\n\nSpoiler-free invitation text for potential players.",
    paletteFragmentId: "frag-palette",
    settingFragmentId: "frag-setting",
    componentMapFragmentId: "frag-component-map",
    locationFragmentIds: ["frag-location-main"],
    locationDetails: [
      {
        fragmentId: "frag-location-main",
        introductionMarkdown: defaultLocationIntroductionMarkdown,
        descriptionMarkdown: defaultLocationDescriptionMarkdown,
        mapPins: [],
      },
    ],
    actorFragmentIds: ["frag-actor-main"],
    actorCards: [
      {
        fragmentId: "frag-actor-main",
        baseLayerSlug: defaultActorBaseLayerSlug,
        tacticalRoleSlug: defaultActorTacticalRoleSlug,
      },
    ],
    counters: [],
    assetFragmentIds: ["frag-asset-main"],
    assetCards: [createBlankCustomAssetCard("frag-asset-main")],
    itemFragmentIds: [],
    encounterFragmentIds: ["frag-encounter-main"],
    encounterDetails: [
      {
        fragmentId: "frag-encounter-main",
        prerequisites: "",
      },
    ],
    questFragmentIds: ["frag-quest-main"],
    questDetails: [
      {
        fragmentId: "frag-quest-main",
        questId: "quest-main",
      },
    ],
    imagePromptFragmentIds: [],
    fragments,
    questGraphs: [
      createStarterQuestGraph({
        questId: "quest-main",
        questSlug: "primary-quest",
        title: "Primary Quest Graph",
        summary: "A compact graph for a one-session arc.",
        locationFragmentId: "frag-location-main",
        encounterFragmentId: "frag-encounter-main",
        actorFragmentId: "frag-actor-main",
        assetFragmentId: "frag-asset-main",
      }),
    ],
    componentOpportunities,
    artifacts,
    publishedAtIso: undefined,
    updatedAtIso: input.nowIso,
    postMvpExtension: true,
  });
};
