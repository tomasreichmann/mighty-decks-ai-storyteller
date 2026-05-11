import type { BoardItemInput } from "../board/boardController";
import {
  flexLayout,
  stackLayout,
  type BoardLayoutItemBox,
  type BoardLayoutResult,
} from "../board/boardLayout";
import type {
  ShipActorInstance,
  ShipEffectType,
  ShipLocationInstance,
  ShipPaneModel,
  SpaceshipDragState,
  SpaceshipDraggableCard,
  SpaceshipLayoutMembershipState,
  SpaceshipDraggableToken,
  SpaceshipScene,
} from "./spaceshipTypes";

type ActorConsequenceEffectType = Extract<ShipEffectType, "injury" | "distress">;

const boardOrigin = { x: 96, y: 96 };
const shipPadding = 28;
const shipWidth = 4300;
const shipHeaderWidth = 720;
const shipHeaderHeight = 80;
const shipGap = 92;
const locationWidth = 332;
const locationHeight = 204;
const deviceWidth = 204;
const deviceHeight = 332;
const deviceGap = 10;
const locationColumnGap = 28;
const locationRowGap = 34;
const effectCardWidth = 204;
const effectCardHeight = 332;
const effectHeaderOffset = 36;
const actorGroupWidth = 246;
const actorCardWidth = 204;
const actorCardHeight = 332;
const actorGap = 24;
const actorBaseHeight = actorCardHeight;

export const spaceshipBoardSize = {
  width: 4600,
  height: 4100,
};

export const spaceshipTokenSize = {
  energy: {
    width: 48,
    height: 48,
  },
  actor: {
    width: 96,
    height: 112,
  },
} as const;

export const spaceshipEnergyStackSize = {
  width: 118,
  height: 152,
} as const;

export const spaceshipBoardItemId = {
  shipHeader: (paneId: string) => `spaceship:ship-header:${paneId}`,
  location: (locationId: string) => `spaceship:location:${locationId}`,
  device: (deviceId: string) => `spaceship:device:${deviceId}`,
  effectCard: (effectId: string, index: number) =>
    `spaceship:effect-card:${effectId}:${index}`,
  tokens: (locationId: string) => `spaceship:tokens:${locationId}`,
  token: (tokenId: string) => `spaceship:token:${tokenId}`,
  energyStack: () => "spaceship:energy-stack",
  actorEffectCard: (
    actorId: string,
    effectType: ActorConsequenceEffectType,
    index: number,
  ) => `spaceship:actor-effect-card:${actorId}:${effectType}:${index}`,
  actorCard: (actorId: string) => `spaceship:actor-card:${actorId}`,
};

export type SpaceshipBoardItemRole =
  | "ship-header"
  | "location"
  | "device"
  | "effect-card"
  | "token"
  | "energy-stack"
  | "actor-effect-card"
  | "actor-card";

export interface SpaceshipBoardItemMeta {
  role: SpaceshipBoardItemRole;
  pane?: ShipPaneModel;
  location?: ShipLocationInstance;
  actor?: ShipActorInstance;
  token?: SpaceshipDraggableToken;
  effectType?: ShipEffectType;
}

const item = ({
  id,
  width,
  height,
  zIndex,
}: {
  id: string;
  width: number;
  height: number;
  zIndex: number;
}): BoardItemInput => ({
  id,
  kind: "card",
  x: 0,
  y: 0,
  width,
  height,
  zIndex,
});

const tokenItem = (token: SpaceshipDraggableToken): BoardItemInput => ({
  id: spaceshipBoardItemId.token(token.tokenId),
  kind: "card",
  x: token.x,
  y: token.y,
  width: token.width,
  height: token.height,
  zIndex: token.zIndex,
});

const energyStackItem = (): BoardItemInput =>
  item({
    id: spaceshipBoardItemId.energyStack(),
    width: spaceshipEnergyStackSize.width,
    height: spaceshipEnergyStackSize.height,
    zIndex: 900,
  });

