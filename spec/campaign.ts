import { z } from "zod";
import { adventureModuleDetailSchema } from "./adventureModuleAuthoring";
import { outcomeCardTypeSchema } from "./adventureState";

const identifierSchema = z.string().min(1).max(120);
const shortTextSchema = z.string().min(1).max(120);
const mediumTextSchema = z.string().min(1).max(500);
const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");

export const campaignSessionStatusSchema = z.enum(["setup", "active", "closed"]);
export type CampaignSessionStatus = z.infer<typeof campaignSessionStatusSchema>;

export const campaignSessionParticipantRoleSchema = z.enum([
  "player",
  "storyteller",
]);
export type CampaignSessionParticipantRole = z.infer<
  typeof campaignSessionParticipantRoleSchema
>;

export const campaignSessionParticipantSchema = z.object({
  participantId: identifierSchema,
  displayName: shortTextSchema,
  role: campaignSessionParticipantRoleSchema,
  isMock: z.boolean().default(false),
  connected: z.boolean().default(true),
  joinedAtIso: z.string().datetime(),
});
export type CampaignSessionParticipant = z.infer<
  typeof campaignSessionParticipantSchema
>;

export const campaignCharacterClaimSchema = z.object({
  actorFragmentId: identifierSchema,
  participantId: identifierSchema,
  claimedAtIso: z.string().datetime(),
});
export type CampaignCharacterClaim = z.infer<typeof campaignCharacterClaimSchema>;

export const campaignSessionTranscriptKindSchema = z.enum([
  "system",
  "group_message",
]);
export type CampaignSessionTranscriptKind = z.infer<
  typeof campaignSessionTranscriptKindSchema
>;

export const campaignSessionTranscriptEntrySchema = z
  .object({
    entryId: identifierSchema,
    kind: campaignSessionTranscriptKindSchema,
    participantId: identifierSchema.optional(),
    authorDisplayName: shortTextSchema.optional(),
    authorRole: campaignSessionParticipantRoleSchema.optional(),
    text: z.string().min(1).max(4000),
    createdAtIso: z.string().datetime(),
  })
  .superRefine((entry, ctx) => {
    if (entry.kind !== "group_message") {
      return;
    }
    if (!entry.participantId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "participantId is required for group_message entries",
        path: ["participantId"],
      });
    }
    if (!entry.authorDisplayName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "authorDisplayName is required for group_message entries",
        path: ["authorDisplayName"],
      });
    }
    if (!entry.authorRole) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "authorRole is required for group_message entries",
        path: ["authorRole"],
      });
    }
  });
export type CampaignSessionTranscriptEntry = z.infer<
  typeof campaignSessionTranscriptEntrySchema
>;

export const campaignSessionOutcomeCardInstanceSchema = z.object({
  cardId: identifierSchema,
  slug: outcomeCardTypeSchema,
  createdAtIso: z.string().datetime(),
});
export type CampaignSessionOutcomeCardInstance = z.infer<
  typeof campaignSessionOutcomeCardInstanceSchema
>;

export const campaignSessionOutcomePileSchema = z.object({
  deck: z.array(campaignSessionOutcomeCardInstanceSchema).max(200).default([]),
  hand: z.array(campaignSessionOutcomeCardInstanceSchema).max(200).default([]),
  discard: z.array(campaignSessionOutcomeCardInstanceSchema).max(200).default([]),
});
export type CampaignSessionOutcomePile = z.infer<
  typeof campaignSessionOutcomePileSchema
>;

export const campaignSessionOutcomePilesByParticipantIdSchema = z
  .record(identifierSchema, campaignSessionOutcomePileSchema)
  .default({});
export type CampaignSessionOutcomePilesByParticipantId = z.infer<
  typeof campaignSessionOutcomePilesByParticipantIdSchema
>;

export const campaignSessionTableCardTypeSchema = z.enum([
  "OutcomeCard",
  "EffectCard",
  "StuntCard",
  "ActorCard",
  "CounterCard",
  "AssetCard",
  "LocationCard",
  "EncounterCard",
  "QuestCard",
]);
export type CampaignSessionTableCardType = z.infer<
  typeof campaignSessionTableCardTypeSchema
