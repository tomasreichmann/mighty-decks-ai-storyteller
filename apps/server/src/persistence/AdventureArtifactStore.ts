import { createHash } from "node:crypto";
import { access, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { z } from "zod";

interface AdventureArtifactStoreOptions {
  rootDir: string;
  fileRouteBasePath: string;
}

interface PersistedArtifactIndexEntry {
  fileName: string;
  contentType: string;
  createdAtIso: string;
}

interface PersistedArtifactIndex {
  version: 1;
  itemsByHash: Record<string, PersistedArtifactIndexEntry>;
}

const persistedArtifactIndexSchema: z.ZodType<PersistedArtifactIndex> = z.object({
  version: z.literal(1),
  itemsByHash: z.record(
    z.object({
      fileName: z.string().min(1),
      contentType: z.string().min(1),
      createdAtIso: z.string().datetime(),
    }),
  ),
});

const DEFAULT_INDEX: PersistedArtifactIndex = {
  version: 1,
  itemsByHash: {},
};

const DATA_IMAGE_URI_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;
const SAFE_FILE_NAME_REGEX = /^[a-z0-9][a-z0-9._-]*$/;

const CONTENT_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const EXTENSION_TO_CONTENT_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(CONTENT_TYPE_TO_EXTENSION).map(([contentType, extension]) => [
    extension,
    contentType,
  ]),
);

const normalizeContentType = (value: string): string =>
  value.trim().toLowerCase().split(";")[0] ?? value.trim().toLowerCase();

const assertSupportedContentType = (contentType: string): string => {
  const normalizedContentType = normalizeContentType(contentType);
  if (!(normalizedContentType in CONTENT_TYPE_TO_EXTENSION)) {
    throw new Error(`unsupported image content type: ${normalizedContentType}`);
  }

  return normalizedContentType;
};

const createHashHex = (value: Buffer): string =>
  createHash("sha256").update(value).digest("hex");

const normalizeHint = (value: string | undefined): string => {
  const normalized = (value ?? "inline-image")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized.slice(0, 36) : "inline-image";
};

const parseDataImageUri = (value: string): {
  contentType: string;
  buffer: Buffer;
} => {
  const match = value.trim().match(DATA_IMAGE_URI_PATTERN);
  if (!match) {
    throw new Error("invalid data image URI");
  }

  const contentType = normalizeContentType(match[1] ?? "");
  if (!(contentType in CONTENT_TYPE_TO_EXTENSION)) {
    throw new Error(`unsupported data image content type: ${contentType}`);
  }

  const payload = match[2] ?? "";
  const buffer = Buffer.from(payload, "base64");
  if (buffer.length === 0) {
    throw new Error("decoded image payload is empty");
  }

  return {
    contentType,
    buffer,
  };
};

export interface AdventureArtifactRecord {
  fileName: string;
  fileUrl: string;
  contentType: string;
}

export class AdventureArtifactStore {
  private readonly rootDir: string;
  private readonly fileRouteBasePath: string;
  private readonly indexFilePath: string;
  private index: PersistedArtifactIndex = DEFAULT_INDEX;
  private writeLock: Promise<void> = Promise.resolve();

  public constructor(options: AdventureArtifactStoreOptions) {
    this.rootDir = resolve(options.rootDir);
    this.fileRouteBasePath = options.fileRouteBasePath.replace(/\/+$/, "");
    this.indexFilePath = resolve(this.rootDir, "index.json");
  }

  public async initialize(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    this.index = await this.readIndexFromDisk();
    await this.persistIndex();
  }

  public async persistDataImageUri(
    dataImageUri: string,
    options: { hint?: string } = {},
  ): Promise<AdventureArtifactRecord> {
    const parsed = parseDataImageUri(dataImageUri);
    return this.persistImageBuffer(parsed.buffer, parsed.contentType, options);
  }

