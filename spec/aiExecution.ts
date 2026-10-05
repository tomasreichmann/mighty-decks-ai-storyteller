import { z } from "zod";
import {
  canonicalPositionSchema, checkpointIdSchema, commandIdSchema,
  executionEventIdSchema, interactionIdSchema, modelCallIdSchema,
  runIdSchema, sessionScopeSchema, toolCallIdSchema,
} from "./aiRuntimeIds";
import { modelPresetIdSchema } from "./aiModelPresets";

export const runCorrelationSchema = sessionScopeSchema.extend({
  runId: runIdSchema.optional(),
  commandId: commandIdSchema.optional(),
  spanId: z.string().min(1),
  parentSpanId: z.string().min(1).optional(),
  causationEventId: executionEventIdSchema.optional(),
  modelCallId: modelCallIdSchema.optional(),
  toolCallId: toolCallIdSchema.optional(),
  interactionId: interactionIdSchema.optional(),
  checkpointId: checkpointIdSchema.optional(),
}).strict();
export type RunCorrelation = z.infer<typeof runCorrelationSchema>;

export const runtimeStepKindSchema = z.enum([
  "trigger", "classifier", "decision", "context", "prompt", "model_call",
  "tool_call", "wait", "queue", "interrupt", "checkpoint", "restore", "output",
]);
export type RuntimeStepKind = z.infer<typeof runtimeStepKindSchema>;

const eventBase = z.object({
  schemaVersion: z.literal(1),
  eventId: executionEventIdSchema,
  sequence: z.number().int().nonnegative(),
  atIso: z.string().datetime(),
  step: runtimeStepKindSchema,
  correlation: runCorrelationSchema,
  canonicalPosition: canonicalPositionSchema.optional(),
});

export const executionEventSchema = z.discriminatedUnion("type", [
  eventBase.extend({ type: z.literal("run.started"), payload: z.object({
    runId: runIdSchema, commandId: commandIdSchema, generation: z.number().int().nonnegative(),
  }).strict() }).strict(),
  eventBase.extend({ type: z.literal("model.requested"), payload: z.object({
    callId: modelCallIdSchema, presetId: modelPresetIdSchema,
    promptDocumentId: z.string().min(1),
  }).strict() }).strict(),
  eventBase.extend({ type: z.literal("model.completed"), payload: z.object({
    callId: modelCallIdSchema, status: z.enum(["completed", "failed", "canceled", "discarded"]),
  }).strict() }).strict(),
  eventBase.extend({ type: z.literal("state.committed"), payload: z.object({
    gameRevision: z.number().int().nonnegative(),
    position: canonicalPositionSchema,
  }).strict() }).strict(),
]);
export type ExecutionEvent = z.infer<typeof executionEventSchema>;
