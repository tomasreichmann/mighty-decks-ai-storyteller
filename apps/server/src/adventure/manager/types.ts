import type {
  TranscriptEntry,
  RuntimeConfig,
  AdventureState,
  AdventurePhase,
  OutcomeCardType,
  TranscriptIllustrationSubjectType,
} from "@mighty-decks/spec/adventureState";
import type { StorytellerThinkingPayload } from "@mighty-decks/spec/events";
import type { AdventureDiagnosticsLogger } from "../../diagnostics/AdventureDiagnosticsLogger";
import type { AdventureSnapshotStore } from "../../persistence/AdventureSnapshotStore";
import type { CharacterPortraitService } from "../../image/CharacterPortraitService";
import type { StorytellerService } from "../../ai/StorytellerService";

export interface SocketParticipantLink {
  adventureId: string;
  playerId: string;
}

export interface ActionQueueItem {
  playerId: string;
  text: string;
  intent: "information_request" | "direct_action";
  responseMode: "concise" | "expanded";
  detailLevel: "concise" | "standard" | "expanded";
  outcomeCheckTriggered: boolean;
  allowHardDenyWithoutOutcomeCheck: boolean;
  hardDenyReason: string;
  sceneClosureAction?: boolean;
}

export interface TranscriptIllustrationQueueItem {
  entryId: string;
  narrativeText: string;
  source: "auto" | "manual";
  subjectType?: TranscriptIllustrationSubjectType;
  subjectLabel?: string;
  scene: NonNullable<AdventureState["currentScene"]>;
  transcriptTail: TranscriptEntry[];
}

export interface PendingSceneClosure {
  summary: string;
  requestedAtIso: string;
}

export interface SceneTransitionVoteOptions {
  showClosingCard?: boolean;
  closingProse?: string;
}

export interface MetagameDirective {
  directiveId: string;
  createdAtIso: string;
  actorName: string;
  text: string;
}

export interface AdventureRuntimeState {
  voteTimer: NodeJS.Timeout | null;
  votesByPlayerId: Map<string, string>;
  actionQueue: ActionQueueItem[];
  illustrationQueue: TranscriptIllustrationQueueItem[];
  pendingOutcomeAction: ActionQueueItem | null;
  pendingSceneClosure: PendingSceneClosure | null;
  processingAction: boolean;
  processingOutcomeDecision: boolean;
  processingIllustration: boolean;
  pitchVoteInProgress: boolean;
  sceneCounter: number;
  sceneTurnCounter: number;
  sceneDirectActionCounter: number;
  autoIllustrationsUsedInScene: number;
  autoIllustrationSubjectsInScene: Set<string>;
  selectedPitch: { title: string; description: string } | null;
  rollingSummary: string;
  metagameDirectives: MetagameDirective[];
  latencySamplesMs: number[];
  finalizedAiRequestIds: Set<string>;
}

export type RecentDecisionLogEntry = NonNullable<
  AdventureState["debugScene"]
>["recentDecisions"][number];

export interface AdventureManagerHooks {
  onAdventureUpdated?: (adventureId: string) => void;
  onPhaseChanged?: (adventureId: string, phase: AdventurePhase) => void;
  onTranscriptAppend?: (adventureId: string, entry: TranscriptEntry) => void;
  onStorytellerThinking?: (
    adventureId: string,
    payload: StorytellerThinkingPayload,
  ) => void;
  onStorytellerResponse?: (
    adventureId: string,
    payload: { text: string },
  ) => void;
  onStorytellerResponseChunk?: (
    adventureId: string,
    payload: { text: string; reset?: boolean; done?: boolean },
  ) => void;
}

export interface AdventureManagerOptions {
  debugMode: boolean;
  maxActiveAdventures: number;
  runtimeConfigDefaults: RuntimeConfig;
  storyteller: StorytellerService;
  diagnosticsLogger?: AdventureDiagnosticsLogger;
  characterPortraitService?: CharacterPortraitService;
  snapshotStore?: AdventureSnapshotStore;
  snapshotWriteDebounceMs?: number;
}

