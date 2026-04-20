import { ActorCard } from "../cards/ActorCard";
import type { ShipActorInstance } from "../../lib/spaceship/spaceshipTypes";
import { ActorToken } from "./ActorToken";
import { ShipEffectCardPile } from "./ShipEffectStack";

interface SpaceshipActorStripProps {
  actors: ShipActorInstance[];
}

export const SpaceshipActorStrip = ({
  actors,
}: SpaceshipActorStripProps): JSX.Element => {
  return (
    <section
      data-actor-strip
      className="spaceship-actor-strip grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {actors.map((actor) => (
        <article
          key={actor.actorId}
          className="relative flex min-h-[18.5rem] flex-col items-center justify-end"
        >
          <div className="absolute inset-x-2 bottom-0 z-0 flex flex-col items-center gap-2">
            <ShipEffectCardPile effectType="injury" count={actor.injuryCount} />
            <ShipEffectCardPile effectType="distress" count={actor.distressCount} />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3">
            <ActorCard
              className="w-full max-w-[12rem]"
              baseLayerSlug={actor.baseLayerSlug}
              tacticalRoleSlug={actor.tacticalRoleSlug}
            />
            <ActorToken
              label={actor.token.label}
              imageUrl={actor.token.imageUrl}
              title={actor.token.title}
              subtitle={actor.token.subtitle}
              tone={actor.token.tone}
            />
            <p className="max-w-[13rem] text-center font-ui text-[0.72rem] leading-snug text-kac-iron-light">
              {actor.callout}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
};
