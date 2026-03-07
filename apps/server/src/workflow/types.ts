import type { z } from "zod";
import type {
  JsonValue,
  WorkflowLabUsageSummary,
  WorkflowModelPreferences,
  WorkflowModelSlot,
} from "@mighty-decks/spec/workflowLab";

export type {
  JsonValue,
  WorkflowLabUsageSummary,
  WorkflowModelPreferences,
  WorkflowModelSlot,
} from "@mighty-decks/spec/workflowLab";

export type WorkflowStepKind =
  | "llm_text"
  | "llm_image"
  | "tts"
  | "stt"
  | "code"
  | "map";

export type WorkflowJoinPolicy = "all" | "any";
export type WorkflowRunStatus = "pending" | "running" | "completed" | "failed" | "timed_out";
export type WorkflowStepStatus =
  | "pending"
  | "ready"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped"
  | "stale";

export interface WorkflowModelRegistry {
  fast_text_model: string;
  hq_text_model: string;
  fast_tool_model: string;
  hq_tool_model: string;
  fast_image_model: string;
  hq_image_model: string;
  fast_vision_model: string;
  hq_vision_model: string;
  fast_tts_model: string;
  hq_tts_model: string;
  fast_stt_model: string;
  hq_stt_model: string;
}

export interface WorkflowStepTimeoutDefaults {
  llm_text: {
    text: number;
    tool: number;
    vision: number;
  };
  llm_image: number;
  tts: number;
  stt: number;
  code: number;
  map: number;
}

export interface WorkflowExecutionDefaults {
  runTimeoutMs: number;
  defaultRetryCount: number;
  stepTimeoutMs: WorkflowStepTimeoutDefaults;
}

export interface WorkflowRunOptions {
  timeoutMs?: number;
  modelOverrides?: WorkflowModelPreferences;
  maxConcurrency?: number;
  maxTextConcurrency?: number;
  maxImageConcurrency?: number;
  maxCodeConcurrency?: number;
}

export interface WorkflowEdgeDef {
  fromStepId: string;
  toStepId: string;
  conditionLabel?: string;
  when?: (args: {
    sourceOutput: JsonValue | undefined;
    sharedState: JsonValue | undefined;
    input: JsonValue;
    steps: Record<string, JsonValue | undefined>;
  }) => boolean;
}

export interface WorkflowStepBase {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  kind: WorkflowStepKind;
  joinPolicy?: WorkflowJoinPolicy;
  timeoutMs?: number;
  retryCount?: number;
  retryBackoffMs?: number;
  priority?: number;
}

export interface WorkflowStepHelpers {
  readonly input: JsonValue;
  readonly sharedState: JsonValue | undefined;
  getStepOutput(stepId: string): JsonValue | undefined;
  emitProgress(payload: {
    message?: string;
    chunk?: string;
    data?: JsonValue;
  }): void;
  patchSharedState(patch: Record<string, JsonValue>): void;
}

export interface WorkflowTextAdapterRequest {
  modelId: string;
  prompt: string;
  timeoutMs: number;
  signal: AbortSignal;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
}

export interface WorkflowTextAdapterResult {
  text: string | null;
  usage?: WorkflowLabUsageSummary;
  rawResponse?: JsonValue;
}

export interface WorkflowImageAdapterRequest {
  modelId: string;
  prompt: string;
  timeoutMs: number;
  signal: AbortSignal;
}

export interface WorkflowImageAdapterResult {
  imageUrl: string | null;
  usage?: WorkflowLabUsageSummary;
  rawResponse?: JsonValue;
}

export interface WorkflowTtsAdapterRequest {
  modelId: string;
  text: string;
  timeoutMs: number;
  signal: AbortSignal;
  voiceId?: string;
  format?: string;
  options?: Record<string, JsonValue>;
}

export interface WorkflowTtsAdapterResult {
  audioUrl: string | null;
  durationSeconds?: number;
  rawResponse?: JsonValue;
}

export interface WorkflowSttAdapterRequest {
  modelId: string;
  audioUrl: string;
  timeoutMs: number;
  signal: AbortSignal;
  language?: string;
  options?: Record<string, JsonValue>;
}

export interface WorkflowSttAdapterResult {
  text: string;
  segments?: JsonValue;
  rawResponse?: JsonValue;
}

