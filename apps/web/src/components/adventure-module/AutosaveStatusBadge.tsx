import { Tag } from "../common/Tag";

export type AutosaveStatus = "idle" | "queued" | "saving" | "saved" | "error";

interface AutosaveStatusBadgeProps {
  status: AutosaveStatus;
  message?: string;
}

const statusLabelMap: Record<AutosaveStatus, string> = {
  idle: "✔",
  queued: "Queued",
  saving: "Saving",
  saved: "Saved",
  error: "Save Error",
};

export const AutosaveStatusBadge = ({
  status,
  message,
}: AutosaveStatusBadgeProps): JSX.Element => {
  const statusLabel = statusLabelMap[status];
  const usesTagLabel = status === "idle" || status === "saved";

  return (
    <div>
      {usesTagLabel ? (
        <Tag tone={status === "saved" ? "monster" : "monster"} size="md">
          {statusLabel}{" "}
          {message ? (
            <span className="normal-case tracking-normal">{message}</span>
          ) : null}
        </Tag>
      ) : (
        <span>{statusLabel}</span>
      )}
    </div>
  );
};