export interface CastVoteResult {
  adventure: AdventureState;
  duplicateVote: boolean;
}

export const ensureAdventureId = (adventureId: string): string => {
  const trimmed = adventureId.trim();
  if (trimmed.length < 3) {
    throw new Error("adventureId must be at least 3 characters");
  }

  return trimmed;
};

export const createId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const AI_DEBUG_AUTHOR = "AI Debug";
export const METAGAME_QUESTION_PREFIX = "[Metagame]";
export const METAGAME_STORYTELLER_AUTHOR = "Storyteller (Metagame)";
export const PENDING_SCENE_INTRO =
  "A new scene is taking shape. The storyteller is framing stakes and pressure.";
export const PENDING_SCENE_BULLETS = [
  "Scene details will populate in a moment.",
  "Hold for the opening prompt before taking action.",
];

export const outcomeCardDetailsMap: Record<
  OutcomeCardType,
  { label: string; effect: string; narrationHint: string }
> = {
  success: {
    label: "Success",
    effect: "+2 Effect",
    narrationHint: "Deliver a strong favorable result with clear momentum.",
  },
  "partial-success": {
    label: "Partial Success",
    effect: "+1 Effect",
    narrationHint: "Advance the plan but attach a cost, risk, or complication.",
  },
  "special-action": {
    label: "Special Action",
    effect: "+3 Effect",
    narrationHint: "Create a standout breakthrough with dramatic advantage.",
  },
  chaos: {
    label: "Chaos",
    effect: "Sudden Change",
    narrationHint:
      "Introduce a surprising twist that reshapes immediate priorities.",
  },
  fumble: {
    label: "Fumble",
    effect: "-1 Effect",
    narrationHint: "The move backfires or stalls, escalating pressure.",
  },
};

export const formatOutcomeCard = (card: OutcomeCardType): string => {
  const details = outcomeCardDetailsMap[card];
  return `${details.label} (${details.effect})`;
};

export const buildOutcomeNarrationHint = (card: OutcomeCardType): string =>
  outcomeCardDetailsMap[card].narrationHint;

export const isAiDebugTranscriptEntry = (entry: TranscriptEntry): boolean =>
  entry.kind === "system" && entry.author === AI_DEBUG_AUTHOR;

export const isMetagameTranscriptEntry = (entry: TranscriptEntry): boolean => {
  if (
    entry.kind === "player" &&
    entry.text.trimStart().startsWith(METAGAME_QUESTION_PREFIX)
  ) {
    return true;
  }

  return (
    entry.kind === "storyteller" && entry.author === METAGAME_STORYTELLER_AUTHOR
  );
};

export const HIGH_TENSION_THRESHOLD = 65;
export const LOW_TENSION_THRESHOLD = 40;

export const clampTension = (value: number): number =>
  Math.max(0, Math.min(100, value));

export const percentile90 = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.9) - 1);
  return sorted[index] ?? 0;
};

export const normalizeCharacterNameKey = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export const normalizeIllustrationSubjectKey = (
  subjectType: TranscriptIllustrationSubjectType | undefined,
  subjectLabel: string | undefined,
): string | null => {
  const normalizedLabel = subjectLabel
    ?.trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (!subjectType || !normalizedLabel) {
    return null;
  }

  return `${subjectType}:${normalizedLabel}`;
};

export const SCENE_TRANSITION_SUMMARY_FALLBACK =
  "The group resolves the immediate pressure and must choose whether to continue or end.";

export const normalizeSceneTransitionSummary = (value: string): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : SCENE_TRANSITION_SUMMARY_FALLBACK;
};

export const summarizeClosingNarration = (value: string): string | null => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return null;
  }

  const withoutTrailingPrompt = normalized
    .replace(/\s+what do you do now\??\s*$/i, "")
    .trim();
  const candidate = withoutTrailingPrompt.length > 0 ? withoutTrailingPrompt : normalized;
  const firstSentenceMatch = candidate.match(/[^.!?]+[.!?]/);
  return (firstSentenceMatch?.[0] ?? candidate).trim();
};