>;

export const campaignSessionTableCardReferenceSchema = z.discriminatedUnion(
  "type",
  [
    z.object({
      type: z.literal("OutcomeCard"),
      slug: identifierSchema,
    }),
    z.object({
      type: z.literal("EffectCard"),
      slug: identifierSchema,
    }),
    z.object({
      type: z.literal("StuntCard"),
      slug: identifierSchema,
    }),
    z.object({
      type: z.literal("ActorCard"),
      slug: identifierSchema,
    }),
    z.object({
      type: z.literal("CounterCard"),
      slug: identifierSchema,
    }),
    z.object({
      type: z.literal("AssetCard"),
      slug: identifierSchema,
      modifierSlug: identifierSchema.optional(),
    }),
    z.object({
      type: z.literal("LocationCard"),
      slug: identifierSchema,
    }),
    z.object({
      type: z.literal("EncounterCard"),
      slug: identifierSchema,
    }),
    z.object({
      type: z.literal("QuestCard"),
      slug: identifierSchema,
    }),
  ],
);
export type CampaignSessionTableCardReference = z.infer<
  typeof campaignSessionTableCardReferenceSchema
>;

export const campaignSessionTableTargetSchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal("shared"),
  }),
  z.object({
    scope: z.literal("participant"),
    participantId: identifierSchema,
  }),
]);
export type CampaignSessionTableTarget = z.infer<
  typeof campaignSessionTableTargetSchema
>;

export const campaignSessionTableEntrySchema = z.object({
  tableEntryId: identifierSchema,
  target: campaignSessionTableTargetSchema,
  card: campaignSessionTableCardReferenceSchema,
  addedAtIso: z.string().datetime(),
});
export type CampaignSessionTableEntry = z.infer<
  typeof campaignSessionTableEntrySchema
>;

export const campaignSessionSummarySchema = z.object({
  sessionId: identifierSchema,
  status: campaignSessionStatusSchema,
  createdAtIso: z.string().datetime(),
  updatedAtIso: z.string().datetime(),
  closedAtIso: z.string().datetime().optional(),
  storytellerCount: z.number().int().nonnegative(),
  playerCount: z.number().int().nonnegative(),
  transcriptEntryCount: z.number().int().nonnegative(),
  transcriptPreview: z.string().min(1).max(4000).optional(),
});
export type CampaignSessionSummary = z.infer<typeof campaignSessionSummarySchema>;

