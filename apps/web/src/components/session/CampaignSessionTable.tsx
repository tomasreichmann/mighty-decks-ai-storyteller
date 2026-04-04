import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CampaignDetail,
  CampaignSessionDetail,
  CampaignSessionOutcomePile,
  CampaignSessionTableCardReference,
  CampaignSessionTableEntry,
  CampaignSessionTableTarget,
} from "@mighty-decks/spec/campaign";
import type { LabelVariant } from "../common/Label";
import { resolveGameCard } from "../../lib/markdownGameComponents";
import { cn } from "../../utils/cn";
import { EncounterCardView, InvalidEncounterCardView } from "../adventure-module/EncounterCardView";
import { GameCardView } from "../adventure-module/GameCardView";
import { LocationCardView } from "../adventure-module/LocationCardView";
import { QuestCardView, InvalidQuestCardView } from "../adventure-module/QuestCardView";
import { AssetCard } from "../cards/AssetCard";
import { CounterCard } from "../cards/CounterCard";
import { OutcomeCard } from "../cards/OutcomeCard";
import { Button } from "../common/Button";
import { Label } from "../common/Label";
import { Message } from "../common/Message";
import styles from "./CampaignSessionTable.module.css";

type SessionViewerRole = "player" | "storyteller";

interface CampaignSessionTableProps {
  campaign: CampaignDetail | null;
  session: CampaignSessionDetail | null;
  viewerRole: SessionViewerRole;
  currentParticipantId?: string | null;
  hasStagedCards?: boolean;
  onDrawOutcomeCard?: (participantId: string) => void;
  onShuffleOutcomeDeck?: (participantId: string) => void;
  onPlayOutcomeCards?: (participantId: string, cardIds: string[]) => void;
  onSendCardsToTarget?: (target: CampaignSessionTableTarget) => void;
  onRemoveEntry?: (tableEntryId: string) => void;
  className?: string;
}

interface TableEntryGroup {
  key: string;
  entries: CampaignSessionTableEntry[];
}

const compactCardClassName = "w-full max-w-[6.5rem]";
const compactCardSlotClassName = "w-[6.5rem] max-w-[6.5rem]";
const compactSceneCardSlotClassName = "w-[10.375rem] max-w-[10.375rem]";
const fullCardHeightRem = 10.6;
const stackPeekStepRem = 0.9;
const removeFadeDurationMs = 180;

const makeReferenceKey = (card: CampaignSessionTableCardReference): string => {
  if (card.type === "AssetCard") {
    return `${card.type}:${card.slug}:${card.modifierSlug ?? ""}`;
  }
  return `${card.type}:${card.slug}`;
};

const makeReferenceTitle = (card: CampaignSessionTableCardReference): string => {
  if (card.type === "AssetCard" && card.modifierSlug) {
    return `${card.type} ${card.slug}/${card.modifierSlug}`;
  }
  return `${card.type} ${card.slug}`;
};

const canStackReference = (card: CampaignSessionTableCardReference): boolean =>
  card.type !== "LocationCard" &&
  card.type !== "EncounterCard" &&
  card.type !== "QuestCard";

const isSceneReference = (card: CampaignSessionTableCardReference): boolean =>
  card.type === "LocationCard" ||
  card.type === "EncounterCard" ||
  card.type === "QuestCard";

const groupAdjacentEntries = (
  entries: readonly CampaignSessionTableEntry[],
): TableEntryGroup[] => {
  const groups: TableEntryGroup[] = [];

  for (const entry of entries) {
    const key = makeReferenceKey(entry.card);
    const previousGroup = groups.at(-1);
    if (previousGroup && previousGroup.key === key) {
      previousGroup.entries.push(entry);
      continue;
    }
    groups.push({
      key,
      entries: [entry],
    });
  }

  return groups;
};

const InvalidTableCard = ({
  title,
}: {
  title: string;
}): JSX.Element => (
  <article
    className="relative flex aspect-[204/332] w-[6.5rem] max-w-[6.5rem] flex-col justify-between rounded-[0.6rem] border-2 border-dashed border-kac-blood-dark/70 bg-kac-bone-light/80 p-3 text-left shadow-[2px_2px_0_0_#121b23]"
    aria-label={title}
  >
    <div className="stack gap-1">
      <span className="font-ui text-[9px] font-bold uppercase tracking-[0.08em] text-kac-blood-dark">
        Missing Card
      </span>
      <span className="font-md-heading text-[15px] font-bold leading-tight text-kac-iron">
        {title}
      </span>
    </div>
    <p className="font-ui text-[10px] leading-[1.3] text-kac-iron-light">
      Source was removed or renamed. Storyteller can remove this card.
    </p>
  </article>
);

