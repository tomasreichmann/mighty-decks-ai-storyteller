import type {
  AdventureModuleDetail,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import { adventureModuleDetailSchema } from "@mighty-decks/spec/adventureModuleAuthoring";
import type { LoadedAdventureModule } from "./core";
import {
  loadFragmentContents,
  loadStoredModule,
} from "./core";
import { hashCreatorToken, AdventureModuleStoreRuntime } from "./shared";
import {
  resolveActors,
  resolveAssets,
  resolveCounters,
  resolveEncounters,
  resolveLocations,
  resolveQuests,
} from "./records";

export const buildModuleDetail = async (
  loaded: LoadedAdventureModule,
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const fragments = await loadFragmentContents(loaded.index, loaded.moduleDir);
  const ownedByRequester = loaded.system.creatorTokenHash === hashCreatorToken(creatorToken);

  return adventureModuleDetailSchema.parse({
    index: loaded.index,
    fragments,
    locations: resolveLocations(loaded.index, fragments),
    encounters: resolveEncounters(loaded.index, fragments),
    quests: resolveQuests(loaded.index, fragments),
    actors: resolveActors(loaded.index, fragments),
    counters: resolveCounters(loaded.index),
    assets: resolveAssets(loaded.index, fragments),
    coverImageUrl: loaded.system.coverImageUrl,
    ownedByRequester,
  });
};

export const loadModuleDetail = async (
  runtime: AdventureModuleStoreRuntime,
  moduleId: string,
  creatorToken?: string,
): Promise<AdventureModuleDetail | null> => {
  const loaded = await loadStoredModule(runtime, moduleId);
  if (!loaded) {
    return null;
  }
  return buildModuleDetail(loaded, creatorToken);
};

export const loadModuleDetailBySlug = async (
  runtime: AdventureModuleStoreRuntime,
  findModuleIdBySlug: (slug: string) => Promise<string | null>,
  slug: string,
  creatorToken?: string,
): Promise<AdventureModuleDetail | null> => {
  const moduleId = await findModuleIdBySlug(slug);
  if (!moduleId) {
    return null;
  }
  return loadModuleDetail(runtime, moduleId, creatorToken);
};
