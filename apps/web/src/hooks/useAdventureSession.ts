import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AdventureState,
  OutcomeCardType,
  PlayerSetup,
  RosterEntry,
  RuntimeConfig,
} from "@mighty-decks/spec/adventureState";
import type { TranscriptAppendPayload } from "@mighty-decks/spec/events";
import { getClientIdentity, type ClientIdentity } from "../lib/ids";
import { createSocketClient, getServerUrlWarning, resolveServerUrl } from "../lib/socket";

interface ThinkingState {
  active: boolean;
  label: string;
}

interface UseAdventureSessionOptions {
  adventureId: string;
  role: "player" | "screen";
}

export interface SetupDebugState {
  pendingSetupOverride: PlayerSetup | null;
  cachedSetup: PlayerSetup | null;
  submitCount: number;
  autoResubmitCount: number;
  lastSubmitAtIso: string | null;
  lastServerSetupAtIso: string | null;
  trace: string[];
}

export interface UseAdventureSessionResult {
  adventure: AdventureState | null;
  participant: RosterEntry | null;
  connected: boolean;
  connectionError: string | null;
  serverUrl: string;
  serverUrlWarning: string | null;
  thinking: ThinkingState;
  lastStorytellerResponse: string | null;
  identity: ClientIdentity;
  setupDebug: SetupDebugState;
  submitSetup: (setup: PlayerSetup) => void;
  toggleReady: (ready: boolean) => void;
  castVote: (optionId: string) => void;
  submitAction: (text: string) => void;
  playOutcomeCard: (checkId: string, card: OutcomeCardType) => void;
  endSession: () => void;
  updateRuntimeConfig: (runtimeConfig: RuntimeConfig) => void;
  reconnect: () => void;
}

const appendTranscriptEntry = (
  currentState: AdventureState | null,
  entry: TranscriptAppendPayload,
): AdventureState | null => {
  if (!currentState) {
    return currentState;
  }

  const alreadyPresent = currentState.transcript.some((candidate) => candidate.entryId === entry.entryId);
  if (alreadyPresent) {
    return currentState;
  }

  return {
    ...currentState,
    transcript: [...currentState.transcript, entry],
  };
};

const sameSetup = (left: PlayerSetup, right: PlayerSetup): boolean =>
  left.characterName === right.characterName &&
  left.visualDescription === right.visualDescription &&
  left.adventurePreference === right.adventurePreference;

const applyOwnSetupOverride = (
  state: AdventureState,
  playerId: string,
  setupOverride: PlayerSetup | null,
): AdventureState => {
  if (!setupOverride) {
    return state;
  }

  return {
    ...state,
    roster: state.roster.map((entry) =>
      entry.playerId === playerId
        ? {
            ...entry,
            setup: entry.setup ?? setupOverride,
          }
        : entry,
    ),
  };
};

const SETUP_DEBUG_TRACE_LIMIT = 40;
const AUTO_RESUBMIT_COOLDOWN_MS = 3000;
const PENDING_SETUP_ACK_TIMEOUT_MS = 2500;
const CHARACTER_NAME_MAX_LENGTH = 100;
const VISUAL_DESCRIPTION_MAX_LENGTH = 400;
const ADVENTURE_PREFERENCE_MAX_LENGTH = 500;

const formatSetupForDebug = (setup: PlayerSetup | null | undefined): string => {
  if (!setup) {
    return "none";
  }

  return `${setup.characterName} (visual:${setup.visualDescription.length}, pref:${setup.adventurePreference.length})`;
};

const formatDebugTimestamp = (): string => new Date().toISOString().slice(11, 23);

const normalizeSetup = (setup: PlayerSetup): PlayerSetup => ({
  characterName: setup.characterName.trim().slice(0, CHARACTER_NAME_MAX_LENGTH),
  visualDescription: setup.visualDescription
    .trim()
    .slice(0, VISUAL_DESCRIPTION_MAX_LENGTH),
  adventurePreference: setup.adventurePreference
    .trim()
    .slice(0, ADVENTURE_PREFERENCE_MAX_LENGTH),
});

const isPlayerSetup = (value: unknown): value is PlayerSetup => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PlayerSetup>;
  return (
    typeof candidate.characterName === "string" &&
    candidate.characterName.trim().length > 0 &&
    typeof candidate.visualDescription === "string" &&
    candidate.visualDescription.trim().length > 0 &&
    typeof candidate.adventurePreference === "string"
  );
};

