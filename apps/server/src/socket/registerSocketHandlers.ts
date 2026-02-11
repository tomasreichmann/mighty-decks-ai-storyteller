import type { AdventureState, TranscriptEntry } from "@mighty-decks/spec/adventureState";
import {
  castVotePayloadSchema,
  endSessionPayloadSchema,
  joinAdventurePayloadSchema,
  leaveAdventurePayloadSchema,
  submitActionPayloadSchema,
  submitSetupPayloadSchema,
  toggleReadyPayloadSchema,
  updateRuntimeConfigPayloadSchema,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@mighty-decks/spec/events";
import type { Socket, Server as SocketServer } from "socket.io";
import type { AdventureManager } from "../adventure/AdventureManager";

const AI_DEBUG_AUTHOR = "AI Debug";

const isDebugTranscriptEntry = (entry: TranscriptEntry): boolean => entry.author === AI_DEBUG_AUTHOR;

const sanitizeAdventureForRole = (
  adventure: AdventureState,
  role: "player" | "screen" | undefined,
): AdventureState => {
  if (role === "screen") {
    return adventure;
  }

  return {
    ...adventure,
    activeVote: adventure.activeVote
      ? {
          ...adventure.activeVote,
          resolution: undefined,
        }
      : undefined,
    transcript: adventure.transcript.filter((entry) => !isDebugTranscriptEntry(entry)),
    debugScene: undefined,
  };
};

const emitTranscriptAppend = (
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>,
  adventureId: string,
  manager: AdventureManager,
  entry: TranscriptEntry,
): void => {
  const roomMembers = io.sockets.adapter.rooms.get(adventureId);
  if (!roomMembers) {
    return;
  }

  for (const socketId of roomMembers) {
    const targetSocket = io.sockets.sockets.get(socketId);
    if (!targetSocket) {
      continue;
    }

    const participant = manager.getParticipantForSocket(socketId);
    const adventure = manager.getAdventure(adventureId);
    const rosterEntry = adventure && participant
      ? adventure.roster.find((candidate) => candidate.playerId === participant.playerId)
      : undefined;
    const isScreen = rosterEntry?.role === "screen";

    if (!isScreen && isDebugTranscriptEntry(entry)) {
      continue;
    }

    targetSocket.emit("transcript_append", entry);
  }
};

const emitAdventureState = (
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>,
  adventureId: string,
  manager: AdventureManager,
): void => {
  const adventure = manager.getAdventure(adventureId);
  if (!adventure) {
    return;
  }

  const roomMembers = io.sockets.adapter.rooms.get(adventureId);
  if (!roomMembers) {
    return;
  }

  for (const socketId of roomMembers) {
    const targetSocket = io.sockets.sockets.get(socketId);
    if (!targetSocket) {
      continue;
    }

    const participant = manager.getParticipantForSocket(socketId);
    const rosterEntry = participant
      ? adventure.roster.find((entry) => entry.playerId === participant.playerId)
      : undefined;
    const personalizedState = sanitizeAdventureForRole(adventure, rosterEntry?.role);

    targetSocket.emit("adventure_state", personalizedState);
    targetSocket.emit("player_update", personalizedState.roster);
    targetSocket.emit("vote_update", personalizedState.activeVote ?? null);
    targetSocket.emit("scene_update", personalizedState.currentScene ?? null);
    targetSocket.emit("runtime_config_updated", personalizedState.runtimeConfig);
    targetSocket.emit("latency_metrics_update", personalizedState.latencyMetrics);
  }
};

const withValidation = <T>(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  parser: { safeParse: (payload: unknown) => { success: true; data: T } | { success: false } },
  payload: unknown,
): T | null => {
  const parsed = parser.safeParse(payload);
  if (!parsed.success) {
    socket.emit("storyteller_response", { text: "Invalid payload received." });
    return null;
  }

  return parsed.data;
};

export const registerSocketHandlers = (
  io: SocketServer<ClientToServerEvents, ServerToClientEvents>,
  manager: AdventureManager,
): void => {
  manager.setHooks({
    onAdventureUpdated: (adventureId) => {
      emitAdventureState(io, adventureId, manager);
    },
    onPhaseChanged: (adventureId, phase) => {
      io.to(adventureId).emit("phase_changed", phase);
    },
    onTranscriptAppend: (adventureId, entry) => {
      emitTranscriptAppend(io, adventureId, manager, entry);
    },
    onStorytellerThinking: (adventureId, payload) => {
      io.to(adventureId).emit("storyteller_thinking", payload);
    },
    onStorytellerResponse: (adventureId, payload) => {
      io.to(adventureId).emit("storyteller_response", payload);
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_adventure", (rawPayload) => {
      const payload = withValidation(socket, joinAdventurePayloadSchema, rawPayload);
      if (!payload) {
        return;
      }

      try {
        const supersededSocketIds = manager
          .getSocketIdsForPlayer(payload.playerId)
          .filter((existingSocketId) => existingSocketId !== socket.id);
        for (const supersededSocketId of supersededSocketIds) {
          const previousLink = manager.getParticipantForSocket(supersededSocketId);
          const supersededSocket = io.sockets.sockets.get(supersededSocketId);
          supersededSocket?.disconnect(true);
          const previousAdventure = manager.leaveBySocket(supersededSocketId);
          if (previousLink) {
            emitAdventureState(io, previousLink.adventureId, manager);
          } else if (previousAdventure) {
            emitAdventureState(io, previousAdventure.adventureId, manager);
          }
        }

        const adventure = manager.joinAdventure(payload, socket.id);
        socket.join(adventure.adventureId);
        emitAdventureState(io, adventure.adventureId, manager);
      } catch (error) {
        socket.emit("storyteller_response", {
          text: error instanceof Error ? error.message : "Could not join adventure.",
        });
      }
    });

    socket.on("leave_adventure", (rawPayload) => {
      const payload = withValidation(socket, leaveAdventurePayloadSchema, rawPayload);
      if (!payload) {
        return;
      }

      socket.leave(payload.adventureId);
      manager.leaveBySocket(socket.id);
      emitAdventureState(io, payload.adventureId, manager);
    });

    socket.on("submit_setup", (rawPayload) => {
      const payload = withValidation(socket, submitSetupPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }

      try {
        manager.updateSetup(payload);
      } catch (error) {
        socket.emit("storyteller_response", {
          text: error instanceof Error ? error.message : "Could not update setup.",
        });
      }
    });

    socket.on("toggle_ready", async (rawPayload) => {
      const payload = withValidation(socket, toggleReadyPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }

      try {
        await manager.toggleReady(payload);
      } catch (error) {
        socket.emit("storyteller_response", {
          text: error instanceof Error ? error.message : "Could not toggle ready state.",
        });
      }
    });

    socket.on("update_runtime_config", (rawPayload) => {
      const payload = withValidation(socket, updateRuntimeConfigPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }

      try {
        manager.updateRuntimeConfig(payload);
      } catch (error) {
        socket.emit("storyteller_response", {
          text: error instanceof Error ? error.message : "Could not update runtime config.",
        });
      }
    });

    socket.on("cast_vote", async (rawPayload) => {
      const payload = withValidation(socket, castVotePayloadSchema, rawPayload);
      if (!payload) {
        return;
      }

      try {
        const result = await manager.castVote(payload);
        if (result.duplicateVote) {
          socket.emit("storyteller_response", {
            text: "Vote already recorded. Votes are immutable in this session.",
          });
        }
      } catch (error) {
        socket.emit("storyteller_response", {
          text: error instanceof Error ? error.message : "Could not cast vote.",
        });
      }
    });

    socket.on("submit_action", (rawPayload) => {
      const payload = withValidation(socket, submitActionPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }

      try {
        manager.submitAction(payload);
      } catch (error) {
        socket.emit("storyteller_response", {
          text: error instanceof Error ? error.message : "Could not submit action.",
        });
      }
    });

    socket.on("end_session", async (rawPayload) => {
      const payload = withValidation(socket, endSessionPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }

      try {
        await manager.endSession(payload);
      } catch (error) {
        socket.emit("storyteller_response", {
          text: error instanceof Error ? error.message : "Could not end session.",
        });
      }
    });

    socket.on("disconnect", () => {
      const link = manager.getParticipantForSocket(socket.id);
      if (!link) {
        return;
      }

      manager.leaveBySocket(socket.id);
      emitAdventureState(io, link.adventureId, manager);
    });
  });
};
