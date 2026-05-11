import type { BoardItemRecord, BoardPoint } from "../board/boardController";
import { getItemBounds } from "../board/boardController";
import {
  createSpaceshipBoardItemMeta,
  createSpaceshipBoardLayout,
  isSpaceshipCardDropTargetItemId,
  spaceshipBoardItemId,
  spaceshipEnergyStackSize,
  spaceshipTokenSize,
} from "./spaceshipBoardLayout";
import type {
  ActorTokenModel,
  EnergyTokenModel,
  ShipLocationRow,
  SpaceshipDragState,
  SpaceshipCardSnapTarget,
  SpaceshipDraggableCard,
  SpaceshipDraggableCardRole,
  SpaceshipLayoutMembershipState,
  SpaceshipDraggableToken,
  SpaceshipScene,
} from "./spaceshipTypes";

const initialEnergyStackCount = 20;
const tokenGap = 10;
const cardZIndexBase = 1000;
const tokenZIndexBase = 100000;
export const spaceshipCardLayoutTearOffDistancePx = 10;
export const spaceshipCardSnapInsertCooldownMs = 400;
const draggableCardRoles = new Set<SpaceshipDraggableCardRole>([
  "location",
  "device",
  "effect-card",
  "actor-card",
  "actor-effect-card",
]);

export const spaceshipLayoutId = {
  locationRow: (paneId: string, row: ShipLocationRow) =>
    `spaceship:location-row:${paneId}:${row}`,
  deviceColumn: (locationItemId: string) =>
    `spaceship:device-column:${locationItemId}`,
  effectStack: (ownerItemId: string) => `spaceship:effect-stack:${ownerItemId}`,
  actorRow: (paneId: string) => `spaceship:actor-row:${paneId}`,
};

const clampInsertionIndex = (index: number, length: number): number =>
  Math.max(0, Math.min(length, index));

const removeId = (ids: readonly string[], itemId: string): string[] =>
  ids.filter((id) => id !== itemId);

const insertId = (
  ids: readonly string[],
  itemId: string,
  index: number,
): string[] => {
  const withoutItem = removeId(ids, itemId);
  const insertionIndex = clampInsertionIndex(index, withoutItem.length);
  return [
    ...withoutItem.slice(0, insertionIndex),
    itemId,
    ...withoutItem.slice(insertionIndex),
  ];
};

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

const createInitialSpaceshipLayouts = (
  scene: SpaceshipScene,
): SpaceshipLayoutMembershipState => {
  const locationRows: SpaceshipLayoutMembershipState["locationRows"] = [];
  const deviceColumns: SpaceshipLayoutMembershipState["deviceColumns"] = [];
  const effectStacks: SpaceshipLayoutMembershipState["effectStacks"] = [];
  const actorRows: SpaceshipLayoutMembershipState["actorRows"] = [];

  scene.panes.forEach((pane) => {
    (["top", "bottom"] as const).forEach((row) => {
      const itemIds = pane.locations
        .filter((location) => location.row === row)
        .sort((left, right) => left.lastTouchedOrder - right.lastTouchedOrder)
        .map((location) => spaceshipBoardItemId.location(location.locationId));
      locationRows.push({
        layoutId: spaceshipLayoutId.locationRow(pane.paneId, row),
        type: "location-row",
        paneId: pane.paneId,
        row,
        itemIds,
      });
    });

    pane.locations.forEach((location) => {
      const locationItemId = spaceshipBoardItemId.location(location.locationId);
      deviceColumns.push({
        layoutId: spaceshipLayoutId.deviceColumn(locationItemId),
        type: "device-column",
        locationItemId,
        itemIds: location.device
          ? [spaceshipBoardItemId.device(location.device.deviceId)]
          : [],
      });

      const effectIds = location.effects.flatMap((effect) =>
        Array.from({ length: effect.count }, (_, index) =>
          spaceshipBoardItemId.effectCard(effect.effectId, index),
        ),
      );
      effectStacks.push({
        layoutId: spaceshipLayoutId.effectStack(locationItemId),
        type: "effect-stack",
        ownerItemId: locationItemId,
        itemIds: effectIds,
      });

      if (location.device) {
        const deviceItemId = spaceshipBoardItemId.device(location.device.deviceId);
        effectStacks.push({
          layoutId: spaceshipLayoutId.effectStack(deviceItemId),
          type: "effect-stack",
          ownerItemId: deviceItemId,
          itemIds: [],
        });
      }
    });

    const actorIds = [...pane.actors]
      .sort((left, right) => left.lastTouchedOrder - right.lastTouchedOrder)
      .map((actor) => spaceshipBoardItemId.actorCard(actor.actorId));
    actorRows.push({
      layoutId: spaceshipLayoutId.actorRow(pane.paneId),
      type: "actor-row",
      paneId: pane.paneId,
      itemIds: actorIds,
    });

    pane.actors.forEach((actor) => {
      const actorItemId = spaceshipBoardItemId.actorCard(actor.actorId);
      const effectIds = (["injury", "distress"] as const).flatMap((effectType) =>
        Array.from(
          { length: effectType === "injury" ? actor.injuryCount : actor.distressCount },
          (_, index) =>
            spaceshipBoardItemId.actorEffectCard(actor.actorId, effectType, index),
        ),
      );
      effectStacks.push({
        layoutId: spaceshipLayoutId.effectStack(actorItemId),
        type: "effect-stack",
        ownerItemId: actorItemId,
        itemIds: effectIds,
      });
    });
  });

  return {
    locationRows,
    deviceColumns,
    effectStacks,
    actorRows,
  };
};

