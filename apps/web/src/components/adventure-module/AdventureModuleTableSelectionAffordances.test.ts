import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string): string =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("authoring list tab panels expose optional + affordances next to shortcode copy", () => {
  const actors = read("./AdventureModuleActorsTabPanel.tsx");
  const counters = read("./AdventureModuleCountersTabPanel.tsx");
  const assets = read("./AdventureModuleAssetsTabPanel.tsx");
  const locations = read("./AdventureModuleLocationsTabPanel.tsx");
  const encounters = read("./AdventureModuleEncountersTabPanel.tsx");
  const quests = read("./AdventureModuleQuestsTabPanel.tsx");

  assert.match(actors, /onAddActorCardToSelection\?: \(actorSlug: string\) => void/);
  assert.match(counters, /onAddCounterCardToSelection\?: \(counterSlug: string\) => void/);
  assert.match(assets, /onAddAssetCardToSelection\?: \(assetSlug: string\) => void/);
  assert.match(locations, /onAddLocationCardToSelection\?: \(locationSlug: string\) => void/);
  assert.match(encounters, /onAddEncounterCardToSelection\?: \(encounterSlug: string\) => void/);
  assert.match(quests, /onAddQuestCardToSelection\?: \(questSlug: string\) => void/);

  assert.match(actors, /ShortcodeField/);
  assert.match(counters, /ShortcodeField/);
  assert.match(assets, /ShortcodeField/);
  assert.match(locations, /ShortcodeField/);
  assert.match(encounters, /ShortcodeField/);
  assert.match(quests, /ShortcodeField/);

  assert.doesNotMatch(actors, /Copy Shortcode/);
  assert.doesNotMatch(counters, /Copy Shortcode/);
  assert.doesNotMatch(assets, /Copy Shortcode/);
  assert.doesNotMatch(locations, /Copy Shortcode/);
  assert.doesNotMatch(encounters, /Copy Shortcode/);
  assert.doesNotMatch(quests, /Copy Shortcode/);
});
