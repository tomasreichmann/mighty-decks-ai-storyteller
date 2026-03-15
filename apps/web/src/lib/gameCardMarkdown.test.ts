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
  assert.equal(
    createGameCardJsx("CounterCard", "threat-clock"),
    '<GameCard type="CounterCard" slug="threat-clock" />',
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

test("normalizeLegacyGameCardMarkdown upgrades actor shortcodes to canonical GameCard JSX", () => {
  const markdown = [
    "Bring in the local threat.",
    "",
    "@actor/warden-sable",
    "",
    "Then negotiate with @actor/river-smuggler-nyra before the alarm fully trips.",
  ].join("\n");

  assert.equal(
    normalizeLegacyGameCardMarkdown(markdown),
    [
      "Bring in the local threat.",
      "",
      '<GameCard type="ActorCard" slug="warden-sable" />',
      "",
      'Then negotiate with <GameCard type="ActorCard" slug="river-smuggler-nyra" /> before the alarm fully trips.',
    ].join("\n"),
  );
});

test("normalizeLegacyGameCardMarkdown upgrades counter shortcodes to canonical GameCard JSX", () => {
  const markdown = [
    "Track the scene pressure.",
    "",
    "@counter/threat-clock",
    "",
    "Keep @counter/escape-clock visible in the same paragraph.",
  ].join("\n");

  assert.equal(
    normalizeLegacyGameCardMarkdown(markdown),
    [
      "Track the scene pressure.",
      "",
      '<GameCard type="CounterCard" slug="threat-clock" />',
      "",
      'Keep <GameCard type="CounterCard" slug="escape-clock" /> visible in the same paragraph.',
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

test("normalizeLegacyGameCardMarkdown resumes shortcode normalization after fenced code blocks close", () => {
  const markdown = [
    "```md",
    "@actor/warden-sable",
    "```",
    "",
    "@actor/river-smuggler-nyra",
  ].join("\n");

  assert.equal(
    normalizeLegacyGameCardMarkdown(markdown),
    [
      "```md",
      "@actor/warden-sable",
      "```",
      "",
      '<GameCard type="ActorCard" slug="river-smuggler-nyra" />',
    ].join("\n"),
  );
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
