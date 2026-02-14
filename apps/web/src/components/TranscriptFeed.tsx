import { Fragment, useEffect, useMemo, useRef } from "react";
import type {
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
  scrollable?: boolean;
  autoScrollToBottom?: boolean;
  pendingLabel?: string;
  className?: string;
}

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

export const TranscriptFeed = ({
  entries,
  condensed = false,
  scene,
  scrollable = false,
  autoScrollToBottom = false,
  pendingLabel,
  className = "",
}: TranscriptFeedProps): JSX.Element => {
  const maxEntries = condensed ? entries.slice(-5) : entries;
  const hasClosingSceneCard = Boolean(
    scene &&
    ((scene.closingProse && scene.closingProse.trim().length > 0) ||
      (scene.summary && scene.summary.trim().length > 0) ||
      scene.closingImagePending ||
      scene.closingImageUrl),
  );
  const sceneAnchorIndex = useMemo(
    () => (scene ? findSceneAnchorIndex(maxEntries) : -1),
    [scene, maxEntries],
  );
  const sceneClosingAnchorIndex = useMemo(
    () => (hasClosingSceneCard ? findSceneClosingAnchorIndex(maxEntries) : -1),
    [hasClosingSceneCard, maxEntries],
  );
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoScrollToBottom) {
      return;
    }

    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [
    autoScrollToBottom,
    maxEntries.length,
    scene?.sceneId,
    scene?.imageUrl,
    scene?.imagePending,
    scene?.closingImageUrl,
    scene?.closingImagePending,
    scene?.closingProse,
    scene?.summary,
    pendingLabel,
  ]);

  return (
    <Section className={cn(scrollable ? "flex flex-col" : "stack", className)}>
      <div
        className={cn(
          scrollable &&
            "transcript-scroll-mask flex-1 overflow-y-auto p-2 -m-2",
        )}
      >
        <div className="flex flex-col min-w-0 gap-4">
          {maxEntries.length === 0 && !scene && !pendingLabel ? (
            <Text variant="body" color="steel-dark" className="text-sm">
              No entries yet.
            </Text>
          ) : null}
          {maxEntries.map((entry, index) => (
            <Fragment key={entry.entryId}>
              <TranscriptItem entry={entry} />
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
            </Fragment>
          ))}
          {scene && sceneAnchorIndex < 0 ? (
            <NarratedSceneCard scene={scene} />
          ) : null}
          {scene && hasClosingSceneCard && sceneClosingAnchorIndex < 0 ? (
            <NarratedSceneCard scene={scene} variant="closing" />
          ) : null}
          {pendingLabel ? (
            <Message
              label="Status"
              color="gold"
              className="min-w-0 max-w-full"
              contentClassName="text-sm text-kac-iron-light"
            >
              <PendingIndicator
                label={pendingLabel}
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
