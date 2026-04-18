import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("GameCardJsxEditor renders detail links only for authored game cards", () => {
  const source = readFileSync(
    new URL("./GameCardJsxEditor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /SceneCardDetailLink/);
  assert.match(source, /buildRoute\(moduleSlug, "actors", resolvedGameCard\.actor\.actorSlug\)/);
  assert.match(source, /buildRoute\(moduleSlug, "counters", resolvedGameCard\.counter\.slug\)/);
  assert.match(source, /resolvedGameCard\.asset\.kind !== "custom"/);
  assert.match(source, /buildRoute\(moduleSlug, "assets", resolvedGameCard\.asset\.assetSlug\)/);
  assert.doesNotMatch(source, /buildRoute\(moduleSlug, "outcomes"/);
  assert.doesNotMatch(source, /buildRoute\(moduleSlug, "effects"/);
  assert.doesNotMatch(source, /buildRoute\(moduleSlug, "stunts"/);
});
