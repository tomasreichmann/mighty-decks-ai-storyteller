import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleAuthoringPage imports the shared authoring tab config", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /AUTHORING_TAB_LABELS/);
  assert.match(source, /resolveCompactTitleInputSize/);
  assert.match(source, /\.\.\/lib\/authoring\/sharedAuthoring/);
});

test("AdventureModuleAuthoringPage delegates common tabs through CommonAuthoringTabContent", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<CommonAuthoringTabContent/);
  assert.match(source, /locationsTabPanelProps=\{/);
  assert.match(source, /encountersTabPanelProps=\{/);
  assert.match(source, /questsTabPanelProps=\{/);
  assert.match(source, /locationEditorProps=\{/);
  assert.match(source, /encounterEditorProps=\{/);
  assert.match(source, /questEditorProps=\{/);
});

test("AdventureModuleAuthoringPage keeps real location and encounter CRUD wiring after extraction", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /createAdventureModuleLocation/);
  assert.match(source, /updateAdventureModuleLocation/);
  assert.match(source, /deleteAdventureModuleLocation/);
  assert.match(source, /createAdventureModuleEncounter/);
  assert.match(source, /updateAdventureModuleEncounter/);
  assert.match(source, /deleteAdventureModuleEncounter/);
  assert.match(source, /onOpenLocation/);
  assert.match(source, /onOpenEncounter/);
});
