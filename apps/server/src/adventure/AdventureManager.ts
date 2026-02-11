import {
  activeVoteSchema,
  activeOutcomeCheckSchema,
  AdventurePhase,
  AdventureState,
  AiRequestLogEntry,
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
  endSessionPayloadSchema,
  joinAdventurePayloadSchema,
  JoinAdventurePayload,
  playOutcomeCardPayloadSchema,
  submitActionPayloadSchema,
  submitSetupPayloadSchema,
  toggleReadyPayloadSchema,
  updateRuntimeConfigPayloadSchema,
} from "@mighty-decks/spec/events";
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
import { createInitialAdventureState } from "./createAdventureState";

interface SocketParticipantLink {
  adventureId: string;
  playerId: string;
}

interface ActionQueueItem {
  playerId: string;
  text: string;
}

interface AdventureRuntimeState {
  voteTimer: NodeJS.Timeout | null;
  votesByPlayerId: Map<string, string>;
  actionQueue: ActionQueueItem[];
  pendingOutcomeAction: ActionQueueItem | null;
  processingAction: boolean;
  pitchVoteInProgress: boolean;
  sceneCounter: number;
  sceneTurnCounter: number;
  selectedPitch: { title: string; description: string } | null;
  rollingSummary: string;
  latencySamplesMs: number[];
}

export interface AdventureManagerHooks {
  onAdventureUpdated?: (adventureId: string) => void;
  onPhaseChanged?: (adventureId: string, phase: AdventurePhase) => void;
  onTranscriptAppend?: (adventureId: string, entry: TranscriptEntry) => void;
  onStorytellerThinking?: (adventureId: string, payload: { active: boolean; label: string }) => void;
  onStorytellerResponse?: (adventureId: string, payload: { text: string }) => void;
}

export interface AdventureManagerOptions {
  debugMode: boolean;
  maxActiveAdventures: number;
  runtimeConfigDefaults: RuntimeConfig;
  storyteller: StorytellerService;
  diagnosticsLogger?: AdventureDiagnosticsLogger;
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
    narrationHint: "Introduce a surprising twist that reshapes immediate priorities.",
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

const percentile90 = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.9) - 1);
  return sorted[index] ?? 0;
};

export class AdventureManager {
  private readonly adventures = new Map<string, AdventureState>();
  private readonly socketLinks = new Map<string, SocketParticipantLink>();
  private readonly runtimeByAdventure = new Map<string, AdventureRuntimeState>();
  private runtimeConfig: RuntimeConfig;
  private hooks: AdventureManagerHooks = {};

  public constructor(private readonly options: AdventureManagerOptions) {
    this.runtimeConfig = runtimeConfigSchema.parse(options.runtimeConfigDefaults);
  }

  public setHooks(hooks: AdventureManagerHooks): void {
    this.hooks = hooks;
  }

  public appendAiRequestLog(event: AiRequestDebugEvent): void {
    const adventure = this.adventures.get(event.adventureId);
    if (!adventure || !adventure.debugMode) {
      return;
    }

    const debugScene = adventure.debugScene ?? {
      secrets: [],
      pacingNotes: [],
      continuityWarnings: [],
      aiRequests: [],
    };

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
    };

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
    const details: string[] = [`[AI ${statusLabel}] ${event.agent} ${event.kind} ${attemptText}`];

    if (event.status === "started" && event.prompt) {
      details.push(`Prompt:\n${event.prompt}`);
    }

    if (event.response) {
      details.push(`Response:\n${event.response}`);
    } else if (event.error) {
      details.push(`Error:\n${event.error}`);
    }

    const transcriptText = details.join("\n\n");
    this.appendTranscriptEntry(adventure, {
      kind: "system",
      author: AI_DEBUG_AUTHOR,
      text: transcriptText,
    });

