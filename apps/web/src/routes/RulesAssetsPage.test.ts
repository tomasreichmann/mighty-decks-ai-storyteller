import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("RulesAssetsPage renders base and medieval asset groups with @asset shortcodes", () => {
  const source = readFileSync(new URL("./RulesAssetsPage.tsx", import.meta.url), "utf8");

  assert.match(source, /"Asset Base"/);
  assert.match(source, /"Asset Medieval"/);
  assert.match(source, /@asset\/&lt;slug&gt;/);
  assert.match(source, /createAssetShortcode/);
  assert.match(source, /CodeCopyRow code=\{createAssetShortcode\(asset\.slug\)\}/);
});
