import { AdventureSnapshotStore } from "../../persistence/AdventureSnapshotStore";
import type { PersistedAdventureRuntimeV1 } from "../../persistence/snapshotSchemas";
import type { AdventureState } from "@mighty-decks/spec/adventureState";
import type { AdventureRuntimeState, SocketParticipantLink } from "./types";

export interface AdventureManagerSnapshotState {
  adventures: Map<string, AdventureState>;
  runtimeByAdventure: Map<string, AdventureRuntimeState>;
  snapshotTimersByAdventure: Map<string, NodeJS.Timeout>;
  pendingSnapshotWrites: Map<string, Promise<void>>;
  snapshotWriteDebounceMs: number;
  snapshotStore?: AdventureSnapshotStore;
  socketLinks: Map<string, SocketParticipantLink>;
}

export interface AdventureManagerSnapshotCallbacks {
  clearVoteTimer(adventureId: string): void;
  resolveVote(adventureId: string, timeoutClosed: boolean): Promise<void>;
}

export const buildRuntimeSnapshot = (
  runtime: AdventureRuntimeState,
  adventure: AdventureState,
): PersistedAdventureRuntimeV1 => ({
  sceneCounter: runtime.sceneCounter,
  sceneTurnCounter: runtime.sceneTurnCounter,
  sceneDirectActionCounter: runtime.sceneDirectActionCounter,
  autoIllustrationsUsedInScene: runtime.autoIllustrationsUsedInScene,
  autoIllustrationSubjectsInScene: [...runtime.autoIllustrationSubjectsInScene],
  selectedPitch: runtime.selectedPitch ? { ...runtime.selectedPitch } : null,
  rollingSummary: runtime.rollingSummary,
  metagameDirectives: runtime.metagameDirectives.map((entry) => ({ ...entry })),
  votesByPlayerId: Object.fromEntries(runtime.votesByPlayerId.entries()),
  runtimeConfig: adventure.runtimeConfig,
});

export const hydrateRuntimeFromSnapshot = (
  adventure: AdventureState,
  runtime: PersistedAdventureRuntimeV1,
): AdventureRuntimeState => {
  const restoredVotes = new Map<string, string>(
    Object.entries(runtime.votesByPlayerId),
  );
  for (const rosterEntry of adventure.roster) {
    if (rosterEntry.role !== "player") {
      continue;
    }
    rosterEntry.hasVoted = restoredVotes.has(rosterEntry.playerId);
  }

  return {
    voteTimer: null,
    votesByPlayerId: restoredVotes,
    actionQueue: [],
    illustrationQueue: [],
    pendingOutcomeAction: null,
    pendingSceneClosure: null,
    processingAction: false,
    processingOutcomeDecision: false,
    processingIllustration: false,
    pitchVoteInProgress: false,
    sceneCounter: runtime.sceneCounter,
    sceneTurnCounter: runtime.sceneTurnCounter,
    sceneDirectActionCounter: runtime.sceneDirectActionCounter,
    autoIllustrationsUsedInScene: runtime.autoIllustrationsUsedInScene,
    autoIllustrationSubjectsInScene: new Set(runtime.autoIllustrationSubjectsInScene),
    selectedPitch: runtime.selectedPitch,
    rollingSummary: runtime.rollingSummary,
    metagameDirectives: runtime.metagameDirectives.map((entry) => ({ ...entry })),
    latencySamplesMs: [],
    finalizedAiRequestIds: new Set<string>(),
  };
};

export const loadAdventureFromSnapshot = (
  state: AdventureManagerSnapshotState,
  adventureId: string,
  callbacks: AdventureManagerSnapshotCallbacks,
): AdventureState | undefined => {
  if (!state.snapshotStore) {
    return undefined;
  }

  const snapshot = state.snapshotStore.loadLatestSnapshotSync(adventureId);
  if (!snapshot) {
    return undefined;
  }

  const adventure = snapshot.adventure;
  for (const entry of adventure.roster) {
    entry.connected = false;
  }
  if (adventure.currentScene?.imagePending) {
    adventure.currentScene.imagePending = false;
    adventure.currentScene.imageError =
      adventure.currentScene.imageError ??
      "Image generation was interrupted and will not resume after restore.";
  }
  if (adventure.currentScene?.closingImagePending) {
    adventure.currentScene.closingImagePending = false;
    adventure.currentScene.closingImageError =
      adventure.currentScene.closingImageError ??
      "Closing image generation was interrupted and will not resume after restore.";
  }

  state.adventures.set(adventureId, adventure);
  state.runtimeByAdventure.set(
    adventureId,
    hydrateRuntimeFromSnapshot(adventure, snapshot.runtime),
  );
  rearmVoteTimerAfterRestore(state, adventureId, callbacks);

  return adventure;
};

