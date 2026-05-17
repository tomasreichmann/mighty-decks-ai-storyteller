import { ActorCard } from "../cards/ActorCard";
import type { ShipActorInstance } from "../../lib/spaceship/scene/types";
import type { ShipEffectType } from "../../lib/spaceship/scene/types";
import { ShipEffectCardSurface } from "./ShipEffectStack";

interface SpaceshipActorStripProps {
  actors: ShipActorInstance[];
}

interface SpaceshipActorPartProps {
  actor: ShipActorInstance;
}

interface SpaceshipActorEffectSurfaceProps {
  effectType: ShipEffectType;
}

export const SpaceshipActorEffectSurface = ({
  effectType,
}: SpaceshipActorEffectSurfaceProps): JSX.Element | null => {
  return <ShipEffectCardSurface effectType={effectType} />;
};

export const SpaceshipActorCardSurface = ({
  actor,
}: SpaceshipActorPartProps): JSX.Element => {
  if (actor.customCard) {
    return (
      <ActorCard
        kind="custom"
        className="w-full max-w-none"
        custom={actor.customCard}
      />
    );
  }

  return (
    <ActorCard
      className="w-full max-w-none"
      baseLayerSlug={actor.baseLayerSlug}
      tacticalRoleSlug={actor.tacticalRoleSlug}
    />
  );
};

export const SpaceshipActorStrip = ({
  actors,
}: SpaceshipActorStripProps): JSX.Element => {
  return (
    <section
      data-actor-strip
      className="spaceship-actor-strip grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {actors.map((actor) => (
        <div key={actor.actorId} className="flex flex-col items-center gap-3">
          <SpaceshipActorEffectSurface effectType="injury" />
          <SpaceshipActorEffectSurface effectType="distress" />
          <SpaceshipActorCardSurface actor={actor} />
        </div>
      ))}
    </section>
  );
};

