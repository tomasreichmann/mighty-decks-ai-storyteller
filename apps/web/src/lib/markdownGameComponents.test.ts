import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("markdownGameComponents resolves built-in asset slugs when module assets are absent", () => {
  const source = readFileSync(new URL("./markdownGameComponents.ts", import.meta.url), "utf8");

  assert.match(source, /import \{ assetBaseCardsBySlug \} from "\.\.\/data\/assetCards";/);
  assert.match(source, /const builtInAssetsBySlug = new Map/);
  assert.match(source, /const asset = moduleAssetsBySlug\?\.get\(key\) \?\? builtInAssetsBySlug\.get\(key\);/);
});
