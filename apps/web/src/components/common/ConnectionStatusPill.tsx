import { cn } from "../../utils/cn";
import { Tag, type TagTone } from "./Tag";

export type ConnectionStatusTone =
  | "connected"
  | "reconnecting"
  | "offline"
  | "disconnected";

interface ConnectionStatusPillProps {
  label: string;
  status: ConnectionStatusTone;
  detail?: string;
  className?: string;
}

const statusToneMap: Record<
  ConnectionStatusTone,
  { dotClassName: string; tone: TagTone; statusLabel: string }
> = {
  connected: {
    dotClassName:
      "bg-kac-monster-dark border border-kac-iron/70 shadow-[0_1px_0_rgba(255,255,255,0.35)]",
    tone: "monster",
    statusLabel: "connected",
  },
  reconnecting: {
    dotClassName:
      "bg-kac-gold-dark border border-kac-iron/70 shadow-[0_1px_0_rgba(255,255,255,0.35)]",
    tone: "gold",
    statusLabel: "reconnecting",
  },
  offline: {
    dotClassName:
      "bg-kac-blood border border-kac-iron/70 shadow-[0_1px_0_rgba(255,255,255,0.25)]",
    tone: "blood",
    statusLabel: "offline",
  },
  disconnected: {
    dotClassName:
      "bg-kac-blood border border-kac-iron/70 shadow-[0_1px_0_rgba(255,255,255,0.25)]",
    tone: "blood",
    statusLabel: "disconnected",
  },
};

export const ConnectionStatusPill = ({
  label,
  status,
  detail,
  className,
}: ConnectionStatusPillProps): JSX.Element => {
  const meta = statusToneMap[status];

  return (
    <span
      className={cn("connection-status-pill inline-flex items-center", className)}
    >
      <Tag
        tone={meta.tone}
        size="md"
        leading={
          <span
            aria-hidden="true"
            className={cn(
              "connection-status-pill__dot h-2.5 w-2.5 rounded-full",
              meta.dotClassName,
            )}
          />
        }
      >
        <span className="connection-status-pill__content inline-flex items-baseline gap-1.5">
          <span>{label}</span>
          <span className="connection-status-pill__detail normal-case tracking-normal opacity-80">
            {detail ?? meta.statusLabel}
          </span>
        </span>
      </Tag>
    </span>
  );
};
