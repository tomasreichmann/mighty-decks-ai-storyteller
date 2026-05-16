import type {
  ActorBaseLayerSlug,
  ActorTacticalRoleSlug,
} from "@mighty-decks/spec/actorCards";
import type { ButtonColors } from "../../components/common/Button";

export type ShipLocationType =
  | "cockpit"
  | "engine-room"
  | "life-support"
  | "reactor"
  | "docking-bay"
  | "cargo-hold"
  | "medical-bay"
  | "missile-bay"
  | "sensor-array"
  | "shield-generator"
  | "spin-drive"
  | "laser-turret"
  | "scatter-turret"
  | "weapons-station"
  | "sealed-corridor"
  | "crew-quarters";

export type ShipLocationRow = "top" | "bottom";
export type ShipEffectType = "distress" | "freezing" | "injury";
export type CardLibraryEntryType = "location" | "effect" | "token" | "actor";
export type PowerTokenState = "active" | "spent";
export type ShipRangeBand = "close" | "near" | "far";
export type ShipDeviceType =
  | "flight-controls"
  | "weapon-turret"
  | "sensors"
  | "shields"
  | "engines"
  | "spin-drive"
  | "life-support"
  | "workbench"
  | "missile-bay"
  | "reactor"
  | "support";

export interface ShipEffectInstance {
  effectId: string;
  type: ShipEffectType;
  label: string;
  detail: string;
  count: number;
}

export interface ActorTokenModel {
  tokenId: string;
  label: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  tone?: ButtonColors;
  locationId?: string;
}

export interface ShipActorCustomCardModel {
  imageUrl: string;
  adjective: string;
  noun: string;
  nounDescription: string;
  adjectiveDescription: string;
}

export interface EnergyTokenModel {
  tokenId: string;
  label: string;
  detail?: string;
  locationId: string;
  state?: PowerTokenState;
}

export interface ShipDeviceAssetModel {
  deck?: string;
  modifier: string;
  noun: string;
  nounDescription: string;
  adjectiveDescription: string;
  iconUrl: string;
}

export interface ShipDeviceInstance {
  deviceId: string;
  title: string;
  type: ShipDeviceType;
  level: number;
  damage: number;
  used: boolean;
  maxPower: number;
  powerTokens: EnergyTokenModel[];
  asset: ShipDeviceAssetModel;
}

export interface ShipLocationInstance {
  locationId: string;
  title: string;
  locationType: ShipLocationType;
  level: number;
  row: ShipLocationRow;
  moduleLocationSlug?: string;
  summary: string;
  status: string;
  energyCost?: number;
  imageUrl?: string;
  effects: ShipEffectInstance[];
  energyTokens: EnergyTokenModel[];
  actorTokens: ActorTokenModel[];
  device?: ShipDeviceInstance;
  lastTouchedOrder: number;
}

export interface ShipActorInstance {
  actorId: string;
  name: string;
  callout: string;
  baseLayerSlug: ActorBaseLayerSlug;
  tacticalRoleSlug: ActorTacticalRoleSlug;
  customCard?: ShipActorCustomCardModel;
  token: ActorTokenModel;
  injuryCount: number;
  distressCount: number;
  lastTouchedOrder: number;
}

export interface ShipPaneModel {
  paneId: string;
  title: string;
  subtitle: string;
  backgroundImageUrl?: string;
  faction: string;
  emphasis: "player" | "enemy";
  hullPoints: number;
  hullDamage: number;
  generatorLevel: number;
  rangeBand: ShipRangeBand;
  detectionPower: number;
  cloakingPower: number;
  locations: ShipLocationInstance[];
  actors: ShipActorInstance[];
}

export interface CardLibraryEntry {
  entryId: string;
  type: CardLibraryEntryType;
  title: string;
  category: string;
  summary: string;
  badge: string;
  imageUrl?: string;
  effectSlug?: string;
}

export interface SpaceshipOverlayState {
  open: boolean;
}

export interface SpaceshipSelectionState {
  selectedEntryIds: string[];
}

// Milestone 2 will update these bands from pointer-driven drag/drop. Tokens stay
// above cards by keeping separate last-touched stacks for each render layer.
export interface SpaceshipZBands {
  cards: string[];
  tokens: string[];
}

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
  paneId?: string;
  ownerId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  placement: SpaceshipCardPlacement;
}

export interface SpaceshipEnergyStackState {
  totalCount: number;
  availableCount: number;
}

export interface SpaceshipDragState {
  layouts: SpaceshipLayoutMembershipState;
  cards: SpaceshipDraggableCard[];
  tokens: SpaceshipDraggableToken[];
  energyStack: SpaceshipEnergyStackState;
  nextCardZIndex: number;
  nextZIndex: number;
  nextEnergyTokenIndex: number;
}

export interface SpaceshipScene {
  sceneId: string;
  title: string;
  subtitle: string;
  panes: [ShipPaneModel, ShipPaneModel];
  overlay: SpaceshipOverlayState;
  selection: SpaceshipSelectionState;
  zBands: SpaceshipZBands;
  cardLibrary: CardLibraryEntry[];
}
