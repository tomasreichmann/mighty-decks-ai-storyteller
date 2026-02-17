import { readdir, readFile, rm } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { readdirSync, readFileSync } from "node:fs";
import type { AdventureState } from "@mighty-decks/spec/adventureState";
import { persistedAdventureSnapshotSchema } from "./snapshotSchemas";
import type {
  PersistedAdventureRuntimeV1,
  PersistedAdventureSnapshotV1,
} from "./snapshotSchemas";

interface AdventureSnapshotStoreOptions {
  rootDir: string;
  historyLimit: number;
}

const toFileSafeSegment = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized.slice(0, 64) : "scene";
};

const toTimestampSegment = (date: Date): string => {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};

export class AdventureSnapshotStore {
  private readonly rootDir: string;
  private readonly historyLimit: number;

  public constructor(options: AdventureSnapshotStoreOptions) {
    this.rootDir = resolve(options.rootDir);
    this.historyLimit = Math.max(1, options.historyLimit);
  }

  public async initialize(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
  }

  public async saveSnapshot(input: {
    adventure: AdventureState;
    runtime: PersistedAdventureRuntimeV1;
    sceneLabel: string;
    savedAt?: Date;
  }): Promise<{ filePath: string; fileName: string }> {
    const savedAt = input.savedAt ?? new Date();
    const safeAdventureId = toFileSafeSegment(input.adventure.adventureId);
    const adventureDir = resolve(this.rootDir, safeAdventureId);
    await mkdir(adventureDir, { recursive: true });

    const timestamp = toTimestampSegment(savedAt);
    const sceneSegment = toFileSafeSegment(input.sceneLabel);
    const fileName = `${timestamp}-${sceneSegment}.json`;
    const filePath = resolve(adventureDir, fileName);

    const snapshot: PersistedAdventureSnapshotV1 = {
      version: 1,
      savedAtIso: savedAt.toISOString(),
      adventureId: input.adventure.adventureId,
      sceneLabel: input.sceneLabel,
      adventure: input.adventure,
      runtime: input.runtime,
    };

    const tempPath = `${filePath}.${Date.now().toString(36)}.tmp`;
    await writeFile(tempPath, JSON.stringify(snapshot, null, 2), "utf8");
    await rename(tempPath, filePath);

    await this.trimHistory(adventureDir);

    return {
      filePath,
      fileName,
    };
  }

  public async loadLatestSnapshot(
    adventureId: string,
  ): Promise<PersistedAdventureSnapshotV1 | null> {
    const safeAdventureId = toFileSafeSegment(adventureId);
    const adventureDir = resolve(this.rootDir, safeAdventureId);

    let fileNames: string[] = [];
    try {
      fileNames = (await readdir(adventureDir)).filter((name) =>
        name.toLowerCase().endsWith(".json"),
      );
    } catch {
      return null;
    }

    if (fileNames.length === 0) {
      return null;
    }

    const sorted = [...fileNames].sort((left, right) => right.localeCompare(left));
    for (const fileName of sorted) {
      const filePath = resolve(adventureDir, fileName);
      try {
        const raw = await readFile(filePath, "utf8");
        const parsed = persistedAdventureSnapshotSchema.safeParse(
          JSON.parse(raw) as unknown,
        );
        if (parsed.success && parsed.data.adventureId === adventureId) {
          return parsed.data;
        }
      } catch {
        // try older snapshot
      }
    }

    return null;
  }

  public loadLatestSnapshotSync(
    adventureId: string,
  ): PersistedAdventureSnapshotV1 | null {
    const safeAdventureId = toFileSafeSegment(adventureId);
    const adventureDir = resolve(this.rootDir, safeAdventureId);

    let fileNames: string[] = [];
    try {
      fileNames = readdirSync(adventureDir).filter((name) =>
        name.toLowerCase().endsWith(".json"),
      );
    } catch {
      return null;
    }

    if (fileNames.length === 0) {
      return null;
    }

    const sorted = [...fileNames].sort((left, right) => right.localeCompare(left));
    for (const fileName of sorted) {
      const filePath = resolve(adventureDir, fileName);
      try {
        const raw = readFileSync(filePath, "utf8");
        const parsed = persistedAdventureSnapshotSchema.safeParse(
          JSON.parse(raw) as unknown,
        );
        if (parsed.success && parsed.data.adventureId === adventureId) {
          return parsed.data;
        }
      } catch {
        // try older snapshot
      }
    }

    return null;
  }

  private async trimHistory(adventureDir: string): Promise<void> {
    let fileNames: string[] = [];
    try {
      fileNames = (await readdir(adventureDir)).filter((name) =>
        name.toLowerCase().endsWith(".json"),
      );
    } catch {
      return;
    }

    if (fileNames.length <= this.historyLimit) {
      return;
    }

    const sorted = [...fileNames].sort((left, right) => right.localeCompare(left));
    const toDelete = sorted.slice(this.historyLimit);
    await Promise.all(
      toDelete.map((fileName) => rm(resolve(adventureDir, fileName), { force: true })),
    );
  }

  public static buildSceneLabel(input: {
    selectedPitchTitle?: string;
    sceneCounter: number;
  }): string {
    const title = input.selectedPitchTitle?.trim();
    const baseTitle = title && title.length > 0 ? title : "adventure";
    return `${baseTitle} scene ${Math.max(1, input.sceneCounter)}`;
  }

  public static describeSnapshotPath(filePath: string): string {
    return basename(filePath);
  }
}
