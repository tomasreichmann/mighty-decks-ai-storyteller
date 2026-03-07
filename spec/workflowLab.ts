import { z } from "zod";

const jsonPrimitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type JsonPrimitive = z.infer<typeof jsonPrimitiveSchema>;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([jsonPrimitiveSchema, z.array(jsonValueSchema), z.record(jsonValueSchema)]),
);

export const workflowModelSlotSchema = z.enum([
  "fast_text_model",
  "hq_text_model",
  "fast_tool_model",
  "hq_tool_model",
  "fast_image_model",
  "hq_image_model",
  "fast_vision_model",
  "hq_vision_model",
  "fast_tts_model",
  "hq_tts_model",
  "fast_stt_model",
  "hq_stt_model",
]);
export type WorkflowModelSlot = z.infer<typeof workflowModelSlotSchema>;

export const workflowModelPreferencesSchema = z.object({
  fast_text_model: z.string().min(1).optional(),
  hq_text_model: z.string().min(1).optional(),
  fast_tool_model: z.string().min(1).optional(),
  hq_tool_model: z.string().min(1).optional(),
  fast_image_model: z.string().min(1).optional(),
  hq_image_model: z.string().min(1).optional(),
  fast_vision_model: z.string().min(1).optional(),
  hq_vision_model: z.string().min(1).optional(),
  fast_tts_model: z.string().min(1).optional(),
  hq_tts_model: z.string().min(1).optional(),
  fast_stt_model: z.string().min(1).optional(),
  hq_stt_model: z.string().min(1).optional(),
});
export type WorkflowModelPreferences = z.infer<
  typeof workflowModelPreferencesSchema
>;

export const workflowStepKindSchema = z.enum([
  "llm_text",
  "llm_image",
  "tts",
  "stt",
  "code",
  "map",
]);
export type WorkflowStepKind = z.infer<typeof workflowStepKindSchema>;

export const workflowStepStatusSchema = z.enum([
  "pending",
  "ready",
  "running",
  "succeeded",
  "failed",
  "skipped",
  "stale",
]);
export type WorkflowStepStatus = z.infer<typeof workflowStepStatusSchema>;

export const workflowRunStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "timed_out",
]);
export type WorkflowRunStatus = z.infer<typeof workflowRunStatusSchema>;

export const workflowStepManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(200).regex(/^[^\r\n]+$/),
  kind: workflowStepKindSchema,
  tags: z.array(z.string().min(1).max(40)).default([]),
});
export type WorkflowStepManifest = z.infer<typeof workflowStepManifestSchema>;

export const workflowEdgeManifestSchema = z.object({
  fromStepId: z.string().min(1),
  toStepId: z.string().min(1),
  conditionLabel: z.string().min(1).max(120).optional(),
});
export type WorkflowEdgeManifest = z.infer<typeof workflowEdgeManifestSchema>;

export const workflowLabWorkflowManifestSchema = z.object({
  workflowId: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  version: z.string().min(1).max(40).default("1"),
  description: z.string().min(1).max(400),
  inputSchema: jsonValueSchema.optional(),
  defaultInputExample: jsonValueSchema.optional(),
  defaultRunTimeoutMs: z.number().int().positive().max(3_600_000).optional(),
  defaultModelOverrides: workflowModelPreferencesSchema.optional(),
  steps: z.array(workflowStepManifestSchema).default([]),
  edges: z.array(workflowEdgeManifestSchema).default([]),
});
export type WorkflowLabWorkflowManifest = z.infer<
  typeof workflowLabWorkflowManifestSchema
>;

export const workflowLabListResponseSchema = z.object({
  workflows: z.array(workflowLabWorkflowManifestSchema),
});
export type WorkflowLabListResponse = z.infer<typeof workflowLabListResponseSchema>;

export const workflowLabStartRunRequestSchema = z.object({
  workflowId: z.string().min(1),
  input: jsonValueSchema.default({}),
  timeoutMs: z.number().int().positive().max(3_600_000).optional(),
  modelOverrides: workflowModelPreferencesSchema.optional(),
});
export type WorkflowLabStartRunRequest = z.infer<
  typeof workflowLabStartRunRequestSchema
