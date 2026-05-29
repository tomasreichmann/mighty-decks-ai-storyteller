import { mkdir, readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import {
  spaceshipBoardStateIdSchema,
  spaceshipBoardStateIndexSchema,
  spaceshipBoardStateSchema,
  type SpaceshipBoardState,
  type SpaceshipBoardStateIndex,
  type SpaceshipBoardStateListResponse,
  type SpaceshipBoardStateSaveRequest,
} from "@mighty-decks/spec/spaceshipBoardState";
import { atomicWriteTextFile } from "../utils/atomicFileWrite";

export class SpaceshipBoardStateNotFoundError extends Error {}
export class SpaceshipBoardStateForbiddenError extends Error {}
export class SpaceshipBoardStateValidationError extends Error {}

interface SpaceshipBoardStateStoreOptions {
  rootDir: string;
}

interface SaveStateInput extends SpaceshipBoardStateSaveRequest {
  stateId: string;
  makeDefault?: boolean;
}

const indexFileName = "index.json";

const isMissingFileError = (error: unknown): boolean => {
  const nodeError = error as NodeJS.ErrnoException;
  return Boolean(nodeError && typeof nodeError === "object" && nodeError.code === "ENOENT");
};

const resolveSafePath = (baseDir: string, relativePath: string): string => {
  const absolutePath = resolve(baseDir, relativePath);
  const normalizedBase = baseDir.endsWith(sep) ? baseDir : `${baseDir}${sep}`;
  if (absolutePath !== baseDir && !absolutePath.startsWith(normalizedBase)) {
    throw new SpaceshipBoardStateForbiddenError("Unsafe file path.");
  }
  return absolutePath;
};

const stateFileName = (stateId: string): string => `${stateId}.json`;

const emptyIndex = (): SpaceshipBoardStateIndex => ({
  version: 1,
  defaultStateId: "default",
  states: [],
});

export class SpaceshipBoardStateStore {
  private readonly rootDir: string;
  private readonly writeLocks = new Map<string, Promise<void>>();

  constructor(options: SpaceshipBoardStateStoreOptions) {
    this.rootDir = resolve(options.rootDir);
  }

  async initialize(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
  }

  async listStates(): Promise<SpaceshipBoardStateListResponse> {
    const index = await this.readIndex();
    return {
      defaultStateId: index.defaultStateId,
      states: index.states,
    };
  }

  async getDefaultState(): Promise<SpaceshipBoardState> {
    const index = await this.readIndex();
    const defaultStateId = index.defaultStateId;
    const hasDefault = index.states.some((state) => state.stateId === defaultStateId);
    if (!hasDefault) {
      throw new SpaceshipBoardStateNotFoundError("Default spaceship board state not found.");
    }
    return this.getState(defaultStateId);
  }

  async getState(stateId: string): Promise<SpaceshipBoardState> {
    const safeStateId = this.parseStateId(stateId);
    const statePath = resolveSafePath(this.rootDir, stateFileName(safeStateId));
    try {
      const raw = await readFile(statePath, "utf8");
      return spaceshipBoardStateSchema.parse(JSON.parse(raw) as unknown);
    } catch (error) {
      if (isMissingFileError(error)) {
        throw new SpaceshipBoardStateNotFoundError("Spaceship board state not found.");
      }
      throw error;
    }
  }

  async saveState(input: SaveStateInput): Promise<SpaceshipBoardState> {
    const stateId = this.parseStateId(input.stateId);
    return this.withWriteLock(stateId, async () => {
      const updatedAtIso = new Date().toISOString();
      const state = spaceshipBoardStateSchema.parse({
        version: 1,
        stateId,
        name: input.name,
        updatedAtIso,
        scene: input.scene,
        dragState: input.dragState,
        viewport: input.viewport,
      });
      const index = await this.readIndex();
      const states = [
        ...index.states.filter((candidate) => candidate.stateId !== stateId),
        {
          stateId,
          name: state.name,
          updatedAtIso: state.updatedAtIso,
        },
      ].sort((left, right) => left.name.localeCompare(right.name));
      const nextIndex = spaceshipBoardStateIndexSchema.parse({
        version: 1,
        defaultStateId:
          input.makeDefault || index.states.length === 0 ? stateId : index.defaultStateId,
        states,
      });

      await this.writeState(state);
      await this.writeIndex(nextIndex);
      return state;
    });
  }

  async setDefaultState(stateId: string): Promise<SpaceshipBoardStateListResponse> {
    const safeStateId = this.parseStateId(stateId);
    return this.withWriteLock(indexFileName, async () => {
      const index = await this.readIndex();
      if (!index.states.some((state) => state.stateId === safeStateId)) {
        throw new SpaceshipBoardStateNotFoundError("Spaceship board state not found.");
      }
      const nextIndex = spaceshipBoardStateIndexSchema.parse({
        ...index,
        defaultStateId: safeStateId,
      });
      await this.writeIndex(nextIndex);
      return {
        defaultStateId: nextIndex.defaultStateId,
        states: nextIndex.states,
      };
    });
  }

  private parseStateId(stateId: string): string {
    const parsed = spaceshipBoardStateIdSchema.safeParse(stateId);
    if (!parsed.success) {
      throw new SpaceshipBoardStateValidationError("stateId must be lowercase kebab-case.");
    }
    return parsed.data;
  }

  private async readIndex(): Promise<SpaceshipBoardStateIndex> {
    const indexPath = resolveSafePath(this.rootDir, indexFileName);
    try {
      const raw = await readFile(indexPath, "utf8");
      return spaceshipBoardStateIndexSchema.parse(JSON.parse(raw) as unknown);
    } catch (error) {
      if (isMissingFileError(error)) {
        return emptyIndex();
      }
      throw error;
    }
  }

  private async writeIndex(index: SpaceshipBoardStateIndex): Promise<void> {
    const indexPath = resolveSafePath(this.rootDir, indexFileName);
    await atomicWriteTextFile(indexPath, JSON.stringify(index, null, 2));
  }

  private async writeState(state: SpaceshipBoardState): Promise<void> {
    const statePath = resolveSafePath(this.rootDir, stateFileName(state.stateId));
    await atomicWriteTextFile(statePath, JSON.stringify(state, null, 2));
  }

  private async withWriteLock<T>(
    key: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    let releaseLock: () => void = () => {};
    const currentLock = this.writeLocks.get(key) ?? Promise.resolve();
    const nextLock = new Promise<void>((resolveLock) => {
      releaseLock = resolveLock;
    });
    this.writeLocks.set(key, nextLock);

    await currentLock.catch(() => undefined);
    try {
      return await operation();
    } finally {
      releaseLock();
      if (this.writeLocks.get(key) === nextLock) {
        this.writeLocks.delete(key);
      }
    }
  }
}
