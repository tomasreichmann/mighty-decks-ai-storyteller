import type { BoardItemRecord, BoardPoint } from "../../board/boardController";
import {
  boardOrigin,
  effectCardHeight,
  effectCardWidth,
  spaceshipBoardItemId,
  spaceshipDispenserPanelSize,
  spaceshipTokenSize,
} from "../board/geometry";
import {
  createSpaceshipBoardItemMeta,
  isSpaceshipCardDropTargetItemId,
} from "../board/items";
import { createSpaceshipBoardLayout } from "../board/layout";
import {
  createInitialSpaceshipLayouts,
  findCardLayoutId,
} from "./layoutState";
import type {
  ActorTokenModel,
  EnergyTokenModel,
  ShipEffectType,
  SpaceshipScene,
} from "../scene/types";
import type {
  SpaceshipDragState,
  SpaceshipDraggableCard,
  SpaceshipDraggableCardRole,
  SpaceshipDraggableToken,
  SpaceshipTrashDropResult,
} from "./types";
import {
  mapSpaceshipCards,
  mapSpaceshipTokens,
  removeIds,
} from "./stateHelpers";

export {
  findTopmostItemAtPoint,
  getEnergyStackInitialItem,
  getFrameTrashTargetBounds,
  isFrameBoundsOverTrashTarget,
  isFramePointOverTrashTarget,
  isPointOverEnergyStack,
  spaceshipTrashFrameTargetSize,
} from "./hitTesting";
export {
  applySpaceshipCardLiveSnap,
  createInitialSpaceshipLayouts,
  findCardLayoutId,
  insertSpaceshipCardIntoLayout,
  removeSpaceshipCardFromLayouts,
  resolveSpaceshipCardSnapTarget,
  spaceshipLayoutId,
} from "./layoutState";

const tokenGap = 10;
const cardZIndexBase = 1000;
const tokenZIndexBase = 100000;
const dispenserPanelZIndexBase = 900;
export const spaceshipCardLayoutTearOffDistancePx = 10;
export const spaceshipCardSnapInsertCooldownMs = 400;
const draggableCardRoles = new Set<SpaceshipDraggableCardRole>([
  "location",
  "device",
  "effect-card",
  "actor-card",
  "actor-effect-card",
]);

export const didSpaceshipCardLayoutDragExceedTearOffDistance = ({
  anchorClientX,
  anchorClientY,
  clientX,
  clientY,
  minDistancePx = spaceshipCardLayoutTearOffDistancePx,
}: {
  anchorClientX: number;
  anchorClientY: number;
  clientX: number;
  clientY: number;
  minDistancePx?: number;
}): boolean =>
  Math.hypot(clientX - anchorClientX, clientY - anchorClientY) >=
  minDistancePx;

export const isSpaceshipCardSnapInsertBlocked = (
  currentTimeMs: number,
  blockedUntilMs: number | null | undefined,
): boolean =>
  typeof blockedUntilMs === "number" &&
  Number.isFinite(blockedUntilMs) &&
  currentTimeMs < blockedUntilMs;

export const isSpaceshipCardLayoutTearOffBlocked = (
  currentTimeMs: number,
  blockedUntilMs: number | null | undefined,
): boolean =>
  typeof blockedUntilMs === "number" &&
  Number.isFinite(blockedUntilMs) &&
  currentTimeMs < blockedUntilMs;

const createBoardToken = ({
  token,
  index,
  paneId,
  locationId,
  cardItemId,
  offsetX,
  offsetY,
}: {
  token: EnergyTokenModel | ActorTokenModel;
  index: number;
  paneId: string;
  locationId: string;
  cardItemId: string;
  offsetX: number;
  offsetY: number;
}): SpaceshipDraggableToken => {
  if ("imageUrl" in token) {
    return {
      tokenId: token.tokenId,
      kind: "actor",
      label: token.label,
      imageUrl: token.imageUrl,
      tone: token.tone,
      x: 0,
      y: 0,
      width: spaceshipTokenSize.actor.width,
      height: spaceshipTokenSize.actor.height,
      zIndex: tokenZIndexBase + index,
      paneId,
      sourceLocationId: locationId,
      placement: {
        type: "card",
        cardItemId,
        offsetX,
        offsetY,
      },
    };
  }

  return {
    tokenId: token.tokenId,
    kind: "energy",
    label: token.label,
    detail: token.detail,
    state: token.state,
    x: 0,
    y: 0,
    width: spaceshipTokenSize.energy.width,
    height: spaceshipTokenSize.energy.height,
    zIndex: tokenZIndexBase + index,
    paneId,
    sourceLocationId: locationId,
    placement: {
      type: "card",
      cardItemId,
      offsetX,
      offsetY,
    },
  };
};

