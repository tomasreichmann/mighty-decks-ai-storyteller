import type { ReactNode } from "react";
import type { BoardItemRecord } from "../lib/board/boardController";
import type { GameCardType } from "../lib/markdownGameComponents";
import type {
  ShipActorInstance,
  ShipLocationInstance,
} from "../lib/spaceship/scene/types";
import { Board } from "../components/board/Board";
import { BoardFrame } from "../components/board/BoardFrame";
import { BoardProvider } from "../components/board/BoardProvider";
import { GameCardView } from "../components/adventure-module/GameCardView";
import { ActorCard } from "../components/cards/ActorCard";
import { AssetCard } from "../components/cards/AssetCard";
import { CounterCard } from "../components/cards/CounterCard";
import { CardBoundary } from "../components/common/CardBoundary";
import { Heading } from "../components/common/Heading";
import { Panel } from "../components/common/Panel";
import { Token } from "../components/common/Token";
import { Text } from "../components/common/Text";
import { ActorToken } from "../components/spaceship/ActorToken";
import { EnergyToken } from "../components/spaceship/EnergyToken";
import { ShipEffectCardSurface } from "../components/spaceship/ShipEffectStack";
import { ShipLocationCardSurface } from "../components/spaceship/ShipLocationCard";
import { SpaceshipActorCardSurface } from "../components/spaceship/SpaceshipActorStrip";
import { LocationCard } from "../components/styleguide/LocationCard";
import { StyleguideBackLink } from "../components/styleguide/GameCard";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";
import { resolveGameCard } from "../lib/markdownGameComponents";
import {
  canonicalBoardExample,
  layoutRecipeExamples,
  rulesIllustrationExample,
  spaceshipCompositionExample,
  type StyleguideBoardExample,
} from "./styleguideBoardExamples";

const StaticBoardExample = ({
  example,
  ariaLabel,
  renderItem,
}: {
  example: StyleguideBoardExample;
  ariaLabel: string;
  renderItem?: (item: BoardItemRecord) => ReactNode;
}): JSX.Element => (
  <BoardProvider boardSize={example.boardSize} initialItems={example.items}>
    <BoardFrame
      interactive={false}
      ariaLabel={ariaLabel}
      className="h-[18rem] w-full flex-none sm:h-[22rem]"
    >
      <Board renderItem={renderItem} />
    </BoardFrame>
  </BoardProvider>
);

const ResolvedBoardCard = ({
  type,
  slug,
  modifierSlug,
}: {
  type: GameCardType;
  slug: string;
  modifierSlug?: string;
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
    <CardBoundary label={`${gameCard.type} board example failed`}>
      <GameCardView gameCard={gameCard} className="w-full" />
    </CardBoundary>
  );
};

const styleguideShipLocation: ShipLocationInstance = {
  locationId: "styleguide-engine-room",
  title: "Engine Room",
  locationType: "engine-room",
  level: 2,
  row: "bottom",
  summary: "A hot engine deck keeps the Corvette moving through a debris field.",
  status: "Strained",
  imageUrl: "/maps/exiles-ship.png",
  effects: [],
  energyTokens: [],
  actorTokens: [],
  device: {
    deviceId: "styleguide-engines",
    title: "Thruster array",
    type: "engines",
    level: 2,
    damage: 0,
    used: false,
    maxPower: 3,
    powerTokens: [],
    asset: {
      deck: "ship",
      modifier: "Stabilized",
      noun: "Thruster Array",
      nounDescription: "Spend Energy to close or hold range.",
      adjectiveDescription: "Ignores the first drift complication.",
      iconUrl: "/assets/scifi/engines.png",
    },
  },
  lastTouchedOrder: 0,
};

const styleguideShipActor: ShipActorInstance = {
  actorId: "styleguide-pilot",
  name: "Mara Venn",
  callout: "Pilot",
  baseLayerSlug: "commander",
  tacticalRoleSlug: "commando",
  token: {
    tokenId: "styleguide-pilot-token",
    label: "Mara",
    imageUrl: "/actors/base/commander.png",
    tone: "gold",
  },
  injuryCount: 0,
  distressCount: 0,
  lastTouchedOrder: 0,
};

const renderCanonicalItem = (item: BoardItemRecord): ReactNode => {
  switch (item.id) {
    case "canonical-location":
      return (
        <LocationCard
          imageUrl="/rules/locations/castle-gate.png"
          imageAlt="Castle Gate location"
          title="Castle Gate"
          description="The shared scene anchor."
          className="w-full"
        />
      );
    case "canonical-effect":
      return <ResolvedBoardCard type="EffectCard" slug="injury" />;
    case "canonical-actor":
      return (
        <ActorCard
          baseLayerSlug="guard_blue"
          tacticalRoleSlug="brute"
          className="w-full"
        />
      );
    case "canonical-counter":
      return (
        <CounterCard
          iconSlug="tracking"
          title="Rising Alarm"
          currentValue={2}
          maxValue={4}
          description="Escalates when the guards regroup."
          className="w-full"
        />
      );
    case "canonical-token":
      return (
        <Token
          imageUrl="/actors/base/specialist.png"
          imageAlt="Scout token"
          label="Scout"
          color="cloth"
          size="sm"
        />
      );
    default:
      return null;
  }
};