>;

export const workflowLabStartRunResponseSchema = z.object({
  runId: z.string().min(1),
});
export type WorkflowLabStartRunResponse = z.infer<
  typeof workflowLabStartRunResponseSchema
>;

export const workflowLabUsageSummarySchema = z.object({
  promptTokens: z.number().int().nonnegative().optional(),
  completionTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  cachedTokens: z.number().int().nonnegative().optional(),
  reasoningTokens: z.number().int().nonnegative().optional(),
  costCredits: z.number().nonnegative().optional(),
});
export type WorkflowLabUsageSummary = z.infer<typeof workflowLabUsageSummarySchema>;

export const workflowLabStepAttemptSchema = z.object({
  attempt: z.number().int().min(1),
  startedAtIso: z.string().datetime(),
  endedAtIso: z.string().datetime().optional(),
  status: z.enum(["started", "succeeded", "failed", "timeout"]),
  timeoutMs: z.number().int().positive(),
  retryCount: z.number().int().min(0),
  modelSlot: workflowModelSlotSchema.optional(),
  modelId: z.string().min(1).optional(),
  request: jsonValueSchema.optional(),
  requestSummary: z.string().min(1).max(4000).optional(),
  result: jsonValueSchema.optional(),
  resultSummary: z.string().min(1).max(4000).optional(),
  usage: workflowLabUsageSummarySchema.optional(),
  error: z.string().min(1).max(4000).optional(),
});
export type WorkflowLabStepAttempt = z.infer<typeof workflowLabStepAttemptSchema>;

export const workflowLabStepSnapshotSchema = workflowStepManifestSchema.extend({
  status: workflowStepStatusSchema,
  joinPolicy: z.enum(["all", "any"]).default("all"),
  timeoutMs: z.number().int().positive(),
  retryCount: z.number().int().min(0),
  priority: z.number().int().optional(),
  dependsOn: z.array(z.string().min(1)).default([]),
  output: jsonValueSchema.optional(),
  error: z.string().min(1).max(4000).optional(),
  staleReason: z.string().min(1).max(400).optional(),
  attempts: z.array(workflowLabStepAttemptSchema).default([]),
});
export type WorkflowLabStepSnapshot = z.infer<typeof workflowLabStepSnapshotSchema>;

export const workflowLabRunSnapshotSchema = z.object({
  runId: z.string().min(1),
  workflowId: z.string().min(1),
  workflowName: z.string().min(1).max(120),
  status: workflowRunStatusSchema,
  createdAtIso: z.string().datetime(),
  startedAtIso: z.string().datetime().optional(),
  endedAtIso: z.string().datetime().optional(),
  timeoutMs: z.number().int().positive(),
  deadlineAtIso: z.string().datetime().optional(),
  input: jsonValueSchema,
  sharedState: jsonValueSchema.optional(),
  outputs: z.record(jsonValueSchema).default({}),
  modelPreferences: workflowModelPreferencesSchema.default({}),
  steps: z.array(workflowLabStepSnapshotSchema),
  eventCount: z.number().int().nonnegative().default(0),
});
export type WorkflowLabRunSnapshot = z.infer<typeof workflowLabRunSnapshotSchema>;

const workflowLabEventBaseSchema = z.object({
  seq: z.number().int().nonnegative(),
  runId: z.string().min(1),
  workflowId: z.string().min(1),
  createdAtIso: z.string().datetime(),
});

export const workflowLabRunStartedEventSchema = workflowLabEventBaseSchema.extend({
  type: z.literal("run_started"),
  timeoutMs: z.number().int().positive(),
  deadlineAtIso: z.string().datetime(),
});

export const workflowLabStepReadyEventSchema = workflowLabEventBaseSchema.extend({
  type: z.literal("step_ready"),
  stepId: z.string().min(1),
});

