import { useState, type PointerEvent } from "react";
import type { ShipLocationInstance } from "../../lib/spaceship/spaceshipTypes";
import { ActorToken } from "./ActorToken";
import { EnergyToken } from "./EnergyToken";
import { ShipEffectStack } from "./ShipEffectStack";
import { AssetCard } from "../cards/AssetCard";
import { Tag } from "../common/Tag";
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

export const ShipLocationCardSurface = ({
  location,
}: ShipLocationCardProps): JSX.Element => {
  const [level, setLevel] = useState(location.level);

  const decrementLevel = (): void => {
    setLevel((current) => Math.max(1, current - 1));
  };

  const incrementLevel = (): void => {
    setLevel((current) => current + 1);
  };
  const stopBoardPan = (event: PointerEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  return (
    <article
      data-location-card
      className="ship-location-card-surface relative h-[204px] w-[332px] overflow-visible"
    >
      <div className="relative h-full w-full overflow-visible">
        <LocationCard
          imageUrl={location.imageUrl ?? "/sample-scene-image.png"}
          imageAlt={location.title}
          title={location.title}
          description={location.summary}
        />
      </div>

      <div
        data-location-level-controls
        className="pointer-events-auto absolute right-10 top-3 z-20 flex justify-end"
        onPointerDown={stopBoardPan}
      >
        <LevelPill
          level={level}
          onDecrease={decrementLevel}
          onIncrease={incrementLevel}
        />
      </div>
    </article>
  );
};

export const ShipLocationDeviceCard = ({
  location,
}: ShipLocationCardProps): JSX.Element | null => {
  const device = location.device;

  if (!device) {
    return null;
  }

  return (
    <div data-device-card className="ship-location-device-card">
      <AssetCard
        kind="custom"
        deck={device.asset.deck}
        modifier={device.asset.modifier}
        noun={device.asset.noun}
        nounDescription={device.asset.nounDescription}
        adjectiveDescription={device.asset.adjectiveDescription}
        iconUrl={device.asset.iconUrl}
        className="mx-0"
      />
    </div>
  );
};

export const ShipLocationTokenRow = ({
  location,
}: ShipLocationCardProps): JSX.Element | null => {
  const device = location.device;
  const powerTokens =
    device && device.powerTokens.length > 0
      ? device.powerTokens
      : location.energyTokens;

  if (powerTokens.length === 0 && location.actorTokens.length === 0) {
    return null;
  }

  return (
    <div className="ship-location-token-row pointer-events-none flex h-full w-full flex-row flex-wrap items-center justify-center gap-2">
      {powerTokens.map((energyToken) => (
        <EnergyToken
          key={energyToken.tokenId}
          label={energyToken.label}
          detail={energyToken.detail}
          state={energyToken.state}
        />
      ))}

      {location.actorTokens.map((actorToken) => (
        <ActorToken
          key={actorToken.tokenId}
          label={actorToken.label}
          imageUrl={actorToken.imageUrl}
          tone={actorToken.tone}
          className="scale-[0.82]"
        />
      ))}
    </div>
  );
};

export const ShipLocationCard = ({
  location,
}: ShipLocationCardProps): JSX.Element => {
  return (
    <article data-location-card className="ship-location-card relative w-fit overflow-visible">
      <div className="relative overflow-visible">
        <ShipEffectStack effects={location.effects} />
        <ShipLocationCardSurface location={location} />
      </div>

      <ShipLocationDeviceCard location={location} />
      <ShipLocationTokenRow location={location} />
    </article>
  );
};
