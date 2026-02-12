import { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";
import { Label, type LabelVariant } from "./Label";

export type MessageVariant =
  | "gold"
  | "fire"
  | "bone"
  | "skin"
  | "cloth"
  | "curse"
  | "monster";

const messageToneClassMap: Record<
  MessageVariant,
  { container: string; text: string; defaultLabelVariant: LabelVariant }
> = {
  gold: {
    container:
      "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-gold-light to-kac-bone border-2 border-kac-iron-dark",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "gold",
  },
  fire: {
    container:
      "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-fire-lightest to-kac-fire-light border-2 border-kac-iron-dark",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "fire",
  },
  bone: {
    container:
      "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-[#f8efd8] to-kac-bone-light border-2 border-kac-iron-dark",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "bone",
  },
  skin: {
    container:
      "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-skin-light to-kac-skin border-2 border-kac-iron-dark",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "skin",
  },
  cloth: {
    container:
      "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-cloth-lightest/25 to-kac-cloth-light border-2 border-kac-iron-dark",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "cloth",
  },
  curse: {
    container:
      "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-curse-lightest to-kac-curse-lighter border-2 border-kac-iron-dark",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "curse",
  },
  monster: {
    container:
      "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-monster-lightest to-kac-monster-light",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "monster",
  },
};

interface MessageProps extends PropsWithChildren {
  label?: string;
  variant?: MessageVariant;
  labelVariant?: LabelVariant;
  rotateLabel?: boolean;
  className?: string;
  contentClassName?: string;
  labelClassName?: string;
}

export const Message = ({
  label,
  variant = "bone",
  labelVariant,
  rotateLabel = true,
  className = "",
  contentClassName = "",
  labelClassName = "",
  children,
}: MessageProps): JSX.Element => {
  const tone = messageToneClassMap[variant];

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
            className={cn("absolute -top-4 -left-4", labelClassName)}
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
