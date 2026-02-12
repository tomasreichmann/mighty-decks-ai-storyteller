import { useEffect, useMemo, useRef, useState } from "react";
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

export const useAdventureSession = ({
  adventureId,
  role,
}: UseAdventureSessionOptions): UseAdventureSessionResult => {
  const identity = useMemo(() => getClientIdentity(role), [role]);
  const serverUrl = useMemo(() => resolveServerUrl(), []);
  const serverUrlWarning = useMemo(() => getServerUrlWarning(serverUrl), [serverUrl]);
  const socket = useMemo(() => createSocketClient(), []);

  const [adventure, setAdventure] = useState<AdventureState | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [thinking, setThinking] = useState<ThinkingState>({
    active: false,
    label: "Storyteller is thinking...",
  });
  const [lastStorytellerResponse, setLastStorytellerResponse] = useState<string | null>(null);
  const receivedAdventureStateRef = useRef(false);

  useEffect(() => {
    const emitJoin = (): void => {
      socket.emit("join_adventure", {
        adventureId,
        playerId: identity.playerId,
        displayName: identity.displayName,
        role,
      });
    };

    const handleConnect = (): void => {
      setConnected(true);
      setConnectionError(null);
      emitJoin();
    };

    const handleDisconnect = (reason: string): void => {
      setConnected(false);
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
    };

    const handleAdventureState = (nextState: AdventureState): void => {
      receivedAdventureStateRef.current = true;
      setAdventure(nextState);
      setConnectionError(null);
    };

    const handlePlayerUpdate = (roster: AdventureState["roster"]): void => {
      setAdventure((current) => (current ? { ...current, roster } : current));
    };

    const handleVoteUpdate = (activeVote: AdventureState["activeVote"] | null): void => {
      setAdventure((current) =>
        current
          ? {
              ...current,
              activeVote: activeVote ?? undefined,
            }
          : current,
      );
    };

    const handleSceneUpdate = (scene: AdventureState["currentScene"] | null): void => {
      setAdventure((current) =>
        current
          ? {
              ...current,
              currentScene: scene ?? undefined,
            }
          : current,
      );
    };

    const handleTranscriptAppend = (entry: TranscriptAppendPayload): void => {
      setAdventure((current) => appendTranscriptEntry(current, entry));
    };

    const handleRuntimeConfigUpdated = (runtimeConfig: RuntimeConfig): void => {
      setAdventure((current) => (current ? { ...current, runtimeConfig } : current));
    };

    const handleLatencyMetricsUpdated = (latencyMetrics: AdventureState["latencyMetrics"]): void => {
      setAdventure((current) => (current ? { ...current, latencyMetrics } : current));
    };

    const handlePhaseChanged = (phase: AdventureState["phase"]): void => {
      setAdventure((current) => (current ? { ...current, phase } : current));
    };

    const handleThinking = (nextThinking: ThinkingState): void => {
      setThinking(nextThinking);
    };

    const handleStorytellerResponse = (payload: { text: string }): void => {
      setLastStorytellerResponse(payload.text);
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
  }, [adventureId, identity.displayName, identity.playerId, role, socket]);

  const participant = useMemo(
    () => adventure?.roster.find((entry) => entry.playerId === identity.playerId) ?? null,
    [adventure, identity.playerId],
  );

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
    submitSetup: (setup: PlayerSetup) => {
      socket.emit("submit_setup", {
        adventureId,
        playerId: identity.playerId,
        setup,
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
      if (!socket.connected) {
        socket.connect();
      }
    },
  };
};
