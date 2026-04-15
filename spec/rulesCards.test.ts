import test from "node:test";
import assert from "node:assert/strict";
import {
  rulesEffectCards,
  rulesOutcomeCards,
  rulesStuntCards,
} from "./rulesCards";

test("rules card text is normalized without mojibake", () => {
  const injury = rulesEffectCards.find((card) => card.slug === "injury");
  const success = rulesOutcomeCards.find((card) => card.slug === "success");
  const bringThePain = rulesStuntCards.find(
    (card) => card.slug === "bringThePain",
  );

  assert.ok(injury);
  assert.ok(success);
  assert.ok(bringThePain);

  assert.equal(injury.nounEffect, "4x Injury ➜ Unconscious.");
  assert.equal(
    injury.adjectiveEffect,
    "Use an action or an Asset to heal and discard.",
  );
  assert.equal(success.instructions, "2 Effect");
  assert.equal(
    bringThePain.effect,
    "You need +1\u00a0Injury to get Unconscious.",
  );
});
