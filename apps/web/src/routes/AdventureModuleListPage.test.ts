import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleListPage lets the module card own the single open action", () => {
  const source = readFileSync(
    new URL("./AdventureModuleListPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /export const AdventureModuleListPage/);
  assert.match(source, /AdventureModuleCard/);
  assert.doesNotMatch(source, /creatingCampaignModuleId/);
  assert.doesNotMatch(source, /handleCreateCampaign/);
  assert.doesNotMatch(source, /Campaign Error/);
  assert.match(source, /SearchField/);
  assert.match(source, /ResponsiveCardGrid/);
  assert.match(source, /ShortcodeField/);
  assert.match(source, /Copy Author Token/);
  assert.doesNotMatch(source, /<Link/);
});

test("AdventureModuleListPage wires module deletion through the shared confirmation dialog", () => {
  const source = readFileSync(
    new URL("./AdventureModuleListPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /deleteAdventureModule/);
  assert.match(source, /ConfirmationDialog/);
  assert.match(source, /Delete Module/);
  assert.match(source, /module\.ownedByRequester/);
  assert.match(source, /filter\(\((module|candidate)\) => .*moduleId !== module\.moduleId/);
});
