import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const assertContainsSectionBoundary = (relativePath: string): void => {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  assert.match(source, /SectionBoundary/);
};

test("large section shells use SectionBoundary", () => {
  assertContainsSectionBoundary("../components/adventure-module/AdventureModuleAuthoringScreen.tsx");
  assertContainsSectionBoundary("../components/campaign/CampaignAuthoringScreen.tsx");
  assertContainsSectionBoundary("../components/campaign/CampaignStorytellerSessionShell.tsx");
  assertContainsSectionBoundary("./PlayerPage.tsx");
  assertContainsSectionBoundary("./ScreenPage.tsx");
  assertContainsSectionBoundary("./CampaignSessionPlayerPage.tsx");
  assertContainsSectionBoundary("./WorkflowLabPage.tsx");
  assertContainsSectionBoundary("./ImageGenerator.tsx");
  assertContainsSectionBoundary("./RulesLayoutPage.tsx");
});
