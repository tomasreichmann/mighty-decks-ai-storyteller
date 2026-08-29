import type { ReactNode } from "react";
import { GameCardView } from "../adventure-module/GameCardView";
import { StaticBoardFigure } from "../board/StaticBoardFigure";
import { ActorCard } from "../cards/ActorCard";
import { AssetCard } from "../cards/AssetCard";
import { CounterCard } from "../cards/CounterCard";
import { OutcomeCard } from "../cards/OutcomeCard";
import { CardBoundary } from "../common/CardBoundary";
import { Label } from "../common/Label";
import { Token } from "../common/Token";
import { Text } from "../common/Text";
import { LocationCard } from "../styleguide/LocationCard";
import type { BoardItemRecord } from "../../lib/board/boardController";
import {
  resolveGameCard,
  type GameCardType,
} from "../../lib/markdownGameComponents";
import { DieMarker } from "./DieMarker";
import {
  completeTableSetupBoard,
  completeTableSetupMobileBoard,
  actorInitiativeBoard,
  actorInitiativeMobileBoard,
  coreActionLoopBoard,
  coreActionLoopMobileBoard,
  zonesAndRangeBoard,
  zonesAndRangeMobileBoard,
  catastropheFlowBoard,
  catastropheFlowMobileBoard,
  statusThresholdsBoard,
  statusThresholdsMobileBoard,
  fumbleBranchesBoard,
  fumbleBranchesMobileBoard,
} from "./rulesBoardExamples";

const boardBackground = "/backgrounds/board.jpg";

const RulebookBoardFigure = ({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}): JSX.Element => (
  <figure className="stack gap-3 py-3 print:break-inside-avoid">
    {children}
    <figcaption>
      <Text variant="note" color="iron-light">
        <strong className="text-kac-iron">{title}.</strong> {summary}
      </Text>
    </figcaption>
  </figure>
);

const ResolvedBoardCard = ({
  type,
  slug,
}: {
  type: GameCardType;
  slug: string;
}): JSX.Element | null => {
  const gameCard = resolveGameCard(type, slug);

  if (!gameCard) {
    return null;
  }

  return (
    <CardBoundary label={`${gameCard.type} board example failed`}>
      <GameCardView gameCard={gameCard} className="w-full" />
    </CardBoundary>
  );
};

const setupHandCardById: Record<string, string> = {
  "setup-mira-hand-first": "success",
  "setup-mira-hand-second": "partial-success",
  "setup-mira-hand-third": "fumble",
  "setup-aldren-hand-first": "special-action",
  "setup-aldren-hand-second": "success",
  "setup-aldren-hand-third": "chaos",
  "setup-tomas-hand-first": "partial-success",
  "setup-tomas-hand-second": "success",
  "setup-tomas-hand-third": "fumble",
};

