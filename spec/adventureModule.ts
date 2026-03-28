import { z } from "zod";
import {
  actorBaseLayerSlugSchema,
  actorTacticalRoleSlugSchema,
  actorTacticalSpecialSlugSchema,
} from "./actorCards";
import {
  assetBaseSlugSchema,
  assetModifierSlugSchema,
} from "./assetCards";
import { counterIconSlugSchema } from "./counterCards";

const identifierSchema = z.string().min(1).max(120);
const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "slug must be lowercase kebab-case",
  );
const shortTextSchema = z.string().min(1).max(120);
const mediumTextSchema = z.string().min(1).max(320);
const longTextSchema = z.string().min(1).max(1200);
const fragmentPathSchema = z.string().min(1).max(260);
const tagSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9][a-z0-9_-]*$/, "tag must be lowercase snake/kebab-like");

const duplicateValues = (values: string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  }

  return Array.from(duplicates.values());
};

export const adventureModuleStatusSchema = z.enum(["draft", "published", "archived"]);
export type AdventureModuleStatus = z.infer<typeof adventureModuleStatusSchema>;

export const authoringControlModeSchema = z.enum([
  "auto_generate",
  "curate_select",
  "manual_edit",
]);
export type AuthoringControlMode = z.infer<typeof authoringControlModeSchema>;

export const adventureModuleSessionScopeSchema = z.enum([
  "one_session_arc",
  "mini_campaign",
  "open_seed",
]);
export type AdventureModuleSessionScope = z.infer<
  typeof adventureModuleSessionScopeSchema
>;

export const adventureModuleLaunchProfileSchema = z.enum([
  "ai_storyteller",
  "physical_storyteller",
  "dual",
]);
export type AdventureModuleLaunchProfile = z.infer<
  typeof adventureModuleLaunchProfileSchema
>;

export const adventureModuleFragmentKindSchema = z.enum([
  "index",
  "storyteller_summary",
  "player_summary",
  "palette",
  "setting",
  "location",
  "actor",
  "asset",
  "item",
  "encounter",
  "quest",
  "component_map",
  "image_prompt",
]);
export type AdventureModuleFragmentKind = z.infer<
  typeof adventureModuleFragmentKindSchema
>;

export const adventureModuleFragmentAudienceSchema = z.enum([
  "players",
  "storyteller",
  "shared",
]);
export type AdventureModuleFragmentAudience = z.infer<
  typeof adventureModuleFragmentAudienceSchema
>;

export const mightyDecksComponentTypeSchema = z.enum([
  "outcome",
  "effect",
  "counter",
  "stunt",
  "layered_asset",
  "layered_actor",
  "dice",
  "mini",
  "map",
]);
export type MightyDecksComponentType = z.infer<
  typeof mightyDecksComponentTypeSchema
>;

export const componentOpportunityStrengthSchema = z.enum([
  "required",
  "recommended",
  "optional",
]);
export type ComponentOpportunityStrength = z.infer<
  typeof componentOpportunityStrengthSchema
>;

const adventureModuleFragmentRefBaseSchema = z.object({
  fragmentId: identifierSchema,
  kind: adventureModuleFragmentKindSchema,
  title: shortTextSchema,
  path: fragmentPathSchema,
  summary: z.string().min(1).max(500).optional(),
  tags: z.array(tagSchema).max(20).default([]),
  containsSpoilers: z.boolean(),
  intendedAudience: adventureModuleFragmentAudienceSchema,
});

const defaultFragmentAudienceByKind: Record<
  AdventureModuleFragmentKind,
  AdventureModuleFragmentAudience
> = {
  index: "shared",
  storyteller_summary: "storyteller",
  player_summary: "players",
  palette: "shared",
  setting: "shared",
  location: "shared",
  actor: "shared",
  asset: "shared",
  item: "shared",
  encounter: "shared",
  quest: "shared",
  component_map: "storyteller",
  image_prompt: "storyteller",
};

const defaultFragmentContainsSpoilersByKind: Record<
  AdventureModuleFragmentKind,
  boolean
> = {
  index: false,
  storyteller_summary: true,
  player_summary: false,
  palette: false,
  setting: false,
  location: false,
  actor: false,
  asset: false,
  item: false,
  encounter: false,
  quest: false,
  component_map: true,
  image_prompt: false,
};

