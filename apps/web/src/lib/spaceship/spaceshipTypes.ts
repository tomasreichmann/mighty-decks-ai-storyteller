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

export interface EnergyTokenModel {
  tokenId: string;
  label: string;
  detail?: string;
  locationId: string;
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
  lastTouchedOrder: number;
}

export interface ShipActorInstance {
  actorId: string;
  name: string;
  callout: string;
  baseLayerSlug: ActorBaseLayerSlug;
  tacticalRoleSlug: ActorTacticalRoleSlug;
  token: ActorTokenModel;
  injuryCount: number;
  distressCount: number;
  lastTouchedOrder: number;
}

export interface ShipPaneModel {
  paneId: string;
  title: string;
  subtitle: string;
  faction: string;
  emphasis: "player" | "enemy";
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
