import { ActorCard as PackageActorCard, GameCard } from "@mighty-decks/components/react";
import type { ReactNode } from "react";
import { AssetCard } from "../cards/AssetCard";
import { AssetModifierCard } from "../cards/AssetModifierCard";
import { CardBoundary } from "../common/CardBoundary";
import { Text } from "../common/Text";

const Part = ({ label, children }: { label: string; children: ReactNode }): JSX.Element => (
  <li className="stack min-w-0 items-center gap-2 text-center">
    <span className="flex min-h-[3.75rem] items-end justify-center font-heading text-sm font-bold leading-5 text-kac-iron">{label}</span>
    {children}
  </li>
);

const Arrow = (): JSX.Element => <span aria-hidden="true" className="hidden self-center font-heading text-2xl text-kac-iron md:block">+</span>;

export const ActorCompositionFigure = (): JSX.Element => (
  <figure aria-label="Building an Actor card" className="stack gap-4 py-3 print:break-inside-avoid">
    <ol className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto_minmax(0,1fr)]">
      <Part label="1. Base — Civilian">
        <CardBoundary label="Civilian base card failed">
          <GameCard type="actor-base" slug="civilian" className="w-[11rem] max-w-full" />
        </CardBoundary>
      </Part>
      <Part label="2. Tactical role — Minion">
        <CardBoundary label="Minion role card failed">
          <GameCard type="actor-role" slug="minion" className="w-[11rem] max-w-full" />
        </CardBoundary>
      </Part>
      <Part label="3. Tactical special — Fast">
        <CardBoundary label="Fast special card failed">
          <GameCard type="actor-special" slug="fast" className="w-[11rem] max-w-full" />
        </CardBoundary>
      </Part>
      <Arrow />
      <Part label="Assembled Actor — Fast Minion">
        <CardBoundary label="Fast Minion Actor card failed">
          <PackageActorCard baseLayerSlug="civilian" tacticalRoleSlug="minion" tacticalSpecialSlug="fast" className="w-[11rem] max-w-full" />
        </CardBoundary>
      </Part>
    </ol>
    <figcaption className="stack gap-1">
      <Text variant="note" color="iron-light">Civilian supplies the illustration. Minion supplies the title and mechanics. Fast supplies the overlay and its movement rule.</Text>
      <span className="font-ui text-sm text-kac-iron-light">Toughness: 2. Melee: 1 Injury. Ranged: 1 Injury at range 1–2. Fast: Moves an extra zone per turn.</span>
    </figcaption>
  </figure>
);

export const AssetCompositionFigure = (): JSX.Element => (
  <figure aria-label="Building an Asset card" className="stack gap-4 py-3 print:break-inside-avoid">
    <ol className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(2,minmax(0,1fr))_auto_minmax(0,1fr)]">
      <Part label="1. Tools — complete without a modifier">
        <CardBoundary label="Tools Asset card failed">
          <AssetCard baseAssetSlug="base_tools" className="w-[11rem] max-w-full" />
        </CardBoundary>
      </Part>
      <Part label="2. Optional modifier — Empowered">
        <CardBoundary label="Empowered modifier card failed">
          <AssetModifierCard modifierSlug="base_empowered" className="w-[11rem] max-w-full" />
        </CardBoundary>
      </Part>
      <Arrow />
      <Part label="Assembled Asset — Empowered Tools">
        <CardBoundary label="Empowered Tools Asset card failed">
          <AssetCard baseAssetSlug="base_tools" modifierSlug="base_empowered" className="w-[11rem] max-w-full" />
        </CardBoundary>
      </Part>
    </ol>
    <figcaption className="stack gap-1">
      <span className="font-ui text-sm text-kac-iron-light">Tools: +1 Effect on an action while using a tool to work. Empowered: +1 Effect on Success or better. Each applies once.</span>
      <span className="font-ui text-sm text-kac-iron-light">Success: 4 Effect when using Tools to work. Partial Success: 2 Effect; Empowered does not apply.</span>
    </figcaption>
  </figure>
);
