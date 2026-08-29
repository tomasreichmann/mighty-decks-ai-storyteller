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
