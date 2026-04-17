import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideButtonsPage showcases Button and CTAButton", () => {
  const source = readFileSync(
    new URL("./StyleguideButtonsPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /styleguide-buttons-page/);
  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /Button/);
  assert.match(source, /CTAButton/);
  assert.match(source, /buttonPalette/);
  assert.match(source, /sizeShowcaseCards/);
  assert.match(source, /colorShowcaseRows/);
  assert.match(source, /size="sm"/);
  assert.match(source, /sizeLadderLabels/);
  assert.match(source, /Object\.keys\(sizeLadderLabels\)/);
  assert.match(source, /variant="circle"/);
  assert.match(source, /Button size ladders/);
  assert.match(source, /variant="solid"/);
  assert.match(source, /variant="ghost"/);
  assert.match(source, /Gold/);
  assert.match(source, /Cloth/);
  assert.match(source, /Bone/);
  assert.match(source, /Fire/);
  assert.match(source, /Iron/);
  assert.match(source, /Steel/);
  assert.match(source, /Blood/);
  assert.match(source, /Curse/);
  assert.match(source, /Monster/);
  assert.match(source, /Skin/);
  assert.doesNotMatch(source, /Ghost comparison/);
  assert.doesNotMatch(source, /Ghost color variants/);
  assert.doesNotMatch(source, /Paper Edge/);
  assert.doesNotMatch(source, /Ink Trace/);
  assert.doesNotMatch(source, /Cloth Wash/);
  assert.doesNotMatch(source, /Stamp Lift/);
  assert.match(source, /single representative color/);
  assert.match(source, /full palette/);
});
