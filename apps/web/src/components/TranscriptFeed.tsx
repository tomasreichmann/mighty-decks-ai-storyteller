import { Fragment, useEffect, useMemo, useRef } from "react";
import type {
  AdventureState,
  ScenePublic,
  TranscriptEntry,
} from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { NarratedSceneCard } from "./NarratedSceneCard";
import { TranscriptItem } from "./TranscriptItem";
import { cn } from "../utils/cn";
import { Message } from "./common/Message";
import { Text } from "./common/Text";
import { PendingIndicator } from "./PendingIndicator";

interface TranscriptFeedProps {
  entries: TranscriptEntry[];
  condensed?: boolean;
  scene?: ScenePublic;
  characterPortraitsByName?: AdventureState["characterPortraitsByName"];
  scrollable?: boolean;
  autoScrollToBottom?: boolean;
  pendingLabel?: string;
  className?: string;
}

const STREAMING_STORYTELLER_ENTRY_ID = "streaming-storyteller";
const HIDDEN_PENDING_LABELS = new Set([
  "storyteller is thinking...",
  "assessing stakes...",
]);

const shouldAnchorSceneCardAfterEntry = (entry: TranscriptEntry): boolean =>
  entry.kind === "system" &&
  (entry.text.startsWith("Adventure selected:") ||
    entry.text.startsWith("Transition vote selected: Next Scene."));

const findSceneAnchorIndex = (entries: TranscriptEntry[]): number => {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (shouldAnchorSceneCardAfterEntry(entries[index])) {
      return index;
    }
  }

  return -1;
};

const shouldAnchorSceneClosingCardAfterEntry = (
  entry: TranscriptEntry,
): boolean => entry.kind === "system" && entry.text.startsWith("Scene ended.");

const findSceneClosingAnchorIndex = (entries: TranscriptEntry[]): number => {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (shouldAnchorSceneClosingCardAfterEntry(entries[index])) {
      return index;
    }
  }

  return -1;
};