interface RenderedReference {
  title: string;
  node: JSX.Element;
}

const resolveReference = (
  card: CampaignSessionTableCardReference,
  campaign: CampaignDetail | null,
): RenderedReference => {
  const actorsBySlug = new Map(
    (campaign?.actors ?? []).map((actor) => [actor.actorSlug.toLocaleLowerCase(), actor] as const),
  );
  const countersBySlug = new Map(
    (campaign?.counters ?? []).map((counter) => [counter.slug.toLocaleLowerCase(), counter] as const),
  );
  const assetsBySlug = new Map(
    (campaign?.assets ?? []).map((asset) => [asset.assetSlug.toLocaleLowerCase(), asset] as const),
  );
  const locationsBySlug = new Map(
    (campaign?.locations ?? []).map((location) => [
      location.locationSlug.toLocaleLowerCase(),
      location,
    ] as const),
  );
  const encountersBySlug = new Map(
    (campaign?.encounters ?? []).map((encounter) => [
      encounter.encounterSlug.toLocaleLowerCase(),
      encounter,
    ] as const),
  );
  const questsBySlug = new Map(
    (campaign?.quests ?? []).map((quest) => [quest.questSlug.toLocaleLowerCase(), quest] as const),
  );

  if (card.type === "LocationCard") {
    const location = locationsBySlug.get(card.slug.toLocaleLowerCase());
    if (!location) {
      return {
        title: makeReferenceTitle(card),
        node: <InvalidTableCard title={makeReferenceTitle(card)} />,
      };
    }
    return {
      title: location.title,
      node: <LocationCardView location={location} />,
    };
  }

  if (card.type === "EncounterCard") {
    const encounter = encountersBySlug.get(card.slug.toLocaleLowerCase());
    if (!encounter) {
      return {
        title: makeReferenceTitle(card),
        node: <InvalidEncounterCardView slug={card.slug} />,
      };
    }
    return {
      title: encounter.title,
      node: <EncounterCardView encounter={encounter} />,
    };
  }

  if (card.type === "QuestCard") {
    const quest = questsBySlug.get(card.slug.toLocaleLowerCase());
    if (!quest) {
      return {
        title: makeReferenceTitle(card),
        node: <InvalidQuestCardView slug={card.slug} />,
      };
    }
    return {
      title: quest.title,
      node: <QuestCardView quest={quest} />,
    };
  }

  const resolved = resolveGameCard(
    card.type,
    card.slug,
    actorsBySlug,
    countersBySlug,
    assetsBySlug,
    card.type === "AssetCard" ? card.modifierSlug : undefined,
  );

  if (!resolved) {
    return {
      title: makeReferenceTitle(card),
      node: <InvalidTableCard title={makeReferenceTitle(card)} />,
    };
  }

  if (
    resolved.type === "OutcomeCard" ||
    resolved.type === "EffectCard" ||
    resolved.type === "StuntCard" ||
    resolved.type === "ActorCard"
  ) {
    return {
      title:
        resolved.type === "ActorCard" ? resolved.actor.title : resolved.card.title,
      node: <GameCardView gameCard={resolved} className={compactCardClassName} />,
    };
  }

  if (resolved.type === "CounterCard") {
    return {
      title: resolved.counter.title,
      node: (
        <CounterCard
          className={compactCardClassName}
          iconSlug={resolved.counter.iconSlug}
          title={resolved.counter.title}
          currentValue={resolved.counter.currentValue}
          maxValue={resolved.counter.maxValue}
          description={resolved.counter.description}
        />
      ),
    };
  }

  if (resolved.asset.kind === "custom") {
    return {
      title: resolved.asset.title,
      node: (
        <AssetCard
          kind="custom"
          modifier={resolved.asset.modifier}
          noun={resolved.asset.noun}
          nounDescription={resolved.asset.nounDescription}
          adjectiveDescription={resolved.asset.adjectiveDescription}
          iconUrl={resolved.asset.iconUrl}
          overlayUrl={resolved.asset.overlayUrl}
          className={compactCardClassName}
        />
      ),
    };
  }

  if (resolved.asset.kind === "legacy_layered") {
    return {
      title: resolved.asset.title,
      node: (
        <AssetCard
          kind="legacy_layered"
          title={resolved.asset.title}
          className={compactCardClassName}
        />
      ),
    };
  }

  return {
    title: resolved.asset.title,
    node: (
      <AssetCard
        baseAssetSlug={resolved.asset.baseAssetSlug}
        modifierSlug={resolved.asset.modifierSlug}
        className={compactCardClassName}
      />
    ),
  };
};

