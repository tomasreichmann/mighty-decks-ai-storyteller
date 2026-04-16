import { rm } from "node:fs/promises";
import {
  adventureModuleListItemSchema,
  type AdventureModuleDetail,
  type AdventureModuleListItem,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import { adventureModuleIndexSchema, type AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import { atomicWriteTextFile } from "../../utils/atomicFileWrite";
import { AdventureModuleNotFoundError, AdventureModuleValidationError } from "./errors";
import {
  assertOwnership,
  ensureFragmentFilesExist,
  loadFragmentContents,
  loadStoredModule,
  requireStoredModule,
  safeReadDirectories,
  writeFullModule,
  writeModuleIndex,
  writeModuleSystem,
  withModuleWriteLock,
  moduleDir,
  resolveSafePath,
} from "./core";
import {
  createBlankIndex,
  createDefaultFragmentContent,
} from "./factory";
import {
  hashCreatorToken,
  makeId,
  toSlug,
  AdventureModuleStoreRuntime,
} from "./shared";
import { loadModuleDetail } from "./detail";

export const listModules = async (
  runtime: AdventureModuleStoreRuntime,
  creatorToken?: string,
): Promise<AdventureModuleListItem[]> => {
  const ownerHash = hashCreatorToken(creatorToken);
  const dirEntries = await safeReadDirectories(runtime.rootDir);
  const items: AdventureModuleListItem[] = [];

  for (const moduleId of dirEntries) {
    const loaded = await loadStoredModule(runtime, moduleId);
    if (!loaded) {
      continue;
    }
    const candidate = adventureModuleListItemSchema.safeParse({
      moduleId: loaded.index.moduleId,
      slug: loaded.index.slug,
      title: loaded.index.title,
      summary: loaded.index.summary,
      status: loaded.index.status,
      createdAtIso: loaded.system.createdAtIso,
      updatedAtIso: loaded.index.updatedAtIso,
      authorLabel: loaded.system.creatorTokenHash === ownerHash ? "You" : "Community",
      tags: loaded.index.tags,
      coverImageUrl: loaded.system.coverImageUrl,
      ownedByRequester: loaded.system.creatorTokenHash === ownerHash,
    });
    if (candidate.success) {
      items.push(candidate.data);
    }
  }

  return items.sort((left, right) => right.updatedAtIso.localeCompare(left.updatedAtIso));
};

const findModuleIdBySlug = async (
  runtime: AdventureModuleStoreRuntime,
  slug: string,
): Promise<string | null> => {
  const dirEntries = await safeReadDirectories(runtime.rootDir);
  for (const moduleId of dirEntries) {
    const loaded = await loadStoredModule(runtime, moduleId);
    if (!loaded) {
      continue;
    }
    if (loaded.index.slug === slug) {
      return loaded.index.moduleId;
    }
  }
  return null;
};

export const checkSlugAvailability = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    slug: string;
    excludeModuleId?: string;
  },
): Promise<{ available: boolean; reason?: string }> => {
  const existingModuleId = await findModuleIdBySlug(runtime, options.slug);
  if (!existingModuleId) {
    return { available: true };
  }
  if (options.excludeModuleId && existingModuleId === options.excludeModuleId) {
    return { available: true };
  }
  return {
    available: false,
    reason: "Slug is already in use.",
  };
};

const assertSlugAvailable = async (
  runtime: AdventureModuleStoreRuntime,
  slug: string,
  excludeModuleId?: string,
): Promise<void> => {
  const availability = await checkSlugAvailability(runtime, { slug, excludeModuleId });
  if (!availability.available) {
    throw new AdventureModuleValidationError(
      availability.reason ?? "Slug is already in use.",
    );
  }
};

