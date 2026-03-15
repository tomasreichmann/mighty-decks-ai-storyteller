import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("assetCards derives shared asset titles from the spec catalog", () => {
  const source = readFileSync(new URL("./assetCards.ts", import.meta.url), "utf8");

  assert.match(source, /assetBaseCatalog\.map\(/);
  assert.match(source, /assetModifierCatalog\.map\(/);
  assert.doesNotMatch(source, /title:\s*"/);
});
