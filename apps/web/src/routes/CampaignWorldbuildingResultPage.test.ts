import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignWorldbuildingResultPage loads campaign session results and exposes import controls", () => {
  const source = readFileSync(
    new URL("./CampaignWorldbuildingResultPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /getCampaignBySlug/);
  assert.match(source, /getCampaignSession/);
  assert.match(source, /useCampaignSession/);
  assert.match(source, /WorldbuildingBoard/);
  assert.match(source, /importWorldbuildingResult/);
  assert.match(source, /Worldbuilding Result/);
});
