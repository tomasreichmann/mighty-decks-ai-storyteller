import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/common/Button";
import { ButtonRadioGroup } from "../components/common/ButtonRadioGroup";
import { CTAButton } from "../components/common/CTAButton";
import { ConnectionStatusPill } from "../components/common/ConnectionStatusPill";
import { Message } from "../components/common/Message";
import { Section } from "../components/common/Section";
import { Tag } from "../components/common/Tag";
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
  const [selectedRole, setSelectedRole] = useState<"player" | "storyteller">(
    "player",
  );
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
    ensureSessionParticipant,
    ensureSessionRole,
    addMock,
  } = useCampaignSession({
    campaignSlug,
    sessionId,
  });

  useEffect(() => {
    if (!connected) {
      return;
    }

    ensureSessionParticipant(viewerId);
  }, [connected, ensureSessionParticipant, viewerId]);

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

  const selectedIdentity =
    selectedRole === "player" ? playerIdentity : storytellerIdentity;
  const selectedName = selectedRole === "player" ? playerName : storytellerName;
  const setSelectedName =
    selectedRole === "player" ? setPlayerName : setStorytellerName;

  const joinSelectedRole = (): void => {
    const nextName = selectedName.trim() || selectedIdentity.displayName;

    setCampaignSessionDisplayName(
      campaignSlug,
      sessionId,
      selectedRole,
      nextName,
    );
    ensureSessionRole({
      participantId: selectedIdentity.participantId,
      displayName: nextName,
      role: selectedRole,
    });
    navigate(
      selectedRole === "player"
        ? `/campaign/${encodeURIComponent(campaignSlug)}/session/${encodeURIComponent(sessionId)}/player`
        : `/campaign/${encodeURIComponent(campaignSlug)}/session/${encodeURIComponent(sessionId)}/storyteller/chat`,
    );
  };

  return (
    <div className="app-shell stack py-8 gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="stack gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Text variant="h2" color="iron">
              Session
            </Text>
            <Tag tone={session?.status === "active" ? "monster" : "cloth"}>
              {session?.status ?? "loading"}
            </Tag>
          </div>
          <Text variant="body" color="iron-light" className="text-sm">
            Choose your seat, then invite the rest of the table.
          </Text>
          <div className="flex flex-wrap gap-2">
            {(session?.participants ?? []).map((participant) => (
              <ConnectionStatusPill
                key={participant.participantId}
                label={participant.displayName}
                status={participant.connected ? "connected" : "disconnected"}
                detail={`${participant.role}${participant.isMock ? " mock" : ""}`}
              />
            ))}
          </div>
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

      <Section className="stack gap-4 py-4">
        <div className="stack items-center gap-2 text-center">
          <Text variant="h3" color="iron">
            Choose your seat
          </Text>
        </div>

        <Section className="stack items-center gap-4">
          <div className="stack items-center gap-3">
            <ButtonRadioGroup
              ariaLabel="Choose your seat"
              color="gold"
              onValueChange={setSelectedRole}
              options={[
                {
                  label: (
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true" className="text-base leading-none">
                        ♟️
                      </span>
                      <span>Player</span>
                    </span>
                  ),
                  value: "player",
                },
                {
                  label: (
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true" className="text-base leading-none">
                        🖥️
                      </span>
                      <span>Storyteller</span>
                    </span>
                  ),
                  value: "storyteller",
                },
              ]}
              size="m"
              value={selectedRole}
            />
          </div>
          <TextField
            label="Name"
            className="max-w-[20rem]"
            value={selectedName}
            onChange={(event) => setSelectedName(event.target.value)}
            maxLength={120}
          />
          <CTAButton
            color="gold"
            containerClassName="self-center"
            onClick={joinSelectedRole}
          >
            {selectedRole === "player"
              ? "Join as Player"
              : "Join as Storyteller"}
          </CTAButton>
        </Section>
      </Section>

      {allowMocks ? (
        <Section className="stack gap-3">
          <Message label="Dev Mock Seats" color="cloth">
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-full max-w-[18rem] self-end">
                <TextField
                  label="Mock Name"
                  className="w-full"
                  value={mockName}
                  onChange={(event) => setMockName(event.target.value)}
                  placeholder="Mock Scout"
                  maxLength={120}
                />
              </div>
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
          </Message>
        </Section>
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
