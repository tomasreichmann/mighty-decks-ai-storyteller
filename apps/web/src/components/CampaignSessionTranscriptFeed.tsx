import { useEffect, useMemo, useRef } from "react";
import type {
  CampaignSessionParticipant,
  CampaignSessionTranscriptEntry,
} from "@mighty-decks/spec/campaign";
import { CampaignSessionMessageContent } from "./CampaignSessionMessageContent";
import { Message } from "./common/Message";
import { Section } from "./common/Section";
import { Text } from "./common/Text";
import {
  GameCardCatalogContext,
  type GameCardCatalogContextValue,
} from "../lib/gameCardCatalogContext";
import { presentCampaignSessionTranscriptEntry } from "../lib/campaignSessionTranscriptPresentation";
import { cn } from "../utils/cn";
import styles from "./TranscriptFeed.module.css";

interface CampaignSessionTranscriptFeedProps {
  entries: readonly CampaignSessionTranscriptEntry[];
  participants?: readonly CampaignSessionParticipant[];
  currentParticipantId?: string;
  gameCardCatalogValue: GameCardCatalogContextValue;
  className?: string;
  emptyLabel?: string;
}

export const CampaignSessionTranscriptFeed = ({
  entries,
  participants = [],
  currentParticipantId,
  gameCardCatalogValue,
  className = "",
  emptyLabel = "No transcript entries yet.",
}: CampaignSessionTranscriptFeedProps): JSX.Element => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const transcriptTailSignature = useMemo(() => {
    const lastEntry = entries[entries.length - 1];
    if (!lastEntry) {
      return "empty";
    }

    return `${lastEntry.entryId}:${lastEntry.text.length}:${lastEntry.createdAtIso}`;
  }, [entries]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        return;
      }

      endRef.current?.scrollIntoView({
        behavior: "auto",
        block: "end",
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [transcriptTailSignature]);

  return (
    <Section className={cn("flex min-h-0 flex-col", className)}>
      <div
        ref={scrollContainerRef}
        className={cn(
          styles.scrollMask,
          "min-h-0 flex-1 overflow-y-auto p-2 -m-2",
        )}
      >
        <GameCardCatalogContext.Provider value={gameCardCatalogValue}>
          <div className="flex min-w-0 flex-col gap-4">
            {entries.length === 0 ? (
              <Text variant="body" color="steel-dark" className="text-sm">
                {emptyLabel}
              </Text>
            ) : null}
            {entries.map((entry) => {
              const presentation = presentCampaignSessionTranscriptEntry({
                entry,
                participants,
                currentParticipantId,
              });

              return (
                <Message
                  key={entry.entryId}
                  label={presentation.label}
                  color={presentation.color}
                  className={cn(
                    "min-w-0 max-w-full",
                    presentation.align === "end" ? "self-end" : "self-start",
                  )}
                  contentClassName="min-w-0"
                    >
                      <div className="text-sm text-kac-iron">
                        <CampaignSessionMessageContent
                          text={presentation.text}
                          claimedActorTitle={presentation.claimedActorTitle}
                        />
                      </div>
                    </Message>
                  );
                })}
            <div ref={endRef} />
          </div>
        </GameCardCatalogContext.Provider>
      </div>
    </Section>
  );
};
