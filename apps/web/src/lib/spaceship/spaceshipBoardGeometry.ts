import type { BoardItemInput } from "../board/boardController";
import type { BoardLayoutItemBox } from "../board/boardLayout";
import type {
  ShipActorInstance,
  ShipEffectType,
  ShipLocationInstance,
  ShipPaneModel,
  SpaceshipDraggableToken,
} from "./spaceshipTypes";

type ActorConsequenceEffectType = Extract<ShipEffectType, "injury" | "distress">;

export const boardOrigin = { x: 96, y: 96 };
export const shipPadding = 28;
export const shipWidth = 4300;
export const shipHeaderWidth = 720;
export const shipHeaderHeight = 80;
export const shipGap = 92;
export const locationWidth = 332;
export const locationHeight = 204;
export const deviceWidth = 204;
export const deviceHeight = 332;
export const deviceGap = 10;
export const locationColumnGap = 28;
export const locationRowGap = 34;
export const effectCardWidth = 204;
export const effectCardHeight = 332;
export const effectHeaderOffset = 36;
export const actorGroupWidth = 246;
export const actorCardWidth = 204;
export const actorCardHeight = 332;
export const actorGap = 24;
export const actorBaseHeight = actorCardHeight;

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

export const item = ({
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

export const tokenItem = (token: SpaceshipDraggableToken): BoardItemInput => ({
  id: spaceshipBoardItemId.token(token.tokenId),
  kind: "card",
  x: token.x,
  y: token.y,
  width: token.width,
  height: token.height,
  zIndex: token.zIndex,
});

export const energyStackItem = (): BoardItemInput =>
  item({
    id: spaceshipBoardItemId.energyStack(),
    width: spaceshipEnergyStackSize.width,
    height: spaceshipEnergyStackSize.height,
    zIndex: 900,
  });

export const box = ({
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

export const sortLocations = (
  locations: readonly ShipLocationInstance[],
  row: ShipLocationInstance["row"],
): ShipLocationInstance[] =>
  locations
    .filter((location) => location.row === row)
    .sort((left, right) => left.lastTouchedOrder - right.lastTouchedOrder);

export const sortActors = (actors: readonly ShipActorInstance[]): ShipActorInstance[] =>
  [...actors].sort((left, right) => left.lastTouchedOrder - right.lastTouchedOrder);

export const actorEffectCards = (
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
