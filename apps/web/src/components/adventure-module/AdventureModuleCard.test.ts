import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleCard reuses the shared story tile shell for module metadata and actions", () => {
  const source = readFileSync(
    new URL("./AdventureModuleCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /StoryTileCard/);
  assert.match(source, /Open Module/);
  assert.match(source, /Create Campaign/);
  assert.match(source, /<Tag tone="bone" size="sm">\s*Module\s*<\/Tag>/);
  assert.match(source, /By \{module\.authorLabel\}/);
  assert.match(source, /module\.tags\.map/);
  assert.match(source, /resolveServerUrl/);
  assert.match(source, /imageLoading="lazy"/);
});