const renderCompleteTableItem = (item: BoardItemRecord): ReactNode => {
  switch (item.id) {
    case "setup-shared-label":
      return <Label color="cloth" rotate={false} className="w-full justify-center">Shared scene</Label>;
    case "setup-deck-label":
      return <Label color="steel" rotate={false} className="w-full justify-center">Outcome deck</Label>;
    case "setup-mobile-deck-label":
      return <Label color="steel" rotate={false} className="w-full justify-center">Deck</Label>;
    case "setup-location-gate":
      return <LocationCard imageUrl="/rules/locations/castle-gate.png" imageAlt="Castle Gate location" title="Castle Gate" description="Shared zone." className="w-full" />;
    case "setup-location-courtyard":
      return <LocationCard imageUrl="/rules/locations/courtyard.png" imageAlt="Courtyard location" title="Courtyard" description="Shared zone." className="w-full" />;
    case "setup-location-tower":
      return <LocationCard imageUrl="/rules/locations/tower.png" imageAlt="Tower location" title="Tower" description="Shared zone." className="w-full" />;
    case "setup-counter":
      return <div className="relative"><CounterCard iconSlug="tracking" title="Reinforcements" currentValue={2} maxValue={4} className="w-full" /><DieMarker sides={4} value={2} className="!absolute right-1 top-1 z-20" /></div>;
    case "setup-actor-guard":
      return <div className="relative"><ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="brute" className="w-full" /><DieMarker sides={4} value={3} className="!absolute right-1 top-1 z-20" /></div>;
    case "setup-outcome-deck-bottom":
    case "setup-outcome-deck-middle":
    case "setup-outcome-deck":
      return <OutcomeCard card="success" face="back" className="w-full" />;
    case "setup-mira-label":
      return <Label color="fire" rotate={false} className="w-full justify-center">Mira's space</Label>;
    case "setup-mobile-player-label":
      return <Label color="fire" rotate={false} className="w-full justify-center">Mira's space · repeat for every player</Label>;
    case "setup-aldren-label":
      return <Label color="gold" rotate={false} className="w-full justify-center">Aldren's space</Label>;
    case "setup-tomas-label":
      return <Label color="skin" rotate={false} className="w-full justify-center">Tomas's space</Label>;
    case "setup-mira-token":
      return <Token imageUrl="/actors/base/specialist.png" imageAlt="Mira player token" label="Mira" color="fire" size="sm" />;
    case "setup-aldren-token":
      return <Token imageUrl="/actors/base/guard-yellow.png" imageAlt="Aldren player token" label="Aldren" color="gold" size="sm" />;
    case "setup-tomas-token":
      return <Token imageUrl="/actors/base/healer.png" imageAlt="Tomas player token" label="Tomas" color="skin" size="sm" />;
    case "setup-mira-owned":
      return <ResolvedBoardCard type="StuntCard" slug="marksman" />;
    case "setup-aldren-owned":
      return <ResolvedBoardCard type="EffectCard" slug="injury" />;
    case "setup-tomas-owned":
      return <AssetCard kind="custom" noun="Throwing Knife" modifier="Returning" nounDescription="A light thrown weapon." adjectiveDescription="Returns after a throw." iconUrl="/assets/medieval/dagger.png" overlayUrl="/assets/base/empowered.png" className="w-full" />;
    default: {
      const slug = setupHandCardById[item.id];
      return slug ? <ResolvedBoardCard type="OutcomeCard" slug={slug} /> : null;
    }
  }
};

export const CompleteTableSetup = (): JSX.Element => (
  <RulebookBoardFigure title="Complete table setup" summary="The shared scene stays in the middle, while every player keeps their own Outcome hand and personal cards in a clearly owned space.">
    <StaticBoardFigure boardSize={completeTableSetupMobileBoard.boardSize} items={completeTableSetupMobileBoard.items} ariaLabel="Complete Mighty Decks table setup showing the shared scene and one repeatable player space" backgroundImageUrl={boardBackground} className="h-[32rem] w-full flex-none sm:hidden" renderItem={renderCompleteTableItem} />
    <StaticBoardFigure boardSize={completeTableSetupBoard.boardSize} items={completeTableSetupBoard.items} ariaLabel="Complete Mighty Decks table setup with shared scene and player-owned spaces" backgroundImageUrl={boardBackground} className="hidden h-[30rem] w-full flex-none sm:block" renderItem={renderCompleteTableItem} />
  </RulebookBoardFigure>
);

