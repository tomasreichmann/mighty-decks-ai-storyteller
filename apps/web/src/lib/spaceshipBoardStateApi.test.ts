import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./spaceshipBoardStateApi.ts", import.meta.url), "utf8");

test("spaceshipBoardStateApi wraps the named board state endpoints", () => {
  assert.match(source, /\/api\/spaceship-board-states/);
  assert.match(source, /listSpaceshipBoardStates/);
  assert.match(source, /getDefaultSpaceshipBoardState/);
  assert.match(source, /getSpaceshipBoardState/);
  assert.match(source, /saveSpaceshipBoardState/);
  assert.match(source, /setDefaultSpaceshipBoardState/);
});

test("spaceshipBoardStateApi validates responses through shared spec schemas", () => {
  assert.match(source, /spaceshipBoardStateListResponseSchema\.parse/);
  assert.match(source, /spaceshipBoardStateGetResponseSchema\.parse/);
  assert.match(source, /spaceshipBoardStateSaveResponseSchema\.parse/);
  assert.match(source, /spaceshipBoardStateSetDefaultResponseSchema\.parse/);
});
