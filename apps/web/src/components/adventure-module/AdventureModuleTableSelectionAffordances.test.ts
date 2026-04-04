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

  assert.match(actors, /Copy Shortcode[\s\S]*\+/);
  assert.match(counters, /Copy Shortcode[\s\S]*\+/);
  assert.match(assets, /Copy Shortcode[\s\S]*\+/);
  assert.match(locations, /Copy Shortcode[\s\S]*\+/);
  assert.match(encounters, /Copy Shortcode[\s\S]*\+/);
  assert.match(quests, /Copy Shortcode[\s\S]*\+/);
});
