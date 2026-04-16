import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideCardsPage groups the card labs into one scoped page", () => {
  const source = readFileSync(
    new URL("./StyleguideCardsPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /Location Card/);
  assert.match(source, /Encounter Card/);
  assert.match(source, /Quest Card/);
  assert.match(source, /\/styleguide\/location-card/);
  assert.match(source, /\/styleguide\/encounter-card/);
  assert.match(source, /\/styleguide\/quest-card/);
  assert.match(source, /styleguide-cards-page/);
});