const renderCoreActionLoopItem = (item: BoardItemRecord): ReactNode => {
  switch (item.id) {
    case "loop-step-choose":
      return <Label color="gold" rotate={false} className="w-full justify-center">1 · Choose card</Label>;
    case "loop-step-resolve":
      return <Label color="fire" rotate={false} className="w-full justify-center">2 · Resolve Effect</Label>;
    case "loop-step-discard":
      return <Label color="cloth" rotate={false} className="w-full justify-center">3 · Discard</Label>;
    case "loop-step-draw":
      return <Label color="steel" rotate={false} className="w-full justify-center">4 · Draw replacement</Label>;
    case "loop-step-check":
      return <Label color="blood" rotate={false} className="w-full justify-center">5 · Catastrophe check</Label>;
    case "loop-arrow-choose-resolve":
    case "loop-arrow-resolve-discard":
    case "loop-arrow-discard-draw":
    case "loop-arrow-draw-check":
      return <span aria-hidden="true" className="flex h-full items-center justify-center font-heading text-4xl text-kac-iron">→</span>;
    case "loop-initial-first":
      return <ResolvedBoardCard type="OutcomeCard" slug="success" />;
    case "loop-initial-second":
      return <ResolvedBoardCard type="OutcomeCard" slug="partial-success" />;
    case "loop-initial-third":
      return <ResolvedBoardCard type="OutcomeCard" slug="fumble" />;
    case "loop-selected":
      return <ResolvedBoardCard type="OutcomeCard" slug="success" />;
    case "loop-discard":
      return <ResolvedBoardCard type="OutcomeCard" slug="success" />;
    case "loop-deck-bottom":
    case "loop-deck-middle":
    case "loop-deck":
      return <OutcomeCard card="success" face="back" className="w-full" />;
    case "loop-refreshed-first":
      return <ResolvedBoardCard type="OutcomeCard" slug="partial-success" />;
    case "loop-refreshed-second":
      return <ResolvedBoardCard type="OutcomeCard" slug="success" />;
    case "loop-refreshed-third":
      return <ResolvedBoardCard type="OutcomeCard" slug="fumble" />;
    case "loop-selected-detail":
      return <Label color="fire" rotate={false} className="w-full justify-center">Apply the Effect</Label>;
    case "loop-discard-detail":
      return <Label color="cloth" rotate={false} className="w-full justify-center">Played card leaves play</Label>;
    case "loop-deck-detail":
      return <Label color="steel" rotate={false} className="w-full justify-center">Refill the hand to three</Label>;
    case "loop-catastrophe-rule":
      return <Label color="blood" rotate={false} className="w-full justify-center">Check only after drawing: three Fumbles trigger a Catastrophe.</Label>;
    default:
      return null;
  }
};

export const CoreActionLoop = (): JSX.Element => (
  <RulebookBoardFigure title="Core Action Loop" summary="Choose an Outcome, resolve it, discard it, refill the hand, then check the refreshed hand for Catastrophe.">
    <ol className="sr-only">
      <li>Choose a card from the Outcome hand.</li>
      <li>Resolve its Effect.</li>
      <li>Discard the played card.</li>
      <li>Draw a replacement card.</li>
      <li>Check the refreshed hand for Catastrophe.</li>
    </ol>
    <StaticBoardFigure boardSize={coreActionLoopMobileBoard.boardSize} items={coreActionLoopMobileBoard.items} ariaLabel="Core action loop from choosing an Outcome card to checking the refreshed hand" backgroundImageUrl={boardBackground} className="h-[34rem] w-full flex-none sm:hidden" renderItem={renderCoreActionLoopItem} />
    <StaticBoardFigure boardSize={coreActionLoopBoard.boardSize} items={coreActionLoopBoard.items} ariaLabel="Core action loop from choosing an Outcome card to checking the refreshed hand" backgroundImageUrl={boardBackground} className="hidden h-[28rem] w-full flex-none sm:block" renderItem={renderCoreActionLoopItem} />
  </RulebookBoardFigure>
);

const renderActorInitiativeItem = (item: BoardItemRecord): ReactNode => {
  switch (item.id) {
    case "initiative-mira-slot":
      return <Label color="fire" rotate={false} className="w-full justify-center">Mira's turn · then every Actor in front</Label>;
    case "initiative-aldren-slot":
      return <Label color="gold" rotate={false} className="w-full justify-center">Aldren's turn · then their Actor</Label>;
    case "initiative-round-order":
      return <Label color="cloth" rotate={false} className="w-full justify-center">Bandit → Tomas · then repeat the agreed player order.</Label>;
    case "initiative-arrow-mira-guard":
    case "initiative-arrow-guard-wolf":
    case "initiative-arrow-wolf-aldren":
    case "initiative-arrow-aldren-bandit":
    case "initiative-arrow-bandit-tomas":
      return <span aria-hidden="true" className="flex h-full items-center justify-center font-heading text-3xl text-kac-iron">→</span>;
    case "initiative-arrow-wolf-aldren-mobile":
    case "initiative-arrow-bandit-tomas-mobile":
      return <span aria-hidden="true" className="flex h-full items-center justify-center font-heading text-2xl text-kac-iron">↓</span>;
    case "initiative-mira":
      return <Token imageUrl="/actors/base/specialist.png" imageAlt="Mira player token" label="Mira" color="fire" size="sm" />;
    case "initiative-aldren":
      return <Token imageUrl="/actors/base/guard-yellow.png" imageAlt="Aldren player token" label="Aldren" color="gold" size="sm" />;
    case "initiative-tomas":
      return <Token imageUrl="/actors/base/healer.png" imageAlt="Tomas player token" label="Tomas" color="skin" size="sm" />;
    case "initiative-guard":
      return <ActorCard kind="custom" custom={{ imageUrl: "/actors/base/guard-blue.png", adjective: "Watchful", noun: "Guard", nounDescription: "Acts after Mira.", adjectiveDescription: "Fixed Effect." }} className="w-full" />;
    case "initiative-wolf":
      return <ActorCard kind="custom" custom={{ imageUrl: "/actors/base/animal-red.png", adjective: "Hungry", noun: "Wolf", nounDescription: "Acts after Mira.", adjectiveDescription: "Fixed Effect." }} className="w-full" />;
    case "initiative-bandit":
      return <ActorCard kind="custom" custom={{ imageUrl: "/actors/base/guard-red.png", adjective: "Ruthless", noun: "Bandit", nounDescription: "Acts after Aldren.", adjectiveDescription: "Fixed Effect." }} className="w-full" />;
    case "initiative-guard-label":
      return <Label color="steel" rotate={false} className="w-full justify-center">Guard acts next</Label>;
    case "initiative-wolf-label":
      return <Label color="steel" rotate={false} className="w-full justify-center">Wolf acts next</Label>;
    case "initiative-bandit-label":
      return <Label color="steel" rotate={false} className="w-full justify-center">Bandit acts next</Label>;
    default:
      return null;
  }
};

