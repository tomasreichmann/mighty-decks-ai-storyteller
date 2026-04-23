import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("SpaceshipPage composes the ship panes and card library overlay", () => {
  const source = readFileSync(new URL("./SpaceshipPage.tsx", import.meta.url), "utf8");

  assert.match(source, /spaceship-page/);
  assert.match(source, /overflow-x-hidden overflow-y-auto/);
  assert.match(source, /Open card library/);
  assert.match(source, /CardLibraryOverlay/);
  assert.match(source, /ShipPane/);
  assert.match(source, /spaceshipScene\.panes\.map/);
  assert.match(source, /toggleCardLibraryOpen/);
  assert.match(source, /toggleCardLibraryEntrySelection/);
  assert.match(source, /flex w-full flex-col gap-5/);
  assert.doesNotMatch(source, /max-w-\[1500px\]/);
});

test("SpaceshipPage starts from a closed overlay state helper", () => {
  const source = readFileSync(new URL("./SpaceshipPage.tsx", import.meta.url), "utf8");

  assert.match(source, /createCardLibraryOverlayState\(\)/);
  assert.doesNotMatch(source, /open: true/);
});