export const adventureModuleFragmentRefSchema = z.preprocess((rawInput) => {
  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) {
    return rawInput;
  }

  const candidate = rawInput as Record<string, unknown>;
  const kind = candidate.kind;
  if (typeof kind !== "string") {
    return candidate;
  }

  const knownKind = adventureModuleFragmentKindSchema.safeParse(kind);
  if (!knownKind.success) {
    return candidate;
  }

  return {
    ...candidate,
    containsSpoilers:
      typeof candidate.containsSpoilers === "boolean"
        ? candidate.containsSpoilers
        : defaultFragmentContainsSpoilersByKind[knownKind.data],
    intendedAudience:
      typeof candidate.intendedAudience === "string"
        ? candidate.intendedAudience
        : defaultFragmentAudienceByKind[knownKind.data],
  };
}, adventureModuleFragmentRefBaseSchema);
export type AdventureModuleFragmentRef = z.infer<
  typeof adventureModuleFragmentRefSchema
>;

export const adventureModuleActorCardSchema = z.object({
  fragmentId: identifierSchema,
  baseLayerSlug: actorBaseLayerSlugSchema,
  tacticalRoleSlug: actorTacticalRoleSlugSchema,
  tacticalSpecialSlug: actorTacticalSpecialSlugSchema.optional(),
});
export type AdventureModuleActorCard = z.infer<
  typeof adventureModuleActorCardSchema
>;

export const adventureModuleCustomAssetCardSchema = z.object({
  fragmentId: identifierSchema,
  kind: z.literal("custom"),
  modifier: z.string().max(120).default(""),
  noun: z.string().max(120).default(""),
  nounDescription: z.string().max(500).default(""),
  adjectiveDescription: z.string().max(500).default(""),
  iconUrl: z.string().max(500).default(""),
  overlayUrl: z.string().max(500).default(""),
});
export type AdventureModuleCustomAssetCard = z.infer<
  typeof adventureModuleCustomAssetCardSchema
>;

export const adventureModuleLegacyLayeredAssetCardSchema = z.object({
  fragmentId: identifierSchema,
  kind: z.literal("legacy_layered"),
  baseAssetSlug: assetBaseSlugSchema,
  modifierSlug: assetModifierSlugSchema.optional(),
});
export type AdventureModuleLegacyLayeredAssetCard = z.infer<
  typeof adventureModuleLegacyLayeredAssetCardSchema
>;

export const adventureModuleAssetCardSchema = z.discriminatedUnion("kind", [
  adventureModuleCustomAssetCardSchema,
  adventureModuleLegacyLayeredAssetCardSchema,
]);
export type AdventureModuleAssetCard = z.infer<
  typeof adventureModuleAssetCardSchema
>;

export const adventureModuleLocationMapPinSchema = z.object({
  pinId: identifierSchema,
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  targetFragmentId: identifierSchema,
});
export type AdventureModuleLocationMapPin = z.infer<
  typeof adventureModuleLocationMapPinSchema
>;

