import {
  type CSSProperties,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { CampaignSessionOutcomePile } from "@mighty-decks/spec/campaign";
import { cn } from "../../../utils/cn";
import { OutcomeCard } from "../../cards/OutcomeCard";
import { Button } from "../../common/Button";

const outcomeDeckCardSlotClassName = "w-[6.5rem] max-w-[6.5rem]";
const outcomeHandCardSlotClassName =
  "w-[5rem] max-w-[5rem] sm:w-[5.75rem] sm:max-w-[5.75rem] md:w-[6.25rem] md:max-w-[6.25rem] lg:w-[6.5rem] lg:max-w-[6.5rem]";
const outcomePileCardHeightRem = 10.6;
const outcomeHandVisibleHeightRem = outcomePileCardHeightRem + 3.5;
const outcomeHandFanEdgeAngle = 15;
const outcomeHandFanZenithOffset = -19;
const discardRotationDegrees = [
  -12,
  9,
  -5,
  13,
  -7,
  6,
  -4,
  15,
  -1,
  2,
  -9,
  -15,
] as const;

export const emptyOutcomePile: CampaignSessionOutcomePile = {
  deck: [],
  hand: [],
  discard: [],
};

type OutcomeSelectionAction =
  | {
      type: "toggle";
      cardId: string;
    }
  | {
      type: "sync-hand";
      handCardIds: ReadonlySet<string>;
    }
  | {
      type: "clear";
    };

const getOutcomeHandFanTransformStyle = (
  index: number,
  total: number,
): CSSProperties => {
  if (total <= 1) {
    return {
      transform: "translateY(0rem) rotate(0deg)",
    };
  }

  const fanStartAngle = -outcomeHandFanEdgeAngle;
  const fanEndAngle = outcomeHandFanEdgeAngle;
  const fanAnglePerCard = (fanEndAngle - fanStartAngle) / (total - 1);
  const angle = fanStartAngle + fanAnglePerCard * index;
  const offsetY =
    Math.sin((index / (total - 1)) * Math.PI) * outcomeHandFanZenithOffset;

  return {
    transform: `translateY(${offsetY}px) rotate(${angle}deg)`,
  };
};

const getOutcomeDiscardTransformStyle = (index: number): CSSProperties => {
  const rotation =
    discardRotationDegrees[index % discardRotationDegrees.length] ?? 0;
  const offsetX = index * 0.12;
  const offsetY = index * 0.08;

  return {
    transform: `translate(${offsetX}rem, ${offsetY}rem) rotate(${rotation}deg)`,
    zIndex: index + 1,
  };
};

const getOutcomeDeckTransformStyle = (index: number): CSSProperties => {
  const offset = index * 0.11;
  return {
    transform: `translate(${offset}rem, ${offset}rem)`,
    zIndex: index + 1,
  };
};

const reduceSelectedOutcomeCardIds = (
  state: ReadonlySet<string>,
  action: OutcomeSelectionAction,
): ReadonlySet<string> => {
  switch (action.type) {
    case "toggle": {
      const next = new Set(state);
      if (next.has(action.cardId)) {
        next.delete(action.cardId);
      } else {
        next.add(action.cardId);
      }
      return next;
    }
    case "sync-hand": {
      if (state.size === 0) {
        return state;
      }

      const next = new Set(
        [...state].filter((cardId) => action.handCardIds.has(cardId)),
      );
      return next.size === state.size ? state : next;
    }
    case "clear":
      return state.size === 0 ? state : new Set();
  }
};

interface OutcomeDeckPanelProps {
  participantId: string;
  pile: CampaignSessionOutcomePile;
  canDraw: boolean;
  canShuffle: boolean;
  onDrawOutcomeCard?: (participantId: string) => void;
  onShuffleOutcomeDeck?: (participantId: string) => void;
}

const OutcomeDeckPanel = ({
  participantId,
  pile,
  canDraw,
  canShuffle,
  onDrawOutcomeCard,
  onShuffleOutcomeDeck,
}: OutcomeDeckPanelProps): JSX.Element => {
  const handleDeckClick = (): void => {
    if (pile.deck.length > 0) {
      onDrawOutcomeCard?.(participantId);
      return;
    }

    if (pile.discard.length > 0) {
      onShuffleOutcomeDeck?.(participantId);
    }
  };

  const visibleCards = pile.deck.slice(-4);
  const isDeckInteractive = (pile.deck.length > 0 && canDraw) || canShuffle;

  return (
    <div className="stack min-w-0 gap-2" aria-label="Outcome deck">
      <button
        type="button"
        disabled={!isDeckInteractive}
        onClick={isDeckInteractive ? handleDeckClick : undefined}
        aria-label={
          pile.deck.length > 0
            ? "Draw an outcome card"
            : "Shuffle discarded outcome cards into the deck"
        }
        className={cn(
          "group relative w-[7rem] max-w-[7rem] bg-transparent p-0 text-left transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/60",
          "disabled:cursor-not-allowed disabled:opacity-75",
        )}
      >
        {pile.deck.length > 0 ? (
          <div
            className="relative w-[7rem]"
            style={{
              height: `${outcomePileCardHeightRem}rem`,
            }}
            aria-hidden="true"
          >
            {visibleCards.map((card, index) => (
              <div
                key={card.cardId}
                className="absolute inset-0"
                style={getOutcomeDeckTransformStyle(index)}
              >
                <OutcomeCard
                  card={card.slug}
                  face="back"
                  className={outcomeDeckCardSlotClassName}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "relative flex w-[7rem] items-center justify-center overflow-hidden rounded-[0.6rem] border-[2px] border-dashed border-kac-blood-dark/45 bg-[linear-gradient(135deg,_#2a333f_0%,_#18202a_52%,_#0f151c_100%)] shadow-[2px_2px_0_0_#121b23]",
            )}
            style={{
              height: `${outcomePileCardHeightRem}rem`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,_rgba(255,255,255,0.16),_transparent_46%),repeating-linear-gradient(135deg,_rgba(255,255,255,0.08)_0_12px,_rgba(255,255,255,0.02)_12px_24px)] opacity-95" />
            <div className="absolute inset-[10%] rounded-[0.55rem] border border-kac-bone-light/20" />
            <span className="relative z-10 text-center font-md-heading text-[0.95rem] font-bold leading-none text-kac-bone-light/80">
              <span className="ml-1">Shuffle</span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
};

interface OutcomeHandPanelProps {
  participantId: string;
  pile: CampaignSessionOutcomePile;
  isCurrentLane: boolean;
  selectedOutcomeCardIds: ReadonlySet<string>;
  onToggleOutcomeCardSelection?: (cardId: string) => void;
  onPlayOutcomeCards?: (participantId: string, cardIds: string[]) => void;
}

const OutcomeHandPanel = ({
  participantId,
  pile,
  isCurrentLane,
  selectedOutcomeCardIds,
  onToggleOutcomeCardSelection,
  onPlayOutcomeCards,
}: OutcomeHandPanelProps): JSX.Element => {
  const selectedCards = useMemo(
    () => pile.hand.filter((card) => selectedOutcomeCardIds.has(card.cardId)),
    [pile.hand, selectedOutcomeCardIds],
  );
  const canPlaySelectedCards = isCurrentLane && Boolean(onPlayOutcomeCards);

  const handlePlaySelectedCards = (): void => {
    if (!canPlaySelectedCards || !onPlayOutcomeCards || selectedCards.length === 0) {
      return;
    }

    onPlayOutcomeCards(
      participantId,
      selectedCards.map((card) => card.cardId),
    );
  };

  return (
    <div className="stack w-fit min-w-0 gap-2" aria-label="Outcome hand">
      <div
        className="relative w-fit min-w-0 pt-2"
        style={{
          minHeight: `${outcomeHandVisibleHeightRem}rem`,
        }}
      >
        <div className="flex w-fit min-w-0 items-end justify-center gap-1 overflow-visible px-8 pb-2">
          {pile.hand.length > 0 ? (
            pile.hand.map((card, index) => {
              const isSelected = selectedOutcomeCardIds.has(card.cardId);
              const isInteractive = Boolean(
                isCurrentLane && onToggleOutcomeCardSelection,
              );

              return (
                <div
                  key={card.cardId}
                  className={cn(
                    "relative -mx-4 shrink-0 transition-transform duration-300 hover:z-30 focus-within:z-30",
                    isCurrentLane && "pointer-events-auto",
                  )}
                  style={getOutcomeHandFanTransformStyle(index, pile.hand.length)}
                >
                  <OutcomeCard
                    card={card.slug}
                    face={isCurrentLane ? "front" : "back"}
                    selected={isSelected}
                    className={outcomeHandCardSlotClassName}
                    onSelect={
                      isInteractive && onToggleOutcomeCardSelection
                        ? () => onToggleOutcomeCardSelection(card.cardId)
                        : undefined
                    }
                  />
                </div>
              );
            })
          ) : (
            <div className="rounded-[0.55rem] border border-dashed border-kac-iron/20 bg-kac-bone-light/40 px-3 py-2 text-sm text-kac-iron-light">
              No outcome cards in hand.
            </div>
          )}
        </div>
        {canPlaySelectedCards && selectedCards.length > 0 ? (
          <div className="mt-3 flex justify-center">
            <Button
              color="gold"
              size="sm"
              onClick={handlePlaySelectedCards}
              aria-label="Play an Outcome card"
              title="Play an Outcome card"
            >
              ▶
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

interface OutcomeDiscardPanelProps {
  pile: CampaignSessionOutcomePile;
}

const OutcomeDiscardPanel = ({
  pile,
}: OutcomeDiscardPanelProps): JSX.Element => (
  <div className="stack min-w-0 gap-2" aria-label="Outcome discard pile">
    <div
      className="relative w-[7rem]"
      style={{
        minHeight: `${outcomePileCardHeightRem}rem`,
      }}
    >
      {pile.discard.length > 0 ? (
        pile.discard.map((card, index) => (
          <div
            key={card.cardId}
            className="absolute inset-0"
            style={getOutcomeDiscardTransformStyle(index)}
          >
            <OutcomeCard
              card={card.slug}
              face="front"
              className={outcomeDeckCardSlotClassName}
            />
          </div>
        ))
      ) : (
        <div
          className="flex w-[7rem] items-center justify-center rounded-[0.55rem] border border-dashed border-kac-iron/20 bg-kac-bone-light/40 text-sm text-kac-iron-light"
          style={{
            height: `${outcomePileCardHeightRem}rem`,
          }}
        >
          Empty
        </div>
      )}
    </div>
  </div>
);

interface OutcomePilesRowProps {
  participantId: string;
  pile: CampaignSessionOutcomePile;
  isCurrentLane: boolean;
  onDrawOutcomeCard?: (participantId: string) => void;
  onShuffleOutcomeDeck?: (participantId: string) => void;
  onPlayOutcomeCards?: (participantId: string, cardIds: string[]) => void;
}

export const OutcomePilesRow = ({
  participantId,
  pile,
  isCurrentLane,
  onDrawOutcomeCard,
  onShuffleOutcomeDeck,
  onPlayOutcomeCards,
}: OutcomePilesRowProps): JSX.Element => {
  const [selectedOutcomeCardIds, dispatchSelectedOutcomeCardIds] = useReducer(
    reduceSelectedOutcomeCardIds,
    new Set<string>(),
  );

  const handCardIds = useMemo(
    () => new Set(pile.hand.map((card) => card.cardId)),
    [pile.hand],
  );

  useEffect(() => {
    dispatchSelectedOutcomeCardIds({
      type: "sync-hand",
      handCardIds,
    });
  }, [handCardIds]);

  return (
    <div className="grid min-w-0 gap-3 lg:flex lg:items-start lg:justify-center lg:gap-6">
      <OutcomeDeckPanel
        participantId={participantId}
        pile={pile}
        canDraw={isCurrentLane && Boolean(onDrawOutcomeCard) && pile.deck.length > 0}
        canShuffle={
          isCurrentLane &&
          Boolean(onShuffleOutcomeDeck) &&
          pile.deck.length === 0 &&
          pile.discard.length > 0
        }
        onDrawOutcomeCard={onDrawOutcomeCard}
        onShuffleOutcomeDeck={onShuffleOutcomeDeck}
      />
      <OutcomeHandPanel
        participantId={participantId}
        pile={pile}
        isCurrentLane={isCurrentLane}
        selectedOutcomeCardIds={selectedOutcomeCardIds}
        onToggleOutcomeCardSelection={
          isCurrentLane
            ? (cardId) =>
                dispatchSelectedOutcomeCardIds({
                  type: "toggle",
                  cardId,
                })
            : undefined
        }
        onPlayOutcomeCards={
          isCurrentLane && onPlayOutcomeCards
            ? (targetParticipantId, cardIds) => {
                dispatchSelectedOutcomeCardIds({ type: "clear" });
                onPlayOutcomeCards(targetParticipantId, cardIds);
              }
            : undefined
        }
      />
      <OutcomeDiscardPanel pile={pile} />
    </div>
  );
};
