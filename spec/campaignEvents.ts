import { z } from "zod";
import {
  campaignSessionTableCardReferenceSchema,
  campaignSessionDetailSchema,
  campaignSessionParticipantRoleSchema,
  campaignSessionTableTargetSchema,
  worldbuildingMotifStanceSchema,
  worldbuildingPhaseSchema,
  worldbuildingProposalKindSchema,
} from "./campaign";

const identifierSchema = z.string().min(1).max(120);
const shortTextSchema = z.string().min(1).max(120);
const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");

const sessionLocatorSchema = z.object({
  campaignSlug: slugSchema,
  sessionId: identifierSchema,
});

export const watchCampaignPayloadSchema = z.object({
  campaignSlug: slugSchema,
});
export type WatchCampaignPayload = z.infer<typeof watchCampaignPayloadSchema>;

export const joinCampaignSessionPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
});
export type JoinCampaignSessionPayload = z.infer<
  typeof joinCampaignSessionPayloadSchema
>;

export const leaveCampaignSessionPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
});
export type LeaveCampaignSessionPayload = z.infer<
  typeof leaveCampaignSessionPayloadSchema
>;

export const joinCampaignSessionRolePayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  displayName: shortTextSchema,
  role: campaignSessionParticipantRoleSchema,
});
export type JoinCampaignSessionRolePayload = z.infer<
  typeof joinCampaignSessionRolePayloadSchema
>;

export const addCampaignSessionMockPayloadSchema = sessionLocatorSchema.extend({
  displayName: shortTextSchema,
  role: campaignSessionParticipantRoleSchema,
});
export type AddCampaignSessionMockPayload = z.infer<
  typeof addCampaignSessionMockPayloadSchema
>;

export const claimCampaignSessionCharacterPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  actorFragmentId: identifierSchema,
});
export type ClaimCampaignSessionCharacterPayload = z.infer<
  typeof claimCampaignSessionCharacterPayloadSchema
>;

export const createCampaignSessionCharacterPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  title: shortTextSchema,
});
export type CreateCampaignSessionCharacterPayload = z.infer<
  typeof createCampaignSessionCharacterPayloadSchema
>;

export const sendCampaignSessionMessagePayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  text: z.string().min(1).max(4000),
});
export type SendCampaignSessionMessagePayload = z.infer<
  typeof sendCampaignSessionMessagePayloadSchema
>;

export const closeCampaignSessionPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
});
export type CloseCampaignSessionPayload = z.infer<
  typeof closeCampaignSessionPayloadSchema
>;

export const addCampaignSessionTableCardsPayloadSchema = sessionLocatorSchema.extend(
  {
    participantId: identifierSchema,
    target: campaignSessionTableTargetSchema,
    cards: z.array(campaignSessionTableCardReferenceSchema).min(1).max(80),
  },
);
export type AddCampaignSessionTableCardsPayload = z.infer<
  typeof addCampaignSessionTableCardsPayloadSchema
>;

export const removeCampaignSessionTableCardPayloadSchema = sessionLocatorSchema.extend(
  {
    participantId: identifierSchema,
    tableEntryId: identifierSchema,
  },
);
export type RemoveCampaignSessionTableCardPayload = z.infer<
  typeof removeCampaignSessionTableCardPayloadSchema
>;

export const drawCampaignSessionOutcomeCardPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
});
export type DrawCampaignSessionOutcomeCardPayload = z.infer<
  typeof drawCampaignSessionOutcomeCardPayloadSchema
>;

export const shuffleCampaignSessionOutcomeDeckPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
});
export type ShuffleCampaignSessionOutcomeDeckPayload = z.infer<
  typeof shuffleCampaignSessionOutcomeDeckPayloadSchema
>;

export const playCampaignSessionOutcomeCardsPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  cardIds: z.array(identifierSchema).min(1).max(80),
});
export type PlayCampaignSessionOutcomeCardsPayload = z.infer<
  typeof playCampaignSessionOutcomeCardsPayloadSchema
>;

export const commitWorldbuildingThemePayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  theme: z.string().min(1).max(1000),
});
export type CommitWorldbuildingThemePayload = z.infer<
  typeof commitWorldbuildingThemePayloadSchema
>;

export const submitWorldbuildingMotifPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  stance: worldbuildingMotifStanceSchema,
  title: shortTextSchema,
  summary: z.string().max(1000).optional(),
});
export type SubmitWorldbuildingMotifPayload = z.infer<
  typeof submitWorldbuildingMotifPayloadSchema
>;