export const createSpaceshipDragState = (
  scene: SpaceshipScene,
): SpaceshipDragState => {
  const tokens: SpaceshipDraggableToken[] = [];
  const layouts = createInitialSpaceshipLayouts(scene);
  const baseLayout = createSpaceshipBoardLayout(scene);
  const metaMap = createSpaceshipBoardItemMeta(scene);
  const cards = baseLayout.placements
    .filter((placement) => isSpaceshipCardDropTargetItemId(placement.id))
    .map((placement): SpaceshipDraggableCard | null => {
      const meta = metaMap.get(placement.id);
      if (!meta || !draggableCardRoles.has(meta.role as SpaceshipDraggableCardRole)) {
        return null;
      }

      return {
        itemId: placement.id,
        role: meta.role as SpaceshipDraggableCardRole,
        effectType: meta.effectType,
        paneId: meta.pane?.paneId,
        ownerId:
          meta.location?.locationId ??
          meta.actor?.actorId ??
          meta.pane?.paneId,
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        zIndex: placement.zIndex ?? 0,
        placement: {
          type: "layout",
          layoutId: findCardLayoutId(layouts, placement.id),
        },
      };
    })
    .filter((card): card is SpaceshipDraggableCard => Boolean(card));

  scene.panes.forEach((pane) => {
    pane.locations.forEach((location) => {
      const powerTokens =
        location.device && location.device.powerTokens.length > 0
          ? location.device.powerTokens
          : location.energyTokens;
      const locationTokens: (EnergyTokenModel | ActorTokenModel)[] = [
        ...powerTokens,
        ...location.actorTokens,
      ];
      const tokenWidths = locationTokens.map((token) =>
        "imageUrl" in token
          ? spaceshipTokenSize.actor.width
          : spaceshipTokenSize.energy.width,
      );
      const totalTokenWidth =
        tokenWidths.reduce((total, width) => total + width, 0) +
        Math.max(0, locationTokens.length - 1) * tokenGap;
      let cursorX = (332 - totalTokenWidth) / 2;

      locationTokens.forEach((token, index) => {
        const width = tokenWidths[index] ?? spaceshipTokenSize.energy.width;
        const height =
          "imageUrl" in token
            ? spaceshipTokenSize.actor.height
            : spaceshipTokenSize.energy.height;
        tokens.push(
          createBoardToken({
            token,
            index: tokens.length,
            paneId: pane.paneId,
            locationId: location.locationId,
            cardItemId: spaceshipBoardItemId.location(location.locationId),
            offsetX: cursorX,
            offsetY: (204 - height) / 2,
          }),
        );
        cursorX += width + tokenGap;
      });
    });
  });

  return {
    layouts,
    cards,
    tokens,
    dispenserPanel: {
      x: boardOrigin.x - spaceshipDispenserPanelSize.width - 24,
      y: boardOrigin.y + 28,
      width: spaceshipDispenserPanelSize.width,
      height: spaceshipDispenserPanelSize.height,
      zIndex: dispenserPanelZIndexBase,
    },
    nextCardZIndex: cardZIndexBase,
    nextZIndex: tokenZIndexBase + tokens.length,
    nextEnergyTokenIndex: 1,
    nextEffectCardIndex: 1,
  };
};

