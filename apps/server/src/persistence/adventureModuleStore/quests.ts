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
import { createQuestFragmentContent } from "./factory";
import { makeId, AdventureModuleStoreRuntime } from "./shared";
import { findQuestRecord, makeUniqueQuestSlug } from "./records";
import { rollbackCreate, rollbackDelete, rollbackUpdate } from "./rollbacks";
import { loadModuleDetail } from "./detail";

export const createQuest = async (
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
      options.title.trim().length > 0 ? options.title.trim() : "New Quest";
    const questSlug = makeUniqueQuestSlug(normalizedTitle, loaded.index);
    const fragmentId = makeId("frag-quest");
    const fragmentRef = {
      fragmentId,
      kind: "quest" as const,
      title: normalizedTitle,
      path: `quests/${questSlug}.mdx`,
      summary: "Describe the quest hook, escalating pressure, and likely outcomes.",
      tags: ["quest"],
      containsSpoilers: false,
      intendedAudience: "shared" as const,
    };
    const questDetail = {
      fragmentId,
      questId: `quest-${fragmentId}`,
    };

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      questFragmentIds: [...loaded.index.questFragmentIds, fragmentId],
      questDetails: [...loaded.index.questDetails, questDetail],
      fragments: [...loaded.index.fragments, fragmentRef],
      questGraphs: [
        ...loaded.index.questGraphs,
        {
          questId: questDetail.questId,
          title: normalizedTitle,
          summary: `A new quest for ${normalizedTitle}`,
          hooks: [],
          nodes: [],
          edges: [],
          entryNodeIds: [],
          conclusionNodeIds: [],
          conclusions: [],
        },
      ],
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
    await atomicWriteTextFile(absolutePath, createQuestFragmentContent(normalizedTitle));

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
      throw new AdventureModuleValidationError("Created quest could not be loaded.");
    }
    return next;
  });
};

export const updateQuest = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    questSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    titleImageUrl?: string;
    content: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const questRecord = findQuestRecord(loaded.index, options.questSlug);
    if (!questRecord) {
      throw new AdventureModuleValidationError("Quest slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const normalizedTitle =
      options.title.trim().length > 0 ? options.title.trim() : questRecord.fragment.title;
    const nextQuestSlug = makeUniqueQuestSlug(
      normalizedTitle,
      loaded.index,
      questRecord.fragment.fragmentId,
    );
    const nextQuestPath = `quests/${nextQuestSlug}.mdx`;
    const nextFragments = loaded.index.fragments.map((fragment) => {
      if (fragment.fragmentId !== questRecord.fragment.fragmentId) {
        return fragment;
      }
      return {
        ...fragment,
        title: normalizedTitle,
        path: nextQuestPath,
        summary: options.summary.trim().length > 0 ? options.summary.trim() : undefined,
      };
    });

    const normalizedTitleImageUrl =
      typeof options.titleImageUrl === "string" &&
      options.titleImageUrl.trim().length > 0
        ? options.titleImageUrl.trim()
        : undefined;
    const nextQuestDetails = loaded.index.questDetails.map((questDetail) => {
      if (questDetail.fragmentId !== questRecord.fragment.fragmentId) {
        return questDetail;
      }
      return {
        fragmentId: questDetail.fragmentId,
        questId: questDetail.questId,
        ...(normalizedTitleImageUrl ? { titleImageUrl: normalizedTitleImageUrl } : {}),
      };
    });
    const nextArtifacts = loaded.index.artifacts.map((artifact) => {
      if (artifact.sourceFragmentId !== questRecord.fragment.fragmentId) {
        return artifact;
      }
      return {
        ...artifact,
        path: nextQuestPath,
        title: normalizedTitle,
      };
    });

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      fragments: nextFragments,
      questDetails: nextQuestDetails,
      artifacts: nextArtifacts,
      updatedAtIso: nowIso,
    });

    const previousAbsolutePath = resolveSafePath(
      loaded.moduleDir,
      questRecord.fragment.path,
    );
    const nextAbsolutePath = resolveSafePath(loaded.moduleDir, nextQuestPath);
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
      throw new AdventureModuleValidationError("Updated quest could not be loaded.");
    }
    return next;
  });
};

export const deleteQuest = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    questSlug: string;
    creatorToken?: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    if (loaded.index.questFragmentIds.length <= 1) {
      throw new AdventureModuleValidationError(
        "At least one quest must remain in the module.",
      );
    }

    const questRecord = findQuestRecord(loaded.index, options.questSlug);
    if (!questRecord) {
      throw new AdventureModuleValidationError("Quest slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const fragmentId = questRecord.fragment.fragmentId;
    const questId = questRecord.detail.questId;
    const deletedNodeIds = new Set((questRecord.graph?.nodes ?? []).map((node) => node.nodeId));
    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      locationDetails: loaded.index.locationDetails.map((locationDetail) => ({
        ...locationDetail,
        mapPins: locationDetail.mapPins.filter(
          (mapPin) => mapPin.targetFragmentId !== fragmentId,
        ),
      })),
      questFragmentIds: loaded.index.questFragmentIds.filter((entry) => entry !== fragmentId),
      questDetails: loaded.index.questDetails.filter(
        (questDetail) => questDetail.fragmentId !== fragmentId,
      ),
      fragments: loaded.index.fragments.filter((fragment) => fragment.fragmentId !== fragmentId),
      questGraphs: loaded.index.questGraphs.filter((questGraph) => questGraph.questId !== questId),
      componentOpportunities: loaded.index.componentOpportunities.filter(
        (opportunity) =>
          opportunity.fragmentId !== fragmentId &&
          opportunity.questId !== questId &&
          !deletedNodeIds.has(opportunity.nodeId ?? ""),
      ),
      artifacts: loaded.index.artifacts.filter((artifact) => artifact.sourceFragmentId !== fragmentId),
      updatedAtIso: nowIso,
    });

    const absolutePath = resolveSafePath(loaded.moduleDir, questRecord.fragment.path);
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
      throw new AdventureModuleValidationError("Deleted quest could not be loaded.");
    }
    return next;
  });
};