  public async persistLocalFile(
    filePath: string,
    options: { hint?: string } = {},
  ): Promise<AdventureArtifactRecord> {
    const buffer = await readFile(filePath);
    if (buffer.length === 0) {
      throw new Error("local image file is empty");
    }

    const extension = extname(filePath).toLowerCase();
    const contentType = EXTENSION_TO_CONTENT_TYPE[extension];
    if (!contentType) {
      throw new Error(`unsupported local image file extension: ${extension || "<none>"}`);
    }

    return this.persistImageBuffer(buffer, contentType, options);
  }

  public async persistImageBuffer(
    buffer: Buffer,
    contentType: string,
    options: { hint?: string } = {},
  ): Promise<AdventureArtifactRecord> {
    if (buffer.length === 0) {
      throw new Error("image buffer is empty");
    }

    return this.persistBuffer(
      buffer,
      assertSupportedContentType(contentType),
      options,
    );
  }

  public async getFileRecord(fileName: string): Promise<AdventureArtifactRecord | null> {
    if (!SAFE_FILE_NAME_REGEX.test(fileName)) {
      return null;
    }

    const entry = Object.values(this.index.itemsByHash).find(
      (candidate) => candidate.fileName === fileName,
    );
    if (!entry) {
      return null;
    }

    const absolutePath = resolve(this.rootDir, fileName);
    try {
      await access(absolutePath);
    } catch {
      return null;
    }

    return {
      fileName,
      fileUrl: this.buildFileUrl(fileName),
      contentType: entry.contentType,
    };
  }

  public resolveAbsolutePath(fileName: string): string {
    return resolve(this.rootDir, fileName);
  }

  private buildFileUrl(fileName: string): string {
    return `${this.fileRouteBasePath}/${encodeURIComponent(fileName)}`;
  }

  private async persistBuffer(
    buffer: Buffer,
    contentType: string,
    options: { hint?: string },
  ): Promise<AdventureArtifactRecord> {
    const normalizedContentType = assertSupportedContentType(contentType);
    const hash = createHashHex(buffer);
    const extension = CONTENT_TYPE_TO_EXTENSION[normalizedContentType] ?? ".bin";

    return this.withWriteLock(async () => {
      const existing = this.index.itemsByHash[hash];
      if (existing) {
        const absolutePath = resolve(this.rootDir, existing.fileName);
        try {
          await access(absolutePath);
          return {
            fileName: existing.fileName,
            fileUrl: this.buildFileUrl(existing.fileName),
            contentType: existing.contentType,
          };
        } catch {
          delete this.index.itemsByHash[hash];
        }
      }

      const hint = normalizeHint(options.hint);
      const shortHash = hash.slice(0, 20);
      const fileName = `${hint}-${shortHash}${extension}`;
      const absolutePath = resolve(this.rootDir, fileName);
      await this.writeBufferAtomic(absolutePath, buffer);

      this.index.itemsByHash[hash] = {
        fileName,
        contentType: normalizedContentType,
        createdAtIso: new Date().toISOString(),
      };
      await this.persistIndex();

      return {
        fileName,
        fileUrl: this.buildFileUrl(fileName),
        contentType: normalizedContentType,
      };
    });
  }

  private async readIndexFromDisk(): Promise<PersistedArtifactIndex> {
    try {
      const raw = await readFile(this.indexFilePath, "utf8");
      const parsed = persistedArtifactIndexSchema.safeParse(
        JSON.parse(raw) as unknown,
      );
      if (parsed.success) {
        return parsed.data;
      }
    } catch {
      // Fall through to default.
    }

    return {
      ...DEFAULT_INDEX,
      itemsByHash: {},
    };
  }

  private async persistIndex(): Promise<void> {
    await this.writeTextAtomic(
      this.indexFilePath,
      JSON.stringify(this.index, null, 2),
    );
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

  public async removeFileIfPresent(fileName: string): Promise<void> {
    if (!SAFE_FILE_NAME_REGEX.test(fileName)) {
      return;
    }

    try {
      await unlink(resolve(this.rootDir, fileName));
    } catch {
      // ignore missing
    }
  }
}

export { DATA_IMAGE_URI_PATTERN as ADVENTURE_DATA_IMAGE_URI_PATTERN };
