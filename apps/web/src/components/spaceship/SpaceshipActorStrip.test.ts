import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("SpaceshipActorStrip renders one shared EffectCard surface per actor consequence", () => {
  const source = readFileSync(
    new URL("./SpaceshipActorStrip.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /ShipEffectCardSurface/);
  assert.match(source, /effectType="injury"/);
  assert.match(source, /effectType="distress"/);
  assert.match(source, /SpaceshipActorEffectSurface/);
  assert.match(source, /SpaceshipActorCardSurface/);
});
