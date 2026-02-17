import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  defaultAiCostMetrics,
  defaultLatencyMetrics,
  defaultRuntimeConfig,
  type AdventureState,
} from "@mighty-decks/spec/adventureState";
import { AdventureSnapshotStore } from "../src/persistence/AdventureSnapshotStore";
import type { PersistedAdventureRuntimeV1 } from "../src/persistence/snapshotSchemas";

const createAdventureState = (adventureId: string): AdventureState => ({
  adventureId,
  phase: "play",
  roster: [],
  characterPortraitsByName: {},
  transcript: [],
  transcriptIllustrationsByEntryId: {},
  runtimeConfig: defaultRuntimeConfig,
  latencyMetrics: {
    ...defaultLatencyMetrics,
    updatedAtIso: new Date().toISOString(),
  },
  aiCostMetrics: {
    ...defaultAiCostMetrics,
    updatedAtIso: new Date().toISOString(),
  },
  debugMode: false,
  closed: false,
  currentScene: {
    sceneId: "scene-1",
    imagePending: false,
    mode: "low_tension",
    tension: 35,
    introProse: "Intro",
    orientationBullets: ["A", "B"],
  },
});

const createRuntime = (): PersistedAdventureRuntimeV1 => ({
  sceneCounter: 2,
  sceneTurnCounter: 3,
  sceneDirectActionCounter: 2,
  autoIllustrationsUsedInScene: 1,
  autoIllustrationSubjectsInScene: ["npc:warden"],
  selectedPitch: {
    title: "Clockwork Harbor",
    description: "A dangerous storm clock",
  },
  rollingSummary: "Summary",
  metagameDirectives: [],
  votesByPlayerId: { "player-1": "pitch-1" },
  runtimeConfig: defaultRuntimeConfig,
});

test("saves latest snapshot with scene-based filename and loads it", async () => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-snapshots-"));
  const store = new AdventureSnapshotStore({
    rootDir,
    historyLimit: 20,
  });
  await store.initialize();

  const adventure = createAdventureState("adv-snapshot-1");
  await store.saveSnapshot({
    adventure,
    runtime: createRuntime(),
    sceneLabel: "Clockwork Harbor scene 2",
    savedAt: new Date("2026-02-17T20:00:00.000Z"),
  });

  const loaded = store.loadLatestSnapshotSync("adv-snapshot-1");
  assert.ok(loaded);
  assert.equal(loaded?.adventure.adventureId, "adv-snapshot-1");
  assert.equal(loaded?.runtime.sceneCounter, 2);
  assert.equal(loaded?.sceneLabel, "Clockwork Harbor scene 2");
});

test("enforces rolling history cap", async () => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-snapshots-"));
  const store = new AdventureSnapshotStore({
    rootDir,
    historyLimit: 2,
  });
  await store.initialize();

  const adventure = createAdventureState("adv-snapshot-cap");
  await store.saveSnapshot({
    adventure,
    runtime: createRuntime(),
    sceneLabel: "scene one",
    savedAt: new Date("2026-02-17T20:00:01.000Z"),
  });
  await store.saveSnapshot({
    adventure,
    runtime: createRuntime(),
    sceneLabel: "scene two",
    savedAt: new Date("2026-02-17T20:00:02.000Z"),
  });
  await store.saveSnapshot({
    adventure,
    runtime: createRuntime(),
    sceneLabel: "scene three",
    savedAt: new Date("2026-02-17T20:00:03.000Z"),
  });

  const latest = await store.loadLatestSnapshot("adv-snapshot-cap");
  assert.ok(latest);
  assert.equal(latest?.savedAtIso, "2026-02-17T20:00:03.000Z");
});
