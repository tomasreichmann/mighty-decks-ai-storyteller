import { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";
import { Label, type LabelVariant } from "./Label";
import type { ButtonColors } from "./Button";

export type MessageColor = ButtonColors;

interface MessageTone {
  container: string;
  text: string;
  defaultLabelVariant: LabelVariant;
}

const baseContainerClass =
  "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] border-2 border-kac-iron-dark";

const resolveMessageTone = (color: MessageColor): MessageTone => {
  switch (color) {
    case "fire":
    case "fire-light":
    case "fire-lightest":
      return {
        container: `${baseContainerClass} from-kac-fire-lightest to-kac-fire-light`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "fire",
      };
    case "fire-dark":
      return {
        container: `${baseContainerClass} from-kac-fire-dark to-kac-fire-light`,
        text: "text-kac-bone-light",
        defaultLabelVariant: "fire",
      };
    case "bone":
    case "bone-light":
      return {
        container: `${baseContainerClass} from-[#f8efd8] to-kac-bone-light`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "bone",
      };
    case "bone-dark":
    case "bone-darker":
      return {
        container: `${baseContainerClass} from-kac-bone to-kac-bone-dark`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "bone",
      };
    case "skin":
    case "skin-light":
    case "skin-dark":
      return {
        container: `${baseContainerClass} from-kac-skin-light to-kac-skin`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "skin",
      };
    case "cloth":
    case "cloth-light":
    case "cloth-lightest":
      return {
        container: `${baseContainerClass} from-kac-cloth-lightest/25 to-kac-cloth-light`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "cloth",
      };
    case "cloth-dark":
      return {
        container: `${baseContainerClass} from-kac-cloth to-kac-cloth-dark`,
        text: "text-kac-steel-light",
        defaultLabelVariant: "cloth",
      };
    case "curse":
    case "curse-light":
    case "curse-lighter":
    case "curse-lightest":
      return {
        container: `${baseContainerClass} from-kac-curse-lightest to-kac-curse-lighter`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "curse",
      };
    case "curse-dark":
      return {
        container: `${baseContainerClass} from-kac-curse-dark to-kac-curse-light`,
        text: "text-kac-curse-lightest",
        defaultLabelVariant: "curse",
      };
    case "monster":
    case "monster-light":
    case "monster-lightest":
      return {
        container: `${baseContainerClass} from-kac-monster-lightest to-kac-monster-light`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "monster",
      };
    case "monster-dark":
      return {
        container: `${baseContainerClass} from-kac-monster-dark to-kac-monster-light`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "monster",
      };
    case "blood":
    case "blood-light":
    case "blood-lighter":
    case "blood-lightest":
      return {
        container: `${baseContainerClass} from-kac-blood-lightest to-kac-blood-lighter`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "curse",
      };
    case "blood-dark":
      return {
        container: `${baseContainerClass} from-kac-blood-dark to-kac-blood-light`,
        text: "text-kac-curse-lightest",
        defaultLabelVariant: "curse",
      };
    case "iron-dark":
    case "steel-dark":
      return {
        container: `${baseContainerClass} from-kac-iron-dark to-kac-iron-light`,
        text: "text-kac-steel-light",
        defaultLabelVariant: "cloth",
      };
    case "iron":
    case "iron-light":
    case "steel":
    case "steel-light":
      return {
        container: `${baseContainerClass} from-kac-steel-light to-kac-steel`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "cloth",
      };
    case "gold":
    case "gold-light":
    case "gold-dark":
    case "gold-darker":
      return {
        container: `${baseContainerClass} from-kac-gold-light to-kac-bone`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "gold",
      };
    default:
      return {
        container: `${baseContainerClass} from-kac-gold-light to-kac-bone`,
        text: "text-kac-iron-dark",
        defaultLabelVariant: "gold",
      };
  }
};

interface MessageProps extends PropsWithChildren {
  label?: string;
  color?: MessageColor;
  labelVariant?: LabelVariant;
  rotateLabel?: boolean;
  className?: string;
  contentClassName?: string;
  labelClassName?: string;
}

export const Message = ({
  label,
  color = "bone",
  labelVariant,
  rotateLabel = true,
  className = "",
  contentClassName = "",
  labelClassName = "",
  children,
}: MessageProps): JSX.Element => {
  const tone = resolveMessageTone(color);

  return (
    <article
      className={cn(
        "min-w-0 max-w-full px-2 py-2 pr-4",
        "shadow-[4px_4px_0_0_#121b23]",
        "rounded-sm",
        tone.container,
        className,
      )}
    >
      <div className="stack min-w-0 items-baseline gap-2 relative pt-4">
        {label && (
          <Label
            variant={labelVariant ?? tone.defaultLabelVariant}
            rotate={rotateLabel}
            className={cn(
              "relative -mt-8 -left-3 whitespace-nowrap",
              labelClassName,
            )}
          >
            {label}
          </Label>
        )}
        <div
          className={cn(
            "min-w-0 w-full flex-1 whitespace-pre-wrap text-sm leading-relaxed",
            tone.text,
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </article>
  );
};
