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

test("AdventureModuleAuthoringPage uses AdventureModuleTabNav as the responsive header section control", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /<AdventureModuleSectionMenu/);
  assert.match(
    source,
    /<AdventureModuleTabNav[\s\S]*leadingContent=\{[\s\S]*<CTAButton[\s\S]*Create Campaign/,
  );
  assert.match(
    source,
    /<AdventureModuleTabNav[\s\S]*trailingContent=\{[\s\S]*<AutosaveStatusBadge/,
  );
  assert.doesNotMatch(source, /showMobileMenu=\{false\}/);
});

test("AdventureModuleAuthoringPage keeps Create Campaign in the desktop title row and the narrow nav row", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /moduleDetail \? \([\s\S]*<CTAButton[\s\S]*containerClassName=\"hidden lg:inline-flex\"[\s\S]*Create Campaign/,
  );
  assert.match(
    source,
    /<AdventureModuleTabNav[\s\S]*leadingContent=\{[\s\S]*<CTAButton[\s\S]*containerClassName=\"lg:hidden\"[\s\S]*Create Campaign/,
  );
});
