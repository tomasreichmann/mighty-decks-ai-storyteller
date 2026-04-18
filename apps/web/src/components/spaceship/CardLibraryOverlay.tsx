import type { CardLibraryEntry } from "../../lib/spaceship/spaceshipTypes";
import { Button } from "../common/Button";
import { Label } from "../common/Label";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { cn } from "../../utils/cn";

interface CardLibraryOverlayProps {
  open: boolean;
  entries: CardLibraryEntry[];
  selectedEntryIds: string[];
  onClose: () => void;
  onToggleEntry: (entryId: string) => void;
}

export const CardLibraryOverlay = ({
  open,
  entries,
  selectedEntryIds,
  onClose,
  onToggleEntry,
}: CardLibraryOverlayProps): JSX.Element | null => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-kac-iron/70 bg-[radial-gradient(circle_at_top,rgba(255,210,59,0.18),transparent_45%),repeating-linear-gradient(45deg,rgba(0,0,0,0.12)_0px,rgba(0,0,0,0.12)_12px,transparent_12px,transparent_24px)] p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <Panel
        data-card-library-overlay
        className="w-full max-w-5xl"
        contentClassName="stack gap-4"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Card library"
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => {
            const selected = selectedEntryIds.includes(entry.entryId);
            return (
              <button
                key={entry.entryId}
                type="button"
                data-card-library-entry
                onClick={() => onToggleEntry(entry.entryId)}
                className={cn(
                  "block appearance-none rounded-[1rem] border-[3px] border-kac-iron bg-[linear-gradient(180deg,rgba(255,253,245,0.98)_0%,rgba(244,233,213,0.98)_100%)] p-4 text-left shadow-[4px_4px_0_0_#121b23] transition duration-100 hover:-translate-y-[1px]",
                  selected
                    ? "outline outline-4 outline-offset-2 outline-kac-gold-dark"
                    : "",
                )}
              >
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
      </Panel>
    </div>
  );
};
