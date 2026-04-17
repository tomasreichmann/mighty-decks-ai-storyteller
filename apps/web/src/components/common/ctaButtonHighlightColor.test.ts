import test from "node:test";
import assert from "node:assert/strict";

import { resolveCTAButtonHighlightColor } from "./ctaButtonHighlightColor";

test("CTAButton highlight colors collapse each button family to a light tone", () => {
  assert.equal(resolveCTAButtonHighlightColor("steel"), "steel-light");
  assert.equal(resolveCTAButtonHighlightColor("steel-dark"), "steel-light");
  assert.equal(resolveCTAButtonHighlightColor("iron"), "iron-light");
  assert.equal(resolveCTAButtonHighlightColor("blood-lightest"), "blood-light");
  assert.equal(resolveCTAButtonHighlightColor("fire-dark"), "fire-light");
  assert.equal(resolveCTAButtonHighlightColor("bone-darker"), "bone-light");
  assert.equal(resolveCTAButtonHighlightColor("skin-dark"), "skin-light");
  assert.equal(resolveCTAButtonHighlightColor("gold-darker"), "gold-light");
  assert.equal(resolveCTAButtonHighlightColor("cloth-lightest"), "cloth-light");
  assert.equal(resolveCTAButtonHighlightColor("curse-dark"), "curse-light");
  assert.equal(resolveCTAButtonHighlightColor("monster-dark"), "monster-light");
});
