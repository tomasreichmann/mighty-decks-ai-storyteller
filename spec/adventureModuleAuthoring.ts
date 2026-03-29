import { z } from "zod";
import {
  actorBaseLayerSlugSchema,
  actorTacticalRoleSlugSchema,
  actorTacticalSpecialSlugSchema,
} from "./actorCards";
import {
  adventureModuleCounterSchema,
  adventureModuleCustomAssetCardSchema,
  adventureModuleFragmentAudienceSchema,
  adventureModuleFragmentKindSchema,
  adventureModuleFragmentRefSchema,
  adventureModuleIndexSchema,
  adventureModuleLegacyLayeredAssetCardSchema,
  adventureModuleLocationMapPinSchema,
  adventureModuleLaunchProfileSchema,
  adventureModuleSessionScopeSchema,
  adventureModuleStatusSchema,
} from "./adventureModule";
import { counterIconSlugSchema } from "./counterCards";

const identifierSchema = z.string().min(1).max(120);
const shortTextSchema = z.string().min(1).max(120);
const mediumTextSchema = z.string().min(1).max(500);
const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");

const optionalBooleanQuerySchema = z
  .union([z.boolean(), z.string().trim().toLowerCase()])
  .optional()
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value !== "string") {
      return false;
    }
    if (value === "true" || value === "1" || value === "yes") {
      return true;
    }
    return false;
  });

export const adventureModuleAuthoringHeaderSchema = z.object({
  creatorToken: z.string().min(1).max(200).optional(),
});
export type AdventureModuleAuthoringHeader = z.infer<
  typeof adventureModuleAuthoringHeaderSchema
>;

export const adventureModuleCreateSourceSchema = z.enum(["blank", "clone"]);
export type AdventureModuleCreateSource = z.infer<
  typeof adventureModuleCreateSourceSchema
>;

export const adventureModuleCreateRequestSchema = z
  .object({
    source: adventureModuleCreateSourceSchema.default("blank"),
    title: shortTextSchema.optional(),
    slug: slugSchema.optional(),
    seedPrompt: z.string().min(1).max(2000).optional(),
    cloneFromModuleId: identifierSchema.optional(),
    sessionScope: adventureModuleSessionScopeSchema.optional(),
    launchProfile: adventureModuleLaunchProfileSchema.optional(),
  })
  .superRefine((payload, ctx) => {
    if (payload.source === "clone" && !payload.cloneFromModuleId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "cloneFromModuleId is required when source=clone",
        path: ["cloneFromModuleId"],
      });
    }
  });
export type AdventureModuleCreateRequest = z.infer<
  typeof adventureModuleCreateRequestSchema
>;

export const adventureModuleCloneRequestSchema = z.object({
  title: shortTextSchema.optional(),
  slug: slugSchema.optional(),
});
export type AdventureModuleCloneRequest = z.infer<
  typeof adventureModuleCloneRequestSchema
>;

export const adventureModuleListItemSchema = z.object({
  moduleId: identifierSchema,
  slug: slugSchema,
  title: shortTextSchema,
  summary: mediumTextSchema,
  status: adventureModuleStatusSchema,
  createdAtIso: z.string().datetime(),
  updatedAtIso: z.string().datetime(),
  authorLabel: shortTextSchema,
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  coverImageUrl: z.string().min(1).max(500).optional(),
  ownedByRequester: z.boolean().default(false),
});
export type AdventureModuleListItem = z.infer<typeof adventureModuleListItemSchema>;

export const adventureModuleListResponseSchema = z.object({
  modules: z.array(adventureModuleListItemSchema).max(500),
});
export type AdventureModuleListResponse = z.infer<
  typeof adventureModuleListResponseSchema
>;

export const adventureModuleSlugAvailabilityQuerySchema = z.object({
  slug: slugSchema,
});
export type AdventureModuleSlugAvailabilityQuery = z.infer<
  typeof adventureModuleSlugAvailabilityQuerySchema
>;

export const adventureModuleSlugAvailabilityResponseSchema = z.object({
  slug: slugSchema,
  available: z.boolean(),
  reason: z.string().min(1).optional(),
});
export type AdventureModuleSlugAvailabilityResponse = z.infer<
  typeof adventureModuleSlugAvailabilityResponseSchema
>;

export const adventureModuleBySlugParamsSchema = z.object({
  slug: slugSchema,
});
export type AdventureModuleBySlugParams = z.infer<
  typeof adventureModuleBySlugParamsSchema
>;

