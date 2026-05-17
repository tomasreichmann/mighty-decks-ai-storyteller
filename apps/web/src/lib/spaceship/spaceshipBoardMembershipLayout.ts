import { flexLayout, type BoardLayoutResult } from "../board/boardLayout";
import type {
  ShipPaneModel,
  SpaceshipDragState,
  SpaceshipDraggableCard,
  SpaceshipLayoutMembershipState,
  SpaceshipScene,
} from "./spaceshipTypes";
import {
  actorCardHeight,
  actorCardWidth,
  actorGap,
  actorGroupWidth,
  boardOrigin,
  box,
  deviceGap,
  deviceHeight,
  deviceWidth,
  effectCardHeight,
  effectCardWidth,
  effectHeaderOffset,
  locationColumnGap,
  locationHeight,
  locationRowGap,
  locationWidth,
  shipGap,
  shipHeaderHeight,
  shipHeaderWidth,
  shipPadding,
  shipWidth,
  spaceshipBoardItemId,
} from "./spaceshipBoardGeometry";

const getCardFromState = (
  dragState: SpaceshipDragState,
  itemId: string,
): SpaceshipDraggableCard | undefined =>
  dragState.cards.find((card) => card.itemId === itemId);

const isBoardPlacedCard = (
  dragState: SpaceshipDragState,
  itemId: string,
): boolean => getCardFromState(dragState, itemId)?.placement.type === "board";

const isLayoutPlacedCard = (
  dragState: SpaceshipDragState,
  itemId: string,
): boolean => !isBoardPlacedCard(dragState, itemId);

const getEffectStackForOwner = (
  layouts: SpaceshipLayoutMembershipState,
  ownerItemId: string,
) =>
  layouts.effectStacks.find((stack) => stack.ownerItemId === ownerItemId)
    ?.itemIds ?? [];

const getLayoutEffectStackForOwner = (
  dragState: SpaceshipDragState,
  ownerItemId: string,
) =>
  getEffectStackForOwner(dragState.layouts, ownerItemId).filter((itemId) =>
    isLayoutPlacedCard(dragState, itemId),
  );

const ownerWithEffectsLayout = ({
  ownerItemId,
  ownerWidth,
  ownerHeight,
  groupWidth,
  ownerZIndex,
  effectItemIds,
}: {
  ownerItemId: string;
  ownerWidth: number;
  ownerHeight: number;
  groupWidth: number;
  ownerZIndex: number;
  effectItemIds: readonly string[];
}): BoardLayoutResult => {
  const effectPeek =
    effectItemIds.length > 0
      ? Math.max(effectHeaderOffset, effectCardHeight - ownerHeight)
      : 0;
  const ownerYOffset =
    effectItemIds.length > 0
      ? effectPeek + (effectItemIds.length - 1) * effectHeaderOffset
      : 0;
  const placements: BoardLayoutResult["placements"] = [];
  const ownerX = (groupWidth - ownerWidth) / 2;

  effectItemIds.forEach((effectItemId, stackIndex) => {
    placements.push({
      id: effectItemId,
      x: (groupWidth - effectCardWidth) / 2,
      y: ownerYOffset - effectPeek - stackIndex * effectHeaderOffset,
      width: effectCardWidth,
      height: effectCardHeight,
      zIndex: ownerZIndex - stackIndex - 1,
    });
  });

  placements.push({
    id: ownerItemId,
    x: ownerX,
    y: ownerYOffset,
    width: ownerWidth,
    height: ownerHeight,
    zIndex: ownerZIndex,
  });

  return {
    placements,
    bounds: {
      x: 0,
      y: 0,
      width: groupWidth,
      height: ownerYOffset + ownerHeight,
    },
  };
};

const appendLayoutAt = (
  target: BoardLayoutResult["placements"],
  layout: BoardLayoutResult,
  x: number,
  y: number,
): void => {
  layout.placements.forEach((placement) => {
    target.push({
      ...placement,
      x: x + placement.x - layout.bounds.x,
      y: y + placement.y - layout.bounds.y,
    });
  });
};

