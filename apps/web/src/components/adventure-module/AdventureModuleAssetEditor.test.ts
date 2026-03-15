import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleAssetEditor exposes custom asset fields and legacy migration copy", () => {
  const source = readFileSync(
    "apps/web/src/components/adventure-module/AdventureModuleAssetEditor.tsx",
    "utf8",
  );

  assert.match(source, /Modifier/);
  assert.match(source, /Noun/);
  assert.match(source, /Noun Description/);
  assert.match(source, /Adjective Description/);
  assert.match(source, /Icon URL/);
  assert.match(source, /Overlay URL/);
  assert.match(source, /custom/i);
  assert.match(source, /reauthor/i);
});
