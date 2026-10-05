import { z } from "zod";

const id = <Name extends string>(_name: Name) =>
  z.string().min(1).max(120).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).brand<Name>();

export const campaignRuntimeIdSchema = id("campaign");
export const sessionRuntimeIdSchema = id("session");
export const participantRuntimeIdSchema = id("participant");
export const actorRuntimeIdSchema = id("actor");
export const runIdSchema = id("run");
export const commandIdSchema = id("command");
export const interactionIdSchema = id("interaction");
export const checkpointIdSchema = id("checkpoint");
export const executionEventIdSchema = id("event");
export const modelCallIdSchema = id("model-call");
export const toolCallIdSchema = id("tool-call");

export type CampaignRuntimeId = z.infer<typeof campaignRuntimeIdSchema>;
export type SessionRuntimeId = z.infer<typeof sessionRuntimeIdSchema>;
export type ParticipantRuntimeId = z.infer<typeof participantRuntimeIdSchema>;
export type ActorRuntimeId = z.infer<typeof actorRuntimeIdSchema>;
export type RunId = z.infer<typeof runIdSchema>;
export type CommandId = z.infer<typeof commandIdSchema>;
export type InteractionId = z.infer<typeof interactionIdSchema>;
export type CheckpointId = z.infer<typeof checkpointIdSchema>;
export type ExecutionEventId = z.infer<typeof executionEventIdSchema>;
export type ModelCallId = z.infer<typeof modelCallIdSchema>;
export type ToolCallId = z.infer<typeof toolCallIdSchema>;

export const canonicalPositionSchema = z.object({
  branchId: z.string().min(1),
  commit: z.number().int().nonnegative(),
}).strict();
export type CanonicalPosition = z.infer<typeof canonicalPositionSchema>;

export const sessionScopeSchema = z.object({
  campaignId: campaignRuntimeIdSchema,
  sessionId: sessionRuntimeIdSchema,
}).strict();
export type SessionScope = z.infer<typeof sessionScopeSchema>;
