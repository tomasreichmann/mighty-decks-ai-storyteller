import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdventureModuleResolvedCounter } from "@mighty-decks/spec/adventureModuleAuthoring";
import type { CounterAdjustTarget } from "../../lib/gameCardCatalogContext";
import { Button } from "../common/Button";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextField } from "../common/TextField";
import { CounterCard } from "../cards/CounterCard";

interface AdventureModuleCountersTabPanelProps {
  counters: AdventureModuleResolvedCounter[];
  editable: boolean;
  creating?: boolean;
  createError?: string | null;
  onCreate: () => void;
  onOpenCounter: (counterSlug: string) => void;
  onDeleteCounter?: (counterSlug: string, title: string) => void;
  onAdjustCounterValue?: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => void;
}

const copyToClipboard = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) {
    throw new Error("Clipboard copy failed.");
  }
};

export const AdventureModuleCountersTabPanel = ({
  counters,
  editable,
  creating = false,
  createError,
  onCreate,
  onOpenCounter,
  onDeleteCounter,
  onAdjustCounterValue,
}: AdventureModuleCountersTabPanelProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCounterSlug, setCopiedCounterSlug] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const filteredCounters = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (!normalizedSearch) {
      return counters;
    }
    return counters.filter((counter) => {
      const haystack =
        `${counter.title} ${counter.description} ${counter.slug}`.toLocaleLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [counters, searchTerm]);

  useEffect(() => {
    if (!copiedCounterSlug) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCopiedCounterSlug(null);
    }, 1600);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copiedCounterSlug]);

  const handleCopyShortcode = useCallback(async (counterSlug: string) => {
    try {
      await copyToClipboard(`@counter/${counterSlug}`);
      setCopiedCounterSlug(counterSlug);
      setCopyError(null);
    } catch {
      setCopyError(`Could not copy @counter/${counterSlug}.`);
    }
  }, []);

  return (
    <div className="stack gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="stack gap-1">
          <Text variant="body" color="iron-light" className="text-sm">
            Click a CounterCard to edit it. Plus and minus update shared current and max values everywhere in authoring.
          </Text>
        </div>
        <Button
          color="gold"
          onClick={onCreate}
          disabled={!editable || creating}
        >
          {creating ? "Creating..." : "Create Counter"}
        </Button>
      </div>

      <TextField
        label="Search Counters"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search counters by title, description, or slug..."
      />

      {createError ? (
        <Message label="Create failed" color="blood">
          {createError}
        </Message>
      ) : null}
      {copyError ? (
        <Message label="Copy failed" color="blood">
          {copyError}
        </Message>
      ) : null}

      {filteredCounters.length === 0 ? (
        <Panel>
          <Text variant="body" color="iron-light">
            {counters.length === 0
              ? "No counters have been created yet."
              : "No counters match your search."}
          </Text>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCounters.map((counter) => (
            <Panel
              key={counter.slug}
              className="h-full"
              contentClassName="stack h-full gap-3"
            >
              <button
                type="button"
                className="stack h-full gap-3 text-left"
                onClick={() => onOpenCounter(counter.slug)}
              >
                <CounterCard
                  className="mx-auto w-full max-w-[13rem] transition-transform duration-100 hover:-translate-y-0.5"
                  iconSlug={counter.iconSlug}
                  title={counter.title}
                  currentValue={counter.currentValue}
                  maxValue={counter.maxValue}
                  description={counter.description}
                  onDecrement={
                    onAdjustCounterValue
                      ? () => onAdjustCounterValue(counter.slug, -1)
                      : undefined
                  }
                  onIncrement={
                    onAdjustCounterValue
                      ? () => onAdjustCounterValue(counter.slug, 1)
                      : undefined
                  }
                  onDecrementMaxValue={
                    onAdjustCounterValue && typeof counter.maxValue === "number"
                      ? () => onAdjustCounterValue(counter.slug, -1, "max")
                      : undefined
                  }
                  onIncrementMaxValue={
                    onAdjustCounterValue && typeof counter.maxValue === "number"
                      ? () => onAdjustCounterValue(counter.slug, 1, "max")
                      : undefined
                  }
                />
                <div className="stack gap-1">
                  <Text variant="emphasised" color="iron">
                    {counter.title}
                  </Text>
                  <Text variant="body" color="iron-light" className="text-sm">
                    {counter.description?.trim().length
                      ? counter.description
                      : "No description yet."}
                  </Text>
                  <Text variant="note" color="steel-dark">
                    {`@counter/${counter.slug}`}
                  </Text>
                </div>
              </button>
              <div className="mt-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    color="cloth"
                    size="sm"
                    onClick={() => {
                      void handleCopyShortcode(counter.slug);
                    }}
                  >
                    Copy Shortcode
                  </Button>
                  {onDeleteCounter ? (
                    <Button
                      variant="circle"
                      color="blood"
                      size="sm"
                      aria-label={`Delete ${counter.title}`}
                      title={`Delete ${counter.title}`}
                      disabled={!editable}
                      onClick={() => {
                        onDeleteCounter(counter.slug, counter.title);
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 fill-none stroke-current"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M6 6l1 14h10l1-14" />
                        <path d="M10 10v7" />
                        <path d="M14 10v7" />
                      </svg>
                    </Button>
                  ) : null}
                </div>
                <Text
                  variant="note"
                  color="monster"
                  className={copiedCounterSlug === counter.slug ? "opacity-100" : "opacity-0"}
                >
                  Copied
                </Text>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};
