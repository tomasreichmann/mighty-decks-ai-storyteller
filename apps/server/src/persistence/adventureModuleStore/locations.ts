import { dirname } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { adventureModuleIndexSchema, type AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
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
import { composeLocationFragmentContent } from "./factory";
import { loadModuleDetail } from "./detail";
import {
  defaultLocationDescriptionMarkdown,
  defaultLocationIntroductionMarkdown,
  makeId,
  AdventureModuleStoreRuntime,
} from "./shared";
import { findLocationRecord, makeUniqueLocationSlug } from "./records";
import { rollbackCreate, rollbackDelete, rollbackUpdate } from "./rollbacks";

export const createLocation = async (
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
      options.title.trim().length > 0 ? options.title.trim() : "New Location";
    const locationSlug = makeUniqueLocationSlug(normalizedTitle, loaded.index);
    const fragmentId = makeId("frag-location");
    const fragmentRef = {
      fragmentId,
      kind: "location" as const,
      title: normalizedTitle,
      path: `locations/${locationSlug}.mdx`,
      summary: "Describe what players sense immediately and what matters here.",
      tags: ["location", "map"],
      containsSpoilers: false,
      intendedAudience: "shared" as const,
    };
    const locationDetail = {
      fragmentId,
      introductionMarkdown: defaultLocationIntroductionMarkdown,
      descriptionMarkdown: defaultLocationDescriptionMarkdown,
      mapPins: [],
    };

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      locationFragmentIds: [...loaded.index.locationFragmentIds, fragmentId],
      locationDetails: [...loaded.index.locationDetails, locationDetail],
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
    await atomicWriteTextFile(
      absolutePath,
      composeLocationFragmentContent(
        normalizedTitle,
        locationDetail.introductionMarkdown,
        locationDetail.descriptionMarkdown,
      ),
    );

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
      throw new AdventureModuleValidationError("Created location could not be loaded.");
    }
    return next;
  });
};

export const updateLocation = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    locationSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    titleImageUrl?: string;
    introductionMarkdown: string;
    descriptionMarkdown: string;
    mapImageUrl?: string;
    mapPins: AdventureModuleIndex["locationDetails"][number]["mapPins"];
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const locationRecord = findLocationRecord(loaded.index, options.locationSlug);
    if (!locationRecord) {
      throw new AdventureModuleValidationError("Location slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const normalizedTitle =
      options.title.trim().length > 0 ? options.title.trim() : locationRecord.fragment.title;
    const nextLocationSlug = makeUniqueLocationSlug(
      normalizedTitle,
      loaded.index,
      locationRecord.fragment.fragmentId,
    );
    const nextLocationPath = `locations/${nextLocationSlug}.mdx`;
    const nextFragments = loaded.index.fragments.map((fragment) => {
      if (fragment.fragmentId !== locationRecord.fragment.fragmentId) {
        return fragment;
      }
      return {
        ...fragment,
        title: normalizedTitle,
        path: nextLocationPath,
        summary: options.summary.trim().length > 0 ? options.summary.trim() : undefined,
      };
    });

    const normalizedTitleImageUrl =
      typeof options.titleImageUrl === "string" &&
      options.titleImageUrl.trim().length > 0
        ? options.titleImageUrl.trim()
        : undefined;
    const normalizedMapImageUrl =
      typeof options.mapImageUrl === "string" && options.mapImageUrl.trim().length > 0
        ? options.mapImageUrl.trim()
        : undefined;

    const nextLocationDetails = loaded.index.locationDetails.map((locationDetail) => {
      if (locationDetail.fragmentId !== locationRecord.fragment.fragmentId) {
        return locationDetail;
      }
      return {
        fragmentId: locationDetail.fragmentId,
        ...(normalizedTitleImageUrl ? { titleImageUrl: normalizedTitleImageUrl } : {}),
        introductionMarkdown: options.introductionMarkdown,
        descriptionMarkdown: options.descriptionMarkdown,
        ...(normalizedMapImageUrl ? { mapImageUrl: normalizedMapImageUrl } : {}),
        mapPins: options.mapPins,
      };
    });

    const nextArtifacts = loaded.index.artifacts.map((artifact) => {
      if (artifact.sourceFragmentId !== locationRecord.fragment.fragmentId) {
        return artifact;
      }
      return {
        ...artifact,
        path: nextLocationPath,
        title: normalizedTitle,
      };
    });

    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      fragments: nextFragments,
      locationDetails: nextLocationDetails,
      artifacts: nextArtifacts,
      updatedAtIso: nowIso,
    });

    const previousAbsolutePath = resolveSafePath(
      loaded.moduleDir,
      locationRecord.fragment.path,
    );
    const nextAbsolutePath = resolveSafePath(loaded.moduleDir, nextLocationPath);
    const previousContent = await readExistingTextFile(previousAbsolutePath);
    await mkdir(dirname(nextAbsolutePath), { recursive: true });
    await atomicWriteTextFile(
      nextAbsolutePath,
      composeLocationFragmentContent(
        normalizedTitle,
        options.introductionMarkdown,
        options.descriptionMarkdown,
      ),
    );

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
      throw new AdventureModuleValidationError("Updated location could not be loaded.");
    }
    return next;
  });
};

export const deleteLocation = async (
  runtime: AdventureModuleStoreRuntime,
  options: {
    moduleId: string;
    locationSlug: string;
    creatorToken?: string;
  },
): Promise<AdventureModuleDetail> => {
  return withModuleWriteLock(runtime, options.moduleId, async () => {
    const loaded = await requireStoredModule(runtime, options.moduleId);
    assertOwnership(loaded.system, options.creatorToken);

    const locationRecord = findLocationRecord(loaded.index, options.locationSlug);
    if (!locationRecord) {
      throw new AdventureModuleValidationError("Location slug not found in module.");
    }

    const nowIso = new Date().toISOString();
    const fragmentId = locationRecord.fragment.fragmentId;
    const nextIndex = adventureModuleIndexSchema.parse({
      ...loaded.index,
      locationFragmentIds: loaded.index.locationFragmentIds.filter(
        (entry) => entry !== fragmentId,
      ),
      locationDetails: loaded.index.locationDetails.filter(
        (locationDetail) => locationDetail.fragmentId !== fragmentId,
      ),
      fragments: loaded.index.fragments.filter((fragment) => fragment.fragmentId !== fragmentId),
      artifacts: loaded.index.artifacts.filter(
        (artifact) => artifact.sourceFragmentId !== fragmentId,
      ),
      updatedAtIso: nowIso,
    });

    const absolutePath = resolveSafePath(loaded.moduleDir, locationRecord.fragment.path);
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
      throw new AdventureModuleValidationError("Deleted location could not be loaded.");
    }
    return next;
  });
};
