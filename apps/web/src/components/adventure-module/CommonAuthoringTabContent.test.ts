import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CommonAuthoringTabContent centralizes shared authoring tab panels and editors", () => {
  const source = readFileSync(
    new URL("./CommonAuthoringTabContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /AdventureModuleBaseTabPanel/);
  assert.match(source, /AdventureModulePlayerInfoTabPanel/);
  assert.match(source, /AdventureModuleStorytellerInfoTabPanel/);
  assert.match(source, /AdventureModuleActorsTabPanel/);
  assert.match(source, /AdventureModuleLocationsTabPanel/);
  assert.match(source, /AdventureModuleEncountersTabPanel/);
  assert.match(source, /AdventureModuleQuestsTabPanel/);
  assert.match(source, /AdventureModuleCountersTabPanel/);
  assert.match(source, /AdventureModuleAssetsTabPanel/);
  assert.match(source, /AdventureModuleActorEditor/);
  assert.match(source, /AdventureModuleLocationEditor/);
  assert.match(source, /AdventureModuleEncounterEditor/);
  assert.match(source, /AdventureModuleQuestEditor/);
  assert.match(source, /AdventureModuleCounterEditor/);
  assert.match(source, /AdventureModuleAssetEditor/);
  assert.match(source, /AdventureModuleTabPlaceholder/);
  assert.match(source, /buildMissingEntityDescription/);
});
