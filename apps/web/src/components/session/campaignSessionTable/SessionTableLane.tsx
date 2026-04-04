import type {
  CampaignDetail,
  CampaignSessionTableEntry,
} from "@mighty-decks/spec/campaign";
import type { ReactNode } from "react";
import type { LabelVariant } from "../../common/Label";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { Label } from "../../common/Label";
import styles from "../CampaignSessionTable.module.css";
import { LaneCards } from "./LaneCards";

interface LaneHeaderProps {
  label: string;
  variant: LabelVariant;
  headerClassName?: string;
  showSendButton: boolean;
  onSend?: () => void;
}

const LaneHeader = ({
  label,
  variant,
  headerClassName,
  showSendButton,
  onSend,
}: LaneHeaderProps): JSX.Element => (
  <div className={cn(styles.laneDividerRow, headerClassName)}>
    <div className={styles.laneDivider} />
    <div className="relative z-10 flex items-center justify-between gap-2">
      <Label variant={variant} rotate={false} className={styles.laneLabel}>
        {label}
      </Label>
      {showSendButton && onSend ? (
        <Button variant="ghost" color="gold" size="sm" onClick={onSend}>
          Send Cards
        </Button>
      ) : null}
    </div>
  </div>
);

interface SessionTableLaneProps {
  campaign: CampaignDetail | null;
  label: string;
  variant: LabelVariant;
  entries: readonly CampaignSessionTableEntry[];
  canRemoveEntry: (entry: CampaignSessionTableEntry) => boolean;
  isFadingEntry: (tableEntryId: string) => boolean;
  showSendButton: boolean;
  onSend?: () => void;
  onRequestRemoveEntry?: (tableEntryId: string) => void;
  topContent?: ReactNode;
  className?: string;
  headerClassName?: string;
}

export const SessionTableLane = ({
  campaign,
  label,
  variant,
  entries,
  canRemoveEntry,
  isFadingEntry,
  showSendButton,
  onSend,
  onRequestRemoveEntry,
  topContent,
  className,
  headerClassName,
}: SessionTableLaneProps): JSX.Element => (
  <article className={cn(styles.laneSurface, "min-w-0 pb-1", className)}>
    <LaneHeader
      label={label}
      variant={variant}
      headerClassName={headerClassName}
      showSendButton={showSendButton}
      onSend={onSend}
    />
    {topContent ? <div className="min-w-0 pt-1">{topContent}</div> : null}
    <div className={cn("min-w-0", topContent ? "pt-2" : "pt-1")}>
      <LaneCards
        campaign={campaign}
        entries={entries}
        canRemoveEntry={canRemoveEntry}
        isFadingEntry={isFadingEntry}
        onRequestRemoveEntry={onRequestRemoveEntry}
      />
    </div>
  </article>
);
