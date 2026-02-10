import { useEffect, useMemo, useRef } from "react";
import type {
  ScenePublic,
  TranscriptEntry,
} from "@mighty-decks/spec/adventureState";
import { Section } from "./common/Section";
import { NarratedSceneCard } from "./NarratedSceneCard";
import { TranscriptItem } from "./TranscriptItem";
import { cn } from "../utils/cn";

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
      <div className={cn(scrollable && "min-h-0 flex-1 overflow-y-auto")}>
        <div className="grid min-w-0 gap-2">
          {maxEntries.length === 0 && !scene && !pendingLabel ? (
            <p className="text-sm text-slate-600">No entries yet.</p>
          ) : null}
          {maxEntries.map((entry, index) => (
            <div key={entry.entryId} className="grid gap-2">
              <TranscriptItem entry={entry} />
              {scene && index === sceneAnchorIndex ? (
                <NarratedSceneCard
                  key={`scene-${scene.sceneId}-after-${entry.entryId}`}
                  scene={scene}
                />
              ) : null}
            </div>
          ))}
          {scene && sceneAnchorIndex < 0 ? <NarratedSceneCard scene={scene} /> : null}
          {pendingLabel ? (
            <article className="min-w-0 max-w-full rounded-md border border-dashed border-slate-300 bg-slate-100 px-3 py-2">
              <p className="min-w-0 whitespace-pre-wrap text-sm italic leading-relaxed text-slate-700">
                <span className="mr-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                  Status
                </span>
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-accent align-middle" />
                {pendingLabel}
              </p>
            </article>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>
    </Section>
  );
};

