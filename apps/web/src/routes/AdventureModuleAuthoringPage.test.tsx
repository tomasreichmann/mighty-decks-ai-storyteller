import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleAuthoringPage wires real quest authoring flows instead of placeholder lists", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /createAdventureModuleQuest/);
  assert.match(source, /updateAdventureModuleQuest/);
  assert.match(source, /deleteAdventureModuleQuest/);
  assert.match(source, /moduleDetail\.quests/);
  assert.match(source, /CommonAuthoringTabContent/);
  assert.doesNotMatch(source, /EntityList/);
});

test("AdventureModuleAuthoringPage uses AdventureModuleTabNav as the responsive header section control", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /<AdventureModuleSectionMenu/);
  assert.match(
    source,
    /<SharedAuthoringHeader[\s\S]*titleSupportingContent=\{[\s\S]*<AutosaveStatusBadge/,
  );
  assert.doesNotMatch(source, /<SharedAuthoringHeader[\s\S]*loadingTrailingContent=/);
  assert.doesNotMatch(source, /<SharedAuthoringHeader[\s\S]*navTrailingContent=/);
  assert.match(source, /showMobileMenu/);
});

test("AdventureModuleAuthoringPage imports shared authoring foundation modules instead of keeping all helpers inline", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /SharedAuthoringHeader/);
  assert.match(source, /CommonAuthoringTabContent/);
  assert.match(source, /\.\.\/lib\/authoring\//);
});
