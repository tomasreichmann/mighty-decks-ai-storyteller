import { GameCardView } from "../adventure-module/GameCardView";
import { resolveGameCard } from "../../lib/markdownGameComponents";
import type {
  ShipEffectInstance,
  ShipEffectType,
} from "../../lib/spaceship/spaceshipTypes";
import { cn } from "../../utils/cn";

interface ShipEffectStackProps {
  effects: ShipEffectInstance[];
  className?: string;
}

const effectCardSlugByType: Record<ShipEffectType, string> = {
  distress: "distress",
  freezing: "freezing",
  injury: "injury",
};

const effectCardFullHeightRem = 21.16;
const effectCardHeaderHeightRem = 2.04;

interface ShipEffectCardPileProps {
  effectType: ShipEffectType;
  count: number;
}

export const ShipEffectCardPile = ({
  effectType,
  count,
}: ShipEffectCardPileProps): JSX.Element | null => {
  if (count <= 0) {
    return null;
  }

  const resolvedEffectCard = resolveGameCard(
    "EffectCard",
    effectCardSlugByType[effectType],
  );

  if (!resolvedEffectCard) {
    return null;
  }

  const stackHeightRem =
    effectCardFullHeightRem +
    Math.max(count - 1, 0) * effectCardHeaderHeightRem;

  return (
    <div
      aria-hidden="true"
      className="relative flex w-[13rem] min-w-0 max-w-[13rem] shrink-0"
      style={{
        height: `${stackHeightRem}rem`,
      }}
    >
      <div
        className="relative w-full"
        style={{
          height: `${stackHeightRem}rem`,
        }}
      >
        {Array.from({ length: count }).map((_, index) => {
          const stackIndex = count - 1 - index;

          return (
            <div
              key={`${effectType}-stack-${index}`}
              className="absolute inset-x-0"
              style={{
                bottom: `${stackIndex * effectCardHeaderHeightRem}rem`,
                zIndex: index + 1,
              }}
            >
              <GameCardView gameCard={resolvedEffectCard} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ShipEffectStack = ({
  effects,
  className = "",
}: ShipEffectStackProps): JSX.Element | null => {
  if (effects.length === 0) {
    return null;
  }

  return (
    <div
      data-effect-stack
      className={cn(
        "ship-effect-stack absolute left-3 right-3 bottom-full z-10 flex flex-wrap items-start justify-center gap-2",
        className,
      )}
    >
      {effects.map((effect) => (
        <ShipEffectCardPile
          key={effect.effectId}
          effectType={effect.type}
          count={effect.count}
        />
      ))}
    </div>
  );
};