export const adventureModuleLocationDetailSchema = z
  .object({
    fragmentId: identifierSchema,
    titleImageUrl: z.string().min(1).max(500).optional(),
    introductionMarkdown: z.string().max(200_000).default(""),
    descriptionMarkdown: z.string().max(200_000).default(""),
    mapImageUrl: z.string().min(1).max(500).optional(),
    mapPins: z.array(adventureModuleLocationMapPinSchema).max(100).default([]),
  })
  .superRefine((detail, ctx) => {
    const pinIds = detail.mapPins.map((pin) => pin.pinId);
    for (const duplicate of duplicateValues(pinIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate location map pin id: ${duplicate}`,
        path: ["mapPins"],
      });
    }
  });
export type AdventureModuleLocationDetail = z.infer<
  typeof adventureModuleLocationDetailSchema
>;

export const adventureModuleEncounterDetailSchema = z.object({
  fragmentId: identifierSchema,
  prerequisites: z.string().max(240).default(""),
  titleImageUrl: z.string().min(1).max(500).optional(),
});
export type AdventureModuleEncounterDetail = z.infer<
  typeof adventureModuleEncounterDetailSchema
>;

export const adventureModuleQuestDetailSchema = z.object({
  fragmentId: identifierSchema,
  questId: identifierSchema,
  titleImageUrl: z.string().min(1).max(500).optional(),
});
export type AdventureModuleQuestDetail = z.infer<
  typeof adventureModuleQuestDetailSchema
>;

export const adventureModuleCounterSchema = z
  .object({
    slug: slugSchema,
    iconSlug: counterIconSlugSchema,
    title: shortTextSchema,
    currentValue: z.number().int().nonnegative(),
    maxValue: z.number().int().nonnegative().optional(),
    description: z.string().max(500).default(""),
  })
  .superRefine((counter, ctx) => {
    if (
      typeof counter.maxValue === "number" &&
      counter.currentValue > counter.maxValue
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `counter ${counter.slug} currentValue cannot exceed maxValue`,
        path: ["currentValue"],
      });
    }
  });
export type AdventureModuleCounter = z.infer<
  typeof adventureModuleCounterSchema
>;

export const adventureModuleHookSchema = z.object({
  hookId: identifierSchema,
  title: shortTextSchema,
  prompt: mediumTextSchema,
  entryNodeIds: z.array(identifierSchema).min(1).max(8),
  clueExamples: z.array(z.string().min(1).max(200)).max(5).default([]),
});
export type AdventureModuleHook = z.infer<typeof adventureModuleHookSchema>;

export const adventureModuleQuestNodeTypeSchema = z.enum([
  "scene",
  "challenge",
  "social",
  "hazard",
  "discovery",
  "setpiece",
  "conclusion",
]);
export type AdventureModuleQuestNodeType = z.infer<
  typeof adventureModuleQuestNodeTypeSchema
>;

export const adventureModuleQuestNodeSchema = z.object({
  nodeId: identifierSchema,
  nodeType: adventureModuleQuestNodeTypeSchema,
  title: shortTextSchema,
  summary: z.string().min(1).max(500),
  locationFragmentId: identifierSchema.optional(),
  encounterFragmentIds: z.array(identifierSchema).max(6).default([]),
  actorFragmentIds: z.array(identifierSchema).max(12).default([]),
  assetFragmentIds: z.array(identifierSchema).max(12).default([]),
  itemFragmentIds: z.array(identifierSchema).max(12).default([]),
  pressureCounterHint: z.string().min(1).max(160).optional(),
  exitNotes: z.array(z.string().min(1).max(220)).max(5).default([]),
});
export type AdventureModuleQuestNode = z.infer<
  typeof adventureModuleQuestNodeSchema
>;

export const adventureModuleQuestEdgeSchema = z.object({
  edgeId: identifierSchema,
  fromNodeId: identifierSchema,
  toNodeId: identifierSchema,
  label: shortTextSchema,
  condition: z.string().min(1).max(240).optional(),
  clueHint: z.string().min(1).max(240).optional(),
  costHint: z.string().min(1).max(240).optional(),
});
export type AdventureModuleQuestEdge = z.infer<
  typeof adventureModuleQuestEdgeSchema
>;

export const adventureModuleConclusionSchema = z.object({
  conclusionId: identifierSchema,
  title: shortTextSchema,
  summary: z.string().min(1).max(500),
  sampleOutcomes: z.array(z.string().min(1).max(220)).max(4).default([]),
  forwardHooks: z.array(z.string().min(1).max(220)).max(4).default([]),
});
export type AdventureModuleConclusion = z.infer<
  typeof adventureModuleConclusionSchema
>;

export const adventureModuleQuestGraphSchema = z
  .object({
    questId: identifierSchema,
    title: shortTextSchema,
    summary: z.string().min(1).max(500).optional(),
    hooks: z.array(adventureModuleHookSchema).min(1).max(10),
    nodes: z.array(adventureModuleQuestNodeSchema).min(1).max(36),
    edges: z.array(adventureModuleQuestEdgeSchema).max(100).default([]),
    entryNodeIds: z.array(identifierSchema).min(1).max(8),
    conclusionNodeIds: z.array(identifierSchema).min(1).max(8),
    conclusions: z.array(adventureModuleConclusionSchema).min(1).max(8),
  })
  .superRefine((graph, ctx) => {
    const nodeIds = graph.nodes.map((node) => node.nodeId);
    const edgeIds = graph.edges.map((edge) => edge.edgeId);
    const hookIds = graph.hooks.map((hook) => hook.hookId);
    const conclusionIds = graph.conclusions.map(
      (conclusion) => conclusion.conclusionId,
    );

    for (const duplicate of duplicateValues(nodeIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate quest node id: ${duplicate}`,
        path: ["nodes"],
      });
    }
    for (const duplicate of duplicateValues(edgeIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate quest edge id: ${duplicate}`,
        path: ["edges"],
      });
    }
    for (const duplicate of duplicateValues(hookIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate hook id: ${duplicate}`,
        path: ["hooks"],
      });
    }
    for (const duplicate of duplicateValues(conclusionIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate conclusion id: ${duplicate}`,
        path: ["conclusions"],
      });
    }

    const nodeIdSet = new Set(nodeIds);
    for (const entryId of graph.entryNodeIds) {
      if (!nodeIdSet.has(entryId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `entry node id not found: ${entryId}`,
          path: ["entryNodeIds"],
        });
      }
    }
    for (const conclusionNodeId of graph.conclusionNodeIds) {
      if (!nodeIdSet.has(conclusionNodeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `conclusion node id not found: ${conclusionNodeId}`,
          path: ["conclusionNodeIds"],
        });
      }
    }

    for (const edge of graph.edges) {
      if (!nodeIdSet.has(edge.fromNodeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge.fromNodeId references unknown node: ${edge.fromNodeId}`,
          path: ["edges"],
        });
      }
      if (!nodeIdSet.has(edge.toNodeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `edge.toNodeId references unknown node: ${edge.toNodeId}`,
          path: ["edges"],
        });
      }
    }

    for (const hook of graph.hooks) {
      for (const entryNodeId of hook.entryNodeIds) {
        if (!nodeIdSet.has(entryNodeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `hook ${hook.hookId} references unknown entry node id: ${entryNodeId}`,
            path: ["hooks"],
          });
        }
      }
    }
  });
