import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleMarkdownField exposes separate Generic Asset and Custom Asset insert controls", () => {
  const source = readFileSync(
    "apps/web/src/components/adventure-module/AdventureModuleMarkdownField.tsx",
    "utf8",
  );

  assert.match(source, /<option value="GenericAsset">Generic Asset<\/option>/);
  assert.match(source, /<option value="CustomAsset">Custom Asset<\/option>/);
  assert.match(source, /Generic Asset/);
  assert.match(source, /Custom Asset/);
  assert.match(source, /modifierSlug/);
  assert.doesNotMatch(source, /Asset insert mode/);
});
