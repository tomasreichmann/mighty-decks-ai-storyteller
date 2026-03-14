import type { OutcomeSlug } from "../../types/types";
import { cn } from "../../utils/cn";
import { type ResolvedGameCard } from "../../lib/markdownGameComponents";
import { LayeredCard } from "../cards/LayeredCard";

const titleClassByOutcomeSlug: Record<OutcomeSlug, string> = {
  "special-action": "text-special",
  success: "text-success",
  "partial-success": "text-partial",
  chaos: "text-chaos",
  fumble: "text-fumble",
};

interface GameCardViewProps {
  gameCard: ResolvedGameCard;
  className?: string;
}

interface InvalidGameCardViewProps {
  type?: string;
  slug?: string;
  className?: string;
}

export const GameCardView = ({
  gameCard,
  className,
}: GameCardViewProps): JSX.Element => {
  switch (gameCard.type) {
    case "OutcomeCard":
      return (
        <LayeredCard
          className={cn("w-full max-w-[13rem]", className)}
          imageUri={gameCard.card.iconUri}
          noun={gameCard.card.title}
          nounDeck={gameCard.card.deck}
          nounCornerIcon="/types/outcome.png"
          nounEffect={gameCard.card.description}
          adjectiveEffect={gameCard.card.instructions}
          nounClassName={cn(
            "text-[19px]",
            titleClassByOutcomeSlug[gameCard.card.slug],
          )}
          nounEffectClassName="text-[11px] text-kac-iron-light"
          adjectiveEffectClassName="text-[11px] font-semibold text-kac-iron"
        />
      );
    case "EffectCard":
      return (
        <LayeredCard
          className={cn("w-full max-w-[13rem]", className)}
          imageUri={gameCard.card.iconUri}
          noun={gameCard.card.title}
          nounDeck={gameCard.card.deck}
          nounCornerIcon="/types/effect.png"
          nounEffect={gameCard.card.nounEffect}
          adjectiveEffect={gameCard.card.adjectiveEffect}
          nounClassName="text-[18px] text-kac-iron"
          nounEffectClassName="text-[10px] text-kac-iron-light"
          adjectiveEffectClassName="text-[10px] font-semibold text-kac-iron"
        />
      );
    case "StuntCard":
      return (
        <LayeredCard
          className={cn("w-full max-w-[13rem]", className)}
          imageUri={gameCard.card.iconUri}
          noun={gameCard.card.title}
          nounDeck={gameCard.card.deck}
          nounCornerIcon="/types/stunt.png"
          nounEffect={gameCard.card.effect}
          adjectiveEffect={gameCard.card.requirements}
          nounClassName="text-[17px] text-kac-iron"
          nounEffectClassName="text-[10px] text-kac-iron-light"
          adjectiveEffectClassName="text-[10px] font-semibold text-kac-blood-dark"
        />
      );
    default:
      return <></>;
  }
};

export const InvalidGameCardView = ({
  type,
  slug,
  className,
}: InvalidGameCardViewProps): JSX.Element => {
  const summary =
    typeof type === "string" && typeof slug === "string"
      ? `${type} / ${slug}`
      : "Missing or unknown card props";

  return (
    <span
      className={cn(
        "inline-flex max-w-[13rem] flex-col rounded border-2 border-dashed border-kac-blood-dark/70 bg-kac-bone-light/70 px-3 py-2 text-left font-ui text-xs text-kac-iron shadow-[2px_2px_0_0_#121b23]",
        className,
      )}
    >
      <span className="font-bold uppercase tracking-[0.08em] text-kac-blood-dark">
        Invalid GameCard
      </span>
      <span>{summary}</span>
    </span>
  );
};
