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
import { createEncounterFragmentContent } from "./factory";
import { makeId, AdventureModuleStoreRuntime } from "./shared";
import {
  findEncounterRecord,
  makeUniqueEncounterSlug,
} from "./records";
import { rollbackCreate, rollbackDelete, rollbackUpdate } from "./rollbacks";
import { loadModuleDetail } from "./detail";

export const createEncounter = async (
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
      options.title.trim().length > 0 ? options.title.trim() : "New Encounter";
    const encounterSlug = makeUniqueEncounterSlug(normalizedTitle, loaded.index);
    const fragmentId = makeId("frag-encounter");
    const fragmentRef = {
      fragmentId,
      kind: "encounter" as const,
      title: normalizedTitle,
      path: `encounters/${encounterSlug}.mdx`,
      summary: "Describe the player goal, pressure, and likely complications.",
      tags: ["encounter", "scene"],
      containsSpoilers: false,
      intendedAudience: "shared" as const,
    };
    const encounterDetail = {
      fragmentId,
      prerequisites: "",
    };

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      encounterFragmentIds: [...loaded.index.encounterFragmentIds, fragmentId],
      encounterDetails: [...loaded.index.encounterDetails, encounterDetail],
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
    await atomicWriteTextFile(absolutePath, createEncounterFragmentContent(normalizedTitle));

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
      throw new AdventureModuleValidationError("Created encounter could not be loaded.");
    }
    return next;
  });
};

export const updateEncounter = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    encounterSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    prerequisites: string;
    titleImageUrl?: string;
    content: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const encounterRecord = findEncounterRecord(loaded.index, options.encounterSlug);
    if (!encounterRecord) {
      throw new AdventureModuleValidationError("Encounter slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const normalizedTitle =
      options.title.trim().length > 0
        ? options.title.trim()
        : encounterRecord.fragment.title;
    const nextEncounterSlug = makeUniqueEncounterSlug(
      normalizedTitle,
      loaded.index,
      encounterRecord.fragment.fragmentId,
    );
    const nextEncounterPath = `encounters/${nextEncounterSlug}.mdx`;
    const nextFragments = loaded.index.fragments.map((fragment) => {
      if (fragment.fragmentId !== encounterRecord.fragment.fragmentId) {
        return fragment;
      }
      return {
        ...fragment,
        title: normalizedTitle,
        path: nextEncounterPath,
        summary: options.summary.trim().length > 0 ? options.summary.trim() : undefined,
      };
    });

    const normalizedTitleImageUrl =
      typeof options.titleImageUrl === "string" &&
      options.titleImageUrl.trim().length > 0
        ? options.titleImageUrl.trim()
        : undefined;
    const nextEncounterDetails = loaded.index.encounterDetails.map((encounterDetail) => {
      if (encounterDetail.fragmentId !== encounterRecord.fragment.fragmentId) {
        return encounterDetail;
      }
      return {
        fragmentId: encounterDetail.fragmentId,
        prerequisites: options.prerequisites,
        ...(normalizedTitleImageUrl ? { titleImageUrl: normalizedTitleImageUrl } : {}),
      };
    });
    const nextArtifacts = loaded.index.artifacts.map((artifact) => {
      if (artifact.sourceFragmentId !== encounterRecord.fragment.fragmentId) {
        return artifact;
      }
      return {
        ...artifact,
        path: nextEncounterPath,
        title: normalizedTitle,
      };
    });

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      fragments: nextFragments,
      encounterDetails: nextEncounterDetails,
      artifacts: nextArtifacts,
      updatedAtIso: nowIso,
    });

    const previousAbsolutePath = resolveSafePath(
      loaded.moduleDir,
      encounterRecord.fragment.path,
    );
    const nextAbsolutePath = resolveSafePath(loaded.moduleDir, nextEncounterPath);
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
      throw new AdventureModuleValidationError("Updated encounter could not be loaded.");
    }
    return next;
  });
};

export const deleteEncounter = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    encounterSlug: string;
    creatorToken?: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    if (loaded.index.encounterFragmentIds.length <= 1) {
      throw new AdventureModuleValidationError(
        "At least one encounter must remain in the module.",
      );
    }

    const encounterRecord = findEncounterRecord(loaded.index, options.encounterSlug);
    if (!encounterRecord) {
      throw new AdventureModuleValidationError("Encounter slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const fragmentId = encounterRecord.fragment.fragmentId;
    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      locationDetails: loaded.index.locationDetails.map((locationDetail) => ({
        ...locationDetail,
        mapPins: locationDetail.mapPins.filter(
          (mapPin) => mapPin.targetFragmentId !== fragmentId,
        ),
      })),
      encounterFragmentIds: loaded.index.encounterFragmentIds.filter(
        (entry) => entry !== fragmentId,
      ),
      encounterDetails: loaded.index.encounterDetails.filter(
        (encounterDetail) => encounterDetail.fragmentId !== fragmentId,
      ),
      fragments: loaded.index.fragments.filter((fragment) => fragment.fragmentId !== fragmentId),
      questGraphs: loaded.index.questGraphs.map((questGraph) => ({
        ...questGraph,
        nodes: questGraph.nodes.map((node) => ({
          ...node,
          encounterFragmentIds: node.encounterFragmentIds.filter(
            (encounterFragmentId) => encounterFragmentId !== fragmentId,
          ),
        })),
      })),
      componentOpportunities: loaded.index.componentOpportunities.filter(
        (opportunity) => opportunity.fragmentId !== fragmentId,
      ),
      artifacts: loaded.index.artifacts.filter(
        (artifact) => artifact.sourceFragmentId !== fragmentId,
      ),
      updatedAtIso: nowIso,
    });

    const absolutePath = resolveSafePath(loaded.moduleDir, encounterRecord.fragment.path);
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
      throw new AdventureModuleValidationError("Deleted encounter could not be loaded.");
    }
    return next;
  });
};
