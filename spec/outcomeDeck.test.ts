import test from "node:test";
import assert from "node:assert/strict";

import {
  campaignOutcomeCardDefinitions,
  campaignOutcomeCardShortcodeBySlug,
  campaignOutcomeCardTitleBySlug,
  campaignOutcomeDeckCardSlugs,
  formatCampaignOutcomeCardPlayMessage,
} from "./outcomeDeck";

test("campaign outcome deck helper exposes the canonical 12-card mix", () => {
  const counts = campaignOutcomeDeckCardSlugs.reduce<Record<string, number>>(
    (accumulator, slug) => {
      accumulator[slug] = (accumulator[slug] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  assert.equal(campaignOutcomeCardDefinitions.length, 5);
  assert.equal(campaignOutcomeDeckCardSlugs.length, 12);
  assert.equal(counts["special-action"], 1);
  assert.equal(counts.success, 3);
  assert.equal(counts["partial-success"], 3);
  assert.equal(counts.fumble, 4);
  assert.equal(counts.chaos, 1);
  assert.equal(campaignOutcomeCardTitleBySlug["special-action"], "Special Action");
  assert.equal(campaignOutcomeCardShortcodeBySlug.success, "@outcome/success");
  assert.equal(
    formatCampaignOutcomeCardPlayMessage("Bell Runner", ["success", "fumble"]),
    "Bell Runner played: @outcome/success, @outcome/fumble.",
  );
});
