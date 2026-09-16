import { GameCard as PackagedGameCard } from "@mighty-decks/components/react";
import { useGameCardCatalogContext } from "../../lib/gameCardCatalogContext";
import { cn } from "../../utils/cn";
import { type ResolvedGameCard } from "../../lib/markdownGameComponents";
import { ActorCard } from "../cards/ActorCard";
import { AssetCard } from "../cards/AssetCard";
import { CounterCard } from "../cards/CounterCard";

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
  const { onAdjustCounterValue } = useGameCardCatalogContext();

  switch (gameCard.type) {
    case "OutcomeCard":
      return (
        <PackagedGameCard
          type="outcome"
          slug={gameCard.card.slug}
          assetBaseUrl=""
          className={cn("w-full max-w-[13rem]", className)}
        />
      );
    case "EffectCard":
      return (
        <PackagedGameCard
          type="effect"
          slug={gameCard.card.slug}
          assetBaseUrl=""
          className={cn("w-full max-w-[13rem]", className)}
        />
      );
    case "StuntCard":
      return (
        <PackagedGameCard
          type="stunt"
          slug={gameCard.card.slug}
          assetBaseUrl=""
          className={cn("w-full max-w-[13rem]", className)}
        />
      );
    case "ActorCard":
      return (
        <ActorCard
          className={cn("w-full max-w-[13rem]", className)}
          {...(gameCard.actor.mode === "custom"
            ? { kind: "custom" as const, custom: gameCard.actor.custom }
            : {
                baseLayerSlug: gameCard.actor.baseLayerSlug,
                tacticalRoleSlug: gameCard.actor.tacticalRoleSlug,
                tacticalSpecialSlug: gameCard.actor.tacticalSpecialSlug,
              })}
        />
      );
    case "CounterCard":
      return (
        <CounterCard
          className={className}
          iconSlug={gameCard.counter.iconSlug}
          title={gameCard.counter.title}
          currentValue={gameCard.counter.currentValue}
          maxValue={gameCard.counter.maxValue}
          description={gameCard.counter.description}
          onDecrement={
            onAdjustCounterValue
              ? () => onAdjustCounterValue(gameCard.counter.slug, -1)
              : undefined
          }
          onIncrement={
            onAdjustCounterValue
              ? () => onAdjustCounterValue(gameCard.counter.slug, 1)
              : undefined
          }
          onDecrementMaxValue={
            onAdjustCounterValue && typeof gameCard.counter.maxValue === "number"
              ? () => onAdjustCounterValue(gameCard.counter.slug, -1, "max")
              : undefined
          }
          onIncrementMaxValue={
            onAdjustCounterValue && typeof gameCard.counter.maxValue === "number"
              ? () => onAdjustCounterValue(gameCard.counter.slug, 1, "max")
              : undefined
          }
        />
      );
    case "AssetCard":
      if (gameCard.asset.kind === "custom") {
        return (
          <AssetCard
            className={cn("w-full max-w-[13rem]", className)}
            kind="custom"
            modifier={gameCard.asset.modifier}
            noun={gameCard.asset.noun}
            nounDescription={gameCard.asset.nounDescription}
            adjectiveDescription={gameCard.asset.adjectiveDescription}
            iconUrl={gameCard.asset.iconUrl}
            overlayUrl={gameCard.asset.overlayUrl}
          />
        );
      }
      if (gameCard.asset.kind === "legacy_layered") {
        return (
          <AssetCard
            className={cn("w-full max-w-[13rem]", className)}
            kind="legacy_layered"
            title={gameCard.asset.title}
          />
        );
      }
      return (
        <AssetCard
          className={cn("w-full max-w-[13rem]", className)}
          baseAssetSlug={gameCard.asset.baseAssetSlug}
          modifierSlug={gameCard.asset.modifierSlug}
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
