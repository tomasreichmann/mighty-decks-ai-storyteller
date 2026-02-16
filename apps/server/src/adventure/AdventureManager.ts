import {
  activeVoteSchema,
  activeOutcomeCheckSchema,
  AdventurePhase,
  AdventureState,
  AiRequestLogEntry,
  characterPortraitEntrySchema,
  outcomeCardTypeSchema,
  OutcomeCardType,
  playerSetupSchema,
  rosterEntrySchema,
  RuntimeConfig,
  runtimeConfigSchema,
  scenePublicSchema,
  transcriptEntrySchema,
  voteOptionSchema,
  VoteKind,
  VoteOption,
} from "@mighty-decks/spec/adventureState";
import {
  castVotePayloadSchema,
  closeAdventurePayloadSchema,
  continueAdventurePayloadSchema,
  endSessionPayloadSchema,
  joinAdventurePayloadSchema,
  JoinAdventurePayload,
  playOutcomeCardPayloadSchema,
  submitActionPayloadSchema,
  submitMetagameQuestionPayloadSchema,
  submitSetupPayloadSchema,
  toggleReadyPayloadSchema,
  updateRuntimeConfigPayloadSchema,
} from "@mighty-decks/spec/events";
import type { StorytellerThinkingPayload } from "@mighty-decks/spec/events";
import type { TranscriptEntry } from "@mighty-decks/spec/adventureState";
import type {
  AiRequestDebugEvent,
  ActionResponseResult,
  PitchInput,
  StorytellerService,
} from "../ai/StorytellerService";
import type {
  AdventureDiagnosticEvent,
  AdventureDiagnosticsLogger,
} from "../diagnostics/AdventureDiagnosticsLogger";
import type { CharacterPortraitService } from "../image/CharacterPortraitService";
import { CHARACTER_PORTRAIT_PLACEHOLDER_URL } from "../image/characterPortraitConfig";
import { createInitialAdventureState } from "./createAdventureState";

interface SocketParticipantLink {
  adventureId: string;
  playerId: string;
}

interface ActionQueueItem {
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

interface PendingSceneClosure {
  summary: string;
  requestedAtIso: string;
}

interface SceneTransitionVoteOptions {
  showClosingCard?: boolean;
  closingProse?: string;
}

interface MetagameDirective {
  directiveId: string;
  createdAtIso: string;
  actorName: string;
  text: string;
}

interface AdventureRuntimeState {
  voteTimer: NodeJS.Timeout | null;
  votesByPlayerId: Map<string, string>;
  actionQueue: ActionQueueItem[];
  pendingOutcomeAction: ActionQueueItem | null;
  pendingSceneClosure: PendingSceneClosure | null;
  processingAction: boolean;
  processingOutcomeDecision: boolean;
  pitchVoteInProgress: boolean;
  sceneCounter: number;
  sceneTurnCounter: number;
  sceneDirectActionCounter: number;
  selectedPitch: { title: string; description: string } | null;
  rollingSummary: string;
  metagameDirectives: MetagameDirective[];
  latencySamplesMs: number[];
  finalizedAiRequestIds: Set<string>;
}

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
}

interface CastVoteResult {
  adventure: AdventureState;
  duplicateVote: boolean;
}

const ensureAdventureId = (adventureId: string): string => {
  const trimmed = adventureId.trim();
  if (trimmed.length < 3) {
    throw new Error("adventureId must be at least 3 characters");
  }

  return trimmed;
};

const createId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const AI_DEBUG_AUTHOR = "AI Debug";
const METAGAME_QUESTION_PREFIX = "[Metagame]";
const METAGAME_STORYTELLER_AUTHOR = "Storyteller (Metagame)";
const PENDING_SCENE_INTRO =
  "A new scene is taking shape. The storyteller is framing stakes and pressure.";
const PENDING_SCENE_BULLETS = [
  "Scene details will populate in a moment.",
  "Hold for the opening prompt before taking action.",
];

const outcomeCardDetailsMap: Record<
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

const formatOutcomeCard = (card: OutcomeCardType): string => {
  const details = outcomeCardDetailsMap[card];
  return `${details.label} (${details.effect})`;
};

const buildOutcomeNarrationHint = (card: OutcomeCardType): string =>
  outcomeCardDetailsMap[card].narrationHint;
const isAiDebugTranscriptEntry = (entry: TranscriptEntry): boolean =>
  entry.kind === "system" && entry.author === AI_DEBUG_AUTHOR;

const isMetagameTranscriptEntry = (entry: TranscriptEntry): boolean => {
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

const HIGH_TENSION_THRESHOLD = 65;
const LOW_TENSION_THRESHOLD = 40;

const clampTension = (value: number): number =>
  Math.max(0, Math.min(100, value));

const percentile90 = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.9) - 1);
  return sorted[index] ?? 0;
};

const normalizeCharacterNameKey = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const SCENE_TRANSITION_SUMMARY_FALLBACK =
  "The group resolves the immediate pressure and must choose whether to continue or end.";

const normalizeSceneTransitionSummary = (value: string): string => {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : SCENE_TRANSITION_SUMMARY_FALLBACK;
};

const summarizeClosingNarration = (value: string): string | null => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return null;
  }

  const withoutTrailingPrompt = normalized
    .replace(/\s+what do you do now\??\s*$/i, "")
    .trim();
  const candidate = withoutTrailingPrompt.length > 0
    ? withoutTrailingPrompt
    : normalized;
  const firstSentenceMatch = candidate.match(/[^.!?]+[.!?]/);
  return (firstSentenceMatch?.[0] ?? candidate).trim();
};

export class AdventureManager {
  private readonly adventures = new Map<string, AdventureState>();
  private readonly socketLinks = new Map<string, SocketParticipantLink>();
  private readonly runtimeByAdventure = new Map<
    string,
    AdventureRuntimeState
  >();
  private runtimeConfig: RuntimeConfig;
  private hooks: AdventureManagerHooks = {};

  public constructor(private readonly options: AdventureManagerOptions) {
    this.runtimeConfig = runtimeConfigSchema.parse(
      options.runtimeConfigDefaults,
    );
  }

  public setHooks(hooks: AdventureManagerHooks): void {
    this.hooks = hooks;
  }

  public appendAiRequestLog(event: AiRequestDebugEvent): void {
    const adventure = this.adventures.get(event.adventureId);
    if (!adventure) {
      return;
    }

    const requestEntry: AiRequestLogEntry = {
      requestId: event.requestId,
      createdAtIso: event.createdAtIso,
      agent: event.agent,
      kind: event.kind,
      model: event.model,
      timeoutMs: event.timeoutMs,
      attempt: event.attempt,
      fallback: event.fallback,
      status: event.status,
      prompt: event.prompt,
      response: event.response,
      error: event.error,
      usage: event.usage,
    };

    const costMetricsChanged = this.recordAiRequestCost(adventure, requestEntry);
    if (!adventure.debugMode) {
      if (costMetricsChanged) {
        this.notifyAdventureUpdated(adventure.adventureId);
      }
      return;
    }

    const debugScene = adventure.debugScene ?? this.createEmptyDebugScene();

    adventure.debugScene = {
      ...debugScene,
      aiRequests: [...debugScene.aiRequests, requestEntry].slice(-250),
    };
    this.logDiagnostic(adventure, {
      type: "ai_request",
      request: requestEntry,
    });

    const statusLabelMap = {
      started: "STARTED",
      succeeded: "SUCCEEDED",
      failed: "FAILED",
      timeout: "TIMEOUT",
    } as const;
    const statusLabel = statusLabelMap[event.status];
    const fallbackText = event.fallback ? " (fallback model)" : "";
    const attemptText = `attempt ${event.attempt}${fallbackText}`;
    const details: string[] = [
      `[AI ${statusLabel}] ${event.agent} ${event.kind} ${attemptText}`,
    ];

    if (event.status === "started" && event.prompt) {
      details.push(`Prompt:\n${event.prompt}`);
    }

    if (event.response) {
      details.push(`Response:\n${event.response}`);
    } else if (event.error) {
      details.push(`Error:\n${event.error}`);
    }
    const usageSummary = this.formatAiRequestUsageSummary(requestEntry);
    if (usageSummary) {
      details.push(`Usage:\n${usageSummary}`);
    }

    const transcriptText = details.join("\n\n");
    this.appendTranscriptEntry(adventure, {
      kind: "system",
      author: AI_DEBUG_AUTHOR,
      text: transcriptText,
    }, {
      aiRequest: requestEntry,
    });

    this.notifyAdventureUpdated(adventure.adventureId);
  }

