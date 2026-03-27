import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the hidden styleguide routes", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /StyleguideIndexPage/);
  assert.match(source, /StyleguideLocationCardPage/);
  assert.match(source, /StyleguideEncounterCardPage/);
  assert.match(source, /path="\/styleguide"/);
  assert.match(source, /path="location-card"|path="\/styleguide\/location-card"/);
  assert.match(source, /path="encounter-card"|path="\/styleguide\/encounter-card"/);
});
