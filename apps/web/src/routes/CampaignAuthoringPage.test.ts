import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readRouteSource = (): string =>
  readFileSync(new URL("./CampaignAuthoringPage.tsx", import.meta.url), "utf8");

test("CampaignAuthoringPage stays under 1000 lines", () => {
  const lineCount = readRouteSource().split(/\r?\n/).length;

  assert.ok(
    lineCount < 1000,
    `expected CampaignAuthoringPage.tsx to stay under 1000 lines, got ${lineCount}`,
  );
});

test("CampaignAuthoringPage is a thin mode switch between authoring and storyteller session shells", () => {
  const source = readRouteSource();

  assert.match(source, /CampaignAuthoringScreen/);
  assert.match(source, /CampaignStorytellerSessionShell/);
  assert.match(source, /AuthoringProvider/);
  assert.doesNotMatch(source, /<CommonAuthoringTabContent/);
  assert.doesNotMatch(source, /createCampaignSession/);
  assert.doesNotMatch(source, /useCampaignSession/);
});

test("CampaignAuthoringPage keeps campaign session routes but moves live session orchestration out of the route file", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /export const CampaignAuthoringPage/);
  assert.match(source, /campaignSlug/);
  assert.match(source, /sessionId/);
  assert.match(source, /CampaignAuthoringScreen/);
  assert.match(source, /CampaignStorytellerSessionShell/);
  assert.doesNotMatch(source, /watchCampaign/);
});

test("CampaignAuthoringPage no longer keeps storyteller chat and session tab internals inline", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /CampaignSessionSelectionStrip/);
  assert.doesNotMatch(source, /CampaignStorytellerSessionTabContent/);
  assert.doesNotMatch(source, /MarkdownImageInsertButton/);
  assert.doesNotMatch(source, /tableSelection/);
});
