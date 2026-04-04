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
  face?: "front" | "back";
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  onSelect?: (card: OutcomeCardType) => void;
}

const outcomeBackfaceBackgroundUri = "/backgrounds/card-backface.png";
const outcomeBackfaceIconUri = "/types/outcome.png";

const OutcomeCardBack = ({
  className,
}: {
  className?: string;
}): JSX.Element => (
  <article
    aria-label="Outcome card back"
    className={cn(
      "relative aspect-[204/332] w-[204px] max-w-full overflow-hidden rounded-[0.6rem] shadow-[2px_2px_0_0_#121b23]",
      className,
    )}
  >
    <svg
      viewBox="0 0 204 332"
      className="h-full w-full"
      role="img"
      aria-label="Outcome card back"
    >
      <image
        href={outcomeBackfaceBackgroundUri}
        x="0"
        y="0"
        width="204"
        height="332"
        preserveAspectRatio="xMidYMid slice"
      />
      <image
        href={outcomeBackfaceIconUri}
        x="0"
        y="50"
        width="204"
        height="166"
        preserveAspectRatio="xMidYMid meet"
      />
      <text
        x="102"
        y="215"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-md-heading text-[24px] font-bold leading-none fill-kac-monster-lightest"
        style={{ textShadow: "0px 2px 0 black" }}
      >
        Outcome
      </text>
    </svg>
  </article>
);

export const OutcomeCard = ({
  card,
  face = "front",
  disabled = false,
  selected = false,
  className,
  onSelect,
}: OutcomeCardProps): JSX.Element => {
  const meta = outcomeCardMetaByType[card];

  if (face === "back") {
    return <OutcomeCardBack className={className} />;
  }

  if (!onSelect) {
    return (
      <LayeredCard
        className={cn("mx-auto w-full max-w-[14rem]", className)}
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
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(card)}
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