const box = ({
  id,
  width,
  height,
  zIndex,
}: {
  id: string;
  width: number;
  height: number;
  zIndex: number;
}): BoardLayoutItemBox => ({
  id,
  width,
  height,
  zIndex,
});

const sortLocations = (
  locations: readonly ShipLocationInstance[],
  row: ShipLocationInstance["row"],
): ShipLocationInstance[] =>
  locations
    .filter((location) => location.row === row)
    .sort((left, right) => left.lastTouchedOrder - right.lastTouchedOrder);

const sortActors = (actors: readonly ShipActorInstance[]): ShipActorInstance[] =>
  [...actors].sort((left, right) => left.lastTouchedOrder - right.lastTouchedOrder);

const actorEffectCards = (
  actor: ShipActorInstance,
): {
  effectType: ActorConsequenceEffectType;
  index: number;
  stackIndex: number;
}[] => {
  let stackIndex = 0;

  return (["injury", "distress"] satisfies ActorConsequenceEffectType[]).flatMap(
    (effectType) => {
      const count =
        effectType === "injury" ? actor.injuryCount : actor.distressCount;

      return Array.from({ length: count }, (_, index) => {
        const card = {
          effectType,
          index,
          stackIndex,
        };
        stackIndex += 1;
        return card;
      });
    },
  );
};

const locationGroupLayout = (
  location: ShipLocationInstance,
): BoardLayoutResult => {
  const effectCards = location.effects.flatMap((effect) =>
    Array.from({ length: effect.count }, (_, index) => ({
      effect,
      index,
    })),
  );
  const effectTopClearance =
    effectCards.length > 0
      ? effectCardHeight -
        locationHeight +
        (effectCards.length - 1) * effectHeaderOffset
      : 0;
  const yOffset =
    (location.device ? deviceHeight + deviceGap : 0) + effectTopClearance;
  const placements = [];

  if (location.device) {
    placements.push({
      id: spaceshipBoardItemId.device(location.device.deviceId),
      x: (locationWidth - deviceWidth) / 2,
      y: 0,
      width: deviceWidth,
      height: deviceHeight,
      zIndex: 20,
    });
  }

  effectCards.forEach(({ effect, index }, stackIndex) => {
    placements.push({
      id: spaceshipBoardItemId.effectCard(effect.effectId, index),
      x: (locationWidth - effectCardWidth) / 2,
      y:
        yOffset +
        locationHeight -
        effectCardHeight -
        stackIndex * effectHeaderOffset,
      width: effectCardWidth,
      height: effectCardHeight,
      zIndex: 10 + effectCards.length - stackIndex - 1,
    });
  });

  placements.push(
    ...stackLayout(
      [
        box({
          id: spaceshipBoardItemId.location(location.locationId),
          width: locationWidth,
          height: locationHeight,
          zIndex: 30,
        }),
      ],
      {
        x: 0,
        y: yOffset,
        zIndexStart: 30,
        zIndexStep: 10,
      },
    ).placements,
  );

  const boundsTop = Math.min(
    0,
    effectCards.length > 0
      ? yOffset +
        locationHeight -
        effectCardHeight -
        (effectCards.length - 1) * effectHeaderOffset
      : 0,
  );
  const boundsBottom = Math.max(
    yOffset + locationHeight,
    ...effectCards.map(
      (_, stackIndex) =>
        yOffset + locationHeight - stackIndex * effectHeaderOffset,
    ),
  );

  return {
    placements,
    bounds: {
      x: 0,
      y: boundsTop,
      width: locationWidth,
      height: boundsBottom - boundsTop,
    },
  };
};

