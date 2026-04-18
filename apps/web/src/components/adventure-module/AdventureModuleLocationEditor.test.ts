import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleLocationEditor includes introduction, description, and map editor hookup", () => {
  const source = readFileSync(
    new URL("./AdventureModuleLocationEditor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Introduction/);
  assert.match(source, /Description/);
  assert.match(source, /AdventureModuleLocationMapEditor/);
  assert.match(source, /Location slug:/);
  assert.match(source, /ShortcodeField/);
  assert.match(source, /@location\/\$\{location\.locationSlug\}/);
  assert.match(source, /locations=\{locations\}/);
  assert.match(source, /AdventureModuleGeneratedImagePicker/);
  assert.doesNotMatch(source, /AdventureModuleGeneratedImageField/);
});
