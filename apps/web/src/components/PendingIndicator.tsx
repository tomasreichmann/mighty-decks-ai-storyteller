import type { CSSProperties } from "react";
import { Text } from "./common/Text";
import { cn } from "../utils/cn";
import type { MessageColor } from "./common/Message";
import { resolvePendingIndicatorTone } from "./PendingIndicatorTone";
import styles from "./PendingIndicator.module.css";

interface PendingIndicatorProps {
  label?: React.ReactNode;
  color?: MessageColor;
  className?: string;
  indicatorClassName?: string;
}

const DOT_DELAYS_MS = [0, 140, 280] as const;

export const PendingIndicator = ({
  label = "Processing",
  color = "gold",
  className = "",
  indicatorClassName = "",
}: PendingIndicatorProps): JSX.Element => {
  const tone = resolvePendingIndicatorTone(color);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Text
        as="span"
        variant="body"
        color="inherit"
        className={cn("text-sm italic", tone.labelClassName)}
      >
        {label}
      </Text>
      <span
        aria-hidden="true"
        className={cn("inline-flex items-end gap-1", indicatorClassName)}
      >
        {DOT_DELAYS_MS.map((delay, index) => {
          const style: CSSProperties = { animationDelay: `${delay}ms` };
          return (
            <span
              key={`pending-dot-${index}`}
              className={cn(
                "h-3 w-3 rounded-full border shadow-[2px_2px_0_0_#121b23]",
                styles.dot,
                tone.dotClassName,
              )}
              style={style}
            />
          );
        })}
      </span>
    </span>
  );
};