const getLaneVariant = (
  viewerRole: SessionViewerRole,
  isCurrentLane: boolean,
  index: number,
): LabelVariant => {
  if (isCurrentLane) {
    return "gold";
  }
  if (viewerRole === "storyteller") {
    return "cloth";
  }
  const variants: LabelVariant[] = ["fire", "monster", "cloth", "skin", "bone"];
  return variants[index % variants.length] ?? "cloth";
};

const renderRemoveButton = (
  title: string,
  onRemove: () => void,
  topOffsetRem = 0,
): JSX.Element => (
  <div
    className="absolute left-0.5 z-20"
    style={{
      top: `${topOffsetRem}rem`,
    }}
  >
    <Button
      type="button"
      variant="circle"
      color="curse"
      size="sm"
      aria-label={`Remove ${title}`}
      title={`Remove ${title}`}
      onClick={onRemove}
      className="!h-5 !w-5 !border-x-[2px] !border-y-[2px] !shadow-none hover:!shadow-none active:!shadow-none disabled:!shadow-none text-[0.7rem]"
    >
      X
    </Button>
  </div>
);

const emptyOutcomePile: CampaignSessionOutcomePile = {
  deck: [],
  hand: [],
  discard: [],
};

const outcomeCardSlotClassName = "w-[6.5rem] max-w-[6.5rem]";
const outcomePileCardHeightRem = 10.6;
const outcomeHandFanEdgeAngle = 15;
const outcomeHandFanZenithOffset = -32;
const discardRotationDegrees = [
  -12,
  9,
  -15,
  13,
  -7,
  11,
  -4,
  15,
  -1,
  6,
  -10,
  3,
] as const;

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
    <div className="stack min-w-0 gap-2">
      <Label variant="cloth" rotate={false} className="self-start">
        Deck
      </Label>
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
            {visibleCards.map((card, index) => {
              const deckDepthIndex = index;
              return (
                <div
                  key={card.cardId}
                  className="absolute inset-0"
                  style={getOutcomeDeckTransformStyle(deckDepthIndex)}
                >
                  <OutcomeCard
                    card={card.slug}
                    face="back"
                    className={outcomeCardSlotClassName}
                  />
                </div>
              );
            })}
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
              <span aria-hidden="true">◎</span>
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
    () =>
      pile.hand.filter((card) => selectedOutcomeCardIds.has(card.cardId)),
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
    <div className="stack min-w-0 gap-2">
      <Label variant={isCurrentLane ? "gold" : "cloth"} rotate={false} className="self-start">
        Hand
      </Label>
      <div
        className="relative min-w-0 pt-2"
        style={{
          minHeight: `${outcomePileCardHeightRem}rem`,
        }}
      >
        <div className="flex min-w-0 flex-wrap items-end justify-start gap-0">
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
                    "relative -mx-11 shrink-0",
                    isCurrentLane && "pointer-events-auto",
                  )}
                  style={getOutcomeHandFanTransformStyle(index, pile.hand.length)}
                >
                  <OutcomeCard
                    card={card.slug}
                    face={isCurrentLane ? "front" : "back"}
                    selected={isSelected}
                    className={outcomeCardSlotClassName}
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
            <Button color="gold" size="sm" onClick={handlePlaySelectedCards}>
              Play Character
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

