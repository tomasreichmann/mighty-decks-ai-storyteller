import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import type { BoardItemRecord } from "../../lib/board/boardController";
import {
  createSpaceshipBoardItemMeta,
} from "../../lib/spaceship/spaceshipBoardLayout";
import type {
  SpaceshipDragState,
  SpaceshipDraggableToken,
  SpaceshipScene,
} from "../../lib/spaceship/spaceshipTypes";
import { Text } from "../common/Text";
import { ActorToken } from "./ActorToken";
import { EnergyToken } from "./EnergyToken";
import { EnergyTokenStack } from "./EnergyTokenStack";
import {
  ShipLocationCardSurface,
  ShipLocationDeviceCard,
} from "./ShipLocationCard";
import { ShipEffectCardSurface } from "./ShipEffectStack";
import {
  SpaceshipActorCardSurface,
  SpaceshipActorEffectSurface,
} from "./SpaceshipActorStrip";

const SpaceshipShipHeader = ({
  pane,
}: {
  pane: SpaceshipScene["panes"][number];
}): JSX.Element => (
  <div className="spaceship-ship-header flex h-full w-full items-start">
    <div className="stack max-w-2xl gap-2">
      <Text variant="h3" color="steel-light" className="text-[1.8rem]">
        {pane.title}
      </Text>
    </div>
  </div>
);

const SpaceshipTokenSurface = ({
  token,
  onTokenPointerDown,
}: {
  token: SpaceshipDraggableToken;
  onTokenPointerDown: (
    tokenId: string,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
}): JSX.Element => (
  <div
    data-spaceship-token
    data-token-kind={token.kind}
    className="spaceship-token-surface pointer-events-auto cursor-grab touch-none select-none active:cursor-grabbing"
    onPointerDown={(event) => onTokenPointerDown(token.tokenId, event)}
  >
    {token.kind === "energy" ? (
      <EnergyToken
        label={token.label}
        detail={token.detail}
        state={token.state}
      />
    ) : (
      <ActorToken
        label={token.label}
        imageUrl={token.imageUrl ?? "/actors/base/cog.png"}
        tone={token.tone}
      />
    )}
  </div>
);

const SpaceshipCardDragSurface = ({
  itemId,
  children,
  onCardPointerDown,
}: {
  itemId: string;
  children: ReactNode;
  onCardPointerDown: (
    itemId: string,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
}): JSX.Element => (
  <div
    data-spaceship-draggable-card
    className="spaceship-card-drag-surface pointer-events-auto cursor-grab touch-none select-none active:cursor-grabbing"
    onPointerDown={(event) => onCardPointerDown(itemId, event)}
  >
    {children}
  </div>
);

export const SpaceshipBoardItem = ({
  item,
  metaMap,
  dragState,
  onCardPointerDown,
  onTokenPointerDown,
  onEnergyStackPointerDown,
}: {
  item: BoardItemRecord;
  metaMap: ReturnType<typeof createSpaceshipBoardItemMeta>;
  dragState: SpaceshipDragState;
  onCardPointerDown: (
    itemId: string,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  onTokenPointerDown: (
    tokenId: string,
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  onEnergyStackPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
}): ReactNode => {
  const meta = metaMap.get(item.id);

  if (!meta) {
    return null;
  }

  switch (meta.role) {
    case "ship-header":
      return meta.pane ? <SpaceshipShipHeader pane={meta.pane} /> : null;
    case "location":
      return meta.location ? (
        <SpaceshipCardDragSurface
          itemId={item.id}
          onCardPointerDown={onCardPointerDown}
        >
          <ShipLocationCardSurface location={meta.location} />
        </SpaceshipCardDragSurface>
      ) : null;
    case "device":
      return meta.location ? (
        <SpaceshipCardDragSurface
          itemId={item.id}
          onCardPointerDown={onCardPointerDown}
        >
          <ShipLocationDeviceCard location={meta.location} />
        </SpaceshipCardDragSurface>
      ) : null;
    case "effect-card":
      return meta.effectType ? (
        <SpaceshipCardDragSurface
          itemId={item.id}
          onCardPointerDown={onCardPointerDown}
        >
          <ShipEffectCardSurface effectType={meta.effectType} />
        </SpaceshipCardDragSurface>
      ) : null;
    case "token":
      return meta.token ? (
        <SpaceshipTokenSurface
          token={meta.token}
          onTokenPointerDown={onTokenPointerDown}
        />
      ) : null;
    case "energy-stack":
      return (
        <EnergyTokenStack
          availableCount={dragState.energyStack.availableCount}
          totalCount={dragState.energyStack.totalCount}
          onPointerDown={onEnergyStackPointerDown}
        />
      );
    case "actor-effect-card":
      return meta.actor && meta.effectType ? (
        <SpaceshipCardDragSurface
          itemId={item.id}
          onCardPointerDown={onCardPointerDown}
        >
          <SpaceshipActorEffectSurface effectType={meta.effectType} />
        </SpaceshipCardDragSurface>
      ) : null;
    case "actor-card":
      return meta.actor ? (
        <SpaceshipCardDragSurface
          itemId={item.id}
          onCardPointerDown={onCardPointerDown}
        >
          <SpaceshipActorCardSurface actor={meta.actor} />
        </SpaceshipCardDragSurface>
      ) : null;
    default:
      return null;
  }
};
