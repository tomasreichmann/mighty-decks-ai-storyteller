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
  assert.match(
    source,
    /repeat\(auto-fit,minmax\(20rem,30rem\)\)/,
  );
  assert.match(source, /ShortcodeField/);
  assert.match(source, /Copy Author Token/);
  assert.doesNotMatch(source, /<Link/);
});
