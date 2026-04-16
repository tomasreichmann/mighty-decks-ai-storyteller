import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleAssetEditor exposes custom asset fields, icon image picker, and legacy migration copy", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAssetEditor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Modifier/);
  assert.match(source, /Noun/);
  assert.match(source, /Noun Description/);
  assert.match(source, /Adjective Description/);
  assert.match(source, /Icon Image/);
  assert.match(source, /Overlay URL/);
  assert.match(source, /AdventureModuleGeneratedImagePicker/);
  assert.doesNotMatch(source, /label="Icon URL"/);
  assert.match(source, /custom/i);
  assert.match(source, /reauthor/i);
  assert.match(source, /ShortcodeField/);
  assert.match(source, /@asset\/\$\{asset\.assetSlug\}/);
});