export const addWorldbuildingProposalPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  kind: worldbuildingProposalKindSchema.exclude(["theme", "motif"]),
  title: shortTextSchema,
  summary: z.string().min(1).max(1000),
  imageUrl: z.string().min(1).max(500).optional(),
});
export type AddWorldbuildingProposalPayload = z.infer<
  typeof addWorldbuildingProposalPayloadSchema
>;

export const advanceWorldbuildingPhasePayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  phase: worldbuildingPhaseSchema,
});
export type AdvanceWorldbuildingPhasePayload = z.infer<
  typeof advanceWorldbuildingPhasePayloadSchema
>;

export const acceptWorldbuildingProposalPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  proposalId: identifierSchema,
});
export type AcceptWorldbuildingProposalPayload = z.infer<
  typeof acceptWorldbuildingProposalPayloadSchema
>;

export const rejectWorldbuildingProposalPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  proposalId: identifierSchema,
});
export type RejectWorldbuildingProposalPayload = z.infer<
  typeof rejectWorldbuildingProposalPayloadSchema
>;

export const importWorldbuildingResultPayloadSchema = sessionLocatorSchema.extend({
  participantId: identifierSchema,
  proposalIds: z.array(identifierSchema).min(1).max(100),
});
export type ImportWorldbuildingResultPayload = z.infer<
  typeof importWorldbuildingResultPayloadSchema
>;

export const campaignUpdatedPayloadSchema = z.object({
  campaignSlug: slugSchema,
  updatedAtIso: z.string().datetime(),
});
export type CampaignUpdatedPayload = z.infer<typeof campaignUpdatedPayloadSchema>;

export const campaignSessionErrorPayloadSchema = z.object({
  message: z.string().min(1).max(500),
});
export type CampaignSessionErrorPayload = z.infer<
  typeof campaignSessionErrorPayloadSchema
>;

export const campaignSessionStatePayloadSchema = campaignSessionDetailSchema;
export type CampaignSessionStatePayload = z.infer<
  typeof campaignSessionStatePayloadSchema
>;

export interface CampaignClientToServerEvents {
  watch_campaign: (payload: WatchCampaignPayload) => void;
  unwatch_campaign: (payload: WatchCampaignPayload) => void;
  join_campaign_session: (payload: JoinCampaignSessionPayload) => void;
  leave_campaign_session: (payload: LeaveCampaignSessionPayload) => void;
  join_campaign_session_role: (payload: JoinCampaignSessionRolePayload) => void;
  add_campaign_session_mock: (payload: AddCampaignSessionMockPayload) => void;
  claim_campaign_session_character: (
    payload: ClaimCampaignSessionCharacterPayload,
  ) => void;
  create_campaign_session_character: (
    payload: CreateCampaignSessionCharacterPayload,
  ) => void;
  send_campaign_session_message: (payload: SendCampaignSessionMessagePayload) => void;
  close_campaign_session: (payload: CloseCampaignSessionPayload) => void;
  add_campaign_session_table_cards: (
    payload: AddCampaignSessionTableCardsPayload,
  ) => void;
  remove_campaign_session_table_card: (
    payload: RemoveCampaignSessionTableCardPayload,
  ) => void;
  draw_campaign_session_outcome_card: (
    payload: DrawCampaignSessionOutcomeCardPayload,
  ) => void;
  shuffle_campaign_session_outcome_deck: (
    payload: ShuffleCampaignSessionOutcomeDeckPayload,
  ) => void;
  play_campaign_session_outcome_cards: (
    payload: PlayCampaignSessionOutcomeCardsPayload,
  ) => void;
  commit_worldbuilding_theme: (payload: CommitWorldbuildingThemePayload) => void;
  submit_worldbuilding_motif: (payload: SubmitWorldbuildingMotifPayload) => void;
  add_worldbuilding_proposal: (payload: AddWorldbuildingProposalPayload) => void;
  advance_worldbuilding_phase: (payload: AdvanceWorldbuildingPhasePayload) => void;
  accept_worldbuilding_proposal: (
    payload: AcceptWorldbuildingProposalPayload,
  ) => void;
  reject_worldbuilding_proposal: (
    payload: RejectWorldbuildingProposalPayload,
  ) => void;
  import_worldbuilding_result: (payload: ImportWorldbuildingResultPayload) => void;
}

export interface CampaignServerToClientEvents {
  campaign_updated: (payload: CampaignUpdatedPayload) => void;
  campaign_session_state: (payload: CampaignSessionStatePayload) => void;
  campaign_session_error: (payload: CampaignSessionErrorPayload) => void;
}
