import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("SpaceshipActorStrip uses shared EffectCard piles for actor consequences", () => {
  const source = readFileSync(
    new URL("./SpaceshipActorStrip.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /ShipEffectCardPile/);
  assert.match(source, /effectType="injury"/);
  assert.match(source, /effectType="distress"/);
  assert.match(source, /min-h-\[18\.5rem\]/);
  assert.match(source, /bottom-0/);
  assert.match(source, /items-center/);
  assert.doesNotMatch(source, /ConsequenceStack/);
});