export const ActorInitiative = (): JSX.Element => (
  <RulebookBoardFigure title="Actor initiative" summary="Actors act immediately after the player they sit in front of. If several Actors share a player, the Storyteller chooses their order before the next player acts.">
    <ol className="sr-only">
      <li>Mira</li>
      <li>Guard</li>
      <li>Wolf</li>
      <li>Aldren</li>
      <li>Bandit</li>
      <li>Tomas</li>
    </ol>
    <StaticBoardFigure boardSize={actorInitiativeMobileBoard.boardSize} items={actorInitiativeMobileBoard.items} ariaLabel="Actor initiative order from Mira through Guard, Wolf, Aldren, Bandit, and Tomas" backgroundImageUrl={boardBackground} className="h-[34rem] w-full flex-none sm:hidden" renderItem={renderActorInitiativeItem} />
    <StaticBoardFigure boardSize={actorInitiativeBoard.boardSize} items={actorInitiativeBoard.items} ariaLabel="Actor initiative order from Mira through Guard, Wolf, Aldren, Bandit, and Tomas" backgroundImageUrl={boardBackground} className="hidden h-[25rem] w-full flex-none sm:block" renderItem={renderActorInitiativeItem} />
  </RulebookBoardFigure>
);

const renderZonesAndRangeItem = (item: BoardItemRecord): ReactNode => {
  switch (item.id) {
    case "range-title":
      return <Label color="cloth" rotate={false} className="w-full justify-center">Gate → Courtyard → Tower</Label>;
    case "zone-gate":
      return <LocationCard imageUrl="/rules/locations/castle-gate.png" imageAlt="Castle Gate location" title="Castle Gate" description="A connected scene zone." className="w-full" />;
    case "zone-courtyard":
      return <LocationCard imageUrl="/rules/locations/courtyard.png" imageAlt="Courtyard location" title="Courtyard" description="A connected scene zone." className="w-full" />;
    case "zone-tower":
      return <LocationCard imageUrl="/rules/locations/tower.png" imageAlt="Tower location" title="Tower" description="A connected scene zone." className="w-full" />;
    case "zone-mira":
      return <Token imageUrl="/actors/base/specialist.png" imageAlt="Mira at Castle Gate" label="Mira" color="fire" size="sm" />;
    case "zone-bandit":
      return <Token imageUrl="/actors/base/guard-red.png" imageAlt="Bandit at Tower" label="Bandit" color="monster" size="sm" />;
    case "zone-arrow-gate-courtyard":
    case "zone-arrow-courtyard-tower":
      return <span aria-hidden="true" className="flex h-full items-center justify-center font-heading text-3xl text-kac-iron">→</span>;
    case "zone-arrow-gate-courtyard-mobile":
    case "zone-arrow-courtyard-tower-mobile":
      return <span aria-hidden="true" className="flex h-full items-center justify-center font-heading text-2xl text-kac-iron">↓</span>;
    case "range-sword":
      return <Label color="fire" rotate={false} className="w-full justify-center">Sword: same zone</Label>;
    case "range-throw":
      return <Label color="gold" rotate={false} className="w-full justify-center">Throw: +1 zone</Label>;
    case "range-bow":
      return <Label color="steel" rotate={false} className="w-full justify-center">Bow: +2 zones · Tower in range</Label>;
    case "range-rule":
      return <Label color="blood" rotate={false} className="w-full justify-center">Outside range is not possible · Sniper: anywhere in sight</Label>;
    default:
      return null;
  }
};