export interface WorkflowExternalAdapters {
  text: (request: WorkflowTextAdapterRequest) => Promise<WorkflowTextAdapterResult>;
  image: (request: WorkflowImageAdapterRequest) => Promise<WorkflowImageAdapterResult>;
  tts: (request: WorkflowTtsAdapterRequest) => Promise<WorkflowTtsAdapterResult>;
  stt: (request: WorkflowSttAdapterRequest) => Promise<WorkflowSttAdapterResult>;
}

export interface WorkflowRunContext extends WorkflowStepHelpers {
  readonly abortSignal: AbortSignal;
  readonly deadlineAtMs: number;
  readonly stepId: string;
  readonly attempt: number;
  readonly modelPreferences: WorkflowModelPreferences;
  resolveModel(slot: WorkflowModelSlot, overrideModelId?: string): string;
  adapters: WorkflowExternalAdapters;
}

export type JsonSelector<T = JsonValue | undefined> = (helpers: WorkflowStepHelpers) => T;

export type PromptBuilder = (helpers: WorkflowStepHelpers) => string;
export type StringSelector = (helpers: WorkflowStepHelpers) => string;

export interface LlmTextStepDef extends WorkflowStepBase {
  kind: "llm_text";
  mode?: "text" | "tool" | "vision";
  modelSlot?: WorkflowModelSlot;
  modelIdOverride?: string;
  prompt?: string;
  buildPrompt?: PromptBuilder;
  maxTokens?: number;
  temperature?: number;
  outputSchema?: z.ZodType<JsonValue>;
  stream?: boolean;
}

export interface LlmImageStepDef extends WorkflowStepBase {
  kind: "llm_image";
  modelSlot?: WorkflowModelSlot;
  modelIdOverride?: string;
  prompt?: string;
  buildPrompt?: PromptBuilder;
}

export interface TtsStepDef extends WorkflowStepBase {
  kind: "tts";
  modelSlot?: WorkflowModelSlot;
  modelIdOverride?: string;
  text?: string;
  getText?: StringSelector;
  voiceId?: string;
  format?: string;
  options?: Record<string, JsonValue>;
}

export interface SttStepDef extends WorkflowStepBase {
  kind: "stt";
  modelSlot?: WorkflowModelSlot;
  modelIdOverride?: string;
  audioUrl?: string;
  getAudioUrl?: StringSelector;
  language?: string;
  options?: Record<string, JsonValue>;
}

export interface CodeStepResult {
  output?: JsonValue;
  summary?: string;
  request?: JsonValue;
  rawResponse?: JsonValue;
  usage?: WorkflowLabUsageSummary;
}

export interface CodeStepDef extends WorkflowStepBase {
  kind: "code";
  run: (context: WorkflowRunContext) => Promise<CodeStepResult | JsonValue>;
  onExit?: (args: {
    status: "succeeded" | "failed";
    output?: JsonValue;
    error?: string;
    helpers: WorkflowStepHelpers;
  }) => Promise<void> | void;
}

export interface MapStepResult {
  items: JsonValue[];
  summary?: string;
}

export interface MapStepDef extends WorkflowStepBase {
  kind: "map";
  mode?: "sequential" | "parallel";
  concurrency?: number;
  getItems: (helpers: WorkflowStepHelpers) => JsonValue[];
  runItem: (args: {
    item: JsonValue;
    index: number;
    helpers: WorkflowRunContext;
    previousResults: JsonValue[];
  }) => Promise<JsonValue>;
  aggregate?: (args: {
    items: JsonValue[];
    itemResults: JsonValue[];
    helpers: WorkflowStepHelpers;
  }) => JsonValue;
}

export type WorkflowStepDef =
  | LlmTextStepDef
  | LlmImageStepDef
  | TtsStepDef
  | SttStepDef
  | CodeStepDef
  | MapStepDef;

export interface WorkflowDef {
  workflowId: string;
  name: string;
  version?: string;
  description: string;
  inputSchema?: z.ZodType<JsonValue>;
  defaultInputExample?: JsonValue;
  steps: WorkflowStepDef[];
  edges: WorkflowEdgeDef[];
  createInitialSharedState?: (input: JsonValue) => JsonValue | undefined;
  defaultRunOptions?: WorkflowRunOptions;
  outputSelectors?: Record<string, JsonSelector<JsonValue>>;
}

export interface WorkflowManifestFactory {
  workflowId: string;
  createDefinition: () => WorkflowDef;
}

