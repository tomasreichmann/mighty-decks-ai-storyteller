import type { OutcomeCardType } from "@mighty-decks/spec/adventureState";
import { cn } from "../../utils/cn";
import { LayeredCard } from "./LayeredCard";

export interface OutcomeCardMeta {
  title: string;
  effect: string;
  description: string;
  toneClassName: string;
  titleClassName: string;
}

export const outcomeCardMetaByType: Record<OutcomeCardType, OutcomeCardMeta> = {
  "special-action": {
    title: "Special Action",
    effect: "+3 Effect",
    description: "A standout move lands hard and changes the pace.",
    toneClassName: "",
    titleClassName: "text-special",
  },
  success: {
    title: "Success",
    effect: "+2 Effect",
    description: "Your move works cleanly and creates momentum.",
    toneClassName: "",
    titleClassName: "text-success",
  },
  "partial-success": {
    title: "Partial Success",
    effect: "+1 Effect",
    description: "Progress with a cost, tradeoff, or complication.",
    toneClassName: "",
    titleClassName: "text-partial",
  },
  chaos: {
    title: "Chaos",
    effect: "Twist",
    description: "A sudden shift shakes up the scene for everyone.",
    toneClassName: "",
    titleClassName: "text-chaos",
  },
  fumble: {
    title: "Fumble",
    effect: "-1 Effect",
    description: "The move misfires and pressure rises fast.",
    toneClassName: "",
    titleClassName: "text-fumble",
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
        "group relative w-full bg-transparent p-0 text-left transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/60",
        "disabled:cursor-not-allowed disabled:opacity-65",
        selected
          ? "ring-2 ring-kac-gold-dark/70"
          : "hover:-translate-y-0.5",
        className,
      )}
    >
      <LayeredCard
        className="mx-auto w-full max-w-[14rem]"
        imageUri={`/outcomes/${card}.png`}
        noun={meta.title}
        nounDeck="base"
        nounCornerIcon="/types/outcome.png"
        nounEffect={meta.description}
        adjectiveEffect={meta.effect}
        nounClassName={cn("text-[18px]", meta.titleClassName)}
        nounEffectClassName="text-[11px] text-kac-iron-light"
        adjectiveEffectClassName="text-[11px] font-semibold text-kac-iron"
      />
    </button>
  );
};