export const createModule = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    creatorToken?: string;
    title?: string;
    slug?: string;
    seedPrompt?: string;
    sessionScope?: AdventureModuleIndex["sessionScope"];
    launchProfile?: AdventureModuleIndex["launchProfile"];
  },
): Promise<AdventureModuleDetail> => {
  const nowIso = new Date().toISOString();
  const moduleId = makeId("am");
  const title =
    options.title?.trim().length ? options.title.trim() : "Untitled Adventure Module";
  const slug = toSlug(options.slug?.trim().length ? options.slug : title);
  await assertSlugAvailable(runtime, slug);
  const index = createBlankIndex({
    moduleId,
    slug,
    title,
    seedPrompt: options.seedPrompt,
    sessionScope: options.sessionScope,
    launchProfile: options.launchProfile,
    nowIso,
  });

  const fragments = createDefaultFragmentContent(index);
  await writeFullModule({
    moduleDir: moduleDir(runtime, moduleId),
    index,
    fragments,
    creatorTokenHash: hashCreatorToken(options.creatorToken),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    coverImageUrl: undefined,
  });

  const created = await getModule(runtime, moduleId, options.creatorToken);
  if (!created) {
    throw new AdventureModuleValidationError("Created module could not be loaded.");
  }
  return created;
};

export const cloneModule = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    sourceModuleId: string;
    creatorToken?: string;
    title?: string;
    slug?: string;
  },
): Promise<AdventureModuleDetail> => {
  const source = await loadStoredModule(runtime, options.sourceModuleId);
  if (!source) {
    throw new AdventureModuleNotFoundError("Adventure module not found.");
  }

  const nowIso = new Date().toISOString();
  const moduleId = makeId("am");
  const title =
    options.title?.trim().length ? options.title.trim() : `${source.index.title} Copy`;
  const slug = toSlug(options.slug?.trim().length ? options.slug : title);
  await assertSlugAvailable(runtime, slug);
  const clonedIndex = adventureModuleIndexSchema.parse({
    ...source.index,
    moduleId,
    slug,
    title,
    status: "draft",
    publishedAtIso: undefined,
    updatedAtIso: nowIso,
    postMvpExtension: true,
  });

  const sourceFragments = await loadFragmentContents(source.index, source.moduleDir);
  await writeFullModule({
    moduleDir: moduleDir(runtime, moduleId),
    index: clonedIndex,
    fragments: sourceFragments,
    creatorTokenHash: hashCreatorToken(options.creatorToken),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    coverImageUrl: source.system.coverImageUrl,
  });

  const cloned = await getModule(runtime, moduleId, options.creatorToken);
  if (!cloned) {
    throw new AdventureModuleValidationError("Cloned module could not be loaded.");
  }

  return cloned;
};

export const importModule = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    source: AdventureModuleDetail;
    creatorToken?: string;
    title?: string;
    slug?: string;
    status?: AdventureModuleIndex["status"];
  },
): Promise<AdventureModuleDetail> => {
  const nowIso = new Date().toISOString();
  const moduleId = makeId("am");
  const title =
    options.title?.trim().length ? options.title.trim() : options.source.index.title;
  const slug = toSlug(options.slug?.trim().length ? options.slug : title);
  await assertSlugAvailable(runtime, slug);

  const importedIndex = adventureModuleIndexSchema.parse({
    ...options.source.index,
    moduleId,
    slug,
    title,
    status: options.status ?? "draft",
    publishedAtIso: undefined,
    updatedAtIso: nowIso,
    postMvpExtension: true,
  });

  await writeFullModule({
    moduleDir: moduleDir(runtime, moduleId),
    index: importedIndex,
    fragments: options.source.fragments,
    creatorTokenHash: hashCreatorToken(options.creatorToken),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    coverImageUrl: options.source.coverImageUrl,
  });

  const imported = await getModule(runtime, moduleId, options.creatorToken);
  if (!imported) {
    throw new AdventureModuleValidationError("Imported module could not be loaded.");
  }

  return imported;
};

export const getModule = async (
  runtime: AdventureModuleStoreRuntime,
  moduleId: string,
  creatorToken?: string,
): Promise<AdventureModuleDetail | null> => {
  return loadModuleDetail(runtime, moduleId, creatorToken);
};

