import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleAuthoringPage places Assets tab after Counters", () => {
  const source = readFileSync(
    "apps/web/src/routes/AdventureModuleAuthoringPage.tsx",
    "utf8",
  );

  assert.match(source, /"actors"[\s\S]*"counters"[\s\S]*"assets"[\s\S]*"locations"/);
});

test("AdventureModuleAuthoringPage wires real locations authoring components and APIs", () => {
  const source = readFileSync(
    "apps/web/src/routes/AdventureModuleAuthoringPage.tsx",
    "utf8",
  );

  assert.match(source, /AdventureModuleLocationEditor/);
  assert.match(source, /AdventureModuleLocationsTabPanel/);
  assert.match(source, /createAdventureModuleLocation/);
  assert.match(source, /updateAdventureModuleLocation/);
  assert.match(source, /deleteAdventureModuleLocation/);
});

test("AdventureModuleAuthoringPage includes explicit locations list and editor branches", () => {
  const source = readFileSync(
    "apps/web/src/routes/AdventureModuleAuthoringPage.tsx",
    "utf8",
  );

  assert.match(source, /activeTab === "locations"/);
  assert.match(source, /onOpenLocation/);
  assert.match(source, /onDeleteLocation/);
});

test("AdventureModuleAuthoringPage uses real location list and editor components", () => {
  const source = readFileSync(
    "apps/web/src/routes/AdventureModuleAuthoringPage.tsx",
    "utf8",
  );

  assert.match(source, /AdventureModuleLocationsTabPanel/);
  assert.match(source, /AdventureModuleLocationEditor/);
});

test("AdventureModuleAuthoringPage wires real encounter authoring components and APIs", () => {
  const source = readFileSync(
    "apps/web/src/routes/AdventureModuleAuthoringPage.tsx",
    "utf8",
  );

  assert.match(source, /AdventureModuleEncounterEditor/);
  assert.match(source, /AdventureModuleEncountersTabPanel/);
  assert.match(source, /createAdventureModuleEncounter/);
  assert.match(source, /updateAdventureModuleEncounter/);
  assert.match(source, /deleteAdventureModuleEncounter/);
});

test("AdventureModuleAuthoringPage includes explicit encounters list and editor branches", () => {
  const source = readFileSync(
    "apps/web/src/routes/AdventureModuleAuthoringPage.tsx",
    "utf8",
  );

  assert.match(source, /activeTab === "encounters"/);
  assert.match(source, /onOpenEncounter/);
  assert.match(source, /onDeleteEncounter/);
  assert.doesNotMatch(source, /Create Encounter is intentionally a placeholder/);
});
