import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleAuthoringPage wires real quest authoring flows instead of placeholder lists", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /AdventureModuleQuestsTabPanel/);
  assert.match(source, /AdventureModuleQuestEditor/);
  assert.match(source, /createAdventureModuleQuest/);
  assert.match(source, /updateAdventureModuleQuest/);
  assert.match(source, /deleteAdventureModuleQuest/);
  assert.match(source, /moduleDetail\.quests/);
  assert.doesNotMatch(source, /Create Quest is intentionally a placeholder/);
});
