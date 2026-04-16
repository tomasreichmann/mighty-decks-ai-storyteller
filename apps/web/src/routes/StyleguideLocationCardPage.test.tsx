import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideLocationCardPage renders a single location card direction", () => {
  const source = readFileSync(
    new URL("./StyleguideLocationCardPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /The Drowned Gate District/);
  assert.match(source, /LocationCard direction/);
  assert.match(source, /pinned icon medallion/);
  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /styleguide-location-card-page/);
  assert.match(source, /<GameCard type="location" location=\{sampleLocation\} \/>/);
  assert.doesNotMatch(source, /ImageCard-driven direction/);
  assert.doesNotMatch(source, /locationGameCardVariantLabels/);
});
