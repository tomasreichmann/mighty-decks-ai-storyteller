import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignListPage loads campaigns and links into campaign detail", () => {
  const source = readFileSync(new URL("./CampaignListPage.tsx", import.meta.url), "utf8");

  assert.match(source, /export const CampaignListPage/);
  assert.match(source, /listCampaigns/);
  assert.match(source, /Campaigns/);
  assert.match(source, /activeSessionCount/);
  assert.match(source, /Source Module/);
  assert.match(source, /\/campaign\/\$\{encodeURIComponent\(campaign\.slug\)\}\/base/);
});
