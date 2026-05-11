import type { BoardItemRecord, BoardPoint } from "../board/boardController";
import { getItemBounds } from "../board/boardController";
import {
  spaceshipBoardItemId,
  spaceshipEnergyStackSize,
  spaceshipTokenSize,
} from "./spaceshipBoardLayout";
import type {
  ActorTokenModel,
  EnergyTokenModel,
  SpaceshipDragState,
  SpaceshipDraggableToken,
  SpaceshipScene,
} from "./spaceshipTypes";

const initialEnergyStackCount = 20;
const tokenGap = 10;

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
      zIndex: 1000 + index,
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
    zIndex: 1000 + index,
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
    tokens,
    energyStack: {
      totalCount: initialEnergyStackCount,
      availableCount: initialEnergyStackCount,
    },
    nextZIndex: 1000 + tokens.length,
    nextEnergyTokenIndex: 1,
  };
};

const mapTokens = (
  state: SpaceshipDragState,
  tokenId: string,
  updater: (token: SpaceshipDraggableToken) => SpaceshipDraggableToken,
): SpaceshipDragState => ({
  ...state,
  tokens: state.tokens.map((token) =>
    token.tokenId === tokenId ? updater(token) : token,
  ),
});

export const beginSpaceshipTokenDrag = (
  state: SpaceshipDragState,
  tokenId: string,
): { state: SpaceshipDragState; dragTokenId: string } => {
  const zIndex = state.nextZIndex;
  return {
    dragTokenId: tokenId,
    state: {
      ...mapTokens(state, tokenId, (token) => ({
        ...token,
        zIndex,
      })),
      nextZIndex: zIndex + 1,
    },
  };
};

export const beginEnergyStackTokenDrag = (
  state: SpaceshipDragState,
  position: BoardPoint,
): { state: SpaceshipDragState; dragTokenId: string } => {
  if (state.energyStack.availableCount <= 0) {
    return { state, dragTokenId: "" };
  }

  const tokenId = `energy-stack-token-${state.nextEnergyTokenIndex}`;
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
      energyStack: {
        ...state.energyStack,
        availableCount: state.energyStack.availableCount - 1,
      },
      nextZIndex: state.nextZIndex + 1,
      nextEnergyTokenIndex: state.nextEnergyTokenIndex + 1,
    },
  };
};

export const moveSpaceshipToken = (
  state: SpaceshipDragState,
  tokenId: string,
  delta: { deltaX: number; deltaY: number; zoom: number },
): SpaceshipDragState => {
  const zoom = Number.isFinite(delta.zoom) && delta.zoom > 0 ? delta.zoom : 1;
  return mapTokens(state, tokenId, (token) => ({
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
  return mapTokens(state, tokenId, (token) => ({
    ...token,
    x: drag.startX + (drag.clientX - drag.startClientX) / zoom,
    y: drag.startY + (drag.clientY - drag.startClientY) / zoom,
    placement: { type: "board" },
  }));
};

export const dropSpaceshipTokenOnCard = (
  state: SpaceshipDragState,
  tokenId: string,
  cardItemId: string,
  cardPosition: BoardPoint,
): SpaceshipDragState =>
  mapTokens(state, tokenId, (token) => ({
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
  mapTokens(state, tokenId, (token) => ({
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
    energyStack: {
      ...state.energyStack,
      availableCount: Math.min(
        state.energyStack.totalCount,
        state.energyStack.availableCount + 1,
      ),
    },
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

export const findTopmostItemAtPoint = (
  items: readonly BoardItemRecord[],
  point: BoardPoint,
  predicate: (item: BoardItemRecord) => boolean,
): BoardItemRecord | null => {
  const matches = items.filter((item) => {
    if (!predicate(item)) {
      return false;
    }

    const bounds = getItemBounds(item);
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  });

  return matches.sort((left, right) => right.zIndex - left.zIndex)[0] ?? null;
};

export const isPointOverEnergyStack = (
  items: readonly BoardItemRecord[],
  point: BoardPoint,
): boolean =>
  Boolean(
    findTopmostItemAtPoint(
      items,
      point,
      (item) => item.id === spaceshipBoardItemId.energyStack(),
    ),
  );

export const getEnergyStackInitialItem = (): {
  id: string;
  kind: "card";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
} => ({
  id: spaceshipBoardItemId.energyStack(),
  kind: "card",
  x: 4425,
  y: 180,
  width: spaceshipEnergyStackSize.width,
  height: spaceshipEnergyStackSize.height,
  zIndex: 900,
});
