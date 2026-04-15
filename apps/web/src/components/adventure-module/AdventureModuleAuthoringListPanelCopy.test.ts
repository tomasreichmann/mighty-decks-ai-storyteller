import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string): string =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("shared authoring list panels do not render legacy instructional helper copy", () => {
  const actors = read("./AdventureModuleActorsTabPanel.tsx");
  const counters = read("./AdventureModuleCountersTabPanel.tsx");
  const assets = read("./AdventureModuleAssetsTabPanel.tsx");
  const locations = read("./AdventureModuleLocationsTabPanel.tsx");
  const encounters = read("./AdventureModuleEncountersTabPanel.tsx");
  const quests = read("./AdventureModuleQuestsTabPanel.tsx");

  assert.doesNotMatch(
    actors,
    /Click an ActorCard to open its layered card setup and markdown body\./,
  );
  assert.doesNotMatch(
    counters,
    /Click a CounterCard to edit it\. Plus and minus update shared current and max values everywhere in authoring\./,
  );
  assert.doesNotMatch(
    assets,
    /Click an asset to edit its custom card fields and markdown body\./,
  );
  assert.doesNotMatch(
    locations,
    /Open a location to edit its flavor text, GM notes, title image, and\s+interactive map pins\./,
  );
  assert.doesNotMatch(
    encounters,
    /Open an encounter to edit its playable setup, prerequisites, title\s+art, and markdown script\./,
  );
  assert.doesNotMatch(
    quests,
    /Open a quest to edit its title, summary, title art, and markdown\s+brief\./,
  );
});