  public joinAdventure(
    payload: JoinAdventurePayload,
    socketId: string,
  ): AdventureState {
    const parsed = joinAdventurePayloadSchema.parse(payload);
    const adventureId = ensureAdventureId(parsed.adventureId);

    let adventure = this.adventures.get(adventureId);
    if (!adventure) {
      const activeAdventures = this.listActiveAdventures();
      if (activeAdventures.length >= this.options.maxActiveAdventures) {
        const activeIds = activeAdventures
          .map((candidate) => candidate.adventureId)
          .join(", ");
        throw new Error(`active adventure cap reached (active: ${activeIds})`);
      }

      adventure = createInitialAdventureState(
        adventureId,
        this.runtimeConfig,
        this.options.debugMode,
      );
      this.adventures.set(adventureId, adventure);
      this.ensureRuntime(adventureId);
      this.logDiagnostic(adventure, {
        type: "session_started",
        runtimeConfig: adventure.runtimeConfig,
      });
    }

    const existingIndex = adventure.roster.findIndex(
      (entry) => entry.playerId === parsed.playerId,
    );
    if (existingIndex >= 0) {
      const existing = adventure.roster[existingIndex];
      adventure.roster[existingIndex] = {
        ...existing,
        displayName: parsed.displayName,
        role: parsed.role,
        connected: true,
      };
    } else {
      adventure.roster.push(
        rosterEntrySchema.parse({
          playerId: parsed.playerId,
          displayName: parsed.displayName,
          role: parsed.role,
          connected: true,
          ready: false,
          hasVoted: false,
        }),
      );
    }

    const runtime = this.ensureRuntime(adventureId);
    for (const entry of adventure.roster) {
      if (entry.role === "player") {
        entry.hasVoted = runtime.votesByPlayerId.has(entry.playerId);
      }
    }

    this.socketLinks.set(socketId, { adventureId, playerId: parsed.playerId });
    return adventure;
  }

  public leaveBySocket(socketId: string): AdventureState | null {
    const link = this.socketLinks.get(socketId);
    if (!link) {
      return null;
    }

    this.socketLinks.delete(socketId);
    const adventure = this.adventures.get(link.adventureId);
    if (!adventure) {
      return null;
    }

    const rosterIndex = adventure.roster.findIndex(
      (entry) => entry.playerId === link.playerId,
    );
    if (rosterIndex >= 0) {
      adventure.roster[rosterIndex] = {
        ...adventure.roster[rosterIndex],
        connected: false,
      };
    }

    if (adventure.activeOutcomeCheck) {
      const remainingTargets = adventure.activeOutcomeCheck.targets.filter(
        (target) => target.playerId !== link.playerId,
      );
      if (remainingTargets.length === 0) {
        adventure.activeOutcomeCheck = undefined;
        const runtime = this.ensureRuntime(link.adventureId);
        runtime.pendingOutcomeAction = null;
        this.appendTranscriptEntry(adventure, {
          kind: "system",
          author: "System",
          text: "Outcome check canceled because a required player disconnected.",
        });
      } else {
        adventure.activeOutcomeCheck = {
          ...adventure.activeOutcomeCheck,
          targets: remainingTargets,
        };
      }
    }

    if (adventure.currentScene?.activeActorPlayerId === link.playerId) {
      this.updateActiveActorForScene(adventure, undefined, true);
      if (adventure.currentScene.activeActorName) {
        this.appendTranscriptEntry(adventure, {
          kind: "system",
          author: "System",
          text: `Turn order updates after disconnect. ${adventure.currentScene.activeActorName} acts next.`,
        });
      }
    }

    void this.maybeResolveActiveVoteEarly(link.adventureId);
    void this.maybeStartAdventurePitchVote(link.adventureId);
    return adventure;
  }

  public updateSetup(payload: unknown): AdventureState {
    const parsed = submitSetupPayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    this.assertAdventureOpen(adventure);
    this.assertPhase(
      adventure,
      ["lobby", "vote", "play"],
      "setup can only be updated during active phases",
    );

    const rosterEntry = this.getRosterEntry(adventure, parsed.playerId);
    if (rosterEntry.role !== "player") {
      throw new Error("only player role can submit setup");
    }

    const setup = playerSetupSchema.parse(parsed.setup);
    rosterEntry.setup = setup;
    const characterNameKey = normalizeCharacterNameKey(setup.characterName);
    this.setCharacterPortraitEntry(adventure, {
      characterNameKey,
      characterName: setup.characterName,
      imageUrl: CHARACTER_PORTRAIT_PLACEHOLDER_URL,
      status: "pending",
      updatedAtIso: new Date().toISOString(),
    });
    this.notifyAdventureUpdated(adventure.adventureId);
    if (this.options.characterPortraitService) {
      void this.resolveCharacterPortrait(adventure.adventureId, {
        characterNameKey,
        characterName: setup.characterName,
        visualDescription: setup.visualDescription,
      });
    }
    return adventure;
  }

  public async toggleReady(payload: unknown): Promise<AdventureState> {
    const parsed = toggleReadyPayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    this.assertAdventureOpen(adventure);
    this.assertPhase(
      adventure,
      ["lobby"],
      "ready state can only be toggled during lobby phase",
    );

    const rosterEntry = this.getRosterEntry(adventure, parsed.playerId);
    if (rosterEntry.role !== "player") {
      throw new Error("only player role can toggle ready");
    }

    rosterEntry.ready = parsed.ready;
    this.notifyAdventureUpdated(adventure.adventureId);

    await this.maybeStartAdventurePitchVote(adventure.adventureId);
    return adventure;
  }

  public async castVote(payload: unknown): Promise<CastVoteResult> {
    const parsed = castVotePayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    this.assertAdventureOpen(adventure);

    const activeVote = adventure.activeVote;
    if (!activeVote) {
      throw new Error("no active vote");
    }

    if (parsed.voteId !== activeVote.voteId) {
      throw new Error("vote id mismatch");
    }

    const player = this.getRosterEntry(adventure, parsed.playerId);
    if (player.role !== "player" || !player.connected) {
      throw new Error("only connected players can cast votes");
    }

    const targetOption = activeVote.options.find(
      (option) => option.optionId === parsed.optionId,
    );
    if (!targetOption) {
      throw new Error("unknown vote option");
    }

    const runtime = this.ensureRuntime(adventure.adventureId);
    if (runtime.votesByPlayerId.has(parsed.playerId)) {
      return {
        adventure,
        duplicateVote: true,
      };
    }

    runtime.votesByPlayerId.set(parsed.playerId, parsed.optionId);
    player.hasVoted = true;
    this.refreshVoteTallies(adventure.adventureId);
    this.notifyAdventureUpdated(adventure.adventureId);

    await this.maybeResolveActiveVoteEarly(adventure.adventureId);
    return {
      adventure,
      duplicateVote: false,
    };
  }

  public async submitAction(payload: unknown): Promise<AdventureState> {
    const parsed = submitActionPayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    this.assertAdventureOpen(adventure);
    this.assertPhase(
      adventure,
      ["play"],
      "actions can only be submitted during play phase",
    );

    if (!adventure.currentScene) {
      throw new Error("no active scene");
    }

    if (adventure.activeVote?.kind === "scene_transition") {
      throw new Error("scene transition vote active; actions are paused");
    }

    const player = this.getRosterEntry(adventure, parsed.playerId);
    if (player.role !== "player" || !player.connected) {
      throw new Error("only connected players can submit actions");
    }

    if (
      adventure.currentScene.activeActorPlayerId &&
      adventure.currentScene.activeActorPlayerId !== parsed.playerId
    ) {
      const activeActorName =
        adventure.currentScene.activeActorName ?? "the active player";
      throw new Error(
        `high tension turn order active; wait for ${activeActorName} to act`,
      );
    }

    const runtime = this.ensureRuntime(adventure.adventureId);
    if (
      runtime.processingAction ||
      runtime.processingOutcomeDecision ||
      runtime.actionQueue.length > 0 ||
      runtime.pendingOutcomeAction ||
      adventure.activeOutcomeCheck
    ) {
      throw new Error(
        "action queue busy; draft while the storyteller resolves the current turn",
      );
    }

    const actionText = parsed.text.trim();
    if (actionText.length === 0) {
      throw new Error("action text is empty");
    }

    const playerAuthor = this.getCharacterDisplayName(player);

    this.appendTranscriptEntry(adventure, {
      kind: "player",
      author: playerAuthor,
      text: actionText,
    });
    this.notifyAdventureUpdated(adventure.adventureId);

    if (runtime.pendingSceneClosure) {
      runtime.actionQueue.push({
        playerId: parsed.playerId,
        text: actionText,
        intent: "direct_action",
        responseMode: "concise",
        detailLevel: "standard",
        outcomeCheckTriggered: false,
        allowHardDenyWithoutOutcomeCheck: false,
        hardDenyReason: "",
        sceneClosureAction: true,
      });
      this.notifyAdventureUpdated(adventure.adventureId);

      if (!runtime.processingAction) {
        void this.processActionQueue(adventure.adventureId);
      }

      return adventure;
    }

    runtime.processingOutcomeDecision = true;
    this.hooks.onStorytellerThinking?.(adventure.adventureId, {
      active: true,
      label: "Assessing stakes...",
      showInTranscript: false,
    });

    try {
      const decision =
        await this.options.storyteller.decideOutcomeCheckForPlayerAction(
          {
            actorCharacterName: playerAuthor,
            actionText,
            turnNumber: runtime.sceneTurnCounter + 1,
            bindingDirectives: this.getBindingDirectiveTexts(runtime),
            scene: adventure.currentScene,
            sceneDebug: adventure.debugScene,
            transcriptTail: this.getNarrativeTranscript(
              adventure.transcript,
            ).slice(-14),
            rollingSummary: runtime.rollingSummary,
          },
          adventure.runtimeConfig,
          { adventureId: adventure.adventureId },
        );

      const refreshedAdventure = this.adventures.get(adventure.adventureId);
      if (
        !refreshedAdventure ||
        refreshedAdventure.closed ||
        refreshedAdventure.phase !== "play" ||
        !refreshedAdventure.currentScene
      ) {
        return adventure;
      }

      if (decision.shouldCheck) {
        runtime.pendingOutcomeAction = {
          playerId: parsed.playerId,
          text: actionText,
          intent: decision.intent,
          responseMode: decision.responseMode,
          detailLevel: decision.detailLevel,
          outcomeCheckTriggered: true,
          allowHardDenyWithoutOutcomeCheck: false,
          hardDenyReason: "",
        };

        const checkId = createId("oc");
        refreshedAdventure.activeOutcomeCheck = activeOutcomeCheckSchema.parse({
          checkId,
          source: "player_action",
          prompt: `${playerAuthor} must play an Outcome card before the action resolves.`,
          requestedAtIso: new Date().toISOString(),
          targets: [
            {
              playerId: parsed.playerId,
              displayName: playerAuthor,
            },
          ],
        });

        this.appendTranscriptEntry(refreshedAdventure, {
          kind: "storyteller",
          author: "Storyteller",
          text: `${playerAuthor}, play an Outcome card. ${decision.reason}`,
        });
        this.notifyAdventureUpdated(refreshedAdventure.adventureId);
        return refreshedAdventure;
      }

      runtime.actionQueue.push({
        playerId: parsed.playerId,
        text: actionText,
        intent: decision.intent,
        responseMode: decision.responseMode,
        detailLevel: decision.detailLevel,
        outcomeCheckTriggered: false,
        allowHardDenyWithoutOutcomeCheck:
          decision.allowHardDenyWithoutOutcomeCheck,
        hardDenyReason: decision.hardDenyReason,
      });
      this.notifyAdventureUpdated(refreshedAdventure.adventureId);

      if (!runtime.processingAction) {
        void this.processActionQueue(refreshedAdventure.adventureId);
      }

      return refreshedAdventure;
    } finally {
      runtime.processingOutcomeDecision = false;
      if (!runtime.processingAction) {
        this.hooks.onStorytellerThinking?.(adventure.adventureId, {
          active: false,
          label: "",
          showInTranscript: false,
        });
      }
    }
  }

