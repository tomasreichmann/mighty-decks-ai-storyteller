import { useEffect, useMemo, useRef } from "react";
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
  const sceneAnchorIndex = useMemo(
    () => (scene ? findSceneAnchorIndex(maxEntries) : -1),
    [scene, maxEntries],
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
    scene?.summary,
    pendingLabel,
  ]);

  return (
    <Section
      className={cn(
        "min-w-0",
        scrollable ? "flex h-full min-h-0 flex-col" : "stack",
        className,
      )}
    >
      <div
        className={cn(
          scrollable && "transcript-scroll-mask min-h-0 flex-1 overflow-y-auto p-2 -m-2",
        )}
      >
        <div className="flex flex-col min-w-0 gap-4">
          {maxEntries.length === 0 && !scene && !pendingLabel ? (
            <Text variant="body" color="steel-dark" className="text-sm">
              No entries yet.
            </Text>
          ) : null}
          {maxEntries.map((entry, index) => (
            <>
              <TranscriptItem entry={entry} />
              {scene && index === sceneAnchorIndex ? (
                <NarratedSceneCard
                  key={`scene-${scene.sceneId}-after-${entry.entryId}`}
                  scene={scene}
                />
              ) : null}
            </>
          ))}
          {scene && sceneAnchorIndex < 0 ? (
            <NarratedSceneCard scene={scene} />
          ) : null}
          {pendingLabel ? (
            <Message
              label="Status"
              color="gold"
              className="min-w-0 max-w-full"
              contentClassName="text-sm italic text-kac-iron-light"
            >
              <span className="mr-2 inline-block h-2.5 w-2.5 animate-pulse bg-kac-blood align-middle shadow-[1px_1px_0_0_#121b23]" />
              {pendingLabel}
            </Message>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>
    </Section>
  );
};
