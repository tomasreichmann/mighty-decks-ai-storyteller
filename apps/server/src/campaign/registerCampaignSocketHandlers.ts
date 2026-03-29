import type { Socket, Server as SocketServer } from "socket.io";
import {
  addCampaignSessionMockPayloadSchema,
  campaignSessionErrorPayloadSchema,
  closeCampaignSessionPayloadSchema,
  claimCampaignSessionCharacterPayloadSchema,
  createCampaignSessionCharacterPayloadSchema,
  joinCampaignSessionPayloadSchema,
  joinCampaignSessionRolePayloadSchema,
  leaveCampaignSessionPayloadSchema,
  sendCampaignSessionMessagePayloadSchema,
  watchCampaignPayloadSchema,
  type CampaignClientToServerEvents,
  type CampaignServerToClientEvents,
} from "@mighty-decks/spec/campaignEvents";
import type { ClientToServerEvents, ServerToClientEvents } from "@mighty-decks/spec/events";
import { CampaignStore } from "../persistence/CampaignStore";

const sessionRoom = (campaignSlug: string, sessionId: string) =>
  `campaign-session:${campaignSlug}:${sessionId}`;
const campaignRoom = (campaignSlug: string) => `campaign:${campaignSlug}`;

type CombinedClientEvents = ClientToServerEvents & CampaignClientToServerEvents;
type CombinedServerEvents = ServerToClientEvents & CampaignServerToClientEvents;

const emitSessionError = (
  socket: Socket<CombinedClientEvents, CombinedServerEvents>,
  message: string,
): void => {
  socket.emit("campaign_session_error", campaignSessionErrorPayloadSchema.parse({ message }));
};

const withValidation = <T>(
  socket: Socket<CombinedClientEvents, CombinedServerEvents>,
  parser: { safeParse: (payload: unknown) => { success: true; data: T } | { success: false } },
  payload: unknown,
): T | null => {
  const parsed = parser.safeParse(payload);
  if (!parsed.success) {
    emitSessionError(socket, "Invalid campaign session payload received.");
    return null;
  }
  return parsed.data;
};

