import type { ShipLocationInstance } from "../../lib/spaceship/spaceshipTypes";
import { ActorToken } from "./ActorToken";
import { EnergyToken } from "./EnergyToken";
import { ShipEffectStack } from "./ShipEffectStack";
import { cn } from "../../utils/cn";

interface ShipLocationCardProps {
  location: ShipLocationInstance;
}

export const ShipLocationCard = ({
  location,
}: ShipLocationCardProps): JSX.Element => {
  return (
    <article
      data-location-card
      className={cn(
        "ship-location-card relative min-h-[13.5rem] overflow-visible rounded-[1.1rem] border-[3px] border-kac-iron bg-[linear-gradient(180deg,rgba(255,250,240,0.96)_0%,rgba(244,233,213,0.98)_100%)] p-3 shadow-[5px_5px_0_0_#121b23]",
        location.row === "top" ? "origin-bottom" : "origin-top",
      )}
    >
      <ShipEffectStack effects={location.effects} row={location.row} />

      <div className="absolute inset-x-0 top-0 h-20 overflow-hidden rounded-t-[0.95rem] border-b-2 border-kac-iron bg-kac-iron/10">
        {location.imageUrl ? (
          <img
            src={location.imageUrl}
            alt={location.title}
            className="h-full w-full object-cover opacity-80"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,27,35,0.1)_0%,rgba(18,27,35,0.55)_100%)]" />
      </div>

      <div className="relative z-10 mt-16 flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex rotate-[-2deg] rounded-sm border-2 border-kac-iron bg-kac-gold px-2 py-1 font-heading text-[0.72rem] font-bold uppercase tracking-[0.06em] text-kac-iron shadow-[2px_2px_0_0_#121b23]">
            {location.locationType.replace(/-/g, " ")}
          </p>
          <h3 className="mt-2 font-heading text-[1.1rem] font-bold uppercase leading-tight text-kac-iron">
            {location.title}
          </h3>
        </div>

        <div className="rounded-full border-[3px] border-kac-iron bg-kac-fire-lightest px-3 py-1 text-center shadow-[2px_2px_0_0_#121b23]">
          <p className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.08em] text-kac-fire-dark">
            Lvl
          </p>
          <p className="font-heading text-[1.1rem] leading-none text-kac-iron">
            {location.level}
          </p>
        </div>
      </div>

      <p className="relative z-10 mt-3 font-ui text-[0.82rem] leading-snug text-kac-iron-light">
        {location.summary}
      </p>
      <p className="relative z-10 mt-2 font-ui text-[0.74rem] font-bold uppercase leading-snug tracking-[0.06em] text-kac-cloth-dark">
        {location.status}
      </p>

      <div className="relative z-10 mt-3 flex min-h-12 flex-wrap items-end gap-2">
        {location.energyTokens.map((energyToken) => (
          <EnergyToken
            key={energyToken.tokenId}
            label={energyToken.label}
            detail={energyToken.detail}
          />
        ))}
      </div>

      {location.actorTokens.length > 0 ? (
        <div className="pointer-events-none absolute inset-x-2 bottom-3 z-20 flex flex-wrap justify-end gap-2">
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
