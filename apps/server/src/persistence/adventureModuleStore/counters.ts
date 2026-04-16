import { adventureModuleIndexSchema, type AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import { defaultCounterIconSlug } from "@mighty-decks/spec/counterCards";
import { AdventureModuleValidationError } from "./errors";
import {
  assertOwnership,
  requireStoredModule,
  withModuleWriteLock,
  writeModuleIndex,
  writeModuleSystem,
} from "./core";
import { makeUniqueCounterSlug, findCounterRecord } from "./records";
import { AdventureModuleStoreRuntime } from "./shared";
import { loadModuleDetail } from "./detail";

const clampCounterValue = (currentValue: number, maxValue?: number): number => {
  const floorValue = Math.max(0, Math.trunc(currentValue));
  if (typeof maxValue !== "number") {
    return floorValue;
  }
  return Math.min(floorValue, Math.max(0, Math.trunc(maxValue)));
};

export const createCounter = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const nowIso = new Date().toISOString();
    const normalizedTitle =
      options.title.trim().length > 0 ? options.title.trim() : "New Counter";

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      counters: [
        ...loaded.index.counters,
        {
          slug: makeUniqueCounterSlug(normalizedTitle, loaded.index),
          iconSlug: defaultCounterIconSlug,
          title: normalizedTitle,
          currentValue: 0,
          description: "",
        },
      ],
      updatedAtIso: nowIso,
    });

    await writeModuleIndex(loaded.moduleDir, nextIndex);
    await writeModuleSystem(loaded.moduleDir, {
      ...loaded.system,
      updatedAtIso: nowIso,
    });

    const next = await loadModuleDetail(runtime, options.moduleId, options.creatorToken);
    if (!next) {
      throw new AdventureModuleValidationError("Created counter could not be loaded.");
    }
    return next;
  });
};

export const updateCounter = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    counterSlug: string;
    creatorToken?: string;
    title: string;
    iconSlug: AdventureModuleIndex["counters"][number]["iconSlug"];
    currentValue: number;
    maxValue?: number;
    description: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const counterRecord = findCounterRecord(loaded.index, options.counterSlug);
    if (!counterRecord) {
      throw new AdventureModuleValidationError("Counter slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const title =
      options.title.trim().length > 0 ? options.title.trim() : counterRecord.title;
    const description = options.description.trim();
    const maxValue =
      typeof options.maxValue === "number" ? Math.max(0, options.maxValue) : undefined;
    const currentValue = clampCounterValue(options.currentValue, maxValue);
    const nextCounterSlug = makeUniqueCounterSlug(title, loaded.index, counterRecord.slug);

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      counters: loaded.index.counters.map((counter) => {
        if (counter.slug !== counterRecord.slug) {
          return counter;
        }
        return {
          slug: nextCounterSlug,
          iconSlug: options.iconSlug,
          title,
          currentValue,
          ...(typeof maxValue === "number" ? { maxValue } : {}),
          description,
        };
      }),
      updatedAtIso: nowIso,
    });

    await writeModuleIndex(loaded.moduleDir, nextIndex);
    await writeModuleSystem(loaded.moduleDir, {
      ...loaded.system,
      updatedAtIso: nowIso,
    });

    const next = await loadModuleDetail(runtime, options.moduleId, options.creatorToken);
    if (!next) {
      throw new AdventureModuleValidationError("Updated counter could not be loaded.");
    }
    return next;
  });
};

export const deleteCounter = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    counterSlug: string;
    creatorToken?: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const counterRecord = findCounterRecord(loaded.index, options.counterSlug);
    if (!counterRecord) {
      throw new AdventureModuleValidationError("Counter slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      counters: loaded.index.counters.filter((counter) => counter.slug !== counterRecord.slug),
      updatedAtIso: nowIso,
    });

    await writeModuleIndex(loaded.moduleDir, nextIndex);
    await writeModuleSystem(loaded.moduleDir, {
      ...loaded.system,
      updatedAtIso: nowIso,
    });

    const next = await loadModuleDetail(runtime, options.moduleId, options.creatorToken);
    if (!next) {
      throw new AdventureModuleValidationError("Deleted counter could not be loaded.");
    }
    return next;
  });
};
