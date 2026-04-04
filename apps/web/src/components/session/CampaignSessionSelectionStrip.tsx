import { Button } from "../common/Button";
import { InputDescriptionHint } from "../common/InputDescriptionHint";
import { Label } from "../common/Label";
import { Text } from "../common/Text";

export interface CampaignSessionSelectionEntry {
  id: string;
  label: string;
}

interface CampaignSessionSelectionStripProps {
  entries: readonly CampaignSessionSelectionEntry[];
  onRemoveEntry: (entryId: string) => void;
  className?: string;
}

export const CampaignSessionSelectionStrip = ({
  entries,
  onRemoveEntry,
  className,
}: CampaignSessionSelectionStripProps): JSX.Element => {
  if (entries.length === 0) {
    return <></>;
  }

  return (
    <section className={`stack gap-2 ${className ?? ""}`.trim()}>
      <div className="flex items-center gap-2">
        <Label variant="gold" rotate={false} className="shrink-0">
          Selection
        </Label>
        <InputDescriptionHint
          description="Use the + button on cards and shortcode controls to stage cards."
          placement="bottom"
        />
      </div>
      <div className="flex min-w-0 flex-wrap items-start gap-2">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="relative min-w-[8.5rem] max-w-[14rem] rounded border-2 border-kac-iron/40 bg-kac-bone-light/70 px-2 py-1.5 shadow-[1px_1px_0_0_#121b23]"
          >
            <Button
              variant="circle"
              color="curse"
              size="sm"
              aria-label={`Remove ${entry.label}`}
              title={`Remove ${entry.label}`}
              className="!absolute !right-1 !top-1 !h-5 !w-5 !border-x-[2px] !border-y-[2px] text-[0.7rem]"
              onClick={() => {
                onRemoveEntry(entry.id);
              }}
            >
              x
            </Button>
            <Text variant="note" color="iron" className="pr-5 text-[0.7rem]">
              {entry.label}
            </Text>
          </article>
        ))}
      </div>
    </section>
  );
};
