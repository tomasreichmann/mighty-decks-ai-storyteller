import { z } from "zod";
import {
  activeVoteSchema,
  adventureStateSchema,
  clientRoleSchema,
  latencyMetricsSchema,
  outcomeCardTypeSchema,
  playerSetupSchema,
  runtimeConfigSchema,
  transcriptEntrySchema,
} from "./adventureState";

export const joinAdventurePayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
  displayName: z.string().min(1).max(50),
  role: clientRoleSchema,
});
export type JoinAdventurePayload = z.infer<typeof joinAdventurePayloadSchema>;

export const leaveAdventurePayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
});
export type LeaveAdventurePayload = z.infer<typeof leaveAdventurePayloadSchema>;

export const submitSetupPayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
  setup: playerSetupSchema,
});
export type SubmitSetupPayload = z.infer<typeof submitSetupPayloadSchema>;

export const toggleReadyPayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
  ready: z.boolean(),
});
export type ToggleReadyPayload = z.infer<typeof toggleReadyPayloadSchema>;

export const castVotePayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
  voteId: z.string().min(1),
  optionId: z.string().min(1),
});
export type CastVotePayload = z.infer<typeof castVotePayloadSchema>;

export const submitActionPayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
  text: z.string().min(1).max(1000),
});
export type SubmitActionPayload = z.infer<typeof submitActionPayloadSchema>;

export const submitMetagameQuestionPayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
  text: z.string().min(1).max(1000),
});
export type SubmitMetagameQuestionPayload = z.infer<
  typeof submitMetagameQuestionPayloadSchema
>;

export const playOutcomeCardPayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
  checkId: z.string().min(1),
  card: outcomeCardTypeSchema,
});
export type PlayOutcomeCardPayload = z.infer<typeof playOutcomeCardPayloadSchema>;

export const endSessionPayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
});
export type EndSessionPayload = z.infer<typeof endSessionPayloadSchema>;

export const continueAdventurePayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
});
export type ContinueAdventurePayload = z.infer<
  typeof continueAdventurePayloadSchema
>;

export const closeAdventurePayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
});
export type CloseAdventurePayload = z.infer<typeof closeAdventurePayloadSchema>;

export const updateRuntimeConfigPayloadSchema = z.object({
  adventureId: z.string().min(1),
  playerId: z.string().min(1),
  runtimeConfig: runtimeConfigSchema.partial(),
});
export type UpdateRuntimeConfigPayload = z.infer<typeof updateRuntimeConfigPayloadSchema>;

export const adventureStatePayloadSchema = adventureStateSchema;
export type AdventureStatePayload = z.infer<typeof adventureStatePayloadSchema>;

export const voteUpdatePayloadSchema = activeVoteSchema;
export type VoteUpdatePayload = z.infer<typeof voteUpdatePayloadSchema>;

export const transcriptAppendPayloadSchema = transcriptEntrySchema;
export type TranscriptAppendPayload = z.infer<typeof transcriptAppendPayloadSchema>;

export const runtimeConfigUpdatedPayloadSchema = runtimeConfigSchema;
export type RuntimeConfigUpdatedPayload = z.infer<typeof runtimeConfigUpdatedPayloadSchema>;

export const latencyMetricsUpdatePayloadSchema = latencyMetricsSchema;
export type LatencyMetricsUpdatePayload = z.infer<typeof latencyMetricsUpdatePayloadSchema>;

export const storytellerThinkingPayloadSchema = z.object({
  active: z.boolean(),
  label: z.string(),
  showInTranscript: z.boolean().optional(),
});
export type StorytellerThinkingPayload = z.infer<
  typeof storytellerThinkingPayloadSchema
>;

export const storytellerResponseChunkPayloadSchema = z.object({
  text: z.string(),
  reset: z.boolean().optional(),
  done: z.boolean().optional(),
});
export type StorytellerResponseChunkPayload = z.infer<
  typeof storytellerResponseChunkPayloadSchema
>;

export type ClientToServerEventName =
  | "join_adventure"
  | "leave_adventure"
  | "submit_setup"
  | "toggle_ready"
  | "cast_vote"
  | "submit_action"
  | "submit_metagame_question"
  | "play_outcome_card"
  | "end_session"
  | "continue_adventure"
  | "close_adventure"
  | "update_runtime_config";

export type ServerToClientEventName =
  | "adventure_state"
  | "player_update"
  | "vote_update"
  | "scene_update"
  | "transcript_append"
  | "runtime_config_updated"
  | "latency_metrics_update"
  | "phase_changed"
  | "storyteller_thinking"
  | "storyteller_response"
  | "storyteller_response_chunk";

export interface ClientToServerEvents {
  join_adventure: (payload: JoinAdventurePayload) => void;
  leave_adventure: (payload: LeaveAdventurePayload) => void;
  submit_setup: (payload: SubmitSetupPayload) => void;
  toggle_ready: (payload: ToggleReadyPayload) => void;
  cast_vote: (payload: CastVotePayload) => void;
  submit_action: (payload: SubmitActionPayload) => void;
  submit_metagame_question: (payload: SubmitMetagameQuestionPayload) => void;
  play_outcome_card: (payload: PlayOutcomeCardPayload) => void;
  end_session: (payload: EndSessionPayload) => void;
  continue_adventure: (payload: ContinueAdventurePayload) => void;
  close_adventure: (payload: CloseAdventurePayload) => void;
  update_runtime_config: (payload: UpdateRuntimeConfigPayload) => void;
}

export interface ServerToClientEvents {
  adventure_state: (payload: AdventureStatePayload) => void;
  player_update: (payload: AdventureStatePayload["roster"]) => void;
  vote_update: (payload: VoteUpdatePayload | null) => void;
  scene_update: (payload: AdventureStatePayload["currentScene"] | null) => void;
  transcript_append: (payload: TranscriptAppendPayload) => void;
  runtime_config_updated: (payload: RuntimeConfigUpdatedPayload) => void;
  latency_metrics_update: (payload: LatencyMetricsUpdatePayload) => void;
  phase_changed: (payload: AdventureStatePayload["phase"]) => void;
  storyteller_thinking: (payload: StorytellerThinkingPayload) => void;
  storyteller_response: (payload: { text: string }) => void;
  storyteller_response_chunk: (payload: StorytellerResponseChunkPayload) => void;
}