export const getModuleBySlug = async (
  runtime: AdventureModuleStoreRuntime,
  slug: string,
  creatorToken?: string,
): Promise<AdventureModuleDetail | null> => {
  const moduleId = await findModuleIdBySlug(runtime, slug);
  if (!moduleId) {
    return null;
  }
  return loadModuleDetail(runtime, moduleId, creatorToken);
};

export const updateIndex = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    index: AdventureModuleIndex;
    creatorToken?: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    if (options.index.moduleId !== options.moduleId) {
      throw new AdventureModuleValidationError("Index moduleId must match route module id.");
    }

    const nowIso = new Date().toISOString();
    await assertSlugAvailable(runtime, options.index.slug, options.moduleId);
    const normalizedIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      ...options.index,
      locationFragmentIds: loaded.index.locationFragmentIds,
      locationDetails: loaded.index.locationDetails,
      actorFragmentIds: loaded.index.actorFragmentIds,
      actorCards: loaded.index.actorCards,
      counters: loaded.index.counters,
      assetFragmentIds: loaded.index.assetFragmentIds,
      assetCards: loaded.index.assetCards,
      itemFragmentIds: loaded.index.itemFragmentIds,
      encounterFragmentIds: loaded.index.encounterFragmentIds,
      encounterDetails: loaded.index.encounterDetails,
      questFragmentIds: loaded.index.questFragmentIds,
      questDetails: loaded.index.questDetails,
      imagePromptFragmentIds: loaded.index.imagePromptFragmentIds,
      fragments: loaded.index.fragments,
      questGraphs: loaded.index.questGraphs,
      componentOpportunities: loaded.index.componentOpportunities,
      artifacts: loaded.index.artifacts,
      updatedAtIso: nowIso,
    });

    await writeModuleIndex(loaded.moduleDir, normalizedIndex);
    await ensureFragmentFilesExist(loaded.moduleDir, normalizedIndex);
    await writeModuleSystem(loaded.moduleDir, {
      ...loaded.system,
      updatedAtIso: nowIso,
    });

    const next = await getModule(runtime, options.moduleId, options.creatorToken);
    if (!next) {
      throw new AdventureModuleValidationError("Updated module could not be loaded.");
    }
    return next;
  });
};

export const updateCoverImage = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    coverImageUrl?: string | null;
    creatorToken?: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const nowIso = new Date().toISOString();
    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      updatedAtIso: nowIso,
    });

    const normalizedCoverImageUrl =
      typeof options.coverImageUrl === "string" &&
      options.coverImageUrl.trim().length > 0
        ? options.coverImageUrl.trim()
        : undefined;

    await writeModuleIndex(loaded.moduleDir, nextIndex);
    await writeModuleSystem(loaded.moduleDir, {
      ...loaded.system,
      updatedAtIso: nowIso,
      coverImageUrl: normalizedCoverImageUrl,
    });

    const next = await getModule(runtime, options.moduleId, options.creatorToken);
    if (!next) {
      throw new AdventureModuleValidationError("Updated module could not be loaded.");
    }
    return next;
  });
};

export const updateFragment = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    fragmentId: string;
    content: string;
    creatorToken?: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const fragmentRef = loaded.index.fragments.find(
      (fragment) => fragment.fragmentId === options.fragmentId,
    );
    if (!fragmentRef) {
      throw new AdventureModuleValidationError("Fragment id not found in module index.");
    }

    const absolutePath = resolveSafePath(loaded.moduleDir, fragmentRef.path);
    await atomicWriteTextFile(absolutePath, options.content);

    const nowIso = new Date().toISOString();
    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      updatedAtIso: nowIso,
    });

    await writeModuleIndex(loaded.moduleDir, nextIndex);
    await writeModuleSystem(loaded.moduleDir, {
      ...loaded.system,
      updatedAtIso: nowIso,
    });

    const next = await getModule(runtime, options.moduleId, options.creatorToken);
    if (!next) {
      throw new AdventureModuleValidationError("Updated module could not be loaded.");
    }
    return next;
  });
};

export const deleteModule = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    creatorToken?: string;
  },
): Promise<void> => {
  await withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);
    await rm(loaded.moduleDir, { recursive: true, force: true });
  });
};
