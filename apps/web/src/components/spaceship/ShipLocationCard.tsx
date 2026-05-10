import { useState } from "react";
import type { ShipLocationInstance } from "../../lib/spaceship/spaceshipTypes";
import { ActorToken } from "./ActorToken";
import { EnergyToken } from "./EnergyToken";
import { ShipEffectStack } from "./ShipEffectStack";
import { AssetCard } from "../cards/AssetCard";
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
  const device = location.device;
  const effectiveDeviceLevel = device
    ? Math.max(0, device.level - device.damage)
    : 0;
  const powerTokens =
    device && device.powerTokens.length > 0
      ? device.powerTokens
      : location.energyTokens;

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

      {device ? (
        <div className="grid items-start gap-3 rounded-sm border-2 border-kac-iron/30 bg-kac-bone-light/70 p-2 shadow-[2px_2px_0_0_#121b23] sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="origin-top-left scale-[0.72]">
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
          <div className="stack gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="cloth" size="sm">
                Device
              </Tag>
              {device.used ? (
                <Tag tone="blood" size="sm">
                  Used
                </Tag>
              ) : null}
            </div>
            <Text variant="emphasised" color="iron" className="text-sm">
              {device.title}
            </Text>
            <Text variant="note" color="iron-light" className="text-xs !opacity-100">
              Effective lvl {effectiveDeviceLevel} / max Power {device.maxPower}
            </Text>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        {powerTokens.map((energyToken) => (
          <EnergyToken
            key={energyToken.tokenId}
            label={energyToken.label}
            detail={energyToken.detail}
            state={energyToken.state}
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
