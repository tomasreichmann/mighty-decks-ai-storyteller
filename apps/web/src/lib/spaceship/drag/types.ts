import type { ButtonColors } from "../../../components/common/Button";
import type {
  PowerTokenState,
  ShipEffectType,
  ShipLocationRow,
} from "../scene/types";

export type SpaceshipDraggableTokenKind = "energy" | "actor";

export type SpaceshipTokenPlacement =
  | { type: "board" }
  | {
      type: "card";
      cardItemId: string;
      offsetX: number;
      offsetY: number;
    };

export interface SpaceshipDraggableToken {
  tokenId: string;
  kind: SpaceshipDraggableTokenKind;
  label: string;
  detail?: string;
  state?: PowerTokenState;
  imageUrl?: string;
  tone?: ButtonColors;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  paneId?: string;
  sourceLocationId?: string;
  placement: SpaceshipTokenPlacement;
}

export type SpaceshipDraggableCardRole =
  | "location"
  | "device"
  | "effect-card"
  | "actor-card"
  | "actor-effect-card";

export type SpaceshipLayoutId = string;

export type SpaceshipLayoutKind =
  | "location-row"
  | "device-column"
  | "effect-stack"
  | "actor-row";

export interface SpaceshipLocationRowLayout {
  layoutId: SpaceshipLayoutId;
  type: "location-row";
  paneId: string;
  row: ShipLocationRow;
  itemIds: string[];
}

export interface SpaceshipDeviceColumnLayout {
  layoutId: SpaceshipLayoutId;
  type: "device-column";
  locationItemId: string;
  itemIds: string[];
}

export interface SpaceshipEffectStackLayout {
  layoutId: SpaceshipLayoutId;
  type: "effect-stack";
  ownerItemId: string;
  itemIds: string[];
}

export interface SpaceshipActorRowLayout {
  layoutId: SpaceshipLayoutId;
  type: "actor-row";
  paneId: string;
  itemIds: string[];
}

export interface SpaceshipLayoutMembershipState {
  locationRows: SpaceshipLocationRowLayout[];
  deviceColumns: SpaceshipDeviceColumnLayout[];
  effectStacks: SpaceshipEffectStackLayout[];
  actorRows: SpaceshipActorRowLayout[];
}

export type SpaceshipCardPlacement =
  | { type: "layout"; layoutId: SpaceshipLayoutId }
  | { type: "board" };

export type SpaceshipCardSnapTarget =
  | {
      type: "location-row";
      layoutId: SpaceshipLayoutId;
      index: number;
    }
  | {
      type: "device-column";
      layoutId: SpaceshipLayoutId;
      index: number;
    }
  | {
      type: "effect-stack";
      layoutId: SpaceshipLayoutId;
      ownerItemId: string;
      index: number;
    }
  | {
      type: "actor-row";
      layoutId: SpaceshipLayoutId;
      index: number;
    };

export interface SpaceshipDraggableCard {
  itemId: string;
  role: SpaceshipDraggableCardRole;
  effectType?: ShipEffectType;
  paneId?: string;
  ownerId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  placement: SpaceshipCardPlacement;
}

export interface SpaceshipDispenserPanelState {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface SpaceshipDragState {
  layouts: SpaceshipLayoutMembershipState;
  cards: SpaceshipDraggableCard[];
  tokens: SpaceshipDraggableToken[];
  dispenserPanel: SpaceshipDispenserPanelState;
  nextCardZIndex: number;
  nextZIndex: number;
  nextEnergyTokenIndex: number;
  nextEffectCardIndex: number;
}

export interface SpaceshipTrashDropResult {
  state: SpaceshipDragState;
  removedItemIds: string[];
}
