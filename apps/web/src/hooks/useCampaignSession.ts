import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CampaignSessionDetail } from "@mighty-decks/spec/campaign";
import { createSocketClient } from "../lib/socket";

interface UseCampaignSessionOptions {
  campaignSlug: string;
  sessionId: string;
  enabled?: boolean;
}

export const useCampaignSession = ({
  campaignSlug,
  sessionId,
  enabled = true,
}: UseCampaignSessionOptions) => {
  const socketRef = useRef(createSocketClient());
  const lastJoinedParticipantIdRef = useRef<string | null>(null);
  const lastJoinedRoleKeyRef = useRef<string | null>(null);
  const [session, setSession] = useState<CampaignSessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(socketRef.current.connected);
  const [campaignUpdatedAtIso, setCampaignUpdatedAtIso] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = socketRef.current;

    const handleConnect = (): void => {
      setConnected(true);
    };
    const handleDisconnect = (): void => {
      setConnected(false);
      lastJoinedParticipantIdRef.current = null;
      lastJoinedRoleKeyRef.current = null;
    };
    const handleState = (nextSession: CampaignSessionDetail): void => {
      setSession(nextSession);
      setError(null);
    };
    const handleCampaignUpdated = (payload: { updatedAtIso: string }): void => {
      setCampaignUpdatedAtIso(payload.updatedAtIso);
    };
    const handleError = (payload: { message: string }): void => {
      setError(payload.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("campaign_session_state", handleState);
    socket.on("campaign_updated", handleCampaignUpdated);
    socket.on("campaign_session_error", handleError);
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("campaign_session_state", handleState);
      socket.off("campaign_updated", handleCampaignUpdated);
      socket.off("campaign_session_error", handleError);
      socket.disconnect();
    };
  }, [enabled]);

  const basePayload = useMemo(
    () => ({
      campaignSlug,
      sessionId,
    }),
    [campaignSlug, sessionId],
  );

  const joinSession = useCallback(
    (participantId: string): void => {
      lastJoinedParticipantIdRef.current = participantId;
      socketRef.current.emit("join_campaign_session", {
        ...basePayload,
        participantId,
      });
    },
    [basePayload],
  );

  const joinRole = useCallback(
    (options: {
      participantId: string;
      displayName: string;
      role: "player" | "storyteller";
    }): void => {
      lastJoinedRoleKeyRef.current = [
        options.participantId,
        options.displayName,
        options.role,
      ].join(":");
      socketRef.current.emit("join_campaign_session_role", {
        ...basePayload,
        ...options,
      });
    },
    [basePayload],
  );

  const ensureSessionParticipant = useCallback(
    (participantId: string): void => {
      if (lastJoinedParticipantIdRef.current === participantId) {
        return;
      }

      joinSession(participantId);
    },
    [joinSession],
  );

  const ensureSessionRole = useCallback(
    (options: {
      participantId: string;
      displayName: string;
      role: "player" | "storyteller";
    }): void => {
      ensureSessionParticipant(options.participantId);

      const roleKey = [
        options.participantId,
        options.displayName,
        options.role,
      ].join(":");
      if (lastJoinedRoleKeyRef.current === roleKey) {
        return;
      }

      joinRole(options);
    },
    [ensureSessionParticipant, joinRole],
  );

  useEffect(() => {
    lastJoinedParticipantIdRef.current = null;
    lastJoinedRoleKeyRef.current = null;
  }, [campaignSlug, sessionId]);

  const leaveSession = useCallback(
    (participantId: string): void => {
      socketRef.current.emit("leave_campaign_session", {
        ...basePayload,
        participantId,
      });
    },
    [basePayload],
  );

  const addMock = useCallback(
    (options: { displayName: string; role: "player" | "storyteller" }): void => {
      socketRef.current.emit("add_campaign_session_mock", {
        ...basePayload,
        ...options,
      });
    },
    [basePayload],
  );

  const claimCharacter = useCallback(
    (participantId: string, actorFragmentId: string): void => {
      socketRef.current.emit("claim_campaign_session_character", {
        ...basePayload,
        participantId,
        actorFragmentId,
      });
    },
    [basePayload],
  );

  const createCharacter = useCallback(
    (participantId: string, title: string): void => {
      socketRef.current.emit("create_campaign_session_character", {
        ...basePayload,
        participantId,
        title,
      });
    },
    [basePayload],
  );

  const sendMessage = useCallback(
    (participantId: string, text: string): void => {
      socketRef.current.emit("send_campaign_session_message", {
        ...basePayload,
        participantId,
        text,
      });
    },
    [basePayload],
  );

  const closeSession = useCallback(
    (participantId: string): void => {
      socketRef.current.emit("close_campaign_session", {
        ...basePayload,
        participantId,
      });
    },
    [basePayload],
  );

  return {
    session,
    error,
    connected,
    campaignUpdatedAtIso,
    joinSession,
    joinRole,
    ensureSessionParticipant,
    ensureSessionRole,
    leaveSession,
    addMock,
    claimCharacter,
    createCharacter,
    sendMessage,
    closeSession,
  };
};
