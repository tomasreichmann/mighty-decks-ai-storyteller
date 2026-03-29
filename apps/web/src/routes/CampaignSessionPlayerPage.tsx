import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CampaignDetail } from "@mighty-decks/spec/campaign";
import { Button } from "../components/common/Button";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { TextArea } from "../components/common/TextArea";
import { TextField } from "../components/common/TextField";
import { useCampaignSession } from "../hooks/useCampaignSession";
import { getCampaignSessionIdentity } from "../lib/campaignSessionIdentity";
import { getCampaignBySlug } from "../lib/campaignApi";

export const CampaignSessionPlayerPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { campaignSlug, sessionId } = useParams<{
    campaignSlug?: string;
    sessionId?: string;
  }>();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [newCharacterTitle, setNewCharacterTitle] = useState("");
  const [messageText, setMessageText] = useState("");

  if (!campaignSlug || !sessionId) {
    return (
      <div className="app-shell py-10 gap-4">
        <Message label="Error" color="curse">
          Missing campaign session route params.
        </Message>
      </div>
    );
  }

  const identity = useMemo(
    () => getCampaignSessionIdentity(campaignSlug, sessionId, "player"),
    [campaignSlug, sessionId],
  );
  const {
    session,
    error,
    connected,
    joinSession,
    joinRole,
    claimCharacter,
    createCharacter,
    sendMessage,
  } = useCampaignSession({
    campaignSlug,
    sessionId,
  });

  useEffect(() => {
    joinSession(identity.participantId);
    joinRole({
      participantId: identity.participantId,
      displayName: identity.displayName,
      role: "player",
    });
  }, [identity.displayName, identity.participantId, joinRole, joinSession]);

  useEffect(() => {
    let cancelled = false;
    void getCampaignBySlug(campaignSlug)
      .then((nextCampaign) => {
        if (!cancelled) {
          setCampaign(nextCampaign);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setCampaignError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load campaign characters.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [campaignSlug, session?.updatedAtIso]);

  const myClaim = useMemo(
    () =>
      session?.claims.find(
        (claim) => claim.participantId === identity.participantId,
      ) ?? null,
    [identity.participantId, session?.claims],
  );
  const availableCharacters = useMemo(() => {
    const claimsByActorId = new Map(
      (session?.claims ?? []).map((claim) => [claim.actorFragmentId, claim.participantId]),
    );
    return (campaign?.actors ?? []).filter((actor) => {
      if (!actor.isPlayerCharacter) {
        return false;
      }
      const claimOwner = claimsByActorId.get(actor.fragmentId);
      return !claimOwner || claimOwner === identity.participantId;
    });
  }, [campaign?.actors, identity.participantId, session?.claims]);
  const claimedCharacter = useMemo(
    () =>
      campaign?.actors.find(
        (actor) => actor.fragmentId === myClaim?.actorFragmentId,
      ) ?? null,
    [campaign?.actors, myClaim?.actorFragmentId],
  );
  const canChat = Boolean(claimedCharacter) && session?.status !== "closed";

  return (
    <div className="app-shell stack py-8 gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="stack gap-1">
          <Text variant="h2" color="iron">
            Player Session
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Claim an existing player character or create a new one, then join the
            Group Chat.
          </Text>
        </div>
        <Button
          variant="ghost"
          color="cloth"
          onClick={() =>
            navigate(
              `/campaign/${encodeURIComponent(campaignSlug)}/session/${encodeURIComponent(sessionId)}`,
            )
          }
        >
          Back to Lobby
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
      {campaignError ? (
        <Message label="Campaign Error" color="blood">
          {campaignError}
        </Message>
      ) : null}

      {!claimedCharacter ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <Panel contentClassName="stack gap-3">
            <Text variant="h3" color="iron">
              Claim an Existing Character
            </Text>
            {(availableCharacters.length > 0 ? availableCharacters : []).map((actor) => (
              <div
                key={actor.fragmentId}
                className="rounded-sm border-2 border-kac-iron/15 bg-kac-bone-light/70 px-3 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="stack gap-1">
                    <Text variant="emphasised" color="iron">
                      {actor.title}
                    </Text>
                    <Text variant="body" color="iron-light" className="text-sm">
                      {actor.summary ?? "No summary yet."}
                    </Text>
                  </div>
                  <Button
                    color="gold"
                    onClick={() =>
                      claimCharacter(identity.participantId, actor.fragmentId)
                    }
                  >
                    Claim This Character
                  </Button>
                </div>
              </div>
            ))}
            {availableCharacters.length === 0 ? (
              <Text variant="body" color="iron-light" className="text-sm">
                No unclaimed player characters are available yet.
              </Text>
            ) : null}
          </Panel>

          <Panel contentClassName="stack gap-3">
            <Text variant="h3" color="iron">
              Create a New Character
            </Text>
            <TextField
              label="Character Name"
              value={newCharacterTitle}
              onChange={(event) => setNewCharacterTitle(event.target.value)}
              maxLength={120}
              placeholder="Lyra Vell"
            />
            <Button
              color="gold"
              disabled={newCharacterTitle.trim().length === 0}
              onClick={() => {
                createCharacter(identity.participantId, newCharacterTitle.trim());
                setNewCharacterTitle("");
              }}
            >
              Create a New Character
            </Button>
          </Panel>
        </div>
      ) : null}

      {claimedCharacter ? (
        <>
          <Panel contentClassName="stack gap-2">
            <Text variant="h3" color="iron">
              Claimed Character
            </Text>
            <Text variant="emphasised" color="iron">
              {claimedCharacter.title}
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              {claimedCharacter.summary ?? "No summary yet."}
            </Text>
          </Panel>

          <Panel contentClassName="stack gap-3">
            <Text variant="h3" color="iron">
              Group Chat
            </Text>
            <div className="max-h-[24rem] overflow-y-auto rounded-sm border-2 border-kac-iron/15 bg-kac-bone-light/70 px-3 py-3">
              <div className="stack gap-3">
                {(session?.transcript ?? []).map((entry) => (
                  <div key={entry.entryId} className="stack gap-1">
                    <Text variant="note" color="steel-dark" className="text-xs">
                      {entry.authorDisplayName
                        ? `${entry.authorDisplayName} (${entry.authorRole})`
                        : "System"}
                    </Text>
                    <Text variant="body" color="iron" className="text-sm whitespace-pre-wrap">
                      {entry.text}
                    </Text>
                  </div>
                ))}
              </div>
            </div>

            {session?.status === "closed" ? (
              <Message label="Closed" color="cloth">
                This session has been closed by the storyteller.
              </Message>
            ) : null}

            <TextArea
              label="Message"
              rows={4}
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="Share your action or ask the table a question..."
            />
            <Button
              color="gold"
              disabled={!canChat || messageText.trim().length === 0}
              onClick={() => {
                sendMessage(identity.participantId, messageText.trim());
                setMessageText("");
              }}
            >
              Send to Group Chat
            </Button>
          </Panel>
        </>
      ) : null}
    </div>
  );
};