export const ZonesAndRange = (): JSX.Element => (
  <RulebookBoardFigure title="Zones and range" summary="Mira starts at the Gate and the Bandit is in the Tower. Reach tells you which connected Zones an action can affect.">
    <ol className="sr-only"><li>Mira is at Castle Gate.</li><li>Courtyard is adjacent.</li><li>The Bandit is at Tower, two Zones from Mira.</li></ol>
    <StaticBoardFigure boardSize={zonesAndRangeMobileBoard.boardSize} items={zonesAndRangeMobileBoard.items} ariaLabel="Zones and range with Mira at Castle Gate and a Bandit at Tower" backgroundImageUrl={boardBackground} className="h-[36rem] w-full flex-none sm:hidden" renderItem={renderZonesAndRangeItem} />
    <StaticBoardFigure boardSize={zonesAndRangeBoard.boardSize} items={zonesAndRangeBoard.items} ariaLabel="Zones and range with Mira at Castle Gate and a Bandit at Tower" backgroundImageUrl={boardBackground} className="hidden h-[27rem] w-full flex-none sm:block" renderItem={renderZonesAndRangeItem} />
  </RulebookBoardFigure>
);

const renderCatastropheFlowItem = (item: BoardItemRecord): ReactNode => {
  switch (item.id) {
    case "catastrophe-resolved-label":
      return <Label color="gold" rotate={false} className="w-full justify-center">1 · Resolve action</Label>;
    case "catastrophe-draw-label":
      return <Label color="steel" rotate={false} className="w-full justify-center">2 · Draw replacement</Label>;
    case "catastrophe-fumbles-label":
      return <Label color="blood" rotate={false} className="w-full justify-center">3 · Check the new hand: three Fumbles</Label>;
    case "catastrophe-resolved":
      return <ResolvedBoardCard type="OutcomeCard" slug="success" />;
    case "catastrophe-draw":
      return <OutcomeCard card="success" face="back" className="w-full" />;
    case "catastrophe-fumble-first":
    case "catastrophe-fumble-second":
    case "catastrophe-fumble-third":
      return <ResolvedBoardCard type="OutcomeCard" slug="fumble" />;
    case "catastrophe-trigger":
      return <Label color="blood" rotate={false} className="h-full w-full justify-center text-center">Three Fumbles trigger a Catastrophe</Label>;
    case "catastrophe-arrow-resolved-draw":
      return <span aria-hidden="true" className="flex h-full items-center justify-center font-heading text-3xl text-kac-iron">→</span>;
    case "catastrophe-arrow-draw-fumbles":
    case "catastrophe-arrow-fumbles-trigger":
      return (
        <span aria-hidden="true" className="flex h-full items-center justify-center font-heading text-3xl text-kac-iron">
          <span className="sm:hidden">↓</span>
          <span className="hidden sm:block">→</span>
        </span>
      );
    case "catastrophe-arrow-trigger-consequences":
      return <span aria-hidden="true" className="flex h-full items-center justify-center font-heading text-3xl text-kac-iron">↓</span>;
    case "catastrophe-consequence-title":
      return <Label color="fire" rotate={false} className="w-full justify-center">Pick one fitting consequence</Label>;
    case "catastrophe-consequence-injury-label":
      return <Label color="fire" rotate={false} className="w-full justify-center">Injury</Label>;
    case "catastrophe-consequence-complication-label":
      return <Label color="fire" rotate={false} className="w-full justify-center">Bow Complication</Label>;
    case "catastrophe-consequence-boost-label":
      return <Label color="fire" rotate={false} className="w-full justify-center">Enemy Boost</Label>;
    case "catastrophe-consequence-injury":
      return <ResolvedBoardCard type="EffectCard" slug="injury" />;
    case "catastrophe-consequence-complication":
      return <ResolvedBoardCard type="EffectCard" slug="complication" />;
    case "catastrophe-consequence-boost":
      return <ResolvedBoardCard type="EffectCard" slug="boost" />;
    default:
      return null;
  }
};

