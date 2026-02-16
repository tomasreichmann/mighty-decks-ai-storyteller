import { randomUUID } from "node:crypto";
import { extname, resolve } from "node:path";
import {
  access,
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import type {
  GeneratedImageAsset,
  GeneratedImageGroup,
  ImageProvider,
  ImageResolution,
} from "@mighty-decks/spec/imageGeneration";
import { generatedImageGroupSchema } from "@mighty-decks/spec/imageGeneration";
import { z } from "zod";
import {
  buildImageFileBaseName,
  isSafeFileName,
  normalizePrompt,
  toCacheKey,
  toGroupKey,
  toModelHash,
  toPromptHash,
} from "./ImageNaming";

interface ImageStoreOptions {
  rootDir: string;
  fileRouteBasePath: string;
}

interface SaveImageParams {
  provider: ImageProvider;
  prompt: string;
  model: string;
  promptHash: string;
  modelHash: string;
  groupKey: string;
  cacheKey: string;
  batchIndex: number;
  imageIndex: number;
  resolution: ImageResolution;
  sourceUrl: string;
  imageBuffer: Buffer;
  contentType: string;
}

interface ImageFileRecord {
  absolutePath: string;
  contentType: string;
}

const imageStoreIndexSchema = z.object({
  version: z.literal(1),
  groups: z.record(generatedImageGroupSchema),
});
type ImageStoreIndex = z.infer<typeof imageStoreIndexSchema>;

const DEFAULT_INDEX: ImageStoreIndex = {
  version: 1,
  groups: {},
};

const IMAGE_EXTENSIONS_BY_CONTENT_TYPE: Record<string, string> = {
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const compareImages = (
  left: GeneratedImageAsset,
  right: GeneratedImageAsset,
): number => {
  if (left.batchIndex !== right.batchIndex) {
    return left.batchIndex - right.batchIndex;
  }
  if (left.imageIndex !== right.imageIndex) {
    return left.imageIndex - right.imageIndex;
  }
  if (left.createdAtIso !== right.createdAtIso) {
    return left.createdAtIso.localeCompare(right.createdAtIso);
  }

  return left.imageId.localeCompare(right.imageId);
};

const sortImages = (images: GeneratedImageAsset[]): GeneratedImageAsset[] =>
  [...images].sort(compareImages);

const normalizeContentType = (value: string): string =>
  value.trim().toLowerCase();

const extensionFromContentType = (contentType: string): string | null => {
  const normalized = normalizeContentType(contentType).split(";")[0] ?? "";
  const resolved = IMAGE_EXTENSIONS_BY_CONTENT_TYPE[normalized];
  return resolved ?? null;
};

const extensionFromSourceUrl = (sourceUrl: string): string | null => {
  try {
    const parsed = new URL(sourceUrl);
    const extension = extname(parsed.pathname).toLowerCase();
    return /^[.][a-z0-9]{2,5}$/.test(extension) ? extension : null;
  } catch {
    return null;
  }
};

const resolveImageExtension = (
  contentType: string,
  sourceUrl: string,
): string => {
  const fromContentType = extensionFromContentType(contentType);
  if (fromContentType) {
    return fromContentType;
  }

  const fromSourceUrl = extensionFromSourceUrl(sourceUrl);
  if (fromSourceUrl) {
    return fromSourceUrl;
  }

  return ".bin";
};

const resolveActiveImageIdAfterRemoval = (params: {
  sortedBefore: GeneratedImageAsset[];
  removedImageIds: Set<string>;
  activeImageId: string | undefined;
}): string | undefined => {
  const sortedAfter = params.sortedBefore.filter(
    (candidate) => !params.removedImageIds.has(candidate.imageId),
  );
  if (sortedAfter.length === 0) {
    return undefined;
  }

  if (
    params.activeImageId &&
    !params.removedImageIds.has(params.activeImageId) &&
    sortedAfter.some((candidate) => candidate.imageId === params.activeImageId)
  ) {
    return params.activeImageId;
  }

  let pivotIndex = -1;
  if (params.activeImageId && params.removedImageIds.has(params.activeImageId)) {
    pivotIndex = params.sortedBefore.findIndex(
      (candidate) => candidate.imageId === params.activeImageId,
    );
  }

  if (pivotIndex < 0) {
    pivotIndex = params.sortedBefore.findIndex((candidate) =>
      params.removedImageIds.has(candidate.imageId),
    );
  }

  if (pivotIndex < 0) {
    return sortedAfter[0]?.imageId;
  }

  return (
    sortedAfter[pivotIndex]?.imageId ??
    sortedAfter[pivotIndex - 1]?.imageId ??
    sortedAfter[0]?.imageId
  );
};

export class ImageStore {
  private readonly rootDir: string;
  private readonly fileRouteBasePath: string;
  private readonly indexFilePath: string;
  private index: ImageStoreIndex = DEFAULT_INDEX;
  private writeLock: Promise<void> = Promise.resolve();

  public constructor(options: ImageStoreOptions) {
    this.rootDir = resolve(options.rootDir);
    this.fileRouteBasePath = options.fileRouteBasePath.replace(/\/+$/, "");
    this.indexFilePath = resolve(this.rootDir, "index.json");
  }

  public async initialize(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    const loadedIndex = await this.readIndexFromDisk();
    this.index = loadedIndex;
    await this.persistIndex();
  }

  public getGroup(groupKey: string): GeneratedImageGroup | null {
    const existing = this.index.groups[groupKey];
    if (!existing) {
      return null;
    }

    return this.toPublicGroup(existing);
  }

  public lookupGroup(
    provider: ImageProvider,
    prompt: string,
    model: string,
  ): GeneratedImageGroup | null {
    return this.getGroup(toGroupKey(prompt, provider, model));
  }

  public getCachedImages(input: {
    provider: ImageProvider;
    prompt: string;
    model: string;
    resolution: ImageResolution;
  }): GeneratedImageAsset[] {
    const group = this.index.groups[
      toGroupKey(input.prompt, input.provider, input.model)
    ];
    if (!group) {
      return [];
    }

    const cacheKey = toCacheKey(
      input.prompt,
      input.provider,
      input.model,
      input.resolution,
    );
    return sortImages(group.images)
      .filter((candidate) => candidate.cacheKey === cacheKey)
      .map((candidate) => ({ ...candidate }));
  }

  public async reserveBatchIndex(input: {
    provider: ImageProvider;
    prompt: string;
    model: string;
  }): Promise<{
    groupKey: string;
    promptHash: string;
    modelHash: string;
    batchIndex: number;
  }> {
    return this.withWriteLock(async () => {
      const group = this.ensureGroup(input.prompt, input.provider, input.model);
      const batchIndex = group.nextBatchIndex;
      group.nextBatchIndex += 1;
      await this.persistIndex();
      return {
        groupKey: group.groupKey,
        promptHash: group.promptHash,
        modelHash: group.modelHash,
        batchIndex,
      };
    });
  }

  public async saveGeneratedImage(
    params: SaveImageParams,
  ): Promise<{ group: GeneratedImageGroup; image: GeneratedImageAsset }> {
    return this.withWriteLock(async () => {
      const group = this.ensureGroup(
        params.prompt,
        params.provider,
        params.model,
      );
      if (group.groupKey !== params.groupKey) {
        throw new Error("group key mismatch while saving generated image");
      }

      const extension = resolveImageExtension(params.contentType, params.sourceUrl);
      const baseFileName = buildImageFileBaseName({
        prompt: params.prompt,
        promptHash: params.promptHash,
        modelHash: params.modelHash,
        batchIndex: params.batchIndex,
        imageIndex: params.imageIndex,
      });
      const fileName = await this.resolveUniqueFileName(baseFileName, extension, group);
      const metadataFileName = `${fileName}.json`;
      const createdAtIso = new Date().toISOString();
      const imageId = randomUUID();

      const imageAsset: GeneratedImageAsset = {
        provider: params.provider,
        imageId,
        groupKey: params.groupKey,
        promptHash: params.promptHash,
        modelHash: params.modelHash,
        cacheKey: params.cacheKey,
        prompt: params.prompt,
        model: params.model,
        batchIndex: params.batchIndex,
        imageIndex: params.imageIndex,
        width: params.resolution.width,
        height: params.resolution.height,
        fileName,
        metadataFileName,
        fileUrl: this.buildFileUrl(fileName),
        contentType: params.contentType,
        sourceUrl: params.sourceUrl,
        createdAtIso,
      };

      await this.writeBufferAtomic(
        resolve(this.rootDir, fileName),
        params.imageBuffer,
      );
      await this.writeTextAtomic(
        resolve(this.rootDir, metadataFileName),
        JSON.stringify(
          {
            ...imageAsset,
            bytes: params.imageBuffer.length,
          },
          null,
          2,
        ),
      );

      group.images = sortImages([...group.images, imageAsset]);
      if (!group.activeImageId) {
        group.activeImageId = imageAsset.imageId;
      }
      await this.persistIndex();

      return {
        group: this.toPublicGroup(group),
        image: { ...imageAsset },
      };
    });
  }

  public async setActiveImage(
    groupKey: string,
    imageId: string,
  ): Promise<GeneratedImageGroup> {
    return this.withWriteLock(async () => {
      const group = this.requireGroup(groupKey);
      const hasImage = group.images.some((candidate) => candidate.imageId === imageId);
      if (!hasImage) {
        throw new Error("image not found in group");
      }

      group.activeImageId = imageId;
      await this.persistIndex();
      return this.toPublicGroup(group);
    });
  }

  public async deleteImage(
    groupKey: string,
    imageId: string,
  ): Promise<GeneratedImageGroup> {
    return this.withWriteLock(async () => {
      const group = this.requireGroup(groupKey);
      const sortedBefore = sortImages(group.images);
      const target = sortedBefore.find((candidate) => candidate.imageId === imageId);
      if (!target) {
        throw new Error("image not found");
      }

      const removedIds = new Set<string>([target.imageId]);
      group.images = sortImages(
        group.images.filter((candidate) => candidate.imageId !== imageId),
      );
      group.activeImageId = resolveActiveImageIdAfterRemoval({
        sortedBefore,
        removedImageIds: removedIds,
        activeImageId: group.activeImageId,
      });

      await this.deleteFileIfPresent(resolve(this.rootDir, target.fileName));
      await this.deleteFileIfPresent(resolve(this.rootDir, target.metadataFileName));
      await this.persistIndex();

      return this.toPublicGroup(group);
    });
  }

  public async deleteBatch(
    groupKey: string,
    batchIndex: number,
  ): Promise<GeneratedImageGroup> {
    return this.withWriteLock(async () => {
      const group = this.requireGroup(groupKey);
      const sortedBefore = sortImages(group.images);
      const toRemove = sortedBefore.filter(
        (candidate) => candidate.batchIndex === batchIndex,
      );
      if (toRemove.length === 0) {
        throw new Error("batch not found");
      }

      const removedIds = new Set(toRemove.map((candidate) => candidate.imageId));
      group.images = sortImages(
        group.images.filter((candidate) => candidate.batchIndex !== batchIndex),
      );
      group.activeImageId = resolveActiveImageIdAfterRemoval({
        sortedBefore,
        removedImageIds: removedIds,
        activeImageId: group.activeImageId,
      });

      await Promise.all(
        toRemove.map((candidate) =>
          Promise.all([
            this.deleteFileIfPresent(resolve(this.rootDir, candidate.fileName)),
            this.deleteFileIfPresent(
              resolve(this.rootDir, candidate.metadataFileName),
            ),
          ]),
        ),
      );
      await this.persistIndex();

      return this.toPublicGroup(group);
    });
  }

  public async getImageFileRecord(
    fileName: string,
  ): Promise<ImageFileRecord | null> {
    if (!isSafeFileName(fileName)) {
      return null;
    }

    for (const group of Object.values(this.index.groups)) {
      const image = group.images.find((candidate) => candidate.fileName === fileName);
      if (!image) {
        continue;
      }

      const absolutePath = resolve(this.rootDir, fileName);
      try {
        await access(absolutePath);
      } catch {
        return null;
      }

      return {
        absolutePath,
        contentType: image.contentType,
      };
    }

    return null;
  }

  private ensureGroup(
    prompt: string,
    provider: ImageProvider,
    model: string,
  ): GeneratedImageGroup {
    const normalizedPrompt = normalizePrompt(prompt);
    const normalizedModel = model.trim();
    const groupKey = toGroupKey(normalizedPrompt, provider, normalizedModel);
    const existing = this.index.groups[groupKey];
    if (existing) {
      return existing;
    }

    const created: GeneratedImageGroup = {
      provider,
      groupKey,
      prompt: normalizedPrompt,
      promptHash: toPromptHash(normalizedPrompt),
      model: normalizedModel,
      modelHash: toModelHash(normalizedModel),
      nextBatchIndex: 0,
      images: [],
    };
    this.index.groups[groupKey] = created;
    return created;
  }

  private requireGroup(groupKey: string): GeneratedImageGroup {
    const group = this.index.groups[groupKey];
    if (!group) {
      throw new Error("group not found");
    }
    return group;
  }

  private toPublicGroup(group: GeneratedImageGroup): GeneratedImageGroup {
    const sortedImages = sortImages(group.images).map((candidate) => ({
      ...candidate,
      fileUrl: this.buildFileUrl(candidate.fileName),
    }));
    const activeImageExists = group.activeImageId
      ? sortedImages.some((candidate) => candidate.imageId === group.activeImageId)
      : false;

    return {
      ...group,
      activeImageId: activeImageExists
        ? group.activeImageId
        : sortedImages[0]?.imageId,
      images: sortedImages,
    };
  }

  private async readIndexFromDisk(): Promise<ImageStoreIndex> {
    try {
      const raw = await readFile(this.indexFilePath, "utf8");
      const parsed = imageStoreIndexSchema.safeParse(
        JSON.parse(raw) as unknown,
      );
      if (parsed.success) {
        return {
          version: parsed.data.version,
          groups: Object.fromEntries(
            Object.entries(parsed.data.groups).map(([groupKey, group]) => [
              groupKey,
              this.toPublicGroup(group),
            ]),
          ),
        };
      }
    } catch {
      // Fall through to default.
    }

    return {
      version: DEFAULT_INDEX.version,
      groups: {},
    };
  }

  private buildFileUrl(fileName: string): string {
    return `${this.fileRouteBasePath}/${encodeURIComponent(fileName)}`;
  }

  private async persistIndex(): Promise<void> {
    await this.writeTextAtomic(
      this.indexFilePath,
      JSON.stringify(this.index, null, 2),
    );
  }

  private async resolveUniqueFileName(
    baseName: string,
    extension: string,
    group: GeneratedImageGroup,
  ): Promise<string> {
    let nextFileName = `${baseName}${extension}`;
    let suffix = 1;
    const existingNames = new Set(group.images.map((candidate) => candidate.fileName));

    while (true) {
      const absolutePath = resolve(this.rootDir, nextFileName);
      const isKnownName = existingNames.has(nextFileName);
      let pathExists = false;
      try {
        await access(absolutePath);
        pathExists = true;
      } catch {
        pathExists = false;
      }

      if (!isKnownName && !pathExists) {
        return nextFileName;
      }

      nextFileName = `${baseName}-v${suffix}${extension}`;
      suffix += 1;
    }
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

  private async writeTextAtomic(path: string, content: string): Promise<void> {
    const tempPath = `${path}.${Date.now().toString(36)}.tmp`;
    await writeFile(tempPath, content, "utf8");
    await rename(tempPath, path);
  }

  private async writeBufferAtomic(path: string, content: Buffer): Promise<void> {
    const tempPath = `${path}.${Date.now().toString(36)}.tmp`;
    await writeFile(tempPath, content);
    await rename(tempPath, path);
  }

  private async deleteFileIfPresent(path: string): Promise<void> {
    try {
      await unlink(path);
    } catch {
      // Ignore missing files.
    }
  }
}

export type { ImageFileRecord, SaveImageParams };
