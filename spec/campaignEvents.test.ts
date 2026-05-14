import test from "node:test";
import assert from "node:assert/strict";

import {
  acceptWorldbuildingProposalPayloadSchema,
  addWorldbuildingProposalPayloadSchema,
  advanceWorldbuildingPhasePayloadSchema,
  drawCampaignSessionOutcomeCardPayloadSchema,
  addCampaignSessionTableCardsPayloadSchema,
  commitWorldbuildingThemePayloadSchema,
  importWorldbuildingResultPayloadSchema,
  playCampaignSessionOutcomeCardsPayloadSchema,
  rejectWorldbuildingProposalPayloadSchema,
  removeCampaignSessionTableCardPayloadSchema,
  shuffleCampaignSessionOutcomeDeckPayloadSchema,
  submitWorldbuildingMotifPayloadSchema,
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

test("campaign outcome payload schemas accept draw, shuffle, and play actions", () => {
  const drawPayload = drawCampaignSessionOutcomeCardPayloadSchema.parse({
    campaignSlug: "flooded-bells-campaign",
    sessionId: "session-flooded-bells",
    participantId: "participant-player",
  });
  const shufflePayload = shuffleCampaignSessionOutcomeDeckPayloadSchema.parse({
    campaignSlug: "flooded-bells-campaign",
    sessionId: "session-flooded-bells",
    participantId: "participant-player",
  });
  const playPayload = playCampaignSessionOutcomeCardsPayloadSchema.parse({
    campaignSlug: "flooded-bells-campaign",
    sessionId: "session-flooded-bells",
    participantId: "participant-player",
    cardIds: ["outcome-card-1", "outcome-card-2"],
  });

  assert.equal(drawPayload.participantId, "participant-player");
  assert.equal(shufflePayload.sessionId, "session-flooded-bells");
  assert.equal(playPayload.cardIds.length, 2);
});

test("worldbuilding payload schemas accept theme, motif, proposal, review, and import actions", () => {
  const base = {
    campaignSlug: "shadow-albion",
    sessionId: "session-worldbuilding",
    participantId: "participant-storyteller",
  };
  const theme = commitWorldbuildingThemePayloadSchema.parse({
    ...base,
    theme: "Arthurian gothic horror about conquering a shadow realm.",
  });
  const motif = submitWorldbuildingMotifPayloadSchema.parse({
    ...base,
    stance: "must_have",
    title: "Lake magic",
  });
  const proposal = addWorldbuildingProposalPayloadSchema.parse({
    ...base,
    kind: "asset",
    title: "Excalibur",
    summary: "A mythical sword gifted by the Lady of the Lake.",
  });
  const advance = advanceWorldbuildingPhasePayloadSchema.parse({
    ...base,
    phase: "review",
  });
  const accept = acceptWorldbuildingProposalPayloadSchema.parse({
    ...base,
    proposalId: "proposal-asset",
  });
  const reject = rejectWorldbuildingProposalPayloadSchema.parse({
    ...base,
    proposalId: "proposal-avoid",
  });
  const imported = importWorldbuildingResultPayloadSchema.parse({
    ...base,
    proposalIds: ["proposal-location", "proposal-asset"],
  });

  assert.equal(theme.theme.includes("Arthurian"), true);
  assert.equal(motif.stance, "must_have");
  assert.equal(proposal.kind, "asset");
  assert.equal(advance.phase, "review");
  assert.equal(accept.proposalId, "proposal-asset");
  assert.equal(reject.proposalId, "proposal-avoid");
  assert.equal(imported.proposalIds.length, 2);
});
