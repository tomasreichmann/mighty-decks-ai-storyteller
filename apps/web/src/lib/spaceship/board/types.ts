import type {
  ShipActorInstance,
  ShipEffectType,
  ShipLocationInstance,
  ShipPaneModel,
} from "../scene/types";
import type { SpaceshipDraggableToken } from "../drag/types";

export type SpaceshipBoardItemRole =
  | "ship-background"
  | "ship-header"
  | "location"
  | "device"
  | "effect-card"
  | "token"
  | "dispenser-panel"
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