const formatSceneClosedSummary = (summary: string | undefined): string => {
  const normalized = summary?.replace(/\s+/g, " ").trim() ?? "";
  if (normalized.length === 0) {
    return "The immediate scene objective is resolved.";
  }

  const firstSentenceMatch = normalized.match(/[^.!?]+[.!?]/);
  const firstSentence = (firstSentenceMatch?.[0] ?? normalized).trim();
  const maxLength = 200;
  if (firstSentence.length <= maxLength) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, maxLength - 3).trimEnd()}...`;
};

const normalizeCharacterNameKey = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export const TranscriptFeed = ({
  entries,
  condensed = false,
  scene,
  characterPortraitsByName,
  scrollable = false,
  autoScrollToBottom = false,
  pendingLabel,
  className = "",
}: TranscriptFeedProps): JSX.Element => {
  const maxEntries = condensed ? entries.slice(-5) : entries;
  const hasStreamingStorytellerEntry = maxEntries.some(
    (entry) => entry.entryId === STREAMING_STORYTELLER_ENTRY_ID,
  );
  const resolvedPendingLabel = useMemo(() => {
    const normalizedLabel = pendingLabel?.trim() ?? "";
    if (normalizedLabel.length === 0) {
      return undefined;
    }

    if (hasStreamingStorytellerEntry) {
      return undefined;
    }

    const normalizedKey = normalizedLabel.toLowerCase();
    if (HIDDEN_PENDING_LABELS.has(normalizedKey)) {
      return undefined;
    }

    return normalizedLabel;
  }, [hasStreamingStorytellerEntry, pendingLabel]);
  const hasClosingSceneCard = Boolean(
    scene &&
    ((scene.closingProse && scene.closingProse.trim().length > 0) ||
      scene.closingImagePending ||
      scene.closingImageUrl),
  );
  const hasSceneClosedSummary = Boolean(
    scene &&
      !hasClosingSceneCard &&
      scene.summary &&
      scene.summary.trim().length > 0,
  );
  const sceneClosedSummary = useMemo(
    () => formatSceneClosedSummary(scene?.summary),
    [scene?.summary],
  );
  const sceneAnchorIndex = useMemo(
    () => (scene ? findSceneAnchorIndex(maxEntries) : -1),
    [scene, maxEntries],
  );
  const sceneClosingAnchorIndex = useMemo(
    () =>
      scene && (hasClosingSceneCard || hasSceneClosedSummary)
        ? findSceneClosingAnchorIndex(maxEntries)
        : -1,
    [hasClosingSceneCard, hasSceneClosedSummary, maxEntries, scene],
  );
  const transcriptTailSignature = useMemo(() => {
    const lastEntry = maxEntries[maxEntries.length - 1];
    if (!lastEntry) {
      return "empty";
    }

    return `${lastEntry.entryId}:${lastEntry.text.length}:${lastEntry.createdAtIso}`;
  }, [maxEntries]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoScrollToBottom) {
      return;
    }

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
  }, [
    autoScrollToBottom,
    transcriptTailSignature,
    scene?.sceneId,
    scene?.imageUrl,
    scene?.imagePending,
    scene?.closingImageUrl,
    scene?.closingImagePending,
    scene?.closingProse,
    scene?.summary,
    resolvedPendingLabel,
  ]);

  return (
    <Section className={cn(scrollable ? "flex flex-col" : "stack", className)}>
      <div
        ref={scrollContainerRef}
        className={cn(
          scrollable &&
            "transcript-scroll-mask flex-1 overflow-y-auto p-2 -m-2",
        )}
      >
        <div className="flex flex-col min-w-0 gap-4">
          {maxEntries.length === 0 && !scene && !resolvedPendingLabel ? (
            <Text variant="body" color="steel-dark" className="text-sm">
              No entries yet.
            </Text>
          ) : null}
          {maxEntries.map((entry, index) => (
            <Fragment key={entry.entryId}>
              <TranscriptItem
                entry={entry}
                playerImageUrl={
                  entry.kind === "player"
                    ? characterPortraitsByName?.[
                        normalizeCharacterNameKey(entry.author)
                      ]?.imageUrl
                    : undefined
                }
              />
              {scene && index === sceneAnchorIndex ? (
                <NarratedSceneCard
                  key={`scene-${scene.sceneId}-intro-after-${entry.entryId}`}
                  scene={scene}
                />
              ) : null}
              {scene &&
              hasClosingSceneCard &&
              index === sceneClosingAnchorIndex ? (
                <NarratedSceneCard
                  key={`scene-${scene.sceneId}-closing-after-${entry.entryId}`}
                  scene={scene}
                  variant="closing"
                />
              ) : null}
              {scene &&
              hasSceneClosedSummary &&
              index === sceneClosingAnchorIndex ? (
                <Message
                  key={`scene-${scene.sceneId}-closed-after-${entry.entryId}`}
                  label="Scene Closed"
                  color="monster"
                  className="min-w-0 max-w-full"
                >
                  <Text variant="body" color="iron-light" className="text-sm">
                    {sceneClosedSummary}
                  </Text>
                </Message>
              ) : null}
            </Fragment>
          ))}
          {scene && sceneAnchorIndex < 0 ? (
            <NarratedSceneCard scene={scene} />
          ) : null}
          {scene && hasClosingSceneCard && sceneClosingAnchorIndex < 0 ? (
            <NarratedSceneCard scene={scene} variant="closing" />
          ) : null}
          {scene && hasSceneClosedSummary && sceneClosingAnchorIndex < 0 ? (
            <Message
              label="Scene Closed"
              color="monster"
              className="min-w-0 max-w-full"
            >
              <Text variant="body" color="iron-light" className="text-sm">
                {sceneClosedSummary}
              </Text>
            </Message>
          ) : null}
          {resolvedPendingLabel ? (
            <Message
              label="Status"
              color="gold"
              className="min-w-0 max-w-full"
              contentClassName="text-sm text-kac-iron-light"
            >
              <PendingIndicator
                label={resolvedPendingLabel}
                color="gold"
                indicatorClassName="scale-[0.88]"
              />
            </Message>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>
    </Section>
  );
};
