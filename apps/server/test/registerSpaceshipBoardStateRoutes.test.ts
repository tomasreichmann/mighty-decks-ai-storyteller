import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { registerSpaceshipBoardStateRoutes } from "../src/spaceship/registerSpaceshipBoardStateRoutes";
import { SpaceshipBoardStateStore } from "../src/persistence/SpaceshipBoardStateStore";

const createApp = async () => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-spaceship-routes-"));
  const store = new SpaceshipBoardStateStore({ rootDir });
  await store.initialize();
  const app = Fastify();
  registerSpaceshipBoardStateRoutes(app, { store });
  return { app, store };
};

const payload = {
  name: "Route Saved Board",
  scene: { sceneId: "scene-1", title: "Route Scene" },
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
  viewport: { x: 12, y: 24, zoom: 1.25 },
};

test("registerSpaceshipBoardStateRoutes saves, lists, loads, and sets defaults", async (t) => {
  const { app } = await createApp();
  t.after(async () => {
    await app.close();
  });

  const saveResponse = await app.inject({
    method: "PUT",
    url: "/api/spaceship-board-states/route-state",
    payload,
  });

  assert.equal(saveResponse.statusCode, 200);
  assert.equal(saveResponse.json().stateId, "route-state");

  const listResponse = await app.inject({
    method: "GET",
    url: "/api/spaceship-board-states",
  });
  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.json().states[0].stateId, "route-state");

  const loadResponse = await app.inject({
    method: "GET",
    url: "/api/spaceship-board-states/route-state",
  });
  assert.equal(loadResponse.statusCode, 200);
  assert.equal(loadResponse.json().scene.title, "Route Scene");

  const defaultResponse = await app.inject({
    method: "PUT",
    url: "/api/spaceship-board-states/default",
    payload: { stateId: "route-state" },
  });
  assert.equal(defaultResponse.statusCode, 200);
  assert.equal(defaultResponse.json().defaultStateId, "route-state");

  const loadDefaultResponse = await app.inject({
    method: "GET",
    url: "/api/spaceship-board-states/default",
  });
  assert.equal(loadDefaultResponse.statusCode, 200);
  assert.equal(loadDefaultResponse.json().stateId, "route-state");
});

test("registerSpaceshipBoardStateRoutes returns 404 for missing states", async (t) => {
  const { app } = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/spaceship-board-states/missing-state",
  });

  assert.equal(response.statusCode, 404);
  assert.match(response.json().message, /not found/i);
});
