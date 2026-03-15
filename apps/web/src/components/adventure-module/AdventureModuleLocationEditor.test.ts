import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleLocationEditor includes introduction, description, and map editor hookup", () => {
  const source = readFileSync(
    "apps/web/src/components/adventure-module/AdventureModuleLocationEditor.tsx",
    "utf8",
  );

  assert.match(source, /Introduction/);
  assert.match(source, /Description/);
  assert.match(source, /AdventureModuleLocationMapEditor/);
  assert.match(source, /Location slug:/);
});
