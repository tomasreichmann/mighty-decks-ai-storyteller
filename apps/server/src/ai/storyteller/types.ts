import type {
  AiRequestAgent,
  AiRequestStatus,
  AiRequestUsage,
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

export type NarrativeDetailLevel = "concise" | "standard" | "expanded";

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
  usage?: AiRequestUsage;
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
  actionIntent?: "information_request" | "direct_action";
  directActionCountInScene?: number;
  turnNumber: number;
  responseMode: "concise" | "expanded";
  detailLevel?: NarrativeDetailLevel;
  outcomeCheckTriggered: boolean;
  allowHardDenyWithoutOutcomeCheck: boolean;
  hardDenyReason: string;
  bindingDirectives?: string[];
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

export interface NarrateActionOptions {
  onChunk?: (chunk: string) => void;
}

export interface SceneReactionInput {
  pitchTitle: string;
  pitchDescription: string;
  actorCharacterName: string;
  actionText: string;
  actionIntent?: "information_request" | "direct_action";
  directActionCountInScene?: number;
  actionResponseText: string;
  turnNumber: number;
  bindingDirectives?: string[];
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
  turnOrderRequired?: boolean;
  tensionBand?: "low" | "medium" | "high";
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
  bindingDirectives?: string[];
  scene: ScenePublic;
  sceneDebug?: SceneDebug;
  transcriptTail: TranscriptEntry[];
  rollingSummary: string;
}

export interface OutcomeCheckDecisionResult {
  intent: "information_request" | "direct_action";
  responseMode: "concise" | "expanded";
  detailLevel: NarrativeDetailLevel;
  shouldCheck: boolean;
  reason: string;
  allowHardDenyWithoutOutcomeCheck: boolean;
  hardDenyReason: string;
  triggers: {
    threat: boolean;
    uncertainty: boolean;
    highReward: boolean;
  };
}

export interface MetagameQuestionInput {
  actorCharacterName: string;
  questionText: string;
  bindingDirectives?: string[];
  pitchTitle: string;
  pitchDescription: string;
  scene: ScenePublic;
  sceneDebug?: SceneDebug;
  transcriptTail: TranscriptEntry[];
  rollingSummary: string;
  activeVoteSummary: string;
  activeOutcomeSummary: string;
  pendingSceneClosureSummary: string;
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
  onStreamChunk?: (chunk: string) => void;
}

export interface ImageModelRequest {
  agent: AiRequestAgent;
  primaryModel: string;
  fallbackModel?: string;
  prompt: string;
  runtimeConfig: RuntimeConfig;
  context?: StorytellerRequestContext;
}