const OutcomeDiscardPanel = ({ pile }: OutcomeDiscardPanelProps): JSX.Element => (
    <div className="stack min-w-0 gap-2">
      <Label variant="cloth" rotate={false} className="self-start">
        Discard
      </Label>
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
              className={outcomeCardSlotClassName}
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

const OutcomePilesRow = ({
  participantId,
  pile,
  isCurrentLane,
  onDrawOutcomeCard,
  onShuffleOutcomeDeck,
  onPlayOutcomeCards,
}: OutcomePilesRowProps): JSX.Element => {
  const [selectedOutcomeCardIds, setSelectedOutcomeCardIds] = useState<Set<string>>(
    new Set(),
  );

  const handCardIds = useMemo(
    () => new Set(pile.hand.map((card) => card.cardId)),
    [pile.hand],
  );

  useEffect(() => {
    setSelectedOutcomeCardIds((current) => {
      if (current.size === 0) {
        return current;
      }

      const next = new Set(
        [...current].filter((cardId) => handCardIds.has(cardId)),
      );
      return next.size === current.size ? current : next;
    });
  }, [handCardIds]);

  const handleToggleOutcomeCardSelection = useCallback((cardId: string): void => {
    setSelectedOutcomeCardIds((current) => {
      const next = new Set(current);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }, []);

  const handlePlayOutcomeCards = useCallback(
    (targetParticipantId: string, cardIds: string[]): void => {
      setSelectedOutcomeCardIds(new Set());
      onPlayOutcomeCards?.(targetParticipantId, cardIds);
    },
    [onPlayOutcomeCards],
  );

  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-3">
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
          isCurrentLane ? handleToggleOutcomeCardSelection : undefined
        }
        onPlayOutcomeCards={
          isCurrentLane && onPlayOutcomeCards ? handlePlayOutcomeCards : undefined
        }
      />
      <OutcomeDiscardPanel pile={pile} />
    </div>
  );
};

interface CardSlotProps {
  campaign: CampaignDetail | null;
  entry: CampaignSessionTableEntry;
  canRemove: boolean;
  isFading: boolean;
  onRequestRemoveEntry?: (tableEntryId: string) => void;
}

const CardSlot = ({
  campaign,
  entry,
  canRemove,
  isFading,
  onRequestRemoveEntry,
}: CardSlotProps): JSX.Element => {
  const rendered = resolveReference(entry.card, campaign);
  const slotWidthClassName = isSceneReference(entry.card)
    ? compactSceneCardSlotClassName
    : compactCardSlotClassName;

  return (
    <div
      className={cn(
        styles.tableCardShell,
        "relative flex min-w-0 shrink-0 pt-3",
        slotWidthClassName,
        isFading && styles.tableCardFading,
      )}
    >
      {canRemove && onRequestRemoveEntry
        ? renderRemoveButton(
            rendered.title,
            () => onRequestRemoveEntry(entry.tableEntryId),
          )
        : null}
      {rendered.node}
    </div>
  );
};

interface StackedCardSlotProps {
  campaign: CampaignDetail | null;
  entries: readonly CampaignSessionTableEntry[];
  canRemove: boolean;
  isFading: boolean;
  onRequestRemoveEntry?: (tableEntryId: string) => void;
}

const StackedCardSlot = ({
  campaign,
  entries,
  canRemove,
  isFading,
  onRequestRemoveEntry,
}: StackedCardSlotProps): JSX.Element => {
  const visibleEntries = entries.slice(-5);
  const topEntry = visibleEntries.at(-1);
  if (!topEntry) {
    return <></>;
  }

  const peekEntries = visibleEntries.slice(0, -1);
  const renderedTop = resolveReference(topEntry.card, campaign);

  return (
    <div
      className={cn(
        styles.tableCardShell,
        "relative flex w-[6.5rem] min-w-0 max-w-[6.5rem] shrink-0",
        isFading && styles.tableCardFading,
      )}
      style={{
        height: `${fullCardHeightRem + peekEntries.length * stackPeekStepRem}rem`,
      }}
    >
      {canRemove && onRequestRemoveEntry
        ? renderRemoveButton(
            renderedTop.title,
            () => onRequestRemoveEntry(topEntry.tableEntryId),
            peekEntries.length * stackPeekStepRem,
          )
        : null}
      <div
        className="relative w-full"
        style={{
          height: `${fullCardHeightRem + peekEntries.length * stackPeekStepRem}rem`,
        }}
      >
        <div
          className={cn(styles.stackTopCard, "z-10")}
          style={{
            top: `${peekEntries.length * stackPeekStepRem}rem`,
          }}
        >
          {renderedTop.node}
        </div>
        {peekEntries.map((entry, index) => {
          const rendered = resolveReference(entry.card, campaign);
          return (
            <div
              key={entry.tableEntryId}
              className={styles.stackPeek}
              style={{
                top: `${index * stackPeekStepRem}rem`,
              }}
            >
              <div className={styles.stackPeekViewport}>{rendered.node}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface LaneHeaderProps {
  label: string;
  variant: LabelVariant;
  className?: string;
  showSendButton: boolean;
  onSend?: () => void;
}

const LaneHeader = ({
  label,
  variant,
  className,
  showSendButton,
  onSend,
}: LaneHeaderProps): JSX.Element => {
  return (
    <div className={cn(styles.laneDividerRow, className)}>
      <div className={styles.laneDivider} />
      <div className="relative z-10 flex items-center justify-between gap-2">
        <Label variant={variant} rotate={false} className={styles.laneLabel}>
          {label}
        </Label>
        {showSendButton && onSend ? (
          <Button variant="ghost" color="gold" size="sm" onClick={onSend}>
            Send Cards
          </Button>
        ) : null}
      </div>
    </div>
  );
};

interface LaneCardsProps {
  campaign: CampaignDetail | null;
  entries: readonly CampaignSessionTableEntry[];
  canRemoveEntry: (entry: CampaignSessionTableEntry) => boolean;
  isFadingEntry: (tableEntryId: string) => boolean;
  onRequestRemoveEntry?: (tableEntryId: string) => void;
}

const LaneCards = ({
  campaign,
  entries,
  canRemoveEntry,
  isFadingEntry,
  onRequestRemoveEntry,
}: LaneCardsProps): JSX.Element => {
  const grouped = groupAdjacentEntries(entries);

  return (
    <div className="flex min-w-0 flex-wrap content-start items-start gap-2">
      {grouped.map((group) => {
        if (group.entries.length > 1 && canStackReference(group.entries[0].card)) {
          const topEntry = group.entries.at(-1);
          return (
            <StackedCardSlot
              key={topEntry?.tableEntryId ?? group.key}
              campaign={campaign}
              entries={group.entries}
              canRemove={Boolean(topEntry && canRemoveEntry(topEntry))}
              isFading={Boolean(topEntry && isFadingEntry(topEntry.tableEntryId))}
              onRequestRemoveEntry={onRequestRemoveEntry}
            />
          );
        }

        return group.entries.map((entry) => (
          <CardSlot
            key={entry.tableEntryId}
            campaign={campaign}
            entry={entry}
            canRemove={canRemoveEntry(entry)}
            isFading={isFadingEntry(entry.tableEntryId)}
            onRequestRemoveEntry={onRequestRemoveEntry}
          />
        ));
      })}
    </div>
  );
};

export const CampaignSessionTable = ({
  campaign,
  session,
  viewerRole,
  currentParticipantId = null,
  hasStagedCards = false,
  onDrawOutcomeCard,
  onShuffleOutcomeDeck,
  onPlayOutcomeCards,
  onSendCardsToTarget,
  onRemoveEntry,
  className,
}: CampaignSessionTableProps): JSX.Element => {
  const [fadingEntryIds, setFadingEntryIds] = useState<Set<string>>(new Set());
  const removalTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    return () => {
      for (const timerId of removalTimersRef.current.values()) {
        window.clearTimeout(timerId);
      }
      removalTimersRef.current.clear();
    };
  }, []);

  const players = useMemo(
    () => (session?.participants ?? []).filter((participant) => participant.role === "player"),
    [session?.participants],
  );

  const outcomePilesByParticipantId = session?.outcomePilesByParticipantId ?? {};

  const actorByFragmentId = useMemo(
    () => new Map((campaign?.actors ?? []).map((actor) => [actor.fragmentId, actor] as const)),
    [campaign?.actors],
  );

  const claimByParticipantId = useMemo(
    () => new Map((session?.claims ?? []).map((claim) => [claim.participantId, claim] as const)),
    [session?.claims],
  );

  const sharedEntries = useMemo(
    () =>
      (session?.table ?? []).filter((entry) => entry.target.scope === "shared"),
    [session?.table],
  );

  const entriesByParticipantId = useMemo(() => {
    const map = new Map<string, CampaignSessionTableEntry[]>();
    for (const entry of session?.table ?? []) {
      if (entry.target.scope !== "participant") {
        continue;
      }
      const current = map.get(entry.target.participantId);
      if (current) {
        current.push(entry);
      } else {
        map.set(entry.target.participantId, [entry]);
      }
    }
    return map;
  }, [session?.table]);

  const activeEntryIds = useMemo(
    () => new Set((session?.table ?? []).map((entry) => entry.tableEntryId)),
    [session?.table],
  );

  useEffect(() => {
    setFadingEntryIds((current) => {
      let changed = false;
      const next = new Set<string>();
      for (const entryId of current) {
        if (activeEntryIds.has(entryId)) {
          next.add(entryId);
          continue;
        }
        const timerId = removalTimersRef.current.get(entryId);
        if (typeof timerId === "number") {
          window.clearTimeout(timerId);
          removalTimersRef.current.delete(entryId);
        }
        changed = true;
      }
      return changed ? next : current;
    });
  }, [activeEntryIds]);

  const isFadingEntry = useCallback(
    (tableEntryId: string): boolean => fadingEntryIds.has(tableEntryId),
    [fadingEntryIds],
  );

  const handleRequestRemoveEntry = useCallback(
    (tableEntryId: string): void => {
      if (!onRemoveEntry) {
        return;
      }
      if (removalTimersRef.current.has(tableEntryId)) {
        return;
      }

      setFadingEntryIds((current) => {
        if (current.has(tableEntryId)) {
          return current;
        }
        const next = new Set(current);
        next.add(tableEntryId);
        return next;
      });

      const timerId = window.setTimeout(() => {
        removalTimersRef.current.delete(tableEntryId);
        onRemoveEntry(tableEntryId);
      }, removeFadeDurationMs);
      removalTimersRef.current.set(tableEntryId, timerId);
    },
    [onRemoveEntry],
  );

  const canRemoveEntry = (entry: CampaignSessionTableEntry): boolean => {
    if (!currentParticipantId) {
      return false;
    }
    if (viewerRole === "storyteller") {
      return true;
    }
    return (
      entry.target.scope === "participant" &&
      entry.target.participantId === currentParticipantId
    );
  };

  if (!session) {
    return (
      <section
        className={cn(
          styles.tableSurface,
          "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 pb-2 pt-1 sm:px-3",
          className,
        )}
      >
        <Message label="Table" color="cloth">
          Session table will appear once the session state is available.
        </Message>
      </section>
    );
  }

  return (
    <section
      className={cn(
        styles.tableSurface,
        "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 pb-2 pt-1 sm:px-3",
        className,
      )}
    >
      <div className="stack min-w-0 gap-3 pb-2">
        <article className={cn(styles.laneSurface, "min-w-0 pb-1")}>
          <LaneHeader
            label="Shared"
            variant="cloth"
            className={styles.sharedLane}
            showSendButton={Boolean(onSendCardsToTarget) && hasStagedCards}
            onSend={
              onSendCardsToTarget
                ? () => onSendCardsToTarget({ scope: "shared" })
                : undefined
            }
          />
          <div className="min-w-0 pt-1">
            <LaneCards
              campaign={campaign}
              entries={sharedEntries}
              canRemoveEntry={canRemoveEntry}
              isFadingEntry={isFadingEntry}
              onRequestRemoveEntry={handleRequestRemoveEntry}
            />
          </div>
        </article>

        {players.map((participant, index) => {
          const claim = claimByParticipantId.get(participant.participantId);
          const actor = claim ? actorByFragmentId.get(claim.actorFragmentId) : undefined;
          const laneLabel = actor?.title ?? participant.displayName;
          const isCurrentLane =
            Boolean(currentParticipantId) &&
            participant.participantId === currentParticipantId;
          const outcomePile =
            outcomePilesByParticipantId[participant.participantId] ??
            emptyOutcomePile;

          return (
            <article
              key={participant.participantId}
              className={cn(
                styles.laneSurface,
                "min-w-0 pb-1",
                isCurrentLane && styles.currentLane,
              )}
            >
              <LaneHeader
                label={laneLabel}
                variant={getLaneVariant(viewerRole, isCurrentLane, index)}
                showSendButton={Boolean(onSendCardsToTarget) && hasStagedCards}
                onSend={
                  onSendCardsToTarget
                    ? () =>
                        onSendCardsToTarget({
                          scope: "participant",
                          participantId: participant.participantId,
                        })
                    : undefined
                }
              />
              <div className="min-w-0 pt-1">
                <OutcomePilesRow
                  participantId={participant.participantId}
                  pile={outcomePile}
                  isCurrentLane={viewerRole === "player" && isCurrentLane}
                  onDrawOutcomeCard={onDrawOutcomeCard}
                  onShuffleOutcomeDeck={onShuffleOutcomeDeck}
                  onPlayOutcomeCards={onPlayOutcomeCards}
                />
              </div>
              <div className="min-w-0 pt-2">
                <LaneCards
                  campaign={campaign}
                  entries={entriesByParticipantId.get(participant.participantId) ?? []}
                  canRemoveEntry={canRemoveEntry}
                  isFadingEntry={isFadingEntry}
                  onRequestRemoveEntry={handleRequestRemoveEntry}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