const renderSpaceshipItem = (item: BoardItemRecord): ReactNode => {
  switch (item.id) {
    case "spaceship-effect":
      return <ShipEffectCardSurface effectType="burning" />;
    case "spaceship-location":
      return <ShipLocationCardSurface location={styleguideShipLocation} />;
    case "spaceship-device":
      return (
        <AssetCard
          kind="custom"
          deck={styleguideShipLocation.device?.asset.deck}
          modifier={styleguideShipLocation.device?.asset.modifier ?? ""}
          noun={styleguideShipLocation.device?.asset.noun ?? ""}
          nounDescription={styleguideShipLocation.device?.asset.nounDescription ?? ""}
          adjectiveDescription={styleguideShipLocation.device?.asset.adjectiveDescription ?? ""}
          iconUrl={styleguideShipLocation.device?.asset.iconUrl ?? ""}
          className="w-full"
        />
      );
    case "spaceship-energy-token":
      return <EnergyToken label="2" detail="Available engine energy" />;
    case "spaceship-actor-token":
      return (
        <ActorToken
          label="Mara"
          imageUrl={styleguideShipActor.token.imageUrl}
          tone="gold"
          size="sm"
        />
      );
    case "spaceship-actor-card":
      return <SpaceshipActorCardSurface actor={styleguideShipActor} />;
    default:
      return null;
  }
};

const renderRulesItem = (item: BoardItemRecord): ReactNode => {
  switch (item.id) {
    case "rules-location":
      return (
        <LocationCard
          imageUrl="/rules/locations/courtyard.png"
          imageAlt="Courtyard location"
          title="Courtyard"
          description="The contested centre of the scene."
          className="w-full"
        />
      );
    case "rules-counter":
      return (
        <CounterCard
          iconSlug="tracking"
          title="Alarm"
          currentValue={3}
          maxValue={4}
          description="One step from reinforcements."
          className="w-full"
        />
      );
    case "rules-actor":
      return (
        <ActorCard
          baseLayerSlug="guard_blue"
          tacticalRoleSlug="minion"
          className="w-full"
        />
      );
    default:
      return item.id.startsWith("rules-outcome") ? (
        <ResolvedBoardCard type="OutcomeCard" slug="success" />
      ) : null;
  }
};

export const StyleguideBoardPage = (): JSX.Element => {
  return (
    <div className="styleguide-board-page app-shell stack gap-8 py-8">
      <StyleguideBackLink />
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Heading level="h1" color="iron" className="text-[2.4rem] leading-none sm:text-[3.4rem]">
          Board composition
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          A read-only reference for turning local fixture data into responsive,
          reusable board and rulebook figures with the same pieces used in play.
        </Text>
      </div>

      <section className="stack gap-3">
        <Heading level="h2" color="iron">
          Board anatomy
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Build a figure as local fixture data, run it through a pure layout
          helper, flatten the placements into board items, then pass them to
          BoardProvider and Board. Keep route controls and explanatory captions
          outside the transformed board; use renderItem only to swap a flat item
          for a canonical component.
        </Text>
      </section>

      <section className="stack gap-4">
        <div className="stack gap-1">
          <Heading level="h2" color="iron">
            Layout recipes
          </Heading>
          <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
            Pick a layout helper for geometry, then render its final placements
            as one flat item list.
          </Text>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {layoutRecipeExamples.map((example) => (
            <figure key={example.id} className="stack gap-3">
              <StaticBoardExample
                example={example}
                ariaLabel={`${example.layout} layout recipe`}
              />
              <figcaption className="stack gap-1">
                <Text variant="h3" color="iron">{example.layout}</Text>
                <Text variant="note" color="iron-light">Use when: {example.useWhen}</Text>
                <Text variant="note" color="iron-light">Key options: {example.keyOptions}</Text>
                <Text variant="note" color="blood">Common mistake: {example.commonMistake}</Text>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="stack gap-3">
        <div className="stack gap-1">
          <Heading level="h2" color="iron">
            Canonical game components
          </Heading>
          <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
            Scale and place existing cards and markers. Do not recreate their
            faces in a custom board shell.
          </Text>
        </div>
        <StaticBoardExample
          example={canonicalBoardExample}
          ariaLabel="Canonical board components"
          renderItem={renderCanonicalItem}
        />
      </section>

      <section className="stack gap-3">
        <div className="stack gap-1">
          <Heading level="h2" color="iron">
            Spaceship-derived composition
          </Heading>
          <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
            Effects sit behind their owner, devices sit above the Location, and
            energy and actor tokens sit above both. The figure stays a flat
            placement list even though it communicates ownership.
          </Text>
        </div>
        <div className="pointer-events-none">
          <StaticBoardExample
            example={spaceshipCompositionExample}
            ariaLabel="Static spaceship composition"
            renderItem={renderSpaceshipItem}
          />
        </div>
      </section>

      <section className="stack gap-3">
        <div className="stack gap-1">
          <Heading level="h2" color="iron">
            Rules illustration recipe
          </Heading>
          <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
            Treat a rulebook figure as a bounded, captioned board: let the frame
            refit responsively, keep its copy outside the transformed surface,
            and reuse canonical cards before adding custom decoration.
          </Text>
        </div>
        <figure className="stack gap-3">
          <StaticBoardExample
            example={rulesIllustrationExample}
            ariaLabel="Rules illustration recipe"
            renderItem={renderRulesItem}
          />
          <figcaption>
            <Text variant="note" color="iron-light">
              Caption the figure with the rule it teaches, not the coordinates
              used to lay it out.
            </Text>
          </figcaption>
        </figure>
      </section>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">Authoring checklist</Text>
        <ul className="list-disc space-y-1 pl-5 font-ui text-sm leading-snug text-kac-iron-light">
          <li>Keep fixture data local to the route or rulebook section that owns the teaching example.</li>
          <li>Use a pure layout helper, then flatten its result before rendering.</li>
          <li>Use interactive={"{false}"} only for illustrations that should preserve page scrolling.</li>
          <li>Reuse canonical cards, tokens, and spaceship surfaces instead of copying their visual treatment.</li>
        </ul>
      </Panel>

      <StyleguideBackLink />
    </div>
  );
};
