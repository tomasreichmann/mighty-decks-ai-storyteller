import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { CampaignDetail } from "@mighty-decks/spec/campaign";
import { ActorCard } from "../components/cards/ActorCard";
import { CampaignSessionTranscriptFeed } from "../components/CampaignSessionTranscriptFeed";
import { MarkdownImageInsertButton } from "../components/MarkdownImageInsertButton";
import { Button } from "../components/common/Button";
import { DepressedInput } from "../components/common/DepressedInput";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Section } from "../components/common/Section";
import { Text } from "../components/common/Text";
import { TextField } from "../components/common/TextField";
import { useCampaignSession } from "../hooks/useCampaignSession";
import { getCampaignSessionIdentity } from "../lib/campaignSessionIdentity";
import { getCampaignBySlug } from "../lib/campaignApi";
import { createGameCardCatalogContextValue } from "../lib/gameCardCatalogContext";
import { appendMarkdownSnippet } from "../lib/markdownImage";
import type { SmartInputDocumentContext } from "../lib/smartInputContext";

export const CampaignSessionPlayerPage = (): JSX.Element => {
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
    campaignUpdatedAtIso,
    ensureSessionRole,
    claimCharacter,
    createCharacter,
    sendMessage,
  } = useCampaignSession({
    campaignSlug,
    sessionId,
  });

  useEffect(() => {
    if (!connected) {
      return;
    }

    ensureSessionRole({
      participantId: identity.participantId,
      displayName: identity.displayName,
      role: "player",
    });
  }, [
    connected,
    ensureSessionRole,
    identity.displayName,
    identity.participantId,
  ]);

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
  }, [campaignSlug, campaignUpdatedAtIso]);

  const joinedPlayerParticipant = useMemo(
    () =>
      session?.participants.find(
        (participant) =>
          participant.participantId === identity.participantId &&
          participant.role === "player",
      ) ?? null,
    [identity.participantId, session?.participants],
  );

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
  const canChat =
    Boolean(claimedCharacter) &&
    Boolean(joinedPlayerParticipant) &&
    session?.status !== "closed";
  const readyToClaimCharacter = Boolean(joinedPlayerParticipant);
  const playerSummaryContent = useMemo(() => {
    if (!campaign) {
      return "";
    }
    const fragmentId = campaign.index.playerSummaryFragmentId;
    return (
      campaign.fragments.find(
        (fragment) => fragment.fragment.fragmentId === fragmentId,
      )?.content ?? ""
    );
  }, [campaign]);
  const storytellerSummaryContent = useMemo(() => {
    if (!campaign) {
      return "";
    }
    const fragmentId = campaign.index.storytellerSummaryFragmentId;
    return (
      campaign.fragments.find(
        (fragment) => fragment.fragment.fragmentId === fragmentId,
      )?.content ?? ""
    );
  }, [campaign]);
  const gameCardCatalogValue = useMemo(
    () =>
      createGameCardCatalogContextValue({
        actors: campaign?.actors ?? [],
        counters: campaign?.counters ?? [],
        assets: campaign?.assets ?? [],
        encounters: campaign?.encounters ?? [],
        quests: campaign?.quests ?? [],
      }),
    [campaign],
  );
  const smartContextDocument = useMemo<SmartInputDocumentContext>(
    () => ({
      moduleTitle: campaign?.index.title ?? "",
      moduleSummary: campaign?.index.summary ?? "",
      moduleIntent: campaign?.index.intent ?? "",
      premise: campaign?.index.premise ?? "",
      haveTags: campaign?.index.dos ?? [],
      avoidTags: campaign?.index.donts ?? [],
      playerSummary: campaign?.index.playerSummaryMarkdown ?? "",
      playerInfo: playerSummaryContent,
      storytellerSummary: campaign?.index.storytellerSummaryMarkdown ?? "",
      storytellerInfo: storytellerSummaryContent,
    }),
    [campaign, playerSummaryContent, storytellerSummaryContent],
  );
  const handleSendMessage = (): void => {
    const text = messageText.trim();
    if (!canChat || text.length === 0) {
      return;
    }

    sendMessage(identity.participantId, text);
    setMessageText("");
  };

  const handleMessageKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ): void => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="stack w-full max-w-none gap-4 px-4 py-3 sm:px-6 lg:px-8">
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
        <Section className="stack gap-5">
          {!readyToClaimCharacter ? (
            <Message label="Joining Seat" color="cloth">
              Confirming your player seat with the session before character
              claim opens.
            </Message>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <Section className="stack gap-3">
              <Text variant="h3" color="iron">
                Claim a Character
              </Text>
              {(availableCharacters.length > 0 ? availableCharacters : []).map((actor) => (
                <div key={actor.fragmentId} className="flex flex-wrap items-start gap-4">
                  <ActorCard
                    className="w-full max-w-[13rem] shrink-0"
                    baseLayerSlug={actor.baseLayerSlug}
                    tacticalRoleSlug={actor.tacticalRoleSlug}
                    tacticalSpecialSlug={actor.tacticalSpecialSlug ?? undefined}
                  />
                  <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3 rounded-sm border-2 border-kac-iron/15 bg-kac-bone-light/70 px-3 py-3">
                    <div className="stack min-w-0 gap-1">
                      <Text variant="emphasised" color="iron">
                        {actor.title}
                      </Text>
                      <Text
                        variant="body"
                        color="iron-light"
                        className="text-sm"
                      >
                        {actor.summary ?? "No summary yet."}
                      </Text>
                    </div>
                    <Button
                      color="gold"
                      disabled={!readyToClaimCharacter}
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
            </Section>

            <Section className="stack gap-3">
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
              <div className="flex justify-end">
                <Button
                  color="gold"
                  disabled={
                    !readyToClaimCharacter || newCharacterTitle.trim().length === 0
                  }
                  onClick={() => {
                    createCharacter(identity.participantId, newCharacterTitle.trim());
                    setNewCharacterTitle("");
                  }}
                >
                  Create
                </Button>
              </div>
            </Section>
          </div>
        </Section>
      ) : null}

      {claimedCharacter ? (
        <>
          <Message label="Claimed Character" color="gold">
            <Text variant="emphasised" color="iron">
              {claimedCharacter.title}
            </Text>
            <Text variant="body" color="iron-light" className="text-sm">
              {claimedCharacter.summary ?? "No summary yet."}
            </Text>
          </Message>

          <Panel contentClassName="stack gap-4">
            <Text variant="h3" color="iron">
              Transcript
            </Text>
            <CampaignSessionTranscriptFeed
              entries={session?.transcript ?? []}
              participants={session?.participants ?? []}
              currentParticipantId={identity.participantId}
              gameCardCatalogValue={gameCardCatalogValue}
              className="max-h-[24rem]"
            />

            {session?.status === "closed" ? (
              <Message label="Closed" color="cloth">
                This session has been closed by the storyteller.
              </Message>
            ) : null}

            <div className="stack gap-2">
              <DepressedInput
                multiline
                label="Message"
                labelColor="gold"
                rows={4}
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                placeholder="Share your action, narration, or question for the table..."
                controlClassName="min-h-[7.5rem] pr-12"
                topRightControl={
                  <MarkdownImageInsertButton
                    identityKey={`${campaignSlug}-${sessionId}-player-chat-image`}
                    smartContextDocument={smartContextDocument}
                    currentInputValue={messageText}
                    disabled={!canChat}
                    dialogTitle="Share Image"
                    dialogDescription="Generate a new image or reuse an existing one, then insert it into your transcript draft as standard markdown."
                    promptDescription="Generate or reuse an image to share in the live transcript."
                    workflowContextIntro="Markdown image prompt for a campaign session player transcript message. Refine wording while preserving a clear, table-readable illustration."
                    buttonAriaLabel="Insert image into transcript"
                    buttonTitle="Share image"
                    onInsertMarkdownSnippet={(snippet) => {
                      setMessageText((current) =>
                        appendMarkdownSnippet(current, snippet),
                      );
                    }}
                  />
                }
              />
              <div className="flex items-end justify-end gap-2 paper-shadow">
                <Button
                  color="gold"
                  disabled={!canChat || messageText.trim().length === 0}
                  onClick={handleSendMessage}
                >
                  Send
                </Button>
              </div>
              <div className="flex flex-col items-end mt-2 paper-shadow min-h-[2.2em]">
                <Text
                  variant="note"
                  color="steel-dark"
                  className="normal-case tracking-normal"
                >
                  Press Enter to send. Shift+Enter for newline.
                </Text>
              </div>
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  );
};
