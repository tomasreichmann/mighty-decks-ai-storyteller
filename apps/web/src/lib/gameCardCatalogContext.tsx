import { createContext, useContext } from "react";
import type {
  AdventureModuleResolvedActor,
  AdventureModuleResolvedAsset,
  AdventureModuleResolvedCounter,
  AdventureModuleResolvedEncounter,
  AdventureModuleResolvedLocation,
  AdventureModuleResolvedQuest,
} from "@mighty-decks/spec/adventureModuleAuthoring";

export type CounterAdjustTarget = "current" | "max";

export interface GameCardCatalogContextValue {
  actors: readonly AdventureModuleResolvedActor[];
  actorsBySlug: ReadonlyMap<string, AdventureModuleResolvedActor>;
  counters: readonly AdventureModuleResolvedCounter[];
  countersBySlug: ReadonlyMap<string, AdventureModuleResolvedCounter>;
  assets: readonly AdventureModuleResolvedAsset[];
  assetsBySlug: ReadonlyMap<string, AdventureModuleResolvedAsset>;
  locations: readonly AdventureModuleResolvedLocation[];
  locationsBySlug: ReadonlyMap<string, AdventureModuleResolvedLocation>;
  encounters: readonly AdventureModuleResolvedEncounter[];
  encountersBySlug: ReadonlyMap<string, AdventureModuleResolvedEncounter>;
  quests: readonly AdventureModuleResolvedQuest[];
  questsBySlug: ReadonlyMap<string, AdventureModuleResolvedQuest>;
  onAdjustCounterValue?: (
    counterSlug: string,
    delta: number,
    target?: CounterAdjustTarget,
  ) => void;
}

const EMPTY_ACTORS_BY_SLUG = new Map<string, AdventureModuleResolvedActor>();
const EMPTY_COUNTERS_BY_SLUG = new Map<string, AdventureModuleResolvedCounter>();
const EMPTY_ASSETS_BY_SLUG = new Map<string, AdventureModuleResolvedAsset>();
const EMPTY_LOCATIONS_BY_SLUG = new Map<
  string,
  AdventureModuleResolvedLocation
>();
const EMPTY_ENCOUNTERS_BY_SLUG = new Map<
  string,
  AdventureModuleResolvedEncounter
>();
const EMPTY_QUESTS_BY_SLUG = new Map<string, AdventureModuleResolvedQuest>();

export const GameCardCatalogContext =
  createContext<GameCardCatalogContextValue>({
    actors: [],
    actorsBySlug: EMPTY_ACTORS_BY_SLUG,
    counters: [],
    countersBySlug: EMPTY_COUNTERS_BY_SLUG,
    assets: [],
    assetsBySlug: EMPTY_ASSETS_BY_SLUG,
    locations: [],
    locationsBySlug: EMPTY_LOCATIONS_BY_SLUG,
    encounters: [],
    encountersBySlug: EMPTY_ENCOUNTERS_BY_SLUG,
    quests: [],
    questsBySlug: EMPTY_QUESTS_BY_SLUG,
  });

export const useGameCardCatalogContext = (): GameCardCatalogContextValue =>
  useContext(GameCardCatalogContext);

export const createGameCardCatalogContextValue = (
  options: {
    actors?: readonly AdventureModuleResolvedActor[];
    counters?: readonly AdventureModuleResolvedCounter[];
    assets?: readonly AdventureModuleResolvedAsset[];
    locations?: readonly AdventureModuleResolvedLocation[];
    encounters?: readonly AdventureModuleResolvedEncounter[];
    quests?: readonly AdventureModuleResolvedQuest[];
    onAdjustCounterValue?: (
      counterSlug: string,
      delta: number,
      target?: CounterAdjustTarget,
    ) => void;
  } = {},
): GameCardCatalogContextValue => {
  const {
    actors = [],
    counters = [],
    assets = [],
    locations = [],
    encounters = [],
    quests = [],
    onAdjustCounterValue,
  } = options;

  return {
    actors,
    actorsBySlug: new Map(
      actors.map((actor) => [actor.actorSlug.toLocaleLowerCase(), actor]),
    ),
    counters,
    countersBySlug: new Map(
      counters.map((counter) => [counter.slug.toLocaleLowerCase(), counter]),
    ),
    assets,
    assetsBySlug: new Map(
      assets.map((asset) => [asset.assetSlug.toLocaleLowerCase(), asset]),
    ),
    locations,
    locationsBySlug: new Map(
      locations.map((location) => [
        location.locationSlug.toLocaleLowerCase(),
        location,
      ]),
    ),
    encounters,
    encountersBySlug: new Map(
      encounters.map((encounter) => [
        encounter.encounterSlug.toLocaleLowerCase(),
        encounter,
      ]),
    ),
    quests,
    questsBySlug: new Map(
      quests.map((quest) => [quest.questSlug.toLocaleLowerCase(), quest]),
    ),
    onAdjustCounterValue,
  };
};