  public async submitMetagameQuestion(
    payload: unknown,
  ): Promise<AdventureState> {
    const parsed = submitMetagameQuestionPayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    this.assertAdventureOpen(adventure);
    this.assertPhase(
      adventure,
      ["play"],
      "metagame questions can only be asked during play phase",
    );

    const player = this.getRosterEntry(adventure, parsed.playerId);
    if (player.role !== "player" || !player.connected) {
      throw new Error("only connected players can ask metagame questions");
    }

    if (!adventure.currentScene) {
      throw new Error("no active scene");
    }

    const questionText = parsed.text.trim();
    if (questionText.length === 0) {
      throw new Error("metagame question is empty");
    }

    const runtime = this.ensureRuntime(adventure.adventureId);
    const playerAuthor = this.getCharacterDisplayName(player);
    this.appendMetagameDirective(runtime, playerAuthor, questionText);

    this.appendTranscriptEntry(adventure, {
      kind: "player",
      author: playerAuthor,
      text: `${METAGAME_QUESTION_PREFIX} ${questionText}`,
    });
    this.notifyAdventureUpdated(adventure.adventureId);

    const shouldEmitThinkingState =
      !runtime.processingAction && !runtime.processingOutcomeDecision;
    if (shouldEmitThinkingState) {
      this.hooks.onStorytellerThinking?.(adventure.adventureId, {
        active: true,
        label: "Answering metagame question...",
        showInTranscript: true,
      });
    }

    try {
      const answer = await this.options.storyteller.answerMetagameQuestion(
        {
          actorCharacterName: playerAuthor,
          questionText,
          bindingDirectives: this.getBindingDirectiveTexts(runtime),
          pitchTitle: runtime.selectedPitch?.title ?? "Uncharted Trouble",
          pitchDescription:
            runtime.selectedPitch?.description ??
            "A dangerous opportunity appears and demands action before the window closes.",
          scene: adventure.currentScene,
          sceneDebug: adventure.debugScene,
          transcriptTail: adventure.transcript.slice(-18),
          rollingSummary: runtime.rollingSummary,
          activeVoteSummary: adventure.activeVote
            ? `${adventure.activeVote.kind}: ${adventure.activeVote.title}`
            : "none",
          activeOutcomeSummary: adventure.activeOutcomeCheck
            ? `${adventure.activeOutcomeCheck.prompt} | targets: ${adventure.activeOutcomeCheck.targets
                .map(
                  (target) =>
                    `${target.displayName} (${target.playedCard ?? "pending"})`,
                )
                .join(", ")}`
            : "none",
          pendingSceneClosureSummary:
            runtime.pendingSceneClosure?.summary ?? "none",
        },
        adventure.runtimeConfig,
        { adventureId: adventure.adventureId },
      );

      const refreshedAdventure = this.adventures.get(adventure.adventureId);
      if (!refreshedAdventure || refreshedAdventure.closed) {
        return adventure;
      }

      this.appendTranscriptEntry(refreshedAdventure, {
        kind: "storyteller",
        author: METAGAME_STORYTELLER_AUTHOR,
        text: answer,
      });
      this.hooks.onStorytellerResponse?.(refreshedAdventure.adventureId, {
        text: answer,
      });
      this.notifyAdventureUpdated(refreshedAdventure.adventureId);
      return refreshedAdventure;
    } finally {
      if (shouldEmitThinkingState) {
        this.hooks.onStorytellerThinking?.(adventure.adventureId, {
          active: false,
          label: "",
          showInTranscript: true,
        });
      }
    }
  }

  public playOutcomeCard(payload: unknown): AdventureState {
    const parsed = playOutcomeCardPayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    this.assertAdventureOpen(adventure);
    this.assertPhase(
      adventure,
      ["play"],
      "outcome cards can only be played during play phase",
    );

    const activeOutcomeCheck = adventure.activeOutcomeCheck;
    if (!activeOutcomeCheck) {
      throw new Error("no active outcome check");
    }

    if (activeOutcomeCheck.checkId !== parsed.checkId) {
      throw new Error("outcome check mismatch");
    }

    const player = this.getRosterEntry(adventure, parsed.playerId);
    if (player.role !== "player" || !player.connected) {
      throw new Error("only connected players can play outcome cards");
    }

    const target = activeOutcomeCheck.targets.find(
      (entry) => entry.playerId === parsed.playerId,
    );
    if (!target) {
      throw new Error("player not targeted by this outcome check");
    }

    const runtime = this.ensureRuntime(adventure.adventureId);
    const pendingAction = runtime.pendingOutcomeAction;
    if (activeOutcomeCheck.source === "player_action" && !pendingAction) {
      throw new Error("no pending action for outcome resolution");
    }

    const selectedCard = outcomeCardTypeSchema.parse(parsed.card);
    if (target.playedCard) {
      if (target.playedCard === selectedCard) {
        return adventure;
      }

      throw new Error("outcome card already played for this check");
    }

    target.playedCard = selectedCard;
    target.playedAtIso = new Date().toISOString();
    this.appendTranscriptEntry(adventure, {
      kind: "player",
      author: target.displayName,
      text: `played Outcome card: ${formatOutcomeCard(selectedCard)}.`,
    });

    const everyonePlayed = activeOutcomeCheck.targets.every((entry) =>
      Boolean(entry.playedCard),
    );
    if (!everyonePlayed) {
      this.notifyAdventureUpdated(adventure.adventureId);
      return adventure;
    }

    if (pendingAction) {
      const playedCardContext = activeOutcomeCheck.targets
        .map((entry) => {
          const card = entry.playedCard;
          if (!card) {
            return `${entry.displayName}: no card played`;
          }

          return `${entry.displayName}: ${formatOutcomeCard(card)} (${buildOutcomeNarrationHint(card)})`;
        })
        .join(" | ");

      runtime.actionQueue.push({
        playerId: pendingAction.playerId,
        text: `${pendingAction.text}\nOutcome guidance: ${playedCardContext}`,
        intent: pendingAction.intent,
        responseMode: pendingAction.responseMode,
        detailLevel: pendingAction.detailLevel,
        outcomeCheckTriggered: pendingAction.outcomeCheckTriggered,
        allowHardDenyWithoutOutcomeCheck:
          pendingAction.allowHardDenyWithoutOutcomeCheck,
        hardDenyReason: pendingAction.hardDenyReason,
      });
      runtime.pendingOutcomeAction = null;
    }
    adventure.activeOutcomeCheck = undefined;
    this.notifyAdventureUpdated(adventure.adventureId);

    if (!runtime.processingAction) {
      void this.processActionQueue(adventure.adventureId);
    }

    return adventure;
  }

  public async endSession(payload: unknown): Promise<AdventureState> {
    const parsed = endSessionPayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    this.assertAdventureOpen(adventure);

    this.getRosterEntry(adventure, parsed.playerId);
    await this.closeAdventure(
      adventure.adventureId,
      "Session ended by player request. The active scene was not closed.",
    );
    return adventure;
  }

