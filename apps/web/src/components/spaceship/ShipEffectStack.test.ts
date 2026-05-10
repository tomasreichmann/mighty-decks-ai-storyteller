import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ShipEffectStack exposes single EffectCard surfaces for board placement", () => {
  const source = readFileSync(new URL("./ShipEffectStack.tsx", import.meta.url), "utf8");

  assert.match(source, /resolveGameCard/);
  assert.match(source, /GameCardView/);
  assert.match(source, /EffectCard/);
  assert.match(source, /ShipEffectCardSurface/);
  assert.match(source, /bottom-full/);
  assert.doesNotMatch(source, /effectStackPeekViewportHeightRem/);
  assert.doesNotMatch(source, /!w-\[6\.5rem\] !max-w-\[6\.5rem\]/);
  assert.match(source, /flex flex-wrap items-start justify-center gap-2/);
});