const removeCardsFromLayouts = (
  state: SpaceshipDragState,
  removedCardIds: Set<string>,
): SpaceshipDragState => ({
  ...state,
  layouts: {
    locationRows: state.layouts.locationRows.map((layout) => ({
      ...layout,
      itemIds: removeIds(layout.itemIds, removedCardIds),
    })),
    deviceColumns: state.layouts.deviceColumns.map((layout) => ({
      ...layout,
      itemIds: removeIds(layout.itemIds, removedCardIds),
    })),
    effectStacks: state.layouts.effectStacks.map((layout) => ({
      ...layout,
      itemIds: removeIds(layout.itemIds, removedCardIds),
    })),
    actorRows: state.layouts.actorRows.map((layout) => ({
      ...layout,
      itemIds: removeIds(layout.itemIds, removedCardIds),
    })),
  },
});

export const beginSpaceshipCardDrag = (
  state: SpaceshipDragState,
  itemId: string,
): { state: SpaceshipDragState; dragItemId: string } => {
  const zIndex = state.nextCardZIndex;
  return {
    dragItemId: itemId,
    state: {
      ...mapSpaceshipCards(state, itemId, (card) => ({
        ...card,
        zIndex,
      })),
      nextCardZIndex: zIndex + 1,
    },
  };
};

export const beginSpaceshipTokenDrag = (
  state: SpaceshipDragState,
  tokenId: string,
): { state: SpaceshipDragState; dragTokenId: string } => {
  const zIndex = state.nextZIndex;
  return {
    dragTokenId: tokenId,
    state: {
      ...mapSpaceshipTokens(state, tokenId, (token) => ({
        ...token,
        zIndex,
      })),
      nextZIndex: zIndex + 1,
    },
  };
};

export const beginDispenserPanelDrag = (
  state: SpaceshipDragState,
): { state: SpaceshipDragState } => {
  const zIndex = Math.max(state.nextCardZIndex, state.dispenserPanel.zIndex + 1);
  return {
    state: {
      ...state,
      dispenserPanel: {
        ...state.dispenserPanel,
        zIndex,
      },
      nextCardZIndex: zIndex + 1,
    },
  };
};

export const beginEnergyStackTokenDrag = (
  state: SpaceshipDragState,
  position: BoardPoint,
): { state: SpaceshipDragState; dragTokenId: string } => {
  const tokenId = `energy-dispenser-token-${state.nextEnergyTokenIndex}`;
  const token: SpaceshipDraggableToken = {
    tokenId,
    kind: "energy",
    label: "1",
    detail: "Unassigned power",
    x: position.x,
    y: position.y,
    width: spaceshipTokenSize.energy.width,
    height: spaceshipTokenSize.energy.height,
    zIndex: state.nextZIndex,
    placement: { type: "board" },
  };

  return {
    dragTokenId: tokenId,
    state: {
      ...state,
      tokens: [...state.tokens, token],
      nextZIndex: state.nextZIndex + 1,
      nextEnergyTokenIndex: state.nextEnergyTokenIndex + 1,
    },
  };
};

export const beginSpaceshipEffectDispenserCardDrag = (
  state: SpaceshipDragState,
  effectType: ShipEffectType,
  position: BoardPoint,
): { state: SpaceshipDragState; dragItemId: string } => {
  const itemId = spaceshipBoardItemId.spawnedEffectCard(
    effectType,
    state.nextEffectCardIndex,
  );
  const card: SpaceshipDraggableCard = {
    itemId,
    role: "effect-card",
    effectType,
    x: position.x,
    y: position.y,
    width: effectCardWidth,
    height: effectCardHeight,
    zIndex: state.nextCardZIndex,
    placement: { type: "board" },
  };

  return {
    dragItemId: itemId,
    state: {
      ...state,
      cards: [...state.cards, card],
      nextCardZIndex: state.nextCardZIndex + 1,
      nextEffectCardIndex: state.nextEffectCardIndex + 1,
    },
  };
};

export const moveSpaceshipCardFromDragOrigin = (
  state: SpaceshipDragState,
  itemId: string,
  drag: {
    startX: number;
    startY: number;
    startClientX: number;
    startClientY: number;
    clientX: number;
    clientY: number;
    zoom: number;
  },
): SpaceshipDragState => {
  const zoom = Number.isFinite(drag.zoom) && drag.zoom > 0 ? drag.zoom : 1;
  return mapSpaceshipCards(state, itemId, (card) => ({
    ...card,
    x: drag.startX + (drag.clientX - drag.startClientX) / zoom,
    y: drag.startY + (drag.clientY - drag.startClientY) / zoom,
    placement: { type: "board" },
  }));
};

