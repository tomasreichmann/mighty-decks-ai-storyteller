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
    container: "bg-gradient-to-b from-kac-gold-light to-kac-bone",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "gold",
  },
  fire: {
    container: "bg-gradient-to-b from-kac-fire-lightest to-kac-fire-light",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "fire",
  },
  bone: {
    container:
      "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-[#f8efd8] to-kac-bone-light",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "bone",
  },
  skin: {
    container:
      "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-skin-light to-kac-skin",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "skin",
  },
  cloth: {
    container:
      "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] bg-gradient from-kac-cloth-lightest/25 to-kac-cloth-light",
    text: "text-kac-iron-dark",
    defaultLabelVariant: "cloth",
  },
  curse: {
    container:
      "bg-[linear-gradient(179deg,var(--tw-gradient-stops))] from-kac-curse-lightest to-kac-curse-lighter",
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
  label: string;
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
        "min-w-0 max-w-full border-0 px-2.5 py-2",
        "shadow-[4px_4px_0_0_#121b23]",
        "rounded-sm",
        tone.container,
        className,
      )}
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <Label
          variant={labelVariant ?? tone.defaultLabelVariant}
          rotate={rotateLabel}
          className={cn("mr-2 -mt-2", labelClassName)}
        >
          {label}
        </Label>
        <div
          className={cn(
            "min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed",
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