export const CatastropheFlow = (): JSX.Element => (
  <RulebookBoardFigure title="Catastrophe flow" summary="Finish the current resolution, draw a replacement, then check the new hand. Three Fumbles trigger a crisis, so the Storyteller picks one fitting consequence.">
    <ol className="sr-only">
      <li>Resolve the current action.</li>
      <li>Draw a replacement card.</li>
      <li>Check the new hand for three Fumbles.</li>
      <li>Three Fumbles trigger a Catastrophe.</li>
      <li>Choose one fitting consequence.</li>
    </ol>
    <StaticBoardFigure boardSize={catastropheFlowMobileBoard.boardSize} items={catastropheFlowMobileBoard.items} ariaLabel="Catastrophe flow from a resolved action through the replacement draw, three Fumbles, and one consequence" backgroundImageUrl={boardBackground} className="h-[37rem] w-full flex-none sm:hidden" renderItem={renderCatastropheFlowItem} />
    <StaticBoardFigure boardSize={catastropheFlowBoard.boardSize} items={catastropheFlowBoard.items} ariaLabel="Catastrophe flow from a resolved action through the replacement draw, three Fumbles, and one consequence" backgroundImageUrl={boardBackground} className="hidden h-[32rem] w-full flex-none sm:block" renderItem={renderCatastropheFlowItem} />
  </RulebookBoardFigure>
);

const renderStatusThresholdItem = (item: BoardItemRecord): ReactNode => {
  switch (item.id) {
    case "distress-title":
      return <Label color="fire" rotate={false} className="w-full justify-center">Distress thresholds</Label>;
    case "injury-title":
      return <Label color="blood" rotate={false} className="w-full justify-center">Injury thresholds</Label>;
    case "distress-ok":
      return <Label color="bone" rotate={false} className="h-full w-full justify-center">0–2 OK</Label>;
    case "injury-ok":
      return <Label color="bone" rotate={false} className="h-full w-full justify-center">0–3 OK</Label>;
    case "distress-arrow-ok-three":
    case "distress-arrow-three-four":
    case "injury-arrow-ok-four":
      return (
        <span aria-hidden="true" className="flex h-full items-center justify-center font-heading text-3xl text-kac-iron">
          <span className="sm:hidden">↓</span>
          <span className="hidden sm:block">→</span>
        </span>
      );
    case "distress-three":
    case "distress-four":
      return <ResolvedBoardCard type="EffectCard" slug="distress" />;
    case "status-panicked":
      return <ResolvedBoardCard type="EffectCard" slug="panicked" />;
    case "status-hopeless":
      return <ResolvedBoardCard type="EffectCard" slug="hopeless" />;
    case "injury-four":
      return <ResolvedBoardCard type="EffectCard" slug="injury" />;
    case "status-taken-out":
      return <ResolvedBoardCard type="EffectCard" slug="taken-out" />;
    case "distress-count-three":
      return <Label color="fire" size="sm" rotate={false} className="h-full w-full justify-center">×3</Label>;
    case "distress-count-four":
    case "injury-count-four":
      return <Label color="blood" size="sm" rotate={false} className="h-full w-full justify-center">×4</Label>;
    case "distress-three-label":
      return <Label color="fire" rotate={false} className="w-full justify-center">3 Distress + Panicked</Label>;
    case "distress-four-label":
      return <Label color="blood" rotate={false} className="w-full justify-center">4 Distress + Hopeless</Label>;
    case "injury-four-label":
      return <Label color="blood" rotate={false} className="w-full justify-center">4 Injury + Taken Out</Label>;
    case "distress-recover":
      return <Label color="cloth" rotate={false} className="w-full justify-center">recover 1: Hopeless → Panicked</Label>;
    default:
      return null;
  }
};