export const moveDispenserPanelFromDragOrigin = (
  state: SpaceshipDragState,
  drag: {
    startX: number;
    startY: number;
    startClientX: number;
    startClientY: number;
    clientX: number;
    clientY: number;
    zoom: number;
  },
): SpaceshipDragState => {
  const zoom = Number.isFinite(drag.zoom) && drag.zoom > 0 ? drag.zoom : 1;
  return {
    ...state,
    dispenserPanel: {
      ...state.dispenserPanel,
      x: drag.startX + (drag.clientX - drag.startClientX) / zoom,
      y: drag.startY + (drag.clientY - drag.startClientY) / zoom,
    },
  };
};

export const moveSpaceshipToken = (
  state: SpaceshipDragState,
  tokenId: string,
  delta: { deltaX: number; deltaY: number; zoom: number },
): SpaceshipDragState => {
  const zoom = Number.isFinite(delta.zoom) && delta.zoom > 0 ? delta.zoom : 1;
  return mapSpaceshipTokens(state, tokenId, (token) => ({
    ...token,
    x: token.x + delta.deltaX / zoom,
    y: token.y + delta.deltaY / zoom,
    placement: { type: "board" },
  }));
};

export const moveSpaceshipTokenFromDragOrigin = (
  state: SpaceshipDragState,
  tokenId: string,
  drag: {
    startX: number;
    startY: number;
    startClientX: number;
    startClientY: number;
    clientX: number;
    clientY: number;
    zoom: number;
  },
): SpaceshipDragState => {
  const zoom = Number.isFinite(drag.zoom) && drag.zoom > 0 ? drag.zoom : 1;
  return mapSpaceshipTokens(state, tokenId, (token) => ({
    ...token,
    x: drag.startX + (drag.clientX - drag.startClientX) / zoom,
    y: drag.startY + (drag.clientY - drag.startClientY) / zoom,
    placement: { type: "board" },
  }));
};

export const dropSpaceshipCardOnBoard = (
  state: SpaceshipDragState,
  itemId: string,
): SpaceshipDragState =>
  mapSpaceshipCards(state, itemId, (card) => ({
    ...card,
    placement: { type: "board" },
  }));

export const dropSpaceshipTokenOnCard = (
  state: SpaceshipDragState,
  tokenId: string,
  cardItemId: string,
  cardPosition: BoardPoint,
): SpaceshipDragState =>
  mapSpaceshipTokens(state, tokenId, (token) => ({
    ...token,
    placement: {
      type: "card",
      cardItemId,
      offsetX: token.x - cardPosition.x,
      offsetY: token.y - cardPosition.y,
    },
  }));

export const dropSpaceshipTokenOnBoard = (
  state: SpaceshipDragState,
  tokenId: string,
): SpaceshipDragState =>
  mapSpaceshipTokens(state, tokenId, (token) => ({
    ...token,
    placement: { type: "board" },
  }));

export const dropSpaceshipTokenOnEnergyStack = (
  state: SpaceshipDragState,
  tokenId: string,
): SpaceshipDragState => {
  const token = state.tokens.find((candidate) => candidate.tokenId === tokenId);
  if (!token || token.kind !== "energy") {
    return state;
  }

  return {
    ...state,
    tokens: state.tokens.filter((candidate) => candidate.tokenId !== tokenId),
  };
};

const removeTokensFromTrashDrop = (
  state: SpaceshipDragState,
  tokenIds: Set<string>,
): SpaceshipTrashDropResult => {
  if (tokenIds.size === 0) {
    return { state, removedItemIds: [] };
  }

  const removedTokens = state.tokens.filter((token) =>
    tokenIds.has(token.tokenId),
  );
  return {
    removedItemIds: removedTokens.map((token) =>
      spaceshipBoardItemId.token(token.tokenId),
    ),
    state: {
      ...state,
      tokens: state.tokens.filter((token) => !tokenIds.has(token.tokenId)),
    },
  };
};