const findCardLayoutId = (
  layouts: SpaceshipLayoutMembershipState,
  itemId: string,
): string => {
  const locationRow = layouts.locationRows.find((layout) =>
    layout.itemIds.includes(itemId),
  );
  if (locationRow) {
    return locationRow.layoutId;
  }

  const deviceColumn = layouts.deviceColumns.find((layout) =>
    layout.itemIds.includes(itemId),
  );
  if (deviceColumn) {
    return deviceColumn.layoutId;
  }

  const effectStack = layouts.effectStacks.find((layout) =>
    layout.itemIds.includes(itemId),
  );
  if (effectStack) {
    return effectStack.layoutId;
  }

  const actorRow = layouts.actorRows.find((layout) =>
    layout.itemIds.includes(itemId),
  );
  if (actorRow) {
    return actorRow.layoutId;
  }

  return "";
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
    energyStack: {
      totalCount: initialEnergyStackCount,
      availableCount: initialEnergyStackCount,
    },
    nextCardZIndex: cardZIndexBase,
    nextZIndex: tokenZIndexBase + tokens.length,
    nextEnergyTokenIndex: 1,
  };
};

const mapCards = (
  state: SpaceshipDragState,
  itemId: string,
  updater: (card: SpaceshipDraggableCard) => SpaceshipDraggableCard,
): SpaceshipDragState => ({
  ...state,
  cards: state.cards.map((card) =>
    card.itemId === itemId ? updater(card) : card,
  ),
});

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