const loadCachedSetup = (storageKey: string): PlayerSetup | null => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    return isPlayerSetup(parsed) ? normalizeSetup(parsed) : null;
  } catch {
    return null;
  }
};

const persistCachedSetup = (storageKey: string, setup: PlayerSetup): void => {
  window.localStorage.setItem(storageKey, JSON.stringify(setup));
};

export const useAdventureSession = ({
  adventureId,
  role,
}: UseAdventureSessionOptions): UseAdventureSessionResult => {
  const identity = useMemo(() => getClientIdentity(role), [role]);
  const serverUrl = useMemo(() => resolveServerUrl(), []);
  const serverUrlWarning = useMemo(() => getServerUrlWarning(serverUrl), [serverUrl]);
  const socket = useMemo(() => createSocketClient(), []);
  const setupStorageKey = useMemo(
    () => `mighty_decks_setup_${adventureId}_${identity.playerId}`,
    [adventureId, identity.playerId],
  );

  const [adventure, setAdventure] = useState<AdventureState | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [thinking, setThinking] = useState<ThinkingState>({
    active: false,
    label: "Storyteller is thinking...",
  });
  const [lastStorytellerResponse, setLastStorytellerResponse] = useState<string | null>(null);
  const [pendingSetupOverride, setPendingSetupOverrideState] = useState<PlayerSetup | null>(null);
  const [cachedSetup, setCachedSetup] = useState<PlayerSetup | null>(null);
  const cachedSetupRef = useRef<PlayerSetup | null>(null);
  const [setupSubmitCount, setSetupSubmitCount] = useState(0);
  const [autoResubmitCount, setAutoResubmitCount] = useState(0);
  const [lastSubmitAtIso, setLastSubmitAtIso] = useState<string | null>(null);
  const [lastServerSetupAtIso, setLastServerSetupAtIso] = useState<string | null>(null);
  const pendingSetupOverrideRef = useRef<PlayerSetup | null>(null);
  const pendingSetupSetAtRef = useRef(0);
  const autoResubmitAtRef = useRef(0);
  const [setupDebugTrace, setSetupDebugTrace] = useState<string[]>([]);
  const receivedAdventureStateRef = useRef(false);
  const latestAdventureStateRef = useRef<AdventureState | null>(null);

  const appendSetupDebug = useCallback((message: string): void => {
    const timestamp = formatDebugTimestamp();
    setSetupDebugTrace((current) =>
      [...current, `[${timestamp}] ${message}`].slice(-SETUP_DEBUG_TRACE_LIMIT),
    );
  }, []);

  const setPendingSetupOverride = useCallback(
    (nextValue: PlayerSetup | null, reason: string): void => {
      pendingSetupOverrideRef.current = nextValue;
      pendingSetupSetAtRef.current = nextValue ? Date.now() : 0;
      setPendingSetupOverrideState(nextValue);
      appendSetupDebug(
        `pending_setup_override_${nextValue ? "set" : "cleared"} reason=${reason} value=${formatSetupForDebug(nextValue)}`,
      );
    },
    [appendSetupDebug],
  );

  const saveCachedSetup = useCallback(
    (setup: PlayerSetup, reason: string): void => {
      const normalizedSetup = normalizeSetup(setup);
      persistCachedSetup(setupStorageKey, normalizedSetup);
      cachedSetupRef.current = normalizedSetup;
      setCachedSetup(normalizedSetup);
      appendSetupDebug(
        `cached_setup_saved reason=${reason} value=${formatSetupForDebug(normalizedSetup)}`,
      );
    },
    [appendSetupDebug, setupStorageKey],
  );

  useEffect(() => {
    const loadedSetup = loadCachedSetup(setupStorageKey);
    cachedSetupRef.current = loadedSetup;
    setCachedSetup(loadedSetup);
    setSetupSubmitCount(0);
    setAutoResubmitCount(0);
    setLastSubmitAtIso(null);
    setLastServerSetupAtIso(null);
    appendSetupDebug(
      `cached_setup_${loadedSetup ? "loaded" : "empty"} value=${formatSetupForDebug(loadedSetup)}`,
    );
  }, [appendSetupDebug, setupStorageKey]);

  useEffect(() => {
    appendSetupDebug(
      `session_start role=${role} player=${identity.playerId} adventure=${adventureId}`,
    );

    const maybeAutoResubmitSetup = (
      phase: AdventureState["phase"] | undefined,
      ownEntry: RosterEntry | undefined,
    ): void => {
      if (role !== "player") {
        return;
      }

      if (!phase || !ownEntry || ownEntry.setup || !ownEntry.connected) {
        return;
      }

      const pendingOverride = pendingSetupOverrideRef.current;
      if (pendingOverride) {
        const pendingAgeMs = Date.now() - pendingSetupSetAtRef.current;
        if (pendingAgeMs < PENDING_SETUP_ACK_TIMEOUT_MS) {
          return;
        }

        appendSetupDebug(
          `pending_setup_ack_timeout age_ms=${pendingAgeMs} value=${formatSetupForDebug(pendingOverride)}`,
        );
        setPendingSetupOverride(null, "ack_timeout");
      }

      const setupToResubmit = cachedSetupRef.current
        ? normalizeSetup(cachedSetupRef.current)
        : null;
      if (!setupToResubmit) {
        return;
      }

      const now = Date.now();
      if (now - autoResubmitAtRef.current < AUTO_RESUBMIT_COOLDOWN_MS) {
        appendSetupDebug(`auto_resubmit_skipped phase=${phase} reason=cooldown`);
        return;
      }

      autoResubmitAtRef.current = now;
      setAutoResubmitCount((current) => current + 1);
      setPendingSetupOverride(setupToResubmit, "auto_resubmit_missing_server_setup");
      appendSetupDebug(
        `auto_resubmit_submit_setup phase=${phase} setup=${formatSetupForDebug(setupToResubmit)}`,
      );
      socket.emit("submit_setup", {
        adventureId,
        playerId: identity.playerId,
        setup: setupToResubmit,
      });
    };

    const emitJoin = (): void => {
      socket.emit("join_adventure", {
        adventureId,
        playerId: identity.playerId,
        displayName: identity.displayName,
        role,
      });
      appendSetupDebug(
        `emit_join player=${identity.playerId} role=${role} adventure=${adventureId}`,
      );
    };

    const handleConnect = (): void => {
      setConnected(true);
      setConnectionError(null);
      appendSetupDebug(`socket_connected id=${socket.id ?? "unknown"}`);
      emitJoin();
    };

    const handleDisconnect = (reason: string): void => {
      setConnected(false);
      appendSetupDebug(`socket_disconnected reason=${reason}`);
      if (reason === "io server disconnect") {
        setConnectionError(
          "Disconnected by server due inactivity or session reset. Click reconnect to continue.",
        );
        return;
      }

      if (reason !== "io client disconnect") {
        setConnectionError(`Disconnected from adventure server (${reason}).`);
      }
    };

    const handleConnectError = (error: unknown): void => {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Could not connect to adventure server.";
      setConnectionError(message);
      appendSetupDebug(`socket_connect_error message=${message}`);
    };

    const handleAdventureState = (nextState: AdventureState): void => {
      receivedAdventureStateRef.current = true;
      const pendingOverride = pendingSetupOverrideRef.current;
      const rawOwnEntry = nextState.roster.find(
        (entry) => entry.playerId === identity.playerId,
      );
      const withOverride = applyOwnSetupOverride(
        nextState,
        identity.playerId,
        pendingOverride,
      );
      setAdventure(withOverride);
      latestAdventureStateRef.current = withOverride;
      const ownEntry = withOverride.roster.find(
        (entry) => entry.playerId === identity.playerId,
      );
      appendSetupDebug(
        [
          `adventure_state phase=${withOverride.phase}`,
          `vote=${withOverride.activeVote ? "active" : "none"}`,
          `participant=${ownEntry ? "present" : "missing"}`,
          `participant_setup_effective=${formatSetupForDebug(ownEntry?.setup)}`,
          `participant_setup_server=${formatSetupForDebug(rawOwnEntry?.setup)}`,
          `pending_setup=${formatSetupForDebug(pendingOverride)}`,
        ].join(" "),
      );
      if (rawOwnEntry?.setup) {
        setLastServerSetupAtIso(new Date().toISOString());
        if (
          !cachedSetupRef.current ||
          !sameSetup(cachedSetupRef.current, rawOwnEntry.setup)
        ) {
          saveCachedSetup(rawOwnEntry.setup, "server_state");
        }
      }
      if (
        pendingOverride &&
        rawOwnEntry?.setup &&
        sameSetup(rawOwnEntry.setup, pendingOverride)
      ) {
        setPendingSetupOverride(null, "adventure_state_ack");
      }
      maybeAutoResubmitSetup(withOverride.phase, rawOwnEntry);
      setConnectionError(null);
    };

    const handlePlayerUpdate = (roster: AdventureState["roster"]): void => {
      const pendingOverride = pendingSetupOverrideRef.current;
      setAdventure((current) => {
        if (!current) {
          return current;
        }

        const nextState = applyOwnSetupOverride(
          {
            ...current,
            roster,
          },
          identity.playerId,
          pendingOverride,
        );
        latestAdventureStateRef.current = nextState;
        return nextState;
      });
      const latestState = latestAdventureStateRef.current;
      const ownEntry = roster.find((entry) => entry.playerId === identity.playerId);
      appendSetupDebug(
        [
          `player_update phase=${latestState?.phase ?? "unknown"}`,
          `vote=${latestState?.activeVote ? "active" : "none"}`,
          `participant=${ownEntry ? "present" : "missing"}`,
          `participant_setup=${formatSetupForDebug(ownEntry?.setup)}`,
          `pending_setup=${formatSetupForDebug(pendingOverride)}`,
        ].join(" "),
      );
      if (ownEntry?.setup) {
        setLastServerSetupAtIso(new Date().toISOString());
        if (!cachedSetupRef.current || !sameSetup(cachedSetupRef.current, ownEntry.setup)) {
          saveCachedSetup(ownEntry.setup, "player_update");
        }
      }
      maybeAutoResubmitSetup(latestState?.phase, ownEntry);
    };

    const handleVoteUpdate = (activeVote: AdventureState["activeVote"] | null): void => {
      setAdventure((current) => {
        if (!current) {
          return current;
        }

        const nextState = {
          ...current,
          activeVote: activeVote ?? undefined,
        };
        latestAdventureStateRef.current = nextState;
        return nextState;
      });
      appendSetupDebug(`vote_update vote=${activeVote ? "active" : "none"}`);
    };

    const handleSceneUpdate = (scene: AdventureState["currentScene"] | null): void => {
      setAdventure((current) => {
        if (!current) {
          return current;
        }

        const nextState = {
          ...current,
          currentScene: scene ?? undefined,
        };
        latestAdventureStateRef.current = nextState;
        return nextState;
      });
    };

    const handleTranscriptAppend = (entry: TranscriptAppendPayload): void => {
      setAdventure((current) => appendTranscriptEntry(current, entry));
    };

    const handleRuntimeConfigUpdated = (runtimeConfig: RuntimeConfig): void => {
      setAdventure((current) => {
        if (!current) {
          return current;
        }

        const nextState = { ...current, runtimeConfig };
        latestAdventureStateRef.current = nextState;
        return nextState;
      });
    };

    const handleLatencyMetricsUpdated = (latencyMetrics: AdventureState["latencyMetrics"]): void => {
      setAdventure((current) => {
        if (!current) {
          return current;
        }

        const nextState = { ...current, latencyMetrics };
        latestAdventureStateRef.current = nextState;
        return nextState;
      });
    };

    const handlePhaseChanged = (phase: AdventureState["phase"]): void => {
      setAdventure((current) => {
        if (!current) {
          return current;
        }

        const nextState = { ...current, phase };
        latestAdventureStateRef.current = nextState;
        return nextState;
      });
      appendSetupDebug(`phase_changed phase=${phase}`);
    };

    const handleThinking = (nextThinking: ThinkingState): void => {
      setThinking(nextThinking);
    };

    const handleStorytellerResponse = (payload: { text: string }): void => {
      setLastStorytellerResponse(payload.text);
      if (payload.text.toLowerCase().includes("setup")) {
        appendSetupDebug(`storyteller_response ${payload.text}`);
      }
      if (!receivedAdventureStateRef.current && payload.text.trim().length > 0) {
        setConnectionError(payload.text);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("adventure_state", handleAdventureState);
    socket.on("player_update", handlePlayerUpdate);
    socket.on("vote_update", handleVoteUpdate);
    socket.on("scene_update", handleSceneUpdate);
    socket.on("transcript_append", handleTranscriptAppend);
    socket.on("runtime_config_updated", handleRuntimeConfigUpdated);
    socket.on("latency_metrics_update", handleLatencyMetricsUpdated);
    socket.on("phase_changed", handlePhaseChanged);
    socket.on("storyteller_thinking", handleThinking);
    socket.on("storyteller_response", handleStorytellerResponse);
    socket.on("connect_error", handleConnectError);

    // In React StrictMode (dev), effects mount/unmount once immediately.
    // Defer connect so the first synthetic cleanup can cancel it cleanly.
    const connectTimer = setTimeout(() => {
      socket.connect();
    }, 0);

    return () => {
      clearTimeout(connectTimer);
      if (socket.connected) {
        socket.emit("leave_adventure", {
          adventureId,
          playerId: identity.playerId,
        });
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("adventure_state", handleAdventureState);
      socket.off("player_update", handlePlayerUpdate);
      socket.off("vote_update", handleVoteUpdate);
      socket.off("scene_update", handleSceneUpdate);
      socket.off("transcript_append", handleTranscriptAppend);
      socket.off("runtime_config_updated", handleRuntimeConfigUpdated);
      socket.off("latency_metrics_update", handleLatencyMetricsUpdated);
      socket.off("phase_changed", handlePhaseChanged);
      socket.off("storyteller_thinking", handleThinking);
      socket.off("storyteller_response", handleStorytellerResponse);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, [
    adventureId,
    appendSetupDebug,
    identity.displayName,
    identity.playerId,
    role,
    saveCachedSetup,
    setPendingSetupOverride,
    socket,
  ]);

  const participant = useMemo(
    () => adventure?.roster.find((entry) => entry.playerId === identity.playerId) ?? null,
    [adventure, identity.playerId],
  );

  useEffect(() => {
    latestAdventureStateRef.current = adventure;
  }, [adventure]);

  return {
    adventure,
    participant,
    connected,
    connectionError,
    serverUrl,
    serverUrlWarning,
    thinking,
    lastStorytellerResponse,
    identity,
    setupDebug: {
      pendingSetupOverride,
      cachedSetup,
      submitCount: setupSubmitCount,
      autoResubmitCount,
      lastSubmitAtIso,
      lastServerSetupAtIso,
      trace: setupDebugTrace,
    },
    submitSetup: (setup: PlayerSetup) => {
      const normalizedSetup = normalizeSetup(setup);
      setSetupSubmitCount((current) => current + 1);
      setLastSubmitAtIso(new Date().toISOString());
      saveCachedSetup(normalizedSetup, "submit");
      setPendingSetupOverride(normalizedSetup, "submit_setup");
      setAdventure((current) => {
        if (!current) {
          return current;
        }

        const nextState = {
          ...current,
          roster: current.roster.map((entry) =>
            entry.playerId === identity.playerId
              ? {
                  ...entry,
                  setup: normalizedSetup,
                }
              : entry,
          ),
        };
        latestAdventureStateRef.current = nextState;
        return nextState;
      });
      appendSetupDebug(
        `emit_submit_setup player=${identity.playerId} setup=${formatSetupForDebug(normalizedSetup)}`,
      );
      socket.emit("submit_setup", {
        adventureId,
        playerId: identity.playerId,
        setup: normalizedSetup,
      });
    },
    toggleReady: (ready: boolean) => {
      socket.emit("toggle_ready", {
        adventureId,
        playerId: identity.playerId,
        ready,
      });
    },
    castVote: (optionId: string) => {
      if (!adventure?.activeVote) {
        return;
      }

      socket.emit("cast_vote", {
        adventureId,
        playerId: identity.playerId,
        voteId: adventure.activeVote.voteId,
        optionId,
      });
    },
    submitAction: (text: string) => {
      socket.emit("submit_action", {
        adventureId,
        playerId: identity.playerId,
        text,
      });
    },
    playOutcomeCard: (checkId: string, card: OutcomeCardType) => {
      socket.emit("play_outcome_card", {
        adventureId,
        playerId: identity.playerId,
        checkId,
        card,
      });
    },
    endSession: () => {
      socket.emit("end_session", {
        adventureId,
        playerId: identity.playerId,
      });
    },
    updateRuntimeConfig: (runtimeConfig: RuntimeConfig) => {
      socket.emit("update_runtime_config", {
        adventureId,
        playerId: identity.playerId,
        runtimeConfig,
      });
    },
    reconnect: () => {
      setConnectionError(null);
      appendSetupDebug("manual_reconnect_requested");
      if (!socket.connected) {
        socket.connect();
      }
    },
  };
};
