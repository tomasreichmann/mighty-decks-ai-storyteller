import { GameCardView } from "../adventure-module/GameCardView";
import type { ReactNode } from "react";
import { ActorCard } from "../cards/ActorCard";
import { AssetCard } from "../cards/AssetCard";
import { CounterCard } from "../cards/CounterCard";
import { CardBoundary } from "../common/CardBoundary";
import { Token } from "../common/Token";
import { Text } from "../common/Text";
import { LocationCard } from "../styleguide/LocationCard";
import { resolveGameCard, type GameCardType } from "../../lib/markdownGameComponents";
import cargoHoldImage from "../../../../server/output/adventure-artifacts/cargo-hold-202afa0e160b9f892887.png";
import crewQuartersImage from "../../../../server/output/adventure-artifacts/crew-quarters-fb4b60ee93280b0a8dca.png";
import dockingBayImage from "../../../../server/output/adventure-artifacts/docking-bay-63de54ac4b3c469379e9.png";

const actorToken = "/actors/base/guard-blue.png";
const locationImage = cargoHoldImage;
const outcomeCardClassName = "w-[6rem]";
const locationExamples = [
  {
    title: "Docking Bay",
    imageUrl: dockingBayImage,
    reach: "Melee",
  },
  {
    title: "Cargo Hold",
    imageUrl: cargoHoldImage,
    reach: "Thrown",
  },
  {
    title: "Crew Quarters",
    imageUrl: crewQuartersImage,
    reach: "Ranged",
  },
] as const;

const RulebookFigure = ({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}): JSX.Element => (
  <figure className="stack gap-3 border-y-2 border-kac-iron/20 py-5 print:break-inside-avoid">
    <div className="flex flex-wrap items-center gap-2">{children}</div>
    <figcaption>
      <Text variant="note" color="iron-light">
        <strong className="text-kac-iron">{title}.</strong> {summary}
      </Text>
    </figcaption>
  </figure>
);

const ResolvedCard = ({
  type,
  slug,
  modifierSlug,
  className = "w-[9rem] max-w-full",
}: {
  type: GameCardType;
  slug: string;
  modifierSlug?: string;
  className?: string;
}): JSX.Element | null => {
  const gameCard = resolveGameCard(
    type,
    slug,
    undefined,
    undefined,
    undefined,
    modifierSlug,
  );
  if (!gameCard) {
    return null;
  }
  return (
    <CardBoundary label={`${gameCard.type} illustration failed`}>
      <GameCardView gameCard={gameCard} className={className} />
    </CardBoundary>
  );
};

export const EffectEquation = (): JSX.Element => (
  <div className="flex flex-wrap items-center justify-center gap-2 text-center font-heading text-xl font-bold text-kac-iron">
    <ResolvedCard type="AssetCard" slug="base_tools" modifierSlug="base_empowered" className="w-[8rem]" />
    <span aria-hidden="true" className="text-2xl">+</span>
    <ResolvedCard type="StuntCard" slug="safecracker" className="w-[8rem]" />
    <span aria-hidden="true" className="text-2xl">+</span>
    <ResolvedCard type="OutcomeCard" slug="success" className="w-[8rem]" />
    <span aria-hidden="true" className="text-2xl">=</span>
    <span className="rounded border-2 border-kac-iron bg-kac-gold px-3 py-2">5 Effect</span>
  </div>
);

export const CompleteTableSetup = (): JSX.Element => (
  <RulebookFigure
    title="Complete table setup"
    summary="Outcome hands, player components, shared locations, actors, and a counter stay visible at the table."
  >
    <div className="flex min-w-[12rem] flex-1 flex-col gap-2">
      <Text variant="emphasised" color="iron">Player lane</Text>
      <div className="flex flex-wrap gap-2">
        <ResolvedCard type="OutcomeCard" slug="success" className="w-[7.5rem]" />
        <ResolvedCard type="OutcomeCard" slug="partial-success" className="w-[7.5rem]" />
        <AssetCard baseAssetSlug="base_tools" className="w-[7.5rem]" />
      </div>
    </div>
    <div className="flex min-w-[12rem] flex-1 flex-col gap-2">
      <Text variant="emphasised" color="iron">Shared scene</Text>
      <LocationCard
        imageUrl={locationImage}
        imageAlt="Cargo hold location"
        title="Cargo Hold"
        description="A shared location for the scene."
        className="w-[13rem] max-w-full"
      />
      <div className="flex flex-wrap items-center gap-3">
        <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="minion" className="w-[8rem]" />
        <CounterCard iconSlug="tracking" title="Escape" currentValue={2} maxValue={4} className="w-[8rem]" />
      </div>
    </div>
  </RulebookFigure>
);

