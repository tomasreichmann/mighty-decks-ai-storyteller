import type { CSSProperties } from "react";
import { Text } from "./common/Text";
import { cn } from "../utils/cn";
import type { MessageColor } from "./common/Message";

interface PendingIndicatorProps {
  label?: string;
  color?: MessageColor;
  className?: string;
  indicatorClassName?: string;
}

const DOT_DELAYS_MS = [0, 140, 280] as const;
const stripTrailingDots = (value: string): string =>
  value.replace(/[.\s]+$/g, "").trim();

const resolvePendingIndicatorTone = (
  color: MessageColor,
): {
  labelClassName: string;
  dotClassName: string;
} => {
  switch (color) {
    case "fire":
    case "fire-light":
    case "fire-lightest":
    case "fire-dark":
      return {
        labelClassName: "text-kac-iron-dark",
        dotClassName: "bg-kac-fire-dark border-kac-fire-lightest",
      };
    case "bone":
    case "bone-light":
    case "bone-dark":
    case "bone-darker":
    case "skin":
    case "skin-light":
    case "skin-dark":
      return {
        labelClassName: "text-kac-iron-dark",
        dotClassName: "bg-kac-bone-dark border-kac-bone-light",
      };
    case "cloth":
    case "cloth-light":
    case "cloth-lightest":
      return {
        labelClassName: "text-kac-iron-dark",
        dotClassName: "bg-kac-cloth-dark border-kac-cloth-lightest",
      };
    case "cloth-dark":
      return {
        labelClassName: "text-kac-steel-light",
        dotClassName: "bg-kac-cloth-light border-kac-cloth-lightest",
      };
    case "curse":
    case "curse-light":
    case "curse-lighter":
    case "curse-lightest":
      return {
        labelClassName: "text-kac-iron-dark",
        dotClassName: "bg-kac-curse-dark border-kac-curse-lightest",
      };
    case "curse-dark":
      return {
        labelClassName: "text-kac-curse-lightest",
        dotClassName: "bg-kac-curse-light border-kac-curse-lightest",
      };
    case "monster":
    case "monster-light":
    case "monster-lightest":
    case "monster-dark":
      return {
        labelClassName: "text-kac-iron-dark",
        dotClassName: "bg-kac-monster-dark border-kac-monster-lightest",
      };
    case "blood":
    case "blood-light":
    case "blood-lighter":
    case "blood-lightest":
      return {
        labelClassName: "text-kac-iron-dark",
        dotClassName: "bg-kac-blood-dark border-kac-blood-lightest",
      };
    case "blood-dark":
      return {
        labelClassName: "text-kac-curse-lightest",
        dotClassName: "bg-kac-blood-light border-kac-blood-lightest",
      };
    case "iron-dark":
    case "steel-dark":
      return {
        labelClassName: "text-kac-steel-light",
        dotClassName: "bg-kac-steel-light border-kac-steel-dark",
      };
    case "iron":
    case "iron-light":
    case "steel":
    case "steel-light":
      return {
        labelClassName: "text-kac-iron-dark",
        dotClassName: "bg-kac-iron-dark border-kac-steel-light",
      };
    case "gold":
    case "gold-light":
    case "gold-dark":
    case "gold-darker":
    default:
      return {
        labelClassName: "text-kac-iron-dark",
        dotClassName: "bg-kac-gold-dark border-kac-gold-light",
      };
  }
};

export const PendingIndicator = ({
  label = "Processing...",
  color = "gold",
  className = "",
  indicatorClassName = "",
}: PendingIndicatorProps): JSX.Element => {
  const baseLabel = stripTrailingDots(label) || "Processing";
  const tone = resolvePendingIndicatorTone(color);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Text
        as="span"
        variant="body"
        color="inherit"
        className={cn("text-sm italic", tone.labelClassName)}
      >
        {baseLabel}
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
                "pending-indicator-dot h-3 w-3 rounded-full border shadow-[2px_2px_0_0_#121b23]",
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
