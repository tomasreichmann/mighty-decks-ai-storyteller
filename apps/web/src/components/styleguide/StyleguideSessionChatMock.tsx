import { useState } from "react";
import type {
  CampaignSessionParticipant,
  CampaignSessionTranscriptEntry,
} from "@mighty-decks/spec/campaign";
import type {
  AssetBaseSlug,
  AssetModifierSlug,
} from "@mighty-decks/spec/assetCards";
import type { CounterIconSlug } from "@mighty-decks/spec/counterCards";
import type { ResolvedGameCard } from "../../lib/markdownGameComponents";
import { createGameCardCatalogContextValue } from "../../lib/gameCardCatalogContext";
import { resolveGameCard } from "../../lib/markdownGameComponents";
import { cn } from "../../utils/cn";
import { CampaignSessionTranscriptFeed } from "../CampaignSessionTranscriptFeed";
import { GameCardView } from "../adventure-module/GameCardView";
import { AssetCard } from "../cards/AssetCard";
import { CounterCard } from "../cards/CounterCard";
import { CardBoundary } from "../common/CardBoundary";
import { Button } from "../common/Button";
import { ButtonRadioGroup } from "../common/ButtonRadioGroup";
import { ConnectionStatusPill } from "../common/ConnectionStatusPill";
import { Label, type LabelVariant } from "../common/Label";
import { TextArea } from "../common/TextArea";
import styles from "./StyleguideSessionChatMock.module.css";

type ViewerRole = "player" | "storyteller";
type MobilePane = "table" | "chat";

interface StyleguideSessionChatMockProps {
  viewerRole: ViewerRole;
}

type TableLeafCard =
  | {
      id: string;
      kind: "game_card";
      title: string;
      card: ResolvedGameCard;
    }
  | {
      id: string;
      kind: "asset";
      title: string;
      baseAssetSlug: AssetBaseSlug;
      modifierSlug?: AssetModifierSlug;
    }
  | {
      id: string;
      kind: "counter";
      title: string;
      iconSlug: CounterIconSlug;
      currentValue: number;
      maxValue?: number;
      description?: string;
    };

type TableCard =
  | TableLeafCard
  | {
      id: string;
      kind: "stack";
      title: string;
      cards: readonly TableLeafCard[];
    };

interface TableCardGroup {
  id: string;
  title: string;
  cards: readonly TableCard[];
}

interface PlayerLane {
  playerId: string;
  playerName: string;
  tone: "fire" | "monster" | "cloth";
  groups: readonly TableCardGroup[];
}

const storytellerParticipantId = "participant-gideon";
const currentPlayerId = "participant-iris";
const compactCardClassName = "w-full max-w-[6.5rem]";
const fullCardHeightRem = 10.6;
const stackPeekStepRem = 0.9;

const emptyCatalog = createGameCardCatalogContextValue();

const mustResolveGameCard = (
  type: Parameters<typeof resolveGameCard>[0],
  slug: string,
): ResolvedGameCard => {
  const resolved = resolveGameCard(type, slug);

  if (!resolved) {
    throw new Error(`Could not resolve ${type} card for slug "${slug}".`);
  }

  return resolved;
};

const sampleParticipants: readonly CampaignSessionParticipant[] = [
  {
    participantId: storytellerParticipantId,
    displayName: "Gideon Pike",
    role: "storyteller",
    connected: true,
    isMock: false,
    joinedAtIso: "2026-04-01T18:30:00.000Z",
  },
  {
    participantId: currentPlayerId,
    displayName: "Iris Vale",
    role: "player",
    connected: true,
    isMock: false,
    joinedAtIso: "2026-04-01T18:31:00.000Z",
  },
  {
    participantId: "participant-juniper",
    displayName: "Juniper Reed",
    role: "player",
    connected: true,
    isMock: false,
    joinedAtIso: "2026-04-01T18:32:00.000Z",
  },
  {
    participantId: "participant-marek",
    displayName: "Marek Thorn",
    role: "player",
    connected: true,
    isMock: false,
    joinedAtIso: "2026-04-01T18:33:00.000Z",
  },
] as const;