  public async continueAdventure(payload: unknown): Promise<AdventureState> {
    const parsed = continueAdventurePayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    const requester = this.getRosterEntry(adventure, parsed.playerId);
    if (!requester.connected) {
      throw new Error("only connected participants can continue adventure");
    }
    if (!adventure.closed || adventure.phase !== "ending") {
      throw new Error("adventure is not in ending phase");
    }

    const continuationSummary =
      adventure.currentScene?.summary ?? adventure.sessionSummary;

    adventure.closed = false;
    adventure.sessionSummary = undefined;
    adventure.sessionForwardHook = undefined;
    adventure.activeVote = undefined;
    this.setPhase(adventure, "play");
    this.logDiagnostic(adventure, {
      type: "session_started",
      runtimeConfig: adventure.runtimeConfig,
    });
    this.notifyAdventureUpdated(adventure.adventureId);

    await this.startScene(adventure.adventureId, continuationSummary);
    return adventure;
  }

  public closeAdventureRecord(payload: unknown): void {
    const parsed = closeAdventurePayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    const requester = this.getRosterEntry(adventure, parsed.playerId);
    if (!requester.connected) {
      throw new Error("only connected participants can close adventure");
    }
    if (!adventure.closed && adventure.phase !== "ending") {
      throw new Error("adventure can only be closed from ending phase");
    }

    this.clearVoteTimer(adventure.adventureId);
    this.options.diagnosticsLogger?.closeSession(adventure.adventureId);
    this.adventures.delete(adventure.adventureId);
    this.runtimeByAdventure.delete(adventure.adventureId);

    for (const [socketId, link] of this.socketLinks.entries()) {
      if (link.adventureId === adventure.adventureId) {
        this.socketLinks.delete(socketId);
      }
    }
  }

  public updateRuntimeConfig(payload: unknown): {
    adventure: AdventureState;
    runtimeConfig: RuntimeConfig;
  } {
    const parsed = updateRuntimeConfigPayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);

    const requester = this.getRosterEntry(adventure, parsed.playerId);
    if (requester.role !== "screen") {
      throw new Error("only screen role can update runtime config");
    }

    this.runtimeConfig = runtimeConfigSchema.parse({
      ...this.runtimeConfig,
      ...parsed.runtimeConfig,
    });

    for (const currentAdventure of this.adventures.values()) {
      currentAdventure.runtimeConfig = this.runtimeConfig;
      this.logDiagnostic(currentAdventure, {
        type: "runtime_config_updated",
        runtimeConfig: this.runtimeConfig,
      });
      this.notifyAdventureUpdated(currentAdventure.adventureId);
    }