export type AdventureModuleQuestGraph = z.infer<
  typeof adventureModuleQuestGraphSchema
>;

export const componentOpportunityTimingSchema = z.enum([
  "setup",
  "scene_start",
  "during_action",
  "on_outcome",
  "scene_close",
  "between_scenes",
]);
export type ComponentOpportunityTiming = z.infer<
  typeof componentOpportunityTimingSchema
>;

export const adventureModuleComponentOpportunitySchema = z
  .object({
    opportunityId: identifierSchema,
    componentType: mightyDecksComponentTypeSchema,
    strength: componentOpportunityStrengthSchema,
    timing: componentOpportunityTimingSchema,
    fragmentId: identifierSchema.optional(),
    fragmentKind: adventureModuleFragmentKindSchema.optional(),
    questId: identifierSchema.optional(),
    nodeId: identifierSchema.optional(),
    placementLabel: shortTextSchema,
    trigger: z.string().min(1).max(240),
    rationale: z.string().min(1).max(360),
    notes: z.string().min(1).max(320).optional(),
  })
  .superRefine((opportunity, ctx) => {
    const hasAnchor =
      Boolean(opportunity.fragmentId) ||
      Boolean(opportunity.questId) ||
      Boolean(opportunity.nodeId);
    if (!hasAnchor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "component opportunity must reference fragmentId, questId, or nodeId",
      });
    }
  });
export type AdventureModuleComponentOpportunity = z.infer<
  typeof adventureModuleComponentOpportunitySchema
>;

export const adventureModuleArtifactKindSchema = z.enum([
  "mdx",
  "json_manifest",
  "image_prompt",
  "image_asset",
  "reference_link",
]);
export type AdventureModuleArtifactKind = z.infer<
  typeof adventureModuleArtifactKindSchema
>;

export const adventureModuleArtifactSourceSchema = z.enum([
  "author",
  "assistant",
  "pipeline",
]);
export type AdventureModuleArtifactSource = z.infer<
  typeof adventureModuleArtifactSourceSchema
>;

export const adventureModuleArtifactSchema = z.object({
  artifactId: identifierSchema,
  kind: adventureModuleArtifactKindSchema,
  path: fragmentPathSchema,
  title: shortTextSchema.optional(),
  sourceFragmentId: identifierSchema.optional(),
  contentType: z.string().min(1).max(120).optional(),
  generatedBy: adventureModuleArtifactSourceSchema.optional(),
  createdAtIso: z.string().datetime().optional(),
});
export type AdventureModuleArtifact = z.infer<
  typeof adventureModuleArtifactSchema