export const registerCampaignSocketHandlers = (
  io: SocketServer<CombinedClientEvents, CombinedServerEvents>,
  store: CampaignStore,
): void => {
  const socketLinks = new Map<
    string,
    { campaignSlug: string; sessionId: string; participantId: string }
  >();

  const emitSessionState = async (
    campaignSlug: string,
    sessionId: string,
  ): Promise<void> => {
    const session = await store.getSession({ campaignSlug, sessionId });
    if (!session) {
      return;
    }
    io.to(sessionRoom(campaignSlug, sessionId)).emit("campaign_session_state", session);
  };

  const emitCampaignUpdated = (campaignSlug: string): void => {
    io.to(campaignRoom(campaignSlug)).emit("campaign_updated", {
      campaignSlug,
      updatedAtIso: new Date().toISOString(),
    });
  };

  io.on("connection", (socket) => {
    socket.on("watch_campaign", (rawPayload) => {
      const payload = withValidation(socket, watchCampaignPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }
      socket.join(campaignRoom(payload.campaignSlug));
    });

    socket.on("unwatch_campaign", (rawPayload) => {
      const payload = withValidation(socket, watchCampaignPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }
      socket.leave(campaignRoom(payload.campaignSlug));
    });

    socket.on("join_campaign_session", async (rawPayload) => {
      const payload = withValidation(socket, joinCampaignSessionPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }
      try {
        const session = await store.getSession({
          campaignSlug: payload.campaignSlug,
          sessionId: payload.sessionId,
        });
        if (!session) {
          emitSessionError(socket, "Campaign session not found.");
          return;
        }
        socket.join(campaignRoom(payload.campaignSlug));
        socket.join(sessionRoom(payload.campaignSlug, payload.sessionId));
        socketLinks.set(socket.id, {
          campaignSlug: payload.campaignSlug,
          sessionId: payload.sessionId,
          participantId: payload.participantId,
        });
        socket.emit("campaign_session_state", session);
      } catch (error) {
        emitSessionError(
          socket,
          error instanceof Error ? error.message : "Could not join campaign session.",
        );
      }
    });

    socket.on("join_campaign_session_role", async (rawPayload) => {
      const payload = withValidation(socket, joinCampaignSessionRolePayloadSchema, rawPayload);
      if (!payload) {
        return;
      }
      try {
        socket.join(campaignRoom(payload.campaignSlug));
        socket.join(sessionRoom(payload.campaignSlug, payload.sessionId));
        socketLinks.set(socket.id, {
          campaignSlug: payload.campaignSlug,
          sessionId: payload.sessionId,
          participantId: payload.participantId,
        });
        await store.upsertSessionParticipant({
          campaignSlug: payload.campaignSlug,
          sessionId: payload.sessionId,
          participantId: payload.participantId,
          displayName: payload.displayName,
          role: payload.role,
        });
        await emitSessionState(payload.campaignSlug, payload.sessionId);
      } catch (error) {
        emitSessionError(
          socket,
          error instanceof Error ? error.message : "Could not join campaign session role.",
        );
      }
    });

    socket.on("add_campaign_session_mock", async (rawPayload) => {
      const payload = withValidation(socket, addCampaignSessionMockPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }
      try {
        await store.upsertSessionParticipant({
          campaignSlug: payload.campaignSlug,
          sessionId: payload.sessionId,
          participantId: `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          displayName: payload.displayName,
          role: payload.role,
          isMock: true,
        });
        await emitSessionState(payload.campaignSlug, payload.sessionId);
      } catch (error) {
        emitSessionError(
          socket,
          error instanceof Error ? error.message : "Could not add campaign session mock.",
        );
      }
    });

    socket.on("claim_campaign_session_character", async (rawPayload) => {
      const payload = withValidation(socket, claimCampaignSessionCharacterPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }
      try {
        await store.claimSessionCharacter(payload);
        await emitSessionState(payload.campaignSlug, payload.sessionId);
      } catch (error) {
        emitSessionError(
          socket,
          error instanceof Error ? error.message : "Could not claim player character.",
        );
      }
    });

    socket.on("create_campaign_session_character", async (rawPayload) => {
      const payload = withValidation(socket, createCampaignSessionCharacterPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }
      try {
        await store.createSessionPlayerCharacter(payload);
        await emitSessionState(payload.campaignSlug, payload.sessionId);
        emitCampaignUpdated(payload.campaignSlug);
      } catch (error) {
        emitSessionError(
          socket,
          error instanceof Error ? error.message : "Could not create player character.",
        );
      }
    });

    socket.on("send_campaign_session_message", async (rawPayload) => {
      const payload = withValidation(socket, sendCampaignSessionMessagePayloadSchema, rawPayload);
      if (!payload) {
        return;
      }
      try {
        await store.appendSessionGroupMessage(payload);
        await emitSessionState(payload.campaignSlug, payload.sessionId);
      } catch (error) {
        emitSessionError(
          socket,
          error instanceof Error ? error.message : "Could not send campaign session message.",
        );
      }
    });

    socket.on("close_campaign_session", async (rawPayload) => {
      const payload = withValidation(socket, closeCampaignSessionPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }
      try {
        await store.closeSession(payload);
        await emitSessionState(payload.campaignSlug, payload.sessionId);
      } catch (error) {
        emitSessionError(
          socket,
          error instanceof Error ? error.message : "Could not close campaign session.",
        );
      }
    });

    socket.on("leave_campaign_session", async (rawPayload) => {
      const payload = withValidation(socket, leaveCampaignSessionPayloadSchema, rawPayload);
      if (!payload) {
        return;
      }
      try {
        await store.removeSessionParticipant({
          campaignSlug: payload.campaignSlug,
          sessionId: payload.sessionId,
          participantId: payload.participantId,
        });
        socket.leave(sessionRoom(payload.campaignSlug, payload.sessionId));
        socketLinks.delete(socket.id);
        await emitSessionState(payload.campaignSlug, payload.sessionId);
      } catch (error) {
        emitSessionError(
          socket,
          error instanceof Error ? error.message : "Could not leave campaign session.",
        );
      }
    });

    socket.on("disconnect", () => {
      const link = socketLinks.get(socket.id);
      socketLinks.delete(socket.id);
      if (!link) {
        return;
      }
      void store
        .removeSessionParticipant({
          campaignSlug: link.campaignSlug,
          sessionId: link.sessionId,
          participantId: link.participantId,
        })
        .then(() => emitSessionState(link.campaignSlug, link.sessionId))
        .catch(() => undefined);
    });
  });
};
