import { useCallback, useMemo } from "react";
import type {
  CampaignDetail,
  CampaignSessionDetail,
  CampaignSessionTableEntry,
  CampaignSessionTableTarget,
} from "@mighty-decks/spec/campaign";
import { cn } from "../../utils/cn";
import { Message } from "../common/Message";
import { OutcomePilesRow, emptyOutcomePile } from "./campaignSessionTable/OutcomePilesRow";
import { SessionTableLane } from "./campaignSessionTable/SessionTableLane";
import {
  type SessionViewerRole,
  getLaneVariant,
} from "./campaignSessionTable/utils";
import { useCampaignSessionTableRemoval } from "./campaignSessionTable/useCampaignSessionTableRemoval";
import styles from "./CampaignSessionTable.module.css";

interface CampaignSessionTableProps {
  campaign: CampaignDetail | null;
  session: CampaignSessionDetail | null;
  viewerRole: SessionViewerRole;
  currentParticipantId?: string | null;
  hasStagedCards?: boolean;
  onDrawOutcomeCard?: (participantId: string) => void;
  onShuffleOutcomeDeck?: (participantId: string) => void;
  onPlayOutcomeCards?: (participantId: string, cardIds: string[]) => void;
  onSendCardsToTarget?: (target: CampaignSessionTableTarget) => void;
  onRemoveEntry?: (tableEntryId: string) => void;
  className?: string;
}

export const CampaignSessionTable = ({
  campaign,
  session,
  viewerRole,
  currentParticipantId = null,
  hasStagedCards = false,
  onDrawOutcomeCard,
  onShuffleOutcomeDeck,
  onPlayOutcomeCards,
  onSendCardsToTarget,
  onRemoveEntry,
  className,
}: CampaignSessionTableProps): JSX.Element => {
  const players = useMemo(
    () => (session?.participants ?? []).filter((participant) => participant.role === "player"),
    [session?.participants],
  );

  const outcomePilesByParticipantId = session?.outcomePilesByParticipantId ?? {};

  const actorByFragmentId = useMemo(
    () => new Map((campaign?.actors ?? []).map((actor) => [actor.fragmentId, actor] as const)),
    [campaign?.actors],
  );

  const claimByParticipantId = useMemo(
    () => new Map((session?.claims ?? []).map((claim) => [claim.participantId, claim] as const)),
    [session?.claims],
  );

  const sharedEntries = useMemo(
    () => (session?.table ?? []).filter((entry) => entry.target.scope === "shared"),
    [session?.table],
  );

  const entriesByParticipantId = useMemo(() => {
    const map = new Map<string, CampaignSessionTableEntry[]>();
    for (const entry of session?.table ?? []) {
      if (entry.target.scope !== "participant") {
        continue;
      }

      const current = map.get(entry.target.participantId);
      if (current) {
        current.push(entry);
      } else {
        map.set(entry.target.participantId, [entry]);
      }
    }
    return map;
  }, [session?.table]);

  const activeEntryIds = useMemo(
    () => new Set((session?.table ?? []).map((entry) => entry.tableEntryId)),
    [session?.table],
  );

  const { isFadingEntry, requestRemoveEntry } = useCampaignSessionTableRemoval({
    activeEntryIds,
    onRemoveEntry,
  });

  const canRemoveEntry = useCallback(
    (entry: CampaignSessionTableEntry): boolean => {
      if (!currentParticipantId) {
        return false;
      }
      if (viewerRole === "storyteller") {
        return true;
      }
      return (
        entry.target.scope === "participant" &&
        entry.target.participantId === currentParticipantId
      );
    },
    [currentParticipantId, viewerRole],
  );

  if (!session) {
    return (
      <section
        className={cn(
          styles.tableSurface,
          "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 pb-2 pt-1 sm:px-3",
          className,
        )}
      >
        <Message label="Table" color="cloth">
          Session table will appear once the session state is available.
        </Message>
      </section>
    );
  }

  const showSendButton = Boolean(onSendCardsToTarget) && hasStagedCards;

  return (
    <section
      className={cn(
        styles.tableSurface,
        "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 pb-2 pt-1 sm:px-3",
        className,
      )}
    >
      <div className="stack min-w-0 gap-3 pb-2">
        <SessionTableLane
          campaign={campaign}
          label="Shared"
          variant="cloth"
          entries={sharedEntries}
          canRemoveEntry={canRemoveEntry}
          isFadingEntry={isFadingEntry}
          showSendButton={showSendButton}
          onSend={
            onSendCardsToTarget
              ? () => onSendCardsToTarget({ scope: "shared" })
              : undefined
          }
          onRequestRemoveEntry={requestRemoveEntry}
          headerClassName={styles.sharedLane}
        />

        {players.map((participant, index) => {
          const claim = claimByParticipantId.get(participant.participantId);
          const actor = claim ? actorByFragmentId.get(claim.actorFragmentId) : undefined;
          const laneLabel = actor?.title ?? participant.displayName;
          const isCurrentLane =
            Boolean(currentParticipantId) &&
            participant.participantId === currentParticipantId;
          const outcomePile =
            outcomePilesByParticipantId[participant.participantId] ??
            emptyOutcomePile;

          return (
            <SessionTableLane
              key={participant.participantId}
              campaign={campaign}
              label={laneLabel}
              variant={getLaneVariant(viewerRole, isCurrentLane, index)}
              entries={entriesByParticipantId.get(participant.participantId) ?? []}
              canRemoveEntry={canRemoveEntry}
              isFadingEntry={isFadingEntry}
              showSendButton={showSendButton}
              onSend={
                onSendCardsToTarget
                  ? () =>
                      onSendCardsToTarget({
                        scope: "participant",
                        participantId: participant.participantId,
                      })
                  : undefined
              }
              onRequestRemoveEntry={requestRemoveEntry}
              topContent={
                <OutcomePilesRow
                  participantId={participant.participantId}
                  pile={outcomePile}
                  isCurrentLane={viewerRole === "player" && isCurrentLane}
                  onDrawOutcomeCard={onDrawOutcomeCard}
                  onShuffleOutcomeDeck={onShuffleOutcomeDeck}
                  onPlayOutcomeCards={onPlayOutcomeCards}
                />
              }
              className={isCurrentLane ? styles.currentLane : undefined}
            />
          );
        })}
      </div>
    </section>
  );
};
