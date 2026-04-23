import { useState } from "react";
import type { ShipLocationInstance } from "../../lib/spaceship/spaceshipTypes";
import { ActorToken } from "./ActorToken";
import { EnergyToken } from "./EnergyToken";
import { ShipEffectStack } from "./ShipEffectStack";
import { Tag } from "../common/Tag";
import { Text } from "../common/Text";
import { LocationCard } from "../styleguide/LocationCard";

interface LevelPillProps {
  level: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

const LevelPill = ({
  level,
  onDecrease,
  onIncrease,
}: LevelPillProps): JSX.Element => {
  const isDecreaseDisabled = level <= 1;

  return (
    <Tag
      tone="bone"
      size="sm"
      className="rounded-full border-[3px] border-kac-iron shadow-[2px_2px_0_0_#121b23]"
      contentClassName="font-ui normal-case tracking-[0.05em] text-kac-iron"
      leading={
        <button
          type="button"
          aria-label="Decrease location level"
          disabled={isDecreaseDisabled}
          onClick={onDecrease}
          className="flex h-7 w-7 items-center justify-center border-0 bg-transparent font-ui text-[0.72rem] font-bold leading-none text-kac-iron transition hover:bg-kac-bone/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          -
        </button>
      }
      trailing={
        <button
          type="button"
          aria-label="Increase location level"
          onClick={onIncrease}
          className="flex h-7 w-7 items-center justify-center border-0 bg-transparent font-ui text-[0.72rem] font-bold leading-none text-kac-iron transition hover:bg-kac-bone/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/50 disabled:cursor-not-allowed disabled:opacity-45"
        >
          +
        </button>
      }
    >
      lvl {level}
    </Tag>
  );
};

interface ShipLocationCardProps {
  location: ShipLocationInstance;
}

export const ShipLocationCard = ({
  location,
}: ShipLocationCardProps): JSX.Element => {
  const [level, setLevel] = useState(location.level);

  const decrementLevel = (): void => {
    setLevel((current) => Math.max(1, current - 1));
  };

  const incrementLevel = (): void => {
    setLevel((current) => current + 1);
  };

  return (
    <article data-location-card className="ship-location-card relative w-fit overflow-visible">
      <div className="relative overflow-visible">
        <ShipEffectStack effects={location.effects} />
        <LocationCard
          imageUrl={location.imageUrl ?? "/sample-scene-image.png"}
          imageAlt={location.title}
          title={location.title}
          description={location.summary}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text
          variant="note"
          color="iron-light"
          className="max-w-[18rem] text-xs !opacity-100"
        >
          {location.status}
        </Text>

        <LevelPill
          level={level}
          onDecrease={decrementLevel}
          onIncrease={incrementLevel}
        />
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {location.energyTokens.map((energyToken) => (
          <EnergyToken
            key={energyToken.tokenId}
            label={energyToken.label}
            detail={energyToken.detail}
          />
        ))}
      </div>

      {location.actorTokens.length > 0 ? (
        <div className="pointer-events-none flex flex-wrap justify-end gap-2">
          {location.actorTokens.map((actorToken) => (
            <ActorToken
              key={actorToken.tokenId}
              label={actorToken.label}
              imageUrl={actorToken.imageUrl}
              title={actorToken.title}
              subtitle={actorToken.subtitle}
              tone={actorToken.tone}
              className="scale-[0.82]"
            />
          ))}
        </div>
      ) : null}
    </article>
  );
};
