import { useMemo, useState } from "react";
import type { AdventureModuleResolvedCounter } from "@mighty-decks/spec/adventureModuleAuthoring";
import type { CounterAdjustTarget } from "../../lib/gameCardCatalogContext";
import { Button } from "../common/Button";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { PendingIndicator } from "../PendingIndicator";
import { ResponsiveCardGrid } from "../common/ResponsiveCardGrid";
import { SearchField } from "../common/SearchField";
import { Text } from "../common/Text";
import { CounterCard } from "../cards/CounterCard";
import { ShortcodeField } from "./ShortcodeField";

interface AdventureModuleCountersTabPanelProps {
  counters: AdventureModuleResolvedCounter[];
  editable: boolean;
  creating?: boolean;
  createError?: string | null;
  onCreate: () => void;
  onOpenCounter: (counterSlug: string) => void;
  onDeleteCounter?: (counterSlug: string, title: string) => void;
  onAddCounterCardToSelection?: (counterSlug: string) => void;
  onAdjustCounterValue?: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => void;
}

export const AdventureModuleCountersTabPanel = ({
  counters,
  editable,
  creating = false,
  createError,
  onCreate,
  onOpenCounter,
  onDeleteCounter,
  onAddCounterCardToSelection,
  onAdjustCounterValue,
}: AdventureModuleCountersTabPanelProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div className="stack gap-4">
      <div className="flex flex-wrap justify-end gap-3">
        <Button
          color="gold"
          onClick={onCreate}
          disabled={!editable || creating}
        >
          {creating ? (
            <PendingIndicator label="Creating counter" color="gold" />
          ) : (
            "Create Counter"
          )}
        </Button>
      </div>

      <SearchField
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

      {filteredCounters.length === 0 ? (
        <Message
          label={counters.length === 0 ? "Counters" : "No results"}
          color="bone"
        >
          {counters.length === 0
            ? "No counters have been created yet."
            : "No counters match your search."}
        </Message>
      ) : (
        <ResponsiveCardGrid>
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
                </div>
              </button>
              <div className="mt-auto flex items-center justify-between gap-3">
                <ShortcodeField
                  shortcode={`@counter/${counter.slug}`}
                  onAddToSelection={
                    onAddCounterCardToSelection
                      ? () => onAddCounterCardToSelection(counter.slug)
                      : undefined
                  }
                />
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
            </Panel>
          ))}
        </ResponsiveCardGrid>
      )}
    </div>
  );
};
