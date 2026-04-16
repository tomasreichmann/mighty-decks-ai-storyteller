import { dirname } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { adventureModuleIndexSchema } from "@mighty-decks/spec/adventureModule";
import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import { atomicWriteTextFile } from "../../utils/atomicFileWrite";
import { AdventureModuleValidationError } from "./errors";
import {
  assertOwnership,
  readExistingTextFile,
  requireStoredModule,
  withModuleWriteLock,
  writeModuleIndex,
  writeModuleSystem,
  resolveSafePath,
} from "./core";
import { createAssetFragmentContent } from "./factory";
import { createBlankCustomAssetCard, makeId, AdventureModuleStoreRuntime } from "./shared";
import { findAssetRecord, makeUniqueAssetSlug } from "./records";
import { rollbackCreate, rollbackDelete, rollbackUpdate } from "./rollbacks";
import { loadModuleDetail } from "./detail";

export const createAsset = async (
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
      options.title.trim().length > 0 ? options.title.trim() : "New Asset";
    const assetSlug = makeUniqueAssetSlug(normalizedTitle, loaded.index);
    const fragmentId = makeId("frag-asset");
    const fragmentRef = {
      fragmentId,
      kind: "asset" as const,
      title: normalizedTitle,
      path: `assets/${assetSlug}.mdx`,
      summary: "Describe what this asset enables, risks, or unlocks.",
      tags: ["asset"],
      containsSpoilers: false,
      intendedAudience: "shared" as const,
    };

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      assetFragmentIds: [...loaded.index.assetFragmentIds, fragmentId],
      assetCards: [...loaded.index.assetCards, createBlankCustomAssetCard(fragmentId)],
      fragments: [...loaded.index.fragments, fragmentRef],
      artifacts: [
        ...loaded.index.artifacts,
        {
          artifactId: `artifact-${fragmentId}`,
          kind: "mdx",
          path: fragmentRef.path,
          title: fragmentRef.title,
          sourceFragmentId: fragmentId,
          contentType: "text/markdown",
          generatedBy: "author",
          createdAtIso: nowIso,
        },
      ],
      updatedAtIso: nowIso,
    });

    const absolutePath = resolveSafePath(loaded.moduleDir, fragmentRef.path);
    await mkdir(dirname(absolutePath), { recursive: true });
    await atomicWriteTextFile(absolutePath, createAssetFragmentContent(normalizedTitle));

    try {
      await writeModuleIndex(loaded.moduleDir, nextIndex);
      await writeModuleSystem(loaded.moduleDir, {
        ...loaded.system,
        updatedAtIso: nowIso,
      });
    } catch (error) {
      await rollbackCreate(loaded.moduleDir, loaded.index, loaded.system, absolutePath);
      throw error;
    }

    const next = await loadModuleDetail(runtime, options.moduleId, options.creatorToken);
    if (!next) {
      throw new AdventureModuleValidationError("Created asset could not be loaded.");
    }
    return next;
  });
};

