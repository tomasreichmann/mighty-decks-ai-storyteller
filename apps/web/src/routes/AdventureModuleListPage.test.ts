import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleListPage uses explicit in-card module actions instead of a whole-card link", () => {
  const source = readFileSync(
    new URL("./AdventureModuleListPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /export const AdventureModuleListPage/);
  assert.match(source, /AdventureModuleCard/);
  assert.match(source, /creatingCampaign=\{creatingCampaignModuleId === module\.moduleId\}/);
  assert.match(source, /onCreateCampaign=\{\(\) => \{/);
  assert.match(
    source,
    /repeat\(auto-fit,minmax\(20rem,30rem\)\)/,
  );
  assert.doesNotMatch(source, /<Link/);
});
