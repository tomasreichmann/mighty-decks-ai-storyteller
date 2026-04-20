import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CardLibraryOverlay renders location and effect previews through shared cards", () => {
  const source = readFileSync(
    new URL("./CardLibraryOverlay.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Overlay/);
  assert.match(source, /LocationCard/);
  assert.match(source, /GameCardView/);
  assert.match(source, /resolveGameCard/);
  assert.match(source, /effectSlug/);
  assert.match(source, /imageUrl/);
  assert.match(source, /overflow-x-auto pb-3/);
  assert.match(source, /data-card-library-entry/);
  assert.match(source, /data-selection-count/);
  assert.match(source, /data-insert-button/);
});