export const dropSpaceshipTokenOnTrashTarget = (
  state: SpaceshipDragState,
  tokenId: string,
): SpaceshipTrashDropResult => removeTokensFromTrashDrop(state, new Set([tokenId]));

const addEffectStackItemIds = (
  state: SpaceshipDragState,
  ownerItemId: string,
  removedCardIds: Set<string>,
): void => {
  state.layouts.effectStacks
    .filter((stack) => stack.ownerItemId === ownerItemId)
    .forEach((stack) => {
      stack.itemIds.forEach((itemId) => removedCardIds.add(itemId));
    });
};

const getActorIdFromActorCardItemId = (itemId: string): string => {
  const prefix = "spaceship:actor-card:";
  return itemId.startsWith(prefix) ? itemId.slice(prefix.length) : "";
};

const collectTrashCardBundleIds = (
  state: SpaceshipDragState,
  itemId: string,
): Set<string> => {
  const card = state.cards.find((candidate) => candidate.itemId === itemId);
  const removedCardIds = new Set<string>();
  if (!card) {
    return removedCardIds;
  }

  removedCardIds.add(itemId);

  if (card.role === "location") {
    const deviceItemIds = state.layouts.deviceColumns
      .filter((column) => column.locationItemId === itemId)
      .flatMap((column) => column.itemIds);
    deviceItemIds.forEach((deviceItemId) => removedCardIds.add(deviceItemId));
    addEffectStackItemIds(state, itemId, removedCardIds);
    deviceItemIds.forEach((deviceItemId) =>
      addEffectStackItemIds(state, deviceItemId, removedCardIds),
    );
  }

  if (card.role === "device" || card.role === "actor-card") {
    addEffectStackItemIds(state, itemId, removedCardIds);
  }

  return removedCardIds;
};

export const dropSpaceshipCardOnTrashTarget = (
  state: SpaceshipDragState,
  itemId: string,
): SpaceshipTrashDropResult => {
  const removedCardIds = collectTrashCardBundleIds(state, itemId);
  if (removedCardIds.size === 0) {
    return { state, removedItemIds: [] };
  }

  const actorTokenIds = new Set<string>();
  const card = state.cards.find((candidate) => candidate.itemId === itemId);
  if (card?.role === "actor-card") {
    const actorId = getActorIdFromActorCardItemId(itemId);
    if (actorId) {
      actorTokenIds.add(`${actorId}-token`);
    }
  }

  const attachedTokenIds = state.tokens
    .filter(
      (token) =>
        token.placement.type === "card" &&
        removedCardIds.has(token.placement.cardItemId),
    )
    .map((token) => token.tokenId);
  const removedTokenIds = new Set([...actorTokenIds, ...attachedTokenIds]);
  const withoutCards = removeCardsFromLayouts(
    {
      ...state,
      cards: state.cards.filter((candidate) => !removedCardIds.has(candidate.itemId)),
    },
    removedCardIds,
  );
  const tokenResult = removeTokensFromTrashDrop(withoutCards, removedTokenIds);

  return {
    state: tokenResult.state,
    removedItemIds: [...removedCardIds, ...tokenResult.removedItemIds],
  };
};

export const syncSpaceshipTokenPositions = (
  state: SpaceshipDragState,
  items: readonly BoardItemRecord[],
): SpaceshipDragState => {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return {
    ...state,
    tokens: state.tokens.map((token) => {
      if (token.placement.type !== "card") {
        return token;
      }

      const card = itemsById.get(token.placement.cardItemId);
      if (!card) {
        return token;
      }

      return {
        ...token,
        x: card.x + token.placement.offsetX,
        y: card.y + token.placement.offsetY,
      };
    }),
  };
};

export const syncSpaceshipCardPositions = (
  state: SpaceshipDragState,
  items: readonly BoardItemRecord[],
): SpaceshipDragState => {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return {
    ...state,
    cards: state.cards.map((card) => {
      const item = itemsById.get(card.itemId);
      if (!item) {
        return card;
      }

      return {
        ...card,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      };
    }),
  };
};