export const ComposedAssetEquation = (): JSX.Element => (
  <RulebookFigure
    title="Opening a locked place"
    summary="Tools and Empowered contribute 2 Effect on a Success; Safecracker adds 1 more, for 5 Effect when breaking into a locked place."
  >
    <EffectEquation />
  </RulebookFigure>
);

export const ActorInitiative = (): JSX.Element => (
  <RulebookFigure
    title="Actor initiative"
    summary="Players take turns, then the Storyteller resolves the active actors in the order that fits the scene."
  >
    <div className="flex flex-wrap items-center gap-3">
      <Token imageUrl={actorToken} imageAlt="Mira player token" label="Mira" color="fire" size="md" />
      <span aria-hidden="true" className="font-heading text-2xl">→</span>
      <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="minion" className="w-[8rem]" />
      <span aria-hidden="true" className="font-heading text-2xl">→</span>
      <Token imageUrl={actorToken} imageAlt="Aldren player token" label="Aldren" color="gold" size="md" />
    </div>
  </RulebookFigure>
);

export const ZonesAndRange = (): JSX.Element => (
  <RulebookFigure
    title="Zones and range"
    summary="Locations establish zones. Tokens show who is present; the action tells you whether its reach is melee, thrown, or ranged."
  >
    <div className="grid w-full gap-3 sm:grid-cols-3">
      {locationExamples.map((location) => (
        <div key={location.title} className="stack gap-2">
          <LocationCard imageUrl={location.imageUrl} imageAlt={`${location.title} location`} title={location.title} description={`${location.reach} reach marker.`} />
          <Token imageUrl={actorToken} imageAlt={`${location.title} actor`} label="Actor" color="monster" size="sm" />
        </div>
      ))}
    </div>
  </RulebookFigure>
);

export const RemainingToughness = (): JSX.Element => (
  <RulebookFigure
    title="Remaining Toughness"
    summary="The same Actor moves from ready, to pressured, to Taken Out as its remaining Toughness is reduced."
  >
    {[
      [3, "Ready"],
      [1, "Injury"],
      [0, "Taken Out"],
    ].map(([value, label]) => (
      <div key={String(label)} className="stack items-center gap-2">
        <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="brute" className="w-[8rem]" />
        <Text variant="emphasised" color={value === 0 ? "blood" : "iron"}>{`${value} Toughness — ${label}`}</Text>
      </div>
    ))}
  </RulebookFigure>
);

export const CounterTracking = (): JSX.Element => (
  <RulebookFigure
    title="Counter tracking"
    summary="The Counter card tells you what its value means; the Actor's remaining Toughness is tracked separately."
  >
    <CounterCard iconSlug="tracking" title="Raise the Portcullis" currentValue={3} maxValue={4} className="w-[10rem]" />
    <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="minion" className="w-[9rem]" />
    <Text variant="emphasised" color="blood">1 remaining Toughness</Text>
  </RulebookFigure>
);

export const CatastropheFlow = (): JSX.Element => (
  <RulebookFigure
    title="Catastrophe flow"
    summary="Finish the current resolution, draw a replacement, then resolve three Fumbles as a dramatic crisis."
  >
    <ResolvedCard type="OutcomeCard" slug="success" className={outcomeCardClassName} />
    <span aria-hidden="true" className="font-heading text-2xl">→</span>
    <span className="rounded border-2 border-kac-iron bg-kac-bone-light px-3 py-2 font-ui text-sm">Draw replacement</span>
    <span aria-hidden="true" className="font-heading text-2xl">→</span>
    <div className="flex gap-1">
      {[0, 1, 2].map((index) => <ResolvedCard key={index} type="OutcomeCard" slug="fumble" className={outcomeCardClassName} />)}
    </div>
    <span aria-hidden="true" className="font-heading text-2xl">→</span>
    <span className="rounded border-2 border-kac-blood-dark bg-kac-fire-light px-3 py-2 font-ui text-sm">Injury / Asset Complication / Enemy Boost</span>
  </RulebookFigure>
);

export const rulebookIllustrationsBySectionId: Readonly<Record<string, () => JSX.Element>> = {
  "what-you-need-to-play": CompleteTableSetup,
  effect: EffectEquation,
  "characters-expertise-stunts-assets": ComposedAssetEquation,
  actors: RemainingToughness,
  "turn-based-play": ActorInitiative,
  "locations-zones-movement-range": ZonesAndRange,
  catastrophe: CatastropheFlow,
  counters: CounterTracking,
};