const roomLayoutFromMembership = (
  locationItemId: string,
  dragState: SpaceshipDragState,
): BoardLayoutResult => {
  const card = getCardFromState(dragState, locationItemId);
  const deviceColumn = dragState.layouts.deviceColumns.find(
    (column) => column.locationItemId === locationItemId,
  );
  const placements: BoardLayoutResult["placements"] = [];
  let cursorY = 0;

  deviceColumn?.itemIds
    .filter((deviceItemId) => isLayoutPlacedCard(dragState, deviceItemId))
    .forEach((deviceItemId) => {
      const device = getCardFromState(dragState, deviceItemId);
      const deviceLayout = ownerWithEffectsLayout({
        ownerItemId: deviceItemId,
        ownerWidth: device?.width ?? deviceWidth,
        ownerHeight: device?.height ?? deviceHeight,
        groupWidth: locationWidth,
        ownerZIndex: device?.zIndex ?? 20,
        effectItemIds: getLayoutEffectStackForOwner(dragState, deviceItemId),
      });
      appendLayoutAt(placements, deviceLayout, 0, cursorY);
      cursorY += deviceLayout.bounds.height + deviceGap;
    });

  const locationLayout = ownerWithEffectsLayout({
    ownerItemId: locationItemId,
    ownerWidth: card?.width ?? locationWidth,
    ownerHeight: card?.height ?? locationHeight,
    groupWidth: locationWidth,
    ownerZIndex: card?.zIndex ?? 30,
    effectItemIds: getLayoutEffectStackForOwner(dragState, locationItemId),
  });
  appendLayoutAt(placements, locationLayout, 0, cursorY);

  return {
    placements,
    bounds: {
      x: 0,
      y: 0,
      width: locationWidth,
      height: cursorY + locationLayout.bounds.height,
    },
  };
};

const locationRowLayoutFromMembership = (
  itemIds: readonly string[],
  dragState: SpaceshipDragState,
): BoardLayoutResult => {
  const layoutItemIds = itemIds.filter((itemId) =>
    isLayoutPlacedCard(dragState, itemId),
  );
  const layouts = layoutItemIds.map((itemId) =>
    roomLayoutFromMembership(itemId, dragState),
  );
  const rowHeight = Math.max(0, ...layouts.map((layout) => layout.bounds.height));
  const placements: BoardLayoutResult["placements"] = [];
  let xOffset = 0;

  layouts.forEach((layout, index) => {
    appendLayoutAt(placements, layout, xOffset, rowHeight - layout.bounds.height);
    xOffset += locationWidth;
    if (index < layouts.length - 1) {
      xOffset += locationColumnGap;
    }
  });

  return {
    placements,
    bounds: {
      x: 0,
      y: 0,
      width: Math.max(0, xOffset),
      height: rowHeight,
    },
  };
};

const actorGroupLayoutFromMembership = (
  actorItemId: string,
  dragState: SpaceshipDragState,
): BoardLayoutResult => {
  const card = getCardFromState(dragState, actorItemId);
  return ownerWithEffectsLayout({
    ownerItemId: actorItemId,
    ownerWidth: card?.width ?? actorCardWidth,
    ownerHeight: card?.height ?? actorCardHeight,
    groupWidth: actorGroupWidth,
    ownerZIndex: card?.zIndex ?? 30,
    effectItemIds: getLayoutEffectStackForOwner(dragState, actorItemId),
  });
};

const actorBandLayoutFromMembership = (
  itemIds: readonly string[],
  dragState: SpaceshipDragState,
): BoardLayoutResult => {
  const layoutItemIds = itemIds.filter((itemId) =>
    isLayoutPlacedCard(dragState, itemId),
  );
  const actorsLayout = flexLayout(
    layoutItemIds.map((itemId) => {
      const layout = actorGroupLayoutFromMembership(itemId, dragState);
      return {
        layout,
        width: actorGroupWidth,
        height: layout.bounds.height,
      };
    }),
    {
      direction: "row",
      columnGap: actorGap,
    },
  );

  return {
    placements: actorsLayout.placements.map((placement) => ({
      ...placement,
      x: placement.x + shipPadding,
    })),
    bounds: {
      x: 0,
      y: 0,
      width: shipWidth,
      height: actorsLayout.bounds.height,
    },
  };
};

const shipLayoutFromMembership = (
  pane: ShipPaneModel,
  dragState: SpaceshipDragState,
): BoardLayoutResult => {
  const topRow = dragState.layouts.locationRows.find(
    (row) => row.paneId === pane.paneId && row.row === "top",
  );
  const bottomRow = dragState.layouts.locationRows.find(
    (row) => row.paneId === pane.paneId && row.row === "bottom",
  );
  const contentWidth = shipWidth - shipPadding * 2;
  const contentLayout = flexLayout(
    [
      box({
        id: spaceshipBoardItemId.shipHeader(pane.paneId),
        width: shipHeaderWidth,
        height: shipHeaderHeight,
        zIndex: 10,
      }),
      {
        layout: locationRowLayoutFromMembership(topRow?.itemIds ?? [], dragState),
        width: contentWidth,
      },
      {
        layout: locationRowLayoutFromMembership(
          bottomRow?.itemIds ?? [],
          dragState,
        ),
        width: contentWidth,
      },
    ],
    {
      direction: "column",
      rowGap: locationRowGap,
      x: shipPadding,
      y: shipPadding,
    },
  );

  return {
    placements: [...contentLayout.placements],
    bounds: {
      x: 0,
      y: 0,
      width: shipWidth,
      height: contentLayout.bounds.y + contentLayout.bounds.height,
    },
  };
};

