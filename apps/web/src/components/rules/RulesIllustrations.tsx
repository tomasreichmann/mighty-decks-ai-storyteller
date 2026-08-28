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
import { DieMarker } from "./DieMarker";
import styles from "./RulesRulebookContent.module.css";

const actorToken = "/actors/base/guard-blue.png";
const locationImage = "/rules/locations/courtyard.png";
const outcomeCardClassName = "w-[6rem]";
const locationExamples = [
  {
    title: "Castle Gate",
    imageUrl: "/rules/locations/castle-gate.png",
    occupant: "Mira",
  },
  {
    title: "Courtyard",
    imageUrl: "/rules/locations/courtyard.png",
    occupant: undefined,
  },
  {
    title: "Tower",
    imageUrl: "/rules/locations/tower.png",
    occupant: "Bandit",
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
  <figure className="stack gap-3 py-3 print:break-inside-avoid">
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

const RulebookCardFloat = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): JSX.Element => (
  <aside aria-label={label} className={styles.cardFloat}>
    {children}
  </aside>
);

export const DistressCardIllustration = (): JSX.Element => (
  <RulebookCardFloat label="Distress card illustration">
    <ResolvedCard type="EffectCard" slug="distress" />
  </RulebookCardFloat>
);

export const StuntCardIllustration = (): JSX.Element => (
  <RulebookCardFloat label="Stunt card illustration">
    <ResolvedCard type="StuntCard" slug="safecracker" />
  </RulebookCardFloat>
);

export const AssetCardIllustration = (): JSX.Element => (
  <RulebookCardFloat label="Asset card illustration">
    <ResolvedCard type="AssetCard" slug="base_tools" />
  </RulebookCardFloat>
);

export const ConsumableCardIllustration = (): JSX.Element => (
  <RulebookCardFloat label="Consumable card illustration">
    <ResolvedCard type="AssetCard" slug="base_healing" />
  </RulebookCardFloat>
);

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
        imageAlt="Medieval courtyard location"
        title="Courtyard"
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

export const FumbleBranches = (): JSX.Element => (
  <RulebookFigure
    title="Two valid Fumbles"
    summary="A Fumble can miss cleanly, or it can hit while creating a fitting consequence. The canonical example above gives the full rule text."
  >
    <div className="grid w-full items-start gap-4 md:grid-cols-[minmax(0,0.7fr)_auto_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="justify-self-center">
        <ResolvedCard type="OutcomeCard" slug="fumble" className="w-[8rem]" />
      </div>
      <span aria-hidden="true" className="hidden self-center font-heading text-2xl md:block">→</span>
      <div className="stack items-center gap-2 text-center">
        <Text variant="emphasised" color="blood">MISS</Text>
        <Text variant="note" color="iron-light">The arrow flies wide: no useful Effect.</Text>
      </div>
      <div className="stack items-center gap-2 text-center">
        <Text variant="emphasised" color="blood">HIT, BUT...</Text>
        <div className="flex flex-wrap justify-center gap-2">
          <ResolvedCard type="EffectCard" slug="injury" className="w-[6rem]" />
          <ResolvedCard type="AssetCard" slug="medieval_hunting_bow" className="w-[6rem]" />
          <ResolvedCard type="EffectCard" slug="complication" className="w-[6rem]" />
        </div>
        <Text variant="note" color="iron-light">1 Injury · Broken String · Action to repair</Text>
      </div>
    </div>
  </RulebookFigure>
);

export const CoreActionLoop = (): JSX.Element => (
  <RulebookFigure
    title="Core Action Loop"
    summary="Choose an Outcome, resolve it, refill the hand, then check the new hand for Catastrophe."
  >
    <ol className="sr-only">
      <li>Choose card from the three-card hand.</li>
      <li>Resolve Effect.</li>
      <li>Discard the played card.</li>
      <li>Draw replacement.</li>
      <li>Catastrophe check the refreshed hand.</li>
    </ol>
    <div className="grid w-full items-center gap-4 md:grid-cols-[minmax(18rem,1.5fr)_repeat(5,minmax(0,1fr))]">
      <div className="flex flex-wrap justify-center gap-2" aria-label="Three-card Outcome hand">
        <ResolvedCard type="OutcomeCard" slug="success" className="w-[5.5rem] -translate-y-2 ring-2 ring-kac-gold" />
        <ResolvedCard type="OutcomeCard" slug="partial-success" className="w-[5.5rem]" />
        <ResolvedCard type="OutcomeCard" slug="fumble" className="w-[5.5rem]" />
      </div>
      {[
        "Choose card",
        "Resolve Effect",
        "Discard",
        "Draw replacement",
        "Catastrophe check",
      ].map((step, index) => (
        <div key={step} className="flex min-h-16 flex-col items-center justify-center gap-1 text-center">
          {index > 0 ? <span aria-hidden="true" className="hidden font-heading text-xl md:block">→</span> : null}
          <Text variant="note" color="iron">{step}</Text>
        </div>
      ))}
    </div>
  </RulebookFigure>
);

export const ActorInitiative = (): JSX.Element => {
  const initiativeSlots = [
    { player: "Mira", actors: ["Guard", "Wolf"] },
    { player: "Aldren", actors: ["Bandit"] },
    { player: "Tomas", actors: [] },
  ] as const;

  return (
    <RulebookFigure
      title="Actor initiative"
      summary="Actors act immediately after the player they sit in front of. Multiple Actors may share a slot, and all act after that player."
    >
      <ol className="sr-only">
        <li>Mira</li><li>Guard</li><li>Wolf</li><li>Aldren</li><li>Bandit</li><li>Tomas</li>
      </ol>
      <div className="grid w-full gap-4 md:grid-cols-3">
        {initiativeSlots.map((slot, index) => (
          <div key={slot.player} className="stack items-center gap-2 text-center">
            <Token
              imageUrl={actorToken}
              imageAlt={`${slot.player} player token`}
              label={slot.player}
              color={index === 0 ? "fire" : index === 1 ? "gold" : "cloth"}
              size="md"
            />
            <div className="flex flex-wrap justify-center gap-2">
              {slot.actors.map((actor) => (
                <div key={actor} className="stack items-center gap-1">
                  <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="minion" className="w-[7rem]" />
                  <Text variant="note" color="iron">{actor}</Text>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </RulebookFigure>
  );
};

export const ZonesAndRange = (): JSX.Element => (
  <RulebookFigure
    title="Zones and range"
    summary="Castle Gate, Courtyard, and Tower are connected zones. A weapon's reach tells you how many zones away it can affect."
  >
    <div className="grid w-full gap-3 sm:grid-cols-3">
      {locationExamples.map((location) => (
        <div key={location.title} className="stack gap-2">
          <LocationCard imageUrl={location.imageUrl} imageAlt={`${location.title} medieval location`} title={location.title} description="A connected scene zone." />
          {location.occupant ? (
            <Token imageUrl={actorToken} imageAlt={`${location.occupant} at ${location.title}`} label={location.occupant} color={location.occupant === "Mira" ? "fire" : "monster"} size="sm" />
          ) : null}
        </div>
      ))}
    </div>
    <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-2 text-center">
      <Text variant="note" color="iron">Sword: same zone</Text>
      <Text variant="note" color="iron">Throw: +1 zone</Text>
      <Text variant="note" color="iron">Bow: +2 zones</Text>
      <Text variant="note" color="iron">Sniper: anywhere in sight</Text>
    </div>
  </RulebookFigure>
);

const toughnessStates = [
  [3, "Starting Toughness"],
  [1, "After 2 Injury"],
  [0, "After 1 Distress / Taken Out"],
] as const;

export const RemainingToughness = (): JSX.Element => (
  <RulebookFigure
    title="Remaining Toughness"
    summary="The same Actor moves from ready, to pressured, to Taken Out as its remaining Toughness is reduced."
  >
    {toughnessStates.map(([value, label]) => (
      <div key={String(label)} className="stack items-center gap-2">
        <div className="relative inline-flex">
          <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="brute" className="w-[8rem]" />
          <DieMarker sides={4} value={value} className="absolute -right-2 -top-2 z-10" />
        </div>
        <Text variant="note" color="iron">Bandit</Text>
        <Text variant="emphasised" color={value === 0 ? "blood" : "iron"}>{`${value} Toughness — ${label}`}</Text>
      </div>
    ))}
  </RulebookFigure>
);

export const CounterTracking = (): JSX.Element => (
  <RulebookFigure
    title="Counter tracking"
    summary="The Counter card tells you what its value means; the Actor's remaining Toughness is tracked separately. Dice track values; they are not rolled."
  >
    <div className="stack items-center gap-2">
      <div className="relative inline-flex">
        <CounterCard iconSlug="tracking" title="Ice Storm" currentValue={3} maxValue={4} className="w-[10rem]" />
        <DieMarker sides={4} value={3} className="absolute -right-2 -top-2 z-10" />
      </div>
      <Text variant="emphasised" color="iron">Counter value: 3 / 4</Text>
    </div>
    <div className="stack items-center gap-2">
      <div className="relative inline-flex">
        <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="minion" className="w-[9rem]" />
        <DieMarker sides={4} value={1} className="absolute -right-2 -top-2 z-10" />
      </div>
      <Text variant="note" color="iron">Bandit</Text>
      <Text variant="emphasised" color="blood">Remaining Toughness: 1</Text>
    </div>
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
  "core-action-loop": CoreActionLoop,
  actors: RemainingToughness,
  "turn-based-play": ActorInitiative,
  "locations-zones-movement-range": ZonesAndRange,
  catastrophe: CatastropheFlow,
  counters: CounterTracking,
};

export const rulebookIllustrationsBySubsectionId: Readonly<Record<string, () => JSX.Element>> = {
  "7-2-distress": DistressCardIllustration,
  "9-2-stunts": StuntCardIllustration,
  "9-3-assets": AssetCardIllustration,
  "9-4-consumables": ConsumableCardIllustration,
  "example-two-valid-fumbles": FumbleBranches,
};
