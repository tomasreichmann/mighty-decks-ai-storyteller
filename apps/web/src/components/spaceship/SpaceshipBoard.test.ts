import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("SpaceshipBoard renders the scene through the shared board primitives", () => {
  const source = readFileSync(new URL("./SpaceshipBoard.tsx", import.meta.url), "utf8");

  assert.match(source, /BoardProvider/);
  assert.match(source, /BoardFrame/);
  assert.match(source, /<Board/);
  assert.match(source, /renderItem=/);
  assert.match(source, /createSpaceshipBoardItems/);
  assert.match(source, /createSpaceshipBoardLayout/);
});

test("SpaceshipBoard renders independent board surfaces for locations, devices, effects, tokens, and actors", () => {
  const source = readFileSync(new URL("./SpaceshipBoard.tsx", import.meta.url), "utf8");

  assert.match(source, /ShipLocationCardSurface/);
  assert.match(source, /ShipLocationDeviceCard/);
  assert.match(source, /ShipLocationTokenRow/);
  assert.match(source, /ShipEffectCardSurface/);
  assert.match(source, /SpaceshipActorCardSurface/);
  assert.match(source, /SpaceshipActorEffectSurface/);
});

test("SpaceshipBoard renders custom actor cards when spaceship actors provide them", () => {
  const source = readFileSync(new URL("./SpaceshipActorStrip.tsx", import.meta.url), "utf8");

  assert.match(source, /actor\.customCard/);
  assert.match(source, /kind="custom"/);
  assert.match(source, /custom=\{actor\.customCard\}/);
});

test("SpaceshipBoard exposes fit controls for all, ally, and enemy board content", () => {
  const source = readFileSync(new URL("./SpaceshipBoard.tsx", import.meta.url), "utf8");

  assert.match(source, /Show All/);
  assert.match(source, /Focus Ally Ship/);
  assert.match(source, /Focus Enemy Ship/);
  assert.match(source, /getSpaceshipBoardPaneItemIds/);
  assert.match(source, /controller\.fitItems/);
});

test("SpaceshipBoard shows the live board zoom in the header", () => {
  const source = readFileSync(new URL("./SpaceshipBoard.tsx", import.meta.url), "utf8");

  assert.match(source, /SpaceshipBoardHeader/);
  assert.match(source, /viewport\.zoom \* 100/);
  assert.match(source, /Zoom/);
  assert.match(source, /useBoard\(\)/);
});
