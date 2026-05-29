import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  spaceshipBoardStateIdSchema,
  spaceshipBoardStateIndexSchema,
  spaceshipBoardStateSchema,
  spaceshipBoardStateSaveRequestSchema,
} from "./spaceshipBoardState";

test("spaceshipBoardState schemas accept a committed named default state", () => {
  const state = spaceshipBoardStateSchema.parse({
    version: 1,
    stateId: "exiles-corvette-vs-raider",
    name: "Exiles Corvette vs Raider",
    updatedAtIso: "2026-05-20T00:00:00.000Z",
    scene: {
      sceneId: "spaceship-scene",
      title: "Exiles of the Hungry Void",
      panes: [],
    },
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
    viewport: { x: 0, y: 0, zoom: 1 },
  });

  const index = spaceshipBoardStateIndexSchema.parse({
    version: 1,
    defaultStateId: state.stateId,
    states: [
      {
        stateId: state.stateId,
        name: state.name,
        updatedAtIso: state.updatedAtIso,
      },
    ],
  });

  assert.equal(index.defaultStateId, "exiles-corvette-vs-raider");
});

test("spaceshipBoardState rejects unsafe state identifiers", () => {
  assert.equal(spaceshipBoardStateIdSchema.safeParse("../escape").success, false);
  assert.equal(spaceshipBoardStateIdSchema.safeParse("two words").success, false);
  assert.equal(spaceshipBoardStateIdSchema.safeParse("ValidButWrong").success, false);
  assert.equal(spaceshipBoardStateIdSchema.parse("safe-state-1"), "safe-state-1");
});

test("spaceshipBoardState save requests carry name, scene, drag state, and viewport", () => {
  const payload = spaceshipBoardStateSaveRequestSchema.parse({
    name: "Board Draft",
    scene: { sceneId: "scene-1" },
    dragState: { cards: [], tokens: [] },
    viewport: { x: 120, y: 240, zoom: 0.8 },
  });

  assert.equal(payload.name, "Board Draft");
  assert.deepEqual(payload.viewport, { x: 120, y: 240, zoom: 0.8 });
});

test("spaceshipBoardState schemas accept the committed default state files", () => {
  const state = spaceshipBoardStateSchema.parse(
    JSON.parse(
      readFileSync(
        new URL("../apps/server/output/spaceship-board-states/exiles-corvette-vs-raider.json", import.meta.url),
        "utf8",
      ),
    ) as unknown,
  );
  const index = spaceshipBoardStateIndexSchema.parse(
    JSON.parse(
      readFileSync(
        new URL("../apps/server/output/spaceship-board-states/index.json", import.meta.url),
        "utf8",
      ),
    ) as unknown,
  );

  assert.equal(index.defaultStateId, state.stateId);
});