export const StatusThresholds = (): JSX.Element => (
  <RulebookBoardFigure title="Distress and Injury thresholds" summary="Status cards appear only when each track reaches its threshold. Recovering one Distress moves Hopeless back to Panicked.">
    <ol className="sr-only">
      <li>Distress: 0–2 OK; 3 Distress + Panicked; 4 Distress + Hopeless.</li>
      <li>Recovering one Distress moves Hopeless back to Panicked.</li>
      <li>Injury: 0–3 OK; 4 Injury + Taken Out.</li>
    </ol>
    <StaticBoardFigure boardSize={statusThresholdsMobileBoard.boardSize} items={statusThresholdsMobileBoard.items} ariaLabel="Distress and Injury threshold lanes with Panicked, Hopeless, and Taken Out milestones" backgroundImageUrl={boardBackground} className="h-[50rem] w-full flex-none sm:hidden" renderItem={renderStatusThresholdItem} />
    <StaticBoardFigure boardSize={statusThresholdsBoard.boardSize} items={statusThresholdsBoard.items} ariaLabel="Distress and Injury threshold lanes with Panicked, Hopeless, and Taken Out milestones" backgroundImageUrl={boardBackground} className="hidden h-[35rem] w-full flex-none sm:block" renderItem={renderStatusThresholdItem} />
  </RulebookBoardFigure>
);

const renderFumbleBranchesItem = (item: BoardItemRecord): ReactNode => {
  switch (item.id) {
    case "fumble-source-label":
      return <Label color="blood" rotate={false} className="w-full justify-center">A Fumble gives the Storyteller two valid paths</Label>;
    case "fumble-source":
      return <ResolvedBoardCard type="OutcomeCard" slug="fumble" />;
    case "fumble-arrow-source-branches":
      return <span aria-hidden="true" className="flex h-full items-center justify-center font-heading text-3xl text-kac-iron">↓</span>;
    case "fumble-miss":
      return <Label color="blood" rotate={false} className="h-full w-full justify-center">MISS</Label>;
    case "fumble-miss-detail":
      return <Label color="bone" rotate={false} className="h-full w-full justify-center text-center">The arrow flies wide. No useful Effect.</Label>;
    case "fumble-hit-but":
      return <Label color="fire" rotate={false} className="h-full w-full justify-center">HIT, BUT…</Label>;
    case "fumble-bandit-label":
      return <Label color="fire" rotate={false} className="w-full justify-center">Bandit takes 1 Injury</Label>;
    case "fumble-bow-label":
      return <Label color="fire" rotate={false} className="w-full justify-center">Bow gains a Complication</Label>;
    case "fumble-bandit":
      return <ActorCard kind="custom" custom={{ imageUrl: "/actors/base/guard-red.png", adjective: "Ruthless", noun: "Bandit", nounDescription: "Hit, but hurt.", adjectiveDescription: "Fitting consequence." }} className="w-full" />;
    case "fumble-injury":
      return <ResolvedBoardCard type="EffectCard" slug="injury" />;
    case "fumble-bow":
      return <ResolvedBoardCard type="AssetCard" slug="medieval_hunting_bow" />;
    case "fumble-complication":
      return <ResolvedBoardCard type="EffectCard" slug="complication" />;
    default:
      return null;
  }
};

export const FumbleBranches = (): JSX.Element => (
  <RulebookBoardFigure title="Two valid Fumbles" summary="A Fumble usually misses. When a costly success fits the fiction better, apply the success alongside a serious Complication.">
    <ol className="sr-only">
      <li>Fumble.</li>
      <li>Miss: no useful Effect.</li>
      <li>Hit, but: Bandit takes 1 Injury and Bow gains a Complication.</li>
    </ol>
    <StaticBoardFigure boardSize={fumbleBranchesMobileBoard.boardSize} items={fumbleBranchesMobileBoard.items} ariaLabel="Two valid Fumble branches: miss or costly success with Bandit Injury and Bow Complication" backgroundImageUrl={boardBackground} className="h-[45rem] w-full flex-none sm:hidden" renderItem={renderFumbleBranchesItem} />
    <StaticBoardFigure boardSize={fumbleBranchesBoard.boardSize} items={fumbleBranchesBoard.items} ariaLabel="Two valid Fumble branches: miss or costly success with Bandit Injury and Bow Complication" backgroundImageUrl={boardBackground} className="hidden h-[34rem] w-full flex-none sm:block" renderItem={renderFumbleBranchesItem} />
  </RulebookBoardFigure>
);
