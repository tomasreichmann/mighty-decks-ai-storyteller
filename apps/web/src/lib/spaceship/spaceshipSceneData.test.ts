import test from "node:test";
import assert from "node:assert/strict";
import { spaceshipScene } from "./spaceshipSceneData";

test("spaceshipScene seeds two panes with locations, actor strips, and a card library", () => {
  assert.equal(spaceshipScene.panes.length, 2);
  assert.ok(spaceshipScene.panes[0].locations.length >= 10);
  assert.ok(spaceshipScene.panes[1].locations.length >= 8);
  assert.ok(spaceshipScene.panes[0].actors.length > 0);
  assert.ok(spaceshipScene.panes[1].actors.length > 0);
  assert.ok(spaceshipScene.cardLibrary.length >= 5);
});

test("spaceshipScene includes energy tokens and effect stacks in the seeded layout", () => {
  const locations = spaceshipScene.panes.flatMap((pane) => pane.locations);

  assert.ok(locations.some((location) => location.energyTokens.length > 0));
  assert.ok(locations.some((location) => location.effects.length > 0));
  assert.ok(locations.some((location) => location.actorTokens.length > 0));
});
