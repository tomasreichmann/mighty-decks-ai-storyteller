import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StoryTileCard can turn the full card surface into a single link target", () => {
  const source = readFileSync(
    new URL("./StoryTileCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /href\?: string/);
  assert.match(source, /focus-within:-translate-y-1/);
  assert.match(source, /href \? \(/);
  assert.match(source, /<a/);
});
