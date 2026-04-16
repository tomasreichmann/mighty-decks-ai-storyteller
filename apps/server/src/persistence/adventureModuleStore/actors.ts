import { dirname } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { adventureModuleIndexSchema, type AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import { defaultActorBaseLayerSlug, defaultActorTacticalRoleSlug } from "@mighty-decks/spec/actorCards";
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
import { createActorFragmentContent } from "./factory";
import { makeId, AdventureModuleStoreRuntime } from "./shared";
import { findActorRecord, makeUniqueActorSlug } from "./records";
import { rollbackCreate, rollbackDelete, rollbackUpdate } from "./rollbacks";
import { loadModuleDetail } from "./detail";

export const createActor = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
    isPlayerCharacter?: boolean;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const nowIso = new Date().toISOString();
    const normalizedTitle =
      options.title.trim().length > 0 ? options.title.trim() : "New Actor";
    const actorSlug = makeUniqueActorSlug(normalizedTitle, loaded.index);
    const fragmentId = makeId("frag-actor");
    const fragmentRef = {
      fragmentId,
      kind: "actor" as const,
      title: normalizedTitle,
      path: `actors/${actorSlug}.mdx`,
      summary: "Describe this actor's pressure, leverage, and public face.",
      tags: ["actor", "layered_actor"],
      containsSpoilers: false,
      intendedAudience: "shared" as const,
    };

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      actorFragmentIds: [...loaded.index.actorFragmentIds, fragmentId],
      actorCards: [
        ...loaded.index.actorCards,
        {
          fragmentId,
          baseLayerSlug: defaultActorBaseLayerSlug,
          tacticalRoleSlug: defaultActorTacticalRoleSlug,
          isPlayerCharacter: options.isPlayerCharacter === true,
        },
      ],
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
    await atomicWriteTextFile(absolutePath, createActorFragmentContent(normalizedTitle));

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
      throw new AdventureModuleValidationError("Created actor could not be loaded.");
    }
    return next;
  });
};

export const updateActor = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    actorSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    baseLayerSlug: AdventureModuleIndex["actorCards"][number]["baseLayerSlug"];
    tacticalRoleSlug: AdventureModuleIndex["actorCards"][number]["tacticalRoleSlug"];
    tacticalSpecialSlug?: AdventureModuleIndex["actorCards"][number]["tacticalSpecialSlug"];
    isPlayerCharacter: boolean;
    content: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const actorRecord = findActorRecord(loaded.index, options.actorSlug);
    if (!actorRecord) {
      throw new AdventureModuleValidationError("Actor slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const normalizedTitle =
      options.title.trim().length > 0 ? options.title.trim() : actorRecord.fragment.title;
    const nextActorSlug = makeUniqueActorSlug(
      normalizedTitle,
      loaded.index,
      actorRecord.fragment.fragmentId,
    );
    const nextActorPath = `actors/${nextActorSlug}.mdx`;
    const nextFragments = loaded.index.fragments.map((fragment) => {
      if (fragment.fragmentId !== actorRecord.fragment.fragmentId) {
        return fragment;
      }
      return {
        ...fragment,
        title: normalizedTitle,
        path: nextActorPath,
        summary: options.summary.trim().length > 0 ? options.summary.trim() : undefined,
      };
    });

    const nextActorCards = loaded.index.actorCards.map((actorCard) => {
      if (actorCard.fragmentId !== actorRecord.fragment.fragmentId) {
        return actorCard;
      }
      return {
        fragmentId: actorCard.fragmentId,
        baseLayerSlug: options.baseLayerSlug,
        tacticalRoleSlug: options.tacticalRoleSlug,
        isPlayerCharacter: options.isPlayerCharacter,
        ...(options.tacticalSpecialSlug
          ? { tacticalSpecialSlug: options.tacticalSpecialSlug }
          : {}),
      };
    });

    const nextArtifacts = loaded.index.artifacts.map((artifact) => {
      if (artifact.sourceFragmentId !== actorRecord.fragment.fragmentId) {
        return artifact;
      }
      return {
        ...artifact,
        path: nextActorPath,
        title: normalizedTitle,
      };
    });

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      fragments: nextFragments,
      actorCards: nextActorCards,
      artifacts: nextArtifacts,
      updatedAtIso: nowIso,
    });

    const previousAbsolutePath = resolveSafePath(loaded.moduleDir, actorRecord.fragment.path);
    const nextAbsolutePath = resolveSafePath(loaded.moduleDir, nextActorPath);
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
      throw new AdventureModuleValidationError("Updated actor could not be loaded.");
    }
    return next;
  });
};

export const deleteActor = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    actorSlug: string;
    creatorToken?: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const actorRecord = findActorRecord(loaded.index, options.actorSlug);
    if (!actorRecord) {
      throw new AdventureModuleValidationError("Actor slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const fragmentId = actorRecord.fragment.fragmentId;
    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      actorFragmentIds: loaded.index.actorFragmentIds.filter((entry) => entry !== fragmentId),
      actorCards: loaded.index.actorCards.filter((actorCard) => actorCard.fragmentId !== fragmentId),
      fragments: loaded.index.fragments.filter((fragment) => fragment.fragmentId !== fragmentId),
      artifacts: loaded.index.artifacts.filter((artifact) => artifact.sourceFragmentId !== fragmentId),
      updatedAtIso: nowIso,
    });

    const absolutePath = resolveSafePath(loaded.moduleDir, actorRecord.fragment.path);
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
      throw new AdventureModuleValidationError("Deleted actor could not be loaded.");
    }
    return next;
  });
};
