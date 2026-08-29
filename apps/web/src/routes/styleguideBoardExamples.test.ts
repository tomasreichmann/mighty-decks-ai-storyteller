import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalBoardExample,
  layoutRecipeExamples,
  rulesIllustrationExample,
  spaceshipCompositionExample,
} from "./styleguideBoardExamples";

test("styleguide board recipes cover every shared layout helper", () => {
  assert.deepEqual(
    layoutRecipeExamples.map((example) => example.layout),
    ["flex", "stack", "deck", "pile", "fan"],
  );

  for (const example of layoutRecipeExamples) {
    assert.ok(example.items.length > 0);
    assert.equal(new Set(example.items.map((item) => item.id)).size, example.items.length);
  }
});

test("worked examples remain flat and inside their virtual boards", () => {
  for (const example of [
    canonicalBoardExample,
    spaceshipCompositionExample,
    rulesIllustrationExample,
  ]) {
    for (const item of example.items) {
      assert.ok(item.x >= 0 && item.y >= 0);
      assert.ok(item.x + item.width! <= example.boardSize.width);
      assert.ok(item.y + item.height! <= example.boardSize.height);
    }
  }
});

test("spaceship composition layers effects, owners, devices, and tokens", () => {
  const byId = new Map(
    spaceshipCompositionExample.items.map((item) => [item.id, item]),
  );

  assert.ok(byId.get("spaceship-effect")!.zIndex! < byId.get("spaceship-location")!.zIndex!);
  assert.ok(byId.get("spaceship-location")!.zIndex! < byId.get("spaceship-device")!.zIndex!);
  assert.ok(byId.get("spaceship-location")!.zIndex! < byId.get("spaceship-energy-token")!.zIndex!);
});
