import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleCounterEditor exposes counter shortcode copy UI", () => {
  const source = readFileSync(
    new URL("./AdventureModuleCounterEditor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Counter slug:/);
  assert.match(source, /ShortcodeField/);
  assert.match(source, /@counter\/\$\{counter\.slug\}/);
  assert.match(source, /SceneCardDetailLink/);
  assert.match(source, /buildRoute\(moduleSlug, "counters", counter\.slug\)/);
});
