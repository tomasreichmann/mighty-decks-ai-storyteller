import { createContext, useContext } from "react";
import type {
  AdventureModuleResolvedActor,
  AdventureModuleResolvedAsset,
  AdventureModuleResolvedCounter,
  AdventureModuleResolvedEncounter,
} from "@mighty-decks/spec/adventureModuleAuthoring";

export type CounterAdjustTarget = "current" | "max";

export interface GameCardCatalogContextValue {
  actors: readonly AdventureModuleResolvedActor[];
  actorsBySlug: ReadonlyMap<string, AdventureModuleResolvedActor>;
  counters: readonly AdventureModuleResolvedCounter[];
  countersBySlug: ReadonlyMap<string, AdventureModuleResolvedCounter>;
  assets: readonly AdventureModuleResolvedAsset[];
  assetsBySlug: ReadonlyMap<string, AdventureModuleResolvedAsset>;
  encounters: readonly AdventureModuleResolvedEncounter[];
  encountersBySlug: ReadonlyMap<string, AdventureModuleResolvedEncounter>;
  onAdjustCounterValue?: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => void;
}

const EMPTY_ACTORS_BY_SLUG = new Map<string, AdventureModuleResolvedActor>();
const EMPTY_COUNTERS_BY_SLUG = new Map<string, AdventureModuleResolvedCounter>();
const EMPTY_ASSETS_BY_SLUG = new Map<string, AdventureModuleResolvedAsset>();
const EMPTY_ENCOUNTERS_BY_SLUG = new Map<
  string,
  AdventureModuleResolvedEncounter
>();

export const GameCardCatalogContext =
  createContext<GameCardCatalogContextValue>({
    actors: [],
    actorsBySlug: EMPTY_ACTORS_BY_SLUG,
    counters: [],
    countersBySlug: EMPTY_COUNTERS_BY_SLUG,
    assets: [],
    assetsBySlug: EMPTY_ASSETS_BY_SLUG,
    encounters: [],
    encountersBySlug: EMPTY_ENCOUNTERS_BY_SLUG,
  });

export const useGameCardCatalogContext = (): GameCardCatalogContextValue =>
  useContext(GameCardCatalogContext);
