import type {
  AiRequestAgent,
  AiRequestStatus,
  RuntimeConfig,
  SceneDebug,
  ScenePublic,
  TranscriptEntry,
} from "@mighty-decks/spec/adventureState";
import type { OpenRouterClient } from "../OpenRouterClient";
import type { StorytellerModelConfig } from "./agentContracts";
import type { PromptTemplateMap } from "./prompts";

export type { StorytellerModelConfig } from "./agentContracts";

export interface StorytellerCostControls {
  disableImageGeneration?: boolean;
  pitchCacheTtlMs?: number;
  imageCacheTtlMs?: number;
}

export interface StorytellerServiceOptions {
  openRouterClient: OpenRouterClient;
  models: StorytellerModelConfig;
  promptTemplates?: Partial<PromptTemplateMap>;
  onAiRequest?: (entry: AiRequestDebugEvent) => void;
  costControls?: StorytellerCostControls;
}

export interface StorytellerRequestContext {
  adventureId: string;
}

export interface AiRequestDebugEvent {
  requestId: string;
  createdAtIso: string;
  adventureId: string;
  agent: AiRequestAgent;
  kind: "text" | "image";
  model: string;
  timeoutMs: number;
  attempt: number;
  fallback: boolean;
  status: AiRequestStatus;
  prompt?: string;
  response?: string;
  error?: string;
}

export interface PitchInput {
  displayName: string;
  characterName: string;
  visualDescription: string;
  adventurePreference: string;
}

export interface PitchOption {
  title: string;
  description: string;
}

export interface SceneStartInput {
  pitchTitle: string;
  pitchDescription: string;
  sceneNumber: number;
  previousSceneSummary?: string;
  partyMembers: string[];
  transcriptTail: TranscriptEntry[];
}

export interface SceneStartResult {
  introProse: string;
  orientationBullets: string[];
  playerPrompt: string;
  debug: SceneDebug;
}

export interface ContinuityResult {
  rollingSummary: string;
  continuityWarnings: string[];
}

export interface ActionResponseInput {
  pitchTitle: string;
  pitchDescription: string;
  actorCharacterName: string;
  actionText: string;
  turnNumber: number;
  responseMode: "concise" | "expanded";
  scene: ScenePublic;
  transcriptTail: TranscriptEntry[];
  rollingSummary: string;
}

export interface ActionResponseResult {
  text: string;
  closeScene: boolean;
  sceneSummary?: string;
  debug: SceneDebug;
}

export interface SceneReactionInput {
  pitchTitle: string;
  pitchDescription: string;
  actorCharacterName: string;
  actionText: string;
  actionResponseText: string;
  turnNumber: number;
  scene: ScenePublic;
  transcriptTail: TranscriptEntry[];
  rollingSummary: string;
}

export interface SceneReactionResult {
  npcBeat?: string;
  consequence?: string;
  reward?: string;
  goalStatus: "advanced" | "completed" | "blocked";
  failForward: boolean;
  tensionShift: "rise" | "fall" | "stable";
  tensionDelta: number;
  sceneMode?: "low_tension" | "high_tension";
  closeScene: boolean;
  sceneSummary?: string;
  tension?: number;
  tensionReason?: string;
  reasoning?: string[];
  debug: SceneDebug;
}

export interface OutcomeCheckDecisionInput {
  actorCharacterName: string;
  actionText: string;
  turnNumber: number;
  scene: ScenePublic;
  transcriptTail: TranscriptEntry[];
  rollingSummary: string;
}

export interface OutcomeCheckDecisionResult {
  intent: "information_request" | "direct_action";
  responseMode: "concise" | "expanded";
  shouldCheck: boolean;
  reason: string;
  triggers: {
    threat: boolean;
    uncertainty: boolean;
    highReward: boolean;
  };
}

export interface TextModelRequest {
  agent: AiRequestAgent;
  primaryModel: string;
  fallbackModel: string;
  prompt: string;
  runtimeConfig: RuntimeConfig;
  maxTokens: number;
  temperature: number;
  context?: StorytellerRequestContext;
}

export interface ImageModelRequest {
  agent: AiRequestAgent;
  primaryModel: string;
  fallbackModel?: string;
  prompt: string;
  runtimeConfig: RuntimeConfig;
  context?: StorytellerRequestContext;
}
