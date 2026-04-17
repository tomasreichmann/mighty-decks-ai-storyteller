import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideCardsPage keeps the gallery self-contained", () => {
  const source = readFileSync(
    new URL("./StyleguideCardsPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /styleguide-cards-page/);
  assert.match(source, /CardBoundary/);
  assert.match(source, /GameCard/);
  assert.match(source, /type="location"/);
  assert.match(source, /type="encounter"/);
  assert.match(source, /type="quest"/);
  assert.match(source, /The card gallery keeps the supported directions together/);
  assert.doesNotMatch(source, /location-card/);
  assert.doesNotMatch(source, /encounter-card/);
  assert.doesNotMatch(source, /quest-card/);
  assert.doesNotMatch(source, /href=/);
});
