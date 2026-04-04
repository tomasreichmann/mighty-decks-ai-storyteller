import test from "node:test";
import assert from "node:assert/strict";

import {
  addCampaignSessionTableCardsPayloadSchema,
  removeCampaignSessionTableCardPayloadSchema,
  watchCampaignPayloadSchema,
} from "./campaignEvents";

test("watchCampaignPayloadSchema accepts a campaign slug", () => {
  const parsed = watchCampaignPayloadSchema.parse({
    campaignSlug: "flooded-bells-campaign",
  });

  assert.equal(parsed.campaignSlug, "flooded-bells-campaign");
});

test("campaign table mutation payload schemas accept typed targets and card references", () => {
  const addPayload = addCampaignSessionTableCardsPayloadSchema.parse({
    campaignSlug: "flooded-bells-campaign",
    sessionId: "session-flooded-bells",
    participantId: "participant-storyteller",
    target: {
      scope: "participant",
      participantId: "participant-player",
    },
    cards: [
      {
        type: "EffectCard",
        slug: "burning",
      },
      {
        type: "AssetCard",
        slug: "medieval_lantern",
        modifierSlug: "base_hidden",
      },
    ],
  });
  const removePayload = removeCampaignSessionTableCardPayloadSchema.parse({
    campaignSlug: "flooded-bells-campaign",
    sessionId: "session-flooded-bells",
    participantId: "participant-player",
    tableEntryId: "table-entry-1",
  });

  assert.equal(addPayload.cards.length, 2);
  assert.equal(addPayload.target.scope, "participant");
  assert.equal(removePayload.tableEntryId, "table-entry-1");
});
