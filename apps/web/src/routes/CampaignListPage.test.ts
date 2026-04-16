import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignListPage loads campaigns and links into campaign detail", () => {
  const source = readFileSync(new URL("./CampaignListPage.tsx", import.meta.url), "utf8");

  assert.match(source, /export const CampaignListPage/);
  assert.match(source, /listCampaigns/);
  assert.match(source, /getAdventureModuleCreatorToken/);
  assert.match(source, /Campaigns/);
  assert.match(source, /Create Campaign/);
  assert.match(source, /Copy Author Token/);
  assert.match(source, /ShortcodeField/);
  assert.match(source, /\/adventure-module\/list/);
  assert.match(source, /CampaignListCard/);
  assert.match(source, /SearchField/);
  assert.match(source, /ResponsiveCardGrid/);
});
