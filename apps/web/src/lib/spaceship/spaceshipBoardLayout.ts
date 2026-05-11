import {
  flexLayout,
  stackLayout,
  type BoardLayoutResult,
} from "../board/boardLayout";
import type {
  ShipActorInstance,
  ShipLocationInstance,
  ShipPaneModel,
  SpaceshipDragState,
  SpaceshipScene,
} from "./spaceshipTypes";
import {
  actorBaseHeight,
  actorCardHeight,
  actorCardWidth,
  actorEffectCards,
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
  sortActors,
  sortLocations,
  spaceshipBoardItemId,
  spaceshipEnergyStackSize,
} from "./spaceshipBoardGeometry";
import { createMembershipBaseLayout } from "./spaceshipBoardMembershipLayout";
export {
  spaceshipBoardItemId,
  spaceshipBoardSize,
  spaceshipEnergyStackSize,
  spaceshipTokenSize,
  type SpaceshipBoardItemMeta,
  type SpaceshipBoardItemRole,
} from "./spaceshipBoardGeometry";
export {
  createSpaceshipBoardItemMeta,
  createSpaceshipBoardItems,
  getSpaceshipBoardPaneItemIds,
  isSpaceshipCardDropTargetItemId,
} from "./spaceshipBoardItems";

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
