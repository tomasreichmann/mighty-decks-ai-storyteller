import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveHeadingHighlightColorClass } from "./headingHighlightColor";

test("Heading exposes a level prop and keeps Text as the semantic base", () => {
  const source = readFileSync(new URL("./Heading.tsx", import.meta.url), "utf8");

  assert.match(source, /HeadingLevel/);
  assert.match(source, /level\?: HeadingLevel/);
  assert.match(source, /Text/);
  assert.match(source, /Highlight/);
  assert.doesNotMatch(source, /variant\?: Partial<TextProps>/);
  assert.doesNotMatch(source, /variant="h2"/);
});

test("Heading resolves the semantic highlight palette with lighter tones", () => {
  const cases = [
    ["gold", "text-kac-gold"],
    ["fire", "text-kac-fire-light"],
    ["blood", "text-kac-blood-light"],
    ["bone", "text-kac-bone-light"],
    ["steel", "text-kac-steel-light"],
    ["skin", "text-kac-skin-light"],
    ["cloth", "text-kac-cloth-light"],
    ["curse", "text-kac-curse-light"],
    ["monster", "text-kac-monster-light"],
  ] as const;

  for (const [color, expectedClass] of cases) {
    assert.equal(resolveHeadingHighlightColorClass(color), expectedClass);
  }
});