export const updateAsset = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    assetSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    modifier: string;
    noun: string;
    nounDescription: string;
    adjectiveDescription: string;
    iconUrl: string;
    overlayUrl: string;
    content: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const assetRecord = findAssetRecord(loaded.index, options.assetSlug);
    if (!assetRecord) {
      throw new AdventureModuleValidationError("Asset slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const normalizedTitle =
      options.title.trim().length > 0 ? options.title.trim() : assetRecord.fragment.title;
    const nextAssetSlug = makeUniqueAssetSlug(
      normalizedTitle,
      loaded.index,
      assetRecord.fragment.fragmentId,
    );
    const nextAssetPath = `assets/${nextAssetSlug}.mdx`;
    const nextFragments = loaded.index.fragments.map((fragment) => {
      if (fragment.fragmentId !== assetRecord.fragment.fragmentId) {
        return fragment;
      }
      return {
        ...fragment,
        title: normalizedTitle,
        path: nextAssetPath,
        summary: options.summary.trim().length > 0 ? options.summary.trim() : undefined,
      };
    });

    const nextAssetCards = loaded.index.assetCards.map((assetCard) => {
      if (assetCard.fragmentId !== assetRecord.fragment.fragmentId) {
        return assetCard;
      }
      return {
        fragmentId: assetCard.fragmentId,
        kind: "custom" as const,
        modifier: options.modifier.trim(),
        noun: options.noun.trim(),
        nounDescription: options.nounDescription.trim(),
        adjectiveDescription: options.adjectiveDescription.trim(),
        iconUrl: options.iconUrl.trim(),
        overlayUrl: options.overlayUrl.trim(),
      };
    });

    const nextArtifacts = loaded.index.artifacts.map((artifact) => {
      if (artifact.sourceFragmentId !== assetRecord.fragment.fragmentId) {
        return artifact;
      }
      return {
        ...artifact,
        path: nextAssetPath,
        title: normalizedTitle,
      };
    });

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      fragments: nextFragments,
      assetCards: nextAssetCards,
      artifacts: nextArtifacts,
      updatedAtIso: nowIso,
    });

    const previousAbsolutePath = resolveSafePath(loaded.moduleDir, assetRecord.fragment.path);
    const nextAbsolutePath = resolveSafePath(loaded.moduleDir, nextAssetPath);
    const previousContent = await readExistingTextFile(previousAbsolutePath);
    await mkdir(dirname(nextAbsolutePath), { recursive: true });
    await atomicWriteTextFile(nextAbsolutePath, options.content);

    try {
      await writeModuleIndex(loaded.moduleDir, nextIndex);
      await writeModuleSystem(loaded.moduleDir, {
        ...loaded.system,
        updatedAtIso: nowIso,
      });
      if (nextAbsolutePath !== previousAbsolutePath) {
        await rm(previousAbsolutePath, { recursive: true, force: true });
      }
    } catch (error) {
      await rollbackUpdate(
        loaded.moduleDir,
        loaded.index,
        loaded.system,
        previousAbsolutePath,
        nextAbsolutePath,
        previousContent,
      );
      throw error;
    }

    const next = await loadModuleDetail(runtime, options.moduleId, options.creatorToken);
    if (!next) {
      throw new AdventureModuleValidationError("Updated asset could not be loaded.");
    }
    return next;
  });
};

export const deleteAsset = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    assetSlug: string;
    creatorToken?: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const assetRecord = findAssetRecord(loaded.index, options.assetSlug);
    if (!assetRecord) {
      throw new AdventureModuleValidationError("Asset slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const fragmentId = assetRecord.fragment.fragmentId;
    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      assetFragmentIds: loaded.index.assetFragmentIds.filter((entry) => entry !== fragmentId),
      assetCards: loaded.index.assetCards.filter((assetCard) => assetCard.fragmentId !== fragmentId),
      fragments: loaded.index.fragments.filter((fragment) => fragment.fragmentId !== fragmentId),
      artifacts: loaded.index.artifacts.filter((artifact) => artifact.sourceFragmentId !== fragmentId),
      updatedAtIso: nowIso,
    });

    const absolutePath = resolveSafePath(loaded.moduleDir, assetRecord.fragment.path);
    const previousContent = await readExistingTextFile(absolutePath);

    try {
      await writeModuleIndex(loaded.moduleDir, nextIndex);
      await writeModuleSystem(loaded.moduleDir, {
        ...loaded.system,
        updatedAtIso: nowIso,
      });
      await rm(absolutePath, { recursive: true, force: true });
    } catch (error) {
      await rollbackDelete(
        loaded.moduleDir,
        loaded.index,
        loaded.system,
        absolutePath,
        previousContent,
      );
      throw error;
    }

    const next = await loadModuleDetail(runtime, options.moduleId, options.creatorToken);
    if (!next) {
      throw new AdventureModuleValidationError("Deleted asset could not be loaded.");
    }
    return next;
  });
};