const sampleTranscript: readonly CampaignSessionTranscriptEntry[] = [
  {
    entryId: "entry-joined-storyteller",
    kind: "system",
    text: "Gideon Pike joined as storyteller.",
    createdAtIso: "2026-04-01T18:30:05.000Z",
  },
  {
    entryId: "entry-joined-iris",
    kind: "system",
    text: "Iris Vale joined as player.",
    createdAtIso: "2026-04-01T18:31:04.000Z",
  },
  {
    entryId: "entry-joined-juniper",
    kind: "system",
    text: "Juniper Reed joined as player.",
    createdAtIso: "2026-04-01T18:32:11.000Z",
  },
  {
    entryId: "entry-joined-marek",
    kind: "system",
    text: "Marek Thorn joined as player.",
    createdAtIso: "2026-04-01T18:33:08.000Z",
  },
  {
    entryId: "entry-message-gideon-1",
    kind: "group_message",
    participantId: storytellerParticipantId,
    authorDisplayName: "Gideon Pike",
    authorRole: "storyteller",
    text: "Rain rattles the stained glass as the reliquary latch snaps loose. The bell counter is live, two wardens are on the balcony, and the bridge below is already flooding.",
    createdAtIso: "2026-04-01T18:34:11.000Z",
  },
  {
    entryId: "entry-message-iris-1",
    kind: "group_message",
    participantId: currentPlayerId,
    authorDisplayName: "Iris Vale",
    authorRole: "player",
    text: "I slide the lantern to Juniper, hook my rope line onto the gallery rail, and start mapping the cleanest way out.",
    createdAtIso: "2026-04-01T18:34:34.000Z",
  },
  {
    entryId: "entry-message-juniper-1",
    kind: "group_message",
    participantId: "participant-juniper",
    authorDisplayName: "Juniper Reed",
    authorRole: "player",
    text: "Copy that. I keep one eye on the suspicion counter while I ready the crossbow and steady the rope.",
    createdAtIso: "2026-04-01T18:35:02.000Z",
  },
  {
    entryId: "entry-message-gideon-2",
    kind: "group_message",
    participantId: storytellerParticipantId,
    authorDisplayName: "Gideon Pike",
    authorRole: "storyteller",
    text: "Bootsteps hammer up the stone stair. If the toll bell reaches five before you clear the gallery, the whole patrol converges on the reliquary.",
    createdAtIso: "2026-04-01T18:35:33.000Z",
  },
  {
    entryId: "entry-message-marek-1",
    kind: "group_message",
    participantId: "participant-marek",
    authorDisplayName: "Marek Thorn",
    authorRole: "player",
    text: "I wedge the shield between the stairwell doors and buy us one loud, ugly round of breathing room.",
    createdAtIso: "2026-04-01T18:36:01.000Z",
  },
] as const;

const sharedCards: readonly TableCard[] = [
  {
    id: "shared-suspicion",
    kind: "counter",
    title: "Guard Suspicion",
    iconSlug: "danger",
    currentValue: 4,
    maxValue: 6,
    description: "Balcony wardens are almost on top of the crew.",
  },
  {
    id: "shared-bell",
    kind: "counter",
    title: "Bell Toll",
    iconSlug: "time",
    currentValue: 2,
    maxValue: 5,
    description: "The next toll closes the cleanest exit.",
  },
  {
    id: "shared-document",
    kind: "asset",
    title: "Document",
    baseAssetSlug: "base_document",
  },
  {
    id: "shared-boost",
    kind: "game_card",
    title: "Boost",
    card: mustResolveGameCard("EffectCard", "boost"),
  },
  {
    id: "shared-key",
    kind: "asset",
    title: "Key",
    baseAssetSlug: "medieval_key",
  },
] as const;