export const adventureModuleResolvedActorSchema = z.object({
  fragmentId: identifierSchema,
  actorSlug: slugSchema,
  title: shortTextSchema,
  summary: mediumTextSchema.optional(),
  baseLayerSlug: actorBaseLayerSlugSchema,
  tacticalRoleSlug: actorTacticalRoleSlugSchema,
  tacticalSpecialSlug: actorTacticalSpecialSlugSchema.optional(),
  isPlayerCharacter: z.boolean().default(false),
  content: z.string().max(200_000).default(""),
});
export type AdventureModuleResolvedActor = z.infer<
  typeof adventureModuleResolvedActorSchema
>;

export const adventureModuleResolvedCounterSchema =
  adventureModuleCounterSchema;
export type AdventureModuleResolvedCounter = z.infer<
  typeof adventureModuleResolvedCounterSchema
>;

const adventureModuleResolvedAssetBaseSchema = z.object({
  fragmentId: identifierSchema,
  assetSlug: slugSchema,
  title: shortTextSchema,
  summary: mediumTextSchema.optional(),
  content: z.string().max(200_000).default(""),
});
export const adventureModuleResolvedCustomAssetSchema =
  adventureModuleResolvedAssetBaseSchema.merge(
    adventureModuleCustomAssetCardSchema.omit({ fragmentId: true }),
  );
export type AdventureModuleResolvedCustomAsset = z.infer<
  typeof adventureModuleResolvedCustomAssetSchema
>;

export const adventureModuleResolvedLegacyLayeredAssetSchema =
  adventureModuleResolvedAssetBaseSchema.merge(
    adventureModuleLegacyLayeredAssetCardSchema.omit({ fragmentId: true }),
  );
export type AdventureModuleResolvedLegacyLayeredAsset = z.infer<
  typeof adventureModuleResolvedLegacyLayeredAssetSchema
>;

export const adventureModuleResolvedAssetSchema = z.discriminatedUnion("kind", [
  adventureModuleResolvedCustomAssetSchema,
  adventureModuleResolvedLegacyLayeredAssetSchema,
]);
export type AdventureModuleResolvedAsset = z.infer<
  typeof adventureModuleResolvedAssetSchema
>;

export const adventureModuleResolvedLocationSchema = z.object({
  fragmentId: identifierSchema,
  locationSlug: slugSchema,
  title: shortTextSchema,
  summary: mediumTextSchema.optional(),
  titleImageUrl: z.string().min(1).max(500).optional(),
  introductionMarkdown: z.string().max(200_000).default(""),
  descriptionMarkdown: z.string().max(200_000).default(""),
  mapImageUrl: z.string().min(1).max(500).optional(),
  mapPins: z.array(adventureModuleLocationMapPinSchema).max(100).default([]),
});
export type AdventureModuleResolvedLocation = z.infer<
  typeof adventureModuleResolvedLocationSchema
>;

export const adventureModuleResolvedEncounterSchema = z.object({
  fragmentId: identifierSchema,
  encounterSlug: slugSchema,
  title: shortTextSchema,
  summary: mediumTextSchema.optional(),
  prerequisites: z.string().max(240).default(""),
  titleImageUrl: z.string().min(1).max(500).optional(),
  content: z.string().max(200_000).default(""),
});
export type AdventureModuleResolvedEncounter = z.infer<
  typeof adventureModuleResolvedEncounterSchema
>;

export const adventureModuleResolvedQuestSchema = z.object({
  fragmentId: identifierSchema,
  questId: identifierSchema,
  questSlug: slugSchema,
  title: shortTextSchema,
  summary: mediumTextSchema.optional(),
  titleImageUrl: z.string().min(1).max(500).optional(),
  content: z.string().max(200_000).default(""),
});
export type AdventureModuleResolvedQuest = z.infer<
  typeof adventureModuleResolvedQuestSchema
>;

export const adventureModuleAuthoringFragmentSchema = z.object({
  fragment: adventureModuleFragmentRefSchema,
  content: z.string().max(200_000).default(""),
});
export type AdventureModuleAuthoringFragment = z.infer<
  typeof adventureModuleAuthoringFragmentSchema
>;

