import { z } from "zod";
import {
  actorBaseLayerSlugSchema,
  actorTacticalRoleSlugSchema,
  actorTacticalSpecialSlugSchema,
} from "./actorCards";
import { counterIconSlugSchema } from "./counterCards";
import {
  adventureModuleCounterSchema,
  adventureModuleFragmentAudienceSchema,
  adventureModuleFragmentKindSchema,
  adventureModuleFragmentRefSchema,
  adventureModuleIndexSchema,
  adventureModuleLaunchProfileSchema,
  adventureModuleSessionScopeSchema,
  adventureModuleStatusSchema,
} from "./adventureModule";

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
    actors: z.array(adventureModuleResolvedActorSchema).max(80).default([]),
    counters: z.array(adventureModuleResolvedCounterSchema).max(80).default([]),
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
        actor.tacticalSpecialSlug !== actorCard.tacticalSpecialSlug
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `resolved actor ${actor.fragmentId} does not match index actor card metadata`,
          path: ["actors"],
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
});
export type AdventureModuleCreateActorRequest = z.infer<
  typeof adventureModuleCreateActorRequestSchema
>;

export const adventureModuleUpdateActorRequestSchema = z.object({
  title: shortTextSchema,
  summary: z.string().max(500).default(""),
  baseLayerSlug: actorBaseLayerSlugSchema,
  tacticalRoleSlug: actorTacticalRoleSlugSchema,
  tacticalSpecialSlug: z
    .union([actorTacticalSpecialSlugSchema, z.null()])
    .optional(),
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