const manualLayoutForCard = (
  card: SpaceshipDraggableCard,
  dragState: SpaceshipDragState,
): BoardLayoutResult => {
  if (card.role === "location") {
    const layout = roomLayoutFromMembership(card.itemId, dragState);
    const ownPlacement = layout.placements.find(
      (placement) => placement.id === card.itemId,
    );
    return {
      ...layout,
      placements: layout.placements.map((placement) => ({
        ...placement,
        x: card.x + placement.x - (ownPlacement?.x ?? 0),
        y: card.y + placement.y - (ownPlacement?.y ?? 0),
      })),
      bounds: {
        ...layout.bounds,
        x: card.x - (ownPlacement?.x ?? 0),
        y: card.y - (ownPlacement?.y ?? 0),
      },
    };
  }

  if (card.role === "device") {
    const layout = ownerWithEffectsLayout({
      ownerItemId: card.itemId,
      ownerWidth: card.width,
      ownerHeight: card.height,
      groupWidth: locationWidth,
      ownerZIndex: card.zIndex,
      effectItemIds: getLayoutEffectStackForOwner(dragState, card.itemId),
    });
    const ownPlacement = layout.placements.find(
      (placement) => placement.id === card.itemId,
    );
    return {
      ...layout,
      placements: layout.placements.map((placement) => ({
        ...placement,
        x: card.x + placement.x - (ownPlacement?.x ?? 0),
        y: card.y + placement.y - (ownPlacement?.y ?? 0),
      })),
    };
  }

  if (card.role === "actor-card") {
    const layout = actorGroupLayoutFromMembership(card.itemId, dragState);
    const ownPlacement = layout.placements.find(
      (placement) => placement.id === card.itemId,
    );
    return {
      ...layout,
      placements: layout.placements.map((placement) => ({
        ...placement,
        x: card.x + placement.x - (ownPlacement?.x ?? 0),
        y: card.y + placement.y - (ownPlacement?.y ?? 0),
      })),
    };
  }

  return {
    placements: [
      {
        id: card.itemId,
        x: card.x,
        y: card.y,
        width: card.width,
        height: card.height,
        zIndex: card.zIndex,
      },
    ],
    bounds: {
      x: card.x,
      y: card.y,
      width: card.width,
      height: card.height,
    },
  };
};

export interface CreateMembershipBaseLayoutOptions {
  activeCardItemId?: string | null;
}

export const createMembershipBaseLayout = (
  scene: SpaceshipScene,
  dragState: SpaceshipDragState,
  options: CreateMembershipBaseLayoutOptions = {},
): BoardLayoutResult => {
  const baseLayout = flexLayout(
    scene.panes.flatMap((pane) => {
      const actorRow = dragState.layouts.actorRows.find(
        (row) => row.paneId === pane.paneId,
      );
      return [
        {
          layout: shipLayoutFromMembership(pane, dragState),
          width: shipWidth,
        },
        {
          layout: actorBandLayoutFromMembership(actorRow?.itemIds ?? [], dragState),
          width: shipWidth,
        },
      ];
    }),
    {
      direction: "column",
      x: boardOrigin.x,
      y: boardOrigin.y,
      rowGap: shipGap,
    },
  );
  const activeCard = options.activeCardItemId
    ? getCardFromState(dragState, options.activeCardItemId)
    : undefined;
  const activeLayout = activeCard
    ? manualLayoutForCard(activeCard, dragState)
    : undefined;
  const activePlacementIds = new Set(
    activeLayout?.placements.map((placement) => placement.id) ?? [],
  );
  const basePlacements =
    activePlacementIds.size > 0
      ? baseLayout.placements.filter(
          (placement) => !activePlacementIds.has(placement.id),
        )
      : baseLayout.placements;
  const placedIds = new Set(basePlacements.map((placement) => placement.id));
  const manualPlacements: BoardLayoutResult["placements"] = [];

  activeLayout?.placements.forEach((placement) => {
    if (!placedIds.has(placement.id)) {
      placedIds.add(placement.id);
      manualPlacements.push(placement);
    }
  });

  dragState.cards
    .filter(
      (card) =>
        card.itemId !== options.activeCardItemId &&
        card.placement.type === "board" &&
        !placedIds.has(card.itemId),
    )
    .forEach((card) => {
      const layout = manualLayoutForCard(card, dragState);
      layout.placements.forEach((placement) => {
        if (!placedIds.has(placement.id)) {
          placedIds.add(placement.id);
          manualPlacements.push(placement);
        }
      });
    });

  return {
    ...baseLayout,
    placements: [...basePlacements, ...manualPlacements],
  };
};
