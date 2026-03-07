import { createHash } from "node:crypto";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { z } from "zod";
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
  if (
    typeof intentValue === "string" &&
    intentValue.trim().length > 0 &&
    (typeof premiseValue !== "string" || premiseValue.trim().length === 0)
  ) {
    return {
      ...record,
      premise: intentValue,
    };
  }
  return record;
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
    return adventureModuleDetailSchema.parse({
      index: loaded.index,
      fragments,
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
      const normalizedIndex = adventureModuleIndexSchema.parse({
        ...options.index,
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
    const contentByKind: Partial<Record<AdventureModuleFragmentKind, string>> = {
      index: "# Module Index\n\nThis module index is managed by the authoring editor.",
      storyteller_summary:
        "# Storyteller Summary\n\nSpoiler-ready guidance for a Storyteller running this module.",
      player_summary:
        "# Player Summary\n\nSpoiler-free invitation text for potential players.",
      palette: "# Palette\n\n## Dos\n- Keep pressure visible\n\n## Donts\n- Do not hard-lock progress",
      setting: "# Setting\n\nDescribe the core premise, tone, and pressure vectors.",
      location: "# Location\n\nDetail notable places and possible routes.",
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
        contentByKind[fragment.kind] ??
        `# ${fragment.title}\n\nDraft content for ${fragment.kind.replaceAll("_", " ")}.`,
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
      actorFragmentIds: ["frag-actor-main"],
      assetFragmentIds: ["frag-asset-main"],
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