export const workflowLabStepStartedEventSchema = workflowLabEventBaseSchema.extend({
  type: z.literal("step_started"),
  stepId: z.string().min(1),
  attempt: z.number().int().min(1),
});

export const workflowLabStepProgressEventSchema = workflowLabEventBaseSchema.extend({
  type: z.literal("step_progress"),
  stepId: z.string().min(1),
  attempt: z.number().int().min(1),
  message: z.string().min(1).max(4000).optional(),
  chunk: z.string().max(4000).optional(),
  data: jsonValueSchema.optional(),
});

export const workflowLabStepSucceededEventSchema = workflowLabEventBaseSchema.extend({
  type: z.literal("step_succeeded"),
  stepId: z.string().min(1),
  attempt: z.number().int().min(1),
  resultSummary: z.string().min(1).max(4000).optional(),
  usage: workflowLabUsageSummarySchema.optional(),
});

export const workflowLabStepFailedEventSchema = workflowLabEventBaseSchema.extend({
  type: z.literal("step_failed"),
  stepId: z.string().min(1),
  attempt: z.number().int().min(1),
  error: z.string().min(1).max(4000),
  timeout: z.boolean().default(false),
});

export const workflowLabStepSkippedEventSchema = workflowLabEventBaseSchema.extend({
  type: z.literal("step_skipped"),
  stepId: z.string().min(1),
  reason: z.string().min(1).max(400),
});

export const workflowLabStepInvalidatedEventSchema = workflowLabEventBaseSchema.extend({
  type: z.literal("step_invalidated"),
  stepId: z.string().min(1),
  reason: z.string().min(1).max(400),
});

export const workflowLabRunCompletedEventSchema = workflowLabEventBaseSchema.extend({
  type: z.literal("run_completed"),
});

export const workflowLabRunFailedEventSchema = workflowLabEventBaseSchema.extend({
  type: z.literal("run_failed"),
  error: z.string().min(1).max(4000),
});

export const workflowLabRunTimedOutEventSchema = workflowLabEventBaseSchema.extend({
  type: z.literal("run_timed_out"),
  error: z.string().min(1).max(4000),
});

export const workflowLabRunEventSchema = z.discriminatedUnion("type", [
  workflowLabRunStartedEventSchema,
  workflowLabStepReadyEventSchema,
  workflowLabStepStartedEventSchema,
  workflowLabStepProgressEventSchema,
  workflowLabStepSucceededEventSchema,
  workflowLabStepFailedEventSchema,
  workflowLabStepSkippedEventSchema,
  workflowLabStepInvalidatedEventSchema,
  workflowLabRunCompletedEventSchema,
  workflowLabRunFailedEventSchema,
  workflowLabRunTimedOutEventSchema,
]);
export type WorkflowLabRunEvent = z.infer<typeof workflowLabRunEventSchema>;

export const workflowLabInvalidateRequestSchema = z.object({
  stepIds: z.array(z.string().min(1)).min(1),
  reason: z.string().min(1).max(400).default("manual invalidate"),
  includeDependents: z.boolean().default(true),
});
export type WorkflowLabInvalidateRequest = z.infer<
  typeof workflowLabInvalidateRequestSchema
>;

export const workflowLabRerunRequestSchema = z.object({
  fromInvalidatedOnly: z.boolean().default(true),
  timeoutMs: z.number().int().positive().max(3_600_000).optional(),
  modelOverrides: workflowModelPreferencesSchema.optional(),
});
export type WorkflowLabRerunRequest = z.infer<typeof workflowLabRerunRequestSchema>;

export const workflowLabStopRunRequestSchema = z.object({
  reason: z.string().min(1).max(400).default("manual stop"),
});
export type WorkflowLabStopRunRequest = z.infer<
  typeof workflowLabStopRunRequestSchema
>;

export const workflowLabErrorSchema = z.object({
  message: z.string().min(1),
});
export type WorkflowLabError = z.infer<typeof workflowLabErrorSchema>;
