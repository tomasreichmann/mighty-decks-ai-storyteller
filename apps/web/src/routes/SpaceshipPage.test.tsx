import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("SpaceshipPage composes the absolute-positioned board and card library overlay", () => {
  const source = readFileSync(new URL("./SpaceshipPage.tsx", import.meta.url), "utf8");

  assert.match(source, /spaceship-page/);
  assert.match(source, /overflow-x-hidden overflow-y-auto/);
  assert.match(source, /Open card library/);
  assert.match(source, /CardLibraryOverlay/);
  assert.match(source, /SpaceshipBoard/);
  assert.match(source, /scene=\{scene\}/);
  assert.match(source, /toggleCardLibraryOpen/);
  assert.match(source, /toggleCardLibraryEntrySelection/);
  assert.match(source, /relative z-10 flex h-screen w-full flex-col/);
  assert.doesNotMatch(source, /px-4 py-6/);
  assert.doesNotMatch(source, /lg:px-6/);
});

test("SpaceshipPage starts from a closed overlay state helper", () => {
  const source = readFileSync(new URL("./SpaceshipPage.tsx", import.meta.url), "utf8");

  assert.match(source, /createCardLibraryOverlayState\(\)/);
});

test("SpaceshipPage exposes and cleans up the browser-global spaceship connector", () => {
  const source = readFileSync(new URL("./SpaceshipPage.tsx", import.meta.url), "utf8");

  assert.match(source, /window\.mightyDecksSpaceship/);
  assert.match(source, /delete window\.mightyDecksSpaceship/);
  assert.match(source, /applySpaceshipAgentOperations/);
  assert.match(source, /syncSpaceshipCardPositions/);
  assert.match(source, /syncSpaceshipTokenPositions/);
  assert.match(source, /focusPane/);
  assert.match(source, /focusItem/);
});

test("SpaceshipPage loads, saves, restores, and marks named board states as default", () => {
  const source = readFileSync(new URL("./SpaceshipPage.tsx", import.meta.url), "utf8");

  assert.match(source, /getDefaultSpaceshipBoardState/);
  assert.match(source, /listSpaceshipBoardStates/);
  assert.match(source, /getSpaceshipBoardState/);
  assert.match(source, /saveSpaceshipBoardState/);
  assert.match(source, /setDefaultSpaceshipBoardState/);
  assert.match(source, /selectedStateId/);
  assert.match(source, /savedViewport/);
  assert.match(source, /Save As/);
  assert.match(source, /Restore/);
  assert.match(source, /Set Default/);
  assert.match(source, /key=\{boardInstanceKey\}/);
});
