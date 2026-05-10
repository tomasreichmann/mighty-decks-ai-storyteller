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
const tokenRowWidth = 210;
const tokenRowHeight = 92;
const actorGroupWidth = 246;
const actorCardWidth = 204;
const actorCardHeight = 332;
const actorGap = 24;
const actorBaseHeight = actorCardHeight;

export const spaceshipBoardSize = {
  width: 4600,
  height: 4100,
};

export const spaceshipBoardItemId = {
  shipHeader: (paneId: string) => `spaceship:ship-header:${paneId}`,
  location: (locationId: string) => `spaceship:location:${locationId}`,
  device: (deviceId: string) => `spaceship:device:${deviceId}`,
  effectCard: (effectId: string, index: number) =>
    `spaceship:effect-card:${effectId}:${index}`,
  tokens: (locationId: string) => `spaceship:tokens:${locationId}`,
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
  | "tokens"
  | "actor-effect-card"
  | "actor-card";

export interface SpaceshipBoardItemMeta {
  role: SpaceshipBoardItemRole;
  pane?: ShipPaneModel;
  location?: ShipLocationInstance;
  actor?: ShipActorInstance;
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
        box({
          id: spaceshipBoardItemId.tokens(location.locationId),
          width: tokenRowWidth,
          height: tokenRowHeight,
          zIndex: 40,
        }),
      ],
      {
        x: 0,
        y: yOffset,
        itemOffsets: {
          [spaceshipBoardItemId.tokens(location.locationId)]: {
            x: (locationWidth - tokenRowWidth) / 2,
            y: (locationHeight - tokenRowHeight) / 2,
          },
        },
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

const shipLayout = (pane: ShipPaneModel): BoardLayoutResult => {
  const topRow = locationRowLayout(sortLocations(pane.locations, "top"));
  const bottomRow = locationRowLayout(sortLocations(pane.locations, "bottom"));
  const contentWidth = shipWidth - shipPadding * 2;
  const contentLayout = flexLayout(
    [
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

export const createSpaceshipBoardLayout = (
  scene: SpaceshipScene,
): BoardLayoutResult =>
  flexLayout(
    scene.panes.flatMap((pane) => [
      {
        layout: shipLayout(pane),
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

export const createSpaceshipBoardItems = (
  scene: SpaceshipScene,
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
        item({
          id: spaceshipBoardItemId.tokens(location.locationId),
          width: tokenRowWidth,
          height: tokenRowHeight,
          zIndex: 40,
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

  return items;
};

export const getSpaceshipBoardPaneItemIds = (
  scene: SpaceshipScene,
  paneId: string,
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

    ids.push(
      spaceshipBoardItemId.location(location.locationId),
      spaceshipBoardItemId.tokens(location.locationId),
    );
  });

  pane.actors.forEach((actor) => {
    actorEffectCards(actor).forEach(({ effectType, index }) => {
      ids.push(spaceshipBoardItemId.actorEffectCard(actor.actorId, effectType, index));
    });

    ids.push(spaceshipBoardItemId.actorCard(actor.actorId));
  });

  return ids;
};

export const createSpaceshipBoardItemMeta = (
  scene: SpaceshipScene,
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
      meta.set(spaceshipBoardItemId.tokens(location.locationId), {
        role: "tokens",
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

  return meta;
};