    return { adventure, runtimeConfig: this.runtimeConfig };
  }

  public getAdventure(adventureId: string): AdventureState | null {
    return this.adventures.get(adventureId) ?? null;
  }

  public listAdventures(): AdventureState[] {
    return Array.from(this.adventures.values());
  }

  public listActiveAdventures(): AdventureState[] {
    return Array.from(this.adventures.values()).filter((adventure) =>
      this.isAdventureActiveForCap(adventure),
    );
  }

  public getParticipantForSocket(
    socketId: string,
  ): SocketParticipantLink | null {
    return this.socketLinks.get(socketId) ?? null;
  }

  public getSocketIdsForPlayer(playerId: string): string[] {
    const matches: string[] = [];
    for (const [socketId, link] of this.socketLinks.entries()) {
      if (link.playerId === playerId) {
        matches.push(socketId);
      }
    }

    return matches;
  }

  private ensureRuntime(adventureId: string): AdventureRuntimeState {
    const existing = this.runtimeByAdventure.get(adventureId);
    if (existing) {
      return existing;
    }

    const created: AdventureRuntimeState = {
      voteTimer: null,
      votesByPlayerId: new Map<string, string>(),
      actionQueue: [],
      pendingOutcomeAction: null,
      pendingSceneClosure: null,
      processingAction: false,
      processingOutcomeDecision: false,
      pitchVoteInProgress: false,
      sceneCounter: 0,
      sceneTurnCounter: 0,
      sceneDirectActionCounter: 0,
      selectedPitch: null,
      rollingSummary: "",
      metagameDirectives: [],
      latencySamplesMs: [],
      finalizedAiRequestIds: new Set<string>(),
    };
    this.runtimeByAdventure.set(adventureId, created);
    return created;
  }

  private getConnectedPlayers(
    adventure: AdventureState,
  ): AdventureState["roster"] {
    return adventure.roster.filter(
      (entry) => entry.role === "player" && entry.connected,
    );
  }

  private createEmptyDebugScene(): NonNullable<AdventureState["debugScene"]> {
    return {
      secrets: [],
      pacingNotes: [],
      continuityWarnings: [],
      aiRequests: [],
      recentDecisions: [],
    };
  }

  private isAdventureActiveForCap(adventure: AdventureState): boolean {
    if (adventure.closed || adventure.phase === "ending") {
      return false;
    }

    return adventure.roster.some((entry) => entry.connected);
  }

  private getCharacterDisplayName(
    entry: AdventureState["roster"][number],
  ): string {
    const characterName = entry.setup?.characterName?.trim();
    if (characterName && characterName.length > 0) {
      return characterName;
    }

    return entry.displayName;
  }

  private enforceFailForwardConsequence(
    modelConsequence: string | undefined,
    failForward: boolean,
  ): string | undefined {
    if (modelConsequence && modelConsequence.trim().length > 0) {
      return this.sanitizeNarrationBeat(modelConsequence);
    }
    void failForward;
    return undefined;
  }

  private sanitizeNarrationBeat(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    const cleaned = value
      .trim()
      .replace(/^(consequence|npc\s*move|reward)\s*:\s*/i, "")
      .replace(/\s+/g, " ");

    return cleaned.length > 0 ? cleaned : undefined;
  }

  private buildPlayerVisibleStorytellerText(
    baseText: string,
    reward: string | undefined,
  ): string {
    const sections = [
      baseText.trim(),
      this.sanitizeNarrationBeat(reward),
    ].filter((section): section is string =>
      Boolean(section && section.length > 0),
    );

    return sections.join("\n\n");
  }

  private resolveNextSceneMode(
    currentMode: "low_tension" | "high_tension",
    nextTension: number,
    suggestedMode?: "low_tension" | "high_tension",
    tensionBand?: "low" | "medium" | "high",
  ): "low_tension" | "high_tension" {
    if (suggestedMode) {
      return suggestedMode;
    }
    if (tensionBand === "high") {
      return "high_tension";
    }
    if (tensionBand === "low") {
      return "low_tension";
    }
    if (nextTension >= HIGH_TENSION_THRESHOLD) {
      return "high_tension";
    }
    if (nextTension <= LOW_TENSION_THRESHOLD) {
      return "low_tension";
    }

    return currentMode;
  }

  private resolveTurnOrderRequirement(
    sceneMode: "low_tension" | "high_tension",
    turnOrderRequired?: boolean,
  ): boolean {
    if (typeof turnOrderRequired === "boolean") {
      return turnOrderRequired;
    }

    return sceneMode === "high_tension";
  }

  private updateActiveActorForScene(
    adventure: AdventureState,
    actingPlayerId: string | undefined,
    turnOrderRequired: boolean,
  ): void {
    if (!adventure.currentScene) {
      return;
    }

    if (!turnOrderRequired) {
      delete adventure.currentScene.activeActorPlayerId;
      delete adventure.currentScene.activeActorName;
      return;
    }

    const connectedPlayers = this.getConnectedPlayers(adventure);
    if (connectedPlayers.length === 0) {
      delete adventure.currentScene.activeActorPlayerId;
      delete adventure.currentScene.activeActorName;
      return;
    }

    let nextIndex = 0;
    if (actingPlayerId) {
      const actingIndex = connectedPlayers.findIndex(
        (entry) => entry.playerId === actingPlayerId,
      );
      if (actingIndex >= 0) {
        nextIndex = (actingIndex + 1) % connectedPlayers.length;
      }
    } else if (adventure.currentScene.activeActorPlayerId) {
      const existingIndex = connectedPlayers.findIndex(
        (entry) =>
          entry.playerId === adventure.currentScene?.activeActorPlayerId,
      );
      if (existingIndex >= 0) {
        nextIndex = existingIndex;
      }
    }

    const nextActor = connectedPlayers[nextIndex] ?? connectedPlayers[0];
    if (!nextActor) {
      delete adventure.currentScene.activeActorPlayerId;
      delete adventure.currentScene.activeActorName;
      return;
    }

    adventure.currentScene.activeActorPlayerId = nextActor.playerId;
    adventure.currentScene.activeActorName =
      this.getCharacterDisplayName(nextActor);
  }

  private appendDecisionLog(
    adventure: AdventureState,
    decision: Omit<
      NonNullable<AdventureState["debugScene"]>["recentDecisions"][number],
      "decisionId" | "createdAtIso"
    >,
  ): void {
    if (!adventure.debugMode) {
      return;
    }

    const currentDebug = adventure.debugScene ?? this.createEmptyDebugScene();
    const decisionEntry = {
      decisionId: createId("decision"),
      createdAtIso: new Date().toISOString(),
      ...decision,
    };

    adventure.debugScene = {
      ...currentDebug,
      recentDecisions: [...currentDebug.recentDecisions, decisionEntry].slice(
        -40,
      ),
    };
  }

  private assertAdventureOpen(adventure: AdventureState): void {
    if (adventure.closed || adventure.phase === "ending") {
      throw new Error("adventure is closed");
    }
  }

  private assertPhase(
    adventure: AdventureState,
    phases: AdventurePhase[],
    errorMessage: string,
  ): void {
    if (!phases.includes(adventure.phase)) {
      throw new Error(errorMessage);
    }
  }

  private getRosterEntry(
    adventure: AdventureState,
    playerId: string,
  ): AdventureState["roster"][number] {
    const entry = adventure.roster.find(
      (candidate) => candidate.playerId === playerId,
    );
    if (!entry) {
      throw new Error("player not in adventure");
    }

    return entry;
  }

  private setPhase(adventure: AdventureState, nextPhase: AdventurePhase): void {
    if (adventure.phase === nextPhase) {
      return;
    }

    adventure.phase = nextPhase;
    this.logDiagnostic(adventure, {
      type: "phase_changed",
      phase: nextPhase,
    });
    this.hooks.onPhaseChanged?.(adventure.adventureId, nextPhase);
  }

  private notifyAdventureUpdated(adventureId: string): void {
    this.hooks.onAdventureUpdated?.(adventureId);
  }

  private logDiagnostic(
    adventure: AdventureState,
    event: AdventureDiagnosticEvent,
  ): void {
    this.options.diagnosticsLogger?.logEvent(adventure, event);
  }

  private getNarrativeTranscript(
    entries: TranscriptEntry[],
  ): TranscriptEntry[] {
    return entries.filter(
      (entry) =>
        !isAiDebugTranscriptEntry(entry) && !isMetagameTranscriptEntry(entry),
    );
  }

  private appendMetagameDirective(
    runtime: AdventureRuntimeState,
    actorName: string,
    text: string,
  ): void {
    const normalizedText = text.trim().replace(/\s+/g, " ");
    if (normalizedText.length === 0) {
      return;
    }

    const duplicate = runtime.metagameDirectives.find(
      (directive) => directive.text.toLowerCase() === normalizedText.toLowerCase(),
    );
    if (duplicate) {
      return;
    }

    runtime.metagameDirectives.push({
      directiveId: createId("mg"),
      createdAtIso: new Date().toISOString(),
      actorName,
      text: normalizedText,
    });

    if (runtime.metagameDirectives.length > 12) {
      runtime.metagameDirectives.splice(
        0,
        runtime.metagameDirectives.length - 12,
      );
    }
  }

  private getBindingDirectiveTexts(runtime: AdventureRuntimeState): string[] {
    return runtime.metagameDirectives
      .slice(-8)
      .map((directive) => `${directive.actorName}: ${directive.text}`);
  }

  private setCharacterPortraitEntry(
    adventure: AdventureState,
    entry: {
      characterNameKey: string;
      characterName: string;
      imageUrl: string;
      status: "placeholder" | "pending" | "ready" | "failed" | "disabled";
      updatedAtIso: string;
    },
  ): void {
    const parsedEntry = characterPortraitEntrySchema.parse(entry);
    adventure.characterPortraitsByName = {
      ...(adventure.characterPortraitsByName ?? {}),
      [parsedEntry.characterNameKey]: parsedEntry,
    };
  }

  private async resolveCharacterPortrait(
    adventureId: string,
    input: {
      characterNameKey: string;
      characterName: string;
      visualDescription: string;
    },
  ): Promise<void> {
    const portraitService = this.options.characterPortraitService;
    if (!portraitService) {
      return;
    }

    try {
      const result = await portraitService.ensurePortrait({
        characterName: input.characterName,
        visualDescription: input.visualDescription,
      });
      const adventure = this.adventures.get(adventureId);
      if (!adventure) {
        return;
      }

      this.setCharacterPortraitEntry(adventure, {
        characterNameKey: result.characterNameKey,
        characterName: result.characterName,
        imageUrl: result.imageUrl,
        status: result.status,
        updatedAtIso: new Date().toISOString(),
      });
      this.notifyAdventureUpdated(adventureId);
    } catch {
      const adventure = this.adventures.get(adventureId);
      if (!adventure) {
        return;
      }

      this.setCharacterPortraitEntry(adventure, {
        characterNameKey: input.characterNameKey,
        characterName: input.characterName,
        imageUrl: CHARACTER_PORTRAIT_PLACEHOLDER_URL,
        status: "failed",
        updatedAtIso: new Date().toISOString(),
      });
      this.notifyAdventureUpdated(adventureId);
    }
  }

  private appendTranscriptEntry(
    adventure: AdventureState,
    entry: Pick<TranscriptEntry, "kind" | "author" | "text">,
    options: {
      aiRequest?: AiRequestLogEntry;
    } = {},
  ): TranscriptEntry {
    const transcriptEntry = transcriptEntrySchema.parse({
      entryId: createId("t"),
      kind: entry.kind,
      author: entry.author,
      text: entry.text,
      createdAtIso: new Date().toISOString(),
      aiRequest: options.aiRequest,
    });

    adventure.transcript.push(transcriptEntry);
    this.logDiagnostic(adventure, {
      type: "transcript_append",
      entry: transcriptEntry,
    });
    this.hooks.onTranscriptAppend?.(adventure.adventureId, transcriptEntry);
    return transcriptEntry;
  }

  private recordAiRequestCost(
    adventure: AdventureState,
    request: AiRequestLogEntry,
  ): boolean {
    if (request.status === "started") {
      return false;
    }

    const runtime = this.ensureRuntime(adventure.adventureId);
    if (runtime.finalizedAiRequestIds.has(request.requestId)) {
      return false;
    }
    runtime.finalizedAiRequestIds.add(request.requestId);

    const current = adventure.aiCostMetrics;
    const usage = request.usage;
    const promptTokens = usage?.promptTokens ?? 0;
    const completionTokens = usage?.completionTokens ?? 0;
    const totalTokens = usage?.totalTokens ?? (promptTokens + completionTokens);
    const hasCost = typeof usage?.costCredits === "number";

    adventure.aiCostMetrics = {
      totalCostCredits: current.totalCostCredits + (usage?.costCredits ?? 0),
      trackedRequestCount: current.trackedRequestCount + 1,
      missingCostRequestCount:
        current.missingCostRequestCount + (hasCost ? 0 : 1),
      totalPromptTokens: current.totalPromptTokens + promptTokens,
      totalCompletionTokens: current.totalCompletionTokens + completionTokens,
      totalTokens: current.totalTokens + totalTokens,
      updatedAtIso: new Date().toISOString(),
    };
    return true;
  }

  private formatAiRequestUsageSummary(request: AiRequestLogEntry): string | null {
    const usage = request.usage;
    if (!usage) {
      return null;
    }

    const lines: string[] = [];
    if (typeof usage.costCredits === "number") {
      lines.push(`Cost (credits): ${usage.costCredits.toFixed(6)}`);
    }
    if (typeof usage.upstreamInferenceCostCredits === "number") {
      lines.push(
        `Upstream inference cost (credits): ${usage.upstreamInferenceCostCredits.toFixed(6)}`,
      );
    }
    if (typeof usage.promptTokens === "number") {
      lines.push(`Prompt tokens: ${usage.promptTokens}`);
    }
    if (typeof usage.completionTokens === "number") {
      lines.push(`Completion tokens: ${usage.completionTokens}`);
    }
    if (typeof usage.totalTokens === "number") {
      lines.push(`Total tokens: ${usage.totalTokens}`);
    }
    if (typeof usage.cachedTokens === "number") {
      lines.push(`Cached tokens: ${usage.cachedTokens}`);
    }
    if (typeof usage.reasoningTokens === "number") {
      lines.push(`Reasoning tokens: ${usage.reasoningTokens}`);
    }

    return lines.length > 0 ? lines.join("\n") : null;
  }

  private async maybeStartAdventurePitchVote(
    adventureId: string,
  ): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    if (
      !adventure ||
      adventure.phase !== "lobby" ||
      adventure.activeVote ||
      adventure.closed
    ) {
      return;
    }

    const runtime = this.ensureRuntime(adventureId);
    if (runtime.pitchVoteInProgress) {
      return;
    }

    const connectedPlayers = this.getConnectedPlayers(adventure);
    if (connectedPlayers.length === 0) {
      return;
    }

    const everyoneReady = connectedPlayers.every((entry) => entry.ready);
    if (!everyoneReady) {
      return;
    }

    runtime.pitchVoteInProgress = true;
    try {
      this.hooks.onStorytellerThinking?.(adventureId, {
        active: true,
        label: "Generating adventure pitches...",
        showInTranscript: false,
      });

      const pitchInputs: PitchInput[] = connectedPlayers.map((entry) => ({
        displayName: entry.displayName,
        characterName: entry.setup?.characterName ?? entry.displayName,
        visualDescription:
          entry.setup?.visualDescription ?? "No description provided.",
        adventurePreference: entry.setup?.adventurePreference ?? "",
      }));

      const generatedPitches =
        await this.options.storyteller.generateAdventurePitches(
          pitchInputs,
          adventure.runtimeConfig,
          { adventureId },
        );

      const refreshedAdventure = this.adventures.get(adventureId);
      if (
        !refreshedAdventure ||
        refreshedAdventure.phase !== "lobby" ||
        refreshedAdventure.activeVote ||
        refreshedAdventure.closed
      ) {
        return;
      }

      const voteOptions = generatedPitches.slice(0, 3).map((pitch, index) =>
        voteOptionSchema.parse({
          optionId: `pitch-${index + 1}`,
          title: pitch.title,
          description: pitch.description,
          voteCount: 0,
        }),
      );

      this.setPhase(refreshedAdventure, "vote");
      this.startVote(
        refreshedAdventure,
        "adventure_pitch",
        "Choose your adventure",
        "Pick one pitch to start this session.",
        voteOptions,
      );
      this.appendTranscriptEntry(refreshedAdventure, {
        kind: "system",
        author: "System",
        text: "Adventure pitches generated. Waiting for votes.",
      });
      this.notifyAdventureUpdated(adventureId);
    } finally {
      this.hooks.onStorytellerThinking?.(adventureId, {
        active: false,
        label: "",
        showInTranscript: false,
      });
      runtime.pitchVoteInProgress = false;
    }
  }

  private startVote(
    adventure: AdventureState,
    kind: VoteKind,
    title: string,
    prompt: string,
    options: VoteOption[],
  ): void {
    const runtime = this.ensureRuntime(adventure.adventureId);
    this.clearVoteTimer(adventure.adventureId);
    runtime.votesByPlayerId.clear();

    for (const entry of adventure.roster) {
      if (entry.role === "player") {
        entry.hasVoted = false;
      }
    }

    const startedAt = new Date();
    const timeoutMs = adventure.runtimeConfig.voteTimeoutMs;
    const closesAt = new Date(startedAt.getTime() + timeoutMs);
    adventure.activeVote = activeVoteSchema.parse({
      voteId: createId("vote"),
      kind,
      title,
      prompt,
      options,
      startedAtIso: startedAt.toISOString(),
      timeoutMs,
      closesAtIso: closesAt.toISOString(),
    });

    runtime.voteTimer = setTimeout(() => {
      void this.resolveVote(adventure.adventureId, true);
    }, timeoutMs);
  }

  private clearVoteTimer(adventureId: string): void {
    const runtime = this.runtimeByAdventure.get(adventureId);
    if (!runtime?.voteTimer) {
      return;
    }

    clearTimeout(runtime.voteTimer);
    runtime.voteTimer = null;
  }

  private refreshVoteTallies(adventureId: string): void {
    const adventure = this.adventures.get(adventureId);
    const runtime = this.runtimeByAdventure.get(adventureId);
    if (!adventure?.activeVote || !runtime) {
      return;
    }

    const countsByOption = new Map<string, number>();
    for (const optionId of runtime.votesByPlayerId.values()) {
      countsByOption.set(optionId, (countsByOption.get(optionId) ?? 0) + 1);
    }

    adventure.activeVote.options = adventure.activeVote.options.map(
      (option) => ({
        ...option,
        voteCount: countsByOption.get(option.optionId) ?? 0,
      }),
    );
  }

  private async maybeResolveActiveVoteEarly(
    adventureId: string,
  ): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    const runtime = this.runtimeByAdventure.get(adventureId);
    if (!adventure?.activeVote || !runtime) {
      return;
    }

    const connectedPlayers = this.getConnectedPlayers(adventure);
    if (connectedPlayers.length === 0) {
      return;
    }

    const everyoneVoted = connectedPlayers.every((entry) =>
      runtime.votesByPlayerId.has(entry.playerId),
    );
    if (!everyoneVoted) {
      return;
    }

    await this.resolveVote(adventureId, false);
  }

  private async resolveVote(
    adventureId: string,
    timeoutClosed: boolean,
  ): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    const runtime = this.runtimeByAdventure.get(adventureId);
    if (!adventure?.activeVote || !runtime) {
      return;
    }

    const vote = adventure.activeVote;
    this.clearVoteTimer(adventureId);
    this.refreshVoteTallies(adventureId);

    const highestVoteCount = Math.max(
      ...vote.options.map((option) => option.voteCount),
      0,
    );
    const tiedTopOptions = vote.options.filter(
      (option) => option.voteCount === highestVoteCount,
    );
    const winner =
      tiedTopOptions[Math.floor(Math.random() * tiedTopOptions.length)] ??
      vote.options[0];
    if (!winner) {
      return;
    }

    vote.resolution = {
      winnerOptionId: winner.optionId,
      timeoutClosed,
      tieBreakApplied: tiedTopOptions.length > 1,
      tiedOptionIds:
        tiedTopOptions.length > 1
          ? tiedTopOptions.map((option) => option.optionId)
          : [],
    };

    this.notifyAdventureUpdated(adventureId);

    if (vote.kind === "adventure_pitch") {
      runtime.selectedPitch = {
        title: winner.title,
        description: winner.description,
      };
      this.appendTranscriptEntry(adventure, {
        kind: "system",
        author: "System",
        text: `Adventure selected: ${winner.title}.`,
      });
      adventure.activeVote = undefined;
      this.setPhase(adventure, "play");
      await this.startScene(adventureId);
      return;
    }

    this.appendTranscriptEntry(adventure, {
      kind: "system",
      author: "System",
      text: `Transition vote selected: ${winner.title}.`,
    });
    adventure.activeVote = undefined;
    this.notifyAdventureUpdated(adventureId);

    if (winner.optionId === "end_session") {
      await this.closeAdventure(
        adventureId,
        "Session ended by vote after closing the current scene.",
      );
      return;
    }

    await this.startScene(adventureId, adventure.currentScene?.summary);
  }

  private async startScene(
    adventureId: string,
    previousSceneSummary?: string,
  ): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    if (!adventure || adventure.phase !== "play" || adventure.closed) {
      return;
    }

    const runtime = this.ensureRuntime(adventureId);
    runtime.sceneCounter += 1;
    runtime.sceneTurnCounter = 0;
    runtime.sceneDirectActionCounter = 0;
    runtime.pendingOutcomeAction = null;
    runtime.pendingSceneClosure = null;
    runtime.processingOutcomeDecision = false;
    adventure.activeOutcomeCheck = undefined;

    const pitchTitle = runtime.selectedPitch?.title ?? "Uncharted Trouble";
    const pitchDescription =
      runtime.selectedPitch?.description ??
      "A dangerous opportunity appears and demands action before the window closes.";
    const partyMembers = this.getConnectedPlayers(adventure).map((entry) =>
      this.getCharacterDisplayName(entry),
    );

    const sceneId = createId("scene");
    adventure.currentScene = scenePublicSchema.parse({
      sceneId,
      imagePending: false,
      mode: "low_tension",
      tension: 35,
      introProse: PENDING_SCENE_INTRO,
      orientationBullets: PENDING_SCENE_BULLETS,
    });
    this.notifyAdventureUpdated(adventureId);

    this.hooks.onStorytellerThinking?.(adventureId, {
      active: true,
      label: `Framing scene ${runtime.sceneCounter}...`,
      showInTranscript: true,
    });

    try {
      const sceneStart = await this.options.storyteller.generateSceneStart(
        {
          pitchTitle,
          pitchDescription,
          sceneNumber: runtime.sceneCounter,
          previousSceneSummary,
          partyMembers,
          transcriptTail: this.getNarrativeTranscript(
            adventure.transcript,
          ).slice(-12),
        },
        adventure.runtimeConfig,
        { adventureId },
      );

      const refreshedAdventure = this.adventures.get(adventureId);
      if (
        !refreshedAdventure ||
        refreshedAdventure.phase !== "play" ||
        refreshedAdventure.closed ||
        !refreshedAdventure.currentScene ||
        refreshedAdventure.currentScene.sceneId !== sceneId
      ) {
        return;
      }

      refreshedAdventure.currentScene = scenePublicSchema.parse({
        sceneId,
        imagePending: true,
        mode:
          (sceneStart.debug.tension ?? 45) >= HIGH_TENSION_THRESHOLD
            ? "high_tension"
            : "low_tension",
        tension: clampTension(sceneStart.debug.tension ?? 45),
        introProse: sceneStart.introProse,
        orientationBullets: sceneStart.orientationBullets,
      });

      this.updateActiveActorForScene(
        refreshedAdventure,
        undefined,
        refreshedAdventure.currentScene.mode === "high_tension",
      );
      const existingAiRequests =
        refreshedAdventure.debugScene?.aiRequests ?? [];
      refreshedAdventure.debugScene = {
        ...sceneStart.debug,
        aiRequests: existingAiRequests,
      };

      this.appendTranscriptEntry(refreshedAdventure, {
        kind: "storyteller",
        author: "Storyteller",
        text: sceneStart.playerPrompt,
      });

      if (
        refreshedAdventure.currentScene.mode === "high_tension" &&
        refreshedAdventure.currentScene.activeActorName
      ) {
        this.appendTranscriptEntry(refreshedAdventure, {
          kind: "player",
          author: refreshedAdventure.currentScene.activeActorName,
          text: `acts next.`,
        });
      }

      await this.refreshContinuity(adventureId);
      this.notifyAdventureUpdated(adventureId);

      void this.generateSceneStartImage(adventureId, sceneId);
    } finally {
      this.hooks.onStorytellerThinking?.(adventureId, {
        active: false,
        label: "",
        showInTranscript: true,
      });
    }
  }

  private async generateSceneStartImage(
    adventureId: string,
    sceneId: string,
  ): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    if (
      !adventure?.currentScene ||
      adventure.currentScene.sceneId !== sceneId
    ) {
      return;
    }

    const imageUrl = await this.options.storyteller.generateSceneImage(
      adventure.currentScene,
      adventure.runtimeConfig,
      { adventureId },
    );

    const refreshedAdventure = this.adventures.get(adventureId);
    if (
      !refreshedAdventure?.currentScene ||
      refreshedAdventure.currentScene.sceneId !== sceneId
    ) {
      return;
    }

    refreshedAdventure.currentScene.imagePending = false;
    if (imageUrl) {
      refreshedAdventure.currentScene.imageUrl = imageUrl;
    }
    this.notifyAdventureUpdated(adventureId);
  }

  private async generateSceneClosingImage(
    adventureId: string,
    sceneId: string,
  ): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    if (
      !adventure?.currentScene ||
      adventure.currentScene.sceneId !== sceneId ||
      !adventure.currentScene.closingProse
    ) {
      return;
    }

    const promptScene = scenePublicSchema.parse({
      ...adventure.currentScene,
      introProse: adventure.currentScene.closingProse,
      imagePending: false,
      imageUrl: undefined,
      closingImagePending: false,
      closingImageUrl: undefined,
    });

    const imageUrl = await this.options.storyteller.generateSceneImage(
      promptScene,
      adventure.runtimeConfig,
      { adventureId },
    );

    const refreshedAdventure = this.adventures.get(adventureId);
    if (
      !refreshedAdventure?.currentScene ||
      refreshedAdventure.currentScene.sceneId !== sceneId
    ) {
      return;
    }

    refreshedAdventure.currentScene.closingImagePending = false;
    if (imageUrl) {
      refreshedAdventure.currentScene.closingImageUrl = imageUrl;
    }
    this.notifyAdventureUpdated(adventureId);
  }

  private async processActionQueue(adventureId: string): Promise<void> {
    const runtime = this.ensureRuntime(adventureId);
    if (runtime.processingAction) {
      return;
    }

    runtime.processingAction = true;

    try {
      while (runtime.actionQueue.length > 0) {
        const adventure = this.adventures.get(adventureId);
        if (
          !adventure ||
          adventure.phase !== "play" ||
          adventure.closed ||
          !adventure.currentScene
        ) {
          runtime.actionQueue = [];
          break;
        }

        const actionItem = runtime.actionQueue.shift();
        if (!actionItem) {
          break;
        }
        const pendingSceneClosure = runtime.pendingSceneClosure;

        this.hooks.onStorytellerThinking?.(adventureId, {
          active: true,
          label: "Storyteller is thinking...",
          showInTranscript: false,
        });

        let actionResponse: ActionResponseResult;
        let sceneReaction: Awaited<
          ReturnType<StorytellerService["resolveSceneReaction"]>
        > | null = null;
        const startedAtMs = Date.now();
        this.hooks.onStorytellerResponseChunk?.(adventureId, {
          text: "",
          reset: true,
        });
        try {
          const actingPlayer = this.getRosterEntry(
            adventure,
            actionItem.playerId,
          );
          const actorCharacterName = this.getCharacterDisplayName(actingPlayer);
          const transcriptTail = this.getNarrativeTranscript(
            adventure.transcript,
          ).slice(-14);
          const bindingDirectives = this.getBindingDirectiveTexts(runtime);
          const directActionCountInScene =
            actionItem.intent === "direct_action" && !actionItem.sceneClosureAction
              ? runtime.sceneDirectActionCounter + 1
              : runtime.sceneDirectActionCounter;

          try {
            actionResponse = await this.options.storyteller.narrateAction(
              {
                pitchTitle: runtime.selectedPitch?.title ?? "Uncharted Trouble",
                pitchDescription:
                  runtime.selectedPitch?.description ??
                  "A dangerous opportunity appears and demands action before the window closes.",
                actorCharacterName,
                actionText: actionItem.text,
                actionIntent: actionItem.intent,
                directActionCountInScene,
                turnNumber: runtime.sceneTurnCounter + 1,
                responseMode: actionItem.responseMode,
                detailLevel: actionItem.detailLevel,
                outcomeCheckTriggered: actionItem.outcomeCheckTriggered,
                allowHardDenyWithoutOutcomeCheck:
                  actionItem.allowHardDenyWithoutOutcomeCheck,
                hardDenyReason: actionItem.hardDenyReason,
                bindingDirectives,
                scene: adventure.currentScene,
                transcriptTail,
                rollingSummary: runtime.rollingSummary,
              },
              adventure.runtimeConfig,
              { adventureId },
              {
                onChunk: (chunk) => {
                  if (chunk.length === 0) {
                    return;
                  }

                  this.hooks.onStorytellerResponseChunk?.(adventureId, {
                    text: chunk,
                  });
                },
              },
            );
          } catch {
            actionResponse = {
              text: "The situation jolts forward anyway, forcing a new choice before the pressure collapses.",
              closeScene: false,
              debug: {
                tension: 55,
                secrets: [],
                pacingNotes: [
                  "Recover from model failure with neutral fail-forward narration.",
                ],
                continuityWarnings: [],
                aiRequests: [],
                recentDecisions: [],
              },
            };
          }
          actionResponse = {
            ...actionResponse,
            text: actionResponse.text.trim(),
          };
          try {
            if (
              !actionItem.sceneClosureAction &&
              typeof this.options.storyteller.resolveSceneReaction ===
                "function"
            ) {
              sceneReaction =
                await this.options.storyteller.resolveSceneReaction(
                  {
                    pitchTitle:
                      runtime.selectedPitch?.title ?? "Uncharted Trouble",
                    pitchDescription:
                      runtime.selectedPitch?.description ??
                      "A dangerous opportunity appears and demands action before the window closes.",
                    actorCharacterName,
                    actionText: actionItem.text,
                    actionIntent: actionItem.intent,
                    directActionCountInScene,
                    actionResponseText: actionResponse.text,
                    turnNumber: runtime.sceneTurnCounter + 1,
                    bindingDirectives,
                    scene: adventure.currentScene,
                    transcriptTail,
                    rollingSummary: runtime.rollingSummary,
                  },
                  adventure.runtimeConfig,
                  { adventureId },
                );
            }
          } catch {
            sceneReaction = null;
          }

          runtime.sceneTurnCounter += 1;
          if (actionItem.intent === "direct_action" && !actionItem.sceneClosureAction) {
            runtime.sceneDirectActionCounter += 1;
          }
          const elapsedMs = Date.now() - startedAtMs;
          this.recordLatency(adventure, elapsedMs, runtime);

          const enforcedConsequence = this.enforceFailForwardConsequence(
            sceneReaction?.consequence,
            sceneReaction?.failForward ?? false,
          );
          const sanitizedNpcBeat = this.sanitizeNarrationBeat(
            sceneReaction?.npcBeat,
          );
          const sanitizedReward = this.sanitizeNarrationBeat(
            sceneReaction?.reward,
          );
          const rewardGranted =
            sceneReaction?.goalStatus === "completed" &&
            Boolean(sanitizedReward);
          const storytellerText = this.buildPlayerVisibleStorytellerText(
            actionResponse.text,
            rewardGranted ? sanitizedReward : undefined,
          );

          if (actionItem.sceneClosureAction) {
            this.appendTranscriptEntry(adventure, {
              kind: "storyteller",
              author: "Storyteller",
              text: storytellerText,
            });
            this.hooks.onStorytellerResponse?.(adventureId, {
              text: storytellerText,
            });

            const sceneSummary =
              actionResponse.sceneSummary ??
              summarizeClosingNarration(storytellerText) ??
              pendingSceneClosure?.summary ??
              SCENE_TRANSITION_SUMMARY_FALLBACK;
            runtime.pendingSceneClosure = null;

            await this.refreshContinuity(adventureId);
            this.notifyAdventureUpdated(adventureId);
            await this.beginSceneTransitionVote(
              adventureId,
              sceneSummary,
              {
                showClosingCard: false,
              },
            );
            runtime.actionQueue = [];
            break;
          }

          const previousMode = adventure.currentScene.mode;
          const previousTension = adventure.currentScene.tension;
          const previousTurnOrderRequired = Boolean(
            adventure.currentScene.activeActorPlayerId,
          );
          const nextTension = clampTension(
            sceneReaction?.tension ?? previousTension,
          );
          const nextMode = this.resolveNextSceneMode(
            previousMode,
            nextTension,
            sceneReaction?.sceneMode,
            sceneReaction?.tensionBand,
          );
          const nextTurnOrderRequired = this.resolveTurnOrderRequirement(
            nextMode,
            sceneReaction?.turnOrderRequired,
          );
          adventure.currentScene.tension = nextTension;
          adventure.currentScene.mode = nextMode;
          this.updateActiveActorForScene(
            adventure,
            nextTurnOrderRequired ? actionItem.playerId : undefined,
            nextTurnOrderRequired,
          );
          const shouldCloseScene =
            actionResponse.closeScene || sceneReaction?.closeScene === true;

          this.appendTranscriptEntry(adventure, {
            kind: "storyteller",
            author: "Storyteller",
            text: storytellerText,
          });
          this.hooks.onStorytellerResponse?.(adventureId, {
            text: storytellerText,
          });

          if (!shouldCloseScene && nextMode !== previousMode) {
            this.appendTranscriptEntry(adventure, {
              kind: "system",
              author: "System",
              text:
                nextMode === "high_tension"
                  ? nextTurnOrderRequired
                    ? "Tension spikes. Turn order tightens and immediate actions matter."
                    : "Pressure rises, but no one is under direct scrutiny yet."
                  : "Immediate pressure drops. Freeform action resumes.",
            });
          }
          if (
            !shouldCloseScene &&
            nextTurnOrderRequired &&
            adventure.currentScene.activeActorName
          ) {
            this.appendTranscriptEntry(adventure, {
              kind: "system",
              author: "System",
              text: `High tension turn order: ${adventure.currentScene.activeActorName} acts next.`,
            });
          } else if (
            !shouldCloseScene &&
            previousTurnOrderRequired &&
            !nextTurnOrderRequired
          ) {
            this.appendTranscriptEntry(adventure, {
              kind: "system",
              author: "System",
              text: "Direct scrutiny ends. Players may act freely while the queue is clear.",
            });
          }

          const currentDebug =
            adventure.debugScene ?? this.createEmptyDebugScene();
          const existingAiRequests = currentDebug.aiRequests ?? [];
          const mergedPacing = [
            ...(actionResponse.debug.pacingNotes ?? []),
            ...(sceneReaction?.debug.pacingNotes ?? []),
          ];
          const mergedWarnings = Array.from(
            new Set([
              ...(actionResponse.debug.continuityWarnings ?? []),
              ...(sceneReaction?.debug.continuityWarnings ?? []),
            ]),
          );
          adventure.debugScene = {
            ...actionResponse.debug,
            tension: nextTension,
            pacingNotes: mergedPacing,
            continuityWarnings: mergedWarnings,
            aiRequests: existingAiRequests,
            recentDecisions: currentDebug.recentDecisions ?? [],
          };

          this.appendDecisionLog(adventure, {
            turnNumber: runtime.sceneTurnCounter,
            actorName: actorCharacterName,
            responseMode: actionItem.responseMode,
            outcomeCheckTriggered: actionItem.outcomeCheckTriggered,
            goalStatus: sceneReaction?.goalStatus ?? "advanced",
            rewardGranted,
            failForwardApplied: Boolean(enforcedConsequence),
            modeBefore: previousMode,
            modeAfter: nextMode,
            tensionBefore: previousTension,
            tensionAfter: nextTension,
            reasoning: [
              ...(sceneReaction?.reasoning ?? []),
              ...(sceneReaction?.tensionReason
                ? [`Tension reason: ${sceneReaction.tensionReason}`]
                : []),
              ...(sanitizedNpcBeat
                ? [
                    "NPC agenda beat executed.",
                    `NPC beat detail: ${sanitizedNpcBeat}`,
                  ]
                : []),
              ...(enforcedConsequence
                ? [
                    "Fail-forward cost applied to keep momentum.",
                    `Consequence detail: ${enforcedConsequence}`,
                  ]
                : []),
              ...(rewardGranted && sanitizedReward
                ? [
                    "Reward granted after goal completion.",
                    `Reward detail: ${sanitizedReward}`,
                  ]
                : []),
            ],
          });

          await this.refreshContinuity(adventureId);
          this.notifyAdventureUpdated(adventureId);

          if (shouldCloseScene) {
            const sceneSummary =
              sceneReaction?.sceneSummary ??
              actionResponse.sceneSummary ??
              "The group resolves the immediate pressure and must choose whether to continue or end.";
            runtime.pendingSceneClosure = {
              summary: sceneSummary,
              requestedAtIso: new Date().toISOString(),
            };
            this.appendTranscriptEntry(adventure, {
              kind: "storyteller",
              author: "Storyteller",
              text:
                `${actorCharacterName}, give one final finishing move that secures the objective. ` +
                "Describe how the scene closes, then we will transition.",
            });
            this.hooks.onStorytellerResponse?.(adventureId, {
              text:
                `${actorCharacterName}, give one final finishing move that secures the objective. ` +
                "Describe how the scene closes, then we will transition.",
            });
            this.notifyAdventureUpdated(adventureId);
            runtime.actionQueue = [];
            break;
          }
        } finally {
          this.hooks.onStorytellerResponseChunk?.(adventureId, {
            text: "",
            done: true,
          });
          this.hooks.onStorytellerThinking?.(adventureId, {
            active: false,
            label: "",
            showInTranscript: false,
          });
        }
      }
    } finally {
      runtime.processingAction = false;
    }
  }

  private recordLatency(
    adventure: AdventureState,
    elapsedMs: number,
    runtime: AdventureRuntimeState,
  ): void {
    runtime.latencySamplesMs.push(elapsedMs);
    if (runtime.latencySamplesMs.length > 200) {
      runtime.latencySamplesMs.shift();
    }

    const sampleTotal = runtime.latencySamplesMs.reduce(
      (sum, current) => sum + current,
      0,
    );
    const averageMs =
      runtime.latencySamplesMs.length > 0
        ? sampleTotal / runtime.latencySamplesMs.length
        : 0;

    adventure.latencyMetrics = {
      actionCount: runtime.latencySamplesMs.length,
      averageMs,
      p90Ms: percentile90(runtime.latencySamplesMs),
      updatedAtIso: new Date().toISOString(),
    };
  }

  private async refreshContinuity(adventureId: string): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    const runtime = this.runtimeByAdventure.get(adventureId);
    if (!adventure || !runtime) {
      return;
    }

    const continuity = await this.options.storyteller.updateContinuity(
      this.getNarrativeTranscript(adventure.transcript),
      adventure.runtimeConfig,
      { adventureId },
    );
    runtime.rollingSummary = continuity.rollingSummary;

    const currentDebug = adventure.debugScene ?? this.createEmptyDebugScene();
    adventure.debugScene = {
      ...currentDebug,
      continuityWarnings: continuity.continuityWarnings,
    };
  }

  private async beginSceneTransitionVote(
    adventureId: string,
    sceneSummary: string,
    options: SceneTransitionVoteOptions = {},
  ): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    if (
      !adventure ||
      adventure.phase !== "play" ||
      !adventure.currentScene ||
      adventure.closed
    ) {
      return;
    }

    const sceneId = adventure.currentScene.sceneId;
    const runtime = this.runtimeByAdventure.get(adventureId);
    if (runtime) {
      runtime.pendingSceneClosure = null;
    }
    const normalizedSummary = normalizeSceneTransitionSummary(sceneSummary);
    const showClosingCard = options.showClosingCard ?? true;

    adventure.currentScene.summary = normalizedSummary;
    if (showClosingCard) {
      const closingProse = options.closingProse?.trim();
      adventure.currentScene.closingProse =
        closingProse && closingProse.length > 0
          ? closingProse
          : normalizedSummary;
      adventure.currentScene.closingImagePending = true;
      delete adventure.currentScene.closingImageUrl;
    } else {
      delete adventure.currentScene.closingProse;
      adventure.currentScene.closingImagePending = false;
      delete adventure.currentScene.closingImageUrl;
    }
    this.appendTranscriptEntry(adventure, {
      kind: "system",
      author: "System",
      text: "Scene ended. Choose whether to continue this session with a new scene or end the session now.",
    });

    if (showClosingCard) {
      void this.generateSceneClosingImage(adventureId, sceneId);
    }

    this.startVote(
      adventure,
      "scene_transition",
      "Scene complete: choose the next session step",
      "This scene is closed. Continue the session with a new scene, or end the session now.",
      [
        voteOptionSchema.parse({
          optionId: "next_scene",
          title: "Next Scene",
          description: "Start a new scene in this same session.",
          voteCount: 0,
        }),
        voteOptionSchema.parse({
          optionId: "end_session",
          title: "End Session",
          description:
            "End this session now and keep the current adventure transcript.",
          voteCount: 0,
        }),
      ],
    );
    this.notifyAdventureUpdated(adventureId);
  }

  private async closeAdventure(
    adventureId: string,
    reason: string,
  ): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    if (!adventure) {
      return;
    }

    this.clearVoteTimer(adventureId);
    const runtime = this.ensureRuntime(adventureId);
    runtime.actionQueue = [];
    runtime.pendingOutcomeAction = null;
    runtime.pendingSceneClosure = null;
    runtime.processingOutcomeDecision = false;
    adventure.activeOutcomeCheck = undefined;

    if (!adventure.closed) {
      this.appendTranscriptEntry(adventure, {
        kind: "system",
        author: "System",
        text: reason,
      });
    }

    const summary = await this.options.storyteller.summarizeSession(
      this.getNarrativeTranscript(adventure.transcript),
      adventure.runtimeConfig,
      { adventureId },
    );
    const forwardHook = await this.options.storyteller.craftSessionForwardHook(
      this.getNarrativeTranscript(adventure.transcript),
      summary,
      adventure.runtimeConfig,
      { adventureId },
    );

    adventure.activeVote = undefined;
    adventure.closed = true;
    adventure.sessionSummary = summary;
    adventure.sessionForwardHook = forwardHook;
    this.setPhase(adventure, "ending");
    this.logDiagnostic(adventure, {
      type: "session_closed",
      reason,
      summary,
    });
    this.options.diagnosticsLogger?.closeSession(adventureId);
    this.notifyAdventureUpdated(adventureId);
  }

  private requireAdventure(adventureId: string): AdventureState {
    const adventure = this.adventures.get(adventureId);
    if (!adventure) {
      throw new Error("adventure not found");
    }

    return adventure;
  }
}