>;

export const adventureModuleIndexSchema = z
  .object({
    moduleId: identifierSchema,
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "slug must be lowercase kebab-case",
      ),
    title: shortTextSchema,
    summary: z.string().min(1).max(500),
    premise: z.string().min(1).max(500),
    intent: z.string().min(1).max(500),
    status: adventureModuleStatusSchema.default("draft"),
    version: z.number().int().min(1).default(1),
    sessionScope: adventureModuleSessionScopeSchema.default("one_session_arc"),
    launchProfile: adventureModuleLaunchProfileSchema.default("dual"),
    authoringControlDefault: authoringControlModeSchema.default("curate_select"),
    dos: z.array(z.string().min(1).max(160)).max(12).default([]),
    donts: z.array(z.string().min(1).max(160)).max(12).default([]),
    tags: z.array(tagSchema).max(20).default([]),
    storytellerSummaryFragmentId: identifierSchema,
    storytellerSummaryMarkdown: z.string().max(200_000).default(""),
    playerSummaryFragmentId: identifierSchema,
    playerSummaryMarkdown: z.string().max(200_000).default(""),
    paletteFragmentId: identifierSchema,
    settingFragmentId: identifierSchema,
    componentMapFragmentId: identifierSchema,
    locationFragmentIds: z.array(identifierSchema).min(1).max(40),
    locationDetails: z.array(adventureModuleLocationDetailSchema).max(40).default([]),
    actorFragmentIds: z.array(identifierSchema).max(40),
    actorCards: z.array(adventureModuleActorCardSchema).max(40).default([]),
    counters: z.array(adventureModuleCounterSchema).max(80).default([]),
    assetFragmentIds: z.array(identifierSchema).max(40),
    assetCards: z.array(adventureModuleAssetCardSchema).max(40).default([]),
    itemFragmentIds: z.array(identifierSchema).max(40).default([]),
    encounterFragmentIds: z.array(identifierSchema).min(1).max(60),
    encounterDetails: z.array(adventureModuleEncounterDetailSchema).max(60).default([]),
    questFragmentIds: z.array(identifierSchema).min(1).max(30),
    questDetails: z.array(adventureModuleQuestDetailSchema).max(30).default([]),
    imagePromptFragmentIds: z.array(identifierSchema).max(40).default([]),
    fragments: z.array(adventureModuleFragmentRefSchema).min(1).max(300),
    questGraphs: z.array(adventureModuleQuestGraphSchema).min(1).max(30),
    componentOpportunities: z
      .array(adventureModuleComponentOpportunitySchema)
      .min(1)
      .max(400),
    artifacts: z.array(adventureModuleArtifactSchema).min(1).max(500),
    notes: longTextSchema.optional(),
    updatedAtIso: z.string().datetime(),
    publishedAtIso: z.string().datetime().optional(),
    postMvpExtension: z.literal(true).default(true),
  })
  .superRefine((index, ctx) => {
    const fragmentIds = index.fragments.map((fragment) => fragment.fragmentId);
    for (const duplicate of duplicateValues(fragmentIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate fragment id: ${duplicate}`,
        path: ["fragments"],
      });
    }

    const fragmentIdSet = new Set(fragmentIds);
    const fragmentsById = new Map(index.fragments.map((fragment) => [fragment.fragmentId, fragment]));

    const ensureFragment = (
      fragmentId: string,
      expectedKind: AdventureModuleFragmentKind,
      path: (string | number)[],
    ): void => {
      const fragment = fragmentsById.get(fragmentId);
      if (!fragment) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `fragment id not found: ${fragmentId}`,
          path,
        });
        return;
      }
      if (fragment.kind !== expectedKind) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `fragment ${fragmentId} must be kind ${expectedKind}, got ${fragment.kind}`,
          path,
        });
      }
    };

    ensureFragment(index.paletteFragmentId, "palette", ["paletteFragmentId"]);
    ensureFragment(
      index.storytellerSummaryFragmentId,
      "storyteller_summary",
      ["storytellerSummaryFragmentId"],
    );
    ensureFragment(
      index.playerSummaryFragmentId,
      "player_summary",
      ["playerSummaryFragmentId"],
    );
    ensureFragment(index.settingFragmentId, "setting", ["settingFragmentId"]);
    ensureFragment(
      index.componentMapFragmentId,
      "component_map",
      ["componentMapFragmentId"],
    );

    for (const locationId of index.locationFragmentIds) {
      ensureFragment(locationId, "location", ["locationFragmentIds"]);
    }

    const locationDetailFragmentIds = index.locationDetails.map(
      (locationDetail) => locationDetail.fragmentId,
    );
    for (const duplicate of duplicateValues(locationDetailFragmentIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate location detail fragment id: ${duplicate}`,
        path: ["locationDetails"],
      });
    }

    const locationIdSet = new Set(index.locationFragmentIds);
    const locationDetailByFragmentId = new Map(
      index.locationDetails.map((locationDetail) => [locationDetail.fragmentId, locationDetail] as const),
    );

    for (const locationId of index.locationFragmentIds) {
      if (!locationDetailByFragmentId.has(locationId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `missing location detail metadata for fragment id: ${locationId}`,
          path: ["locationDetails"],
        });
      }
    }
    for (const locationDetail of index.locationDetails) {
      if (!locationIdSet.has(locationDetail.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `location detail metadata references unknown location fragment id: ${locationDetail.fragmentId}`,
          path: ["locationDetails"],
        });
      }

      for (const mapPin of locationDetail.mapPins) {
        const targetFragment = fragmentsById.get(mapPin.targetFragmentId);
        if (!targetFragment) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `location map pin target fragment not found: ${mapPin.targetFragmentId}`,
            path: ["locationDetails"],
          });
          continue;
        }

        if (
          targetFragment.kind !== "location" &&
          targetFragment.kind !== "actor" &&
          targetFragment.kind !== "encounter" &&
          targetFragment.kind !== "quest"
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `location map pin target ${mapPin.targetFragmentId} must reference a location, actor, encounter, or quest fragment`,
            path: ["locationDetails"],
          });
        }
      }
    }

    for (const actorId of index.actorFragmentIds) {
      ensureFragment(actorId, "actor", ["actorFragmentIds"]);
    }

    const actorCardFragmentIds = index.actorCards.map((actorCard) => actorCard.fragmentId);
    for (const duplicate of duplicateValues(actorCardFragmentIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate actor card fragment id: ${duplicate}`,
        path: ["actorCards"],
      });
    }

    const actorIdSet = new Set(index.actorFragmentIds);
    const actorCardIdSet = new Set(actorCardFragmentIds);
    for (const actorId of index.actorFragmentIds) {
      if (!actorCardIdSet.has(actorId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `missing actor card metadata for fragment id: ${actorId}`,
          path: ["actorCards"],
        });
      }
    }
    for (const actorCard of index.actorCards) {
      if (!actorIdSet.has(actorCard.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `actor card metadata references unknown actor fragment id: ${actorCard.fragmentId}`,
          path: ["actorCards"],
        });
      }
    }

    const counterSlugs = index.counters.map((counter) => counter.slug);
    for (const duplicate of duplicateValues(counterSlugs)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate counter slug: ${duplicate}`,
        path: ["counters"],
      });
    }

    for (const assetId of index.assetFragmentIds) {
      ensureFragment(assetId, "asset", ["assetFragmentIds"]);
    }

    const assetCardFragmentIds = index.assetCards.map((assetCard) => assetCard.fragmentId);
    for (const duplicate of duplicateValues(assetCardFragmentIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate asset card fragment id: ${duplicate}`,
        path: ["assetCards"],
      });
    }

    const assetIdSet = new Set(index.assetFragmentIds);
    const assetCardIdSet = new Set(assetCardFragmentIds);
    for (const assetId of index.assetFragmentIds) {
      if (!assetCardIdSet.has(assetId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `missing asset card metadata for fragment id: ${assetId}`,
          path: ["assetCards"],
        });
      }
    }
    for (const assetCard of index.assetCards) {
      if (!assetIdSet.has(assetCard.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `asset card metadata references unknown asset fragment id: ${assetCard.fragmentId}`,
          path: ["assetCards"],
        });
      }
    }

    for (const itemId of index.itemFragmentIds) {
      ensureFragment(itemId, "item", ["itemFragmentIds"]);
    }
    for (const encounterId of index.encounterFragmentIds) {
      ensureFragment(encounterId, "encounter", ["encounterFragmentIds"]);
    }

    const encounterDetailFragmentIds = index.encounterDetails.map(
      (encounterDetail) => encounterDetail.fragmentId,
    );
    for (const duplicate of duplicateValues(encounterDetailFragmentIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate encounter detail fragment id: ${duplicate}`,
        path: ["encounterDetails"],
      });
    }

    const encounterIdSet = new Set(index.encounterFragmentIds);
    const encounterDetailByFragmentId = new Map(
      index.encounterDetails.map((encounterDetail) => [
        encounterDetail.fragmentId,
        encounterDetail,
      ] as const),
    );

    for (const encounterId of index.encounterFragmentIds) {
      if (!encounterDetailByFragmentId.has(encounterId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `missing encounter detail metadata for fragment id: ${encounterId}`,
          path: ["encounterDetails"],
        });
      }
    }
    for (const encounterDetail of index.encounterDetails) {
      if (!encounterIdSet.has(encounterDetail.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `encounter detail metadata references unknown encounter fragment id: ${encounterDetail.fragmentId}`,
          path: ["encounterDetails"],
        });
      }
    }

    for (const questId of index.questFragmentIds) {
      ensureFragment(questId, "quest", ["questFragmentIds"]);
    }

    const questDetailFragmentIds = index.questDetails.map(
      (questDetail) => questDetail.fragmentId,
    );
    for (const duplicate of duplicateValues(questDetailFragmentIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate quest detail fragment id: ${duplicate}`,
        path: ["questDetails"],
      });
    }

    const questDetailQuestIds = index.questDetails.map(
      (questDetail) => questDetail.questId,
    );
    for (const duplicate of duplicateValues(questDetailQuestIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate quest detail quest id: ${duplicate}`,
        path: ["questDetails"],
      });
    }

    const questIdSet = new Set(index.questFragmentIds);
    const questGraphIdSet = new Set(index.questGraphs.map((quest) => quest.questId));
    const questDetailByFragmentId = new Map(
      index.questDetails.map((questDetail) => [questDetail.fragmentId, questDetail] as const),
    );
    const questDetailByQuestId = new Map(
      index.questDetails.map((questDetail) => [questDetail.questId, questDetail] as const),
    );

    for (const questId of index.questFragmentIds) {
      if (!questDetailByFragmentId.has(questId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `missing quest detail metadata for fragment id: ${questId}`,
          path: ["questDetails"],
        });
      }
    }
    for (const questDetail of index.questDetails) {
      if (!questIdSet.has(questDetail.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `quest detail metadata references unknown quest fragment id: ${questDetail.fragmentId}`,
          path: ["questDetails"],
        });
      }
      if (!questGraphIdSet.has(questDetail.questId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `quest detail metadata references unknown quest graph id: ${questDetail.questId}`,
          path: ["questDetails"],
        });
      }
    }
    for (const promptId of index.imagePromptFragmentIds) {
      ensureFragment(promptId, "image_prompt", ["imagePromptFragmentIds"]);
    }

    for (const artifact of index.artifacts) {
      if (artifact.sourceFragmentId && !fragmentIdSet.has(artifact.sourceFragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `artifact ${artifact.artifactId} references unknown source fragment id: ${artifact.sourceFragmentId}`,
          path: ["artifacts"],
        });
      }
    }

    const questIds = index.questGraphs.map((quest) => quest.questId);
    for (const duplicate of duplicateValues(questIds)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate quest graph id: ${duplicate}`,
        path: ["questGraphs"],
      });
    }
    for (const questGraph of index.questGraphs) {
      if (!questDetailByQuestId.has(questGraph.questId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `missing quest detail metadata for quest graph id: ${questGraph.questId}`,
          path: ["questDetails"],
        });
      }
    }

    for (const opportunity of index.componentOpportunities) {
      if (opportunity.fragmentId && !fragmentIdSet.has(opportunity.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `component opportunity ${opportunity.opportunityId} references unknown fragment id: ${opportunity.fragmentId}`,
          path: ["componentOpportunities"],
        });
      }
    }
  });
export type AdventureModuleIndex = z.infer<typeof adventureModuleIndexSchema>;
