import test from "node:test";
import assert from "node:assert/strict";

import {
  createGameCardJsx,
  normalizeLegacyGameCardMarkdown,
} from "./gameCardMarkdown";

test("createGameCardJsx emits canonical GameCard source", () => {
  assert.equal(
    createGameCardJsx("OutcomeCard", "success"),
    '<GameCard type="OutcomeCard" slug="success" />',
  );
  assert.equal(
    createGameCardJsx("EffectCard", "on-fire"),
    '<GameCard type="EffectCard" slug="on-fire" />',
  );
  assert.equal(
    createGameCardJsx("StuntCard", "swing-from-the-chandelier"),
    '<GameCard type="StuntCard" slug="swing-from-the-chandelier" />',
  );
});

test("normalizeLegacyGameCardMarkdown upgrades legacy tokens to canonical GameCard JSX", () => {
  const markdown = [
    "Take a breath.",
    "",
    "@outcome/success",
    "",
    "Then bring in @effect/on-fire before the finale.",
    "",
    "- @stunt/swing-from-the-chandelier",
  ].join("\n");

  assert.equal(
    normalizeLegacyGameCardMarkdown(markdown),
    [
      "Take a breath.",
      "",
      '<GameCard type="OutcomeCard" slug="success" />',
      "",
      'Then bring in <GameCard type="EffectCard" slug="on-fire" /> before the finale.',
      "",
      '- <GameCard type="StuntCard" slug="swing-from-the-chandelier" />',
    ].join("\n"),
  );
});

test("normalizeLegacyGameCardMarkdown leaves inline code, fenced code, and unknown tokens untouched", () => {
  const markdown = [
    "`@outcome/success`",
    "",
    "```md",
    "@effect/on-fire",
    "```",
    "",
    "@mystery/unknown",
    "",
    '<GameCard type="OutcomeCard" slug="success" />',
  ].join("\n");

  assert.equal(normalizeLegacyGameCardMarkdown(markdown), markdown);
});

test("normalizeLegacyGameCardMarkdown leaves indented code blocks untouched", () => {
  const markdown = [
    "Indented example:",
    "",
    "    @outcome/success",
    "    @effect/on-fire",
    "",
    "Back to prose.",
  ].join("\n");

  assert.equal(normalizeLegacyGameCardMarkdown(markdown), markdown);
});