export const rearmVoteTimerAfterRestore = (
  state: AdventureManagerSnapshotState,
  adventureId: string,
  callbacks: AdventureManagerSnapshotCallbacks,
): void => {
  const adventure = state.adventures.get(adventureId);
  const runtime = state.runtimeByAdventure.get(adventureId);
  if (!adventure?.activeVote || !runtime) {
    return;
  }

  callbacks.clearVoteTimer(adventureId);
  const closesAtMs = Date.parse(adventure.activeVote.closesAtIso);
  const remainingMs = closesAtMs - Date.now();
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    void callbacks.resolveVote(adventureId, true);
    return;
  }

  runtime.voteTimer = setTimeout(() => {
    void callbacks.resolveVote(adventureId, true);
  }, remainingMs);
};

export const scheduleSnapshotWrite = (
  state: AdventureManagerSnapshotState,
  adventureId: string,
  writeSnapshotNow: (adventureId: string) => Promise<void>,
): void => {
  if (!state.snapshotStore) {
    return;
  }

  const existingTimer = state.snapshotTimersByAdventure.get(adventureId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    state.snapshotTimersByAdventure.delete(adventureId);
    void writeSnapshotNow(adventureId);
  }, state.snapshotWriteDebounceMs);
  state.snapshotTimersByAdventure.set(adventureId, timer);
};

export const flushSnapshotWrite = async (
  state: AdventureManagerSnapshotState,
  adventureId: string,
  writeSnapshotNow: (adventureId: string) => Promise<void>,
): Promise<void> => {
  const existingTimer = state.snapshotTimersByAdventure.get(adventureId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    state.snapshotTimersByAdventure.delete(adventureId);
  }

  await writeSnapshotNow(adventureId);
};

export const writeSnapshotNow = async (
  state: AdventureManagerSnapshotState,
  adventureId: string,
  buildSnapshot: (
    runtime: AdventureRuntimeState,
    adventure: AdventureState,
  ) => PersistedAdventureRuntimeV1,
): Promise<void> => {
  if (!state.snapshotStore) {
    return;
  }

  const existingWrite = state.pendingSnapshotWrites.get(adventureId);
  if (existingWrite) {
    await existingWrite;
    return;
  }

  const writePromise = (async () => {
    const adventure = state.adventures.get(adventureId);
    const runtime = state.runtimeByAdventure.get(adventureId);
    if (!adventure || !runtime) {
      return;
    }

    const sceneLabel = AdventureSnapshotStore.buildSceneLabel({
      selectedPitchTitle: runtime.selectedPitch?.title,
      sceneCounter: runtime.sceneCounter,
    });

    await state.snapshotStore?.saveSnapshot({
      adventure,
      runtime: buildSnapshot(runtime, adventure),
      sceneLabel,
    });
  })()
    .catch(() => {
      // Snapshot persistence is best-effort and must never block gameplay.
    })
    .finally(() => {
      state.pendingSnapshotWrites.delete(adventureId);
    });

  state.pendingSnapshotWrites.set(adventureId, writePromise);
  await writePromise;
};

export const evictAdventureIfInactive = async (
  state: AdventureManagerSnapshotState,
  adventureId: string,
  callbacks: AdventureManagerSnapshotCallbacks,
): Promise<void> => {
  const adventure = state.adventures.get(adventureId);
  if (!adventure) {
    return;
  }
  if (adventure.roster.some((entry) => entry.connected)) {
    return;
  }

  await flushSnapshotWrite(state, adventureId, (id) =>
    writeSnapshotNow(state, id, buildRuntimeSnapshot),
  );
  const latestAdventure = state.adventures.get(adventureId);
  if (!latestAdventure) {
    return;
  }
  if (latestAdventure.roster.some((entry) => entry.connected)) {
    return;
  }

  callbacks.clearVoteTimer(adventureId);
  state.adventures.delete(adventureId);
  state.runtimeByAdventure.delete(adventureId);
  state.snapshotTimersByAdventure.delete(adventureId);
  state.pendingSnapshotWrites.delete(adventureId);
  for (const [socketId, link] of state.socketLinks.entries()) {
    if (link.adventureId === adventureId) {
      state.socketLinks.delete(socketId);
    }
  }
};
