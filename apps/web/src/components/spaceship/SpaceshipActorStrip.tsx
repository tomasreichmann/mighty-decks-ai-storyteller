import { ActorCard } from "../cards/ActorCard";
import type { ShipActorInstance } from "../../lib/spaceship/spaceshipTypes";
import { ActorToken } from "./ActorToken";

interface SpaceshipActorStripProps {
  actors: ShipActorInstance[];
}

const ConsequenceStack = ({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "injury" | "distress";
}): JSX.Element | null => {
  if (count <= 0) {
    return null;
  }

  const colorClass =
    tone === "injury"
      ? "border-kac-fire-dark bg-kac-fire-lightest text-kac-fire-dark"
      : "border-kac-blood-dark bg-kac-blood-lightest text-kac-blood-dark";

  return (
    <div className="absolute inset-x-2 top-0 z-0 flex flex-col gap-1">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`${label}-${index}`}
          className={`${colorClass} h-10 rounded-sm border-2 px-2 pt-1 shadow-[2px_2px_0_0_#121b23]`}
          style={{ transform: `translateY(${index * 11}px)` }}
        >
          <p className="font-heading text-[0.72rem] font-bold uppercase leading-none">
            {label}
          </p>
        </div>
      ))}
    </div>
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
        <article
          key={actor.actorId}
          className="relative flex min-h-[17rem] flex-col items-center justify-end"
        >
          <ConsequenceStack label="Injury" count={actor.injuryCount} tone="injury" />
          <ConsequenceStack label="Distress" count={actor.distressCount} tone="distress" />

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
