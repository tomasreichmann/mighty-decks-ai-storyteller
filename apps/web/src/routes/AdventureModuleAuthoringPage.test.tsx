import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readRouteSource = (): string =>
  readFileSync(new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url), "utf8");

test("AdventureModuleAuthoringPage delegates quest authoring to the extracted screen/store stack", () => {
  const source = readRouteSource();

  assert.match(source, /AdventureModuleAuthoringScreen/);
  assert.match(source, /AuthoringProvider/);
  assert.doesNotMatch(source, /deleteAdventureModuleQuest/);
  assert.doesNotMatch(source, /moduleDetail\.quests/);
});

test("AdventureModuleAuthoringPage keeps the shared header contract through the extracted screen", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /<SharedAuthoringHeader/);
  assert.doesNotMatch(source, /<AdventureModuleTabNav/);
  assert.match(source, /AdventureModuleAuthoringScreen/);
});
