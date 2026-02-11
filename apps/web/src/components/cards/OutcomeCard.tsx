import type { OutcomeCardType } from "@mighty-decks/spec/adventureState";
import { cn } from "../../utils/cn";

export interface OutcomeCardMeta {
  title: string;
  effect: string;
  description: string;
  toneClassName: string;
}

export const outcomeCardMetaByType: Record<OutcomeCardType, OutcomeCardMeta> = {
  "special-action": {
    title: "Special Action",
    effect: "+3 Effect",
    description: "A standout move lands hard and changes the pace.",
    toneClassName: "border-kac-gold-dark bg-kac-gold-lightest text-kac-gold-darker",
  },
  success: {
    title: "Success",
    effect: "+2 Effect",
    description: "Your move works cleanly and creates momentum.",
    toneClassName: "border-kac-monster-dark bg-kac-monster-lightest text-kac-monster-dark",
  },
  "partial-success": {
    title: "Partial Success",
    effect: "+1 Effect",
    description: "Progress with a cost, tradeoff, or complication.",
    toneClassName: "border-kac-steel-dark bg-kac-steel-light text-kac-steel-dark",
  },
  chaos: {
    title: "Chaos",
    effect: "Twist",
    description: "A sudden shift shakes up the scene for everyone.",
    toneClassName: "border-kac-curse-dark bg-kac-curse-lightest text-kac-curse-dark",
  },
  fumble: {
    title: "Fumble",
    effect: "-1 Effect",
    description: "The move misfires and pressure rises fast.",
    toneClassName: "border-kac-iron-light bg-kac-steel-light text-kac-iron-light",
  },
};

export const outcomeCardOrder: OutcomeCardType[] = [
  "special-action",
  "success",
  "partial-success",
  "chaos",
  "fumble",
];

interface OutcomeCardProps {
  card: OutcomeCardType;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  onSelect?: (card: OutcomeCardType) => void;
}

export const OutcomeCard = ({
  card,
  disabled = false,
  selected = false,
  className,
  onSelect,
}: OutcomeCardProps): JSX.Element => {
  const meta = outcomeCardMetaByType[card];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect?.(card)}
      className={cn(
        "group relative w-full rounded-lg border p-3 text-left shadow-sm transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/60",
        "disabled:cursor-not-allowed disabled:opacity-65",
        meta.toneClassName,
        selected
          ? "ring-2 ring-kac-gold-dark/70 shadow-md"
          : "hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
        Outcome
      </p>
      <p className="mt-0.5 text-base font-bold">{meta.title}</p>
      <p className="text-sm font-semibold">{meta.effect}</p>
      <p className="mt-2 text-xs leading-snug opacity-90">{meta.description}</p>
    </button>
  );
};
