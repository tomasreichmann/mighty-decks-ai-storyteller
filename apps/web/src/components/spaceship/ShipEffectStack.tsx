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

interface ShipEffectCardSurfaceProps {
  effectType: ShipEffectType;
}

export const ShipEffectCardSurface = ({
  effectType,
}: ShipEffectCardSurfaceProps): JSX.Element | null => {
  const resolvedEffectCard = resolveGameCard(
    "EffectCard",
    effectCardSlugByType[effectType],
  );

  if (!resolvedEffectCard) {
    return null;
  }

  return <GameCardView gameCard={resolvedEffectCard} />;
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
      {effects.flatMap((effect) =>
        Array.from({ length: effect.count }, (_, index) => (
          <ShipEffectCardSurface
            key={`${effect.effectId}-${index}`}
            effectType={effect.type}
          />
        )),
      )}
    </div>
  );
};
