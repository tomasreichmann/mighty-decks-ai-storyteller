import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ImageProvider } from "@mighty-decks/spec/imageGeneration";
import { z } from "zod";
import type { ImageStore } from "./ImageStore";

const portraitAliasEntrySchema = z.object({
  characterNameKey: z.string().min(1),
  characterName: z.string().min(1),
  provider: z.enum(["fal", "leonardo"]),
  model: z.string().min(1),
  groupKey: z.string().min(1),
  imageId: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  createdAtIso: z.string().datetime(),
  updatedAtIso: z.string().datetime(),
});

export type CharacterPortraitAliasEntry = z.infer<
  typeof portraitAliasEntrySchema
>;

const portraitAliasIndexSchema = z.object({
  version: z.literal(1),
  aliasesByName: z.record(portraitAliasEntrySchema),
});

type CharacterPortraitAliasIndex = z.infer<typeof portraitAliasIndexSchema>;

const DEFAULT_ALIAS_INDEX: CharacterPortraitAliasIndex = {
  version: 1,
  aliasesByName: {},
};

export interface CharacterPortraitCacheOptions {
  rootDir: string;
  imageStore: ImageStore;
  indexFileName?: string;
}

export interface SaveCharacterPortraitAliasInput {
  characterNameKey: string;
  characterName: string;
  provider: ImageProvider;
  model: string;
  groupKey: string;
  imageId: string;
  fileName: string;
  fileUrl: string;
}

export class CharacterPortraitCache {
  private readonly rootDir: string;
  private readonly indexFilePath: string;
  private readonly imageStore: ImageStore;
  private index: CharacterPortraitAliasIndex = DEFAULT_ALIAS_INDEX;
  private writeLock: Promise<void> = Promise.resolve();

  public constructor(options: CharacterPortraitCacheOptions) {
    this.rootDir = resolve(options.rootDir);
    this.indexFilePath = resolve(
      this.rootDir,
      options.indexFileName ?? "character-portraits-index.json",
    );
    this.imageStore = options.imageStore;
  }

  public async initialize(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    this.index = await this.readIndexFromDisk();
    await this.selfHealMissingFiles();
    await this.persistIndex();
  }

  public async getByCharacterNameKey(
    characterNameKey: string,
  ): Promise<CharacterPortraitAliasEntry | null> {
    const entry = this.index.aliasesByName[characterNameKey];
    if (!entry) {
      return null;
    }

    const fileRecord = await this.imageStore.getImageFileRecord(entry.fileName);
    if (fileRecord) {
      return { ...entry };
    }

    await this.withWriteLock(async () => {
      delete this.index.aliasesByName[characterNameKey];
      await this.persistIndex();
    });
    return null;
  }

  public async save(
    input: SaveCharacterPortraitAliasInput,
  ): Promise<CharacterPortraitAliasEntry> {
    return this.withWriteLock(async () => {
      const current = this.index.aliasesByName[input.characterNameKey];
      const nowIso = new Date().toISOString();
      const next: CharacterPortraitAliasEntry = {
        characterNameKey: input.characterNameKey,
        characterName: input.characterName,
        provider: input.provider,
        model: input.model,
        groupKey: input.groupKey,
        imageId: input.imageId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        createdAtIso: current?.createdAtIso ?? nowIso,
        updatedAtIso: nowIso,
      };
      this.index.aliasesByName[input.characterNameKey] = next;
      await this.persistIndex();
      return { ...next };
    });
  }

  private async selfHealMissingFiles(): Promise<void> {
    const keys = Object.keys(this.index.aliasesByName);
    if (keys.length === 0) {
      return;
    }

    for (const key of keys) {
      const entry = this.index.aliasesByName[key];
      if (!entry) {
        continue;
      }

      const fileRecord = await this.imageStore.getImageFileRecord(entry.fileName);
      if (!fileRecord) {
        delete this.index.aliasesByName[key];
      }
    }
  }

  private async readIndexFromDisk(): Promise<CharacterPortraitAliasIndex> {
    try {
      const raw = await readFile(this.indexFilePath, "utf8");
      const parsed = portraitAliasIndexSchema.safeParse(
        JSON.parse(raw) as unknown,
      );
      if (parsed.success) {
        return parsed.data;
      }
    } catch {
      // Fall through to default.
    }

    return {
      version: DEFAULT_ALIAS_INDEX.version,
      aliasesByName: {},
    };
  }

  private async persistIndex(): Promise<void> {
    await this.writeTextAtomic(
      this.indexFilePath,
      JSON.stringify(this.index, null, 2),
    );
  }

  private async writeTextAtomic(path: string, content: string): Promise<void> {
    const tempPath = `${path}.${Date.now().toString(36)}.tmp`;
    await writeFile(tempPath, content, "utf8");
    await rename(tempPath, path);
  }

  private async withWriteLock<T>(operation: () => Promise<T>): Promise<T> {
    let releaseLock: () => void = () => {};
    const waitForLock = this.writeLock.catch(() => undefined);
    this.writeLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    await waitForLock;
    try {
      return await operation();
    } finally {
      releaseLock();
    }
  }
}

