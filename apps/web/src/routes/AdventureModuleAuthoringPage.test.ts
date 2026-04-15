import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readRouteSource = (): string =>
  readFileSync(new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url), "utf8");

test("AdventureModuleAuthoringPage stays under 1000 lines", () => {
  const lineCount = readRouteSource().split(/\r?\n/).length;

  assert.ok(
    lineCount < 1000,
    `expected AdventureModuleAuthoringPage.tsx to stay under 1000 lines, got ${lineCount}`,
  );
});

test("AdventureModuleAuthoringPage is a thin shell around the shared authoring provider", () => {
  const source = readRouteSource();

  assert.match(source, /AuthoringProvider/);
  assert.match(source, /AdventureModuleAuthoringScreen/);
  assert.doesNotMatch(source, /<CommonAuthoringTabContent/);
  assert.doesNotMatch(source, /createAdventureModuleLocation/);
  assert.doesNotMatch(source, /updateAdventureModuleEncounter/);
});

test("AdventureModuleAuthoringPage imports shared authoring route helpers instead of inline orchestration", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /AuthoringProvider/);
  assert.match(source, /AdventureModuleAuthoringScreen/);
  assert.match(source, /\.\.\/lib\/authoring\/sharedAuthoring/);
  assert.doesNotMatch(source, /createAdventureModuleLocation/);
  assert.doesNotMatch(source, /persistLocation/);
});