const playerLanes: readonly PlayerLane[] = [
  {
    playerId: currentPlayerId,
    playerName: "Iris Vale",
    tone: "fire",
    groups: [
      {
        id: "iris-stunts",
        title: "Stunts",
        cards: [
          {
            id: "iris-grapple",
            kind: "game_card",
            title: "Grapple",
            card: mustResolveGameCard("StuntCard", "grapple"),
          },
          {
            id: "iris-flex",
            kind: "game_card",
            title: "Flex",
            card: mustResolveGameCard("StuntCard", "flex"),
          },
        ],
      },
      {
        id: "iris-effects",
        title: "Effects",
        cards: [
          {
            id: "iris-boost",
            kind: "game_card",
            title: "Boost",
            card: mustResolveGameCard("EffectCard", "boost"),
          },
        ],
      },
      {
        id: "iris-assets",
        title: "Assets",
        cards: [
          {
            id: "iris-grappling-hook",
            kind: "asset",
            title: "Grappling Hook",
            baseAssetSlug: "medieval_grappling_hook",
          },
          {
            id: "iris-lantern",
            kind: "asset",
            title: "Lantern",
            baseAssetSlug: "medieval_lantern",
          },
        ],
      },
    ],
  },
  {
    playerId: "participant-juniper",
    playerName: "Juniper Reed",
    tone: "monster",
    groups: [
      {
        id: "juniper-stunts",
        title: "Stunts",
        cards: [
          {
            id: "juniper-fearless",
            kind: "game_card",
            title: "Fearless",
            card: mustResolveGameCard("StuntCard", "fearless"),
          },
        ],
      },
      {
        id: "juniper-effects",
        title: "Effects",
        cards: [
          {
            id: "juniper-distress",
            kind: "game_card",
            title: "Distress",
            card: mustResolveGameCard("EffectCard", "distress"),
          },
        ],
      },
      {
        id: "juniper-assets",
        title: "Assets",
        cards: [
          {
            id: "juniper-crossbow",
            kind: "asset",
            title: "Crossbow",
            baseAssetSlug: "medieval_crossbow",
          },
          {
            id: "juniper-healing",
            kind: "asset",
            title: "Healing",
            baseAssetSlug: "base_healing",
          },
        ],
      },
    ],
  },
  {
    playerId: "participant-marek",
    playerName: "Marek Thorn",
    tone: "cloth",
    groups: [
      {
        id: "marek-stunts",
        title: "Stunts",
        cards: [
          {
            id: "marek-dont-give-up",
            kind: "game_card",
            title: "Don't Give Up",
            card: mustResolveGameCard("StuntCard", "dontGiveUp"),
          },
          {
            id: "marek-power-attack",
            kind: "game_card",
            title: "Power Attack",
            card: mustResolveGameCard("StuntCard", "powerAttack"),
          },
        ],
      },
      {
        id: "marek-effects",
        title: "Effects",
        cards: [
          {
            id: "marek-hindered",
            kind: "game_card",
            title: "Hindered",
            card: mustResolveGameCard("EffectCard", "hindered"),
          },
          {
            id: "marek-burning-stack",
            kind: "stack",
            title: "Burning",
            cards: [
              {
                id: "marek-burning-1",
                kind: "game_card",
                title: "Burning",
                card: mustResolveGameCard("EffectCard", "burning"),
              },
              {
                id: "marek-burning-2",
                kind: "game_card",
                title: "Burning",
                card: mustResolveGameCard("EffectCard", "burning"),
              },
              {
                id: "marek-burning-3",
                kind: "game_card",
                title: "Burning",
                card: mustResolveGameCard("EffectCard", "burning"),
              },
              {
                id: "marek-burning-4",
                kind: "game_card",
                title: "Burning",
                card: mustResolveGameCard("EffectCard", "burning"),
              },
              {
                id: "marek-burning-5",
                kind: "game_card",
                title: "Burning",
                card: mustResolveGameCard("EffectCard", "burning"),
              },
            ],
          },
        ],
      },
      {
        id: "marek-assets",
        title: "Assets",
        cards: [
          {
            id: "marek-shield",
            kind: "asset",
            title: "Shield",
            baseAssetSlug: "base_shield",
          },
          {
            id: "marek-kite-shield",
            kind: "asset",
            title: "Kite Shield",
            baseAssetSlug: "medieval_kite-shield",
          },
        ],
      },
    ],
  },
] as const;

const renderTableCard = (card: TableLeafCard): JSX.Element => {
  if (card.kind === "game_card") {
    return (
      <CardBoundary
        resetKey={`${card.card.type}-${card.card.slug}`}
        label="Card failed to render"
        message="This preview could not render."
        className={compactCardClassName}
      >
        <GameCardView gameCard={card.card} className={compactCardClassName} />
      </CardBoundary>
    );
  }

  if (card.kind === "asset") {
    return (
      <AssetCard
        baseAssetSlug={card.baseAssetSlug}
        modifierSlug={card.modifierSlug}
        className={compactCardClassName}
      />
    );
  }

  return (
    <CounterCard
      className={compactCardClassName}
      iconSlug={card.iconSlug}
      title={card.title}
      currentValue={card.currentValue}
      maxValue={card.maxValue}
      description={card.description}
    />
  );
};

interface CardSlotProps {
  card: TableCard;
  showDiscardControl: boolean;
}

