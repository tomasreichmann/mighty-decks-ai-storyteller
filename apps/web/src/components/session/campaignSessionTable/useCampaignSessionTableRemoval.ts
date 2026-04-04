import { useCallback, useEffect, useRef, useState } from "react";

const removeFadeDurationMs = 180;

interface UseCampaignSessionTableRemovalOptions {
  activeEntryIds: ReadonlySet<string>;
  onRemoveEntry?: (tableEntryId: string) => void;
}

export const useCampaignSessionTableRemoval = ({
  activeEntryIds,
  onRemoveEntry,
}: UseCampaignSessionTableRemovalOptions) => {
  const [fadingEntryIds, setFadingEntryIds] = useState<Set<string>>(new Set());
  const removalTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    return () => {
      for (const timerId of removalTimersRef.current.values()) {
        window.clearTimeout(timerId);
      }
      removalTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    setFadingEntryIds((current) => {
      let changed = false;
      const next = new Set<string>();

      for (const entryId of current) {
        if (activeEntryIds.has(entryId)) {
          next.add(entryId);
          continue;
        }

        const timerId = removalTimersRef.current.get(entryId);
        if (typeof timerId === "number") {
          window.clearTimeout(timerId);
          removalTimersRef.current.delete(entryId);
        }
        changed = true;
      }

      return changed ? next : current;
    });
  }, [activeEntryIds]);

  const isFadingEntry = useCallback(
    (tableEntryId: string): boolean => fadingEntryIds.has(tableEntryId),
    [fadingEntryIds],
  );

  const requestRemoveEntry = useCallback(
    (tableEntryId: string): void => {
      if (!onRemoveEntry) {
        return;
      }
      if (removalTimersRef.current.has(tableEntryId)) {
        return;
      }

      setFadingEntryIds((current) => {
        if (current.has(tableEntryId)) {
          return current;
        }
        const next = new Set(current);
        next.add(tableEntryId);
        return next;
      });

      const timerId = window.setTimeout(() => {
        removalTimersRef.current.delete(tableEntryId);
        onRemoveEntry(tableEntryId);
      }, removeFadeDurationMs);
      removalTimersRef.current.set(tableEntryId, timerId);
    },
    [onRemoveEntry],
  );

  return {
    isFadingEntry,
    requestRemoveEntry,
  };
};
