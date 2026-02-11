import { z } from "zod";

export const adventurePhaseSchema = z.enum(["lobby", "vote", "play", "ending"]);
export type AdventurePhase = z.infer<typeof adventurePhaseSchema>;

export const clientRoleSchema = z.enum(["player", "screen"]);
export type ClientRole = z.infer<typeof clientRoleSchema>;

export const playerIdentitySchema = z.object({
  playerId: z.string().min(1),
  displayName: z.string().min(1).max(50),
  role: clientRoleSchema,
});
export type PlayerIdentity = z.infer<typeof playerIdentitySchema>;

export const playerSetupSchema = z.object({
  characterName: z.string().min(1).max(100),
  visualDescription: z.string().min(1).max(400),
  adventurePreference: z.string().max(500).default(""),
});
export type PlayerSetup = z.infer<typeof playerSetupSchema>;

export const rosterEntrySchema = playerIdentitySchema.extend({
  connected: z.boolean().default(true),
  ready: z.boolean().default(false),
  hasVoted: z.boolean().default(false),
  setup: playerSetupSchema.optional(),
});
export type RosterEntry = z.infer<typeof rosterEntrySchema>;

export const voteKindSchema = z.enum(["adventure_pitch", "scene_transition"]);
export type VoteKind = z.infer<typeof voteKindSchema>;

export const voteOptionSchema = z.object({
  optionId: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(400),
  voteCount: z.number().int().nonnegative().default(0),
});
export type VoteOption = z.infer<typeof voteOptionSchema>;

export const voteResolutionSchema = z.object({
  winnerOptionId: z.string().min(1),
  timeoutClosed: z.boolean().default(false),
  tieBreakApplied: z.boolean().default(false),
  tiedOptionIds: z.array(z.string()).default([]),
});
export type VoteResolution = z.infer<typeof voteResolutionSchema>;

export const activeVoteSchema = z.object({
  voteId: z.string().min(1),
  kind: voteKindSchema,
  title: z.string().min(1).max(120),
  prompt: z.string().min(1).max(500),
  options: z.array(voteOptionSchema).min(2).max(5),
  startedAtIso: z.string().datetime(),
  timeoutMs: z.number().int().positive(),
  closesAtIso: z.string().datetime(),
  resolution: voteResolutionSchema.optional(),
});
export type ActiveVote = z.infer<typeof activeVoteSchema>;

export const scenePublicSchema = z.object({
  sceneId: z.string().min(1),
  imageUrl: z.string().url().optional(),
  imagePending: z.boolean().default(false),
  introProse: z.string().min(1),
  orientationBullets: z.array(z.string().min(1)).min(2).max(4),
  summary: z.string().optional(),
});
export type ScenePublic = z.infer<typeof scenePublicSchema>;

export const outcomeCardTypeSchema = z.enum([
  "success",
  "partial-success",
  "special-action",
  "chaos",
  "fumble",
]);
export type OutcomeCardType = z.infer<typeof outcomeCardTypeSchema>;

export const outcomeCheckSourceSchema = z.enum(["player_action", "npc_move", "hazard"]);
export type OutcomeCheckSource = z.infer<typeof outcomeCheckSourceSchema>;

export const outcomeCheckTargetSchema = z.object({
  playerId: z.string().min(1),
  displayName: z.string().min(1).max(50),
  playedCard: outcomeCardTypeSchema.optional(),
  playedAtIso: z.string().datetime().optional(),
});
export type OutcomeCheckTarget = z.infer<typeof outcomeCheckTargetSchema>;

export const activeOutcomeCheckSchema = z.object({
  checkId: z.string().min(1),
  source: outcomeCheckSourceSchema,
  prompt: z.string().min(1).max(500),
  requestedAtIso: z.string().datetime(),
  targets: z.array(outcomeCheckTargetSchema).min(1).max(5),
});
export type ActiveOutcomeCheck = z.infer<typeof activeOutcomeCheckSchema>;

export const aiRequestAgentSchema = z.enum([
  "pitch_generator",
  "narrative_director",
  "scene_controller",
  "continuity_keeper",
  "image_generator",
]);
export type AiRequestAgent = z.infer<typeof aiRequestAgentSchema>;

export const aiRequestStatusSchema = z.enum(["started", "succeeded", "failed", "timeout"]);
export type AiRequestStatus = z.infer<typeof aiRequestStatusSchema>;

export const aiRequestLogEntrySchema = z.object({
  requestId: z.string().min(1),
  createdAtIso: z.string().datetime(),
  agent: aiRequestAgentSchema,
  kind: z.enum(["text", "image"]),
  model: z.string().min(1),
  timeoutMs: z.number().int().positive(),
  attempt: z.number().int().min(1),
  fallback: z.boolean().default(false),
  status: aiRequestStatusSchema,
  prompt: z.string().min(1).optional(),
  response: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
});
export type AiRequestLogEntry = z.infer<typeof aiRequestLogEntrySchema>;

export const sceneDebugSchema = z.object({
  tension: z.number().min(0).max(100).optional(),
  secrets: z.array(z.string()).default([]),
  pacingNotes: z.array(z.string()).default([]),
  continuityWarnings: z.array(z.string()).default([]),
  aiRequests: z.array(aiRequestLogEntrySchema).default([]),
});
export type SceneDebug = z.infer<typeof sceneDebugSchema>;

export const transcriptEntrySchema = z.object({
  entryId: z.string().min(1),
  kind: z.enum(["system", "storyteller", "player"]),
  author: z.string().min(1),
  text: z.string().min(1),
  createdAtIso: z.string().datetime(),
});
export type TranscriptEntry = z.infer<typeof transcriptEntrySchema>;

export const runtimeConfigSchema = z.object({
  textCallTimeoutMs: z.number().int().min(1000).max(60000),
  turnDeadlineMs: z.number().int().min(2000).max(120000),
  imageTimeoutMs: z.number().int().min(1000).max(300000),
  aiRetryCount: z.number().int().min(0).max(3),
  voteTimeoutMs: z.number().int().min(5000).max(60000),
});
export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

export const latencyMetricsSchema = z.object({
  actionCount: z.number().int().nonnegative(),
  averageMs: z.number().nonnegative(),
  p90Ms: z.number().nonnegative(),
  updatedAtIso: z.string().datetime(),
});
export type LatencyMetrics = z.infer<typeof latencyMetricsSchema>;

export const adventureStateSchema = z.object({
  adventureId: z.string().min(1),
  phase: adventurePhaseSchema,
  roster: z.array(rosterEntrySchema),
  activeVote: activeVoteSchema.optional(),
  activeOutcomeCheck: activeOutcomeCheckSchema.optional(),
  currentScene: scenePublicSchema.optional(),
  transcript: z.array(transcriptEntrySchema),
  sessionSummary: z.string().optional(),
  debugScene: sceneDebugSchema.optional(),
  runtimeConfig: runtimeConfigSchema,
  latencyMetrics: latencyMetricsSchema,
  debugMode: z.boolean().default(false),
  closed: z.boolean().default(false),
});
export type AdventureState = z.infer<typeof adventureStateSchema>;

export const defaultRuntimeConfig: RuntimeConfig = {
  textCallTimeoutMs: 20000,
  turnDeadlineMs: 18000,
  imageTimeoutMs: 180000,
  aiRetryCount: 1,
  voteTimeoutMs: 20000,
};

export const defaultLatencyMetrics: LatencyMetrics = {
  actionCount: 0,
  averageMs: 0,
  p90Ms: 0,
  updatedAtIso: new Date(0).toISOString(),
};
