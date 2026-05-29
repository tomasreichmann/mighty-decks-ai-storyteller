import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { SpaceshipBoardStateStore } from "../src/persistence/SpaceshipBoardStateStore";

const createStateInput = (name = "Saved Board") => ({
  name,
  scene: { sceneId: "scene-1", title: "Saved Scene" },
  dragState: {
    layouts: {
      locationRows: [],
      deviceColumns: [],
      effectStacks: [],
      actorRows: [],
    },
    cards: [],
    tokens: [],
    dispenserPanel: { x: 0, y: 0, width: 184, height: 1000, zIndex: 900 },
    nextCardZIndex: 1000,
    nextZIndex: 100000,
    nextEnergyTokenIndex: 1,
    nextEffectCardIndex: 1,
  },
  viewport: { x: 10, y: 20, zoom: 0.75 },
});

test("SpaceshipBoardStateStore saves named states and updates the default index", async () => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-spaceship-states-"));
  const store = new SpaceshipBoardStateStore({ rootDir });
  await store.initialize();

  const saved = await store.saveState({
    stateId: "saved-board",
    makeDefault: true,
    ...createStateInput(),
  });
  const list = await store.listStates();
  const loadedDefault = await store.getDefaultState();

  assert.equal(saved.stateId, "saved-board");
  assert.equal(list.defaultStateId, "saved-board");
  assert.equal(list.states[0]?.name, "Saved Board");
  assert.equal(loadedDefault.stateId, "saved-board");
  assert.deepEqual(loadedDefault.viewport, { x: 10, y: 20, zoom: 0.75 });

  const stateRaw = await readFile(join(rootDir, "saved-board.json"), "utf8");
  assert.equal(JSON.parse(stateRaw).scene.title, "Saved Scene");
});

test("SpaceshipBoardStateStore restores by id and can switch default states", async () => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-spaceship-states-"));
  const store = new SpaceshipBoardStateStore({ rootDir });
  await store.initialize();

  await store.saveState({
    stateId: "first-state",
    makeDefault: true,
    ...createStateInput("First"),
  });
  await store.saveState({
    stateId: "second-state",
    ...createStateInput("Second"),
  });
  await store.setDefaultState("second-state");

  assert.equal((await store.getState("first-state")).name, "First");
  assert.equal((await store.getDefaultState()).stateId, "second-state");
});

test("SpaceshipBoardStateStore rejects unsafe ids", async () => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-spaceship-states-"));
  const store = new SpaceshipBoardStateStore({ rootDir });
  await store.initialize();

  await assert.rejects(
    () =>
      store.saveState({
        stateId: "../escape",
        ...createStateInput(),
      }),
    /stateId must be lowercase kebab-case|unsafe/i,
  );
});
