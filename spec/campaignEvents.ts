import { z } from "zod";
import {
  campaignSessionTableCardReferenceSchema,
  campaignSessionDetailSchema,
  campaignSessionParticipantRoleSchema,
  campaignSessionTableTargetSchema,
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
}

export interface CampaignServerToClientEvents {
  campaign_updated: (payload: CampaignUpdatedPayload) => void;
  campaign_session_state: (payload: CampaignSessionStatePayload) => void;
  campaign_session_error: (payload: CampaignSessionErrorPayload) => void;
}
