import test from "node:test";
import assert from "node:assert/strict";

import { watchCampaignPayloadSchema } from "./campaignEvents";

test("watchCampaignPayloadSchema accepts a campaign slug", () => {
  const parsed = watchCampaignPayloadSchema.parse({
    campaignSlug: "flooded-bells-campaign",
  });

  assert.equal(parsed.campaignSlug, "flooded-bells-campaign");
});
