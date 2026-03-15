import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import { basename, dirname, extname, resolve, sep } from "node:path";
import { z } from "zod";
import {
  defaultActorBaseLayerSlug,
  defaultActorTacticalRoleSlug,
} from "@mighty-decks/spec/actorCards";
import { defaultAssetBaseSlug } from "@mighty-decks/spec/assetCards";
import { defaultCounterIconSlug } from "@mighty-decks/spec/counterCards";
import {
  adventureModuleDetailSchema,
  adventureModuleListItemSchema,
  adventureModulePreviewResponseSchema,
  type AdventureModuleDetail,
  type AdventureModuleListItem,
  type AdventureModulePreviewResponse,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import {
  adventureModuleIndexSchema,
  type AdventureModuleFragmentKind,
  type AdventureModuleFragmentRef,
  type AdventureModuleIndex,
  type AdventureModuleLocationDetail,
} from "@mighty-decks/spec/adventureModule";
import { atomicWriteTextFile } from "../utils/atomicFileWrite";

interface AdventureModuleStoreOptions {
  rootDir: string;
}

interface ModuleSystemMetadata {
  version: 1;
  creatorTokenHash: string;
  createdAtIso: string;
  updatedAtIso: string;
  coverImageUrl?: string;
}

const moduleSystemMetadataSchema: z.ZodType<ModuleSystemMetadata> = z.object({
  version: z.literal(1),
  creatorTokenHash: z.string().min(1),
  createdAtIso: z.string().datetime(),
  updatedAtIso: z.string().datetime(),
  coverImageUrl: z.string().min(1).max(500).optional(),
});

const HEADERLESS_TOKEN_VALUE = "anonymous";

const hashCreatorToken = (token: string | undefined): string =>
  createHash("sha256")
    .update((token ?? HEADERLESS_TOKEN_VALUE).trim().toLowerCase())
    .digest("hex");

const makeId = (prefix: string): string => {
  const stamp = Date.now().toString(36).slice(-8);
  const noise = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}${noise}`;
};

const toSlug = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized.slice(0, 120) : makeId("module");
};

const defaultLocationIntroductionMarkdown =
  "Describe what players immediately notice when they arrive here.";
const defaultLocationDescriptionMarkdown =
  "- Actors usually here\n- Assets that can be found here\n- Exits to other locations\n- Hazards or pressure that shape the scene";

const isMissingFileError = (error: unknown): boolean => {
  const nodeError = error as NodeJS.ErrnoException;
  return Boolean(nodeError && typeof nodeError === "object" && nodeError.code === "ENOENT");
};

const normalizeStoredIndexCandidate = (candidate: unknown): unknown => {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return candidate;
  }
  const record = candidate as Record<string, unknown>;
  const intentValue = record.intent;
  const premiseValue = record.premise;
  let normalized = record;
  if (
    typeof intentValue === "string" &&
    intentValue.trim().length > 0 &&
    (typeof premiseValue !== "string" || premiseValue.trim().length === 0)
  ) {
    normalized = {
      ...normalized,
      premise: intentValue,
    };
  }

  const actorFragmentIds = Array.isArray(normalized.actorFragmentIds)
    ? normalized.actorFragmentIds.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
    : [];
  const rawActorCards = Array.isArray(normalized.actorCards) ? normalized.actorCards : [];
  const actorCardsByFragmentId = new Map<string, Record<string, unknown>>();
  for (const actorCard of rawActorCards) {
    if (!actorCard || typeof actorCard !== "object" || Array.isArray(actorCard)) {
      continue;
    }
    const actorCardRecord = actorCard as Record<string, unknown>;
    const fragmentId = actorCardRecord.fragmentId;
    if (typeof fragmentId !== "string" || fragmentId.trim().length === 0) {
      continue;
    }
    actorCardsByFragmentId.set(fragmentId, actorCardRecord);
  }

  const assetFragmentIds = Array.isArray(normalized.assetFragmentIds)
    ? normalized.assetFragmentIds.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
    : [];
  const locationFragmentIds = Array.isArray(normalized.locationFragmentIds)
    ? normalized.locationFragmentIds.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
    : [];
  const rawLocationDetails = Array.isArray(normalized.locationDetails)
    ? normalized.locationDetails
    : [];
  const locationDetailsByFragmentId = new Map<string, Record<string, unknown>>();
  for (const locationDetail of rawLocationDetails) {
    if (!locationDetail || typeof locationDetail !== "object" || Array.isArray(locationDetail)) {
      continue;
    }
    const locationDetailRecord = locationDetail as Record<string, unknown>;
    const fragmentId = locationDetailRecord.fragmentId;
    if (typeof fragmentId !== "string" || fragmentId.trim().length === 0) {
      continue;
    }
    locationDetailsByFragmentId.set(fragmentId, locationDetailRecord);
  }
  const rawAssetCards = Array.isArray(normalized.assetCards) ? normalized.assetCards : [];
  const assetCardsByFragmentId = new Map<string, Record<string, unknown>>();
  for (const assetCard of rawAssetCards) {
    if (!assetCard || typeof assetCard !== "object" || Array.isArray(assetCard)) {
      continue;
    }
    const assetCardRecord = assetCard as Record<string, unknown>;
    const fragmentId = assetCardRecord.fragmentId;
    if (typeof fragmentId !== "string" || fragmentId.trim().length === 0) {
      continue;
    }
    assetCardsByFragmentId.set(fragmentId, assetCardRecord);
  }

  return {
    ...normalized,
    locationDetails: locationFragmentIds.map((fragmentId) => {
      const existing = locationDetailsByFragmentId.get(fragmentId);
      return {
        fragmentId,
        ...(typeof existing?.titleImageUrl === "string" &&
        existing.titleImageUrl.trim().length > 0
          ? { titleImageUrl: existing.titleImageUrl.trim() }
          : {}),
        introductionMarkdown:
          typeof existing?.introductionMarkdown === "string"
            ? existing.introductionMarkdown
            : "",
        descriptionMarkdown:
          typeof existing?.descriptionMarkdown === "string"
            ? existing.descriptionMarkdown
            : "",
        ...(typeof existing?.mapImageUrl === "string" &&
        existing.mapImageUrl.trim().length > 0
          ? { mapImageUrl: existing.mapImageUrl.trim() }
          : {}),
        mapPins: Array.isArray(existing?.mapPins) ? existing.mapPins : [],
      };
    }),
    actorCards: actorFragmentIds.map((fragmentId) => {
      const existing = actorCardsByFragmentId.get(fragmentId);
      return {
        fragmentId,
        baseLayerSlug:
          typeof existing?.baseLayerSlug === "string"
            ? existing.baseLayerSlug
            : defaultActorBaseLayerSlug,
        tacticalRoleSlug:
          typeof existing?.tacticalRoleSlug === "string"
            ? existing.tacticalRoleSlug
            : defaultActorTacticalRoleSlug,
        ...(typeof existing?.tacticalSpecialSlug === "string"
          ? { tacticalSpecialSlug: existing.tacticalSpecialSlug }
          : {}),
      };
    }),
    assetCards: assetFragmentIds.map((fragmentId) => {
      const existing = assetCardsByFragmentId.get(fragmentId);
      return {
        fragmentId,
        baseAssetSlug:
          typeof existing?.baseAssetSlug === "string"
            ? existing.baseAssetSlug
            : defaultAssetBaseSlug,
        ...(typeof existing?.modifierSlug === "string"
          ? { modifierSlug: existing.modifierSlug }
          : {}),
      };
    }),
  };
};

const KINDS_SORT_ORDER: AdventureModuleFragmentKind[] = [
  "index",
  "player_summary",
  "storyteller_summary",
  "palette",
  "setting",
  "location",
  "actor",
  "asset",
  "item",
  "encounter",
  "quest",
  "component_map",
  "image_prompt",
];

const fragmentKindWeight = (kind: AdventureModuleFragmentKind): number => {
  const index = KINDS_SORT_ORDER.indexOf(kind);
  return index >= 0 ? index : KINDS_SORT_ORDER.length;
};

const deriveActorSlugFromPath = (fragmentPath: string): string =>
  toSlug(basename(fragmentPath, extname(fragmentPath)));

const deriveLocationSlugFromPath = (fragmentPath: string): string =>
  toSlug(basename(fragmentPath, extname(fragmentPath)));

const deriveAssetSlugFromPath = (fragmentPath: string): string =>
  toSlug(basename(fragmentPath, extname(fragmentPath)));

export class AdventureModuleNotFoundError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AdventureModuleNotFoundError";
  }
}

export class AdventureModuleForbiddenError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AdventureModuleForbiddenError";
  }
}

export class AdventureModuleValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AdventureModuleValidationError";
  }
}

export class AdventureModuleStore {
  private readonly rootDir: string;
  private readonly moduleWriteLocks = new Map<string, Promise<void>>();

  public constructor(options: AdventureModuleStoreOptions) {
    this.rootDir = resolve(options.rootDir);
  }

  public async initialize(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
  }

  public async listModules(creatorToken?: string): Promise<AdventureModuleListItem[]> {
    const ownerHash = hashCreatorToken(creatorToken);
    const dirEntries = await this.safeReadDirectories(this.rootDir);
    const items: AdventureModuleListItem[] = [];

    for (const moduleId of dirEntries) {
      const loaded = await this.loadStoredModule(moduleId);
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
        authorLabel:
          loaded.system.creatorTokenHash === ownerHash ? "You" : "Community",
        tags: loaded.index.tags,
        coverImageUrl: loaded.system.coverImageUrl,
        ownedByRequester: loaded.system.creatorTokenHash === ownerHash,
      });
      if (candidate.success) {
        items.push(candidate.data);
      }
    }

    return items.sort((left, right) => right.updatedAtIso.localeCompare(left.updatedAtIso));
  }

  public async checkSlugAvailability(options: {
    slug: string;
    excludeModuleId?: string;
  }): Promise<{ available: boolean; reason?: string }> {
    const existingModuleId = await this.findModuleIdBySlug(options.slug);
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
  }

  public async createModule(options: {
    creatorToken?: string;
    title?: string;
    slug?: string;
    seedPrompt?: string;
    sessionScope?: AdventureModuleIndex["sessionScope"];
    launchProfile?: AdventureModuleIndex["launchProfile"];
  }): Promise<AdventureModuleDetail> {
    const nowIso = new Date().toISOString();
    const moduleId = makeId("am");
    const title = options.title?.trim().length ? options.title.trim() : "Untitled Adventure Module";
    const slug = toSlug(options.slug?.trim().length ? options.slug : title);
    await this.assertSlugAvailable(slug);
    const index = this.createBlankIndex({
      moduleId,
      slug,
      title,
      seedPrompt: options.seedPrompt,
      sessionScope: options.sessionScope,
      launchProfile: options.launchProfile,
      nowIso,
    });

    const fragments = this.createDefaultFragmentContent(index);
    await this.writeFullModule({
      moduleId,
      index,
      fragments,
      creatorTokenHash: hashCreatorToken(options.creatorToken),
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      coverImageUrl: undefined,
    });

    const created = await this.getModule(moduleId, options.creatorToken);
    if (!created) {
      throw new AdventureModuleValidationError("Created module could not be loaded.");
    }
    return created;
  }

  public async cloneModule(options: {
    sourceModuleId: string;
    creatorToken?: string;
    title?: string;
    slug?: string;
  }): Promise<AdventureModuleDetail> {
    const source = await this.loadStoredModule(options.sourceModuleId);
    if (!source) {
      throw new AdventureModuleNotFoundError("Adventure module not found.");
    }

    const nowIso = new Date().toISOString();
    const moduleId = makeId("am");
    const title = options.title?.trim().length ? options.title.trim() : `${source.index.title} Copy`;
    const slug = toSlug(options.slug?.trim().length ? options.slug : title);
    await this.assertSlugAvailable(slug);
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

    const sourceFragments = await this.loadFragmentContents(source.index, source.moduleDir);
    await this.writeFullModule({
      moduleId,
      index: clonedIndex,
      fragments: sourceFragments,
      creatorTokenHash: hashCreatorToken(options.creatorToken),
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      coverImageUrl: source.system.coverImageUrl,
    });

    const cloned = await this.getModule(moduleId, options.creatorToken);
    if (!cloned) {
      throw new AdventureModuleValidationError("Cloned module could not be loaded.");
    }

    return cloned;
  }

  public async getModule(
    moduleId: string,
    creatorToken?: string,
  ): Promise<AdventureModuleDetail | null> {
    const loaded = await this.loadStoredModule(moduleId);
    if (!loaded) {
      return null;
    }

    const fragments = await this.loadFragmentContents(loaded.index, loaded.moduleDir);
    const ownedByRequester = loaded.system.creatorTokenHash === hashCreatorToken(creatorToken);
    const locations = this.resolveLocations(loaded.index, fragments);
    const actors = this.resolveActors(loaded.index, fragments);
    const counters = this.resolveCounters(loaded.index);
    const assets = this.resolveAssets(loaded.index, fragments);
    return adventureModuleDetailSchema.parse({
      index: loaded.index,
      fragments,
      locations,
      actors,
      counters,
      assets,
      ownedByRequester,
    });
  }

  public async getModuleBySlug(
    slug: string,
    creatorToken?: string,
  ): Promise<AdventureModuleDetail | null> {
    const moduleId = await this.findModuleIdBySlug(slug);
    if (!moduleId) {
      return null;
    }
    return this.getModule(moduleId, creatorToken);
  }

  public async updateIndex(options: {
    moduleId: string;
    index: AdventureModuleIndex;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      if (options.index.moduleId !== moduleId) {
        throw new AdventureModuleValidationError("Index moduleId must match route module id.");
      }

      const nowIso = new Date().toISOString();
      await this.assertSlugAvailable(options.index.slug, moduleId);
      // Keep entity collections authoritative in typed create/update/delete flows.
      // Generic index updates are used for module-level metadata and summary markdown.
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
        questFragmentIds: loaded.index.questFragmentIds,
        imagePromptFragmentIds: loaded.index.imagePromptFragmentIds,
        fragments: loaded.index.fragments,
        questGraphs: loaded.index.questGraphs,
        componentOpportunities: loaded.index.componentOpportunities,
        artifacts: loaded.index.artifacts,
        updatedAtIso: nowIso,
      });

      await this.writeModuleIndex(loaded.moduleDir, normalizedIndex);
      await this.ensureFragmentFilesExist(loaded.moduleDir, normalizedIndex);
      await this.writeModuleSystem(loaded.moduleDir, {
        ...loaded.system,
        updatedAtIso: nowIso,
      });

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Updated module could not be loaded.");
      }
      return next;
    });
  }

  public async updateFragment(options: {
    moduleId: string;
    fragmentId: string;
    content: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const fragmentRef = loaded.index.fragments.find(
        (fragment) => fragment.fragmentId === options.fragmentId,
      );
      if (!fragmentRef) {
        throw new AdventureModuleValidationError("Fragment id not found in module index.");
      }

      const absolutePath = this.resolveSafePath(loaded.moduleDir, fragmentRef.path);
      await mkdir(dirname(absolutePath), { recursive: true });
      await atomicWriteTextFile(absolutePath, options.content);

      const nowIso = new Date().toISOString();
      const nextIndex = adventureModuleIndexSchema.parse({
        ...loaded.index,
        updatedAtIso: nowIso,
      });

      await this.writeModuleIndex(loaded.moduleDir, nextIndex);
      await this.writeModuleSystem(loaded.moduleDir, {
        ...loaded.system,
        updatedAtIso: nowIso,
      });

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Updated module could not be loaded.");
      }
      return next;
    });
  }

  public async createLocation(options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const nowIso = new Date().toISOString();
      const normalizedTitle =
        options.title.trim().length > 0 ? options.title.trim() : "New Location";
      const locationSlug = this.makeUniqueLocationSlug(normalizedTitle, loaded.index);
      const fragmentId = makeId("frag-location");
      const fragmentRef: AdventureModuleFragmentRef = {
        fragmentId,
        kind: "location",
        title: normalizedTitle,
        path: `locations/${locationSlug}.mdx`,
        summary: "Describe what players sense immediately and what matters here.",
        tags: ["location", "map"],
        containsSpoilers: false,
        intendedAudience: "shared",
      };
      const locationDetail: AdventureModuleLocationDetail = {
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

      const absolutePath = this.resolveSafePath(loaded.moduleDir, fragmentRef.path);
      await mkdir(dirname(absolutePath), { recursive: true });
      await atomicWriteTextFile(
        absolutePath,
        this.composeLocationFragmentContent(
          normalizedTitle,
          locationDetail.introductionMarkdown,
          locationDetail.descriptionMarkdown,
        ),
      );

      try {
        await this.writeModuleIndex(loaded.moduleDir, nextIndex);
        await this.writeModuleSystem(loaded.moduleDir, {
          ...loaded.system,
          updatedAtIso: nowIso,
        });
      } catch (error) {
        await this.rollbackLocationCreate(
          loaded.moduleDir,
          loaded.index,
          loaded.system,
          absolutePath,
        );
        throw error;
      }

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Created location could not be loaded.");
      }
      return next;
    });
  }

  public async updateLocation(options: {
    moduleId: string;
    locationSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    titleImageUrl?: string;
    introductionMarkdown: string;
    descriptionMarkdown: string;
    mapImageUrl?: string;
    mapPins: AdventureModuleLocationDetail["mapPins"];
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const locationRecord = this.findLocationRecord(loaded.index, options.locationSlug);
      if (!locationRecord) {
        throw new AdventureModuleValidationError("Location slug not found in module.");
      }

      const nowIso = new Date().toISOString();
      const normalizedTitle =
        options.title.trim().length > 0
          ? options.title.trim()
          : locationRecord.fragment.title;
      const nextLocationSlug = this.makeUniqueLocationSlug(
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
          summary:
            options.summary.trim().length > 0 ? options.summary.trim() : undefined,
        };
      });

      const normalizedTitleImageUrl =
        typeof options.titleImageUrl === "string" &&
        options.titleImageUrl.trim().length > 0
          ? options.titleImageUrl.trim()
          : undefined;
      const normalizedMapImageUrl =
        typeof options.mapImageUrl === "string" &&
        options.mapImageUrl.trim().length > 0
          ? options.mapImageUrl.trim()
          : undefined;

      const nextLocationDetails = loaded.index.locationDetails.map((locationDetail) => {
        if (locationDetail.fragmentId !== locationRecord.fragment.fragmentId) {
          return locationDetail;
        }
        return {
          fragmentId: locationDetail.fragmentId,
          ...(normalizedTitleImageUrl
            ? { titleImageUrl: normalizedTitleImageUrl }
            : {}),
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

      const previousAbsolutePath = this.resolveSafePath(
        loaded.moduleDir,
        locationRecord.fragment.path,
      );
      const nextAbsolutePath = this.resolveSafePath(loaded.moduleDir, nextLocationPath);
      const previousContent = await this.readExistingTextFile(previousAbsolutePath);
      await mkdir(dirname(nextAbsolutePath), { recursive: true });
      await atomicWriteTextFile(
        nextAbsolutePath,
        this.composeLocationFragmentContent(
          normalizedTitle,
          options.introductionMarkdown,
          options.descriptionMarkdown,
        ),
      );

      try {
        await this.writeModuleIndex(loaded.moduleDir, nextIndex);
        await this.writeModuleSystem(loaded.moduleDir, {
          ...loaded.system,
          updatedAtIso: nowIso,
        });
        if (nextAbsolutePath !== previousAbsolutePath) {
          await rm(previousAbsolutePath, { recursive: true, force: true });
        }
      } catch (error) {
        await this.rollbackLocationUpdate(
          loaded.moduleDir,
          loaded.index,
          loaded.system,
          previousAbsolutePath,
          nextAbsolutePath,
          previousContent,
        );
        throw error;
      }

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Updated location could not be loaded.");
      }
      return next;
    });
  }

  public async deleteLocation(options: {
    moduleId: string;
    locationSlug: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const locationRecord = this.findLocationRecord(loaded.index, options.locationSlug);
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
        fragments: loaded.index.fragments.filter(
          (fragment) => fragment.fragmentId !== fragmentId,
        ),
        artifacts: loaded.index.artifacts.filter(
          (artifact) => artifact.sourceFragmentId !== fragmentId,
        ),
        updatedAtIso: nowIso,
      });

      const absolutePath = this.resolveSafePath(
        loaded.moduleDir,
        locationRecord.fragment.path,
      );
      const previousContent = await this.readExistingTextFile(absolutePath);

      try {
        await this.writeModuleIndex(loaded.moduleDir, nextIndex);
        await this.writeModuleSystem(loaded.moduleDir, {
          ...loaded.system,
          updatedAtIso: nowIso,
        });
        await rm(absolutePath, { recursive: true, force: true });
      } catch (error) {
        await this.rollbackLocationDelete(
          loaded.moduleDir,
          loaded.index,
          loaded.system,
          absolutePath,
          previousContent,
        );
        throw error;
      }

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Deleted location could not be loaded.");
      }
      return next;
    });
  }

  public async createActor(options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const nowIso = new Date().toISOString();
      const normalizedTitle =
        options.title.trim().length > 0 ? options.title.trim() : "New Actor";
      const actorSlug = this.makeUniqueActorSlug(normalizedTitle, loaded.index);
      const fragmentId = makeId("frag-actor");
      const fragmentRef: AdventureModuleFragmentRef = {
        fragmentId,
        kind: "actor",
        title: normalizedTitle,
        path: `actors/${actorSlug}.mdx`,
        summary: "Describe this actor's pressure, leverage, and public face.",
        tags: ["actor", "layered_actor"],
        containsSpoilers: false,
        intendedAudience: "shared",
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

      const absolutePath = this.resolveSafePath(loaded.moduleDir, fragmentRef.path);
      await mkdir(dirname(absolutePath), { recursive: true });
      await atomicWriteTextFile(absolutePath, this.createActorFragmentContent(normalizedTitle));

      try {
        await this.writeModuleIndex(loaded.moduleDir, nextIndex);
        await this.writeModuleSystem(loaded.moduleDir, {
          ...loaded.system,
          updatedAtIso: nowIso,
        });
      } catch (error) {
        await this.rollbackActorCreate(
          loaded.moduleDir,
          loaded.index,
          loaded.system,
          absolutePath,
        );
        throw error;
      }

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Created actor could not be loaded.");
      }
      return next;
    });
  }

  public async updateActor(options: {
    moduleId: string;
    actorSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    baseLayerSlug: AdventureModuleIndex["actorCards"][number]["baseLayerSlug"];
    tacticalRoleSlug: AdventureModuleIndex["actorCards"][number]["tacticalRoleSlug"];
    tacticalSpecialSlug?: AdventureModuleIndex["actorCards"][number]["tacticalSpecialSlug"];
    content: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const actorRecord = this.findActorRecord(loaded.index, options.actorSlug);
      if (!actorRecord) {
        throw new AdventureModuleValidationError("Actor slug not found in module.");
      }

      const nowIso = new Date().toISOString();
      const normalizedTitle =
        options.title.trim().length > 0
          ? options.title.trim()
          : actorRecord.fragment.title;
      const nextActorSlug = this.makeUniqueActorSlug(
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
          summary:
            options.summary.trim().length > 0 ? options.summary.trim() : undefined,
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

      const previousAbsolutePath = this.resolveSafePath(
        loaded.moduleDir,
        actorRecord.fragment.path,
      );
      const nextAbsolutePath = this.resolveSafePath(loaded.moduleDir, nextActorPath);
      const previousContent = await this.readExistingTextFile(previousAbsolutePath);
      await mkdir(dirname(nextAbsolutePath), { recursive: true });
      await atomicWriteTextFile(nextAbsolutePath, options.content);

      try {
        await this.writeModuleIndex(loaded.moduleDir, nextIndex);
        await this.writeModuleSystem(loaded.moduleDir, {
          ...loaded.system,
          updatedAtIso: nowIso,
        });
        if (nextAbsolutePath !== previousAbsolutePath) {
          await rm(previousAbsolutePath, { recursive: true, force: true });
        }
      } catch (error) {
        await this.rollbackActorUpdate(
          loaded.moduleDir,
          loaded.index,
          loaded.system,
          previousAbsolutePath,
          nextAbsolutePath,
          previousContent,
        );
        throw error;
      }

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Updated actor could not be loaded.");
      }
      return next;
    });
  }

  public async createAsset(options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const nowIso = new Date().toISOString();
      const normalizedTitle =
        options.title.trim().length > 0 ? options.title.trim() : "New Asset";
      const assetSlug = this.makeUniqueAssetSlug(normalizedTitle, loaded.index);
      const fragmentId = makeId("frag-asset");
      const fragmentRef: AdventureModuleFragmentRef = {
        fragmentId,
        kind: "asset",
        title: normalizedTitle,
        path: `assets/${assetSlug}.mdx`,
        summary: "Describe what this asset enables, risks, or unlocks.",
        tags: ["asset", "layered_asset"],
        containsSpoilers: false,
        intendedAudience: "shared",
      };

      const nextIndex = adventureModuleIndexSchema.parse({
        ...loaded.index,
        assetFragmentIds: [...loaded.index.assetFragmentIds, fragmentId],
        assetCards: [
          ...loaded.index.assetCards,
          {
            fragmentId,
            baseAssetSlug: defaultAssetBaseSlug,
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

      const absolutePath = this.resolveSafePath(loaded.moduleDir, fragmentRef.path);
      await mkdir(dirname(absolutePath), { recursive: true });
      await atomicWriteTextFile(absolutePath, this.createAssetFragmentContent(normalizedTitle));

      try {
        await this.writeModuleIndex(loaded.moduleDir, nextIndex);
        await this.writeModuleSystem(loaded.moduleDir, {
          ...loaded.system,
          updatedAtIso: nowIso,
        });
      } catch (error) {
        await this.rollbackAssetCreate(
          loaded.moduleDir,
          loaded.index,
          loaded.system,
          absolutePath,
        );
        throw error;
      }

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Created asset could not be loaded.");
      }
      return next;
    });
  }

  public async updateAsset(options: {
    moduleId: string;
    assetSlug: string;
    creatorToken?: string;
    title: string;
    summary: string;
    baseAssetSlug: AdventureModuleIndex["assetCards"][number]["baseAssetSlug"];
    modifierSlug?: AdventureModuleIndex["assetCards"][number]["modifierSlug"];
    content: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const assetRecord = this.findAssetRecord(loaded.index, options.assetSlug);
      if (!assetRecord) {
        throw new AdventureModuleValidationError("Asset slug not found in module.");
      }

      const nowIso = new Date().toISOString();
      const normalizedTitle =
        options.title.trim().length > 0
          ? options.title.trim()
          : assetRecord.fragment.title;
      const nextAssetSlug = this.makeUniqueAssetSlug(
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
          summary:
            options.summary.trim().length > 0 ? options.summary.trim() : undefined,
        };
      });

      const nextAssetCards = loaded.index.assetCards.map((assetCard) => {
        if (assetCard.fragmentId !== assetRecord.fragment.fragmentId) {
          return assetCard;
        }
        return {
          fragmentId: assetCard.fragmentId,
          baseAssetSlug: options.baseAssetSlug,
          ...(options.modifierSlug ? { modifierSlug: options.modifierSlug } : {}),
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

      const previousAbsolutePath = this.resolveSafePath(
        loaded.moduleDir,
        assetRecord.fragment.path,
      );
      const nextAbsolutePath = this.resolveSafePath(loaded.moduleDir, nextAssetPath);
      const previousContent = await this.readExistingTextFile(previousAbsolutePath);
      await mkdir(dirname(nextAbsolutePath), { recursive: true });
      await atomicWriteTextFile(nextAbsolutePath, options.content);

      try {
        await this.writeModuleIndex(loaded.moduleDir, nextIndex);
        await this.writeModuleSystem(loaded.moduleDir, {
          ...loaded.system,
          updatedAtIso: nowIso,
        });
        if (nextAbsolutePath !== previousAbsolutePath) {
          await rm(previousAbsolutePath, { recursive: true, force: true });
        }
      } catch (error) {
        await this.rollbackAssetUpdate(
          loaded.moduleDir,
          loaded.index,
          loaded.system,
          previousAbsolutePath,
          nextAbsolutePath,
          previousContent,
        );
        throw error;
      }

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Updated asset could not be loaded.");
      }
      return next;
    });
  }

  public async createCounter(options: {
    moduleId: string;
    creatorToken?: string;
    title: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const nowIso = new Date().toISOString();
      const normalizedTitle =
        options.title.trim().length > 0 ? options.title.trim() : "New Counter";

      const nextIndex = adventureModuleIndexSchema.parse({
        ...loaded.index,
        counters: [
          ...loaded.index.counters,
          {
            slug: this.makeUniqueCounterSlug(normalizedTitle, loaded.index),
            iconSlug: defaultCounterIconSlug,
            title: normalizedTitle,
            currentValue: 0,
            description: "",
          },
        ],
        updatedAtIso: nowIso,
      });

      await this.writeModuleIndex(loaded.moduleDir, nextIndex);
      await this.writeModuleSystem(loaded.moduleDir, {
        ...loaded.system,
        updatedAtIso: nowIso,
      });

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Created counter could not be loaded.");
      }
      return next;
    });
  }

  public async updateCounter(options: {
    moduleId: string;
    counterSlug: string;
    creatorToken?: string;
    title: string;
    iconSlug: AdventureModuleIndex["counters"][number]["iconSlug"];
    currentValue: number;
    maxValue?: number;
    description: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const counterRecord = this.findCounterRecord(loaded.index, options.counterSlug);
      if (!counterRecord) {
        throw new AdventureModuleValidationError("Counter slug not found in module.");
      }

      const nowIso = new Date().toISOString();
      const title =
        options.title.trim().length > 0 ? options.title.trim() : counterRecord.title;
      const description = options.description.trim();
      const maxValue =
        typeof options.maxValue === "number" ? Math.max(0, options.maxValue) : undefined;
      const currentValue = this.clampCounterValue(options.currentValue, maxValue);
      const nextCounterSlug = this.makeUniqueCounterSlug(
        title,
        loaded.index,
        counterRecord.slug,
      );

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

      await this.writeModuleIndex(loaded.moduleDir, nextIndex);
      await this.writeModuleSystem(loaded.moduleDir, {
        ...loaded.system,
        updatedAtIso: nowIso,
      });

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Updated counter could not be loaded.");
      }
      return next;
    });
  }

  public async deleteCounter(options: {
    moduleId: string;
    counterSlug: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const counterRecord = this.findCounterRecord(loaded.index, options.counterSlug);
      if (!counterRecord) {
        throw new AdventureModuleValidationError("Counter slug not found in module.");
      }

      const nowIso = new Date().toISOString();
      const nextIndex = adventureModuleIndexSchema.parse({
        ...loaded.index,
        counters: loaded.index.counters.filter(
          (counter) => counter.slug !== counterRecord.slug,
        ),
        updatedAtIso: nowIso,
      });

      await this.writeModuleIndex(loaded.moduleDir, nextIndex);
      await this.writeModuleSystem(loaded.moduleDir, {
        ...loaded.system,
        updatedAtIso: nowIso,
      });

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Deleted counter could not be loaded.");
      }
      return next;
    });
  }

  public async deleteAsset(options: {
    moduleId: string;
    assetSlug: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const assetRecord = this.findAssetRecord(loaded.index, options.assetSlug);
      if (!assetRecord) {
        throw new AdventureModuleValidationError("Asset slug not found in module.");
      }

      const nowIso = new Date().toISOString();
      const fragmentId = assetRecord.fragment.fragmentId;
      const nextIndex = adventureModuleIndexSchema.parse({
        ...loaded.index,
        assetFragmentIds: loaded.index.assetFragmentIds.filter(
          (entry) => entry !== fragmentId,
        ),
        assetCards: loaded.index.assetCards.filter(
          (assetCard) => assetCard.fragmentId !== fragmentId,
        ),
        fragments: loaded.index.fragments.filter(
          (fragment) => fragment.fragmentId !== fragmentId,
        ),
        artifacts: loaded.index.artifacts.filter(
          (artifact) => artifact.sourceFragmentId !== fragmentId,
        ),
        updatedAtIso: nowIso,
      });

      const absolutePath = this.resolveSafePath(
        loaded.moduleDir,
        assetRecord.fragment.path,
      );
      const previousContent = await this.readExistingTextFile(absolutePath);

      try {
        await this.writeModuleIndex(loaded.moduleDir, nextIndex);
        await this.writeModuleSystem(loaded.moduleDir, {
          ...loaded.system,
          updatedAtIso: nowIso,
        });
        await rm(absolutePath, { recursive: true, force: true });
      } catch (error) {
        await this.rollbackAssetDelete(
          loaded.moduleDir,
          loaded.index,
          loaded.system,
          absolutePath,
          previousContent,
        );
        throw error;
      }

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Deleted asset could not be loaded.");
      }
      return next;
    });
  }

  public async deleteActor(options: {
    moduleId: string;
    actorSlug: string;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

      const actorRecord = this.findActorRecord(loaded.index, options.actorSlug);
      if (!actorRecord) {
        throw new AdventureModuleValidationError("Actor slug not found in module.");
      }

      const nowIso = new Date().toISOString();
      const fragmentId = actorRecord.fragment.fragmentId;
      const nextIndex = adventureModuleIndexSchema.parse({
        ...loaded.index,
        actorFragmentIds: loaded.index.actorFragmentIds.filter(
          (entry) => entry !== fragmentId,
        ),
        actorCards: loaded.index.actorCards.filter(
          (actorCard) => actorCard.fragmentId !== fragmentId,
        ),
        fragments: loaded.index.fragments.filter(
          (fragment) => fragment.fragmentId !== fragmentId,
        ),
        artifacts: loaded.index.artifacts.filter(
          (artifact) => artifact.sourceFragmentId !== fragmentId,
        ),
        updatedAtIso: nowIso,
      });

      const absolutePath = this.resolveSafePath(
        loaded.moduleDir,
        actorRecord.fragment.path,
      );
      const previousContent = await this.readExistingTextFile(absolutePath);

      try {
        await this.writeModuleIndex(loaded.moduleDir, nextIndex);
        await this.writeModuleSystem(loaded.moduleDir, {
          ...loaded.system,
          updatedAtIso: nowIso,
        });
        await rm(absolutePath, { recursive: true, force: true });
      } catch (error) {
        await this.rollbackActorDelete(
          loaded.moduleDir,
          loaded.index,
          loaded.system,
          absolutePath,
          previousContent,
        );
        throw error;
      }

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Deleted actor could not be loaded.");
      }
      return next;
    });
  }

  public async updateCoverImage(options: {
    moduleId: string;
    coverImageUrl?: string | null;
    creatorToken?: string;
  }): Promise<AdventureModuleDetail> {
    const moduleId = options.moduleId;
    return this.withModuleWriteLock(moduleId, async () => {
      const loaded = await this.requireStoredModule(moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);

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

      await this.writeModuleIndex(loaded.moduleDir, nextIndex);
      await this.writeModuleSystem(loaded.moduleDir, {
        ...loaded.system,
        updatedAtIso: nowIso,
        coverImageUrl: normalizedCoverImageUrl,
      });

      const next = await this.getModule(moduleId, options.creatorToken);
      if (!next) {
        throw new AdventureModuleValidationError("Updated module could not be loaded.");
      }
      return next;
    });
  }

  public async buildPreview(options: {
    moduleId: string;
    creatorToken?: string;
    showSpoilers?: boolean;
  }): Promise<AdventureModulePreviewResponse> {
    const detail = await this.getModule(options.moduleId, options.creatorToken);
    if (!detail) {
      throw new AdventureModuleNotFoundError("Adventure module not found.");
    }

    const fragmentsById = new Map(
      detail.fragments.map((fragment) => [fragment.fragment.fragmentId, fragment]),
    );
    const showSpoilers =
      typeof options.showSpoilers === "boolean"
        ? options.showSpoilers
        : detail.ownedByRequester;

    const groupsByKind = new Map<AdventureModuleFragmentKind, AdventureModulePreviewResponse["groups"][number]>();

    for (const fragmentRef of detail.index.fragments) {
      const fragmentRecord = fragmentsById.get(fragmentRef.fragmentId);
      const isHidden = fragmentRef.containsSpoilers && !showSpoilers;
      const safeTitle = isHidden
        ? `Spoiler Fragment ${fragmentRef.kind.replaceAll("_", " ")}`
        : fragmentRef.title;
      const group =
        groupsByKind.get(fragmentRef.kind) ??
        {
          kind: fragmentRef.kind,
          totalCount: 0,
          hiddenCount: 0,
          fragments: [],
        };

      group.totalCount += 1;
      if (isHidden) {
        group.hiddenCount += 1;
      }

      group.fragments.push({
        fragmentId: fragmentRef.fragmentId,
        kind: fragmentRef.kind,
        title: safeTitle,
        summary: isHidden ? undefined : fragmentRef.summary,
        tags: fragmentRef.tags,
        containsSpoilers: fragmentRef.containsSpoilers,
        intendedAudience: fragmentRef.intendedAudience,
        hidden: isHidden,
        content: isHidden ? undefined : fragmentRecord?.content,
      });

      groupsByKind.set(fragmentRef.kind, group);
    }

    const groups = [...groupsByKind.values()].sort(
      (left, right) => fragmentKindWeight(left.kind) - fragmentKindWeight(right.kind),
    );

    const toSummary = (fragmentId: string) => {
      const fragmentRef = detail.index.fragments.find(
        (fragment) => fragment.fragmentId === fragmentId,
      );
      if (!fragmentRef) {
        return undefined;
      }
      const fragmentRecord = fragmentsById.get(fragmentId);
      const hidden = fragmentRef.containsSpoilers && !showSpoilers;
      return {
        fragmentId,
        title: hidden
          ? `Spoiler Fragment ${fragmentRef.kind.replaceAll("_", " ")}`
          : fragmentRef.title,
        hidden,
        containsSpoilers: fragmentRef.containsSpoilers,
        intendedAudience: fragmentRef.intendedAudience,
        content: hidden ? undefined : fragmentRecord?.content,
      };
    };

    return adventureModulePreviewResponseSchema.parse({
      index: detail.index,
      ownedByRequester: detail.ownedByRequester,
      showSpoilers,
      playerSummary: toSummary(detail.index.playerSummaryFragmentId),
      storytellerSummary: toSummary(detail.index.storytellerSummaryFragmentId),
      groups,
    });
  }

  private async withModuleWriteLock<T>(
    moduleId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    let releaseLock: () => void = () => {};
    const currentLock = this.moduleWriteLocks.get(moduleId) ?? Promise.resolve();
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.moduleWriteLocks.set(moduleId, nextLock);

    await currentLock.catch(() => undefined);
    try {
      return await operation();
    } finally {
      releaseLock();
      const latestLock = this.moduleWriteLocks.get(moduleId);
      if (latestLock === nextLock) {
        this.moduleWriteLocks.delete(moduleId);
      }
    }
  }

  private async assertSlugAvailable(
    slug: string,
    excludeModuleId?: string,
  ): Promise<void> {
    const availability = await this.checkSlugAvailability({ slug, excludeModuleId });
    if (!availability.available) {
      throw new AdventureModuleValidationError(
        availability.reason ?? "Slug is already in use.",
      );
    }
  }

  private async findModuleIdBySlug(slug: string): Promise<string | null> {
    const dirEntries = await this.safeReadDirectories(this.rootDir);
    for (const moduleId of dirEntries) {
      const loaded = await this.loadStoredModule(moduleId);
      if (!loaded) {
        continue;
      }
      if (loaded.index.slug === slug) {
        return loaded.index.moduleId;
      }
    }
    return null;
  }

  private async safeReadDirectories(parentDir: string): Promise<string[]> {
    try {
      const entries = await readdir(parentDir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right));
    } catch {
      return [];
    }
  }

  private moduleDir(moduleId: string): string {
    return this.resolveSafePath(this.rootDir, moduleId);
  }

  private resolveSafePath(baseDir: string, relativePath: string): string {
    const absolutePath = resolve(baseDir, relativePath);
    const normalizedBase = baseDir.endsWith(sep) ? baseDir : `${baseDir}${sep}`;
    if (absolutePath !== baseDir && !absolutePath.startsWith(normalizedBase)) {
      throw new AdventureModuleValidationError("Unsafe file path.");
    }
    return absolutePath;
  }

  private async loadStoredModule(moduleId: string): Promise<{
    moduleDir: string;
    index: AdventureModuleIndex;
    system: ModuleSystemMetadata;
  } | null> {
    const moduleDir = this.moduleDir(moduleId);
    const indexPath = this.resolveSafePath(moduleDir, "index.json");
    const systemPath = this.resolveSafePath(moduleDir, "system.json");

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
        moduleDir,
        index: indexParsed.data,
        system: systemParsed.data,
      };
    } catch (error) {
      if (isMissingFileError(error)) {
        return null;
      }
      return null;
    }
  }

  private async requireStoredModule(moduleId: string): Promise<{
    moduleDir: string;
    index: AdventureModuleIndex;
    system: ModuleSystemMetadata;
  }> {
    const loaded = await this.loadStoredModule(moduleId);
    if (!loaded) {
      throw new AdventureModuleNotFoundError("Adventure module not found.");
    }
    return loaded;
  }

  private assertOwnership(system: ModuleSystemMetadata, creatorToken?: string): void {
    if (system.creatorTokenHash !== hashCreatorToken(creatorToken)) {
      throw new AdventureModuleForbiddenError("Only the module creator can edit this draft.");
    }
  }

  private createActorFragmentContent(title: string): string {
    return `# ${title}\n\n## Public Face\n\nDescribe how this actor appears to players.\n\n## Agenda\n\n- Add the actor's main motivation.\n- Add what they want right now.\n\n## Pressure Moves\n\n- Add how they escalate the scene.\n`;
  }

  private composeLocationFragmentContent(
    title: string,
    introductionMarkdown: string,
    descriptionMarkdown: string,
  ): string {
    const normalizedIntroduction =
      introductionMarkdown.trim().length > 0
        ? introductionMarkdown.trim()
        : "";
    const normalizedDescription =
      descriptionMarkdown.trim().length > 0
        ? descriptionMarkdown.trim()
        : "";

    return `# ${title}\n\n## Introduction\n\n${normalizedIntroduction}\n\n## Description\n\n${normalizedDescription}\n`;
  }

  private createAssetFragmentContent(title: string): string {
    return `# ${title}\n\n## What It Is\n\nDescribe what this asset looks like and why it matters.\n\n## Leverage\n\n- Add what this asset makes easier.\n- Add who wants it or fears it.\n\n## Complications\n\n- Add the cost, limit, or risk of using it.\n`;
  }

  private normalizeLocationFragmentContent(content: string): string {
    return content.replace(/\r\n/g, "\n").trim();
  }

  private async readExistingTextFile(path: string): Promise<string> {
    try {
      return await readFile(path, "utf8");
    } catch (error) {
      if (isMissingFileError(error)) {
        return "";
      }
      throw error;
    }
  }

  private async rollbackActorCreate(
    moduleDir: string,
    previousIndex: AdventureModuleIndex,
    previousSystem: ModuleSystemMetadata,
    fragmentPath: string,
  ): Promise<void> {
    await Promise.allSettled([
      this.writeModuleIndex(moduleDir, previousIndex),
      this.writeModuleSystem(moduleDir, previousSystem),
      rm(fragmentPath, { recursive: true, force: true }),
    ]);
  }

  private async rollbackAssetCreate(
    moduleDir: string,
    previousIndex: AdventureModuleIndex,
    previousSystem: ModuleSystemMetadata,
    fragmentPath: string,
  ): Promise<void> {
    await Promise.allSettled([
      this.writeModuleIndex(moduleDir, previousIndex),
      this.writeModuleSystem(moduleDir, previousSystem),
      rm(fragmentPath, { recursive: true, force: true }),
    ]);
  }

  private async rollbackLocationCreate(
    moduleDir: string,
    previousIndex: AdventureModuleIndex,
    previousSystem: ModuleSystemMetadata,
    fragmentPath: string,
  ): Promise<void> {
    await Promise.allSettled([
      this.writeModuleIndex(moduleDir, previousIndex),
      this.writeModuleSystem(moduleDir, previousSystem),
      rm(fragmentPath, { recursive: true, force: true }),
    ]);
  }

  private async rollbackActorUpdate(
    moduleDir: string,
    previousIndex: AdventureModuleIndex,
    previousSystem: ModuleSystemMetadata,
    previousFragmentPath: string,
    nextFragmentPath: string,
    previousContent: string,
  ): Promise<void> {
    const rollbackTasks: Array<Promise<unknown>> = [
      this.writeModuleIndex(moduleDir, previousIndex),
      this.writeModuleSystem(moduleDir, previousSystem),
    ];

    if (previousFragmentPath === nextFragmentPath) {
      rollbackTasks.push(atomicWriteTextFile(previousFragmentPath, previousContent));
    } else {
      rollbackTasks.push(
        mkdir(dirname(previousFragmentPath), { recursive: true }).then(() =>
          atomicWriteTextFile(previousFragmentPath, previousContent),
        ),
      );
      rollbackTasks.push(rm(nextFragmentPath, { recursive: true, force: true }));
    }

    await Promise.allSettled(rollbackTasks);
  }

  private async rollbackAssetUpdate(
    moduleDir: string,
    previousIndex: AdventureModuleIndex,
    previousSystem: ModuleSystemMetadata,
    previousFragmentPath: string,
    nextFragmentPath: string,
    previousContent: string,
  ): Promise<void> {
    const rollbackTasks: Array<Promise<unknown>> = [
      this.writeModuleIndex(moduleDir, previousIndex),
      this.writeModuleSystem(moduleDir, previousSystem),
    ];

    if (previousFragmentPath === nextFragmentPath) {
      rollbackTasks.push(atomicWriteTextFile(previousFragmentPath, previousContent));
    } else {
      rollbackTasks.push(
        mkdir(dirname(previousFragmentPath), { recursive: true }).then(() =>
          atomicWriteTextFile(previousFragmentPath, previousContent),
        ),
      );
      rollbackTasks.push(rm(nextFragmentPath, { recursive: true, force: true }));
    }

    await Promise.allSettled(rollbackTasks);
  }

  private async rollbackLocationUpdate(
    moduleDir: string,
    previousIndex: AdventureModuleIndex,
    previousSystem: ModuleSystemMetadata,
    previousFragmentPath: string,
    nextFragmentPath: string,
    previousContent: string,
  ): Promise<void> {
    const rollbackTasks: Array<Promise<unknown>> = [
      this.writeModuleIndex(moduleDir, previousIndex),
      this.writeModuleSystem(moduleDir, previousSystem),
    ];

    if (previousFragmentPath === nextFragmentPath) {
      rollbackTasks.push(atomicWriteTextFile(previousFragmentPath, previousContent));
    } else {
      rollbackTasks.push(
        mkdir(dirname(previousFragmentPath), { recursive: true }).then(() =>
          atomicWriteTextFile(previousFragmentPath, previousContent),
        ),
      );
      rollbackTasks.push(rm(nextFragmentPath, { recursive: true, force: true }));
    }

    await Promise.allSettled(rollbackTasks);
  }

  private async rollbackActorDelete(
    moduleDir: string,
    previousIndex: AdventureModuleIndex,
    previousSystem: ModuleSystemMetadata,
    fragmentPath: string,
    previousContent: string,
  ): Promise<void> {
    await Promise.allSettled([
      this.writeModuleIndex(moduleDir, previousIndex),
      this.writeModuleSystem(moduleDir, previousSystem),
      mkdir(dirname(fragmentPath), { recursive: true }).then(() =>
        atomicWriteTextFile(fragmentPath, previousContent),
      ),
    ]);
  }

  private async rollbackAssetDelete(
    moduleDir: string,
    previousIndex: AdventureModuleIndex,
    previousSystem: ModuleSystemMetadata,
    fragmentPath: string,
    previousContent: string,
  ): Promise<void> {
    await Promise.allSettled([
      this.writeModuleIndex(moduleDir, previousIndex),
      this.writeModuleSystem(moduleDir, previousSystem),
      mkdir(dirname(fragmentPath), { recursive: true }).then(() =>
        atomicWriteTextFile(fragmentPath, previousContent),
      ),
    ]);
  }

  private async rollbackLocationDelete(
    moduleDir: string,
    previousIndex: AdventureModuleIndex,
    previousSystem: ModuleSystemMetadata,
    fragmentPath: string,
    previousContent: string,
  ): Promise<void> {
    await Promise.allSettled([
      this.writeModuleIndex(moduleDir, previousIndex),
      this.writeModuleSystem(moduleDir, previousSystem),
      mkdir(dirname(fragmentPath), { recursive: true }).then(() =>
        atomicWriteTextFile(fragmentPath, previousContent),
      ),
    ]);
  }

  private makeUniqueLocationSlug(
    title: string,
    index: AdventureModuleIndex,
    excludeFragmentId?: string,
  ): string {
    const baseSlug = toSlug(title);
    const existingLocationSlugs = new Set(
      index.locationFragmentIds
        .filter((fragmentId) => fragmentId !== excludeFragmentId)
        .map((fragmentId) => index.fragments.find((fragment) => fragment.fragmentId === fragmentId))
        .filter(
          (
            fragment,
          ): fragment is AdventureModuleFragmentRef => Boolean(fragment?.path),
        )
        .map((fragment) => deriveLocationSlugFromPath(fragment.path)),
    );

    if (!existingLocationSlugs.has(baseSlug)) {
      return baseSlug;
    }

    for (let suffix = 2; suffix < 10_000; suffix += 1) {
      const candidate = toSlug(`${baseSlug}-${suffix}`);
      if (!existingLocationSlugs.has(candidate)) {
        return candidate;
      }
    }

    throw new AdventureModuleValidationError("Could not allocate a unique location slug.");
  }

  private makeUniqueActorSlug(
    title: string,
    index: AdventureModuleIndex,
    excludeFragmentId?: string,
  ): string {
    const baseSlug = toSlug(title);
    const existingActorSlugs = new Set(
      index.actorFragmentIds
        .filter((fragmentId) => fragmentId !== excludeFragmentId)
        .map((fragmentId) => index.fragments.find((fragment) => fragment.fragmentId === fragmentId))
        .filter(
          (
            fragment,
          ): fragment is AdventureModuleFragmentRef => Boolean(fragment?.path),
        )
        .map((fragment) => deriveActorSlugFromPath(fragment.path)),
    );

    if (!existingActorSlugs.has(baseSlug)) {
      return baseSlug;
    }

    for (let suffix = 2; suffix < 10_000; suffix += 1) {
      const candidate = toSlug(`${baseSlug}-${suffix}`);
      if (!existingActorSlugs.has(candidate)) {
        return candidate;
      }
    }

    throw new AdventureModuleValidationError("Could not allocate a unique actor slug.");
  }

  private makeUniqueAssetSlug(
    title: string,
    index: AdventureModuleIndex,
    excludeFragmentId?: string,
  ): string {
    const baseSlug = toSlug(title);
    const existingAssetSlugs = new Set(
      index.assetFragmentIds
        .filter((fragmentId) => fragmentId !== excludeFragmentId)
        .map((fragmentId) => index.fragments.find((fragment) => fragment.fragmentId === fragmentId))
        .filter(
          (
            fragment,
          ): fragment is AdventureModuleFragmentRef => Boolean(fragment?.path),
        )
        .map((fragment) => deriveAssetSlugFromPath(fragment.path)),
    );

    if (!existingAssetSlugs.has(baseSlug)) {
      return baseSlug;
    }

    for (let suffix = 2; suffix < 10_000; suffix += 1) {
      const candidate = toSlug(`${baseSlug}-${suffix}`);
      if (!existingAssetSlugs.has(candidate)) {
        return candidate;
      }
    }

    throw new AdventureModuleValidationError("Could not allocate a unique asset slug.");
  }

  private makeUniqueCounterSlug(
    title: string,
    index: AdventureModuleIndex,
    excludeCounterSlug?: string,
  ): string {
    const baseSlug = toSlug(title);
    const existingCounterSlugs = new Set(
      index.counters
        .filter((counter) => counter.slug !== excludeCounterSlug)
        .map((counter) => counter.slug),
    );

    if (!existingCounterSlugs.has(baseSlug)) {
      return baseSlug;
    }

    for (let suffix = 2; suffix < 10_000; suffix += 1) {
      const candidate = toSlug(`${baseSlug}-${suffix}`);
      if (!existingCounterSlugs.has(candidate)) {
        return candidate;
      }
    }

    throw new AdventureModuleValidationError("Could not allocate a unique counter slug.");
  }

  private findActorRecord(
    index: AdventureModuleIndex,
    actorSlug: string,
  ): { fragment: AdventureModuleFragmentRef } | null {
    for (const actorFragmentId of index.actorFragmentIds) {
      const fragment = index.fragments.find(
        (entry) => entry.fragmentId === actorFragmentId,
      );
      if (!fragment) {
        continue;
      }
      if (deriveActorSlugFromPath(fragment.path) === actorSlug) {
        return { fragment };
      }
    }
    return null;
  }

  private findLocationRecord(
    index: AdventureModuleIndex,
    locationSlug: string,
  ): { fragment: AdventureModuleFragmentRef } | null {
    for (const locationFragmentId of index.locationFragmentIds) {
      const fragment = index.fragments.find(
        (entry) => entry.fragmentId === locationFragmentId,
      );
      if (!fragment) {
        continue;
      }
      if (deriveLocationSlugFromPath(fragment.path) === locationSlug) {
        return { fragment };
      }
    }
    return null;
  }

  private findAssetRecord(
    index: AdventureModuleIndex,
    assetSlug: string,
  ): { fragment: AdventureModuleFragmentRef } | null {
    for (const assetFragmentId of index.assetFragmentIds) {
      const fragment = index.fragments.find(
        (entry) => entry.fragmentId === assetFragmentId,
      );
      if (!fragment) {
        continue;
      }
      if (deriveAssetSlugFromPath(fragment.path) === assetSlug) {
        return { fragment };
      }
    }
    return null;
  }

  private findCounterRecord(
    index: AdventureModuleIndex,
    counterSlug: string,
  ): AdventureModuleIndex["counters"][number] | null {
    return (
      index.counters.find((counter) => counter.slug === counterSlug) ?? null
    );
  }

  private clampCounterValue(currentValue: number, maxValue?: number): number {
    const floorValue = Math.max(0, Math.trunc(currentValue));
    if (typeof maxValue !== "number") {
      return floorValue;
    }
    return Math.min(floorValue, Math.max(0, Math.trunc(maxValue)));
  }

  private resolveLocations(
    index: AdventureModuleIndex,
    fragments: AdventureModuleDetail["fragments"],
  ): AdventureModuleDetail["locations"] {
    const fragmentContentById = new Map(
      fragments.map((fragment) => [fragment.fragment.fragmentId, fragment.content] as const),
    );
    const locationDetailByFragmentId = new Map(
      index.locationDetails.map((locationDetail) => [locationDetail.fragmentId, locationDetail] as const),
    );

    return index.locationFragmentIds.flatMap((fragmentId) => {
      const fragmentRef = index.fragments.find((fragment) => fragment.fragmentId === fragmentId);
      const locationDetail = locationDetailByFragmentId.get(fragmentId);
      if (!fragmentRef || !locationDetail) {
        return [];
      }

      const storedFragmentContent = fragmentContentById.get(fragmentId) ?? "";
      const isLegacyFallbackCandidate =
        !locationDetail.titleImageUrl &&
        !locationDetail.mapImageUrl &&
        locationDetail.introductionMarkdown.length === 0 &&
        locationDetail.descriptionMarkdown.length === 0 &&
        locationDetail.mapPins.length === 0;
      const shouldUseLegacyDescription =
        isLegacyFallbackCandidate &&
        this.normalizeLocationFragmentContent(storedFragmentContent) !==
          this.normalizeLocationFragmentContent(
            this.composeLocationFragmentContent(fragmentRef.title, "", ""),
          );

      return [
        {
          fragmentId,
          locationSlug: deriveLocationSlugFromPath(fragmentRef.path),
          title: fragmentRef.title,
          summary: fragmentRef.summary,
          titleImageUrl: locationDetail.titleImageUrl,
          introductionMarkdown: locationDetail.introductionMarkdown,
          descriptionMarkdown: shouldUseLegacyDescription
            ? storedFragmentContent
            : locationDetail.descriptionMarkdown,
          mapImageUrl: locationDetail.mapImageUrl,
          mapPins: locationDetail.mapPins.map((mapPin) => ({ ...mapPin })),
        },
      ];
    });
  }

  private resolveActors(
    index: AdventureModuleIndex,
    fragments: AdventureModuleDetail["fragments"],
  ): AdventureModuleDetail["actors"] {
    const fragmentContentById = new Map(
      fragments.map((fragment) => [fragment.fragment.fragmentId, fragment.content] as const),
    );
    const actorCardByFragmentId = new Map(
      index.actorCards.map((actorCard) => [actorCard.fragmentId, actorCard] as const),
    );

    return index.actorFragmentIds.flatMap((fragmentId) => {
      const fragmentRef = index.fragments.find((fragment) => fragment.fragmentId === fragmentId);
      const actorCard = actorCardByFragmentId.get(fragmentId);
      if (!fragmentRef || !actorCard) {
        return [];
      }
      return [
        {
          fragmentId,
          actorSlug: deriveActorSlugFromPath(fragmentRef.path),
          title: fragmentRef.title,
          summary: fragmentRef.summary,
          baseLayerSlug: actorCard.baseLayerSlug,
          tacticalRoleSlug: actorCard.tacticalRoleSlug,
          tacticalSpecialSlug: actorCard.tacticalSpecialSlug,
          content: fragmentContentById.get(fragmentId) ?? "",
        },
      ];
    });
  }

  private resolveCounters(
    index: AdventureModuleIndex,
  ): AdventureModuleDetail["counters"] {
    return index.counters.map((counter) => ({ ...counter }));
  }

  private resolveAssets(
    index: AdventureModuleIndex,
    fragments: AdventureModuleDetail["fragments"],
  ): AdventureModuleDetail["assets"] {
    const fragmentContentById = new Map(
      fragments.map((fragment) => [fragment.fragment.fragmentId, fragment.content] as const),
    );
    const assetCardByFragmentId = new Map(
      index.assetCards.map((assetCard) => [assetCard.fragmentId, assetCard] as const),
    );

    return index.assetFragmentIds.flatMap((fragmentId) => {
      const fragmentRef = index.fragments.find((fragment) => fragment.fragmentId === fragmentId);
      const assetCard = assetCardByFragmentId.get(fragmentId);
      if (!fragmentRef || !assetCard) {
        return [];
      }
      return [
        {
          fragmentId,
          assetSlug: deriveAssetSlugFromPath(fragmentRef.path),
          title: fragmentRef.title,
          summary: fragmentRef.summary,
          baseAssetSlug: assetCard.baseAssetSlug,
          modifierSlug: assetCard.modifierSlug,
          content: fragmentContentById.get(fragmentId) ?? "",
        },
      ];
    });
  }

  private async loadFragmentContents(
    index: AdventureModuleIndex,
    moduleDir: string,
  ): Promise<AdventureModuleDetail["fragments"]> {
    const fragments = await Promise.all(
      index.fragments.map(async (fragmentRef) => {
        const absolutePath = this.resolveSafePath(moduleDir, fragmentRef.path);
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
  }

  private async writeFullModule(input: {
    moduleId: string;
    index: AdventureModuleIndex;
    fragments: AdventureModuleDetail["fragments"];
    creatorTokenHash: string;
    createdAtIso: string;
    updatedAtIso: string;
    coverImageUrl?: string;
  }): Promise<void> {
    const moduleDir = this.moduleDir(input.moduleId);
    await mkdir(moduleDir, { recursive: true });

    await this.writeModuleIndex(moduleDir, input.index);
    await this.writeModuleSystem(moduleDir, {
      version: 1,
      creatorTokenHash: input.creatorTokenHash,
      createdAtIso: input.createdAtIso,
      updatedAtIso: input.updatedAtIso,
      coverImageUrl: input.coverImageUrl,
    });

    for (const fragment of input.fragments) {
      const absolutePath = this.resolveSafePath(moduleDir, fragment.fragment.path);
      await mkdir(dirname(absolutePath), { recursive: true });
      await atomicWriteTextFile(absolutePath, fragment.content);
    }
  }

  private async writeModuleIndex(moduleDir: string, index: AdventureModuleIndex): Promise<void> {
    const indexPath = this.resolveSafePath(moduleDir, "index.json");
    await atomicWriteTextFile(indexPath, JSON.stringify(index, null, 2));
  }

  private async writeModuleSystem(
    moduleDir: string,
    system: ModuleSystemMetadata,
  ): Promise<void> {
    const systemPath = this.resolveSafePath(moduleDir, "system.json");
    await atomicWriteTextFile(systemPath, JSON.stringify(system, null, 2));
  }

  private async ensureFragmentFilesExist(
    moduleDir: string,
    index: AdventureModuleIndex,
  ): Promise<void> {
    await Promise.all(
      index.fragments.map(async (fragment) => {
        const absolutePath = this.resolveSafePath(moduleDir, fragment.path);
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
  }

  private createDefaultFragmentContent(
    index: AdventureModuleIndex,
  ): AdventureModuleDetail["fragments"] {
    const locationDetailByFragmentId = new Map(
      index.locationDetails.map((locationDetail) => [locationDetail.fragmentId, locationDetail] as const),
    );
    const contentByKind: Partial<Record<AdventureModuleFragmentKind, string>> = {
      index: "# Module Index\n\nThis module index is managed by the authoring editor.",
      storyteller_summary:
        "# Storyteller Summary\n\nSpoiler-ready guidance for a Storyteller running this module.",
      player_summary:
        "# Player Summary\n\nSpoiler-free invitation text for potential players.",
      palette: "# Palette\n\n## Dos\n- Keep pressure visible\n\n## Donts\n- Do not hard-lock progress",
      setting: "# Setting\n\nDescribe the core premise, tone, and pressure vectors.",
      actor: "# Actor\n\nKey goals, behavior under pressure, and leverage.",
      asset: "# Asset\n\nImportant resources and scene leverage.",
      item: "# Item\n\nOptional tools or relics that affect choices.",
      encounter: "# Encounter\n\nScene pressure, stakes, and fail-forward outcomes.",
      quest: "# Quest\n\nHooks, beats, and likely conclusions.",
      component_map:
        "# Component Opportunity Map\n\nDocument where Mighty Decks components are recommended.",
      image_prompt: "# Image Prompt\n\nPrompt text for optional generated images.",
    };

    return index.fragments.map((fragment) => ({
      fragment,
      content:
        fragment.kind === "location"
          ? this.composeLocationFragmentContent(
              fragment.title,
              locationDetailByFragmentId.get(fragment.fragmentId)?.introductionMarkdown ?? "",
              locationDetailByFragmentId.get(fragment.fragmentId)?.descriptionMarkdown ?? "",
            )
          : (
        contentByKind[fragment.kind] ??
        `# ${fragment.title}\n\nDraft content for ${fragment.kind.replaceAll("_", " ")}.`
            ),
    }));
  }

  private createBlankIndex(input: {
    moduleId: string;
    slug: string;
    title: string;
    seedPrompt?: string;
    sessionScope?: AdventureModuleIndex["sessionScope"];
    launchProfile?: AdventureModuleIndex["launchProfile"];
    nowIso: string;
  }): AdventureModuleIndex {
    const fragments: AdventureModuleFragmentRef[] = [
      {
        fragmentId: "frag-index",
        kind: "index",
        title: "Index",
        path: "index.mdx",
        summary: "Canonical module metadata and fragment manifest.",
        tags: ["index"],
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-storyteller-summary",
        kind: "storyteller_summary",
        title: "Storyteller Summary",
        path: "storyteller-summary.mdx",
        summary: "Spoiler-ready Storyteller overview.",
        tags: ["summary", "spoilers"],
        containsSpoilers: true,
        intendedAudience: "storyteller",
      },
      {
        fragmentId: "frag-player-summary",
        kind: "player_summary",
        title: "Player Summary",
        path: "player-summary.mdx",
        summary: "Spoiler-safe player invitation.",
        tags: ["summary", "players"],
        containsSpoilers: false,
        intendedAudience: "players",
      },
      {
        fragmentId: "frag-palette",
        kind: "palette",
        title: "Palette",
        path: "palette.mdx",
        summary: "Dos and donts for tone and boundaries.",
        tags: ["palette"],
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-setting",
        kind: "setting",
        title: "Setting",
        path: "setting.mdx",
        summary: "World premise and pressure vectors.",
        tags: ["setting"],
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-location-main",
        kind: "location",
        title: "Primary Location",
        path: "locations/primary-location.mdx",
        summary: "A key place where events unfold.",
        tags: ["location"],
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-actor-main",
        kind: "actor",
        title: "Primary Actor",
        path: "actors/primary-actor.mdx",
        summary: "Main actor driving pressure.",
        tags: ["actor"],
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-asset-main",
        kind: "asset",
        title: "Primary Asset",
        path: "assets/primary-asset.mdx",
        summary: "A key asset involved in the module.",
        tags: ["asset"],
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-encounter-main",
        kind: "encounter",
        title: "Primary Encounter",
        path: "encounters/primary-encounter.mdx",
        summary: "Core encounter beat.",
        tags: ["encounter"],
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-quest-main",
        kind: "quest",
        title: "Primary Quest",
        path: "quests/primary-quest.mdx",
        summary: "Node-based quest progression.",
        tags: ["quest"],
        containsSpoilers: false,
        intendedAudience: "shared",
      },
      {
        fragmentId: "frag-component-map",
        kind: "component_map",
        title: "Component Map",
        path: "components/component-map.mdx",
        summary: "Mighty Decks component opportunity map.",
        tags: ["components"],
        containsSpoilers: true,
        intendedAudience: "storyteller",
      },
    ];

    const hint = input.seedPrompt?.trim().slice(0, 220);
    const premise =
      hint && hint.length > 0 ? hint : "Draft adventure module premise.";

    return adventureModuleIndexSchema.parse({
      moduleId: input.moduleId,
      slug: input.slug,
      title: input.title,
      summary: hint && hint.length > 0 ? hint : "Draft adventure module summary.",
      premise,
      intent:
        "Deliver a one-session arc with clear hooks, escalating pressure, and fail-forward outcomes.",
      status: "draft",
      version: 1,
      sessionScope: input.sessionScope ?? "one_session_arc",
      launchProfile: input.launchProfile ?? "dual",
      authoringControlDefault: "curate_select",
      dos: ["Keep pressure visible", "Provide multiple entry hooks"],
      donts: ["Avoid single-path bottlenecks"],
      tags: ["draft", "authoring"],
      storytellerSummaryFragmentId: "frag-storyteller-summary",
      storytellerSummaryMarkdown:
        "# Storyteller Summary\n\nSpoiler-ready guidance for a Storyteller running this module.",
      playerSummaryFragmentId: "frag-player-summary",
      playerSummaryMarkdown:
        "# Player Summary\n\nSpoiler-free invitation text for potential players.",
      paletteFragmentId: "frag-palette",
      settingFragmentId: "frag-setting",
      componentMapFragmentId: "frag-component-map",
      locationFragmentIds: ["frag-location-main"],
      locationDetails: [
        {
          fragmentId: "frag-location-main",
          introductionMarkdown: defaultLocationIntroductionMarkdown,
          descriptionMarkdown: defaultLocationDescriptionMarkdown,
          mapPins: [],
        },
      ],
      actorFragmentIds: ["frag-actor-main"],
      actorCards: [
        {
          fragmentId: "frag-actor-main",
          baseLayerSlug: defaultActorBaseLayerSlug,
          tacticalRoleSlug: defaultActorTacticalRoleSlug,
        },
      ],
      counters: [],
      assetFragmentIds: ["frag-asset-main"],
      assetCards: [
        {
          fragmentId: "frag-asset-main",
          baseAssetSlug: defaultAssetBaseSlug,
        },
      ],
      itemFragmentIds: [],
      encounterFragmentIds: ["frag-encounter-main"],
      questFragmentIds: ["frag-quest-main"],
      imagePromptFragmentIds: [],
      fragments,
      questGraphs: [
        {
          questId: "quest-main",
          title: "Primary Quest Graph",
          summary: "A compact graph for a one-session arc.",
          hooks: [
            {
              hookId: "hook-starter",
              title: "Starter Hook",
              prompt: "Players hear of a rising threat and an opportunity to intervene.",
              entryNodeIds: ["node-entry"],
              clueExamples: ["Urgent witness testimony", "Physical clue at the scene"],
            },
          ],
          nodes: [
            {
              nodeId: "node-entry",
              nodeType: "scene",
              title: "Entry Scene",
              summary: "Establish stakes and possible approaches.",
              locationFragmentId: "frag-location-main",
              encounterFragmentIds: ["frag-encounter-main"],
              actorFragmentIds: ["frag-actor-main"],
              assetFragmentIds: ["frag-asset-main"],
              itemFragmentIds: [],
              pressureCounterHint: "Clock: pressure rises every two turns.",
              exitNotes: ["Follow direct lead", "Take stealth route"],
            },
            {
              nodeId: "node-conclusion",
              nodeType: "conclusion",
              title: "Conclusion",
              summary: "Resolve immediate conflict and set fallout.",
              locationFragmentId: "frag-location-main",
              encounterFragmentIds: ["frag-encounter-main"],
              actorFragmentIds: ["frag-actor-main"],
              assetFragmentIds: ["frag-asset-main"],
              itemFragmentIds: [],
              exitNotes: ["Clean win", "Costly win"],
            },
          ],
          edges: [
            {
              edgeId: "edge-entry-to-conclusion",
              fromNodeId: "node-entry",
              toNodeId: "node-conclusion",
              label: "Escalate",
              clueHint: "A visible consequence pushes urgency.",
            },
          ],
          entryNodeIds: ["node-entry"],
          conclusionNodeIds: ["node-conclusion"],
          conclusions: [
            {
              conclusionId: "conclusion-primary",
              title: "Primary Conclusion",
              summary: "Threat is contained with measurable fallout.",
              sampleOutcomes: ["Stability restored at a cost"],
              forwardHooks: ["A rival faction exploits the aftermath"],
            },
          ],
        },
      ],
      componentOpportunities: [
        {
          opportunityId: "opp-primary-counter",
          componentType: "counter",
          strength: "recommended",
          timing: "during_action",
          fragmentId: "frag-encounter-main",
          fragmentKind: "encounter",
          questId: "quest-main",
          nodeId: "node-entry",
          placementLabel: "Escalation Clock",
          trigger: "Whenever players take costly or loud actions.",
          rationale: "Keeps pressure visible and helps fail-forward pacing.",
        },
      ],
      artifacts: fragments.map((fragment) => ({
        artifactId: `artifact-${fragment.fragmentId}`,
        kind: "mdx",
        path: fragment.path,
        title: fragment.title,
        sourceFragmentId: fragment.fragmentId,
        contentType: "text/markdown",
        generatedBy: "author",
        createdAtIso: input.nowIso,
      })),
      notes: "Draft generated by Adventure Module authoring flow.",
      updatedAtIso: input.nowIso,
      postMvpExtension: true,
    });
  }
}
