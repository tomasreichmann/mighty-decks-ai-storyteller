import type {
  CampaignDetail,
  CampaignSessionTableEntry,
} from "@mighty-decks/spec/campaign";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { CardBoundary } from "../../common/CardBoundary";
import styles from "../CampaignSessionTable.module.css";
import { resolveReference } from "./resolveReference";
import {
  canStackReference,
  groupAdjacentEntries,
  isSceneReference,
} from "./utils";

const compactCardSlotClassName = "w-[6.5rem] max-w-[6.5rem]";
const compactSceneCardSlotClassName = "w-[10.375rem] max-w-[10.375rem]";
const fullCardHeightRem = 10.6;
const stackPeekStepRem = 0.9;

const renderRemoveButton = (
  title: string,
  onRemove: () => void,
  topOffsetRem = 0,
): JSX.Element => (
  <div
    className="absolute left-0.5 z-20"
    style={{
      top: `${topOffsetRem}rem`,
    }}
  >
    <Button
      type="button"
      variant="circle"
      color="curse"
      size="sm"
      aria-label={`Remove ${title}`}
      title={`Remove ${title}`}
      onClick={onRemove}
      className="!h-5 !w-5 !border-x-[2px] !border-y-[2px] !shadow-none hover:!shadow-none active:!shadow-none disabled:!shadow-none text-[0.7rem]"
    >
      X
    </Button>
  </div>
);

interface CardSlotProps {
  campaign: CampaignDetail | null;
  entry: CampaignSessionTableEntry;
  canRemove: boolean;
  isFading: boolean;
  onRequestRemoveEntry?: (tableEntryId: string) => void;
}

const CardSlot = ({
  campaign,
  entry,
  canRemove,
  isFading,
  onRequestRemoveEntry,
}: CardSlotProps): JSX.Element => {
  const rendered = resolveReference(entry.card, campaign);
  const slotWidthClassName = isSceneReference(entry.card)
    ? compactSceneCardSlotClassName
    : compactCardSlotClassName;

  return (
    <div
      className={cn(
        styles.tableCardShell,
        "relative flex min-w-0 shrink-0 pt-3",
        slotWidthClassName,
        isFading && styles.tableCardFading,
      )}
    >
      {canRemove && onRequestRemoveEntry
        ? renderRemoveButton(
            rendered.title,
            () => onRequestRemoveEntry(entry.tableEntryId),
          )
        : null}
      <CardBoundary
        resetKey={entry.tableEntryId}
        label="Card failed to render"
        message="This table card could not render."
        className={slotWidthClassName}
      >
        {rendered.node}
      </CardBoundary>
    </div>
  );
};

interface StackedCardSlotProps {
  campaign: CampaignDetail | null;
  entries: readonly CampaignSessionTableEntry[];
  canRemove: boolean;
  isFading: boolean;
  onRequestRemoveEntry?: (tableEntryId: string) => void;
}

const StackedCardSlot = ({
  campaign,
  entries,
  canRemove,
  isFading,
  onRequestRemoveEntry,
}: StackedCardSlotProps): JSX.Element => {
  const visibleEntries = entries.slice(-5);
  const topEntry = visibleEntries.at(-1);
  if (!topEntry) {
    return <></>;
  }

  const peekEntries = visibleEntries.slice(0, -1);
  const renderedTop = resolveReference(topEntry.card, campaign);

  return (
    <div
      className={cn(
        styles.tableCardShell,
        "relative flex w-[6.5rem] min-w-0 max-w-[6.5rem] shrink-0",
        isFading && styles.tableCardFading,
      )}
      style={{
        height: `${fullCardHeightRem + peekEntries.length * stackPeekStepRem}rem`,
      }}
    >
      {canRemove && onRequestRemoveEntry
        ? renderRemoveButton(
            renderedTop.title,
            () => onRequestRemoveEntry(topEntry.tableEntryId),
            peekEntries.length * stackPeekStepRem,
          )
        : null}
      <div
        className="relative w-full"
        style={{
          height: `${fullCardHeightRem + peekEntries.length * stackPeekStepRem}rem`,
        }}
      >
        <div
          className={cn(styles.stackTopCard, "z-10")}
          style={{
            top: `${peekEntries.length * stackPeekStepRem}rem`,
          }}
        >
          <CardBoundary
            resetKey={topEntry.tableEntryId}
            label="Card failed to render"
            message="This table card could not render."
            className={compactCardSlotClassName}
          >
            {renderedTop.node}
          </CardBoundary>
        </div>
        {peekEntries.map((entry, index) => {
          const rendered = resolveReference(entry.card, campaign);
          return (
            <div
              key={entry.tableEntryId}
              className={styles.stackPeek}
              style={{
                top: `${index * stackPeekStepRem}rem`,
              }}
            >
              <div className={styles.stackPeekViewport}>
                <CardBoundary
                  resetKey={entry.tableEntryId}
                  label="Card failed to render"
                  message="This table card could not render."
                  className={compactCardSlotClassName}
                >
                  {rendered.node}
                </CardBoundary>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface LaneCardsProps {
  campaign: CampaignDetail | null;
  entries: readonly CampaignSessionTableEntry[];
  canRemoveEntry: (entry: CampaignSessionTableEntry) => boolean;
  isFadingEntry: (tableEntryId: string) => boolean;
  onRequestRemoveEntry?: (tableEntryId: string) => void;
}

export const LaneCards = ({
  campaign,
  entries,
  canRemoveEntry,
  isFadingEntry,
  onRequestRemoveEntry,
}: LaneCardsProps): JSX.Element => {
  const grouped = groupAdjacentEntries(entries);

  return (
    <div className="flex min-w-0 flex-wrap content-start items-start gap-2">
      {grouped.map((group) => {
        if (group.entries.length > 1 && canStackReference(group.entries[0].card)) {
          const topEntry = group.entries.at(-1);
          return (
            <StackedCardSlot
              key={topEntry?.tableEntryId ?? group.key}
              campaign={campaign}
              entries={group.entries}
              canRemove={Boolean(topEntry && canRemoveEntry(topEntry))}
              isFading={Boolean(topEntry && isFadingEntry(topEntry.tableEntryId))}
              onRequestRemoveEntry={onRequestRemoveEntry}
            />
          );
        }

        return group.entries.map((entry) => (
          <CardSlot
            key={entry.tableEntryId}
            campaign={campaign}
            entry={entry}
            canRemove={canRemoveEntry(entry)}
            isFading={isFadingEntry(entry.tableEntryId)}
            onRequestRemoveEntry={onRequestRemoveEntry}
          />
        ));
      })}
    </div>
  );
};
