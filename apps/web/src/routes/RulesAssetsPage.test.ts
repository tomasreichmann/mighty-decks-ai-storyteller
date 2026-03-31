import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("RulesAssetsPage renders base and medieval asset groups with modifier selector cards and @asset shortcodes", () => {
  const source = readFileSync(new URL("./RulesAssetsPage.tsx", import.meta.url), "utf8");

  assert.match(source, /"Asset Base"/);
  assert.match(source, /"Asset Medieval"/);
  assert.match(source, /@asset\/&lt;slug&gt;/);
  assert.match(source, /createAssetShortcode/);
  assert.match(
    source,
    /ShortcodeField[\s\S]*createAssetShortcode\([\s\S]*asset\.slug,[\s\S]*appliedModifierSlug,[\s\S]*\)/,
  );
  assert.match(source, /Modifier/);
  assert.match(source, /type="checkbox"/);
  assert.match(source, /type="radio"/);
  assert.match(source, /assetModifierCards\.map/);
  assert.match(source, /AssetModifierCard/);
  assert.match(source, /<AssetModifierCard modifierSlug=\{modifier\.slug\}/);
});
