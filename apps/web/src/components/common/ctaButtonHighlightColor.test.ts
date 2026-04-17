import test from "node:test";
import assert from "node:assert/strict";

import { resolveCTAButtonHighlightColor } from "./ctaButtonHighlightColor";

test("CTAButton highlight colors keep the washed-out families on darker tones", () => {
  assert.equal(resolveCTAButtonHighlightColor("steel"), "steel-dark");
  assert.equal(resolveCTAButtonHighlightColor("steel-light"), "steel-dark");
  assert.equal(resolveCTAButtonHighlightColor("iron"), "iron-light");
  assert.equal(resolveCTAButtonHighlightColor("blood-lightest"), "blood-light");
  assert.equal(resolveCTAButtonHighlightColor("fire-dark"), "fire-light");
  assert.equal(resolveCTAButtonHighlightColor("bone-darker"), "bone-light");
  assert.equal(resolveCTAButtonHighlightColor("skin-dark"), "skin-light");
  assert.equal(resolveCTAButtonHighlightColor("gold"), "gold-dark");
  assert.equal(resolveCTAButtonHighlightColor("gold-darker"), "gold-dark");
  assert.equal(resolveCTAButtonHighlightColor("cloth-lightest"), "cloth-light");
  assert.equal(resolveCTAButtonHighlightColor("curse-dark"), "curse-light");
  assert.equal(resolveCTAButtonHighlightColor("monster"), "monster-dark");
  assert.equal(resolveCTAButtonHighlightColor("monster-dark"), "monster-dark");
});
