import test from "node:test";
import assert from "node:assert/strict";
import {
  rulesEffectCards,
  rulesEffectCardsBySlug,
  rulesOutcomeCards,
  rulesStuntCards,
} from "./rulesCards";

test("rules card text is normalized without mojibake", () => {
  const injury = rulesEffectCards.find((card) => card.slug === "injury");
  const complication = rulesEffectCards.find(
    (card) => card.slug === "complication",
  );
  const success = rulesOutcomeCards.find((card) => card.slug === "success");
  const fumble = rulesOutcomeCards.find((card) => card.slug === "fumble");
  const bringThePain = rulesStuntCards.find(
    (card) => card.slug === "bringThePain",
  );

  assert.ok(injury);
  assert.ok(complication);
  assert.ok(success);
  assert.ok(fumble);
  assert.ok(bringThePain);

  assert.equal(injury.nounEffect, "4x Injury ➜ Taken Out.");
  assert.equal(
    injury.adjectiveEffect,
    "Use an action or an Asset to heal and discard.",
  );
  assert.equal(success.instructions, "2 Effect");
  assert.equal(
    fumble.description,
    "The action most likely fails.\nThe Storyteller may allow partial success with a serious Complication.",
  );
  assert.equal(
    complication.adjectiveEffect,
    "Usually −1 Effect the next time it applies, then discard. The Storyteller may define another fitting effect or removal condition.",
  );
  assert.equal(bringThePain.requirements, "Recover from being Taken Out.");
  assert.equal(bringThePain.effect, "You need +1\u00a0Injury to be Taken Out.");
});

test("publishes Taken Out as the maximum-Injury status card", () => {
  const takenOut = rulesEffectCardsBySlug["taken-out"];

  assert.ok(takenOut);
  assert.equal(takenOut.title, "Taken Out");
  assert.equal(takenOut.iconUri, "/effects/dying.png");
  assert.ok(!("dying" in rulesEffectCardsBySlug));
});

test("mechanical card text consistently uses Taken Out", () => {
  const cardText = JSON.stringify({ rulesEffectCards, rulesStuntCards });

  assert.doesNotMatch(cardText, /Unconscious/);
});
