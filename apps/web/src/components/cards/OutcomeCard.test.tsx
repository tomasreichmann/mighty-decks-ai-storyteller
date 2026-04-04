import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("OutcomeCard back face renders as an SVG backface with the shared texture and outcome icon", () => {
  const source = readFileSync(new URL("./OutcomeCard.tsx", import.meta.url), "utf8");

  assert.match(source, /aria-label="Outcome card back"/);
  assert.match(source, /viewBox="0 0 204 332"/);
  assert.match(source, /card-backface\.png/);
  assert.match(source, /\/types\/outcome\.png/);
  assert.match(source, /dominantBaseline="middle"/);
  assert.match(source, /fill-kac-monster-lightest/);
  assert.match(source, /y="266"/);
  assert.match(source, /textShadow:\s*"0px 2px 0 black"/);
  assert.match(source, /\bOutcome\b/);
  assert.doesNotMatch(source, /fill="rgba\(255,248,235,0\.08\)"/);
  assert.doesNotMatch(source, /fill="rgba\(73,22,20,0\.16\)"/);
  assert.doesNotMatch(source, /ellipse/);
  assert.doesNotMatch(source, /transform="translate\(0 2\)"/);
  assert.doesNotMatch(source, /◎/);
});
