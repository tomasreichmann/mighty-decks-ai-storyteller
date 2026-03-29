import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { TextField } from "../components/common/TextField";
import { ShareLinkOverlay } from "../components/ShareLinkOverlay";
import { useCampaignSession } from "../hooks/useCampaignSession";
import {
  getCampaignSessionIdentity,
  setCampaignSessionDisplayName,
} from "../lib/campaignSessionIdentity";
import { generateUuid } from "../lib/randomId";

const buildSessionUrl = (
  campaignSlug: string,
  sessionId: string,
  suffix = "",
): string => {
  if (typeof window === "undefined") {
    return `/campaign/${campaignSlug}/session/${sessionId}${suffix}`;
  }

  return new URL(
    `/campaign/${encodeURIComponent(campaignSlug)}/session/${encodeURIComponent(sessionId)}${suffix}`,
    window.location.origin,
  ).toString();
};

export const CampaignSessionLobbyPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { campaignSlug, sessionId } = useParams<{
    campaignSlug?: string;
    sessionId?: string;
  }>();
  const [shareOpen, setShareOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [storytellerName, setStorytellerName] = useState("");
  const [mockName, setMockName] = useState("");

  if (!campaignSlug || !sessionId) {
    return (
      <div className="app-shell py-10 gap-4">
        <Message label="Error" color="curse">
          Missing campaign session route params.
        </Message>
      </div>
    );
  }

  const viewerId = useMemo(() => `campaign-viewer-${generateUuid()}`, []);
  const {
    session,
    error,
    connected,
    joinSession,
    joinRole,
    addMock,
  } = useCampaignSession({
    campaignSlug,
    sessionId,
  });

  useEffect(() => {
    joinSession(viewerId);
  }, [joinSession, viewerId]);

  const playerIdentity = useMemo(
    () => getCampaignSessionIdentity(campaignSlug, sessionId, "player"),
    [campaignSlug, sessionId],
  );
  const storytellerIdentity = useMemo(
    () => getCampaignSessionIdentity(campaignSlug, sessionId, "storyteller"),
    [campaignSlug, sessionId],
  );
  const sessionUrl = useMemo(
    () => buildSessionUrl(campaignSlug, sessionId),
    [campaignSlug, sessionId],
  );
  const allowMocks = !import.meta.env.PROD;

  useEffect(() => {
    if (!playerName) {
      setPlayerName(playerIdentity.displayName);
    }
  }, [playerIdentity.displayName, playerName]);

  useEffect(() => {
    if (!storytellerName) {
      setStorytellerName(storytellerIdentity.displayName);
    }
  }, [storytellerIdentity.displayName, storytellerName]);

  return (
    <div className="app-shell stack py-8 gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="stack gap-1">
          <Text variant="h2" color="iron">
            Campaign Session Lobby
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Join as Player or Storyteller, then invite the rest of the table.
          </Text>
        </div>
        <Button
          variant="ghost"
          color="cloth"
          onClick={() => setShareOpen(true)}
        >
          Invite players
        </Button>
      </header>

      {!connected ? (
        <Message label="Connecting" color="cloth">
          Reconnecting to session realtime...
        </Message>
      ) : null}

      {error ? (
        <Message label="Session Error" color="blood">
          {error}
        </Message>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel contentClassName="stack gap-4">
          <Text variant="h3" color="iron">
            Join as Player
          </Text>
          <TextField
            label="Player Name"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            maxLength={120}
          />
          <Button
            color="gold"
            onClick={() => {
              const nextName = playerName.trim() || playerIdentity.displayName;
              setCampaignSessionDisplayName(
                campaignSlug,
                sessionId,
                "player",
                nextName,
              );
              joinRole({
                participantId: playerIdentity.participantId,
                displayName: nextName,
                role: "player",
              });
              navigate(
                `/campaign/${encodeURIComponent(campaignSlug)}/session/${encodeURIComponent(sessionId)}/player`,
              );
            }}
          >
            Join as Player
          </Button>
        </Panel>

        <Panel contentClassName="stack gap-4">
          <Text variant="h3" color="iron">
            Join as Storyteller
          </Text>
          <TextField
            label="Storyteller Name"
            value={storytellerName}
            onChange={(event) => setStorytellerName(event.target.value)}
            maxLength={120}
          />
          <Button
            color="gold"
            onClick={() => {
              const nextName =
                storytellerName.trim() || storytellerIdentity.displayName;
              setCampaignSessionDisplayName(
                campaignSlug,
                sessionId,
                "storyteller",
                nextName,
              );
              joinRole({
                participantId: storytellerIdentity.participantId,
                displayName: nextName,
                role: "storyteller",
              });
              navigate(
                `/campaign/${encodeURIComponent(campaignSlug)}/session/${encodeURIComponent(sessionId)}/storyteller/chat`,
              );
            }}
          >
            Join as Storyteller
          </Button>
        </Panel>
      </div>

      <Panel contentClassName="stack gap-3">
        <Text variant="h3" color="iron">
          Session Status
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Status: {session?.status ?? "loading"}
        </Text>
        <div className="grid gap-2 md:grid-cols-2">
          {(session?.participants ?? []).map((participant) => (
            <div
              key={participant.participantId}
              className="rounded-sm border-2 border-kac-iron/20 bg-kac-bone-light/60 px-3 py-2"
            >
              <Text variant="emphasised" color="iron">
                {participant.displayName}
              </Text>
              <Text variant="note" color="steel-dark" className="text-xs">
                {participant.role}
                {participant.isMock ? " mock" : ""}
                {participant.connected ? " connected" : " disconnected"}
              </Text>
            </div>
          ))}
        </div>
      </Panel>

      {allowMocks ? (
        <Panel contentClassName="stack gap-3">
          <Text variant="h3" color="iron">
            Dev Mock Seats
          </Text>
          <TextField
            label="Mock Name"
            value={mockName}
            onChange={(event) => setMockName(event.target.value)}
            placeholder="Mock Scout"
            maxLength={120}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              color="cloth"
              onClick={() => {
                addMock({
                  displayName: mockName.trim() || "Mock Player",
                  role: "player",
                });
                setMockName("");
              }}
            >
              Add Mock Player
            </Button>
            <Button
              variant="ghost"
              color="cloth"
              onClick={() => {
                addMock({
                  displayName: mockName.trim() || "Mock Storyteller",
                  role: "storyteller",
                });
                setMockName("");
              }}
            >
              Add Mock Storyteller
            </Button>
          </div>
        </Panel>
      ) : null}

      <ShareLinkOverlay
        open={shareOpen}
        title="Campaign Session Invite"
        shortTitle="Invite"
        url={sessionUrl}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
};
