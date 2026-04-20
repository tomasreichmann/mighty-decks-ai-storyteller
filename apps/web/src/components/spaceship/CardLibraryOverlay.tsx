import { GameCardView } from "../adventure-module/GameCardView";
import { resolveGameCard } from "../../lib/markdownGameComponents";
import type { CardLibraryEntry } from "../../lib/spaceship/spaceshipTypes";
import { cn } from "../../utils/cn";
import { Button } from "../common/Button";
import { Label } from "../common/Label";
import { Overlay } from "../common/Overlay";
import { Text } from "../common/Text";
import { LocationCard } from "../styleguide/LocationCard";

interface CardLibraryOverlayProps {
  open: boolean;
  entries: CardLibraryEntry[];
  selectedEntryIds: string[];
  onClose: () => void;
  onToggleEntry: (entryId: string) => void;
}

const FallbackEntryPreview = ({
  entry,
}: {
  entry: CardLibraryEntry;
}): JSX.Element => {
  return (
    <div className="flex w-[20.5rem] flex-col rounded-[1rem] border-[3px] border-kac-iron bg-[linear-gradient(180deg,rgba(255,253,245,0.98)_0%,rgba(244,233,213,0.98)_100%)] p-4 shadow-[4px_4px_0_0_#121b23]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-lg font-bold uppercase leading-none text-kac-iron">
            {entry.title}
          </p>
          <p className="mt-2 font-ui text-[0.7rem] font-bold uppercase tracking-[0.08em] text-kac-cloth-dark">
            {entry.category}
          </p>
        </div>
        <span className="rounded-full border-2 border-kac-iron bg-kac-skin px-2 py-1 font-ui text-[0.66rem] font-bold uppercase tracking-[0.08em] text-kac-iron shadow-[2px_2px_0_0_#121b23]">
          {entry.badge}
        </span>
      </div>
      <Text variant="body" color="iron-light" className="mt-3 text-sm">
        {entry.summary}
      </Text>
    </div>
  );
};

const renderEntryPreview = (entry: CardLibraryEntry): JSX.Element => {
  switch (entry.type) {
    case "location":
      return (
        <LocationCard
          imageUrl={entry.imageUrl ?? "/sample-scene-image.png"}
          imageAlt={entry.title}
          title={entry.title}
          description={entry.summary}
        />
      );
    case "effect": {
      const resolvedEffectCard = resolveGameCard(
        "EffectCard",
        entry.effectSlug ?? entry.title.toLowerCase(),
      );
      if (resolvedEffectCard) {
        return <GameCardView gameCard={resolvedEffectCard} />;
      }
      return <FallbackEntryPreview entry={entry} />;
    }
    default:
      return <FallbackEntryPreview entry={entry} />;
  }
};

export const CardLibraryOverlay = ({
  open,
  entries,
  selectedEntryIds,
  onClose,
  onToggleEntry,
}: CardLibraryOverlayProps): JSX.Element | null => {
  return (
    <Overlay
      open={open}
      ariaLabel="Card library"
      onClose={onClose}
      tone="bone"
      panelClassName="max-w-6xl"
      contentClassName="stack gap-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="stack gap-2">
          <Label size="lg">Card Library</Label>
          <Text variant="body" color="iron-light" className="max-w-2xl text-sm">
            Pick future insertions for the ship board. Milestone 1 only stages
            a selection so the layout and library affordances can be tested.
          </Text>
        </div>
        <Button variant="solid" color="blood" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid gap-5 overflow-x-auto pb-3 justify-items-start md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => {
          const selected = selectedEntryIds.includes(entry.entryId);
          return (
            <button
              key={entry.entryId}
              type="button"
              data-card-library-entry
              aria-pressed={selected}
              onClick={() => onToggleEntry(entry.entryId)}
              className={cn(
                "group inline-flex flex-col items-start gap-3 rounded-[1rem] border-[3px] border-transparent p-1 text-left transition duration-100 hover:-translate-y-[1px]",
                selected
                  ? "outline outline-4 outline-offset-4 outline-kac-gold-dark"
                  : "",
              )}
            >
              {renderEntryPreview(entry)}

              <div className="flex items-center gap-2">
                <span className="rounded-full border-2 border-kac-iron bg-kac-skin px-2 py-1 font-ui text-[0.66rem] font-bold uppercase tracking-[0.08em] text-kac-iron shadow-[2px_2px_0_0_#121b23]">
                  {entry.badge}
                </span>
                <Text variant="note" color="iron-light" className="text-xs !opacity-100">
                  {entry.category}
                </Text>
              </div>

              {entry.type === "token" || entry.type === "actor" ? (
                <Text variant="body" color="iron-light" className="max-w-[20rem] text-sm">
                  {entry.summary}
                </Text>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-kac-iron/15 pt-3">
        <div className="stack gap-1">
          <Text
            data-selection-count
            variant="emphasised"
            color="iron"
            className="text-sm"
          >
            {selectedEntryIds.length} selected
          </Text>
          <Text variant="note" color="iron-light" className="text-xs !opacity-100">
            Insert is intentionally disabled until drag/drop scene mutation lands.
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" color="cloth" onClick={onClose}>
            Keep Mockup
          </Button>
          <Button data-insert-button color="gold" disabled>
            Insert
          </Button>
        </div>
      </div>
    </Overlay>
  );
};
