import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleEncounterEditor includes prerequisites, title image, and encounter script fields", () => {
  const source = readFileSync(
    "apps/web/src/components/adventure-module/AdventureModuleEncounterEditor.tsx",
    "utf8",
  );

  assert.match(source, /Prerequisites/);
  assert.match(source, /Title Image/);
  assert.match(source, /Encounter Script/);
  assert.match(source, /Encounter slug:/);
  assert.match(source, /createEncounterCardJsx|EncounterCard/);
});