const locationRowLayout = (
  locations: readonly ShipLocationInstance[],
): BoardLayoutResult => {
  const layouts = locations.map(locationGroupLayout);
  const rowHeight = Math.max(0, ...layouts.map((layout) => layout.bounds.height));
  const placements: BoardLayoutResult["placements"] = [];
  let xOffset = 0;

  layouts.forEach((layout, index) => {
    const yOffset = rowHeight - layout.bounds.height;

    layout.placements.forEach((placement) => {
      placements.push({
        ...placement,
        x: xOffset + placement.x - layout.bounds.x,
        y: yOffset + placement.y - layout.bounds.y,
      });
    });

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

const actorRowLayout = (actors: readonly ShipActorInstance[]): BoardLayoutResult =>
  flexLayout(
    sortActors(actors).map((actor) => {
      const layout = actorGroupLayout(actor);

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

const actorGroupLayout = (actor: ShipActorInstance): BoardLayoutResult => {
  const cardId = spaceshipBoardItemId.actorCard(actor.actorId);
  const effectCards = actorEffectCards(actor);
  const effectTopOffset = effectCards.length * effectHeaderOffset;
  const placements = [];

  effectCards.forEach(({ effectType, index, stackIndex }) => {
    placements.push({
      id: spaceshipBoardItemId.actorEffectCard(actor.actorId, effectType, index),
      x: (actorGroupWidth - effectCardWidth) / 2,
      y: effectTopOffset - (stackIndex + 1) * effectHeaderOffset,
      width: effectCardWidth,
      height: effectCardHeight,
      zIndex: 20 + effectCards.length - stackIndex - 1,
    });
  });

  placements.push({
    id: cardId,
    x: (actorGroupWidth - actorCardWidth) / 2,
    y: effectTopOffset,
    width: actorCardWidth,
    height: actorCardHeight,
    zIndex: 30,
  });

  return {
    placements,
    bounds: {
      x: 0,
      y: 0,
      width: actorGroupWidth,
      height: effectTopOffset + actorBaseHeight,
    },
  };
};

const actorBandLayout = (actors: readonly ShipActorInstance[]): BoardLayoutResult => {
  const actorsLayout = actorRowLayout(actors);

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
  options: { includeEnergyStack?: boolean } = {},
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
      ...(options.includeEnergyStack
        ? [
            box({
              id: spaceshipBoardItemId.energyStack(),
              width: spaceshipEnergyStackSize.width,
              height: spaceshipEnergyStackSize.height,
              zIndex: 900,
            }),
          ]
        : []),
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

interface CreateMembershipBaseLayoutOptions {
  activeCardItemId?: string | null;
}

const createMembershipBaseLayout = (
  scene: SpaceshipScene,
  dragState: SpaceshipDragState,
  options: CreateMembershipBaseLayoutOptions = {},
): BoardLayoutResult => {
  const baseLayout = flexLayout(
    scene.panes.flatMap((pane, paneIndex) => {
      const actorRow = dragState.layouts.actorRows.find(
        (row) => row.paneId === pane.paneId,
      );
      return [
        {
          layout: shipLayoutFromMembership(pane, dragState, {
            includeEnergyStack: paneIndex === 0,
          }),
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

const shipLayout = (
  pane: ShipPaneModel,
  options: { includeEnergyStack?: boolean } = {},
): BoardLayoutResult => {
  const topRow = locationRowLayout(sortLocations(pane.locations, "top"));
  const bottomRow = locationRowLayout(sortLocations(pane.locations, "bottom"));
  const contentWidth = shipWidth - shipPadding * 2;
  const contentLayout = flexLayout(
    [
      ...(options.includeEnergyStack
        ? [
            box({
              id: spaceshipBoardItemId.energyStack(),
              width: spaceshipEnergyStackSize.width,
              height: spaceshipEnergyStackSize.height,
              zIndex: 900,
            }),
          ]
        : []),
      box({
        id: spaceshipBoardItemId.shipHeader(pane.paneId),
        width: shipHeaderWidth,
        height: shipHeaderHeight,
        zIndex: 10,
      }),
      { layout: topRow, width: contentWidth },
      { layout: bottomRow, width: contentWidth },
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

const createTokenLayoutPlacements = (
  dragState: SpaceshipDragState | undefined,
  cardLayout: BoardLayoutResult,
): BoardLayoutResult["placements"] => {
  if (!dragState) {
    return [];
  }

  const placementsById = new Map(
    cardLayout.placements.map((placement) => [placement.id, placement]),
  );

  return dragState.tokens.map((token) => {
    const cardPlacement =
      token.placement.type === "card"
        ? placementsById.get(token.placement.cardItemId)
        : undefined;
    const x =
      token.placement.type === "card" && cardPlacement
        ? cardPlacement.x + token.placement.offsetX
        : token.x;
    const y =
      token.placement.type === "card" && cardPlacement
        ? cardPlacement.y + token.placement.offsetY
        : token.y;

    return {
      id: spaceshipBoardItemId.token(token.tokenId),
      x,
      y,
      width: token.width,
      height: token.height,
      zIndex: token.zIndex,
    };
  });
};

const applyCardLayoutOverrides = (
  dragState: SpaceshipDragState | undefined,
  baseLayout: BoardLayoutResult,
): BoardLayoutResult => {
  if (!dragState) {
    return baseLayout;
  }

  const cardsById = new Map(
    dragState.cards.map((card) => [card.itemId, card]),
  );

  return {
    ...baseLayout,
    placements: baseLayout.placements.map((placement) => {
      const card = cardsById.get(placement.id);
      if (!card) {
        return placement;
      }

      return {
        ...placement,
        x: card.placement.type === "board" ? card.x : placement.x,
        y: card.placement.type === "board" ? card.y : placement.y,
        width: card.width,
        height: card.height,
        zIndex: card.zIndex,
      };
    }),
  };
};

export const createSpaceshipBoardLayout = (
  scene: SpaceshipScene,
  dragState?: SpaceshipDragState,
  options: { activeCardItemId?: string | null } = {},
): BoardLayoutResult => {
  const baseLayout = dragState?.layouts
    ? createMembershipBaseLayout(scene, dragState, options)
    : flexLayout(
        scene.panes.flatMap((pane, paneIndex) => [
          {
            layout: shipLayout(pane, { includeEnergyStack: paneIndex === 0 }),
            width: shipWidth,
          },
          {
            layout: actorBandLayout(pane.actors),
            width: shipWidth,
          },
        ]),
        {
          direction: "column",
          x: boardOrigin.x,
          y: boardOrigin.y,
          rowGap: shipGap,
        },
      );
  const cardLayout = dragState?.layouts
    ? baseLayout
    : applyCardLayoutOverrides(dragState, baseLayout);
  return {
    ...cardLayout,
    placements: [
      ...cardLayout.placements,
      ...createTokenLayoutPlacements(dragState, cardLayout),
    ],
  };
};

export const createSpaceshipBoardItems = (
  scene: SpaceshipScene,
  dragState?: SpaceshipDragState,
): BoardItemInput[] => {
  const items: BoardItemInput[] = [];

  scene.panes.forEach((pane) => {
    items.push(
      item({
        id: spaceshipBoardItemId.shipHeader(pane.paneId),
        width: shipHeaderWidth,
        height: shipHeaderHeight,
        zIndex: 10,
      }),
    );

    pane.locations.forEach((location) => {
      if (location.device) {
        items.push(
          item({
            id: spaceshipBoardItemId.device(location.device.deviceId),
            width: deviceWidth,
            height: deviceHeight,
            zIndex: 20,
          }),
        );
      }

      location.effects.forEach((effect) => {
        Array.from({ length: effect.count }).forEach((_, index) => {
          items.push(
            item({
              id: spaceshipBoardItemId.effectCard(effect.effectId, index),
              width: effectCardWidth,
              height: effectCardHeight,
              zIndex: 10 + index,
            }),
          );
        });
      });

      items.push(
        item({
          id: spaceshipBoardItemId.location(location.locationId),
          width: locationWidth,
          height: locationHeight,
          zIndex: 30,
        }),
      );
    });

    pane.actors.forEach((actor) => {
      const effectCards = actorEffectCards(actor);

      effectCards.forEach(({ effectType, index, stackIndex }) => {
        items.push(
          item({
            id: spaceshipBoardItemId.actorEffectCard(
              actor.actorId,
              effectType,
              index,
            ),
            width: effectCardWidth,
            height: effectCardHeight,
            zIndex: 20 + effectCards.length - stackIndex - 1,
          }),
        );
      });

      items.push(
        item({
          id: spaceshipBoardItemId.actorCard(actor.actorId),
          width: actorCardWidth,
          height: actorCardHeight,
          zIndex: 30,
        }),
      );
    });
  });

  items.push(energyStackItem());
  if (dragState) {
    items.push(...dragState.tokens.map(tokenItem));
  }

  return items;
};

export const getSpaceshipBoardPaneItemIds = (
  scene: SpaceshipScene,
  paneId: string,
  dragState?: SpaceshipDragState,
): string[] => {
  const pane = scene.panes.find((candidate) => candidate.paneId === paneId);

  if (!pane) {
    return [];
  }

  const ids = [spaceshipBoardItemId.shipHeader(pane.paneId)];

  pane.locations.forEach((location) => {
    if (location.device) {
      ids.push(spaceshipBoardItemId.device(location.device.deviceId));
    }

    location.effects.forEach((effect) => {
      Array.from({ length: effect.count }).forEach((_, index) => {
        ids.push(spaceshipBoardItemId.effectCard(effect.effectId, index));
      });
    });

    ids.push(spaceshipBoardItemId.location(location.locationId));
  });

  pane.actors.forEach((actor) => {
    actorEffectCards(actor).forEach(({ effectType, index }) => {
      ids.push(spaceshipBoardItemId.actorEffectCard(actor.actorId, effectType, index));
    });

    ids.push(spaceshipBoardItemId.actorCard(actor.actorId));
  });

  if (dragState) {
    dragState.tokens
      .filter((token) => token.paneId === paneId)
      .forEach((token) => ids.push(spaceshipBoardItemId.token(token.tokenId)));
  }

  return ids;
};

export const createSpaceshipBoardItemMeta = (
  scene: SpaceshipScene,
  dragState?: SpaceshipDragState,
): Map<string, SpaceshipBoardItemMeta> => {
  const meta = new Map<string, SpaceshipBoardItemMeta>();

  scene.panes.forEach((pane) => {
    meta.set(spaceshipBoardItemId.shipHeader(pane.paneId), {
      role: "ship-header",
      pane,
    });
    pane.locations.forEach((location) => {
      meta.set(spaceshipBoardItemId.location(location.locationId), {
        role: "location",
        pane,
        location,
      });

      if (location.device) {
        meta.set(spaceshipBoardItemId.device(location.device.deviceId), {
          role: "device",
          pane,
          location,
        });
      }

      location.effects.forEach((effect) => {
        Array.from({ length: effect.count }).forEach((_, index) => {
          meta.set(spaceshipBoardItemId.effectCard(effect.effectId, index), {
            role: "effect-card",
            pane,
            location,
            effectType: effect.type,
          });
        });
      });
    });

    pane.actors.forEach((actor) => {
      actorEffectCards(actor).forEach(({ effectType, index }) => {
        meta.set(spaceshipBoardItemId.actorEffectCard(actor.actorId, effectType, index), {
          role: "actor-effect-card",
          pane,
          actor,
          effectType,
        });
      });

      meta.set(spaceshipBoardItemId.actorCard(actor.actorId), {
        role: "actor-card",
        pane,
        actor,
      });
    });
  });

  meta.set(spaceshipBoardItemId.energyStack(), {
    role: "energy-stack",
  });
  dragState?.tokens.forEach((token) => {
    meta.set(spaceshipBoardItemId.token(token.tokenId), {
      role: "token",
      token,
    });
  });

  return meta;
};

export const isSpaceshipCardDropTargetItemId = (itemId: string): boolean =>
  itemId.startsWith("spaceship:location:") ||
  itemId.startsWith("spaceship:device:") ||
  itemId.startsWith("spaceship:effect-card:") ||
  itemId.startsWith("spaceship:actor-card:") ||
  itemId.startsWith("spaceship:actor-effect-card:");