export const campaignSessionDetailSchema = campaignSessionSummarySchema
  .extend({
    participants: z.array(campaignSessionParticipantSchema).max(24).default([]),
    claims: z.array(campaignCharacterClaimSchema).max(40).default([]),
    outcomePilesByParticipantId:
      campaignSessionOutcomePilesByParticipantIdSchema.default({}),
    transcript: z.array(campaignSessionTranscriptEntrySchema).max(5000).default([]),
    table: z.array(campaignSessionTableEntrySchema).max(2000).default([]),
  })
  .superRefine((session, ctx) => {
    if (session.status === "closed" && !session.closedAtIso) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "closedAtIso is required when status=closed",
        path: ["closedAtIso"],
      });
    }

    const participantIds = new Set(session.participants.map((participant) => participant.participantId));
    const playerParticipantIds = new Set(
      session.participants
        .filter((participant) => participant.role === "player")
        .map((participant) => participant.participantId),
    );
    const claimedActorIds = new Set<string>();

    for (const claim of session.claims) {
      if (!participantIds.has(claim.participantId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `claim references unknown participant ${claim.participantId}`,
          path: ["claims"],
        });
      }
      if (!playerParticipantIds.has(claim.participantId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `claim participant ${claim.participantId} must have role player`,
          path: ["claims"],
        });
      }
      if (claimedActorIds.has(claim.actorFragmentId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate claim for actor ${claim.actorFragmentId}`,
          path: ["claims"],
        });
      }
      claimedActorIds.add(claim.actorFragmentId);
    }

    for (const entry of session.transcript) {
      if (entry.kind !== "group_message" || !entry.participantId) {
        continue;
      }
      if (!participantIds.has(entry.participantId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `transcript entry references unknown participant ${entry.participantId}`,
          path: ["transcript"],
        });
      }
    }

    for (const tableEntry of session.table) {
      if (tableEntry.target.scope !== "participant") {
        continue;
      }
      if (!participantIds.has(tableEntry.target.participantId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `table entry references unknown participant ${tableEntry.target.participantId}`,
          path: ["table"],
        });
        continue;
      }
      if (!playerParticipantIds.has(tableEntry.target.participantId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `table entry target ${tableEntry.target.participantId} must have role player`,
          path: ["table"],
        });
      }
    }

    for (const participantId of Object.keys(session.outcomePilesByParticipantId)) {
      if (!participantIds.has(participantId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `outcome pile references unknown participant ${participantId}`,
          path: ["outcomePilesByParticipantId"],
        });
      }
    }
  });
export type CampaignSessionDetail = z.infer<typeof campaignSessionDetailSchema>;

export const campaignListItemSchema = z.object({
  campaignId: identifierSchema,
  slug: slugSchema,
  title: shortTextSchema,
  summary: mediumTextSchema,
  createdAtIso: z.string().datetime(),
  updatedAtIso: z.string().datetime(),
  sourceModuleId: identifierSchema,
  sourceModuleSlug: slugSchema,
  sourceModuleTitle: shortTextSchema,
  coverImageUrl: z.string().min(1).max(500).optional(),
  sessionCount: z.number().int().nonnegative().default(0),
  activeSessionCount: z.number().int().nonnegative().default(0),
});
export type CampaignListItem = z.infer<typeof campaignListItemSchema>;

export const campaignListResponseSchema = z.object({
  campaigns: z.array(campaignListItemSchema).max(500),
});
export type CampaignListResponse = z.infer<typeof campaignListResponseSchema>;

export const campaignCreateRequestSchema = z.object({
  sourceModuleId: identifierSchema,
  title: shortTextSchema.optional(),
  slug: slugSchema.optional(),
});
export type CampaignCreateRequest = z.infer<typeof campaignCreateRequestSchema>;

export const campaignErrorSchema = z.object({
  message: z.string().min(1).max(500),
});
export type CampaignError = z.infer<typeof campaignErrorSchema>;

export const campaignBySlugParamsSchema = z.object({
  slug: slugSchema,
});
export type CampaignBySlugParams = z.infer<typeof campaignBySlugParamsSchema>;

export const campaignCreateSessionRequestSchema = z.object({});
export type CampaignCreateSessionRequest = z.infer<
  typeof campaignCreateSessionRequestSchema
>;

export const campaignSessionParamsSchema = z.object({
  slug: slugSchema,
  sessionId: identifierSchema,
});
export type CampaignSessionParams = z.infer<typeof campaignSessionParamsSchema>;

export const campaignDetailSchema = z.intersection(
  adventureModuleDetailSchema,
  z.object({
    campaignId: identifierSchema,
    sourceModuleId: identifierSchema,
    sourceModuleSlug: slugSchema,
    sourceModuleTitle: shortTextSchema,
    createdAtIso: z.string().datetime(),
    updatedAtIso: z.string().datetime(),
    sessions: z.array(campaignSessionSummarySchema).max(200).default([]),
  }),
);
export type CampaignDetail = z.infer<typeof campaignDetailSchema>;

export const campaignGetResponseSchema = campaignDetailSchema;
export type CampaignGetResponse = z.infer<typeof campaignGetResponseSchema>;

export const campaignCreateResponseSchema = campaignDetailSchema;
export type CampaignCreateResponse = z.infer<typeof campaignCreateResponseSchema>;

export const campaignListSessionsResponseSchema = z.object({
  sessions: z.array(campaignSessionSummarySchema).max(200),
});
export type CampaignListSessionsResponse = z.infer<
  typeof campaignListSessionsResponseSchema
>;

export const campaignSessionResponseSchema = campaignSessionDetailSchema;
export type CampaignSessionResponse = z.infer<typeof campaignSessionResponseSchema>;