const renderDiscardControl = (
  title: string,
  topRem = 0,
): JSX.Element => (
  <div
    className="absolute right-0.5 z-20"
    style={{
      top: `${topRem}rem`,
    }}
  >
    <Button
      type="button"
      variant="circle"
      color="curse"
      size="sm"
      aria-label={`Discard ${title}`}
      className="!h-5 !w-5 !border-x-[2px] !border-y-[2px] text-[0.7rem]"
    >
      <span aria-hidden="true">X</span>
    </Button>
  </div>
);

const getStackHeightRem = (peekCount: number): number =>
  fullCardHeightRem + peekCount * stackPeekStepRem;

const StackedCardSlot = ({
  card,
  showDiscardControl,
}: CardSlotProps & { card: Extract<TableCard, { kind: "stack" }> }): JSX.Element => {
  const visibleCards = card.cards.slice(0, 5);
  const topCard = visibleCards[0];
  const peekCards = visibleCards.slice(1);
  const topCardOffsetRem = peekCards.length * stackPeekStepRem;

  if (!topCard) {
    return <></>;
  }

  return (
    <div
      className="relative flex w-[6.5rem] min-w-0 max-w-[6.5rem] shrink-0"
      style={{
        height: `${getStackHeightRem(peekCards.length)}rem`,
      }}
    >
      {showDiscardControl ? renderDiscardControl(card.title, topCardOffsetRem) : null}
      <div
        className="relative w-full"
        style={{
          height: `${getStackHeightRem(peekCards.length)}rem`,
        }}
      >
        <div
          className={cn(styles.stackTopCard, "z-10")}
          style={{
            top: `${peekCards.length * stackPeekStepRem}rem`,
          }}
        >
          {renderTableCard(topCard)}
        </div>
        {peekCards.map((peekCard, index) => (
          <div
            key={peekCard.id}
            className={styles.stackPeek}
            style={{
              top: `${index * stackPeekStepRem}rem`,
            }}
          >
            <div className={styles.stackPeekViewport}>
              {renderTableCard(peekCard)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CardSlot = ({ card, showDiscardControl }: CardSlotProps): JSX.Element => {
  if (card.kind === "stack") {
    return <StackedCardSlot card={card} showDiscardControl={showDiscardControl} />;
  }

  return (
    <div className="relative flex w-[6.5rem] min-w-0 max-w-[6.5rem] shrink-0 pt-3">
      {showDiscardControl ? renderDiscardControl(card.title) : null}
      {renderTableCard(card)}
    </div>
  );
};

interface CardStripProps {
  cards: readonly TableCard[];
  showDiscardControl: boolean;
}

const CardStrip = ({
  cards,
  showDiscardControl,
}: CardStripProps): JSX.Element => {
  return (
    <div className="flex min-w-0 flex-wrap content-start gap-2">
      {cards.map((card) => (
        <CardSlot
          key={card.id}
          card={card}
          showDiscardControl={showDiscardControl}
        />
      ))}
    </div>
  );
};

interface LaneHeaderProps {
  label: string;
  variant: LabelVariant;
  className?: string;
}

const LaneHeader = ({
  label,
  variant,
  className,
}: LaneHeaderProps): JSX.Element => {
  return (
    <div className={cn(styles.laneDividerRow, className)}>
      <div className={styles.laneDivider} />
      <Label color={variant} rotate={false} className={styles.laneLabel}>
        {label}
      </Label>
    </div>
  );
};

interface SharedTableProps {
  viewerRole: ViewerRole;
}

const SharedTableSection = ({ viewerRole }: SharedTableProps): JSX.Element => {
  return (
    <section className={cn(styles.laneSurface, styles.sharedSurface, "min-w-0 pb-1")}>
      <LaneHeader label="Shared" variant="cloth" className={styles.sharedLane} />
      <div className="min-w-0 pt-1">
        <CardStrip
          cards={sharedCards}
          showDiscardControl={viewerRole === "storyteller"}
        />
      </div>
    </section>
  );
};

interface TablePaneProps {
  className?: string;
  viewerRole: ViewerRole;
}

const TablePane = ({
  className,
  viewerRole,
}: TablePaneProps): JSX.Element => {
  return (
    <section
      className={cn(
        styles.tableBackdrop,
        "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 pb-2 pt-1 sm:px-3",
        className,
      )}
    >
      <div className="stack min-w-0 gap-3 pb-2">
        <SharedTableSection viewerRole={viewerRole} />
        {playerLanes.map((lane) => (
          <PlayerLaneSection
            key={lane.playerId}
            lane={lane}
            viewerRole={viewerRole}
          />
        ))}
      </div>
    </section>
  );
};

interface PlayerLaneProps {
  lane: PlayerLane;
  viewerRole: ViewerRole;
}

const PlayerLaneSection = ({
  lane,
  viewerRole,
}: PlayerLaneProps): JSX.Element => {
  const isCurrentLane = viewerRole === "player" && lane.playerId === currentPlayerId;
  const showDiscardControl =
    viewerRole === "storyteller" || lane.playerId === currentPlayerId;
  const laneCards = lane.groups.flatMap((group) => group.cards);

  return (
    <article className={cn(styles.laneSurface, "min-w-0 pb-1", isCurrentLane && styles.currentLane)}>
      <LaneHeader
        label={lane.playerName}
        variant={isCurrentLane ? "gold" : lane.tone}
      />

      <div className="min-w-0 pt-1">
        <CardStrip cards={laneCards} showDiscardControl={showDiscardControl} />
      </div>
    </article>
  );
};

interface ChatRailProps {
  viewerRole: ViewerRole;
}

const ChatRail = ({ viewerRole }: ChatRailProps): JSX.Element => {
  const currentParticipantId =
    viewerRole === "player" ? currentPlayerId : storytellerParticipantId;
  const draftText =
    viewerRole === "player"
      ? "I cut the rope at the last second, let the lantern swing wide, and dash for the flooded bridge while Marek holds the stair."
      : "The bell peals again. Cold floodwater washes over the lowest steps, and a second patrol line appears below the gallery.";

  return (
    <section className={cn("flex min-h-0 flex-col gap-3", styles.chatRail)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label color={viewerRole === "player" ? "fire" : "gold"} rotate={false}>
          Chat
        </Label>
        <div className="flex flex-wrap gap-2">
          <ConnectionStatusPill label="Storyteller" status="connected" />
          <ConnectionStatusPill label="Players" status="connected" detail="3 live" />
        </div>
      </div>

      <CampaignSessionTranscriptFeed
        entries={sampleTranscript}
        participants={sampleParticipants}
        currentParticipantId={currentParticipantId}
        gameCardCatalogValue={emptyCatalog}
        className="min-h-[18rem] flex-1"
      />

      <div className="stack gap-2">
        <TextArea
          readOnly
          label="Message"
          color={viewerRole === "player" ? "fire" : "gold"}
          rows={4}
          value={draftText}
          placeholder="Share your next move..."
          controlClassName="min-h-[7.5rem] pr-12"
          topRightControl={
            <Button
              type="button"
              variant="circle"
              color="cloth"
              size="sm"
              aria-label="Insert image"
              className="!h-8 !w-8 !border-x-[2px] !border-y-[2px] text-[0.8rem]"
            >
              +
            </Button>
          }
        />
        <div className="flex flex-wrap items-end gap-2">
          {viewerRole === "storyteller" ? (
            <Button variant="solid" color="curse" size="sm" type="button">
              End Session
            </Button>
          ) : null}
          <div className="flex-1" />
          <Button color="gold" type="button">
            Send
          </Button>
        </div>
      </div>
    </section>
  );
};

export const StyleguideSessionChatMock = ({
  viewerRole,
}: StyleguideSessionChatMockProps): JSX.Element => {
  const [activeMobilePane, setActiveMobilePane] = useState<MobilePane>("chat");

  return (
    <div
      className={cn(
        styles.pageBackdrop,
        "flex h-[100dvh] min-h-[100dvh] w-full flex-1 flex-col overflow-hidden",
      )}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden py-2 sm:py-3">
        <div className="mb-2 lg:hidden">
          <ButtonRadioGroup
            ariaLabel="Session chat mobile pane"
            color="cloth"
            value={activeMobilePane}
            onValueChange={setActiveMobilePane}
            options={[
              { label: "Table", value: "table" },
              { label: "Chat", value: "chat" },
            ]}
          />
        </div>

        <div className="hidden min-h-0 flex-1 overflow-hidden lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-4 lg:px-3">
          <TablePane viewerRole={viewerRole} />

          <ChatRail viewerRole={viewerRole} />
        </div>

        <div className="flex min-h-0 flex-1 lg:hidden">
          {activeMobilePane === "table" ? (
            <TablePane viewerRole={viewerRole} className="mx-2 sm:mx-3" />
          ) : null}
          {activeMobilePane === "chat" ? (
            <div className="flex min-h-0 w-full flex-1 flex-col px-2 sm:px-3">
              <ChatRail viewerRole={viewerRole} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