    this.notifyAdventureUpdated(adventure.adventureId);
  }

  public joinAdventure(payload: JoinAdventurePayload, socketId: string): AdventureState {
    const parsed = joinAdventurePayloadSchema.parse(payload);
    const adventureId = ensureAdventureId(parsed.adventureId);

    let adventure = this.adventures.get(adventureId);
    if (!adventure) {
      const activeAdventures = Array.from(this.adventures.values()).filter(
        (candidate) => !candidate.closed && candidate.roster.some((entry) => entry.connected),
      );
      if (activeAdventures.length >= this.options.maxActiveAdventures) {
        const activeIds = activeAdventures.map((candidate) => candidate.adventureId).join(", ");
        throw new Error(`active adventure cap reached (active: ${activeIds})`);
      }

      adventure = createInitialAdventureState(adventureId, this.runtimeConfig, this.options.debugMode);
      this.adventures.set(adventureId, adventure);
      this.ensureRuntime(adventureId);
      this.logDiagnostic(adventure, {
        type: "session_started",
        runtimeConfig: adventure.runtimeConfig,
      });
    }

    const existingIndex = adventure.roster.findIndex((entry) => entry.playerId === parsed.playerId);
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

    const rosterIndex = adventure.roster.findIndex((entry) => entry.playerId === link.playerId);
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

    void this.maybeResolveActiveVoteEarly(link.adventureId);
    void this.maybeStartAdventurePitchVote(link.adventureId);
    return adventure;
  }

  public updateSetup(payload: unknown): AdventureState {
    const parsed = submitSetupPayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    this.assertAdventureOpen(adventure);
    this.assertPhase(adventure, ["lobby", "vote", "play"], "setup can only be updated during active phases");

    const rosterEntry = this.getRosterEntry(adventure, parsed.playerId);
    if (rosterEntry.role !== "player") {
      throw new Error("only player role can submit setup");
    }

    rosterEntry.setup = playerSetupSchema.parse(parsed.setup);
    this.notifyAdventureUpdated(adventure.adventureId);
    return adventure;
  }

  public async toggleReady(payload: unknown): Promise<AdventureState> {
    const parsed = toggleReadyPayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    this.assertAdventureOpen(adventure);
    this.assertPhase(adventure, ["lobby"], "ready state can only be toggled during lobby phase");

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

    const targetOption = activeVote.options.find((option) => option.optionId === parsed.optionId);
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

  public submitAction(payload: unknown): AdventureState {
    const parsed = submitActionPayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    this.assertAdventureOpen(adventure);
    this.assertPhase(adventure, ["play"], "actions can only be submitted during play phase");

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

    const runtime = this.ensureRuntime(adventure.adventureId);
    if (
      runtime.processingAction ||
      runtime.actionQueue.length > 0 ||
      runtime.pendingOutcomeAction ||
      adventure.activeOutcomeCheck
    ) {
      throw new Error("action queue busy; draft while the storyteller resolves the current turn");
    }

    const configuredCharacterName = player.setup?.characterName?.trim();
    const playerAuthor =
      configuredCharacterName && configuredCharacterName.length > 0
        ? configuredCharacterName
        : player.displayName;

    runtime.pendingOutcomeAction = {
      playerId: parsed.playerId,
      text: parsed.text.trim(),
    };

    const checkId = createId("oc");
    adventure.activeOutcomeCheck = activeOutcomeCheckSchema.parse({
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

    this.appendTranscriptEntry(adventure, {
      kind: "player",
      author: playerAuthor,
      text: parsed.text.trim(),
    });
    this.appendTranscriptEntry(adventure, {
      kind: "system",
      author: "System",
      text: `Outcome check: ${playerAuthor}, play an Outcome card.`,
    });
    this.notifyAdventureUpdated(adventure.adventureId);

    return adventure;
  }

  public playOutcomeCard(payload: unknown): AdventureState {
    const parsed = playOutcomeCardPayloadSchema.parse(payload);
    const adventure = this.requireAdventure(parsed.adventureId);
    this.assertAdventureOpen(adventure);
    this.assertPhase(adventure, ["play"], "outcome cards can only be played during play phase");

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

    const target = activeOutcomeCheck.targets.find((entry) => entry.playerId === parsed.playerId);
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
      kind: "system",
      author: "System",
      text: `${target.displayName} played ${formatOutcomeCard(selectedCard)}.`,
    });

    const everyonePlayed = activeOutcomeCheck.targets.every((entry) => Boolean(entry.playedCard));
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

  public updateRuntimeConfig(payload: unknown): { adventure: AdventureState; runtimeConfig: RuntimeConfig } {
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

  public getParticipantForSocket(socketId: string): SocketParticipantLink | null {
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
      processingAction: false,
      pitchVoteInProgress: false,
      sceneCounter: 0,
      sceneTurnCounter: 0,
      selectedPitch: null,
      rollingSummary: "",
      latencySamplesMs: [],
    };
    this.runtimeByAdventure.set(adventureId, created);
    return created;
  }

  private getConnectedPlayers(adventure: AdventureState): AdventureState["roster"] {
    return adventure.roster.filter((entry) => entry.role === "player" && entry.connected);
  }

  private assertAdventureOpen(adventure: AdventureState): void {
    if (adventure.closed || adventure.phase === "ending") {
      throw new Error("adventure is closed");
    }
  }

  private assertPhase(adventure: AdventureState, phases: AdventurePhase[], errorMessage: string): void {
    if (!phases.includes(adventure.phase)) {
      throw new Error(errorMessage);
    }
  }

  private getRosterEntry(adventure: AdventureState, playerId: string): AdventureState["roster"][number] {
    const entry = adventure.roster.find((candidate) => candidate.playerId === playerId);
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

  private logDiagnostic(adventure: AdventureState, event: AdventureDiagnosticEvent): void {
    this.options.diagnosticsLogger?.logEvent(adventure, event);
  }

  private getNarrativeTranscript(entries: TranscriptEntry[]): TranscriptEntry[] {
    return entries.filter((entry) => !isAiDebugTranscriptEntry(entry));
  }

  private appendTranscriptEntry(
    adventure: AdventureState,
    entry: Pick<TranscriptEntry, "kind" | "author" | "text">,
  ): TranscriptEntry {
    const transcriptEntry = transcriptEntrySchema.parse({
      entryId: createId("t"),
      kind: entry.kind,
      author: entry.author,
      text: entry.text,
      createdAtIso: new Date().toISOString(),
    });

    adventure.transcript.push(transcriptEntry);
    this.logDiagnostic(adventure, {
      type: "transcript_append",
      entry: transcriptEntry,
    });
    this.hooks.onTranscriptAppend?.(adventure.adventureId, transcriptEntry);
    return transcriptEntry;
  }

  private async maybeStartAdventurePitchVote(adventureId: string): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    if (!adventure || adventure.phase !== "lobby" || adventure.activeVote || adventure.closed) {
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
      });

      const pitchInputs: PitchInput[] = connectedPlayers.map((entry) => ({
        displayName: entry.displayName,
        characterName: entry.setup?.characterName ?? entry.displayName,
        visualDescription: entry.setup?.visualDescription ?? "No description provided.",
        adventurePreference: entry.setup?.adventurePreference ?? "",
      }));

      const generatedPitches = await this.options.storyteller.generateAdventurePitches(
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

    adventure.activeVote.options = adventure.activeVote.options.map((option) => ({
      ...option,
      voteCount: countsByOption.get(option.optionId) ?? 0,
    }));
  }

  private async maybeResolveActiveVoteEarly(adventureId: string): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    const runtime = this.runtimeByAdventure.get(adventureId);
    if (!adventure?.activeVote || !runtime) {
      return;
    }

    const connectedPlayers = this.getConnectedPlayers(adventure);
    if (connectedPlayers.length === 0) {
      return;
    }

    const everyoneVoted = connectedPlayers.every((entry) => runtime.votesByPlayerId.has(entry.playerId));
    if (!everyoneVoted) {
      return;
    }

    await this.resolveVote(adventureId, false);
  }

  private async resolveVote(adventureId: string, timeoutClosed: boolean): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    const runtime = this.runtimeByAdventure.get(adventureId);
    if (!adventure?.activeVote || !runtime) {
      return;
    }

    const vote = adventure.activeVote;
    this.clearVoteTimer(adventureId);
    this.refreshVoteTallies(adventureId);

    const highestVoteCount = Math.max(...vote.options.map((option) => option.voteCount), 0);
    const tiedTopOptions = vote.options.filter((option) => option.voteCount === highestVoteCount);
    const winner = tiedTopOptions[Math.floor(Math.random() * tiedTopOptions.length)] ?? vote.options[0];
    if (!winner) {
      return;
    }

    vote.resolution = {
      winnerOptionId: winner.optionId,
      timeoutClosed,
      tieBreakApplied: tiedTopOptions.length > 1,
      tiedOptionIds: tiedTopOptions.length > 1 ? tiedTopOptions.map((option) => option.optionId) : [],
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

  private async startScene(adventureId: string, previousSceneSummary?: string): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    if (!adventure || adventure.phase !== "play" || adventure.closed) {
      return;
    }

    const runtime = this.ensureRuntime(adventureId);
    runtime.sceneCounter += 1;
    runtime.sceneTurnCounter = 0;
    runtime.pendingOutcomeAction = null;
    adventure.activeOutcomeCheck = undefined;

    const pitchTitle = runtime.selectedPitch?.title ?? "Uncharted Trouble";
    const pitchDescription =
      runtime.selectedPitch?.description ??
      "A dangerous opportunity appears and demands action before the window closes.";
    const partyMembers = this.getConnectedPlayers(adventure).map((entry) => {
      const characterName = entry.setup?.characterName?.trim();
      if (characterName && characterName.length > 0) {
        return characterName;
      }

      return entry.displayName;
    });

    const sceneId = createId("scene");
    adventure.currentScene = scenePublicSchema.parse({
      sceneId,
      imagePending: false,
      introProse: PENDING_SCENE_INTRO,
      orientationBullets: PENDING_SCENE_BULLETS,
    });
    this.notifyAdventureUpdated(adventureId);

    this.hooks.onStorytellerThinking?.(adventureId, {
      active: true,
      label: `Framing scene ${runtime.sceneCounter}...`,
    });

    try {
      const sceneStart = await this.options.storyteller.generateSceneStart(
        {
          pitchTitle,
          pitchDescription,
          sceneNumber: runtime.sceneCounter,
          previousSceneSummary,
          partyMembers,
          transcriptTail: this.getNarrativeTranscript(adventure.transcript).slice(-12),
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
        introProse: sceneStart.introProse,
        orientationBullets: sceneStart.orientationBullets,
      });
      if (refreshedAdventure.debugMode) {
        const existingAiRequests = refreshedAdventure.debugScene?.aiRequests ?? [];
        refreshedAdventure.debugScene = {
          ...sceneStart.debug,
          aiRequests: existingAiRequests,
        };
      } else {
        refreshedAdventure.debugScene = undefined;
      }

      this.appendTranscriptEntry(refreshedAdventure, {
        kind: "storyteller",
        author: "Storyteller",
        text: sceneStart.playerPrompt,
      });

      await this.refreshContinuity(adventureId);
      this.notifyAdventureUpdated(adventureId);

      void this.generateSceneImage(adventureId, sceneId);
    } finally {
      this.hooks.onStorytellerThinking?.(adventureId, {
        active: false,
        label: "",
      });
    }
  }

  private async generateSceneImage(adventureId: string, sceneId: string): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    if (!adventure?.currentScene || adventure.currentScene.sceneId !== sceneId) {
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

  private async processActionQueue(adventureId: string): Promise<void> {
    const runtime = this.ensureRuntime(adventureId);
    if (runtime.processingAction) {
      return;
    }

    runtime.processingAction = true;

    try {
      while (runtime.actionQueue.length > 0) {
        const adventure = this.adventures.get(adventureId);
        if (!adventure || adventure.phase !== "play" || adventure.closed || !adventure.currentScene) {
          runtime.actionQueue = [];
          break;
        }

        const actionItem = runtime.actionQueue.shift();
        if (!actionItem) {
          break;
        }

        this.hooks.onStorytellerThinking?.(adventureId, {
          active: true,
          label: "Storyteller is thinking...",
        });

        let actionResponse: ActionResponseResult;
        const startedAtMs = Date.now();
        try {
          const actingPlayer = this.getRosterEntry(adventure, actionItem.playerId);
          const actorCharacterName =
            actingPlayer.setup?.characterName?.trim() || actingPlayer.displayName;

          try {
            actionResponse = await this.options.storyteller.narrateAction(
              {
                pitchTitle: runtime.selectedPitch?.title ?? "Uncharted Trouble",
                pitchDescription:
                  runtime.selectedPitch?.description ??
                  "A dangerous opportunity appears and demands action before the window closes.",
                actorCharacterName,
                actionText: actionItem.text,
                turnNumber: runtime.sceneTurnCounter + 1,
                scene: adventure.currentScene,
                transcriptTail: this.getNarrativeTranscript(adventure.transcript).slice(-14),
                rollingSummary: runtime.rollingSummary,
              },
              adventure.runtimeConfig,
              { adventureId },
            );
          } catch {
            actionResponse = {
              text: "The situation jolts forward anyway, forcing a new choice before the pressure collapses.",
              closeScene: false,
              debug: {
                tension: 55,
                secrets: [],
                pacingNotes: ["Recover from model failure with neutral fail-forward narration."],
                continuityWarnings: [],
                aiRequests: [],
              },
            };
          }

          runtime.sceneTurnCounter += 1;
          const elapsedMs = Date.now() - startedAtMs;
          this.recordLatency(adventure, elapsedMs, runtime);

          this.appendTranscriptEntry(adventure, {
            kind: "storyteller",
            author: "Storyteller",
            text: actionResponse.text,
          });
          this.hooks.onStorytellerResponse?.(adventureId, {
            text: actionResponse.text,
          });

          if (adventure.debugMode) {
            const existingAiRequests = adventure.debugScene?.aiRequests ?? [];
            adventure.debugScene = {
              ...actionResponse.debug,
              aiRequests: existingAiRequests,
            };
          }

          await this.refreshContinuity(adventureId);
          this.notifyAdventureUpdated(adventureId);

          if (actionResponse.closeScene) {
            const sceneSummary =
              actionResponse.sceneSummary ??
              "The group resolves the immediate pressure and must choose whether to continue or end.";
            await this.beginSceneTransitionVote(adventureId, sceneSummary);
            runtime.actionQueue = [];
            break;
          }
        } finally {
          this.hooks.onStorytellerThinking?.(adventureId, {
            active: false,
            label: "",
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

    const sampleTotal = runtime.latencySamplesMs.reduce((sum, current) => sum + current, 0);
    const averageMs =
      runtime.latencySamplesMs.length > 0 ? sampleTotal / runtime.latencySamplesMs.length : 0;

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

    if (adventure.debugMode) {
      const currentDebug = adventure.debugScene ?? {
        secrets: [],
        pacingNotes: [],
        continuityWarnings: [],
        aiRequests: [],
      };
      adventure.debugScene = {
        ...currentDebug,
        continuityWarnings: continuity.continuityWarnings,
      };
    }
  }

  private async beginSceneTransitionVote(adventureId: string, sceneSummary: string): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    if (!adventure || adventure.phase !== "play" || !adventure.currentScene || adventure.closed) {
      return;
    }

    const sceneId = adventure.currentScene.sceneId;
    adventure.currentScene.summary = sceneSummary;
    adventure.currentScene.imagePending = true;
    delete adventure.currentScene.imageUrl;
    this.appendTranscriptEntry(adventure, {
      kind: "storyteller",
      author: "Storyteller",
      text: `Scene Summary: ${sceneSummary}`,
    });
    this.appendTranscriptEntry(adventure, {
      kind: "system",
      author: "System",
      text: "Scene ended. Choose whether to continue this session with a new scene or end the session now.",
    });

    void this.generateSceneImage(adventureId, sceneId);

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
          description: "End this session now and keep the current adventure transcript.",
          voteCount: 0,
        }),
      ],
    );
    this.notifyAdventureUpdated(adventureId);
  }

  private async closeAdventure(adventureId: string, reason: string): Promise<void> {
    const adventure = this.adventures.get(adventureId);
    if (!adventure) {
      return;
    }

    this.clearVoteTimer(adventureId);
    const runtime = this.ensureRuntime(adventureId);
    runtime.actionQueue = [];
    runtime.pendingOutcomeAction = null;
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

    adventure.activeVote = undefined;
    adventure.closed = true;
    adventure.sessionSummary = summary;
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