export const adventureModuleDetailSchema = z
  .object({
    index: adventureModuleIndexSchema,
    fragments: z.array(adventureModuleAuthoringFragmentSchema).max(400),
    locations: z.array(adventureModuleResolvedLocationSchema).max(80).default([]),
    encounters: z.array(adventureModuleResolvedEncounterSchema).max(80).default([]),
    quests: z.array(adventureModuleResolvedQuestSchema).max(80).default([]),
    actors: z.array(adventureModuleResolvedActorSchema).max(80).default([]),
    counters: z.array(adventureModuleResolvedCounterSchema).max(80).default([]),
    assets: z.array(adventureModuleResolvedAssetSchema).max(80).default([]),
    coverImageUrl: z.string().min(1).max(500).optional(),
    ownedByRequester: z.boolean().default(false),
  })
  .superRefine((module, ctx) => {
    const fragmentIds = new Set(module.fragments.map((fragment) => fragment.fragment.fragmentId));
    for (const fragmentRef of module.index.fragments) {
      if (!fragmentIds.has(fragmentRef.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `missing fragment content for ${fragmentRef.fragmentId}`,
          path: ["fragments"],
        });
      }
    }

    const actorIds = new Set(module.index.actorFragmentIds);
    const actorCardByFragmentId = new Map(
      module.index.actorCards.map((actorCard) => [actorCard.fragmentId, actorCard] as const),
    );

    for (const actor of module.actors) {
      if (!actorIds.has(actor.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved actor references unknown fragment ${actor.fragmentId}`,
          path: ["actors"],
        });
      }
      const actorCard = actorCardByFragmentId.get(actor.fragmentId);
      if (!actorCard) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved actor missing actor card metadata for ${actor.fragmentId}`,
          path: ["actors"],
        });
        continue;
      }
      if (
        actor.baseLayerSlug !== actorCard.baseLayerSlug ||
        actor.tacticalRoleSlug !== actorCard.tacticalRoleSlug ||
        actor.tacticalSpecialSlug !== actorCard.tacticalSpecialSlug ||
        actor.isPlayerCharacter !== actorCard.isPlayerCharacter
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved actor ${actor.fragmentId} does not match index actor card metadata`,
          path: ["actors"],
        });
      }
    }

    const locationIds = new Set(module.index.locationFragmentIds);
    const locationDetailByFragmentId = new Map(
      module.index.locationDetails.map((locationDetail) => [locationDetail.fragmentId, locationDetail] as const),
    );

    for (const location of module.locations) {
      if (!locationIds.has(location.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved location references unknown fragment ${location.fragmentId}`,
          path: ["locations"],
        });
      }
      const locationDetail = locationDetailByFragmentId.get(location.fragmentId);
      if (!locationDetail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved location missing location detail metadata for ${location.fragmentId}`,
          path: ["locations"],
        });
        continue;
      }
      const fragmentRecord =
        module.fragments.find(
          (fragment) => fragment.fragment.fragmentId === location.fragmentId,
        ) ?? null;
      const usesLegacyDescriptionFallback =
        !locationDetail.titleImageUrl &&
        !locationDetail.mapImageUrl &&
        locationDetail.introductionMarkdown.length === 0 &&
        locationDetail.descriptionMarkdown.length === 0 &&
        locationDetail.mapPins.length === 0 &&
        location.titleImageUrl === undefined &&
        location.mapImageUrl === undefined &&
        location.introductionMarkdown.length === 0 &&
        location.mapPins.length === 0 &&
        location.descriptionMarkdown === (fragmentRecord?.content ?? "");
      if (
        location.titleImageUrl !== locationDetail.titleImageUrl ||
        location.introductionMarkdown !== locationDetail.introductionMarkdown ||
        (!usesLegacyDescriptionFallback &&
          location.descriptionMarkdown !== locationDetail.descriptionMarkdown) ||
        location.mapImageUrl !== locationDetail.mapImageUrl ||
        JSON.stringify(location.mapPins) !== JSON.stringify(locationDetail.mapPins)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved location ${location.fragmentId} does not match index location metadata`,
          path: ["locations"],
        });
      }
    }

    const encounterIds = new Set(module.index.encounterFragmentIds);
    const encounterDetailByFragmentId = new Map(
      module.index.encounterDetails.map((encounterDetail) => [
        encounterDetail.fragmentId,
        encounterDetail,
      ] as const),
    );

    for (const encounter of module.encounters) {
      if (!encounterIds.has(encounter.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved encounter references unknown fragment ${encounter.fragmentId}`,
          path: ["encounters"],
        });
      }
      const encounterDetail = encounterDetailByFragmentId.get(encounter.fragmentId);
      if (!encounterDetail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved encounter missing encounter detail metadata for ${encounter.fragmentId}`,
          path: ["encounters"],
        });
        continue;
      }
      if (
        encounter.prerequisites !== encounterDetail.prerequisites ||
        encounter.titleImageUrl !== encounterDetail.titleImageUrl
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved encounter ${encounter.fragmentId} does not match index encounter metadata`,
          path: ["encounters"],
        });
      }
    }

    const questIds = new Set(module.index.questFragmentIds);
    const questDetailByFragmentId = new Map(
      module.index.questDetails.map((questDetail) => [questDetail.fragmentId, questDetail] as const),
    );

    for (const quest of module.quests) {
      if (!questIds.has(quest.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved quest references unknown fragment ${quest.fragmentId}`,
          path: ["quests"],
        });
      }
      const questDetail = questDetailByFragmentId.get(quest.fragmentId);
      if (!questDetail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved quest missing quest metadata for ${quest.fragmentId}`,
          path: ["quests"],
        });
        continue;
      }
      if (
        quest.questId !== questDetail.questId ||
        quest.titleImageUrl !== questDetail.titleImageUrl
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved quest ${quest.fragmentId} does not match quest metadata`,
          path: ["quests"],
        });
      }
    }

    const countersBySlug = new Map(
      module.index.counters.map((counter) => [counter.slug, counter] as const),
    );

    for (const counter of module.counters) {
      const indexCounter = countersBySlug.get(counter.slug);
      if (!indexCounter) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved counter references unknown slug ${counter.slug}`,
          path: ["counters"],
        });
        continue;
      }
      if (
        counter.iconSlug !== indexCounter.iconSlug ||
        counter.title !== indexCounter.title ||
        counter.currentValue !== indexCounter.currentValue ||
        counter.maxValue !== indexCounter.maxValue ||
        counter.description !== indexCounter.description
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved counter ${counter.slug} does not match index metadata`,
          path: ["counters"],
        });
      }
    }

    const assetIds = new Set(module.index.assetFragmentIds);
    const assetCardByFragmentId = new Map(
      module.index.assetCards.map((assetCard) => [assetCard.fragmentId, assetCard] as const),
    );

    for (const asset of module.assets) {
      if (!assetIds.has(asset.fragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved asset references unknown fragment ${asset.fragmentId}`,
          path: ["assets"],
        });
      }
      const assetCard = assetCardByFragmentId.get(asset.fragmentId);
      if (!assetCard) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved asset missing asset card metadata for ${asset.fragmentId}`,
          path: ["assets"],
        });
        continue;
      }
      let matchesAssetCard = false;
      if (asset.kind === "custom" && assetCard.kind === "custom") {
        matchesAssetCard =
          asset.modifier === assetCard.modifier &&
          asset.noun === assetCard.noun &&
          asset.nounDescription === assetCard.nounDescription &&
          asset.adjectiveDescription === assetCard.adjectiveDescription &&
          asset.iconUrl === assetCard.iconUrl &&
          asset.overlayUrl === assetCard.overlayUrl;
      } else if (
        asset.kind === "legacy_layered" &&
        assetCard.kind === "legacy_layered"
      ) {
        matchesAssetCard =
          asset.baseAssetSlug === assetCard.baseAssetSlug &&
          asset.modifierSlug === assetCard.modifierSlug;
      }
      if (!matchesAssetCard) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved asset ${asset.fragmentId} does not match index asset card metadata`,
          path: ["assets"],
        });
      }
    }
  });
export type AdventureModuleDetail = z.infer<typeof adventureModuleDetailSchema>;

export const adventureModuleGetResponseSchema = adventureModuleDetailSchema;
export type AdventureModuleGetResponse = z.infer<
  typeof adventureModuleGetResponseSchema
>;

export const adventureModuleCreateResponseSchema = adventureModuleDetailSchema;
export type AdventureModuleCreateResponse = z.infer<
  typeof adventureModuleCreateResponseSchema
>;

export const adventureModuleUpdateIndexRequestSchema = z.object({
  index: adventureModuleIndexSchema,
});
export type AdventureModuleUpdateIndexRequest = z.infer<
  typeof adventureModuleUpdateIndexRequestSchema
>;

export const adventureModuleUpdateFragmentRequestSchema = z.object({
  content: z.string().max(200_000),
});
export type AdventureModuleUpdateFragmentRequest = z.infer<
  typeof adventureModuleUpdateFragmentRequestSchema
>;

export const adventureModuleUpdateCoverImageRequestSchema = z.object({
  coverImageUrl: z.union([z.string().min(1).max(500), z.null()]).optional(),
});
export type AdventureModuleUpdateCoverImageRequest = z.infer<
  typeof adventureModuleUpdateCoverImageRequestSchema
>;

export const adventureModuleUpdateResponseSchema = adventureModuleDetailSchema;
export type AdventureModuleUpdateResponse = z.infer<
  typeof adventureModuleUpdateResponseSchema
>;

export const adventureModuleCreateActorRequestSchema = z.object({
  title: shortTextSchema.default("New Actor"),
  isPlayerCharacter: z.boolean().default(false),
});
export type AdventureModuleCreateActorRequest = z.infer<
  typeof adventureModuleCreateActorRequestSchema
>;

export const adventureModuleCreateLocationRequestSchema = z.object({
  title: shortTextSchema.default("New Location"),
});
export type AdventureModuleCreateLocationRequest = z.infer<
  typeof adventureModuleCreateLocationRequestSchema
>;

export const adventureModuleCreateEncounterRequestSchema = z.object({
  title: shortTextSchema.default("New Encounter"),
});
export type AdventureModuleCreateEncounterRequest = z.infer<
  typeof adventureModuleCreateEncounterRequestSchema
>;

export const adventureModuleCreateQuestRequestSchema = z.object({
  title: shortTextSchema.default("New Quest"),
});
export type AdventureModuleCreateQuestRequest = z.infer<
  typeof adventureModuleCreateQuestRequestSchema
>;

export const adventureModuleUpdateLocationRequestSchema = z.object({
  title: shortTextSchema,
  summary: z.string().max(500).default(""),
  titleImageUrl: z.union([z.string().min(1).max(500), z.null()]).optional(),
  introductionMarkdown: z.string().max(200_000).default(""),
  descriptionMarkdown: z.string().max(200_000).default(""),
  mapImageUrl: z.union([z.string().min(1).max(500), z.null()]).optional(),
  mapPins: z.array(adventureModuleLocationMapPinSchema).max(100).default([]),
});
export type AdventureModuleUpdateLocationRequest = z.infer<
  typeof adventureModuleUpdateLocationRequestSchema
>;

export const adventureModuleUpdateLocationResponseSchema =
  adventureModuleDetailSchema;
export type AdventureModuleUpdateLocationResponse = z.infer<
  typeof adventureModuleUpdateLocationResponseSchema
>;

export const adventureModuleUpdateEncounterRequestSchema = z.object({
  title: shortTextSchema,
  summary: z.string().max(500).default(""),
  prerequisites: z.string().max(240).default(""),
  titleImageUrl: z.union([z.string().min(1).max(500), z.null()]).optional(),
  content: z.string().max(200_000).default(""),
});
export type AdventureModuleUpdateEncounterRequest = z.infer<
  typeof adventureModuleUpdateEncounterRequestSchema
>;

export const adventureModuleUpdateEncounterResponseSchema =
  adventureModuleDetailSchema;
export type AdventureModuleUpdateEncounterResponse = z.infer<
  typeof adventureModuleUpdateEncounterResponseSchema
>;

export const adventureModuleUpdateQuestRequestSchema = z.object({
  title: shortTextSchema,
  summary: z.string().max(500).default(""),
  titleImageUrl: z.union([z.string().min(1).max(500), z.null()]).optional(),
  content: z.string().max(200_000).default(""),
});
export type AdventureModuleUpdateQuestRequest = z.infer<
  typeof adventureModuleUpdateQuestRequestSchema
>;

export const adventureModuleUpdateQuestResponseSchema =
  adventureModuleDetailSchema;
export type AdventureModuleUpdateQuestResponse = z.infer<
  typeof adventureModuleUpdateQuestResponseSchema
>;

export const adventureModuleUpdateActorRequestSchema = z.object({
  title: shortTextSchema,
  summary: z.string().max(500).default(""),
  baseLayerSlug: actorBaseLayerSlugSchema,
  tacticalRoleSlug: actorTacticalRoleSlugSchema,
  tacticalSpecialSlug: z
    .union([actorTacticalSpecialSlugSchema, z.null()])
    .optional(),
  isPlayerCharacter: z.boolean().default(false),
  content: z.string().max(200_000).default(""),
});
export type AdventureModuleUpdateActorRequest = z.infer<
  typeof adventureModuleUpdateActorRequestSchema
>;

export const adventureModuleUpdateActorResponseSchema = adventureModuleDetailSchema;
export type AdventureModuleUpdateActorResponse = z.infer<
  typeof adventureModuleUpdateActorResponseSchema
>;

export const adventureModuleCreateCounterRequestSchema = z.object({
  title: shortTextSchema.default("New Counter"),
});
export type AdventureModuleCreateCounterRequest = z.infer<
  typeof adventureModuleCreateCounterRequestSchema
>;

export const adventureModuleUpdateCounterRequestSchema = z.object({
  title: shortTextSchema,
  iconSlug: counterIconSlugSchema,
  currentValue: z.number().int().nonnegative(),
  maxValue: z.union([z.number().int().nonnegative(), z.null()]).optional(),
  description: z.string().max(500).default(""),
});
export type AdventureModuleUpdateCounterRequest = z.infer<
  typeof adventureModuleUpdateCounterRequestSchema
>;

export const adventureModuleUpdateCounterResponseSchema =
  adventureModuleDetailSchema;
export type AdventureModuleUpdateCounterResponse = z.infer<
  typeof adventureModuleUpdateCounterResponseSchema
>;

export const adventureModuleCreateAssetRequestSchema = z.object({
  title: shortTextSchema.default("New Asset"),
});
export type AdventureModuleCreateAssetRequest = z.infer<
  typeof adventureModuleCreateAssetRequestSchema
>;

export const adventureModuleUpdateAssetRequestSchema = z
  .object({
    title: shortTextSchema,
    summary: z.string().max(500).default(""),
    modifier: z.string().max(120).default(""),
    noun: shortTextSchema,
    nounDescription: z.string().min(1).max(500),
    adjectiveDescription: z.string().max(500).default(""),
    iconUrl: z.string().min(1).max(500),
    overlayUrl: z.string().max(500).default(""),
    content: z.string().max(200_000).default(""),
  })
  .strict();
export type AdventureModuleUpdateAssetRequest = z.infer<
  typeof adventureModuleUpdateAssetRequestSchema
>;

export const adventureModuleUpdateAssetResponseSchema =
  adventureModuleDetailSchema;
export type AdventureModuleUpdateAssetResponse = z.infer<
  typeof adventureModuleUpdateAssetResponseSchema
>;

export const adventureModulePreviewQuerySchema = z.object({
  showSpoilers: optionalBooleanQuerySchema,
});
export type AdventureModulePreviewQuery = z.infer<
  typeof adventureModulePreviewQuerySchema
>;

export const adventureModulePreviewSummarySchema = z.object({
  fragmentId: identifierSchema,
  title: shortTextSchema,
  hidden: z.boolean(),
  containsSpoilers: z.boolean(),
  intendedAudience: adventureModuleFragmentAudienceSchema,
  content: z.string().max(200_000).optional(),
});
export type AdventureModulePreviewSummary = z.infer<
  typeof adventureModulePreviewSummarySchema
>;

export const adventureModulePreviewFragmentSchema = z.object({
  fragmentId: identifierSchema,
  kind: adventureModuleFragmentKindSchema,
  title: shortTextSchema,
  summary: mediumTextSchema.optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  containsSpoilers: z.boolean(),
  intendedAudience: adventureModuleFragmentAudienceSchema,
  hidden: z.boolean(),
  content: z.string().max(200_000).optional(),
});
export type AdventureModulePreviewFragment = z.infer<
  typeof adventureModulePreviewFragmentSchema
>;

export const adventureModulePreviewGroupSchema = z.object({
  kind: adventureModuleFragmentKindSchema,
  totalCount: z.number().int().nonnegative(),
  hiddenCount: z.number().int().nonnegative(),
  fragments: z.array(adventureModulePreviewFragmentSchema).max(400),
});
export type AdventureModulePreviewGroup = z.infer<
  typeof adventureModulePreviewGroupSchema
>;

export const adventureModulePreviewResponseSchema = z.object({
  index: adventureModuleIndexSchema,
  ownedByRequester: z.boolean().default(false),
  showSpoilers: z.boolean().default(false),
  playerSummary: adventureModulePreviewSummarySchema.optional(),
  storytellerSummary: adventureModulePreviewSummarySchema.optional(),
  groups: z.array(adventureModulePreviewGroupSchema).max(40),
});
export type AdventureModulePreviewResponse = z.infer<
  typeof adventureModulePreviewResponseSchema
>;

export const adventureModuleErrorSchema = z.object({
  message: z.string().min(1),
});
export type AdventureModuleError = z.infer<typeof adventureModuleErrorSchema>;