export const beginSpaceshipCardDrag = (
  state: SpaceshipDragState,
  itemId: string,
): { state: SpaceshipDragState; dragItemId: string } => {
  const zIndex = state.nextCardZIndex;
  return {
    dragItemId: itemId,
    state: {
      ...mapCards(state, itemId, (card) => ({
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
  return mapCards(state, itemId, (card) => ({
    ...card,
    x: drag.startX + (drag.clientX - drag.startClientX) / zoom,
    y: drag.startY + (drag.clientY - drag.startClientY) / zoom,
    placement: { type: "board" },
  }));
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

export const dropSpaceshipCardOnBoard = (
  state: SpaceshipDragState,
  itemId: string,
): SpaceshipDragState =>
  mapCards(state, itemId, (card) => ({
    ...card,
    placement: { type: "board" },
  }));

const getCardRole = (
  state: SpaceshipDragState,
  itemId: string,
): SpaceshipDraggableCardRole | undefined =>
  state.cards.find((card) => card.itemId === itemId)?.role;

const getCard = (
  state: SpaceshipDragState,
  itemId: string,
): SpaceshipDraggableCard | undefined =>
  state.cards.find((card) => card.itemId === itemId);

export const removeSpaceshipCardFromLayouts = (
  state: SpaceshipDragState,
  itemId: string,
): SpaceshipDragState => ({
  ...mapCards(state, itemId, (card) => ({
    ...card,
    placement: { type: "board" },
  })),
  layouts: {
    locationRows: state.layouts.locationRows.map((layout) => ({
      ...layout,
      itemIds: removeId(layout.itemIds, itemId),
    })),
    deviceColumns: state.layouts.deviceColumns.map((layout) => ({
      ...layout,
      itemIds: removeId(layout.itemIds, itemId),
    })),
    effectStacks: state.layouts.effectStacks.map((layout) => ({
      ...layout,
      itemIds: removeId(layout.itemIds, itemId),
    })),
    actorRows: state.layouts.actorRows.map((layout) => ({
      ...layout,
      itemIds: removeId(layout.itemIds, itemId),
    })),
  },
});

export const insertSpaceshipCardIntoLayout = (
  state: SpaceshipDragState,
  itemId: string,
  target: SpaceshipCardSnapTarget,
): SpaceshipDragState => {
  const withoutItem = removeSpaceshipCardFromLayouts(state, itemId);
  const setLayoutPlacement = (nextState: SpaceshipDragState): SpaceshipDragState =>
    mapCards(nextState, itemId, (card) => ({
      ...card,
      placement: { type: "layout", layoutId: target.layoutId },
    }));

  if (target.type === "location-row") {
    return setLayoutPlacement({
      ...withoutItem,
      layouts: {
        ...withoutItem.layouts,
        locationRows: withoutItem.layouts.locationRows.map((layout) =>
          layout.layoutId === target.layoutId
            ? {
                ...layout,
                itemIds: insertId(layout.itemIds, itemId, target.index),
              }
            : layout,
        ),
      },
    });
  }

  if (target.type === "device-column") {
    return setLayoutPlacement({
      ...withoutItem,
      layouts: {
        ...withoutItem.layouts,
        deviceColumns: withoutItem.layouts.deviceColumns.map((layout) =>
          layout.layoutId === target.layoutId
            ? {
                ...layout,
                itemIds: insertId(layout.itemIds, itemId, target.index),
              }
            : layout,
        ),
      },
    });
  }

  if (target.type === "effect-stack") {
    const existingStack = withoutItem.layouts.effectStacks.find(
      (layout) => layout.layoutId === target.layoutId,
    );
    const nextStack = existingStack
      ? withoutItem.layouts.effectStacks.map((layout) =>
          layout.layoutId === target.layoutId
            ? {
                ...layout,
                itemIds: insertId(layout.itemIds, itemId, target.index),
              }
            : layout,
        )
      : [
          ...withoutItem.layouts.effectStacks,
          {
            layoutId: target.layoutId,
            type: "effect-stack" as const,
            ownerItemId: target.ownerItemId,
            itemIds: [itemId],
          },
        ];
    return setLayoutPlacement({
      ...withoutItem,
      layouts: {
        ...withoutItem.layouts,
        effectStacks: nextStack,
      },
    });
  }

  return setLayoutPlacement({
    ...withoutItem,
    layouts: {
      ...withoutItem.layouts,
      actorRows: withoutItem.layouts.actorRows.map((layout) =>
        layout.layoutId === target.layoutId
          ? {
              ...layout,
              itemIds: insertId(layout.itemIds, itemId, target.index),
            }
          : layout,
      ),
    },
  });
};

const findContainingLocationRow = (
  state: SpaceshipDragState,
  itemId: string,
) =>
  state.layouts.locationRows.find((layout) => layout.itemIds.includes(itemId));

const findContainingDeviceColumn = (
  state: SpaceshipDragState,
  itemId: string,
) =>
  state.layouts.deviceColumns.find((layout) => layout.itemIds.includes(itemId));

const findContainingActorRow = (
  state: SpaceshipDragState,
  itemId: string,
) => state.layouts.actorRows.find((layout) => layout.itemIds.includes(itemId));

const findEffectStackForOwner = (
  state: SpaceshipDragState,
  ownerItemId: string,
) =>
  state.layouts.effectStacks.find(
    (layout) => layout.ownerItemId === ownerItemId,
  );

const getItemCenter = (item: BoardItemRecord): BoardPoint => ({
  x: item.x + item.width / 2,
  y: item.y + item.height / 2,
});

const getRowInsertionIndex = (
  itemIds: readonly string[],
  targetItemId: string,
  targetItem: BoardItemRecord,
  point: BoardPoint,
): number => {
  const targetIndex = Math.max(0, itemIds.indexOf(targetItemId));
  return point.x < getItemCenter(targetItem).x ? targetIndex : targetIndex + 1;
};

const getColumnInsertionIndex = (
  itemIds: readonly string[],
  targetItemId: string,
  targetItem: BoardItemRecord,
  point: BoardPoint,
): number => {
  const targetIndex = Math.max(0, itemIds.indexOf(targetItemId));
  return point.y < getItemCenter(targetItem).y ? targetIndex : targetIndex + 1;
};

export const resolveSpaceshipCardSnapTarget = (
  state: SpaceshipDragState,
  items: readonly BoardItemRecord[],
  itemId: string,
  point: BoardPoint,
): SpaceshipCardSnapTarget | null => {
  const draggedRole = getCardRole(state, itemId);
  if (!draggedRole) {
    return null;
  }

  const compatibleItem = findTopmostItemAtPoint(items, point, (item) => {
    if (item.id === itemId) {
      return false;
    }

    const targetRole = getCardRole(state, item.id);
    if (!targetRole) {
      return false;
    }

    if (draggedRole === "location") {
      return targetRole === "location";
    }

    if (draggedRole === "device") {
      return targetRole === "location" || targetRole === "device";
    }

    if (draggedRole === "actor-card") {
      return targetRole === "actor-card";
    }

    return (
      targetRole === "location" ||
      targetRole === "device" ||
      targetRole === "actor-card"
    );
  });

  if (!compatibleItem) {
    return null;
  }

  const targetRole = getCardRole(state, compatibleItem.id);
  if (draggedRole === "location" && targetRole === "location") {
    const row = findContainingLocationRow(state, compatibleItem.id);
    if (!row) {
      return null;
    }
    return {
      type: "location-row",
      layoutId: row.layoutId,
      index: getRowInsertionIndex(
        removeId(row.itemIds, itemId),
        compatibleItem.id,
        compatibleItem,
        point,
      ),
    };
  }

  if (draggedRole === "device") {
    const column =
      targetRole === "device"
        ? findContainingDeviceColumn(state, compatibleItem.id)
        : state.layouts.deviceColumns.find(
            (layout) => layout.locationItemId === compatibleItem.id,
          );
    if (!column) {
      return null;
    }
    return {
      type: "device-column",
      layoutId: column.layoutId,
      index:
        targetRole === "device"
          ? getColumnInsertionIndex(
              removeId(column.itemIds, itemId),
              compatibleItem.id,
              compatibleItem,
              point,
            )
          : column.itemIds.length,
    };
  }

  if (draggedRole === "actor-card" && targetRole === "actor-card") {
    const row = findContainingActorRow(state, compatibleItem.id);
    if (!row) {
      return null;
    }
    return {
      type: "actor-row",
      layoutId: row.layoutId,
      index: getRowInsertionIndex(
        removeId(row.itemIds, itemId),
        compatibleItem.id,
        compatibleItem,
        point,
      ),
    };
  }

  if (
    draggedRole === "effect-card" ||
    draggedRole === "actor-effect-card"
  ) {
    const ownerRole = getCardRole(state, compatibleItem.id);
    if (
      ownerRole !== "location" &&
      ownerRole !== "device" &&
      ownerRole !== "actor-card"
    ) {
      return null;
    }
    const stack = findEffectStackForOwner(state, compatibleItem.id);
    return {
      type: "effect-stack",
      layoutId:
        stack?.layoutId ?? spaceshipLayoutId.effectStack(compatibleItem.id),
      ownerItemId: compatibleItem.id,
      index: stack?.itemIds.length ?? 0,
    };
  }

  return null;
};

export const applySpaceshipCardLiveSnap = (
  state: SpaceshipDragState,
  itemId: string,
  items: readonly BoardItemRecord[],
  point: BoardPoint,
): SpaceshipDragState => {
  if (!getCard(state, itemId)) {
    return state;
  }

  const target = resolveSpaceshipCardSnapTarget(state, items, itemId, point);
  return target
    ? insertSpaceshipCardIntoLayout(state, itemId, target)
    : removeSpaceshipCardFromLayouts(state, itemId);
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
