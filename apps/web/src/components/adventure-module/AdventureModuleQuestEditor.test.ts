import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleQuestEditor includes summary, title image, and quest script fields", () => {
  const source = readFileSync(
    new URL("./AdventureModuleQuestEditor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Quest Name/);
  assert.match(source, /Summary/);
  assert.match(source, /Title Image/);
  assert.match(source, /Quest Script/);
  assert.match(source, /Quest slug:/);
  assert.match(source, /createQuestCardJsx|QuestCard/);
});
