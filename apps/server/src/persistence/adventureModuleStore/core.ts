import { mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { adventureModuleIndexSchema } from "@mighty-decks/spec/adventureModule";
import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import { atomicWriteTextFile } from "../../utils/atomicFileWrite";
import {
  AdventureModuleForbiddenError,
  AdventureModuleNotFoundError,
} from "./errors";
import {
  AdventureModuleStoreRuntime,
  ModuleSystemMetadata,
  hashCreatorToken,
  isMissingFileError,
  moduleSystemMetadataSchema,
  normalizeStoredIndexCandidate,
} from "./shared";

export interface LoadedAdventureModule {
  moduleDir: string;
  index: AdventureModuleIndex;
  system: ModuleSystemMetadata;
}

export const withModuleWriteLock = async <T>(
  runtime: AdventureModuleStoreRuntime,
  moduleId: string,
  operation: () => Promise<T>,
): Promise<T> => {
  let releaseLock: () => void = () => {};
  const currentLock = runtime.moduleWriteLocks.get(moduleId) ?? Promise.resolve();
  const nextLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  runtime.moduleWriteLocks.set(moduleId, nextLock);

  await currentLock.catch(() => undefined);
  try {
    return await operation();
  } finally {
    releaseLock();
    const latestLock = runtime.moduleWriteLocks.get(moduleId);
    if (latestLock === nextLock) {
      runtime.moduleWriteLocks.delete(moduleId);
    }
  }
};

export const moduleDir = (
  runtime: AdventureModuleStoreRuntime,
  moduleId: string,
): string => resolveSafePath(runtime.rootDir, moduleId);

export const resolveSafePath = (baseDir: string, relativePath: string): string => {
  const absolutePath = resolve(baseDir, relativePath);
  const normalizedBase = baseDir.endsWith(sep) ? baseDir : `${baseDir}${sep}`;
  if (absolutePath !== baseDir && !absolutePath.startsWith(normalizedBase)) {
    throw new AdventureModuleForbiddenError("Unsafe file path.");
  }
  return absolutePath;
};

export const safeReadDirectories = async (parentDir: string): Promise<string[]> => {
  try {
    const entries = await readdir(parentDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
};

export const loadStoredModule = async (
  runtime: AdventureModuleStoreRuntime,
  moduleId: string,
): Promise<LoadedAdventureModule | null> => {
  const currentModuleDir = moduleDir(runtime, moduleId);
  const indexPath = resolveSafePath(currentModuleDir, "index.json");
  const systemPath = resolveSafePath(currentModuleDir, "system.json");

  try {
    const [indexRaw, systemRaw] = await Promise.all([
      readFile(indexPath, "utf8"),
      readFile(systemPath, "utf8"),
    ]);
    const indexParsed = adventureModuleIndexSchema.safeParse(
      normalizeStoredIndexCandidate(JSON.parse(indexRaw) as unknown),
    );
    const systemParsed = moduleSystemMetadataSchema.safeParse(
      JSON.parse(systemRaw) as unknown,
    );

    if (!indexParsed.success || !systemParsed.success) {
      return null;
    }

    return {
      moduleDir: currentModuleDir,
      index: indexParsed.data,
      system: systemParsed.data,
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }
    return null;
  }
};

export const requireStoredModule = async (
  runtime: AdventureModuleStoreRuntime,
  moduleId: string,
): Promise<LoadedAdventureModule> => {
  const loaded = await loadStoredModule(runtime, moduleId);
  if (!loaded) {
    throw new AdventureModuleNotFoundError("Adventure module not found.");
  }
  return loaded;
};

export const assertOwnership = (
  system: ModuleSystemMetadata,
  creatorToken?: string,
): void => {
  if (system.creatorTokenHash !== hashCreatorToken(creatorToken)) {
    throw new AdventureModuleForbiddenError("Only the module creator can edit this draft.");
  }
};

export const readExistingTextFile = async (path: string): Promise<string> => {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (isMissingFileError(error)) {
      return "";
    }
    throw error;
  }
};

export const writeModuleIndex = async (
  moduleDirPath: string,
  index: AdventureModuleIndex,
): Promise<void> => {
  const indexPath = resolveSafePath(moduleDirPath, "index.json");
  await atomicWriteTextFile(indexPath, JSON.stringify(index, null, 2));
};

export const writeModuleSystem = async (
  moduleDirPath: string,
  system: ModuleSystemMetadata,
): Promise<void> => {
  const systemPath = resolveSafePath(moduleDirPath, "system.json");
  await atomicWriteTextFile(systemPath, JSON.stringify(system, null, 2));
};

export const loadFragmentContents = async (
  index: AdventureModuleIndex,
  moduleDirPath: string,
): Promise<AdventureModuleDetail["fragments"]> => {
  const fragments = await Promise.all(
    index.fragments.map(async (fragmentRef) => {
      const absolutePath = resolveSafePath(moduleDirPath, fragmentRef.path);
      let content = "";
      try {
        content = await readFile(absolutePath, "utf8");
      } catch (error) {
        if (!isMissingFileError(error)) {
          throw error;
        }
      }

      return {
        fragment: fragmentRef,
        content,
      };
    }),
  );

  return fragments;
};

export const writeFullModule = async (input: {
  moduleDir: string;
  index: AdventureModuleIndex;
  fragments: AdventureModuleDetail["fragments"];
  creatorTokenHash: string;
  createdAtIso: string;
  updatedAtIso: string;
  coverImageUrl?: string;
}): Promise<void> => {
  await mkdir(input.moduleDir, { recursive: true });

  await writeModuleIndex(input.moduleDir, input.index);
  await writeModuleSystem(input.moduleDir, {
    version: 1,
    creatorTokenHash: input.creatorTokenHash,
    createdAtIso: input.createdAtIso,
    updatedAtIso: input.updatedAtIso,
    coverImageUrl: input.coverImageUrl,
  });

  for (const fragment of input.fragments) {
    const absolutePath = resolveSafePath(input.moduleDir, fragment.fragment.path);
    await mkdir(dirname(absolutePath), { recursive: true });
    await atomicWriteTextFile(absolutePath, fragment.content);
  }
};

export const ensureFragmentFilesExist = async (
  moduleDirPath: string,
  index: AdventureModuleIndex,
): Promise<void> => {
  await Promise.all(
    index.fragments.map(async (fragment) => {
      const absolutePath = resolveSafePath(moduleDirPath, fragment.path);
      await mkdir(dirname(absolutePath), { recursive: true });
      try {
        await readFile(absolutePath, "utf8");
      } catch (error) {
        if (!isMissingFileError(error)) {
          throw error;
        }
        await atomicWriteTextFile(absolutePath, "");
      }
    }),
  );
};
