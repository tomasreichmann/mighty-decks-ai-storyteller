import type { BoardItemInput } from "../board/boardController";
import type { SpaceshipDragState, SpaceshipScene } from "./spaceshipTypes";
import {
  actorCardHeight,
  actorCardWidth,
  actorEffectCards,
  deviceHeight,
  deviceWidth,
  effectCardHeight,
  effectCardWidth,
  energyStackItem,
  item,
  locationHeight,
  locationWidth,
  shipHeaderHeight,
  shipHeaderWidth,
  spaceshipBoardItemId,
  tokenItem,
  type SpaceshipBoardItemMeta,
} from "./spaceshipBoardGeometry";

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
